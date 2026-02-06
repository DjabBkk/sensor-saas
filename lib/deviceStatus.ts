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
 * - 1 min (60s)   → 5 min grace
 * - 5 min (300s)  → 7 min grace
 * - 10 min (600s) → 10 min grace
 * - 30 min (1800s) → 12 min grace
 * - 60 min (3600s) → 15 min grace
 */
export function getGracePeriodMs(intervalSeconds: number): number {
  if (intervalSeconds <= 60) return 5 * 60 * 1000; // 5 min for 1-min interval
  if (intervalSeconds <= 300) return 7 * 60 * 1000; // 7 min for 5-min interval
  if (intervalSeconds <= 600) return 10 * 60 * 1000; // 10 min for 10-min interval
  if (intervalSeconds <= 1800) return 12 * 60 * 1000; // 12 min for 30-min interval
  return 15 * 60 * 1000; // 15 min for 60-min interval
}

/**
 * Formats a duration in minutes to a human-friendly string.
 * Examples: "32m", "12h 12m", "1d 5m", "2d 3h 15m"
 */
export function formatDuration(minutes: number | undefined): string {
  if (minutes === undefined || minutes < 0) return "?";
  const days = Math.floor(minutes / 1440);
  const hours = Math.floor((minutes % 1440) / 60);
  const mins = minutes % 60;

  const parts: string[] = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (mins > 0 || parts.length === 0) parts.push(`${mins}m`);
  return parts.join(" ");
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
