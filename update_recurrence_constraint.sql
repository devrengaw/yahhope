-- ==============================================================================
-- MIGRAÇÃO: ATUALIZAÇÃO DA RESTRIÇÃO DE RECORRÊNCIA EM FINANCE_TRANSACTIONS
-- ==============================================================================
-- Motivo: Permitir o cadastro de gastos fixos com periodicidade Semestral, 
-- Bimestral e Trimestral, além de Mensal e Anual.

-- 1. Remove a restrição antiga que limitava apenas a ('monthly', 'yearly', 'none')
ALTER TABLE finance_transactions 
DROP CONSTRAINT IF EXISTS finance_transactions_recurrence_check;

-- 2. Adiciona a nova restrição contemplando todas as novas periodicidades
ALTER TABLE finance_transactions 
ADD CONSTRAINT finance_transactions_recurrence_check 
CHECK (recurrence IN ('monthly', 'bimonthly', 'quarterly', 'semiannual', 'yearly', 'none'));
