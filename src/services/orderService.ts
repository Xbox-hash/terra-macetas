import { CartItem, Order } from '../types';
import { API_BASE, apiFetch, getAuthToken } from './apiConfig';

const API_BASE_URL = API_BASE;

const VISITOR_ID_KEY = 'terra_visitor_id';
const LAST_VISIT_DAY_KEY = 'terra_last_visit_day';
const STAFF_DEVICE_KEY = 'terra_staff_device';

// Respaldo si el navegador no deja guardar datos: vale solo mientras la pestaña esté abierta.
let memoryVisitorId: string | null = null;

function newVisitorId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
}

/** Fecha de hoy en Paraguay (UTC-3), igual que la usa el backend. */
function todayInParaguay(): string {
  return new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

/**
 * Decide si esta carga cuenta como visita y devuelve el identificador anónimo del navegador.
 * Devuelve null si ya se contó hoy o si es un dispositivo donde se usó el panel de admin.
 */
function visitorIdToRecord(): string | null {
  try {
    // Si en este navegador alguna vez se inició sesión en /admin, sus visitas no cuentan.
    if (getAuthToken()) localStorage.setItem(STAFF_DEVICE_KEY, '1');
    if (localStorage.getItem(STAFF_DEVICE_KEY)) return null;

    let id = localStorage.getItem(VISITOR_ID_KEY);
    if (!id) {
      id = newVisitorId();
      localStorage.setItem(VISITOR_ID_KEY, id);
    }

    const today = todayInParaguay();
    if (localStorage.getItem(LAST_VISIT_DAY_KEY) === today) return null;
    localStorage.setItem(LAST_VISIT_DAY_KEY, today);
    return id;
  } catch {
    if (memoryVisitorId) return null;
    memoryVisitorId = newVisitorId();
    return memoryVisitorId;
  }
}

export interface DashboardStats {
  totalVisits: number;
  visitsToday: number;
  totalOrders: number;
  pendingOrders: number;
  closedOrders: number;
  cancelledOrders?: number;
  totalRevenue: number;
  totalProducts: number;
  totalLines: number;
  recentOrders: Order[];
}

export const orderService = {
  async getAll(status?: string): Promise<Order[]> {
    try {
      const url = status ? `${API_BASE_URL}/orders?status=${status}` : `${API_BASE_URL}/orders`;
      const res = await apiFetch(url);
      if (res.ok) return await res.json();
    } catch (e) {
      console.warn('Fallo petición API orders', e);
    }
    return [];
  },

  async createOrder(payload: {
    customerName?: string;
    customerPhone?: string;
    customerCity?: string;
    notes?: string;
    total: number;
    items: CartItem[];
  }): Promise<Order> {
    const formattedItems = payload.items.map((item) => ({
      productId: item.product.id,
      productName: item.selectedColor ? `${item.product.name} (Color: ${item.selectedColor})` : item.product.name,
      productImage: item.product.images[0] || '',
      price: item.product.price,
      quantity: item.quantity,
      subtotal: item.subtotal,
    }));

    const res = await apiFetch(`${API_BASE_URL}/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customerName: payload.customerName || 'Cliente WhatsApp',
        customerPhone: payload.customerPhone,
        customerCity: payload.customerCity,
        notes: payload.notes,
        total: payload.total,
        items: formattedItems,
        channel: 'WhatsApp',
      }),
    });

    if (!res.ok) throw new Error('Error al registrar pedido');
    return await res.json();
  },

  async closeOrder(orderId: string, userName?: string): Promise<Order> {
    const res = await apiFetch(`${API_BASE_URL}/orders/${orderId}/close`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user: userName || 'Administrador' }),
    });
    if (!res.ok) throw new Error('Error al cerrar pedido');
    return await res.json();
  },

  async reopenOrder(orderId: string, userName?: string): Promise<Order> {
    const res = await apiFetch(`${API_BASE_URL}/orders/${orderId}/reopen`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user: userName || 'Administrador' }),
    });
    if (!res.ok) throw new Error('Error al reabrir pedido');
    return await res.json();
  },

  async cancelOrder(orderId: string, userName?: string): Promise<Order> {
    const res = await apiFetch(`${API_BASE_URL}/orders/${orderId}/cancel`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user: userName || 'Administrador' }),
    });
    if (!res.ok) throw new Error('Error al cancelar pedido');
    return await res.json();
  },

  async deleteOrder(orderId: string): Promise<void> {
    const res = await apiFetch(`${API_BASE_URL}/orders/${orderId}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('Error al eliminar pedido');
  }
};

export const dashboardService = {
  async getStats(): Promise<DashboardStats> {
    try {
      const res = await apiFetch(`${API_BASE_URL}/dashboard/stats`);
      if (res.ok) return await res.json();
    } catch (e) {
      console.warn('Fallo petición stats', e);
    }

    return {
      totalVisits: 0,
      visitsToday: 0,
      totalOrders: 0,
      pendingOrders: 0,
      closedOrders: 0,
      totalRevenue: 0,
      totalProducts: 0,
      totalLines: 0,
      recentOrders: [],
    };
  },

  /** Cuenta a la persona una vez por día, no cada pantalla que abre. */
  async recordVisit(pagePath: string): Promise<void> {
    const visitorId = visitorIdToRecord();
    if (!visitorId) return;

    try {
      const res = await apiFetch(`${API_BASE_URL}/dashboard/record-visit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pagePath, visitorId }),
      });
      if (!res.ok) throw new Error(`record-visit ${res.status}`);
    } catch {
      // Si no se pudo registrar, se reintenta en la próxima pantalla
      try { localStorage.removeItem(LAST_VISIT_DAY_KEY); } catch { /* sin almacenamiento */ }
    }
  }
};
