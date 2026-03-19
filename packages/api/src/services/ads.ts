import api from '../client';

export async function getAds(params?: { placement?: string; language?: string }) {
  const { data } = await api.get('/api/menyesha/ads', { params });
  return data.data;
}
