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

export async function getArticleBySlug(slug: string) {
  const { data } = await api.get(`/api/menyesha/articles/slug/${slug}`);
  return data.data;
}