import { create } from 'zustand';
import { api } from '../services/api';

interface Usuario {
  id: string;
  email: string;
  perfil: string;
}

interface AuthState {
  usuario: Usuario | null;
  carregando: boolean;
  login: (email: string, senha: string) => Promise<void>;
  logout: () => void;
  carregarSessao: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  usuario: null,
  carregando: true,

  carregarSessao: () => {
    const raw = localStorage.getItem('usuario');
    if (raw) {
      set({ usuario: JSON.parse(raw), carregando: false });
    } else {
      set({ carregando: false });
    }
  },

  login: async (email, senha) => {
    const { data } = await api.post('/auth/login', { email, senha });
    localStorage.setItem('access_token', data.access_token);
    localStorage.setItem('usuario', JSON.stringify(data.usuario));
    set({ usuario: data.usuario });
  },

  logout: () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('usuario');
    set({ usuario: null });
  },
}));
