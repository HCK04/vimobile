import { apiClient } from './apiClient';

export async function getDoctorStats() {
  const res = await apiClient.get('/doctor/stats');
  return res.data as {
    appointmentsUpcoming: number;
    totalPatients: number;
    totalAppointments: number;
    revenue: number;
  };
}

export async function listDoctorAppointments() {
  const res = await apiClient.get('/doctor/appointments');
  return res.data;
}

export async function getDoctorAppointment(id: string | number) {
  const res = await apiClient.get(`/doctor/appointments/${encodeURIComponent(String(id))}`);
  return res.data;
}

export async function updateDoctorAppointmentStatus(id: string | number, status: 'confirmed' | 'cancelled' | 'pending' | 'completed' | 'missed') {
  const res = await apiClient.put(`/doctor/appointments/${encodeURIComponent(String(id))}/status`, { status });
  return res.data;
}

export async function toggleProfessionalAvailability() {
  const res = await apiClient.post('/professional/profile/toggle-availability');
  return res.data;
}


