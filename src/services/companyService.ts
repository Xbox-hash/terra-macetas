import { StoreConfig } from '../types';
import { INITIAL_STORE_CONFIG } from '../data/initialConfig';

const API_BASE_URL = 'http://127.0.0.1:5000/api/company';
const LOCAL_STORAGE_KEY = 'terra_company_config';

export const companyService = {
  async getConfig(): Promise<StoreConfig> {
    try {
      const res = await fetch(API_BASE_URL);
      if (res.ok) {
        const data = await res.json();
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data));
        return data;
      }
    } catch (e) {
      console.warn('Fallo petición API company, usando fallback local', e);
    }

    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return INITIAL_STORE_CONFIG;
      }
    }
    return INITIAL_STORE_CONFIG;
  },

  async updateConfig(config: StoreConfig): Promise<StoreConfig> {
    try {
      const res = await fetch(API_BASE_URL, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });
      if (!res.ok) {
        throw new Error('Error al guardar en el servidor');
      }
      const data = await res.json();
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data));
      return data;
    } catch (e) {
      // Fallback local
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(config));
      return config;
    }
  }
};
