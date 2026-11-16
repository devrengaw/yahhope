-- ==============================================================================
-- AUTOMAÇÃO DE VIRADA MENSAL FINANCEIRA (YAH HOPE & PROJETOS)
-- ==============================================================================
-- Este script cria uma função PostgreSQL no Supabase que pode ser executada:
-- 1. Manualmente a qualquer momento (para o mês atual ou qualquer mês específico);
-- 2. Automaticamente todo dia 1º de cada mês via pg_cron.
--
-- O que esta rotina faz a cada virada de mês:
--   A) Renova todos os Custos Fixos Operacionais (YAH Hope, Casa Nutri, Comunicação)
--      com status 'pending' (a vencer / a pagar) para o novo ciclo.
--   B) Lança as doações recorrentes ativas dos 8 Mantenedores e Padrinhos (R$ 760/810).
--   C) Alinha a tabela 'donations' para o Portal do Doador e recibos.
--   D) Recalcula a régua da campanha ativa para o total arrecadado no mês.
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.virada_mes_financeiro(p_data_referencia DATE DEFAULT CURRENT_DATE)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_inicio_mes TIMESTAMP WITH TIME ZONE;
  v_fim_mes TIMESTAMP WITH TIME ZONE;
  v_total_doacoes NUMERIC(10, 2);
  v_custos_fixos_gerados INT := 0;
  v_entradas_geradas INT := 0;
  v_campanha_titulo TEXT;
BEGIN
  -- 1. Determina os limites do mês (ex: 2026-11-01 00:00:00 até 2026-12-01 00:00:00)
  v_inicio_mes := date_trunc('month', p_data_referencia::timestamp with time zone);
  v_fim_mes := v_inicio_mes + INTERVAL '1 month';

  -- 2. RENOVAÇÃO DE ENTRADAS REAIS (MANTENEDORES E PADRINHOS ATIVOS)
  -- Insere as contribuições ativas caso ainda não existam no mês corrente
  INSERT INTO public.finance_transactions (description, amount, type, category_id, status, account, date, recurrence, module)
  SELECT 
    d.desc_tx,
    d.val,
    'income',
    'cat_sponsorship',
    'completed',
    'Cartão de Crédito',
    (v_inicio_mes + INTERVAL '14 days')::date,
    'monthly',
    'global'
  FROM (
    VALUES 
      ('Doação Mensal (Padrinho) - Jonathan C Martins', 300.00),
      ('Doação Mensal (Padrinho) - Diego Thomazinho Teixeira', 120.00),
      ('Doação Mensal (Padrinho) - Lucas W O Santos', 90.00),
      ('Doação Pontual (Pix) - Lucas W O Santos', 50.00),
      ('Doação Mensal (Mantenedor) - Leticia Bertoline', 50.00),
      ('Doação Mensal (Mantenedor) - Gerson S Filho', 50.00),
      ('Doação Mensal (Mantenedor) - Fernanda Carmagnani Rodrigues', 50.00),
      ('Doação Mensal (Mantenedor) - Jessica Penido', 50.00),
      ('Doação Mensal (Mantenedor) - Gabriel Bertoline', 50.00)
  ) AS d(desc_tx, val)
  WHERE NOT EXISTS (
    SELECT 1 FROM public.finance_transactions ft
    WHERE ft.type = 'income'
      AND ft.description = d.desc_tx
      AND ft.date >= v_inicio_mes 
      AND ft.date < v_fim_mes
  );

  GET DIAGNOSTICS v_entradas_geradas = ROW_COUNT;

  -- 3. SINCRONIZAÇÃO NA TABELA DONATIONS (PARA A RÉGUA DA CASA NUTRI E PORTAL)
  INSERT INTO public.donations (donor_name, donor_email, amount, status, payment_method, is_sponsorship, created_at, paid_at, stripe_payment_id)
  SELECT 
    d.nome,
    d.email,
    d.val,
    'paid',
    d.metodo,
    d.is_sp,
    (v_inicio_mes + INTERVAL '14 days 12 hours'),
    (v_inicio_mes + INTERVAL '14 days 12 hours'),
    d.stripe_id || '_' || to_char(v_inicio_mes, 'YYYY_MM')
  FROM (
    VALUES
      ('Jonathan C Martins', 'jonata_xx@hotmail.com', 300.00, 'credit_card', true, 'sub_stripe_jonathan'),
      ('Diego Thomazinho Teixeira', 'diegott@ymail.com', 120.00, 'credit_card', true, 'sub_stripe_diego'),
      ('Lucas W O Santos', 'lucas.wagneer@gmail.com', 90.00, 'credit_card', true, 'sub_stripe_lucas'),
      ('Lucas W O Santos', 'lucas.wagneer@gmail.com', 50.00, 'pix', false, 'pi_pix_lucas'),
      ('Leticia Bertoline', 'messiasletic@gmail.com', 50.00, 'credit_card', true, 'sub_stripe_leticia'),
      ('Gerson S Filho', 'gerson.simionato@gmail.com', 50.00, 'credit_card', true, 'sub_stripe_gerson'),
      ('Fernanda Carmagnani Rodrigues', 'fe.carmagnani@hotmail.com', 50.00, 'credit_card', true, 'sub_stripe_fernanda'),
      ('Jessica Penido', 'jesspenido@gmail.com', 50.00, 'credit_card', true, 'sub_stripe_jessica'),
      ('Gabriel Bertoline', 'gabrielbertoline1202@yahoo.com', 50.00, 'credit_card', true, 'sub_stripe_gabriel')
  ) AS d(nome, email, val, metodo, is_sp, stripe_id)
  WHERE NOT EXISTS (
    SELECT 1 FROM public.donations don
    WHERE don.donor_email = d.email
      AND don.amount = d.val
      AND don.created_at >= v_inicio_mes
      AND don.created_at < v_fim_mes
  );

  -- 4. RENOVAÇÃO DINÂMICA DE CUSTOS FIXOS (YAH HOPE CENTRAL, CASA NUTRI E PROJETOS)
  -- Pega qualquer custo fixo já cadastrado em meses anteriores e renova como 'pending' (a pagar) para o novo mês
  INSERT INTO public.finance_transactions (
    description,
    amount,
    type,
    category_id,
    date,
    status,
    account,
    expense_type,
    recurrence,
    module,
    notes,
    currency,
    original_amount,
    exchange_rate
  )
  SELECT DISTINCT ON (TRIM(LOWER(ft.description)), COALESCE(ft.module, 'global'), TRIM(LOWER(ft.account)))
    ft.description,
    ft.amount,
    'expense',
    ft.category_id,
    (v_inicio_mes + (LEAST(GREATEST(COALESCE(EXTRACT(DAY FROM ft.date)::INT, 10), 1), 28) - 1) * INTERVAL '1 day')::date,
    'pending', -- Começa como 'pending' (a pagar) para ser quitado no novo ciclo!
    ft.account,
    'fixed',
    COALESCE(ft.recurrence, 'monthly'),
    COALESCE(ft.module, 'global'),
    '[Renovação Mensal Automática] ' || to_char(v_inicio_mes, 'TMMonth/YYYY'),
    COALESCE(ft.currency, 'BRL'),
    ft.original_amount,
    ft.exchange_rate
  FROM public.finance_transactions ft
  WHERE ft.type = 'expense'
    AND ft.expense_type = 'fixed'
    AND ft.date < v_inicio_mes
    AND NOT EXISTS (
      SELECT 1 FROM public.finance_transactions atual
      WHERE atual.type = 'expense'
        AND TRIM(LOWER(atual.description)) = TRIM(LOWER(ft.description))
        AND COALESCE(atual.module, 'global') = COALESCE(ft.module, 'global')
        AND atual.date >= v_inicio_mes
        AND atual.date < v_fim_mes
    )
  ORDER BY TRIM(LOWER(ft.description)), COALESCE(ft.module, 'global'), TRIM(LOWER(ft.account)), ft.date DESC;

  GET DIAGNOSTICS v_custos_fixos_gerados = ROW_COUNT;

  -- 5. ATUALIZAÇÃO DA RÉGUA DE ARRECADAÇÃO DA CAMPANHA ATIVA PARA O NOVO MÊS
  SELECT COALESCE(SUM(amount), 0)
  INTO v_total_doacoes
  FROM public.donations
  WHERE status = 'paid'
    AND created_at >= v_inicio_mes
    AND created_at < v_fim_mes;

  UPDATE public.campaigns
  SET current_amount = v_total_doacoes,
      last_reset_at = v_inicio_mes,
      is_active = true
  WHERE is_active = true;

  SELECT title INTO v_campanha_titulo FROM public.campaigns WHERE is_active = true LIMIT 1;

  RETURN jsonb_build_object(
    'mes_referencia', to_char(v_inicio_mes, 'YYYY-MM'),
    'entradas_geradas', v_entradas_geradas,
    'custos_fixos_pendentes_gerados', v_custos_fixos_gerados,
    'total_arrecadado_mes', v_total_doacoes,
    'campanha_ativa', v_campanha_titulo,
    'mensagem', 'Ciclo mensal renovado com sucesso!'
  );
END;
$$;

-- ==============================================================================
-- 6. EXECUTAR IMEDIATAMENTE PARA O MÊS ATUAL (NOVEMBRO/2026)
-- ==============================================================================
SELECT public.virada_mes_financeiro();

-- ==============================================================================
-- 7. CONFERÊNCIA DOS LANÇAMENTOS DO MÊS ATUAL
-- ==============================================================================
SELECT 
  'Módulo Financeiro (Entradas)' as modulo,
  COUNT(*) as total_lancamentos,
  SUM(amount) as valor_total
FROM public.finance_transactions
WHERE type = 'income' 
  AND date >= date_trunc('month', CURRENT_DATE) 
  AND date < date_trunc('month', CURRENT_DATE) + INTERVAL '1 month'
UNION ALL
SELECT 
  'Módulo Financeiro (Custos Fixos a Pagar)' as modulo,
  COUNT(*) as total_lancamentos,
  SUM(amount) as valor_total
FROM public.finance_transactions
WHERE type = 'expense' 
  AND expense_type = 'fixed'
  AND status = 'pending'
  AND date >= date_trunc('month', CURRENT_DATE) 
  AND date < date_trunc('month', CURRENT_DATE) + INTERVAL '1 month'
UNION ALL
SELECT 
  'Doações (Régua do Mês)' as modulo,
  COUNT(*) as total_lancamentos,
  SUM(amount) as valor_total
FROM public.donations
WHERE created_at >= date_trunc('month', CURRENT_DATE) 
  AND created_at < date_trunc('month', CURRENT_DATE) + INTERVAL '1 month'
  AND status = 'paid';
