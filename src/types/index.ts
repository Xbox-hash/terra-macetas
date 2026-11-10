// Product and Catalog Types
export interface ProductLine {
  id: string;
  name: string;
  slug: string;
  description: string;
  image: string;
  active: boolean;
  featured?: boolean;
  productsCount?: number;
}

export interface Product {
  id: string;
  lineId: string;
  lineName?: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  images: string[];
  dimensions?: string;
  material?: string;
  finish?: string;
  manufacturingTime?: string;
  colors?: ProductColor[];
  /** Publicación de Instagram con la foto real de la pieza. */
  instagramUrl?: string;
  /** Hasta 4 fotos de detalle (impermeabilización, patitas, acabado...). */
  detailPhotos?: ProductDetailPhoto[];
  active: boolean;
  featured?: boolean;
  createdAt: string;
}

export interface ProductDetailPhoto {
  image: string;
  caption: string;
}

export interface ProductColor {
  id: string;
  name: string;
  hex: string;
  image?: string;
  swatchImage?: string;
  description?: string;
  active?: boolean;
  createdAt?: string;
}

// Shopping Cart & Order Architecture
export interface CartItem {
  product: Product;
  quantity: number;
  subtotal: number;
  selectedColor?: string;
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
  customerCity?: string;
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
  whatsAppNotified?: boolean;
  whatsAppStatus?: 'Pendiente' | 'Enviado' | 'Entregado' | 'Leído' | string;
  whatsAppDeliveredAt?: string;
  whatsAppReadAt?: string;
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
  /** Solo de escritura: el servidor nunca la devuelve. */
  whatsappApiKey?: string;
  /** true si ya hay una API key guardada en el servidor. */
  whatsappApiKeyConfigured?: boolean;
  whatsappInstanceName?: string;
  heroImageUrl?: string;
  /** Fotos del carrusel de la portada. Vacío = se usa heroImageUrl. */
  heroImages?: string[];
  heroFloatingImageUrl?: string;
  philosophyImageUrl?: string;
}
