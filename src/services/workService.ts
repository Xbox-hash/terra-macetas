import { ClientWork } from '../types';
import { API_BASE, apiFetch } from './apiConfig';

const API_URL = `${API_BASE}/works`;

export type SaveClientWork = Omit<ClientWork, 'id' | 'productName' | 'createdAt'>;

async function errorMessage(res: Response, fallback: string): Promise<string> {
  const err = await res.json().catch(() => ({}));
  return err.message || fallback;
}

export const workService = {
  /** Trabajos visibles (en /admin llegan todos). */
  async getAll(params: { onlyFeatured?: boolean; productId?: string } = {}): Promise<ClientWork[]> {
    const qs = new URLSearchParams();
    if (params.onlyFeatured) qs.set('onlyFeatured', 'true');
    if (params.productId) qs.set('productId', params.productId);
    try {
      const res = await apiFetch(`${API_URL}${qs.toString() ? `?${qs}` : ''}`);
      if (!res.ok) throw new Error('Error al obtener trabajos');
      return await res.json();
    } catch (e) {
      console.warn('No se pudieron cargar los trabajos', e);
      return [];
    }
  },

  async create(work: SaveClientWork): Promise<ClientWork> {
    const res = await apiFetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(work),
    });
    if (!res.ok) throw new Error(await errorMessage(res, 'Error al guardar el trabajo'));
    return await res.json();
  },

  async update(id: string, work: SaveClientWork): Promise<ClientWork> {
    const res = await apiFetch(`${API_URL}/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(work),
    });
    if (!res.ok) throw new Error(await errorMessage(res, 'Error al actualizar el trabajo'));
    return await res.json();
  },

  async toggleActive(id: string): Promise<ClientWork> {
    const res = await apiFetch(`${API_URL}/${id}/toggle-active`, { method: 'PATCH' });
    if (!res.ok) throw new Error(await errorMessage(res, 'Error al cambiar la visibilidad'));
    return await res.json();
  },

  async delete(id: string): Promise<void> {
    const res = await apiFetch(`${API_URL}/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error(await errorMessage(res, 'Error al eliminar el trabajo'));
  },
};

/** Texto "para quién" que se muestra en la tienda. */
export function workTitle(w: Pick<ClientWork, 'clientName' | 'showClientName' | 'city'>): { eyebrow: string; title: string } {
  const name = w.showClientName ? w.clientName?.trim() : '';
  if (name) return { eyebrow: w.city ? `Para · ${w.city}` : 'Para', title: name };
  return { eyebrow: 'Trabajo realizado', title: w.city?.trim() || 'Terra en casa' };
}
