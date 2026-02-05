import { query, mutation, internalQuery } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import { getDefaultRefreshInterval, isValidRefreshInterval } from "./lib/planLimits";

const embedTokenShape = v.object({
  _id: v.id("embedTokens"),
  _creationTime: v.number(),
  userId: v.id("users"),
  deviceId: v.id("devices"),
  token: v.string(),
  label: v.optional(v.string()),
  description: v.optional(v.string()),
  size: v.optional(v.union(v.literal("small"), v.literal("medium"), v.literal("large"))),
  refreshInterval: v.optional(v.number()),
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
  returns: v.array(embedTokenShape),
  handler: async (ctx, args) => {
    return await ctx.db
      .query("embedTokens")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
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
    deviceId: v.id("devices"),
    label: v.optional(v.string()),
    description: v.optional(v.string()),
    size: v.optional(v.union(v.literal("small"), v.literal("medium"), v.literal("large"))),
    refreshInterval: v.optional(v.number()),
  },
  returns: embedTokenShape,
  handler: async (ctx, args) => {
    // Get user plan to validate refresh interval
    const user = await ctx.db.get(args.userId);
    if (!user) {
      throw new Error("User not found.");
    }

    // Validate refresh interval if provided
    if (args.refreshInterval !== undefined) {
      if (!isValidRefreshInterval(user.plan, args.refreshInterval)) {
        throw new Error(
          `Refresh interval must be between ${Math.floor(getDefaultRefreshInterval(user.plan) / 60)} minutes and 60 minutes for your plan.`
        );
      }
    }

    // Use provided interval or default based on plan
    const refreshInterval = args.refreshInterval ?? getDefaultRefreshInterval(user.plan);

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
      deviceId: args.deviceId,
      token,
      label: args.label,
      description: args.description,
      size: args.size,
      refreshInterval,
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

    // Get user plan to validate refresh interval
    const user = await ctx.db.get(token.userId);
    if (!user) {
      throw new Error("User not found.");
    }

    // Validate refresh interval
    if (!isValidRefreshInterval(user.plan, args.refreshInterval)) {
      throw new Error(
        `Refresh interval must be between ${Math.floor(getDefaultRefreshInterval(user.plan) / 60)} minutes and 60 minutes for your plan.`
      );
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
