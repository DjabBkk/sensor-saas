import { formatNumber, getCO2Level, getPM25Level } from "@/components/embed/utils";

type KioskGridItem = {
  deviceId: string;
  deviceName: string;
  pm25?: number;
  co2?: number;
  tempC?: number;
  rh?: number;
};

type KioskGridProps = {
  devices: KioskGridItem[];
};

export function KioskGrid({ devices }: KioskGridProps) {
  const columnCount = devices.length <= 4 ? 2 : 3;

  return (
    <div
      className={`grid h-full w-full gap-6 ${
        columnCount === 2 ? "grid-cols-2" : "grid-cols-3"
      }`}
    >
      {devices.map((device) => {
        const pm25Level = device.pm25 !== undefined ? getPM25Level(device.pm25) : null;
        const co2Level = device.co2 !== undefined ? getCO2Level(device.co2) : null;

        return (
          <div
            key={device.deviceId}
            className="flex flex-col justify-between rounded-3xl border border-border bg-background p-6"
          >
            <div>
              <h2 className="text-2xl font-semibold">{device.deviceName}</h2>
              <p className="text-sm text-muted-foreground">Live air quality</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-muted-foreground">PM2.5</p>
                <p className={`text-3xl font-bold ${pm25Level?.color ?? "text-foreground"}`}>
                  {formatNumber(device.pm25)}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">CO₂</p>
                <p className={`text-3xl font-bold ${co2Level?.color ?? "text-foreground"}`}>
                  {formatNumber(device.co2)}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Temp</p>
                <p className="text-2xl font-semibold text-foreground">
                  {device.tempC !== undefined ? `${formatNumber(device.tempC, 1)}°C` : "--"}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Humidity</p>
                <p className="text-2xl font-semibold text-foreground">
                  {device.rh !== undefined ? `${formatNumber(device.rh)}%` : "--"}
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
