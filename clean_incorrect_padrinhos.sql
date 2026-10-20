-- ==============================================================================
-- SCRIPT SQL: CORREÇÃO E CLASSIFICAÇÃO RIGOROSA DE PADRINHOS E MANTENEDORES
-- Execute este script no SQL Editor do seu Supabase Dashboard (https://supabase.com/dashboard)
-- ==============================================================================

-- 1. DESVINCULAR CRIANÇA DE QUEM DOA MENOS DE R$ 90,00 (Ex: os 5 doadores de R$ 50,00)
-- A cota mínima para apadrinhar uma criança é R$ 90,00.
-- Doações de R$ 50,00 são classificadas como "Apoio Geral / Fundo Casa Nutri" (child_id = NULL).
UPDATE public.sponsorships
SET child_id = NULL
WHERE COALESCE(monthly_amount, 0) < 90.00;

-- 2. DESVINCULAR CRIANÇA DE QUEM NÃO TEM ASSINATURA MENSAL ATIVA NO STRIPE
-- Pessoas que fizeram apenas doação avulsa/pontual não podem ter criança vinculada.
UPDATE public.sponsorships
SET child_id = NULL
WHERE stripe_subscription_id IS NULL;

-- 3. REMOVER DA TABELA 'sponsorships' QUEM FEZ APENAS DOAÇÃO PONTUAL/AVULSA
-- Quem doou na ação do dia 06 de junho (ou outra doação avulsa) já está registrado
-- com segurança na tabela 'donations'. Não devem existir como assinatura em 'sponsorships'.
DELETE FROM public.sponsorships
WHERE stripe_subscription_id IS NULL;

-- 4. ATUALIZAR PAPEL NA TABELA 'users':
-- A) Quem tem criança vinculada e cota >= R$ 90 fica como SPONSOR (Padrinho)
UPDATE public.users
SET role = 'SPONSOR'
WHERE id IN (
  SELECT sponsor_id FROM public.sponsorships 
  WHERE child_id IS NOT NULL 
    AND COALESCE(monthly_amount, 0) >= 90.00
    AND sponsor_id IS NOT NULL
);

-- B) Quem é mantenedor mensal (recorrência ativa de R$ 50 ou apoio geral) fica como MANTENEDOR
UPDATE public.users
SET role = 'MANTENEDOR'
WHERE id IN (
  SELECT sponsor_id FROM public.sponsorships 
  WHERE (child_id IS NULL OR COALESCE(monthly_amount, 0) < 90.00)
    AND sponsor_id IS NOT NULL
)
AND id NOT IN (
  SELECT sponsor_id FROM public.sponsorships 
  WHERE child_id IS NOT NULL 
    AND COALESCE(monthly_amount, 0) >= 90.00
    AND sponsor_id IS NOT NULL
);

-- C) Quem fez apenas doação pontual/avulsa (sem assinatura mensal) volta a ser USER
UPDATE public.users
SET role = 'USER'
WHERE id NOT IN (
  SELECT sponsor_id FROM public.sponsorships WHERE sponsor_id IS NOT NULL
)
AND role IN ('SPONSOR', 'MANTENEDOR');

-- ==============================================================================
-- CONSULTAS DE CONFERÊNCIA E AUDITORIA (Execute e confira o resultado)
-- ==============================================================================

-- 5. CONFERÊNCIA 1: Padrinhos Ativos com Criança Vinculada (Deve listar apenas os que doam >= R$ 90)
SELECT 
  s.id,
  s.donor_name,
  s.donor_email,
  s.monthly_amount,
  c.name AS crianca_apadrinhada,
  s.status,
  s.stripe_subscription_id
FROM public.sponsorships s
INNER JOIN public.children c ON c.id = s.child_id
WHERE COALESCE(s.monthly_amount, 0) >= 90.00;

-- 6. CONFERÊNCIA 2: Mantenedores Mensais de Apoio Geral (Os doadores de R$ 50 sem criança)
SELECT 
  s.id,
  s.donor_name,
  s.donor_email,
  s.monthly_amount,
  'Apoio Geral / Fundo Casa Nutri' AS modalidade,
  s.status,
  s.stripe_subscription_id
FROM public.sponsorships s
WHERE s.child_id IS NULL OR COALESCE(s.monthly_amount, 0) < 90.00;

-- 7. CONFERÊNCIA 3: Total consolidado por modalidade
SELECT 
  CASE 
    WHEN s.child_id IS NOT NULL AND COALESCE(s.monthly_amount, 0) >= 90 THEN 'Padrinho (Criança Vinculada)'
    ELSE 'Mantenedor Mensal (Apoio Geral)'
  END AS classificacao,
  COUNT(*) AS total_apoiadores,
  SUM(COALESCE(s.monthly_amount, 0)) AS total_mensal_recorrente
FROM public.sponsorships s
GROUP BY 1;
