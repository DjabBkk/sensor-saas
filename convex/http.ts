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

http.route({
  path: "/webhooks/qingping",
  method: "POST",
  handler: httpAction(async (ctx, req) => {
    const startTime = Date.now();
    
    try {
      // Parse request body with error handling
      let body: QingpingWebhookBody;
      try {
        body = (await req.json()) as QingpingWebhookBody;
      } catch (error) {
        console.error("[WEBHOOK] Failed to parse request body:", error);
        return new Response("Invalid JSON payload", { status: 400 });
      }

      // Extract device MAC address from webhook payload first
      let mac: string;
      let readings: any[];
      try {
        const extracted = extractReadingsFromWebhook(body);
        mac = extracted.mac;
        readings = extracted.readings;
      } catch (error) {
        console.error("[WEBHOOK] Failed to extract readings from webhook:", error);
        return new Response("Invalid webhook payload structure", { status: 400 });
      }
      
      if (!mac) {
        console.error("[WEBHOOK] Missing device MAC address");
        return new Response("Missing device MAC address", { status: 400 });
      }

      console.log(`[WEBHOOK] Received webhook for device MAC: ${mac}, readings count: ${readings.length}`);

      // Look up device to find which user owns it
      let deviceInfo;
      try {
        deviceInfo = await ctx.runQuery(
          internal.devices.getByProviderDeviceId,
          {
            provider: "qingping",
            providerDeviceId: mac,
          },
        );
      } catch (error) {
        console.error(`[WEBHOOK] Error looking up device ${mac}:`, error);
        return new Response("Error looking up device", { status: 500 });
      }

      if (!deviceInfo) {
        console.warn(`[WEBHOOK] Unknown device MAC: ${mac}`);
        return new Response("Unknown device", { status: 404 });
      }

      console.log(`[WEBHOOK] Device found: MAC ${mac} (${deviceInfo._id}), owner: ${deviceInfo.userId}`);

      // Check if device is marked as deleted
      let isDeleted: boolean;
      try {
        isDeleted = await ctx.runQuery(
          internal.devices.isDeletedForUser,
          {
            userId: deviceInfo.userId,
            provider: "qingping",
            providerDeviceId: mac,
          }
        );
      } catch (error) {
        console.error(`[WEBHOOK] Error checking if device ${mac} is deleted:`, error);
        // Continue processing if check fails - better to process than reject
        isDeleted = false;
      }

      if (isDeleted) {
        console.warn(`[WEBHOOK] Device ${mac} is marked as deleted, ignoring webhook`);
        return new Response("Device deleted", { status: 410 }); // 410 Gone
      }

      // Verify device still exists (double-check in case it was deleted between queries)
      let deviceStillExists;
      try {
        deviceStillExists = await ctx.runQuery(internal.devices.getByProviderDeviceId, {
          provider: "qingping",
          providerDeviceId: mac,
        });
      } catch (error) {
        console.error(`[WEBHOOK] Error verifying device ${mac} still exists:`, error);
        // Continue processing if check fails
        deviceStillExists = deviceInfo;
      }

      if (!deviceStillExists) {
        console.warn(`[WEBHOOK] Device ${mac} no longer exists, ignoring webhook`);
        return new Response("Device not found", { status: 404 });
      }

      // Get the device owner's config for signature verification
      let config;
      try {
        config = await ctx.runQuery(internal.providers.getConfig, {
          userId: deviceInfo.userId,
          provider: "qingping",
        });
      } catch (error) {
        console.error(`[WEBHOOK] Error fetching config for user ${deviceInfo.userId}:`, error);
        return new Response("Error fetching provider config", { status: 500 });
      }

      if (!config?.appSecret) {
        console.error(`[WEBHOOK] Webhook secret missing for user: ${deviceInfo.userId}`);
        return new Response("Webhook secret missing for device owner", { status: 401 });
      }

      // Verify signature using the device owner's App Secret
      let isValid: boolean;
      try {
        isValid = await verifyQingpingSignature(
          body.signature.timestamp,
          body.signature.token,
          body.signature.signature,
          config.appSecret,
        );
      } catch (error) {
        console.error(`[WEBHOOK] Error verifying signature for device ${mac}:`, error);
        return new Response("Error verifying signature", { status: 500 });
      }
      
      if (!isValid) {
        console.error(`[WEBHOOK] Invalid signature for device: ${mac}, user: ${deviceInfo.userId}`);
        return new Response("Invalid signature", { status: 401 });
      }

      // Process readings for this device
      let processedCount = 0;
      let errors = 0;
      
      for (const data of readings) {
        try {
          const reading = mapQingpingReading(data);
          if (!reading) {
            continue;
          }

          const readingId = await ctx.runMutation(internal.readings.ingest, {
            deviceId: deviceInfo._id,
            ts: reading.ts,
            pm25: reading.pm25,
            pm10: reading.pm10,
            co2: reading.co2,
            tempC: reading.tempC,
            rh: reading.rh,
            voc: reading.voc,
            pressure: reading.pressure,
            battery: reading.battery,
          });
          if (readingId) {
            processedCount++;
          }
        } catch (error) {
          console.error(`[WEBHOOK] Error ingesting reading for device ${mac}:`, error);
          errors++;
          // Continue processing other readings even if one fails
        }
      }

      const duration = Date.now() - startTime;
      
      if (errors > 0) {
        console.warn(`[WEBHOOK] Processed ${processedCount} readings with ${errors} errors for device ${mac} in ${duration}ms`);
        // Still return 200 if at least some readings were processed
        return new Response(`Processed ${processedCount} readings, ${errors} errors`, { status: 200 });
      }
      
      console.log(`[WEBHOOK] Successfully processed ${processedCount} readings for device ${mac} in ${duration}ms`);
      return new Response("ok", { status: 200 });
      
    } catch (error) {
      const duration = Date.now() - startTime;
      console.error(`[WEBHOOK] Unexpected error after ${duration}ms:`, error);
      // Always return a proper HTTP response, never let exceptions bubble up
      return new Response(
        `Internal server error: ${error instanceof Error ? error.message : String(error)}`,
        { status: 500 }
      );
    }
  }),
});

export default http;
