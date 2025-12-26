// Lightweight API helper for React Native (Expo) to mirror web Auth endpoints.
// Uses the same axios client config as the web app via apiClient (defaults + interceptors).
import { apiClient } from './apiClient';
import { setAuth, getAuth } from './auth';

// Re-export for backward compatibility
export { setAuth, getAuth };

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  headers?: Record<string, string>;
  body?: any; // JSON or FormData
};

async function request(path: string, options: RequestOptions = {}) {
  const method = (options.method || 'GET').toLowerCase() as any;
  try {
    const res = await apiClient.request({
      url: path,
      method,
      headers: options.headers,
      data: options.body,
    });
    return res.data;
  } catch (err: any) {
    const data = err?.response?.data;
    const status = err?.response?.status;
    const url = err?.config?.url || err?.response?.config?.url;
    // eslint-disable-next-line no-console
    console.error('[API Request Error]', {
      message: err?.message,
      status,
      data,
      url,
    });
    const wrapped: any = new Error((data && (data.message || data.error)) || err.message || 'Request error');
    wrapped.response = err?.response;
    throw wrapped;
  }
}

export const api = {
  login: async ({ email, password }: { email: string; password: string }) => {
    const data = await request('/login', {
      method: 'POST',
      body: { email, password },
    });
    setAuth(data.token, data.user);
    return data;
  },

  checkAvailability: async ({ email, phone }: { email: string; phone: string }) => {
    return request('/check-availability', {
      method: 'POST',
      body: { email, phone },
    });
  },

  registerPatient: async (payload: {
    name: string;
    email: string;
    password: string;
    password_confirmation?: string;
    phone: string;
    age?: string | number;
    gender?: string;
    blood_type?: string;
    allergies?: string[];
    chronic_diseases?: string[];
    role_id?: number;
  }) => {
    // Send JSON for patient registration (more reliable across platforms)
    const body = {
      name: payload.name,
      email: payload.email,
      password: payload.password,
      password_confirmation: payload.password_confirmation || payload.password,
      phone: payload.phone,
      role_id: payload.role_id ?? 1,
      ...(payload.age !== undefined ? { age: payload.age } : {}),
      ...(payload.gender ? { gender: String(payload.gender).toLowerCase() } : {}),
      ...(payload.blood_type ? { blood_type: payload.blood_type } : {}),
      allergies: payload.allergies || [],
      chronic_diseases: payload.chronic_diseases || [],
    };

    const data = await request('/register', {
      method: 'POST',
      headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
      body,
    });
    setAuth(data.token, data.user);
    return data;
  },

  registerProfessional: async (payload: {
    // common account
    name: string;
    email: string;
    password: string;
    password_confirmation?: string;
    phone: string;
    role_id: number; // medecin, kine, orthophoniste, psychologue role id
    // pro-specific
    specialty?: string[];
    other_specialty?: string;
    experience_years?: string | number;
    horaire_start?: string;
    horaire_end?: string;
    presentation?: string;
    adresse?: string;
    ville?: string;
    numero_carte_professionnelle?: string;
    // cv
    diplomes?: string[];
    experiences?: string[];
    // optional file
    carte_professionnelle_file?: any | null;
    // new profile fields
    org_presentation?: string;
    services_description?: string;
    additional_info?: string;
    moyens_paiement?: string[];
    moyens_transport?: string[];
    informations_pratiques?: string;
    jours_disponibles?: string[];
    contact_urgence?: string;
    rdv_patients_suivis_uniquement?: boolean;
  }) => {
    // Use JSON instead of FormData to avoid network issues on React Native
    // specialty with "Autres"
    let specialties = Array.isArray(payload.specialty) ? [...payload.specialty] : [];
    if (specialties.includes('Autres') && payload.other_specialty) {
      specialties = specialties.filter((s) => s !== 'Autres');
      specialties.push(payload.other_specialty);
    }

    const body = {
      name: payload.name,
      email: payload.email,
      password: payload.password,
      password_confirmation: payload.password_confirmation || payload.password,
      phone: payload.phone,
      role_id: payload.role_id,
      ...(specialties.length > 0 ? { specialty: specialties } : {}),
      ...(payload.experience_years !== undefined ? { experience_years: payload.experience_years } : {}),
      ...(payload.horaire_start ? { horaire_start: payload.horaire_start } : {}),
      ...(payload.horaire_end ? { horaire_end: payload.horaire_end } : {}),
      ...(payload.presentation ? { presentation: payload.presentation } : {}),
      ...(payload.adresse ? { adresse: payload.adresse } : {}),
      ...(payload.ville ? { ville: payload.ville } : {}),
      ...(payload.numero_carte_professionnelle ? { numero_carte_professionnelle: payload.numero_carte_professionnelle } : {}),
      diplomes: Array.isArray(payload.diplomes) ? payload.diplomes : [],
      experiences: Array.isArray(payload.experiences) ? payload.experiences : [],
      ...(payload.org_presentation ? { org_presentation: payload.org_presentation } : {}),
      ...(payload.services_description ? { services_description: payload.services_description } : {}),
      ...(payload.additional_info ? { additional_info: payload.additional_info } : {}),
      ...(payload.informations_pratiques ? { informations_pratiques: payload.informations_pratiques } : {}),
      ...(payload.contact_urgence ? { contact_urgence: payload.contact_urgence } : {}),
      ...(payload.rdv_patients_suivis_uniquement !== undefined ? { rdv_patients_suivis_uniquement: payload.rdv_patients_suivis_uniquement } : {}),
      moyens_paiement: payload.moyens_paiement || [],
      moyens_transport: payload.moyens_transport || [],
      jours_disponibles: payload.jours_disponibles || [],
    };

    const data = await request('/register', {
      method: 'POST',
      headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
      body,
    });
    setAuth(data.token, data.user);
    return data;
  },

  registerOrganization: async (payload: {
    // account
    name?: string;
    email: string;
    password: string;
    password_confirmation?: string;
    phone: string;
    role_id: number; // organization role id
    // org specific
    nom_etablissement?: string;
    responsable_name?: string;
    adresse?: string;
    ville?: string;
    services?: string[];
    other_service?: string;
    org_presentation?: string;
    services_description?: string;
    additional_info?: string;
    informations_pratiques?: string;
    contact_urgence?: string;
    description?: string;
    guard?: boolean; // pharmacie
    horaire_start?: string;
    horaire_end?: string;
    // clinic-specific aliases
    clinic_presentation?: string;
    clinic_services_description?: string;
    // arrays
    moyens_paiement?: string[];
    moyens_transport?: string[];
    jours_disponibles?: string[];
    // gallery images (optional)
    imgs?: any[];
  }) => {
    const hasFiles = Array.isArray(payload.imgs) && payload.imgs.some(Boolean);

    // Prefer JSON for React Native unless files are present (avoids RN FormData network issues)
    if (!hasFiles) {
      // Backend expects services as string; arrays are allowed for other fields
      const body: any = {
        name: payload.name || payload.nom_etablissement || '',
        email: payload.email,
        password: payload.password,
        password_confirmation: payload.password_confirmation || payload.password,
        phone: payload.phone,
        role_id: payload.role_id,
        nom_etablissement: payload.nom_etablissement || payload.name,
        responsable_name: payload.responsable_name,
        adresse: payload.adresse,
        ville: payload.ville,
        services: Array.isArray(payload.services) ? JSON.stringify(payload.services) : payload.services,
        org_presentation: payload.org_presentation,
        other_service: payload.other_service,
        services_description: payload.services_description,
        additional_info: payload.additional_info,
        informations_pratiques: payload.informations_pratiques,
        contact_urgence: payload.contact_urgence,
        description: payload.description,
        horaire_start: payload.horaire_start,
        horaire_end: payload.horaire_end,
        clinic_presentation: payload.clinic_presentation,
        clinic_services_description: payload.clinic_services_description,
        moyens_paiement: payload.moyens_paiement || [],
        moyens_transport: payload.moyens_transport || [],
        jours_disponibles: payload.jours_disponibles || [],
        guard: payload.guard ? 1 : 0,
      };

      const data = await request('/organizations/register', {
        method: 'POST',
        headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
        body,
      });
      setAuth(data.token, data.user);
      // Refresh user data to get role_name populated
      try {
        const userRes = await apiClient.get('/user');
        await setAuth(data.token, userRes.data);
      } catch (e) {
        // Non-fatal, continue with registration response
      }
      return data;
    }

    // Multipart path (only when images provided)
    const fd = new FormData();
    fd.append('name', (payload.name || payload.nom_etablissement || '') as any);
    fd.append('email', payload.email as any);
    fd.append('password', payload.password as any);
    fd.append('password_confirmation', (payload.password_confirmation || payload.password) as any);
    fd.append('phone', payload.phone as any);
    fd.append('role_id', String(payload.role_id) as any);

    if (payload.nom_etablissement) fd.append('nom_etablissement', payload.nom_etablissement as any);
    if (payload.responsable_name) fd.append('responsable_name', payload.responsable_name as any);
    if (payload.adresse) fd.append('adresse', payload.adresse as any);
    if (payload.ville) fd.append('ville', payload.ville as any);

    if (Array.isArray(payload.services)) fd.append('services', JSON.stringify(payload.services) as any);
    if (payload.org_presentation) fd.append('org_presentation', payload.org_presentation as any);
    if (payload.other_service) fd.append('other_service', payload.other_service as any);
    if (payload.services_description) fd.append('services_description', payload.services_description as any);
    if (payload.additional_info) fd.append('additional_info', payload.additional_info as any);
    if (payload.informations_pratiques) fd.append('informations_pratiques', payload.informations_pratiques as any);
    if (payload.contact_urgence) fd.append('contact_urgence', payload.contact_urgence as any);
    if (payload.description) fd.append('description', payload.description as any);
    if (payload.horaire_start) fd.append('horaire_start', payload.horaire_start as any);
    if (payload.horaire_end) fd.append('horaire_end', payload.horaire_end as any);
    if (payload.guard !== undefined) fd.append('guard', payload.guard ? ('1' as any) : ('0' as any));

    if (payload.clinic_presentation) fd.append('clinic_presentation', payload.clinic_presentation as any);
    if (payload.clinic_services_description) fd.append('clinic_services_description', payload.clinic_services_description as any);

    (payload.moyens_paiement || []).forEach((v, i) => fd.append(`moyens_paiement[${i}]`, v as any));
    (payload.moyens_transport || []).forEach((v, i) => fd.append(`moyens_transport[${i}]`, v as any));
    (payload.jours_disponibles || []).forEach((v, i) => fd.append(`jours_disponibles[${i}]`, v as any));

    (payload.imgs || []).slice(0, 6).forEach((file, idx) => {
      if (!file) return;
      const f: any = typeof file === 'string'
        ? { uri: file, name: `image_${idx}.jpg`, type: 'image/jpeg' }
        : (file.uri ? file : null);
      if (f) fd.append(`imgs[${idx}]`, f as any);
    });

    const data = await request('/organizations/register', {
      method: 'POST',
      headers: { Accept: 'application/json' },
      body: fd as any,
    });
    setAuth(data.token, data.user);
    // Refresh user data to get role_name populated
    try {
      const userRes = await apiClient.get('/user');
      await setAuth(data.token, userRes.data);
    } catch (e) {
      // Non-fatal, continue with registration response
    }
    return data;
  },

  // Patient appointment booking
  getAvailableHours: async (doctorId: string | number, date?: string) => {
    const qs = date ? `?date=${encodeURIComponent(date)}` : '';
    return request(`/doctors/${doctorId}/available-hours${qs}`, { method: 'GET' });
  },

  getBookedSlots: async (doctorId: string | number, date: string) => {
    return request(`/appointments/booked-slots/${doctorId}?date=${encodeURIComponent(date)}`, { method: 'GET' });
  },

  createAppointment: async (payload: any) => {
    // Map to backend contract
    if (payload?.target_user_id) {
      // Doctor appointment
      const body: any = {
        target_user_id: Number(payload.target_user_id),
        target_role: payload.target_role || 'medecin',
        date_time: payload.date_time || `${payload.date} ${payload.time}`,
        reason: payload.reason,
      };
      if (payload.patient_name) body.patient_name = payload.patient_name;
      if (payload.patient_phone) body.patient_phone = payload.patient_phone;
      if (payload.patient_email) body.patient_email = payload.patient_email;
      if (payload.announcement_id) body.announcement_id = payload.announcement_id;
      if (payload.notes) body.notes = payload.notes;
      return request('/patient/appointments', { method: 'POST', body });
    }
    if (payload?.organization_id) {
      // Organization appointment
      const body: any = {
        organization_id: Number(payload.organization_id),
        date: payload.date,
        time: payload.time,
        reason: payload.reason,
        patientName: payload.patientName || payload.patient_name,
        patientPhone: payload.patientPhone || payload.patient_phone,
        patientEmail: payload.patientEmail || payload.patient_email,
      };
      return request('/patient/appointments', { method: 'POST', body });
    }
    // Fallback: send as-is
    return request('/patient/appointments', { method: 'POST', body: payload });
  },

  updateAppointment: async (
    id: string | number,
    payload: { date: string; time: string; reason?: string }
  ) => {
    return request(`/appointments/${id}`, { method: 'PUT', body: payload });
  },

  cancelAppointment: async (id: string | number) => {
    return request(`/appointments/${id}/cancel`, { method: 'POST' });
  },

  // Professional profile management
  getProfessionalProfile: async () => {
    return request('/professional/profile', { method: 'GET' });
  },

  updateProfessionalProfile: async (payload: any) => {
    return request('/professional/profile/update', {
      method: 'POST',
      body: payload,
    });
  },

  updateProfessionalImage: async (imageFile: any) => {
    const fd = new FormData();
    fd.append('image', imageFile);
    return request('/professional/profile/update-image', {
      method: 'POST',
      body: fd,
    });
  },

  toggleAvailability: async (disponible: boolean) => {
    return request('/professional/profile/toggle-availability', {
      method: 'POST',
      body: { disponible },
    });
  },

  setAbsence: async (payload: { start_date?: string; end_date?: string; absence_start_date?: string | null; absence_end_date?: string | null; reason?: string }) => {
    // Map to backend expected keys
    const body: any = {
      absence_start_date: payload.absence_start_date ?? payload.start_date ?? null,
      absence_end_date: payload.absence_end_date ?? payload.end_date ?? null,
    };
    if ('reason' in payload) body.reason = (payload as any).reason;
    return request('/professional/profile/set-absence', {
      method: 'POST',
      body,
    });
  },

  toggleVacationMode: async (vacation_mode: boolean, vacation_auto_reactivate_date?: string | null) => {
    const body: any = { vacation_mode };
    if (vacation_auto_reactivate_date !== undefined) body.vacation_auto_reactivate_date = vacation_auto_reactivate_date;
    return request('/professional/profile/toggle-vacation-mode', {
      method: 'POST',
      body,
    });
  },

  // Doctor appointments management
  getDoctorAppointments: async () => {
    return request('/doctor/appointments', { method: 'GET' });
  },

  getDoctorAppointmentDetails: async (id: string | number) => {
    return request(`/doctor/appointments/${id}`, { method: 'GET' });
  },

  updateAppointmentStatus: async (id: string | number, status: string) => {
    return request(`/doctor/appointments/${id}/status`, {
      method: 'PUT',
      body: { status },
    });
  },

  // QR Code scan verification
  scanVerifyAppointment: async (id: string | number) => {
    return request(`/doctor/appointments/${id}/scan-verify`, { method: 'POST' });
  },

  markAppointmentCheckIn: async (id: string | number) => {
    return request(`/doctor/appointments/${id}/check-in`, { method: 'POST' });
  },

  // Notifications
  getNotifications: async () => {
    return request('/notifications', { method: 'GET' });
  },

  markNotificationAsRead: async (id: string | number) => {
    return request(`/notifications/${id}/read`, { method: 'PUT' });
  },

  markAllNotificationsAsRead: async () => {
    return request('/notifications/read-all', { method: 'PUT' });
  },

  // Annonces (Announcements) management
  getAnnonces: async (filters?: { type?: string; category?: string; status?: string; search?: string }) => {
    const params = new URLSearchParams();
    if (filters?.type) params.append('type', filters.type);
    if (filters?.category) params.append('category', filters.category);
    if (filters?.status) params.append('status', filters.status);
    if (filters?.search) params.append('search', filters.search);
    const qs = params.toString();
    return request(`/doctor/annonces${qs ? `?${qs}` : ''}`, { method: 'GET' });
  },

  getAnnonce: async (id: string | number) => {
    return request(`/doctor/annonces/${id}`, { method: 'GET' });
  },

  createAnnonce: async (payload: {
    title: string;
    description: string;
    content?: string;
    type: string;
    category?: string;
    price: number;
    duration?: number;
    location?: string;
    availability?: any;
    address: string;
    phone: string;
    email: string;
    is_active: boolean;
    pourcentage_reduction?: number;
    images?: any[];
  }) => {
    const hasFiles = Array.isArray(payload.images) && payload.images.some(Boolean);

    if (!hasFiles) {
      // JSON payload
      const body: any = {
        title: payload.title,
        description: payload.description,
        content: payload.content,
        type: payload.type,
        category: payload.category,
        price: payload.price,
        duration: payload.duration,
        location: payload.location,
        availability: payload.availability ? JSON.stringify(payload.availability) : null,
        address: payload.address,
        phone: payload.phone,
        email: payload.email,
        is_active: payload.is_active ? 1 : 0,
        pourcentage_reduction: payload.pourcentage_reduction || 0,
      };
      return request('/doctor/annonces', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body,
      });
    }

    // FormData for images
    const fd = new FormData();
    fd.append('title', payload.title as any);
    fd.append('description', payload.description as any);
    if (payload.content) fd.append('content', payload.content as any);
    fd.append('type', payload.type as any);
    if (payload.category) fd.append('category', payload.category as any);
    fd.append('price', String(payload.price) as any);
    if (payload.duration) fd.append('duration', String(payload.duration) as any);
    if (payload.location) fd.append('location', payload.location as any);
    if (payload.availability) fd.append('availability', JSON.stringify(payload.availability) as any);
    fd.append('address', payload.address as any);
    fd.append('phone', payload.phone as any);
    fd.append('email', payload.email as any);
    fd.append('is_active', (payload.is_active ? '1' : '0') as any);
    fd.append('pourcentage_reduction', String(payload.pourcentage_reduction || 0) as any);

    (payload.images || []).forEach((file, idx) => {
      if (!file) return;
      const f: any = typeof file === 'string'
        ? { uri: file, name: `image_${idx}.jpg`, type: 'image/jpeg' }
        : (file.uri ? file : null);
      if (f) fd.append(`images[${idx}]`, f as any);
    });

    return request('/doctor/annonces', {
      method: 'POST',
      body: fd as any,
    });
  },

  updateAnnonce: async (id: string | number, payload: Partial<{
    title: string;
    description: string;
    price: number;
    address: string;
    phone: string;
    email: string;
    is_active: boolean;
    pourcentage_reduction: number;
    images: any[];
    keep_images: boolean;
  }>) => {
    const hasFiles = Array.isArray(payload.images) && payload.images.some(Boolean);

    if (!hasFiles) {
      const body: any = {};
      if (payload.title !== undefined) body.title = payload.title;
      if (payload.description !== undefined) body.description = payload.description;
      if (payload.price !== undefined) body.price = payload.price;
      if (payload.address !== undefined) body.address = payload.address;
      if (payload.phone !== undefined) body.phone = payload.phone;
      if (payload.email !== undefined) body.email = payload.email;
      if (payload.is_active !== undefined) body.is_active = payload.is_active ? 1 : 0;
      if (payload.pourcentage_reduction !== undefined) body.pourcentage_reduction = payload.pourcentage_reduction;

      return request(`/doctor/annonces/${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body,
      });
    }

    // FormData for images
    const fd = new FormData();
    if (payload.title) fd.append('title', payload.title as any);
    if (payload.description) fd.append('description', payload.description as any);
    if (payload.price !== undefined) fd.append('price', String(payload.price) as any);
    if (payload.address) fd.append('address', payload.address as any);
    if (payload.phone) fd.append('phone', payload.phone as any);
    if (payload.email) fd.append('email', payload.email as any);
    if (payload.is_active !== undefined) fd.append('is_active', (payload.is_active ? '1' : '0') as any);
    if (payload.pourcentage_reduction !== undefined) fd.append('pourcentage_reduction', String(payload.pourcentage_reduction) as any);
    if (payload.keep_images !== undefined) fd.append('keep_images', (payload.keep_images ? '1' : '0') as any);

    (payload.images || []).forEach((file, idx) => {
      if (!file) return;
      const f: any = typeof file === 'string'
        ? { uri: file, name: `image_${idx}.jpg`, type: 'image/jpeg' }
        : (file.uri ? file : null);
      if (f) fd.append(`images[${idx}]`, f as any);
    });

    return request(`/doctor/annonces/${id}`, {
      method: 'POST',
      body: fd as any,
    });
  },

  toggleAnnonceStatus: async (id: string | number, is_active?: boolean) => {
    const body: any = {};
    if (is_active !== undefined) body.is_active = is_active ? 1 : 0;
    return request(`/doctor/annonces/${id}/toggle-status`, {
      method: 'PUT',
      body,
    });
  },

  activateAllAnnonces: async () => {
    return request('/doctor/annonces/activate-all', { method: 'POST' });
  },

  deactivateAllAnnonces: async () => {
    return request('/doctor/annonces/deactivate-all', { method: 'POST' });
  },

  deleteAnnonce: async (id: string | number) => {
    return request(`/doctor/annonces/${id}`, { method: 'DELETE' });
  },
};
