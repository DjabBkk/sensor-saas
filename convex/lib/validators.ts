import { v } from "convex/values";

export const providerValidator = v.union(
  v.literal("qingping"),
  v.literal("purpleair"),
  v.literal("iqair"),
  v.literal("temtop"),
);

export const planValidator = v.union(
  v.literal("free"),
  v.literal("basic"),
  v.literal("pro"),
  v.literal("team"),
);
