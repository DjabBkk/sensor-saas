"use client";

import { useEffect, useState, use } from "react";
import { useSearchParams } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { EmbedCard } from "@/components/embed/EmbedCard";

export default function EmbedCardPage({
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
        <EmbedCard
          deviceName={data.device.name}
          model={data.device.model ?? undefined}
          pm25={data.latestReading?.pm25}
          co2={data.latestReading?.co2}
          tempC={data.latestReading?.tempC}
          rh={data.latestReading?.rh}
        />
      </div>
    </div>
  );
}
