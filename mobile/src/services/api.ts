import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BASE_URL = 'https://applications-vapt-api.tbs25p.easypanel.host/api';

export const api = axios.create({ baseURL: BASE_URL, timeout: 15000 });

api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('access_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Controle para evitar loop de refresh
let renovando = false;
let filaEspera: Array<(token: string) => void> = [];

api.interceptors.response.use(
  (r) => r,
  async (error) => {
    const original = error.config;

    if (error.response?.status !== 401 || original._renovado) {
      return Promise.reject(error);
    }

    if (renovando) {
      return new Promise((resolve) => {
        filaEspera.push((novoToken) => {
          original.headers.Authorization = `Bearer ${novoToken}`;
          resolve(api(original));
        });
      });
    }

    original._renovado = true;
    renovando = true;

    try {
      const refreshToken = await AsyncStorage.getItem('refresh_token');
      if (!refreshToken) throw new Error('Sem refresh token');

      const { data } = await axios.post(`${BASE_URL}/auth/refresh`, {
        refresh_token: refreshToken,
      });

      await AsyncStorage.multiSet([
        ['access_token', data.access_token],
        ['refresh_token', data.refresh_token],
      ]);

      filaEspera.forEach((cb) => cb(data.access_token));
      filaEspera = [];

      original.headers.Authorization = `Bearer ${data.access_token}`;
      return api(original);
    } catch {
      // Refresh falhou — sessão expirou após 30 dias
      await AsyncStorage.multiRemove(['access_token', 'refresh_token', 'usuario']);
      filaEspera = [];
      return Promise.reject(error);
    } finally {
      renovando = false;
    }
  },
);
