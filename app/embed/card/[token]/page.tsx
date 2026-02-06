"use client";

import { useEffect, useState, use } from "react";
import { useSearchParams } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { CardSmall } from "@/components/embed/CardSmall";
import { CardMedium } from "@/components/embed/CardMedium";
import { CardLarge } from "@/components/embed/CardLarge";

export default function EmbedCardPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = use(params);
  const searchParams = useSearchParams();
  const theme = searchParams.get("theme");
  const sizeParam = searchParams.get("size");
  const [refreshKey, setRefreshKey] = useState(0);

  const data = useQuery(
    api.public.getEmbedDevice,
    token ? { token, refreshKey } : "skip"
  );

  useEffect(() => {
    // Use refreshInterval from embed config, or default to 60 seconds
    const refreshMs = (data?.embed.refreshInterval ?? 60) * 1000;
    const interval = setInterval(() => {
      setRefreshKey((prev) => prev + 1);
    }, refreshMs);
    return () => clearInterval(interval);
  }, [data?.embed.refreshInterval]);

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
          // Always show last reading, regardless of online status
          const reading = data.latestReading;
          const size =
            sizeParam === "small" || sizeParam === "medium" || sizeParam === "large"
              ? sizeParam
              : data.embed.size ?? "medium";

          const branding = {
            brandName: data.embed.brandName,
            brandColor: data.embed.brandColor,
            logoUrl: data.embed.logoUrl,
            hideAirViewBranding: data.embed.hideAirViewBranding,
          };

          return (
            <>
              {size === "small" && (
                <CardSmall
                  title={data.embed.description}
                  isOnline={true}
                  pm25={reading?.pm25}
                  co2={reading?.co2}
                  branding={branding}
                />
              )}
              {size === "medium" && (
                <CardMedium
                  title={data.embed.description}
                  isOnline={true}
                  pm25={reading?.pm25}
                  co2={reading?.co2}
                  tempC={reading?.tempC}
                  rh={reading?.rh}
                  branding={branding}
                />
              )}
              {size === "large" && (
                <CardLarge
                  title={data.embed.description}
                  isOnline={true}
                  pm25={reading?.pm25}
                  co2={reading?.co2}
                  tempC={reading?.tempC}
                  rh={reading?.rh}
                  history={data.history.map((point) => ({
                    ts: point.ts,
                    pm25: point.pm25,
                  }))}
                  branding={branding}
                />
              )}
            </>
          );
        })()}
      </div>
    </div>
  );
}
