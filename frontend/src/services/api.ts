import axios from 'axios';

// Em produção, o frontend é servido pelo backend (mesma origem)
// Em dev, o Vite proxy redireciona /api → localhost:3000
export const api = axios.create({
  baseURL: '/api',
});

// Injeta o token em todas as requisições
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Se receber 401, limpa sessão e redireciona para login
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('access_token');
      localStorage.removeItem('usuario');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  },
);
