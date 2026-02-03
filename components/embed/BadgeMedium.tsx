import { Badge } from "@/components/ui/badge";
import { formatNumber, getPM25Level } from "./utils";

type BadgeMediumProps = {
  title?: string;
  isOnline?: boolean;
  pm25?: number;
};

export function BadgeMedium({
  title,
  isOnline = true,
  pm25,
}: BadgeMediumProps) {
  const displayPm25 = isOnline ? pm25 : undefined;
  const level = displayPm25 !== undefined ? getPM25Level(displayPm25) : null;

  return (
    <div className="flex items-center justify-between gap-4 rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground">
      <div className="min-w-0">
        {title && <p className="truncate text-sm font-semibold">{title}</p>}
      </div>
      <div className="flex items-center gap-3">
        {!isOnline && <Badge variant="secondary">Offline</Badge>}
        <div>
          <p className={`text-lg font-semibold ${level?.color ?? "text-foreground"}`}>
            {formatNumber(displayPm25)}
          </p>
          {level && <p className={`text-xs font-medium ${level.color}`}>{level.label}</p>}
        </div>
      </div>
    </div>
  );
}
