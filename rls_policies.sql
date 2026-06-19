-- 1. Certifique-se de que o RLS está habilitado nas tabelas
ALTER TABLE children ENABLE ROW LEVEL SECURITY;
ALTER TABLE caregivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_triage ENABLE ROW LEVEL SECURITY;
ALTER TABLE household_conditions ENABLE ROW LEVEL SECURITY;
ALTER TABLE socioeconomics ENABLE ROW LEVEL SECURITY;
ALTER TABLE dependents ENABLE ROW LEVEL SECURITY;
ALTER TABLE initial_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE gestational_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE feeding_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE clinical_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE physical_exam ENABLE ROW LEVEL SECURITY;
ALTER TABLE nutritional_evaluation ENABLE ROW LEVEL SECURITY;
ALTER TABLE clinical_events ENABLE ROW LEVEL SECURITY;

-- 2. Remover políticas antigas se existirem (para evitar duplicidade)
DROP POLICY IF EXISTS "Nutricao_Acesso_Children" ON children;
DROP POLICY IF EXISTS "Nutricao_Acesso_Caregivers" ON caregivers;
DROP POLICY IF EXISTS "Nutricao_Acesso_SocialTriage" ON social_triage;
DROP POLICY IF EXISTS "Nutricao_Acesso_Household" ON household_conditions;
DROP POLICY IF EXISTS "Nutricao_Acesso_Socioeco" ON socioeconomics;
DROP POLICY IF EXISTS "Nutricao_Acesso_Dependents" ON dependents;
DROP POLICY IF EXISTS "Nutricao_Acesso_Assessments" ON initial_assessments;
DROP POLICY IF EXISTS "Nutricao_Acesso_Gestational" ON gestational_history;
DROP POLICY IF EXISTS "Nutricao_Acesso_Feeding" ON feeding_history;
DROP POLICY IF EXISTS "Nutricao_Acesso_ClinicalHist" ON clinical_history;
DROP POLICY IF EXISTS "Nutricao_Acesso_Physical" ON physical_exam;
DROP POLICY IF EXISTS "Nutricao_Acesso_Nutritional" ON nutritional_evaluation;
DROP POLICY IF EXISTS "Nutricao_Acesso_Events" ON clinical_events;

-- 3. Criar a política que permite SELECT, INSERT, UPDATE, DELETE 
-- para qualquer pessoa que não seja 'SPONSOR' (ou seja, quem tem acesso ao módulo de nutrição)

CREATE POLICY "Nutricao_Acesso_Children" ON children FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role != 'SPONSOR')) WITH CHECK (EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role != 'SPONSOR'));

CREATE POLICY "Nutricao_Acesso_Caregivers" ON caregivers FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role != 'SPONSOR')) WITH CHECK (EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role != 'SPONSOR'));

CREATE POLICY "Nutricao_Acesso_SocialTriage" ON social_triage FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role != 'SPONSOR')) WITH CHECK (EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role != 'SPONSOR'));

CREATE POLICY "Nutricao_Acesso_Household" ON household_conditions FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role != 'SPONSOR')) WITH CHECK (EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role != 'SPONSOR'));

CREATE POLICY "Nutricao_Acesso_Socioeco" ON socioeconomics FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role != 'SPONSOR')) WITH CHECK (EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role != 'SPONSOR'));

CREATE POLICY "Nutricao_Acesso_Dependents" ON dependents FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role != 'SPONSOR')) WITH CHECK (EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role != 'SPONSOR'));

CREATE POLICY "Nutricao_Acesso_Assessments" ON initial_assessments FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role != 'SPONSOR')) WITH CHECK (EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role != 'SPONSOR'));

CREATE POLICY "Nutricao_Acesso_Gestational" ON gestational_history FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role != 'SPONSOR')) WITH CHECK (EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role != 'SPONSOR'));

CREATE POLICY "Nutricao_Acesso_Feeding" ON feeding_history FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role != 'SPONSOR')) WITH CHECK (EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role != 'SPONSOR'));

CREATE POLICY "Nutricao_Acesso_ClinicalHist" ON clinical_history FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role != 'SPONSOR')) WITH CHECK (EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role != 'SPONSOR'));

CREATE POLICY "Nutricao_Acesso_Physical" ON physical_exam FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role != 'SPONSOR')) WITH CHECK (EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role != 'SPONSOR'));

CREATE POLICY "Nutricao_Acesso_Nutritional" ON nutritional_evaluation FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role != 'SPONSOR')) WITH CHECK (EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role != 'SPONSOR'));

CREATE POLICY "Nutricao_Acesso_Events" ON clinical_events FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role != 'SPONSOR')) WITH CHECK (EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role != 'SPONSOR'));
