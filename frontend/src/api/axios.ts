import axios from 'axios';
import { useAuthStore } from '../store/authStore';

/**
 * Shared axios instance.
 *
 * Base URL falls back to localhost:3000 so the app works out-of-the-box
 * without a .env file during development. In production, set VITE_API_URL.
 */
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:3000',
});

/**
 * Request interceptor — attach JWT and workspace ID to every request.
 *
 * We read state directly from the Zustand store (getState()) rather than
 * calling the hook, because interceptors run outside React component scope.
 */
api.interceptors.request.use(
  (config) => {
    const { token, currentWorkspace } = useAuthStore.getState();

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    if (currentWorkspace) {
      config.headers['x-workspace-id'] = currentWorkspace.id;
    }

    return config;
  },
  (error) => Promise.reject(error),
);

/**
 * Response interceptor — handle 401 globally.
 *
 * If the server returns 401, the stored token is invalid/expired.
 * We clear auth state and redirect to login so the user re-authenticates.
 */
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().logout();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  },
);

export default api;
