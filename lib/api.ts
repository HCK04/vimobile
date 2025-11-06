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
    const fd = new FormData();
    fd.append('name', payload.name);
    fd.append('email', payload.email);
    fd.append('password', payload.password);
    fd.append('password_confirmation', payload.password_confirmation || payload.password);
    fd.append('phone', payload.phone);
    fd.append('role_id', String(payload.role_id));

    // specialty with "Autres"
    let specialties = Array.isArray(payload.specialty) ? [...payload.specialty] : [];
    if (specialties.includes('Autres') && payload.other_specialty) {
      specialties = specialties.filter((s) => s !== 'Autres');
      specialties.push(payload.other_specialty);
    }
    if (specialties.length) fd.append('specialty', JSON.stringify(specialties));

    if (payload.experience_years !== undefined) fd.append('experience_years', String(payload.experience_years));
    if (payload.horaire_start) fd.append('horaire_start', payload.horaire_start);
    if (payload.horaire_end) fd.append('horaire_end', payload.horaire_end);
    if (payload.presentation) fd.append('presentation', payload.presentation);
    if (payload.adresse) fd.append('adresse', payload.adresse);
    if (payload.ville) fd.append('ville', payload.ville);
    if (payload.numero_carte_professionnelle) fd.append('numero_carte_professionnelle', payload.numero_carte_professionnelle);
    if (payload.carte_professionnelle_file) fd.append('carte_professionnelle', payload.carte_professionnelle_file as any);

    // CV arrays as JSON strings like web
    try {
      const diplList = Array.isArray(payload.diplomes) ? payload.diplomes : [];
      fd.append('diplomes', JSON.stringify(diplList));
    } catch { fd.append('diplomes', JSON.stringify([])); }
    try {
      const expList = Array.isArray(payload.experiences) ? payload.experiences : [];
      fd.append('experiences', JSON.stringify(expList));
    } catch { fd.append('experiences', JSON.stringify([])); }

    if (payload.org_presentation) fd.append('org_presentation', payload.org_presentation);
    if (payload.services_description) fd.append('services_description', payload.services_description);
    if (payload.additional_info) fd.append('additional_info', payload.additional_info);
    if (payload.informations_pratiques) fd.append('informations_pratiques', payload.informations_pratiques);
    if (payload.contact_urgence) fd.append('contact_urgence', payload.contact_urgence);
    if (payload.rdv_patients_suivis_uniquement !== undefined) {
      fd.append('rdv_patients_suivis_uniquement', payload.rdv_patients_suivis_uniquement ? '1' : '0');
    }

    // Arrays sent as repeated keys for new fields
    (payload.moyens_paiement || []).forEach((v, i) => fd.append(`moyens_paiement[${i}]`, v));
    (payload.moyens_transport || []).forEach((v, i) => fd.append(`moyens_transport[${i}]`, v));
    (payload.jours_disponibles || []).forEach((v, i) => fd.append(`jours_disponibles[${i}]`, v));

    const data = await request('/register', {
      method: 'POST',
      headers: { Accept: 'application/json' },
      body: fd as any,
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
    const fd = new FormData();
    if (payload.name) fd.append('name', payload.name);
    fd.append('email', payload.email);
    fd.append('password', payload.password);
    fd.append('password_confirmation', payload.password_confirmation || payload.password);
    fd.append('phone', payload.phone);
    fd.append('role_id', String(payload.role_id));

    if (payload.nom_etablissement) fd.append('nom_etablissement', payload.nom_etablissement);
    if (payload.responsable_name) fd.append('responsable_name', payload.responsable_name);
    if (payload.adresse) fd.append('adresse', payload.adresse);
    if (payload.ville) fd.append('ville', payload.ville);

    if (Array.isArray(payload.services)) fd.append('services', JSON.stringify(payload.services));
    if (payload.org_presentation) fd.append('org_presentation', payload.org_presentation);
    if (payload.other_service) fd.append('other_service', payload.other_service);
    if (payload.services_description) fd.append('services_description', payload.services_description);
    if (payload.additional_info) fd.append('additional_info', payload.additional_info);
    if (payload.informations_pratiques) fd.append('informations_pratiques', payload.informations_pratiques);
    if (payload.contact_urgence) fd.append('contact_urgence', payload.contact_urgence);
    if (payload.description) fd.append('description', payload.description);
    if (payload.horaire_start) fd.append('horaire_start', payload.horaire_start);
    if (payload.horaire_end) fd.append('horaire_end', payload.horaire_end);
    if (payload.guard !== undefined) fd.append('guard', payload.guard ? '1' : '0');

    // clinic mappings
    if (payload.clinic_presentation) fd.append('clinic_presentation', payload.clinic_presentation);
    if (payload.clinic_services_description) fd.append('clinic_services_description', payload.clinic_services_description);

    (payload.moyens_paiement || []).forEach((v, i) => fd.append(`moyens_paiement[${i}]`, v));
    (payload.moyens_transport || []).forEach((v, i) => fd.append(`moyens_transport[${i}]`, v));
    (payload.jours_disponibles || []).forEach((v, i) => fd.append(`jours_disponibles[${i}]`, v));

    (payload.imgs || []).slice(0, 6).forEach((file, idx) => {
      if (file) fd.append(`imgs[${idx}]`, file as any);
    });

    const data = await request('/organizations/register', {
      method: 'POST',
      headers: { Accept: 'application/json' },
      body: fd as any,
    });
    setAuth(data.token, data.user);
    return data;
  },
};
