import { planValidator } from "./validators";

export type Plan = typeof planValidator._type;

/**
 * Get the minimum refresh interval (most frequent) allowed for a plan.
 * Returns interval in seconds.
 */
export function getMinRefreshInterval(plan: Plan): number {
  switch (plan) {
    case "free":
      return 10 * 60; // 10 minutes
    case "basic":
    case "pro":
    case "team":
      return 60; // 1 minute
    default:
      return 10 * 60; // Default to free plan limits
  }
}

/**
 * Get the maximum refresh interval (least frequent) allowed for a plan.
 * Returns interval in seconds.
 */
export function getMaxRefreshInterval(plan: Plan): number {
  switch (plan) {
    case "free":
      return 60 * 60; // 1 hour
    case "basic":
    case "pro":
    case "team":
      return 60 * 60; // 1 hour
    default:
      return 60 * 60; // Default to 1 hour
  }
}

/**
 * Get default refresh interval for a plan.
 * Returns interval in seconds.
 */
export function getDefaultRefreshInterval(plan: Plan): number {
  switch (plan) {
    case "free":
      return 10 * 60; // 10 minutes (most frequent for free)
    case "basic":
    case "pro":
    case "team":
      return 60; // 1 minute (most frequent for paid plans)
    default:
      return 10 * 60;
  }
}

/**
 * Validate if a refresh interval is allowed for a plan.
 */
export function isValidRefreshInterval(plan: Plan, intervalSeconds: number): boolean {
  const min = getMinRefreshInterval(plan);
  const max = getMaxRefreshInterval(plan);
  return intervalSeconds >= min && intervalSeconds <= max;
}
