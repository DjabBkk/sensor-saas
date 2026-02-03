/**
 * Air Quality Level Functions
 * Color palette follows 2026 design best practices:
 * - Excellent:  #10B981 → #34D399 (Emerald)
 * - Good:       #84CC16 → #A3E635 (Lime)
 * - Moderate:   #F59E0B → #FBBF24 (Amber)
 * - Poor:       #F97316 → #FB923C (Orange)
 * - Unhealthy:  #EF4444 → #F87171 (Red)
 * - Hazardous:  #DC2626 → #991B1B (Dark Red)
 */

export const getPM25Level = (value: number) => {
  if (value <= 12) {
    return { label: "Excellent", color: "text-emerald-500 dark:text-emerald-400", bg: "bg-emerald-500 dark:bg-emerald-400" };
  }
  if (value <= 35.4) {
    return { label: "Good", color: "text-lime-500 dark:text-lime-400", bg: "bg-lime-500 dark:bg-lime-400" };
  }
  if (value <= 55.4) {
    return { label: "Moderate", color: "text-amber-500 dark:text-amber-400", bg: "bg-amber-500 dark:bg-amber-400" };
  }
  if (value <= 150.4) {
    return { label: "Poor", color: "text-orange-500 dark:text-orange-400", bg: "bg-orange-500 dark:bg-orange-400" };
  }
  if (value <= 250.4) {
    return { label: "Unhealthy", color: "text-red-500 dark:text-red-400", bg: "bg-red-500 dark:bg-red-400" };
  }
  return { label: "Hazardous", color: "text-red-700 dark:text-red-900", bg: "bg-red-700 dark:bg-red-900" };
};

export const getCO2Level = (value: number) => {
  if (value <= 600) {
    return { label: "Excellent", color: "text-emerald-500 dark:text-emerald-400", bg: "bg-emerald-500 dark:bg-emerald-400" };
  }
  if (value <= 800) {
    return { label: "Good", color: "text-lime-500 dark:text-lime-400", bg: "bg-lime-500 dark:bg-lime-400" };
  }
  if (value <= 1000) {
    return { label: "Moderate", color: "text-amber-500 dark:text-amber-400", bg: "bg-amber-500 dark:bg-amber-400" };
  }
  if (value <= 1500) {
    return { label: "Poor", color: "text-orange-500 dark:text-orange-400", bg: "bg-orange-500 dark:bg-orange-400" };
  }
  return { label: "Unhealthy", color: "text-red-500 dark:text-red-400", bg: "bg-red-500 dark:bg-red-400" };
};

export const getTemperatureLevel = (value: number) => {
  if (value < 10) {
    return { label: "Very Cold", color: "text-blue-500 dark:text-blue-400", bg: "bg-blue-500 dark:bg-blue-400" };
  }
  if (value < 16) {
    return { label: "Cold", color: "text-blue-500 dark:text-blue-400", bg: "bg-blue-500 dark:bg-blue-400" };
  }
  if (value < 22) {
    return { label: "Cool", color: "text-cyan-500 dark:text-cyan-400", bg: "bg-cyan-500 dark:bg-cyan-400" };
  }
  if (value <= 26) {
    return { label: "Comfortable", color: "text-emerald-500 dark:text-emerald-400", bg: "bg-emerald-500 dark:bg-emerald-400" };
  }
  if (value <= 30) {
    return { label: "Warm", color: "text-amber-500 dark:text-amber-400", bg: "bg-amber-500 dark:bg-amber-400" };
  }
  if (value <= 35) {
    return { label: "Hot", color: "text-red-500 dark:text-red-400", bg: "bg-red-500 dark:bg-red-400" };
  }
  return { label: "Very Hot", color: "text-red-600 dark:text-red-500", bg: "bg-red-600 dark:bg-red-500" };
};

export const getHumidityLevel = (value: number) => {
  if (value < 20) {
    return { label: "Very Dry", color: "text-amber-500 dark:text-amber-400", bg: "bg-amber-500 dark:bg-amber-400" };
  }
  if (value < 30) {
    return { label: "Dry", color: "text-amber-500 dark:text-amber-400", bg: "bg-amber-500 dark:bg-amber-400" };
  }
  if (value <= 60) {
    return { label: "Comfortable", color: "text-emerald-500 dark:text-emerald-400", bg: "bg-emerald-500 dark:bg-emerald-400" };
  }
  if (value <= 70) {
    return { label: "Humid", color: "text-blue-500 dark:text-blue-400", bg: "bg-blue-500 dark:bg-blue-400" };
  }
  return { label: "Very Humid", color: "text-blue-500 dark:text-blue-400", bg: "bg-blue-500 dark:bg-blue-400" };
};

export const formatNumber = (value?: number, decimals = 0) => {
  if (value === undefined || value === null) {
    return "--";
  }
  if (decimals === 0) {
    return Math.round(value).toString();
  }
  return value.toFixed(decimals);
};
