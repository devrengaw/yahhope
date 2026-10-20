-- ==============================================================================
-- SCRIPT SQL: DIAGNÓSTICO E LIMPEZA SEGURA DE DOAÇÕES DUPLICADAS
-- Execute este script no SQL Editor do seu Supabase Dashboard (https://supabase.com/dashboard)
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- PASSO 1: DIAGNÓSTICO PRÉVIO (Apenas Consulta - Não apaga nada)
-- Execute este trecho para inspecionar quais doadores possuem lançamentos repetidos
-- ------------------------------------------------------------------------------
SELECT 
  donor_name,
  donor_email,
  amount,
  COUNT(*) as quantidade_lancamentos,
  ARRAY_AGG(created_at::text ORDER BY created_at ASC) as horarios_criacao
FROM public.donations
GROUP BY donor_name, donor_email, amount
HAVING COUNT(*) > 1
ORDER BY quantidade_lancamentos DESC;

-- ------------------------------------------------------------------------------
-- PASSO 2: LIMPEZA ESPECÍFICA DO CASO CONFIRMADO (Ricardo Sanches Dos Santos)
-- O usuário confirmou que Ricardo doou apenas 1x de R$ 1.000,00 em 06/06/2026.
-- Mantém a primeira doação legítima e remove as outras 4 duplicatas.
-- ------------------------------------------------------------------------------
WITH ricardo_duplicates AS (
  SELECT 
    id,
    ROW_NUMBER() OVER (
      PARTITION BY LOWER(TRIM(donor_email)), amount, DATE(created_at)
      ORDER BY created_at ASC, id ASC
    ) as rn
  FROM public.donations
  WHERE LOWER(TRIM(donor_email)) = 'ridossantos@gmail.com'
)
DELETE FROM public.donations
WHERE id IN (
  SELECT id FROM ricardo_duplicates WHERE rn > 1
);

-- ------------------------------------------------------------------------------
-- PASSO 3: LIMPEZA SEGURA DE DUPLICATAS TÉCNICAS (Geral para todos os doadores)
-- Regra Estrita: Só remove se o lançamento foi gerado no MESMO MINUTO (rajada / duplo clique)
-- ou se tiver o mesmo stripe_payment_id repetido.
-- IMPORTANTE: Doações feitas em horários diferentes, dias diferentes ou meses diferentes
-- são 100% PRESERVADAS!
-- ------------------------------------------------------------------------------
WITH technical_duplicates AS (
  SELECT 
    id,
    donor_email,
    amount,
    status,
    created_at,
    ROW_NUMBER() OVER (
      PARTITION BY 
        LOWER(TRIM(COALESCE(donor_email, ''))), 
        amount, 
        status, 
        DATE_TRUNC('minute', created_at)
      ORDER BY created_at ASC, id ASC
    ) as rn
  FROM public.donations
  WHERE donor_email IS NOT NULL AND TRIM(donor_email) != ''
)
DELETE FROM public.donations
WHERE id IN (
  SELECT id FROM technical_duplicates WHERE rn > 1
);

-- 3.1 Remover duplicatas com mesmo stripe_payment_id idêntico
WITH stripe_duplicates AS (
  SELECT 
    id,
    ROW_NUMBER() OVER (
      PARTITION BY stripe_payment_id 
      ORDER BY created_at ASC, id ASC
    ) as rn
  FROM public.donations
  WHERE stripe_payment_id IS NOT NULL AND TRIM(stripe_payment_id) != ''
)
DELETE FROM public.donations
WHERE id IN (
  SELECT id FROM stripe_duplicates WHERE rn > 1
);

-- ------------------------------------------------------------------------------
-- PASSO 4: LIMPEZA DE APADRINHAMENTOS DUPLICADOS (sponsorships)
-- Mantém apenas 1 apadrinhamento ativo por apoiador/criança
-- ------------------------------------------------------------------------------
WITH duplicate_sponsorships AS (
  SELECT 
    id,
    ROW_NUMBER() OVER (
      PARTITION BY 
        COALESCE(LOWER(TRIM(donor_email)), sponsor_id::text),
        COALESCE(child_id::text, 'sem_crianca')
      ORDER BY created_at DESC, id ASC
    ) as rn
  FROM public.sponsorships
  WHERE status IN ('active', 'paid', 'ativo', 'confirmed')
)
DELETE FROM public.sponsorships
WHERE id IN (
  SELECT id FROM duplicate_sponsorships WHERE rn > 1
);

-- ------------------------------------------------------------------------------
-- PASSO 5: CONFERÊNCIA FINAL
-- Extrato limpo de Ricardo Sanches e resumo dos maiores doadores
-- ------------------------------------------------------------------------------
SELECT 
  id,
  donor_name,
  donor_email,
  amount,
  status,
  payment_method,
  created_at
FROM public.donations
WHERE LOWER(TRIM(donor_email)) = 'ridossantos@gmail.com'
ORDER BY created_at DESC;

SELECT 
  donor_name,
  donor_email,
  COUNT(*) as total_doacoes_reais,
  SUM(amount) as total_arrecadado
FROM public.donations
GROUP BY donor_name, donor_email
ORDER BY total_arrecadado DESC;
