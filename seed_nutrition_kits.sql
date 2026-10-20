-- ==============================================================================
-- SCRIPT SQL: CRIAÇÃO E GARANTIA DOS PRODUTOS DOS KITS DE NUTRIÇÃO (CASA NUTRI)
-- Execute este script no SQL Editor do seu Supabase Dashboard
-- ==============================================================================

-- 1. Garante a tabela de kits
CREATE TABLE IF NOT EXISTS public.kits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Garante a tabela de itens do kit
CREATE TABLE IF NOT EXISTS public.kit_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kit_id UUID REFERENCES public.kits(id) ON DELETE CASCADE,
  item_id UUID REFERENCES public.inventory(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Adiciona a coluna 'dosage' caso ela ainda não exista na tabela existente
ALTER TABLE public.kit_items ADD COLUMN IF NOT EXISTS dosage TEXT;

-- 4. Garante a constraint de unicidade (kit_id, item_id)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'kit_items_kit_id_item_id_key' 
       OR (conrelid = 'public.kit_items'::regclass AND contype = 'u')
  ) THEN
    ALTER TABLE public.kit_items ADD CONSTRAINT kit_items_kit_id_item_id_key UNIQUE (kit_id, item_id);
  END IF;
EXCEPTION
  WHEN OTHERS THEN NULL;
END $$;

-- 5. Desabilita RLS para leitura/gravação sem bloqueio
ALTER TABLE public.kits DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.kit_items DISABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Permitir tudo em kits" ON public.kits;
CREATE POLICY "Permitir tudo em kits" ON public.kits FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir tudo em kit_items" ON public.kit_items;
CREATE POLICY "Permitir tudo em kit_items" ON public.kit_items FOR ALL USING (true) WITH CHECK (true);

-- 6. Inserção dos Insumos Essenciais de Nutrição no Estoque (inventory)
INSERT INTO public.inventory (name, category, quantity, unit, min_quantity, purchase_price, currency)
VALUES 
  ('Arroz de Primeira', 'Alimentação', 150, 'kg', 50, 65.00, 'MZN'),
  ('Feijão Manteiga', 'Alimentação', 80, 'kg', 30, 90.00, 'MZN'),
  ('Farinha de Milho / Composta', 'Alimentação', 100, 'kg', 40, 55.00, 'MZN'),
  ('Óleo Vegetal Alimentar', 'Alimentação', 60, 'litro', 25, 110.00, 'MZN'),
  ('Açúcar Branco', 'Alimentação', 80, 'kg', 30, 60.00, 'MZN'),
  ('Sal Iodado', 'Alimentação', 40, 'kg', 20, 25.00, 'MZN'),
  ('Sabão em Barra', 'Higiene', 100, 'unidades', 40, 35.00, 'MZN'),
  ('Fórmula Infantil Lactente (0 a 6 meses)', 'Nutrição Infantil', 50, 'latas', 20, 450.00, 'MZN'),
  ('Suplemento Vitamínico Pediátrico', 'Suplementos', 40, 'frascos', 15, 180.00, 'MZN'),
  ('Copo / Dosador Graduado', 'Consumo', 40, 'unidades', 20, 50.00, 'MZN'),
  ('Farinha Enriquecida / CSB (Corn-Soy Blend)', 'Nutrição Infantil', 120, 'kg', 40, 85.00, 'MZN'),
  ('Leite em Pó Integral Fortificado', 'Alimentação', 90, 'latas', 30, 220.00, 'MZN'),
  ('Multivitamínico e Micronutrientes Pediátrico', 'Suplementos', 60, 'frascos', 25, 195.00, 'MZN'),
  ('Farinha Composta Fortificada', 'Nutrição Infantil', 80, 'kg', 35, 80.00, 'MZN'),
  ('Complexo Vitamínico Infantil', 'Suplementos', 50, 'frascos', 20, 190.00, 'MZN'),
  ('Alimento Terapêutico Pronto (RUTF / Plumpy)', 'Nutrição Clínica', 200, 'sachês', 50, 45.00, 'MZN'),
  ('Multivitamínico & Zinco Pediátrico', 'Medicamentos', 50, 'frascos', 25, 175.00, 'MZN')
ON CONFLICT DO NOTHING;

-- 7. Inserção dos 5 Kits Oficiais da Casa Nutri (se não existirem)
INSERT INTO public.kits (name, description)
SELECT 'Cesta Básica Familiar', 'Cesta básica universal entregue a 100% das famílias atendidas na Casa Nutri.'
WHERE NOT EXISTS (SELECT 1 FROM public.kits WHERE name ILIKE '%cesta%');

INSERT INTO public.kits (name, description)
SELECT 'Kit 0 a 6 meses (Lactentes)', 'Suporte nutricional prioritário para lactentes menores de 6 meses sem aleitamento materno exclusivo.'
WHERE NOT EXISTS (SELECT 1 FROM public.kits WHERE name ILIKE '%0 a 6%' OR name ILIKE '%0-6%');

INSERT INTO public.kits (name, description)
SELECT 'Kit 6 a 24 meses (Transição Alimentar)', 'Kit essencial de recuperação e transição alimentar com Farinha Enriquecida e Leite.'
WHERE NOT EXISTS (SELECT 1 FROM public.kits WHERE name ILIKE '%6 a 24%' OR name ILIKE '%6-24%');

INSERT INTO public.kits (name, description)
SELECT 'Kit 2 a 5 anos (> 24 meses)', 'Suplementação alimentar para crianças de 2 a 5 anos em recuperação nutricional.'
WHERE NOT EXISTS (SELECT 1 FROM public.kits WHERE name ILIKE '%2 a 5%' OR name ILIKE '%> 24%');

INSERT INTO public.kits (name, description)
SELECT 'Kit Suporte Clínico / HIV (Terapêutico)', 'Aporte terapêutico intensivo e hipercalórico para crianças expostas ou com necessidades clínicas especiais.'
WHERE NOT EXISTS (SELECT 1 FROM public.kits WHERE name ILIKE '%hiv%' OR name ILIKE '%terap%');

-- 8. Associação dos Produtos aos Kits correspondentes
-- 8.1 Cesta Básica Familiar
INSERT INTO public.kit_items (kit_id, item_id, quantity, dosage)
SELECT k.id, i.id, p.qty, p.dos
FROM public.kits k
CROSS JOIN (
  VALUES 
    ('Arroz de Primeira', 5, NULL),
    ('Feijão Manteiga', 2, NULL),
    ('Farinha de Milho / Composta', 2, NULL),
    ('Óleo Vegetal Alimentar', 1, NULL),
    ('Açúcar Branco', 1, NULL),
    ('Sal Iodado', 1, NULL),
    ('Sabão em Barra', 2, NULL)
) AS p(name, qty, dos)
JOIN public.inventory i ON i.name = p.name
WHERE k.name ILIKE '%cesta%'
ON CONFLICT (kit_id, item_id) DO UPDATE SET quantity = EXCLUDED.quantity;

-- 8.2 Kit 0 a 6 meses
INSERT INTO public.kit_items (kit_id, item_id, quantity, dosage)
SELECT k.id, i.id, p.qty, p.dos
FROM public.kits k
CROSS JOIN (
  VALUES 
    ('Fórmula Infantil Lactente (0 a 6 meses)', 2, 'Conforme orientação do pediatra/nutricionista'),
    ('Suplemento Vitamínico Pediátrico', 1, '1 ml via oral 1x ao dia'),
    ('Copo / Dosador Graduado', 1, NULL)
) AS p(name, qty, dos)
JOIN public.inventory i ON i.name = p.name
WHERE k.name ILIKE '%0 a 6%' OR k.name ILIKE '%0-6%'
ON CONFLICT (kit_id, item_id) DO UPDATE SET quantity = EXCLUDED.quantity;

-- 8.3 Kit 6 a 24 meses
INSERT INTO public.kit_items (kit_id, item_id, quantity, dosage)
SELECT k.id, i.id, p.qty, p.dos
FROM public.kits k
CROSS JOIN (
  VALUES 
    ('Farinha Enriquecida / CSB (Corn-Soy Blend)', 2, 'Papas enriquecidas 2 a 3x ao dia'),
    ('Leite em Pó Integral Fortificado', 2, '2 medidas em 100ml de água morna'),
    ('Multivitamínico e Micronutrientes Pediátrico', 1, '5 ml via oral 1x ao dia'),
    ('Óleo Vegetal Alimentar', 1, NULL),
    ('Açúcar Branco', 1, NULL)
) AS p(name, qty, dos)
JOIN public.inventory i ON i.name = p.name
WHERE k.name ILIKE '%6 a 24%' OR k.name ILIKE '%6-24%'
ON CONFLICT (kit_id, item_id) DO UPDATE SET quantity = EXCLUDED.quantity;

-- 8.4 Kit 2 a 5 anos (> 24 meses)
INSERT INTO public.kit_items (kit_id, item_id, quantity, dosage)
SELECT k.id, i.id, p.qty, p.dos
FROM public.kits k
CROSS JOIN (
  VALUES 
    ('Farinha Composta Fortificada', 2, 'Mingau fortificado 2x ao dia'),
    ('Leite em Pó Integral Fortificado', 1, NULL),
    ('Feijão Manteiga', 1, NULL),
    ('Complexo Vitamínico Infantil', 1, '5 ml via oral 1x ao dia')
) AS p(name, qty, dos)
JOIN public.inventory i ON i.name = p.name
WHERE k.name ILIKE '%2 a 5%' OR k.name ILIKE '%> 24%'
ON CONFLICT (kit_id, item_id) DO UPDATE SET quantity = EXCLUDED.quantity;

-- 8.5 Kit Suporte Clínico / HIV (Terapêutico)
INSERT INTO public.kit_items (kit_id, item_id, quantity, dosage)
SELECT k.id, i.id, p.qty, p.dos
FROM public.kits k
CROSS JOIN (
  VALUES 
    ('Alimento Terapêutico Pronto (RUTF / Plumpy)', 14, '1 sachê ao dia no intervalo das refeições'),
    ('Multivitamínico & Zinco Pediátrico', 1, '5 ml via oral 1x ao dia'),
    ('Leite em Pó Integral Fortificado', 2, NULL),
    ('Óleo Vegetal Alimentar', 1, NULL)
) AS p(name, qty, dos)
JOIN public.inventory i ON i.name = p.name
WHERE k.name ILIKE '%hiv%' OR k.name ILIKE '%terap%'
ON CONFLICT (kit_id, item_id) DO UPDATE SET quantity = EXCLUDED.quantity;

-- 9. Consulta de conferência final
SELECT 
  k.name AS kit, 
  COUNT(ki.id) AS total_produtos,
  STRING_AGG(i.name || ' (' || ki.quantity || ' ' || i.unit || ')', ', ') AS produtos
FROM public.kits k
LEFT JOIN public.kit_items ki ON ki.kit_id = k.id
LEFT JOIN public.inventory i ON i.id = ki.item_id
GROUP BY k.id, k.name;
