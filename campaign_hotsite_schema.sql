-- Supabase SQL Schema para o Hotsite da Campanha YAH Hope (campanha.yahhope.com)
-- Cria tabelas para captura de leads/inscrições e eventos de cliques/acessos

-- 1. Tabela de Pessoas Interessadas em Fazer Parte (Leads)
CREATE TABLE IF NOT EXISTS campaign_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  age INTEGER,
  age_range TEXT,              -- Ex: '18-24', '25-34', '35-44', '45-54', '55+'
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

-- Índices para consultas no Admin
CREATE INDEX IF NOT EXISTS idx_campaign_leads_created_at ON campaign_leads(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_campaign_leads_city ON campaign_leads(city);
CREATE INDEX IF NOT EXISTS idx_campaign_leads_interest ON campaign_leads(interest_type);
CREATE INDEX IF NOT EXISTS idx_campaign_leads_status ON campaign_leads(status);

-- 2. Tabela de Cliques e Eventos de Interação no Hotsite
CREATE TABLE IF NOT EXISTS campaign_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL,     -- 'click_cta', 'click_whatsapp', 'form_start', 'form_submit', 'click_sponsor', 'click_volunteer', etc.
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

-- Índices para os eventos
CREATE INDEX IF NOT EXISTS idx_campaign_events_created_at ON campaign_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_campaign_events_type ON campaign_events(event_type);
CREATE INDEX IF NOT EXISTS idx_campaign_events_visitor ON campaign_events(visitor_id);

-- Habilitar RLS
ALTER TABLE campaign_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_events ENABLE ROW LEVEL SECURITY;

-- Políticas de RLS
DROP POLICY IF EXISTS "Permitir inserção anônima de leads" ON campaign_leads;
DROP POLICY IF EXISTS "Permitir leitura de leads" ON campaign_leads;
DROP POLICY IF EXISTS "Permitir atualização de status de leads" ON campaign_leads;

CREATE POLICY "Permitir inserção anônima de leads"
  ON campaign_leads
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Permitir leitura de leads"
  ON campaign_leads
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Permitir atualização de status de leads"
  ON campaign_leads
  FOR UPDATE
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "Permitir inserção anônima de eventos" ON campaign_events;
DROP POLICY IF EXISTS "Permitir leitura de eventos" ON campaign_events;

CREATE POLICY "Permitir inserção anônima de eventos"
  ON campaign_events
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Permitir leitura de eventos"
  ON campaign_events
  FOR SELECT
  TO anon, authenticated
  USING (true);
