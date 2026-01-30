/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type { FunctionReference } from "convex/server";
import type { GenericId as Id } from "convex/values";

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: {
  devices: {
    get: FunctionReference<
      "query",
      "public",
      { deviceId: Id<"devices"> },
      null | {
        _creationTime: number;
        _id: Id<"devices">;
        createdAt: number;
        lastReadingAt?: number;
        model?: string;
        name: string;
        provider: "qingping" | "purpleair" | "iqair" | "temtop";
        providerDeviceId: string;
        roomId?: Id<"rooms">;
        timezone?: string;
        userId: Id<"users">;
      }
    >;
    list: FunctionReference<
      "query",
      "public",
      { userId: Id<"users"> },
      Array<{
        _creationTime: number;
        _id: Id<"devices">;
        createdAt: number;
        lastReadingAt?: number;
        model?: string;
        name: string;
        provider: "qingping" | "purpleair" | "iqair" | "temtop";
        providerDeviceId: string;
        roomId?: Id<"rooms">;
        timezone?: string;
        userId: Id<"users">;
      }>
    >;
    rename: FunctionReference<
      "mutation",
      "public",
      { deviceId: Id<"devices">; name: string },
      null
    >;
    updateRoom: FunctionReference<
      "mutation",
      "public",
      { deviceId: Id<"devices">; roomId?: Id<"rooms"> },
      null
    >;
  };
  providers: {
    connect: FunctionReference<
      "mutation",
      "public",
      {
        appKey: string;
        appSecret: string;
        provider: "qingping" | "purpleair" | "iqair" | "temtop";
        userId: Id<"users">;
        webhookSecret?: string;
      },
      null
    >;
  };
  readings: {
    history: FunctionReference<
      "query",
      "public",
      {
        deviceId: Id<"devices">;
        endTs?: number;
        limit?: number;
        startTs?: number;
      },
      Array<{
        _creationTime: number;
        _id: Id<"readings">;
        aqi?: number;
        battery?: number;
        co2?: number;
        deviceId: Id<"devices">;
        pm10?: number;
        pm25?: number;
        pressure?: number;
        rh?: number;
        tempC?: number;
        ts: number;
        voc?: number;
      }>
    >;
    latest: FunctionReference<
      "query",
      "public",
      { deviceId: Id<"devices"> },
      null | {
        _creationTime: number;
        _id: Id<"readings">;
        aqi?: number;
        battery?: number;
        co2?: number;
        deviceId: Id<"devices">;
        pm10?: number;
        pm25?: number;
        pressure?: number;
        rh?: number;
        tempC?: number;
        ts: number;
        voc?: number;
      }
    >;
  };
  rooms: {
    create: FunctionReference<
      "mutation",
      "public",
      { name: string; userId: Id<"users"> },
      Id<"rooms">
    >;
    get: FunctionReference<
      "query",
      "public",
      { roomId: Id<"rooms"> },
      {
        _creationTime: number;
        _id: Id<"rooms">;
        createdAt: number;
        name: string;
        userId: Id<"users">;
      } | null
    >;
    list: FunctionReference<
      "query",
      "public",
      { userId: Id<"users"> },
      Array<{
        _creationTime: number;
        _id: Id<"rooms">;
        createdAt: number;
        name: string;
        userId: Id<"users">;
      }>
    >;
    remove: FunctionReference<
      "mutation",
      "public",
      { roomId: Id<"rooms">; userId: Id<"users"> },
      null
    >;
    update: FunctionReference<
      "mutation",
      "public",
      { name: string; roomId: Id<"rooms">; userId: Id<"users"> },
      null
    >;
  };
  users: {
    getCurrentUser: FunctionReference<
      "query",
      "public",
      { authId: string },
      {
        _id: Id<"users">;
        authId: string;
        createdAt: number;
        email: string;
        name?: string;
        plan: "free" | "basic" | "pro" | "team";
      } | null
    >;
    getOrCreateUser: FunctionReference<
      "mutation",
      "public",
      { authId: string; email: string; name?: string },
      Id<"users">
    >;
  };
};

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: {
  devices: {
    getByProviderDeviceId: FunctionReference<
      "query",
      "internal",
      {
        provider: "qingping" | "purpleair" | "iqair" | "temtop";
        providerDeviceId: string;
      },
      null | { _id: Id<"devices">; userId: Id<"users"> }
    >;
    upsertFromProvider: FunctionReference<
      "mutation",
      "internal",
      {
        model?: string;
        name: string;
        provider: "qingping" | "purpleair" | "iqair" | "temtop";
        providerDeviceId: string;
        timezone?: string;
        userId: Id<"users">;
      },
      Id<"devices">
    >;
  };
  providers: {
    getConfig: FunctionReference<
      "query",
      "internal",
      {
        provider: "qingping" | "purpleair" | "iqair" | "temtop";
        userId: Id<"users">;
      },
      null | {
        _creationTime: number;
        _id: Id<"providerConfigs">;
        accessToken: string;
        appKey?: string;
        appSecret?: string;
        lastSyncAt?: number;
        provider: "qingping" | "purpleair" | "iqair" | "temtop";
        tokenExpiresAt: number;
        userId: Id<"users">;
        webhookSecret?: string;
      }
    >;
    insertConfig: FunctionReference<
      "mutation",
      "internal",
      {
        accessToken: string;
        appKey: string;
        appSecret: string;
        provider: "qingping" | "purpleair" | "iqair" | "temtop";
        tokenExpiresAt: number;
        userId: Id<"users">;
        webhookSecret?: string;
      },
      null
    >;
    listAllConfigs: FunctionReference<
      "query",
      "internal",
      {},
      Array<{
        _creationTime: number;
        _id: Id<"providerConfigs">;
        accessToken: string;
        appKey?: string;
        appSecret?: string;
        lastSyncAt?: number;
        provider: "qingping" | "purpleair" | "iqair" | "temtop";
        tokenExpiresAt: number;
        userId: Id<"users">;
        webhookSecret?: string;
      }>
    >;
    updateConfig: FunctionReference<
      "mutation",
      "internal",
      {
        accessToken: string;
        appKey: string;
        appSecret: string;
        configId: Id<"providerConfigs">;
        tokenExpiresAt: number;
        webhookSecret?: string;
      },
      null
    >;
    updateLastSync: FunctionReference<
      "mutation",
      "internal",
      { providerConfigId: Id<"providerConfigs"> },
      null
    >;
    updateToken: FunctionReference<
      "mutation",
      "internal",
      {
        accessToken: string;
        providerConfigId: Id<"providerConfigs">;
        tokenExpiresAt: number;
      },
      null
    >;
  };
  providersActions: {
    connectAndSync: FunctionReference<
      "action",
      "internal",
      {
        appKey: string;
        appSecret: string;
        provider: "qingping" | "purpleair" | "iqair" | "temtop";
        userId: Id<"users">;
        webhookSecret?: string;
      },
      null
    >;
    fetchAccessToken: FunctionReference<
      "action",
      "internal",
      { appKey: string; appSecret: string },
      { accessToken: string; tokenExpiresAt: number }
    >;
    pollAllReadings: FunctionReference<"action", "internal", {}, null>;
    refreshExpiringTokens: FunctionReference<"action", "internal", {}, null>;
    syncDevicesForUser: FunctionReference<
      "action",
      "internal",
      {
        provider: "qingping" | "purpleair" | "iqair" | "temtop";
        userId: Id<"users">;
      },
      null
    >;
  };
  readings: {
    ingest: FunctionReference<
      "mutation",
      "internal",
      {
        aqi?: number;
        battery?: number;
        co2?: number;
        deviceId: Id<"devices">;
        pm10?: number;
        pm25?: number;
        pressure?: number;
        rh?: number;
        tempC?: number;
        ts: number;
        voc?: number;
      },
      Id<"readings">
    >;
  };
};

export declare const components: {};
