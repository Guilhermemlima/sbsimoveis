-- Adds an optional YouTube video link to properties (Etapa 1.2 do roadmap).
ALTER TABLE properties ADD COLUMN IF NOT EXISTS video_url TEXT;
