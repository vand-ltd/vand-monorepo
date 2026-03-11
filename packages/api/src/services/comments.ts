import api from '../client';

export async function getComments(articleId: string) {
  const { data } = await api.get(`/api/menyesha/articles/${articleId}/comments`);
  return data.data.comments;
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
