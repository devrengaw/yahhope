-- ==============================================================================
-- SCRIPT SQL: ATUALIZAÇÃO E VIRADA DO MÊS PARA NOVEMBRO/2026 (R$ 760,00 / R$ 810,00)
-- Execute este script no SQL Editor do seu Supabase Dashboard se desejar popular
-- diretamente as entradas e régua do novo ciclo de Novembro.
-- ==============================================================================

-- 1. INSERIR AS ENTRADAS REAIS DOS MANTENEDORES E PADRINHOS EM NOVEMBRO/2026 NO FINANCEIRO
-- (Evita duplicatas se já existirem transações de doação em novembro)
DELETE FROM public.finance_transactions
WHERE type = 'income' AND date >= '2026-11-01' AND date < '2026-12-01';

INSERT INTO public.finance_transactions (description, amount, type, category_id, status, account, date) VALUES
('Doação Mensal (Padrinho) - Jonathan C Martins', 300.00, 'income', 'cat_sponsorship', 'completed', 'Cartão de Crédito', '2026-11-15'),
('Doação Mensal (Padrinho) - Diego Thomazinho Teixeira', 120.00, 'income', 'cat_sponsorship', 'completed', 'Cartão de Crédito', '2026-11-15'),
('Doação Mensal (Padrinho) - Lucas W O Santos', 90.00, 'income', 'cat_sponsorship', 'completed', 'Cartão de Crédito', '2026-11-15'),
('Doação Pontual (Pix) - Lucas W O Santos', 50.00, 'income', 'cat_sponsorship', 'completed', 'Pix', '2026-11-15'),
('Doação Mensal (Mantenedor) - Leticia Bertoline', 50.00, 'income', 'cat_sponsorship', 'completed', 'Cartão de Crédito', '2026-11-15'),
('Doação Mensal (Mantenedor) - Gerson S Filho', 50.00, 'income', 'cat_sponsorship', 'completed', 'Cartão de Crédito', '2026-11-15'),
('Doação Mensal (Mantenedor) - Fernanda Carmagnani Rodrigues', 50.00, 'income', 'cat_sponsorship', 'completed', 'Cartão de Crédito', '2026-11-15'),
('Doação Mensal (Mantenedor) - Jessica Penido', 50.00, 'income', 'cat_sponsorship', 'completed', 'Cartão de Crédito', '2026-11-15'),
('Doação Mensal (Mantenedor) - Gabriel Bertoline', 50.00, 'income', 'cat_sponsorship', 'completed', 'Cartão de Crédito', '2026-11-15');

-- 2. SINCRONIZAR TABELA 'donations' COM AS MESMAS DOAÇÕES DE NOVEMBRO
DELETE FROM public.donations
WHERE created_at >= '2026-11-01' AND created_at < '2026-12-01';

INSERT INTO public.donations (donor_name, donor_email, amount, status, payment_method, is_sponsorship, created_at, paid_at, stripe_payment_id) VALUES
('Jonathan C Martins', 'jonata_xx@hotmail.com', 300.00, 'paid', 'credit_card', true, '2026-11-15T12:00:00Z', '2026-11-15T12:00:00Z', 'sub_stripe_jonathan_nov'),
('Diego Thomazinho Teixeira', 'diegott@ymail.com', 120.00, 'paid', 'credit_card', true, '2026-11-15T12:00:00Z', '2026-11-15T12:00:00Z', 'sub_stripe_diego_nov'),
('Lucas W O Santos', 'lucas.wagneer@gmail.com', 90.00, 'paid', 'credit_card', true, '2026-11-15T12:00:00Z', '2026-11-15T12:00:00Z', 'sub_stripe_lucas_nov'),
('Lucas W O Santos', 'lucas.wagneer@gmail.com', 50.00, 'paid', 'pix', false, '2026-11-15T12:00:00Z', '2026-11-15T12:00:00Z', 'pi_nov_pix_lucas'),
('Leticia Bertoline', 'messiasletic@gmail.com', 50.00, 'paid', 'credit_card', true, '2026-11-15T12:00:00Z', '2026-11-15T12:00:00Z', 'sub_stripe_leticia_nov'),
('Gerson S Filho', 'gerson.simionato@gmail.com', 50.00, 'paid', 'credit_card', true, '2026-11-15T12:00:00Z', '2026-11-15T12:00:00Z', 'sub_stripe_gerson_nov'),
('Fernanda Carmagnani Rodrigues', 'fe.carmagnani@hotmail.com', 50.00, 'paid', 'credit_card', true, '2026-11-15T12:00:00Z', '2026-11-15T12:00:00Z', 'sub_stripe_fernanda_nov'),
('Jessica Penido', 'jesspenido@gmail.com', 50.00, 'paid', 'credit_card', true, '2026-11-15T12:00:00Z', '2026-11-15T12:00:00Z', 'sub_stripe_jessica_nov'),
('Gabriel Bertoline', 'gabrielbertoline1202@yahoo.com', 50.00, 'paid', 'credit_card', true, '2026-11-15T12:00:00Z', '2026-11-15T12:00:00Z', 'sub_stripe_gabriel_nov');

-- 3. ATUALIZAR VALOR DA RÉGUA DA CAMPANHA ATIVA PARA NOVEMBRO
UPDATE public.campaigns
SET current_amount = 810.00,
    is_active = true
WHERE is_active = true;

-- 4. CONFERÊNCIA DE NOVEMBRO
SELECT 
  'Financeiro (Entradas Novembro)' as modulo,
  COUNT(*) as total_lancamentos,
  SUM(amount) as valor_total
FROM public.finance_transactions
WHERE type = 'income' AND date >= '2026-11-01' AND date < '2026-12-01';
