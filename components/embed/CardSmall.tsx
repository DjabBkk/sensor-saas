import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatNumber, getCO2Level, getPM25Level } from "./utils";
import { type BrandingProps, BrandLogo, PoweredByWatermark } from "./Branding";

type CardSmallProps = {
  title?: string;
  isOnline?: boolean;
  pm25?: number;
  co2?: number;
  branding?: BrandingProps;
};

export function CardSmall({
  title,
  isOnline = true,
  pm25,
  co2,
  branding,
}: CardSmallProps) {
  const displayPm25 = isOnline ? pm25 : undefined;
  const displayCo2 = isOnline ? co2 : undefined;
  const pm25Level = displayPm25 !== undefined ? getPM25Level(displayPm25) : null;
  const co2Level = displayCo2 !== undefined ? getCO2Level(displayCo2) : null;

  return (
    <Card
      className="w-full max-w-xs"
      style={{
        borderColor: branding?.brandColor ?? undefined,
      }}
    >
      <CardHeader className="space-y-1">
        <div className="flex items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2">
            <BrandLogo logoUrl={branding?.logoUrl} brandName={branding?.brandName} />
            <div className="min-w-0">
              {title && <CardTitle className="text-base">{title}</CardTitle>}
              {branding?.brandName && (
                <p className="truncate text-xs text-muted-foreground">{branding.brandName}</p>
              )}
            </div>
          </div>
          {!isOnline && <Badge variant="secondary">Offline</Badge>}
        </div>
      </CardHeader>
      <CardContent className="grid grid-cols-2 gap-3">
        <div>
          <p className="text-xs text-muted-foreground">PM2.5</p>
          <p className={`text-lg font-semibold ${pm25Level?.color ?? "text-foreground"}`}>
            {formatNumber(displayPm25)}
            <span className="ml-1 text-[10px] text-muted-foreground">µg/m³</span>
          </p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">CO₂</p>
          <p className={`text-lg font-semibold ${co2Level?.color ?? "text-foreground"}`}>
            {formatNumber(displayCo2)}
            <span className="ml-1 text-[10px] text-muted-foreground">ppm</span>
          </p>
        </div>
        <div className="col-span-2">
          <PoweredByWatermark hide={branding?.hideAirViewBranding} />
        </div>
      </CardContent>
    </Card>
  );
}
