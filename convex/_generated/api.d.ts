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
