"use client";

import { useEffect, useMemo, useState, use } from "react";
import { useQuery } from "convex/react";
import { useSearchParams } from "next/navigation";
import { api } from "@/convex/_generated/api";
import { KioskSingle } from "@/components/kiosk/KioskSingle";
import { KioskGrid } from "@/components/kiosk/KioskGrid";

export default function KioskPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  const searchParams = useSearchParams();
  const themeOverride = searchParams.get("theme");
  const [refreshKey, setRefreshKey] = useState(0);

  const data = useQuery(
    api.public.getKioskConfig,
    token ? { token, refreshKey } : "skip"
  );

  const refreshMs = useMemo(() => {
    if (!data?.refreshInterval) {
      return 60000;
    }
    return Math.max(10000, data.refreshInterval * 1000);
  }, [data?.refreshInterval]);

  useEffect(() => {
    const interval = setInterval(() => {
      setRefreshKey((prev) => prev + 1);
    }, refreshMs);
    return () => clearInterval(interval);
  }, [refreshMs]);

  if (data === undefined) {
    return null;
  }

  if (!data) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">
        Invalid or revoked kiosk token.
      </div>
    );
  }

  const theme = themeOverride ?? data.theme;
  const isSingle = data.mode === "single";

  return (
    <div className={theme === "dark" ? "dark" : ""}>
      <div className="min-h-screen bg-background p-8 text-foreground">
        {isSingle ? (
          data.devices[0] ? (
            <KioskSingle
              deviceName={data.devices[0].device.name}
              model={data.devices[0].device.model ?? undefined}
              pm25={data.devices[0].latestReading?.pm25}
              co2={data.devices[0].latestReading?.co2}
              tempC={data.devices[0].latestReading?.tempC}
              rh={data.devices[0].latestReading?.rh}
            />
          ) : (
            <div className="flex min-h-[60vh] items-center justify-center text-muted-foreground">
              No devices configured for this kiosk.
            </div>
          )
        ) : (
          <KioskGrid
            devices={data.devices.map((entry) => ({
              deviceId: entry.device._id,
              deviceName: entry.device.name,
              pm25: entry.latestReading?.pm25,
              co2: entry.latestReading?.co2,
              tempC: entry.latestReading?.tempC,
              rh: entry.latestReading?.rh,
            }))}
          />
        )}
      </div>
    </div>
  );
}
