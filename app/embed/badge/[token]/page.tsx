"use client";

import { useEffect, useState, use } from "react";
import { useSearchParams } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { BadgeSmall } from "@/components/embed/BadgeSmall";
import { BadgeMedium } from "@/components/embed/BadgeMedium";
import { BadgeLarge } from "@/components/embed/BadgeLarge";

export default function EmbedBadgePage({
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
      <div className="flex min-h-screen items-center justify-center bg-background p-4 text-foreground">
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
                <BadgeSmall isOnline={true} pm25={reading?.pm25} branding={branding} />
              )}
              {size === "medium" && (
                <BadgeMedium
                  title={data.embed.description}
                  isOnline={true}
                  pm25={reading?.pm25}
                  branding={branding}
                />
              )}
              {size === "large" && (
                <BadgeLarge
                  title={data.embed.description}
                  isOnline={true}
                  pm25={reading?.pm25}
                  co2={reading?.co2}
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
