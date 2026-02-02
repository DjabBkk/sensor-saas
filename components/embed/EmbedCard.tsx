import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatNumber, getCO2Level, getPM25Level } from "./utils";

type EmbedCardProps = {
  deviceName: string;
  model?: string;
  pm25?: number;
  co2?: number;
  tempC?: number;
  rh?: number;
};

export function EmbedCard({
  deviceName,
  model,
  pm25,
  co2,
  tempC,
  rh,
}: EmbedCardProps) {
  const pm25Level = pm25 !== undefined ? getPM25Level(pm25) : null;
  const co2Level = co2 !== undefined ? getCO2Level(co2) : null;

  return (
    <Card className="w-full max-w-sm">
      <CardHeader className="space-y-1">
        <CardTitle className="text-lg">{deviceName}</CardTitle>
        <p className="text-xs text-muted-foreground">{model ?? "Air sensor"}</p>
      </CardHeader>
      <CardContent className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-xs text-muted-foreground">PM2.5</p>
          <p className={`text-2xl font-semibold ${pm25Level?.color ?? "text-foreground"}`}>
            {formatNumber(pm25)}
            <span className="ml-1 text-xs text-muted-foreground">µg/m³</span>
          </p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">CO₂</p>
          <p className={`text-2xl font-semibold ${co2Level?.color ?? "text-foreground"}`}>
            {formatNumber(co2)}
            <span className="ml-1 text-xs text-muted-foreground">ppm</span>
          </p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Temp</p>
          <p className="text-lg font-medium text-foreground">
            {tempC !== undefined ? `${formatNumber(tempC, 1)}°C` : "--"}
          </p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Humidity</p>
          <p className="text-lg font-medium text-foreground">
            {rh !== undefined ? `${formatNumber(rh)}%` : "--"}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
