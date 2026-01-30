import { getPM25Level, formatNumber } from "./utils";

type EmbedBadgeProps = {
  deviceName: string;
  pm25?: number;
};

export function EmbedBadge({ deviceName, pm25 }: EmbedBadgeProps) {
  const level = pm25 !== undefined ? getPM25Level(pm25) : null;

  return (
    <div className="flex items-center gap-3 rounded-full border border-border bg-background px-4 py-2 text-sm">
      <span className="font-medium text-foreground">{deviceName}</span>
      <span className="text-muted-foreground">PM2.5</span>
      <span className={`font-semibold ${level?.color ?? "text-foreground"}`}>
        {formatNumber(pm25)}
      </span>
      <span className="text-muted-foreground">µg/m³</span>
      <span
        className={`ml-1 h-2 w-2 rounded-full ${level?.bg ?? "bg-muted"}`}
        aria-hidden="true"
      />
    </div>
  );
}
