import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

import { orgRoleValidator, planValidator, providerValidator } from "./lib/validators";

export default defineSchema({
  users: defineTable({
    authId: v.string(),
    email: v.string(),
    name: v.optional(v.string()),
    plan: v.optional(planValidator), // kept for backward compat; canonical plan lives on organizations
    createdAt: v.number(),
  })
    .index("by_authId", ["authId"])
    .index("by_email", ["email"]),

  organizations: defineTable({
    clerkOrgId: v.optional(v.string()), // Clerk organization ID (null for personal orgs created before Clerk Orgs)
    name: v.string(),
    plan: planValidator,
    isPersonal: v.boolean(), // true for auto-created single-user orgs
    createdAt: v.number(),
  })
    .index("by_clerkOrgId", ["clerkOrgId"]),

  orgMembers: defineTable({
    organizationId: v.id("organizations"),
    userId: v.id("users"),
    role: orgRoleValidator,
    joinedAt: v.number(),
  })
    .index("by_organizationId", ["organizationId"])
    .index("by_userId", ["userId"])
    .index("by_orgId_and_userId", ["organizationId", "userId"]),

  rooms: defineTable({
    userId: v.id("users"),
    organizationId: v.optional(v.id("organizations")),
    name: v.string(),
    createdAt: v.number(),
  })
    .index("by_userId", ["userId"])
    .index("by_organizationId", ["organizationId"]),

  devices: defineTable({
    userId: v.id("users"),
    organizationId: v.optional(v.id("organizations")),
    roomId: v.optional(v.id("rooms")),
    provider: providerValidator,
    providerDeviceId: v.string(),
    name: v.string(),
    model: v.optional(v.string()),
    timezone: v.optional(v.string()),
    lastReadingAt: v.optional(v.number()),
    lastBattery: v.optional(v.number()),
    providerOffline: v.optional(v.boolean()),
    hiddenMetrics: v.optional(v.array(v.string())),
    dashboardMetrics: v.optional(v.array(v.string())),
    primaryMetrics: v.optional(v.array(v.string())),   // max 2 - hero gauges
    secondaryMetrics: v.optional(v.array(v.string())), // max 6 - compact rows
    intervalChangeAt: v.optional(v.number()),
    awaitingPostChangeReading: v.optional(v.boolean()),
    reportInterval: v.optional(v.number()),
    createdAt: v.number(),
  })
    .index("by_userId", ["userId"])
    .index("by_organizationId", ["organizationId"])
    .index("by_provider_and_providerDeviceId", ["provider", "providerDeviceId"]),

  intervalChanges: defineTable({
    deviceId: v.id("devices"),
    previousInterval: v.number(),
    newInterval: v.number(),
    changedAt: v.number(),
  }).index("by_deviceId", ["deviceId"]),

  readings: defineTable({
    deviceId: v.id("devices"),
    deviceName: v.optional(v.string()),
    ts: v.number(),
    pm25: v.optional(v.number()),
    pm10: v.optional(v.number()),
    co2: v.optional(v.number()),
    tempC: v.optional(v.number()),
    rh: v.optional(v.number()),
    voc: v.optional(v.number()),
    pressure: v.optional(v.number()),
    battery: v.optional(v.number()),
    aqi: v.optional(v.number()),
  })
    .index("by_deviceId", ["deviceId"])
    .index("by_deviceId_and_ts", ["deviceId", "ts"]),

  providerConfigs: defineTable({
    userId: v.id("users"),
    organizationId: v.optional(v.id("organizations")),
    provider: providerValidator,
    accessToken: v.string(),
    tokenExpiresAt: v.number(),
    appKey: v.optional(v.string()),
    appSecret: v.optional(v.string()),
    webhookSecret: v.optional(v.string()),
    lastSyncAt: v.optional(v.number()),
  })
    .index("by_userId", ["userId"])
    .index("by_userId_and_provider", ["userId", "provider"])
    .index("by_organizationId", ["organizationId"])
    .index("by_organizationId_and_provider", ["organizationId", "provider"]),

  embedTokens: defineTable({
    userId: v.id("users"),
    organizationId: v.optional(v.id("organizations")),
    deviceId: v.id("devices"),
    token: v.string(),
    label: v.optional(v.string()),
    description: v.optional(v.string()),
    size: v.optional(v.union(v.literal("small"), v.literal("medium"), v.literal("large"))),
    refreshInterval: v.optional(v.number()), // in seconds
    // Branding (Pro+ plan)
    brandName: v.optional(v.string()),
    brandColor: v.optional(v.string()),
    logoStorageId: v.optional(v.id("_storage")),
    hideAirViewBranding: v.optional(v.boolean()),
    isRevoked: v.boolean(),
    createdAt: v.number(),
  })
    .index("by_token", ["token"])
    .index("by_deviceId", ["deviceId"])
    .index("by_userId", ["userId"])
    .index("by_organizationId", ["organizationId"]),

  kioskConfigs: defineTable({
    userId: v.id("users"),
    organizationId: v.optional(v.id("organizations")),
    token: v.string(),
    label: v.optional(v.string()),
    title: v.optional(v.string()),
    mode: v.union(v.literal("single"), v.literal("multi")),
    deviceIds: v.array(v.id("devices")),
    theme: v.union(v.literal("dark"), v.literal("light")),
    refreshInterval: v.number(),
    visibleMetrics: v.optional(v.array(v.string())),
    // Branding (Pro+ plan)
    brandName: v.optional(v.string()),
    brandColor: v.optional(v.string()),
    logoStorageId: v.optional(v.id("_storage")),
    hideAirViewBranding: v.optional(v.boolean()),
    isRevoked: v.boolean(),
    createdAt: v.number(),
  })
    .index("by_token", ["token"])
    .index("by_userId", ["userId"])
    .index("by_organizationId", ["organizationId"]),

  deletedDevices: defineTable({
    userId: v.id("users"),
    organizationId: v.optional(v.id("organizations")),
    provider: providerValidator,
    providerDeviceId: v.string(),
    deletedAt: v.number(),
  })
    .index("by_userId_and_provider_and_providerDeviceId", [
      "userId",
      "provider",
      "providerDeviceId",
    ])
    .index("by_organizationId_and_provider_and_providerDeviceId", [
      "organizationId",
      "provider",
      "providerDeviceId",
    ])
    .index("by_provider_and_providerDeviceId", ["provider", "providerDeviceId"]),
});
