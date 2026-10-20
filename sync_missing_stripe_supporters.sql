-- ==============================================================================
-- SCRIPT SQL: GARANTIR ESTRUTURA PARA OS 27 MANTENEDORES E AÇÃO DE 06 DE JUNHO
-- Execute este script no SQL Editor do seu Supabase Dashboard (https://supabase.com/dashboard)
-- ==============================================================================

-- 1. GARANTIR COLUNAS EM 'users' e 'sponsorships' (Evita qualquer erro 42703)
ALTER TABLE public.users 
  ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'USER',
  ADD COLUMN IF NOT EXISTS phone TEXT;

ALTER TABLE public.sponsorships 
  ADD COLUMN IF NOT EXISTS donor_email TEXT,
  ADD COLUMN IF NOT EXISTS donor_name TEXT,
  ADD COLUMN IF NOT EXISTS donor_phone TEXT,
  ADD COLUMN IF NOT EXISTS monthly_amount NUMERIC(10, 2) DEFAULT 90.00,
  ADD COLUMN IF NOT EXISTS quotas_count INTEGER DEFAULT 1,
  ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT 'credit_card',
  ADD COLUMN IF NOT EXISTS last_sponsored_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- 2. GARANTIR QUE NENHUM MANTENEDOR/PADRINHO SEJA TRATADO COMO USUÁRIO COMUM
-- Atualiza o papel para SPONSOR para os emails conhecidos da Stripe
UPDATE public.users
SET role = 'SPONSOR'
WHERE LOWER(TRIM(email)) IN (
  'lucas.wagneer@gmail.com',
  'jonata_xx@hotmail.com',
  'messiasletic@gmail.com',
  'gerson.simionato@gmail.com',
  'fe.carmagnani@hotmail.com',
  'jesspenido@gmail.com',
  'diegott@ymail.com',
  'gabrielbertoline1202@yahoo.com',
  'ridossantos@gmail.com'
);

-- 3. VERIFICAR QUAIS DOS EMAILS DA LISTA JÁ ESTÃO REGISTRADOS NO BANCO
SELECT 
  u.email,
  u.name,
  u.role,
  (SELECT COUNT(*) FROM public.donations d WHERE LOWER(TRIM(d.donor_email)) = LOWER(TRIM(u.email))) as qtd_doacoes,
  (SELECT COUNT(*) FROM public.sponsorships s WHERE LOWER(TRIM(s.donor_email)) = LOWER(TRIM(u.email))) as qtd_apadrinhamentos
FROM public.users u
WHERE LOWER(TRIM(u.email)) IN (
  'lucas.wagneer@gmail.com',
  'jonata_xx@hotmail.com',
  'messiasletic@gmail.com',
  'gerson.simionato@gmail.com',
  'fe.carmagnani@hotmail.com',
  'jesspenido@gmail.com',
  'diegott@ymail.com',
  'gabrielbertoline1202@yahoo.com',
  'ridossantos@gmail.com'
)
ORDER BY u.name ASC;

-- 4. CONFERÊNCIA GERAL DE QUANTOS APOIADORES ESTÃO VISÍVEIS
SELECT 
  COUNT(DISTINCT LOWER(TRIM(COALESCE(donor_email, '')))) as total_doadores_distintos
FROM public.donations
WHERE donor_email IS NOT NULL AND TRIM(donor_email) != '';
