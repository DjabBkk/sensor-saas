"use client";

type ReadingGaugeProps = {
  label: string;
  value: number | undefined;
  unit: string;
  icon: React.ReactNode;
  getLevel?: (value: number) => {
    label: string;
    color: string;
    bgColor: string;
  };
};

// AQI levels for PM2.5 (EPA standard)
export const getPM25Level = (value: number) => {
  if (value <= 12)
    return { label: "Good", color: "text-emerald-400", bgColor: "bg-emerald-400" };
  if (value <= 35.4)
    return { label: "Moderate", color: "text-yellow-400", bgColor: "bg-yellow-400" };
  if (value <= 55.4)
    return { label: "Unhealthy*", color: "text-orange-400", bgColor: "bg-orange-400" };
  if (value <= 150.4)
    return { label: "Unhealthy", color: "text-red-400", bgColor: "bg-red-400" };
  return { label: "Very Unhealthy", color: "text-purple-400", bgColor: "bg-purple-400" };
};

// CO2 levels
export const getCO2Level = (value: number) => {
  if (value <= 600)
    return { label: "Excellent", color: "text-emerald-400", bgColor: "bg-emerald-400" };
  if (value <= 800)
    return { label: "Good", color: "text-green-400", bgColor: "bg-green-400" };
  if (value <= 1000)
    return { label: "Moderate", color: "text-yellow-400", bgColor: "bg-yellow-400" };
  if (value <= 1500)
    return { label: "Poor", color: "text-orange-400", bgColor: "bg-orange-400" };
  return { label: "Very Poor", color: "text-red-400", bgColor: "bg-red-400" };
};

// Temperature comfort levels (Celsius)
export const getTempLevel = (value: number) => {
  if (value < 16)
    return { label: "Cold", color: "text-blue-400", bgColor: "bg-blue-400" };
  if (value <= 22)
    return { label: "Cool", color: "text-cyan-400", bgColor: "bg-cyan-400" };
  if (value <= 26)
    return { label: "Comfortable", color: "text-emerald-400", bgColor: "bg-emerald-400" };
  if (value <= 30)
    return { label: "Warm", color: "text-yellow-400", bgColor: "bg-yellow-400" };
  return { label: "Hot", color: "text-red-400", bgColor: "bg-red-400" };
};

// Humidity comfort levels
export const getHumidityLevel = (value: number) => {
  if (value < 30)
    return { label: "Too Dry", color: "text-yellow-400", bgColor: "bg-yellow-400" };
  if (value <= 60)
    return { label: "Comfortable", color: "text-emerald-400", bgColor: "bg-emerald-400" };
  return { label: "Too Humid", color: "text-blue-400", bgColor: "bg-blue-400" };
};

export function ReadingGauge({
  label,
  value,
  unit,
  icon,
  getLevel,
}: ReadingGaugeProps) {
  const hasValue = value !== undefined && value !== null;
  const level = hasValue && getLevel ? getLevel(value) : null;

  return (
    <div className="group relative overflow-hidden rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-900 to-slate-900/50 p-6 transition-all hover:border-slate-700">
      {/* Background glow effect */}
      {level && (
        <div
          className={`absolute -right-8 -top-8 h-32 w-32 rounded-full ${level.bgColor} opacity-5 blur-3xl transition-opacity group-hover:opacity-10`}
        />
      )}

      <div className="relative">
        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2 text-slate-400">
            {icon}
            <span className="text-sm font-medium">{label}</span>
          </div>
          {level && (
            <span
              className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${level.color} bg-slate-800/80`}
            >
              {level.label}
            </span>
          )}
        </div>

        {/* Value */}
        <div className="flex items-baseline gap-2">
          {hasValue ? (
            <>
              <span
                className={`text-4xl font-bold tabular-nums tracking-tight ${level?.color ?? "text-slate-100"}`}
              >
                {typeof value === "number" && value % 1 !== 0
                  ? value.toFixed(1)
                  : value}
              </span>
              <span className="text-lg text-slate-500">{unit}</span>
            </>
          ) : (
            <span className="text-2xl text-slate-600">--</span>
          )}
        </div>
      </div>
    </div>
  );
}
