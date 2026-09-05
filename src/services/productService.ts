import { Product } from '../types';

const API_BASE_URL = 'http://127.0.0.1:5000/api/products';

export const productService = {
  async getAll(): Promise<Product[]> {
    try {
      const res = await fetch(API_BASE_URL);
      if (!res.ok) throw new Error('Error al obtener productos');
      return await res.json();
    } catch (e) {
      console.warn('Fallo backend, usando fallback local', e);
      return [];
    }
  },

  async getActive(): Promise<Product[]> {
    try {
      const res = await fetch(`${API_BASE_URL}?onlyActive=true`);
      if (!res.ok) throw new Error('Error al obtener productos activos');
      return await res.json();
    } catch (e) {
      console.warn('Fallo backend, usando fallback local', e);
      return [];
    }
  },

  async getFeatured(): Promise<Product[]> {
    try {
      const res = await fetch(`${API_BASE_URL}?onlyActive=true&onlyFeatured=true`);
      if (!res.ok) throw new Error('Error al obtener productos destacados');
      return await res.json();
    } catch (e) {
      console.warn('Fallo backend, usando fallback local', e);
      return [];
    }
  },

  async getById(id: string): Promise<Product | undefined> {
    try {
      const res = await fetch(`${API_BASE_URL}/${id}`);
      if (!res.ok) return undefined;
      return await res.json();
    } catch {
      return undefined;
    }
  },

  async getByLine(lineId: string): Promise<Product[]> {
    try {
      const res = await fetch(`${API_BASE_URL}?lineId=${lineId}&onlyActive=true`);
      if (!res.ok) return [];
      return await res.json();
    } catch {
      return [];
    }
  },

  async getRelated(lineId: string, currentProductId: string, limit = 4): Promise<Product[]> {
    try {
      const res = await fetch(`${API_BASE_URL}/related/${lineId}?excludeId=${currentProductId}&limit=${limit}`);
      if (!res.ok) return [];
      return await res.json();
    } catch {
      return [];
    }
  },

  async create(product: Omit<Product, 'id' | 'createdAt'>): Promise<Product> {
    const res = await fetch(API_BASE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(product),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || 'Error al crear producto');
    }
    return await res.json();
  },

  async update(id: string, updates: Partial<Product>): Promise<Product> {
    const res = await fetch(`${API_BASE_URL}/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || 'Error al actualizar producto');
    }
    return await res.json();
  },

  async toggleActive(id: string): Promise<Product> {
    const res = await fetch(`${API_BASE_URL}/${id}/toggle-active`, {
      method: 'PATCH',
    });
    if (!res.ok) throw new Error('Error al cambiar estado del producto');
    return await res.json();
  },

  async delete(id: string): Promise<void> {
    const res = await fetch(`${API_BASE_URL}/${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || 'Error al eliminar producto');
    }
  }
};
