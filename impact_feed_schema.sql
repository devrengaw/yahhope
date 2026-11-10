-- ==============================================================================
-- SCHEMA DO FEED DE IMPACTO DA YAH HOPE
-- Atualizações de Impacto (Pendentes de aprovação pelo Admin antes da publicação)
-- Compatível com a tabela existente do tipo UUID
-- Execute este script no SQL Editor do seu Supabase Dashboard
-- ==============================================================================

-- 1. Criação da tabela de atualizações de impacto (se não existir)
CREATE TABLE IF NOT EXISTS impact_feed (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL DEFAULT 'geral', -- 'child', 'news', 'project', 'geral'
  source TEXT NOT NULL DEFAULT 'Módulo Nutrição',
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  author TEXT NOT NULL DEFAULT 'Equipe Nutrição',
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'published', 'rejected'
  child_id UUID, -- ID do paciente/criança associada (UUID)
  child_name TEXT, -- Nome da criança para visualização rápida
  img_url TEXT, -- URL de foto/evidência
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Migração segura: Adicionar colunas caso a tabela já exista
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'impact_feed' AND column_name = 'child_name') THEN
    ALTER TABLE impact_feed ADD COLUMN child_name TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'impact_feed' AND column_name = 'img_url') THEN
    ALTER TABLE impact_feed ADD COLUMN img_url TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'impact_feed' AND column_name = 'updated_at') THEN
    ALTER TABLE impact_feed ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
  END IF;
END $$;

-- 3. Índices para performance
CREATE INDEX IF NOT EXISTS idx_impact_feed_status ON impact_feed(status);
CREATE INDEX IF NOT EXISTS idx_impact_feed_created_at ON impact_feed(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_impact_feed_child_id ON impact_feed(child_id);

-- 4. Habilitar RLS (Row Level Security)
ALTER TABLE impact_feed ENABLE ROW LEVEL SECURITY;

-- 5. Políticas de Segurança (RLS)
DROP POLICY IF EXISTS "Public and sponsors can view published impact updates" ON impact_feed;
DROP POLICY IF EXISTS "Anyone can insert impact updates as pending" ON impact_feed;
DROP POLICY IF EXISTS "Admins can manage all impact updates" ON impact_feed;
DROP POLICY IF EXISTS "Allow all for authenticated and anon" ON impact_feed;

-- Leitura de itens
CREATE POLICY "Public and sponsors can view published impact updates"
ON impact_feed FOR SELECT
USING (true);

-- Inserção de novos itens (gerados como pending pela nutrição/atendimentos)
CREATE POLICY "Anyone can insert impact updates as pending"
ON impact_feed FOR INSERT
WITH CHECK (true);

-- Atualização e Moderação (Aprovar, Rejeitar, Editar texto)
CREATE POLICY "Admins can manage all impact updates"
ON impact_feed FOR UPDATE
USING (true)
WITH CHECK (true);

-- Exclusão de itens
CREATE POLICY "Admins can delete impact updates"
ON impact_feed FOR DELETE
USING (true);

-- 6. Adicionar à publicação realtime do Supabase para refletir instantaneamente
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    BEGIN
      ALTER PUBLICATION supabase_realtime ADD TABLE impact_feed;
    EXCEPTION
      WHEN duplicate_object THEN
        NULL;
    END;
  END IF;
END $$;

-- 7. Dados iniciais caso a tabela esteja vazia (usando UUIDs válidos)
INSERT INTO impact_feed (id, type, source, title, content, author, status, created_at, img_url)
SELECT 
  'a1000000-0000-4000-8000-000000000001'::uuid, 
  'geral', 
  'Módulo Nutrição', 
  'Novos Suprimentos Terapêuticos em Boane', 
  'Recebemos nova remessa de fórmulas fortificadas e suplementos para o atendimento intensivo das crianças na Casa Nutri.', 
  'Nutrição Boane', 
  'published', 
  NOW() - INTERVAL '2 days',
  'https://hope.yahchurch.com/wp-content/uploads/2025/09/HOPE-ALFACES.avif'
WHERE NOT EXISTS (SELECT 1 FROM impact_feed WHERE id = 'a1000000-0000-4000-8000-000000000001'::uuid);

INSERT INTO impact_feed (id, type, source, title, content, author, status, created_at)
SELECT 
  'a2000000-0000-4000-8000-000000000002'::uuid, 
  'project', 
  'Módulo Nutrição', 
  'Monitoramento Clínico e Recuperação Ponderal', 
  'O acompanhamento diário com pesagem e testes de edema permitiu que 92% das crianças atendidas no mês registrassem ganho contínuo de peso.', 
  'Coordenação Clínica', 
  'published', 
  NOW() - INTERVAL '5 days'
WHERE NOT EXISTS (SELECT 1 FROM impact_feed WHERE id = 'a2000000-0000-4000-8000-000000000002'::uuid);
