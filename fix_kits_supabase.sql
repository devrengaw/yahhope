-- Script para correção e garantia de persistência dos kits no Supabase
-- Executar no SQL Editor do painel do Supabase se desejar sincronizar diretamente no banco

-- 1. Cria a tabela de kits se não existir
CREATE TABLE IF NOT EXISTS kits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Cria a tabela de itens do kit se não existir
CREATE TABLE IF NOT EXISTS kit_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kit_id UUID REFERENCES kits(id) ON DELETE CASCADE,
  item_id UUID REFERENCES inventory(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 1,
  dosage TEXT,
  UNIQUE(kit_id, item_id)
);

-- 3. Desabilita RLS para que requisições do app não sejam bloqueadas
ALTER TABLE kits DISABLE ROW LEVEL SECURITY;
ALTER TABLE kit_items DISABLE ROW LEVEL SECURITY;

-- 4. Cria políticas de acesso total caso o RLS permaneça habilitado no projeto
DROP POLICY IF EXISTS "Permitir tudo em kits" ON kits;
CREATE POLICY "Permitir tudo em kits" ON kits FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir tudo em kit_items" ON kit_items;
CREATE POLICY "Permitir tudo em kit_items" ON kit_items FOR ALL USING (true) WITH CHECK (true);
