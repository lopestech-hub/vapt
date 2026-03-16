import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from '../services/api';

interface Usuario { id: string; nome: string; email: string; perfil: string; motoboy_id: string | null; }

interface AuthStore {
  usuario: Usuario | null;
  carregando: boolean;
  login: (email: string, senha: string) => Promise<void>;
  logout: () => Promise<void>;
  carregarSessao: () => Promise<void>;
}

export const useAuthStore = create<AuthStore>((set) => ({
  usuario: null,
  carregando: true,

  login: async (email, senha) => {
    const { data } = await api.post('/auth/login', { email, senha });
    await AsyncStorage.multiSet([
      ['access_token', data.access_token],
      ['refresh_token', data.refresh_token],
      ['usuario', JSON.stringify(data.usuario)],
    ]);
    set({ usuario: data.usuario });
  },

  logout: async () => {
    try { await api.post('/auth/logout'); } catch {}
    await AsyncStorage.multiRemove(['access_token', 'refresh_token', 'usuario']);
    set({ usuario: null });
  },

  carregarSessao: async () => {
    try {
      const json = await AsyncStorage.getItem('usuario');
      if (json) set({ usuario: JSON.parse(json) });
    } finally {
      set({ carregando: false });
    }
  },
}));
