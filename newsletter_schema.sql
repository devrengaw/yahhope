-- ==============================================================================
-- SCHEMA PARA INSCRITOS NA NEWSLETTER (YAH HOPE)
-- ==============================================================================

-- 1. Criação da Tabela de Inscritos
CREATE TABLE IF NOT EXISTS newsletter_subscribers (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'unsubscribed')),
  source TEXT DEFAULT 'Landing Page'
);

-- 2. Habilitação de Row Level Security (RLS)
ALTER TABLE newsletter_subscribers ENABLE ROW LEVEL SECURITY;

-- 3. Políticas de Segurança (RLS)
-- Permitir que qualquer visitante anônimo do site consiga se inscrever (INSERT)
DROP POLICY IF EXISTS "Permitir inscricao publica newsletter" ON newsletter_subscribers;
CREATE POLICY "Permitir inscricao publica newsletter"
  ON newsletter_subscribers
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Permitir leitura para usuários autenticados (ou anon para sincronização)
DROP POLICY IF EXISTS "Permitir leitura newsletter" ON newsletter_subscribers;
CREATE POLICY "Permitir leitura newsletter"
  ON newsletter_subscribers
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Permitir atualização (ex: descadastrar / reativar)
DROP POLICY IF EXISTS "Permitir update newsletter" ON newsletter_subscribers;
CREATE POLICY "Permitir update newsletter"
  ON newsletter_subscribers
  FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- Permitir exclusão de inscritos
DROP POLICY IF EXISTS "Permitir delete newsletter" ON newsletter_subscribers;
CREATE POLICY "Permitir delete newsletter"
  ON newsletter_subscribers
  FOR DELETE
  TO anon, authenticated
  USING (true);
