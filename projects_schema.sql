-- ==============================================================================
-- SCHEMA ROBUSTO E COMPATÍVEL PARA PROJETOS E TAREFAS (YAH HOPE)
-- Execute este script no SQL Editor do seu painel do Supabase.
-- Ele é totalmente idempotente (pode ser executado várias vezes sem erro).
-- ==============================================================================

-- 1. Criação das tabelas base caso ainda não existam
CREATE TABLE IF NOT EXISTS public.projects (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS public.project_tasks (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  title TEXT NOT NULL
);

-- 2. Adição segura de colunas (caso a tabela já existisse anteriormente)
DO $$ 
BEGIN
  -- Colunas para public.projects
  ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS description TEXT;
  ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'planning';
  ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS progress INTEGER DEFAULT 0;
  ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS start_date TEXT;
  ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS end_date TEXT;
  ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS budget NUMERIC DEFAULT 0;
  ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS is_private BOOLEAN DEFAULT false;
  ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'Geral';
  ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'medium';
  ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS invitees JSONB DEFAULT '[]'::jsonb;
  ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS columns JSONB DEFAULT '[]'::jsonb;
  ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS module TEXT DEFAULT 'admin';
  ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS created_by TEXT;
  ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS created_by_name TEXT;
  ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS notes TEXT;
  ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS enable_portal_updates BOOLEAN DEFAULT false;
  ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
  ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

  -- Colunas para public.project_tasks
  ALTER TABLE public.project_tasks ADD COLUMN IF NOT EXISTS description TEXT;
  ALTER TABLE public.project_tasks ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'todo';
  ALTER TABLE public.project_tasks ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'medium';
  ALTER TABLE public.project_tasks ADD COLUMN IF NOT EXISTS cost NUMERIC DEFAULT 0;
  ALTER TABLE public.project_tasks ADD COLUMN IF NOT EXISTS subtasks JSONB DEFAULT '[]'::jsonb;
  ALTER TABLE public.project_tasks ADD COLUMN IF NOT EXISTS invitees JSONB DEFAULT '[]'::jsonb;
  ALTER TABLE public.project_tasks ADD COLUMN IF NOT EXISTS values JSONB DEFAULT '{}'::jsonb;
  ALTER TABLE public.project_tasks ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
  ALTER TABLE public.project_tasks ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
END $$;

-- 3. Índices de performance
CREATE INDEX IF NOT EXISTS idx_projects_module ON public.projects(module);
CREATE INDEX IF NOT EXISTS idx_projects_created_by ON public.projects(created_by);
CREATE INDEX IF NOT EXISTS idx_project_tasks_project_id ON public.project_tasks(project_id);

-- 4. Configuração de Políticas de Acesso (RLS)
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_tasks ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  -- Remover políticas anteriores se existirem
  DROP POLICY IF EXISTS "Permitir tudo em projects para todos" ON public.projects;
  DROP POLICY IF EXISTS "Enable all access for authenticated users to projects" ON public.projects;
  DROP POLICY IF EXISTS "Enable all access for anon to projects" ON public.projects;

  -- Criar política unificada para public.projects
  CREATE POLICY "Permitir tudo em projects para todos"
    ON public.projects FOR ALL
    TO anon, authenticated
    USING (true)
    WITH CHECK (true);

  -- Remover políticas anteriores de tarefas
  DROP POLICY IF EXISTS "Permitir tudo em project_tasks para todos" ON public.project_tasks;
  DROP POLICY IF EXISTS "Enable all access for authenticated users to project_tasks" ON public.project_tasks;
  DROP POLICY IF EXISTS "Enable all access for anon to project_tasks" ON public.project_tasks;

  -- Criar política unificada para public.project_tasks
  CREATE POLICY "Permitir tudo em project_tasks para todos"
    ON public.project_tasks FOR ALL
    TO anon, authenticated
    USING (true)
    WITH CHECK (true);
END $$;
