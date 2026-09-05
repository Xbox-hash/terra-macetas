import { User, AuthState } from '../types';

const AUTH_STORAGE_KEY = 'terra_auth_state';

const MOCK_ADMIN: User = {
  id: 'usr-admin-1',
  name: 'Valeria Mendoza',
  email: 'admin@terra.com',
  role: 'admin',
  avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
};

export const authService = {
  getCurrentState(): AuthState {
    const data = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!data) {
      return { user: null, token: null, isAuthenticated: false };
    }
    try {
      return JSON.parse(data);
    } catch {
      return { user: null, token: null, isAuthenticated: false };
    }
  },

  async login(email: string, password: string, remember = false): Promise<User> {
    await new Promise((r) => setTimeout(r, 600));

    // Acepta credenciales de prueba
    if (email === 'admin@terra.com' && password === 'admin123' || (email.length > 3 && password.length >= 4)) {
      const authState: AuthState = {
        user: { ...MOCK_ADMIN, email },
        token: 'mock_jwt_token_eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        isAuthenticated: true,
      };

      if (remember) {
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(authState));
      } else {
        sessionStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(authState));
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(authState));
      }

      return authState.user!;
    }

    throw new Error('Credenciales inválidas. Usa admin@terra.com / admin123');
  },

  async logout(): Promise<void> {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    sessionStorage.removeItem(AUTH_STORAGE_KEY);
  }
};
