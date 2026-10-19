-- ==============================================================================
-- CORREÇÃO DE SEGURANÇA: Habilitar RLS em email_settings e email_templates
-- Resolve os alertas críticos do Supabase Security Advisor:
-- "Table public.email_settings is public, but RLS has not been enabled."
-- "Table public.email_templates is public, but RLS has not been enabled."
-- ==============================================================================

-- 1. Habilitar Row Level Security (RLS) nas duas tabelas
ALTER TABLE public.email_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;

-- 2. Remover políticas antigas para evitar duplicidade caso execute novamente
DROP POLICY IF EXISTS "Staff_Full_Access_Email_Settings" ON public.email_settings;
DROP POLICY IF EXISTS "Staff_Full_Access_Email_Templates" ON public.email_templates;

-- 3. Criar políticas permitindo acesso completo para usuários autenticados (equipe/admin)
-- As Edge Functions usam a service_role_key, que ignora o RLS automaticamente.
CREATE POLICY "Staff_Full_Access_Email_Settings" ON public.email_settings
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Staff_Full_Access_Email_Templates" ON public.email_templates
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);
