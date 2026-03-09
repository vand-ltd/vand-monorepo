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
