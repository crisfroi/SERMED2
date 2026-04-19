/**
 * @sermed2/shared/services/apiClient.ts
 * Cliente HTTP centralizado (Axios)
 */

import axios, { AxiosInstance, InternalAxiosRequestConfig } from 'axios';

/**
 * Crear instancia de Axios configurada
 */
function createApiClient(): AxiosInstance {
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

  const client = axios.create({
    baseURL: API_BASE_URL,
    timeout: 30000,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  // ========== Request Interceptor ==========
  client.interceptors.request.use((config: InternalAxiosRequestConfig) => {
    // Agregar token JWT si existe
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });

  // ========== Response Interceptor ==========
  client.interceptors.response.use(
    (response) => response,
    (error) => {
      // Auto-logout en 401
      if (error.response?.status === 401) {
        localStorage.removeItem('authToken');
        localStorage.removeItem('authState');
        // Emit logout event
        window.dispatchEvent(new Event('auth-expired'));
      }
      return Promise.reject(error);
    }
  );

  return client;
}

export const apiClient = createApiClient();

/**
 * Métodos de conveniencia
 */
export const api = {
  get: (url: string, config?: any) => apiClient.get(url, config),
  post: (url: string, data?: any, config?: any) => apiClient.post(url, data, config),
  put: (url: string, data?: any, config?: any) => apiClient.put(url, data, config),
  patch: (url: string, data?: any, config?: any) => apiClient.patch(url, data, config),
  delete: (url: string, config?: any) => apiClient.delete(url, config),
};

export default apiClient;
