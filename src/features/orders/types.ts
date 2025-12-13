// src/features/orders/types.ts
import { Address } from "../auth/types";

// ============ PAGINATION META (NEW) ============
export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ============ ORDER ITEM PAYLOAD ============
export interface OrderItemPayload {
  serviceId: string;
  name: string;
  quantity: number;
  price: number;
  note?: string;
}

// ============ CUSTOMER CONTACT ============
export interface CustomerContact {
  name: string;          // Nama penerima (bisa beda dengan user)
  phone: string;         // Nomor HP utama
  alternatePhone?: string; // Nomor cadangan
}

// ============ PROPERTY DETAILS ============
export interface PropertyDetails {
  type: 'rumah' | 'apartemen' | 'kantor' | 'ruko' | 'kendaraan' | 'lainnya' | '';
  floor?: number | null;     // Lantai berapa (apartemen/gedung)
  hasParking: boolean;       // Ada tempat parkir? 
  hasElevator: boolean;      // Ada lift?
  accessNote?: string;       // Catatan akses khusus
}

// ============ SCHEDULED TIME SLOT ============
export interface ScheduledTimeSlot {
  preferredStart: string;  // "09:00"
  preferredEnd: string;    // "12:00"
  isFlexible: boolean;     // Boleh datang di luar slot? 
}

// ============ ATTACHMENT ============
export interface Attachment {
  url: string;
  type: 'photo' | 'video';
  description?: string;
  uploadedAt?: string;
}

// ============ ADDITIONAL FEE ============
export interface AdditionalFee {
  _id: string;
  description: string;
  amount: number;
  status: 'pending_approval' | 'approved_unpaid' | 'paid' | 'rejected';
  paymentId?: string;
}

// ============ CREATE ORDER PAYLOAD ============
export interface CreateOrderPayload {
  orderType: 'direct' | 'basic';
  providerId?: string | null;
  totalAmount: number;
  items: OrderItemPayload[];
  scheduledAt: string;
  shippingAddress: Address; 
  location: { 
    type: 'Point', 
    coordinates: number[];
  };
  customerContact: CustomerContact;
  orderNote?: string;
  propertyDetails?: PropertyDetails;
  scheduledTimeSlot?: ScheduledTimeSlot;
  attachments?: Attachment[];
  voucherCode?: string;
}

// ============ POPULATED ORDER ITEM ============
export interface PopulatedOrderItem {
  serviceId: {
    _id: string;
    name: string;
    iconUrl?: string;
    category?: string;
  } | null;
  name: string;
  quantity: number;
  price: number;
  note?: string;
}

// ============ POPULATED PROVIDER ============
export interface PopulatedProvider {
  _id: string;
  userId: {
    _id: string;
    fullName: string;
    phoneNumber?: string;
    profilePictureUrl?: string;
  };
  rating?: number;
  isOnline?: boolean;
}

// ============ POPULATED USER ============
export interface PopulatedUser {
  _id: string;
  fullName: string;
  phoneNumber?: string;
  profilePictureUrl?: string;
}

// ============ ORDER STATUS ============
export type OrderStatus = 
  | 'pending' 
  | 'paid' 
  | 'searching' 
  | 'accepted' 
  | 'on_the_way' 
  | 'working' 
  | 'waiting_approval' 
  | 'completed' 
  | 'cancelled' 
  | 'failed';

// ============ ORDER INTERFACE (FULL) ============
export interface Order {
  _id: string;
  orderNumber: string;
  userId: string | PopulatedUser;
  providerId?: string | PopulatedProvider | null;
  items: PopulatedOrderItem[];
  
  totalAmount: number;
  adminFee?: number;
  discountAmount?: number;
  
  status: OrderStatus;
  orderType: 'direct' | 'basic';
  scheduledAt?: string;
  
  shippingAddress?: Address;
  location?: {
    type: 'Point';
    coordinates: number[];
  };
  
  customerContact?: CustomerContact;
  orderNote?: string;
  propertyDetails?: PropertyDetails;
  scheduledTimeSlot?: ScheduledTimeSlot;
  attachments?: Attachment[];

  additionalFees?: AdditionalFee[];
  completionEvidence?: Attachment[];
  
  // [BARU] Field untuk Auto-Complete
  waitingApprovalAt?: string; 
  
  createdAt: string;
  updatedAt: string;
}

export interface OrderResponse {
  messageKey: string;
  message: string;
  data: Order;
}

export interface OrderListResponse {
  messageKey?: string;
  message?: string;
  data: Order[];
  meta?: PaginationMeta; 
}