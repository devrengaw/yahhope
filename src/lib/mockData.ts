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

export const mockPatients: Patient[] = [];

export const mockEvents: ClinicalEvent[] = [];

export const mockKits: Kit[] = [];

export const mockUsers: User[] = [];

export const mockInventoryCategories: InventoryCategory[] = [
  { id: '1', name: 'Medicamento', description: 'Remédios e fármacos em geral' },
  { id: '2', name: 'Suplemento', description: 'Fórmulas nutricionais e vitaminas' },
  { id: '3', name: 'Material', description: 'Materiais de uso médico e curativos' },
];

export const mockInventory: InventoryItem[] = [];

export const mockTransactionCategories: TransactionCategory[] = [
  { id: '1', name: 'Doações', type: 'income', color: 'bg-green-500' },
  { id: '2', name: 'Patrocínios', type: 'income', color: 'bg-emerald-500' },
  { id: '3', name: 'Salários', type: 'expense', color: 'bg-red-500' },
  { id: '4', name: 'Equipamentos', type: 'expense', color: 'bg-orange-500' },
  { id: '5', name: 'Alimentação', type: 'expense', color: 'bg-amber-500' },
  { id: '6', name: 'Manutenção', type: 'expense', color: 'bg-rose-500' },
];

export const mockTransactions: Transaction[] = [];

export const mockProjects: Project[] = [];

export const mockTeamMembers: TeamMember[] = [];

export const mockUserCategories: UserCategory[] = [
  { id: '1', name: 'Gestão', description: 'Diretoria e coordenação', color: 'bg-blue-500' },
  { id: '2', name: 'Saúde', description: 'Médicos e enfermeiros', color: 'bg-emerald-500' },
  { id: '3', name: 'Social', description: 'Assistentes sociais e psicólogos', color: 'bg-purple-500' },
  { id: '4', name: 'ACS', description: 'Agentes Comunitários de Saúde', color: 'bg-rose-500' },
  { id: '5', name: 'Voluntário', description: 'Apoio geral não assalariado', color: 'bg-amber-500' },
];

export const mockCalendarEvents: CalendarEvent[] = [];

export const mockHomeVisits: HomeVisit[] = [];
