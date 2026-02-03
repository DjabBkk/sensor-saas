import { Badge } from "@/components/ui/badge";
import { formatNumber, getCO2Level, getPM25Level } from "./utils";

type BadgeLargeProps = {
  title?: string;
  isOnline?: boolean;
  pm25?: number;
  co2?: number;
};

export function BadgeLarge({
  title,
  isOnline = true,
  pm25,
  co2,
}: BadgeLargeProps) {
  const displayPm25 = isOnline ? pm25 : undefined;
  const displayCo2 = isOnline ? co2 : undefined;
  const pm25Level = displayPm25 !== undefined ? getPM25Level(displayPm25) : null;
  const co2Level = displayCo2 !== undefined ? getCO2Level(displayCo2) : null;

  return (
    <div className="flex flex-wrap items-center gap-6 rounded-2xl border border-border bg-background px-5 py-4 text-sm text-foreground">
      <div className="min-w-0">
        {title && <p className="truncate text-base font-semibold">{title}</p>}
      </div>
      <div className="flex items-center gap-6">
        {!isOnline && <Badge variant="secondary">Offline</Badge>}
        <div>
          <p className="text-xs text-muted-foreground">PM2.5</p>
          <p className={`text-xl font-semibold ${pm25Level?.color ?? "text-foreground"}`}>
            {formatNumber(displayPm25)}
            <span className="ml-1 text-xs text-muted-foreground">µg/m³</span>
          </p>
          {pm25Level && (
            <p className={`text-xs font-medium ${pm25Level.color}`}>{pm25Level.label}</p>
          )}
        </div>
        <div>
          <p className="text-xs text-muted-foreground">CO₂</p>
          <p className={`text-lg font-medium ${co2Level?.color ?? "text-foreground"}`}>
            {formatNumber(displayCo2)}
            <span className="ml-1 text-xs text-muted-foreground">ppm</span>
          </p>
          {co2Level && (
            <p className={`text-xs font-medium ${co2Level.color}`}>{co2Level.label}</p>
          )}
        </div>
      </div>
    </div>
  );
}
