"use client";

import {
  Wind,
  Thermometer,
  Droplets,
  FlaskConical,
  Battery,
  CloudCog,
} from "lucide-react";
import type { AQILevel } from "@/lib/aqi-levels";
import { cn } from "@/lib/utils";

type MetricKey = "pm25" | "pm10" | "co2" | "temperature" | "humidity" | "voc" | "battery";

const METRIC_ICONS: Record<MetricKey, React.ComponentType<{ className?: string }>> = {
  pm25: Wind,
  pm10: Wind,
  co2: CloudCog,
  temperature: Thermometer,
  humidity: Droplets,
  voc: FlaskConical,
  battery: Battery,
};

type SecondaryMetricItemProps = {
  metricKey: MetricKey;
  label: string;
  value: number | undefined;
  unit: string;
  level: AQILevel | null;
};

export function SecondaryMetricItem({
  metricKey,
  label,
  value,
  unit,
  level,
}: SecondaryMetricItemProps) {
  const Icon = METRIC_ICONS[metricKey] ?? Wind;
  const hasValue = value !== undefined && value !== null;

  const displayValue = hasValue
    ? typeof value === "number" && value % 1 !== 0
      ? value.toFixed(1)
      : Math.round(value as number)
    : "--";

  // Get background color with transparency
  const getIconBgStyle = () => {
    if (!level?.fillColor) return {};
    return { backgroundColor: `${level.fillColor}20` }; // 20 = ~12% opacity in hex
  };

  return (
    <div className="flex items-center gap-2.5 py-1.5">
      {/* Icon */}
      <div
        className={cn(
          "flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-md",
          !level && "bg-muted"
        )}
        style={getIconBgStyle()}
      >
        <Icon
          className={cn(
            "h-4 w-4",
            level ? level.color : "text-muted-foreground"
          )}
        />
      </div>

      {/* Label, value, and status - all grouped together */}
      <div className="flex flex-col min-w-0 flex-1">
        <div className="flex items-baseline gap-2 whitespace-nowrap">
          <span className="text-xs font-medium text-foreground">
            {label}
          </span>
          <span className="text-sm font-semibold text-foreground">
            {displayValue}
            <span className="text-xs font-normal text-muted-foreground ml-0.5">
              {unit}
            </span>
          </span>
        </div>
        {level && (
          <span className={cn("text-[10px] font-medium", level.color)}>
            {level.label}
          </span>
        )}
      </div>
    </div>
  );
}

export { METRIC_ICONS };
export type { MetricKey };
