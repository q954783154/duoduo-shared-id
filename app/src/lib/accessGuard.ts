export const ACCESS_STORAGE_KEY = 'id_access_verified_until';

export function hasValidAccess() {
  if (typeof window === 'undefined') {
    return false;
  }

  const value = window.localStorage.getItem(ACCESS_STORAGE_KEY);
  const verifiedUntil = value ? Number(value) : 0;

  return Number.isFinite(verifiedUntil) && verifiedUntil > Date.now();
}
