-- Schema para o módulo de Agenda e Integrações

-- 1. Tabela de Tokens de Calendário Externo (OAuth)
CREATE TABLE IF NOT EXISTS public.user_calendar_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL CHECK (provider IN ('google', 'microsoft')),
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, provider)
);

-- 2. Tabela de Eventos (Reuniões, Disponibilidade, etc)
CREATE TABLE IF NOT EXISTS public.workspace_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  event_type TEXT NOT NULL CHECK (event_type IN ('meeting', 'availability')),
  creator_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  google_event_id TEXT,
  microsoft_event_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Tabela de Convidados dos Eventos
CREATE TABLE IF NOT EXISTS public.workspace_event_attendees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.workspace_events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(event_id, user_id)
);

-- Enable RLS
ALTER TABLE public.user_calendar_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_event_attendees ENABLE ROW LEVEL SECURITY;

-- Create Policies (Idempotent for dev)
DROP POLICY IF EXISTS "Enable all actions for authenticated users" ON public.user_calendar_tokens;
CREATE POLICY "Enable all actions for authenticated users" ON public.user_calendar_tokens FOR ALL USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Enable all actions for authenticated users" ON public.workspace_events;
CREATE POLICY "Enable all actions for authenticated users" ON public.workspace_events FOR ALL USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Enable all actions for authenticated users" ON public.workspace_event_attendees;
CREATE POLICY "Enable all actions for authenticated users" ON public.workspace_event_attendees FOR ALL USING (auth.role() = 'authenticated');
