import { query } from "./_generated/server";
import { v } from "convex/values";
import { providerValidator } from "./lib/validators";

const deviceShape = v.object({
  _id: v.id("devices"),
  _creationTime: v.number(),
  userId: v.id("users"),
  roomId: v.optional(v.id("rooms")),
  provider: providerValidator,
  providerDeviceId: v.string(),
  name: v.string(),
  model: v.optional(v.string()),
  timezone: v.optional(v.string()),
  lastReadingAt: v.optional(v.number()),
  lastBattery: v.optional(v.number()),
  providerOffline: v.optional(v.boolean()),
  createdAt: v.number(),
});

const readingShape = v.object({
  _id: v.id("readings"),
  _creationTime: v.number(),
  deviceId: v.id("devices"),
  ts: v.number(),
  pm25: v.optional(v.number()),
  pm10: v.optional(v.number()),
  co2: v.optional(v.number()),
  tempC: v.optional(v.number()),
  rh: v.optional(v.number()),
  voc: v.optional(v.number()),
  pressure: v.optional(v.number()),
  battery: v.optional(v.number()),
  aqi: v.optional(v.number()),
});

export const getEmbedDevice = query({
  args: {
    token: v.string(),
    refreshKey: v.optional(v.number()),
  },
  returns: v.union(
    v.null(),
    v.object({
      device: deviceShape,
      latestReading: v.union(v.null(), readingShape),
      history: v.array(readingShape),
    }),
  ),
  handler: async (ctx, args) => {
    const embedToken = await ctx.db
      .query("embedTokens")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .first();

    if (!embedToken || embedToken.isRevoked) {
      return null;
    }

    const device = await ctx.db.get(embedToken.deviceId);
    if (!device) {
      return null;
    }

    const latestReading = await ctx.db
      .query("readings")
      .withIndex("by_deviceId_and_ts", (q) =>
        q.eq("deviceId", device._id),
      )
      .order("desc")
      .first();

    const history = await ctx.db
      .query("readings")
      .withIndex("by_deviceId_and_ts", (q) =>
        q.eq("deviceId", device._id),
      )
      .order("desc")
      .take(96);

    return {
      device,
      latestReading: latestReading ?? null,
      history,
    };
  },
});

export const getKioskConfig = query({
  args: {
    token: v.string(),
    refreshKey: v.optional(v.number()),
  },
  returns: v.union(
    v.null(),
    v.object({
      label: v.optional(v.string()),
      title: v.optional(v.string()),
      mode: v.union(v.literal("single"), v.literal("multi")),
      theme: v.union(v.literal("dark"), v.literal("light")),
      refreshInterval: v.number(),
      visibleMetrics: v.optional(v.array(v.string())),
      devices: v.array(
        v.object({
          device: deviceShape,
          latestReading: v.union(v.null(), readingShape),
        }),
      ),
    }),
  ),
  handler: async (ctx, args) => {
    const kiosk = await ctx.db
      .query("kioskConfigs")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .first();

    if (!kiosk || kiosk.isRevoked) {
      return null;
    }

    const devicesWithReadings: Array<{
      device: any;
      latestReading: any | null;
    }> = [];

    for (const deviceId of kiosk.deviceIds) {
      const device = await ctx.db.get(deviceId);
      if (!device) {
        continue;
      }

      const latestReading = await ctx.db
        .query("readings")
        .withIndex("by_deviceId_and_ts", (q) =>
          q.eq("deviceId", device._id),
        )
        .order("desc")
        .first();

      devicesWithReadings.push({
        device,
        latestReading: latestReading ?? null,
      });
    }

    return {
      label: kiosk.label,
      title: kiosk.title,
      mode: kiosk.mode,
      theme: kiosk.theme,
      refreshInterval: kiosk.refreshInterval,
      visibleMetrics: kiosk.visibleMetrics,
      devices: devicesWithReadings,
    };
  },
});
