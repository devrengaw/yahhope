-- ==============================================================================
-- SCRIPT SQL DEFINITIVO: CONFIGURAÇÃO EXATA DOS 3 PADRINHOS E 5 MANTENEDORES
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
BEGIN
  -- 1. Obter 3 crianças distintas da tabela children
  SELECT id INTO v_child1 FROM public.children ORDER BY name ASC LIMIT 1 OFFSET 0;
  SELECT id INTO v_child2 FROM public.children ORDER BY name ASC LIMIT 1 OFFSET 1;
  SELECT id INTO v_child3 FROM public.children ORDER BY name ASC LIMIT 1 OFFSET 2;

  -- 2. Garantir cadastro e ID dos 3 Padrinhos em public.users
  -- Lucas Wagner
  SELECT id INTO v_u_lucas FROM public.users WHERE LOWER(TRIM(email)) = 'lucas.wagneer@gmail.com' LIMIT 1;
  IF v_u_lucas IS NULL THEN
    INSERT INTO public.users (name, email, role) VALUES ('Lucas W O Santos', 'lucas.wagneer@gmail.com', 'SPONSOR') RETURNING id INTO v_u_lucas;
  ELSE
    UPDATE public.users SET role = 'SPONSOR', name = COALESCE(name, 'Lucas W O Santos') WHERE id = v_u_lucas;
  END IF;

  -- Jonathan C Martins
  SELECT id INTO v_u_jonathan FROM public.users WHERE LOWER(TRIM(email)) = 'jonata_xx@hotmail.com' LIMIT 1;
  IF v_u_jonathan IS NULL THEN
    INSERT INTO public.users (name, email, role) VALUES ('Jonathan C Martins', 'jonata_xx@hotmail.com', 'SPONSOR') RETURNING id INTO v_u_jonathan;
  ELSE
    UPDATE public.users SET role = 'SPONSOR', name = COALESCE(name, 'Jonathan C Martins') WHERE id = v_u_jonathan;
  END IF;

  -- Diego Thomazinho
  SELECT id INTO v_u_diego FROM public.users WHERE LOWER(TRIM(email)) = 'diegott@ymail.com' LIMIT 1;
  IF v_u_diego IS NULL THEN
    INSERT INTO public.users (name, email, role) VALUES ('Diego Thomazinho Teixeira', 'diegott@ymail.com', 'SPONSOR') RETURNING id INTO v_u_diego;
  ELSE
    UPDATE public.users SET role = 'SPONSOR', name = COALESCE(name, 'Diego Thomazinho Teixeira') WHERE id = v_u_diego;
  END IF;

  -- 3. Garantir cadastro e ID dos 5 Mantenedores Mensais em public.users
  -- Letícia Bertoline
  SELECT id INTO v_u_leticia FROM public.users WHERE LOWER(TRIM(email)) = 'messiasletic@gmail.com' LIMIT 1;
  IF v_u_leticia IS NULL THEN
    INSERT INTO public.users (name, email, role) VALUES ('LETICIA BERTOLINE', 'messiasletic@gmail.com', 'MANTENEDOR') RETURNING id INTO v_u_leticia;
  ELSE
    UPDATE public.users SET role = 'MANTENEDOR' WHERE id = v_u_leticia;
  END IF;

  -- Gerson S Filho
  SELECT id INTO v_u_gerson FROM public.users WHERE LOWER(TRIM(email)) = 'gerson.simionato@gmail.com' LIMIT 1;
  IF v_u_gerson IS NULL THEN
    INSERT INTO public.users (name, email, role) VALUES ('Gerson S Filho', 'gerson.simionato@gmail.com', 'MANTENEDOR') RETURNING id INTO v_u_gerson;
  ELSE
    UPDATE public.users SET role = 'MANTENEDOR' WHERE id = v_u_gerson;
  END IF;

  -- Fernanda Carmagnani
  SELECT id INTO v_u_fernanda FROM public.users WHERE LOWER(TRIM(email)) = 'fe.carmagnani@hotmail.com' LIMIT 1;
  IF v_u_fernanda IS NULL THEN
    INSERT INTO public.users (name, email, role) VALUES ('FERNANDA CARMAGNANI RODRIGUES', 'fe.carmagnani@hotmail.com', 'MANTENEDOR') RETURNING id INTO v_u_fernanda;
  ELSE
    UPDATE public.users SET role = 'MANTENEDOR' WHERE id = v_u_fernanda;
  END IF;

  -- Jessica Penido
  SELECT id INTO v_u_jessica FROM public.users WHERE LOWER(TRIM(email)) = 'jesspenido@gmail.com' LIMIT 1;
  IF v_u_jessica IS NULL THEN
    INSERT INTO public.users (name, email, role) VALUES ('Jessica Penido', 'jesspenido@gmail.com', 'MANTENEDOR') RETURNING id INTO v_u_jessica;
  ELSE
    UPDATE public.users SET role = 'MANTENEDOR' WHERE id = v_u_jessica;
  END IF;

  -- Gabriel Bertoline
  SELECT id INTO v_u_gabriel FROM public.users WHERE LOWER(TRIM(email)) = 'gabrielbertoline1202@yahoo.com' LIMIT 1;
  IF v_u_gabriel IS NULL THEN
    INSERT INTO public.users (name, email, role) VALUES ('Gabriel Bertoline', 'gabrielbertoline1202@yahoo.com', 'MANTENEDOR') RETURNING id INTO v_u_gabriel;
  ELSE
    UPDATE public.users SET role = 'MANTENEDOR' WHERE id = v_u_gabriel;
  END IF;

  -- 4. Definir como USER todos os demais usuários (doações avulsas/pontuais)
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

  -- 5. Limpar completamente de 'sponsorships' qualquer registro que NÃO seja dos 8 oficiais
  DELETE FROM public.sponsorships
  WHERE LOWER(TRIM(COALESCE(donor_email, ''))) NOT IN (
    'lucas.wagneer@gmail.com',
    'jonata_xx@hotmail.com',
    'diegott@ymail.com',
    'messiasletic@gmail.com',
    'gerson.simionato@gmail.com',
    'fe.carmagnani@hotmail.com',
    'jesspenido@gmail.com',
    'gabrielbertoline1202@yahoo.com'
  );

  -- 6. Configurar ou Inserir os 3 PADRINHOS REAIS em sponsorships (R$ 90, cota com criança)
  -- Lucas Wagner
  DELETE FROM public.sponsorships WHERE LOWER(TRIM(donor_email)) = 'lucas.wagneer@gmail.com';
  INSERT INTO public.sponsorships (sponsor_id, child_id, donor_name, donor_email, monthly_amount, quotas_count, status, payment_method, stripe_subscription_id)
  VALUES (v_u_lucas, v_child1, 'Lucas W O Santos', 'lucas.wagneer@gmail.com', 90.00, 1, 'active', 'credit_card', 'sub_stripe_lucas');

  -- Jonathan C Martins
  DELETE FROM public.sponsorships WHERE LOWER(TRIM(donor_email)) = 'jonata_xx@hotmail.com';
  INSERT INTO public.sponsorships (sponsor_id, child_id, donor_name, donor_email, monthly_amount, quotas_count, status, payment_method, stripe_subscription_id)
  VALUES (v_u_jonathan, v_child2, 'Jonathan C Martins', 'jonata_xx@hotmail.com', 90.00, 1, 'active', 'credit_card', 'sub_stripe_jonathan');

  -- Diego Thomazinho
  DELETE FROM public.sponsorships WHERE LOWER(TRIM(donor_email)) = 'diegott@ymail.com';
  INSERT INTO public.sponsorships (sponsor_id, child_id, donor_name, donor_email, monthly_amount, quotas_count, status, payment_method, stripe_subscription_id)
  VALUES (v_u_diego, v_child3, 'Diego Thomazinho Teixeira', 'diegott@ymail.com', 90.00, 1, 'active', 'credit_card', 'sub_stripe_diego');

  -- 7. Configurar ou Inserir os 5 MANTENEDORES MENSAIS em sponsorships (R$ 50, child_id = NULL)
  -- Letícia Bertoline
  DELETE FROM public.sponsorships WHERE LOWER(TRIM(donor_email)) = 'messiasletic@gmail.com';
  INSERT INTO public.sponsorships (sponsor_id, child_id, donor_name, donor_email, monthly_amount, quotas_count, status, payment_method, stripe_subscription_id)
  VALUES (v_u_leticia, NULL, 'LETICIA BERTOLINE', 'messiasletic@gmail.com', 50.00, 1, 'active', 'credit_card', 'sub_stripe_leticia');

  -- Gerson S Filho
  DELETE FROM public.sponsorships WHERE LOWER(TRIM(donor_email)) = 'gerson.simionato@gmail.com';
  INSERT INTO public.sponsorships (sponsor_id, child_id, donor_name, donor_email, monthly_amount, quotas_count, status, payment_method, stripe_subscription_id)
  VALUES (v_u_gerson, NULL, 'Gerson S Filho', 'gerson.simionato@gmail.com', 50.00, 1, 'active', 'credit_card', 'sub_stripe_gerson');

  -- Fernanda Carmagnani
  DELETE FROM public.sponsorships WHERE LOWER(TRIM(donor_email)) = 'fe.carmagnani@hotmail.com';
  INSERT INTO public.sponsorships (sponsor_id, child_id, donor_name, donor_email, monthly_amount, quotas_count, status, payment_method, stripe_subscription_id)
  VALUES (v_u_fernanda, NULL, 'FERNANDA CARMAGNANI RODRIGUES', 'fe.carmagnani@hotmail.com', 50.00, 1, 'active', 'credit_card', 'sub_stripe_fernanda');

  -- Jessica Penido
  DELETE FROM public.sponsorships WHERE LOWER(TRIM(donor_email)) = 'jesspenido@gmail.com';
  INSERT INTO public.sponsorships (sponsor_id, child_id, donor_name, donor_email, monthly_amount, quotas_count, status, payment_method, stripe_subscription_id)
  VALUES (v_u_jessica, NULL, 'Jessica Penido', 'jesspenido@gmail.com', 50.00, 1, 'active', 'credit_card', 'sub_stripe_jessica');

  -- Gabriel Bertoline
  DELETE FROM public.sponsorships WHERE LOWER(TRIM(donor_email)) = 'gabrielbertoline1202@yahoo.com';
  INSERT INTO public.sponsorships (sponsor_id, child_id, donor_name, donor_email, monthly_amount, quotas_count, status, payment_method, stripe_subscription_id)
  VALUES (v_u_gabriel, NULL, 'Gabriel Bertoline', 'gabrielbertoline1202@yahoo.com', 50.00, 1, 'active', 'credit_card', 'sub_stripe_gabriel');

END $$;

-- ==============================================================================
-- CONSULTA DE CONFERÊNCIA FINAL: RESUMO CONSOLIDADO
-- ==============================================================================
SELECT 
  CASE 
    WHEN s.child_id IS NOT NULL AND COALESCE(s.monthly_amount, 0) >= 90 THEN '💖 Padrinho (Criança Vinculada - R$ 90)'
    ELSE '🔄 Mantenedor Mensal (Apoio Geral - R$ 50)'
  END AS modalidade,
  COUNT(*) AS total_apoiadores,
  SUM(COALESCE(s.monthly_amount, 0)) AS arrecadacao_mensal_recorrente
FROM public.sponsorships s
GROUP BY 1
ORDER BY total_apoiadores DESC;
