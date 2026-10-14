-- ==============================================================================
-- SCRIPT: VINCULAR APADRINHAMENTO (R$ 90) E DOAÇÃO (R$ 50) A lucas.wagneer@gmail.com
-- Execute no SQL Editor do Supabase (https://supabase.com/dashboard)
-- NOTA: Este script PRESERVA todas as doações anteriores já feitas por este usuário!
-- ==============================================================================

-- 1. GARANTE A EXISTÊNCIA DAS COLUNAS NECESSÁRIAS NAS TABELAS (Evita erro 42703)
ALTER TABLE public.users 
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS phone TEXT;

ALTER TABLE public.sponsorships 
  ADD COLUMN IF NOT EXISTS donor_email TEXT,
  ADD COLUMN IF NOT EXISTS donor_name TEXT,
  ADD COLUMN IF NOT EXISTS donor_phone TEXT,
  ADD COLUMN IF NOT EXISTS monthly_amount NUMERIC(10, 2) DEFAULT 90.00,
  ADD COLUMN IF NOT EXISTS quotas_count INTEGER DEFAULT 1,
  ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT 'credit_card',
  ADD COLUMN IF NOT EXISTS last_sponsored_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- 2. GARANTE QUE O USUÁRIO lucas.wagneer@gmail.com EXISTA COM PAPEL DE PADRINHO (SPONSOR)
DO $$
DECLARE
  v_user_id UUID;
BEGIN
  SELECT id INTO v_user_id FROM public.users WHERE email ILIKE 'lucas.wagneer@gmail.com' LIMIT 1;

  IF v_user_id IS NOT NULL THEN
    EXECUTE 'UPDATE public.users 
      SET role = ''SPONSOR'', 
          status = ''active'',
          name = COALESCE(name, ''Lucas Wagner'')
      WHERE id = $1' USING v_user_id;
  ELSE
    EXECUTE 'INSERT INTO public.users (email, name, role, status)
      VALUES (''lucas.wagneer@gmail.com'', ''Lucas Wagner'', ''SPONSOR'', ''active'')';
  END IF;
END $$;

-- 3. VINCULA O APADRINHAMENTO DE R$ 90,00 AO E-MAIL E ID DE lucas.wagneer@gmail.com
DO $$
DECLARE
  v_user_id UUID;
  v_child_id UUID;
  v_sponsorship_id UUID;
BEGIN
  SELECT id INTO v_user_id FROM public.users WHERE email ILIKE 'lucas.wagneer@gmail.com' LIMIT 1;
  SELECT id INTO v_child_id FROM public.children LIMIT 1;

  -- Localiza o apadrinhamento de R$ 90 mais recente ou genérico
  SELECT id INTO v_sponsorship_id 
  FROM public.sponsorships 
  ORDER BY created_at DESC 
  LIMIT 1;

  IF v_sponsorship_id IS NOT NULL THEN
    EXECUTE 'UPDATE public.sponsorships 
      SET donor_email = ''lucas.wagneer@gmail.com'',
          donor_name = ''Lucas Wagner'',
          sponsor_id = $1,
          monthly_amount = 90.00,
          status = ''active'',
          child_id = COALESCE(child_id, $2),
          last_sponsored_at = COALESCE(last_sponsored_at, NOW())
      WHERE id = $3' USING v_user_id, v_child_id, v_sponsorship_id;
  ELSE
    EXECUTE 'INSERT INTO public.sponsorships (
      child_id,
      sponsor_id,
      donor_name,
      donor_email,
      monthly_amount,
      quotas_count,
      status,
      payment_method,
      created_at,
      last_sponsored_at
    ) VALUES (
      $1,
      $2,
      ''Lucas Wagner'',
      ''lucas.wagneer@gmail.com'',
      90.00,
      1,
      ''active'',
      ''credit_card'',
      NOW(),
      NOW()
    )' USING v_child_id, v_user_id;
  END IF;
END $$;

-- 4. VINCULA A DOAÇÃO AVULSA DESTE MÊS DE R$ 50,00 A lucas.wagneer@gmail.com
-- (PRESERVANDO todas as outras doações anteriores do histórico!)
DO $$
DECLARE
  v_donation_id UUID;
BEGIN
  -- Procura doação de R$ 50 deste mês
  SELECT id INTO v_donation_id 
  FROM public.donations 
  WHERE amount = 50.00 
  ORDER BY created_at DESC 
  LIMIT 1;

  IF v_donation_id IS NOT NULL THEN
    UPDATE public.donations 
    SET donor_email = 'lucas.wagneer@gmail.com',
        donor_name = 'Lucas Wagner',
        status = 'paid',
        paid_at = COALESCE(paid_at, NOW())
    WHERE id = v_donation_id;
  ELSE
    INSERT INTO public.donations (
      donor_name,
      donor_email,
      amount,
      status,
      payment_method,
      created_at,
      paid_at
    ) VALUES (
      'Lucas Wagner',
      'lucas.wagneer@gmail.com',
      50.00,
      'paid',
      'pix',
      NOW(),
      NOW()
    );
  END IF;
END $$;

-- 5. CONFERÊNCIA: Exibe o perfil, apadrinhamento e todo o histórico de doações mantido
SELECT id, name, email, role, status FROM public.users WHERE email ILIKE 'lucas.wagneer@gmail.com';

SELECT 
  id, 
  donor_name, 
  donor_email, 
  monthly_amount, 
  status, 
  created_at 
FROM public.sponsorships 
WHERE donor_email ILIKE 'lucas.wagneer@gmail.com' 
   OR sponsor_id = (SELECT id FROM public.users WHERE email ILIKE 'lucas.wagneer@gmail.com');

SELECT 
  id, 
  donor_name, 
  donor_email, 
  amount, 
  status, 
  payment_method, 
  created_at 
FROM public.donations 
WHERE donor_email ILIKE 'lucas.wagneer@gmail.com' 
ORDER BY created_at DESC;
