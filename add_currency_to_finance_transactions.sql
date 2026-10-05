-- Adicionar colunas de suporte a moedas estrangeiras (MZN Moçambique, etc.)
ALTER TABLE finance_transactions ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'BRL';
ALTER TABLE finance_transactions ADD COLUMN IF NOT EXISTS original_amount NUMERIC(10, 2);
ALTER TABLE finance_transactions ADD COLUMN IF NOT EXISTS exchange_rate NUMERIC(10, 6);
