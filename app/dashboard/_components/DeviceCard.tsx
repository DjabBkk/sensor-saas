"use client";

import { Id } from "@/convex/_generated/dataModel";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Thermometer,
  Droplets,
  Wind,
  Gauge,
  Battery,
  Activity,
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

export function DeviceCard({ device, reading }: DeviceCardProps) {
  const lastUpdated = reading?.ts
    ? new Date(reading.ts * 1000).toLocaleString()
    : device.lastReadingAt
      ? new Date(device.lastReadingAt).toLocaleString()
      : "Never";

  const isStale = reading?.ts && Date.now() / 1000 - reading.ts > 30 * 60;
  const pm25Level = reading?.pm25 !== undefined ? getPM25Level(reading.pm25) : null;

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
          {isStale ? (
            <Badge variant="secondary" className="gap-1">
              <Activity className="h-3 w-3" />
              Stale
            </Badge>
          ) : reading ? (
            <Badge variant="default" className="gap-1 bg-emerald-500">
              <Activity className="h-3 w-3" />
              Live
            </Badge>
          ) : null}
        </div>
      </div>

      <p className="text-xs text-muted-foreground">Last updated: {lastUpdated}</p>

      {/* Main Readings Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <MetricCard
          label="PM2.5"
          value={reading?.pm25}
          unit="µg/m³"
          icon={<Wind className="h-4 w-4" />}
          level={reading?.pm25 !== undefined ? getPM25Level(reading.pm25) : null}
        />
        <MetricCard
          label="CO₂"
          value={reading?.co2}
          unit="ppm"
          icon={<Gauge className="h-4 w-4" />}
          level={reading?.co2 !== undefined ? getCO2Level(reading.co2) : null}
        />
        <MetricCard
          label="Temperature"
          value={reading?.tempC}
          unit="°C"
          icon={<Thermometer className="h-4 w-4" />}
          level={reading?.tempC !== undefined ? getTempLevel(reading.tempC) : null}
        />
        <MetricCard
          label="Humidity"
          value={reading?.rh}
          unit="%"
          icon={<Droplets className="h-4 w-4" />}
          level={reading?.rh !== undefined ? getHumidityLevel(reading.rh) : null}
        />
        <MetricCard
          label="PM10"
          value={reading?.pm10}
          unit="µg/m³"
          icon={<Wind className="h-4 w-4" />}
          level={reading?.pm10 !== undefined ? getPM25Level(reading.pm10) : null}
        />
        <MetricCard
          label="Battery"
          value={reading?.battery}
          unit="%"
          icon={<Battery className="h-4 w-4" />}
          level={null}
        />
      </div>

      {/* No Data State */}
      {!reading && (
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
