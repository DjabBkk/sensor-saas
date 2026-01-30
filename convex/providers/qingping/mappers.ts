Okay, so attached you find a Qingping documentation for their API, open API keys and all that stuff. So we want to build an air quality SaaS platform where users can onboard their own Qingping air quality monitors. And our solution would offer a kiosk preview where they can have a link, put it in the browser and display the air quality on the screen, for example.

Or we also want to offer indoor air quality scripts that they can put on their website. So we want to build a platform agnostic tool, but we want to start with Qingping sensors. So please read the documentation and come up with a step-by-step explanation on how this could eventually look for our customers.

So can they onboard their units themselves that they have or do we have to do that for them as you need a developer account to get API keys? So yeah, please tell me how the onboarding workflow would be and what is possible and what is not possible according to the documentation. import type {
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
