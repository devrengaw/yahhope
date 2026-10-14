-- ==============================================================================
-- SCRIPT: REGISTRAR O PAGAMENTO REAL STRIPE DE R$ 90,00 NO SUPABASE
-- Execute no SQL Editor do Supabase (https://supabase.com/dashboard)
-- ==============================================================================

-- 1. Garante que as colunas necessárias existam nas tabelas
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

-- 2. Atualiza ou cria o perfil de Lucas W O Santos em users com role SPONSOR
DO $$
DECLARE
  v_user_id UUID;
BEGIN
  SELECT id INTO v_user_id FROM public.users WHERE email ILIKE 'lucas.wagneer@gmail.com' LIMIT 1;

  IF v_user_id IS NOT NULL THEN
    EXECUTE 'UPDATE public.users 
      SET role = ''SPONSOR'', 
          status = ''active'',
          name = ''Lucas W O Santos'',
          stripe_customer_id = ''cus_VRKBYQTS8fCbuF''
      WHERE id = $1' USING v_user_id;
  ELSE
    EXECUTE 'INSERT INTO public.users (email, name, role, status, stripe_customer_id)
      VALUES (''lucas.wagneer@gmail.com'', ''Lucas W O Santos'', ''SPONSOR'', ''active'', ''cus_VRKBYQTS8fCbuF'')';
  END IF;
END $$;

-- 3. Registra a assinatura ativa de R$ 90,00 em sponsorships
DO $$
DECLARE
  v_user_id UUID;
  v_child_id UUID;
BEGIN
  SELECT id INTO v_user_id FROM public.users WHERE email ILIKE 'lucas.wagneer@gmail.com' LIMIT 1;
  SELECT id INTO v_child_id FROM public.children LIMIT 1;

  IF EXISTS (SELECT 1 FROM public.sponsorships WHERE donor_email ILIKE 'lucas.wagneer@gmail.com' OR stripe_subscription_id = 'sub_1UQRWp4meADlo8qEsorN8sdT') THEN
    UPDATE public.sponsorships 
    SET donor_email = 'lucas.wagneer@gmail.com',
        donor_name = 'Lucas W O Santos',
        sponsor_id = v_user_id,
        monthly_amount = 90.00,
        status = 'active',
        payment_method = 'credit_card',
        stripe_subscription_id = 'sub_1UQRWp4meADlo8qEsorN8sdT',
        stripe_customer_id = 'cus_VRKBYQTS8fCbuF',
        last_sponsored_at = '2026-10-14 09:43:00+00'
    WHERE donor_email ILIKE 'lucas.wagneer@gmail.com' OR stripe_subscription_id = 'sub_1UQRWp4meADlo8qEsorN8sdT';
  ELSE
    INSERT INTO public.sponsorships (
      child_id,
      sponsor_id,
      donor_name,
      donor_email,
      monthly_amount,
      quotas_count,
      status,
      payment_method,
      created_at,
      last_sponsored_at,
      stripe_subscription_id,
      stripe_customer_id
    ) VALUES (
      v_child_id,
      v_user_id,
      'Lucas W O Santos',
      'lucas.wagneer@gmail.com',
      90.00,
      1,
      'active',
      'credit_card',
      '2026-10-14 09:43:00+00',
      '2026-10-14 09:43:00+00',
      'sub_1UQRWp4meADlo8qEsorN8sdT',
      'cus_VRKBYQTS8fCbuF'
    );
  END IF;
END $$;

-- 4. Registra o pagamento de R$ 90,00 da Stripe em donations
DO $$
DECLARE
  v_campaign_id UUID;
BEGIN
  SELECT id INTO v_campaign_id FROM public.campaigns ORDER BY priority ASC NULLS LAST LIMIT 1;

  IF NOT EXISTS (SELECT 1 FROM public.donations WHERE stripe_payment_id = 'pi_3UQRWp4meADlo8qE1MEPy7b6' OR (amount = 90.00 AND donor_email ILIKE 'lucas.wagneer@gmail.com' AND created_at >= '2026-10-14 00:00:00+00')) THEN
    INSERT INTO public.donations (
      campaign_id,
      donor_name,
      donor_email,
      amount,
      status,
      payment_method,
      created_at,
      paid_at,
      stripe_payment_id,
      stripe_customer_id
    ) VALUES (
      v_campaign_id,
      'Lucas W O Santos',
      'lucas.wagneer@gmail.com',
      90.00,
      'paid',
      'credit_card',
      '2026-10-14 09:43:00+00',
      '2026-10-14 09:43:00+00',
      'pi_3UQRWp4meADlo8qE1MEPy7b6',
      'cus_VRKBYQTS8fCbuF'
    );
  END IF;
END $$;

-- 5. Conferência imediata dos dados em donations e sponsorships:
SELECT id, donor_name, donor_email, amount, status, payment_method, stripe_payment_id, created_at 
FROM public.donations 
WHERE donor_email ILIKE 'lucas.wagneer@gmail.com' 
ORDER BY created_at DESC;

SELECT id, donor_name, donor_email, monthly_amount, status, payment_method, stripe_subscription_id, last_sponsored_at 
FROM public.sponsorships 
WHERE donor_email ILIKE 'lucas.wagneer@gmail.com';
