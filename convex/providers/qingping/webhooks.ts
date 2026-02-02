import type { QingpingDeviceData, QingpingWebhookBody } from "../types";

const toHex = (bytes: ArrayBuffer) =>
  Array.from(new Uint8Array(bytes))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

export const verifyQingpingSignature = async (
  timestamp: number,
  token: string,
  signature: string,
  appSecret: string,
): Promise<boolean> => {
  if (!signature || !appSecret) {
    return false;
  }

  if (!globalThis.crypto?.subtle) {
    return false;
  }

  const dataToSign = `${timestamp}${token}`;
  const encoder = new TextEncoder();
  const key = await globalThis.crypto.subtle.importKey(
    "raw",
    encoder.encode(appSecret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signatureBuffer = await globalThis.crypto.subtle.sign(
    "HMAC",
    key,
    encoder.encode(dataToSign),
  );
  const digest = toHex(signatureBuffer);
  return digest === signature;
};

export const extractReadingsFromWebhook = (
  body: QingpingWebhookBody,
): { mac: string; deviceName: string; readings: QingpingDeviceData[] } => {
  return {
    mac: body.payload.info.mac,
    deviceName: body.payload.info.name,
    readings: body.payload.data ?? [],
  };
};
