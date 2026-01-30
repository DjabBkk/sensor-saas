import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

const roomShape = v.object({
  _id: v.id("rooms"),
  _creationTime: v.number(),
  userId: v.id("users"),
  name: v.string(),
  createdAt: v.number(),
});

export const create = mutation({
  args: {
    userId: v.id("users"),
    name: v.string(),
  },
  returns: v.id("rooms"),
  handler: async (ctx, args) => {
    return await ctx.db.insert("rooms", {
      userId: args.userId,
      name: args.name,
      createdAt: Date.now(),
    });
  },
});

export const list = query({
  args: {
    userId: v.id("users"),
  },
  returns: v.array(roomShape),
  handler: async (ctx, args) => {
    return await ctx.db
      .query("rooms")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
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
    userId: v.id("users"),
    name: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const room = await ctx.db.get(args.roomId);
    if (!room || room.userId !== args.userId) {
      throw new Error("Room not found.");
    }

    await ctx.db.patch(args.roomId, { name: args.name });
    return null;
  },
});

export const remove = mutation({
  args: {
    roomId: v.id("rooms"),
    userId: v.id("users"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const room = await ctx.db.get(args.roomId);
    if (!room || room.userId !== args.userId) {
      throw new Error("Room not found.");
    }

    await ctx.db.delete(args.roomId);
    return null;
  },
});
