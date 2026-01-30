"use node";

import { internalAction } from "./_generated/server";
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

    const devices = await listDevices(config.accessToken);

    for (const device of devices) {
      const normalized = mapQingpingDevice(device);
      await ctx.runMutation(internal.devices.upsertFromProvider, {
        userId: args.userId,
        provider: args.provider,
        providerDeviceId: normalized.providerDeviceId,
        name: normalized.name,
        model: normalized.model,
        timezone: normalized.timezone,
      });

      const reading = mapQingpingReading(device.data);
      if (reading) {
        const deviceInfo = await ctx.runQuery(
          internal.devices.getByProviderDeviceId,
          {
            provider: args.provider,
            providerDeviceId: normalized.providerDeviceId,
          },
        );

        if (deviceInfo) {
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
    }

    if (config._id) {
      await ctx.runMutation(internal.providers.updateLastSync, {
        providerConfigId: config._id,
      });
    }

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
