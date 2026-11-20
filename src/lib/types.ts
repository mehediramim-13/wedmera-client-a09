import type {
  BOOKING_STATUSES,
  SERVICE_CATEGORIES,
  SERVICE_STATUSES,
} from "@/lib/config";

export type UserRole = "customer" | "vendor" | "admin";
export type SubscriptionPlan = "free" | "premium";
export type ServiceCategory = (typeof SERVICE_CATEGORIES)[number];
export type ServiceStatus = (typeof SERVICE_STATUSES)[number];
export type BookingStatus = (typeof BOOKING_STATUSES)[number];

export interface ApiEnvelope<T> {
  success: boolean;
  message: string;
  data?: T;
  errors?: unknown;
}

export interface ApiUser {
  _id: string;
  name: string;
  email: string;
  image: string | null;
  role: UserRole;
  isBlocked: boolean;
  businessName: string;
  phone: string;
  address: string;
  bio: string;
  subscriptionPlan: SubscriptionPlan;
  subscriptionExpiresAt: string | null;
  effectivePlan: SubscriptionPlan;
}

export interface Category {
  category: ServiceCategory;
  count: number;
}

export interface ServiceVendor {
  _id: string;
  name: string;
  image: string | null;
  businessName: string;
  isPremium: boolean;
}

export interface Service {
  _id: string;
  vendorId: string;
  serviceName: string;
  category: ServiceCategory;
  description: string;
  price: number;
  location: string;
  images: string[];
  status: ServiceStatus;
  isActive?: boolean;
  createdAt: string;
  updatedAt?: string;
  vendor?: ServiceVendor | null;
  isPremium?: boolean;
}

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export interface Booking {
  _id: string;
  serviceId: string;
  vendorId: string;
  customerId: string;
  eventDate: string;
  eventLocation: string;
  message: string;
  status: BookingStatus;
  createdAt: string;
  updatedAt?: string;
}

export interface BookingServiceSummary {
  _id: string;
  serviceName: string;
  images: string[];
}

export interface CustomerBooking extends Booking {
  service: BookingServiceSummary | null;
  vendor: {
    _id: string;
    name: string;
    businessName: string;
    image: string | null;
  } | null;
}

export interface VendorBooking extends Booking {
  customer: {
    _id: string;
    name: string;
    email: string;
    image: string | null;
  } | null;
  service: BookingServiceSummary | null;
}

export interface CustomerOverview {
  totalBookings: number;
  pending: number;
  accepted: number;
  rejected: number;
  cancelled: number;
}

export interface VendorOverview {
  totalServices: number;
  activeServices: number;
  pendingBookingRequests: number;
  acceptedBookings: number;
  currentPlan: SubscriptionPlan;
  subscriptionExpiresAt: string | null;
}

export interface VendorSubscription {
  plan: SubscriptionPlan;
  effectivePlan: SubscriptionPlan;
  expiresAt: string | null;
  currentPeriodStart?: string | null;
  currentPeriodEnd?: string | null;
  cancelAtPeriodEnd?: boolean;
  limits: { activeServices: number };
  activeServicesCount: number;
  payments?: Array<{
    _id?: string;
    plan?: SubscriptionPlan | string;
    amount?: number;
    currency?: string;
    status?: string;
    createdAt?: string;
    periodStart?: string | null;
    periodEnd?: string | null;
  }>;
  paymentHistory?: Array<{
    _id?: string;
    plan?: SubscriptionPlan | string;
    amount?: number;
    currency?: string;
    status?: string;
    createdAt?: string;
    periodStart?: string | null;
    periodEnd?: string | null;
  }>;
}

export interface AdminUser {
  _id: string;
  name: string;
  email: string;
  image: string | null;
  role: UserRole;
  isBlocked: boolean;
  businessName?: string;
  phone?: string;
  address?: string;
  bio?: string;
  subscriptionPlan?: SubscriptionPlan;
  subscriptionExpiresAt?: string | null;
  createdAt?: string;
  counts?: { services: number; bookings: number };
}

export interface AdminOverview {
  totalUsers: number;
  totalVendors: number;
  totalCustomers: number;
  totalServices: number;
  pendingServices: number;
  totalTransactions: number;
  totalRevenue: number;
}

export interface TransactionVendor {
  _id: string;
  name: string;
  email: string;
  image: string | null;
  businessName?: string;
}

export interface Transaction {
  _id: string;
  vendorId: string;
  stripeSessionId: string;
  plan: SubscriptionPlan;
  amount: number;
  currency: string;
  status: "paid" | "failed" | "pending" | string;
  createdAt: string;
  vendor: TransactionVendor | null;
}

export interface PaymentSessionStatus {
  status: "processing" | "paid" | "failed" | "pending" | string;
  plan?: SubscriptionPlan;
  amount?: number;
  currency?: string;
  createdAt?: string;
}

export interface BookingPayload {
  serviceId: string;
  eventDate: string;
  eventLocation: string;
  message?: string;
}

export interface ServicePayload {
  serviceName: string;
  category: ServiceCategory;
  description: string;
  price: number;
  location: string;
  images: string[];
}
