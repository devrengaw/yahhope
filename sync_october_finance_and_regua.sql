-- ==============================================================================
-- SCRIPT SQL: LIMPEZA DE ENTRADAS FALSAS E INTEGRAÇÃO DE OUTUBRO (R$ 810,00)
-- Execute este script no SQL Editor do seu Supabase Dashboard (https://supabase.com/dashboard)
-- ==============================================================================

-- 1. REMOVER TRANSAÇÕES FALSAS/SPAM DE FINANCE_TRANSACTIONS
-- Remove os lançamentos com hashes aleatórios gerados anteriormente (ex: VRGJRTZBVJHNLTUCIMRE)
DELETE FROM public.finance_transactions
WHERE description ~* '- [A-Z0-9]{8,}$'
   OR description ~* '[A-Z]{9,}'
   OR description ILIKE '%teste%'
   OR description ILIKE '%mock%'
   OR (type = 'income' AND date >= '2026-10-01' AND date < '2026-11-01');

-- 2. INSERIR AS 9 DOAÇÕES REAIS DE MANTENEDORES DE OUTUBRO/2026 (TOTAL: R$ 810,00)
INSERT INTO public.finance_transactions (description, amount, type, category_id, status, account, date) VALUES
('Doação Mensal (Mantenedor) - Lucas W O Santos', 90.00, 'income', 'cat_sponsorship', 'completed', 'Cartão de Crédito', '2026-10-20'),
('Doação Mensal (Mantenedor) - Jonathan C Martins', 90.00, 'income', 'cat_sponsorship', 'completed', 'Cartão de Crédito', '2026-10-20'),
('Doação Mensal (Mantenedor) - Diego Thomazinho Teixeira', 90.00, 'income', 'cat_sponsorship', 'completed', 'Cartão de Crédito', '2026-10-20'),
('Doação Mensal (Mantenedor) - LETICIA BERTOLINE', 90.00, 'income', 'cat_sponsorship', 'completed', 'Cartão de Crédito', '2026-10-20'),
('Doação Mensal (Mantenedor) - Gerson S Filho', 90.00, 'income', 'cat_sponsorship', 'completed', 'Cartão de Crédito', '2026-10-20'),
('Doação Mensal (Mantenedor) - FERNANDA CARMAGNANI RODRIGUES', 90.00, 'income', 'cat_sponsorship', 'completed', 'Cartão de Crédito', '2026-10-20'),
('Doação Mensal (Mantenedor) - Jessica Penido', 90.00, 'income', 'cat_sponsorship', 'completed', 'Cartão de Crédito', '2026-10-20'),
('Doação Mensal (Mantenedor) - Gabriel Bertoline', 90.00, 'income', 'cat_sponsorship', 'completed', 'Cartão de Crédito', '2026-10-20'),
('Doação Mensal (Mantenedor) - Adriano Pimenta', 90.00, 'income', 'cat_sponsorship', 'completed', 'Cartão de Crédito', '2026-10-20');

-- 3. GARANTIR EM 'donations' AS MESMAS 9 DOAÇÕES DE OUTUBRO PARA ALINHAMENTO COM A RÉGUA
DELETE FROM public.donations
WHERE created_at >= '2026-10-01' AND created_at < '2026-11-01';

INSERT INTO public.donations (donor_name, donor_email, amount, status, payment_method, is_sponsorship, created_at, paid_at) VALUES
('Lucas W O Santos', 'lucas.wagneer@gmail.com', 90.00, 'paid', 'credit_card', true, '2026-10-20T12:00:00Z', '2026-10-20T12:00:00Z'),
('Jonathan C Martins', 'jonata_xx@hotmail.com', 90.00, 'paid', 'credit_card', true, '2026-10-20T12:00:00Z', '2026-10-20T12:00:00Z'),
('Diego Thomazinho Teixeira', 'diegott@ymail.com', 90.00, 'paid', 'credit_card', true, '2026-10-20T12:00:00Z', '2026-10-20T12:00:00Z'),
('LETICIA BERTOLINE', 'messiasletic@gmail.com', 90.00, 'paid', 'credit_card', true, '2026-10-20T12:00:00Z', '2026-10-20T12:00:00Z'),
('Gerson S Filho', 'gerson.simionato@gmail.com', 90.00, 'paid', 'credit_card', true, '2026-10-20T12:00:00Z', '2026-10-20T12:00:00Z'),
('FERNANDA CARMAGNANI RODRIGUES', 'fe.carmagnani@hotmail.com', 90.00, 'paid', 'credit_card', true, '2026-10-20T12:00:00Z', '2026-10-20T12:00:00Z'),
('Jessica Penido', 'jesspenido@gmail.com', 90.00, 'paid', 'credit_card', true, '2026-10-20T12:00:00Z', '2026-10-20T12:00:00Z'),
('Gabriel Bertoline', 'gabrielbertoline1202@yahoo.com', 90.00, 'paid', 'credit_card', true, '2026-10-20T12:00:00Z', '2026-10-20T12:00:00Z'),
('Adriano Pimenta', 'pimenta.adriano@gmail.com', 90.00, 'paid', 'credit_card', true, '2026-10-20T12:00:00Z', '2026-10-20T12:00:00Z');

-- 4. ATUALIZAR O VALOR ATUAL DA RÉGUA DA CAMPANHA (FASE 1 - CASA NUTRI)
UPDATE public.campaigns
SET current_amount = 810.00,
    is_active = true
WHERE is_active = true;

-- Caso nenhuma campanha esteja com is_active = true, atualiza e ativa a primeira da lista
UPDATE public.campaigns
SET current_amount = 810.00,
    is_active = true
WHERE id IN (
  SELECT id FROM public.campaigns ORDER BY created_at ASC LIMIT 1
)
AND NOT EXISTS (SELECT 1 FROM public.campaigns WHERE is_active = true);

-- ==============================================================================
-- 5. CONFERÊNCIA DE ALINHAMENTO
-- ==============================================================================

-- A) Total de entradas em Outubro/2026 no Módulo Financeiro
SELECT 
  'Financeiro (Entradas Outubro)' as modulo,
  COUNT(*) as total_lancamentos,
  SUM(amount) as valor_total
FROM public.finance_transactions
WHERE type = 'income' AND date >= '2026-10-01' AND date < '2026-11-01';

-- B) Total de doações em Outubro/2026
SELECT 
  'Doações (Outubro)' as modulo,
  COUNT(*) as total_doacoes,
  SUM(amount) as valor_total
FROM public.donations
WHERE created_at >= '2026-10-01' AND created_at < '2026-11-01' AND status = 'paid';

-- C) Valor da Régua da Campanha Ativa
SELECT 
  'Régua da Campanha' as modulo,
  title as campanha,
  current_amount as arrecadado_regua,
  target_amount as meta
FROM public.campaigns
WHERE is_active = true
LIMIT 1;
