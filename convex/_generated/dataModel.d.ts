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
  devices: {
    document: {
      createdAt: number;
      lastReadingAt?: number;
      model?: string;
      name: string;
      provider: "qingping" | "purpleair" | "iqair" | "temtop";
      providerDeviceId: string;
      roomId?: Id<"rooms">;
      timezone?: string;
      userId: Id<"users">;
      _id: Id<"devices">;
      _creationTime: number;
    };
    fieldPaths:
      | "_creationTime"
      | "_id"
      | "createdAt"
      | "lastReadingAt"
      | "model"
      | "name"
      | "provider"
      | "providerDeviceId"
      | "roomId"
      | "timezone"
      | "userId";
    indexes: {
      by_id: ["_id"];
      by_creation_time: ["_creationTime"];
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
      createdAt: number;
      deviceId: Id<"devices">;
      expiresAt?: number;
      token: string;
      _id: Id<"embedTokens">;
      _creationTime: number;
    };
    fieldPaths:
      | "_creationTime"
      | "_id"
      | "createdAt"
      | "deviceId"
      | "expiresAt"
      | "token";
    indexes: {
      by_id: ["_id"];
      by_creation_time: ["_creationTime"];
      by_token: ["token", "_creationTime"];
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
      | "provider"
      | "tokenExpiresAt"
      | "userId"
      | "webhookSecret";
    indexes: {
      by_id: ["_id"];
      by_creation_time: ["_creationTime"];
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
      userId: Id<"users">;
      _id: Id<"rooms">;
      _creationTime: number;
    };
    fieldPaths: "_creationTime" | "_id" | "createdAt" | "name" | "userId";
    indexes: {
      by_id: ["_id"];
      by_creation_time: ["_creationTime"];
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
      plan: "free" | "basic" | "pro" | "team";
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
