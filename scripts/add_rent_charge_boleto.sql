-- Etapa 4.2 (complemento): anexo de boleto por cobrança de locação.
ALTER TABLE financial_transactions ADD COLUMN IF NOT EXISTS boleto_file_path TEXT;
ALTER TABLE financial_transactions ADD COLUMN IF NOT EXISTS boleto_file_name VARCHAR(255);
