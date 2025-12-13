export interface Banner {
  _id: string;
  imageUrl: string;
  title?: string;
  description?: string;
  linkUrl?: string; // Opsional: jika diklik mengarah ke mana
  isActive: boolean;
  order: number;
}

export interface BannerResponse {
  data: Banner[];
  message?: string;
}