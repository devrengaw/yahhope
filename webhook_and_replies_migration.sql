-- ==============================================================================
-- MIGRAÇÃO: WEBHOOK DO RESEND & STATUS DE RESPOSTAS / LEITURAS / REJEIÇÕES
-- ==============================================================================

-- 1. Adicionar colunas de tracking avançado em email_campaign_recipients
ALTER TABLE email_campaign_recipients 
  ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS bounced_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS replied_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS reply_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS reply_snippet TEXT;

-- 2. Adicionar contadores de respostas e bounces em email_campaigns
ALTER TABLE email_campaigns 
  ADD COLUMN IF NOT EXISTS replied_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS bounced_count INTEGER DEFAULT 0;

-- 3. Atualizar restrição de status em email_campaign_recipients para incluir 'replied' e 'bounced'
ALTER TABLE email_campaign_recipients 
  DROP CONSTRAINT IF EXISTS email_campaign_recipients_status_check;

ALTER TABLE email_campaign_recipients 
  ADD CONSTRAINT email_campaign_recipients_status_check 
  CHECK (status IN ('pending', 'sent', 'delivered', 'opened', 'clicked', 'replied', 'bounced', 'failed'));

-- 4. Índice para agilizar buscas pelo resend_id nas chamadas de webhook
CREATE INDEX IF NOT EXISTS idx_campaign_recipients_resend_id ON email_campaign_recipients(resend_id);
