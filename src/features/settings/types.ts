export interface GlobalConfig {
  _id: string;
  key: string;
  adminFee: number;
  currency: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SettingsResponse {
  message: string;
  data: GlobalConfig;
}