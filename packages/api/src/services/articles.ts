import api from '../client';

export async function createArticle(articleData: {
  title: string;
  excerpt?: string;
  language: string;
  categoryId: string;
  content: object;
  thumbnailId?: string;
  tagIds?: string[];
  status: String;
}): Promise<any> { 
  const { data } = await api.post('/api/menyesha/articles', articleData);
  return data;
}