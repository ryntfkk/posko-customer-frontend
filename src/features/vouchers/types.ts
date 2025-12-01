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
  // [BARU] Field tambahan dari backend logic baru
  userVoucherId?: string; // ID unik klaim (jika sudah diklaim)
  applicableServices?: Array<{ _id: string; name: string } | string>; // Bisa array object atau string ID
  claimedAt?: string;
}

export interface CheckVoucherPayload {
  code: string;
  purchaseAmount?: number; // Opsional (karena logic baru pakai items)
  // [BARU] Kirim items untuk validasi layanan spesifik
  items?: Array<{
    serviceId: string;
    price: number;
    quantity: number;
  }>;
}

export interface CheckVoucherResult {
   _id: string;
   userVoucherId: string; // [BARU] ID Klaim
   code: string;
   discountType: 'percentage' | 'fixed';
   discountValue: number;
   estimatedDiscount: number;
   eligibleTotal: number; // [BARU] Total belanja yang valid kena diskon
}

export interface VoucherListResponse {
  message: string;
  data: Voucher[];
}

export interface CheckVoucherResponse {
  message: string;
  data: CheckVoucherResult;
}

// [BARU] Response Klaim
export interface ClaimVoucherResponse {
  message: string;
  data: {
    code: string;
    validUntil: string;
  };
}   