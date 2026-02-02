"use client";

import { Id } from "@/convex/_generated/dataModel";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getDeviceStatus } from "@/lib/deviceStatus";
import { RadialGauge } from "@/components/ui/radial-gauge";
import {
  getPM25Level,
  getPM10Level,
  getCO2Level,
  getTemperatureLevel,
  getHumidityLevel,
  getBatteryLevel,
} from "@/lib/aqi-levels";
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

// Get badge variant based on AQI level
const getAQIBadgeVariant = (label: string): "default" | "secondary" | "destructive" => {
  if (label === "Good" || label === "Excellent") return "default";
  if (label === "Moderate" || label === "Cool" || label === "Comfortable") return "secondary";
  return "destructive";
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
  const pm25BadgeVariant = pm25Level ? getAQIBadgeVariant(pm25Level.label) : "secondary";
  
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
            <Badge variant={pm25BadgeVariant}>{pm25Level.label}</Badge>
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

      {/* Main Readings Grid with Radial Gauges */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <RadialGauge
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
        <RadialGauge
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
        <RadialGauge
          label="Temperature"
          value={displayReading?.tempC}
          unit="°C"
          icon={<Thermometer className="h-4 w-4" />}
          level={
            displayReading?.tempC !== undefined
              ? getTemperatureLevel(displayReading.tempC)
              : null
          }
        />
        <RadialGauge
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
        <RadialGauge
          label="PM10"
          value={displayReading?.pm10}
          unit="µg/m³"
          icon={<Wind className="h-4 w-4" />}
          level={
            displayReading?.pm10 !== undefined
              ? getPM10Level(displayReading.pm10)
              : null
          }
        />
        <RadialGauge
          label="Battery"
          value={displayReading?.battery}
          unit="%"
          icon={<Battery className="h-4 w-4" />}
          level={
            displayReading?.battery !== undefined
              ? getBatteryLevel(displayReading.battery)
              : null
          }
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

