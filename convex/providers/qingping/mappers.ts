import type {
  NormalizedDevice,
  NormalizedReading,
  QingpingDevice,
  QingpingDeviceData,
} from "../types";

export const mapQingpingDevice = (device: QingpingDevice): NormalizedDevice => {
  const name = device.info?.name ?? device.info?.mac ?? "Qingping Device";
  const model = device.product?.en_name ?? device.product?.name;

  return {
    providerDeviceId: device.info.mac,
    name,
    model,
  };
};

export const mapQingpingReading = (
  data?: QingpingDeviceData,
): NormalizedReading | null => {
  if (!data) {
    return null;
  }

  const ts = data.timestamp?.value ?? Date.now();

  return {
    ts,
    tempC: data.temperature?.value,
    rh: data.humidity?.value,
    pressure: data.pressure?.value,
    co2: data.co2?.value,
    pm25: data.pm25?.value,
    pm10: data.pm10?.value,
    voc: data.tvoc?.value,
    battery: data.battery?.value,
  };
};
