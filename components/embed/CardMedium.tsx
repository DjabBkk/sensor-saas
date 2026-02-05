import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatNumber, getCO2Level, getPM25Level, getTemperatureLevel, getHumidityLevel } from "./utils";

type CardMediumProps = {
  title?: string;
  isOnline?: boolean;
  pm25?: number;
  co2?: number;
  tempC?: number;
  rh?: number;
};

export function CardMedium({
  title,
  isOnline = true,
  pm25,
  co2,
  tempC,
  rh,
}: CardMediumProps) {
  const displayPm25 = isOnline ? pm25 : undefined;
  const displayCo2 = isOnline ? co2 : undefined;
  const displayTempC = isOnline ? tempC : undefined;
  const displayRh = isOnline ? rh : undefined;

  const pm25Level = displayPm25 !== undefined ? getPM25Level(displayPm25) : null;
  const co2Level = displayCo2 !== undefined ? getCO2Level(displayCo2) : null;
  const tempLevel = displayTempC !== undefined ? getTemperatureLevel(displayTempC) : null;
  const humidityLevel = displayRh !== undefined ? getHumidityLevel(displayRh) : null;

  return (
    <Card className="w-full max-w-sm">
      <CardHeader className="space-y-1 pb-3">
        <div className="flex items-center justify-between gap-2">
          {title && <CardTitle className="text-lg">{title}</CardTitle>}
          {!isOnline && <Badge variant="secondary">Offline</Badge>}
        </div>
      </CardHeader>
      <CardContent className="grid grid-cols-2 gap-4 pt-0">
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
      </CardContent>
    </Card>
  );
}
