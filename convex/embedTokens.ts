import { query, mutation, internalQuery } from "./_generated/server";
import { v } from "convex/values";

const embedTokenShape = v.object({
  _id: v.id("embedTokens"),
  _creationTime: v.number(),
  userId: v.id("users"),
  deviceId: v.id("devices"),
  token: v.string(),
  label: v.optional(v.string()),
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
  },
  returns: embedTokenShape,
  handler: async (ctx, args) => {
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
