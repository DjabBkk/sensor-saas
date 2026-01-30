export const getPM25Level = (value: number) => {
  if (value <= 12) {
    return { label: "Good", color: "text-emerald-500", bg: "bg-emerald-500" };
  }
  if (value <= 35.4) {
    return { label: "Moderate", color: "text-yellow-500", bg: "bg-yellow-500" };
  }
  if (value <= 55.4) {
    return { label: "Unhealthy*", color: "text-orange-500", bg: "bg-orange-500" };
  }
  if (value <= 150.4) {
    return { label: "Unhealthy", color: "text-red-500", bg: "bg-red-500" };
  }
  return { label: "Very Unhealthy", color: "text-purple-500", bg: "bg-purple-500" };
};

export const getCO2Level = (value: number) => {
  if (value <= 600) {
    return { label: "Excellent", color: "text-emerald-500", bg: "bg-emerald-500" };
  }
  if (value <= 800) {
    return { label: "Good", color: "text-green-500", bg: "bg-green-500" };
  }
  if (value <= 1000) {
    return { label: "Moderate", color: "text-yellow-500", bg: "bg-yellow-500" };
  }
  if (value <= 1500) {
    return { label: "Poor", color: "text-orange-500", bg: "bg-orange-500" };
  }
  return { label: "Very Poor", color: "text-red-500", bg: "bg-red-500" };
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
