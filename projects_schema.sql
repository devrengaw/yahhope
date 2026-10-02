-- Migration for Projects and Project Tasks
-- Supports both Communication and Administrative modules
-- Accessible by Super Admin and Project Creator

CREATE TABLE IF NOT EXISTS public.projects (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'planning',
  progress INTEGER DEFAULT 0,
  start_date TEXT,
  end_date TEXT,
  budget NUMERIC DEFAULT 0,
  is_private BOOLEAN DEFAULT false,
  category TEXT DEFAULT 'Geral',
  priority TEXT DEFAULT 'medium',
  invitees JSONB DEFAULT '[]'::jsonb,
  columns JSONB DEFAULT '[]'::jsonb,
  module TEXT DEFAULT 'admin', -- 'communication' | 'admin' | 'workspace'
  created_by TEXT,
  created_by_name TEXT,
  notes TEXT,
  enable_portal_updates BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.project_tasks (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'todo',
  priority TEXT DEFAULT 'medium',
  cost NUMERIC DEFAULT 0,
  subtasks JSONB DEFAULT '[]'::jsonb,
  invitees JSONB DEFAULT '[]'::jsonb,
  values JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_tasks ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Enable all access for authenticated users to projects" ON public.projects;
DROP POLICY IF EXISTS "Enable all access for anon to projects" ON public.projects;
DROP POLICY IF EXISTS "Enable all access for authenticated users to project_tasks" ON public.project_tasks;
DROP POLICY IF EXISTS "Enable all access for anon to project_tasks" ON public.project_tasks;

-- Create policies allowing full access to authenticated and anon users (app enforces creator/superadmin logic)
CREATE POLICY "Enable all access for authenticated users to projects"
  ON public.projects FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Enable all access for anon to projects"
  ON public.projects FOR ALL
  TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Enable all access for authenticated users to project_tasks"
  ON public.project_tasks FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Enable all access for anon to project_tasks"
  ON public.project_tasks FOR ALL
  TO anon
  USING (true)
  WITH CHECK (true);
