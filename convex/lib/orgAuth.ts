import { DatabaseReader } from "../_generated/server";
import { Id } from "../_generated/dataModel";
import { type Plan } from "./planLimits";

/**
 * Resolve the user's personal (or first) organization.
 * Used when no explicit organizationId is provided.
 */
export async function getPersonalOrg(
  db: DatabaseReader,
  userId: Id<"users">,
) {
  // Prefer the personal org
  const memberships = await db
    .query("orgMembers")
    .withIndex("by_userId", (q) => q.eq("userId", userId))
    .collect();

  for (const membership of memberships) {
    const org = await db.get(membership.organizationId);
    if (org?.isPersonal) {
      return org;
    }
  }

  // Fall back to any org
  if (memberships.length > 0) {
    const org = await db.get(memberships[0].organizationId);
    if (org) return org;
  }

  return null;
}

/**
 * Verify that a user is a member of the given organization.
 * Throws if the user is not a member.
 */
export async function requireOrgMembership(
  db: DatabaseReader,
  userId: Id<"users">,
  organizationId: Id<"organizations">,
) {
  const membership = await db
    .query("orgMembers")
    .withIndex("by_orgId_and_userId", (q) =>
      q.eq("organizationId", organizationId).eq("userId", userId),
    )
    .first();

  if (!membership) {
    throw new Error("You are not a member of this organization.");
  }

  return membership;
}

/**
 * Get the plan for an organization.
 * Replaces looking up user.plan — the plan now lives on the organization.
 */
export async function getOrgPlan(
  db: DatabaseReader,
  organizationId: Id<"organizations">,
): Promise<Plan> {
  const org = await db.get(organizationId);
  if (!org) {
    throw new Error("Organization not found.");
  }
  return org.plan as Plan;
}

/**
 * Get the organization document, throwing if not found.
 */
export async function getOrg(
  db: DatabaseReader,
  organizationId: Id<"organizations">,
) {
  const org = await db.get(organizationId);
  if (!org) {
    throw new Error("Organization not found.");
  }
  return org;
}
