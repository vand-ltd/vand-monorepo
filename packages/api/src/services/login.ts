import api from '../client';

export async function login(email: string, password: string) { 
  const {data} = await api.post('/api/auth/login', { email, password });
  return data;
}