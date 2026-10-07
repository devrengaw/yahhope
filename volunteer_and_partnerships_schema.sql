-- ==============================================================================
-- Schema: Voluntariado e Parcerias Empresariais (YAH Hope)
-- Execute no SQL Editor do Supabase para criar as tabelas e habilitar as permissões
-- ==============================================================================

-- 1. Tabela de Inscrições de Voluntários
CREATE TABLE IF NOT EXISTS volunteer_applications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  city TEXT NOT NULL,
  state_country TEXT NOT NULL,
  desired_location TEXT NOT NULL CHECK (desired_location IN ('brasil', 'mocambique', 'ambos')),
  availability TEXT,
  skills_areas TEXT[],
  experience TEXT,
  motivation TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'contacted', 'approved', 'rejected')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Tabela de Parcerias Empresariais (Investindo em um Brasil melhor)
CREATE TABLE IF NOT EXISTS corporate_partnerships (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_name TEXT NOT NULL,
  contact_person TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  partnership_type TEXT NOT NULL CHECK (partnership_type IN ('investimento', 'doacao_produto', 'doacao_servico', 'multiplas')),
  cnpj TEXT,
  website_social TEXT,
  estimated_value_or_scope TEXT,
  proposal_details TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'meeting_scheduled', 'partnership_active', 'declined')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Habilita Row Level Security (RLS)
ALTER TABLE volunteer_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE corporate_partnerships ENABLE ROW LEVEL SECURITY;

-- 4. Políticas: Permite qualquer visitante enviar o formulário (INSERT público)
DROP POLICY IF EXISTS "Permitir envio publico de voluntariado" ON volunteer_applications;
CREATE POLICY "Permitir envio publico de voluntariado" 
ON volunteer_applications FOR INSERT 
WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir leitura de voluntariado para autenticados" ON volunteer_applications;
CREATE POLICY "Permitir leitura de voluntariado para autenticados" 
ON volunteer_applications FOR SELECT 
TO authenticated 
USING (true);

DROP POLICY IF EXISTS "Permitir envio publico de parcerias empresariais" ON corporate_partnerships;
CREATE POLICY "Permitir envio publico de parcerias empresariais" 
ON corporate_partnerships FOR INSERT 
WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir leitura de parcerias empresariais para autenticados" ON corporate_partnerships;
CREATE POLICY "Permitir leitura de parcerias empresariais para autenticados" 
ON corporate_partnerships FOR SELECT 
TO authenticated 
USING (true);
