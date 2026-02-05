export type DeviceStatusInput = {
  lastReadingAt?: number;
  lastBattery?: number;
  providerOffline?: boolean;
  reportInterval?: number; // in seconds
};

export type DeviceStatusResult = {
  isOnline: boolean;
  isStale: boolean; // true if never had a reading
  isReadingOverdue: boolean; // true if reading is older than threshold
  isBatteryEmpty: boolean;
  isProviderOffline: boolean;
  offlineReason: "battery" | "provider" | "stale" | "overdue" | "unknown" | null;
  overdueMinutes?: number; // how many minutes overdue (for display)
};

/**
 * Returns grace period in milliseconds based on the report interval.
 * Grace periods per user specification:
 * - 1 min (60s)   → 2 min grace
 * - 5 min (300s)  → 3 min grace
 * - 10 min (600s) → 5 min grace
 * - 30 min (1800s) → 5 min grace
 * - 60 min (3600s) → 5 min grace
 */
function getGracePeriodMs(intervalSeconds: number): number {
  if (intervalSeconds <= 60) return 2 * 60 * 1000; // 2 min for 1-min interval
  if (intervalSeconds <= 300) return 3 * 60 * 1000; // 3 min for 5-min interval
  if (intervalSeconds <= 600) return 5 * 60 * 1000; // 5 min for 10-min interval
  return 5 * 60 * 1000; // 5 min for 30-min and 60-min intervals
}

export const getDeviceStatus = ({
  lastReadingAt,
  lastBattery,
  providerOffline,
  reportInterval = 3600, // default 1 hour
}: DeviceStatusInput): DeviceStatusResult => {
  const now = Date.now();
  const hasReading = typeof lastReadingAt === "number";
  const isBatteryEmpty = lastBattery === 0;
  const isProviderOffline = providerOffline === true;

  // Calculate if reading is overdue based on interval + grace period
  const intervalMs = reportInterval * 1000;
  const graceMs = getGracePeriodMs(reportInterval);
  const thresholdMs = intervalMs + graceMs;

  const timeSinceLastReading = hasReading ? now - lastReadingAt : Infinity;
  const isReadingOverdue = hasReading && timeSinceLastReading > thresholdMs;

  // Calculate how many minutes overdue (for display)
  let overdueMinutes: number | undefined;
  if (isReadingOverdue) {
    overdueMinutes = Math.floor(timeSinceLastReading / (60 * 1000));
  }

  // Device is online only if it has a recent reading and no other issues
  const isOnline =
    hasReading &&
    !isBatteryEmpty &&
    !isProviderOffline &&
    !isReadingOverdue;

  let offlineReason: DeviceStatusResult["offlineReason"] = null;
  if (!isOnline) {
    if (isBatteryEmpty) {
      offlineReason = "battery";
    } else if (isProviderOffline) {
      offlineReason = "provider";
    } else if (!hasReading) {
      offlineReason = "stale";
    } else if (isReadingOverdue) {
      offlineReason = "overdue";
    } else {
      offlineReason = "unknown";
    }
  }

  return {
    isOnline,
    isStale: !hasReading,
    isReadingOverdue,
    isBatteryEmpty,
    isProviderOffline,
    offlineReason,
    overdueMinutes,
  };
};
