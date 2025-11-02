import axios from 'axios';
import { getAuth } from './api';

// Align with web api.js but for Expo RN
const DEFAULT_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL ||
  (__DEV__ ? 'http://localhost:8000/api' : 'https://api.xn--vi-sant-hya.com/api');

export const apiClient = axios.create({
  baseURL: DEFAULT_BASE_URL,
  headers: {
    Accept: 'application/json',
  },
});

apiClient.interceptors.request.use(
  (config) => {
    const token = getAuth().token;

    const method = (config.method || 'get').toLowerCase();
    const isGet = method === 'get';

    const publicRoutes = ['/users', '/medecins', '/profiles', '/annonces', '/site-stats', '/register', '/check-email', '/check-availability'];
    const url = config.url || '';

    const isOrganizationsPublic = isGet && url.startsWith('/organizations');
    const isOrganizationsRegister = url === '/organizations/register' || url.startsWith('/organizations/register');
    const isPublicRoute =
      isOrganizationsPublic ||
      isOrganizationsRegister ||
      publicRoutes.some((route) => {
        if (route === '/users' || route === '/medecins' || route === '/profiles') {
          return url.startsWith(route);
        }
        if (route === '/register' || route === '/check-email' || route === '/check-availability' || route === '/annonces' || route === '/site-stats') {
          return url.includes(route);
        }
        return false;
      });

    if (token && !isPublicRoute) {
      config.headers = { ...(config.headers || {}), Authorization: `Bearer ${token}` } as any;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Convenience helpers (match web api.js)
export const deleteProfessionalProfile = () => apiClient.delete('/professional/profile');
export const deleteOrganizationProfile = (id: string | number) => apiClient.delete(`/organizations/${encodeURIComponent(String(id))}`);
export const deleteProfileById = (id: string | number) => apiClient.delete(`/profiles/${encodeURIComponent(String(id))}`);
export const deleteSelfAccount = () => apiClient.delete('/user');
