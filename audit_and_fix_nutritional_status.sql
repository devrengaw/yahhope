-- ==============================================================================
-- SCRIPT DE AUDITORIA E CORREÇÃO DE STATUS NUTRICIONAL (PADRÃO OMS)
-- Execute no SQL Editor do seu Supabase Dashboard (https://supabase.com/dashboard)
-- ==============================================================================

-- 1. CONSULTA DE AUDITORIA:
-- Exibe as crianças cadastradas com seus últimos registros antropométricos,
-- o status atual registrado e a avaliação indicativa segundo a OMS.

WITH RankedEvents AS (
  SELECT 
    ce.id AS event_id,
    ce.child_id,
    ce.date,
    ce.weight,
    ce.height,
    ce.muac,
    ce.nutritional_status,
    ce.z_score_weight_height,
    c.name AS child_name,
    c.dob,
    c.gender,
    ROUND(CAST(EXTRACT(YEAR FROM age(CURRENT_DATE, c.dob::date)) * 12 + EXTRACT(MONTH FROM age(CURRENT_DATE, c.dob::date)) AS numeric), 1) AS age_months,
    ROW_NUMBER() OVER (PARTITION BY ce.child_id ORDER BY ce.date DESC, ce.created_at DESC) as rn
  FROM public.clinical_events ce
  JOIN public.children c ON c.id = ce.child_id
)
SELECT 
  child_name,
  gender,
  age_months,
  weight AS peso_kg,
  height AS altura_cm,
  muac AS muac_cm,
  nutritional_status AS status_atual,
  z_score_weight_height AS z_score_registrado,
  CASE
    -- Se MUAC < 11.5 cm -> DAG
    WHEN muac IS NOT NULL AND (muac < 11.5 OR (muac > 40 AND muac < 115)) THEN 'DAG (Critério MUAC < 11.5cm)'
    -- Se MUAC entre 11.5 e 12.4 cm -> DAM
    WHEN muac IS NOT NULL AND ((muac >= 11.5 AND muac < 12.5) OR (muac >= 115 AND muac < 125)) THEN 'DAM (Critério MUAC 11.5-12.4cm)'
    -- Se peso muito abaixo para a estatura (aproximação WFH OMS < -3SD)
    WHEN height IS NOT NULL AND weight IS NOT NULL AND (
      (gender = 'M' AND height >= 70 AND height <= 80 AND weight < 6.8) OR
      (gender = 'M' AND height > 80 AND height <= 90 AND weight < 8.8) OR
      (gender = 'M' AND height > 90 AND height <= 100 AND weight < 10.8) OR
      (gender = 'F' AND height >= 70 AND height <= 80 AND weight < 6.4) OR
      (gender = 'F' AND height > 80 AND height <= 90 AND weight < 8.4) OR
      (gender = 'F' AND height > 90 AND height <= 100 AND weight < 10.3)
    ) THEN 'DAG (Critério P/E < -3 DP)'
    ELSE 'Provável Adequado / Moderado (Não-DAG)'
  END AS diagnostico_estimado_oms
FROM RankedEvents
WHERE rn = 1
ORDER BY 
  CASE WHEN nutritional_status = 'DAG' THEN 1 WHEN nutritional_status = 'DAM' THEN 2 ELSE 3 END,
  child_name ASC;

-- ==============================================================================
-- 2. CORREÇÃO DE REGISTROS LEGADOS ONDE A CRIANÇA NÃO É DAG:
-- Se você constatar que crianças com peso adequado ou baixa estatura crônica 
-- foram registradas como DAG por engano, você pode atualizar os eventos
-- clínicos específicos pelo ID ou rodar a correção abaixo.
-- ==============================================================================

/*
-- Exemplo para corrigir manualmente uma criança específica pelo nome:
UPDATE public.clinical_events
SET nutritional_status = 'Adequado'
WHERE child_id IN (SELECT id FROM public.children WHERE name ILIKE '%NOME_DA_CRIANCA%')
  AND nutritional_status = 'DAG'
  AND (muac IS NULL OR muac >= 12.5 OR muac >= 125);
*/
