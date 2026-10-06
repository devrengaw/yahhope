-- ==============================================================================
-- SCHEMA PARA RECURSOS DO SITE PÚBLICO (YAH HOPE)
-- Execute este script no SQL Editor do seu painel Supabase (https://supabase.com/dashboard)
-- Cria as tabelas do site público e adiciona colunas que podem estar ausentes.
-- ==============================================================================

-- 1. Tabela para Configurações Gerais do Site (ex: Top Banner)
CREATE TABLE IF NOT EXISTS public.site_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS e permitir leitura pública e gravação autenticada/anon
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Leitura pública site_settings" ON public.site_settings;
CREATE POLICY "Leitura pública site_settings" ON public.site_settings FOR SELECT USING (true);
DROP POLICY IF EXISTS "Inserção/Atualização site_settings" ON public.site_settings;
CREATE POLICY "Inserção/Atualização site_settings" ON public.site_settings FOR ALL USING (true);

-- Inserir configuração padrão do Top Banner caso não exista ou atualizar se estiver desatualizado
INSERT INTO public.site_settings (key, value)
VALUES (
  'top_banner', 
  '{"enabled": true, "tag": "URGENTE", "tagColor": "#F49853", "message": "Moçambique & Casa Nutri: Apoio emergencial a 9 crianças e famílias em risco nutricional", "text": "Moçambique & Casa Nutri: Apoio emergencial a 9 crianças e famílias em risco nutricional", "buttonText": "Apoiar Agora", "linkText": "Apoiar Agora", "buttonActionType": "donation_modal", "buttonLink": "/campanha", "link": "/campanha", "bgColor": "#0F172A", "textColor": "#FFFFFF"}'::jsonb
)
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;


-- 2. Tabela para Destaques da Página Inicial (Home Highlights)
CREATE TABLE IF NOT EXISTS public.home_highlights (
  id TEXT PRIMARY KEY,
  type TEXT DEFAULT 'photo',
  title TEXT NOT NULL,
  category TEXT,
  location TEXT DEFAULT 'Moçambique',
  snippet TEXT,
  content TEXT,
  image TEXT,
  link TEXT,
  color TEXT DEFAULT '#F49853',
  active BOOLEAN DEFAULT true,
  "order" INTEGER DEFAULT 0,
  blog_post_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.home_highlights ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Leitura pública home_highlights" ON public.home_highlights;
CREATE POLICY "Leitura pública home_highlights" ON public.home_highlights FOR SELECT USING (true);
DROP POLICY IF EXISTS "Operações home_highlights" ON public.home_highlights;
CREATE POLICY "Operações home_highlights" ON public.home_highlights FOR ALL USING (true);


-- 3. Tabela para Métricas de Impacto (Impact Metrics)
CREATE TABLE IF NOT EXISTS public.impact_metrics (
  id TEXT PRIMARY KEY,
  metric TEXT NOT NULL,
  subtitle TEXT,
  description TEXT,
  icon TEXT DEFAULT 'users',
  color TEXT DEFAULT '#F49853',
  active BOOLEAN DEFAULT true,
  "order" INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.impact_metrics ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Leitura pública impact_metrics" ON public.impact_metrics;
CREATE POLICY "Leitura pública impact_metrics" ON public.impact_metrics FOR SELECT USING (true);
DROP POLICY IF EXISTS "Operações impact_metrics" ON public.impact_metrics;
CREATE POLICY "Operações impact_metrics" ON public.impact_metrics FOR ALL USING (true);


-- 4. Atualização segura da tabela website_projects (adicionando colunas ausentes)
CREATE TABLE IF NOT EXISTS public.website_projects (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  image_url TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

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

ALTER TABLE public.website_projects ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Leitura pública website_projects" ON public.website_projects;
CREATE POLICY "Leitura pública website_projects" ON public.website_projects FOR SELECT USING (true);
DROP POLICY IF EXISTS "Operações website_projects" ON public.website_projects;
CREATE POLICY "Operações website_projects" ON public.website_projects FOR ALL USING (true);
