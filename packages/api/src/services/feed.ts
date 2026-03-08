import api from '../client';

export async function getArticlesFeed(parms: {
  cursor?: string;
  limit?: number;
  language?: string;
}) {
  const { data } = await api.get('/api/menyesha/articles/feed', { params: parms });
  return data.data;  
}