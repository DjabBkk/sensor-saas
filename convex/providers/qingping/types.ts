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

export type QingpingSignature = {
  signature: string;
  timestamp: number;
  token: string;
};

export type QingpingWebhookInfo = {
  mac: string;
  sn?: string;
  product: {
    id: number;
    desc: string;
  };
  name: string;
  version?: string;
  created_at?: number;
};

export type QingpingWebhookEvent = {
  data: QingpingDeviceData;
  alert_config?: {
    metric_name: string;
    operator: "gt" | "lt";
    threshold: number;
  };
  status?: number;
};

export type QingpingWebhookBody = {
  signature: QingpingSignature;
  payload: {
    info: QingpingWebhookInfo;
    metadata?: {
      data_type: "realtime" | "history";
    };
    data: QingpingDeviceData[];
    events?: QingpingWebhookEvent[];
  };
};
