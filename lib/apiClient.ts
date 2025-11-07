import axios from 'axios';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { getAuth, clearAuth } from './auth';

// Resolve base URL for Expo dev (device/emulator) and prod
function resolveDevBaseUrl(): string | undefined {
  if (!__DEV__) return undefined;
  if (process.env.EXPO_PUBLIC_API_URL) return process.env.EXPO_PUBLIC_API_URL;

  // Try to infer LAN IP from Expo hostUri (e.g., 192.168.x.x:8081)
  const anyConstants: any = Constants as any;
  const hostUri: string | undefined =
    anyConstants?.expoConfig?.hostUri ||
    anyConstants?.manifest2?.extra?.expoClient?.hostUri ||
    anyConstants?.manifest?.hostUri ||
    anyConstants?.manifest?.debuggerHost;

  let host = hostUri ? String(hostUri).split(':')[0] : 'localhost';

  // Android emulator special case
  if (Platform.OS === 'android') {
    if (host === 'localhost' || host === '127.0.0.1') host = '10.0.2.2';
  }

  return `http://${host}:8000/api`;
}

const DEFAULT_BASE_URL = resolveDevBaseUrl() || 'https://api.xn--vi-sant-hya.com/api';

// Debug logging in development
if (__DEV__) {
  console.log('[API Client] Base URL:', DEFAULT_BASE_URL);
  console.log('[API Client] Platform:', Platform.OS);
}

export const apiClient = axios.create({
  baseURL: DEFAULT_BASE_URL,
  headers: {
    Accept: 'application/json',
    'X-Client-Type': 'mobile',
  },
  timeout: 30000, // 30 second timeout
});

apiClient.interceptors.request.use(
  (config) => {
    const token = getAuth().token;

    const method = (config.method || 'get').toLowerCase();
    const isGet = method === 'get';

    const publicRoutes = ['/users', '/medecins', '/profiles', '/site-stats', '/register', '/check-email', '/check-availability'];
    const url = config.url || '';

    // Public endpoints logic
    const isOrganizationsPublic = isGet && url.startsWith('/organizations');
    const isOrganizationsRegister = url === '/organizations/register' || url.startsWith('/organizations/register');

    // Only root /annonces (public listing) and /annonces/{id} are public, and only for GET.
    // Do NOT treat /doctor/annonces as public.
    const isPublicAnnonces = isGet && url.startsWith('/annonces') && !url.startsWith('/doctor/annonces');

    const isPublicBasic = publicRoutes.some((route) => {
      if (route === '/users' || route === '/medecins' || route === '/profiles') {
        return isGet && url.startsWith(route);
      }
      if (route === '/register' || route === '/check-email' || route === '/check-availability') {
        return url.startsWith(route);
      }
      if (route === '/site-stats') {
        return url.startsWith('/site-stats');
      }
      return false;
    });

    const isPublicRoute = isOrganizationsPublic || isOrganizationsRegister || isPublicAnnonces || isPublicBasic;

    if (token && !isPublicRoute) {
      config.headers = { ...(config.headers || {}), Authorization: `Bearer ${token}` } as any;
    }

    // Debug logging in development
    if (__DEV__) {
      console.log(`[API Request] ${method.toUpperCase()} ${config.baseURL}${url}`);
    }

    return config;
  },
  (error) => {
    if (__DEV__) {
      console.error('[API Request Error]', error.message);
    }
    return Promise.reject(error);
  }
);

apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    const status = error?.response?.status;
    if (status === 401) {
      // Clear local auth on unauthorized
      try {
        clearAuth();
      } catch {}
    }
    return Promise.reject(error);
  }
);

// Convenience helpers (match web api.js)
export const deleteProfessionalProfile = () => apiClient.delete('/professional/profile');
export const deleteOrganizationProfile = (id: string | number) => apiClient.delete(`/organizations/${encodeURIComponent(String(id))}`);
export const deleteProfileById = (id: string | number) => apiClient.delete(`/profiles/${encodeURIComponent(String(id))}`);
export const deleteSelfAccount = () => apiClient.delete('/user');
