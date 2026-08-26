import api from '../client';

export async function getCategories(language: string) {
  const { data } = await api.get(`/api/tugezo/categories?language=${language}`);
  return data.data;
}

export async function createCategory(categoryData: {
  translations: { name: string; language: string }[];
  parentGroupId?: string;
}): Promise<any> {
  const { data } = await api.post('/api/tugezo/categories', categoryData);
  return data;
}