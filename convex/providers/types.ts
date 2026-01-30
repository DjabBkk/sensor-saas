export type QingpingValue = {
  value: number;
  level?: number;
  status?: number;
};

export type QingpingDeviceData = {
  temperature?: QingpingValue;
  humidity?: QingpingValue;
  pressure?: QingpingValue;
  co2?: QingpingValue;
  pm25?: QingpingValue;
  pm10?: QingpingValue;
  tvoc?: QingpingValue;
  battery?: QingpingValue;
  timestamp?: QingpingValue;
};

export type QingpingDeviceInfo = {
  name: string;
  mac: string;
  version?: string;
  created_at?: string;
  group_id?: string;
  group_name?: string;
};

export type QingpingProductInfo = {
  id?: string;
  name?: string;
  en_name?: string;
};

export type QingpingDevice = {
  info: QingpingDeviceInfo;
  product?: QingpingProductInfo;
  status?: { offline?: boolean };
  data?: QingpingDeviceData;
  setting?: {
    report_interval?: number;
    collect_interval?: number;
  };
};

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

export type QingpingWebhookItem = {
  mac?: string;
  data?: QingpingDeviceData;
};

export type QingpingWebhookPayload = {
  data?: QingpingWebhookItem[];
  devices?: QingpingWebhookItem[];
  device_data?: QingpingWebhookItem[];
};
