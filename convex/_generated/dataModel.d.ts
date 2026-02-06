/* eslint-disable */
/**
 * Generated data model types.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type {
  DocumentByName,
  TableNamesInDataModel,
  SystemTableNames,
  AnyDataModel,
} from "convex/server";
import type { GenericId } from "convex/values";

/**
 * A type describing your Convex data model.
 *
 * This type includes information about what tables you have, the type of
 * documents stored in those tables, and the indexes defined on them.
 *
 * This type is used to parameterize methods like `queryGeneric` and
 * `mutationGeneric` to make them type-safe.
 */

export type DataModel = {
  deletedDevices: {
    document: {
      deletedAt: number;
      organizationId?: Id<"organizations">;
      provider: "qingping" | "purpleair" | "iqair" | "temtop";
      providerDeviceId: string;
      userId: Id<"users">;
      _id: Id<"deletedDevices">;
      _creationTime: number;
    };
    fieldPaths:
      | "_creationTime"
      | "_id"
      | "deletedAt"
      | "organizationId"
      | "provider"
      | "providerDeviceId"
      | "userId";
    indexes: {
      by_id: ["_id"];
      by_creation_time: ["_creationTime"];
      by_organizationId_and_provider_and_providerDeviceId: [
        "organizationId",
        "provider",
        "providerDeviceId",
        "_creationTime",
      ];
      by_provider_and_providerDeviceId: [
        "provider",
        "providerDeviceId",
        "_creationTime",
      ];
      by_userId_and_provider_and_providerDeviceId: [
        "userId",
        "provider",
        "providerDeviceId",
        "_creationTime",
      ];
    };
    searchIndexes: {};
    vectorIndexes: {};
  };
  devices: {
    document: {
      awaitingPostChangeReading?: boolean;
      createdAt: number;
      dashboardMetrics?: Array<string>;
      hiddenMetrics?: Array<string>;
      intervalChangeAt?: number;
      lastBattery?: number;
      lastReadingAt?: number;
      model?: string;
      name: string;
      organizationId?: Id<"organizations">;
      primaryMetrics?: Array<string>;
      provider: "qingping" | "purpleair" | "iqair" | "temtop";
      providerDeviceId: string;
      providerOffline?: boolean;
      reportInterval?: number;
      roomId?: Id<"rooms">;
      secondaryMetrics?: Array<string>;
      timezone?: string;
      userId: Id<"users">;
      _id: Id<"devices">;
      _creationTime: number;
    };
    fieldPaths:
      | "_creationTime"
      | "_id"
      | "awaitingPostChangeReading"
      | "createdAt"
      | "dashboardMetrics"
      | "hiddenMetrics"
      | "intervalChangeAt"
      | "lastBattery"
      | "lastReadingAt"
      | "model"
      | "name"
      | "organizationId"
      | "primaryMetrics"
      | "provider"
      | "providerDeviceId"
      | "providerOffline"
      | "reportInterval"
      | "roomId"
      | "secondaryMetrics"
      | "timezone"
      | "userId";
    indexes: {
      by_id: ["_id"];
      by_creation_time: ["_creationTime"];
      by_organizationId: ["organizationId", "_creationTime"];
      by_provider_and_providerDeviceId: [
        "provider",
        "providerDeviceId",
        "_creationTime",
      ];
      by_userId: ["userId", "_creationTime"];
    };
    searchIndexes: {};
    vectorIndexes: {};
  };
  embedTokens: {
    document: {
      brandColor?: string;
      brandName?: string;
      createdAt: number;
      description?: string;
      deviceId: Id<"devices">;
      hideAirViewBranding?: boolean;
      isRevoked: boolean;
      label?: string;
      logoStorageId?: Id<"_storage">;
      organizationId?: Id<"organizations">;
      refreshInterval?: number;
      size?: "small" | "medium" | "large";
      token: string;
      userId: Id<"users">;
      _id: Id<"embedTokens">;
      _creationTime: number;
    };
    fieldPaths:
      | "_creationTime"
      | "_id"
      | "brandColor"
      | "brandName"
      | "createdAt"
      | "description"
      | "deviceId"
      | "hideAirViewBranding"
      | "isRevoked"
      | "label"
      | "logoStorageId"
      | "organizationId"
      | "refreshInterval"
      | "size"
      | "token"
      | "userId";
    indexes: {
      by_id: ["_id"];
      by_creation_time: ["_creationTime"];
      by_deviceId: ["deviceId", "_creationTime"];
      by_organizationId: ["organizationId", "_creationTime"];
      by_token: ["token", "_creationTime"];
      by_userId: ["userId", "_creationTime"];
    };
    searchIndexes: {};
    vectorIndexes: {};
  };
  intervalChanges: {
    document: {
      changedAt: number;
      deviceId: Id<"devices">;
      newInterval: number;
      previousInterval: number;
      _id: Id<"intervalChanges">;
      _creationTime: number;
    };
    fieldPaths:
      | "_creationTime"
      | "_id"
      | "changedAt"
      | "deviceId"
      | "newInterval"
      | "previousInterval";
    indexes: {
      by_id: ["_id"];
      by_creation_time: ["_creationTime"];
      by_deviceId: ["deviceId", "_creationTime"];
    };
    searchIndexes: {};
    vectorIndexes: {};
  };
  kioskConfigs: {
    document: {
      brandColor?: string;
      brandName?: string;
      createdAt: number;
      deviceIds: Array<Id<"devices">>;
      hideAirViewBranding?: boolean;
      isRevoked: boolean;
      label?: string;
      logoStorageId?: Id<"_storage">;
      mode: "single" | "multi";
      organizationId?: Id<"organizations">;
      refreshInterval: number;
      theme: "dark" | "light";
      title?: string;
      token: string;
      userId: Id<"users">;
      visibleMetrics?: Array<string>;
      _id: Id<"kioskConfigs">;
      _creationTime: number;
    };
    fieldPaths:
      | "_creationTime"
      | "_id"
      | "brandColor"
      | "brandName"
      | "createdAt"
      | "deviceIds"
      | "hideAirViewBranding"
      | "isRevoked"
      | "label"
      | "logoStorageId"
      | "mode"
      | "organizationId"
      | "refreshInterval"
      | "theme"
      | "title"
      | "token"
      | "userId"
      | "visibleMetrics";
    indexes: {
      by_id: ["_id"];
      by_creation_time: ["_creationTime"];
      by_organizationId: ["organizationId", "_creationTime"];
      by_token: ["token", "_creationTime"];
      by_userId: ["userId", "_creationTime"];
    };
    searchIndexes: {};
    vectorIndexes: {};
  };
  organizations: {
    document: {
      clerkOrgId?: string;
      createdAt: number;
      isPersonal: boolean;
      name: string;
      plan: "starter" | "pro" | "business" | "custom";
      _id: Id<"organizations">;
      _creationTime: number;
    };
    fieldPaths:
      | "_creationTime"
      | "_id"
      | "clerkOrgId"
      | "createdAt"
      | "isPersonal"
      | "name"
      | "plan";
    indexes: {
      by_id: ["_id"];
      by_creation_time: ["_creationTime"];
      by_clerkOrgId: ["clerkOrgId", "_creationTime"];
    };
    searchIndexes: {};
    vectorIndexes: {};
  };
  orgMembers: {
    document: {
      joinedAt: number;
      organizationId: Id<"organizations">;
      role: "owner" | "admin" | "member";
      userId: Id<"users">;
      _id: Id<"orgMembers">;
      _creationTime: number;
    };
    fieldPaths:
      | "_creationTime"
      | "_id"
      | "joinedAt"
      | "organizationId"
      | "role"
      | "userId";
    indexes: {
      by_id: ["_id"];
      by_creation_time: ["_creationTime"];
      by_orgId_and_userId: ["organizationId", "userId", "_creationTime"];
      by_organizationId: ["organizationId", "_creationTime"];
      by_userId: ["userId", "_creationTime"];
    };
    searchIndexes: {};
    vectorIndexes: {};
  };
  providerConfigs: {
    document: {
      accessToken: string;
      appKey?: string;
      appSecret?: string;
      lastSyncAt?: number;
      organizationId?: Id<"organizations">;
      provider: "qingping" | "purpleair" | "iqair" | "temtop";
      tokenExpiresAt: number;
      userId: Id<"users">;
      webhookSecret?: string;
      _id: Id<"providerConfigs">;
      _creationTime: number;
    };
    fieldPaths:
      | "_creationTime"
      | "_id"
      | "accessToken"
      | "appKey"
      | "appSecret"
      | "lastSyncAt"
      | "organizationId"
      | "provider"
      | "tokenExpiresAt"
      | "userId"
      | "webhookSecret";
    indexes: {
      by_id: ["_id"];
      by_creation_time: ["_creationTime"];
      by_organizationId: ["organizationId", "_creationTime"];
      by_organizationId_and_provider: [
        "organizationId",
        "provider",
        "_creationTime",
      ];
      by_userId: ["userId", "_creationTime"];
      by_userId_and_provider: ["userId", "provider", "_creationTime"];
    };
    searchIndexes: {};
    vectorIndexes: {};
  };
  readings: {
    document: {
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
      _id: Id<"readings">;
      _creationTime: number;
    };
    fieldPaths:
      | "_creationTime"
      | "_id"
      | "aqi"
      | "battery"
      | "co2"
      | "deviceId"
      | "deviceName"
      | "pm10"
      | "pm25"
      | "pressure"
      | "rh"
      | "tempC"
      | "ts"
      | "voc";
    indexes: {
      by_id: ["_id"];
      by_creation_time: ["_creationTime"];
      by_deviceId: ["deviceId", "_creationTime"];
      by_deviceId_and_ts: ["deviceId", "ts", "_creationTime"];
    };
    searchIndexes: {};
    vectorIndexes: {};
  };
  rooms: {
    document: {
      createdAt: number;
      name: string;
      organizationId?: Id<"organizations">;
      userId: Id<"users">;
      _id: Id<"rooms">;
      _creationTime: number;
    };
    fieldPaths:
      | "_creationTime"
      | "_id"
      | "createdAt"
      | "name"
      | "organizationId"
      | "userId";
    indexes: {
      by_id: ["_id"];
      by_creation_time: ["_creationTime"];
      by_organizationId: ["organizationId", "_creationTime"];
      by_userId: ["userId", "_creationTime"];
    };
    searchIndexes: {};
    vectorIndexes: {};
  };
  users: {
    document: {
      authId: string;
      createdAt: number;
      email: string;
      name?: string;
      plan?: "starter" | "pro" | "business" | "custom";
      _id: Id<"users">;
      _creationTime: number;
    };
    fieldPaths:
      | "_creationTime"
      | "_id"
      | "authId"
      | "createdAt"
      | "email"
      | "name"
      | "plan";
    indexes: {
      by_id: ["_id"];
      by_creation_time: ["_creationTime"];
      by_authId: ["authId", "_creationTime"];
      by_email: ["email", "_creationTime"];
    };
    searchIndexes: {};
    vectorIndexes: {};
  };
};

/**
 * The names of all of your Convex tables.
 */
export type TableNames = TableNamesInDataModel<DataModel>;

/**
 * The type of a document stored in Convex.
 *
 * @typeParam TableName - A string literal type of the table name (like "users").
 */
export type Doc<TableName extends TableNames> = DocumentByName<
  DataModel,
  TableName
>;

/**
 * An identifier for a document in Convex.
 *
 * Convex documents are uniquely identified by their `Id`, which is accessible
 * on the `_id` field. To learn more, see [Document IDs](https://docs.convex.dev/using/document-ids).
 *
 * Documents can be loaded using `db.get(tableName, id)` in query and mutation functions.
 *
 * IDs are just strings at runtime, but this type can be used to distinguish them from other
 * strings when type checking.
 *
 * @typeParam TableName - A string literal type of the table name (like "users").
 */
export type Id<TableName extends TableNames | SystemTableNames> =
  GenericId<TableName>;
