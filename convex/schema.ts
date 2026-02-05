import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

import { planValidator, providerValidator } from "./lib/validators";

export default defineSchema({
  users: defineTable({
    authId: v.string(),
    email: v.string(),
    name: v.optional(v.string()),
    plan: planValidator,
    createdAt: v.number(),
  })
    .index("by_authId", ["authId"])
    .index("by_email", ["email"]),

  rooms: defineTable({
    userId: v.id("users"),
    name: v.string(),
    createdAt: v.number(),
  }).index("by_userId", ["userId"]),

  devices: defineTable({
    userId: v.id("users"),
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
    intervalChangeAt: v.optional(v.number()),
    awaitingPostChangeReading: v.optional(v.boolean()),
    createdAt: v.number(),
  })
    .index("by_userId", ["userId"])
    .index("by_provider_and_providerDeviceId", ["provider", "providerDeviceId"]),

  readings: defineTable({
    deviceId: v.id("devices"),
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
    provider: providerValidator,
    accessToken: v.string(),
    tokenExpiresAt: v.number(),
    appKey: v.optional(v.string()),
    appSecret: v.optional(v.string()),
    webhookSecret: v.optional(v.string()),
    lastSyncAt: v.optional(v.number()),
  })
    .index("by_userId", ["userId"])
    .index("by_userId_and_provider", ["userId", "provider"]),

  embedTokens: defineTable({
    userId: v.id("users"),
    deviceId: v.id("devices"),
    token: v.string(),
    label: v.optional(v.string()),
    description: v.optional(v.string()),
    size: v.optional(v.union(v.literal("small"), v.literal("medium"), v.literal("large"))),
    isRevoked: v.boolean(),
    createdAt: v.number(),
  })
    .index("by_token", ["token"])
    .index("by_deviceId", ["deviceId"])
    .index("by_userId", ["userId"]),

  kioskConfigs: defineTable({
    userId: v.id("users"),
    token: v.string(),
    label: v.optional(v.string()),
    title: v.optional(v.string()),
    mode: v.union(v.literal("single"), v.literal("multi")),
    deviceIds: v.array(v.id("devices")),
    theme: v.union(v.literal("dark"), v.literal("light")),
    refreshInterval: v.number(),
    visibleMetrics: v.optional(v.array(v.string())),
    isRevoked: v.boolean(),
    createdAt: v.number(),
  })
    .index("by_token", ["token"])
    .index("by_userId", ["userId"]),

  deletedDevices: defineTable({
    userId: v.id("users"),
    provider: providerValidator,
    providerDeviceId: v.string(),
    deletedAt: v.number(),
  }).index("by_userId_and_provider_and_providerDeviceId", [
    "userId",
    "provider",
    "providerDeviceId",
  ]),
});
