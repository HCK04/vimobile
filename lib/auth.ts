// Auth state management - separate from API to avoid circular imports
import * as SecureStore from 'expo-secure-store';
import { apiClient } from './apiClient';

let authToken: string | null = null;
let authUser: any | null = null;

const TOKEN_KEY = 'auth_token';
const USER_KEY = 'auth_user';

export function getAuth() {
  return { token: authToken, user: authUser };
}

export async function setAuth(token: string | null, user?: any) {
  authToken = token;
  if (user !== undefined) authUser = user;

  if (token) {
    await SecureStore.setItemAsync(TOKEN_KEY, token);
  } else {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
  }

  if (user !== undefined) {
    try {
      await SecureStore.setItemAsync(USER_KEY, JSON.stringify(user ?? null));
    } catch {
      // ignore JSON/store failures
    }
  }
}

export async function loadAuthFromStorage() {
  try {
    const [storedToken, storedUser] = await Promise.all([
      SecureStore.getItemAsync(TOKEN_KEY),
      SecureStore.getItemAsync(USER_KEY),
    ]);
    authToken = storedToken ?? null;
    if (storedUser) {
      try {
        authUser = JSON.parse(storedUser);
      } catch {
        authUser = null;
      }
    } else {
      authUser = null;
    }
  } catch {
    authToken = null;
    authUser = null;
  }
  return { token: authToken, user: authUser };
}

export async function clearAuth() {
  authToken = null;
  authUser = null;
  await Promise.all([
    SecureStore.deleteItemAsync(TOKEN_KEY),
    SecureStore.deleteItemAsync(USER_KEY),
  ]);
}

// Convenience API helpers for login/logout/user
export async function login(email: string, password: string) {
  const res = await apiClient.post('/login', { email, password });
  const data = res.data as any;
  const token = data?.token ?? null;
  const user = data?.user ?? null;
  await setAuth(token, user);
  return { token, user };
}

export async function loadUser() {
  const res = await apiClient.get('/user');
  const user = res.data;
  await setAuth(getAuth().token, user);
  return user;
}
