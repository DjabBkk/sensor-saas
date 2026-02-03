/**
 * Air Quality Index (AQI) level functions with gradient colors
 * Based on US EPA standards
 * 
 * Color palette follows 2026 design best practices:
 * - Excellent:  #10B981 → #34D399 (Emerald)
 * - Good:       #84CC16 → #A3E635 (Lime)
 * - Moderate:   #F59E0B → #FBBF24 (Amber)
 * - Poor:       #F97316 → #FB923C (Orange)
 * - Unhealthy:  #EF4444 → #F87171 (Red)
 * - Hazardous:  #DC2626 → #991B1B (Dark Red)
 */

export type AQILevel = {
  label: string;
  color: string;        // Tailwind text color class
  bgColor: string;      // Tailwind bg color class
  fillColor: string;    // Hex color for charts (light mode)
  fillColorDark: string; // Hex color for charts (dark mode)
  cssVar: string;       // CSS variable name
  percentage: number;   // 0-100 for gauge fill
};

// AQI Health Status Colors - matches globals.css
const COLORS = {
  // Air Quality Levels (based on design system)
  excellent: { 
    color: "text-emerald-500 dark:text-emerald-400", 
    bgColor: "bg-emerald-500 dark:bg-emerald-400", 
    fill: "#10B981",
    fillDark: "#34D399",
    cssVar: "--aqi-excellent"
  },
  good: { 
    color: "text-lime-500 dark:text-lime-400", 
    bgColor: "bg-lime-500 dark:bg-lime-400", 
    fill: "#84CC16",
    fillDark: "#A3E635",
    cssVar: "--aqi-good"
  },
  moderate: { 
    color: "text-amber-500 dark:text-amber-400", 
    bgColor: "bg-amber-500 dark:bg-amber-400", 
    fill: "#F59E0B",
    fillDark: "#FBBF24",
    cssVar: "--aqi-moderate"
  },
  poor: { 
    color: "text-orange-500 dark:text-orange-400", 
    bgColor: "bg-orange-500 dark:bg-orange-400", 
    fill: "#F97316",
    fillDark: "#FB923C",
    cssVar: "--aqi-poor"
  },
  unhealthy: { 
    color: "text-red-500 dark:text-red-400", 
    bgColor: "bg-red-500 dark:bg-red-400", 
    fill: "#EF4444",
    fillDark: "#F87171",
    cssVar: "--aqi-unhealthy"
  },
  hazardous: { 
    color: "text-red-700 dark:text-red-900", 
    bgColor: "bg-red-700 dark:bg-red-900", 
    fill: "#DC2626",
    fillDark: "#991B1B",
    cssVar: "--aqi-hazardous"
  },
  
  // Comfort colors for Temperature & Humidity
  cold: { 
    color: "text-blue-500 dark:text-blue-400", 
    bgColor: "bg-blue-500 dark:bg-blue-400", 
    fill: "#3B82F6",
    fillDark: "#60A5FA",
    cssVar: "--comfort-cold"
  },
  cool: { 
    color: "text-cyan-500 dark:text-cyan-400", 
    bgColor: "bg-cyan-500 dark:bg-cyan-400", 
    fill: "#06B6D4",
    fillDark: "#22D3EE",
    cssVar: "--comfort-cool"
  },
  comfortable: { 
    color: "text-emerald-500 dark:text-emerald-400", 
    bgColor: "bg-emerald-500 dark:bg-emerald-400", 
    fill: "#10B981",
    fillDark: "#34D399",
    cssVar: "--comfort-comfortable"
  },
  warm: { 
    color: "text-amber-500 dark:text-amber-400", 
    bgColor: "bg-amber-500 dark:bg-amber-400", 
    fill: "#F59E0B",
    fillDark: "#FBBF24",
    cssVar: "--comfort-warm"
  },
  hot: { 
    color: "text-red-500 dark:text-red-400", 
    bgColor: "bg-red-500 dark:bg-red-400", 
    fill: "#EF4444",
    fillDark: "#F87171",
    cssVar: "--comfort-hot"
  },
  veryHot: { 
    color: "text-red-600 dark:text-red-500", 
    bgColor: "bg-red-600 dark:bg-red-500", 
    fill: "#DC2626",
    fillDark: "#EF4444",
    cssVar: "--comfort-hot"
  },
  dry: { 
    color: "text-amber-500 dark:text-amber-400", 
    bgColor: "bg-amber-500 dark:bg-amber-400", 
    fill: "#F59E0B",
    fillDark: "#FBBF24",
    cssVar: "--comfort-dry"
  },
  humid: { 
    color: "text-blue-500 dark:text-blue-400", 
    bgColor: "bg-blue-500 dark:bg-blue-400", 
    fill: "#3B82F6",
    fillDark: "#60A5FA",
    cssVar: "--comfort-humid"
  },
};

/**
 * PM2.5 levels based on US EPA AQI standards
 * @param value PM2.5 concentration in µg/m³
 */
export function getPM25Level(value: number): AQILevel {
  // Max scale for gauge: 250 µg/m³
  const maxScale = 250;
  const percentage = Math.min((value / maxScale) * 100, 100);

  if (value <= 12) {
    return { label: "Excellent", ...COLORS.excellent, fillColor: COLORS.excellent.fill, fillColorDark: COLORS.excellent.fillDark, cssVar: COLORS.excellent.cssVar, percentage };
  }
  if (value <= 35.4) {
    return { label: "Good", ...COLORS.good, fillColor: COLORS.good.fill, fillColorDark: COLORS.good.fillDark, cssVar: COLORS.good.cssVar, percentage };
  }
  if (value <= 55.4) {
    return { label: "Moderate", ...COLORS.moderate, fillColor: COLORS.moderate.fill, fillColorDark: COLORS.moderate.fillDark, cssVar: COLORS.moderate.cssVar, percentage };
  }
  if (value <= 150.4) {
    return { label: "Poor", ...COLORS.poor, fillColor: COLORS.poor.fill, fillColorDark: COLORS.poor.fillDark, cssVar: COLORS.poor.cssVar, percentage };
  }
  if (value <= 250.4) {
    return { label: "Unhealthy", ...COLORS.unhealthy, fillColor: COLORS.unhealthy.fill, fillColorDark: COLORS.unhealthy.fillDark, cssVar: COLORS.unhealthy.cssVar, percentage };
  }
  return { label: "Hazardous", ...COLORS.hazardous, fillColor: COLORS.hazardous.fill, fillColorDark: COLORS.hazardous.fillDark, cssVar: COLORS.hazardous.cssVar, percentage: 100 };
}

/**
 * PM10 levels based on US EPA AQI standards
 * @param value PM10 concentration in µg/m³
 */
export function getPM10Level(value: number): AQILevel {
  // Max scale for gauge: 500 µg/m³
  const maxScale = 500;
  const percentage = Math.min((value / maxScale) * 100, 100);

  if (value <= 54) {
    return { label: "Excellent", ...COLORS.excellent, fillColor: COLORS.excellent.fill, fillColorDark: COLORS.excellent.fillDark, cssVar: COLORS.excellent.cssVar, percentage };
  }
  if (value <= 154) {
    return { label: "Good", ...COLORS.good, fillColor: COLORS.good.fill, fillColorDark: COLORS.good.fillDark, cssVar: COLORS.good.cssVar, percentage };
  }
  if (value <= 254) {
    return { label: "Moderate", ...COLORS.moderate, fillColor: COLORS.moderate.fill, fillColorDark: COLORS.moderate.fillDark, cssVar: COLORS.moderate.cssVar, percentage };
  }
  if (value <= 354) {
    return { label: "Poor", ...COLORS.poor, fillColor: COLORS.poor.fill, fillColorDark: COLORS.poor.fillDark, cssVar: COLORS.poor.cssVar, percentage };
  }
  if (value <= 424) {
    return { label: "Unhealthy", ...COLORS.unhealthy, fillColor: COLORS.unhealthy.fill, fillColorDark: COLORS.unhealthy.fillDark, cssVar: COLORS.unhealthy.cssVar, percentage };
  }
  return { label: "Hazardous", ...COLORS.hazardous, fillColor: COLORS.hazardous.fill, fillColorDark: COLORS.hazardous.fillDark, cssVar: COLORS.hazardous.cssVar, percentage: 100 };
}

/**
 * CO2 levels for indoor air quality
 * @param value CO2 concentration in ppm
 */
export function getCO2Level(value: number): AQILevel {
  // Max scale for gauge: 2500 ppm
  const maxScale = 2500;
  const percentage = Math.min((value / maxScale) * 100, 100);

  if (value <= 600) {
    return { label: "Excellent", ...COLORS.excellent, fillColor: COLORS.excellent.fill, fillColorDark: COLORS.excellent.fillDark, cssVar: COLORS.excellent.cssVar, percentage };
  }
  if (value <= 800) {
    return { label: "Good", ...COLORS.good, fillColor: COLORS.good.fill, fillColorDark: COLORS.good.fillDark, cssVar: COLORS.good.cssVar, percentage };
  }
  if (value <= 1000) {
    return { label: "Moderate", ...COLORS.moderate, fillColor: COLORS.moderate.fill, fillColorDark: COLORS.moderate.fillDark, cssVar: COLORS.moderate.cssVar, percentage };
  }
  if (value <= 1500) {
    return { label: "Poor", ...COLORS.poor, fillColor: COLORS.poor.fill, fillColorDark: COLORS.poor.fillDark, cssVar: COLORS.poor.cssVar, percentage };
  }
  return { label: "Unhealthy", ...COLORS.unhealthy, fillColor: COLORS.unhealthy.fill, fillColorDark: COLORS.unhealthy.fillDark, cssVar: COLORS.unhealthy.cssVar, percentage };
}

/**
 * TVOC (Total Volatile Organic Compounds) levels
 * @param value TVOC in ppb or µg/m³
 */
export function getTVOCLevel(value: number): AQILevel {
  // Max scale for gauge: 3000 ppb
  const maxScale = 3000;
  const percentage = Math.min((value / maxScale) * 100, 100);

  if (value <= 65) {
    return { label: "Excellent", ...COLORS.excellent, fillColor: COLORS.excellent.fill, fillColorDark: COLORS.excellent.fillDark, cssVar: COLORS.excellent.cssVar, percentage };
  }
  if (value <= 220) {
    return { label: "Good", ...COLORS.good, fillColor: COLORS.good.fill, fillColorDark: COLORS.good.fillDark, cssVar: COLORS.good.cssVar, percentage };
  }
  if (value <= 660) {
    return { label: "Moderate", ...COLORS.moderate, fillColor: COLORS.moderate.fill, fillColorDark: COLORS.moderate.fillDark, cssVar: COLORS.moderate.cssVar, percentage };
  }
  if (value <= 2200) {
    return { label: "Poor", ...COLORS.poor, fillColor: COLORS.poor.fill, fillColorDark: COLORS.poor.fillDark, cssVar: COLORS.poor.cssVar, percentage };
  }
  return { label: "Unhealthy", ...COLORS.unhealthy, fillColor: COLORS.unhealthy.fill, fillColorDark: COLORS.unhealthy.fillDark, cssVar: COLORS.unhealthy.cssVar, percentage };
}

/**
 * Temperature comfort levels
 * @param value Temperature in Celsius
 */
export function getTemperatureLevel(value: number): AQILevel {
  // Percentage based on comfort scale (10-40°C range mapped to gauge)
  const minTemp = 10;
  const maxTemp = 40;
  const percentage = Math.min(Math.max(((value - minTemp) / (maxTemp - minTemp)) * 100, 0), 100);

  if (value < 10) {
    return { label: "Very Cold", ...COLORS.cold, fillColor: COLORS.cold.fill, fillColorDark: COLORS.cold.fillDark, cssVar: COLORS.cold.cssVar, percentage: 10 };
  }
  if (value < 16) {
    return { label: "Cold", ...COLORS.cold, fillColor: COLORS.cold.fill, fillColorDark: COLORS.cold.fillDark, cssVar: COLORS.cold.cssVar, percentage };
  }
  if (value < 22) {
    return { label: "Cool", ...COLORS.cool, fillColor: COLORS.cool.fill, fillColorDark: COLORS.cool.fillDark, cssVar: COLORS.cool.cssVar, percentage };
  }
  if (value <= 26) {
    return { label: "Comfortable", ...COLORS.comfortable, fillColor: COLORS.comfortable.fill, fillColorDark: COLORS.comfortable.fillDark, cssVar: COLORS.comfortable.cssVar, percentage };
  }
  if (value <= 30) {
    return { label: "Warm", ...COLORS.warm, fillColor: COLORS.warm.fill, fillColorDark: COLORS.warm.fillDark, cssVar: COLORS.warm.cssVar, percentage };
  }
  if (value <= 35) {
    return { label: "Hot", ...COLORS.hot, fillColor: COLORS.hot.fill, fillColorDark: COLORS.hot.fillDark, cssVar: COLORS.hot.cssVar, percentage };
  }
  return { label: "Very Hot", ...COLORS.veryHot, fillColor: COLORS.veryHot.fill, fillColorDark: COLORS.veryHot.fillDark, cssVar: COLORS.veryHot.cssVar, percentage: 100 };
}

/**
 * Humidity comfort levels
 * @param value Relative humidity in %
 */
export function getHumidityLevel(value: number): AQILevel {
  // Percentage is the actual humidity value since it's already 0-100
  const percentage = Math.min(Math.max(value, 0), 100);

  if (value < 20) {
    return { label: "Very Dry", ...COLORS.dry, fillColor: COLORS.dry.fill, fillColorDark: COLORS.dry.fillDark, cssVar: COLORS.dry.cssVar, percentage };
  }
  if (value < 30) {
    return { label: "Dry", ...COLORS.dry, fillColor: COLORS.dry.fill, fillColorDark: COLORS.dry.fillDark, cssVar: COLORS.dry.cssVar, percentage };
  }
  if (value <= 60) {
    return { label: "Comfortable", ...COLORS.comfortable, fillColor: COLORS.comfortable.fill, fillColorDark: COLORS.comfortable.fillDark, cssVar: COLORS.comfortable.cssVar, percentage };
  }
  if (value <= 70) {
    return { label: "Humid", ...COLORS.humid, fillColor: COLORS.humid.fill, fillColorDark: COLORS.humid.fillDark, cssVar: COLORS.humid.cssVar, percentage };
  }
  return { label: "Very Humid", ...COLORS.humid, fillColor: COLORS.humid.fill, fillColorDark: COLORS.humid.fillDark, cssVar: COLORS.humid.cssVar, percentage };
}

/**
 * Battery level indicator
 * @param value Battery percentage
 */
export function getBatteryLevel(value: number): AQILevel {
  const percentage = Math.min(Math.max(value, 0), 100);

  if (value <= 10) {
    return { label: "Critical", ...COLORS.unhealthy, fillColor: COLORS.unhealthy.fill, fillColorDark: COLORS.unhealthy.fillDark, cssVar: COLORS.unhealthy.cssVar, percentage };
  }
  if (value <= 25) {
    return { label: "Low", ...COLORS.poor, fillColor: COLORS.poor.fill, fillColorDark: COLORS.poor.fillDark, cssVar: COLORS.poor.cssVar, percentage };
  }
  if (value <= 50) {
    return { label: "Medium", ...COLORS.moderate, fillColor: COLORS.moderate.fill, fillColorDark: COLORS.moderate.fillDark, cssVar: COLORS.moderate.cssVar, percentage };
  }
  return { label: "Good", ...COLORS.good, fillColor: COLORS.good.fill, fillColorDark: COLORS.good.fillDark, cssVar: COLORS.good.cssVar, percentage };
}
