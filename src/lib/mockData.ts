export type NutritionalStatus = 'Adequado' | 'DAM' | 'DAG' | 'Risco' | 'Alta';

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
  recurrence?: 'monthly' | 'yearly' | 'none';
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
}

export const mockUserCategories = [];

export const mockInventoryCategories: InventoryCategory[] = [];

export const mockTransactionCategories: TransactionCategory[] = [];

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
  status: 'active' | 'planned' | 'completed';
  image_url: string;
  created_at: string;
}

export const mockYAHHopeProjects: YAHHopeProject[] = [];
