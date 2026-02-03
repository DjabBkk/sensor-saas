"use client";

import { useEffect, useMemo, useState } from "react";
import { Id } from "@/convex/_generated/dataModel";
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
  hiddenMetrics?: string[];
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
};

// Metric labels and units for the chart
const METRIC_INFO: Record<string, { label: string; unit: string }> = {
  pm25: { label: "PM2.5", unit: "µg/m³" },
  co2: { label: "CO₂", unit: "ppm" },
  temperature: { label: "Temperature", unit: "°C" },
  humidity: { label: "Humidity", unit: "%" },
  pm10: { label: "PM10", unit: "µg/m³" },
};

const CHART_METRICS = ["pm25", "co2", "temperature", "humidity", "pm10"] as const;

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

// Mock historical data generator
function generateMockHistoryData(days: number) {
  const data = [];
  const now = new Date();
  
  for (let i = days; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    
    data.push({
      date: date.toISOString().split('T')[0],
      pm25: Math.floor(Math.random() * 50) + 5,
      co2: Math.floor(Math.random() * 800) + 400,
      temperature: Math.floor(Math.random() * 10) + 20,
      humidity: Math.floor(Math.random() * 40) + 30,
      pm10: Math.floor(Math.random() * 80) + 10,
    });
  }
  
  return data;
}

export function DeviceCard({ device, reading }: DeviceCardProps) {
  const status = getDeviceStatus({
    lastReadingAt: reading?.ts ?? device.lastReadingAt,
    lastBattery: device.lastBattery,
    providerOffline: device.providerOffline,
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

  // Generate mock history data based on time range
  const daysMap: Record<string, number> = { "7d": 7, "30d": 30, "90d": 90 };
  const historyData = generateMockHistoryData(daysMap[timeRange] ?? 30);

  // Chart config for selected metrics
  const chartConfig: ChartConfig = {
    pm25: { label: "PM2.5", color: METRIC_COLORS.pm25 },
    co2: { label: "CO₂", color: METRIC_COLORS.co2 },
    temperature: { label: "Temp", color: METRIC_COLORS.temperature },
    humidity: { label: "Humidity", color: METRIC_COLORS.humidity },
    pm10: { label: "PM10", color: METRIC_COLORS.pm10 },
  };

  return (
    <div className="space-y-6">
      {/* Device Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-bold">{device.name}</h2>
              {/* Status dot */}
              <span
                className={`h-2.5 w-2.5 rounded-full ${
                  status.isOnline ? "bg-emerald-500" : "bg-red-500"
                }`}
                title={status.isOnline ? "Online" : "Offline"}
              />
              <DeviceSettingsDialog
                deviceId={device._id}
                deviceName={device.name}
                hiddenMetrics={device.hiddenMetrics}
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
            </div>
            <p className="text-sm text-muted-foreground">
              {device.model ?? "Qingping Air Monitor"}
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
                <SelectTrigger className="w-[130px] rounded-lg" aria-label="Select time range">
                  <SelectValue placeholder="Last 30 days" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="90d" className="rounded-lg">Last 3 months</SelectItem>
                  <SelectItem value="30d" className="rounded-lg">Last 30 days</SelectItem>
                  <SelectItem value="7d" className="rounded-lg">Last 7 days</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
            {hasChartMetrics ? (
              <ChartContainer
                config={chartConfig}
                className="aspect-auto h-[300px] w-full"
              >
                <AreaChart data={historyData}>
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
                    dataKey="date"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    minTickGap={32}
                    tickFormatter={(value) => {
                      const date = new Date(value);
                      return date.toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      });
                    }}
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
                        labelFormatter={(value) => {
                          return new Date(value).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                          });
                        }}
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
                    />
                  )}
                  <ChartLegend content={<ChartLegendContent />} />
                </AreaChart>
              </ChartContainer>
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
