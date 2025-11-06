import { apiClient } from './apiClient';

export async function searchUsers(params?: Record<string, any>) {
  const res = await apiClient.get('/users', { params });
  return res.data;
}

export async function listDoctors(params?: Record<string, any>) {
  const res = await apiClient.get('/medecins', { params });
  return res.data;
}

export async function getDoctorById(id: string | number) {
  const res = await apiClient.get(`/medecins/${encodeURIComponent(String(id))}`);
  return res.data;
}

export async function getProfileBySlug(slug: string) {
  const res = await apiClient.get(`/profiles/slug/${encodeURIComponent(slug)}`);
  return res.data;
}


