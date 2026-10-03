export type NutritionalStatus = 'Adequado' | 'DAM' | 'DAG' | 'Risco' | 'Alta' | 'Internada' | 'Internado' | 'Encaminhada' | 'Encaminhado';

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
  item_id?: string;
  medication: string;
  treatment: string;
  duration_days?: number;
  quantity?: number;
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
  currency?: 'MZN' | 'BRL';
  internal_use?: boolean;
}

export interface KitItem {
  item_id: string;
  quantity: number;
  dosage?: string;
}

export interface Kit {
  id: string;
  name: string;
  description?: string;
  items: KitItem[];
}

export interface InventoryTransaction {
  id: string;
  item_id: string;
  type: 'in' | 'out';
  quantity: number;
  date: string;
  reason?: string;
  price?: number;
  patient_id?: string;
}

export interface ClinicalEvent {
  id: string;
  patient_id: string;
  event_type: 'initial' | 'return' | 'acs_visit' | 'referral' | 'acompanhamento' | 'observation';
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
  kit_delivered?: string[];
  hospital_referral?: boolean;
  is_discharge?: boolean;
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
  last_clinical_date?: string;
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
  recurrence?: 'monthly' | 'bimonthly' | 'quarterly' | 'semiannual' | 'yearly' | 'none';
}

export type ColumnType = 'text' | 'number' | 'date' | 'status' | 'people' | 'file' | 'link' | 'phone' | 'location' | 'dropdown' | 'timeline' | 'notes' | 'value';
export type ProjectStatus = 'active' | 'completed' | 'planning' | 'on-hold';

export interface ColumnDefinition {
  id: string;
  name: string;
  type: ColumnType;
  options?: string[]; // For dropdown/status
  width?: number;
}

export type TaskStatus = 'todo' | 'in-progress' | 'review' | 'done';
export type Priority = 'low' | 'medium' | 'high';

export interface SubTask {
  id: string;
  title: string;
  completed: boolean;
  invitees: string[]; // User IDs
}

export interface ProjectTask {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  cost: number;
  subtasks: SubTask[];
  invitees: string[]; // User IDs
  priority: Priority;
  values?: Record<string, any>; // For dynamic boards
}

export interface PersonalActivity {
  id: string;
  title: string;
  description: string;
  date: string;
  startTime?: string;
  endTime?: string;
  isAllDay: boolean;
  visibleTo: string[]; // User IDs
  authorId: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  status: 'active' | 'completed' | 'planning' | 'on-hold';
  progress: number;
  start_date: string;
  end_date: string;
  budget: number;
  isPrivate: boolean;
  category: string;
  priority: 'low' | 'medium' | 'high';
  invitees: string[];
  columns?: ColumnDefinition[]; // For dynamic boards
  tasks: ProjectTask[];
  notes?: string;
  enablePortalUpdates?: boolean;
  created_by?: string;
  created_by_name?: string;
  module?: 'communication' | 'admin' | 'workspace';
}

export const mockUserCategories = [];

export const mockInventoryCategories: InventoryCategory[] = [];

export const mockTransactionCategories: TransactionCategory[] = [];

export type TeamMemberRole = 'admin' | 'coordinator' | 'volunteer' | 'doctor' | 'nurse' | 'social_worker' | 'acs' | 'observer';
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

export const mockPatients: Patient[] = [];

export const mockEvents: ClinicalEvent[] = [];

export const mockKits: Kit[] = [];

export const mockUsers: User[] = [];

export const mockInventory: InventoryItem[] = [];

export const mockTransactions: Transaction[] = [];

export const mockProjects: Project[] = [];

export const mockTeamMembers: TeamMember[] = [];

export const mockCalendarEvents: CalendarEvent[] = [];

export const mockHomeVisits: HomeVisit[] = [];

export interface YAHHopeProject {
  id: string;
  title: string;
  description: string;
  full_description?: string;
  category?: string;
  tag_color?: string;
  link?: string;
  order?: number;
  status: 'active' | 'planned' | 'completed';
  image_url: string;
  location?: string;
  coordinator?: string;
  beneficiaries_target?: string;
  beneficiaries_reached?: string;
  gallery_images?: string[];
  admin_notes?: string;
  start_date?: string;
  created_at: string;
}

export const mockYAHHopeProjects: YAHHopeProject[] = [
  {
    id: 'proj-1',
    title: 'Casa Nutri & Saúde Infantil',
    description: 'Acompanhamento terapêutico e nutricional para 9 crianças recuperarem peso e saúde.',
    full_description: '<p>A <strong>Casa Nutri</strong> é uma unidade de cuidado intensivo e amor criada pela YAH Hope para resgatar crianças em estado grave de desnutrição e vulnerabilidade biológica e social.</p><p>Nossa equipe multidisciplinar — formada por nutricionistas, médicos e assistentes sociais voluntários — desenvolve planos alimentares terapêuticos de alto teor calórico e proteico, complementados com vitaminas essenciais, água tratada e acompanhamento médico contínuo.</p><h3>Pilares da Atuação</h3><ul><li><strong>Recuperação Ponderal Acelerada:</strong> Dieta balanceada com fórmulas infantis ricas em micronutrientes.</li><li><strong>Monitoramento Clínico Semanal:</strong> Aferição de peso, altura, perímetro braquial e exames laboratoriais.</li><li><strong>Educação e Autonomia Familiar:</strong> Oficinas para mães e responsáveis sobre higiene, preparo de alimentos e segurança alimentar no lar.</li></ul><p>Cada vida restaurada representa uma geração que ganha de volta o direito de sonhar, brincar e construir um futuro com dignidade.</p>',
    category: 'Nutrição & Saúde',
    tag_color: '#92BF78',
    status: 'active',
    location: 'Moçambique & Regiões Vulneráveis',
    coordinator: 'Dra. Sarah M. (Nutrição Clínica)',
    beneficiaries_target: '15 crianças',
    beneficiaries_reached: '9 crianças em tratamento ativo',
    gallery_images: [
      'https://hope.yahchurch.com/wp-content/uploads/2025/09/HOPE-ALFACES.avif',
      'https://hope.yahchurch.com/wp-content/uploads/2025/09/Foto-e1758835419873-827x1024.png',
      '/login_bg_real.jpg'
    ],
    admin_notes: 'Fórmula terapêutica F-75 e F-100 encomendada para o próximo trimestre. Contato do fornecedor local de suplementação: Dr. Amílcar (Maputo). Próxima pesagem geral agendada para quarta-feira.',
    image_url: 'https://hope.yahchurch.com/wp-content/uploads/2025/09/HOPE-ALFACES.avif',
    link: '/campanha',
    order: 1,
    created_at: '2025-01-01'
  },
  {
    id: 'proj-2',
    title: 'Mentoria & Bolsas Universitárias',
    description: 'Garantindo que 5 jovens capacitados concluam a faculdade e construam novos horizontes.',
    full_description: '<p>O projeto de <strong>Bolsas Universitárias e Mentoria</strong> da YAH Hope quebra o ciclo da pobreza através da educação superior de excelência. Jovens de comunidades vulneráveis que demonstraram dedicação extraordinária nos estudos recebem cobertura de mensalidades, material didático e mentoria profissional com líderes experientes.</p><h3>Como Funciona o Programa</h3><ul><li><strong>Custos Universitários Integrais:</strong> Matrículas, livros técnicos e transporte garantidos até a formatura.</li><li><strong>Mentoria Vocacional Mensal:</strong> Acompanhamento 1 a 1 para desenvolvimento de liderança, ética e carreira.</li><li><strong>Retorno à Comunidade:</strong> Cada bolsista dedica horas semanais de reforço escolar gratuito a crianças mais jovens.</li></ul>',
    category: 'Educação Superior',
    tag_color: '#88A1F2',
    status: 'active',
    location: 'Moçambique',
    coordinator: 'Prof. Marcos Silva',
    beneficiaries_target: '10 estudantes',
    beneficiaries_reached: '5 estudantes bolsistas',
    gallery_images: [
      'https://hope.yahchurch.com/wp-content/uploads/2025/09/IMG5.avif',
      'https://hope.yahchurch.com/wp-content/uploads/2025/09/PARTICIPE-DESTA-MISSAO-1.png'
    ],
    admin_notes: 'Relatório semestral de notas recebido: média ponderada geral 8.7. Contrato de parceria com a Universidade São Tomás renovado até dez/2026.',
    image_url: 'https://hope.yahchurch.com/wp-content/uploads/2025/09/IMG5.avif',
    link: '/campanha',
    order: 2,
    created_at: '2025-01-02'
  },
  {
    id: 'proj-3',
    title: 'Oficinas de Costura & Hortas',
    description: 'Autonomia financeira e geração de renda para mães e famílias que antes não tinham perspectivas.',
    full_description: '<p>A transformação sustentável acontece quando capacitamos as mães a sustentarem seus lares. O projeto <strong>Oficinas de Costura & Hortas Comunitárias</strong> ensina ofícios práticos, empreendedorismo e agricultura familiar sustentável.</p><h3>Impacto Direto</h3><ul><li><strong>Costura e Modelagem:</strong> Produção de uniformes e peças comercializáveis localmente.</li><li><strong>Hortas Orgânicas:</strong> Cultivo de hortaliças frescas para consumo familiar e venda de excedentes no mercado regional.</li><li><strong>Microgestão Financeira:</strong> Princípios básicos de finanças, cooperativismo e poupança comunitária.</li></ul>',
    category: 'Capacitação & Renda',
    tag_color: '#EBC878',
    status: 'active',
    location: 'Comunidades Periféricas',
    coordinator: 'Helena Santos',
    beneficiaries_target: '40 famílias',
    beneficiaries_reached: '28 mães capacitadas',
    gallery_images: [
      'https://hope.yahchurch.com/wp-content/uploads/2025/09/Foto-e1758835419873-827x1024.png',
      'https://hope.yahchurch.com/wp-content/uploads/2025/09/HOPE-ALFACES.avif'
    ],
    admin_notes: 'Novas 4 máquinas de costura industriais doadas e instaladas. Colheita de alfaces e couves atingiu 180kg este mês.',
    image_url: 'https://hope.yahchurch.com/wp-content/uploads/2025/09/Foto-e1758835419873-827x1024.png',
    link: '/campanha',
    order: 3,
    created_at: '2025-01-03'
  },
  {
    id: 'proj-4',
    title: 'Resposta Humanitária & Fé',
    description: 'Kits de higiene, apoio emergencial e suporte pastoral para resgatar dignidade humana.',
    full_description: '<p>Em momentos de crise climática, escassez severa ou emergências humanitárias, a YAH Hope mobiliza voluntários e recursos para fornecer socorro ágil com compaixão e amor cristão em ação.</p><h3>Ações Emergenciais</h3><ul><li><strong>Kits de Higiene e Primeiros Socorros:</strong> Itens sanitários essenciais e purificadores de água potável.</li><li><strong>Cestas Básicas Nutritivas:</strong> Alimentos não-perecíveis e de preparo seguro para famílias desabrigadas.</li><li><strong>Acolhimento Pastoral e Psicossocial:</strong> Escuta ativa, oração e suporte emocional para quem perdeu tudo.</li></ul>',
    category: 'Ação Emergencial',
    tag_color: '#F49853',
    status: 'active',
    location: 'Zonas de Emergência e Calamidade',
    coordinator: 'Pastor Daniel & Equipe Voluntária',
    beneficiaries_target: '500 kits distribuídos',
    beneficiaries_reached: '320 famílias atendidas',
    gallery_images: [
      'https://hope.yahchurch.com/wp-content/uploads/2025/09/PARTICIPE-DESTA-MISSAO-1.png'
    ],
    admin_notes: 'Estoque do galpão central com 150 kits prontos para despacho emergencial imediato.',
    image_url: 'https://hope.yahchurch.com/wp-content/uploads/2025/09/PARTICIPE-DESTA-MISSAO-1.png',
    link: '/campanha',
    order: 4,
    created_at: '2025-01-04'
  }
];
