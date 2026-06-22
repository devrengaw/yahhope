-- Atualizações para o Workspace: Canais

CREATE TABLE IF NOT EXISTS public.workspace_channels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.workspace_channels ENABLE ROW LEVEL SECURITY;

-- Create Policies (Para desenvolvimento)
DROP POLICY IF EXISTS "Enable all actions for authenticated users" ON public.workspace_channels;
CREATE POLICY "Enable all actions for authenticated users" ON public.workspace_channels FOR ALL USING (auth.role() = 'authenticated');

-- Inserir canal geral por padrão
INSERT INTO public.workspace_channels (id, name) VALUES 
('c1111111-1111-1111-1111-111111111111', 'geral')
ON CONFLICT (id) DO NOTHING;
