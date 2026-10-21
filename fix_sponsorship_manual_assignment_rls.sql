-- ==============================================================================
-- FIX RLS: PERMISSÕES DE VÍNCULO MANUAL E ATUALIZAÇÃO DE APADRINHAMENTOS
-- Execute no Supabase SQL Editor (https://supabase.com/dashboard)
-- ==============================================================================

-- 1. Habilitar RLS na tabela sponsorships
ALTER TABLE public.sponsorships ENABLE ROW LEVEL SECURITY;

-- 2. Leitura de apadrinhamentos (SELECT)
DROP POLICY IF EXISTS "Permissao_Leitura_Apadrinhamentos" ON public.sponsorships;
DROP POLICY IF EXISTS "Padrinho_Le_Proprio_Apadrinhamento" ON public.sponsorships;

CREATE POLICY "Permissao_Leitura_Apadrinhamentos" ON public.sponsorships
  FOR SELECT TO authenticated, anon
  USING (true);

-- 3. Inserção de novos apadrinhamentos (INSERT)
DROP POLICY IF EXISTS "Permissao_Insercao_Apadrinhamentos" ON public.sponsorships;
DROP POLICY IF EXISTS "Insercao_Publica_Apadrinhamento" ON public.sponsorships;

CREATE POLICY "Permissao_Insercao_Apadrinhamentos" ON public.sponsorships
  FOR INSERT TO authenticated, anon
  WITH CHECK (true);

-- 4. Atualização e Troca de Criança (UPDATE)
DROP POLICY IF EXISTS "Permissao_Atualizacao_Apadrinhamentos" ON public.sponsorships;
DROP POLICY IF EXISTS "Admin_Atualiza_Apadrinhamento" ON public.sponsorships;

CREATE POLICY "Permissao_Atualizacao_Apadrinhamentos" ON public.sponsorships
  FOR UPDATE TO authenticated, anon
  USING (true)
  WITH CHECK (true);

-- 5. Exclusão ou desvinculação (DELETE)
DROP POLICY IF EXISTS "Permissao_Exclusao_Apadrinhamentos" ON public.sponsorships;

CREATE POLICY "Permissao_Exclusao_Apadrinhamentos" ON public.sponsorships
  FOR DELETE TO authenticated
  USING (true);
