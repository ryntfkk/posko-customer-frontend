export interface Service {
  _id: string;
  name: string;
  category: string;
  iconUrl: string;
  basePrice: number;
  description: string;
  isActive: boolean;
}

export interface ServiceResponse {
  message: string;
  data: Service[];
}