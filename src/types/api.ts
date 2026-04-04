// --- Enums as union types ---
// Union types en vez de enum de TypeScript porque generan menos código en el bundle
// y son más compatibles con el JSON que devuelve la API

export type MenuCategory = "entrantes" | "principales" | "postres" | "bebidas";

export type ReservationStatus =
  | "pending"
  | "confirmed"
  | "completed"
  | "cancelled"
  | "no_show"
  | "expired";

// --- Entity interfaces ---

export interface User {
  id: number;
  name: string;
  email: string;
  role: string;
}

export interface Table {
  id: number;
  name: string;
  min_capacity: number;
  max_capacity: number;
  location: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
}

export interface MenuItem {
  id: number;
  name: string;
  description: string | null;
  price: string;
  category: MenuCategory;
  is_available: boolean;
  daily_stock: number | null;
  created_at: string;
}

export interface ReservationPayment {
  amount: string;
  status: string;
  paid_at: string;
}

export interface Reservation {
  id: number;
  user_id: number;
  table?: Table;
  seats_requested: number;
  date: string;
  start_time: string;
  end_time: string;
  status: ReservationStatus;
  expires_at?: string;
  payment?: ReservationPayment;
  created_at: string;
}

export interface ReservationItem {
  id: number;
  quantity: number;
  unit_price: string;
  subtotal: string;
  menu_item: {
    id: number;
    name: string;
    category: MenuCategory;
  };
  created_at: string;
}

// --- API response wrappers ---

export interface ApiResponse<T> {
  data: T;
}

export interface PaginationMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
}

// --- Error responses ---

export interface ValidationError {
  message: string;
  errors: Record<string, string[]>;
}

// --- Auth responses ---

export interface AuthResponse {
  user: User;
  token: string;
}

export interface MessageResponse {
  message: string;
}
