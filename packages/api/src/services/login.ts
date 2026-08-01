import api from '../client';

export async function login(email: string, password: string) {
  const {data} = await api.post('/api/auth/login', { email, password });
  return data;
}

// Public external-user registration. Creates an unverified reader and emails a
// verification link; no tokens are returned until the email is confirmed.
export async function signup(body: {
  fullName: string;
  email: string;
  password: string;
  phone?: string;
  language?: string;
}) {
  const { data } = await api.post('/api/auth/signup', body);
  return data;
}

// Confirms the email from the link's token; on success the user is logged in
// (returns access + refresh tokens + user, same shape as login).
export async function verifyEmail(token: string) {
  const { data } = await api.post('/api/auth/verify-email', { token });
  return data;
}

// Re-sends the verification link. Always resolves with a neutral message
// (can't be used to probe which emails exist).
export async function resendVerification(email: string) {
  const { data } = await api.post('/api/auth/resend-verification', { email });
  return data;
}

export async function getMe(language?: string) {
  const { data } = await api.get('/api/auth/me', {
    params: language ? { language } : undefined,
  });
  return data.data;
}

export async function verify2fa(tempToken: string, otp: string) {
  const { data } = await api.post('/api/auth/2fa/verify', { tempToken, otp });
  return data;
}

export async function changePassword(body: {
  currentPassword: string;
  newPassword: string;
  acceptTerms: boolean;
}) {
  const { data } = await api.post('/api/auth/change-password', body);
  return data;
}

export async function updateProfile(fields: {
  displayName?: string;
  avatar?: string;
  bio?: string;
  xLink?: string;
  linkedinLink?: string;
}) {
  const { data } = await api.patch('/api/auth/profile', fields);
  return data.data;
}