-- ==============================================================================
-- MIGRAÇÃO: PACOTES DE APADRINHAMENTO VIA PIX (3, 6 e 12 MESES)
-- ==============================================================================
-- Registra a duração do pacote pago via PIX, o valor total do pacote, a data de
-- início, a data de expiração e se o padrinho optou por não renovar após o ciclo.
-- ==============================================================================

ALTER TABLE public.sponsorships
  ADD COLUMN IF NOT EXISTS plan_months INTEGER DEFAULT 1,
  ADD COLUMN IF NOT EXISTS package_amount NUMERIC(10, 2),
  ADD COLUMN IF NOT EXISTS started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS renewal_declined BOOLEAN DEFAULT false;

-- Índice para consultas rápidas de vigência e expiração
CREATE INDEX IF NOT EXISTS idx_sponsorships_expires_at
  ON public.sponsorships (expires_at)
  WHERE expires_at IS NOT NULL;
