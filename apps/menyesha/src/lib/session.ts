import { getMe } from '@org/api';

// Persist the logged-in session the same way the axios client reads it back:
// the access token under 'token', plus the role for any gated UI. External
// readers carry an externalProfile; internal staff an internalProfile.
export async function finalizeSession(accessToken: string) {
  localStorage.setItem('token', accessToken);
  try {
    const payload = JSON.parse(atob(accessToken.split('.')[1]));
    if (payload.authorSlug) {
      localStorage.setItem('authorSlug', payload.authorSlug);
    }
  } catch {
    // JWT decode failed — non-fatal.
  }
  try {
    const me = await getMe();
    const roleName = me?.externalProfile?.role?.name ?? me?.internalProfile?.role?.name;
    if (roleName) {
      localStorage.setItem('userRole', roleName);
    }
  } catch {
    // Profile fetch failed — non-fatal.
  }
}
