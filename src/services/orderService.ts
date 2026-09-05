import { CartItem, Order } from '../types';

const API_BASE_URL = 'http://127.0.0.1:5000/api';

export interface DashboardStats {
  totalVisits: number;
  visitsToday: number;
  totalOrders: number;
  pendingOrders: number;
  closedOrders: number;
  totalRevenue: number;
  totalProducts: number;
  totalLines: number;
  recentOrders: Order[];
}

export const orderService = {
  async getAll(status?: string): Promise<Order[]> {
    try {
      const url = status ? `${API_BASE_URL}/orders?status=${status}` : `${API_BASE_URL}/orders`;
      const res = await fetch(url);
      if (res.ok) return await res.json();
    } catch (e) {
      console.warn('Fallo petición API orders', e);
    }
    return [];
  },

  async createOrder(payload: {
    customerName?: string;
    customerPhone?: string;
    notes?: string;
    total: number;
    items: CartItem[];
  }): Promise<Order> {
    const formattedItems = payload.items.map((item) => ({
      productId: item.product.id,
      productName: item.product.name,
      productImage: item.product.images[0] || '',
      price: item.product.price,
      quantity: item.quantity,
      subtotal: item.subtotal,
    }));

    const res = await fetch(`${API_BASE_URL}/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customerName: payload.customerName || 'Cliente WhatsApp',
        customerPhone: payload.customerPhone,
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
    const res = await fetch(`${API_BASE_URL}/orders/${orderId}/close`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user: userName || 'Administrador' }),
    });
    if (!res.ok) throw new Error('Error al cerrar pedido');
    return await res.json();
  },

  async reopenOrder(orderId: string, userName?: string): Promise<Order> {
    const res = await fetch(`${API_BASE_URL}/orders/${orderId}/reopen`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user: userName || 'Administrador' }),
    });
    if (!res.ok) throw new Error('Error al reabrir pedido');
    return await res.json();
  },

  async cancelOrder(orderId: string, userName?: string): Promise<Order> {
    const res = await fetch(`${API_BASE_URL}/orders/${orderId}/cancel`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user: userName || 'Administrador' }),
    });
    if (!res.ok) throw new Error('Error al cancelar pedido');
    return await res.json();
  },

  async deleteOrder(orderId: string): Promise<void> {
    const res = await fetch(`${API_BASE_URL}/orders/${orderId}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('Error al eliminar pedido');
  }
};

export const dashboardService = {
  async getStats(): Promise<DashboardStats> {
    try {
      const res = await fetch(`${API_BASE_URL}/dashboard/stats`);
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

  async recordVisit(pagePath: string): Promise<void> {
    try {
      await fetch(`${API_BASE_URL}/dashboard/record-visit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pagePath }),
      });
    } catch {
      // Silently ignore tracking errors
    }
  }
};
