import api from '../client';

export async function getComments(articleId: string, cursor?: string) {
  const { data } = await api.get(`/api/menyesha/articles/${articleId}/comments`, {
    params: cursor ? { cursor } : undefined,
  });
  return data.data;
}

export async function getCommentCount(articleId: string): Promise<number> {
  const { data } = await api.get(`/api/menyesha/articles/${articleId}/comments/count`);
  return data.data.count;
}

export async function createComment(
  articleId: string,
  commentData: {
    content: string;
    authorName?: string;
    authorEmail?: string;
  }
) {
  const { data } = await api.post(
    `/api/menyesha/articles/${articleId}/comments`,
    commentData
  );
  return data.data;
}
