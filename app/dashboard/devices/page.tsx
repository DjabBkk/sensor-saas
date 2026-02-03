"use client";

import { useEffect, useState } from "react";
import { useAuth, useUser } from "@clerk/nextjs";
import { useMutation, useQuery } from "convex/react";
import Link from "next/link";

import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Card, CardContent } from "@/components/ui/card";
import { getDeviceStatus } from "@/lib/deviceStatus";
import {
  getPM25Level,
  getPM10Level,
  getCO2Level,
  getTemperatureLevel,
  getHumidityLevel,
  getBatteryLevel,
} from "@/lib/aqi-levels";
import { ChevronRight } from "lucide-react";

export default function DevicesPage() {
  const { isLoaded, userId } = useAuth();
  const { user } = useUser();
  const getOrCreateUser = useMutation(api.users.getOrCreateUser);
  const [convexUserId, setConvexUserId] = useState<Id<"users"> | null>(null);

  useEffect(() => {
    if (!isLoaded) return;
    if (!userId || convexUserId || !user) return;

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
  }, [isLoaded, userId, user, convexUserId, getOrCreateUser]);

  const devices = useQuery(
    api.devices.list,
    convexUserId ? { userId: convexUserId } : "skip"
  );

  if (!convexUserId) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Devices</h1>
        <p className="text-muted-foreground">
          All your air quality monitors at a glance
        </p>
      </div>

      {/* Device List */}
      {devices?.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex h-32 items-center justify-center">
            <p className="text-muted-foreground">
              No devices connected yet. Add your first device from the sidebar.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="rounded-lg border border-border bg-card overflow-hidden">
          {devices?.map((device, index) => (
            <div key={device._id}>
              {index > 0 && <div className="mx-4 border-t border-border/50" />}
              <DeviceRow device={device} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

type Device = {
  _id: Id<"devices">;
  name: string;
  model?: string;
  lastReadingAt?: number;
  lastBattery?: number;
  providerOffline?: boolean;
};

function DeviceRow({ device }: { device: Device }) {
  const reading = useQuery(api.readings.latest, { deviceId: device._id });

  const lastReadingAt = reading?.ts ?? device.lastReadingAt;
  const status = getDeviceStatus({
    lastReadingAt,
    lastBattery: device.lastBattery,
    providerOffline: device.providerOffline,
  });

  const pm25Level = reading?.pm25 !== undefined ? getPM25Level(reading.pm25) : null;
  const pm10Level = reading?.pm10 !== undefined ? getPM10Level(reading.pm10) : null;
  const co2Level = reading?.co2 !== undefined ? getCO2Level(reading.co2) : null;
  const tempLevel = reading?.tempC !== undefined ? getTemperatureLevel(reading.tempC) : null;
  const rhLevel = reading?.rh !== undefined ? getHumidityLevel(reading.rh) : null;
  const batteryLevel = reading?.battery !== undefined ? getBatteryLevel(reading.battery) : null;

  return (
    <Link href={`/dashboard/device/${device._id}`}>
      <div className="group flex items-center px-4 py-2.5 hover:bg-muted/50 transition-colors">
        {/* Device Name */}
        <div className="flex items-center gap-2 min-w-[200px]">
          <span
            className={`h-2 w-2 rounded-full flex-shrink-0 ${
              status.isOnline ? "bg-emerald-500" : "bg-red-500"
            }`}
            title={status.isOnline ? "Online" : "Offline"}
          />
          <span className="font-medium text-sm truncate group-hover:text-primary transition-colors">
            {device.name}
          </span>
        </div>

        {/* Metrics */}
        <div className="flex flex-1 items-center">
          <MetricCell label="PM2.5" value={reading?.pm25} level={pm25Level} />
          <MetricCell label="CO₂" value={reading?.co2} level={co2Level} />
          <MetricCell label="Temp" value={reading?.tempC} unit="°" level={tempLevel} />
          <MetricCell label="Humidity" value={reading?.rh} unit="%" level={rhLevel} />
          <MetricCell label="PM10" value={reading?.pm10} level={pm10Level} />
          <MetricCell label="Battery" value={reading?.battery} unit="%" level={batteryLevel} />
        </div>

        {/* Arrow */}
        <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 ml-2" />
      </div>
    </Link>
  );
}

type MetricCellProps = {
  label: string;
  value: number | undefined;
  unit?: string;
  level: { label: string; fillColor: string } | null;
};

function MetricCell({ label, value, unit = "", level }: MetricCellProps) {
  return (
    <div className="flex-1 min-w-[70px] px-2">
      <p className="text-[10px] uppercase tracking-wide text-muted-foreground mb-0.5">
        {label}
      </p>
      <div className="flex items-center gap-1.5">
        {value !== undefined ? (
          <>
            {level && (
              <span
                className="h-2 w-2 rounded-full flex-shrink-0"
                style={{ backgroundColor: level.fillColor }}
              />
            )}
            <span className="text-sm font-medium tabular-nums">
              {Math.round(value)}{unit}
            </span>
          </>
        ) : (
          <span className="text-sm text-muted-foreground">—</span>
        )}
      </div>
    </div>
  );
}
