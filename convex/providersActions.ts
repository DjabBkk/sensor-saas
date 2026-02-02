"use node";

import { action, internalAction } from "./_generated/server";
import { v } from "convex/values";

import { providerValidator } from "./lib/validators";
import { internal } from "./_generated/api";
import { getAccessToken, listDevices } from "./providers/qingping/client";
import { mapQingpingDevice, mapQingpingReading } from "./providers/qingping/mappers";

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

export const pollAllReadings = internalAction({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    const configs = await ctx.runQuery(internal.providers.listAllConfigs, {});

    for (const config of configs) {
      if (config.provider !== "qingping") {
        continue;
      }

      const devices = await listDevices(config.accessToken);
      for (const device of devices) {
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

        await ctx.runMutation(internal.readings.ingest, {
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
      }
    }

    return null;
  },
});
