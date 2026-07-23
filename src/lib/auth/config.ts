export const AUTH_COOKIE_NAME = 'sbs_session';

export const PROTECTED_PREFIXES = ['/admin', '/realtor', '/client', '/tenant', '/staff'];

// Secret used to sign the session cookie so it can't be forged client-side.
// Set SESSION_SECRET in .env.local in production.
export const SESSION_SECRET = process.env.SESSION_SECRET || 'dev-only-insecure-secret';
