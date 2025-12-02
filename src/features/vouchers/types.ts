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

// [BARU] Response Klaim
export interface ClaimVoucherResponse {
  message: string;
  data: {
    code: string;
    validUntil: string;
  };
}   

// [BARU] Payload untuk pengecekan voucher
export interface CheckVoucherPayload {
  code: string;
  items: {
    serviceId: string;
    price: number;
    quantity: number;
  }[];
}

// [BARU] Response hasil pengecekan voucher (Sesuai Backend Step 2)
export interface CheckVoucherResponse {
  _id: string;
  userVoucherId: string;
  code: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  estimatedDiscount: number; // Field Penting!
  eligibleTotal: number;     // Field Penting!
}