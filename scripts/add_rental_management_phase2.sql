-- Fase 2: papel de inquilino, para acesso ao portal do inquilino.
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'tenant';
