-- Adds contact and share counters to properties (views_count already existed). Etapa 1.3 do roadmap.
ALTER TABLE properties ADD COLUMN IF NOT EXISTS contacts_count INTEGER DEFAULT 0;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS shares_count INTEGER DEFAULT 0;
