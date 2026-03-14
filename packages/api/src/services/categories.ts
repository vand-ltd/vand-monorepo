import api from '../client';

export async function getCategories(language: string) {
  const { data } = await api.get(`/api/menyesha/categories?language=${language}`);
  return data.data;
}

export async function createCategory(categoryData: {
  translations: { name: string; language: string }[];
  parentGroupId?: string;
}): Promise<any> {
  const { data } = await api.post('/api/menyesha/categories', categoryData);
  return data;
}