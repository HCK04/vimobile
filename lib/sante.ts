import { apiClient } from './apiClient';

export async function getPatientSante() {
  const res = await apiClient.get('/patient/sante');
  return res.data;
}

export async function updateSanteSection(section: string, items: any[], none?: boolean) {
  const res = await apiClient.post(`/patient/sante/section/${encodeURIComponent(section)}`, { items, none });
  return res.data;
}

// Vaccines
export async function getVaccinesCatalog() {
  const res = await apiClient.get('/patient/sante/vaccins/catalog');
  return res.data;
}

export async function addVaccine(payload: { name: string; date: string }) {
  const res = await apiClient.post('/patient/sante/vaccins/add', payload);
  return res.data;
}

export async function deleteVaccine(id: string | number) {
  const res = await apiClient.delete(`/patient/sante/vaccins/${encodeURIComponent(String(id))}`);
  return res.data;
}

export async function toggleVaccinesNone(none: boolean) {
  const res = await apiClient.post('/patient/sante/vaccins/none', { none });
  return res.data;
}

// Documents
export async function uploadSanteDocument(fileUri: string, filename?: string) {
  const form = new FormData();
  const name = filename || fileUri.split('/').pop() || 'document.pdf';
  // @ts-ignore React Native file type
  form.append('file', { uri: fileUri, name, type: 'application/octet-stream' });
  const res = await apiClient.post('/patient/sante/documents/upload', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data;
}

export async function deleteSanteDocument(id: string | number) {
  const res = await apiClient.delete(`/patient/sante/documents/${encodeURIComponent(String(id))}`);
  return res.data;
}


