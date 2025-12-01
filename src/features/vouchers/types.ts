export interface Voucher {
  _id: string;
  code: string;
  description: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  maxDiscount: number;
  minPurchase: number;
  expiryDate: string;
  isActive: boolean;
  quota: number;
}

export interface CheckVoucherPayload {
  code: string;
  purchaseAmount: number;
}

export interface CheckVoucherResult {
   _id: string;
   code: string;
   discountType: 'percentage' | 'fixed';
   discountValue: number;
   estimatedDiscount: number;
}

export interface VoucherListResponse {
  message: string;
  data: Voucher[];
}

export interface CheckVoucherResponse {
  message: string;
  data: CheckVoucherResult;
}   