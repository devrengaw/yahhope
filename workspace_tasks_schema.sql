-- =========================================================================
-- SCHEMA COMPLETO E ATUALIZAÇÃO: WORKSPACE, TAREFAS, EQUIPES E CANAIS
-- 100% Idempotente e Seguro para Execução no Supabase SQL Editor
-- =========================================================================

-- 1. Tabela de Espaços (Spaces)
CREATE TABLE IF NOT EXISTS public.clickup_spaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  color TEXT DEFAULT '#3b82f6',
  icon TEXT DEFAULT 'folder',
  module TEXT DEFAULT 'geral',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Garantir colunas adicionais em clickup_spaces se a tabela já existia
ALTER TABLE public.clickup_spaces ADD COLUMN IF NOT EXISTS module TEXT DEFAULT 'geral';
ALTER TABLE public.clickup_spaces ADD COLUMN IF NOT EXISTS color TEXT DEFAULT '#3b82f6';
ALTER TABLE public.clickup_spaces ADD COLUMN IF NOT EXISTS icon TEXT DEFAULT 'folder';

-- 2. Tabela de Pastas (Folders)
CREATE TABLE IF NOT EXISTS public.clickup_folders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  space_id UUID NOT NULL REFERENCES public.clickup_spaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Tabela de Listas / Funis (Lists)
CREATE TABLE IF NOT EXISTS public.clickup_lists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  space_id UUID NOT NULL REFERENCES public.clickup_spaces(id) ON DELETE CASCADE,
  folder_id UUID REFERENCES public.clickup_folders(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  color TEXT DEFAULT '#3b82f6',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.clickup_lists ADD COLUMN IF NOT EXISTS color TEXT DEFAULT '#3b82f6';

-- 4. Tabela de Status de Tarefas (Statuses)
CREATE TABLE IF NOT EXISTS public.clickup_statuses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  list_id UUID NOT NULL REFERENCES public.clickup_lists(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT DEFAULT '#64748b',
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.clickup_statuses ADD COLUMN IF NOT EXISTS color TEXT DEFAULT '#64748b';
ALTER TABLE public.clickup_statuses ADD COLUMN IF NOT EXISTS order_index INTEGER DEFAULT 0;

-- 5. Tabela de Equipes (Workspace Teams)
CREATE TABLE IF NOT EXISTS public.workspace_teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  color TEXT DEFAULT '#3b82f6',
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Tabela Principal de Tarefas (ClickUp Tasks)
CREATE TABLE IF NOT EXISTS public.clickup_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  list_id UUID NOT NULL REFERENCES public.clickup_lists(id) ON DELETE CASCADE,
  status_id UUID REFERENCES public.clickup_statuses(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Garantir todas as colunas necessárias para ClickUp e Minhas Tarefas
ALTER TABLE public.clickup_tasks ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE public.clickup_tasks ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'normal';
ALTER TABLE public.clickup_tasks ADD COLUMN IF NOT EXISTS assignee_id UUID;
ALTER TABLE public.clickup_tasks ADD COLUMN IF NOT EXISTS team_id UUID;
ALTER TABLE public.clickup_tasks ADD COLUMN IF NOT EXISTS due_date TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.clickup_tasks ADD COLUMN IF NOT EXISTS due_date_only BOOLEAN DEFAULT true;
ALTER TABLE public.clickup_tasks ADD COLUMN IF NOT EXISTS checklists JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.clickup_tasks ADD COLUMN IF NOT EXISTS comments JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.clickup_tasks ADD COLUMN IF NOT EXISTS tags JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.clickup_tasks ADD COLUMN IF NOT EXISTS order_index INTEGER DEFAULT 0;
ALTER TABLE public.clickup_tasks ADD COLUMN IF NOT EXISTS created_by UUID;
ALTER TABLE public.clickup_tasks ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Garantir constraints de prioridade de forma idempotente
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'clickup_tasks_priority_check'
  ) THEN
    ALTER TABLE public.clickup_tasks 
    ADD CONSTRAINT clickup_tasks_priority_check 
    CHECK (priority IN ('urgent', 'high', 'normal', 'low'));
  END IF;
END $$;

-- 7. Tabela de Canais (Workspace Channels)
CREATE TABLE IF NOT EXISTS public.workspace_channels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  team_id UUID REFERENCES public.workspace_teams(id) ON DELETE SET NULL,
  created_by UUID,
  is_private BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.workspace_channels ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE public.workspace_channels ADD COLUMN IF NOT EXISTS team_id UUID REFERENCES public.workspace_teams(id) ON DELETE SET NULL;
ALTER TABLE public.workspace_channels ADD COLUMN IF NOT EXISTS is_private BOOLEAN DEFAULT false;

-- 8. Tabela de Mensagens do Workspace (Workspace Messages)
CREATE TABLE IF NOT EXISTS public.workspace_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id TEXT NOT NULL,
  sender_name TEXT NOT NULL,
  sender_avatar TEXT,
  text TEXT NOT NULL,
  attachments JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =========================================================================
-- HABILITAR ROW LEVEL SECURITY (RLS) E POLÍTICAS DE ACESSO
-- =========================================================================

ALTER TABLE public.clickup_spaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clickup_folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clickup_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clickup_statuses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clickup_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_messages ENABLE ROW LEVEL SECURITY;

-- Políticas de acesso irrestrito para usuários autenticados e sessões
DROP POLICY IF EXISTS "Enable all actions for clickup_spaces" ON public.clickup_spaces;
CREATE POLICY "Enable all actions for clickup_spaces" ON public.clickup_spaces FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Enable all actions for clickup_folders" ON public.clickup_folders;
CREATE POLICY "Enable all actions for clickup_folders" ON public.clickup_folders FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Enable all actions for clickup_lists" ON public.clickup_lists;
CREATE POLICY "Enable all actions for clickup_lists" ON public.clickup_lists FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Enable all actions for clickup_statuses" ON public.clickup_statuses;
CREATE POLICY "Enable all actions for clickup_statuses" ON public.clickup_statuses FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Enable all actions for clickup_tasks" ON public.clickup_tasks;
CREATE POLICY "Enable all actions for clickup_tasks" ON public.clickup_tasks FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Enable all actions for workspace_teams" ON public.workspace_teams;
CREATE POLICY "Enable all actions for workspace_teams" ON public.workspace_teams FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Enable all actions for workspace_channels" ON public.workspace_channels;
CREATE POLICY "Enable all actions for workspace_channels" ON public.workspace_channels FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Enable all actions for workspace_messages" ON public.workspace_messages;
CREATE POLICY "Enable all actions for workspace_messages" ON public.workspace_messages FOR ALL USING (true) WITH CHECK (true);

-- =========================================================================
-- CARGA INICIAL DE ESPAÇOS E STATUS PADRÃO (SE NÃO EXISTIREM)
-- =========================================================================

INSERT INTO public.clickup_spaces (id, name, color, module) VALUES 
('11111111-1111-1111-1111-111111111111', 'LEADS & Vendas', '#f59e0b', 'vendas'),
('22222222-2222-2222-2222-222222222222', 'Projetos Globais', '#3b82f6', 'geral')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, color = EXCLUDED.color, module = EXCLUDED.module;

INSERT INTO public.clickup_lists (id, space_id, name, color) VALUES 
('33333333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111111', 'Funil de Vendas', '#10b981'),
('44444444-4444-4444-4444-444444444444', '11111111-1111-1111-1111-111111111111', 'Pós-Venda & Retenção', '#8b5cf6'),
('55555555-5555-5555-5555-555555555555', '22222222-2222-2222-2222-222222222222', 'Entregas Gerais', '#3b82f6')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, color = EXCLUDED.color;

INSERT INTO public.clickup_statuses (id, list_id, name, color, order_index) VALUES
('66666666-6666-6666-6666-666666666661', '33333333-3333-3333-3333-333333333333', 'A FAZER', '#94a3b8', 0),
('66666666-6666-6666-6666-666666666662', '33333333-3333-3333-3333-333333333333', 'EM ANDAMENTO', '#3b82f6', 1),
('66666666-6666-6666-6666-666666666663', '33333333-3333-3333-3333-333333333333', 'CONCLUÍDO', '#10b981', 2),
('77777777-7777-7777-7777-777777777771', '55555555-5555-5555-5555-555555555555', 'A FAZER', '#94a3b8', 0),
('77777777-7777-7777-7777-777777777772', '55555555-5555-5555-5555-555555555555', 'EM ANDAMENTO', '#3b82f6', 1),
('77777777-7777-7777-7777-777777777773', '55555555-5555-5555-5555-555555555555', 'CONCLUÍDO', '#10b981', 2)
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, color = EXCLUDED.color, order_index = EXCLUDED.order_index;
