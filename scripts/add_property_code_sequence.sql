-- Etapa 4.1 do roadmap: código automático de imóvel por categoria (ex: CS-000001, AP-000001).
CREATE TABLE IF NOT EXISTS property_code_sequences (
  prefix VARCHAR(10) PRIMARY KEY,
  last_number INTEGER NOT NULL DEFAULT 0
);

-- Gera o próximo código para um prefixo de forma atômica (segura contra concorrência)
-- e nunca repete, mesmo que imóveis sejam depois excluídos/arquivados.
CREATE OR REPLACE FUNCTION next_property_code(prefix_in VARCHAR(10))
RETURNS VARCHAR AS $$
DECLARE
  next_num INTEGER;
BEGIN
  INSERT INTO property_code_sequences (prefix, last_number)
  VALUES (prefix_in, 1)
  ON CONFLICT (prefix) DO UPDATE SET last_number = property_code_sequences.last_number + 1
  RETURNING last_number INTO next_num;

  RETURN prefix_in || '-' || LPAD(next_num::TEXT, 6, '0');
END;
$$ LANGUAGE plpgsql;
