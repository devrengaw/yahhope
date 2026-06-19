-- Execute este script no SQL Editor do seu painel do Supabase

-- Opção 1: Desabilitar o RLS (Recomendado apenas para fase de testes rápidos)
-- Se quiser apenas fazer funcionar rapidamente, desabilite o RLS das tabelas de nutrição:

ALTER TABLE children DISABLE ROW LEVEL SECURITY;
ALTER TABLE caregivers DISABLE ROW LEVEL SECURITY;
ALTER TABLE social_triage DISABLE ROW LEVEL SECURITY;
ALTER TABLE household_conditions DISABLE ROW LEVEL SECURITY;
ALTER TABLE socioeconomics DISABLE ROW LEVEL SECURITY;
ALTER TABLE dependents DISABLE ROW LEVEL SECURITY;
ALTER TABLE initial_assessments DISABLE ROW LEVEL SECURITY;
ALTER TABLE gestational_history DISABLE ROW LEVEL SECURITY;
ALTER TABLE feeding_history DISABLE ROW LEVEL SECURITY;
ALTER TABLE clinical_history DISABLE ROW LEVEL SECURITY;
ALTER TABLE physical_exam DISABLE ROW LEVEL SECURITY;
ALTER TABLE nutritional_evaluation DISABLE ROW LEVEL SECURITY;
ALTER TABLE clinical_events DISABLE ROW LEVEL SECURITY;

/*
-- Opção 2: Habilitar o RLS com Políticas de Acesso (Recomendado para Produção)
-- Se quiser manter a segurança, habilite o RLS e rode estas políticas:

-- Habilitar RLS
ALTER TABLE children ENABLE ROW LEVEL SECURITY;
ALTER TABLE caregivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE clinical_events ENABLE ROW LEVEL SECURITY;
-- (e as demais tabelas...)

-- Criar políticas permitindo acesso total a usuários autenticados
CREATE POLICY "Permitir tudo para usuários autenticados em children" ON children FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Permitir tudo para usuários autenticados em caregivers" ON caregivers FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Permitir tudo para usuários autenticados em clinical_events" ON clinical_events FOR ALL TO authenticated USING (true) WITH CHECK (true);
-- (Repita para as demais tabelas que precisar)
*/
