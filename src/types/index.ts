// Product and Catalog Types
export interface ProductLine {
  id: string;
  name: string;
  slug: string;
  description: string;
  image: string;
  active: boolean;
  featured?: boolean;
}

export interface Product {
  id: string;
  lineId: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  images: string[];
  dimensions?: string;
  material?: string;
  finish?: string;
  active: boolean;
  featured?: boolean;
  createdAt: string;
}

// Shopping Cart & Order Architecture
export interface CartItem {
  product: Product;
  quantity: number;
  subtotal: number;
}

export type OrderStatus = 'pending' | 'confirmed' | 'delivered' | 'cancelled';
export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';

export interface Order {
  id: string;
  items: CartItem[];
  total: number;
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
  notes?: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  channel: 'whatsapp' | 'web';
  createdAt: string;
  closedAt?: string;
  closedBy?: string;
  cancelledAt?: string;
  cancelledBy?: string;
  reopenedBy?: string;
}

// Auth & Admin Types
export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'staff' | 'customer' | string;
  avatarUrl?: string;
  permissions?: string[];
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
}

// Global Site & Company Config
export interface StoreConfig {
  storeName: string;
  tagline: string;
  logoUrl?: string;
  currency: string;
  currencySymbol: string;
  whatsappNumber: string; // E.g., "595981234567"
  whatsappDisplay: string;
  email: string;
  instagram: string;
  address: string;
  city: string;
  country: string;
  businessHours: string;
  whatsappGatewayEnabled?: boolean;
  whatsappApiUrl?: string;
  whatsappApiKey?: string;
  whatsappInstanceName?: string;
}
