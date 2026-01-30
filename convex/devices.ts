import { internalMutation, internalQuery, query, mutation } from "./_generated/server";
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
  createdAt: v.number(),
});

export const list = query({
  args: {
    userId: v.id("users"),
  },
  returns: v.array(deviceShape),
  handler: async (ctx, args) => {
    return await ctx.db
      .query("devices")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .order("desc")
      .collect();
  },
});

export const get = query({
  args: {
    deviceId: v.id("devices"),
  },
  returns: v.union(v.null(), deviceShape),
  handler: async (ctx, args) => {
    const device = await ctx.db.get(args.deviceId);
    return device ?? null;
  },
});

export const updateRoom = mutation({
  args: {
    deviceId: v.id("devices"),
    roomId: v.optional(v.id("rooms")),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    if (args.roomId !== undefined) {
      await ctx.db.patch(args.deviceId, { roomId: args.roomId });
    }
    return null;
  },
});

export const rename = mutation({
  args: {
    deviceId: v.id("devices"),
    name: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.patch(args.deviceId, { name: args.name });
    return null;
  },
});

export const getByProviderDeviceId = internalQuery({
  args: {
    provider: providerValidator,
    providerDeviceId: v.string(),
  },
  returns: v.union(
    v.null(),
    v.object({
      _id: v.id("devices"),
      userId: v.id("users"),
    }),
  ),
  handler: async (ctx, args) => {
    const device = await ctx.db
      .query("devices")
      .withIndex("by_provider_and_providerDeviceId", (q) =>
        q.eq("provider", args.provider).eq("providerDeviceId", args.providerDeviceId),
      )
      .unique();

    if (!device) {
      return null;
    }

    return { _id: device._id, userId: device.userId };
  },
});

export const upsertFromProvider = internalMutation({
  args: {
    userId: v.id("users"),
    provider: providerValidator,
    providerDeviceId: v.string(),
    name: v.string(),
    model: v.optional(v.string()),
    timezone: v.optional(v.string()),
  },
  returns: v.id("devices"),
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("devices")
      .withIndex("by_provider_and_providerDeviceId", (q) =>
        q.eq("provider", args.provider).eq("providerDeviceId", args.providerDeviceId),
      )
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, {
        name: args.name,
        model: args.model,
        timezone: args.timezone,
      });
      return existing._id;
    }

    return await ctx.db.insert("devices", {
      userId: args.userId,
      provider: args.provider,
      providerDeviceId: args.providerDeviceId,
      name: args.name,
      model: args.model,
      timezone: args.timezone,
      createdAt: Date.now(),
    });
  },
});
