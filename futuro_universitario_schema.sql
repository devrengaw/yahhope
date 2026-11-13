-- ==============================================================================
-- MIGRAÇÃO SQL: MÓDULO FUTURO UNIVERSITÁRIO (ARQUITETURA INTEGRADA YAH HOPE)
-- Integrado ao sistema de autenticação (auth.users / public.users) e RLS existente.
-- Aditivo e retrocompatível: não altera tabelas de autenticação ou outros módulos.
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. FUNÇÕES AUXILIARES DE PERMISSÃO NO BANCO (REUTILIZANDO public.users)
-- Verifica se o usuário autenticado é ADMIN ou possui uma permissão específica em public.users.permissions
CREATE OR REPLACE FUNCTION public.has_fu_permission(required_perm TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
  v_role TEXT;
  v_email TEXT;
  v_perms JSONB;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN FALSE;
  END IF;

  SELECT UPPER( COALESCE(role, '') ), LOWER( COALESCE(email, '') ),
         CASE
           WHEN permissions IS NULL THEN '[]'::jsonb
           ELSE to_jsonb(permissions)
         END
    INTO v_role, v_email, v_perms
    FROM public.users
   WHERE id = auth.uid()
   LIMIT 1;

  IF v_role = 'ADMIN' OR v_email = 'contato@yahhope.com' THEN
    RETURN TRUE;
  END IF;

  -- Mentores, Apoiadores (SPONSOR) e Observadores nunca possuem permissão administrativa no módulo
  IF v_role IN ('SPONSOR', 'MANTENEDOR', 'PADRINHO', 'OBSERVER', 'MENTOR') THEN
    RETURN FALSE;
  END IF;

  IF v_perms ? 'all' OR v_perms ? 'fu:all' THEN
    RETURN TRUE;
  END IF;

  -- Se o usuário possui a chave mestre 'futuro-universitario' e nenhuma restrição granular fu:*, permite
  IF v_perms ? 'futuro-universitario' AND NOT EXISTS (
    SELECT 1 FROM jsonb_array_elements_text(v_perms) AS elem WHERE elem LIKE 'fu:%'
  ) THEN
    RETURN TRUE;
  END IF;

  IF v_perms ? required_perm THEN
    RETURN TRUE;
  END IF;

  RETURN FALSE;
END;
$$;

-- Verifica se o usuário possui acesso de visualização ao módulo Futuro Universitário
CREATE OR REPLACE FUNCTION public.has_fu_module_access()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
  v_role TEXT;
  v_email TEXT;
  v_perms JSONB;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN FALSE;
  END IF;

  SELECT UPPER( COALESCE(role, '') ), LOWER( COALESCE(email, '') ),
         CASE
           WHEN permissions IS NULL THEN '[]'::jsonb
           ELSE to_jsonb(permissions)
         END
    INTO v_role, v_email, v_perms
    FROM public.users
   WHERE id = auth.uid()
   LIMIT 1;

  IF v_role = 'ADMIN' OR v_email = 'contato@yahhope.com' THEN
    RETURN TRUE;
  END IF;

  IF v_role IN ('SPONSOR', 'MANTENEDOR', 'PADRINHO', 'OBSERVER', 'MENTOR') THEN
    RETURN FALSE;
  END IF;

  IF v_perms ? 'all' OR v_perms ? 'futuro-universitario' OR v_perms ? 'fu:all' THEN
    RETURN TRUE;
  END IF;

  IF EXISTS (
    SELECT 1 FROM jsonb_array_elements_text(v_perms) AS elem WHERE elem LIKE 'fu:%'
  ) THEN
    RETURN TRUE;
  END IF;

  RETURN FALSE;
END;
$$;

-- 2. TABELA DE CONFIGURAÇÃO DO MÓDULO (university_config)
CREATE TABLE IF NOT EXISTS public.university_config (
  id TEXT PRIMARY KEY DEFAULT 'default',
  program_name TEXT NOT NULL DEFAULT 'Futuro Universitário YAH Hope',
  short_description TEXT NOT NULL DEFAULT 'Programa de bolsas de ensino superior, mentoria vocacional e desenvolvimento de lideranças jovens em Moçambique.',
  full_description TEXT NOT NULL DEFAULT 'O Futuro Universitário rompe o ciclo da vulnerabilidade através da educação superior de excelência. Jovens com alto potencial acadêmico recebem cobertura de mensalidades, material didático, auxílio transporte e mentoria individual com profissionais voluntários, comprometendo-se com horas de retribuição comunitária.',
  full_scholarship_amount NUMERIC(10, 2) NOT NULL DEFAULT 600.00,
  full_scholarship_amount_mzn NUMERIC(10, 2) NOT NULL DEFAULT 7500.00,
  partial_quota_amount NUMERIC(10, 2) NOT NULL DEFAULT 150.00,
  partial_quota_amount_mzn NUMERIC(10, 2) NOT NULL DEFAULT 1875.00,
  default_general_amount NUMERIC(10, 2) NOT NULL DEFAULT 100.00,
  default_general_amount_mzn NUMERIC(10, 2) NOT NULL DEFAULT 1250.00,
  currency TEXT NOT NULL DEFAULT 'BRL',
  counterpart_hours_required INTEGER NOT NULL DEFAULT 20,
  portal_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  enforce_strict_privacy BOOLEAN NOT NULL DEFAULT TRUE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.university_config ADD COLUMN IF NOT EXISTS full_scholarship_amount_mzn NUMERIC(10, 2) NOT NULL DEFAULT 7500.00;
ALTER TABLE public.university_config ADD COLUMN IF NOT EXISTS partial_quota_amount_mzn NUMERIC(10, 2) NOT NULL DEFAULT 1875.00;
ALTER TABLE public.university_config ADD COLUMN IF NOT EXISTS default_general_amount_mzn NUMERIC(10, 2) NOT NULL DEFAULT 1250.00;

INSERT INTO public.university_config (id) VALUES ('default') ON CONFLICT (id) DO NOTHING;

-- 3. TABELA DE ESTUDANTES - DADOS PÚBLICOS/ACADÊMICOS AUTORIZÁVEIS (university_students)
-- Dados sensíveis ficam estritamente segregados na tabela university_student_sensitive_data
CREATE TABLE IF NOT EXISTS public.university_students (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  registration_code TEXT UNIQUE,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  dob DATE,
  gender TEXT,
  city TEXT DEFAULT 'Nampula',
  province TEXT DEFAULT 'Nampula',
  photo_url TEXT,
  institution TEXT NOT NULL,
  course TEXT NOT NULL,
  current_semester INTEGER NOT NULL DEFAULT 1,
  total_semesters INTEGER NOT NULL DEFAULT 8,
  expected_graduation TEXT,
  application_status TEXT NOT NULL DEFAULT 'approved' CHECK (application_status IN ('pending', 'approved', 'rejected')),
  enrollment_status TEXT NOT NULL DEFAULT 'active' CHECK (enrollment_status IN ('candidate', 'active', 'graduated', 'suspended', 'inactive')),
  public_bio TEXT,
  career_goal TEXT,
  portal_visible BOOLEAN NOT NULL DEFAULT FALSE,
  approved_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  approved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. TABELA DE DADOS SENSÍVEIS DO ESTUDANTE (university_student_sensitive_data)
-- NUNCA acessível por SPONSOR (mantenedores/padrinhos) ou MENTOR
CREATE TABLE IF NOT EXISTS public.university_student_sensitive_data (
  student_id UUID PRIMARY KEY REFERENCES public.university_students(id) ON DELETE CASCADE,
  document_id_number TEXT,
  nuit TEXT,
  documents_urls JSONB DEFAULT '[]'::jsonb,
  family_sensitive_notes TEXT,
  socioeconomic_details TEXT,
  monthly_family_income NUMERIC(10, 2),
  household_members INTEGER,
  bank_name TEXT,
  bank_account TEXT,
  mobile_wallet TEXT,
  spiritual_followup_notes TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. TABELA DE BOLSAS DE ESTUDO (university_scholarships)
CREATE TABLE IF NOT EXISTS public.university_scholarships (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL REFERENCES public.university_students(id) ON DELETE CASCADE,
  scholarship_type TEXT NOT NULL DEFAULT 'integral' CHECK (scholarship_type IN ('integral', 'parcial', 'auxilio_material')),
  monthly_amount NUMERIC(10, 2) NOT NULL DEFAULT 600.00,
  currency TEXT NOT NULL DEFAULT 'BRL',
  coverage_items JSONB DEFAULT '["Mensalidade", "Material Didático", "Transporte"]'::jsonb,
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  end_date DATE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('pending', 'active', 'suspended', 'completed')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. TABELA DE PAGAMENTOS / DESEMBOLSOS DE BOLSAS (university_scholarship_payments)
CREATE TABLE IF NOT EXISTS public.university_scholarship_payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  scholarship_id UUID NOT NULL REFERENCES public.university_scholarships(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.university_students(id) ON DELETE CASCADE,
  reference_month TEXT NOT NULL, -- Ex: '2026-11'
  category TEXT NOT NULL DEFAULT 'mensalidade' CHECK (category IN ('mensalidade', 'matricula', 'material', 'transporte', 'manutencao', 'outros')),
  amount NUMERIC(10, 2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'BRL',
  status TEXT NOT NULL DEFAULT 'pending_approval' CHECK (status IN ('pending_approval', 'approved', 'paid', 'rejected')),
  due_date DATE,
  approved_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  approved_at TIMESTAMP WITH TIME ZONE,
  paid_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  paid_at TIMESTAMP WITH TIME ZONE,
  receipt_url TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. TABELA DE MENTORES VOLUNTÁRIOS (university_mentors)
-- O cadastro de um mentor NÃO cria nem concede acesso administrativo.
-- O campo user_id é opcional apenas para futura interface específica de mentores.
CREATE TABLE IF NOT EXISTS public.university_mentors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  profession TEXT NOT NULL,
  company_or_institution TEXT,
  specialty_area TEXT,
  bio TEXT,
  max_students INTEGER NOT NULL DEFAULT 2,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'onboarding')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. TABELA DE VÍNCULOS E ENCONTROS DE MENTORIA (university_mentorships)
-- Anotações confidenciais e acompanhamento espiritual ficam restritos à equipe autorizada.
CREATE TABLE IF NOT EXISTS public.university_mentorships (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL REFERENCES public.university_students(id) ON DELETE CASCADE,
  mentor_id UUID NOT NULL REFERENCES public.university_mentors(id) ON DELETE CASCADE,
  session_date DATE NOT NULL DEFAULT CURRENT_DATE,
  modality TEXT NOT NULL DEFAULT 'online' CHECK (modality IN ('online', 'presencial')),
  topic TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('scheduled', 'completed', 'cancelled')),
  public_summary TEXT, -- Resumo geral autorizável sem dados sensíveis
  confidential_notes TEXT, -- ESTRITAMENTE PRIVADO (nunca vai para o Portal do Mantenedor)
  spiritual_notes TEXT, -- ESTRITAMENTE PRIVADO (nunca vai para o Portal do Mantenedor)
  next_steps TEXT,
  recorded_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 9. TABELA DE ACOMPANHAMENTO ACADÊMICO (university_academic_records)
CREATE TABLE IF NOT EXISTS public.university_academic_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL REFERENCES public.university_students(id) ON DELETE CASCADE,
  period TEXT NOT NULL, -- Ex: '2026.2'
  semester_number INTEGER NOT NULL DEFAULT 1,
  gpa NUMERIC(4, 2) NOT NULL DEFAULT 0,
  attendance_rate NUMERIC(5, 2) NOT NULL DEFAULT 100,
  approved_subjects INTEGER NOT NULL DEFAULT 0,
  total_subjects INTEGER NOT NULL DEFAULT 0,
  community_hours_completed INTEGER NOT NULL DEFAULT 0,
  academic_status TEXT NOT NULL DEFAULT 'regular' CHECK (academic_status IN ('excelente', 'regular', 'atencao', 'reprovado')),
  public_highlight TEXT, -- Destaque acadêmico autorizável para padrinhos
  internal_observations TEXT, -- Observações pedagógicas internas
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 10. TABELA DE APOIADORES / PADRINHOS DO FUTURO UNIVERSITÁRIO (university_sponsorships)
-- Suporta as 3 modalidades: 'general' (Mantenedor Geral), 'individual' (Padrinho Individual), 'partial' (Apoiador Parcial)
CREATE TABLE IF NOT EXISTS public.university_sponsorships (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sponsor_user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  student_id UUID REFERENCES public.university_students(id) ON DELETE SET NULL, -- NULL quando modality = 'general'
  donor_name TEXT NOT NULL,
  donor_email TEXT NOT NULL,
  donor_phone TEXT,
  modality TEXT NOT NULL CHECK (modality IN ('general', 'individual', 'partial')),
  monthly_amount NUMERIC(10, 2) NOT NULL,
  quota_percentage NUMERIC(5, 2) DEFAULT 100,
  currency TEXT NOT NULL DEFAULT 'BRL',
  payment_method TEXT DEFAULT 'credit_card',
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'cancelled')),
  allow_student_updates BOOLEAN NOT NULL DEFAULT TRUE,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 11. TABELA DE ATUALIZAÇÕES E RELATÓRIOS DE IMPACTO DO PROGRAMA (university_updates)
CREATE TABLE IF NOT EXISTS public.university_updates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID REFERENCES public.university_students(id) ON DELETE SET NULL, -- NULL = atualização geral do programa
  title TEXT NOT NULL,
  summary TEXT NOT NULL,
  content TEXT NOT NULL,
  update_type TEXT NOT NULL DEFAULT 'program_update' CHECK (update_type IN ('program_update', 'impact_report', 'student_milestone')),
  image_url TEXT,
  report_file_url TEXT,
  published_to_portal BOOLEAN NOT NULL DEFAULT TRUE,
  published_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==============================================================================
-- POLÍTICAS DE ROW LEVEL SECURITY (RLS)
-- ==============================================================================

ALTER TABLE public.university_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.university_students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.university_student_sensitive_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.university_scholarships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.university_scholarship_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.university_mentors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.university_mentorships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.university_academic_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.university_sponsorships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.university_updates ENABLE ROW LEVEL SECURITY;

-- 1. university_config: leitura para autenticados (Portal & Admin), escrita apenas com fu:settings:manage
DROP POLICY IF EXISTS "FU_Config_Select" ON public.university_config;
CREATE POLICY "FU_Config_Select" ON public.university_config
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "FU_Config_Modify" ON public.university_config;
CREATE POLICY "FU_Config_Modify" ON public.university_config
  FOR ALL TO authenticated
  USING (public.has_fu_permission('fu:settings:manage'))
  WITH CHECK (public.has_fu_permission('fu:settings:manage'));

-- 2. university_students:
-- Equipe autorizada no módulo pode ler/gerenciar conforme permissões.
-- Padrinhos (SPONSOR) só podem ler estudantes marcados como portal_visible = true e aos quais estejam vinculados (ou elegíveis para apadrinhamento).
-- Mentores vinculados só podem ler os estudantes vinculados a eles.
DROP POLICY IF EXISTS "FU_Students_Select" ON public.university_students;
CREATE POLICY "FU_Students_Select" ON public.university_students
  FOR SELECT TO authenticated
  USING (
    public.has_fu_permission('fu:students:view')
    OR public.has_fu_module_access()
    OR (
      portal_visible = TRUE
      AND EXISTS (
        SELECT 1 FROM public.university_sponsorships s
        WHERE s.student_id = university_students.id
          AND s.status = 'active'
          AND (s.sponsor_user_id = auth.uid() OR LOWER(s.donor_email) = LOWER(auth.jwt() ->> 'email'))
      )
    )
    OR EXISTS (
      SELECT 1 FROM public.university_mentorships ms
      JOIN public.university_mentors m ON m.id = ms.mentor_id
      WHERE ms.student_id = university_students.id
        AND m.user_id = auth.uid()
        AND m.status = 'active'
    )
  );

DROP POLICY IF EXISTS "FU_Students_Insert" ON public.university_students;
CREATE POLICY "FU_Students_Insert" ON public.university_students
  FOR INSERT TO authenticated
  WITH CHECK (public.has_fu_permission('fu:students:create'));

DROP POLICY IF EXISTS "FU_Students_Update" ON public.university_students;
CREATE POLICY "FU_Students_Update" ON public.university_students
  FOR UPDATE TO authenticated
  USING (public.has_fu_permission('fu:students:edit') OR public.has_fu_permission('fu:applications:approve'))
  WITH CHECK (public.has_fu_permission('fu:students:edit') OR public.has_fu_permission('fu:applications:approve'));

DROP POLICY IF EXISTS "FU_Students_Delete" ON public.university_students;
CREATE POLICY "FU_Students_Delete" ON public.university_students
  FOR DELETE TO authenticated
  USING (public.has_fu_permission('fu:students:edit'));

-- 3. university_student_sensitive_data:
-- ESTRITAMENTE BLOQUEADO para Mantenedores/Padrinhos e Mentores. Somente equipe administrativa do módulo com permissão de estudantes.
DROP POLICY IF EXISTS "FU_Sensitive_All" ON public.university_student_sensitive_data;
CREATE POLICY "FU_Sensitive_All" ON public.university_student_sensitive_data
  FOR ALL TO authenticated
  USING (public.has_fu_permission('fu:students:view') OR public.has_fu_permission('fu:students:edit'))
  WITH CHECK (public.has_fu_permission('fu:students:create') OR public.has_fu_permission('fu:students:edit'));

-- 4. university_scholarships:
DROP POLICY IF EXISTS "FU_Scholarships_Select" ON public.university_scholarships;
CREATE POLICY "FU_Scholarships_Select" ON public.university_scholarships
  FOR SELECT TO authenticated
  USING (public.has_fu_permission('fu:scholarships:view') OR public.has_fu_module_access());

DROP POLICY IF EXISTS "FU_Scholarships_Modify" ON public.university_scholarships;
CREATE POLICY "FU_Scholarships_Modify" ON public.university_scholarships
  FOR ALL TO authenticated
  USING (public.has_fu_permission('fu:scholarships:manage'))
  WITH CHECK (public.has_fu_permission('fu:scholarships:manage'));

-- 5. university_scholarship_payments:
DROP POLICY IF EXISTS "FU_Payments_Select" ON public.university_scholarship_payments;
CREATE POLICY "FU_Payments_Select" ON public.university_scholarship_payments
  FOR SELECT TO authenticated
  USING (public.has_fu_permission('fu:scholarships:view') OR public.has_fu_permission('fu:payments:approve') OR public.has_fu_permission('fu:payments:register'));

DROP POLICY IF EXISTS "FU_Payments_Modify" ON public.university_scholarship_payments;
CREATE POLICY "FU_Payments_Modify" ON public.university_scholarship_payments
  FOR ALL TO authenticated
  USING (public.has_fu_permission('fu:scholarships:manage') OR public.has_fu_permission('fu:payments:approve') OR public.has_fu_permission('fu:payments:register'))
  WITH CHECK (public.has_fu_permission('fu:scholarships:manage') OR public.has_fu_permission('fu:payments:approve') OR public.has_fu_permission('fu:payments:register'));

-- 6. university_mentors:
DROP POLICY IF EXISTS "FU_Mentors_Select" ON public.university_mentors;
CREATE POLICY "FU_Mentors_Select" ON public.university_mentors
  FOR SELECT TO authenticated
  USING (public.has_fu_permission('fu:mentors:view') OR public.has_fu_module_access() OR user_id = auth.uid());

DROP POLICY IF EXISTS "FU_Mentors_Modify" ON public.university_mentors;
CREATE POLICY "FU_Mentors_Modify" ON public.university_mentors
  FOR ALL TO authenticated
  USING (public.has_fu_permission('fu:mentors:manage'))
  WITH CHECK (public.has_fu_permission('fu:mentors:manage'));

-- 7. university_mentorships:
-- Somente equipe com permissão de mentoria ou o próprio mentor vinculado ao estudante (sem expor a padrinhos).
DROP POLICY IF EXISTS "FU_Mentorships_Select" ON public.university_mentorships;
CREATE POLICY "FU_Mentorships_Select" ON public.university_mentorships
  FOR SELECT TO authenticated
  USING (
    public.has_fu_permission('fu:mentors:view')
    OR public.has_fu_permission('fu:mentorships:manage')
    OR EXISTS (
      SELECT 1 FROM public.university_mentors m
      WHERE m.id = university_mentorships.mentor_id AND m.user_id = auth.uid() AND m.status = 'active'
    )
  );

DROP POLICY IF EXISTS "FU_Mentorships_Modify" ON public.university_mentorships;
CREATE POLICY "FU_Mentorships_Modify" ON public.university_mentorships
  FOR ALL TO authenticated
  USING (public.has_fu_permission('fu:mentorships:manage'))
  WITH CHECK (public.has_fu_permission('fu:mentorships:manage'));

-- 8. university_academic_records:
DROP POLICY IF EXISTS "FU_Academic_Select" ON public.university_academic_records;
CREATE POLICY "FU_Academic_Select" ON public.university_academic_records
  FOR SELECT TO authenticated
  USING (
    public.has_fu_permission('fu:academic:view')
    OR public.has_fu_module_access()
    OR EXISTS (
      SELECT 1 FROM public.university_sponsorships s
      JOIN public.university_students st ON st.id = s.student_id
      WHERE s.student_id = university_academic_records.student_id
        AND s.status = 'active'
        AND st.portal_visible = TRUE
        AND (s.sponsor_user_id = auth.uid() OR LOWER(s.donor_email) = LOWER(auth.jwt() ->> 'email'))
    )
  );

DROP POLICY IF EXISTS "FU_Academic_Modify" ON public.university_academic_records;
CREATE POLICY "FU_Academic_Modify" ON public.university_academic_records
  FOR ALL TO authenticated
  USING (public.has_fu_permission('fu:academic:edit'))
  WITH CHECK (public.has_fu_permission('fu:academic:edit'));

-- 9. university_sponsorships:
-- Equipe autorizada vê todos; mantenedor/padrinho vê apenas seus próprios vínculos.
DROP POLICY IF EXISTS "FU_Sponsorships_Select" ON public.university_sponsorships;
CREATE POLICY "FU_Sponsorships_Select" ON public.university_sponsorships
  FOR SELECT TO authenticated
  USING (
    public.has_fu_permission('fu:supporters:view')
    OR public.has_fu_module_access()
    OR sponsor_user_id = auth.uid()
    OR LOWER(donor_email) = LOWER(auth.jwt() ->> 'email')
  );

DROP POLICY IF EXISTS "FU_Sponsorships_Modify" ON public.university_sponsorships;
CREATE POLICY "FU_Sponsorships_Modify" ON public.university_sponsorships
  FOR ALL TO authenticated
  USING (
    public.has_fu_permission('fu:supporters:manage')
    OR sponsor_user_id = auth.uid()
    OR LOWER(donor_email) = LOWER(auth.jwt() ->> 'email')
  )
  WITH CHECK (
    public.has_fu_permission('fu:supporters:manage')
    OR sponsor_user_id = auth.uid()
    OR LOWER(donor_email) = LOWER(auth.jwt() ->> 'email')
  );

-- 10. university_updates:
DROP POLICY IF EXISTS "FU_Updates_Select" ON public.university_updates;
CREATE POLICY "FU_Updates_Select" ON public.university_updates
  FOR SELECT TO authenticated
  USING (
    published_to_portal = TRUE
    OR public.has_fu_permission('fu:reports:view')
    OR public.has_fu_module_access()
  );

DROP POLICY IF EXISTS "FU_Updates_Modify" ON public.university_updates;
CREATE POLICY "FU_Updates_Modify" ON public.university_updates
  FOR ALL TO authenticated
  USING (public.has_fu_permission('fu:reports:view') OR public.has_fu_permission('fu:settings:manage'))
  WITH CHECK (public.has_fu_permission('fu:reports:view') OR public.has_fu_permission('fu:settings:manage'));
