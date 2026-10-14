-- ==============================================================================
-- MIGRAÇÃO SQL: INTEGRAÇÃO STRIPE & PERFIL DE MANTENEDORES
-- Execute este script no SQL Editor do Supabase se desejar armazenar os IDs da Stripe
-- ==============================================================================

-- 1. IDs da Stripe na tabela de usuários (users)
ALTER TABLE public.users 
  ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;

CREATE INDEX IF NOT EXISTS idx_users_stripe_customer_id ON public.users(stripe_customer_id);

-- 2. IDs da Stripe na tabela de apadrinhamentos (sponsorships)
ALTER TABLE public.sponsorships 
  ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT,
  ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;

CREATE INDEX IF NOT EXISTS idx_sponsorships_stripe_sub ON public.sponsorships(stripe_subscription_id);

-- 3. IDs da Stripe na tabela de doações (donations)
ALTER TABLE public.donations 
  ADD COLUMN IF NOT EXISTS stripe_payment_id TEXT,
  ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;

CREATE INDEX IF NOT EXISTS idx_donations_stripe_payment ON public.donations(stripe_payment_id);
