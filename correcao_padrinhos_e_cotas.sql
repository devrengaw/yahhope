-- ==============================================================================
-- SCRIPT DE CORREÇÃO: PADRINHOS, COTAS MÍNIMAS (R$ 90) E VÍNCULO DE CRIANÇAS
-- ==============================================================================
-- 1. Garante que nenhuma cota de apadrinhamento fique com R$ 30,00 (mínimo R$ 90,00)
-- 2. Normaliza o status de apadrinhamento para 'active' para que todas as crianças
--    apareçam vinculadas no módulo de Crianças / Quotização e em Finanças
-- 3. Corrige transações financeiras e doações geradas com valor de R$ 30,00
-- ==============================================================================

-- PREVENÇÃO: Garante colunas necessárias em public.sponsorships e public.donations
ALTER TABLE public.sponsorships ADD COLUMN IF NOT EXISTS monthly_amount NUMERIC(10, 2) DEFAULT 90.00;
ALTER TABLE public.sponsorships ADD COLUMN IF NOT EXISTS donor_name TEXT;
ALTER TABLE public.sponsorships ADD COLUMN IF NOT EXISTS donor_email TEXT;
ALTER TABLE public.sponsorships ADD COLUMN IF NOT EXISTS donor_phone TEXT;
ALTER TABLE public.sponsorships ADD COLUMN IF NOT EXISTS quotas_count INTEGER DEFAULT 1;
ALTER TABLE public.donations ADD COLUMN IF NOT EXISTS is_sponsorship BOOLEAN DEFAULT false;

-- PASSO 1: Atualizar o valor de qualquer cota de apadrinhamento inferior a R$ 90,00
UPDATE public.sponsorships
SET monthly_amount = 90.00
WHERE (monthly_amount < 90 OR monthly_amount IS NULL)
  AND child_id IS NOT NULL;

-- PASSO 2: Normalizar o status para 'active' para evitar que a cota seja ignorada nas listagens
UPDATE public.sponsorships
SET status = 'active'
WHERE child_id IS NOT NULL 
  AND (status IS NULL OR status IN ('ativo', 'Ativo', 'pending', 'confirmed', 'paid', 'completed', 'ACTIVE', ''));

-- PASSO 3: Se houver lançamentos no extrato financeiro (finance_transactions) com R$ 30,00, corrigir para R$ 90,00
UPDATE public.finance_transactions
SET amount = 90.00
WHERE amount = 30.00
  AND (
    category_id = 'cat_sponsorship' 
    OR LOWER(description) LIKE '%apadrinh%'
    OR LOWER(description) LIKE '%padrinho%'
  );

-- PASSO 4: Se houver doações de R$ 30,00 registradas para padrinhos, corrigir para R$ 90,00
UPDATE public.donations d
SET amount = 90.00
WHERE d.amount = 30.00
  AND (
    d.is_sponsorship = TRUE
    OR EXISTS (
      SELECT 1 FROM public.sponsorships s 
      WHERE LOWER(TRIM(s.donor_email)) = LOWER(TRIM(d.donor_email))
    )
  );

-- ==============================================================================
-- AUDITORIA E CONFERÊNCIA: Verifique os 10 Padrinhos e suas Crianças
-- ==============================================================================

-- A) Listar todos os padrinhos ativos e a contagem de crianças apadrinhadas
SELECT 
  COALESCE(u.name, s.donor_name, 'Padrinho Sem Nome') AS padrinho_nome,
  COALESCE(u.email, s.donor_email) AS padrinho_email,
  COUNT(s.id) AS total_cotas_criancas,
  SUM(COALESCE(s.monthly_amount, 90.00)) AS valor_mensal_total,
  STRING_AGG(COALESCE(c.name, 'Aguardando Atribuição'), ', ') AS criancas_vinculadas
FROM public.sponsorships s
LEFT JOIN public.users u ON u.id = s.sponsor_id OR LOWER(u.email) = LOWER(s.donor_email)
LEFT JOIN public.children c ON c.id = s.child_id
WHERE s.status = 'active' 
  AND s.child_id IS NOT NULL
GROUP BY COALESCE(u.name, s.donor_name, 'Padrinho Sem Nome'), COALESCE(u.email, s.donor_email)
ORDER BY total_cotas_criancas DESC, valor_mensal_total DESC;

-- B) Listar todas as crianças e verificar seus padrinhos alocados
SELECT 
  c.name AS crianca_nome,
  c.address AS aldeia_comunidade,
  COUNT(s.id) AS padrinhos_vinculados,
  STRING_AGG(COALESCE(s.donor_name, u.name, s.donor_email), ', ') AS nomes_padrinhos,
  STRING_AGG(CONCAT('R$ ', COALESCE(s.monthly_amount, 90.00)::text), ', ') AS valores_cotas
FROM public.children c
LEFT JOIN public.sponsorships s ON s.child_id = c.id AND s.status = 'active'
LEFT JOIN public.users u ON u.id = s.sponsor_id
GROUP BY c.id, c.name, c.address
ORDER BY padrinhos_vinculados ASC, c.name ASC;
