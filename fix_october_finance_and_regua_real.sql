-- ==============================================================================
-- SCRIPT SQL DEFINITIVO: CORREÇÃO DAS ENTRADAS REAIS STRIPE (R$ 810,00),
-- RÉGUA DE ARRECADAÇÃO E SEPARAÇÃO DE PADRINHOS VS MANTENEDORES
-- Execute este script no SQL Editor do seu Supabase Dashboard (https://supabase.com/dashboard)
-- ==============================================================================

DO $$
DECLARE
  v_child1 UUID;
  v_child2 UUID;
  v_child3 UUID;
  v_u_lucas UUID;
  v_u_jonathan UUID;
  v_u_diego UUID;
  v_u_leticia UUID;
  v_u_gerson UUID;
  v_u_fernanda UUID;
  v_u_jessica UUID;
  v_u_gabriel UUID;
  v_first_camp_id UUID;
BEGIN
  -- ----------------------------------------------------------------------------
  -- 1. LIMPEZA DAS ENTRADAS FALSAS DE 20/10/2026 E TRANSAÇÕES INCORRETAS
  -- ----------------------------------------------------------------------------
  DELETE FROM public.finance_transactions
  WHERE date = '2026-10-20'
     OR (type = 'income' AND date >= '2026-10-01' AND date < '2026-11-01')
     OR description ILIKE '%VRGJRT%'
     OR description ILIKE '%teste%'
     OR description ILIKE '%mock%';

  -- ----------------------------------------------------------------------------
  -- 2. INSERIR AS 9 ENTRADAS REAIS DO STRIPE DE OUTUBRO/2026 NO MÓDULO FINANCEIRO
  -- Total Exato: R$ 810,00
  -- ----------------------------------------------------------------------------
  INSERT INTO public.finance_transactions (description, amount, type, category_id, status, account, date) VALUES
  ('Doação Mensal (Padrinho) - Jonathan C Martins', 300.00, 'income', 'cat_sponsorship', 'completed', 'Cartão de Crédito', '2026-10-21'),
  ('Doação Mensal (Padrinho) - Diego Thomazinho Teixeira', 120.00, 'income', 'cat_sponsorship', 'completed', 'Cartão de Crédito', '2026-10-21'),
  ('Doação Mensal (Padrinho) - Lucas W O Santos', 90.00, 'income', 'cat_sponsorship', 'completed', 'Cartão de Crédito', '2026-10-21'),
  ('Doação Pontual (Pix) - Lucas W O Santos', 50.00, 'income', 'cat_sponsorship', 'completed', 'Pix', '2026-10-21'),
  ('Doação Mensal (Mantenedor) - Leticia Bertoline', 50.00, 'income', 'cat_sponsorship', 'completed', 'Cartão de Crédito', '2026-10-21'),
  ('Doação Mensal (Mantenedor) - Gerson S Filho', 50.00, 'income', 'cat_sponsorship', 'completed', 'Cartão de Crédito', '2026-10-21'),
  ('Doação Mensal (Mantenedor) - Fernanda Carmagnani Rodrigues', 50.00, 'income', 'cat_sponsorship', 'completed', 'Cartão de Crédito', '2026-10-21'),
  ('Doação Mensal (Mantenedor) - Jessica Penido', 50.00, 'income', 'cat_sponsorship', 'completed', 'Cartão de Crédito', '2026-10-21'),
  ('Doação Mensal (Mantenedor) - Gabriel Bertoline', 50.00, 'income', 'cat_sponsorship', 'completed', 'Cartão de Crédito', '2026-10-21');

  -- ----------------------------------------------------------------------------
  -- 3. ALINHAR TABELA 'donations' COM AS MESMAS 9 DOAÇÕES REAIS DE OUTUBRO
  -- Total Exato: R$ 810,00
  -- ----------------------------------------------------------------------------
  DELETE FROM public.donations
  WHERE created_at >= '2026-10-01' AND created_at < '2026-11-01';

  INSERT INTO public.donations (donor_name, donor_email, amount, status, payment_method, is_sponsorship, created_at, paid_at, stripe_payment_id) VALUES
  ('Jonathan C Martins', 'jonata_xx@hotmail.com', 300.00, 'paid', 'credit_card', true, '2026-10-21T12:00:00Z', '2026-10-21T12:00:00Z', 'sub_stripe_jonathan'),
  ('Diego Thomazinho Teixeira', 'diegott@ymail.com', 120.00, 'paid', 'credit_card', true, '2026-10-21T12:00:00Z', '2026-10-21T12:00:00Z', 'sub_stripe_diego'),
  ('Lucas W O Santos', 'lucas.wagneer@gmail.com', 90.00, 'paid', 'credit_card', true, '2026-10-21T12:00:00Z', '2026-10-21T12:00:00Z', 'sub_stripe_lucas'),
  ('Lucas W O Santos', 'lucas.wagneer@gmail.com', 50.00, 'paid', 'pix', false, '2026-10-21T12:00:00Z', '2026-10-21T12:00:00Z', 'pi_3UNlo64meADio8qE0TusvSwl'),
  ('Leticia Bertoline', 'messiasletic@gmail.com', 50.00, 'paid', 'credit_card', true, '2026-10-21T12:00:00Z', '2026-10-21T12:00:00Z', 'sub_stripe_leticia'),
  ('Gerson S Filho', 'gerson.simionato@gmail.com', 50.00, 'paid', 'credit_card', true, '2026-10-21T12:00:00Z', '2026-10-21T12:00:00Z', 'sub_stripe_gerson'),
  ('Fernanda Carmagnani Rodrigues', 'fe.carmagnani@hotmail.com', 50.00, 'paid', 'credit_card', true, '2026-10-21T12:00:00Z', '2026-10-21T12:00:00Z', 'sub_stripe_fernanda'),
  ('Jessica Penido', 'jesspenido@gmail.com', 50.00, 'paid', 'credit_card', true, '2026-10-21T12:00:00Z', '2026-10-21T12:00:00Z', 'sub_stripe_jessica'),
  ('Gabriel Bertoline', 'gabrielbertoline1202@yahoo.com', 50.00, 'paid', 'credit_card', true, '2026-10-21T12:00:00Z', '2026-10-21T12:00:00Z', 'sub_stripe_gabriel');

  -- ----------------------------------------------------------------------------
  -- 4. ATUALIZAR PAPÉIS EM 'users':
  --    - 3 PADRINHOS REAIS: role = 'SPONSOR'
  --    - 5 MANTENEDORES MENSAIS: role = 'MANTENEDOR'
  -- ----------------------------------------------------------------------------
  -- Padrinho 1: Lucas
  SELECT id INTO v_u_lucas FROM public.users WHERE LOWER(TRIM(email)) = 'lucas.wagneer@gmail.com' LIMIT 1;
  IF v_u_lucas IS NOT NULL THEN
    UPDATE public.users SET role = 'SPONSOR', name = 'Lucas W O Santos' WHERE id = v_u_lucas;
  ELSE
    INSERT INTO public.users (name, email, role) VALUES ('Lucas W O Santos', 'lucas.wagneer@gmail.com', 'SPONSOR') RETURNING id INTO v_u_lucas;
  END IF;

  -- Padrinho 2: Jonathan
  SELECT id INTO v_u_jonathan FROM public.users WHERE LOWER(TRIM(email)) = 'jonata_xx@hotmail.com' LIMIT 1;
  IF v_u_jonathan IS NOT NULL THEN
    UPDATE public.users SET role = 'SPONSOR', name = 'Jonathan C Martins' WHERE id = v_u_jonathan;
  ELSE
    INSERT INTO public.users (name, email, role) VALUES ('Jonathan C Martins', 'jonata_xx@hotmail.com', 'SPONSOR') RETURNING id INTO v_u_jonathan;
  END IF;

  -- Padrinho 3: Diego
  SELECT id INTO v_u_diego FROM public.users WHERE LOWER(TRIM(email)) = 'diegott@ymail.com' LIMIT 1;
  IF v_u_diego IS NOT NULL THEN
    UPDATE public.users SET role = 'SPONSOR', name = 'Diego Thomazinho Teixeira' WHERE id = v_u_diego;
  ELSE
    INSERT INTO public.users (name, email, role) VALUES ('Diego Thomazinho Teixeira', 'diegott@ymail.com', 'SPONSOR') RETURNING id INTO v_u_diego;
  END IF;

  -- Mantenedor 1: Leticia
  SELECT id INTO v_u_leticia FROM public.users WHERE LOWER(TRIM(email)) = 'messiasletic@gmail.com' LIMIT 1;
  IF v_u_leticia IS NOT NULL THEN
    UPDATE public.users SET role = 'MANTENEDOR', name = 'Leticia Bertoline' WHERE id = v_u_leticia;
  ELSE
    INSERT INTO public.users (name, email, role) VALUES ('Leticia Bertoline', 'messiasletic@gmail.com', 'MANTENEDOR') RETURNING id INTO v_u_leticia;
  END IF;

  -- Mantenedor 2: Gerson
  SELECT id INTO v_u_gerson FROM public.users WHERE LOWER(TRIM(email)) = 'gerson.simionato@gmail.com' LIMIT 1;
  IF v_u_gerson IS NOT NULL THEN
    UPDATE public.users SET role = 'MANTENEDOR', name = 'Gerson S Filho' WHERE id = v_u_gerson;
  ELSE
    INSERT INTO public.users (name, email, role) VALUES ('Gerson S Filho', 'gerson.simionato@gmail.com', 'MANTENEDOR') RETURNING id INTO v_u_gerson;
  END IF;

  -- Mantenedor 3: Fernanda
  SELECT id INTO v_u_fernanda FROM public.users WHERE LOWER(TRIM(email)) = 'fe.carmagnani@hotmail.com' LIMIT 1;
  IF v_u_fernanda IS NOT NULL THEN
    UPDATE public.users SET role = 'MANTENEDOR', name = 'Fernanda Carmagnani Rodrigues' WHERE id = v_u_fernanda;
  ELSE
    INSERT INTO public.users (name, email, role) VALUES ('Fernanda Carmagnani Rodrigues', 'fe.carmagnani@hotmail.com', 'MANTENEDOR') RETURNING id INTO v_u_fernanda;
  END IF;

  -- Mantenedor 4: Jessica
  SELECT id INTO v_u_jessica FROM public.users WHERE LOWER(TRIM(email)) = 'jesspenido@gmail.com' LIMIT 1;
  IF v_u_jessica IS NOT NULL THEN
    UPDATE public.users SET role = 'MANTENEDOR', name = 'Jessica Penido' WHERE id = v_u_jessica;
  ELSE
    INSERT INTO public.users (name, email, role) VALUES ('Jessica Penido', 'jesspenido@gmail.com', 'MANTENEDOR') RETURNING id INTO v_u_jessica;
  END IF;

  -- Mantenedor 5: Gabriel
  SELECT id INTO v_u_gabriel FROM public.users WHERE LOWER(TRIM(email)) = 'gabrielbertoline1202@yahoo.com' LIMIT 1;
  IF v_u_gabriel IS NOT NULL THEN
    UPDATE public.users SET role = 'MANTENEDOR', name = 'Gabriel Bertoline' WHERE id = v_u_gabriel;
  ELSE
    INSERT INTO public.users (name, email, role) VALUES ('Gabriel Bertoline', 'gabrielbertoline1202@yahoo.com', 'MANTENEDOR') RETURNING id INTO v_u_gabriel;
  END IF;

  -- Garante role 'USER' para Adriano Pimenta ou outros que não sejam apoiadores ativos deste mês
  UPDATE public.users
  SET role = 'USER'
  WHERE LOWER(TRIM(email)) NOT IN (
    'lucas.wagneer@gmail.com',
    'jonata_xx@hotmail.com',
    'diegott@ymail.com',
    'messiasletic@gmail.com',
    'gerson.simionato@gmail.com',
    'fe.carmagnani@hotmail.com',
    'jesspenido@gmail.com',
    'gabrielbertoline1202@yahoo.com'
  )
  AND role IN ('SPONSOR', 'MANTENEDOR', 'PADRINHO');

  -- ----------------------------------------------------------------------------
  -- 5. CONFIGURAR 'sponsorships':
  --    - 3 PADRINHOS COM CRIANÇAS VINCULADAS
  --    - 5 MANTENEDORES MENSAIS DE APOIO GERAL (child_id = NULL, R$ 50,00)
  -- ----------------------------------------------------------------------------
  -- Seleciona 3 crianças distintas
  SELECT id INTO v_child1 FROM public.children ORDER BY name ASC LIMIT 1 OFFSET 0;
  SELECT id INTO v_child2 FROM public.children ORDER BY name ASC LIMIT 1 OFFSET 1;
  SELECT id INTO v_child3 FROM public.children ORDER BY name ASC LIMIT 1 OFFSET 2;

  -- Limpa apadrinhamentos antigos ou indevidos dos 8 e-mails
  DELETE FROM public.sponsorships
  WHERE LOWER(TRIM(donor_email)) IN (
    'lucas.wagneer@gmail.com',
    'jonata_xx@hotmail.com',
    'diegott@ymail.com',
    'messiasletic@gmail.com',
    'gerson.simionato@gmail.com',
    'fe.carmagnani@hotmail.com',
    'jesspenido@gmail.com',
    'gabrielbertoline1202@yahoo.com',
    'pimenta.adriano@gmail.com'
  );

  -- Remove qualquer sponsorship de Adriano Pimenta
  DELETE FROM public.sponsorships WHERE LOWER(TRIM(donor_email)) ILIKE '%pimenta%';

  -- Insere os 3 Padrinhos Reais
  INSERT INTO public.sponsorships (sponsor_id, child_id, donor_name, donor_email, monthly_amount, quotas_count, status, payment_method, stripe_subscription_id)
  VALUES 
  (v_u_lucas, v_child1, 'Lucas W O Santos', 'lucas.wagneer@gmail.com', 90.00, 1, 'active', 'credit_card', 'sub_stripe_lucas'),
  (v_u_jonathan, v_child2, 'Jonathan C Martins', 'jonata_xx@hotmail.com', 300.00, 3, 'active', 'credit_card', 'sub_stripe_jonathan'),
  (v_u_diego, v_child3, 'Diego Thomazinho Teixeira', 'diegott@ymail.com', 120.00, 1, 'active', 'credit_card', 'sub_stripe_diego');

  -- Insere os 5 Mantenedores Mensais (SEM criança vinculada: child_id = NULL)
  INSERT INTO public.sponsorships (sponsor_id, child_id, donor_name, donor_email, monthly_amount, quotas_count, status, payment_method, stripe_subscription_id)
  VALUES 
  (v_u_leticia, NULL, 'Leticia Bertoline', 'messiasletic@gmail.com', 50.00, 1, 'active', 'credit_card', 'sub_stripe_leticia'),
  (v_u_gerson, NULL, 'Gerson S Filho', 'gerson.simionato@gmail.com', 50.00, 1, 'active', 'credit_card', 'sub_stripe_gerson'),
  (v_u_fernanda, NULL, 'Fernanda Carmagnani Rodrigues', 'fe.carmagnani@hotmail.com', 50.00, 1, 'active', 'credit_card', 'sub_stripe_fernanda'),
  (v_u_jessica, NULL, 'Jessica Penido', 'jesspenido@gmail.com', 50.00, 1, 'active', 'credit_card', 'sub_stripe_jessica'),
  (v_u_gabriel, NULL, 'Gabriel Bertoline', 'gabrielbertoline1202@yahoo.com', 50.00, 1, 'active', 'credit_card', 'sub_stripe_gabriel');

  -- ----------------------------------------------------------------------------
  -- 6. CORRIGIR A RÉGUA DE ARRECADAÇÃO (TABELA 'campaigns'):
  --    - Fase 1 (Custos Operacionais YAH Hope): R$ 810,00
  --    - Fases 2 e 3 (Infraestrutura, Compra de Moto): R$ 0,00
  -- ----------------------------------------------------------------------------
  -- Localiza a Fase 1 ativa
  SELECT id INTO v_first_camp_id 
  FROM public.campaigns 
  WHERE is_active = true 
  ORDER BY priority ASC, created_at ASC 
  LIMIT 1;

  IF v_first_camp_id IS NULL THEN
    SELECT id INTO v_first_camp_id 
    FROM public.campaigns 
    ORDER BY priority ASC, created_at ASC 
    LIMIT 1;
  END IF;

  -- Atualiza a Fase 1 para exatamente R$ 810,00
  IF v_first_camp_id IS NOT NULL THEN
    UPDATE public.campaigns
    SET current_amount = 810.00,
        is_active = true
    WHERE id = v_first_camp_id;

    -- Zera as outras campanhas (Fase 2 e Fase 3) para evitar triplicar na régua cumulativa
    UPDATE public.campaigns
    SET current_amount = 0.00
    WHERE id <> v_first_camp_id;
  END IF;

END $$;

-- ==============================================================================
-- 7. CONSULTAS DE CONFERÊNCIA E VERIFICAÇÃO FINAL
-- ==============================================================================

-- A) Entradas de Outubro no Módulo Financeiro (Deve dar R$ 810,00 e 9 lançamentos)
SELECT 
  'Módulo Financeiro (Outubro)' as modulo,
  COUNT(*) as total_lancamentos,
  SUM(amount) as total_entradas
FROM public.finance_transactions
WHERE type = 'income' AND date >= '2026-10-01' AND date < '2026-11-01';

-- B) Listagem detalhada das transações de Outubro
SELECT date, description, amount, status, account 
FROM public.finance_transactions 
WHERE type = 'income' AND date >= '2026-10-01' AND date < '2026-11-01'
ORDER BY amount DESC;

-- C) Doações de Outubro
SELECT 
  'Tabela Donations (Outubro)' as modulo,
  COUNT(*) as total_doacoes,
  SUM(amount) as total_arrecadado
FROM public.donations
WHERE created_at >= '2026-10-01' AND created_at < '2026-11-01' AND status = 'paid';

-- D) Resumo de Padrinhos (com criança) vs Mantenedores (sem criança)
SELECT 
  CASE 
    WHEN s.child_id IS NOT NULL THEN '💖 Padrinho (Criança Vinculada - cota >= 90)'
    ELSE '🔄 Mantenedor Mensal (Apoio Geral - R$ 50)'
  END AS categoria,
  COUNT(*) AS total_apoiadores,
  SUM(s.monthly_amount) AS arrecadacao_mensal
FROM public.sponsorships s
GROUP BY 1;

-- E) Régua das Campanhas
SELECT 
  id,
  title as campanha,
  current_amount as valor_arrecadado,
  target_amount as meta,
  is_active as ativo
FROM public.campaigns
ORDER BY priority ASC, created_at ASC;
