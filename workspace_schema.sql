-- Schema inicial para a Fase 1: Fundação do Workspace

-- 1. Espaços
CREATE TABLE IF NOT EXISTS public.clickup_spaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  color TEXT DEFAULT '#3b82f6',
  icon TEXT DEFAULT 'layout',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Pastas (Folders - opcional, ficam dentro de espaços)
CREATE TABLE IF NOT EXISTS public.clickup_folders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  space_id UUID NOT NULL REFERENCES public.clickup_spaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Listas (Ficam dentro de Pastas ou direto nos Espaços)
CREATE TABLE IF NOT EXISTS public.clickup_lists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  space_id UUID NOT NULL REFERENCES public.clickup_spaces(id) ON DELETE CASCADE,
  folder_id UUID REFERENCES public.clickup_folders(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT DEFAULT '#10b981',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Status (Etapas do Kanban / Lista)
CREATE TABLE IF NOT EXISTS public.clickup_statuses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  list_id UUID NOT NULL REFERENCES public.clickup_lists(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT NOT NULL,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Tarefas (Apenas o básico para a Fase 1 e 2)
CREATE TABLE IF NOT EXISTS public.clickup_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  list_id UUID NOT NULL REFERENCES public.clickup_lists(id) ON DELETE CASCADE,
  status_id UUID REFERENCES public.clickup_statuses(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.clickup_spaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clickup_folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clickup_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clickup_statuses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clickup_tasks ENABLE ROW LEVEL SECURITY;

-- Create Policies (Para desenvolvimento, liberando acesso total. Ajustar para produção depois)
CREATE POLICY "Enable all actions for authenticated users" ON public.clickup_spaces FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Enable all actions for authenticated users" ON public.clickup_folders FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Enable all actions for authenticated users" ON public.clickup_lists FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Enable all actions for authenticated users" ON public.clickup_statuses FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Enable all actions for authenticated users" ON public.clickup_tasks FOR ALL USING (auth.role() = 'authenticated');

-- Inserir dados padrão (MOCK) para podermos testar imediatamente
INSERT INTO public.clickup_spaces (id, name, color) VALUES 
('11111111-1111-1111-1111-111111111111', 'LEADS', '#f59e0b'),
('22222222-2222-2222-2222-222222222222', 'Projetos Globais', '#3b82f6')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.clickup_lists (id, space_id, name, color) VALUES 
('33333333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111111', 'Vendas', '#10b981'),
('44444444-4444-4444-4444-444444444444', '11111111-1111-1111-1111-111111111111', 'Pós Venda', '#8b5cf6')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.clickup_statuses (id, list_id, name, color, order_index) VALUES
('55555555-5555-5555-5555-555555555555', '33333333-3333-3333-3333-333333333333', 'A FAZER', '#d1d5db', 0),
('66666666-6666-6666-6666-666666666666', '33333333-3333-3333-3333-333333333333', 'EM ANDAMENTO', '#3b82f6', 1),
('77777777-7777-7777-7777-777777777777', '33333333-3333-3333-3333-333333333333', 'CONCLUÍDO', '#10b981', 2)
ON CONFLICT (id) DO NOTHING;
