import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatNumber, getCO2Level, getPM25Level } from "./utils";

type EmbedCardProps = {
  deviceName: string;
  model?: string;
  isOnline?: boolean;
  pm25?: number;
  co2?: number;
  tempC?: number;
  rh?: number;
};

export function EmbedCard({
  deviceName,
  model,
  isOnline = true,
  pm25,
  co2,
  tempC,
  rh,
}: EmbedCardProps) {
  const displayPm25 = isOnline ? pm25 : undefined;
  const displayCo2 = isOnline ? co2 : undefined;
  const displayTempC = isOnline ? tempC : undefined;
  const displayRh = isOnline ? rh : undefined;

  const pm25Level = displayPm25 !== undefined ? getPM25Level(displayPm25) : null;
  const co2Level = displayCo2 !== undefined ? getCO2Level(displayCo2) : null;

  return (
    <Card className="w-full max-w-sm">
      <CardHeader className="space-y-1">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-lg">{deviceName}</CardTitle>
          {!isOnline && <Badge variant="secondary">Offline</Badge>}
        </div>
        <p className="text-xs text-muted-foreground">{model ?? "Air sensor"}</p>
      </CardHeader>
      <CardContent className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-xs text-muted-foreground">PM2.5</p>
          <p className={`text-2xl font-semibold ${pm25Level?.color ?? "text-foreground"}`}>
            {formatNumber(displayPm25)}
            <span className="ml-1 text-xs text-muted-foreground">µg/m³</span>
          </p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">CO₂</p>
          <p className={`text-2xl font-semibold ${co2Level?.color ?? "text-foreground"}`}>
            {formatNumber(displayCo2)}
            <span className="ml-1 text-xs text-muted-foreground">ppm</span>
          </p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Temp</p>
          <p className="text-lg font-medium text-foreground">
            {displayTempC !== undefined ? `${formatNumber(displayTempC, 1)}°C` : "--"}
          </p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Humidity</p>
          <p className="text-lg font-medium text-foreground">
            {displayRh !== undefined ? `${formatNumber(displayRh)}%` : "--"}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
