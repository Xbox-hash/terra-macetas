// Proxy inverso a través del servidor Vite:
// Al usar la ruta relativa '/api', cualquier petición del frontend pasa por el servidor local de Vite
// y se reenvía internamente al Backend en el puerto 5000.
// Esto garantiza funcionamiento perfecto en:
// 1. Localhost
// 2. Wi-Fi Local (192.168.x.x)
// 3. Túnel de VS Code (https://...devtunnels.ms) sin errores de SSL ni de CORS.
export const API_BASE = '/api';

export const AUTH_STORAGE_KEY = 'terra_auth_state';

/** Token JWT de la sesión de /admin (null si no hay sesión). */
export function getAuthToken(): string | null {
  try {
    const raw = sessionStorage.getItem(AUTH_STORAGE_KEY);
    return raw ? JSON.parse(raw).token ?? null : null;
  } catch {
    return null;
  }
}

/**
 * Igual que fetch(), pero agrega el header Authorization cuando hay sesión de /admin.
 * Si el backend responde 401 (token vencido o inválido), cierra la sesión y vuelve al login.
 * Las páginas públicas de la tienda no tienen token, así que funcionan igual que antes.
 */
export async function apiFetch(input: RequestInfo | URL, init: RequestInit = {}): Promise<Response> {
  const token = getAuthToken();
  const headers = new Headers(init.headers);
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const res = await fetch(input, { ...init, headers });

  if (res.status === 401 && token) {
    sessionStorage.removeItem(AUTH_STORAGE_KEY);
    const path = window.location.pathname;
    if (path.startsWith('/admin') && !path.startsWith('/admin/login')) {
      window.location.assign('/admin/login');
    }
  }

  return res;
}
