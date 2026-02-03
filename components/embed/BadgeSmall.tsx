import { Badge } from "@/components/ui/badge";
import { formatNumber, getPM25Level } from "./utils";

type BadgeSmallProps = {
  isOnline?: boolean;
  pm25?: number;
};

export function BadgeSmall({ isOnline = true, pm25 }: BadgeSmallProps) {
  const displayPm25 = isOnline ? pm25 : undefined;
  const level = displayPm25 !== undefined ? getPM25Level(displayPm25) : null;

  return (
    <div className="flex items-center gap-2 rounded-full border border-border bg-background px-3 py-1 text-[11px] text-foreground">
      {!isOnline && <Badge variant="secondary">Offline</Badge>}
      <span className="text-muted-foreground">PM2.5</span>
      <span className={`font-semibold ${level?.color ?? "text-foreground"}`}>
        {formatNumber(displayPm25)}
      </span>
      {level && <span className={`font-medium ${level.color}`}>{level.label}</span>}
    </div>
  );
}
