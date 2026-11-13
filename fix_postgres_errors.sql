-- ==============================================================================
-- CORREÇÃO DOS ERROS DO LOG DO POSTGRESQL (42703 e 42501)
-- Execute no SQL Editor do Supabase se desejar complementar a correção no banco
-- ==============================================================================

-- 1. Adiciona a coluna opcional 'department' em public.users (evita erro 42703)
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS department TEXT;

-- 2. Ajusta a política de RLS de home_visits para aceitar validação por id ou email
-- de membros internos da equipe (evita erro 42501 quando há divergência de UID)
ALTER TABLE public.home_visits ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Nutricao_Acesso_HomeVisits" ON public.home_visits;
CREATE POLICY "Nutricao_Acesso_HomeVisits" ON public.home_visits
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE (users.id = auth.uid() OR LOWER(TRIM(users.email)) = LOWER(TRIM(auth.jwt() ->> 'email')))
        AND users.role NOT IN ('SPONSOR', 'USER')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE (users.id = auth.uid() OR LOWER(TRIM(users.email)) = LOWER(TRIM(auth.jwt() ->> 'email')))
        AND users.role NOT IN ('SPONSOR', 'USER')
    )
  );
