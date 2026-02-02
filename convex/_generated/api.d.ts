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
    addByMac: FunctionReference<
      "mutation",
      "public",
      {
        macAddress: string;
        name: string;
        provider: "qingping" | "purpleair" | "iqair" | "temtop";
        userId: Id<"users">;
      },
      Id<"devices">
    >;
    deleteDevice: FunctionReference<
      "mutation",
      "public",
      { deviceId: Id<"devices"> },
      null
    >;
    forceClaimDevice: FunctionReference<
      "mutation",
      "public",
      {
        macAddress: string;
        provider: "qingping" | "purpleair" | "iqair" | "temtop";
      },
      null
    >;
    get: FunctionReference<
      "query",
      "public",
      { deviceId: Id<"devices"> },
      null | {
        _creationTime: number;
        _id: Id<"devices">;
        createdAt: number;
        hiddenMetrics?: Array<string>;
        lastBattery?: number;
        lastReadingAt?: number;
        model?: string;
        name: string;
        provider: "qingping" | "purpleair" | "iqair" | "temtop";
        providerDeviceId: string;
        providerOffline?: boolean;
        roomId?: Id<"rooms">;
        timezone?: string;
        userId: Id<"users">;
      }
    >;
    hasQingpingDevice: FunctionReference<
      "query",
      "public",
      { userId: Id<"users"> },
      boolean
    >;
    list: FunctionReference<
      "query",
      "public",
      { userId: Id<"users"> },
      Array<{
        _creationTime: number;
        _id: Id<"devices">;
        createdAt: number;
        hiddenMetrics?: Array<string>;
        lastBattery?: number;
        lastReadingAt?: number;
        model?: string;
        name: string;
        provider: "qingping" | "purpleair" | "iqair" | "temtop";
        providerDeviceId: string;
        providerOffline?: boolean;
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
    updateHiddenMetrics: FunctionReference<
      "mutation",
      "public",
      { deviceId: Id<"devices">; hiddenMetrics: Array<string> },
      null
    >;
    updateRoom: FunctionReference<
      "mutation",
      "public",
      { deviceId: Id<"devices">; roomId?: Id<"rooms"> },
      null
    >;
  };
  embedTokens: {
    create: FunctionReference<
      "mutation",
      "public",
      { deviceId: Id<"devices">; label?: string; userId: Id<"users"> },
      {
        _creationTime: number;
        _id: Id<"embedTokens">;
        createdAt: number;
        deviceId: Id<"devices">;
        isRevoked: boolean;
        label?: string;
        token: string;
        userId: Id<"users">;
      }
    >;
    listForDevice: FunctionReference<
      "query",
      "public",
      { deviceId: Id<"devices"> },
      Array<{
        _creationTime: number;
        _id: Id<"embedTokens">;
        createdAt: number;
        deviceId: Id<"devices">;
        isRevoked: boolean;
        label?: string;
        token: string;
        userId: Id<"users">;
      }>
    >;
    listForUser: FunctionReference<
      "query",
      "public",
      { userId: Id<"users"> },
      Array<{
        _creationTime: number;
        _id: Id<"embedTokens">;
        createdAt: number;
        deviceId: Id<"devices">;
        isRevoked: boolean;
        label?: string;
        token: string;
        userId: Id<"users">;
      }>
    >;
    revoke: FunctionReference<
      "mutation",
      "public",
      { tokenId: Id<"embedTokens"> },
      null
    >;
  };
  kioskConfigs: {
    create: FunctionReference<
      "mutation",
      "public",
      {
        deviceIds: Array<Id<"devices">>;
        label?: string;
        mode: "single" | "multi";
        refreshInterval: number;
        theme: "dark" | "light";
        userId: Id<"users">;
      },
      {
        _creationTime: number;
        _id: Id<"kioskConfigs">;
        createdAt: number;
        deviceIds: Array<Id<"devices">>;
        isRevoked: boolean;
        label?: string;
        mode: "single" | "multi";
        refreshInterval: number;
        theme: "dark" | "light";
        token: string;
        userId: Id<"users">;
      }
    >;
    listForUser: FunctionReference<
      "query",
      "public",
      { userId: Id<"users"> },
      Array<{
        _creationTime: number;
        _id: Id<"kioskConfigs">;
        createdAt: number;
        deviceIds: Array<Id<"devices">>;
        isRevoked: boolean;
        label?: string;
        mode: "single" | "multi";
        refreshInterval: number;
        theme: "dark" | "light";
        token: string;
        userId: Id<"users">;
      }>
    >;
    revoke: FunctionReference<
      "mutation",
      "public",
      { configId: Id<"kioskConfigs"> },
      null
    >;
    update: FunctionReference<
      "mutation",
      "public",
      {
        configId: Id<"kioskConfigs">;
        deviceIds: Array<Id<"devices">>;
        label?: string;
        mode: "single" | "multi";
        refreshInterval: number;
        theme: "dark" | "light";
      },
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
    hasProviderCredentials: FunctionReference<
      "query",
      "public",
      {
        provider: "qingping" | "purpleair" | "iqair" | "temtop";
        userId: Id<"users">;
      },
      boolean
    >;
  };
  providersActions: {
    syncDevicesForUserPublic: FunctionReference<
      "action",
      "public",
      {
        provider: "qingping" | "purpleair" | "iqair" | "temtop";
        userId: Id<"users">;
      },
      null
    >;
  };
  public: {
    getEmbedDevice: FunctionReference<
      "query",
      "public",
      { refreshKey?: number; token: string },
      null | {
        device: {
          _creationTime: number;
          _id: Id<"devices">;
          createdAt: number;
          lastBattery?: number;
          lastReadingAt?: number;
          model?: string;
          name: string;
          provider: "qingping" | "purpleair" | "iqair" | "temtop";
          providerDeviceId: string;
          providerOffline?: boolean;
          roomId?: Id<"rooms">;
          timezone?: string;
          userId: Id<"users">;
        };
        history: Array<{
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
        }>;
        latestReading: null | {
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
        };
      }
    >;
    getKioskConfig: FunctionReference<
      "query",
      "public",
      { refreshKey?: number; token: string },
      null | {
        devices: Array<{
          device: {
            _creationTime: number;
            _id: Id<"devices">;
            createdAt: number;
            lastBattery?: number;
            lastReadingAt?: number;
            model?: string;
            name: string;
            provider: "qingping" | "purpleair" | "iqair" | "temtop";
            providerDeviceId: string;
            providerOffline?: boolean;
            roomId?: Id<"rooms">;
            timezone?: string;
            userId: Id<"users">;
          };
          latestReading: null | {
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
          };
        }>;
        label?: string;
        mode: "single" | "multi";
        refreshInterval: number;
        theme: "dark" | "light";
      }
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
    deleteUser: FunctionReference<
      "mutation",
      "public",
      { userId: Id<"users"> },
      null
    >;
    getCurrentUser: FunctionReference<
      "query",
      "public",
      { authId: string },
      null | {
        _creationTime: number;
        _id: Id<"users">;
        authId: string;
        createdAt: number;
        email: string;
        name?: string;
        plan: "free" | "basic" | "pro" | "team";
      }
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
        providerOffline?: boolean;
        timezone?: string;
        userId: Id<"users">;
      },
      Id<"devices">
    >;
  };
  embedTokens: {
    getByToken: FunctionReference<
      "query",
      "internal",
      { token: string },
      null | {
        _creationTime: number;
        _id: Id<"embedTokens">;
        createdAt: number;
        deviceId: Id<"devices">;
        isRevoked: boolean;
        label?: string;
        token: string;
        userId: Id<"users">;
      }
    >;
  };
  kioskConfigs: {
    getByToken: FunctionReference<
      "query",
      "internal",
      { token: string },
      null | {
        _creationTime: number;
        _id: Id<"kioskConfigs">;
        createdAt: number;
        deviceIds: Array<Id<"devices">>;
        isRevoked: boolean;
        label?: string;
        mode: "single" | "multi";
        refreshInterval: number;
        theme: "dark" | "light";
        token: string;
        userId: Id<"users">;
      }
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
