import api from '../client';

export async function adminGetTerms() {
  const { data } = await api.get('/api/admin/terms');
  return data.data;
}

export async function adminGetTermsById(id: string) {
  const { data } = await api.get(`/api/admin/terms/${id}`);
  return data.data;
}

export async function adminCreateTerms(body: { version: string; content: string }) {
  const { data } = await api.post('/api/admin/terms', body);
  return data.data;
}

export async function adminActivateTerms(id: string) {
  const { data } = await api.patch(`/api/admin/terms/${id}/activate`);
  return data.data;
}

export async function getActiveTerms() {
  const { data } = await api.get('/api/auth/terms');
  return data.data;
}
