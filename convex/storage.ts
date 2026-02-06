import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getPlanLimits } from "./lib/planLimits";
import { getOrgPlan } from "./lib/orgAuth";

/**
 * Generate a presigned upload URL for logo files.
 * Requires that the organization's plan allows custom branding.
 */
export const generateUploadUrl = mutation({
  args: {
    organizationId: v.id("organizations"),
  },
  returns: v.string(),
  handler: async (ctx, args) => {
    const plan = await getOrgPlan(ctx.db, args.organizationId);
    const limits = getPlanLimits(plan);
    if (!limits.customBranding) {
      throw new Error(
        `Custom branding is not available on your ${plan} plan. Upgrade to Pro or higher.`,
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
