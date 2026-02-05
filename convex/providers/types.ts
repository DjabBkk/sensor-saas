export type NormalizedReading = {
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

export type NormalizedDevice = {
  providerDeviceId: string;
  name: string;
  model?: string;
  timezone?: string;
};

// Provider config fields stored in `providerConfigs`.
export type ProviderConfig = {
  accessToken: string;
  tokenExpiresAt: number;
  appKey?: string;
  appSecret?: string;
  webhookSecret?: string;
};

export type Provider = "qingping" | "purpleair" | "iqair" | "temtop";
