-- ==============================================================================
-- MIGRAÇÃO: VINCULAÇÃO E SOMATÓRIA AUTOMÁTICA DE DOAÇÕES FEITAS DESLOGADO
-- ==============================================================================

-- 1. Garante colunas de rastreamento e associação em public.donations
ALTER TABLE public.donations
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS is_sponsorship BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS stripe_payment_id TEXT,
  ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT;

-- 2. Cria índices para performance de busca por email e user_id
CREATE INDEX IF NOT EXISTS idx_donations_donor_email_lower ON public.donations(LOWER(donor_email));
CREATE INDEX IF NOT EXISTS idx_donations_user_id ON public.donations(user_id);
CREATE INDEX IF NOT EXISTS idx_sponsorships_donor_email_lower ON public.sponsorships(LOWER(donor_email));

-- 3. Normaliza todos os e-mails existentes para minúsculo e sem espaços em branco
UPDATE public.donations
SET donor_email = LOWER(TRIM(donor_email))
WHERE donor_email IS NOT NULL AND donor_email != LOWER(TRIM(donor_email));

UPDATE public.sponsorships
SET donor_email = LOWER(TRIM(donor_email))
WHERE donor_email IS NOT NULL AND donor_email != LOWER(TRIM(donor_email));

UPDATE public.users
SET email = LOWER(TRIM(email))
WHERE email IS NOT NULL AND email != LOWER(TRIM(email));

-- 4. Vincula doações históricas existentes ao user_id correspondente caso o usuário já exista
UPDATE public.donations d
SET user_id = u.id
FROM public.users u
WHERE LOWER(TRIM(d.donor_email)) = LOWER(TRIM(u.email))
  AND d.user_id IS NULL;

-- 5. Vincula apadrinhamentos históricos existentes ao sponsor_id correspondente
UPDATE public.sponsorships s
SET sponsor_id = u.id
FROM public.users u
WHERE LOWER(TRIM(s.donor_email)) = LOWER(TRIM(u.email))
  AND s.sponsor_id IS NULL;

-- 6. Atualiza política de RLS em public.donations para permitir visualização
-- tanto por correspondência de e-mail (case-insensitive) quanto por user_id
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'donations') THEN
    ALTER TABLE public.donations ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS "Doador_Visualiza_Proprias_Doacoes" ON public.donations;
    CREATE POLICY "Doador_Visualiza_Proprias_Doacoes" ON public.donations
      FOR SELECT TO authenticated
      USING (
        LOWER(TRIM(donor_email)) = LOWER(TRIM(auth.jwt() ->> 'email'))
        OR user_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM public.users 
          WHERE public.users.id = auth.uid() 
          AND public.users.role NOT IN ('SPONSOR', 'USER')
        )
      );

    DROP POLICY IF EXISTS "Insercao_Doacoes_Publicas" ON public.donations;
    CREATE POLICY "Insercao_Doacoes_Publicas" ON public.donations
      FOR INSERT WITH CHECK (true);
  END IF;
END $$;

-- 7. Atualiza política de RLS em public.sponsorships para compatibilidade case-insensitive
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'sponsorships') THEN
    ALTER TABLE public.sponsorships ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS "Padrinho_Le_Proprio_Apadrinhamento" ON public.sponsorships;
    CREATE POLICY "Padrinho_Le_Proprio_Apadrinhamento" ON public.sponsorships
      FOR SELECT TO authenticated
      USING (
        sponsor_id = auth.uid() 
        OR LOWER(TRIM(donor_email)) = LOWER(TRIM(auth.jwt() ->> 'email'))
        OR EXISTS (
          SELECT 1 FROM public.users 
          WHERE public.users.id = auth.uid() 
          AND public.users.role NOT IN ('SPONSOR')
        )
      );
  END IF;
END $$;
