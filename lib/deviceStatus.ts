export type DeviceStatusInput = {
  lastReadingAt?: number;
  lastBattery?: number;
  providerOffline?: boolean;
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
}: DeviceStatusInput): DeviceStatusResult => {
  const hasReading = typeof lastReadingAt === "number";
  const isBatteryEmpty = lastBattery === 0;
  const isProviderOffline = providerOffline === true;

  const isOnline = hasReading && !isBatteryEmpty && !isProviderOffline;

  let offlineReason: DeviceStatusResult["offlineReason"] = null;
  if (!isOnline) {
    if (isBatteryEmpty) {
      offlineReason = "battery";
    } else if (isProviderOffline) {
      offlineReason = "provider";
    } else if (!hasReading) {
      offlineReason = "stale";
    } else {
      offlineReason = "unknown";
    }
  }

  return {
    isOnline,
    isStale: !hasReading,
    isBatteryEmpty,
    isProviderOffline,
    offlineReason,
  };
};
