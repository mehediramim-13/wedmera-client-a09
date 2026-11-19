import type { Category } from "@/lib/config";

export type UserRole = "customer" | "vendor" | "admin";
export type ServiceStatus = "Pending" | "Approved" | "Rejected";
export type BookingStatus =
  | "Pending"
  | "Accepted"
  | "Rejected"
  | "Cancelled";

export type User = {
  id: string;
  _id?: string;
  name: string;
  email: string;
  image?: string | null;
  role: UserRole;
  isBlocked: boolean;
  businessName?: string;
  phone?: string;
  address?: string;
  bio?: string;
  subscriptionPlan?: "free" | "premium" | string;
  subscriptionExpiresAt?: string | null;
  createdAt?: string;
};

export type VendorSummary = {
  _id: string;
  name: string;
  image?: string | null;
  businessName?: string;
  address?: string;
  bio?: string;
  isPremium?: boolean;
  subscriptionPlan?: string;
};

export type Service = {
  _id: string;
  vendorId: string;
  serviceName: string;
  category: Category;
  description: string;
  price: number;
  location: string;
  images: string[];
  status: ServiceStatus;
  createdAt: string;
  vendor: VendorSummary;
  isPremium?: boolean;
  isActive?: boolean;
};

export type ServicePage = {
  items: Service[];
  total: number;
  page: number;
  limit: number;
  pages: number;
};

export type CategoryCount = {
  category: Category;
  count: number;
};

export type Booking = {
  _id: string;
  serviceId: string;
  customerId: string;
  vendorId: string;
  eventDate: string;
  eventLocation: string;
  message?: string;
  status: BookingStatus;
  createdAt: string;
  service?: Pick<Service, "_id" | "serviceName" | "images" | "price">;
  customer?: Pick<User, "id" | "name" | "email" | "image">;
  vendor?: Pick<User, "id" | "name" | "email" | "image" | "businessName">;
};

export type Paginated<T> = {
  items: T[];
  total: number;
  page: number;
  limit: number;
  pages: number;
};

export type ApiEnvelope<T> = {
  success: boolean;
  message: string;
  data?: T;
  errors?: unknown;
};

export type DashboardOverview = Record<string, number | string | null>;

export type Transaction = {
  _id: string;
  id?: string;
  vendor?: Pick<User, "id" | "name" | "email" | "businessName">;
  subscriptionPlan?: string;
  plan?: string;
  amount: number;
  status: string;
  createdAt: string;
  date?: string;
};
