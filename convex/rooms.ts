import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

const roomShape = v.object({
  _id: v.id("rooms"),
  _creationTime: v.number(),
  userId: v.id("users"),
  organizationId: v.optional(v.id("organizations")),
  name: v.string(),
  createdAt: v.number(),
});

export const create = mutation({
  args: {
    userId: v.id("users"),
    organizationId: v.id("organizations"),
    name: v.string(),
  },
  returns: v.id("rooms"),
  handler: async (ctx, args) => {
    return await ctx.db.insert("rooms", {
      userId: args.userId,
      organizationId: args.organizationId,
      name: args.name,
      createdAt: Date.now(),
    });
  },
});

export const list = query({
  args: {
    organizationId: v.id("organizations"),
  },
  returns: v.array(roomShape),
  handler: async (ctx, args) => {
    return await ctx.db
      .query("rooms")
      .withIndex("by_organizationId", (q) => q.eq("organizationId", args.organizationId))
      .order("desc")
      .collect();
  },
});

export const get = query({
  args: {
    roomId: v.id("rooms"),
  },
  returns: v.union(roomShape, v.null()),
  handler: async (ctx, args) => {
    const room = await ctx.db.get(args.roomId);
    return room ?? null;
  },
});

export const update = mutation({
  args: {
    roomId: v.id("rooms"),
    organizationId: v.id("organizations"),
    name: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const room = await ctx.db.get(args.roomId);
    if (!room || room.organizationId !== args.organizationId) {
      throw new Error("Room not found.");
    }

    await ctx.db.patch(args.roomId, { name: args.name });
    return null;
  },
});

export const remove = mutation({
  args: {
    roomId: v.id("rooms"),
    organizationId: v.id("organizations"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const room = await ctx.db.get(args.roomId);
    if (!room || room.organizationId !== args.organizationId) {
      throw new Error("Room not found.");
    }

    await ctx.db.delete(args.roomId);
    return null;
  },
});
