import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getPlanLimits } from "./lib/planLimits";

/**
 * Generate a presigned upload URL for logo files.
 * Requires that the user's plan allows custom branding.
 */
export const generateUploadUrl = mutation({
  args: {
    userId: v.id("users"),
  },
  returns: v.string(),
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) {
      throw new Error("User not found.");
    }

    const limits = getPlanLimits(user.plan);
    if (!limits.customBranding) {
      throw new Error(
        `Custom branding is not available on your ${user.plan} plan. Upgrade to Pro or higher.`,
      );
    }

    return await ctx.storage.generateUploadUrl();
  },
});

/**
 * Resolve a Convex storage ID to a public URL.
 */
export const getLogoUrl = query({
  args: {
    storageId: v.id("_storage"),
  },
  returns: v.union(v.string(), v.null()),
  handler: async (ctx, args) => {
    return await ctx.storage.getUrl(args.storageId);
  },
});
