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
        awaitingPostChangeReading?: boolean;
        createdAt: number;
        dashboardMetrics?: Array<string>;
        hiddenMetrics?: Array<string>;
        intervalChangeAt?: number;
        lastBattery?: number;
        lastReadingAt?: number;
        model?: string;
        name: string;
        primaryMetrics?: Array<string>;
        provider: "qingping" | "purpleair" | "iqair" | "temtop";
        providerDeviceId: string;
        providerOffline?: boolean;
        reportInterval?: number;
        roomId?: Id<"rooms">;
        secondaryMetrics?: Array<string>;
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
        awaitingPostChangeReading?: boolean;
        createdAt: number;
        dashboardMetrics?: Array<string>;
        hiddenMetrics?: Array<string>;
        intervalChangeAt?: number;
        lastBattery?: number;
        lastReadingAt?: number;
        model?: string;
        name: string;
        primaryMetrics?: Array<string>;
        provider: "qingping" | "purpleair" | "iqair" | "temtop";
        providerDeviceId: string;
        providerOffline?: boolean;
        reportInterval?: number;
        roomId?: Id<"rooms">;
        secondaryMetrics?: Array<string>;
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
      {
        deviceId: Id<"devices">;
        primaryMetrics: Array<string>;
        secondaryMetrics: Array<string>;
      },
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
        brandColor?: string;
        brandName?: string;
        description?: string;
        deviceId: Id<"devices">;
        hideAirViewBranding?: boolean;
        label?: string;
        logoStorageId?: Id<"_storage">;
        refreshInterval?: number;
        size?: "small" | "medium" | "large";
        userId: Id<"users">;
      },
      {
        _creationTime: number;
        _id: Id<"embedTokens">;
        brandColor?: string;
        brandName?: string;
        createdAt: number;
        description?: string;
        deviceId: Id<"devices">;
        hideAirViewBranding?: boolean;
        isRevoked: boolean;
        label?: string;
        logoStorageId?: Id<"_storage">;
        refreshInterval?: number;
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
        brandColor?: string;
        brandName?: string;
        createdAt: number;
        description?: string;
        deviceId: Id<"devices">;
        hideAirViewBranding?: boolean;
        isRevoked: boolean;
        label?: string;
        logoStorageId?: Id<"_storage">;
        refreshInterval?: number;
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
        brandColor?: string;
        brandName?: string;
        createdAt: number;
        description?: string;
        deviceId: Id<"devices">;
        hideAirViewBranding?: boolean;
        isRevoked: boolean;
        label?: string;
        logoStorageId?: Id<"_storage">;
        refreshInterval?: number;
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
    updateBranding: FunctionReference<
      "mutation",
      "public",
      {
        brandColor?: string;
        brandName?: string;
        hideAirViewBranding?: boolean;
        logoStorageId?: Id<"_storage">;
        tokenId: Id<"embedTokens">;
      },
      {
        _creationTime: number;
        _id: Id<"embedTokens">;
        brandColor?: string;
        brandName?: string;
        createdAt: number;
        description?: string;
        deviceId: Id<"devices">;
        hideAirViewBranding?: boolean;
        isRevoked: boolean;
        label?: string;
        logoStorageId?: Id<"_storage">;
        refreshInterval?: number;
        size?: "small" | "medium" | "large";
        token: string;
        userId: Id<"users">;
      }
    >;
    updateRefreshInterval: FunctionReference<
      "mutation",
      "public",
      { refreshInterval: number; tokenId: Id<"embedTokens"> },
      {
        _creationTime: number;
        _id: Id<"embedTokens">;
        brandColor?: string;
        brandName?: string;
        createdAt: number;
        description?: string;
        deviceId: Id<"devices">;
        hideAirViewBranding?: boolean;
        isRevoked: boolean;
        label?: string;
        logoStorageId?: Id<"_storage">;
        refreshInterval?: number;
        size?: "small" | "medium" | "large";
        token: string;
        userId: Id<"users">;
      }
    >;
  };
  intervalChanges: {
    listForDevice: FunctionReference<
      "query",
      "public",
      { deviceId: Id<"devices">; endTs?: number; startTs?: number },
      Array<{
        _creationTime: number;
        _id: Id<"intervalChanges">;
        changedAt: number;
        deviceId: Id<"devices">;
        newInterval: number;
        previousInterval: number;
      }>
    >;
  };
  kioskConfigs: {
    create: FunctionReference<
      "mutation",
      "public",
      {
        brandColor?: string;
        brandName?: string;
        deviceIds: Array<Id<"devices">>;
        hideAirViewBranding?: boolean;
        label?: string;
        logoStorageId?: Id<"_storage">;
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
        brandColor?: string;
        brandName?: string;
        createdAt: number;
        deviceIds: Array<Id<"devices">>;
        hideAirViewBranding?: boolean;
        isRevoked: boolean;
        label?: string;
        logoStorageId?: Id<"_storage">;
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
        brandColor?: string;
        brandName?: string;
        createdAt: number;
        deviceIds: Array<Id<"devices">>;
        hideAirViewBranding?: boolean;
        isRevoked: boolean;
        label?: string;
        logoStorageId?: Id<"_storage">;
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
        brandColor?: string;
        brandName?: string;
        configId: Id<"kioskConfigs">;
        deviceIds: Array<Id<"devices">>;
        hideAirViewBranding?: boolean;
        label?: string;
        logoStorageId?: Id<"_storage">;
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
        embed: {
          brandColor?: string;
          brandName?: string;
          description?: string;
          hideAirViewBranding?: boolean;
          logoUrl?: string;
          refreshInterval?: number;
          size?: "small" | "medium" | "large";
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
        brandColor?: string;
        brandName?: string;
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
        hideAirViewBranding?: boolean;
        label?: string;
        logoUrl?: string;
        mode: "single" | "multi";
        refreshInterval: number;
        theme: "dark" | "light";
        title?: string;
        visibleMetrics?: Array<string>;
      }
    >;
  };
  readings: {
    forExport: FunctionReference<
      "query",
      "public",
      {
        deviceId: Id<"devices">;
        endTs: number;
        startTs: number;
        userId: Id<"users">;
      },
      {
        clampedStart: number;
        hitLimit: boolean;
        readings: Array<{
          _creationTime: number;
          _id: Id<"readings">;
          aqi?: number;
          battery?: number;
          co2?: number;
          deviceId: Id<"devices">;
          deviceName?: string;
          pm10?: number;
          pm25?: number;
          pressure?: number;
          rh?: number;
          tempC?: number;
          ts: number;
          voc?: number;
        }>;
        wasClamped: boolean;
      }
    >;
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
        deviceName?: string;
        pm10?: number;
        pm25?: number;
        pressure?: number;
        rh?: number;
        tempC?: number;
        ts: number;
        voc?: number;
      }>
    >;
    historyAggregated: FunctionReference<
      "query",
      "public",
      {
        bucketMinutes: number;
        deviceId: Id<"devices">;
        endTs: number;
        startTs: number;
      },
      Array<{
        aqi: number | null;
        battery: number | null;
        co2: number | null;
        count: number;
        pm10: number | null;
        pm25: number | null;
        pressure: number | null;
        rh: number | null;
        tempC: number | null;
        ts: number;
        voc: number | null;
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
        deviceName?: string;
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
  storage: {
    generateUploadUrl: FunctionReference<
      "mutation",
      "public",
      { userId: Id<"users"> },
      string
    >;
    getLogoUrl: FunctionReference<
      "query",
      "public",
      { storageId: Id<"_storage"> },
      string | null
    >;
  };
  users: {
    debugSetPlan: FunctionReference<
      "mutation",
      "public",
      { plan: "starter" | "pro" | "business" | "custom"; userId: Id<"users"> },
      null
    >;
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
        plan: "starter" | "pro" | "business" | "custom";
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
  cleanup: {
    cleanupDeviceReadings: FunctionReference<
      "mutation",
      "internal",
      { cutoffTs: number; deviceId: Id<"devices"> },
      null
    >;
    cleanupExpiredReadings: FunctionReference<"mutation", "internal", {}, null>;
  };
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
    getInternal: FunctionReference<
      "query",
      "internal",
      { deviceId: Id<"devices"> },
      null | {
        _creationTime: number;
        _id: Id<"devices">;
        awaitingPostChangeReading?: boolean;
        createdAt: number;
        dashboardMetrics?: Array<string>;
        hiddenMetrics?: Array<string>;
        intervalChangeAt?: number;
        lastBattery?: number;
        lastReadingAt?: number;
        model?: string;
        name: string;
        primaryMetrics?: Array<string>;
        provider: "qingping" | "purpleair" | "iqair" | "temtop";
        providerDeviceId: string;
        providerOffline?: boolean;
        reportInterval?: number;
        roomId?: Id<"rooms">;
        secondaryMetrics?: Array<string>;
        timezone?: string;
        userId: Id<"users">;
      }
    >;
    isDeletedByProviderDeviceId: FunctionReference<
      "query",
      "internal",
      {
        provider: "qingping" | "purpleair" | "iqair" | "temtop";
        providerDeviceId: string;
      },
      boolean
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
    removeDeletedDevice: FunctionReference<
      "mutation",
      "internal",
      {
        provider: "qingping" | "purpleair" | "iqair" | "temtop";
        providerDeviceId: string;
      },
      null
    >;
    updateReportInterval: FunctionReference<
      "mutation",
      "internal",
      {
        deviceId: Id<"devices">;
        intervalChangeAt?: number;
        reportInterval: number;
      },
      null
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
        brandColor?: string;
        brandName?: string;
        createdAt: number;
        description?: string;
        deviceId: Id<"devices">;
        hideAirViewBranding?: boolean;
        isRevoked: boolean;
        label?: string;
        logoStorageId?: Id<"_storage">;
        refreshInterval?: number;
        size?: "small" | "medium" | "large";
        token: string;
        userId: Id<"users">;
      }
    >;
  };
  intervalChanges: {
    record: FunctionReference<
      "mutation",
      "internal",
      {
        deviceId: Id<"devices">;
        newInterval: number;
        previousInterval: number;
      },
      Id<"intervalChanges">
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
        brandColor?: string;
        brandName?: string;
        createdAt: number;
        deviceIds: Array<Id<"devices">>;
        hideAirViewBranding?: boolean;
        isRevoked: boolean;
        label?: string;
        logoStorageId?: Id<"_storage">;
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
    syncDevicesForUser: FunctionReference<
      "action",
      "internal",
      {
        provider: "qingping" | "purpleair" | "iqair" | "temtop";
        userId: Id<"users">;
      },
      null
    >;
    unbindQingpingDevice: FunctionReference<
      "action",
      "internal",
      { accessToken: string; mac: string },
      null
    >;
    unbindQingpingDeviceForDeviceId: FunctionReference<
      "action",
      "internal",
      { mac: string; userId: Id<"users"> },
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
  users: {
    getInternal: FunctionReference<
      "query",
      "internal",
      { userId: Id<"users"> },
      null | {
        _id: Id<"users">;
        plan: "starter" | "pro" | "business" | "custom";
      }
    >;
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
