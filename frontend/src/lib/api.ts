import axios, { AxiosError } from 'axios';
import { useAuthStore } from '@/stores/auth.store';

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000',
  timeout: 15000,
});

// Injecter automatiquement le Bearer token
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Auto-refresh du token sur 401
let isRefreshing = false;
let failedQueue: Array<{ resolve: (v: any) => void; reject: (e: any) => void }> = [];

const processQueue = (error: any, token: string | null) => {
  failedQueue.forEach((p) => (error ? p.reject(error) : p.resolve(token)));
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as any;
    if (error.response?.status === 401 && !original._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          original.headers.Authorization = `Bearer ${token}`;
          return api(original);
        });
      }

      original._retry = true;
      isRefreshing = true;

      try {
        await useAuthStore.getState().refreshTokens();
        const newToken = useAuthStore.getState().accessToken;
        processQueue(null, newToken);
        original.headers.Authorization = `Bearer ${newToken}`;
        return api(original);
      } catch (err) {
        processQueue(err, null);
        useAuthStore.getState().logout();
        window.location.href = '/login';
        return Promise.reject(err);
      } finally {
        isRefreshing = false;
      }
    }
    return Promise.reject(error);
  }
);

// Hooks TanStack Query helpers
export const productsApi = {
  getAll: (params?: Record<string, any>) => api.get('/api/products', { params }).then(r => r.data),
  getById: (id: string) => api.get(`/api/products/${id}`).then(r => r.data),
  create: (data: any) => api.post('/api/products', data).then(r => r.data),
  update: (id: string, data: any) => api.patch(`/api/products/${id}`, data).then(r => r.data),
  delete: (id: string) => api.delete(`/api/products/${id}`).then(r => r.data),
  getLowStock: () => api.get('/api/products/alerts/low-stock').then(r => r.data),
  getDashboard: () => api.get('/api/products/stats/dashboard').then(r => r.data),
};

export const salesApi = {
  getAll: (params?: Record<string, any>) => api.get('/api/sales', { params }).then(r => r.data),
  create: (data: any) => api.post('/api/sales', data).then(r => r.data),
  cancel: (id: string) => api.patch(`/api/sales/${id}/cancel`).then(r => r.data),
  getStats: (days?: number) => api.get('/api/sales/stats', { params: { days } }).then(r => r.data),
};

export const aiApi = {
  getForecasts: () => api.get('/api/ai/forecasts').then(r => r.data),
  getRecommendations: () => api.get('/api/ai/recommendations').then(r => r.data),
  getTrends: () => api.get('/api/ai/trends').then(r => r.data),
  getAnomalies: () => api.get('/api/ai/anomalies').then(r => r.data),
};

export const notificationsApi = {
  getAll: () => api.get('/api/notifications').then(r => r.data),
  markRead: (id: string) => api.patch(`/api/notifications/${id}/read`).then(r => r.data),
  markAllRead: () => api.patch('/api/notifications/read-all').then(r => r.data),
};
