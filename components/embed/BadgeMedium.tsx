import { Badge } from "@/components/ui/badge";
import { formatNumber, getPM25Level } from "./utils";
import { type BrandingProps, BrandLogo, PoweredByWatermark } from "./Branding";

type BadgeMediumProps = {
  title?: string;
  isOnline?: boolean;
  pm25?: number;
  branding?: BrandingProps;
};

export function BadgeMedium({
  title,
  isOnline = true,
  pm25,
  branding,
}: BadgeMediumProps) {
  const displayPm25 = isOnline ? pm25 : undefined;
  const level = displayPm25 !== undefined ? getPM25Level(displayPm25) : null;

  return (
    <div
      className="flex items-center justify-between gap-4 rounded-xl border bg-background px-4 py-3 text-sm text-foreground"
      style={{
        borderColor: branding?.brandColor ?? undefined,
      }}
    >
      <div className="flex min-w-0 items-center gap-2">
        <BrandLogo logoUrl={branding?.logoUrl} brandName={branding?.brandName} className="h-5 w-5" />
        <div className="min-w-0">
          {title && <p className="truncate text-sm font-semibold">{title}</p>}
          {branding?.brandName && (
            <p className="truncate text-xs text-muted-foreground">{branding.brandName}</p>
          )}
        </div>
      </div>
      <div className="flex items-center gap-3">
        {!isOnline && <Badge variant="secondary">Offline</Badge>}
        <div>
          <div className="flex items-baseline gap-1">
            <p className="text-xs text-muted-foreground">PM2.5</p>
            <p className={`text-lg font-semibold ${level?.color ?? "text-foreground"}`}>
              {formatNumber(displayPm25)}
            </p>
          </div>
          {level && <p className={`text-xs font-medium ${level.color}`}>{level.label}</p>}
        </div>
        <PoweredByWatermark hide={branding?.hideAirViewBranding} />
      </div>
    </div>
  );
}
