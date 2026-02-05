import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";

import { internal } from "./_generated/api";
import {
  extractReadingsFromWebhook,
  verifyQingpingSignature,
} from "./providers/qingping/webhooks";
import { mapQingpingReading } from "./providers/qingping/mappers";
import type { QingpingWebhookBody } from "./providers/types";

const http = httpRouter();
const normalizeTimestampMs = (ts: number) => (ts < 1e12 ? ts * 1000 : ts);

http.route({
  path: "/webhooks/qingping",
  method: "POST",
  handler: httpAction(async (ctx, req) => {
    const startTime = Date.now();
    const body = (await req.json()) as QingpingWebhookBody;

    // Extract device MAC address from webhook payload first
    const { mac, readings } = extractReadingsFromWebhook(body);
    
    if (!mac) {
      console.error("[WEBHOOK] Missing device MAC address");
      return new Response("Missing device MAC address", { status: 400 });
    }

    console.log(`[WEBHOOK] Received webhook for device MAC: ${mac}, readings count: ${readings.length}`);

    // Look up device to find which user owns it
    const deviceInfo = await ctx.runQuery(
      internal.devices.getByProviderDeviceId,
      {
        provider: "qingping",
        providerDeviceId: mac,
      },
    );

    if (!deviceInfo) {
      const deletedDevice = await ctx.runQuery(
        internal.devices.isDeletedByProviderDeviceId,
        {
          provider: "qingping",
          providerDeviceId: mac,
        },
      );

      if (deletedDevice) {
        console.warn(`[WEBHOOK] Deleted device MAC: ${mac}`);
        return new Response("Deleted device", { status: 200 });
      }

      console.warn(`[WEBHOOK] Unknown device MAC: ${mac}`);
      return new Response("Unknown device", { status: 404 });
    }

    console.log(`[WEBHOOK] Device found: MAC ${mac} (${deviceInfo._id}), owner: ${deviceInfo.userId}`);

    // Get the device owner's config for signature verification
    const config = await ctx.runQuery(internal.providers.getConfig, {
      userId: deviceInfo.userId,
      provider: "qingping",
    });

    if (!config?.appSecret) {
      console.error(`[WEBHOOK] Webhook secret missing for user: ${deviceInfo.userId}`);
      return new Response("Webhook secret missing for device owner", { status: 401 });
    }

    // Verify signature using the device owner's App Secret
    const isValid = await verifyQingpingSignature(
      body.signature.timestamp,
      body.signature.token,
      body.signature.signature,
      config.appSecret,
    );
    
    if (!isValid) {
      console.error(`[WEBHOOK] Invalid signature for device: ${mac}, user: ${deviceInfo.userId}`);
      return new Response("Invalid signature", { status: 401 });
    }

    const device = await ctx.runQuery(internal.devices.getInternal, {
      deviceId: deviceInfo._id,
    });

    const reportIntervalSeconds = device?.reportInterval ?? 3600;
    const reportIntervalMs = reportIntervalSeconds * 1000;
    // Use intervalChangeAt as minimum cutoff to prevent retroactive ingestion
    // Only accept readings newer than when the interval was last changed
    const minAcceptedTs = device?.intervalChangeAt 
      ? Math.max(device.intervalChangeAt, device?.lastReadingAt ?? 0)
      : (device?.lastReadingAt ?? 0);
    let lastAcceptedTs = minAcceptedTs;

    // Process readings for this device
    let processedCount = 0;
    for (const data of readings) {
      const reading = mapQingpingReading(data);
      if (!reading) {
        continue;
      }

      const readingTs = normalizeTimestampMs(reading.ts);
      
      // Skip readings older than the interval change timestamp
      if (readingTs < minAcceptedTs) {
        continue;
      }
      
      if (readingTs - lastAcceptedTs < reportIntervalMs * 0.9) {
        continue;
      }

      await ctx.runMutation(internal.readings.ingest, {
        deviceId: deviceInfo._id,
        ts: readingTs,
        pm25: reading.pm25,
        pm10: reading.pm10,
        co2: reading.co2,
        tempC: reading.tempC,
        rh: reading.rh,
        voc: reading.voc,
        pressure: reading.pressure,
        battery: reading.battery,
      });
      processedCount++;
      lastAcceptedTs = readingTs;
    }

    const duration = Date.now() - startTime;
    console.log(`[WEBHOOK] Successfully processed ${processedCount} readings for device ${mac} in ${duration}ms`);

    return new Response("ok", { status: 200 });
  }),
});

export default http;
