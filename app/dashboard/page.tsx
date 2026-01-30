"use client";

import { useEffect, useState } from "react";
import { useAuth, useUser } from "@clerk/nextjs";
import { useMutation, useQuery } from "convex/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getPM25Level, getCO2Level } from "./_components/ReadingGauge";
import { Plus, Wifi, WifiOff, ChevronRight } from "lucide-react";

export default function DashboardPage() {
  const router = useRouter();
  const { isLoaded, userId } = useAuth();
  const { user } = useUser();
  const getOrCreateUser = useMutation(api.users.getOrCreateUser);
  const [convexUserId, setConvexUserId] = useState<Id<"users"> | null>(null);

  useEffect(() => {
    if (!isLoaded) return;
    if (!userId) {
      router.replace("/login");
      return;
    }
    if (convexUserId || !user) return;

    const email = user.primaryEmailAddress?.emailAddress;
    if (!email) return;

    let cancelled = false;
    getOrCreateUser({
      authId: userId,
      email,
      name: user.fullName ?? undefined,
    })
      .then((id) => {
        if (!cancelled) setConvexUserId(id);
      })
      .catch(console.error);

    return () => {
      cancelled = true;
    };
  }, [isLoaded, userId, user, convexUserId, getOrCreateUser, router]);

  const devices = useQuery(
    api.devices.list,
    convexUserId ? { userId: convexUserId } : "skip"
  );

  if (!convexUserId) {
    return null;
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="mt-1 text-muted-foreground">
          Overview of your air quality monitors
        </p>
      </div>

      {/* Empty State */}
      {devices?.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center px-8 py-16 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
              <Plus className="h-8 w-8 text-primary" />
            </div>
            <h2 className="text-xl font-semibold">No devices connected</h2>
            <p className="mt-2 max-w-sm text-muted-foreground">
              Connect your first Qingping air quality monitor to start tracking
              your indoor air quality.
            </p>
            <Button asChild className="mt-6">
              <Link href="/onboarding/connect">Connect Device</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Device Grid */}
      {devices && devices.length > 0 && (
        <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {devices.map((device) => (
            <DeviceOverviewCard key={device._id} device={device} />
          ))}
        </div>
      )}
    </div>
  );
}

// Mini device card for the overview
function DeviceOverviewCard({
  device,
}: {
  device: {
    _id: Id<"devices">;
    name: string;
    model?: string;
    lastReadingAt?: number;
  };
}) {
  const reading = useQuery(api.readings.latest, { deviceId: device._id });

  const pm25Level =
    reading?.pm25 !== undefined ? getPM25Level(reading.pm25) : null;
  const co2Level =
    reading?.co2 !== undefined ? getCO2Level(reading.co2) : null;

  const isOnline =
    device.lastReadingAt && Date.now() - device.lastReadingAt < 30 * 60 * 1000;

  return (
    <Link href={`/dashboard/device/${device._id}`}>
      <Card className="group relative overflow-hidden transition-all hover:shadow-lg">
        <CardContent className="p-6">
          {/* Header */}
          <div className="mb-4 flex items-start justify-between">
            <div>
              <h3 className="font-semibold group-hover:text-primary">
                {device.name}
              </h3>
              <p className="text-xs text-muted-foreground">
                {device.model ?? "Qingping"}
              </p>
            </div>
            <Badge variant={isOnline ? "default" : "secondary"} className="gap-1">
              {isOnline ? (
                <>
                  <Wifi className="h-3 w-3" />
                  Online
                </>
              ) : (
                <>
                  <WifiOff className="h-3 w-3" />
                  Offline
                </>
              )}
            </Badge>
          </div>

          {/* Key Metrics */}
          {reading ? (
            <div className="grid grid-cols-2 gap-4">
              {/* PM2.5 */}
              <div>
                <p className="text-xs text-muted-foreground">PM2.5</p>
                <p
                  className={`text-2xl font-bold ${pm25Level?.color ?? "text-foreground"}`}
                >
                  {reading.pm25 ?? "--"}
                  <span className="ml-1 text-sm font-normal text-muted-foreground">
                    µg/m³
                  </span>
                </p>
              </div>
              {/* CO2 */}
              <div>
                <p className="text-xs text-muted-foreground">CO₂</p>
                <p
                  className={`text-2xl font-bold ${co2Level?.color ?? "text-foreground"}`}
                >
                  {reading.co2 ?? "--"}
                  <span className="ml-1 text-sm font-normal text-muted-foreground">
                    ppm
                  </span>
                </p>
              </div>
              {/* Temperature */}
              <div>
                <p className="text-xs text-muted-foreground">Temp</p>
                <p className="text-lg font-semibold">
                  {reading.tempC !== undefined ? `${reading.tempC}°C` : "--"}
                </p>
              </div>
              {/* Humidity */}
              <div>
                <p className="text-xs text-muted-foreground">Humidity</p>
                <p className="text-lg font-semibold">
                  {reading.rh !== undefined ? `${reading.rh}%` : "--"}
                </p>
              </div>
            </div>
          ) : (
            <div className="py-4 text-center text-sm text-muted-foreground">
              No readings yet
            </div>
          )}

          {/* View Details Arrow */}
          <div className="mt-4 flex items-center justify-end text-xs text-muted-foreground group-hover:text-primary">
            View details
            <ChevronRight className="ml-1 h-3 w-3 transition-transform group-hover:translate-x-1" />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
