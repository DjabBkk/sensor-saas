"use node";

import type { QingpingDevice } from "../types";

const QINGPING_API_BASE = "https://apis.cleargrass.com";
const QINGPING_OAUTH_URL = "https://oauth.cleargrass.com/oauth2/token";

type AccessTokenResponse = {
  access_token: string;
  expires_in: number;
};

const getBasicAuthHeader = (appKey: string, appSecret: string) => {
  const token = Buffer.from(`${appKey}:${appSecret}`).toString("base64");
  return `Basic ${token}`;
};

export const getAccessToken = async (appKey: string, appSecret: string) => {
  const response = await fetch(QINGPING_OAUTH_URL, {
    method: "POST",
    headers: {
      Authorization: getBasicAuthHeader(appKey, appSecret),
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      scope: "device_full_access",
    }),
  });

  const data = (await response.json()) as AccessTokenResponse;
  if (!response.ok) {
    throw new Error(`Qingping OAuth failed: ${response.status}`);
  }

  const tokenExpiresAt = Date.now() + data.expires_in * 1000;
  return { accessToken: data.access_token, tokenExpiresAt };
};

const apiFetch = async (accessToken: string, path: string) => {
  const response = await fetch(`${QINGPING_API_BASE}${path}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Qingping API error: ${response.status}`);
  }

  return (await response.json()) as unknown;
};

export const listDevices = async (accessToken: string) => {
  const payload = (await apiFetch(accessToken, "/v1/apis/devices")) as {
    devices?: QingpingDevice[];
    device?: QingpingDevice[];
    data?: QingpingDevice[];
  };

  return payload.devices ?? payload.device ?? payload.data ?? [];
};

export const getHistoryData = async (
  accessToken: string,
  mac: string,
  startTime: number,
  endTime: number,
) => {
  const params = new URLSearchParams({
    mac,
    start_time: String(startTime),
    end_time: String(endTime),
  });

  return apiFetch(accessToken, `/v1/apis/devices/data?${params}`);
};

export type DeviceSettingsUpdate = {
  mac: string[]; // Array of MAC addresses as per Qingping API spec
  report_interval: number; // in seconds, min 60
  collect_interval: number; // in seconds
  timestamp: number; // Millisecond timestamp, unique for every request
};

/**
 * Update device settings via Qingping API
 * @param accessToken - OAuth access token
 * @param settings - Device settings to update
 * @returns Success response or throws error
 */
export const updateDeviceSettings = async (
  accessToken: string,
  settings: DeviceSettingsUpdate
): Promise<{ success: boolean }> => {
  const response = await fetch(`${QINGPING_API_BASE}/v1/apis/devices/settings`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(settings),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Qingping API error: ${response.status} - ${errorText}`);
  }

  return { success: true };
};
