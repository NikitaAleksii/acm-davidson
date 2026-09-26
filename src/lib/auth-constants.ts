// Kept separate from auth.ts so the proxy (which cannot import server-only DB code) can use it.
export const SESSION_COOKIE = "acm_session";
