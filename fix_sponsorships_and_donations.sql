-- ==============================================================================
-- SCRIPT: HIGIENIZAÇÃO DE APADRINHAMENTO E DOAÇÕES (YAH HOPE)
-- Execute no SQL Editor do Supabase (https://supabase.com/dashboard)
-- 
-- O que este script faz:
-- 1. Garante colunas estruturais para evitar erros de schema (42703).
-- 2. Mantém o perfil de lucas.wagneer@gmail.com como SPONSOR (Padrinho).
-- 3. Limpa apadrinhamentos duplicados ou incorretos (como cotas criadas com R$ 50).
-- 4. Mantém EXATAMENTE 1 apadrinhamento ativo de R$ 90,00 vinculado a uma criança real.
-- 5. PRESERVA todo o histórico real de doações na tabela donations (incluindo os R$ 50 deste mês e as de junho).
-- 6. Ajusta a régua da fase ativa para R$ 140,00 (50 avulso + 90 apadrinhamento).
-- ==============================================================================

-- 1. GARANTE A ESTRUTURA DE COLUNAS EM USERS, SPONSORSHIPS E CAMPAIGNS
ALTER TABLE public.users 
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS phone TEXT,
  ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;

ALTER TABLE public.sponsorships 
  ADD COLUMN IF NOT EXISTS donor_email TEXT,
  ADD COLUMN IF NOT EXISTS donor_name TEXT,
  ADD COLUMN IF NOT EXISTS donor_phone TEXT,
  ADD COLUMN IF NOT EXISTS monthly_amount NUMERIC(10, 2) DEFAULT 90.00,
  ADD COLUMN IF NOT EXISTS quotas_count INTEGER DEFAULT 1,
  ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT 'credit_card',
  ADD COLUMN IF NOT EXISTS last_sponsored_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT,
  ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;

ALTER TABLE public.donations 
  ADD COLUMN IF NOT EXISTS stripe_payment_id TEXT,
  ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;

-- 2. ATUALIZA OU CRIA O USUÁRIO lucas.wagneer@gmail.com COM ROLE DE PADRINHO (SPONSOR)
DO $$
DECLARE
  v_user_id UUID;
BEGIN
  SELECT id INTO v_user_id FROM public.users WHERE email ILIKE 'lucas.wagneer@gmail.com' LIMIT 1;

  IF v_user_id IS NOT NULL THEN
    UPDATE public.users 
    SET role = 'SPONSOR',
        status = 'active',
        name = COALESCE(name, 'Lucas Wagner')
    WHERE id = v_user_id;
  ELSE
    INSERT INTO public.users (email, name, role, status)
    VALUES ('lucas.wagneer@gmail.com', 'Lucas Wagner', 'SPONSOR', 'active');
  END IF;
END $$;

-- 3. CONSOLIDA O APADRINHAMENTO DE R$ 90,00 (Remove duplicatas indevidas e garante vínculo com a criança)
DO $$
DECLARE
  v_user_id UUID;
  v_child_id UUID;
  v_keep_sponsorship_id UUID;
BEGIN
  SELECT id INTO v_user_id FROM public.users WHERE email ILIKE 'lucas.wagneer@gmail.com' LIMIT 1;
  
  -- Seleciona a primeira criança da Casa Nutri para o vínculo
  SELECT id INTO v_child_id FROM public.children ORDER BY name ASC LIMIT 1;

  -- Localiza o apadrinhamento de R$ 90 mais recente do usuário
  SELECT id INTO v_keep_sponsorship_id 
  FROM public.sponsorships 
  WHERE donor_email ILIKE 'lucas.wagneer@gmail.com' 
     OR sponsor_id = v_user_id
     OR stripe_subscription_id = 'sub_1UQRWp4meADlo8qEsorN8sdT'
  ORDER BY (monthly_amount = 90.00) DESC, created_at DESC 
  LIMIT 1;

  IF v_keep_sponsorship_id IS NOT NULL THEN
    -- Remove eventuais duplicatas criadas pelo bug de auto-atribuição anterior
    DELETE FROM public.sponsorships 
    WHERE (donor_email ILIKE 'lucas.wagneer@gmail.com' OR sponsor_id = v_user_id)
      AND id <> v_keep_sponsorship_id;

    -- Atualiza e garante o apadrinhamento correto de R$ 90 vinculado à criança
    UPDATE public.sponsorships 
    SET donor_email = 'lucas.wagneer@gmail.com',
        donor_name = 'Lucas Wagner',
        sponsor_id = v_user_id,
        child_id = COALESCE(child_id, v_child_id),
        monthly_amount = 90.00,
        status = 'active',
        payment_method = 'credit_card',
        stripe_subscription_id = COALESCE(stripe_subscription_id, 'sub_1UQRWp4meADlo8qEsorN8sdT'),
        last_sponsored_at = COALESCE(last_sponsored_at, NOW())
    WHERE id = v_keep_sponsorship_id;
  ELSE
    -- Se não existia, cria o registro oficial de R$ 90
    INSERT INTO public.sponsorships (
      child_id,
      sponsor_id,
      donor_name,
      donor_email,
      monthly_amount,
      quotas_count,
      status,
      payment_method,
      stripe_subscription_id,
      created_at,
      last_sponsored_at
    ) VALUES (
      v_child_id,
      v_user_id,
      'Lucas Wagner',
      'lucas.wagneer@gmail.com',
      90.00,
      1,
      'active',
      'credit_card',
      'sub_1UQRWp4meADlo8qEsorN8sdT',
      NOW(),
      NOW()
    );
  END IF;
END $$;

-- 4. GARANTE QUE A DOAÇÃO AVULSA DESTE MÊS (R$ 50) ESTEJA COM STATUS PAGO
-- (SEM APAGAR nenhuma doação histórica anterior do usuário!)
UPDATE public.donations 
SET status = 'paid',
    paid_at = COALESCE(paid_at, NOW())
WHERE donor_email ILIKE 'lucas.wagneer@gmail.com' 
  AND amount = 50.00;

-- 5. AJUSTA A ARRECADAÇÃO DA FASE 1 DA RÉGUA PARA R$ 140,00 (R$ 50 avulso + R$ 90 apadrinhamento)
DO $$
DECLARE
  v_first_campaign_id UUID;
BEGIN
  SELECT id INTO v_first_campaign_id 
  FROM public.campaigns 
  ORDER BY priority ASC NULLS LAST, created_at ASC 
  LIMIT 1;

  IF v_first_campaign_id IS NOT NULL THEN
    UPDATE public.campaigns 
    SET current_amount = 140.00,
        last_reset_at = NULL,
        is_active = true
    WHERE id = v_first_campaign_id;
  END IF;
END $$;

-- 6. CONFERÊNCIA IMEDIATA DOS DADOS
SELECT 
  'Perfil do Usuário' AS tipo,
  id::text, 
  name, 
  email, 
  role, 
  status 
FROM public.users 
WHERE email ILIKE 'lucas.wagneer@gmail.com';

SELECT 
  'Apadrinhamentos Ativos' AS tipo,
  id::text, 
  donor_name, 
  donor_email, 
  monthly_amount::text, 
  child_id::text, 
  status, 
  stripe_subscription_id 
FROM public.sponsorships 
WHERE donor_email ILIKE 'lucas.wagneer@gmail.com';

SELECT 
  'Doações do Usuário (Preservadas)' AS tipo,
  id::text, 
  donor_name, 
  amount::text, 
  status, 
  payment_method, 
  created_at::text 
FROM public.donations 
WHERE donor_email ILIKE 'lucas.wagneer@gmail.com'
ORDER BY created_at DESC;

SELECT 
  'Campanha Ativa (Régua)' AS tipo,
  id::text, 
  title, 
  current_amount::text, 
  target_amount::text, 
  is_active::text 
FROM public.campaigns 
ORDER BY priority ASC NULLS LAST 
LIMIT 1;
