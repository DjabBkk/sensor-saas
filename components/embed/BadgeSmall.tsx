import { Badge } from "@/components/ui/badge";
import { formatNumber, getPM25Level } from "./utils";
import { type BrandingProps, BrandLogo, PoweredByWatermark } from "./Branding";

type BadgeSmallProps = {
  isOnline?: boolean;
  pm25?: number;
  branding?: BrandingProps;
};

export function BadgeSmall({ isOnline = true, pm25, branding }: BadgeSmallProps) {
  const displayPm25 = isOnline ? pm25 : undefined;
  const level = displayPm25 !== undefined ? getPM25Level(displayPm25) : null;

  return (
    <div
      className="flex items-center gap-2 rounded-full border bg-background px-3 py-1 text-[11px] text-foreground"
      style={{
        borderColor: branding?.brandColor ?? undefined,
      }}
    >
      <BrandLogo logoUrl={branding?.logoUrl} brandName={branding?.brandName} className="h-4 w-4" />
      {branding?.brandName && (
        <span className="text-muted-foreground">{branding.brandName}</span>
      )}
      {!isOnline && <Badge variant="secondary">Offline</Badge>}
      <span className="text-muted-foreground">PM2.5</span>
      <span className={`font-semibold ${level?.color ?? "text-foreground"}`}>
        {formatNumber(displayPm25)}
      </span>
      {level && <span className={`font-medium ${level.color}`}>{level.label}</span>}
      <PoweredByWatermark hide={branding?.hideAirViewBranding} />
    </div>
  );
}
