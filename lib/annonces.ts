import { apiClient } from './apiClient';

export async function listAnnonces(params?: Record<string, any>) {
  const res = await apiClient.get('/annonces', { params });
  return res.data;
}

export async function getAnnonce(id: string | number) {
  const res = await apiClient.get(`/annonces/${encodeURIComponent(String(id))}`);
  return res.data;
}


