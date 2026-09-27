-- ============================================================
-- Migração: Aperfeiçoamento da Régua de Doações e Multi-Campanhas
-- ============================================================

-- 1. Adicionar colunas de suporte a tipo e periodicidade na tabela campaigns
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'monthly' CHECK (type IN ('monthly', 'specific'));
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS start_date TIMESTAMP WITH TIME ZONE;
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS end_date TIMESTAMP WITH TIME ZONE;
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS reset_day INTEGER DEFAULT 1;
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS last_reset_at TIMESTAMP WITH TIME ZONE;

-- 2. Garantir índices de performance para consultas de doações por campanha e data
CREATE INDEX IF NOT EXISTS idx_donations_campaign_date ON donations(campaign_id, created_at, status);
CREATE INDEX IF NOT EXISTS idx_donations_paid_at ON donations(paid_at, status);

-- 3. Atualizar campanhas existentes para garantir defaults coerentes
UPDATE campaigns 
SET type = 'monthly' 
WHERE type IS NULL;
