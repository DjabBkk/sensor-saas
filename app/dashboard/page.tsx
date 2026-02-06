"use client";

import { useMemo, useState, useEffect } from "react";
import { useAuth, useUser } from "@clerk/nextjs";
import { useMutation, useQuery } from "convex/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getDeviceStatus, formatDuration } from "@/lib/deviceStatus";
import {
  getPM25Level,
  getPM10Level,
  getCO2Level,
  getTemperatureLevel,
  getHumidityLevel,
  getBatteryLevel,
  getTVOCLevel,
} from "@/lib/aqi-levels";
import { RadialGaugeInline } from "@/components/ui/radial-gauge";
import { SecondaryMetricItem, type MetricKey } from "@/components/ui/secondary-metric";
import { Plus, Settings } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useAddDeviceDialog } from "./_components/add-device-context";
import { DeviceSettingsDialog } from "@/app/dashboard/_components/DeviceSettingsDialog";

export default function DashboardPage() {
  const router = useRouter();
  const { isLoaded, userId } = useAuth();
  const { user } = useUser();
  const getOrCreateUser = useMutation(api.users.getOrCreateUser);
  const { openDialog } = useAddDeviceDialog();
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
        <div className="grid gap-6 grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {devices.map((device) => (
            <DeviceOverviewCard
              key={device._id}
              device={device}
              userId={convexUserId}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// Mini device card for the overview - name on top, gauges below
function DeviceOverviewCard({
  device,
  userId,
}: {
  device: {
    _id: Id<"devices">;
    userId: Id<"users">;
    name: string;
    model?: string;
    lastReadingAt?: number;
    lastBattery?: number;
    providerOffline?: boolean;
    dashboardMetrics?: string[];
    primaryMetrics?: string[];
    secondaryMetrics?: string[];
    hiddenMetrics?: string[];
    reportInterval?: number;
  };
  userId: Id<"users">;
}) {
  const reading = useQuery(api.readings.latest, { deviceId: device._id });

  const lastReadingAt = reading?.ts ?? device.lastReadingAt;
  const status = getDeviceStatus({
    lastReadingAt,
    lastBattery: device.lastBattery,
    providerOffline: device.providerOffline,
    reportInterval: device.reportInterval,
  });

  // Show readings even when offline (so users can see last known values)
  const displayReading = reading;
  const metricConfig = {
    pm25: {
      label: "PM2.5",
      unit: "µg/m³",
      value: displayReading?.pm25,
      level:
        displayReading?.pm25 !== undefined ? getPM25Level(displayReading.pm25) : null,
    },
    pm10: {
      label: "PM10",
      unit: "µg/m³",
      value: displayReading?.pm10,
      level:
        displayReading?.pm10 !== undefined ? getPM10Level(displayReading.pm10) : null,
    },
    co2: {
      label: "CO₂",
      unit: "ppm",
      value: displayReading?.co2,
      level:
        displayReading?.co2 !== undefined ? getCO2Level(displayReading.co2) : null,
    },
    temperature: {
      label: "Temperature",
      unit: "°C",
      value: displayReading?.tempC,
      level:
        displayReading?.tempC !== undefined
          ? getTemperatureLevel(displayReading.tempC)
          : null,
    },
    humidity: {
      label: "Humidity",
      unit: "%",
      value: displayReading?.rh,
      level:
        displayReading?.rh !== undefined ? getHumidityLevel(displayReading.rh) : null,
    },
    voc: {
      label: "TVOC",
      unit: "ppb",
      value: displayReading?.voc,
      level:
        displayReading?.voc !== undefined ? getTVOCLevel(displayReading.voc) : null,
    },
    battery: {
      label: "Battery",
      unit: "%",
      value: displayReading?.battery,
      level:
        displayReading?.battery !== undefined
          ? getBatteryLevel(displayReading.battery)
          : null,
    },
  } as const;

  const allMetrics = [
    { key: "pm25", label: "PM2.5", readingKey: "pm25" },
    { key: "pm10", label: "PM10", readingKey: "pm10" },
    { key: "co2", label: "CO₂", readingKey: "co2" },
    { key: "temperature", label: "Temperature", readingKey: "tempC" },
    { key: "humidity", label: "Humidity", readingKey: "rh" },
    { key: "voc", label: "TVOC", readingKey: "voc" },
    { key: "battery", label: "Battery", readingKey: "battery" },
  ] as const;

  const availableMetrics = useMemo(() => {
    if (!reading) return [];
    return allMetrics.filter(
      (metric) => reading[metric.readingKey as keyof typeof reading] !== undefined
    );
  }, [reading]);

  const availableMetricKeys = availableMetrics.map((metric) => metric.key);

  // Default primary metrics: first 2 available
  const defaultPrimaryMetrics = useMemo(
    () => availableMetrics.map((metric) => metric.key).slice(0, 2),
    [availableMetrics]
  );

  // Default secondary metrics: next 4 available (after primary)
  const defaultSecondaryMetrics = useMemo(
    () => availableMetrics.map((metric) => metric.key).slice(2, 6),
    [availableMetrics]
  );

  // Use stored metrics or fall back to defaults
  const primarySelection =
    device.primaryMetrics && device.primaryMetrics.length > 0
      ? device.primaryMetrics
      : defaultPrimaryMetrics;
  
  const secondarySelection =
    device.secondaryMetrics && device.secondaryMetrics.length > 0
      ? device.secondaryMetrics
      : defaultSecondaryMetrics;

  // Filter to only available metrics
  const selectedPrimaryMetrics = primarySelection
    .filter((key) => availableMetricKeys.includes(key))
    .filter((key) => key in metricConfig)
    .slice(0, 2);

  const selectedSecondaryMetrics = secondarySelection
    .filter((key) => availableMetricKeys.includes(key))
    .filter((key) => key in metricConfig)
    .slice(0, 6);

  const [settingsOpen, setSettingsOpen] = useState(false);

  return (
    <>
      <Link href={`/dashboard/device/${device._id}`}>
        <Card className="group relative overflow-hidden transition-all hover:shadow-lg w-full min-w-[320px]">
          <CardContent className="px-5 pt-5 pb-5">
            {/* Top: Device name, model, and status */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold group-hover:text-primary">
                    {device.name}
                  </h3>
                  {/* Status dot - green: online, amber: overdue, red: confirmed offline */}
                  <span
                    className={`h-2.5 w-2.5 rounded-full flex-shrink-0 ${
                      status.isOnline
                        ? "bg-emerald-500"
                        : status.isReadingOverdue && !status.isProviderOffline && !status.isBatteryEmpty
                          ? "bg-amber-500"
                          : "bg-red-500"
                    }`}
                    title={
                      status.isOnline
                        ? "Online"
                        : status.isReadingOverdue
                          ? `No data for ${formatDuration(status.overdueMinutes)}`
                          : "Offline"
                    }
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-foreground flex-shrink-0"
                    onClick={(event) => {
                      event.preventDefault();
                      event.stopPropagation();
                      setSettingsOpen(true);
                    }}
                    aria-label="Configure device settings"
                  >
                    <Settings className="h-4 w-4" />
                  </Button>
                  {/* Offline warning badge - inline with gear icon */}
                  {status.isReadingOverdue && (
                    <Badge 
                      variant="outline" 
                      className="border-amber-500/50 bg-amber-500/10 text-amber-700 dark:text-amber-400"
                    >
                      Device offline for {formatDuration(status.overdueMinutes)}
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground mt-0.5">
                  {device.model ?? "Qingping"}
                </p>
              </div>
            </div>

            {/* Primary metrics: Hero radial gauges */}
            {displayReading ? (
              <div className="space-y-4">
                {/* Hero gauges - up to 2, left-aligned */}
                {selectedPrimaryMetrics.length > 0 && (
                  <div className="flex gap-6">
                    {selectedPrimaryMetrics.map((key) => {
                      const metric = metricConfig[key as keyof typeof metricConfig];
                      return (
                        <RadialGaugeInline
                          key={key}
                          label={metric.label}
                          value={metric.value}
                          unit={metric.unit}
                          level={metric.level}
                        />
                      );
                    })}
                  </div>
                )}

                {/* Secondary metrics: Compact list with icons */}
                {selectedSecondaryMetrics.length > 0 && (
                  <div className="border-t border-border/40 pt-3 mt-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-0.5">
                      {selectedSecondaryMetrics.map((key) => {
                        const metric = metricConfig[key as keyof typeof metricConfig];
                        return (
                          <SecondaryMetricItem
                            key={key}
                            metricKey={key as MetricKey}
                            label={metric.label}
                            value={metric.value}
                            unit={metric.unit}
                            level={metric.level}
                          />
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="py-4 text-sm text-muted-foreground">
                No readings yet
              </div>
            )}
          </CardContent>
        </Card>
      </Link>

      {/* Settings Dialog - outside the Link to prevent navigation issues */}
      <DeviceSettingsDialog
        deviceId={device._id}
        userId={userId}
        deviceName={device.name}
        hiddenMetrics={device.hiddenMetrics}
        availableMetrics={availableMetricKeys}
        reportInterval={device.reportInterval}
        primaryMetrics={primarySelection}
        secondaryMetrics={secondarySelection}
        dashboardMetricOptions={availableMetrics.map((metric) => ({
          key: metric.key,
          label: metric.label,
        }))}
        hideProfileMetrics={true}
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        trigger={<></>}
      />
    </>
  );
}

