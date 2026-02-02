import { query, mutation, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { planValidator } from "./lib/validators";

/**
 * Get or create a user in Convex based on Clerk auth ID.
 * Called when user first logs in to sync Clerk user to Convex.
 * 
 * This handles the case where a user deletes their Clerk account and re-signs up
 * with the same email - we transfer ownership to the new authId.
 */
export const getOrCreateUser = mutation({
  args: {
    authId: v.string(),
    email: v.string(),
    name: v.optional(v.string()),
  },
  returns: v.id("users"),
  handler: async (ctx, args) => {
    // First, check if user already exists by authId
    const existingByAuthId = await ctx.db
      .query("users")
      .withIndex("by_authId", (q) => q.eq("authId", args.authId))
      .first();

    if (existingByAuthId) {
      // Update email and name if they changed
      if (existingByAuthId.email !== args.email || existingByAuthId.name !== args.name) {
        await ctx.db.patch(existingByAuthId._id, {
          email: args.email,
          name: args.name,
        });
      }
      return existingByAuthId._id;
    }

    // Check if user exists by email (handles re-signup with same email)
    const existingByEmail = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();

    if (existingByEmail) {
      // User re-signed up with same email but new Clerk authId
      // Transfer ownership to new authId
      await ctx.db.patch(existingByEmail._id, {
        authId: args.authId,
        name: args.name,
      });
      return existingByEmail._id;
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
      _creationTime: v.number(),
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
  returns: v.object({
    devicesDeleted: v.number(),
    readingsDeleted: v.number(),
    roomsDeleted: v.number(),
    providerConfigsDeleted: v.number(),
    embedTokensDeleted: v.number(),
    kioskConfigsDeleted: v.number(),
    userDeleted: v.boolean(),
  }),
  handler: async (ctx, args) => {
    // Verify user exists
    const user = await ctx.db.get(args.userId);
    if (!user) {
      throw new Error("User not found");
    }

    let devicesDeleted = 0;
    let readingsDeleted = 0;
    let roomsDeleted = 0;
    let providerConfigsDeleted = 0;
    let embedTokensDeleted = 0;
    let kioskConfigsDeleted = 0;

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
        readingsDeleted += 1;
      }

      // Delete the device
      await ctx.db.delete(device._id);
      devicesDeleted += 1;
    }

    // Delete all rooms
    const rooms = await ctx.db
      .query("rooms")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .collect();

    for (const room of rooms) {
      await ctx.db.delete(room._id);
      roomsDeleted += 1;
    }

    // Delete all provider configs
    const providerConfigs = await ctx.db
      .query("providerConfigs")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .collect();

    for (const config of providerConfigs) {
      await ctx.db.delete(config._id);
      providerConfigsDeleted += 1;
    }

    // Delete all embed tokens
    const embedTokens = await ctx.db
      .query("embedTokens")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .collect();

    for (const token of embedTokens) {
      await ctx.db.delete(token._id);
      embedTokensDeleted += 1;
    }

    // Delete all kiosk configs
    const kioskConfigs = await ctx.db
      .query("kioskConfigs")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .collect();

    for (const config of kioskConfigs) {
      await ctx.db.delete(config._id);
      kioskConfigsDeleted += 1;
    }

    const deletedDevices = await ctx.db
      .query("deletedDevices")
      .withIndex("by_userId_and_provider_and_providerDeviceId", (q) =>
        q.eq("userId", args.userId),
      )
      .collect();

    for (const deleted of deletedDevices) {
      await ctx.db.delete(deleted._id);
    }

    // Finally, delete the user
    await ctx.db.delete(args.userId);

    const remainingUser = await ctx.db.get(args.userId);
    if (remainingUser) {
      throw new Error("Failed to delete user");
    }

    return {
      devicesDeleted,
      readingsDeleted,
      roomsDeleted,
      providerConfigsDeleted,
      embedTokensDeleted,
      kioskConfigsDeleted,
      userDeleted: true,
    };
  },
});

/**
 * Merge duplicate users with the same email.
 * Keeps the user with the most recent authId and transfers all data from duplicates.
 * Internal mutation - call from dashboard or via npx convex run.
 */
export const mergeDuplicateUsers = internalMutation({
  args: {
    email: v.string(),
    keepUserId: v.id("users"),
  },
  returns: v.object({
    usersDeleted: v.number(),
    devicesTransferred: v.number(),
    roomsTransferred: v.number(),
    providerConfigsTransferred: v.number(),
    embedTokensTransferred: v.number(),
    kioskConfigsTransferred: v.number(),
  }),
  handler: async (ctx, args) => {
    // Find all users with this email
    const users = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .collect();

    if (users.length <= 1) {
      return {
        usersDeleted: 0,
        devicesTransferred: 0,
        roomsTransferred: 0,
        providerConfigsTransferred: 0,
        embedTokensTransferred: 0,
        kioskConfigsTransferred: 0,
      };
    }

    // Verify the keepUserId exists in the list
    const keepUser = users.find((u) => u._id === args.keepUserId);
    if (!keepUser) {
      throw new Error("keepUserId not found among users with this email");
    }

    let usersDeleted = 0;
    let devicesTransferred = 0;
    let roomsTransferred = 0;
    let providerConfigsTransferred = 0;
    let embedTokensTransferred = 0;
    let kioskConfigsTransferred = 0;

    // Process each duplicate user
    for (const user of users) {
      if (user._id === args.keepUserId) continue;

      // Transfer devices
      const devices = await ctx.db
        .query("devices")
        .withIndex("by_userId", (q) => q.eq("userId", user._id))
        .collect();
      for (const device of devices) {
        await ctx.db.patch(device._id, { userId: args.keepUserId });
        devicesTransferred += 1;
      }

      // Transfer rooms
      const rooms = await ctx.db
        .query("rooms")
        .withIndex("by_userId", (q) => q.eq("userId", user._id))
        .collect();
      for (const room of rooms) {
        await ctx.db.patch(room._id, { userId: args.keepUserId });
        roomsTransferred += 1;
      }

      // Transfer provider configs (delete duplicates if they exist for keepUser)
      const providerConfigs = await ctx.db
        .query("providerConfigs")
        .withIndex("by_userId", (q) => q.eq("userId", user._id))
        .collect();
      for (const config of providerConfigs) {
        // Check if keepUser already has this provider
        const existing = await ctx.db
          .query("providerConfigs")
          .withIndex("by_userId_and_provider", (q) =>
            q.eq("userId", args.keepUserId).eq("provider", config.provider),
          )
          .first();
        if (existing) {
          // Delete the old one, keep the new user's config
          await ctx.db.delete(config._id);
        } else {
          await ctx.db.patch(config._id, { userId: args.keepUserId });
        }
        providerConfigsTransferred += 1;
      }

      // Transfer embed tokens
      const embedTokens = await ctx.db
        .query("embedTokens")
        .withIndex("by_userId", (q) => q.eq("userId", user._id))
        .collect();
      for (const token of embedTokens) {
        await ctx.db.patch(token._id, { userId: args.keepUserId });
        embedTokensTransferred += 1;
      }

      // Transfer kiosk configs
      const kioskConfigs = await ctx.db
        .query("kioskConfigs")
        .withIndex("by_userId", (q) => q.eq("userId", user._id))
        .collect();
      for (const config of kioskConfigs) {
        await ctx.db.patch(config._id, { userId: args.keepUserId });
        kioskConfigsTransferred += 1;
      }

      // Delete the duplicate user
      await ctx.db.delete(user._id);
      usersDeleted += 1;
    }

    return {
      usersDeleted,
      devicesTransferred,
      roomsTransferred,
      providerConfigsTransferred,
      embedTokensTransferred,
      kioskConfigsTransferred,
    };
  },
});
