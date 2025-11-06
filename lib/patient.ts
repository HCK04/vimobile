import { apiClient } from './apiClient';

export async function getMyProfile() {
  const res = await apiClient.get('/user/profile');
  return res.data;
}

export interface UpdateProfilePayload {
  name?: string;
  email?: string;
  phone?: string;
  age?: number;
  gender?: string;
  blood_type?: string;
  allergies?: string | string[];
  chronic_diseases?: string | string[];
  password?: string;
  password_confirmation?: string;
}

export async function updateMyProfile(payload: UpdateProfilePayload) {
  const res = await apiClient.put('/user/profile', payload);
  return res.data;
}

export async function updateMyAvatar(fileUri: string, filename?: string) {
  const form = new FormData();
  const name = filename || fileUri.split('/').pop() || 'avatar.jpg';
  // @ts-ignore React Native file type
  form.append('avatar', { uri: fileUri, name, type: 'image/jpeg' });
  const res = await apiClient.post('/user/profile/update-avatar', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data;
}


