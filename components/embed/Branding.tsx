/**
 * Shared branding types and components for widgets and kiosks.
 */

export type BrandingProps = {
  brandName?: string;
  brandColor?: string;
  logoUrl?: string;
  hideAirViewBranding?: boolean;
};

/**
 * Small "Powered by AirView" watermark shown by default on widgets/kiosks.
 * Hidden when `hideAirViewBranding` is true (Pro+ plan feature).
 */
export function PoweredByWatermark({
  hide,
  className = "",
}: {
  hide?: boolean;
  className?: string;
}) {
  if (hide) return null;

  return (
    <p
      className={`text-[10px] text-muted-foreground/50 ${className}`}
    >
      Powered by AirView
    </p>
  );
}

/**
 * Small logo image for branding. Renders in the header area of widgets/kiosks.
 */
export function BrandLogo({
  logoUrl,
  brandName,
  className = "",
}: {
  logoUrl?: string;
  brandName?: string;
  className?: string;
}) {
  if (!logoUrl) return null;

  return (
    <img
      src={logoUrl}
      alt={brandName ?? "Logo"}
      className={`h-6 w-6 object-contain ${className}`}
    />
  );
}
