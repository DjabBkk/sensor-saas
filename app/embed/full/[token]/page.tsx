"use client";

import { useEffect, useState, use } from "react";
import { useSearchParams } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { getDeviceStatus } from "@/lib/deviceStatus";
import { EmbedFull } from "@/components/embed/EmbedFull";

export default function EmbedFullPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = use(params);
  const searchParams = useSearchParams();
  const theme = searchParams.get("theme");
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setRefreshKey((prev) => prev + 1);
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  const data = useQuery(
    api.public.getEmbedDevice,
    token ? { token, refreshKey } : "skip"
  );

  if (data === undefined) {
    return null;
  }

  if (!data) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">
        Invalid or revoked embed token.
      </div>
    );
  }

  return (
    <div className={theme === "dark" ? "dark" : ""}>
      <div className="flex min-h-screen items-center justify-center bg-background p-6 text-foreground">
        {(() => {
          const status = getDeviceStatus({
            lastReadingAt: data.device.lastReadingAt,
            lastBattery: data.device.lastBattery,
            providerOffline: data.device.providerOffline,
          });
          const reading = status.isOnline ? data.latestReading : null;

          return (
        <EmbedFull
          deviceName={data.device.name}
          model={data.device.model ?? undefined}
          isOnline={status.isOnline}
          pm25={reading?.pm25}
          co2={reading?.co2}
          tempC={reading?.tempC}
          rh={reading?.rh}
          history={data.history.map((point) => ({
            ts: point.ts,
            pm25: point.pm25,
          }))}
        />
          );
        })()}
      </div>
    </div>
  );
}
