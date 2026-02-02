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
  lastBattery: v.optional(v.number()),
  providerOffline: v.optional(v.boolean()),
  hiddenMetrics: v.optional(v.array(v.string())),
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

export const hasQingpingDevice = query({
  args: {
    userId: v.id("users"),
  },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    const devices = await ctx.db
      .query("devices")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .collect();
    return devices.some((device) => device.provider === "qingping");
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
    await ctx.db.patch(args.deviceId, { roomId: args.roomId });
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

export const updateHiddenMetrics = mutation({
  args: {
    deviceId: v.id("devices"),
    hiddenMetrics: v.array(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.patch(args.deviceId, { hiddenMetrics: args.hiddenMetrics });
    return null;
  },
});

export const deleteDevice = mutation({
  args: {
    deviceId: v.id("devices"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const device = await ctx.db.get(args.deviceId);
    if (!device) {
      throw new Error("Device not found");
    }

    const existingDeleted = await ctx.db
      .query("deletedDevices")
      .withIndex("by_userId_and_provider_and_providerDeviceId", (q) =>
        q
          .eq("userId", device.userId)
          .eq("provider", device.provider)
          .eq("providerDeviceId", device.providerDeviceId),
      )
      .first();

    if (!existingDeleted) {
      await ctx.db.insert("deletedDevices", {
        userId: device.userId,
        provider: device.provider,
        providerDeviceId: device.providerDeviceId,
        deletedAt: Date.now(),
      });
    }

    const readings = await ctx.db
      .query("readings")
      .withIndex("by_deviceId", (q) => q.eq("deviceId", args.deviceId))
      .collect();

    for (const reading of readings) {
      await ctx.db.delete(reading._id);
    }

    const embedTokens = await ctx.db
      .query("embedTokens")
      .withIndex("by_deviceId", (q) => q.eq("deviceId", args.deviceId))
      .collect();

    for (const token of embedTokens) {
      await ctx.db.delete(token._id);
    }

    const kioskConfigs = await ctx.db
      .query("kioskConfigs")
      .withIndex("by_userId", (q) => q.eq("userId", device.userId))
      .collect();

    for (const config of kioskConfigs) {
      if (!config.deviceIds.includes(args.deviceId)) {
        continue;
      }
      const nextDeviceIds = config.deviceIds.filter((id) => id !== args.deviceId);
      await ctx.db.patch(config._id, { deviceIds: nextDeviceIds });
    }

    await ctx.db.delete(args.deviceId);
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
    providerOffline: v.optional(v.boolean()),
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
      const patch: {
        name: string;
        model?: string;
        timezone?: string;
        providerOffline?: boolean;
      } = {
        name: args.name,
        model: args.model,
        timezone: args.timezone,
      };

      if (args.providerOffline !== undefined) {
        patch.providerOffline = args.providerOffline;
      }

      await ctx.db.patch(existing._id, patch);
      return existing._id;
    }

    return await ctx.db.insert("devices", {
      userId: args.userId,
      provider: args.provider,
      providerDeviceId: args.providerDeviceId,
      name: args.name,
      model: args.model,
      timezone: args.timezone,
      providerOffline: args.providerOffline,
      createdAt: Date.now(),
    });
  },
});

/**
 * Add a device by MAC address.
 * This creates a placeholder device that will be populated when data arrives.
 */
export const addByMac = mutation({
  args: {
    userId: v.id("users"),
    name: v.string(),
    macAddress: v.string(),
    provider: providerValidator,
  },
  returns: v.id("devices"),
  handler: async (ctx, args) => {
    const deletedEntry = await ctx.db
      .query("deletedDevices")
      .withIndex("by_userId_and_provider_and_providerDeviceId", (q) =>
        q
          .eq("userId", args.userId)
          .eq("provider", args.provider)
          .eq("providerDeviceId", args.macAddress),
      )
      .first();

    if (deletedEntry) {
      await ctx.db.delete(deletedEntry._id);
    }

    // Check if device already exists
    const existing = await ctx.db
      .query("devices")
      .withIndex("by_provider_and_providerDeviceId", (q) =>
        q.eq("provider", args.provider).eq("providerDeviceId", args.macAddress),
      )
      .unique();

    if (existing) {
      // If it exists and belongs to this user, just update the name
      if (existing.userId === args.userId) {
        await ctx.db.patch(existing._id, { name: args.name });
        return existing._id;
      }
      
      // Check if the previous owner's account still exists
      const previousOwner = await ctx.db.get(existing.userId);
      const currentUser = await ctx.db.get(args.userId);
      
      if (previousOwner && currentUser) {
        // Check if it's the same person (same email) who re-signed up
        // This handles the case where user deleted account and re-signed up
        if (previousOwner.email === currentUser.email) {
          // Same person - transfer device ownership to new user
          await ctx.db.patch(existing._id, { 
            userId: args.userId,
            name: args.name,
          });
          return existing._id;
        }
        
        // Different person - device is not available
        throw new Error("This device is already registered to another account");
      }
      
      if (previousOwner && !currentUser) {
        throw new Error("Current user not found");
      }
      
      // Previous owner's account was deleted - clean up the orphaned device
      const readings = await ctx.db
        .query("readings")
        .withIndex("by_deviceId", (q) => q.eq("deviceId", existing._id))
        .collect();
      
      for (const reading of readings) {
        await ctx.db.delete(reading._id);
      }
      
      // Delete the orphaned device
      await ctx.db.delete(existing._id);
    }

    // Create new device
    return await ctx.db.insert("devices", {
      userId: args.userId,
      provider: args.provider,
      providerDeviceId: args.macAddress,
      name: args.name,
      createdAt: Date.now(),
    });
  },
});

export const isDeletedForUser = internalQuery({
  args: {
    userId: v.id("users"),
    provider: providerValidator,
    providerDeviceId: v.string(),
  },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("deletedDevices")
      .withIndex("by_userId_and_provider_and_providerDeviceId", (q) =>
        q
          .eq("userId", args.userId)
          .eq("provider", args.provider)
          .eq("providerDeviceId", args.providerDeviceId),
      )
      .first();
    return Boolean(existing);
  },
});

/**
 * Force claim a device by deleting it from any previous owner.
 * WARNING: This is a destructive operation for development/admin use only.
 * It will delete the device and all its readings, allowing re-registration.
 */
export const forceClaimDevice = mutation({
  args: {
    macAddress: v.string(),
    provider: providerValidator,
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("devices")
      .withIndex("by_provider_and_providerDeviceId", (q) =>
        q.eq("provider", args.provider).eq("providerDeviceId", args.macAddress),
      )
      .unique();

    if (!existing) {
      // Device doesn't exist, nothing to do
      return null;
    }

    // Delete all readings for this device
    const readings = await ctx.db
      .query("readings")
      .withIndex("by_deviceId", (q) => q.eq("deviceId", existing._id))
      .collect();

    for (const reading of readings) {
      await ctx.db.delete(reading._id);
    }

    // Delete the device
    await ctx.db.delete(existing._id);

    return null;
  },
});
