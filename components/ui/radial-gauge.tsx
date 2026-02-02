"use client";

import {
  Label,
  PolarGrid,
  PolarRadiusAxis,
  RadialBar,
  RadialBarChart,
} from "recharts";
import { ChartContainer, type ChartConfig } from "@/components/ui/chart";
import type { AQILevel } from "@/lib/aqi-levels";
import { cn } from "@/lib/utils";

type RadialGaugeProps = {
  label: string;
  value: number | undefined;
  unit: string;
  level: AQILevel | null;
  maxValue?: number;
  showLabel?: boolean;
};

export function RadialGauge({
  label,
  value,
  unit,
  level,
  maxValue = 100,
  showLabel = true,
}: RadialGaugeProps) {
  const hasValue = value !== undefined && value !== null;

  // Calculate the fill percentage for the gauge (0-250 degrees)
  const fillPercentage = level?.percentage ?? 0;
  // Convert percentage to angle (250 degrees max)
  const endAngle = (fillPercentage / 100) * 250;

  const chartData = [
    {
      name: label,
      value: fillPercentage,
      fill: level?.fillColor ?? "var(--muted)",
    },
  ];

  const chartConfig = {
    value: {
      label: label,
      color: level?.fillColor ?? "var(--muted)",
    },
  } satisfies ChartConfig;

  const displayValue = hasValue
    ? typeof value === "number" && value % 1 !== 0
      ? value.toFixed(1)
      : Math.round(value as number)
    : "--";

  return (
    <div className="flex flex-col items-center">
      <ChartContainer
        config={chartConfig}
        className="mx-auto aspect-square w-full max-w-[140px]"
      >
        <RadialBarChart
          data={chartData}
          startAngle={0}
          endAngle={endAngle}
          innerRadius={45}
          outerRadius={65}
        >
          <PolarGrid
            gridType="circle"
            radialLines={false}
            stroke="none"
            className="first:fill-muted last:fill-background"
            polarRadius={[50, 40]}
          />
          <RadialBar
            dataKey="value"
            background
            cornerRadius={10}
            fill={level?.fillColor ?? "var(--muted)"}
          />
          <PolarRadiusAxis tick={false} tickLine={false} axisLine={false}>
            <Label
              content={({ viewBox }) => {
                if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                  return (
                    <text
                      x={viewBox.cx}
                      y={viewBox.cy}
                      textAnchor="middle"
                      dominantBaseline="middle"
                    >
                      <tspan
                        x={viewBox.cx}
                        y={viewBox.cy}
                        className="fill-foreground text-2xl font-bold"
                      >
                        {displayValue}
                      </tspan>
                    </text>
                  );
                }
              }}
            />
          </PolarRadiusAxis>
        </RadialBarChart>
      </ChartContainer>
      {showLabel && (
        <div className="mt-1 text-center">
          <p className="text-xs text-muted-foreground">
            {label}
          </p>
          {level && (
            <p className={`text-xs font-medium ${level.color}`}>
              {level.label}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Compact inline version for dashboard cards - shows gauge + metric side by side
 */
export function RadialGaugeInline({
  label,
  value,
  unit,
  level,
}: Omit<RadialGaugeProps, "maxValue" | "showLabel">) {
  const hasValue = value !== undefined && value !== null;

  const fillPercentage = level?.percentage ?? 0;
  const endAngle = (fillPercentage / 100) * 250;

  const chartData = [
    {
      name: label,
      value: fillPercentage,
      fill: level?.fillColor ?? "var(--muted)",
    },
  ];

  const chartConfig = {
    value: {
      label: label,
      color: level?.fillColor ?? "var(--muted)",
    },
  } satisfies ChartConfig;

  const displayValue = hasValue
    ? typeof value === "number" && value % 1 !== 0
      ? value.toFixed(1)
      : Math.round(value as number)
    : "--";

  return (
    <div className="flex items-center gap-3">
      <ChartContainer
        config={chartConfig}
        className="aspect-square w-[72px] h-[72px] flex-shrink-0"
      >
        <RadialBarChart
          data={chartData}
          startAngle={0}
          endAngle={endAngle}
          innerRadius={26}
          outerRadius={36}
        >
          <PolarGrid
            gridType="circle"
            radialLines={false}
            stroke="none"
            className="first:fill-muted last:fill-background"
            polarRadius={[32, 22]}
          />
          <RadialBar
            dataKey="value"
            background
            cornerRadius={8}
            fill={level?.fillColor ?? "var(--muted)"}
          />
          <PolarRadiusAxis tick={false} tickLine={false} axisLine={false}>
            <Label
              content={({ viewBox }) => {
                if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                  return (
                    <text
                      x={viewBox.cx}
                      y={viewBox.cy}
                      textAnchor="middle"
                      dominantBaseline="middle"
                    >
                      <tspan
                        x={viewBox.cx}
                        y={viewBox.cy}
                        className="fill-foreground text-sm font-bold"
                      >
                        {displayValue}
                      </tspan>
                    </text>
                  );
                }
              }}
            />
          </PolarRadiusAxis>
        </RadialBarChart>
      </ChartContainer>
      <div className="flex flex-col gap-0.5">
        <span className="text-base font-medium text-foreground">{label}</span>
        {level && (
          <span className={`text-sm font-medium ${level.color}`}>
            {level.label}
          </span>
        )}
      </div>
    </div>
  );
}

/**
 * Card version of the radial gauge for device detail pages - clickable/toggleable
 */
type RadialGaugeCardProps = Omit<RadialGaugeProps, "maxValue" | "showLabel"> & {
  selected?: boolean;
  onClick?: () => void;
  color?: string;
};

export function RadialGaugeCard({
  label,
  value,
  unit,
  level,
  selected = false,
  onClick,
  color,
}: RadialGaugeCardProps) {
  const hasValue = value !== undefined && value !== null;

  const fillPercentage = level?.percentage ?? 0;
  const endAngle = (fillPercentage / 100) * 250;

  const fillColor = color ?? level?.fillColor ?? "var(--muted)";

  const chartData = [
    {
      name: label,
      value: fillPercentage,
      fill: fillColor,
    },
  ];

  const chartConfig = {
    value: {
      label: label,
      color: fillColor,
    },
  } satisfies ChartConfig;

  const displayValue = hasValue
    ? typeof value === "number" && value % 1 !== 0
      ? value.toFixed(1)
      : Math.round(value as number)
    : "--";

  return (
    <div
      className={cn(
        "flex flex-col items-center rounded-xl border bg-card p-4 transition-all duration-200 shadow-[var(--card-shadow)] hover:shadow-[var(--card-shadow-hover)] cursor-pointer",
        selected
          ? "border-primary ring-2 ring-primary/20"
          : "border-border hover:border-primary/50"
      )}
      onClick={onClick}
    >
      <ChartContainer
        config={chartConfig}
        className="mx-auto aspect-square w-full max-w-[100px]"
      >
        <RadialBarChart
          data={chartData}
          startAngle={0}
          endAngle={endAngle}
          innerRadius={30}
          outerRadius={45}
        >
          <PolarGrid
            gridType="circle"
            radialLines={false}
            stroke="none"
            className="first:fill-muted last:fill-background"
            polarRadius={[38, 28]}
          />
          <RadialBar
            dataKey="value"
            background
            cornerRadius={8}
            fill={fillColor}
          />
          <PolarRadiusAxis tick={false} tickLine={false} axisLine={false}>
            <Label
              content={({ viewBox }) => {
                if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                  return (
                    <text
                      x={viewBox.cx}
                      y={viewBox.cy}
                      textAnchor="middle"
                      dominantBaseline="middle"
                    >
                      <tspan
                        x={viewBox.cx}
                        y={viewBox.cy}
                        className="fill-foreground text-lg font-bold"
                      >
                        {displayValue}
                      </tspan>
                    </text>
                  );
                }
              }}
            />
          </PolarRadiusAxis>
        </RadialBarChart>
      </ChartContainer>
      <div className="mt-2 text-center">
        <p className="text-sm font-medium text-foreground">{label}</p>
        <p className="text-xs text-muted-foreground">{unit}</p>
        {level && (
          <p className={`mt-1 text-xs font-medium ${level.color}`}>
            {level.label}
          </p>
        )}
      </div>
    </div>
  );
}
