import { create } from 'zustand';
import api from '../services/api';

interface User {
  id: string;
  documentNumber: string;
  fullName: string;
  role: string;
  credits: number;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (documentNumber: string, password: string) => Promise<void>;
  register: (data: { documentNumber: string; password: string; fullName: string; lawFirm?: string }) => Promise<void>;
  logout: () => void;
  loadProfile: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: !!localStorage.getItem('accessToken'),
  isLoading: false,

  login: async (documentNumber, password) => {
    set({ isLoading: true });
    try {
      const res = await api.post('/auth/login', { documentNumber, password });
      localStorage.setItem('accessToken', res.data.accessToken);
      localStorage.setItem('refreshToken', res.data.refreshToken);
      set({ user: res.data.user, isAuthenticated: true, isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  register: async (data) => {
    set({ isLoading: true });
    try {
      const res = await api.post('/auth/register', data);
      localStorage.setItem('accessToken', res.data.accessToken);
      localStorage.setItem('refreshToken', res.data.refreshToken);
      set({ user: res.data.user, isAuthenticated: true, isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  logout: () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    set({ user: null, isAuthenticated: false });
  },

  loadProfile: async () => {
    try {
      const res = await api.get('/auth/me');
      set({ user: res.data });
    } catch {}
  },
}));
