-- ==============================================================================
-- MIGRAÇÃO SQL: ÁREA DO MANTENEDOR & CONSENTIMENTOS LGPD
-- Execute este script no SQL Editor do Supabase (https://supabase.com/dashboard)
-- ==============================================================================

-- 1. ADICIONAR CAMPOS DE CONSENTIMENTO E CONTATO NA TABELA DE USUÁRIOS
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS consent_communication BOOLEAN DEFAULT false;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS consent_privacy BOOLEAN DEFAULT false;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS consent_date TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- 2. GARANTIR A TABELA DE PROJETOS DO SITE & PORTAL (website_projects)
CREATE TABLE IF NOT EXISTS public.website_projects (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  image_url TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Adiciona colunas complementares se ainda não existirem
DO $$ 
BEGIN
  ALTER TABLE public.website_projects ADD COLUMN IF NOT EXISTS "order" INTEGER DEFAULT 0;
  ALTER TABLE public.website_projects ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'Geral';
  ALTER TABLE public.website_projects ADD COLUMN IF NOT EXISTS tag_color TEXT DEFAULT '#F49853';
  ALTER TABLE public.website_projects ADD COLUMN IF NOT EXISTS link TEXT DEFAULT '/projetos';
  ALTER TABLE public.website_projects ADD COLUMN IF NOT EXISTS full_description TEXT;
  ALTER TABLE public.website_projects ADD COLUMN IF NOT EXISTS location TEXT;
  ALTER TABLE public.website_projects ADD COLUMN IF NOT EXISTS coordinator TEXT;
  ALTER TABLE public.website_projects ADD COLUMN IF NOT EXISTS beneficiaries_target TEXT;
  ALTER TABLE public.website_projects ADD COLUMN IF NOT EXISTS beneficiaries_reached TEXT;
  ALTER TABLE public.website_projects ADD COLUMN IF NOT EXISTS gallery_images JSONB DEFAULT '[]'::jsonb;
  ALTER TABLE public.website_projects ADD COLUMN IF NOT EXISTS admin_notes TEXT;
  ALTER TABLE public.website_projects ADD COLUMN IF NOT EXISTS start_date TEXT;
END $$;

-- 3. PERMISSÕES DE LEITURA (RLS) PARA website_projects
ALTER TABLE public.website_projects ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Leitura pública website_projects" ON public.website_projects;
CREATE POLICY "Leitura pública website_projects" ON public.website_projects FOR SELECT USING (true);
DROP POLICY IF EXISTS "Operações website_projects" ON public.website_projects;
CREATE POLICY "Operações website_projects" ON public.website_projects FOR ALL USING (true);

-- 4. POLÍTICAS DE RLS PARA MANTENEDORES (SPONSOR) VISUALIZAREM AS CRIANÇAS
-- Permite que usuários autenticados (incluindo SPONSOR) leiam as crianças atendidas
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'children') THEN
    DROP POLICY IF EXISTS "Mantenedor_Leitura_Children" ON public.children;
    CREATE POLICY "Mantenedor_Leitura_Children" ON public.children FOR SELECT TO authenticated USING (true);
  END IF;

  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'caregivers') THEN
    DROP POLICY IF EXISTS "Mantenedor_Leitura_Caregivers" ON public.caregivers;
    CREATE POLICY "Mantenedor_Leitura_Caregivers" ON public.caregivers FOR SELECT TO authenticated USING (true);
  END IF;

  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'clinical_events') THEN
    DROP POLICY IF EXISTS "Mantenedor_Leitura_ClinicalEvents" ON public.clinical_events;
    CREATE POLICY "Mantenedor_Leitura_ClinicalEvents" ON public.clinical_events FOR SELECT TO authenticated USING (true);
  END IF;
END $$;

-- 5. POLÍTICAS DE RLS PARA DOAÇÕES (donations)
-- Permite que o doador visualize suas próprias doações no portal
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'donations') THEN
    ALTER TABLE public.donations ENABLE ROW LEVEL SECURITY;
    
    DROP POLICY IF EXISTS "Doador_Visualiza_Proprias_Doacoes" ON public.donations;
    CREATE POLICY "Doador_Visualiza_Proprias_Doacoes" ON public.donations 
      FOR SELECT TO authenticated 
      USING (
        donor_email = auth.jwt() ->> 'email' 
        OR EXISTS (SELECT 1 FROM public.users WHERE public.users.id = auth.uid() AND public.users.role != 'SPONSOR')
      );

    DROP POLICY IF EXISTS "Insercao_Doacoes_Publicas" ON public.donations;
    CREATE POLICY "Insercao_Doacoes_Publicas" ON public.donations 
      FOR INSERT WITH CHECK (true);
  END IF;
END $$;
