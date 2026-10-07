import { ProductColor } from '../types';
import { API_BASE } from './apiConfig';
import { DEFAULT_POT_PALETTE } from '../data/potColors';

const API_BASE_URL = `${API_BASE}/colors`;
const STORAGE_KEY = 'terra_pot_colors';

const getLocalColors = (): ProductColor[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Error al leer colores de almacenamiento local', e);
  }
  // Semilla inicial
  localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_POT_PALETTE));
  return [...DEFAULT_POT_PALETTE];
};

const saveLocalColors = (colors: ProductColor[]) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(colors));
  } catch (e) {
    console.error('Error al guardar colores en almacenamiento local', e);
  }
};

export const colorService = {
  async getAll(): Promise<ProductColor[]> {
    try {
      const res = await fetch(API_BASE_URL);
      if (res.ok) {
        const data: ProductColor[] = await res.json();
        if (Array.isArray(data) && data.length > 0) {
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

  async create(colorData: Omit<ProductColor, 'id'>): Promise<ProductColor> {
    const slugId = colorData.name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '') || `color-${Date.now()}`;

    const newColor: ProductColor = {
      ...colorData,
      id: slugId,
      active: colorData.active !== undefined ? colorData.active : true,
      createdAt: new Date().toISOString(),
    };

    try {
      const res = await fetch(API_BASE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newColor),
      });
      if (res.ok) {
        const created: ProductColor = await res.json();
        const current = getLocalColors();
        saveLocalColors([...current.filter((c) => c.id !== created.id), created]);
        return created;
      }
    } catch {
      // fallback local
    }

    const current = getLocalColors();
    // evitar duplicados de id
    const existingIndex = current.findIndex((c) => c.id === newColor.id);
    if (existingIndex >= 0) {
      newColor.id = `${newColor.id}-${Date.now().toString().slice(-4)}`;
    }
    const updated = [...current, newColor];
    saveLocalColors(updated);
    return newColor;
  },

  async update(id: string, updates: Partial<ProductColor>): Promise<ProductColor> {
    try {
      const res = await fetch(`${API_BASE_URL}/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      if (res.ok) {
        const updated: ProductColor = await res.json();
        const current = getLocalColors();
        saveLocalColors(current.map((c) => (c.id === id ? updated : c)));
        return updated;
      }
    } catch {
      // fallback local
    }

    const current = getLocalColors();
    const index = current.findIndex((c) => c.id === id);
    if (index === -1) {
      throw new Error(`Color con ID ${id} no encontrado.`);
    }

    const updatedColor: ProductColor = {
      ...current[index],
      ...updates,
    };

    current[index] = updatedColor;
    saveLocalColors(current);
    return updatedColor;
  },

  async delete(id: string): Promise<void> {
    try {
      const res = await fetch(`${API_BASE_URL}/${id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        const current = getLocalColors();
        saveLocalColors(current.filter((c) => c.id !== id));
        return;
      }
    } catch {
      // fallback local
    }

    const current = getLocalColors();
    saveLocalColors(current.filter((c) => c.id !== id));
  },

  async resetToDefaults(): Promise<ProductColor[]> {
    saveLocalColors([...DEFAULT_POT_PALETTE]);
    return [...DEFAULT_POT_PALETTE];
  },
};
