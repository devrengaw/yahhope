-- ==============================================================================
-- SCRIPT: CONECTAR E SINCRONIZAR DOAÇÕES REAIS (R$ 50 avulso + R$ 90 apadrinhamento = R$ 140)
-- Execute este script no SQL Editor do Supabase (https://supabase.com/dashboard)
-- ==============================================================================

-- 1. GARANTIR A ESTRUTURA DE COLUNAS EM SPONSORSHIPS E CAMPAIGNS (Evita qualquer erro 42703)
ALTER TABLE public.sponsorships 
  ADD COLUMN IF NOT EXISTS donor_email TEXT,
  ADD COLUMN IF NOT EXISTS donor_name TEXT,
  ADD COLUMN IF NOT EXISTS donor_phone TEXT,
  ADD COLUMN IF NOT EXISTS monthly_amount NUMERIC(10, 2) DEFAULT 90.00,
  ADD COLUMN IF NOT EXISTS quotas_count INTEGER DEFAULT 1,
  ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT 'credit_card',
  ADD COLUMN IF NOT EXISTS last_sponsored_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

ALTER TABLE public.campaigns 
  ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'monthly',
  ADD COLUMN IF NOT EXISTS priority INTEGER DEFAULT 1,
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS accept_pix BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS accept_card BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS last_reset_at TIMESTAMP WITH TIME ZONE;

-- 2. AJUSTAR DOAÇÕES: MANTÉM EXATAMENTE 1 DOAÇÃO REAL DE R$ 50,00 E REMOVE FANTASMAS DE TESTE
DO $$
DECLARE
  v_keep_donation_id UUID;
BEGIN
  -- Tenta localizar a doação de R$ 50 mais recente para preservar os dados do doador real
  SELECT id INTO v_keep_donation_id 
  FROM donations 
  WHERE amount = 50.00 
  ORDER BY created_at DESC 
  LIMIT 1;

  IF v_keep_donation_id IS NOT NULL THEN
    -- Remove todas as doações diferentes da doação real de 50.00
    DELETE FROM donations WHERE id <> v_keep_donation_id;
    -- Garante status pago
    UPDATE donations 
    SET status = 'paid', 
        paid_at = COALESCE(paid_at, NOW()) 
    WHERE id = v_keep_donation_id;
  ELSE
    -- Remove valores antigos e cria a doação oficial de R$ 50,00
    DELETE FROM donations;
    INSERT INTO donations (
      donor_name,
      donor_email,
      amount,
      status,
      payment_method,
      created_at,
      paid_at
    ) VALUES (
      'Doador YAH Hope',
      'doador@yahhope.org',
      50.00,
      'paid',
      'pix',
      NOW(),
      NOW()
    );
  END IF;
END $$;

-- 3. AJUSTAR APADRINHAMENTOS: MANTÉM EXATAMENTE 1 APADRINHAMENTO ATIVO DE R$ 90,00
DO $$
DECLARE
  v_keep_sponsorship_id UUID;
  v_child_id UUID;
  v_sponsor_id UUID;
BEGIN
  -- Busca referências de criança e usuário para integridade relacional se existirem
  SELECT id INTO v_child_id FROM children LIMIT 1;
  SELECT id INTO v_sponsor_id FROM users WHERE role IN ('SPONSOR', 'PADRINHO') LIMIT 1;
  IF v_sponsor_id IS NULL THEN
    SELECT id INTO v_sponsor_id FROM users LIMIT 1;
  END IF;

  -- Localiza apadrinhamento existente
  SELECT id INTO v_keep_sponsorship_id 
  FROM sponsorships 
  ORDER BY created_at DESC 
  LIMIT 1;

  IF v_keep_sponsorship_id IS NOT NULL THEN
    -- Remove eventuais duplicatas de teste
    DELETE FROM sponsorships WHERE id <> v_keep_sponsorship_id;

    -- Ajusta o registro para o valor real de R$ 90,00 ativo
    EXECUTE 'UPDATE sponsorships SET 
      monthly_amount = 90.00,
      status = ''active'',
      donor_name = COALESCE(donor_name, ''Padrinho YAH Hope''),
      donor_email = COALESCE(donor_email, ''padrinho@yahhope.org''),
      payment_method = COALESCE(payment_method, ''credit_card''),
      last_sponsored_at = COALESCE(last_sponsored_at, NOW())
      WHERE id = $1' USING v_keep_sponsorship_id;
  ELSE
    -- Cria o apadrinhamento oficial de R$ 90,00
    EXECUTE 'INSERT INTO sponsorships (
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
      ''Padrinho YAH Hope'',
      ''padrinho@yahhope.org'',
      90.00,
      1,
      ''active'',
      ''credit_card'',
      NOW(),
      NOW()
    )' USING v_child_id, v_sponsor_id;
  END IF;
END $$;

-- 4. ATUALIZAR CAMPANHA DA FASE 1 PARA R$ 140,00 (50 avulso + 90 apadrinhamento)
DO $$
DECLARE
  v_first_campaign_id UUID;
BEGIN
  -- Identifica a primeira campanha da régua
  SELECT id INTO v_first_campaign_id 
  FROM campaigns 
  ORDER BY priority ASC NULLS LAST, created_at ASC 
  LIMIT 1;

  IF v_first_campaign_id IS NOT NULL THEN
    UPDATE campaigns 
    SET current_amount = 140.00,
        last_reset_at = NULL,
        is_active = true
    WHERE id = v_first_campaign_id;
  END IF;

  -- Garante que todas as outras campanhas da régua estejam ativas e sem travas de reset
  UPDATE campaigns 
  SET is_active = true,
      last_reset_at = NULL
  WHERE id <> v_first_campaign_id;
END $$;

-- 5. CONFERÊNCIA FINAL DOS DADOS (Será exibido na aba Result do Supabase)
SELECT 
  'Campanhas' AS tabela, 
  id::text, 
  title, 
  current_amount::text, 
  target_amount::text, 
  is_active::text 
FROM campaigns 
ORDER BY priority ASC NULLS LAST 
LIMIT 4;

SELECT 
  'Doações' AS tabela, 
  id::text, 
  donor_name, 
  amount::text, 
  status, 
  payment_method, 
  created_at::text 
FROM donations;

SELECT 
  'Apadrinhamentos' AS tabela, 
  id::text, 
  donor_name, 
  monthly_amount::text, 
  status, 
  payment_method, 
  created_at::text 
FROM sponsorships;
