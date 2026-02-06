import { internalMutation } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";
import { getPlanLimits, type Plan } from "./lib/planLimits";

/**
 * Maximum number of readings to delete in a single mutation call.
 * Keeps each mutation well within Convex execution limits.
 */
const BATCH_SIZE = 500;

/**
 * Entry point for the daily retention cleanup cron.
 * Iterates over all organizations, computes their retention cutoff based on plan,
 * and schedules per-device cleanup mutations.
 */
export const cleanupExpiredReadings = internalMutation({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    const orgs = await ctx.db.query("organizations").collect();
    const now = Date.now();

    for (const org of orgs) {
      const limits = getPlanLimits(org.plan as Plan);

      // Skip orgs with unlimited retention
      if (limits.maxHistoryDays === Infinity) continue;

      const cutoffTs = now - limits.maxHistoryDays * 24 * 60 * 60 * 1000;

      const devices = await ctx.db
        .query("devices")
        .withIndex("by_organizationId", (q) => q.eq("organizationId", org._id))
        .collect();

      for (const device of devices) {
        // Fan out per-device cleanup to stay within mutation limits
        await ctx.scheduler.runAfter(0, internal.cleanup.cleanupDeviceReadings, {
          deviceId: device._id,
          cutoffTs,
        });
      }
    }

    // Also handle devices without an organizationId (pre-migration data)
    const users = await ctx.db.query("users").collect();
    for (const user of users) {
      const plan = (user.plan ?? "starter") as Plan;
      const limits = getPlanLimits(plan);
      if (limits.maxHistoryDays === Infinity) continue;

      const cutoffTs = now - limits.maxHistoryDays * 24 * 60 * 60 * 1000;

      const devices = await ctx.db
        .query("devices")
        .withIndex("by_userId", (q) => q.eq("userId", user._id))
        .collect();

      for (const device of devices) {
        // Skip devices already handled by org cleanup
        if (device.organizationId) continue;

        await ctx.scheduler.runAfter(0, internal.cleanup.cleanupDeviceReadings, {
          deviceId: device._id,
          cutoffTs,
        });
      }
    }

    return null;
  },
});

/**
 * Delete expired readings for a single device in batches.
 * Deletes up to BATCH_SIZE readings older than cutoffTs, then schedules
 * a continuation if more remain.
 */
export const cleanupDeviceReadings = internalMutation({
  args: {
    deviceId: v.id("devices"),
    cutoffTs: v.number(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const expired = await ctx.db
      .query("readings")
      .withIndex("by_deviceId_and_ts", (q) =>
        q.eq("deviceId", args.deviceId).lt("ts", args.cutoffTs),
      )
      .order("asc")
      .take(BATCH_SIZE);

    for (const reading of expired) {
      await ctx.db.delete(reading._id);
    }

    // If we hit the batch limit, there may be more — schedule continuation
    if (expired.length >= BATCH_SIZE) {
      await ctx.scheduler.runAfter(0, internal.cleanup.cleanupDeviceReadings, {
        deviceId: args.deviceId,
        cutoffTs: args.cutoffTs,
      });
    }

    return null;
  },
});
