import { query, mutation, internalQuery } from "./_generated/server";
import { v } from "convex/values";
import { getDefaultRefreshInterval, getMinRefreshInterval, getPlanLimits, isValidRefreshInterval } from "./lib/planLimits";
import { getOrgPlan } from "./lib/orgAuth";

const embedTokenShape = v.object({
  _id: v.id("embedTokens"),
  _creationTime: v.number(),
  userId: v.id("users"),
  organizationId: v.optional(v.id("organizations")),
  deviceId: v.id("devices"),
  token: v.string(),
  label: v.optional(v.string()),
  description: v.optional(v.string()),
  size: v.optional(v.union(v.literal("small"), v.literal("medium"), v.literal("large"))),
  refreshInterval: v.optional(v.number()),
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
    organizationId: v.id("organizations"),
  },
  returns: v.array(embedTokenShape),
  handler: async (ctx, args) => {
    return await ctx.db
      .query("embedTokens")
      .withIndex("by_organizationId", (q) => q.eq("organizationId", args.organizationId))
      .order("desc")
      .collect();
  },
});

export const listForDevice = query({
  args: {
    deviceId: v.id("devices"),
  },
  returns: v.array(embedTokenShape),
  handler: async (ctx, args) => {
    return await ctx.db
      .query("embedTokens")
      .withIndex("by_deviceId", (q) => q.eq("deviceId", args.deviceId))
      .order("desc")
      .collect();
  },
});

export const create = mutation({
  args: {
    userId: v.id("users"),
    organizationId: v.id("organizations"),
    deviceId: v.id("devices"),
    label: v.optional(v.string()),
    description: v.optional(v.string()),
    size: v.optional(v.union(v.literal("small"), v.literal("medium"), v.literal("large"))),
    refreshInterval: v.optional(v.number()),
    // Branding (Pro+ plan)
    brandName: v.optional(v.string()),
    brandColor: v.optional(v.string()),
    logoStorageId: v.optional(v.id("_storage")),
    hideAirViewBranding: v.optional(v.boolean()),
  },
  returns: embedTokenShape,
  handler: async (ctx, args) => {
    // Get plan from organization
    const plan = await getOrgPlan(ctx.db, args.organizationId);
    const limits = getPlanLimits(plan);

    // Enforce widget/kiosk limit
    if (limits.sharedWidgetKioskLimit !== null) {
      // Shared limit: count widgets + kiosks combined
      const allOrgTokens = await ctx.db
        .query("embedTokens")
        .withIndex("by_organizationId", (q) => q.eq("organizationId", args.organizationId))
        .collect();
      const activeWidgets = allOrgTokens.filter((t) => !t.isRevoked).length;
      const allOrgKiosks = await ctx.db
        .query("kioskConfigs")
        .withIndex("by_organizationId", (q) => q.eq("organizationId", args.organizationId))
        .collect();
      const activeKiosks = allOrgKiosks.filter((k) => !k.isRevoked).length;
      if (activeWidgets + activeKiosks >= limits.sharedWidgetKioskLimit) {
        throw new Error(
          `You've reached the maximum of ${limits.sharedWidgetKioskLimit} widget or kiosk on your ${plan} plan. Upgrade to add more.`
        );
      }
    } else if (limits.maxWidgets !== Infinity) {
      // Separate per-type limit
      const allOrgTokens = await ctx.db
        .query("embedTokens")
        .withIndex("by_organizationId", (q) => q.eq("organizationId", args.organizationId))
        .collect();
      const activeCount = allOrgTokens.filter((t) => !t.isRevoked).length;
      if (activeCount >= limits.maxWidgets) {
        throw new Error(
          `You've reached the maximum of ${limits.maxWidgets} widget${limits.maxWidgets === 1 ? "" : "s"} on your ${plan} plan. Upgrade to add more.`
        );
      }
    }

    // Validate refresh interval if provided
    if (args.refreshInterval !== undefined) {
      if (!isValidRefreshInterval(plan, args.refreshInterval)) {
        const minMinutes = Math.floor(getMinRefreshInterval(plan) / 60);
        const msg = minMinutes === 60
          ? `Refresh interval must be 60 minutes for your ${plan} plan.`
          : `Refresh interval must be between ${minMinutes} minutes and 60 minutes for your ${plan} plan.`;
        throw new Error(msg);
      }
    }

    // Validate branding fields require Pro+ plan
    const hasBranding = args.brandName || args.brandColor || args.logoStorageId || args.hideAirViewBranding;
    if (hasBranding && !limits.customBranding) {
      throw new Error(
        `Custom branding is not available on your ${plan} plan. Upgrade to Pro or higher.`,
      );
    }

    // Use provided interval or default based on plan
    const refreshInterval = args.refreshInterval ?? getDefaultRefreshInterval(plan);

    let token = generateToken();
    let existing = await ctx.db
      .query("embedTokens")
      .withIndex("by_token", (q) => q.eq("token", token))
      .first();

    let attempts = 0;
    while (existing && attempts < 5) {
      token = generateToken();
      existing = await ctx.db
        .query("embedTokens")
        .withIndex("by_token", (q) => q.eq("token", token))
        .first();
      attempts += 1;
    }

    if (existing) {
      throw new Error("Failed to generate unique token.");
    }

    const tokenId = await ctx.db.insert("embedTokens", {
      userId: args.userId,
      organizationId: args.organizationId,
      deviceId: args.deviceId,
      token,
      label: args.label,
      description: args.description,
      size: args.size,
      refreshInterval,
      brandName: args.brandName,
      brandColor: args.brandColor,
      logoStorageId: args.logoStorageId,
      hideAirViewBranding: args.hideAirViewBranding,
      isRevoked: false,
      createdAt: Date.now(),
    });

    const doc = await ctx.db.get(tokenId);
    if (!doc) {
      throw new Error("Failed to create embed token.");
    }
    return doc;
  },
});

export const revoke = mutation({
  args: {
    tokenId: v.id("embedTokens"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.patch(args.tokenId, { isRevoked: true });
    return null;
  },
});

export const getByToken = internalQuery({
  args: {
    token: v.string(),
  },
  returns: v.union(v.null(), embedTokenShape),
  handler: async (ctx, args) => {
    return await ctx.db
      .query("embedTokens")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .unique();
  },
});

export const updateBranding = mutation({
  args: {
    tokenId: v.id("embedTokens"),
    brandName: v.optional(v.string()),
    brandColor: v.optional(v.string()),
    logoStorageId: v.optional(v.id("_storage")),
    hideAirViewBranding: v.optional(v.boolean()),
  },
  returns: embedTokenShape,
  handler: async (ctx, args) => {
    const token = await ctx.db.get(args.tokenId);
    if (!token || token.isRevoked) {
      throw new Error("Token not found or revoked.");
    }

    // Get plan from organization if available, fallback to user
    let plan;
    if (token.organizationId) {
      plan = await getOrgPlan(ctx.db, token.organizationId);
    } else {
      const user = await ctx.db.get(token.userId);
      if (!user) throw new Error("User not found.");
      plan = (user.plan ?? "starter") as "starter" | "pro" | "business" | "custom";
    }

    const limits = getPlanLimits(plan);
    if (!limits.customBranding) {
      throw new Error(
        `Custom branding is not available on your ${plan} plan. Upgrade to Pro or higher.`,
      );
    }

    await ctx.db.patch(args.tokenId, {
      brandName: args.brandName,
      brandColor: args.brandColor,
      logoStorageId: args.logoStorageId,
      hideAirViewBranding: args.hideAirViewBranding,
    });

    const updated = await ctx.db.get(args.tokenId);
    if (!updated) {
      throw new Error("Failed to update branding.");
    }
    return updated;
  },
});

export const updateRefreshInterval = mutation({
  args: {
    tokenId: v.id("embedTokens"),
    refreshInterval: v.number(),
  },
  returns: embedTokenShape,
  handler: async (ctx, args) => {
    const token = await ctx.db.get(args.tokenId);
    if (!token || token.isRevoked) {
      throw new Error("Token not found or revoked.");
    }

    // Get plan from organization if available, fallback to user
    let plan;
    if (token.organizationId) {
      plan = await getOrgPlan(ctx.db, token.organizationId);
    } else {
      const user = await ctx.db.get(token.userId);
      if (!user) throw new Error("User not found.");
      plan = (user.plan ?? "starter") as "starter" | "pro" | "business" | "custom";
    }

    // Validate refresh interval
    if (!isValidRefreshInterval(plan, args.refreshInterval)) {
      const minMinutes = Math.floor(getMinRefreshInterval(plan) / 60);
      const msg = minMinutes === 60
        ? `Refresh interval must be 60 minutes for your ${plan} plan.`
        : `Refresh interval must be between ${minMinutes} minutes and 60 minutes for your ${plan} plan.`;
      throw new Error(msg);
    }

    await ctx.db.patch(args.tokenId, {
      refreshInterval: args.refreshInterval,
    });

    const updated = await ctx.db.get(args.tokenId);
    if (!updated) {
      throw new Error("Failed to update token.");
    }
    return updated;
  },
});
