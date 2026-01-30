"use client";

import { Id } from "@/convex/_generated/dataModel";
import {
  ReadingGauge,
  getPM25Level,
  getCO2Level,
  getTempLevel,
  getHumidityLevel,
} from "./ReadingGauge";

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

// Icons as components
const PM25Icon = () => (
  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
  </svg>
);

const CO2Icon = () => (
  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
  </svg>
);

const TempIcon = () => (
  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
  </svg>
);

const HumidityIcon = () => (
  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
  </svg>
);

const PM10Icon = () => (
  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
  </svg>
);

const BatteryIcon = () => (
  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 9v7a2 2 0 002 2h10a2 2 0 002-2V9a2 2 0 00-2-2H7a2 2 0 00-2 2zm12-2v0a2 2 0 012 2v2a2 2 0 01-2 2v0" />
  </svg>
);

export function DeviceCard({ device, reading }: DeviceCardProps) {
  const lastUpdated = reading?.ts
    ? new Date(reading.ts * 1000).toLocaleString()
    : device.lastReadingAt
      ? new Date(device.lastReadingAt).toLocaleString()
      : "Never";

  const isStale =
    reading?.ts && Date.now() / 1000 - reading.ts > 30 * 60; // 30 minutes

  return (
    <div className="space-y-6">
      {/* Device Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-100">{device.name}</h2>
          <p className="text-sm text-slate-500">
            {device.model ?? "Qingping Air Monitor"}
          </p>
        </div>
        <div className="text-right">
          <div className="flex items-center gap-2">
            {isStale ? (
              <span className="flex items-center gap-1.5 rounded-full bg-yellow-500/10 px-3 py-1 text-xs font-medium text-yellow-400">
                <span className="h-1.5 w-1.5 rounded-full bg-yellow-400" />
                Stale Data
              </span>
            ) : reading ? (
              <span className="flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-400">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
                Live
              </span>
            ) : null}
          </div>
          <p className="mt-1 text-xs text-slate-500">Updated: {lastUpdated}</p>
        </div>
      </div>

      {/* Main Readings Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <ReadingGauge
          label="PM2.5"
          value={reading?.pm25}
          unit="µg/m³"
          icon={<PM25Icon />}
          getLevel={getPM25Level}
        />
        <ReadingGauge
          label="CO₂"
          value={reading?.co2}
          unit="ppm"
          icon={<CO2Icon />}
          getLevel={getCO2Level}
        />
        <ReadingGauge
          label="Temperature"
          value={reading?.tempC}
          unit="°C"
          icon={<TempIcon />}
          getLevel={getTempLevel}
        />
        <ReadingGauge
          label="Humidity"
          value={reading?.rh}
          unit="%"
          icon={<HumidityIcon />}
          getLevel={getHumidityLevel}
        />
        <ReadingGauge
          label="PM10"
          value={reading?.pm10}
          unit="µg/m³"
          icon={<PM10Icon />}
          getLevel={getPM25Level}
        />
        <ReadingGauge
          label="Battery"
          value={reading?.battery}
          unit="%"
          icon={<BatteryIcon />}
        />
      </div>

      {/* No Data State */}
      {!reading && (
        <div className="rounded-xl border border-dashed border-slate-700 bg-slate-900/50 p-8 text-center">
          <p className="text-slate-400">
            No readings yet. Data will appear once the device syncs.
          </p>
        </div>
      )}
    </div>
  );
}
