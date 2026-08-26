import api from '../client';

export async function createArticle(articleData: {
  title: string;
  excerpt?: string;
  language: string;
  categoryId: string;
  content: object | string;
  thumbnailId?: string;
  isBreaking?: boolean;
  breakingUntil?: string;
  isSponsored?: boolean;
  sponsoredBy?: string;
  sponsoredUntil?: string;
}): Promise<any> {
  const { data } = await api.post('/api/tugezo/articles', articleData);
  return data;
}

export async function getArticleBySlug(slug: string, language?: string) {
  const { data } = await api.get(`/api/tugezo/articles/slug/${slug}`, {
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
  const { data } = await api.patch(`/api/tugezo/articles/${articleId}`, articleData);
  return data;
}

export async function getArticles(params: {
  language?: string;
  page?: number;
  limit?: number;
  status?: string;
  featuredType?: string;
  categorySlug?: string;
  subCategorySlug?: string;
  search?: string;
}) {
  const { data } = await api.get('/api/tugezo/articles', { params });
  return data.data;
}

export async function hardDeleteArticle(articleId: string): Promise<any> {
  const { data } = await api.delete(`/api/tugezo/articles/${articleId}/hard`);
  return data;
}

export async function toggleFeaturedArticle(articleId: string) {
  const { data } = await api.patch(`/api/tugezo/articles/${articleId}/feature`);
  return data.data;
}

export async function getTags(language?: string, search?: string) {
  const { data } = await api.get('/api/tugezo/tags', {
    params: { ...(language ? { language } : {}), ...(search ? { search } : {}) },
  });
  return data.data;
}

export async function assignTagIds(
  articleId: string,
  tagIds: string[]
): Promise<any> {
  const { data } = await api.post(`/api/tugezo/articles/${articleId}/tags`, { tagIds });
  return data.data;
}

export async function assignArticleTags(
  articleId: string,
  tags: { name: string; translations: { label: string; language: string }[] }[]
): Promise<any> {
  const { data } = await api.post(`/api/tugezo/articles/${articleId}/tags/bulk`, { tags });
  return data.data;
}

export async function removeArticleTags(
  articleId: string,
  tagIds: string[]
): Promise<any> {
  const { data } = await api.delete(`/api/tugezo/articles/${articleId}/tags`, { data: { tagIds } });
  return data.data;
}

export async function translateArticle(articleId: string, language: string) {
  const { data } = await api.post(`/api/tugezo/articles/${articleId}/translate`, { language });
  return data.data;
}

export async function getRelatedArticles(slug: string) {
  const { data } = await api.get(`/api/tugezo/articles/slug/${slug}/related`);
  return data.data;
}

export async function getBreakingNews(language?: string) {
  const { data } = await api.get('/api/tugezo/articles/breaking', {
    params: language ? { language } : undefined,
  });
  return data.data;
}

export async function getTrendingArticles(params: {
  limit?: number;
  language?: string;
}) {
  const { data } = await api.get('/api/tugezo/articles/trending', { params });
  return data.data;
}