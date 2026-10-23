-- ==============================================================================
-- SQL COMPLETO: CONTROLE DE ACESSOS, CLIQUES E RETORNOS DO HOTSITE (YAH HOPE)
-- Cole e execute este script no SQL Editor do Supabase (https://supabase.com/dashboard)
-- ==============================================================================

-- 1. Tabela de Visitas / Acessos (site_visits)
CREATE TABLE IF NOT EXISTS public.site_visits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  visitor_id TEXT NOT NULL,
  session_id TEXT,
  path TEXT NOT NULL,
  page_title TEXT,
  referrer TEXT,
  device TEXT,          -- 'mobile', 'desktop', 'tablet'
  browser TEXT,         -- 'Chrome', 'Safari', 'Firefox', 'Edge', etc.
  os TEXT,              -- 'iOS', 'Android', 'Windows', 'macOS', 'Linux'
  country TEXT DEFAULT 'Brasil',
  city TEXT DEFAULT 'São Paulo',
  user_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Garantir colunas caso a tabela site_visits já exista de versão anterior
ALTER TABLE public.site_visits ADD COLUMN IF NOT EXISTS session_id TEXT;
ALTER TABLE public.site_visits ADD COLUMN IF NOT EXISTS page_title TEXT;
ALTER TABLE public.site_visits ADD COLUMN IF NOT EXISTS referrer TEXT;
ALTER TABLE public.site_visits ADD COLUMN IF NOT EXISTS device TEXT;
ALTER TABLE public.site_visits ADD COLUMN IF NOT EXISTS browser TEXT;
ALTER TABLE public.site_visits ADD COLUMN IF NOT EXISTS os TEXT;
ALTER TABLE public.site_visits ADD COLUMN IF NOT EXISTS country TEXT DEFAULT 'Brasil';
ALTER TABLE public.site_visits ADD COLUMN IF NOT EXISTS city TEXT DEFAULT 'São Paulo';
ALTER TABLE public.site_visits ADD COLUMN IF NOT EXISTS user_id UUID;

CREATE INDEX IF NOT EXISTS idx_site_visits_created_at ON public.site_visits(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_site_visits_visitor_id ON public.site_visits(visitor_id);
CREATE INDEX IF NOT EXISTS idx_site_visits_path ON public.site_visits(path);

ALTER TABLE public.site_visits ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Permitir inserção anônima de visitas" ON public.site_visits;
DROP POLICY IF EXISTS "Permitir leitura de métricas para usuários autenticados" ON public.site_visits;
DROP POLICY IF EXISTS "Permitir leitura total de visitas" ON public.site_visits;

CREATE POLICY "Permitir inserção anônima de visitas"
  ON public.site_visits
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Permitir leitura total de visitas"
  ON public.site_visits
  FOR SELECT
  TO anon, authenticated
  USING (true);


-- 2. Tabela de Pessoas Interessadas / Retornos do Hotsite (campaign_leads)
CREATE TABLE IF NOT EXISTS public.campaign_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  age INTEGER,
  age_range TEXT,               -- '18-24', '25-34', '35-44', '45-54', '55+'
  city TEXT,
  state TEXT,
  country TEXT DEFAULT 'Brasil',
  interest_type TEXT NOT NULL,  -- 'volunteer', 'sponsor', 'donor', 'partner', 'other'
  message TEXT,
  status TEXT DEFAULT 'new',    -- 'new', 'contacted', 'joined', 'archived'
  source TEXT DEFAULT 'campanha.yahhope.com',
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  visitor_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_campaign_leads_created_at ON public.campaign_leads(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_campaign_leads_city ON public.campaign_leads(city);
CREATE INDEX IF NOT EXISTS idx_campaign_leads_interest ON public.campaign_leads(interest_type);
CREATE INDEX IF NOT EXISTS idx_campaign_leads_status ON public.campaign_leads(status);

ALTER TABLE public.campaign_leads ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Permitir inserção anônima de leads" ON public.campaign_leads;
DROP POLICY IF EXISTS "Permitir leitura de leads" ON public.campaign_leads;
DROP POLICY IF EXISTS "Permitir atualização de status de leads" ON public.campaign_leads;

CREATE POLICY "Permitir inserção anônima de leads"
  ON public.campaign_leads
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Permitir leitura de leads"
  ON public.campaign_leads
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Permitir atualização de status de leads"
  ON public.campaign_leads
  FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);


-- 3. Tabela de Cliques e Eventos de Interação no Hotsite (campaign_events)
CREATE TABLE IF NOT EXISTS public.campaign_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL,     -- 'page_view', 'click_cta', 'cta_click', 'form_submit', etc.
  button_label TEXT,
  visitor_id TEXT,
  session_id TEXT,
  path TEXT DEFAULT '/campanha-yahhope',
  referrer TEXT,
  device TEXT,                  -- 'mobile', 'desktop', 'tablet'
  browser TEXT,
  os TEXT,
  city TEXT,
  country TEXT DEFAULT 'Brasil',
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_campaign_events_created_at ON public.campaign_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_campaign_events_type ON public.campaign_events(event_type);
CREATE INDEX IF NOT EXISTS idx_campaign_events_visitor ON public.campaign_events(visitor_id);

ALTER TABLE public.campaign_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Permitir inserção anônima de eventos" ON public.campaign_events;
DROP POLICY IF EXISTS "Permitir leitura de eventos" ON public.campaign_events;

CREATE POLICY "Permitir inserção anônima de eventos"
  ON public.campaign_events
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Permitir leitura de eventos"
  ON public.campaign_events
  FOR SELECT
  TO anon, authenticated
  USING (true);


-- 4. Tabela de Configurações / Status Sincronizados (site_settings)
CREATE TABLE IF NOT EXISTS public.site_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Leitura pública site_settings" ON public.site_settings;
CREATE POLICY "Leitura pública site_settings"
  ON public.site_settings
  FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "Inserção/Atualização site_settings" ON public.site_settings;
CREATE POLICY "Inserção/Atualização site_settings"
  ON public.site_settings
  FOR ALL
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);
