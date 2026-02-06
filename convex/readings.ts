import { internalMutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getPlanLimits, type Plan } from "./lib/planLimits";

const readingShape = v.object({
  _id: v.id("readings"),
  _creationTime: v.number(),
  deviceId: v.id("devices"),
  deviceName: v.optional(v.string()),
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

const bucketTimestampMs = (ts: number, bucketMs: number) =>
  Math.floor(ts / bucketMs) * bucketMs;

const createAccumulator = () => ({
  count: 0,
  pm25Sum: 0,
  pm25Count: 0,
  pm10Sum: 0,
  pm10Count: 0,
  co2Sum: 0,
  co2Count: 0,
  tempCSum: 0,
  tempCCount: 0,
  rhSum: 0,
  rhCount: 0,
  vocSum: 0,
  vocCount: 0,
  pressureSum: 0,
  pressureCount: 0,
  batterySum: 0,
  batteryCount: 0,
  aqiSum: 0,
  aqiCount: 0,
});

const avgOrNull = (sum: number, count: number) =>
  count > 0 ? sum / count : null;

/**
 * Compute the earliest allowed startTs based on a device owner's plan retention.
 * Returns 0 if the plan has unlimited retention or the device/user can't be found.
 */
async function clampStartTsForRetention(
  ctx: { db: { get: (id: any) => Promise<any> } },
  deviceId: any,
  startTs: number,
): Promise<number> {
  const device = await ctx.db.get(deviceId);
  if (!device) return startTs;
  const user = await ctx.db.get(device.userId);
  if (!user) return startTs;
  const limits = getPlanLimits(user.plan as Plan);
  if (limits.maxHistoryDays === Infinity) return startTs;
  const retentionMs = limits.maxHistoryDays * 24 * 60 * 60 * 1000;
  return Math.max(startTs, Date.now() - retentionMs);
}

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

    // Clamp startTs to the device owner's plan retention window
    const clampedStart = await clampStartTsForRetention(ctx, args.deviceId, startTs);

    return await ctx.db
      .query("readings")
      .withIndex("by_deviceId_and_ts", (q) =>
        q.eq("deviceId", args.deviceId).gte("ts", clampedStart).lte("ts", endTs),
      )
      .order("desc")
      .take(limit);
  },
});

/**
 * Fetch readings for CSV export.
 * - Verifies device belongs to the requesting user.
 * - Clamps startTs to the user's plan retention window.
 * - Returns readings in ascending (chronological) order, capped at 10 000.
 */
export const forExport = query({
  args: {
    userId: v.id("users"),
    deviceId: v.id("devices"),
    startTs: v.number(),
    endTs: v.number(),
  },
  returns: v.object({
    readings: v.array(readingShape),
    clampedStart: v.number(),
    wasClamped: v.boolean(),
    hitLimit: v.boolean(),
  }),
  handler: async (ctx, args) => {
    // 1. Verify device belongs to user
    const device = await ctx.db.get(args.deviceId);
    if (!device || device.userId !== args.userId) {
      throw new Error("Device not found");
    }

    // 2. Look up user plan and clamp startTs to retention window
    const user = await ctx.db.get(args.userId);
    if (!user) throw new Error("User not found");

    const limits = getPlanLimits(user.plan as Plan);
    const retentionMs =
      limits.maxHistoryDays === Infinity
        ? Infinity
        : limits.maxHistoryDays * 24 * 60 * 60 * 1000;
    const minAllowedStart =
      retentionMs === Infinity ? 0 : Date.now() - retentionMs;
    const clampedStart = Math.max(args.startTs, minAllowedStart);
    const wasClamped = clampedStart > args.startTs;

    // 3. Fetch readings in chronological order (safety cap 10 000)
    const EXPORT_LIMIT = 10_000;
    const readings = await ctx.db
      .query("readings")
      .withIndex("by_deviceId_and_ts", (q) =>
        q
          .eq("deviceId", args.deviceId)
          .gte("ts", clampedStart)
          .lte("ts", args.endTs),
      )
      .order("asc")
      .take(EXPORT_LIMIT);

    return {
      readings,
      clampedStart,
      wasClamped,
      hitLimit: readings.length >= EXPORT_LIMIT,
    };
  },
});

export const historyAggregated = query({
  args: {
    deviceId: v.id("devices"),
    startTs: v.number(),
    endTs: v.number(),
    bucketMinutes: v.number(),
  },
  returns: v.array(
    v.object({
      ts: v.number(),
      pm25: v.union(v.number(), v.null()),
      pm10: v.union(v.number(), v.null()),
      co2: v.union(v.number(), v.null()),
      tempC: v.union(v.number(), v.null()),
      rh: v.union(v.number(), v.null()),
      voc: v.union(v.number(), v.null()),
      pressure: v.union(v.number(), v.null()),
      battery: v.union(v.number(), v.null()),
      aqi: v.union(v.number(), v.null()),
      count: v.number(),
    }),
  ),
  handler: async (ctx, args) => {
    if (args.bucketMinutes <= 0) {
      throw new Error("bucketMinutes must be greater than 0");
    }
    if (args.endTs <= args.startTs) {
      throw new Error("endTs must be greater than startTs");
    }

    // Clamp startTs to the device owner's plan retention window
    const clampedStart = await clampStartTsForRetention(ctx, args.deviceId, args.startTs);

    const bucketMs = args.bucketMinutes * 60 * 1000;
    const readings = await ctx.db
      .query("readings")
      .withIndex("by_deviceId_and_ts", (q) =>
        q.eq("deviceId", args.deviceId).gte("ts", clampedStart).lte("ts", args.endTs),
      )
      .order("asc")
      .collect();

    const buckets = new Map<number, ReturnType<typeof createAccumulator>>();

    for (const reading of readings) {
      const bucketTs = bucketTimestampMs(reading.ts, bucketMs);
      const acc = buckets.get(bucketTs) ?? createAccumulator();
      acc.count += 1;

      if (reading.pm25 !== undefined) {
        acc.pm25Sum += reading.pm25;
        acc.pm25Count += 1;
      }
      if (reading.pm10 !== undefined) {
        acc.pm10Sum += reading.pm10;
        acc.pm10Count += 1;
      }
      if (reading.co2 !== undefined) {
        acc.co2Sum += reading.co2;
        acc.co2Count += 1;
      }
      if (reading.tempC !== undefined) {
        acc.tempCSum += reading.tempC;
        acc.tempCCount += 1;
      }
      if (reading.rh !== undefined) {
        acc.rhSum += reading.rh;
        acc.rhCount += 1;
      }
      if (reading.voc !== undefined) {
        acc.vocSum += reading.voc;
        acc.vocCount += 1;
      }
      if (reading.pressure !== undefined) {
        acc.pressureSum += reading.pressure;
        acc.pressureCount += 1;
      }
      if (reading.battery !== undefined) {
        acc.batterySum += reading.battery;
        acc.batteryCount += 1;
      }
      if (reading.aqi !== undefined) {
        acc.aqiSum += reading.aqi;
        acc.aqiCount += 1;
      }

      buckets.set(bucketTs, acc);
    }

    return Array.from(buckets.entries())
      .sort(([a], [b]) => a - b)
      .map(([bucketTs, acc]) => ({
        ts: bucketTs,
        pm25: avgOrNull(acc.pm25Sum, acc.pm25Count),
        pm10: avgOrNull(acc.pm10Sum, acc.pm10Count),
        co2: avgOrNull(acc.co2Sum, acc.co2Count),
        tempC: avgOrNull(acc.tempCSum, acc.tempCCount),
        rh: avgOrNull(acc.rhSum, acc.rhCount),
        voc: avgOrNull(acc.vocSum, acc.vocCount),
        pressure: avgOrNull(acc.pressureSum, acc.pressureCount),
        battery: avgOrNull(acc.batterySum, acc.batteryCount),
        aqi: avgOrNull(acc.aqiSum, acc.aqiCount),
        count: acc.count,
      }));
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
  returns: v.id("readings"),
  handler: async (ctx, args) => {
    const normalizedTs = normalizeTimestampMs(args.ts);
    
    // Fetch device to get its name
    const device = await ctx.db.get(args.deviceId);
    if (!device) {
      console.warn("[INGEST] Device not found:", args.deviceId);
      throw new Error("Device not found");
    }

    const readingId = await ctx.db.insert("readings", {
      deviceId: args.deviceId,
      deviceName: device.name,
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

    await ctx.db.patch(args.deviceId, devicePatch);

    return readingId;
  },
});
