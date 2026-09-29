-- Supabase SQL Schema for YAH Hope Site Analytics (Métricas de Acesso)
-- Executar no SQL Editor do painel do Supabase

CREATE TABLE IF NOT EXISTS site_visits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  visitor_id TEXT NOT NULL,
  session_id TEXT,
  path TEXT NOT NULL,
  page_title TEXT,
  referrer TEXT,
  device TEXT,          -- 'mobile', 'desktop', 'tablet'
  browser TEXT,         -- 'Chrome', 'Safari', 'Firefox', 'Edge', etc.
  os TEXT,              -- 'iOS', 'Android', 'Windows', 'macOS', 'Linux'
  country TEXT,         -- 'Brasil', 'Angola', 'Portugal', etc.
  city TEXT,            -- 'São Paulo', 'Luanda', 'Lisboa', etc.
  user_id UUID,         -- Identificador do apoiador/usuário (sem FK para compatibilidade universal)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para consultas de alta performance no Dashboard
CREATE INDEX IF NOT EXISTS idx_site_visits_created_at ON site_visits(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_site_visits_visitor_id ON site_visits(visitor_id);
CREATE INDEX IF NOT EXISTS idx_site_visits_path ON site_visits(path);
CREATE INDEX IF NOT EXISTS idx_site_visits_country ON site_visits(country);

-- Habilitar Row Level Security (RLS)
ALTER TABLE site_visits ENABLE ROW LEVEL SECURITY;

-- Remover políticas antigas se existirem (evita erro de duplicidade ao reexecutar)
DROP POLICY IF EXISTS "Permitir inserção anônima de visitas" ON site_visits;
DROP POLICY IF EXISTS "Permitir leitura de métricas para usuários autenticados" ON site_visits;
DROP POLICY IF EXISTS "Permitir leitura total de visitas" ON site_visits;

-- 1. Qualquer visitante (inclusive anônimo) pode registrar uma visita
CREATE POLICY "Permitir inserção anônima de visitas"
  ON site_visits
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- 2. Permitir leitura das métricas
CREATE POLICY "Permitir leitura total de visitas"
  ON site_visits
  FOR SELECT
  TO anon, authenticated
  USING (true);
