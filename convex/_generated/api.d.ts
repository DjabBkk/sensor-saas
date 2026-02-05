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
        name?: string;
        provider: "qingping" | "purpleair" | "iqair" | "temtop";
        userId: Id<"users">;
      },
      Id<"devices">
    >;
    deleteDevice: FunctionReference<
      "mutation",
      "public",
      { deviceId: Id<"devices"> },
      {
        embedTokensDeleted: number;
        kioskConfigsUpdated: number;
        readingsDeleted: number;
      }
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
        dashboardMetrics?: Array<string>;
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
        dashboardMetrics?: Array<string>;
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
    updateDashboardMetrics: FunctionReference<
      "mutation",
      "public",
      { dashboardMetrics: Array<string>; deviceId: Id<"devices"> },
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
      {
        description?: string;
        deviceId: Id<"devices">;
        label?: string;
        size?: "small" | "medium" | "large";
        userId: Id<"users">;
      },
      {
        _creationTime: number;
        _id: Id<"embedTokens">;
        createdAt: number;
        description?: string;
        deviceId: Id<"devices">;
        isRevoked: boolean;
        label?: string;
        size?: "small" | "medium" | "large";
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
        description?: string;
        deviceId: Id<"devices">;
        isRevoked: boolean;
        label?: string;
        size?: "small" | "medium" | "large";
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
        description?: string;
        deviceId: Id<"devices">;
        isRevoked: boolean;
        label?: string;
        size?: "small" | "medium" | "large";
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
        title?: string;
        userId: Id<"users">;
        visibleMetrics?: Array<string>;
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
        title?: string;
        token: string;
        userId: Id<"users">;
        visibleMetrics?: Array<string>;
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
        title?: string;
        token: string;
        userId: Id<"users">;
        visibleMetrics?: Array<string>;
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
        title?: string;
        visibleMetrics?: Array<string>;
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
    updateDeviceReportInterval: FunctionReference<
      "action",
      "public",
      {
        deviceId: Id<"devices">;
        reportIntervalSeconds: number;
        userId: Id<"users">;
      },
      { message: string; success: boolean }
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
        embed: { description?: string; size?: "small" | "medium" | "large" };
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
        title?: string;
        visibleMetrics?: Array<string>;
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
      {
        devicesDeleted: number;
        embedTokensDeleted: number;
        kioskConfigsDeleted: number;
        providerConfigsDeleted: number;
        readingsDeleted: number;
        roomsDeleted: number;
        userDeleted: boolean;
      }
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
    cleanupOrphanedReadings: FunctionReference<
      "mutation",
      "internal",
      {},
      { orphanedReadingsDeleted: number }
    >;
    getByProviderDeviceId: FunctionReference<
      "query",
      "internal",
      {
        provider: "qingping" | "purpleair" | "iqair" | "temtop";
        providerDeviceId: string;
      },
      null | { _id: Id<"devices">; userId: Id<"users"> }
    >;
    getInternal: FunctionReference<
      "query",
      "internal",
      { deviceId: Id<"devices"> },
      null | {
        _creationTime: number;
        _id: Id<"devices">;
        createdAt: number;
        dashboardMetrics?: Array<string>;
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
    isDeletedForUser: FunctionReference<
      "query",
      "internal",
      {
        provider: "qingping" | "purpleair" | "iqair" | "temtop";
        providerDeviceId: string;
        userId: Id<"users">;
      },
      boolean
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
        description?: string;
        deviceId: Id<"devices">;
        isRevoked: boolean;
        label?: string;
        size?: "small" | "medium" | "large";
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
        title?: string;
        token: string;
        userId: Id<"users">;
        visibleMetrics?: Array<string>;
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
    setDefaultReportInterval: FunctionReference<
      "action",
      "internal",
      { deviceId: Id<"devices">; userId: Id<"users"> },
      null
    >;
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
      Id<"readings"> | null
    >;
  };
  users: {
    mergeDuplicateUsers: FunctionReference<
      "mutation",
      "internal",
      { email: string; keepUserId: Id<"users"> },
      {
        devicesTransferred: number;
        embedTokensTransferred: number;
        kioskConfigsTransferred: number;
        providerConfigsTransferred: number;
        roomsTransferred: number;
        usersDeleted: number;
      }
    >;
  };
};

export declare const components: {};
