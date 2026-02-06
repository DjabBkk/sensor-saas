import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatNumber, getCO2Level, getPM25Level, getTemperatureLevel, getHumidityLevel } from "./utils";
import { type BrandingProps, BrandLogo, PoweredByWatermark } from "./Branding";

type HistoryPoint = {
  ts: number;
  pm25?: number;
};

type CardLargeProps = {
  title?: string;
  isOnline?: boolean;
  pm25?: number;
  co2?: number;
  tempC?: number;
  rh?: number;
  history: HistoryPoint[];
  branding?: BrandingProps;
};

export function CardLarge({
  title,
  isOnline = true,
  pm25,
  co2,
  tempC,
  rh,
  history,
  branding,
}: CardLargeProps) {
  const displayPm25 = isOnline ? pm25 : undefined;
  const displayCo2 = isOnline ? co2 : undefined;
  const displayTempC = isOnline ? tempC : undefined;
  const displayRh = isOnline ? rh : undefined;

  const pm25Level = displayPm25 !== undefined ? getPM25Level(displayPm25) : null;
  const co2Level = displayCo2 !== undefined ? getCO2Level(displayCo2) : null;
  const tempLevel = displayTempC !== undefined ? getTemperatureLevel(displayTempC) : null;
  const humidityLevel = displayRh !== undefined ? getHumidityLevel(displayRh) : null;

  const chartData = history
    .slice()
    .reverse()
    .map((point) => ({
      time: new Date(point.ts).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
      pm25: point.pm25 ?? null,
    }));

  return (
    <Card
      className="w-full max-w-md"
      style={{
        borderColor: branding?.brandColor ?? undefined,
      }}
    >
      <CardHeader className="space-y-1">
        <div className="flex items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2">
            <BrandLogo logoUrl={branding?.logoUrl} brandName={branding?.brandName} />
            <div className="min-w-0">
              {title && <CardTitle className="text-xl">{title}</CardTitle>}
              {branding?.brandName && (
                <p className="truncate text-xs text-muted-foreground">{branding.brandName}</p>
              )}
            </div>
          </div>
          {!isOnline && <Badge variant="secondary">Offline</Badge>}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-muted-foreground">PM2.5</p>
            <p className={`text-2xl font-semibold ${pm25Level?.color ?? "text-foreground"}`}>
              {formatNumber(displayPm25)}
              <span className="ml-1 text-xs text-muted-foreground">µg/m³</span>
            </p>
            {pm25Level && (
              <span className={`text-xs font-medium ${pm25Level.color}`}>{pm25Level.label}</span>
            )}
          </div>
          <div>
            <p className="text-xs text-muted-foreground">CO₂</p>
            <p className={`text-2xl font-semibold ${co2Level?.color ?? "text-foreground"}`}>
              {formatNumber(displayCo2)}
              <span className="ml-1 text-xs text-muted-foreground">ppm</span>
            </p>
            {co2Level && (
              <span className={`text-xs font-medium ${co2Level.color}`}>{co2Level.label}</span>
            )}
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Temp</p>
            <p className={`text-lg font-medium ${tempLevel?.color ?? "text-foreground"}`}>
              {displayTempC !== undefined ? `${formatNumber(displayTempC, 1)}°C` : "--"}
            </p>
            {tempLevel && (
              <span className={`text-xs font-medium ${tempLevel.color}`}>{tempLevel.label}</span>
            )}
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Humidity</p>
            <p className={`text-lg font-medium ${humidityLevel?.color ?? "text-foreground"}`}>
              {displayRh !== undefined ? `${formatNumber(displayRh)}%` : "--"}
            </p>
            {humidityLevel && (
              <span className={`text-xs font-medium ${humidityLevel.color}`}>{humidityLevel.label}</span>
            )}
          </div>
        </div>

        <div className="h-40 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <XAxis dataKey="time" hide />
              <YAxis hide domain={["auto", "auto"]} />
              <Tooltip
                formatter={(value: number | null) =>
                  value === null ? "--" : `${value} µg/m³`
                }
              />
              <Line
                type="monotone"
                dataKey="pm25"
                stroke={branding?.brandColor ?? "#10b981"}
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <PoweredByWatermark hide={branding?.hideAirViewBranding} />
      </CardContent>
    </Card>
  );
}
