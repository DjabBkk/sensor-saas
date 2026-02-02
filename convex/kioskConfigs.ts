import { query, mutation, internalQuery } from "./_generated/server";
import { v } from "convex/values";

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
  },
  returns: kioskConfigShape,
  handler: async (ctx, args) => {
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
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.patch(args.configId, {
      label: args.label,
      title: args.title,
      mode: args.mode,
      deviceIds: args.deviceIds,
      theme: args.theme,
      refreshInterval: args.refreshInterval,
      visibleMetrics: args.visibleMetrics,
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
