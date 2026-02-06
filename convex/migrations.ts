import { internalMutation } from "./_generated/server";
import { v } from "convex/values";
import type { Plan } from "./lib/planLimits";

/**
 * One-time migration: create personal organizations for all existing users
 * and backfill organizationId on all their data.
 *
 * Run via: npx convex run migrations:migrateToOrganizations
 *
 * This is idempotent — running it again will skip users who already have an org.
 */
export const migrateToOrganizations = internalMutation({
  args: {},
  returns: v.object({
    usersProcessed: v.number(),
    orgsCreated: v.number(),
    devicesUpdated: v.number(),
    roomsUpdated: v.number(),
    embedTokensUpdated: v.number(),
    kioskConfigsUpdated: v.number(),
    providerConfigsUpdated: v.number(),
    deletedDevicesUpdated: v.number(),
  }),
  handler: async (ctx) => {
    const users = await ctx.db.query("users").collect();

    let usersProcessed = 0;
    let orgsCreated = 0;
    let devicesUpdated = 0;
    let roomsUpdated = 0;
    let embedTokensUpdated = 0;
    let kioskConfigsUpdated = 0;
    let providerConfigsUpdated = 0;
    let deletedDevicesUpdated = 0;

    for (const user of users) {
      // Check if user already has a personal org (idempotent)
      const existingMemberships = await ctx.db
        .query("orgMembers")
        .withIndex("by_userId", (q) => q.eq("userId", user._id))
        .collect();

      let orgId;
      const hasPersonalOrg = await (async () => {
        for (const membership of existingMemberships) {
          const org = await ctx.db.get(membership.organizationId);
          if (org?.isPersonal) {
            orgId = org._id;
            return true;
          }
        }
        return false;
      })();

      if (!hasPersonalOrg) {
        // Create personal organization
        const plan = (user.plan ?? "starter") as Plan;
        const orgName = user.name
          ? `${user.name}'s workspace`
          : `${user.email}'s workspace`;

        orgId = await ctx.db.insert("organizations", {
          name: orgName,
          plan,
          isPersonal: true,
          createdAt: user.createdAt,
        });

        await ctx.db.insert("orgMembers", {
          organizationId: orgId,
          userId: user._id,
          role: "owner",
          joinedAt: user.createdAt,
        });

        orgsCreated++;
      }

      if (!orgId) {
        console.warn(`[migration] No orgId for user ${user._id}, skipping data backfill`);
        continue;
      }

      // Backfill devices
      const devices = await ctx.db
        .query("devices")
        .withIndex("by_userId", (q) => q.eq("userId", user._id))
        .collect();
      for (const device of devices) {
        if (!device.organizationId) {
          await ctx.db.patch(device._id, { organizationId: orgId });
          devicesUpdated++;
        }
      }

      // Backfill rooms
      const rooms = await ctx.db
        .query("rooms")
        .withIndex("by_userId", (q) => q.eq("userId", user._id))
        .collect();
      for (const room of rooms) {
        if (!room.organizationId) {
          await ctx.db.patch(room._id, { organizationId: orgId });
          roomsUpdated++;
        }
      }

      // Backfill embed tokens
      const embedTokens = await ctx.db
        .query("embedTokens")
        .withIndex("by_userId", (q) => q.eq("userId", user._id))
        .collect();
      for (const token of embedTokens) {
        if (!token.organizationId) {
          await ctx.db.patch(token._id, { organizationId: orgId });
          embedTokensUpdated++;
        }
      }

      // Backfill kiosk configs
      const kioskConfigs = await ctx.db
        .query("kioskConfigs")
        .withIndex("by_userId", (q) => q.eq("userId", user._id))
        .collect();
      for (const config of kioskConfigs) {
        if (!config.organizationId) {
          await ctx.db.patch(config._id, { organizationId: orgId });
          kioskConfigsUpdated++;
        }
      }

      // Backfill provider configs
      const providerConfigs = await ctx.db
        .query("providerConfigs")
        .withIndex("by_userId", (q) => q.eq("userId", user._id))
        .collect();
      for (const config of providerConfigs) {
        if (!config.organizationId) {
          await ctx.db.patch(config._id, { organizationId: orgId });
          providerConfigsUpdated++;
        }
      }

      // Backfill deleted devices
      const deletedDevices = await ctx.db
        .query("deletedDevices")
        .withIndex("by_userId_and_provider_and_providerDeviceId", (q) =>
          q.eq("userId", user._id),
        )
        .collect();
      for (const deleted of deletedDevices) {
        if (!deleted.organizationId) {
          await ctx.db.patch(deleted._id, { organizationId: orgId });
          deletedDevicesUpdated++;
        }
      }

      usersProcessed++;
    }

    console.log(
      `[migration] Done. Users: ${usersProcessed}, Orgs created: ${orgsCreated}, ` +
      `Devices: ${devicesUpdated}, Rooms: ${roomsUpdated}, ` +
      `EmbedTokens: ${embedTokensUpdated}, KioskConfigs: ${kioskConfigsUpdated}, ` +
      `ProviderConfigs: ${providerConfigsUpdated}, DeletedDevices: ${deletedDevicesUpdated}`,
    );

    return {
      usersProcessed,
      orgsCreated,
      devicesUpdated,
      roomsUpdated,
      embedTokensUpdated,
      kioskConfigsUpdated,
      providerConfigsUpdated,
      deletedDevicesUpdated,
    };
  },
});
