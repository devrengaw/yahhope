-- =========================================================================
-- WORKSPACE CLICKUP / TRELLO ENHANCEMENTS MIGRATION
-- Módulo de Tarefas, Equipes, Comunicação e Módulos/Projetos
-- =========================================================================

-- 1. Melhorias na tabela clickup_tasks
ALTER TABLE public.clickup_tasks ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'normal' CHECK (priority IN ('urgent', 'high', 'normal', 'low'));
ALTER TABLE public.clickup_tasks ADD COLUMN IF NOT EXISTS team_id UUID REFERENCES public.workspace_teams(id) ON DELETE SET NULL;
ALTER TABLE public.clickup_tasks ADD COLUMN IF NOT EXISTS checklists JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.clickup_tasks ADD COLUMN IF NOT EXISTS comments JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.clickup_tasks ADD COLUMN IF NOT EXISTS tags JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.clickup_tasks ADD COLUMN IF NOT EXISTS order_index INTEGER DEFAULT 0;
ALTER TABLE public.clickup_tasks ADD COLUMN IF NOT EXISTS assignee_id UUID REFERENCES public.users(id) ON DELETE SET NULL;
ALTER TABLE public.clickup_tasks ADD COLUMN IF NOT EXISTS due_date TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.clickup_tasks ADD COLUMN IF NOT EXISTS due_date_only BOOLEAN DEFAULT true;

-- 2. Melhorias na tabela clickup_spaces (para suportar Módulos)
ALTER TABLE public.clickup_spaces ADD COLUMN IF NOT EXISTS module TEXT DEFAULT 'geral';

-- 3. Melhorias na tabela workspace_channels (vincular a equipes opcionalmente)
ALTER TABLE public.workspace_channels ADD COLUMN IF NOT EXISTS team_id UUID REFERENCES public.workspace_teams(id) ON DELETE CASCADE;
ALTER TABLE public.workspace_channels ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE public.workspace_channels ADD COLUMN IF NOT EXISTS is_private BOOLEAN DEFAULT false;

-- 4. Garantir que as tabelas de mensagens existam
CREATE TABLE IF NOT EXISTS public.workspace_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id TEXT NOT NULL,
  sender_name TEXT NOT NULL,
  sender_avatar TEXT,
  text TEXT NOT NULL,
  attachments JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE public.workspace_messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable all actions for authenticated users" ON public.workspace_messages;
CREATE POLICY "Enable all actions for authenticated users" ON public.workspace_messages FOR ALL USING (auth.role() = 'authenticated');

-- 5. Atualizar Canais padrão para equipes e áreas
INSERT INTO public.workspace_channels (id, name, description) VALUES
('c1111111-1111-1111-1111-111111111111', 'geral', 'Canal de comunicação geral para todas as equipes'),
('c2222222-2222-2222-2222-222222222222', 'projetos', 'Discussão e alinhamento de novos projetos e entregas'),
('c3333333-3333-3333-3333-333333333333', 'marketing-comunicacao', 'Canal da equipe de Marketing e Comunicação'),
('c4444444-4444-4444-4444-444444444444', 'saude-nutricao', 'Alinhamentos clínicos e entregas do programa de nutrição')
ON CONFLICT (id) DO NOTHING;
