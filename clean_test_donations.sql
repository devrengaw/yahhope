-- ============================================================
-- SCRIPT DE LIMPEZA: Zerar Régua e Remover Dados de Teste
-- Execute no SQL Editor do seu Supabase Dashboard
-- ============================================================

-- 1. Zerar a arrecadação acumulada e registrar o momento de corte (reset) em todas as campanhas
UPDATE campaigns 
SET current_amount = 0,
    last_reset_at = NOW();

-- 2. Remover todas as doações de teste cadastradas
DELETE FROM donations;

-- 3. Caso tenha criado apadrinhamentos de teste na tabela sponsorships, desative ou limpe-os:
-- (Remova os dois traços '--' da linha abaixo se quiser limpar apadrinhamentos de teste)
-- DELETE FROM sponsorships;

-- 4. Caso tenha lançado doações de teste na tabela de finanças (finance_transactions):
-- (Remova os dois traços '--' da linha abaixo se quiser limpar lançamentos financeiros de teste)
-- DELETE FROM finance_transactions WHERE category_id = 'cat_donations' OR category ILIKE '%doação%' OR category ILIKE '%doacao%' OR description ILIKE '%teste%';

-- 5. Conferência dos valores após a execução:
SELECT id, title, target_amount, current_amount, type, is_active, last_reset_at 
FROM campaigns 
ORDER BY priority ASC;

SELECT count(*) as total_donacoes_restantes 
FROM donations;
