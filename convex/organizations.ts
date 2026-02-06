import { query, mutation, internalMutation, internalQuery } from "./_generated/server";
import { v } from "convex/values";
import { orgRoleValidator, planValidator } from "./lib/validators";

/**
 * Get or create an organization from a Clerk organization ID.
 * Called when a user accesses an org for the first time.
 */
export const getOrCreateFromClerk = mutation({
  args: {
    clerkOrgId: v.string(),
    name: v.string(),
    ownerUserId: v.id("users"),
  },
  returns: v.id("organizations"),
  handler: async (ctx, args) => {
    // Check if org already exists
    const existing = await ctx.db
      .query("organizations")
      .withIndex("by_clerkOrgId", (q) => q.eq("clerkOrgId", args.clerkOrgId))
      .first();

    if (existing) {
      // Ensure the user is a member
      const membership = await ctx.db
        .query("orgMembers")
        .withIndex("by_orgId_and_userId", (q) =>
          q.eq("organizationId", existing._id).eq("userId", args.ownerUserId),
        )
        .first();

      if (!membership) {
        await ctx.db.insert("orgMembers", {
          organizationId: existing._id,
          userId: args.ownerUserId,
          role: "member",
          joinedAt: Date.now(),
        });
      }

      return existing._id;
    }

    // Create new organization
    const orgId = await ctx.db.insert("organizations", {
      clerkOrgId: args.clerkOrgId,
      name: args.name,
      plan: "starter",
      isPersonal: false,
      createdAt: Date.now(),
    });

    // Add owner as first member
    await ctx.db.insert("orgMembers", {
      organizationId: orgId,
      userId: args.ownerUserId,
      role: "owner",
      joinedAt: Date.now(),
    });

    return orgId;
  },
});

/**
 * Create a personal organization for a user.
 * Called during user signup to create their default workspace.
 */
export const createPersonalOrg = internalMutation({
  args: {
    userId: v.id("users"),
    name: v.string(),
    plan: planValidator,
  },
  returns: v.id("organizations"),
  handler: async (ctx, args) => {
    const orgId = await ctx.db.insert("organizations", {
      name: args.name,
      plan: args.plan,
      isPersonal: true,
      createdAt: Date.now(),
    });

    await ctx.db.insert("orgMembers", {
      organizationId: orgId,
      userId: args.userId,
      role: "owner",
      joinedAt: Date.now(),
    });

    return orgId;
  },
});

/**
 * Get an organization by Clerk org ID.
 */
export const getByClerkOrgId = query({
  args: {
    clerkOrgId: v.string(),
  },
  returns: v.union(
    v.null(),
    v.object({
      _id: v.id("organizations"),
      _creationTime: v.number(),
      clerkOrgId: v.optional(v.string()),
      name: v.string(),
      plan: planValidator,
      isPersonal: v.boolean(),
      createdAt: v.number(),
    }),
  ),
  handler: async (ctx, args) => {
    const org = await ctx.db
      .query("organizations")
      .withIndex("by_clerkOrgId", (q) => q.eq("clerkOrgId", args.clerkOrgId))
      .first();
    return org ?? null;
  },
});

/**
 * Get all organizations the user belongs to.
 */
export const getForUser = query({
  args: {
    userId: v.id("users"),
  },
  returns: v.array(
    v.object({
      _id: v.id("organizations"),
      _creationTime: v.number(),
      clerkOrgId: v.optional(v.string()),
      name: v.string(),
      plan: planValidator,
      isPersonal: v.boolean(),
      createdAt: v.number(),
      role: orgRoleValidator,
    }),
  ),
  handler: async (ctx, args) => {
    const memberships = await ctx.db
      .query("orgMembers")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .collect();

    const orgs = [];
    for (const membership of memberships) {
      const org = await ctx.db.get(membership.organizationId);
      if (org) {
        orgs.push({
          ...org,
          role: membership.role,
        });
      }
    }

    return orgs;
  },
});

/**
 * Internal query to get the user's personal organization.
 */
export const getPersonalOrgForUser = internalQuery({
  args: {
    userId: v.id("users"),
  },
  returns: v.union(
    v.null(),
    v.object({
      _id: v.id("organizations"),
      plan: planValidator,
    }),
  ),
  handler: async (ctx, args) => {
    const memberships = await ctx.db
      .query("orgMembers")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .collect();

    for (const membership of memberships) {
      const org = await ctx.db.get(membership.organizationId);
      if (org?.isPersonal) {
        return { _id: org._id, plan: org.plan };
      }
    }

    return null;
  },
});

/**
 * List all members of an organization.
 */
export const listMembers = query({
  args: {
    organizationId: v.id("organizations"),
  },
  returns: v.array(
    v.object({
      _id: v.id("orgMembers"),
      userId: v.id("users"),
      role: orgRoleValidator,
      joinedAt: v.number(),
      email: v.string(),
      name: v.optional(v.string()),
    }),
  ),
  handler: async (ctx, args) => {
    const memberships = await ctx.db
      .query("orgMembers")
      .withIndex("by_organizationId", (q) =>
        q.eq("organizationId", args.organizationId),
      )
      .collect();

    const members = [];
    for (const membership of memberships) {
      const user = await ctx.db.get(membership.userId);
      if (user) {
        members.push({
          _id: membership._id,
          userId: membership.userId,
          role: membership.role,
          joinedAt: membership.joinedAt,
          email: user.email,
          name: user.name,
        });
      }
    }

    return members;
  },
});

/**
 * Add a member to an organization.
 */
export const addMember = mutation({
  args: {
    organizationId: v.id("organizations"),
    userId: v.id("users"),
    role: orgRoleValidator,
  },
  returns: v.id("orgMembers"),
  handler: async (ctx, args) => {
    // Check if already a member
    const existing = await ctx.db
      .query("orgMembers")
      .withIndex("by_orgId_and_userId", (q) =>
        q.eq("organizationId", args.organizationId).eq("userId", args.userId),
      )
      .first();

    if (existing) {
      throw new Error("User is already a member of this organization.");
    }

    return await ctx.db.insert("orgMembers", {
      organizationId: args.organizationId,
      userId: args.userId,
      role: args.role,
      joinedAt: Date.now(),
    });
  },
});

/**
 * Remove a member from an organization.
 */
export const removeMember = mutation({
  args: {
    organizationId: v.id("organizations"),
    userId: v.id("users"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const membership = await ctx.db
      .query("orgMembers")
      .withIndex("by_orgId_and_userId", (q) =>
        q.eq("organizationId", args.organizationId).eq("userId", args.userId),
      )
      .first();

    if (!membership) {
      throw new Error("User is not a member of this organization.");
    }

    if (membership.role === "owner") {
      // Check if there are other owners
      const allMembers = await ctx.db
        .query("orgMembers")
        .withIndex("by_organizationId", (q) =>
          q.eq("organizationId", args.organizationId),
        )
        .collect();
      const owners = allMembers.filter((m) => m.role === "owner");
      if (owners.length <= 1) {
        throw new Error("Cannot remove the only owner of an organization.");
      }
    }

    await ctx.db.delete(membership._id);
    return null;
  },
});

/**
 * Update an organization's plan.
 * Replaces the old debugSetPlan on users.
 */
export const updatePlan = mutation({
  args: {
    organizationId: v.id("organizations"),
    plan: planValidator,
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const org = await ctx.db.get(args.organizationId);
    if (!org) {
      throw new Error("Organization not found.");
    }
    await ctx.db.patch(args.organizationId, { plan: args.plan });
    return null;
  },
});

/**
 * Debug-only mutation to switch org plans for testing.
 * Restricted to organizations owned by karlvonluckwald@gmail.com.
 */
export const debugSetOrgPlan = mutation({
  args: {
    organizationId: v.id("organizations"),
    plan: planValidator,
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    // Find the owner of this org
    const members = await ctx.db
      .query("orgMembers")
      .withIndex("by_organizationId", (q) =>
        q.eq("organizationId", args.organizationId),
      )
      .collect();

    const ownerMember = members.find((m) => m.role === "owner");
    if (!ownerMember) {
      throw new Error("Organization has no owner.");
    }

    const owner = await ctx.db.get(ownerMember.userId);
    if (!owner || owner.email !== "karlvonluckwald@gmail.com") {
      throw new Error("Debug plan switching is not available for this organization.");
    }

    await ctx.db.patch(args.organizationId, { plan: args.plan });
    return null;
  },
});

/**
 * Internal query to get org by ID (for use in actions).
 */
export const getInternal = internalQuery({
  args: { organizationId: v.id("organizations") },
  returns: v.union(
    v.null(),
    v.object({
      _id: v.id("organizations"),
      plan: planValidator,
      name: v.string(),
      isPersonal: v.boolean(),
    }),
  ),
  handler: async (ctx, args) => {
    const org = await ctx.db.get(args.organizationId);
    if (!org) return null;
    return {
      _id: org._id,
      plan: org.plan,
      name: org.name,
      isPersonal: org.isPersonal,
    };
  },
});
