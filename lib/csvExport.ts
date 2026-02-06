/**
 * Client-side CSV generation and download utilities for sensor readings export.
 */

type ExportReading = {
  ts: number;
  pm25?: number;
  pm10?: number;
  co2?: number;
  tempC?: number;
  rh?: number;
  voc?: number;
  pressure?: number;
  battery?: number;
};

const CSV_COLUMNS = [
  { header: "Timestamp (Unix ms)", key: "ts" },
  { header: "Date/Time", key: "_datetime" },
  { header: "PM2.5 (µg/m³)", key: "pm25" },
  { header: "PM10 (µg/m³)", key: "pm10" },
  { header: "CO2 (ppm)", key: "co2" },
  { header: "Temperature (°C)", key: "tempC" },
  { header: "Humidity (%)", key: "rh" },
  { header: "TVOC (ppb)", key: "voc" },
  { header: "Pressure (hPa)", key: "pressure" },
  { header: "Battery (%)", key: "battery" },
] as const;

function escapeCell(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function formatDateTime(ts: number): string {
  return new Date(ts).toISOString();
}

/**
 * Generate CSV content string from an array of readings.
 */
export function generateCsvContent(
  readings: ExportReading[],
  deviceName?: string,
): string {
  const lines: string[] = [];

  // Optional device info header comment
  if (deviceName) {
    lines.push(`# Device: ${deviceName}`);
    lines.push(`# Exported: ${new Date().toISOString()}`);
    lines.push(`# Readings: ${readings.length}`);
    lines.push("");
  }

  // Column headers
  lines.push(CSV_COLUMNS.map((c) => escapeCell(c.header)).join(","));

  // Data rows
  for (const reading of readings) {
    const row = CSV_COLUMNS.map((col) => {
      if (col.key === "_datetime") {
        return escapeCell(formatDateTime(reading.ts));
      }
      const value = reading[col.key as keyof ExportReading];
      return value !== undefined && value !== null ? String(value) : "";
    });
    lines.push(row.join(","));
  }

  return lines.join("\n");
}

/**
 * Trigger a browser download of CSV content.
 */
export function downloadCsv(csvContent: string, filename: string): void {
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.style.display = "none";

  document.body.appendChild(link);
  link.click();

  // Clean up
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
