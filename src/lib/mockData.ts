export type NutritionalStatus = 'Adequado' | 'DAM' | 'DAG' | 'Risco';

export interface Patient {
  id: string;
  registration_number: string;
  name: string;
  dob: string;
  gender: 'M' | 'F';
  status: NutritionalStatus;
  community: string;
  created_at: string;
  guardian_name: string;
  housing_type: string;
  sanitation: string;
}

export interface Prescription {
  medication: string;
  treatment: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'Admin' | 'Médico' | 'Enfermeiro' | 'ACS';
  status: 'Ativo' | 'Inativo';
}

export interface InventoryCategory {
  id: string;
  name: string;
  description?: string;
}

export interface InventoryItem {
  id: string;
  name: string;
  category: string;
  quantity: number;
  unit: string;
  min_quantity: number;
  expiration_date?: string;
  purchase_price?: number;
}

export interface KitItem {
  item_id: string;
  quantity: number;
}

export interface Kit {
  id: string;
  name: string;
  description?: string;
  items: KitItem[];
}

export interface ClinicalEvent {
  id: string;
  patient_id: string;
  event_type: 'initial' | 'return' | 'acs_visit' | 'referral' | 'acompanhamento';
  date: string;
  notes: string;
  weight?: number;
  height?: number;
  muac?: number; // Perímetro braquial
  head_circumference?: number; // Perímetro craniano
  bmi?: number;
  z_score_weight_height?: number;
  nutritional_status?: string;
  prescriptions?: Prescription[];
  professional: string;
  return_date?: string;
  kit_delivered?: string;
}

export interface HomeVisit {
  id: string;
  patient_id: string;
  acs_id: string;
  date: string;
  status: 'pending' | 'completed';
  checklist: {
    house_cleanliness: number; // 1-5 or boolean? Let's use 1-5 for more detail
    vitamins_followed: boolean;
    medical_recommendations_followed: boolean;
  };
  observations: string;
  next_visit_date?: string;
}

export type TransactionType = 'income' | 'expense';

export interface TransactionCategory {
  id: string;
  name: string;
  type: TransactionType;
  color: string;
}

export interface Transaction {
  id: string;
  description: string;
  amount: number;
  type: TransactionType;
  category_id: string;
  date: string;
  status: 'pending' | 'completed';
  account: string;
  expense_type?: 'fixed' | 'variable';
  recurrence?: 'monthly' | 'yearly' | 'none';
}

export type ProjectStatus = 'planning' | 'active' | 'completed' | 'on-hold';

export interface SubTask {
  id: string;
  title: string;
  completed: boolean;
  invitees: string[]; // User IDs
}

export type TaskStatus = 'todo' | 'in-progress' | 'review' | 'done';

export type Priority = 'low' | 'medium' | 'high';

export interface ProjectTask {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  cost: number;
  subtasks: SubTask[];
  invitees: string[]; // User IDs
  priority: Priority;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  status: ProjectStatus;
  progress: number;
  start_date: string;
  end_date: string;
  budget: number;
  tasks: ProjectTask[];
  notes?: string;
  isPrivate: boolean;
  invitees: string[]; // User IDs
  category: string;
  priority: Priority;
}

export type TeamMemberRole = 'admin' | 'coordinator' | 'volunteer' | 'doctor' | 'nurse' | 'social_worker' | 'acs';
export type TeamMemberStatus = 'active' | 'inactive' | 'on_leave';

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: TeamMemberRole;
  status: TeamMemberStatus;
  join_date: string;
  department?: string;
  category_id?: string;
  permissions?: string[];
}

export interface UserCategory {
  id: string;
  name: string;
  description?: string;
  color: string;
}

export type EventType = 'medical' | 'administrative' | 'event' | 'meeting';

export interface CalendarEvent {
  id: string;
  title: string;
  description: string;
  type: EventType;
  date: string;
  time: string;
  location: string;
}

export const mockPatients: Patient[] = [
  {
    id: '1',
    registration_number: 'MZ-001',
    name: 'João Silva',
    dob: '2023-05-10',
    gender: 'M',
    status: 'DAM',
    community: 'Bairro Central',
    created_at: '2024-01-15',
    guardian_name: 'Maria Silva',
    housing_type: 'Própria',
    sanitation: 'Fossa Séptica',
  },
  {
    id: '2',
    registration_number: 'MZ-002',
    name: 'Ana Costa',
    dob: '2024-02-20',
    gender: 'F',
    status: 'DAG',
    community: 'Bairro Norte',
    created_at: '2024-03-10',
    guardian_name: 'José Costa',
    housing_type: 'Cedida',
    sanitation: 'Céu Aberto',
  },
  {
    id: '3',
    registration_number: 'MZ-003',
    name: 'Pedro Santos',
    dob: '2022-11-05',
    gender: 'M',
    status: 'Adequado',
    community: 'Bairro Sul',
    created_at: '2023-12-01',
    guardian_name: 'Luisa Santos',
    housing_type: 'Alugada',
    sanitation: 'Rede Pública',
  },
];

export const mockEvents: ClinicalEvent[] = [
  {
    id: 'e1',
    patient_id: '1',
    event_type: 'initial',
    date: '2024-01-15',
    notes: 'Criança apresenta baixo peso. Iniciado suplemento.',
    weight: 6.5,
    height: 68,
    muac: 11.5,
    head_circumference: 43,
    bmi: 14.05,
    z_score_weight_height: -2.1,
    nutritional_status: 'DAM',
    prescriptions: [
      { medication: 'Plumpy\'Nut', treatment: '1 sachê por dia durante 15 dias' }
    ],
    professional: 'Dra. Helena',
  },
  {
    id: 'e2',
    patient_id: '1',
    event_type: 'acs_visit',
    date: '2024-02-01',
    notes: 'Entrega de suplemento. Mãe relata melhora no apetite.',
    weight: 6.8,
    muac: 11.8,
    professional: 'ACS Carlos',
  },
  {
    id: 'e3',
    patient_id: '1',
    event_type: 'acompanhamento',
    date: '2024-02-15',
    notes: 'Evolução positiva, mas ainda em DAM. Manter conduta.',
    weight: 7.2,
    height: 69,
    muac: 12.0,
    head_circumference: 43.5,
    bmi: 15.12,
    z_score_weight_height: -1.8,
    nutritional_status: 'DAM',
    prescriptions: [
      { medication: 'Plumpy\'Nut', treatment: 'Manter 1 sachê por dia por mais 15 dias' },
      { medication: 'Vitamina A', treatment: 'Dose única' }
    ],
    professional: 'Dra. Helena',
    return_date: '2024-03-01',
  },
  {
    id: 'e4',
    patient_id: '2',
    event_type: 'initial',
    date: '2024-03-10',
    notes: 'Desnutrição aguda grave identificada.',
    weight: 3.1,
    height: 52,
    head_circumference: 36,
    bmi: 11.46,
    z_score_weight_height: -3.5,
    nutritional_status: 'DAG',
    prescriptions: [
      { medication: 'F-75', treatment: 'Internação para estabilização' }
    ],
    professional: 'Dra. Helena',
  }
];

export const mockKits: Kit[] = [
  {
    id: '1',
    name: 'Kit Triagem Inicial',
    description: 'Kit padrão entregue na primeira consulta de desnutrição',
    items: [
      { item_id: '1', quantity: 15 }, // Plumpy'Nut
      { item_id: '3', quantity: 1 }   // Vitamina A
    ]
  }
];

export const mockUsers: User[] = [
  { id: '1', name: 'Dra. Helena', email: 'helena@yahope.org', role: 'Médico', status: 'Ativo' },
  { id: '2', name: 'Carlos Silva', email: 'carlos@yahope.org', role: 'ACS', status: 'Ativo' },
  { id: '3', name: 'Admin YAHope', email: 'admin@yahope.org', role: 'Admin', status: 'Ativo' },
];

export const mockInventoryCategories: InventoryCategory[] = [
  { id: '1', name: 'Medicamento', description: 'Remédios e fármacos em geral' },
  { id: '2', name: 'Suplemento', description: 'Fórmulas nutricionais e vitaminas' },
  { id: '3', name: 'Material', description: 'Materiais de uso médico e curativos' },
];

export const mockInventory: InventoryItem[] = [
  { id: '1', name: 'Plumpy\'Nut', category: 'Suplemento', quantity: 150, unit: 'sachês', min_quantity: 50, expiration_date: '2025-06-01', purchase_price: 12.50 },
  { id: '2', name: 'F-75', category: 'Suplemento', quantity: 20, unit: 'latas', min_quantity: 30, expiration_date: '2024-12-01', purchase_price: 45.00 },
  { id: '3', name: 'Vitamina A', category: 'Medicamento', quantity: 500, unit: 'cápsulas', min_quantity: 100, expiration_date: '2026-01-01', purchase_price: 0.50 },
  { id: '4', name: 'Amoxicilina 250mg', category: 'Medicamento', quantity: 45, unit: 'frascos', min_quantity: 50, expiration_date: '2025-03-15', purchase_price: 15.00 },
];

export const mockTransactionCategories: TransactionCategory[] = [
  { id: '1', name: 'Doações', type: 'income', color: 'bg-green-500' },
  { id: '2', name: 'Patrocínios', type: 'income', color: 'bg-emerald-500' },
  { id: '3', name: 'Salários', type: 'expense', color: 'bg-red-500' },
  { id: '4', name: 'Equipamentos', type: 'expense', color: 'bg-orange-500' },
  { id: '5', name: 'Alimentação', type: 'expense', color: 'bg-amber-500' },
  { id: '6', name: 'Manutenção', type: 'expense', color: 'bg-rose-500' },
];

export const mockTransactions: Transaction[] = [
  { id: '1', description: 'Doação Mensal - João Silva', amount: 500, type: 'income', category_id: '1', date: new Date().toISOString().split('T')[0], status: 'completed', account: 'Conta Principal' },
  { id: '2', description: 'Compra de PlumpyNut', amount: 1250, type: 'expense', category_id: '5', date: new Date(Date.now() - 86400000 * 2).toISOString().split('T')[0], status: 'completed', account: 'Conta Principal', expense_type: 'variable' },
  { id: '3', description: 'Manutenção Veículo', amount: 350, type: 'expense', category_id: '6', date: new Date(Date.now() - 86400000 * 5).toISOString().split('T')[0], status: 'pending', account: 'Conta Secundária', expense_type: 'variable' },
  { id: '4', description: 'Patrocínio Empresa XYZ', amount: 5000, type: 'income', category_id: '2', date: new Date(Date.now() - 86400000 * 8).toISOString().split('T')[0], status: 'completed', account: 'Conta Principal' },
  { id: '5', description: 'Salários Equipe', amount: 3200, type: 'expense', category_id: '3', date: new Date(Date.now() - 86400000 * 10).toISOString().split('T')[0], status: 'completed', account: 'Conta Principal', expense_type: 'fixed', recurrence: 'monthly' },
  { id: '6', description: 'Aluguel Sede', amount: 1500, type: 'expense', category_id: '6', date: new Date(Date.now() - 86400000 * 15).toISOString().split('T')[0], status: 'completed', account: 'Conta Principal', expense_type: 'fixed', recurrence: 'monthly' },
  { id: '7', description: 'Conta de Energia', amount: 280, type: 'expense', category_id: '6', date: new Date(Date.now() - 86400000 * 12).toISOString().split('T')[0], status: 'completed', account: 'Conta Principal', expense_type: 'variable' },
];

export const mockProjects: Project[] = [
  {
    id: '1',
    name: 'Construção do Anexo Médico',
    description: 'Expansão da clinica atual para comportar mais 3 salas de atendimento.',
    status: 'active',
    progress: 45,
    start_date: '2024-01-10',
    end_date: '2024-12-20',
    budget: 150000,
    isPrivate: false,
    invitees: ['1', '2'],
    notes: 'Priorizar a sala de triagem para entrega antecipada.',
    category: 'Infraestrutura',
    priority: 'high',
    tasks: [
      {
        id: 't1',
        title: 'Fundação e Alvenaria',
        description: 'Construção da base e levantamento de paredes.',
        status: 'done',
        cost: 45000,
        priority: 'high',
        invitees: ['1'],
        subtasks: [
          { id: 's1', title: 'Escavação', completed: true, invitees: [] },
          { id: 's2', title: 'Concretagem', completed: true, invitees: [] }
        ]
      },
      {
        id: 't2',
        title: 'Instalação Elétrica',
        description: 'Passagem de cabos e instalação de quadros.',
        status: 'in-progress',
        cost: 15000,
        priority: 'medium',
        invitees: ['2'],
        subtasks: [
          { id: 's3', title: 'Passar conduítes', completed: true, invitees: [] },
          { id: 's4', title: 'Instalar tomadas', completed: false, invitees: [] }
        ]
      }
    ]
  },
  {
    id: '2',
    name: 'Campanha de Vacinação Infantil',
    description: 'Campanha massiva pelas comunidades da região para vacinação.',
    status: 'planning',
    progress: 10,
    start_date: '2024-05-01',
    end_date: '2024-07-30',
    budget: 35000,
    isPrivate: true,
    invitees: ['1'],
    category: 'Saúde Pública',
    priority: 'high',
    tasks: []
  },
  {
    id: '3',
    name: 'Reforma do Refeitório',
    description: 'Melhorias nas condições estruturais do refeitório principal.',
    status: 'completed',
    progress: 100,
    start_date: '2023-08-15',
    end_date: '2023-11-20',
    budget: 50000,
    isPrivate: false,
    invitees: [],
    category: 'Manutenção',
    priority: 'medium',
    tasks: [
      {
        id: 't3',
        title: 'Pintura e Acabamento',
        description: 'Pintura geral e troca de azulejos.',
        status: 'done',
        cost: 8500,
        priority: 'low',
        invitees: [],
        subtasks: []
      }
    ]
  },
  {
    id: '4',
    name: 'Implementação de Energia Solar',
    description: 'Instalação de painéis solares para reduzir custo de energia.',
    status: 'on-hold',
    progress: 30,
    start_date: '2023-05-01',
    end_date: '2023-12-31',
    budget: 200000,
    isPrivate: false,
    invitees: [],
    category: 'Sustentabilidade',
    priority: 'medium',
    tasks: []
  }
];

export const mockTeamMembers: TeamMember[] = [
  {
    id: '1',
    name: 'Ana Silva',
    email: 'ana.silva@yahope.org',
    phone: '+55 11 99999-1111',
    role: 'coordinator',
    status: 'active',
    join_date: '2022-01-15',
    department: 'Coordenação Geral'
  },
  {
    id: '2',
    name: 'Dr. Carlos Mendes',
    email: 'carlos.mendes@yahope.org',
    phone: '+55 11 99999-2222',
    role: 'doctor',
    status: 'active',
    join_date: '2022-03-10',
    department: 'Atendimento Clínico'
  },
  {
    id: '3',
    name: 'Mariana Souza',
    email: 'mariana.souza@yahope.org',
    phone: '+55 11 99999-3333',
    role: 'nurse',
    status: 'on_leave',
    join_date: '2023-05-20',
    department: 'Atendimento Clínico'
  },
  {
    id: '4',
    name: 'Roberto Alves',
    email: 'roberto.alves@yahope.org',
    phone: '+55 11 99999-4444',
    role: 'social_worker',
    status: 'active',
    join_date: '2023-01-10',
    department: 'Serviço Social'
  },
  {
    id: '5',
    name: 'Juliana Costa',
    email: 'juliana.costa@yahope.org',
    phone: '+55 11 99999-5555',
    role: 'volunteer',
    status: 'inactive',
    join_date: '2024-02-01',
    department: 'Apoio Logístico'
  }
];

export const mockUserCategories: UserCategory[] = [
  { id: '1', name: 'Gestão', description: 'Diretoria e coordenação', color: 'bg-blue-500' },
  { id: '2', name: 'Saúde', description: 'Médicos e enfermeiros', color: 'bg-emerald-500' },
  { id: '3', name: 'Social', description: 'Assistentes sociais e psicólogos', color: 'bg-purple-500' },
  { id: '4', name: 'ACS', description: 'Agentes Comunitários de Saúde', color: 'bg-rose-500' },
  { id: '5', name: 'Voluntário', description: 'Apoio geral não assalariado', color: 'bg-amber-500' },
];

export const mockCalendarEvents: CalendarEvent[] = [
  {
    id: '1',
    title: 'Reunião de Alinhamento Semanal',
    description: 'Reunião com toda a equipe para discutir metas da semana.',
    type: 'meeting',
    date: new Date().toISOString().split('T')[0],
    time: '09:00',
    location: 'Sala de Reuniões 1 / Google Meet',
  },
  {
    id: '2',
    title: 'Mutirão de Saúde Infantil',
    description: 'Atendimentos pediátricos e medição de peso na comunidade vizinha.',
    type: 'medical',
    date: new Date().toISOString().split('T')[0],
    time: '13:30',
    location: 'Comunidade Paraisópolis',
  },
  {
    id: '3',
    title: 'Campanha de Arrecadação de Alimentos',
    description: 'Evento para envolver parceiros na arrecadação mensal.',
    type: 'event',
    date: new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0], // Hoje + 3 dias
    time: '10:00',
    location: 'Sede YAHope',
  },
  {
    id: '4',
    title: 'Entrega de Relatório Fiscal Mensal',
    description: 'Fechamento contábil referente ao mês anterior.',
    type: 'administrative',
    date: new Date(Date.now() + 86400000 * 5).toISOString().split('T')[0], // Hoje + 5 dias
    time: '16:00',
    location: 'Escritório',
  }
];

export const mockHomeVisits: HomeVisit[] = [
  {
    id: 'v1',
    patient_id: '1',
    acs_id: '2',
    date: new Date().toISOString().split('T')[0],
    status: 'pending',
    checklist: {
      house_cleanliness: 0,
      vitamins_followed: false,
      medical_recommendations_followed: false
    },
    observations: ''
  },
  {
    id: 'v2',
    patient_id: '2',
    acs_id: '2',
    date: new Date(Date.now() - 86400000 * 2).toISOString().split('T')[0],
    status: 'completed',
    checklist: {
      house_cleanliness: 4,
      vitamins_followed: true,
      medical_recommendations_followed: true
    },
    observations: 'Família muito solicita. Criança está aceitando bem o suplemento.'
  }
];
