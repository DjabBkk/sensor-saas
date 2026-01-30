"use node";

import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";

import { internal } from "./_generated/api";
import { extractWebhookItems, verifyQingpingSignature } from "./providers/qingping/webhooks";
import { mapQingpingReading } from "./providers/qingping/mappers";
import { Id } from "./_generated/dataModel";

const http = httpRouter();

http.route({
  path: "/webhooks/qingping",
  method: "POST",
  handler: httpAction(async (ctx, req) => {
    const rawBody = await req.text();
    const signature =
      req.headers.get("x-qingping-signature") ?? req.headers.get("x-signature");

    const payload = JSON.parse(rawBody) as {
      provider?: "qingping";
      userId?: string;
      [key: string]: unknown;
    };

    const userId = payload.userId as Id<"users"> | undefined;
    if (!userId) {
      return new Response("Missing userId", { status: 400 });
    }

    const config = await ctx.runQuery(internal.providers.getConfig, {
      userId,
      provider: "qingping",
    });

    if (!config?.webhookSecret) {
      return new Response("Webhook secret missing", { status: 401 });
    }

    const isValid = verifyQingpingSignature(rawBody, signature, config.webhookSecret);
    if (!isValid) {
      return new Response("Invalid signature", { status: 401 });
    }

    const items = extractWebhookItems(payload);
    for (const item of items) {
      const mac = item.mac;
      if (!mac) {
        continue;
      }

      const deviceInfo = await ctx.runQuery(
        internal.devices.getByProviderDeviceId,
        {
          provider: "qingping",
          providerDeviceId: mac,
        },
      );

      if (!deviceInfo) {
        continue;
      }

      const reading = mapQingpingReading(item.data);
      if (!reading) {
        continue;
      }

      await ctx.runMutation(internal.readings.ingest, {
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
    }

    return new Response("ok", { status: 200 });
  }),
});

export default http;
