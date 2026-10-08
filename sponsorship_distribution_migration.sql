-- ==============================================================================
-- MIGRAÇÃO SQL: QUOTIZAÇÃO DE CUSTO & DISTRIBUIÇÃO EQUITATIVA DE APADRINHAMENTO
-- Execute este script no SQL Editor do Supabase (https://supabase.com/dashboard)
-- ==============================================================================

-- 1. ADICIONAR CAMPOS DE PARAMETRIZAÇÃO NA TABELA DE CONFIGURAÇÕES (organization_settings)
ALTER TABLE public.organization_settings 
  ADD COLUMN IF NOT EXISTS sponsorship_quota_cost NUMERIC(10, 2) DEFAULT 90.00,
  ADD COLUMN IF NOT EXISTS max_sponsors_per_child INTEGER DEFAULT 2;

-- Garante valores padrão caso id 'default' já exista sem essas colunas
UPDATE public.organization_settings 
SET 
  sponsorship_quota_cost = COALESCE(sponsorship_quota_cost, 90.00),
  max_sponsors_per_child = COALESCE(max_sponsors_per_child, 2)
WHERE id = 'default';

-- 2. ENRIQUECER A TABELA DE CRIANÇAS (children) PARA SUPORTAR PERFIL DE APADRINHAMENTO
ALTER TABLE public.children 
  ADD COLUMN IF NOT EXISTS photo_url TEXT,
  ADD COLUMN IF NOT EXISTS story TEXT,
  ADD COLUMN IF NOT EXISTS sponsorship_status TEXT DEFAULT 'active'; -- 'active', 'graduated', 'paused'

-- 3. ENRIQUECER A TABELA DE APADRINHAMENTOS (sponsorships)
ALTER TABLE public.sponsorships 
  ADD COLUMN IF NOT EXISTS donor_email TEXT,
  ADD COLUMN IF NOT EXISTS donor_name TEXT,
  ADD COLUMN IF NOT EXISTS donor_phone TEXT,
  ADD COLUMN IF NOT EXISTS monthly_amount NUMERIC(10, 2) DEFAULT 90.00,
  ADD COLUMN IF NOT EXISTS quotas_count INTEGER DEFAULT 1,
  ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT 'credit_card', -- 'credit_card', 'pix', 'boleto'
  ADD COLUMN IF NOT EXISTS last_sponsored_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Criar índice para busca ágil de apadrinhamentos por criança e por doador
CREATE INDEX IF NOT EXISTS idx_sponsorships_child_id ON public.sponsorships(child_id);
CREATE INDEX IF NOT EXISTS idx_sponsorships_donor_email ON public.sponsorships(donor_email);
CREATE INDEX IF NOT EXISTS idx_sponsorships_sponsor_id ON public.sponsorships(sponsor_id);

-- 4. POLÍTICAS DE RLS (ROW LEVEL SECURITY)
-- Habilita RLS em sponsorships se ainda não estiver ativo
ALTER TABLE public.sponsorships ENABLE ROW LEVEL SECURITY;

-- Permite leitura de apadrinhamentos autenticados para o próprio padrinho ou administradores
DROP POLICY IF EXISTS "Padrinho_Le_Proprio_Apadrinhamento" ON public.sponsorships;
CREATE POLICY "Padrinho_Le_Proprio_Apadrinhamento" ON public.sponsorships
  FOR SELECT TO authenticated
  USING (
    sponsor_id = auth.uid() 
    OR donor_email = auth.jwt() ->> 'email'
    OR EXISTS (
      SELECT 1 FROM public.users 
      WHERE public.users.id = auth.uid() 
      AND public.users.role IN ('ADMIN', 'USER', 'STAFF', 'COORDINATOR')
    )
  );

-- Permite inserção de apadrinhamentos pelo público / doações
DROP POLICY IF EXISTS "Insercao_Publica_Apadrinhamento" ON public.sponsorships;
CREATE POLICY "Insercao_Publica_Apadrinhamento" ON public.sponsorships
  FOR INSERT WITH CHECK (true);

-- Permite update por administradores
DROP POLICY IF EXISTS "Admin_Atualiza_Apadrinhamento" ON public.sponsorships;
CREATE POLICY "Admin_Atualiza_Apadrinhamento" ON public.sponsorships
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE public.users.id = auth.uid() 
      AND public.users.role IN ('ADMIN', 'USER')
    )
  );
