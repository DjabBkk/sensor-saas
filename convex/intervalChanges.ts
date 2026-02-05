import { internalMutation, query } from "./_generated/server";
import { v } from "convex/values";

export const record = internalMutation({
  args: {
    deviceId: v.id("devices"),
    previousInterval: v.number(),
    newInterval: v.number(),
  },
  returns: v.id("intervalChanges"),
  handler: async (ctx, args) => {
    return await ctx.db.insert("intervalChanges", {
      deviceId: args.deviceId,
      previousInterval: args.previousInterval,
      newInterval: args.newInterval,
      changedAt: Date.now(),
    });
  },
});

export const listForDevice = query({
  args: {
    deviceId: v.id("devices"),
    startTs: v.optional(v.number()),
    endTs: v.optional(v.number()),
  },
  returns: v.array(
    v.object({
      _id: v.id("intervalChanges"),
      _creationTime: v.number(),
      deviceId: v.id("devices"),
      previousInterval: v.number(),
      newInterval: v.number(),
      changedAt: v.number(),
    }),
  ),
  handler: async (ctx, args) => {
    const startTs = args.startTs ?? 0;
    const endTs = args.endTs ?? Date.now();

    return await ctx.db
      .query("intervalChanges")
      .withIndex("by_deviceId", (q) => q.eq("deviceId", args.deviceId))
      .filter((q) =>
        q.and(q.gte(q.field("changedAt"), startTs), q.lte(q.field("changedAt"), endTs)),
      )
      .order("desc")
      .collect();
  },
});
