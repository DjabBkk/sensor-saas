import { query, mutation, internalQuery } from "./_generated/server";
import { v } from "convex/values";
import { getMinRefreshInterval, getPlanLimits, isValidRefreshInterval } from "./lib/planLimits";

const kioskConfigShape = v.object({
  _id: v.id("kioskConfigs"),
  _creationTime: v.number(),
  userId: v.id("users"),
  token: v.string(),
  label: v.optional(v.string()),
  title: v.optional(v.string()),
  mode: v.union(v.literal("single"), v.literal("multi")),
  deviceIds: v.array(v.id("devices")),
  theme: v.union(v.literal("dark"), v.literal("light")),
  refreshInterval: v.number(),
  visibleMetrics: v.optional(v.array(v.string())),
  // Branding (Pro+ plan)
  brandName: v.optional(v.string()),
  brandColor: v.optional(v.string()),
  logoStorageId: v.optional(v.id("_storage")),
  hideAirViewBranding: v.optional(v.boolean()),
  isRevoked: v.boolean(),
  createdAt: v.number(),
});

const generateToken = () => {
  return crypto.randomUUID().replace(/-/g, "").slice(0, 24);
};

export const listForUser = query({
  args: {
    userId: v.id("users"),
  },
  returns: v.array(kioskConfigShape),
  handler: async (ctx, args) => {
    return await ctx.db
      .query("kioskConfigs")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .order("desc")
      .collect();
  },
});

export const create = mutation({
  args: {
    userId: v.id("users"),
    label: v.optional(v.string()),
    title: v.optional(v.string()),
    mode: v.union(v.literal("single"), v.literal("multi")),
    deviceIds: v.array(v.id("devices")),
    theme: v.union(v.literal("dark"), v.literal("light")),
    refreshInterval: v.number(),
    visibleMetrics: v.optional(v.array(v.string())),
    // Branding (Pro+ plan)
    brandName: v.optional(v.string()),
    brandColor: v.optional(v.string()),
    logoStorageId: v.optional(v.id("_storage")),
    hideAirViewBranding: v.optional(v.boolean()),
  },
  returns: kioskConfigShape,
  handler: async (ctx, args) => {
    // Get user plan to validate limits
    const user = await ctx.db.get(args.userId);
    if (!user) {
      throw new Error("User not found.");
    }

    // Enforce kiosk/widget limit
    const limits = getPlanLimits(user.plan);
    if (limits.sharedWidgetKioskLimit !== null) {
      // Shared limit: count kiosks + widgets combined
      const allUserKiosks = await ctx.db
        .query("kioskConfigs")
        .withIndex("by_userId", (q) => q.eq("userId", args.userId))
        .collect();
      const activeKiosks = allUserKiosks.filter((k) => !k.isRevoked).length;
      const allUserTokens = await ctx.db
        .query("embedTokens")
        .withIndex("by_userId", (q) => q.eq("userId", args.userId))
        .collect();
      const activeWidgets = allUserTokens.filter((t) => !t.isRevoked).length;
      if (activeKiosks + activeWidgets >= limits.sharedWidgetKioskLimit) {
        throw new Error(
          `You've reached the maximum of ${limits.sharedWidgetKioskLimit} widget or kiosk on your ${user.plan} plan. Upgrade to add more.`
        );
      }
    } else if (limits.maxKiosks !== Infinity) {
      // Separate per-type limit
      const allUserKiosks = await ctx.db
        .query("kioskConfigs")
        .withIndex("by_userId", (q) => q.eq("userId", args.userId))
        .collect();
      const activeCount = allUserKiosks.filter((k) => !k.isRevoked).length;
      if (activeCount >= limits.maxKiosks) {
        throw new Error(
          `You've reached the maximum of ${limits.maxKiosks} kiosk${limits.maxKiosks === 1 ? "" : "s"} on your ${user.plan} plan. Upgrade to add more.`
        );
      }
    }

    // Validate branding fields require Pro+ plan
    const hasBranding = args.brandName || args.brandColor || args.logoStorageId || args.hideAirViewBranding;
    if (hasBranding && !limits.customBranding) {
      throw new Error(
        `Custom branding is not available on your ${user.plan} plan. Upgrade to Pro or higher.`,
      );
    }

    // Validate refresh interval
    if (!isValidRefreshInterval(user.plan, args.refreshInterval)) {
      const minMinutes = Math.floor(getMinRefreshInterval(user.plan) / 60);
      const msg = minMinutes === 60
        ? `Refresh interval must be 60 minutes for your ${user.plan} plan.`
        : `Refresh interval must be between ${minMinutes} minutes and 60 minutes for your ${user.plan} plan.`;
      throw new Error(msg);
    }

    let token = generateToken();
    let existing = await ctx.db
      .query("kioskConfigs")
      .withIndex("by_token", (q) => q.eq("token", token))
      .first();

    let attempts = 0;
    while (existing && attempts < 5) {
      token = generateToken();
      existing = await ctx.db
        .query("kioskConfigs")
        .withIndex("by_token", (q) => q.eq("token", token))
        .first();
      attempts += 1;
    }

    if (existing) {
      throw new Error("Failed to generate unique token.");
    }

    const configId = await ctx.db.insert("kioskConfigs", {
      userId: args.userId,
      token,
      label: args.label,
      title: args.title,
      mode: args.mode,
      deviceIds: args.deviceIds,
      theme: args.theme,
      refreshInterval: args.refreshInterval,
      visibleMetrics: args.visibleMetrics,
      brandName: args.brandName,
      brandColor: args.brandColor,
      logoStorageId: args.logoStorageId,
      hideAirViewBranding: args.hideAirViewBranding,
      isRevoked: false,
      createdAt: Date.now(),
    });

    const doc = await ctx.db.get(configId);
    if (!doc) {
      throw new Error("Failed to create kiosk config.");
    }
    return doc;
  },
});

export const update = mutation({
  args: {
    configId: v.id("kioskConfigs"),
    label: v.optional(v.string()),
    title: v.optional(v.string()),
    mode: v.union(v.literal("single"), v.literal("multi")),
    deviceIds: v.array(v.id("devices")),
    theme: v.union(v.literal("dark"), v.literal("light")),
    refreshInterval: v.number(),
    visibleMetrics: v.optional(v.array(v.string())),
    // Branding (Pro+ plan)
    brandName: v.optional(v.string()),
    brandColor: v.optional(v.string()),
    logoStorageId: v.optional(v.id("_storage")),
    hideAirViewBranding: v.optional(v.boolean()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    // Validate branding fields require Pro+ plan
    const hasBranding = args.brandName || args.brandColor || args.logoStorageId || args.hideAirViewBranding;
    if (hasBranding) {
      const config = await ctx.db.get(args.configId);
      if (config) {
        const user = await ctx.db.get(config.userId);
        if (user) {
          const limits = getPlanLimits(user.plan);
          if (!limits.customBranding) {
            throw new Error(
              `Custom branding is not available on your ${user.plan} plan. Upgrade to Pro or higher.`,
            );
          }
        }
      }
    }

    await ctx.db.patch(args.configId, {
      label: args.label,
      title: args.title,
      mode: args.mode,
      deviceIds: args.deviceIds,
      theme: args.theme,
      refreshInterval: args.refreshInterval,
      visibleMetrics: args.visibleMetrics,
      brandName: args.brandName,
      brandColor: args.brandColor,
      logoStorageId: args.logoStorageId,
      hideAirViewBranding: args.hideAirViewBranding,
    });
    return null;
  },
});

export const revoke = mutation({
  args: {
    configId: v.id("kioskConfigs"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.patch(args.configId, { isRevoked: true });
    return null;
  },
});

export const getByToken = internalQuery({
  args: {
    token: v.string(),
  },
  returns: v.union(v.null(), kioskConfigShape),
  handler: async (ctx, args) => {
    return await ctx.db
      .query("kioskConfigs")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .unique();
  },
});
