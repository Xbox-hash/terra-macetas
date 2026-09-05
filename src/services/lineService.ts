import { ProductLine } from '../types';

const API_BASE_URL = 'http://127.0.0.1:5000/api/lines';

export const lineService = {
  async getAll(): Promise<ProductLine[]> {
    try {
      const res = await fetch(API_BASE_URL);
      if (!res.ok) throw new Error('Error al obtener líneas');
      return await res.json();
    } catch (e) {
      console.warn('Fallo backend, usando fallback local', e);
      return [];
    }
  },

  async getActive(): Promise<ProductLine[]> {
    try {
      const res = await fetch(`${API_BASE_URL}?onlyActive=true`);
      if (!res.ok) throw new Error('Error al obtener líneas activas');
      return await res.json();
    } catch (e) {
      console.warn('Fallo backend, usando fallback local', e);
      return [];
    }
  },

  async getById(id: string): Promise<ProductLine | undefined> {
    try {
      const res = await fetch(`${API_BASE_URL}/${id}`);
      if (!res.ok) return undefined;
      return await res.json();
    } catch {
      return undefined;
    }
  },

  async getBySlug(slug: string): Promise<ProductLine | undefined> {
    const lines = await this.getAll();
    return lines.find((l) => l.slug === slug);
  },

  async create(line: Omit<ProductLine, 'id'>): Promise<ProductLine> {
    const res = await fetch(API_BASE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(line),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || 'Error al crear línea');
    }
    return await res.json();
  },

  async update(id: string, updates: Partial<ProductLine>): Promise<ProductLine> {
    const res = await fetch(`${API_BASE_URL}/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || 'Error al actualizar línea');
    }
    return await res.json();
  },

  async toggleActive(id: string): Promise<ProductLine> {
    const res = await fetch(`${API_BASE_URL}/${id}/toggle-active`, {
      method: 'PATCH',
    });
    if (!res.ok) throw new Error('Error al cambiar estado de la línea');
    return await res.json();
  },

  async delete(id: string): Promise<void> {
    const res = await fetch(`${API_BASE_URL}/${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || 'Error al eliminar línea');
    }
  }
};
