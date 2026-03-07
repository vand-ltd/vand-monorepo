import api from '../client';

export async function getCategories(language: string) {
  const { data } = await api.get(`/api/menyesha/categories?language=${language}`);
  return data.data;
}