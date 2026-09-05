import { User, AuthState } from '../types';

const API_BASE_URL = 'http://127.0.0.1:5000/api/auth';
const AUTH_STORAGE_KEY = 'terra_auth_state';

export interface CreateUserData {
  name: string;
  email: string;
  password: string;
  role?: string;
  avatarUrl?: string;
}

export interface UpdateUserData {
  name: string;
  email: string;
  newPassword?: string;
  role?: string;
  avatarUrl?: string;
  active: boolean;
}

export const authService = {
  getCurrentState(): AuthState {
    const data = localStorage.getItem(AUTH_STORAGE_KEY) || sessionStorage.getItem(AUTH_STORAGE_KEY);
    if (!data) return { user: null, token: null, isAuthenticated: false };
    try {
      return JSON.parse(data);
    } catch {
      return { user: null, token: null, isAuthenticated: false };
    }
  },

  async login(email: string, password: string, remember = false): Promise<User> {
    try {
      const res = await fetch(`${API_BASE_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Credenciales incorrectas');
      }

      const user: User = await res.json();
      const state: AuthState = {
        user,
        token: 'session_token_' + user.id,
        isAuthenticated: true,
      };

      if (remember) {
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(state));
      } else {
        sessionStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(state));
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(state));
      }

      return user;
    } catch (e: any) {
      throw new Error(e.message || 'Error al iniciar sesión');
    }
  },

  async getUsers(): Promise<User[]> {
    try {
      const res = await fetch(`${API_BASE_URL}/users`);
      if (res.ok) return await res.json();
    } catch (e) {
      console.warn('Fallo al obtener usuarios', e);
    }
    return [];
  },

  async createUser(data: CreateUserData): Promise<User> {
    const res = await fetch(`${API_BASE_URL}/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || 'Error al crear usuario');
    }
    return await res.json();
  },

  async updateUser(id: string, data: UpdateUserData): Promise<User> {
    const res = await fetch(`${API_BASE_URL}/users/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || 'Error al actualizar usuario');
    }
    return await res.json();
  },

  async deleteUser(id: string): Promise<void> {
    const res = await fetch(`${API_BASE_URL}/users/${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || 'Error al eliminar usuario');
    }
  },

  async logout(): Promise<void> {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    sessionStorage.removeItem(AUTH_STORAGE_KEY);
  }
};
