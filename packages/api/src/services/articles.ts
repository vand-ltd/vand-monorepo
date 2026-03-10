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

export async function getArticleBySlug(slug: string, language?: string) {
  const { data } = await api.get(`/api/menyesha/articles/slug/${slug}`, {
    params: language ? { language } : undefined,
  });
  return data.data;
}

export async function updateArticle(
  articleId: string,
  articleData: {
    title?: string;
    excerpt?: string;
    language?: string;
    categoryId?: string;
    content?: object;
    thumbnailId?: string;
    tagIds?: string[];
    status?: string;
    featuredType?: string | null;
  }
): Promise<any> {
  const { data } = await api.patch(`/api/menyesha/articles/${articleId}`, articleData);
  return data;
}

export async function getArticles(params: {
  language?: string;
  page?: number;
  limit?: number;
  status?: string;
  featuredType?: string;
}) {
  const { data } = await api.get('/api/menyesha/articles', { params });
  return data.data;
}

export async function toggleFeaturedArticle(articleId: string) {
  const { data } = await api.patch(`/api/menyesha/articles/${articleId}/feature`);
  return data.data;
}

export async function getTags(language?: string) {
  const { data } = await api.get('/api/menyesha/tags', {
    params: language ? { language } : undefined,
  });
  return data.data;
}

export async function assignArticleTags(
  articleId: string,
  tags: { name: string; translations: { label: string; language: string }[] }[]
): Promise<any> {
  const { data } = await api.post(`/api/menyesha/articles/${articleId}/tags/bulk`, { tags });
  return data.data;
}

export async function getTrendingArticles(params: {
  limit?: number;
  language?: string;
}) {
  const { data } = await api.get('/api/menyesha/articles/trending', { params });
  return data.data;
}