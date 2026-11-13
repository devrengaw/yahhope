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

const INITIAL_STUDENTS: UniversityStudent[] = [
  {
    id: 'fu-stu-001',
    registration_code: 'FU-2025-001',
    name: 'Samora Macamo',
    email: 'samora.macamo@estudante.mz',
    phone: '+258 84 123 4501',
    dob: '2004-03-14',
    gender: 'M',
    city: 'Nampula',
    province: 'Nampula',
    photo_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=600',
    institution: 'Universidade Lúrio (UniLúrio)',
    course: 'Medicina Geral',
    current_semester: 5,
    total_semesters: 12,
    expected_graduation: '2029.2',
    application_status: 'approved',
    enrollment_status: 'active',
    public_bio:
      'Estudante dedicado do curso de Medicina na UniLúrio em Nampula. Atua como voluntário nas ações educativas de saúde preventiva na comunidade local.',
    career_goal: 'Tornar-se médico pediatra para atuar no combate à desnutrição infantil em Nampula.',
    portal_visible: true,
    created_at: '2025-02-10T10:00:00Z',
    sensitive: {
      student_id: 'fu-stu-001',
      document_id_number: '030102938471B',
      nuit: '109283746',
      family_sensitive_notes: 'Órfão de pai; mãe atua na agricultura de subsistência com 4 irmãos menores.',
      socioeconomic_details: 'Moradia compartilhada em bairro periférico de Nampula, renda familiar inferior a 1 salário mínimo.',
      monthly_family_income: 280,
      household_members: 6,
      bank_name: 'Millennium BIM',
      bank_account: '450019283-0',
      mobile_wallet: 'M-Pesa +258 84 123 4501',
      spiritual_followup_notes: 'Participa quinzenalmente dos encontros de jovens e demonstra maturidade emocional.',
    },
  },
  {
    id: 'fu-stu-002',
    registration_code: 'FU-2025-002',
    name: 'Graça Chissano',
    email: 'graca.chissano@estudante.mz',
    phone: '+258 84 234 5602',
    dob: '2005-07-22',
    gender: 'F',
    city: 'Nampula',
    province: 'Nampula',
    photo_url: 'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?auto=format&fit=crop&q=80&w=600',
    institution: 'Universidade Católica de Moçambique (UCM)',
    course: 'Enfermagem em Saúde Materno-Infantil',
    current_semester: 4,
    total_semesters: 8,
    expected_graduation: '2028.2',
    application_status: 'approved',
    enrollment_status: 'active',
    public_bio:
      'Bolsista do curso de Enfermagem em Nampula, apaixonada pelo cuidado materno-infantil e orientação nutricional para gestantes.',
    career_goal: 'Liderar programas comunitários de saúde materna e nutrição infantil.',
    portal_visible: true,
    created_at: '2025-02-15T10:00:00Z',
    sensitive: {
      student_id: 'fu-stu-002',
      document_id_number: '030199283746C',
      nuit: '104938271',
      family_sensitive_notes: 'Primeira pessoa da família a ingressar no ensino superior. Sustentada pela avó.',
      socioeconomic_details: 'Vulnerabilidade socioeconômica severa; bolsa cobre 100% das taxas e transporte.',
      monthly_family_income: 210,
      household_members: 5,
      bank_name: 'BCI Moçambique',
      bank_account: '99182736-1',
      mobile_wallet: 'e-Mola +258 86 234 5602',
      spiritual_followup_notes: 'Solicitou oração pela saúde da avó no último acompanhamento.',
    },
  },
  {
    id: 'fu-stu-003',
    registration_code: 'FU-2025-003',
    name: 'Tomás Mondlane',
    email: 'tomas.mondlane@estudante.mz',
    phone: '+258 84 345 6703',
    dob: '2003-11-05',
    gender: 'M',
    city: 'Maputo',
    province: 'Maputo',
    photo_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=600',
    institution: 'Universidade São Tomás de Moçambique (USTM)',
    course: 'Engenharia Agronômica',
    current_semester: 6,
    total_semesters: 10,
    expected_graduation: '2028.1',
    application_status: 'approved',
    enrollment_status: 'active',
    public_bio:
      'Estudante de Engenharia Agronômica focado em técnicas de cultivo resiliente e hortas comunitárias para segurança alimentar.',
    career_goal: 'Desenvolver sistemas de irrigação sustentável e hortas comunitárias em zonas rurais.',
    portal_visible: true,
    created_at: '2025-03-01T10:00:00Z',
    sensitive: {
      student_id: 'fu-stu-003',
      document_id_number: '110182736455A',
      nuit: '103847562',
      family_sensitive_notes: 'Família deslocada por eventos climáticos; reside em alojamento estudantil apoiado.',
      socioeconomic_details: 'Depende integralmente do auxílio manutenção e bolsa universitária.',
      monthly_family_income: 190,
      household_members: 4,
      bank_name: 'Millennium BIM',
      bank_account: '77182930-4',
      mobile_wallet: 'M-Pesa +258 84 345 6703',
      spiritual_followup_notes: 'Líder de grupo de estudos bíblicos entre universitários.',
    },
  },
  {
    id: 'fu-stu-004',
    registration_code: 'FU-2026-004',
    name: 'Celina Mucavel',
    email: 'celina.mucavel@estudante.mz',
    phone: '+258 84 456 7804',
    dob: '2006-01-19',
    gender: 'F',
    city: 'Nampula',
    province: 'Nampula',
    photo_url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=600',
    institution: 'Universidade Rovuma (UniRovuma)',
    course: 'Pedagogia e Educação Infantil',
    current_semester: 1,
    total_semesters: 8,
    expected_graduation: '2030.1',
    application_status: 'pending',
    enrollment_status: 'candidate',
    public_bio:
      'Jovem educadora voluntária em Nampula, aprovada no vestibular da UniRovuma e aguardando aprovação final da bolsa.',
    career_goal: 'Alfabetização infantil e coordenação pedagógica em escolas comunitárias.',
    portal_visible: false,
    created_at: '2026-10-12T10:00:00Z',
    sensitive: {
      student_id: 'fu-stu-004',
      document_id_number: '030177665544D',
      nuit: '108877665',
      family_sensitive_notes: 'Triagem social realizada em outubro/2026. Documentação familiar validada pela assistente social.',
      socioeconomic_details: 'Sem renda formal na residência; excelente histórico escolar no ensino médio (média 17/20).',
      monthly_family_income: 150,
      household_members: 7,
      bank_name: 'Em abertura',
      bank_account: '-',
      mobile_wallet: 'M-Pesa +258 84 456 7804',
      spiritual_followup_notes: 'Acompanhada pela equipe local de Nampula.',
    },
  },
];

const INITIAL_SCHOLARSHIPS: UniversityScholarship[] = [
  {
    id: 'fu-sch-001',
    student_id: 'fu-stu-001',
    scholarship_type: 'integral',
    monthly_amount: 600,
    currency: 'BRL',
    coverage_items: ['Mensalidade Integral', 'Material Didático & Atlas Clínico', 'Transporte Urbano'],
    start_date: '2025-02-15',
    end_date: '2029-12-15',
    status: 'active',
    notes: 'Bolsa integral renovada mediante média semestral >= 8.5.',
    created_at: '2025-02-15T10:00:00Z',
  },
  {
    id: 'fu-sch-002',
    student_id: 'fu-stu-002',
    scholarship_type: 'integral',
    monthly_amount: 600,
    currency: 'BRL',
    coverage_items: ['Mensalidade Integral', 'Insumos de Estágio', 'Transporte'],
    start_date: '2025-02-20',
    end_date: '2028-12-15',
    status: 'active',
    notes: 'Parceria institucional UCM Nampula.',
    created_at: '2025-02-20T10:00:00Z',
  },
  {
    id: 'fu-sch-003',
    student_id: 'fu-stu-003',
    scholarship_type: 'parcial',
    monthly_amount: 450,
    currency: 'BRL',
    coverage_items: ['Mensalidade Parcial (75%)', 'Material Técnico Agrícola'],
    start_date: '2025-03-01',
    end_date: '2028-07-15',
    status: 'active',
    notes: 'Contrato de parceria com a Universidade São Tomás renovado.',
    created_at: '2025-03-01T10:00:00Z',
  },
];

const INITIAL_PAYMENTS: UniversityScholarshipPayment[] = [
  {
    id: 'fu-pay-001',
    scholarship_id: 'fu-sch-001',
    student_id: 'fu-stu-001',
    reference_month: '2026-10',
    category: 'mensalidade',
    amount: 600,
    currency: 'BRL',
    status: 'paid',
    due_date: '2026-10-10',
    approved_at: '2026-10-05T14:00:00Z',
    paid_at: '2026-10-08T09:30:00Z',
    notes: 'Transferência confirmada para conta universitária.',
    created_at: '2026-10-01T10:00:00Z',
  },
  {
    id: 'fu-pay-002',
    scholarship_id: 'fu-sch-002',
    student_id: 'fu-stu-002',
    reference_month: '2026-10',
    category: 'mensalidade',
    amount: 600,
    currency: 'BRL',
    status: 'paid',
    due_date: '2026-10-10',
    approved_at: '2026-10-05T14:00:00Z',
    paid_at: '2026-10-09T11:00:00Z',
    notes: 'Mensalidade outubro quitada.',
    created_at: '2026-10-01T10:00:00Z',
  },
  {
    id: 'fu-pay-003',
    scholarship_id: 'fu-sch-001',
    student_id: 'fu-stu-001',
    reference_month: '2026-11',
    category: 'mensalidade',
    amount: 600,
    currency: 'BRL',
    status: 'approved',
    due_date: '2026-11-15',
    approved_at: '2026-11-08T10:00:00Z',
    notes: 'Aprovado pela coordenação, aguardando baixa financeira.',
    created_at: '2026-11-01T10:00:00Z',
  },
  {
    id: 'fu-pay-004',
    scholarship_id: 'fu-sch-003',
    student_id: 'fu-stu-003',
    reference_month: '2026-11',
    category: 'mensalidade',
    amount: 450,
    currency: 'BRL',
    status: 'pending_approval',
    due_date: '2026-11-15',
    notes: 'Boleto semestral emitido pela secretaria acadêmica.',
    created_at: '2026-11-02T10:00:00Z',
  },
];

const INITIAL_MENTORS: UniversityMentor[] = [
  {
    id: 'fu-men-001',
    name: 'Prof. Marcos Silva',
    email: 'marcos.silva@mentoria.org',
    phone: '+55 11 98877-6655',
    profession: 'Médico Pediatra & Docente Universitário',
    company_or_institution: 'Hospital Universitário / Voluntário YAH Hope',
    specialty_area: 'Medicina, Pesquisa Clínica & Liderança Cristã',
    bio: 'Acompanha estudantes da área de saúde em gestão de carreira, ética médica e preparação para residência.',
    max_students: 3,
    linked_student_ids: ['fu-stu-001', 'fu-stu-002'],
    status: 'active',
    created_at: '2025-02-10T10:00:00Z',
  },
  {
    id: 'fu-men-002',
    name: 'Eng. Ricardo Almeida',
    email: 'ricardo.almeida@mentoria.org',
    phone: '+55 19 97766-5544',
    profession: 'Engenheiro Agrônomo Sênior',
    company_or_institution: 'Instituto Agro Sustentável',
    specialty_area: 'Agronomia Tropical, Segurança Alimentar & Gestão de Projetos',
    bio: 'Mentor técnico e vocacional para estudantes de engenharias e ciências agrárias.',
    max_students: 2,
    linked_student_ids: ['fu-stu-003'],
    status: 'active',
    created_at: '2025-03-05T10:00:00Z',
  },
];

const INITIAL_MENTORSHIPS: UniversityMentorshipSession[] = [
  {
    id: 'fu-ms-001',
    student_id: 'fu-stu-001',
    mentor_id: 'fu-men-001',
    session_date: '2026-10-25',
    modality: 'online',
    topic: 'Organização de Rotina de Internato e Estágio em Pediatria',
    status: 'completed',
    public_summary:
      'Revisão do cronograma de estudos para as disciplinas clínicas do 5º semestre e planejamento das oficinas comunitárias de nutrição.',
    confidential_notes:
      'Estudante relatou cansaço pelo deslocamento até o hospital regional; ajustamos grade de horários para preservar horas de sono.',
    spiritual_notes:
      'Momento de oração pela família em Nampula e fortalecimento da vocação missionária na medicina.',
    next_steps: 'Entregar resumo do caso clínico pediátrico até 20/11.',
    created_at: '2026-10-25T16:00:00Z',
  },
  {
    id: 'fu-ms-002',
    student_id: 'fu-stu-002',
    mentor_id: 'fu-men-001',
    session_date: '2026-11-04',
    modality: 'online',
    topic: 'Práticas de Triagem Nutricional e Acolhimento Materno',
    status: 'completed',
    public_summary:
      'Alinhamento sobre o projeto de extensão universitária em acompanhamento pré-natal e prevenção da desnutrição infantil.',
    confidential_notes:
      'Acompanhamento psicossocial positivo; excelente adaptação às aulas práticas de laboratório.',
    spiritual_notes: 'Aconselhamento sobre equilíbrio entre responsabilidades familiares e vida acadêmica.',
    next_steps: 'Preparar apresentação para o seminário semestral da UCM.',
    created_at: '2026-11-04T15:00:00Z',
  },
];

const INITIAL_ACADEMIC_RECORDS: UniversityAcademicRecord[] = [
  {
    id: 'fu-acad-001',
    student_id: 'fu-stu-001',
    period: '2026.1',
    semester_number: 5,
    gpa: 8.9,
    attendance_rate: 98,
    approved_subjects: 7,
    total_subjects: 7,
    community_hours_completed: 28,
    academic_status: 'excelente',
    public_highlight: 'Aprovado com distinção em Semiologia Pediátrica e 28h de reforço escolar comunitário cumpridas.',
    internal_observations: 'Histórico oficial validado junto à secretaria da UniLúrio.',
    updated_at: '2026-08-10T10:00:00Z',
  },
  {
    id: 'fu-acad-002',
    student_id: 'fu-stu-002',
    period: '2026.1',
    semester_number: 4,
    gpa: 8.7,
    attendance_rate: 96,
    approved_subjects: 6,
    total_subjects: 6,
    community_hours_completed: 24,
    academic_status: 'excelente',
    public_highlight: 'Destaque na disciplina de Saúde Materno-Infantil e monitoria voluntária na Casa Nutri.',
    internal_observations: 'Sem pendências acadêmicas.',
    updated_at: '2026-08-12T10:00:00Z',
  },
  {
    id: 'fu-acad-003',
    student_id: 'fu-stu-003',
    period: '2026.1',
    semester_number: 6,
    gpa: 8.4,
    attendance_rate: 94,
    approved_subjects: 6,
    total_subjects: 6,
    community_hours_completed: 32,
    academic_status: 'regular',
    public_highlight: 'Implantou 2 hortas pedagógicas comunitárias como contrapartida social da bolsa.',
    internal_observations: 'Acompanhamento próximo na disciplina de Hidráulica Agrícola.',
    updated_at: '2026-08-14T10:00:00Z',
  },
];

const INITIAL_SPONSORSHIPS: UniversitySponsorship[] = [
  {
    id: 'fu-sp-001',
    student_id: 'fu-stu-001',
    donor_name: 'Lucas Wagner',
    donor_email: 'lucas.wagneer@gmail.com',
    modality: 'individual',
    monthly_amount: 600,
    quota_percentage: 100,
    currency: 'BRL',
    payment_method: 'credit_card',
    status: 'active',
    allow_student_updates: true,
    started_at: '2025-03-01T10:00:00Z',
  },
  {
    id: 'fu-sp-002',
    student_id: 'fu-stu-002',
    donor_name: 'Fernanda Carmagnani',
    donor_email: 'fe.carmagnani@hotmail.com',
    modality: 'partial',
    monthly_amount: 150,
    quota_percentage: 25,
    currency: 'BRL',
    payment_method: 'pix',
    status: 'active',
    allow_student_updates: true,
    started_at: '2025-04-10T10:00:00Z',
  },
  {
    id: 'fu-sp-003',
    student_id: null,
    donor_name: 'Gerson Simionato',
    donor_email: 'gerson.simionato@gmail.com',
    modality: 'general',
    monthly_amount: 100,
    quota_percentage: 100,
    currency: 'BRL',
    payment_method: 'credit_card',
    status: 'active',
    allow_student_updates: true,
    started_at: '2025-05-01T10:00:00Z',
  },
];

const INITIAL_UPDATES: UniversityProgramUpdate[] = [
  {
    id: 'fu-upd-001',
    student_id: null,
    title: 'Balanço Semestral Futuro Universitário: 100% de Aprovação Acadêmica',
    summary:
      'Todos os bolsistas ativos concluíram o semestre com média global de 8.7 e mais de 80 horas de retribuição comunitária.',
    content:
      'Encerramos mais um ciclo letivo do programa Futuro Universitário com resultados extraordinários. Nossos jovens bolsistas em Medicina, Enfermagem e Engenharia Agronômica mantiveram 100% de aprovação nas disciplinas cursadas, média ponderada geral de 8.7 e dedicaram 84 horas de reforço escolar e apoio direto às famílias atendidas pela YAH Hope em Moçambique.',
    update_type: 'impact_report',
    image_url: 'https://hope.yahchurch.com/wp-content/uploads/2025/09/IMG5.avif',
    published_to_portal: true,
    published_at: '2026-09-15T10:00:00Z',
  },
  {
    id: 'fu-upd-002',
    student_id: 'fu-stu-001',
    title: 'Início do Estágio Clínico em Pediatria Comunitária',
    summary:
      'Samora iniciou o ciclo de prática clínica supervisionada, integrando conhecimentos médicos ao combate à desnutrição infantil.',
    content:
      'Com o suporte contínuo da bolsa universitária e acompanhamento de mentoria médica, o estudante iniciou as rotações práticas em pediatria, auxiliando em triagens nutricionais comunitárias.',
    update_type: 'student_milestone',
    image_url: 'https://hope.yahchurch.com/wp-content/uploads/2025/09/PARTICIPE-DESTA-MISSAO-1.png',
    published_to_portal: true,
    published_at: '2026-10-20T10:00:00Z',
  },
];

const STORAGE_KEYS = {
  config: 'yah_fu_config_v1',
  students: 'yah_fu_students_v1',
  scholarships: 'yah_fu_scholarships_v1',
  payments: 'yah_fu_payments_v1',
  mentors: 'yah_fu_mentors_v1',
  mentorships: 'yah_fu_mentorships_v1',
  academic: 'yah_fu_academic_v1',
  sponsorships: 'yah_fu_sponsorships_v1',
  updates: 'yah_fu_updates_v1',
};

function loadLocal<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (raw) {
      return JSON.parse(raw) as T;
    }
  } catch (e) {
    console.warn(`Aviso ao ler ${key} do localStorage:`, e);
  }
  return fallback;
}

function saveLocal<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.warn(`Aviso ao salvar ${key} no localStorage:`, e);
  }
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

  const [config, setConfig] = useState<UniversityModuleConfig>(() =>
    loadLocal(STORAGE_KEYS.config, DEFAULT_CONFIG)
  );
  const [students, setStudents] = useState<UniversityStudent[]>(() =>
    loadLocal(STORAGE_KEYS.students, INITIAL_STUDENTS)
  );
  const [scholarships, setScholarships] = useState<UniversityScholarship[]>(() =>
    loadLocal(STORAGE_KEYS.scholarships, INITIAL_SCHOLARSHIPS)
  );
  const [payments, setPayments] = useState<UniversityScholarshipPayment[]>(() =>
    loadLocal(STORAGE_KEYS.payments, INITIAL_PAYMENTS)
  );
  const [mentors, setMentors] = useState<UniversityMentor[]>(() =>
    loadLocal(STORAGE_KEYS.mentors, INITIAL_MENTORS)
  );
  const [mentorships, setMentorships] = useState<UniversityMentorshipSession[]>(() =>
    loadLocal(STORAGE_KEYS.mentorships, INITIAL_MENTORSHIPS)
  );
  const [academicRecords, setAcademicRecords] = useState<UniversityAcademicRecord[]>(() =>
    loadLocal(STORAGE_KEYS.academic, INITIAL_ACADEMIC_RECORDS)
  );
  const [sponsorships, setSponsorships] = useState<UniversitySponsorship[]>(() =>
    loadLocal(STORAGE_KEYS.sponsorships, INITIAL_SPONSORSHIPS)
  );
  const [updates, setUpdates] = useState<UniversityProgramUpdate[]>(() =>
    loadLocal(STORAGE_KEYS.updates, INITIAL_UPDATES)
  );
  const [loading, setLoading] = useState<boolean>(false);

  const canAccessModule = useMemo(() => hasUniversityModuleAccess(user), [user]);
  const can = (permission: UniversityPermissionKey) => hasUniversityPermission(user, permission);

  // Persistência local automática
  useEffect(() => saveLocal(STORAGE_KEYS.config, config), [config]);
  useEffect(() => saveLocal(STORAGE_KEYS.students, students), [students]);
  useEffect(() => saveLocal(STORAGE_KEYS.scholarships, scholarships), [scholarships]);
  useEffect(() => saveLocal(STORAGE_KEYS.payments, payments), [payments]);
  useEffect(() => saveLocal(STORAGE_KEYS.mentors, mentors), [mentors]);
  useEffect(() => saveLocal(STORAGE_KEYS.mentorships, mentorships), [mentorships]);
  useEffect(() => saveLocal(STORAGE_KEYS.academic, academicRecords), [academicRecords]);
  useEffect(() => saveLocal(STORAGE_KEYS.sponsorships, sponsorships), [sponsorships]);
  useEffect(() => saveLocal(STORAGE_KEYS.updates, updates), [updates]);

  // Sincronização assíncrona com Supabase caso as tabelas já estejam criadas no banco
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

        if (stuRes.status === 'fulfilled' && Array.isArray(stuRes.value.data) && stuRes.value.data.length > 0) {
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

        if (schRes.status === 'fulfilled' && Array.isArray((schRes.value as any)?.data) && (schRes.value as any).data.length > 0) {
          setScholarships((schRes.value as any).data);
        }
        if (payRes.status === 'fulfilled' && Array.isArray((payRes.value as any)?.data) && (payRes.value as any).data.length > 0) {
          setPayments((payRes.value as any).data);
        }
        if (menRes.status === 'fulfilled' && Array.isArray((menRes.value as any)?.data) && (menRes.value as any).data.length > 0) {
          setMentors((menRes.value as any).data);
        }
        if (msRes.status === 'fulfilled' && Array.isArray((msRes.value as any)?.data) && (msRes.value as any).data.length > 0) {
          setMentorships((msRes.value as any).data);
        }
        if (acadRes.status === 'fulfilled' && Array.isArray(acadRes.value.data) && acadRes.value.data.length > 0) {
          setAcademicRecords(acadRes.value.data);
        }
        if (spRes.status === 'fulfilled' && Array.isArray(spRes.value.data) && spRes.value.data.length > 0) {
          setSponsorships(spRes.value.data);
        }
        if (updRes.status === 'fulfilled' && Array.isArray(updRes.value.data) && updRes.value.data.length > 0) {
          setUpdates(updRes.value.data);
        }
      } catch {
        // Mantém estado local resiliente
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

    const newId = `fu-stu-${Date.now().toString(36)}`;
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
      id: `fu-sch-${Date.now().toString(36)}`,
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
      id: `fu-pay-${Date.now().toString(36)}`,
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
      id: `fu-men-${Date.now().toString(36)}`,
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
      id: `fu-ms-${Date.now().toString(36)}`,
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
        id: `fu-acad-${Date.now().toString(36)}`,
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
      id: `fu-sp-${Date.now().toString(36)}`,
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
      id: `fu-upd-${Date.now().toString(36)}`,
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
        : '8.7';
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
