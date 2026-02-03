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
import { getDeviceStatus } from "@/lib/deviceStatus";
import { getPM25Level, getCO2Level } from "@/lib/aqi-levels";
import { RadialGaugeInline } from "@/components/ui/radial-gauge";
import { Plus, ChevronRight } from "lucide-react";
import { useAddDeviceDialog } from "./_components/add-device-context";

export default function DashboardPage() {
  const router = useRouter();
  const { isLoaded, userId } = useAuth();
  const { user } = useUser();
  const getOrCreateUser = useMutation(api.users.getOrCreateUser);
  const syncDevices = useAction(api.providersActions.syncDevicesForUserPublic);
  const { openDialog } = useAddDeviceDialog();
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
              Connect your first air quality monitor to start tracking your
              indoor air quality.
            </p>
            <Button className="mt-6" onClick={openDialog}>
              Connect Device
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

// Mini device card for the overview - name on top, gauges below
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
  return (
    <Link href={`/dashboard/device/${device._id}`}>
      <Card className="group relative overflow-hidden transition-all hover:shadow-lg w-full">
        <CardContent className="pl-6 pr-8 pt-5 pb-5">
          {/* Top: Device name, model, and status */}
          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold group-hover:text-primary">
                  {device.name}
                </h3>
                {/* Status dot */}
                <span
                  className={`h-2.5 w-2.5 rounded-full ${
                    status.isOnline ? "bg-emerald-500" : "bg-red-500"
                  }`}
                  title={status.isOnline ? "Online" : "Offline"}
                />
              </div>
              <p className="text-sm text-muted-foreground mt-0.5">
                {device.model ?? "Qingping"}
              </p>
            </div>
            <ChevronRight className="h-5 w-5 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 ml-4" />
          </div>

          {/* Bottom: Radial gauges - left aligned */}
          {displayReading ? (
            <div className="flex items-center justify-start gap-6">
              <RadialGaugeInline
                label="PM2.5"
                value={displayReading.pm25}
                unit="µg/m³"
                level={pm25Level}
              />
              <RadialGaugeInline
                label="CO₂"
                value={displayReading.co2}
                unit="ppm"
                level={co2Level}
              />
            </div>
          ) : (
            <div className="py-4 text-sm text-muted-foreground">
              No readings yet
            </div>
          )}
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
