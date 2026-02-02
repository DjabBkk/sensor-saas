import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";

import { internal } from "./_generated/api";
import {
  extractReadingsFromWebhook,
  verifyQingpingSignature,
} from "./providers/qingping/webhooks";
import { mapQingpingReading } from "./providers/qingping/mappers";
import type { QingpingWebhookBody } from "./providers/types";
import { Id } from "./_generated/dataModel";

const http = httpRouter();

http.route({
  path: "/webhooks/qingping/:userId",
  method: "POST",
  handler: httpAction(async (ctx, req) => {
    const url = new URL(req.url);
    const pathParts = url.pathname.split("/").filter(Boolean);
    const userId = pathParts[pathParts.length - 1] as Id<"users"> | undefined;
    if (!userId) {
      return new Response("Missing userId", { status: 400 });
    }

    const body = (await req.json()) as QingpingWebhookBody;

    const config = await ctx.runQuery(internal.providers.getConfig, {
      userId,
      provider: "qingping",
    });

    if (!config?.appSecret) {
      return new Response("Webhook secret missing", { status: 401 });
    }

    const isValid = await verifyQingpingSignature(
      body.signature.timestamp,
      body.signature.token,
      body.signature.signature,
      config.appSecret,
    );
    if (!isValid) {
      return new Response("Invalid signature", { status: 401 });
    }

    const { mac, readings } = extractReadingsFromWebhook(body);
    const deviceInfo = await ctx.runQuery(
      internal.devices.getByProviderDeviceId,
      {
        provider: "qingping",
        providerDeviceId: mac,
      },
    );

    if (!deviceInfo || deviceInfo.userId !== userId) {
      return new Response("Unknown device", { status: 404 });
    }

    for (const data of readings) {
      const reading = mapQingpingReading(data);
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
