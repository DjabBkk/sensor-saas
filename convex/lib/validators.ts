import { v } from "convex/values";

export const providerValidator = v.union(
  v.literal("qingping"),
  v.literal("purpleair"),
  v.literal("iqair"),
  v.literal("temtop"),
);

export const planValidator = v.union(
  v.literal("starter"),
  v.literal("pro"),
  v.literal("business"),
  v.literal("custom"),
);

export const orgRoleValidator = v.union(
  v.literal("owner"),
  v.literal("admin"),
  v.literal("member"),
);
