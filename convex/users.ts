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
    v.object({
      _id: v.id("users"),
      authId: v.string(),
      email: v.string(),
      name: v.optional(v.string()),
      plan: planValidator,
      createdAt: v.number(),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_authId", (q) => q.eq("authId", args.authId))
      .first();

    return user ?? null;
  },
});
