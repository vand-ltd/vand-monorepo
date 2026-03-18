import api from '../client';

export async function login(email: string, password: string) {
  const {data} = await api.post('/api/auth/login', { email, password });
  return data;
}

export async function getMe() {
  const { data } = await api.get('/api/auth/me');
  return data.data;
}

export async function verify2fa(tempToken: string, otp: string) {
  const { data } = await api.post('/api/auth/2fa/verify', { tempToken, otp });
  return data;
}

export async function changePassword(body: {
  currentPassword: string;
  newPassword: string;
  acceptTerms: boolean;
}) {
  const { data } = await api.post('/api/auth/change-password', body);
  return data;
}

export async function updateProfile(fields: {
  displayName?: string;
  avatar?: string;
  bio?: string;
  xLink?: string;
  linkedinLink?: string;
}) {
  const { data } = await api.patch('/api/auth/profile', fields);
  return data.data;
}