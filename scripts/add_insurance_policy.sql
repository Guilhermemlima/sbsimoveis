-- Etapa 3.5 do roadmap: Seguro Fiança como alternativa/complemento à caução.
-- Prefixo "fiance_insurance_" para não colidir com "insurance_responsible"
-- (que trata do seguro do imóvel, ex: seguro incêndio).
ALTER TABLE lease_contracts ADD COLUMN IF NOT EXISTS fiance_insurance_company VARCHAR(255);
ALTER TABLE lease_contracts ADD COLUMN IF NOT EXISTS fiance_insurance_policy_number VARCHAR(100);
ALTER TABLE lease_contracts ADD COLUMN IF NOT EXISTS fiance_insurance_value NUMERIC(12,2);
ALTER TABLE lease_contracts ADD COLUMN IF NOT EXISTS fiance_insurance_start_date DATE;
ALTER TABLE lease_contracts ADD COLUMN IF NOT EXISTS fiance_insurance_end_date DATE;

-- Arquivo da apólice — mesmo bucket já usado para os demais documentos ("property-documents"),
-- sob o prefixo lease-{id}/.
ALTER TABLE lease_contracts ADD COLUMN IF NOT EXISTS fiance_insurance_file_path TEXT;
ALTER TABLE lease_contracts ADD COLUMN IF NOT EXISTS fiance_insurance_file_name VARCHAR(255);
