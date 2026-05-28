// ============================================================
// Data Model Types (matching Prisma schema)
// ============================================================

export interface Admin {
  id: string;
  email: string;
  password: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export interface StoreSetting {
  id: string;
  storeName: string;
  storeSlug: string;
  logoUrl: string | null;
  whatsappNumber: string;
  address: string;
  operatingHours: string;
  shippingPerKm: number;
  themeColor: string;
  instagram: string | null;
  facebook: string | null;
  tiktok: string | null;
  bankAccount: string | null;
  bankName: string | null;
  bankHolder: string | null;
  isOpen: boolean;
  storeLatitude: number | null;
  storeLongitude: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  name: string;
  icon: string | null;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
  products?: Product[];
}

export interface Banner {
  id: string;
  imageUrl: string;
  title: string | null;
  subtitle: string | null;
  link: string | null;
  sortOrder: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  categoryId: string | null;
  category?: Category | null;
  sku: string | null;
  basePrice: number;
  sellPrice: number;
  discountPrice: number | null;
  discountPercent: number | null;
  stock: number;
  minStock: number;
  images: string; // JSON string of string[]
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  orderItems?: OrderItem[];
  stockMovements?: StockMovement[];
  favorites?: Favorite[];
}

export interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string | null;
  deliveryMethod: string;
  shippingCost: number;
  shippingDistance: number | null;
  subtotal: number;
  totalDiscount: number;
  total: number;
  status: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  orderItems: OrderItem[];
}

export interface OrderItem {
  id: string;
  orderId: string;
  order?: Order;
  productId: string;
  product?: Product;
  name: string;
  price: number;
  quantity: number;
  discount: number;
  subtotal: number;
}

export interface StockMovement {
  id: string;
  productId: string;
  product?: Product;
  type: string; // "in" | "out" | "adjustment"
  quantity: number;
  note: string | null;
  createdAt: string;
}

export interface FinanceRecord {
  id: string;
  type: string; // "income" | "expense"
  category: string | null;
  amount: number;
  description: string | null;
  date: string;
  createdAt: string;
  updatedAt: string;
}

export interface Favorite {
  id: string;
  productId: string;
  product?: Product;
  sessionId: string;
  createdAt: string;
}

// ============================================================
// Product Image Helper
// ============================================================

export function parseProductImages(images: string | string[]): string[] {
  if (Array.isArray(images)) return images;
  try {
    const parsed = JSON.parse(images);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

// ============================================================
// API Response Types
// ============================================================

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  products?: T[]; // backward compat alias
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface AdminLoginResponse {
  admin: { id: string; email: string; name: string };
  token: string;
}

export interface DashboardStats {
  totalProducts: number;
  totalOrders: number;
  totalRevenue: number;
  totalProductsSold: number;
  lowStockProducts: number;
  pendingOrders: number;
  recentOrders: Order[];
  revenueChart: Array<{ date: string; revenue: number; orders: number }>;
}

export interface FinanceSummary {
  totalIncome: number;
  totalExpense: number;
  profit: number;
  monthlyBreakdown: Array<{
    month: string;
    income: number;
    expense: number;
    profit: number;
  }>;
}

export interface StoreStatus {
  isOpen: boolean;
  storeName: string;
  operatingHours: string;
  whatsappNumber: string;
}

// ============================================================
// Product Filters (for public product listing)
// ============================================================

export interface ProductFilters {
  search?: string;
  categoryId?: string;
  minPrice?: number;
  maxPrice?: number;
  sortBy?: 'newest' | 'price_asc' | 'price_desc' | 'name' | 'popular';
  page?: number;
  pageSize?: number;
}

// ============================================================
// Form Data Types
// ============================================================

export interface AdminLoginForm {
  email: string;
  password: string;
}

export interface StoreSettingForm {
  storeName: string;
  storeSlug: string;
  logoUrl?: string;
  whatsappNumber: string;
  address: string;
  operatingHours: string;
  shippingPerKm: number;
  themeColor: string;
  instagram?: string;
  facebook?: string;
  tiktok?: string;
  bankAccount?: string;
  bankName?: string;
  bankHolder?: string;
  isOpen: boolean;
  storeLatitude?: number;
  storeLongitude?: number;
}

export interface CategoryForm {
  name: string;
  icon?: string;
  sortOrder: number;
}

export interface BannerForm {
  imageUrl: string;
  title?: string;
  subtitle?: string;
  link?: string;
  sortOrder: number;
  active: boolean;
}

export interface ProductForm {
  name: string;
  description?: string;
  categoryId?: string;
  sku?: string;
  basePrice: number;
  sellPrice: number;
  discountPrice?: number;
  stock: number;
  minStock: number;
  images: string[]; // Array of image URLs
  isActive: boolean;
}

export interface OrderForm {
  customerName: string;
  customerPhone: string;
  customerAddress?: string;
  deliveryMethod: 'pickup' | 'delivery';
  notes?: string;
  items: Array<{
    productId: string;
    quantity: number;
  }>;
}

export interface StockMovementForm {
  productId: string;
  type: 'in' | 'out' | 'adjustment';
  quantity: number;
  note?: string;
}

export interface FinanceRecordForm {
  type: 'income' | 'expense';
  category?: string;
  amount: number;
  description?: string;
  date: string;
}

// ============================================================
// Order Status Type
// ============================================================

export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'cancelled';

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pending: 'Menunggu Konfirmasi',
  confirmed: 'Dikonfirmasi',
  processing: 'Diproses',
  shipped: 'Dikirim',
  delivered: 'Selesai',
  cancelled: 'Dibatalkan',
};

export const ORDER_STATUS_COLORS: Record<OrderStatus, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  confirmed: 'bg-blue-100 text-blue-800',
  processing: 'bg-purple-100 text-purple-800',
  shipped: 'bg-indigo-100 text-indigo-800',
  delivered: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
};

// ============================================================
// Delivery Method Type
// ============================================================

export type DeliveryMethod = 'pickup' | 'delivery';

export const DELIVERY_METHOD_LABELS: Record<DeliveryMethod, string> = {
  pickup: 'Ambil Sendiri',
  delivery: 'Diantar',
};

// ============================================================
// Stock Movement Type
// ============================================================

export type StockMovementType = 'in' | 'out' | 'adjustment';

export const STOCK_MOVEMENT_LABELS: Record<StockMovementType, string> = {
  in: 'Stok Masuk',
  out: 'Stok Keluar',
  adjustment: 'Penyesuaian',
};

// ============================================================
// Finance Type
// ============================================================

export type FinanceType = 'income' | 'expense';

export const FINANCE_TYPE_LABELS: Record<FinanceType, string> = {
  income: 'Pemasukan',
  expense: 'Pengeluaran',
};
