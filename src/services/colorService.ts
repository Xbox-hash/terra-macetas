import { ProductColor } from '../types';
import { API_BASE, apiFetch } from './apiConfig';
import { DEFAULT_POT_PALETTE } from '../data/potColors';

const API_BASE_URL = `${API_BASE}/colors`;
const STORAGE_KEY = 'terra_pot_colors';

const getLocalColors = (): ProductColor[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw !== null) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Error al leer colores de almacenamiento local', e);
  }
  return [];
};

const saveLocalColors = (colors: ProductColor[]) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(colors));
  } catch (e) {
    console.error('Error al guardar colores en almacenamiento local', e);
  }
};

/** Envía al servidor; si no hay conexión, avisa con un mensaje claro. */
async function send(url: string, init: RequestInit): Promise<Response> {
  try {
    return await apiFetch(url, { ...init, headers: { 'Content-Type': 'application/json', ...(init.headers || {}) } });
  } catch {
    throw new Error('No hay conexión con el servidor. Revisá internet y probá de nuevo; no se guardó nada.');
  }
}

async function errorMessage(res: Response, fallback: string): Promise<string> {
  const body = await res.json().catch(() => null);
  if (body?.message) return body.message;
  // Errores de validación de ASP.NET: { errors: { Campo: ["mensaje"] } }
  const first = body?.errors && Object.values(body.errors as Record<string, string[]>)[0]?.[0];
  return first || `${fallback} (error ${res.status})`;
}

export const colorService = {
  async getAll(): Promise<ProductColor[]> {
    try {
      const res = await apiFetch(API_BASE_URL);
      if (res.ok) {
        const data: ProductColor[] = await res.json();
        if (Array.isArray(data)) {
          saveLocalColors(data);
          return data;
        }
      }
    } catch {
      // Backend no disponible, usar almacenamiento local
    }
    return getLocalColors();
  },

  async getActive(): Promise<ProductColor[]> {
    const all = await this.getAll();
    return all.filter((c) => c.active !== false);
  },

  async getById(id: string): Promise<ProductColor | undefined> {
    const all = await this.getAll();
    return all.find((c) => c.id === id);
  },

  // Para guardar SIEMPRE se usa el servidor: si falla, se avisa con el motivo.
  // (Antes se guardaba solo en este navegador y se mostraba "guardado" aunque el servidor lo hubiera rechazado.)
  async create(colorData: Omit<ProductColor, 'id'>): Promise<ProductColor> {
    const slugId = colorData.name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '') || `color-${Date.now()}`;

    const newColor: ProductColor = {
      ...colorData,
      id: slugId,
      active: colorData.active !== undefined ? colorData.active : true,
      createdAt: new Date().toISOString(),
    };

    const res = await send(API_BASE_URL, { method: 'POST', body: JSON.stringify(newColor) });
    if (!res.ok) throw new Error(await errorMessage(res, 'No se pudo crear el color.'));
    const created: ProductColor = await res.json();
    saveLocalColors([...getLocalColors().filter((c) => c.id !== created.id), created]);
    return created;
  },

  async update(id: string, updates: Partial<ProductColor>): Promise<ProductColor> {
    const res = await send(`${API_BASE_URL}/${id}`, { method: 'PUT', body: JSON.stringify(updates) });
    if (!res.ok) throw new Error(await errorMessage(res, 'No se pudo guardar el color.'));
    const updated: ProductColor = await res.json();
    saveLocalColors(getLocalColors().map((c) => (c.id === id ? updated : c)));
    return updated;
  },

  async delete(id: string): Promise<void> {
    const res = await send(`${API_BASE_URL}/${id}`, { method: 'DELETE' });
    if (!res.ok && res.status !== 404) throw new Error(await errorMessage(res, 'No se pudo eliminar el color.'));
    saveLocalColors(getLocalColors().filter((c) => c.id !== id));
  },

  async resetToDefaults(): Promise<ProductColor[]> {
    try {
      for (const col of DEFAULT_POT_PALETTE) {
        await apiFetch(API_BASE_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(col),
        }).catch(() => {});
      }
    } catch {
      // ignorar si backend falla
    }
    saveLocalColors([...DEFAULT_POT_PALETTE]);
    return [...DEFAULT_POT_PALETTE];
  },
};
