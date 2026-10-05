-- Suporte a formas farmacêuticas (comprimido / líquido) e unidades por embalagem no estoque
-- Adiciona colunas para identificar se o medicamento é comprimido ou líquido,
-- quantidade de comprimidos por caixa e volume em ml por frasco.

ALTER TABLE inventory ADD COLUMN IF NOT EXISTS dosage_form TEXT; -- 'comprimido', 'liquido', 'outro'
ALTER TABLE inventory ADD COLUMN IF NOT EXISTS package_units NUMERIC; -- comprimidos por caixa
ALTER TABLE inventory ADD COLUMN IF NOT EXISTS liquid_volume_ml NUMERIC; -- volume em ml por frasco
