import { internalMutation, query } from "./_generated/server";
import { v } from "convex/values";

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

const normalizeTimestampMs = (ts: number) => (ts < 1e12 ? ts * 1000 : ts);

export const latest = query({
  args: {
    deviceId: v.id("devices"),
  },
  returns: v.union(v.null(), readingShape),
  handler: async (ctx, args) => {
    const reading = await ctx.db
      .query("readings")
      .withIndex("by_deviceId_and_ts", (q) => q.eq("deviceId", args.deviceId))
      .order("desc")
      .first();
    return reading ?? null;
  },
});

export const history = query({
  args: {
    deviceId: v.id("devices"),
    startTs: v.optional(v.number()),
    endTs: v.optional(v.number()),
    limit: v.optional(v.number()),
  },
  returns: v.array(readingShape),
  handler: async (ctx, args) => {
    const startTs = args.startTs ?? 0;
    const endTs = args.endTs ?? Date.now();
    const limit = args.limit ?? 500;

    return await ctx.db
      .query("readings")
      .withIndex("by_deviceId_and_ts", (q) =>
        q.eq("deviceId", args.deviceId).gte("ts", startTs).lte("ts", endTs),
      )
      .order("desc")
      .take(limit);
  },
});

export const ingest = internalMutation({
  args: {
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
  },
  returns: v.union(v.id("readings"), v.null()),
  handler: async (ctx, args) => {
    const normalizedTs = normalizeTimestampMs(args.ts);
    const device = await ctx.db.get(args.deviceId);
    if (!device) {
      console.warn("[INGEST] Device not found:", args.deviceId);
      return null;
    }

    if (device.awaitingPostChangeReading) {
      if (!device.intervalChangeAt || normalizedTs < device.intervalChangeAt) {
        return null;
      }

      await ctx.db.patch(args.deviceId, {
        awaitingPostChangeReading: false,
      });
    } else if (device.lastReadingAt && normalizedTs < device.createdAt) {
      return null;
    }

    const readingId = await ctx.db.insert("readings", {
      deviceId: args.deviceId,
      ts: normalizedTs,
      pm25: args.pm25,
      pm10: args.pm10,
      co2: args.co2,
      tempC: args.tempC,
      rh: args.rh,
      voc: args.voc,
      pressure: args.pressure,
      battery: args.battery,
      aqi: args.aqi,
    });

    const devicePatch: {
      lastReadingAt: number;
      lastBattery?: number;
    } = {
      lastReadingAt: normalizedTs,
    };

    if (args.battery !== undefined) {
      devicePatch.lastBattery = args.battery;
    }

    if (!device.lastReadingAt || normalizedTs > device.lastReadingAt) {
      await ctx.db.patch(args.deviceId, devicePatch);
    }

    return readingId;
  },
});
