export type Plan = "starter" | "pro" | "business" | "custom";

export type PlanLimits = {
  maxDevices: number;
  maxWidgets: number;
  maxKiosks: number;
  sharedWidgetKioskLimit: number | null; // when set, widgets + kiosks share this combined limit
  minReportInterval: number; // seconds (most frequent allowed)
  maxReportInterval: number; // seconds (least frequent allowed)
  defaultReportInterval: number; // seconds
  maxHistoryDays: number; // Infinity for custom/unlimited
  maxUserSeats: number;
  customBranding: boolean;
  whiteLabel: boolean;
};

const PLAN_LIMITS: Record<Plan, PlanLimits> = {
  starter: {
    maxDevices: 1,
    maxWidgets: 1,
    maxKiosks: 1,
    sharedWidgetKioskLimit: 1, // 1 widget OR kiosk total
    minReportInterval: 3600, // 60 min
    maxReportInterval: 3600, // 60 min
    defaultReportInterval: 3600, // 60 min
    maxHistoryDays: 7,
    maxUserSeats: 1,
    customBranding: false,
    whiteLabel: false,
  },
  pro: {
    maxDevices: 3,
    maxWidgets: 3,
    maxKiosks: 3,
    sharedWidgetKioskLimit: null,
    minReportInterval: 1800, // 30 min
    maxReportInterval: 3600, // 60 min
    defaultReportInterval: 1800, // 30 min
    maxHistoryDays: 30,
    maxUserSeats: 3,
    customBranding: true,
    whiteLabel: false,
  },
  business: {
    maxDevices: 20,
    maxWidgets: Infinity,
    maxKiosks: Infinity,
    sharedWidgetKioskLimit: null,
    minReportInterval: 300, // 5 min
    maxReportInterval: 3600, // 60 min
    defaultReportInterval: 300, // 5 min
    maxHistoryDays: 365,
    maxUserSeats: 5,
    customBranding: true,
    whiteLabel: true,
  },
  custom: {
    maxDevices: 100,
    maxWidgets: Infinity,
    maxKiosks: Infinity,
    sharedWidgetKioskLimit: null,
    minReportInterval: 60, // 1 min
    maxReportInterval: 3600, // 60 min
    defaultReportInterval: 60, // 1 min
    maxHistoryDays: Infinity,
    maxUserSeats: 10,
    customBranding: true,
    whiteLabel: true,
  },
};

/**
 * Get the full limits config for a plan.
 */
export function getPlanLimits(plan: Plan): PlanLimits {
  return PLAN_LIMITS[plan];
}

/**
 * Get the minimum refresh interval (most frequent) allowed for a plan.
 * Returns interval in seconds.
 */
export function getMinRefreshInterval(plan: Plan): number {
  return getPlanLimits(plan).minReportInterval;
}

/**
 * Get the maximum refresh interval (least frequent) allowed for a plan.
 * Returns interval in seconds.
 */
export function getMaxRefreshInterval(plan: Plan): number {
  return getPlanLimits(plan).maxReportInterval;
}

/**
 * Get default refresh interval for a plan.
 * Returns interval in seconds.
 */
export function getDefaultRefreshInterval(plan: Plan): number {
  return getPlanLimits(plan).defaultReportInterval;
}

/**
 * Get the maximum number of devices allowed for a plan.
 */
export function getMaxDevices(plan: Plan): number {
  return getPlanLimits(plan).maxDevices;
}

/**
 * Get the maximum number of widgets (embed tokens) allowed for a plan.
 */
export function getMaxWidgets(plan: Plan): number {
  return getPlanLimits(plan).maxWidgets;
}

/**
 * Get the maximum number of kiosks allowed for a plan.
 */
export function getMaxKiosks(plan: Plan): number {
  return getPlanLimits(plan).maxKiosks;
}

/**
 * Get the maximum history retention in days for a plan.
 * Returns Infinity for unlimited retention.
 */
export function getMaxHistoryDays(plan: Plan): number {
  return getPlanLimits(plan).maxHistoryDays;
}

/**
 * Validate if a refresh interval is allowed for a plan.
 */
export function isValidRefreshInterval(plan: Plan, intervalSeconds: number): boolean {
  const limits = getPlanLimits(plan);
  return intervalSeconds >= limits.minReportInterval && intervalSeconds <= limits.maxReportInterval;
}
