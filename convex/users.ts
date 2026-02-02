import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { planValidator } from "./lib/validators";

/**
 * Get or create a user in Convex based on Clerk auth ID.
 * Called when user first logs in to sync Clerk user to Convex.
 */
export const getOrCreateUser = mutation({
  args: {
    authId: v.string(),
    email: v.string(),
    name: v.optional(v.string()),
  },
  returns: v.id("users"),
  handler: async (ctx, args) => {
    // Check if user already exists
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_authId", (q) => q.eq("authId", args.authId))
      .first();

    if (existingUser) {
      return existingUser._id;
    }

    // Create new user with free plan by default
    const userId = await ctx.db.insert("users", {
      authId: args.authId,
      email: args.email,
      name: args.name,
      plan: "free",
      createdAt: Date.now(),
    });

    return userId;
  },
});

/**
 * Get current user by Clerk auth ID.
 */
export const getCurrentUser = query({
  args: {
    authId: v.string(),
  },
  returns: v.union(
    v.null(),
    v.object({
      _id: v.id("users"),
      authId: v.string(),
      email: v.string(),
      name: v.optional(v.string()),
      plan: planValidator,
      createdAt: v.number(),
    }),
  ),
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_authId", (q) => q.eq("authId", args.authId))
      .first();

    return user ?? null;
  },
});

/**
 * Delete user and all associated data.
 * This will delete:
 * - All devices and their readings
 * - All rooms
 * - All provider configs
 * - All embed tokens
 * - All kiosk configs
 */
export const deleteUser = mutation({
  args: {
    userId: v.id("users"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    // Verify user exists
    const user = await ctx.db.get(args.userId);
    if (!user) {
      throw new Error("User not found");
    }

    // Delete all devices and their readings
    const devices = await ctx.db
      .query("devices")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .collect();

    for (const device of devices) {
      // Delete all readings for this device
      const readings = await ctx.db
        .query("readings")
        .withIndex("by_deviceId", (q) => q.eq("deviceId", device._id))
        .collect();

      for (const reading of readings) {
        await ctx.db.delete(reading._id);
      }

      // Delete the device
      await ctx.db.delete(device._id);
    }

    // Delete all rooms
    const rooms = await ctx.db
      .query("rooms")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .collect();

    for (const room of rooms) {
      await ctx.db.delete(room._id);
    }

    // Delete all provider configs
    const providerConfigs = await ctx.db
      .query("providerConfigs")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .collect();

    for (const config of providerConfigs) {
      await ctx.db.delete(config._id);
    }

    // Delete all embed tokens
    const embedTokens = await ctx.db
      .query("embedTokens")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .collect();

    for (const token of embedTokens) {
      await ctx.db.delete(token._id);
    }

    // Delete all kiosk configs
    const kioskConfigs = await ctx.db
      .query("kioskConfigs")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .collect();

    for (const config of kioskConfigs) {
      await ctx.db.delete(config._id);
    }

    // Finally, delete the user
    await ctx.db.delete(args.userId);

    return null;
  },
});
