"use node";

import crypto from "crypto";

import type { QingpingWebhookItem, QingpingWebhookPayload } from "../types";

export const verifyQingpingSignature = (
  rawBody: string,
  signature: string | null,
  secret: string | null,
) => {
  if (!signature || !secret) {
    return false;
  }

  const digest = crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
  return digest === signature;
};

export const extractWebhookItems = (
  payload: QingpingWebhookPayload,
): QingpingWebhookItem[] => {
  if (Array.isArray(payload.data)) {
    return payload.data;
  }

  if (Array.isArray(payload.devices)) {
    return payload.devices;
  }

  if (Array.isArray(payload.device_data)) {
    return payload.device_data;
  }

  return [];
};
