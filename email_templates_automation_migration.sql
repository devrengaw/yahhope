-- ==============================================================================
-- MIGRAÇÃO: AUTOMAÇÃO, AGENDAMENTO E STATUS DE TEMPLATES DE E-MAIL
-- ==============================================================================

-- Adiciona campos de controle de disparo automático e frequência na tabela email_templates
ALTER TABLE public.email_templates
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS send_frequency TEXT DEFAULT 'monthly',
  ADD COLUMN IF NOT EXISTS send_day INTEGER DEFAULT 1,
  ADD COLUMN IF NOT EXISTS send_time TEXT DEFAULT '09:00',
  ADD COLUMN IF NOT EXISTS last_sent_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS next_run_at TIMESTAMP WITH TIME ZONE;

-- Comentários para documentação das colunas
COMMENT ON COLUMN public.email_templates.is_active IS 'Indica se o envio automático deste template está ligado (true) ou desligado (false)';
COMMENT ON COLUMN public.email_templates.send_frequency IS 'Frequência de envio: monthly, weekly, biweekly, quarterly, manual';
COMMENT ON COLUMN public.email_templates.send_day IS 'Dia do mês ou da semana programado para o envio';
COMMENT ON COLUMN public.email_templates.send_time IS 'Horário programado para o disparo (ex: 09:00)';
COMMENT ON COLUMN public.email_templates.last_sent_at IS 'Data e hora do último disparo realizado';
COMMENT ON COLUMN public.email_templates.next_run_at IS 'Data e hora calculada para o próximo disparo';

-- Garante que prestação de contas comece pausada caso não esteja configurada
UPDATE public.email_templates
SET is_active = false
WHERE name = 'accountability' AND is_active IS NULL;
