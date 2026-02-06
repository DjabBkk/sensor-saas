import {
  internalMutation,
  internalQuery,
  mutation,
  query,
} from "./_generated/server";
import { v } from "convex/values";

import { providerValidator } from "./lib/validators";
import { internal } from "./_generated/api";

const providerConfigShape = v.object({
  _id: v.id("providerConfigs"),
  _creationTime: v.number(),
  userId: v.id("users"),
  organizationId: v.optional(v.id("organizations")),
  provider: providerValidator,
  accessToken: v.string(),
  tokenExpiresAt: v.number(),
  appKey: v.optional(v.string()),
  appSecret: v.optional(v.string()),
  webhookSecret: v.optional(v.string()),
  lastSyncAt: v.optional(v.number()),
});

/**
 * Get provider config by organization + provider.
 * Falls back to userId-based lookup for pre-migration data.
 */
export const getConfig = internalQuery({
  args: {
    organizationId: v.optional(v.id("organizations")),
    userId: v.optional(v.id("users")),
    provider: providerValidator,
  },
  returns: v.union(v.null(), providerConfigShape),
  handler: async (ctx, args) => {
    // Prefer organization-based lookup
    if (args.organizationId) {
      const config = await ctx.db
        .query("providerConfigs")
        .withIndex("by_organizationId_and_provider", (q) =>
          q.eq("organizationId", args.organizationId).eq("provider", args.provider),
        )
        .first();
      if (config) return config;
    }

    // Fall back to userId-based lookup
    if (args.userId) {
      return await ctx.db
        .query("providerConfigs")
        .withIndex("by_userId_and_provider", (q) =>
          q.eq("userId", args.userId!).eq("provider", args.provider),
        )
        .unique();
    }

    return null;
  },
});

export const hasProviderCredentials = query({
  args: {
    organizationId: v.id("organizations"),
    provider: providerValidator,
  },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    const config = await ctx.db
      .query("providerConfigs")
      .withIndex("by_organizationId_and_provider", (q) =>
        q.eq("organizationId", args.organizationId).eq("provider", args.provider),
      )
      .first();
    return Boolean(config?.appKey && config?.appSecret);
  },
});

export const connect = mutation({
  args: {
    userId: v.id("users"),
    organizationId: v.id("organizations"),
    provider: providerValidator,
    appKey: v.string(),
    appSecret: v.string(),
    webhookSecret: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    if (args.provider !== "qingping") {
      throw new Error("Only Qingping is supported for now.");
    }

    // Schedule the connection process as an action
    await ctx.scheduler.runAfter(0, internal.providersActions.connectAndSync, {
      userId: args.userId,
      organizationId: args.organizationId,
      provider: args.provider,
      appKey: args.appKey,
      appSecret: args.appSecret,
      webhookSecret: args.webhookSecret,
    });

    return null;
  },
});

export const updateToken = internalMutation({
  args: {
    providerConfigId: v.id("providerConfigs"),
    accessToken: v.string(),
    tokenExpiresAt: v.number(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.patch(args.providerConfigId, {
      accessToken: args.accessToken,
      tokenExpiresAt: args.tokenExpiresAt,
    });
    return null;
  },
});

export const updateLastSync = internalMutation({
  args: {
    providerConfigId: v.id("providerConfigs"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.patch(args.providerConfigId, { lastSyncAt: Date.now() });
    return null;
  },
});

export const updateConfig = internalMutation({
  args: {
    configId: v.id("providerConfigs"),
    accessToken: v.string(),
    tokenExpiresAt: v.number(),
    appKey: v.string(),
    appSecret: v.string(),
    webhookSecret: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.patch(args.configId, {
      accessToken: args.accessToken,
      tokenExpiresAt: args.tokenExpiresAt,
      appKey: args.appKey,
      appSecret: args.appSecret,
      webhookSecret: args.webhookSecret,
      lastSyncAt: Date.now(),
    });
    return null;
  },
});

export const insertConfig = internalMutation({
  args: {
    userId: v.id("users"),
    organizationId: v.optional(v.id("organizations")),
    provider: providerValidator,
    accessToken: v.string(),
    tokenExpiresAt: v.number(),
    appKey: v.string(),
    appSecret: v.string(),
    webhookSecret: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.insert("providerConfigs", {
      userId: args.userId,
      organizationId: args.organizationId,
      provider: args.provider,
      accessToken: args.accessToken,
      tokenExpiresAt: args.tokenExpiresAt,
      appKey: args.appKey,
      appSecret: args.appSecret,
      webhookSecret: args.webhookSecret,
      lastSyncAt: Date.now(),
    });
    return null;
  },
});

export const listAllConfigs = internalQuery({
  args: {},
  returns: v.array(providerConfigShape),
  handler: async (ctx) => {
    return await ctx.db.query("providerConfigs").collect();
  },
});
