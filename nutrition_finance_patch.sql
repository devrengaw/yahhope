-- ==============================================================================
-- CORREÇÃO E ATUALIZAÇÃO DA TABELA FINANCE_TRANSACTIONS
-- ==============================================================================
-- Execute este script no SQL Editor do Supabase para garantir suporte nativo
-- a todas as colunas de despesas fixas, moedas internacionais (MZN) e notas.

-- 1. Coluna de setor/módulo (nutrition, communication, global)
ALTER TABLE finance_transactions ADD COLUMN IF NOT EXISTS module TEXT DEFAULT 'global';

-- 2. Coluna de observações e notas da despesa
ALTER TABLE finance_transactions ADD COLUMN IF NOT EXISTS notes TEXT;

-- 3. Colunas de suporte a moedas estrangeiras (MZN Moçambique, USD, BRL)
ALTER TABLE finance_transactions ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'BRL';
ALTER TABLE finance_transactions ADD COLUMN IF NOT EXISTS original_amount NUMERIC(10, 2);
ALTER TABLE finance_transactions ADD COLUMN IF NOT EXISTS exchange_rate NUMERIC(10, 6);

-- 4. Atualização da restrição de periodicidade/recorrência
ALTER TABLE finance_transactions DROP CONSTRAINT IF EXISTS finance_transactions_recurrence_check;
ALTER TABLE finance_transactions ADD CONSTRAINT finance_transactions_recurrence_check 
CHECK (recurrence IN ('monthly', 'bimonthly', 'quarterly', 'semiannual', 'yearly', 'none'));

-- 5. Atualizar registros antigos sem módulo
UPDATE finance_transactions SET module = 'nutrition' 
WHERE module IS NULL AND (
  description ILIKE '%nutri%' OR 
  description ILIKE '%kit%' OR 
  description ILIKE '%insumo%' OR 
  description ILIKE '%criança%'
);

UPDATE finance_transactions SET module = 'global' WHERE module IS NULL;
