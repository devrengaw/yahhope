-- ============================================================
-- Migração: Aperfeiçoamento da Régua de Doações e Multi-Campanhas
-- Execute este script no SQL Editor do Supabase
-- ============================================================

-- 1. Colunas de tipo, prioridade e status na tabela campaigns
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'monthly' CHECK (type IN ('monthly', 'specific'));
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS priority INTEGER DEFAULT 1;
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS accept_pix BOOLEAN DEFAULT true;
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS accept_card BOOLEAN DEFAULT true;
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS start_date TIMESTAMP WITH TIME ZONE;
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS end_date TIMESTAMP WITH TIME ZONE;
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS reset_day INTEGER DEFAULT 1;
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS last_reset_at TIMESTAMP WITH TIME ZONE;

-- 2. Ativar todas as campanhas existentes (para que todas as 4 fiquem visíveis)
UPDATE campaigns 
SET is_active = true 
WHERE is_active IS NULL OR is_active = false;

-- 3. Preencher tipo padrão caso esteja nulo
UPDATE campaigns 
SET type = 'monthly' 
WHERE type IS NULL;

-- 4. Definir prioridade inicial incremental para campanhas existentes sem prioridade definida
WITH ranked AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY created_at ASC) as rnk
  FROM campaigns
)
UPDATE campaigns c
SET priority = r.rnk
FROM ranked r
WHERE c.id = r.id AND (c.priority IS NULL OR c.priority = 1);

-- 5. Índices de performance para consultas de doações e prioridade
CREATE INDEX IF NOT EXISTS idx_campaigns_priority ON campaigns(priority);
CREATE INDEX IF NOT EXISTS idx_campaigns_is_active ON campaigns(is_active);
CREATE INDEX IF NOT EXISTS idx_donations_campaign_date ON donations(campaign_id, created_at, status);
CREATE INDEX IF NOT EXISTS idx_donations_paid_at ON donations(paid_at, status);
