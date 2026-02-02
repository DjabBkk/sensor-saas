export type DeviceStatusInput = {
  lastReadingAt?: number;
  lastBattery?: number;
  providerOffline?: boolean;
  now?: number;
  staleAfterMs?: number;
};

export type DeviceStatusResult = {
  isOnline: boolean;
  isStale: boolean;
  isBatteryEmpty: boolean;
  isProviderOffline: boolean;
  offlineReason: "battery" | "provider" | "stale" | "unknown" | null;
};

export const getDeviceStatus = ({
  lastReadingAt,
  lastBattery,
  providerOffline,
  now = Date.now(),
  staleAfterMs = 30 * 60 * 1000,
}: DeviceStatusInput): DeviceStatusResult => {
  const hasReading = typeof lastReadingAt === "number";
  const isStale = !hasReading || now - lastReadingAt > staleAfterMs;
  const isBatteryEmpty = lastBattery === 0;
  const isProviderOffline = providerOffline === true;

  const isOnline = !isBatteryEmpty && !isProviderOffline && !isStale;

  let offlineReason: DeviceStatusResult["offlineReason"] = null;
  if (!isOnline) {
    if (isBatteryEmpty) {
      offlineReason = "battery";
    } else if (isProviderOffline) {
      offlineReason = "provider";
    } else if (isStale) {
      offlineReason = "stale";
    } else {
      offlineReason = "unknown";
    }
  }

  return {
    isOnline,
    isStale,
    isBatteryEmpty,
    isProviderOffline,
    offlineReason,
  };
};
