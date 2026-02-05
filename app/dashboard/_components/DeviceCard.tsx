"use client";

import { useEffect, useMemo, useState } from "react";
import { useQuery } from "convex/react";
import { Id } from "@/convex/_generated/dataModel";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { getDeviceStatus } from "@/lib/deviceStatus";
import { RadialGaugeCard } from "@/components/ui/radial-gauge";
import { DeviceSettingsDialog } from "@/app/dashboard/_components/DeviceSettingsDialog";
import { Button } from "@/components/ui/button";
import {
  getPM25Level,
  getPM10Level,
  getCO2Level,
  getTemperatureLevel,
  getHumidityLevel,
  getBatteryLevel,
  getTVOCLevel,
} from "@/lib/aqi-levels";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { Settings } from "lucide-react";
import { Badge } from "@/components/ui/badge";

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
  userId: Id<"users">;
  name: string;
  model?: string;
  lastReadingAt?: number;
  lastBattery?: number;
  providerOffline?: boolean;
  hiddenMetrics?: string[];
  dashboardMetrics?: string[];
  reportInterval?: number;
};

type DeviceCardProps = {
  device: Device;
  reading: Reading | null;
};

// Chart colors for each metric
const METRIC_COLORS: Record<string, string> = {
  pm25: "#EF4444",    // Red
  co2: "#F59E0B",     // Amber
  temperature: "#3B82F6", // Blue
  humidity: "#06B6D4",    // Cyan
  pm10: "#8B5CF6",    // Purple
  voc: "#10B981",     // Emerald
};

// Metric labels and units for the chart
const METRIC_INFO: Record<string, { label: string; unit: string }> = {
  pm25: { label: "PM2.5", unit: "µg/m³" },
  co2: { label: "CO₂", unit: "ppm" },
  temperature: { label: "Temperature", unit: "°C" },
  humidity: { label: "Humidity", unit: "%" },
  pm10: { label: "PM10", unit: "µg/m³" },
  voc: { label: "TVOC", unit: "ppb" },
};

const CHART_METRICS = ["pm25", "co2", "temperature", "humidity", "pm10", "voc"] as const;
const TIME_RANGES = {
  "1d": { days: 1, label: "Today" },
  "7d": { days: 7, label: "Last 7 days" },
  "30d": { days: 30, label: "Last 30 days" },
  "90d": { days: 90, label: "Last 3 months" },
} as const;

const getXAxisTickFormatter = (range: keyof typeof TIME_RANGES) => {
  if (range === "1d") {
    return (value: number) =>
      new Date(value).toLocaleTimeString("en-US", {
        hour: "numeric",
        hour12: true,
      });
  }
  if (range === "7d") {
    return (value: number) =>
      new Date(value).toLocaleDateString("en-US", {
        weekday: "short",
        day: "numeric",
      });
  }
  return (value: number) =>
    new Date(value).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
};

const getTooltipLabelFormatter = (range: keyof typeof TIME_RANGES) => {
  if (range === "1d") {
    return (value: number) =>
      new Date(value).toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      });
  }
  return (value: number) =>
    new Date(value).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
};

function getOfflineReasonLabel(
  reason: "battery" | "provider" | "stale" | "overdue" | "unknown" | null
) {
  switch (reason) {
    case "battery":
      return "Battery empty";
    case "provider":
      return "Disconnected";
    case "stale":
      return "No readings yet";
    case "overdue":
      return "May be offline";
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
    reportInterval: device.reportInterval,
  });

  // Track which metrics are selected for comparison (right is optional)
  const [leftMetric, setLeftMetric] = useState("pm25");
  const [rightMetric, setRightMetric] = useState<string | null>("co2");
  const [timeRange, setTimeRange] = useState("30d");

  const hiddenMetricsSet = useMemo(
    () => new Set(device.hiddenMetrics ?? []),
    [device.hiddenMetrics]
  );

  const visibleChartMetrics = useMemo(
    () => CHART_METRICS.filter((metric) => !hiddenMetricsSet.has(metric)),
    [hiddenMetricsSet]
  );

  const hasChartMetrics = visibleChartMetrics.length > 0;

  useEffect(() => {
    if (!hasChartMetrics) {
      setRightMetric(null);
      return;
    }

    if (!visibleChartMetrics.includes(leftMetric as typeof CHART_METRICS[number])) {
      setLeftMetric(visibleChartMetrics[0]);
    }

    if (rightMetric && !visibleChartMetrics.includes(rightMetric as typeof CHART_METRICS[number])) {
      setRightMetric(null);
    }

    if (rightMetric && rightMetric === leftMetric) {
      setRightMetric(null);
    }
  }, [hasChartMetrics, leftMetric, rightMetric, visibleChartMetrics]);

  // Handle clicking a metric card - toggles selection
  const handleMetricClick = (metric: string) => {
    if (!CHART_METRICS.includes(metric as typeof CHART_METRICS[number])) {
      return;
    }
    if (metric === leftMetric) {
      // Clicking the left metric: if there's a right, swap them and clear right
      if (rightMetric) {
        setLeftMetric(rightMetric);
        setRightMetric(null);
      }
      // If no right metric, do nothing (must have at least one)
      return;
    }
    if (metric === rightMetric) {
      // Clicking the right metric: deselect it
      setRightMetric(null);
      return;
    }
    // Clicking a new metric: add it as the right metric (or replace if already have two)
    if (rightMetric === null) {
      setRightMetric(metric);
    } else {
      // Already have two selected, replace right with new one
      setRightMetric(metric);
    }
  };

  // Show readings even when offline (so users can see last known values)
  const displayReading = reading;
  const lastReadingAt = reading?.ts ?? device.lastReadingAt;
  const lastUpdated = lastReadingAt
    ? formatRelativeTime(lastReadingAt)
    : "Never";

  const offlineReasonLabel = getOfflineReasonLabel(status.offlineReason);

  const gaugeMetrics = useMemo(
    () => [
      {
        key: "pm25",
        label: "PM2.5",
        unit: "µg/m³",
        value: displayReading?.pm25,
        level:
          displayReading?.pm25 !== undefined
            ? getPM25Level(displayReading.pm25)
            : null,
      },
      {
        key: "co2",
        label: "CO₂",
        unit: "ppm",
        value: displayReading?.co2,
        level:
          displayReading?.co2 !== undefined
            ? getCO2Level(displayReading.co2)
            : null,
      },
      {
        key: "temperature",
        label: "Temperature",
        unit: "°C",
        value: displayReading?.tempC,
        level:
          displayReading?.tempC !== undefined
            ? getTemperatureLevel(displayReading.tempC)
            : null,
      },
      {
        key: "humidity",
        label: "Humidity",
        unit: "%",
        value: displayReading?.rh,
        level:
          displayReading?.rh !== undefined
            ? getHumidityLevel(displayReading.rh)
            : null,
      },
      {
        key: "pm10",
        label: "PM10",
        unit: "µg/m³",
        value: displayReading?.pm10,
        level:
          displayReading?.pm10 !== undefined
            ? getPM10Level(displayReading.pm10)
            : null,
      },
      {
        key: "voc",
        label: "TVOC",
        unit: "ppb",
        value: displayReading?.voc,
        level:
          displayReading?.voc !== undefined
            ? getTVOCLevel(displayReading.voc)
            : null,
      },
      {
        key: "battery",
        label: "Battery",
        unit: "%",
        value: displayReading?.battery,
        level:
          displayReading?.battery !== undefined
            ? getBatteryLevel(displayReading.battery)
            : null,
      },
    ],
    [displayReading]
  );

  const visibleGaugeMetrics = gaugeMetrics.filter(
    (metric) => !hiddenMetricsSet.has(metric.key)
  );

  const availableMetricKeys = useMemo(() => {
    if (!reading) return undefined;
    const keys: string[] = [];
    if (reading.pm25 !== undefined) keys.push("pm25");
    if (reading.co2 !== undefined) keys.push("co2");
    if (reading.tempC !== undefined) keys.push("temperature");
    if (reading.rh !== undefined) keys.push("humidity");
    if (reading.pm10 !== undefined) keys.push("pm10");
    if (reading.voc !== undefined) keys.push("voc");
    if (reading.battery !== undefined) keys.push("battery");
    return keys;
  }, [reading]);

  // Calculate time range for history query
  const timeRangeMs = useMemo(() => {
    const now = Date.now();
    const range = TIME_RANGES[timeRange as keyof typeof TIME_RANGES];
    const days = range?.days ?? 30;
    const startTs = now - days * 24 * 60 * 60 * 1000;
    // Ensure domain is always valid (startTs < endTs) and has at least 1 hour difference to avoid duplicate ticks
    const endTs = Math.max(now, startTs + 60 * 60 * 1000);
    return {
      startTs,
      endTs,
    };
  }, [timeRange]);

  // Generate explicit tick values to avoid duplicate key errors in Recharts
  const xAxisTicks = useMemo(() => {
    const { startTs, endTs } = timeRangeMs;
    const tickCount = 5; // Number of ticks to show
    const step = (endTs - startTs) / (tickCount - 1);
    const ticks: number[] = [];
    for (let i = 0; i < tickCount; i++) {
      ticks.push(Math.round(startTs + step * i));
    }
    return ticks;
  }, [timeRangeMs]);

  // Fetch real historical data
  const historyReadings = useQuery(api.readings.history, {
    deviceId: device._id,
    startTs: timeRangeMs.startTs,
    endTs: timeRangeMs.endTs,
    limit: 1000, // Adjust based on your needs
  });

  // Transform readings data to chart format
  // Query returns data in descending order (newest first), so we reverse to get chronological (oldest first, left to right)
  const historyData = useMemo(() => {
    if (!historyReadings || historyReadings.length === 0) {
      return [];
    }

    // Sort by timestamp ascending (oldest first) to ensure left-to-right chronological display
    return historyReadings
      .slice()
      .sort((a, b) => a.ts - b.ts)
      .map((reading) => ({
        ts: reading.ts,
        pm25: reading.pm25,
        co2: reading.co2,
        temperature: reading.tempC,
        humidity: reading.rh,
        pm10: reading.pm10,
        voc: reading.voc,
      }));
  }, [historyReadings]);

  // Chart config for selected metrics
  const chartConfig: ChartConfig = {
    pm25: { label: "PM2.5", color: METRIC_COLORS.pm25 },
    co2: { label: "CO₂", color: METRIC_COLORS.co2 },
    temperature: { label: "Temp", color: METRIC_COLORS.temperature },
    humidity: { label: "Humidity", color: METRIC_COLORS.humidity },
    pm10: { label: "PM10", color: METRIC_COLORS.pm10 },
    voc: { label: "TVOC", color: METRIC_COLORS.voc },
  };

  return (
    <div className="space-y-6">
      {/* Device Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-bold">{device.name}</h2>
              {/* Status dot - green: online, amber: overdue, red: confirmed offline */}
              <span
                className={`h-2.5 w-2.5 rounded-full ${
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
                      ? `No data for ${status.overdueMinutes ?? "?"} min`
                      : "Offline"
                }
              />
              <DeviceSettingsDialog
                deviceId={device._id}
                userId={device.userId}
                deviceName={device.name}
                hiddenMetrics={device.hiddenMetrics}
                availableMetrics={availableMetricKeys}
                reportInterval={device.reportInterval}
                trigger={
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-foreground"
                    aria-label="Open device settings"
                  >
                    <Settings className="h-4 w-4" />
                  </Button>
                }
              />
              {/* Offline warning badge - inline with gear icon */}
              {status.isReadingOverdue && (
                <Badge 
                  variant="outline" 
                  className="border-amber-500/50 bg-amber-500/10 text-amber-700 dark:text-amber-400"
                >
                  Device offline for {status.overdueMinutes ?? "?"} minutes. Check status or charge battery.
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              {device.model ?? "Qingping"}
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-sm text-muted-foreground">
            {status.isOnline ? "Online" : offlineReasonLabel ?? "Offline"}
          </p>
          <p className="text-xs text-muted-foreground">
            Last reading: {lastUpdated}
          </p>
        </div>
      </div>

      {/* Main Readings Grid - 6 columns, click to add/remove from comparison */}
      {displayReading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {visibleGaugeMetrics.map((metric) => (
            <RadialGaugeCard
              key={metric.key}
              label={metric.label}
              value={metric.value}
              unit={metric.unit}
              level={metric.level}
              selected={leftMetric === metric.key || rightMetric === metric.key}
              onClick={
                CHART_METRICS.includes(metric.key as typeof CHART_METRICS[number])
                  ? () => handleMetricClick(metric.key)
                  : undefined
              }
            />
          ))}
        </div>
      ) : (
        <Card className="border-dashed">
          <CardContent className="flex items-center justify-center py-8">
            <p className="text-muted-foreground">
              No readings yet. Data will appear once the device syncs.
            </p>
          </CardContent>
        </Card>
      )}

      {/* History Chart with Optional Dual Y-Axes */}
      {displayReading && (
        <Card className="pt-0">
          <CardHeader className="flex flex-col gap-4 space-y-0 border-b py-5 sm:flex-row sm:items-center">
            <div className="grid flex-1 gap-1">
              <CardTitle>Reading History</CardTitle>
              <CardDescription>
                Click metric cards to add/remove from chart
              </CardDescription>
            </div>
            <div className="text-xs text-muted-foreground">
              {historyData.length > 0
                ? `${historyData.length} readings`
                : "No data for this range"}
            </div>
            <div className="flex flex-wrap items-center gap-3">
              {/* Primary metric selector */}
              <div className="flex items-center gap-2">
                <div 
                  className="h-3 w-3 rounded-full" 
                  style={{ backgroundColor: METRIC_COLORS[leftMetric] }}
                />
                <Select value={leftMetric} onValueChange={setLeftMetric}>
                  <SelectTrigger className="w-[130px] rounded-lg" aria-label="Primary metric">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    {visibleChartMetrics.map((key) => (
                      <SelectItem
                        key={key}
                        value={key}
                        className="rounded-lg"
                        disabled={key === rightMetric}
                      >
                        {METRIC_INFO[key].label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Compare with (optional) */}
              <span className="text-muted-foreground text-sm">vs</span>

              <div className="flex items-center gap-2">
                {rightMetric && (
                  <div 
                    className="h-3 w-3 rounded-full" 
                    style={{ backgroundColor: METRIC_COLORS[rightMetric] }}
                  />
                )}
                <Select
                  value={rightMetric ?? "none"} 
                  onValueChange={(val) => setRightMetric(val === "none" ? null : val)}
                >
                  <SelectTrigger className="w-[130px] rounded-lg" aria-label="Compare with metric">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="none" className="rounded-lg text-muted-foreground">
                      None
                    </SelectItem>
                    {visibleChartMetrics.map((key) => (
                      <SelectItem
                        key={key}
                        value={key}
                        className="rounded-lg"
                        disabled={key === leftMetric}
                      >
                        {METRIC_INFO[key].label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Time range selector */}
              <Select value={timeRange} onValueChange={setTimeRange}>
                <SelectTrigger className="w-[160px] rounded-lg" aria-label="Select time range">
                  <SelectValue placeholder="Last 30 days" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  {Object.entries(TIME_RANGES).map(([value, { label }]) => (
                    <SelectItem key={value} value={value} className="rounded-lg">
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent className="px-2 pt-4 pr-8 sm:px-6 sm:pr-12 sm:pt-6">
            {hasChartMetrics && historyData.length > 0 ? (
              <ChartContainer
                config={chartConfig}
                className="aspect-auto h-[300px] w-full"
              >
                <AreaChart 
                  data={historyData}
                  margin={{ top: 10, right: 30, bottom: 10, left: 0 }}
                >
                  <defs>
                    <linearGradient id={`fill-${leftMetric}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={METRIC_COLORS[leftMetric]} stopOpacity={0.8} />
                      <stop offset="95%" stopColor={METRIC_COLORS[leftMetric]} stopOpacity={0.1} />
                    </linearGradient>
                    {rightMetric && (
                      <linearGradient id={`fill-${rightMetric}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={METRIC_COLORS[rightMetric]} stopOpacity={0.8} />
                        <stop offset="95%" stopColor={METRIC_COLORS[rightMetric]} stopOpacity={0.1} />
                      </linearGradient>
                    )}
                  </defs>
                  <CartesianGrid vertical={false} strokeDasharray="3 3" />
                  <XAxis
                    dataKey="ts"
                    type="number"
                    scale="time"
                    domain={[timeRangeMs.startTs, timeRangeMs.endTs]}
                    ticks={xAxisTicks}
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    tickFormatter={getXAxisTickFormatter(
                      timeRange as keyof typeof TIME_RANGES,
                    )}
                  />
                  {/* Left Y-Axis (primary) */}
                  <YAxis
                    yAxisId="left"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    width={50}
                    stroke={METRIC_COLORS[leftMetric]}
                    tickFormatter={(value) => `${value}`}
                    label={{
                      value: `${METRIC_INFO[leftMetric].label} (${METRIC_INFO[leftMetric].unit})`,
                      angle: -90,
                      position: "insideLeft",
                      style: { textAnchor: "middle", fill: METRIC_COLORS[leftMetric], fontSize: 12 },
                    }}
                  />
                  {/* Right Y-Axis (optional comparison) */}
                  {rightMetric && (
                    <YAxis
                      yAxisId="right"
                      orientation="right"
                      tickLine={false}
                      axisLine={false}
                      tickMargin={8}
                      width={50}
                      stroke={METRIC_COLORS[rightMetric]}
                      tickFormatter={(value) => `${value}`}
                      label={{
                        value: `${METRIC_INFO[rightMetric].label} (${METRIC_INFO[rightMetric].unit})`,
                        angle: 90,
                        position: "insideRight",
                        style: {
                          textAnchor: "middle",
                          fill: METRIC_COLORS[rightMetric],
                          fontSize: 12,
                        },
                      }}
                    />
                  )}
                  <ChartTooltip
                    cursor={false}
                    content={
                      <ChartTooltipContent
                        labelFormatter={getTooltipLabelFormatter(
                          timeRange as keyof typeof TIME_RANGES,
                        )}
                        indicator="dot"
                      />
                    }
                  />
                  {/* Primary metric area */}
                  <Area
                    yAxisId="left"
                    dataKey={leftMetric}
                    type="monotone"
                    fill={`url(#fill-${leftMetric})`}
                    stroke={METRIC_COLORS[leftMetric]}
                    strokeWidth={2}
                    name={METRIC_INFO[leftMetric].label}
                    connectNulls={false}
                  />
                  {/* Comparison metric area (optional) */}
                  {rightMetric && (
                    <Area
                      yAxisId="right"
                      dataKey={rightMetric}
                      type="monotone"
                      fill={`url(#fill-${rightMetric})`}
                      stroke={METRIC_COLORS[rightMetric]}
                      strokeWidth={2}
                      name={METRIC_INFO[rightMetric].label}
                      connectNulls={false}
                    />
                  )}
                  <ChartLegend content={<ChartLegendContent />} />
                </AreaChart>
              </ChartContainer>
            ) : hasChartMetrics ? (
              <div className="flex h-[220px] items-center justify-center text-sm text-muted-foreground">
                No readings available for the selected time range.
              </div>
            ) : (
              <div className="flex h-[220px] items-center justify-center text-sm text-muted-foreground">
                No chart metrics enabled. Enable one in settings.
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
