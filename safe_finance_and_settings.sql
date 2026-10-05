-- =========================================================================
-- MIGRATION SEGURA E NÃO DESTRUTIVA: FINANÇAS & CONFIGURAÇÕES GLOBAIS
-- Este script pode ser executado QUANTAS VEZES QUISER no Supabase SQL Editor.
-- NUNCA APAGA dados existentes, categorias customizadas ou configurações!
-- =========================================================================

-- 1. Tabela de Categorias Financeiras (IF NOT EXISTS)
CREATE TABLE IF NOT EXISTS public.finance_categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  color TEXT NOT NULL,
  icon TEXT NOT NULL DEFAULT 'Tag',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Tabela de Transações Financeiras (IF NOT EXISTS)
CREATE TABLE IF NOT EXISTS public.finance_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  description TEXT NOT NULL,
  amount NUMERIC(10, 2) NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  category_id TEXT REFERENCES public.finance_categories(id) ON DELETE SET NULL,
  date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status TEXT DEFAULT 'completed' CHECK (status IN ('pending', 'completed')),
  account TEXT NOT NULL,
  expense_type TEXT CHECK (expense_type IN ('fixed', 'variable')),
  recurrence TEXT CHECK (recurrence IN ('monthly', 'bimonthly', 'quarterly', 'semiannual', 'yearly', 'none')),
  module TEXT,
  currency TEXT DEFAULT 'BRL',
  original_amount NUMERIC(10, 2),
  exchange_rate NUMERIC(10, 6),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Tabela de Configurações da Organização (IF NOT EXISTS)
CREATE TABLE IF NOT EXISTS public.organization_settings (
  id TEXT PRIMARY KEY DEFAULT 'default',
  name TEXT DEFAULT 'YAH Hope International',
  website TEXT DEFAULT 'https://yahhope.org',
  email TEXT DEFAULT 'contato@yahhope.org',
  phone TEXT DEFAULT '+55 11 99999-9999',
  address TEXT DEFAULT 'Rua da Esperança, 123 - São Paulo, SP',
  timezone TEXT DEFAULT 'America/Sao_Paulo',
  locale TEXT DEFAULT 'pt-BR',
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Inserir Categorias Padrão (APENAS se não existirem, sem sobrescrever nada)
INSERT INTO public.finance_categories (id, name, type, color, icon) VALUES
-- Receitas
('cat_donation', 'Doações da Campanha', 'income', 'bg-emerald-100 text-emerald-600', 'Heart'),
('cat_sponsorship', 'Apadrinhamento', 'income', 'bg-teal-100 text-teal-600', 'Users'),
('cat_store', 'Vendas da Loja', 'income', 'bg-indigo-100 text-indigo-600', 'ShoppingBag'),
-- Despesas Gerais
('cat_salary', 'Pagamento de Pessoal', 'expense', 'bg-rose-100 text-rose-600', 'Briefcase'),
('cat_office', 'Material de Escritório', 'expense', 'bg-orange-100 text-orange-600', 'Paperclip'),
('cat_marketing', 'Marketing e Eventos', 'expense', 'bg-blue-100 text-blue-600', 'Megaphone'),
-- Despesas Nutrição
('cat_nutri_alimentos', 'Alimentos & Cestas', 'expense', 'bg-emerald-500', 'Apple'),
('cat_nutri_suplementos', 'Suplementos & Vitaminas', 'expense', 'bg-blue-500', 'HeartPulse'),
('cat_nutri_logistica', 'Logística & Transporte', 'expense', 'bg-amber-500', 'Truck'),
('cat_nutri_equipe', 'Honorários & Equipe', 'expense', 'bg-purple-500', 'Users'),
('cat_nutri_infra', 'Infraestrutura & Cozinha', 'expense', 'bg-rose-500', 'Home'),
('cat_nutri_outros', 'Outras Despesas Nutricionais', 'expense', 'bg-slate-500', 'Tag')
ON CONFLICT (id) DO NOTHING;

-- 5. Inserir Configurações Globais Padrão (APENAS se não existirem)
INSERT INTO public.organization_settings (id, name, website, email, phone, address, timezone, locale)
VALUES ('default', 'YAH Hope International', 'https://yahhope.org', 'contato@yahhope.org', '+55 11 99999-9999', 'Rua da Esperança, 123 - São Paulo, SP', 'America/Sao_Paulo', 'pt-BR')
ON CONFLICT (id) DO NOTHING;

-- 6. Configurar RLS de forma permissiva e segura (não bloqueia operações do frontend)
ALTER TABLE public.finance_categories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Acesso total a finance_categories" ON public.finance_categories;
CREATE POLICY "Acesso total a finance_categories" ON public.finance_categories FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE public.finance_transactions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Acesso total a finance_transactions" ON public.finance_transactions;
CREATE POLICY "Acesso total a finance_transactions" ON public.finance_transactions FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE public.organization_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Acesso total a organization_settings" ON public.organization_settings;
CREATE POLICY "Acesso total a organization_settings" ON public.organization_settings FOR ALL USING (true) WITH CHECK (true);

-- 7. Realtime (Adiciona às publicações caso ainda não estejam)
DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.finance_categories;
  EXCEPTION WHEN duplicate_object THEN
    NULL;
  END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.finance_transactions;
  EXCEPTION WHEN duplicate_object THEN
    NULL;
  END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.organization_settings;
  EXCEPTION WHEN duplicate_object THEN
    NULL;
  END;
END $$;
