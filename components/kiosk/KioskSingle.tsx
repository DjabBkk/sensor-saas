import { formatNumber, getCO2Level, getPM25Level } from "@/components/embed/utils";

type KioskSingleProps = {
  deviceName: string;
  model?: string;
  isOnline?: boolean;
  pm25?: number;
  co2?: number;
  tempC?: number;
  rh?: number;
};

export function KioskSingle({
  deviceName,
  model,
  isOnline = true,
  pm25,
  co2,
  tempC,
  rh,
}: KioskSingleProps) {
  const displayPm25 = isOnline ? pm25 : undefined;
  const displayCo2 = isOnline ? co2 : undefined;
  const displayTempC = isOnline ? tempC : undefined;
  const displayRh = isOnline ? rh : undefined;

  const pm25Level = displayPm25 !== undefined ? getPM25Level(displayPm25) : null;
  const co2Level = displayCo2 !== undefined ? getCO2Level(displayCo2) : null;

  return (
    <div className="flex h-full w-full flex-col justify-between rounded-3xl border border-border bg-background p-10">
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <h1 className="text-4xl font-bold">{deviceName}</h1>
          {!isOnline && (
            <span className="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground">
              Offline
            </span>
          )}
        </div>
        <p className="text-lg text-muted-foreground">{model ?? "Air sensor"}</p>
      </div>

      <div className="grid grid-cols-2 gap-8">
        <div>
          <p className="text-sm text-muted-foreground">PM2.5</p>
          <p className={`text-6xl font-bold ${pm25Level?.color ?? "text-foreground"}`}>
            {formatNumber(displayPm25)}
          </p>
          <p className="text-muted-foreground">µg/m³</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">CO₂</p>
          <p className={`text-6xl font-bold ${co2Level?.color ?? "text-foreground"}`}>
            {formatNumber(displayCo2)}
          </p>
          <p className="text-muted-foreground">ppm</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Temperature</p>
          <p className="text-5xl font-semibold text-foreground">
            {displayTempC !== undefined ? `${formatNumber(displayTempC, 1)}°C` : "--"}
          </p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Humidity</p>
          <p className="text-5xl font-semibold text-foreground">
            {displayRh !== undefined ? `${formatNumber(displayRh)}%` : "--"}
          </p>
        </div>
      </div>
    </div>
  );
}
