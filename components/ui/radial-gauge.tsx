"use client";

import { Label, PolarRadiusAxis, RadialBar, RadialBarChart } from "recharts";
import { ChartContainer, type ChartConfig } from "@/components/ui/chart";
import type { AQILevel } from "@/lib/aqi-levels";

type RadialGaugeProps = {
  label: string;
  value: number | undefined;
  unit: string;
  icon?: React.ReactNode;
  level: AQILevel | null;
  maxValue?: number;
};

export function RadialGauge({
  label,
  value,
  unit,
  icon,
  level,
  maxValue = 100,
}: RadialGaugeProps) {
  const hasValue = value !== undefined && value !== null;
  
  // Calculate the fill percentage for the gauge
  const fillPercentage = level?.percentage ?? 0;
  const remainingPercentage = 100 - fillPercentage;

  const chartData = [
    {
      name: label,
      value: fillPercentage,
      remaining: remainingPercentage,
    },
  ];

  const chartConfig = {
    value: {
      label: label,
      color: level?.fillColor ?? "var(--muted)",
    },
    remaining: {
      label: "Remaining",
      color: "var(--muted)",
    },
  } satisfies ChartConfig;

  const displayValue = hasValue
    ? typeof value === "number" && value % 1 !== 0
      ? value.toFixed(1)
      : value
    : "--";

  return (
    <div className="relative flex flex-col items-center rounded-xl border border-border bg-card p-4 transition-all duration-200 shadow-[var(--card-shadow)] hover:shadow-[var(--card-shadow-hover)]">
      {/* Header */}
      <div className="mb-2 flex w-full items-center justify-between">
        <div className="flex items-center gap-2 text-muted-foreground">
          {icon}
          <span className="text-sm font-medium">{label}</span>
        </div>
        {level && (
          <span
            className={`rounded-full px-2 py-0.5 text-xs font-medium ${level.color} bg-muted`}
          >
            {level.label}
          </span>
        )}
      </div>

      {/* Radial Chart */}
      <ChartContainer
        config={chartConfig}
        className="mx-auto aspect-square w-full max-w-[180px]"
      >
        <RadialBarChart
          data={chartData}
          startAngle={180}
          endAngle={0}
          innerRadius={60}
          outerRadius={90}
        >
          <defs>
            {/* AQI gradient using design system colors */}
            <linearGradient id={`gradient-${label}`} x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="var(--aqi-excellent)" />
              <stop offset="20%" stopColor="var(--aqi-good)" />
              <stop offset="40%" stopColor="var(--aqi-moderate)" />
              <stop offset="60%" stopColor="var(--aqi-poor)" />
              <stop offset="80%" stopColor="var(--aqi-unhealthy)" />
              <stop offset="100%" stopColor="var(--aqi-hazardous)" />
            </linearGradient>
          </defs>
          <PolarRadiusAxis tick={false} tickLine={false} axisLine={false}>
            <Label
              content={({ viewBox }) => {
                if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                  return (
                    <text x={viewBox.cx} y={viewBox.cy} textAnchor="middle">
                      <tspan
                        x={viewBox.cx}
                        y={(viewBox.cy || 0) - 8}
                        className={`fill-current text-2xl font-bold ${level?.color ?? "text-foreground"}`}
                      >
                        {displayValue}
                      </tspan>
                      <tspan
                        x={viewBox.cx}
                        y={(viewBox.cy || 0) + 12}
                        className="fill-muted-foreground text-sm"
                      >
                        {unit}
                      </tspan>
                    </text>
                  );
                }
              }}
            />
          </PolarRadiusAxis>
          {/* Background track */}
          <RadialBar
            dataKey="remaining"
            stackId="a"
            cornerRadius={5}
            fill="var(--muted)"
            className="stroke-transparent stroke-2"
          />
          {/* Value bar with status color */}
          <RadialBar
            dataKey="value"
            stackId="a"
            cornerRadius={5}
            fill={level?.fillColor ?? "var(--muted)"}
            className="stroke-transparent stroke-2"
          />
        </RadialBarChart>
      </ChartContainer>
    </div>
  );
}

/**
 * Compact version of the radial gauge for smaller displays
 */
export function RadialGaugeCompact({
  label,
  value,
  unit,
  level,
}: Omit<RadialGaugeProps, "icon" | "maxValue">) {
  const hasValue = value !== undefined && value !== null;
  
  const fillPercentage = level?.percentage ?? 0;
  const remainingPercentage = 100 - fillPercentage;

  const chartData = [
    {
      name: label,
      value: fillPercentage,
      remaining: remainingPercentage,
    },
  ];

  const chartConfig = {
    value: {
      label: label,
      color: level?.fillColor ?? "var(--muted)",
    },
    remaining: {
      label: "Remaining",
      color: "var(--muted)",
    },
  } satisfies ChartConfig;

  const displayValue = hasValue
    ? typeof value === "number" && value % 1 !== 0
      ? value.toFixed(1)
      : value
    : "--";

  return (
    <div className="flex flex-col items-center">
      <ChartContainer
        config={chartConfig}
        className="mx-auto aspect-square w-full max-w-[120px]"
      >
        <RadialBarChart
          data={chartData}
          startAngle={180}
          endAngle={0}
          innerRadius={40}
          outerRadius={55}
        >
          <PolarRadiusAxis tick={false} tickLine={false} axisLine={false}>
            <Label
              content={({ viewBox }) => {
                if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                  return (
                    <text x={viewBox.cx} y={viewBox.cy} textAnchor="middle">
                      <tspan
                        x={viewBox.cx}
                        y={(viewBox.cy || 0) - 4}
                        className={`fill-current text-lg font-bold ${level?.color ?? "text-foreground"}`}
                      >
                        {displayValue}
                      </tspan>
                      <tspan
                        x={viewBox.cx}
                        y={(viewBox.cy || 0) + 10}
                        className="fill-muted-foreground text-xs"
                      >
                        {unit}
                      </tspan>
                    </text>
                  );
                }
              }}
            />
          </PolarRadiusAxis>
          <RadialBar
            dataKey="remaining"
            stackId="a"
            cornerRadius={4}
            fill="var(--muted)"
            className="stroke-transparent stroke-2"
          />
          <RadialBar
            dataKey="value"
            stackId="a"
            cornerRadius={4}
            fill={level?.fillColor ?? "var(--muted)"}
            className="stroke-transparent stroke-2"
          />
        </RadialBarChart>
      </ChartContainer>
      <div className="mt-1 text-center">
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        {level && (
          <p className={`text-xs font-medium ${level.color}`}>{level.label}</p>
        )}
      </div>
    </div>
  );
}
