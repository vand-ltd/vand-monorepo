import api from '../client';

export async function getAuthor(slug: string) {
  const { data } = await api.get(`/api/menyesha/articles/author/${slug}`);
  return data.data;
}

export async function getAuthorArticles(
  slug: string,
  params: {
    page?: number;
    limit?: number;
    language?: string;
    status?: string;
  }
) {
  const { data } = await api.get(
    `/api/menyesha/articles/author/${slug}/articles`,
    { params }
  );
  return data.data;
}
