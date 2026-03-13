-- Supabase SQL Schema for YAHope

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. users
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. children
CREATE TABLE children (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  registration_number TEXT,
  name TEXT NOT NULL,
  birthplace TEXT,
  province TEXT,
  origin TEXT,
  address TEXT,
  city TEXT,
  dob DATE NOT NULL,
  gender TEXT NOT NULL,
  color TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. caregivers
CREATE TABLE caregivers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  child_id UUID REFERENCES children(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  marital_status TEXT,
  education TEXT,
  religion TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. social_triage
CREATE TABLE social_triage (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  child_id UUID REFERENCES children(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  filled_by UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. dependents
CREATE TABLE dependents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  social_triage_id UUID REFERENCES social_triage(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  dob DATE,
  weight NUMERIC,
  height NUMERIC,
  muac NUMERIC,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. household_conditions
CREATE TABLE household_conditions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  social_triage_id UUID REFERENCES social_triage(id) ON DELETE CASCADE UNIQUE,
  housing_type TEXT,
  rooms INTEGER,
  dwelling_type TEXT,
  roof TEXT,
  sanitation TEXT,
  sewage TEXT,
  garbage TEXT,
  animals TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. socioeconomics
CREATE TABLE socioeconomics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  social_triage_id UUID REFERENCES social_triage(id) ON DELETE CASCADE UNIQUE,
  monthly_income NUMERIC,
  father_job TEXT,
  mother_job TEXT,
  caregiver_job TEXT,
  observations TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. initial_assessments
CREATE TABLE initial_assessments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  child_id UUID REFERENCES children(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  informant TEXT,
  main_complaint TEXT,
  history TEXT,
  current_medications TEXT,
  filled_by UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 9. gestational_history
CREATE TABLE gestational_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  assessment_id UUID REFERENCES initial_assessments(id) ON DELETE CASCADE UNIQUE,
  prenatal_problems TEXT,
  prenatal_consultations INTEGER,
  delivery_type TEXT,
  gestational_age INTEGER,
  apgar_1 INTEGER,
  apgar_5 INTEGER,
  birth_weight NUMERIC,
  birth_height NUMERIC,
  birth_hc NUMERIC,
  birth_tc NUMERIC,
  birth_problems TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 10. feeding_history
CREATE TABLE feeding_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  assessment_id UUID REFERENCES initial_assessments(id) ON DELETE CASCADE UNIQUE,
  breast_milk BOOLEAN,
  exclusive_breast_milk_until TEXT,
  weaning_age TEXT,
  water_tea_intro TEXT,
  cow_milk_intro TEXT,
  salty_mush_intro TEXT,
  juice_intro TEXT,
  soup_intro TEXT,
  other_foods TEXT,
  current_feeding TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 11. clinical_history
CREATE TABLE clinical_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  assessment_id UUID REFERENCES initial_assessments(id) ON DELETE CASCADE UNIQUE,
  supplements TEXT,
  previous_diseases TEXT,
  mother_history TEXT,
  father_history TEXT,
  other_relatives_history TEXT,
  family_malnutrition_history TEXT,
  consanguinity BOOLEAN,
  hereditary_diseases TEXT,
  family_dynamics TEXT,
  immunization TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 12. physical_exam
CREATE TABLE physical_exam (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  assessment_id UUID REFERENCES initial_assessments(id) ON DELETE CASCADE UNIQUE,
  weight NUMERIC,
  height NUMERIC,
  z_score_height_age NUMERIC,
  z_score_weight_height NUMERIC,
  head_circumference NUMERIC,
  muac NUMERIC,
  bmi NUMERIC,
  bmi_gestational NUMERIC,
  bilateral_edema TEXT,
  axillary_temperature NUMERIC,
  clinical_signs JSONB, -- Array of strings
  oral_health TEXT,
  other_findings TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 13. nutritional_evaluation
CREATE TABLE nutritional_evaluation (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  assessment_id UUID REFERENCES initial_assessments(id) ON DELETE CASCADE UNIQUE,
  evaluation JSONB, -- Array of selected options (e.g., 'DAM', 'Anemia')
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 14. treatment_plan
CREATE TABLE treatment_plan (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  assessment_id UUID REFERENCES initial_assessments(id) ON DELETE CASCADE UNIQUE,
  exams JSONB,
  medications TEXT,
  educational_actions JSONB,
  discharge BOOLEAN DEFAULT FALSE,
  return_needed BOOLEAN DEFAULT FALSE,
  referral TEXT,
  return_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 15. clinical_events (Acompanhamentos, Retornos, Visitas ACS)
CREATE TABLE clinical_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  child_id UUID REFERENCES children(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL, 
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  weight NUMERIC,
  height NUMERIC,
  muac NUMERIC,
  head_circumference NUMERIC,
  bmi NUMERIC,
  z_score_weight_height NUMERIC,
  nutritional_status TEXT,
  notes TEXT,
  prescriptions JSONB,
  professional_id UUID REFERENCES users(id),
  return_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_clinical_events_child_id ON clinical_events(child_id);
CREATE INDEX idx_clinical_events_date ON clinical_events(date DESC);

-- 16. referrals (Encaminhamentos)
CREATE TABLE referrals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  child_id UUID REFERENCES children(id) ON DELETE CASCADE,
  
  -- Dados da criança no momento do encaminhamento
  weight_g NUMERIC,
  height_cm NUMERIC,
  z_score_pe NUMERIC,
  
  -- Edema
  has_edema BOOLEAN DEFAULT FALSE,
  edema_location TEXT,
  
  -- Motivo do Encaminhamento
  referral_reason TEXT NOT NULL,
  other_reason TEXT,
  
  -- Metadados
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  professional_id UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_referrals_child_id ON referrals(child_id);
CREATE INDEX idx_referrals_date ON referrals(date DESC);

-- 17. waiting_list (Fila de Espera)
CREATE TABLE waiting_list (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  dob DATE NOT NULL,
  guardian_name TEXT,
  address TEXT,
  contact TEXT,
  weight NUMERIC,
  height NUMERIC,
  notes TEXT,
  status TEXT DEFAULT 'waiting',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 18. inventory_categories (Categorias de Estoque)
CREATE TABLE inventory_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 19. inventory (Estoque)
CREATE TABLE inventory (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  category TEXT NOT NULL, -- Referência ao nome da categoria
  quantity INTEGER NOT NULL DEFAULT 0,
  unit TEXT NOT NULL, -- 'unidades', 'caixas', 'frascos', 'sachês'
  min_quantity INTEGER DEFAULT 0,
  expiration_date DATE,
  purchase_price NUMERIC(10, 2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 20. inventory_transactions (Entradas e Saídas)
CREATE TABLE inventory_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  item_id UUID REFERENCES inventory(id) ON DELETE CASCADE,
  transaction_type TEXT NOT NULL, -- 'in' (entrada) ou 'out' (retirada)
  quantity INTEGER NOT NULL,
  unit_price NUMERIC(10, 2), -- Valor pago na entrada
  notes TEXT, -- Motivo da retirada ou nota da entrada
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 21. kits (Kits de Entrega)
CREATE TABLE kits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 22. kit_items (Itens que compõem o kit)
CREATE TABLE kit_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  kit_id UUID REFERENCES kits(id) ON DELETE CASCADE,
  item_id UUID REFERENCES inventory(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 1,
  UNIQUE(kit_id, item_id)
);

-- 23. Adicionar referência de kit entregue aos eventos clínicos
ALTER TABLE clinical_events ADD COLUMN kit_delivered_id UUID REFERENCES kits(id);
