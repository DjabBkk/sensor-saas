"use client";

import { Id } from "@/convex/_generated/dataModel";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getDeviceStatus } from "@/lib/deviceStatus";
import {
  Thermometer,
  Droplets,
  Wind,
  Gauge,
  Battery,
  Wifi,
  WifiOff,
} from "lucide-react";

type Reading = {
  _id: Id<"readings">;
  deviceId: Id<"devices">;
  ts: number;
  pm25?: number;
  pm10?: number;
  co2?: number;
  tempC?: number;
  rh?: number;
  voc?: number;
  pressure?: number;
  battery?: number;
  aqi?: number;
};

type Device = {
  _id: Id<"devices">;
  name: string;
  model?: string;
  lastReadingAt?: number;
  lastBattery?: number;
  providerOffline?: boolean;
};

type DeviceCardProps = {
  device: Device;
  reading: Reading | null;
};

// AQI levels for PM2.5 (EPA standard)
const getPM25Level = (value: number) => {
  if (value <= 12) return { label: "Good", color: "text-emerald-500", variant: "default" as const };
  if (value <= 35.4) return { label: "Moderate", color: "text-yellow-500", variant: "secondary" as const };
  if (value <= 55.4) return { label: "Unhealthy*", color: "text-orange-500", variant: "secondary" as const };
  if (value <= 150.4) return { label: "Unhealthy", color: "text-red-500", variant: "destructive" as const };
  return { label: "Very Unhealthy", color: "text-purple-500", variant: "destructive" as const };
};

const getCO2Level = (value: number) => {
  if (value <= 600) return { label: "Excellent", color: "text-emerald-500" };
  if (value <= 800) return { label: "Good", color: "text-green-500" };
  if (value <= 1000) return { label: "Moderate", color: "text-yellow-500" };
  if (value <= 1500) return { label: "Poor", color: "text-orange-500" };
  return { label: "Very Poor", color: "text-red-500" };
};

const getTempLevel = (value: number) => {
  if (value < 16) return { label: "Cold", color: "text-blue-500" };
  if (value <= 22) return { label: "Cool", color: "text-cyan-500" };
  if (value <= 26) return { label: "Comfortable", color: "text-emerald-500" };
  if (value <= 30) return { label: "Warm", color: "text-yellow-500" };
  return { label: "Hot", color: "text-red-500" };
};

const getHumidityLevel = (value: number) => {
  if (value < 30) return { label: "Too Dry", color: "text-yellow-500" };
  if (value <= 60) return { label: "Comfortable", color: "text-emerald-500" };
  return { label: "Too Humid", color: "text-blue-500" };
};

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

export function DeviceCard({ device, reading }: DeviceCardProps) {
  const status = getDeviceStatus({
    lastReadingAt: reading?.ts ?? device.lastReadingAt,
    lastBattery: device.lastBattery,
    providerOffline: device.providerOffline,
  });

  // Show readings even when offline (so users can see last known values)
  const displayReading = reading;
  const lastReadingAt = reading?.ts ?? device.lastReadingAt;
  const lastUpdated = lastReadingAt
    ? formatRelativeTime(lastReadingAt)
    : "Never";

  const pm25Level =
    displayReading?.pm25 !== undefined ? getPM25Level(displayReading.pm25) : null;
  
  const offlineReasonLabel = getOfflineReasonLabel(status.offlineReason);

  return (
    <div className="space-y-6">
      {/* Device Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">{device.name}</h2>
          <p className="text-sm text-muted-foreground">
            {device.model ?? "Qingping Air Monitor"}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {pm25Level && (
            <Badge variant={pm25Level.variant}>{pm25Level.label}</Badge>
          )}
          {status.isOnline ? (
            <Badge variant="default" className="gap-1 bg-emerald-500 hover:bg-emerald-600">
              <Wifi className="h-3 w-3 text-white" />
              <span className="text-white">Online</span>
            </Badge>
          ) : (
            <Badge variant="secondary" className="gap-1">
              <WifiOff className="h-3 w-3" />
              {offlineReasonLabel ? `Offline: ${offlineReasonLabel}` : "Offline"}
            </Badge>
          )}
        </div>
      </div>

      <p className="text-xs text-muted-foreground">Last reading: {lastUpdated}</p>

      {/* Main Readings Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <MetricCard
          label="PM2.5"
          value={displayReading?.pm25}
          unit="µg/m³"
          icon={<Wind className="h-4 w-4" />}
          level={
            displayReading?.pm25 !== undefined
              ? getPM25Level(displayReading.pm25)
              : null
          }
        />
        <MetricCard
          label="CO₂"
          value={displayReading?.co2}
          unit="ppm"
          icon={<Gauge className="h-4 w-4" />}
          level={
            displayReading?.co2 !== undefined
              ? getCO2Level(displayReading.co2)
              : null
          }
        />
        <MetricCard
          label="Temperature"
          value={displayReading?.tempC}
          unit="°C"
          icon={<Thermometer className="h-4 w-4" />}
          level={
            displayReading?.tempC !== undefined
              ? getTempLevel(displayReading.tempC)
              : null
          }
        />
        <MetricCard
          label="Humidity"
          value={displayReading?.rh}
          unit="%"
          icon={<Droplets className="h-4 w-4" />}
          level={
            displayReading?.rh !== undefined
              ? getHumidityLevel(displayReading.rh)
              : null
          }
        />
        <MetricCard
          label="PM10"
          value={displayReading?.pm10}
          unit="µg/m³"
          icon={<Wind className="h-4 w-4" />}
          level={
            displayReading?.pm10 !== undefined
              ? getPM25Level(displayReading.pm10)
              : null
          }
        />
        <MetricCard
          label="Battery"
          value={displayReading?.battery}
          unit="%"
          icon={<Battery className="h-4 w-4" />}
          level={null}
        />
      </div>

      {/* No Data State */}
      {!displayReading && (
        <Card className="border-dashed">
          <CardContent className="flex items-center justify-center py-8">
            <p className="text-muted-foreground">
              No readings yet. Data will appear once the device syncs.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function MetricCard({
  label,
  value,
  unit,
  icon,
  level,
}: {
  label: string;
  value: number | undefined;
  unit: string;
  icon: React.ReactNode;
  level: { label: string; color: string } | null;
}) {
  const hasValue = value !== undefined && value !== null;

  return (
    <Card>
      <CardContent className="p-6">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2 text-muted-foreground">
            {icon}
            <span className="text-sm font-medium">{label}</span>
          </div>
          {level && (
            <Badge variant="secondary" className="text-xs">
              {level.label}
            </Badge>
          )}
        </div>
        <div className="flex items-baseline gap-2">
          {hasValue ? (
            <>
              <span
                className={`text-3xl font-bold tabular-nums ${level?.color ?? "text-foreground"}`}
              >
                {typeof value === "number" && value % 1 !== 0
                  ? value.toFixed(1)
                  : value}
              </span>
              <span className="text-lg text-muted-foreground">{unit}</span>
            </>
          ) : (
            <span className="text-2xl text-muted-foreground">--</span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
