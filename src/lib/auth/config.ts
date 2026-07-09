// Senha única de acesso às áreas restritas (admin/corretor/cliente).
// Defina SITE_PASSWORD no .env.local em produção — este valor é só o
// fallback para rodar localmente sem configurar nada.
export const SITE_PASSWORD = process.env.SITE_PASSWORD || 'sbs2024';

export const AUTH_COOKIE_NAME = 'sbs_session';

export const PROTECTED_PREFIXES = ['/admin', '/realtor', '/client'];
