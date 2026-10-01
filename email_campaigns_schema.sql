-- ==============================================================================
-- SCHEMA PARA CAMPANHAS DE E-MAIL E RASTREAMENTO (MAILCHIMP STYLE)
-- ==============================================================================

-- 1. Tabela de Campanhas de E-mail
CREATE TABLE IF NOT EXISTS email_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  subject TEXT NOT NULL,
  preheader TEXT,
  heading TEXT,
  body_html TEXT NOT NULL,
  sender_name TEXT DEFAULT 'YAH Hope',
  sender_email TEXT DEFAULT 'contato@yahhope.com',
  reply_to TEXT,
  audience_type TEXT DEFAULT 'all', -- 'all', 'apoiadores', 'donors', 'sponsors', 'volunteers', 'caregivers', 'custom', 'mixed'
  audience_summary TEXT, -- Resumo descritivo dos destinatários
  has_cta BOOLEAN DEFAULT false,
  cta_text TEXT,
  cta_url TEXT,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'sending', 'sent', 'failed')),
  total_recipients INTEGER DEFAULT 0,
  sent_count INTEGER DEFAULT 0,
  delivered_count INTEGER DEFAULT 0,
  opened_count INTEGER DEFAULT 0,
  clicked_count INTEGER DEFAULT 0,
  replied_count INTEGER DEFAULT 0,
  bounced_count INTEGER DEFAULT 0,
  failed_count INTEGER DEFAULT 0,
  scheduled_for TIMESTAMP WITH TIME ZONE,
  sent_at TIMESTAMP WITH TIME ZONE,
  created_by UUID, -- ID do usuário/administrador que criou (sem chave estrangeira fixa para evitar erro de tabela inexistente)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Tabela de Destinatários Individuais e Rastreamento
CREATE TABLE IF NOT EXISTS email_campaign_recipients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES email_campaigns(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT,
  recipient_type TEXT DEFAULT 'apoiador', -- 'apoiador', 'user', 'donor', 'sponsor', 'caregiver', 'external'
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'delivered', 'opened', 'clicked', 'replied', 'bounced', 'failed')),
  resend_id TEXT,
  error_message TEXT,
  sent_at TIMESTAMP WITH TIME ZONE,
  delivered_at TIMESTAMP WITH TIME ZONE,
  opened_at TIMESTAMP WITH TIME ZONE,
  open_count INTEGER DEFAULT 0,
  clicked_at TIMESTAMP WITH TIME ZONE,
  click_count INTEGER DEFAULT 0,
  replied_at TIMESTAMP WITH TIME ZONE,
  reply_count INTEGER DEFAULT 0,
  reply_snippet TEXT,
  bounced_at TIMESTAMP WITH TIME ZONE,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Índices para performance de busca e rastreamento
CREATE INDEX IF NOT EXISTS idx_campaign_recipients_cid ON email_campaign_recipients(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_recipients_email ON email_campaign_recipients(email);
CREATE INDEX IF NOT EXISTS idx_campaign_recipients_resend ON email_campaign_recipients(resend_id);
CREATE INDEX IF NOT EXISTS idx_campaign_recipients_status ON email_campaign_recipients(status);
CREATE INDEX IF NOT EXISTS idx_campaigns_status ON email_campaigns(status);

-- 4. Habilitar RLS (Row Level Security) nas tabelas
ALTER TABLE email_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_campaign_recipients ENABLE ROW LEVEL SECURITY;

-- 5. Políticas de Segurança (RLS)
-- Acesso completo para usuários autenticados da equipe
DROP POLICY IF EXISTS "Staff_Full_Access_Campaigns" ON email_campaigns;
CREATE POLICY "Staff_Full_Access_Campaigns" ON email_campaigns
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Staff_Full_Access_Recipients" ON email_campaign_recipients;
CREATE POLICY "Staff_Full_Access_Recipients" ON email_campaign_recipients
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);

-- Permissões públicas para rastreamento (permite que clientes de e-mail como Gmail e Outlook carreguem o pixel 1x1 e links sem exigir autenticação)
DROP POLICY IF EXISTS "Public_Track_Update_Recipients" ON email_campaign_recipients;
CREATE POLICY "Public_Track_Update_Recipients" ON email_campaign_recipients
  FOR UPDATE TO anon
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Public_Track_Select_Recipients" ON email_campaign_recipients;
CREATE POLICY "Public_Track_Select_Recipients" ON email_campaign_recipients
  FOR SELECT TO anon
  USING (true);

DROP POLICY IF EXISTS "Public_Track_Update_Campaigns" ON email_campaigns;
CREATE POLICY "Public_Track_Update_Campaigns" ON email_campaigns
  FOR UPDATE TO anon
  USING (true)
  WITH CHECK (true);
