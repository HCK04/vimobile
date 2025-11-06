import { apiClient } from './apiClient';

export interface CreateAppointmentPayload {
  target_user_id: number | string;
  target_role: string;
  date_time: string;
  reason: string;
  patient_name?: string;
  patient_phone?: string;
  patient_email?: string;
  announcement_id?: string | number;
}

export async function createAppointment(payload: CreateAppointmentPayload) {
  const res = await apiClient.post('/patient/appointments', payload);
  return res.data;
}

export async function listAppointments() {
  const res = await apiClient.get('/appointments');
  return res.data;
}

export async function getAppointment(id: string | number) {
  const res = await apiClient.get(`/appointments/${encodeURIComponent(String(id))}`);
  return res.data;
}

export async function updateAppointment(id: string | number, payload: { date?: string; time?: string; reason?: string }) {
  const res = await apiClient.put(`/appointments/${encodeURIComponent(String(id))}`, payload);
  return res.data;
}

export async function cancelAppointment(id: string | number) {
  const res = await apiClient.post(`/appointments/${encodeURIComponent(String(id))}/cancel`);
  return res.data;
}

export async function deleteAppointment(id: string | number) {
  const res = await apiClient.delete(`/appointments/${encodeURIComponent(String(id))}`);
  return res.data;
}


