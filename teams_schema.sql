-- Schema para o módulo de Equipes (Fase 1)

-- 1. Tabela de Equipes
CREATE TABLE IF NOT EXISTS public.workspace_teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  color TEXT DEFAULT '#3b82f6',
  created_by UUID REFERENCES public.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Tabela de Membros da Equipe
CREATE TABLE IF NOT EXISTS public.workspace_team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES public.workspace_teams(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('leader', 'member', 'admin')),
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(team_id, user_id)
);

-- 3. Atualização na tabela clickup_tasks
-- Adicionamos assignee_id e due_date para podermos ver "o que cada membro está fazendo"
ALTER TABLE public.clickup_tasks ADD COLUMN IF NOT EXISTS assignee_id UUID REFERENCES public.users(id) ON DELETE SET NULL;
ALTER TABLE public.clickup_tasks ADD COLUMN IF NOT EXISTS due_date TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.clickup_tasks ADD COLUMN IF NOT EXISTS due_date_only BOOLEAN DEFAULT true; -- Se é apenas a data ou tem hora específica

-- 4. Tabela de Feed de Atividades da Equipe
CREATE TABLE IF NOT EXISTS public.workspace_team_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES public.workspace_teams(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  action TEXT NOT NULL, -- e.g., 'completed_task', 'commented', 'joined'
  target_name TEXT NOT NULL, -- O nome da tarefa/projeto/item interagido
  target_id UUID, -- Opcional, para linkar à tarefa
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.workspace_teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_team_activities ENABLE ROW LEVEL SECURITY;

-- Create Policies (Simples para desenvolvimento, ajustar para produção)
DROP POLICY IF EXISTS "Enable all actions for authenticated users" ON public.workspace_teams;
CREATE POLICY "Enable all actions for authenticated users" ON public.workspace_teams FOR ALL USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Enable all actions for authenticated users" ON public.workspace_team_members;
CREATE POLICY "Enable all actions for authenticated users" ON public.workspace_team_members FOR ALL USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Enable all actions for authenticated users" ON public.workspace_team_activities;
CREATE POLICY "Enable all actions for authenticated users" ON public.workspace_team_activities FOR ALL USING (auth.role() = 'authenticated');

-- Inserir dados mock para facilitar o teste (opcional)
-- INSERT INTO public.workspace_teams (id, name, description, color) VALUES 
-- ('99999999-9999-9999-9999-999999999999', 'Equipe de Marketing', 'Responsável pelas campanhas globais.', '#ec4899')
-- ON CONFLICT (id) DO NOTHING;
