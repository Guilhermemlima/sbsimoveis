-- Fase 4: despesas administrativas custeadas com o lucro da locação
-- (taxa de administração), com um limite configurável para nunca tocar
-- no dinheiro dos proprietários. Não remove nem altera nada do que já
-- existe.

ALTER TABLE app_settings ADD COLUMN IF NOT EXISTS rental_profit_expense_rate DECIMAL(5, 2) NOT NULL DEFAULT 0;

ALTER TABLE financial_transactions ADD COLUMN IF NOT EXISTS funded_by_rental_profit BOOLEAN NOT NULL DEFAULT false;
