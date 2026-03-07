import api from '../client';

export async function uploadMedia(file: File) {
  const formData = new FormData();
  formData.append('file', file);
  const { data } = await api.post('/api/media/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data.data;
}
