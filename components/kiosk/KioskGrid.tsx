import { formatNumber, getCO2Level, getPM25Level, getTemperatureLevel, getHumidityLevel } from "@/components/embed/utils";
import { type BrandingProps, BrandLogo, PoweredByWatermark } from "@/components/embed/Branding";

type KioskGridItem = {
  deviceId: string;
  deviceName: string;
  isOnline?: boolean;
  pm25?: number;
  co2?: number;
  tempC?: number;
  rh?: number;
};

type KioskGridProps = {
  devices: KioskGridItem[];
  branding?: BrandingProps;
};

export function KioskGrid({ devices, branding }: KioskGridProps) {
  const columnCount = devices.length <= 4 ? 2 : 3;

  return (
    <div className="flex h-full w-full flex-col gap-4">
      {/* Optional branding header */}
      {(branding?.logoUrl || branding?.brandName) && (
        <div className="flex items-center gap-3 px-2">
          <BrandLogo logoUrl={branding.logoUrl} brandName={branding.brandName} className="h-8 w-8" />
          {branding.brandName && (
            <span className="text-xl font-semibold">{branding.brandName}</span>
          )}
        </div>
      )}

      <div
        className={`grid flex-1 gap-6 ${
          columnCount === 2 ? "grid-cols-2" : "grid-cols-3"
        }`}
      >
        {devices.map((device) => {
          const isOnline = device.isOnline ?? true;
          const displayPm25 = isOnline ? device.pm25 : undefined;
          const displayCo2 = isOnline ? device.co2 : undefined;
          const displayTempC = isOnline ? device.tempC : undefined;
          const displayRh = isOnline ? device.rh : undefined;

          const pm25Level = displayPm25 !== undefined ? getPM25Level(displayPm25) : null;
          const co2Level = displayCo2 !== undefined ? getCO2Level(displayCo2) : null;
          const tempLevel = displayTempC !== undefined ? getTemperatureLevel(displayTempC) : null;
          const humidityLevel = displayRh !== undefined ? getHumidityLevel(displayRh) : null;

          return (
            <div
              key={device.deviceId}
              className="flex flex-col justify-between rounded-3xl border bg-background p-6"
              style={{
                borderColor: branding?.brandColor ?? undefined,
              }}
            >
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-2xl font-semibold">{device.deviceName}</h2>
                  {!isOnline && (
                    <span className="rounded-full border border-border px-2 py-0.5 text-[10px] text-muted-foreground">
                      Offline
                    </span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  {isOnline ? "Live air quality" : "Last known air quality"}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">PM2.5</p>
                  <p className={`text-3xl font-bold ${pm25Level?.color ?? "text-foreground"}`}>
                    {formatNumber(displayPm25)}
                  </p>
                  {pm25Level && (
                    <span className={`text-xs font-medium ${pm25Level.color}`}>{pm25Level.label}</span>
                  )}
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">CO₂</p>
                  <p className={`text-3xl font-bold ${co2Level?.color ?? "text-foreground"}`}>
                    {formatNumber(displayCo2)}
                  </p>
                  {co2Level && (
                    <span className={`text-xs font-medium ${co2Level.color}`}>{co2Level.label}</span>
                  )}
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Temp</p>
                  <p className={`text-2xl font-semibold ${tempLevel?.color ?? "text-foreground"}`}>
                    {displayTempC !== undefined ? `${formatNumber(displayTempC, 1)}°C` : "--"}
                  </p>
                  {tempLevel && (
                    <span className={`text-xs font-medium ${tempLevel.color}`}>{tempLevel.label}</span>
                  )}
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Humidity</p>
                  <p className={`text-2xl font-semibold ${humidityLevel?.color ?? "text-foreground"}`}>
                    {displayRh !== undefined ? `${formatNumber(displayRh)}%` : "--"}
                  </p>
                  {humidityLevel && (
                    <span className={`text-xs font-medium ${humidityLevel.color}`}>{humidityLevel.label}</span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <PoweredByWatermark hide={branding?.hideAirViewBranding} className="text-center text-xs" />
    </div>
  );
}
