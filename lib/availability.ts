import { apiClient } from './apiClient';

export async function getAvailableHours(doctorId: string | number, date?: string) {
  const res = await apiClient.get(`/doctors/${encodeURIComponent(String(doctorId))}/available-hours`, {
    params: date ? { date } : undefined,
  });
  return res.data as Array<{ time: string; available: boolean; booked: boolean; past: boolean }>;
}

export async function getBookedSlots(doctorId: string | number, date?: string) {
  const res = await apiClient.get(`/appointments/booked-slots/${encodeURIComponent(String(doctorId))}`, {
    params: date ? { date } : undefined,
  });
  return res.data;
}


