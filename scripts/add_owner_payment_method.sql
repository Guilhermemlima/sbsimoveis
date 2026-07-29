-- Etapa 2.2 do roadmap: forma de pagamento preferida, favorecido e melhor dia de pagamento do proprietário.
ALTER TABLE property_owners ADD COLUMN IF NOT EXISTS payment_method VARCHAR(20) DEFAULT 'pix';
ALTER TABLE property_owners ADD COLUMN IF NOT EXISTS payment_beneficiary_name VARCHAR(255);
ALTER TABLE property_owners ADD COLUMN IF NOT EXISTS preferred_payment_day INTEGER;

ALTER TABLE property_owners ADD CONSTRAINT valid_payment_method
  CHECK (payment_method IN ('pix', 'ted', 'doc', 'dinheiro', 'boleto'));

ALTER TABLE property_owners ADD CONSTRAINT valid_preferred_payment_day
  CHECK (preferred_payment_day IS NULL OR (preferred_payment_day BETWEEN 1 AND 28));
