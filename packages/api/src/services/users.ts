import api from '../client';

export async function getRoles() {
  const { data } = await api.get('/api/admin/users/roles');
  return data.data;
}

export async function getUsers(params: {
  page?: number;
  limit?: number;
  role?: string;
  search?: string;
}) {
  const { data } = await api.get('/api/admin/users', { params });
  return data.data;
}

export async function createUser(userData: {
  fullName: string;
  email: string;
  phone: string;
  roleId: string;
}) {
  const { data } = await api.post('/api/admin/users/create', userData);
  return data.data;
}

export async function activateUser(userId: string) {
  const { data } = await api.patch(`/api/admin/users/${userId}/activate`);
  return data.data;
}

export async function deactivateUser(userId: string) {
  const { data } = await api.patch(`/api/admin/users/${userId}/deactivate`);
  return data.data;
}

export async function deleteUser(userId: string) {
  const { data } = await api.delete(`/api/admin/users/${userId}`);
  return data.data;
}

export async function enable2fa(userId: string) {
  const { data } = await api.patch(`/api/admin/users/${userId}/2fa/enable`);
  return data.data;
}

export async function disable2fa(userId: string) {
  const { data } = await api.patch(`/api/admin/users/${userId}/2fa/disable`);
  return data.data;
}
