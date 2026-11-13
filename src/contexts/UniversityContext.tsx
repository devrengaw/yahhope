import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';
import {
  hasUniversityModuleAccess,
  hasUniversityPermission,
  UniversityPermissionKey,
} from '../lib/universityPermissions';

export interface UniversityStudentSensitiveData {
  student_id: string;
  document_id_number?: string;
  nuit?: string;
  documents_urls?: string[];
  family_sensitive_notes?: string;
  socioeconomic_details?: string;
  monthly_family_income?: number;
  household_members?: number;
  bank_name?: string;
  bank_account?: string;
  mobile_wallet?: string;
  spiritual_followup_notes?: string;
}

export interface UniversityStudent {
  id: string;
  registration_code: string;
  name: string;
  email?: string;
  phone?: string;
  dob?: string;
  gender?: 'M' | 'F' | string;
  city: string;
  province: string;
  photo_url?: string;
  institution: string;
  course: string;
  current_semester: number;
  total_semesters: number;
  expected_graduation: string;
  application_status: 'pending' | 'approved' | 'rejected';
  enrollment_status: 'candidate' | 'active' | 'graduated' | 'suspended' | 'inactive';
  public_bio?: string;
  career_goal?: string;
  portal_visible: boolean;
  approved_by?: string;
  approved_at?: string;
  created_at: string;
  /**
   * Dados sensíveis carregados SOMENTE no ambiente administrativo para usuários com `fu:students:view` / `fu:students:edit`.
   * Jamais expostos aos seletores do Portal dos Mantenedores.
   */
  sensitive?: UniversityStudentSensitiveData;
}

/**
 * Projeção estritamente filtrada (whitelist) para exibição no Portal dos Mantenedores/Padrinhos.
 * Exclui todos os dados familiares sensíveis, socioeconômicos, documentos pessoais, dados bancários,
 * anotações confidenciais de mentoria e registros de acompanhamento espiritual.
 */
export interface PortalAuthorizedStudentView {
  id: string;
  name: string;
  photo_url?: string;
  city: string;
  province: string;
  institution: string;
  course: string;
  current_semester: number;
  total_semesters: number;
  expected_graduation: string;
  public_bio?: string;
  career_goal?: string;
  sponsorshipModality: 'individual' | 'partial';
  monthlyContribution: number;
  quotaPercentage: number;
  latestAcademicSummary?: {
    period: string;
    gpa: number;
    attendance_rate: number;
    community_hours_completed: number;
    academic_status: string;
    public_highlight?: string;
  };
}

export interface UniversityScholarship {
  id: string;
  student_id: string;
  scholarship_type: 'integral' | 'parcial' | 'auxilio_material';
  monthly_amount: number;
  currency: 'BRL' | 'MZN';
  coverage_items: string[];
  start_date: string;
  end_date?: string;
  status: 'pending' | 'active' | 'suspended' | 'completed';
  notes?: string;
  created_at: string;
}

export interface UniversityScholarshipPayment {
  id: string;
  scholarship_id: string;
  student_id: string;
  reference_month: string;
  category: 'mensalidade' | 'matricula' | 'material' | 'transporte' | 'manutencao' | 'outros';
  amount: number;
  currency: 'BRL' | 'MZN';
  status: 'pending_approval' | 'approved' | 'paid' | 'rejected';
  due_date?: string;
  approved_by?: string;
  approved_at?: string;
  paid_by?: string;
  paid_at?: string;
  receipt_url?: string;
  notes?: string;
  created_at: string;
}

export interface UniversityMentor {
  id: string;
  user_id?: string; // Vínculo opcional para futuro portal de mentores (NÃO concede acesso administrativo)
  name: string;
  email: string;
  phone?: string;
  profession: string;
  company_or_institution?: string;
  specialty_area?: string;
  bio?: string;
  max_students: number;
  linked_student_ids: string[];
  status: 'active' | 'inactive' | 'onboarding';
  created_at: string;
}

export interface UniversityMentorshipSession {
  id: string;
  student_id: string;
  mentor_id: string;
  session_date: string;
  modality: 'online' | 'presencial';
  topic: string;
  status: 'scheduled' | 'completed' | 'cancelled';
  public_summary?: string;
  confidential_notes?: string; // Privado - nunca vai para o Portal do Mantenedor
  spiritual_notes?: string; // Privado - nunca vai para o Portal do Mantenedor
  next_steps?: string;
  recorded_by?: string;
  created_at: string;
}

export interface UniversityAcademicRecord {
  id: string;
  student_id: string;
  period: string;
  semester_number: number;
  gpa: number;
  attendance_rate: number;
  approved_subjects: number;
  total_subjects: number;
  community_hours_completed: number;
  academic_status: 'excelente' | 'regular' | 'atencao' | 'reprovado';
  public_highlight?: string;
  internal_observations?: string; // Privado - nunca vai para o Portal do Mantenedor
  updated_at: string;
}

export type UniversitySupporterModality = 'general' | 'individual' | 'partial';

export interface UniversitySponsorship {
  id: string;
  sponsor_user_id?: string;
  student_id?: string | null; // null quando modality = 'general'
  donor_name: string;
  donor_email: string;
  donor_phone?: string;
  modality: UniversitySupporterModality;
  monthly_amount: number;
  quota_percentage: number;
  currency: 'BRL' | 'MZN';
  payment_method: string;
  status: 'active' | 'paused' | 'cancelled';
  allow_student_updates: boolean;
  started_at: string;
}

export interface UniversityProgramUpdate {
  id: string;
  student_id?: string | null;
  title: string;
  summary: string;
  content: string;
  update_type: 'program_update' | 'impact_report' | 'student_milestone';
  image_url?: string;
  report_file_url?: string;
  published_to_portal: boolean;
  published_at: string;
}

export interface UniversityModuleConfig {
  id: string;
  program_name: string;
  short_description: string;
  full_description: string;
  full_scholarship_amount: number;
  partial_quota_amount: number;
  default_general_amount: number;
  currency: 'BRL' | 'MZN';
  counterpart_hours_required: number;
  portal_enabled: boolean;
  enforce_strict_privacy: boolean;
}

const DEFAULT_CONFIG: UniversityModuleConfig = {
  id: 'default',
  program_name: 'Futuro Universitário YAH Hope',
  short_description:
    'Programa de bolsas de ensino superior, mentoria vocacional e desenvolvimento de jovens líderes em Moçambique.',
  full_description:
    'O Futuro Universitário rompe o ciclo da pobreza através da educação superior de excelência. Jovens de comunidades vulneráveis que demonstram dedicação extraordinária nos estudos recebem cobertura de mensalidades, material didático, auxílio transporte e mentoria individual com profissionais voluntários, comprometendo-se com horas semanais de reforço escolar gratuito na comunidade.',
  full_scholarship_amount: 600,
  partial_quota_amount: 150,
  default_general_amount: 100,
  currency: 'BRL',
  counterpart_hours_required: 20,
  portal_enabled: true,
  enforce_strict_privacy: true,
};

const LEGACY_MOCK_STORAGE_KEYS = [
  'yah_fu_config_v1',
  'yah_fu_students_v1',
  'yah_fu_scholarships_v1',
  'yah_fu_payments_v1',
  'yah_fu_mentors_v1',
  'yah_fu_mentorships_v1',
  'yah_fu_academic_v1',
  'yah_fu_sponsorships_v1',
  'yah_fu_updates_v1',
];

function generateUuid(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

interface UniversityContextType {
  config: UniversityModuleConfig;
  students: UniversityStudent[];
  scholarships: UniversityScholarship[];
  payments: UniversityScholarshipPayment[];
  mentors: UniversityMentor[];
  mentorships: UniversityMentorshipSession[];
  academicRecords: UniversityAcademicRecord[];
  sponsorships: UniversitySponsorship[];
  updates: UniversityProgramUpdate[];
  loading: boolean;

  // Helpers de permissão reutilizando AuthContext
  canAccessModule: boolean;
  can: (permission: UniversityPermissionKey) => boolean;

  // Ações Administrativas (todas validadas por permissão)
  addStudent: (
    student: Omit<UniversityStudent, 'id' | 'created_at'>,
    sensitive?: Omit<UniversityStudentSensitiveData, 'student_id'>
  ) => Promise<{ success: boolean; error?: string }>;
  updateStudent: (
    id: string,
    updates: Partial<UniversityStudent>,
    sensitiveUpdates?: Partial<UniversityStudentSensitiveData>
  ) => Promise<{ success: boolean; error?: string }>;
  approveApplication: (
    studentId: string,
    decision: 'approved' | 'rejected'
  ) => Promise<{ success: boolean; error?: string }>;

  addScholarship: (
    scholarship: Omit<UniversityScholarship, 'id' | 'created_at'>
  ) => Promise<{ success: boolean; error?: string }>;
  updateScholarship: (
    id: string,
    updates: Partial<UniversityScholarship>
  ) => Promise<{ success: boolean; error?: string }>;

  createPayment: (
    payment: Omit<UniversityScholarshipPayment, 'id' | 'created_at'>
  ) => Promise<{ success: boolean; error?: string }>;
  approvePayment: (
    paymentId: string,
    decision: 'approved' | 'rejected'
  ) => Promise<{ success: boolean; error?: string }>;
  registerPaymentExecution: (
    paymentId: string,
    notes?: string,
    receiptUrl?: string
  ) => Promise<{ success: boolean; error?: string }>;

  addMentor: (
    mentor: Omit<UniversityMentor, 'id' | 'created_at'>
  ) => Promise<{ success: boolean; error?: string }>;
  updateMentor: (
    id: string,
    updates: Partial<UniversityMentor>
  ) => Promise<{ success: boolean; error?: string }>;
  addMentorshipSession: (
    session: Omit<UniversityMentorshipSession, 'id' | 'created_at'>
  ) => Promise<{ success: boolean; error?: string }>;

  saveAcademicRecord: (
    record: Omit<UniversityAcademicRecord, 'id' | 'updated_at'> & { id?: string }
  ) => Promise<{ success: boolean; error?: string }>;

  addSponsorship: (
    sponsorship: Omit<UniversitySponsorship, 'id' | 'started_at'>
  ) => Promise<{ success: boolean; error?: string }>;
  updateSponsorship: (
    id: string,
    updates: Partial<UniversitySponsorship>
  ) => Promise<{ success: boolean; error?: string }>;

  addProgramUpdate: (
    update: Omit<UniversityProgramUpdate, 'id' | 'published_at'>
  ) => Promise<{ success: boolean; error?: string }>;
  saveModuleConfig: (
    updates: Partial<UniversityModuleConfig>
  ) => Promise<{ success: boolean; error?: string }>;

  // Seletor Seguro para o Portal dos Mantenedores/Padrinhos (com filtro estrito de privacidade)
  getPortalDataForSupporter: (userId?: string, userEmail?: string) => {
    config: UniversityModuleConfig;
    impactMetrics: {
      activeStudentsCount: number;
      partnerInstitutionsCount: number;
      averageGpa: string;
      totalCommunityHours: number;
      activeMentorsCount: number;
    };
    mySponsorships: UniversitySponsorship[];
    primaryModality: UniversitySupporterModality | null;
    totalMonthlyCommitted: number;
    authorizedStudents: PortalAuthorizedStudentView[];
    availableStudentsForSponsorship: Array<{
      id: string;
      name: string;
      photo_url?: string;
      institution: string;
      course: string;
      current_semester: number;
      total_semesters: number;
      city: string;
      public_bio?: string;
      career_goal?: string;
      fundedPercentage: number;
      remainingMonthlyAmount: number;
    }>;
    programUpdates: UniversityProgramUpdate[];
  };
}

const UniversityContext = createContext<UniversityContextType | undefined>(undefined);

export function UniversityProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();

  const [config, setConfig] = useState<UniversityModuleConfig>(DEFAULT_CONFIG);
  const [students, setStudents] = useState<UniversityStudent[]>([]);
  const [scholarships, setScholarships] = useState<UniversityScholarship[]>([]);
  const [payments, setPayments] = useState<UniversityScholarshipPayment[]>([]);
  const [mentors, setMentors] = useState<UniversityMentor[]>([]);
  const [mentorships, setMentorships] = useState<UniversityMentorshipSession[]>([]);
  const [academicRecords, setAcademicRecords] = useState<UniversityAcademicRecord[]>([]);
  const [sponsorships, setSponsorships] = useState<UniversitySponsorship[]>([]);
  const [updates, setUpdates] = useState<UniversityProgramUpdate[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  const canAccessModule = useMemo(() => hasUniversityModuleAccess(user), [user]);
  const can = (permission: UniversityPermissionKey) => hasUniversityPermission(user, permission);

  // Remove qualquer cache antigo de dados mockup do localStorage
  useEffect(() => {
    try {
      LEGACY_MOCK_STORAGE_KEYS.forEach(k => localStorage.removeItem(k));
    } catch {}
  }, []);

  // Sincronização com Supabase
  useEffect(() => {
    let isMounted = true;
    async function syncFromSupabase() {
      if (!user) return;
      try {
        setLoading(true);
        const [
          cfgRes,
          stuRes,
          sensRes,
          schRes,
          payRes,
          menRes,
          msRes,
          acadRes,
          spRes,
          updRes,
        ] = await Promise.allSettled([
          supabase.from('university_config').select('*').eq('id', 'default').maybeSingle(),
          supabase.from('university_students').select('*').order('created_at', { ascending: false }),
          canAccessModule ? supabase.from('university_student_sensitive_data').select('*') : Promise.resolve({ data: null }),
          canAccessModule ? supabase.from('university_scholarships').select('*') : Promise.resolve({ data: null }),
          canAccessModule ? supabase.from('university_scholarship_payments').select('*') : Promise.resolve({ data: null }),
          canAccessModule ? supabase.from('university_mentors').select('*') : Promise.resolve({ data: null }),
          canAccessModule ? supabase.from('university_mentorships').select('*') : Promise.resolve({ data: null }),
          supabase.from('university_academic_records').select('*'),
          supabase.from('university_sponsorships').select('*'),
          supabase.from('university_updates').select('*').order('published_at', { ascending: false }),
        ]);

        if (!isMounted) return;

        if (cfgRes.status === 'fulfilled' && cfgRes.value.data) {
          setConfig(prev => ({ ...prev, ...cfgRes.value.data }));
        }

        if (stuRes.status === 'fulfilled' && Array.isArray(stuRes.value.data)) {
          const sensMap = new Map<string, UniversityStudentSensitiveData>();
          if (sensRes.status === 'fulfilled' && Array.isArray((sensRes.value as any)?.data)) {
            ((sensRes.value as any).data as UniversityStudentSensitiveData[]).forEach(s => {
              sensMap.set(s.student_id, s);
            });
          }
          setStudents(
            stuRes.value.data.map((st: any) => ({
              ...st,
              sensitive: canAccessModule ? sensMap.get(st.id) : undefined,
            }))
          );
        }

        if (schRes.status === 'fulfilled' && Array.isArray((schRes.value as any)?.data)) {
          setScholarships((schRes.value as any).data);
        }
        if (payRes.status === 'fulfilled' && Array.isArray((payRes.value as any)?.data)) {
          setPayments((payRes.value as any).data);
        }
        if (menRes.status === 'fulfilled' && Array.isArray((menRes.value as any)?.data)) {
          setMentors((menRes.value as any).data);
        }
        if (msRes.status === 'fulfilled' && Array.isArray((msRes.value as any)?.data)) {
          setMentorships((msRes.value as any).data);
        }
        if (acadRes.status === 'fulfilled' && Array.isArray(acadRes.value.data)) {
          setAcademicRecords(acadRes.value.data);
        }
        if (spRes.status === 'fulfilled' && Array.isArray(spRes.value.data)) {
          setSponsorships(spRes.value.data);
        }
        if (updRes.status === 'fulfilled' && Array.isArray(updRes.value.data)) {
          setUpdates(updRes.value.data);
        }
      } catch {
        // Mantém estado vazio caso ainda não existam registros
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    syncFromSupabase();
    return () => {
      isMounted = false;
    };
  }, [user?.id, canAccessModule]);

  const addStudent: UniversityContextType['addStudent'] = async (studentData, sensitiveData) => {
    if (!can('fu:students:create')) {
      return { success: false, error: 'Permissão negada: você não possui autorização para cadastrar estudantes (fu:students:create).' };
    }

    const newId = generateUuid();
    const newStudent: UniversityStudent = {
      ...studentData,
      id: newId,
      created_at: new Date().toISOString(),
      sensitive: sensitiveData ? { ...sensitiveData, student_id: newId } : undefined,
    };

    setStudents(prev => [newStudent, ...prev]);

    try {
      const { sensitive, ...publicFields } = newStudent;
      await supabase.from('university_students').insert([publicFields]);
      if (sensitive) {
        await supabase.from('university_student_sensitive_data').insert([sensitive]);
      }
    } catch {}

    return { success: true };
  };

  const updateStudent: UniversityContextType['updateStudent'] = async (id, studentUpdates, sensitiveUpdates) => {
    if (!can('fu:students:edit')) {
      return { success: false, error: 'Permissão negada: você não possui autorização para editar estudantes (fu:students:edit).' };
    }

    setStudents(prev =>
      prev.map(s => {
        if (s.id !== id) return s;
        return {
          ...s,
          ...studentUpdates,
          sensitive: sensitiveUpdates
            ? { ...(s.sensitive || { student_id: id }), ...sensitiveUpdates }
            : s.sensitive,
        };
      })
    );

    try {
      const { sensitive, ...publicUpdates } = studentUpdates as any;
      if (Object.keys(publicUpdates).length > 0) {
        await supabase.from('university_students').update(publicUpdates).eq('id', id);
      }
      if (sensitiveUpdates && Object.keys(sensitiveUpdates).length > 0) {
        await supabase
          .from('university_student_sensitive_data')
          .upsert({ student_id: id, ...sensitiveUpdates });
      }
    } catch {}

    return { success: true };
  };

  const approveApplication: UniversityContextType['approveApplication'] = async (studentId, decision) => {
    if (!can('fu:applications:approve')) {
      return { success: false, error: 'Permissão negada: você não possui autorização para aprovar inscrições (fu:applications:approve).' };
    }

    const now = new Date().toISOString();
    const enrollment_status = decision === 'approved' ? 'active' : 'inactive';

    setStudents(prev =>
      prev.map(s =>
        s.id === studentId
          ? {
              ...s,
              application_status: decision,
              enrollment_status,
              approved_by: user?.id,
              approved_at: now,
            }
          : s
      )
    );

    try {
      await supabase
        .from('university_students')
        .update({
          application_status: decision,
          enrollment_status,
          approved_by: user?.id,
          approved_at: now,
        })
        .eq('id', studentId);
    } catch {}

    return { success: true };
  };

  const addScholarship: UniversityContextType['addScholarship'] = async scholarshipData => {
    if (!can('fu:scholarships:manage')) {
      return { success: false, error: 'Permissão negada: você não possui autorização para gerenciar bolsas (fu:scholarships:manage).' };
    }

    const newScholarship: UniversityScholarship = {
      ...scholarshipData,
      id: generateUuid(),
      created_at: new Date().toISOString(),
    };

    setScholarships(prev => [newScholarship, ...prev]);

    try {
      await supabase.from('university_scholarships').insert([newScholarship]);
    } catch {}

    return { success: true };
  };

  const updateScholarship: UniversityContextType['updateScholarship'] = async (id, updatesData) => {
    if (!can('fu:scholarships:manage')) {
      return { success: false, error: 'Permissão negada: você não possui autorização para gerenciar bolsas (fu:scholarships:manage).' };
    }

    setScholarships(prev => prev.map(s => (s.id === id ? { ...s, ...updatesData } : s)));

    try {
      await supabase.from('university_scholarships').update(updatesData).eq('id', id);
    } catch {}

    return { success: true };
  };

  const createPayment: UniversityContextType['createPayment'] = async paymentData => {
    if (!can('fu:scholarships:manage') && !can('fu:payments:register')) {
      return { success: false, error: 'Permissão negada: você não possui autorização para lançar pagamentos.' };
    }

    const newPayment: UniversityScholarshipPayment = {
      ...paymentData,
      id: generateUuid(),
      created_at: new Date().toISOString(),
    };

    setPayments(prev => [newPayment, ...prev]);

    try {
      await supabase.from('university_scholarship_payments').insert([newPayment]);
    } catch {}

    return { success: true };
  };

  const approvePayment: UniversityContextType['approvePayment'] = async (paymentId, decision) => {
    if (!can('fu:payments:approve')) {
      return { success: false, error: 'Permissão negada: você não possui autorização para aprovar pagamentos (fu:payments:approve).' };
    }

    const now = new Date().toISOString();
    setPayments(prev =>
      prev.map(p =>
        p.id === paymentId
          ? {
              ...p,
              status: decision,
              approved_by: user?.id,
              approved_at: now,
            }
          : p
      )
    );

    try {
      await supabase
        .from('university_scholarship_payments')
        .update({ status: decision, approved_by: user?.id, approved_at: now })
        .eq('id', paymentId);
    } catch {}

    return { success: true };
  };

  const registerPaymentExecution: UniversityContextType['registerPaymentExecution'] = async (
    paymentId,
    notes,
    receiptUrl
  ) => {
    if (!can('fu:payments:register')) {
      return { success: false, error: 'Permissão negada: você não possui autorização para registrar pagamentos (fu:payments:register).' };
    }

    const now = new Date().toISOString();
    setPayments(prev =>
      prev.map(p =>
        p.id === paymentId
          ? {
              ...p,
              status: 'paid',
              paid_by: user?.id,
              paid_at: now,
              notes: notes !== undefined ? notes : p.notes,
              receipt_url: receiptUrl !== undefined ? receiptUrl : p.receipt_url,
            }
          : p
      )
    );

    try {
      await supabase
        .from('university_scholarship_payments')
        .update({
          status: 'paid',
          paid_by: user?.id,
          paid_at: now,
          ...(notes !== undefined ? { notes } : {}),
          ...(receiptUrl !== undefined ? { receipt_url: receiptUrl } : {}),
        })
        .eq('id', paymentId);
    } catch {}

    return { success: true };
  };

  const addMentor: UniversityContextType['addMentor'] = async mentorData => {
    if (!can('fu:mentors:manage')) {
      return { success: false, error: 'Permissão negada: você não possui autorização para gerenciar mentores (fu:mentors:manage).' };
    }

    // IMPORTANTE (Regra de Arquitetura Seção 5):
    // O cadastro de um mentor registra apenas na estrutura de mentores do módulo,
    // sem criar usuário administrativo nem conceder permissões no painel administrativo.
    const newMentor: UniversityMentor = {
      ...mentorData,
      id: generateUuid(),
      created_at: new Date().toISOString(),
    };

    setMentors(prev => [newMentor, ...prev]);

    try {
      await supabase.from('university_mentors').insert([newMentor]);
    } catch {}

    return { success: true };
  };

  const updateMentor: UniversityContextType['updateMentor'] = async (id, mentorUpdates) => {
    if (!can('fu:mentors:manage')) {
      return { success: false, error: 'Permissão negada: você não possui autorização para gerenciar mentores (fu:mentors:manage).' };
    }

    setMentors(prev => prev.map(m => (m.id === id ? { ...m, ...mentorUpdates } : m)));

    try {
      await supabase.from('university_mentors').update(mentorUpdates).eq('id', id);
    } catch {}

    return { success: true };
  };

  const addMentorshipSession: UniversityContextType['addMentorshipSession'] = async sessionData => {
    if (!can('fu:mentorships:manage')) {
      return { success: false, error: 'Permissão negada: você não possui autorização para gerenciar mentorias (fu:mentorships:manage).' };
    }

    const newSession: UniversityMentorshipSession = {
      ...sessionData,
      id: generateUuid(),
      recorded_by: user?.id,
      created_at: new Date().toISOString(),
    };

    setMentorships(prev => [newSession, ...prev]);

    try {
      await supabase.from('university_mentorships').insert([newSession]);
    } catch {}

    return { success: true };
  };

  const saveAcademicRecord: UniversityContextType['saveAcademicRecord'] = async recordData => {
    if (!can('fu:academic:edit')) {
      return { success: false, error: 'Permissão negada: você não possui autorização para editar informações acadêmicas (fu:academic:edit).' };
    }

    const now = new Date().toISOString();
    if (recordData.id) {
      setAcademicRecords(prev =>
        prev.map(r => (r.id === recordData.id ? { ...r, ...recordData, id: r.id, updated_at: now } : r))
      );
      try {
        await supabase
          .from('university_academic_records')
          .update({ ...recordData, updated_at: now })
          .eq('id', recordData.id);
      } catch {}
    } else {
      const newRecord: UniversityAcademicRecord = {
        ...recordData,
        id: generateUuid(),
        updated_at: now,
      };
      setAcademicRecords(prev => [newRecord, ...prev]);
      try {
        await supabase.from('university_academic_records').insert([newRecord]);
      } catch {}
    }

    return { success: true };
  };

  const addSponsorship: UniversityContextType['addSponsorship'] = async sponsorshipData => {
    // Permite tanto ao administrador (fu:supporters:manage) quanto ao próprio mantenedor autenticado no Portal iniciar um vínculo
    const isSelfSupporter =
      user &&
      (sponsorshipData.sponsor_user_id === user.id ||
        sponsorshipData.donor_email.toLowerCase().trim() === user.email.toLowerCase().trim());

    if (!isSelfSupporter && !can('fu:supporters:manage')) {
      return { success: false, error: 'Permissão negada: você não possui autorização para gerenciar apoiadores (fu:supporters:manage).' };
    }

    const newSp: UniversitySponsorship = {
      ...sponsorshipData,
      id: generateUuid(),
      started_at: new Date().toISOString(),
    };

    setSponsorships(prev => [newSp, ...prev]);

    try {
      await supabase.from('university_sponsorships').insert([newSp]);
    } catch {}

    return { success: true };
  };

  const updateSponsorship: UniversityContextType['updateSponsorship'] = async (id, spUpdates) => {
    if (!can('fu:supporters:manage')) {
      return { success: false, error: 'Permissão negada: você não possui autorização para gerenciar apoiadores (fu:supporters:manage).' };
    }

    setSponsorships(prev => prev.map(sp => (sp.id === id ? { ...sp, ...spUpdates } : sp)));

    try {
      await supabase.from('university_sponsorships').update(spUpdates).eq('id', id);
    } catch {}

    return { success: true };
  };

  const addProgramUpdate: UniversityContextType['addProgramUpdate'] = async updateData => {
    if (!can('fu:reports:view') && !can('fu:settings:manage')) {
      return { success: false, error: 'Permissão negada: você não possui autorização para publicar atualizações.' };
    }

    const newUpdate: UniversityProgramUpdate = {
      ...updateData,
      id: generateUuid(),
      published_at: new Date().toISOString(),
    };

    setUpdates(prev => [newUpdate, ...prev]);

    try {
      await supabase.from('university_updates').insert([newUpdate]);
    } catch {}

    return { success: true };
  };

  const saveModuleConfig: UniversityContextType['saveModuleConfig'] = async configUpdates => {
    if (!can('fu:settings:manage')) {
      return { success: false, error: 'Permissão negada: você não possui autorização para configurar o módulo (fu:settings:manage).' };
    }

    setConfig(prev => ({ ...prev, ...configUpdates }));

    try {
      await supabase
        .from('university_config')
        .upsert({ id: 'default', ...config, ...configUpdates, updated_at: new Date().toISOString() });
    } catch {}

    return { success: true };
  };

  /**
   * SELETOR PÚBLICO/AUTORIZADO PARA O PORTAL DOS MANTENEDORES/PADRINHOS (Seção 4)
   * Filtra estritamente por vínculos do apoiador e aplica whitelist de privacidade:
   * NUNCA retorna dados familiares sensíveis, socioeconômicos, documentos, dados bancários,
   * anotações confidenciais de mentoria ou registros de acompanhamento espiritual.
   */
  const getPortalDataForSupporter: UniversityContextType['getPortalDataForSupporter'] = (
    userId,
    userEmail
  ) => {
    const cleanEmail = (userEmail || '').toLowerCase().trim();

    const activeStudents = students.filter(
      s => s.application_status === 'approved' && s.enrollment_status === 'active'
    );
    const institutions = new Set(activeStudents.map(s => s.institution));
    const avgGpa =
      academicRecords.length > 0
        ? (academicRecords.reduce((acc, r) => acc + Number(r.gpa || 0), 0) / academicRecords.length).toFixed(1)
        : '0.0';
    const totalCommunityHours = academicRecords.reduce(
      (acc, r) => acc + Number(r.community_hours_completed || 0),
      0
    );
    const activeMentorsCount = mentors.filter(m => m.status === 'active').length;

    // Vínculos ativos deste mantenedor/padrinho
    const mySponsorships = sponsorships.filter(sp => {
      if (sp.status !== 'active') return false;
      const matchId = Boolean(userId && sp.sponsor_user_id === userId);
      const matchEmail = Boolean(cleanEmail && sp.donor_email.toLowerCase().trim() === cleanEmail);
      return matchId || matchEmail;
    });

    const totalMonthlyCommitted = mySponsorships.reduce(
      (acc, sp) => acc + Number(sp.monthly_amount || 0),
      0
    );

    // Determina a modalidade principal do apoiador
    let primaryModality: UniversitySupporterModality | null = null;
    if (mySponsorships.some(s => s.modality === 'individual')) {
      primaryModality = 'individual';
    } else if (mySponsorships.some(s => s.modality === 'partial')) {
      primaryModality = 'partial';
    } else if (mySponsorships.some(s => s.modality === 'general')) {
      primaryModality = 'general';
    }

    // Estudantes vinculados e autorizados (somente para Padrinho Individual ou Apoiador Parcial com allow_student_updates e portal_visible)
    const authorizedStudents: PortalAuthorizedStudentView[] = [];
    const seenStudentIds = new Set<string>();

    mySponsorships.forEach(sp => {
      if (
        (sp.modality === 'individual' || sp.modality === 'partial') &&
        sp.student_id &&
        sp.allow_student_updates &&
        !seenStudentIds.has(sp.student_id)
      ) {
        const st = activeStudents.find(s => s.id === sp.student_id && s.portal_visible);
        if (!st) return;

        seenStudentIds.add(st.id);

        const latestAcad = [...academicRecords]
          .filter(r => r.student_id === st.id)
          .sort((a, b) => b.semester_number - a.semester_number)[0];

        // Whitelist estrita: apenas dados públicos/acadêmicos autorizados
        authorizedStudents.push({
          id: st.id,
          name: st.name,
          photo_url: st.photo_url,
          city: st.city,
          province: st.province,
          institution: st.institution,
          course: st.course,
          current_semester: st.current_semester,
          total_semesters: st.total_semesters,
          expected_graduation: st.expected_graduation,
          public_bio: st.public_bio,
          career_goal: st.career_goal,
          sponsorshipModality: sp.modality,
          monthlyContribution: sp.monthly_amount,
          quotaPercentage: sp.quota_percentage,
          latestAcademicSummary: latestAcad
            ? {
                period: latestAcad.period,
                gpa: latestAcad.gpa,
                attendance_rate: latestAcad.attendance_rate,
                community_hours_completed: latestAcad.community_hours_completed,
                academic_status: latestAcad.academic_status,
                public_highlight: latestAcad.public_highlight,
              }
            : undefined,
        });
      }
    });

    // Estudantes elegíveis (com portal_visible = true) disponíveis para novos apadrinhamentos individuais ou parciais
    const availableStudentsForSponsorship = activeStudents
      .filter(s => s.portal_visible)
      .map(st => {
        const stScholarship = scholarships.find(
          sch => sch.student_id === st.id && sch.status === 'active'
        );
        const targetMonthly = stScholarship?.monthly_amount || config.full_scholarship_amount;
        const currentSponsored = sponsorships
          .filter(sp => sp.student_id === st.id && sp.status === 'active')
          .reduce((acc, sp) => acc + Number(sp.monthly_amount || 0), 0);

        const fundedPercentage = Math.min(
          100,
          Math.round((currentSponsored / Math.max(1, targetMonthly)) * 100)
        );
        const remainingMonthlyAmount = Math.max(0, targetMonthly - currentSponsored);

        return {
          id: st.id,
          name: st.name,
          photo_url: st.photo_url,
          institution: st.institution,
          course: st.course,
          current_semester: st.current_semester,
          total_semesters: st.total_semesters,
          city: st.city,
          public_bio: st.public_bio,
          career_goal: st.career_goal,
          fundedPercentage,
          remainingMonthlyAmount,
        };
      });

    // Atualizações autorizadas para o portal:
    // - Gerais do programa e relatórios de impacto (student_id == null) são visíveis a todos os mantenedores
    // - Marcos de um estudante específico (student_id != null) só são visíveis para quem apadrinha aquele estudante
    const programUpdates = updates.filter(u => {
      if (!u.published_to_portal) return false;
      if (!u.student_id) return true;
      return seenStudentIds.has(u.student_id);
    });

    return {
      config,
      impactMetrics: {
        activeStudentsCount: activeStudents.length,
        partnerInstitutionsCount: institutions.size,
        averageGpa: avgGpa,
        totalCommunityHours,
        activeMentorsCount,
      },
      mySponsorships,
      primaryModality,
      totalMonthlyCommitted,
      authorizedStudents,
      availableStudentsForSponsorship,
      programUpdates,
    };
  };

  return (
    <UniversityContext.Provider
      value={{
        config,
        students,
        scholarships,
        payments,
        mentors,
        mentorships,
        academicRecords,
        sponsorships,
        updates,
        loading,
        canAccessModule,
        can,
        addStudent,
        updateStudent,
        approveApplication,
        addScholarship,
        updateScholarship,
        createPayment,
        approvePayment,
        registerPaymentExecution,
        addMentor,
        updateMentor,
        addMentorshipSession,
        saveAcademicRecord,
        addSponsorship,
        updateSponsorship,
        addProgramUpdate,
        saveModuleConfig,
        getPortalDataForSupporter,
      }}
    >
      {children}
    </UniversityContext.Provider>
  );
}

export function useUniversity() {
  const context = useContext(UniversityContext);
  if (!context) {
    throw new Error('useUniversity deve ser utilizado dentro de um UniversityProvider');
  }
  return context;
}
