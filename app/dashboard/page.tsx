"use client";

import { useEffect, useState } from "react";
import { useAuth, useUser } from "@clerk/nextjs";
import { useAction, useMutation, useQuery } from "convex/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getDeviceStatus } from "@/lib/deviceStatus";
import { getPM25Level, getCO2Level } from "./_components/ReadingGauge";
import { Plus, Wifi, WifiOff, ChevronRight } from "lucide-react";

export default function DashboardPage() {
  const router = useRouter();
  const { isLoaded, userId } = useAuth();
  const { user } = useUser();
  const getOrCreateUser = useMutation(api.users.getOrCreateUser);
  const syncDevices = useAction(api.providersActions.syncDevicesForUserPublic);
  const [convexUserId, setConvexUserId] = useState<Id<"users"> | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const [lastSyncedAt, setLastSyncedAt] = useState<number | null>(null);

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

  const handleSyncNow = async () => {
    if (!convexUserId || syncing) return;
    setSyncing(true);
    setSyncMessage(null);

    try {
      await syncDevices({ userId: convexUserId, provider: "qingping" });
      setLastSyncedAt(Date.now());
      setSyncMessage("Sync completed. Updating device status...");
      // Clear success message after 3 seconds
      setTimeout(() => setSyncMessage(null), 3000);
    } catch (error: any) {
      // Check if it's a "function not found" error (Convex dev still syncing)
      const errorMessage = error?.message || String(error);
      if (errorMessage.includes("Could not find public function") || 
          errorMessage.includes("Did you forget to run")) {
        setSyncMessage("Sync function not ready yet. Please wait a moment and try again.");
      } else {
        setSyncMessage("Sync failed. Please check your provider connection.");
      }
      // Don't log to console in production - only in dev
      if (process.env.NODE_ENV === "development") {
        console.error("Sync error:", error);
      }
    } finally {
      setSyncing(false);
    }
  };

  if (!convexUserId) {
    return null;
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="mt-1 text-muted-foreground">
            Overview of your air quality monitors
          </p>
        </div>
        <div className="flex flex-col items-start gap-2 sm:items-end">
          <Button
            variant="outline"
            onClick={handleSyncNow}
            disabled={syncing}
          >
            {syncing ? "Syncing..." : "Sync now"}
          </Button>
          {lastSyncedAt && (
            <span className="text-xs text-muted-foreground">
              Last synced: {formatRelativeTime(lastSyncedAt)}
            </span>
          )}
          {syncMessage && (
            <span className="text-xs text-muted-foreground">{syncMessage}</span>
          )}
        </div>
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
    lastBattery?: number;
    providerOffline?: boolean;
  };
}) {
  const reading = useQuery(api.readings.latest, { deviceId: device._id });

  const lastReadingAt = reading?.ts ?? device.lastReadingAt;
  const status = getDeviceStatus({
    lastReadingAt,
    lastBattery: device.lastBattery,
    providerOffline: device.providerOffline,
  });

  // Show readings even when offline (so users can see last known values)
  const displayReading = reading;
  const pm25Level =
    displayReading?.pm25 !== undefined ? getPM25Level(displayReading.pm25) : null;
  const co2Level =
    displayReading?.co2 !== undefined ? getCO2Level(displayReading.co2) : null;

  const offlineReasonLabel = getOfflineReasonLabel(status.offlineReason);
  const lastReadingLabel = lastReadingAt
    ? `Last reading: ${formatRelativeTime(lastReadingAt)}`
    : "Last reading: never";

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
              <p className="mt-1 text-xs text-muted-foreground">{lastReadingLabel}</p>
            </div>
            <Badge
              variant={status.isOnline ? "default" : "secondary"}
              className={`gap-1 ${status.isOnline ? "bg-emerald-500 hover:bg-emerald-600" : ""}`}
            >
              {status.isOnline ? (
                <>
                  <Wifi className="h-3 w-3 text-white" />
                  <span className="text-white">Online</span>
                </>
              ) : (
                <>
                  <WifiOff className="h-3 w-3" />
                  {offlineReasonLabel ? `Offline: ${offlineReasonLabel}` : "Offline"}
                </>
              )}
            </Badge>
          </div>

          {/* Key Metrics */}
          {displayReading ? (
            <div className="grid grid-cols-2 gap-4">
              {/* PM2.5 */}
              <div>
                <p className="text-xs text-muted-foreground">PM2.5</p>
                <p
                  className={`text-2xl font-bold ${pm25Level?.color ?? "text-foreground"}`}
                >
                  {displayReading.pm25 ?? "--"}
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
                  {displayReading.co2 ?? "--"}
                  <span className="ml-1 text-sm font-normal text-muted-foreground">
                    ppm
                  </span>
                </p>
              </div>
              {/* Temperature */}
              <div>
                <p className="text-xs text-muted-foreground">Temp</p>
                <p className="text-lg font-semibold">
                  {displayReading.tempC !== undefined ? `${displayReading.tempC}°C` : "--"}
                </p>
              </div>
              {/* Humidity */}
              <div>
                <p className="text-xs text-muted-foreground">Humidity</p>
                <p className="text-lg font-semibold">
                  {displayReading.rh !== undefined ? `${displayReading.rh}%` : "--"}
                </p>
              </div>
              {/* Battery */}
              <div>
                <p className="text-xs text-muted-foreground">Battery</p>
                <p className="text-lg font-semibold">
                  {device.lastBattery !== undefined
                    ? `${device.lastBattery}%`
                    : displayReading?.battery !== undefined
                      ? `${displayReading.battery}%`
                      : "--"}
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

function formatRelativeTime(timestampMs: number) {
  const diffMs = Date.now() - timestampMs;
  if (diffMs < 0) return "just now";
  const seconds = Math.floor(diffMs / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function getOfflineReasonLabel(
  reason: "battery" | "provider" | "stale" | "unknown" | null
) {
  switch (reason) {
    case "battery":
      return "Battery empty";
    case "provider":
      return "Disconnected";
    case "stale":
      return "No readings yet";
    case "unknown":
      return "Unknown";
    default:
      return null;
  }
}
