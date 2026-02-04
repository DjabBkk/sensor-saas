import { internalMutation, internalQuery, query, mutation } from "./_generated/server";
import { v } from "convex/values";

import { providerValidator } from "./lib/validators";
import { internal } from "./_generated/api";

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
  dashboardMetrics: v.optional(v.array(v.string())),
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

export const updateDashboardMetrics = mutation({
  args: {
    deviceId: v.id("devices"),
    dashboardMetrics: v.array(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    if (args.dashboardMetrics.length === 0) {
      throw new Error("At least one dashboard metric must be selected.");
    }
    if (args.dashboardMetrics.length > 4) {
      throw new Error("You can select up to 4 dashboard metrics.");
    }
    await ctx.db.patch(args.deviceId, { dashboardMetrics: args.dashboardMetrics });
    return null;
  },
});

export const deleteDevice = mutation({
  args: {
    deviceId: v.id("devices"),
  },
  returns: v.object({
    readingsDeleted: v.number(),
    embedTokensDeleted: v.number(),
    kioskConfigsUpdated: v.number(),
  }),
  handler: async (ctx, args) => {
    const device = await ctx.db.get(args.deviceId);
    if (!device) {
      throw new Error("Device not found");
    }

    let readingsDeleted = 0;
    let embedTokensDeleted = 0;
    let kioskConfigsUpdated = 0;

    // Mark device as deleted first (before deleting readings)
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

    // Delete all readings for this device
    try {
      const readings = await ctx.db
        .query("readings")
        .withIndex("by_deviceId", (q) => q.eq("deviceId", args.deviceId))
        .collect();

      for (const reading of readings) {
        await ctx.db.delete(reading._id);
        readingsDeleted++;
      }
    } catch (error) {
      console.error(`[DELETE DEVICE] Error deleting readings for device ${args.deviceId}:`, error);
      // Continue with other cleanup even if readings deletion fails
    }

    // Delete all embed tokens for this device
    try {
      const embedTokens = await ctx.db
        .query("embedTokens")
        .withIndex("by_deviceId", (q) => q.eq("deviceId", args.deviceId))
        .collect();

      for (const token of embedTokens) {
        await ctx.db.delete(token._id);
        embedTokensDeleted++;
      }
    } catch (error) {
      console.error(`[DELETE DEVICE] Error deleting embed tokens for device ${args.deviceId}:`, error);
      // Continue with other cleanup even if embed tokens deletion fails
    }

    // Update kiosk configs to remove this device
    try {
      const kioskConfigs = await ctx.db
        .query("kioskConfigs")
        .withIndex("by_userId", (q) => q.eq("userId", device.userId))
        .collect();

      for (const config of kioskConfigs) {
        if (config.deviceIds.includes(args.deviceId)) {
          const nextDeviceIds = config.deviceIds.filter((id) => id !== args.deviceId);
          await ctx.db.patch(config._id, { deviceIds: nextDeviceIds });
          kioskConfigsUpdated++;
        }
      }
    } catch (error) {
      console.error(`[DELETE DEVICE] Error updating kiosk configs for device ${args.deviceId}:`, error);
      // Continue with device deletion even if kiosk config update fails
    }

    // Finally, delete the device itself
    await ctx.db.delete(args.deviceId);

    console.log(
      `[DELETE DEVICE] Deleted device ${args.deviceId}: ${readingsDeleted} readings, ${embedTokensDeleted} embed tokens, ${kioskConfigsUpdated} kiosk configs updated`
    );

    return {
      readingsDeleted,
      embedTokensDeleted,
      kioskConfigsUpdated,
    };
  },
});

export const getInternal = internalQuery({
  args: {
    deviceId: v.id("devices"),
  },
  returns: v.union(v.null(), deviceShape),
  handler: async (ctx, args) => {
    return await ctx.db.get(args.deviceId);
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
      // Update device info from provider (name, model, timezone, offline status)
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
    name: v.optional(v.string()),
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
      // If it exists and belongs to this user, return the existing device
      if (existing.userId === args.userId) {
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

    // Use provided name or a placeholder (will be updated by sync with Qingping name)
    const deviceName = args.name || `Device ${args.macAddress.slice(-4)}`;

    // Create new device
    const deviceId = await ctx.db.insert("devices", {
      userId: args.userId,
      provider: args.provider,
      providerDeviceId: args.macAddress,
      name: deviceName,
      createdAt: Date.now(),
    });

    console.log(`[ADD DEVICE] Created device ${deviceId} for user ${args.userId}, MAC: ${args.macAddress}`);

    // Check if user has provider credentials and trigger immediate sync
    const config = await ctx.db
      .query("providerConfigs")
      .withIndex("by_userId_and_provider", (q) =>
        q.eq("userId", args.userId).eq("provider", args.provider)
      )
      .first();

    if (config && config.accessToken) {
      // Schedule immediate sync to fetch readings for the new device
      await ctx.scheduler.runAfter(0, internal.providersActions.syncDevicesForUser, {
        userId: args.userId,
        provider: args.provider,
      });
      console.log(`[ADD DEVICE] Scheduled immediate sync for user ${args.userId} after adding device ${deviceId}`);
    } else {
      // No credentials yet - this might be a first-time user where connectAndSync is still running
      // Schedule a delayed sync to catch cases where credentials are saved shortly after
      console.log(`[ADD DEVICE] No provider credentials found yet for user ${args.userId}, scheduling delayed sync`);
      await ctx.scheduler.runAfter(3000, internal.providersActions.syncDevicesForUser, {
        userId: args.userId,
        provider: args.provider,
      });
    }

    return deviceId;
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

/**
 * Clean up orphaned readings (readings that reference deleted devices).
 * This is a utility function to fix data integrity issues.
 * Can be called manually or scheduled as a cron job.
 */
export const cleanupOrphanedReadings = internalMutation({
  args: {},
  returns: v.object({
    orphanedReadingsDeleted: v.number(),
  }),
  handler: async (ctx) => {
    let orphanedCount = 0;
    
    // Get all readings
    const allReadings = await ctx.db.query("readings").collect();
    
    for (const reading of allReadings) {
      // Check if the device still exists
      const device = await ctx.db.get(reading.deviceId);
      if (!device) {
        // Device doesn't exist, delete the orphaned reading
        await ctx.db.delete(reading._id);
        orphanedCount++;
      }
    }
    
    if (orphanedCount > 0) {
      console.log(`[CLEANUP] Deleted ${orphanedCount} orphaned readings`);
    }
    
    return { orphanedReadingsDeleted: orphanedCount };
  },
});
