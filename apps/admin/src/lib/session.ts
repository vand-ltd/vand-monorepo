import { getMe } from '@org/api';

export async function finalizeSession(accessToken: string) {
  localStorage.setItem('token', accessToken);
  try {
    const payload = JSON.parse(atob(accessToken.split('.')[1]));
    if (payload.authorSlug) {
      localStorage.setItem('authorSlug', payload.authorSlug);
    }
  } catch {
    // JWT decode failed
  }
  try {
    const me = await getMe();
    const roleName = me?.internalProfile?.role?.name;
    if (roleName) {
      localStorage.setItem('userRole', roleName);
    }
  } catch {
    // Profile fetch failed
  }
}
