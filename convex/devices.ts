import { internalMutation, internalQuery, query, mutation } from "./_generated/server";
import { v } from "convex/values";

import { internal } from "./_generated/api";
import { providerValidator } from "./lib/validators";
import { getMaxDevices, type Plan } from "./lib/planLimits";
import { getOrgPlan } from "./lib/orgAuth";

const deviceShape = v.object({
  _id: v.id("devices"),
  _creationTime: v.number(),
  userId: v.id("users"),
  organizationId: v.optional(v.id("organizations")),
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
  primaryMetrics: v.optional(v.array(v.string())),
  secondaryMetrics: v.optional(v.array(v.string())),
  intervalChangeAt: v.optional(v.number()),
  awaitingPostChangeReading: v.optional(v.boolean()),
  reportInterval: v.optional(v.number()),
  createdAt: v.number(),
});

export const list = query({
  args: {
    organizationId: v.id("organizations"),
  },
  returns: v.array(deviceShape),
  handler: async (ctx, args) => {
    return await ctx.db
      .query("devices")
      .withIndex("by_organizationId", (q) => q.eq("organizationId", args.organizationId))
      .order("desc")
      .collect();
  },
});

export const hasQingpingDevice = query({
  args: {
    organizationId: v.id("organizations"),
  },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    const devices = await ctx.db
      .query("devices")
      .withIndex("by_organizationId", (q) => q.eq("organizationId", args.organizationId))
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
    primaryMetrics: v.array(v.string()),
    secondaryMetrics: v.array(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    if (args.primaryMetrics.length === 0) {
      throw new Error("At least one primary metric must be selected.");
    }
    if (args.primaryMetrics.length > 2) {
      throw new Error("You can select up to 2 primary metrics.");
    }
    if (args.secondaryMetrics.length > 6) {
      throw new Error("You can select up to 6 secondary metrics.");
    }
    await ctx.db.patch(args.deviceId, { 
      primaryMetrics: args.primaryMetrics,
      secondaryMetrics: args.secondaryMetrics,
    });
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

    // Note: We intentionally do NOT unbind the device from Qingping's cloud.
    // This allows users to re-add the device without needing to re-bind via the Qingping+ app.
    // The deletedDevices entry prevents automatic re-sync until the user explicitly re-adds.

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
        organizationId: device.organizationId,
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

    // Use organizationId if available, fall back to userId for pre-migration data
    const kioskQuery = device.organizationId
      ? ctx.db
          .query("kioskConfigs")
          .withIndex("by_organizationId", (q) => q.eq("organizationId", device.organizationId!))
      : ctx.db
          .query("kioskConfigs")
          .withIndex("by_userId", (q) => q.eq("userId", device.userId));

    const kioskConfigs = await kioskQuery.collect();

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
      organizationId: v.optional(v.id("organizations")),
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

    return { _id: device._id, userId: device.userId, organizationId: device.organizationId };
  },
});

export const upsertFromProvider = internalMutation({
  args: {
    userId: v.id("users"),
    organizationId: v.optional(v.id("organizations")),
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

    // Enforce device limit before creating a new device from provider sync
    // Get plan from organization if available, otherwise fall back to user
    let plan: Plan;
    if (args.organizationId) {
      plan = await getOrgPlan(ctx.db, args.organizationId);
    } else {
      const user = await ctx.db.get(args.userId);
      if (!user) throw new Error("User not found");
      plan = (user.plan ?? "starter") as Plan;
    }

    const maxDevices = getMaxDevices(plan);

    // Count devices by org if available, otherwise by user
    const currentDevices = args.organizationId
      ? await ctx.db
          .query("devices")
          .withIndex("by_organizationId", (q) => q.eq("organizationId", args.organizationId!))
          .collect()
      : await ctx.db
          .query("devices")
          .withIndex("by_userId", (q) => q.eq("userId", args.userId))
          .collect();

    if (currentDevices.length >= maxDevices) {
      throw new Error(
        `[plan limit] Organization at device limit (${maxDevices}) on ${plan} plan. Skipping device ${args.providerDeviceId}.`
      );
    }

    return await ctx.db.insert("devices", {
      userId: args.userId,
      organizationId: args.organizationId,
      provider: args.provider,
      providerDeviceId: args.providerDeviceId,
      name: args.name,
      model: args.model,
      timezone: args.timezone,
      providerOffline: args.providerOffline,
      reportInterval: 3600,
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
    organizationId: v.id("organizations"),
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
      // If it exists and belongs to this organization, just update the name
      if (existing.organizationId === args.organizationId) {
        await ctx.db.patch(existing._id, { name: args.name });
        return existing._id;
      }

      // If it belongs to the same user (legacy check), update ownership
      if (existing.userId === args.userId) {
        await ctx.db.patch(existing._id, { 
          name: args.name,
          organizationId: args.organizationId,
        });
        return existing._id;
      }
      
      // Check if the previous owner's account still exists
      const previousOwner = await ctx.db.get(existing.userId);
      const currentUser = await ctx.db.get(args.userId);
      
      if (previousOwner && currentUser) {
        // Check if it's the same person (same email) who re-signed up
        if (previousOwner.email === currentUser.email) {
          // Same person - transfer device ownership to new user/org
          await ctx.db.patch(existing._id, { 
            userId: args.userId,
            organizationId: args.organizationId,
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

    // Enforce device limit before creating a new device
    const plan = await getOrgPlan(ctx.db, args.organizationId);
    const maxDevices = getMaxDevices(plan);
    const currentDevices = await ctx.db
      .query("devices")
      .withIndex("by_organizationId", (q) => q.eq("organizationId", args.organizationId))
      .collect();
    if (currentDevices.length >= maxDevices) {
      throw new Error(
        `You've reached the maximum of ${maxDevices} sensor${maxDevices === 1 ? "" : "s"} on your ${plan} plan. Upgrade to add more.`
      );
    }

    // Create new device
    return await ctx.db.insert("devices", {
      userId: args.userId,
      organizationId: args.organizationId,
      provider: args.provider,
      providerDeviceId: args.macAddress,
      name: args.name,
      reportInterval: 3600,
      createdAt: Date.now(),
    });
  },
});

/**
 * Check if a device was deleted for a specific organization.
 */
export const isDeletedForOrg = internalQuery({
  args: {
    organizationId: v.id("organizations"),
    provider: providerValidator,
    providerDeviceId: v.string(),
  },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("deletedDevices")
      .withIndex("by_organizationId_and_provider_and_providerDeviceId", (q) =>
        q
          .eq("organizationId", args.organizationId)
          .eq("provider", args.provider)
          .eq("providerDeviceId", args.providerDeviceId),
      )
      .first();
    return Boolean(existing);
  },
});

/**
 * @deprecated Use isDeletedForOrg instead. Kept for backward compatibility during migration.
 */
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

export const isDeletedByProviderDeviceId = internalQuery({
  args: {
    provider: providerValidator,
    providerDeviceId: v.string(),
  },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("deletedDevices")
      .filter((q) =>
        q.and(
          q.eq(q.field("provider"), args.provider),
          q.eq(q.field("providerDeviceId"), args.providerDeviceId),
        ),
      )
      .first();
    return Boolean(existing);
  },
});

export const removeDeletedDevice = internalMutation({
  args: {
    provider: providerValidator,
    providerDeviceId: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("deletedDevices")
      .withIndex("by_provider_and_providerDeviceId", (q) =>
        q.eq("provider", args.provider).eq("providerDeviceId", args.providerDeviceId),
      )
      .first();

    if (existing) {
      await ctx.db.delete(existing._id);
    }

    return null;
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

export const updateReportInterval = internalMutation({
  args: {
    deviceId: v.id("devices"),
    reportInterval: v.number(),
    intervalChangeAt: v.optional(v.number()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const patch: {
      reportInterval: number;
      intervalChangeAt?: number;
    } = {
      reportInterval: args.reportInterval,
    };
    
    if (args.intervalChangeAt !== undefined) {
      patch.intervalChangeAt = args.intervalChangeAt;
    }
    
    await ctx.db.patch(args.deviceId, patch);
    return null;
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
