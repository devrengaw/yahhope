-- Migração para suporte a Itens de Patrimônio no Estoque
-- Adiciona colunas para identificar bens duráveis, tombamento, setor/localização e estado de conservação

ALTER TABLE inventory ADD COLUMN IF NOT EXISTS is_patrimonio BOOLEAN DEFAULT FALSE;
ALTER TABLE inventory ADD COLUMN IF NOT EXISTS patrimony_number TEXT;
ALTER TABLE inventory ADD COLUMN IF NOT EXISTS location TEXT;
ALTER TABLE inventory ADD COLUMN IF NOT EXISTS condition TEXT DEFAULT 'bom';

-- Atualizar itens existentes cuja categoria seja 'Patrimônio' ou similar
UPDATE inventory 
SET is_patrimonio = TRUE 
WHERE category ILIKE '%patrim%' AND (is_patrimonio IS NULL OR is_patrimonio = FALSE);
