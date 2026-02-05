"use node";

import { action, internalAction } from "./_generated/server";
import { v } from "convex/values";

import { providerValidator } from "./lib/validators";
import { internal } from "./_generated/api";
import { getAccessToken, listDevices, updateDeviceSettings } from "./providers/qingping/client";
import { mapQingpingDevice, mapQingpingReading } from "./providers/qingping/mappers";

const normalizeTimestampMs = (ts: number) => (ts < 1e12 ? ts * 1000 : ts);

export const fetchAccessToken = internalAction({
  args: {
    appKey: v.string(),
    appSecret: v.string(),
  },
  returns: v.object({
    accessToken: v.string(),
    tokenExpiresAt: v.number(),
  }),
  handler: async (ctx, args) => {
    return await getAccessToken(args.appKey, args.appSecret);
  },
});

export const connectAndSync = internalAction({
  args: {
    userId: v.id("users"),
    provider: providerValidator,
    appKey: v.string(),
    appSecret: v.string(),
    webhookSecret: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    if (args.provider !== "qingping") {
      throw new Error("Only Qingping is supported for now.");
    }

    // Get access token
    const tokenResult = await getAccessToken(args.appKey, args.appSecret);

    // Get existing config
    const existing = await ctx.runQuery(internal.providers.getConfig, {
      userId: args.userId,
      provider: args.provider,
    });

    // Update or insert config
    if (existing) {
      await ctx.runMutation(internal.providers.updateConfig, {
        configId: existing._id,
        accessToken: tokenResult.accessToken,
        tokenExpiresAt: tokenResult.tokenExpiresAt,
        appKey: args.appKey,
        appSecret: args.appSecret,
        webhookSecret: args.webhookSecret,
      });
    } else {
      await ctx.runMutation(internal.providers.insertConfig, {
        userId: args.userId,
        provider: args.provider,
        accessToken: tokenResult.accessToken,
        tokenExpiresAt: tokenResult.tokenExpiresAt,
        appKey: args.appKey,
        appSecret: args.appSecret,
        webhookSecret: args.webhookSecret,
      });
    }

    // Sync devices
    await ctx.runAction(internal.providersActions.syncDevicesForUser, {
      userId: args.userId,
      provider: args.provider,
    });

    return null;
  },
});

export const syncDevicesForUser = internalAction({
  args: {
    userId: v.id("users"),
    provider: providerValidator,
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    if (args.provider !== "qingping") {
      return null;
    }

    const config = await ctx.runQuery(internal.providers.getConfig, {
      userId: args.userId,
      provider: args.provider,
    });

    if (!config?.accessToken) {
      return null;
    }

    // Check if token is expired or about to expire (within 5 minutes)
    const now = Date.now();
    let accessToken = config.accessToken;
    if (!config.tokenExpiresAt || config.tokenExpiresAt <= now + 5 * 60 * 1000) {
      // Token expired or expiring soon, refresh it
      if (!config.appKey || !config.appSecret) {
        throw new Error("Token expired and no credentials available to refresh");
      }
      
      if (!config._id) {
        throw new Error("Provider config missing ID, cannot update token");
      }
      
      console.log("[syncDevicesForUser] Token expired, refreshing...");
      const tokenResult = await getAccessToken(config.appKey, config.appSecret);
      accessToken = tokenResult.accessToken;
      
      // Update the token in the database
      await ctx.runMutation(internal.providers.updateToken, {
        providerConfigId: config._id,
        accessToken: tokenResult.accessToken,
        tokenExpiresAt: tokenResult.tokenExpiresAt,
      });
    }

    let devices;
    try {
      devices = await listDevices(accessToken);
    } catch (error: any) {
      // If we get a 401, try refreshing the token once more
      if (error?.message?.includes("401") && config.appKey && config.appSecret && config._id) {
        console.log("[syncDevicesForUser] Got 401, refreshing token and retrying...");
        const tokenResult = await getAccessToken(config.appKey, config.appSecret);
        accessToken = tokenResult.accessToken;
        
        await ctx.runMutation(internal.providers.updateToken, {
          providerConfigId: config._id,
          accessToken: tokenResult.accessToken,
          tokenExpiresAt: tokenResult.tokenExpiresAt,
        });
        
        // Retry once
        devices = await listDevices(accessToken);
      } else {
        throw error;
      }
    }
    console.log(
      "[syncDevicesForUser] fetched devices",
      devices.length,
      "at",
      new Date().toISOString()
    );

    for (const device of devices) {
      const normalized = mapQingpingDevice(device);
      const isDeleted: boolean = await ctx.runQuery(
        internal.devices.isDeletedForUser,
        {
          userId: args.userId,
          provider: args.provider,
          providerDeviceId: normalized.providerDeviceId,
        },
      );
      if (isDeleted) {
        continue;
      }

      await ctx.runMutation(internal.devices.upsertFromProvider, {
        userId: args.userId,
        provider: args.provider,
        providerDeviceId: normalized.providerDeviceId,
        name: normalized.name,
        model: normalized.model,
        timezone: normalized.timezone,
        providerOffline: device.status?.offline ?? false,
      });

      const reading = mapQingpingReading(device.data);
      if (reading) {
        console.log(
          "[syncDevicesForUser] device",
          normalized.providerDeviceId,
          "reading.ts",
          reading.ts,
          "timestamp age:",
          Date.now() - reading.ts,
          "ms ago"
        );
      }
      if (reading) {
        const deviceInfo = await ctx.runQuery(
          internal.devices.getByProviderDeviceId,
          {
            provider: args.provider,
            providerDeviceId: normalized.providerDeviceId,
          },
        );

        if (deviceInfo) {
          const readingId = await ctx.runMutation(internal.readings.ingest, {
            deviceId: deviceInfo._id,
            ts: reading.ts,
            pm25: reading.pm25,
            pm10: reading.pm10,
            co2: reading.co2,
            tempC: reading.tempC,
            rh: reading.rh,
            voc: reading.voc,
            pressure: reading.pressure,
            battery: reading.battery,
          });
          console.log(
            "[syncDevicesForUser] ingested reading",
            readingId,
            "for device",
            deviceInfo._id,
            "pm25:",
            reading.pm25,
            "co2:",
            reading.co2
          );
        } else {
          console.warn(
            "[syncDevicesForUser] device not found in DB:",
            normalized.providerDeviceId
          );
        }
      } else {
        console.log(
          "[syncDevicesForUser] no reading data for device:",
          normalized.providerDeviceId
        );
      }
    }

    if (config._id) {
      await ctx.runMutation(internal.providers.updateLastSync, {
        providerConfigId: config._id,
      });
    }

    return null;
  },
});

export const syncDevicesForUserPublic = action({
  args: {
    userId: v.id("users"),
    provider: providerValidator,
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    if (args.provider !== "qingping") {
      throw new Error("Only Qingping is supported for now.");
    }

    await ctx.runAction(internal.providersActions.syncDevicesForUser, {
      userId: args.userId,
      provider: args.provider,
    });

    return null;
  },
});

export const refreshExpiringTokens = internalAction({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    const now = Date.now();
    const configs = await ctx.runQuery(internal.providers.listAllConfigs, {});

    for (const config of configs) {
      if (!config.appKey || !config.appSecret) {
        continue;
      }

      if (config.tokenExpiresAt > now + 10 * 60 * 1000) {
        continue;
      }

      const token = await getAccessToken(config.appKey, config.appSecret);
      await ctx.runMutation(internal.providers.updateToken, {
        providerConfigId: config._id,
        accessToken: token.accessToken,
        tokenExpiresAt: token.tokenExpiresAt,
      });
    }

    return null;
  },
});

/**
 * Update device report interval (how often the device sends data).
 * Minimum is 60 seconds (1 minute), maximum is 3600 seconds (1 hour).
 * Common values: 60 (1 min), 300 (5 min), 600 (10 min), 1800 (30 min), 3600 (1 hour)
 */
export const updateDeviceReportInterval = action({
  args: {
    userId: v.id("users"),
    deviceId: v.id("devices"),
    reportIntervalSeconds: v.number(),
  },
  returns: v.object({
    success: v.boolean(),
    message: v.string(),
  }),
  handler: async (ctx, args) => {
    // Validate report interval (minimum 60 seconds as per Qingping docs)
    if (args.reportIntervalSeconds < 60) {
      return {
        success: false,
        message: "Report interval must be at least 60 seconds (1 minute)",
      };
    }

    if (args.reportIntervalSeconds > 3600) {
      return {
        success: false,
        message: "Report interval cannot exceed 3600 seconds (1 hour)",
      };
    }

    // Get device info
    const device = await ctx.runQuery(internal.devices.getInternal, {
      deviceId: args.deviceId,
    });

    if (!device) {
      return {
        success: false,
        message: "Device not found",
      };
    }

    if (device.userId !== args.userId) {
      return {
        success: false,
        message: "Device does not belong to this user",
      };
    }

    if (device.provider !== "qingping") {
      return {
        success: false,
        message: "Report interval can only be changed for Qingping devices",
      };
    }

    // Get provider config for access token
    const config = await ctx.runQuery(internal.providers.getConfig, {
      userId: args.userId,
      provider: "qingping",
    });

    if (!config?.accessToken) {
      return {
        success: false,
        message: "No Qingping credentials found. Please connect your Qingping account first.",
      };
    }

    // Check if token needs refresh
    let accessToken = config.accessToken;
    const now = Date.now();
    if (!config.tokenExpiresAt || config.tokenExpiresAt <= now + 5 * 60 * 1000) {
      if (!config.appKey || !config.appSecret || !config._id) {
        return {
          success: false,
          message: "Token expired and cannot be refreshed",
        };
      }
      
      const tokenResult = await getAccessToken(config.appKey, config.appSecret);
      accessToken = tokenResult.accessToken;
      
      await ctx.runMutation(internal.providers.updateToken, {
        providerConfigId: config._id,
        accessToken: tokenResult.accessToken,
        tokenExpiresAt: tokenResult.tokenExpiresAt,
      });
    }

    // Call Qingping API to update device settings
    // collect_interval should be <= report_interval
    const collectInterval = Math.min(60, args.reportIntervalSeconds);
    
    try {
      await updateDeviceSettings(accessToken, {
        mac: [device.providerDeviceId],
        report_interval: args.reportIntervalSeconds,
        collect_interval: collectInterval,
        timestamp: Date.now(),
      });

      if (device.reportInterval !== args.reportIntervalSeconds) {
        await ctx.runMutation(internal.intervalChanges.record, {
          deviceId: args.deviceId,
          previousInterval: device.reportInterval ?? 60,
          newInterval: args.reportIntervalSeconds,
        });
      }

      // Update device record with the new interval
      await ctx.runMutation(internal.devices.updateReportInterval, {
        deviceId: args.deviceId,
        reportInterval: args.reportIntervalSeconds,
      });

      const minutes = Math.round(args.reportIntervalSeconds / 60);
      console.log(
        `[UPDATE INTERVAL] Updated report interval for device ${device.providerDeviceId} to ${args.reportIntervalSeconds}s (${minutes} min)`
      );

      return {
        success: true,
        message: `Report interval updated to ${minutes} minute${minutes === 1 ? "" : "s"}`,
      };
    } catch (error) {
      console.error("[UPDATE INTERVAL] Failed to update device settings:", error);
      return {
        success: false,
        message: error instanceof Error ? error.message : "Failed to update device settings",
      };
    }
  },
});

export const pollAllReadings = internalAction({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    const startTime = Date.now();
    console.log("[POLLING] Starting polling cycle at", new Date().toISOString());
    
    const configs = await ctx.runQuery(internal.providers.listAllConfigs, {});
    const qingpingConfigs = configs.filter(c => c.provider === "qingping");
    
    console.log(`[POLLING] Found ${qingpingConfigs.length} Qingping configurations to poll`);

    let totalDevicesProcessed = 0;
    let totalReadingsProcessed = 0;
    let errors = 0;

    for (const config of qingpingConfigs) {
      if (config.provider !== "qingping") {
        continue;
      }

      // Check if token is expired or about to expire (within 5 minutes)
      const now = Date.now();
      let accessToken = config.accessToken;
      
      if (!config.tokenExpiresAt || config.tokenExpiresAt <= now + 5 * 60 * 1000) {
        // Token expired or expiring soon, refresh it
        if (!config.appKey || !config.appSecret) {
          console.warn("[POLLING] Token expired and no credentials available to refresh for user:", config.userId);
          errors++;
          continue;
        }
        
        console.log("[POLLING] Token expired, refreshing for user:", config.userId);
        const tokenResult = await getAccessToken(config.appKey, config.appSecret);
        accessToken = tokenResult.accessToken;
        
        // Update the token in the database
        await ctx.runMutation(internal.providers.updateToken, {
          providerConfigId: config._id,
          accessToken: tokenResult.accessToken,
          tokenExpiresAt: tokenResult.tokenExpiresAt,
        });
      }

      let devices;
      try {
        devices = await listDevices(accessToken);
        console.log(`[POLLING] Fetched ${devices.length} devices for user: ${config.userId}`);
      } catch (error: any) {
        // If we get a 401, try refreshing the token once more
        if (error?.message?.includes("401") && config.appKey && config.appSecret) {
          console.log("[POLLING] Got 401, refreshing token and retrying for user:", config.userId);
          const tokenResult = await getAccessToken(config.appKey, config.appSecret);
          accessToken = tokenResult.accessToken;
          
          await ctx.runMutation(internal.providers.updateToken, {
            providerConfigId: config._id,
            accessToken: tokenResult.accessToken,
            tokenExpiresAt: tokenResult.tokenExpiresAt,
          });
          
          // Retry once
          try {
            devices = await listDevices(accessToken);
            console.log(`[POLLING] Retry successful, fetched ${devices.length} devices for user: ${config.userId}`);
          } catch (retryError) {
            console.error("[POLLING] Failed after token refresh for user:", config.userId, retryError);
            errors++;
            continue;
          }
        } else {
          console.error("[POLLING] API error for user:", config.userId, error);
          errors++;
          continue;
        }
      }

      for (const device of devices) {
        const isDeleted: boolean = await ctx.runQuery(
          internal.devices.isDeletedForUser,
          {
            userId: config.userId,
            provider: config.provider,
            providerDeviceId: device.info.mac,
          },
        );
        if (isDeleted) {
          continue;
        }

        const reading = mapQingpingReading(device.data);
        if (!reading) {
          continue;
        }

        await ctx.runMutation(internal.devices.upsertFromProvider, {
          userId: config.userId,
          provider: config.provider,
          providerDeviceId: device.info.mac,
          name: device.info.name,
          model: device.product?.en_name ?? device.product?.name,
          timezone: undefined,
          providerOffline: device.status?.offline ?? false,
        });

        const deviceInfo = await ctx.runQuery(
          internal.devices.getByProviderDeviceId,
          {
            provider: config.provider,
            providerDeviceId: device.info.mac,
          },
        );

        if (!deviceInfo) {
          continue;
        }

        const deviceRecord = await ctx.runQuery(internal.devices.getInternal, {
          deviceId: deviceInfo._id,
        });
        const reportIntervalSeconds = deviceRecord?.reportInterval ?? 3600;
        const reportIntervalMs = reportIntervalSeconds * 1000;
        const lastReadingAt = deviceRecord?.lastReadingAt ?? 0;
        const readingTs = normalizeTimestampMs(reading.ts);

        if (readingTs - lastReadingAt < reportIntervalMs * 0.9) {
          continue;
        }

        await ctx.runMutation(internal.readings.ingest, {
          deviceId: deviceInfo._id,
          ts: readingTs,
          pm25: reading.pm25,
          pm10: reading.pm10,
          co2: reading.co2,
          tempC: reading.tempC,
          rh: reading.rh,
          voc: reading.voc,
          pressure: reading.pressure,
          battery: reading.battery,
        });
        
        totalDevicesProcessed++;
        totalReadingsProcessed++;
      }

      // Update last sync time
      await ctx.runMutation(internal.providers.updateLastSync, {
        providerConfigId: config._id,
      });
    }

    const duration = Date.now() - startTime;
    console.log(`[POLLING] Completed polling cycle in ${duration}ms - Processed ${totalReadingsProcessed} readings from ${totalDevicesProcessed} devices, ${errors} errors`);

    return null;
  },
});
