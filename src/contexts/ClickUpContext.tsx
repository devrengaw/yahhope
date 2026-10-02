import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';

export interface CU_Space {
  id: string;
  name: string;
  color: string;
  icon: string;
  module?: string; // 'nutricao' | 'comunicacao' | 'captacao' | 'operacoes' | 'geral'
}

export interface CU_Folder {
  id: string;
  space_id: string;
  name: string;
}

export interface CU_Channel {
  id: string;
  name: string;
  description?: string;
  team_id?: string;
  created_by?: string;
}

export interface CU_List {
  id: string;
  space_id: string;
  folder_id?: string;
  name: string;
  color: string;
  description?: string;
}

export interface CU_Status {
  id: string;
  list_id?: string;
  name: string;
  color: string;
  order_index: number;
}

export interface CU_CustomField {
  id: string;
  list_id: string;
  name: string;
  type: string; 
}

export interface CU_ChecklistItem {
  id: string;
  text: string;
  done: boolean;
}

export interface CU_Comment {
  id: string;
  user_id: string;
  user_name: string;
  user_avatar?: string;
  text: string;
  created_at: string;
}

export type TaskPriority = 'urgent' | 'high' | 'normal' | 'low';

export interface CU_Task {
  id: string;
  list_id: string;
  name: string;
  description?: string;
  status_id: string;
  priority: TaskPriority;
  assignee?: string;
  assignee_id?: string;
  assignee_user?: {
    id: string;
    name: string;
    avatar?: string;
    email?: string;
    role?: string;
  };
  team_id?: string;
  team?: {
    id: string;
    name: string;
    color?: string;
  };
  due_date?: string;
  tags: string[];
  checklists: CU_ChecklistItem[];
  comments: CU_Comment[];
  custom_values?: Record<string, string>;
  order_index: number;
  created_at?: string;
}

export interface SystemUser {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role?: string;
  department?: string;
}

interface ClickUpContextType {
  spaces: CU_Space[];
  folders: CU_Folder[];
  lists: CU_List[];
  statuses: CU_Status[];
  fields: CU_CustomField[];
  tasks: CU_Task[];
  channels: CU_Channel[];
  systemUsers: SystemUser[];

  activeSpace: string | null;
  activeList: string | null;
  selectedTask: CU_Task | null;
  setActiveSpace: (id: string | null) => void;
  setActiveList: (id: string | null) => void;
  setSelectedTask: (task: CU_Task | null) => void;

  addSpace: (name: string, color: string, icon: string, module?: string) => Promise<void>;
  updateSpace: (id: string, updates: Partial<CU_Space>) => Promise<void>;
  deleteSpace: (id: string) => Promise<void>;
  
  addList: (space_id: string, name: string, color?: string) => Promise<void>;
  updateList: (id: string, updates: Partial<CU_List>) => Promise<void>;
  deleteList: (id: string) => Promise<void>;
  
  addTask: (list_id: string, name: string, status_id: string, options?: Partial<CU_Task>) => Promise<CU_Task | null>;
  updateTask: (task_id: string, updates: Partial<CU_Task>) => Promise<void>;
  deleteTask: (task_id: string) => Promise<void>;
  moveTaskStatus: (task_id: string, newStatusId: string, newOrderIndex?: number) => Promise<void>;

  addChecklistItem: (taskId: string, text: string) => Promise<void>;
  toggleChecklistItem: (taskId: string, itemId: string) => Promise<void>;
  deleteChecklistItem: (taskId: string, itemId: string) => Promise<void>;
  
  addTaskComment: (taskId: string, text: string) => Promise<void>;

  updateTaskField: (task_id: string, field_id: string, value: string) => Promise<void>;
  addField: (list_id: string, name: string, type: string) => Promise<void>;
  
  addStatus: (list_id: string, name: string, color: string) => Promise<void>;
  updateStatus: (id: string, updates: Partial<CU_Status>) => Promise<void>;
  deleteStatus: (id: string) => Promise<void>;

  addChannel: (name: string, description?: string, team_id?: string) => Promise<void>;
  updateChannel: (id: string, updates: Partial<CU_Channel>) => Promise<void>;
  deleteChannel: (id: string) => Promise<void>;
  
  loading: boolean;
  refreshData: () => Promise<void>;
}

const ClickUpContext = createContext<ClickUpContextType | undefined>(undefined);

const MOCK_SPACES: CU_Space[] = [
  { id: 's-nutricao', name: 'Nutrição Infantil', color: '#10b981', icon: 'Heart', module: 'nutricao' },
  { id: 's-comunicacao', name: 'Comunicação & Redes', color: '#8b5cf6', icon: 'MessageSquare', module: 'comunicacao' },
  { id: 's-captacao', name: 'Captação & Doações', color: '#f59e0b', icon: 'Target', module: 'captacao' },
  { id: 's-projetos', name: 'Projetos Globais & ERP', color: '#3b82f6', icon: 'Globe', module: 'geral' }
];

const MOCK_LISTS: CU_List[] = [
  { id: 'l-pacientes', space_id: 's-nutricao', name: 'Triagem & Suplementação', color: '#10b981', description: 'Fluxo de acompanhamento das crianças em recuperação nutricional' },
  { id: 'l-visitas', space_id: 's-nutricao', name: 'Visitas Domiciliares', color: '#059669', description: 'Roteiros de ACS e checagens residenciais' },
  { id: 'l-redes', space_id: 's-comunicacao', name: 'Campanhas & Mídias', color: '#8b5cf6', description: 'Produção de conteúdo, carrosséis e posts de impacto' },
  { id: 'l-newsletter', space_id: 's-comunicacao', name: 'Disparos de E-mail', color: '#a855f7', description: 'Atualização mensal para apadrinhadores' },
  { id: 'l-apadrinhamento', space_id: 's-captacao', name: 'Captação de Apadrinhadores', color: '#f59e0b', description: 'Funil de novos doadores e parceiros' },
  { id: 'l-desenvolvimento', space_id: 's-projetos', name: 'Desenvolvimento do Sistema', color: '#3b82f6', description: 'Melhorias técnicas, aplicativo móvel e integrações' }
];

const MOCK_STATUSES: CU_Status[] = [
  // Status para Nutrição (l-pacientes)
  { id: 'st-n-1', list_id: 'l-pacientes', name: 'A FAZER', color: '#94a3b8', order_index: 0 },
  { id: 'st-n-2', list_id: 'l-pacientes', name: 'EM ATENDIMENTO', color: '#3b82f6', order_index: 1 },
  { id: 'st-n-3', list_id: 'l-pacientes', name: 'RECUPERAÇÃO', color: '#eab308', order_index: 2 },
  { id: 'st-n-4', list_id: 'l-pacientes', name: 'CONCLUÍDO', color: '#10b981', order_index: 3 },

  // Status padrão para Comunicação (l-redes)
  { id: 'st-c-1', list_id: 'l-redes', name: 'IDEIAS / BRIEFING', color: '#94a3b8', order_index: 0 },
  { id: 'st-c-2', list_id: 'l-redes', name: 'PRODUÇÃO', color: '#3b82f6', order_index: 1 },
  { id: 'st-c-3', list_id: 'l-redes', name: 'REVISÃO', color: '#eab308', order_index: 2 },
  { id: 'st-c-4', list_id: 'l-redes', name: 'PUBLICADO', color: '#10b981', order_index: 3 },

  // Status padrão para Desenvolvimento (l-desenvolvimento)
  { id: 'st-d-1', list_id: 'l-desenvolvimento', name: 'BACKLOG', color: '#64748b', order_index: 0 },
  { id: 'st-d-2', list_id: 'l-desenvolvimento', name: 'A FAZER', color: '#f59e0b', order_index: 1 },
  { id: 'st-d-3', list_id: 'l-desenvolvimento', name: 'EM ANDAMENTO', color: '#3b82f6', order_index: 2 },
  { id: 'st-d-4', list_id: 'l-desenvolvimento', name: 'CONCLUÍDO', color: '#10b981', order_index: 3 }
];

const MOCK_TASKS: CU_Task[] = [
  {
    id: 't-1',
    list_id: 'l-pacientes',
    name: 'Avaliação Antropométrica - Lote 12',
    description: 'Medição de peso, altura e circunferência braquial de 15 novas crianças cadastradas na comunidade de Dondo.',
    status_id: 'st-n-2',
    priority: 'urgent',
    team_id: 't-saude',
    team: { id: 't-saude', name: 'Saúde & Nutrição', color: '#10b981' },
    due_date: new Date(Date.now() + 86400000 * 2).toISOString(),
    tags: ['Triagem', 'Urgente', 'Nutrição'],
    checklists: [
      { id: 'ck-1', text: 'Separar fitas métricas e balanças calibradas', done: true },
      { id: 'ck-2', text: 'Imprimir fichas de prontuário clínico', done: true },
      { id: 'ck-3', text: 'Conferir suplementos vitamínicos em estoque', done: false },
      { id: 'ck-4', text: 'Registrar histórico no app móvel', done: false }
    ],
    comments: [],
    order_index: 0
  },
  {
    id: 't-2',
    list_id: 'l-pacientes',
    name: 'Distribuição dos Suplementos Terapêuticos',
    description: 'Entregar pacotes de tratamento para crianças em desnutrição moderada (DAM) e orientar as mães sobre a dosagem diária.',
    status_id: 'st-n-1',
    priority: 'high',
    team_id: 't-saude',
    team: { id: 't-saude', name: 'Saúde & Nutrição', color: '#10b981' },
    due_date: new Date(Date.now() + 86400000 * 4).toISOString(),
    tags: ['Distribuição', 'Estoque'],
    checklists: [
      { id: 'ck-21', text: 'Conferir validade dos lotes', done: true },
      { id: 'ck-22', text: 'Assinatura dos termos de recebimento pelas mães', done: false }
    ],
    comments: [],
    order_index: 1
  },
  {
    id: 't-3',
    list_id: 'l-pacientes',
    name: 'Alta Nutricional - Paciente Mariazinha',
    description: 'Criança completou o ciclo de 90 dias com recuperação total de peso e índice eutrófico.',
    status_id: 'st-n-4',
    priority: 'normal',
    team_id: 't-saude',
    team: { id: 't-saude', name: 'Saúde & Nutrição', color: '#10b981' },
    due_date: new Date(Date.now() - 86400000).toISOString(),
    tags: ['Alta', 'Sucesso'],
    checklists: [
      { id: 'ck-31', text: 'Emitir certificado de alta', done: true },
      { id: 'ck-32', text: 'Foto comemorativa com consentimento', done: true },
      { id: 'ck-33', text: 'Enviar relatório para apadrinhador', done: true }
    ],
    comments: [],
    order_index: 0
  },
  {
    id: 't-4',
    list_id: 'l-redes',
    name: 'Carrossel: Como funciona o Centro Nutricional',
    description: 'Post educativo de 6 lâminas mostrando desde a triagem das crianças até a distribuição dos alimentos e alta médica.',
    status_id: 'st-c-2',
    priority: 'high',
    team_id: 't-marketing',
    team: { id: 't-marketing', name: 'Marketing & Mídia', color: '#8b5cf6' },
    due_date: new Date(Date.now() + 86400000 * 3).toISOString(),
    tags: ['Instagram', 'Design', 'Conteúdo'],
    checklists: [
      { id: 'ck-41', text: 'Roteiro e copy aprovados', done: true },
      { id: 'ck-42', text: 'Criação dos layouts no Figma', done: true },
      { id: 'ck-43', text: 'Revisão ortográfica e legendas', done: false },
      { id: 'ck-44', text: 'Agendamento no estúdio de criação', done: false }
    ],
    comments: [],
    order_index: 0
  },
  {
    id: 't-5',
    list_id: 'l-desenvolvimento',
    name: 'Quadro Kanban Drag & Drop no Workspace',
    description: 'Implementar movimentação de cards estilo Trello e ClickUp entre as colunas de status.',
    status_id: 'st-d-3',
    priority: 'urgent',
    team_id: 't-dev',
    team: { id: 't-dev', name: 'Tecnologia & Produto', color: '#3b82f6' },
    due_date: new Date().toISOString(),
    tags: ['ClickUp', 'Frontend', 'Kanban'],
    checklists: [
      { id: 'ck-51', text: 'Suporte a Drag & Drop nativo', done: true },
      { id: 'ck-52', text: 'Modal detalhado com checklists e comentários', done: true },
      { id: 'ck-53', text: 'Integração com canais e equipes', done: true }
    ],
    comments: [],
    order_index: 0
  }
];

const MOCK_CHANNELS: CU_Channel[] = [
  { id: 'c-geral', name: 'geral', description: 'Canal aberto para avisos e comunicados da organização' },
  { id: 'c-projetos', name: 'projetos', description: 'Alinhamento geral de projetos e metas' },
  { id: 'c-marketing', name: 'marketing-comunicacao', description: 'Equipe de comunicação, campanhas e mídia', team_id: 't-marketing' },
  { id: 'c-saude', name: 'saude-nutricao', description: 'Equipe clínica, médicos, enfermeiros e ACS', team_id: 't-saude' }
];

export function ClickUpProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();

  const [spaces, setSpaces] = useState<CU_Space[]>([]);
  const [folders, setFolders] = useState<CU_Folder[]>([]);
  const [lists, setLists] = useState<CU_List[]>([]);
  const [statuses, setStatuses] = useState<CU_Status[]>([]);
  const [fields, setFields] = useState<CU_CustomField[]>([]);
  const [tasks, setTasks] = useState<CU_Task[]>([]);
  const [channels, setChannels] = useState<CU_Channel[]>([]);
  const [systemUsers, setSystemUsers] = useState<SystemUser[]>([]);
  const [loading, setLoading] = useState(true);

  const [activeSpace, setActiveSpace] = useState<string | null>(null);
  const [activeList, setActiveList] = useState<string | null>(null);
  const [selectedTask, setSelectedTask] = useState<CU_Task | null>(null);

  useEffect(() => {
    fetchWorkspaceData();

    // Supabase Realtime subscriptions
    const sub = supabase.channel('clickup_updates_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'clickup_spaces' }, () => fetchWorkspaceData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'clickup_lists' }, () => fetchWorkspaceData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'clickup_tasks' }, () => fetchWorkspaceData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'clickup_statuses' }, () => fetchWorkspaceData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'workspace_channels' }, () => fetchWorkspaceData())
      .subscribe();

    return () => {
      supabase.removeChannel(sub);
    };
  }, []);

  const fetchWorkspaceData = async () => {
    try {
      setLoading(true);

      const [
        resSpaces,
        resFolders,
        resLists,
        resStatuses,
        resFields,
        resTasks,
        resChannels,
        resUsers,
        resTeams
      ] = await Promise.allSettled([
        supabase.from('clickup_spaces').select('*'),
        supabase.from('clickup_folders').select('*'),
        supabase.from('clickup_lists').select('*'),
        supabase.from('clickup_statuses').select('*'),
        supabase.from('clickup_custom_fields').select('*'),
        supabase.from('clickup_tasks').select('*'),
        supabase.from('workspace_channels').select('*'),
        supabase.from('users').select('*'),
        supabase.from('workspace_teams').select('id, name, color')
      ]);

      // Process Users from DB
      let loadedUsers: SystemUser[] = [];
      if (resUsers.status === 'fulfilled' && resUsers.value.data && resUsers.value.data.length > 0) {
        loadedUsers = resUsers.value.data.map((u: any) => ({
          id: u.id,
          name: u.name || (u.email ? u.email.split('@')[0] : 'Usuário'),
          email: u.email || '',
          avatar: u.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(u.name || u.email || 'U')}&background=random`,
          role: u.role || 'USER',
          department: u.department || ''
        }));
      } else if (user) {
        loadedUsers = [{
          id: user.id,
          name: user.name || (user.email ? user.email.split('@')[0] : 'Você'),
          email: user.email || '',
          avatar: user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || 'U')}&background=random`,
          role: user.role
        }];
      }

      if (user && !loadedUsers.some(u => u.id === user.id || (user.email && u.email === user.email))) {
        loadedUsers.push({
          id: user.id,
          name: user.name || (user.email ? user.email.split('@')[0] : 'Você'),
          email: user.email || '',
          avatar: user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || 'U')}&background=random`,
          role: user.role
        });
      }

      setSystemUsers(loadedUsers);

      // Process Teams mapping
      const teamsMap: Record<string, { id: string; name: string; color?: string }> = {};
      if (resTeams.status === 'fulfilled' && resTeams.value.data) {
        resTeams.value.data.forEach(t => {
          teamsMap[t.id] = t;
        });
      }

      // Check if spaces exist in DB
      const dbSpaces = resSpaces.status === 'fulfilled' ? resSpaces.value.data : null;

      if (!dbSpaces || dbSpaces.length === 0) {
        // Fallback to rich mock data
        setSpaces(MOCK_SPACES);
        setFolders([]);
        setLists(MOCK_LISTS);
        setStatuses(MOCK_STATUSES);
        setFields([]);
        setTasks(MOCK_TASKS);
        setChannels(MOCK_CHANNELS);

        if (!activeSpace) {
          setActiveSpace(MOCK_SPACES[0].id);
          const firstList = MOCK_LISTS.find(l => l.space_id === MOCK_SPACES[0].id);
          if (firstList) setActiveList(firstList.id);
        }
      } else {
        // We have DB spaces!
        setSpaces(dbSpaces);

        if (resFolders.status === 'fulfilled' && resFolders.value.data) {
          setFolders(resFolders.value.data);
        }

        const dbLists = (resLists.status === 'fulfilled' && resLists.value.data && resLists.value.data.length > 0)
          ? resLists.value.data
          : MOCK_LISTS;
        setLists(dbLists);

        const dbStatuses = (resStatuses.status === 'fulfilled' && resStatuses.value.data && resStatuses.value.data.length > 0)
          ? resStatuses.value.data
          : MOCK_STATUSES;
        setStatuses(dbStatuses);

        if (resFields.status === 'fulfilled' && resFields.value.data) {
          setFields(resFields.value.data);
        }

        // Process Tasks
        if (resTasks.status === 'fulfilled' && resTasks.value.data && resTasks.value.data.length > 0) {
          const parsedTasks: CU_Task[] = resTasks.value.data.map(t => {
            const assigneeUser = loadedUsers.find(u => u.id === (t.assignee_id || t.assignee));
            const team = t.team_id ? teamsMap[t.team_id] : undefined;
            return {
              id: t.id,
              list_id: t.list_id,
              name: t.name,
              description: t.description || '',
              status_id: t.status_id,
              priority: (t.priority as TaskPriority) || 'normal',
              assignee: t.assignee || t.assignee_id,
              assignee_id: t.assignee_id || t.assignee,
              assignee_user: assigneeUser,
              team_id: t.team_id,
              team: team,
              due_date: t.due_date,
              tags: Array.isArray(t.tags) ? t.tags : [],
              checklists: Array.isArray(t.checklists) ? t.checklists : [],
              comments: Array.isArray(t.comments) ? t.comments : [],
              custom_values: t.custom_values || {},
              order_index: t.order_index ?? 0,
              created_at: t.created_at
            };
          });
          setTasks(parsedTasks);
        } else {
          setTasks(MOCK_TASKS);
        }

        // Channels (Deduplicated by normalized name)
        if (resChannels.status === 'fulfilled' && resChannels.value.data && resChannels.value.data.length > 0) {
          const seen = new Set<string>();
          const uniqueChannels: CU_Channel[] = [];
          const duplicateIds: string[] = [];

          for (const ch of resChannels.value.data) {
            const cleanName = (ch.name || '').toLowerCase().trim();
            if (!cleanName) continue;
            if (!seen.has(cleanName)) {
              seen.add(cleanName);
              uniqueChannels.push({
                id: ch.id,
                name: cleanName,
                description: ch.description || '',
                team_id: ch.team_id,
                created_by: ch.created_by
              });
            } else {
              duplicateIds.push(ch.id);
            }
          }

          setChannels(uniqueChannels);

          // Clean up duplicate channel records from database in the background
          if (duplicateIds.length > 0) {
            supabase
              .from('workspace_channels')
              .delete()
              .in('id', duplicateIds)
              .then(({ error }) => {
                if (!error) console.log(`Deduplicated: removed ${duplicateIds.length} duplicate channels`);
              });
          }
        } else {
          setChannels([
            { id: 'c-geral', name: 'geral', description: 'Canal de comunicação geral para todas as equipes' },
            { id: 'c-projetos', name: 'projetos', description: 'Discussão e alinhamento de novos projetos e entregas' }
          ]);
        }

        // Auto-select first active space & list if not set
        if (!activeSpace && dbSpaces[0]) {
          setActiveSpace(dbSpaces[0].id);
          const firstList = dbLists.find(l => l.space_id === dbSpaces[0].id);
          if (firstList) setActiveList(firstList.id);
        }
      }
    } catch (e) {
      console.error('Error fetching workspace data:', e);
      // Fallback
      setSpaces(MOCK_SPACES);
      setLists(MOCK_LISTS);
      setStatuses(MOCK_STATUSES);
      setTasks(MOCK_TASKS);
      setChannels([
        { id: 'c-geral', name: 'geral', description: 'Canal de comunicação geral para todas as equipes' },
        { id: 'c-projetos', name: 'projetos', description: 'Discussão e alinhamento de novos projetos e entregas' }
      ]);
      if (!activeSpace) setActiveSpace(MOCK_SPACES[0].id);
      if (!activeList) setActiveList(MOCK_LISTS[0].id);
    } finally {
      setLoading(false);
    }
  };

  // Sync selectedTask when tasks change
  useEffect(() => {
    if (selectedTask) {
      const updated = tasks.find(t => t.id === selectedTask.id);
      if (updated) {
        setSelectedTask(updated);
      }
    }
  }, [tasks]);

  const addSpace = async (name: string, color: string, icon: string, module: string = 'geral') => {
    const tempId = 's-' + Math.random().toString(36).substring(2, 9);
    const newSpace: CU_Space = { id: tempId, name, color, icon, module };
    setSpaces(prev => [...prev, newSpace]);

    try {
      const { data, error } = await supabase.from('clickup_spaces').insert([{ name, color, icon, module }]).select().single();
      if (!error && data) {
        setSpaces(prev => prev.map(s => s.id === tempId ? data : s));
        if (!activeSpace) setActiveSpace(data.id);
      }
    } catch (err) {
      console.log('Using local state for addSpace');
    }
  };

  const updateSpace = async (id: string, updates: Partial<CU_Space>) => {
    setSpaces(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
    try {
      await supabase.from('clickup_spaces').update(updates).eq('id', id);
    } catch (err) {
      console.log('Using local state for updateSpace');
    }
  };

  const deleteSpace = async (id: string) => {
    setSpaces(prev => prev.filter(s => s.id !== id));
    setLists(prev => prev.filter(l => l.space_id !== id));
    if (activeSpace === id) {
      setActiveSpace(null);
      setActiveList(null);
    }
    try {
      await supabase.from('clickup_spaces').delete().eq('id', id);
    } catch (err) {
      console.log('Using local state for deleteSpace');
    }
  };

  const addList = async (space_id: string, name: string, color: string = '#3b82f6') => {
    const tempId = 'l-' + Math.random().toString(36).substring(2, 9);
    const newList: CU_List = { id: tempId, space_id, name, color };
    setLists(prev => [...prev, newList]);

    // Add default statuses for this new list
    const defaultStatuses: CU_Status[] = [
      { id: 'st-' + Math.random().toString(36).substring(2, 7), list_id: tempId, name: 'A FAZER', color: '#94a3b8', order_index: 0 },
      { id: 'st-' + Math.random().toString(36).substring(2, 7), list_id: tempId, name: 'EM ANDAMENTO', color: '#3b82f6', order_index: 1 },
      { id: 'st-' + Math.random().toString(36).substring(2, 7), list_id: tempId, name: 'CONCLUÍDO', color: '#10b981', order_index: 2 }
    ];
    setStatuses(prev => [...prev, ...defaultStatuses]);

    try {
      const { data, error } = await supabase.from('clickup_lists').insert([{ space_id, name, color }]).select().single();
      if (!error && data) {
        setLists(prev => prev.map(l => l.id === tempId ? data : l));
        // Insert statuses into db
        await supabase.from('clickup_statuses').insert(defaultStatuses.map((st, i) => ({
          list_id: data.id,
          name: st.name,
          color: st.color,
          order_index: i
        })));
        setActiveList(data.id);
      }
    } catch (err) {
      setActiveList(tempId);
    }
  };

  const updateList = async (id: string, updates: Partial<CU_List>) => {
    setLists(prev => prev.map(l => l.id === id ? { ...l, ...updates } : l));
    try {
      await supabase.from('clickup_lists').update(updates).eq('id', id);
    } catch (err) {
      console.log('Using local state for updateList');
    }
  };

  const deleteList = async (id: string) => {
    setLists(prev => prev.filter(l => l.id !== id));
    setTasks(prev => prev.filter(t => t.list_id !== id));
    if (activeList === id) setActiveList(null);
    try {
      await supabase.from('clickup_lists').delete().eq('id', id);
    } catch (err) {
      console.log('Using local state for deleteList');
    }
  };

  const addTask = async (list_id: string, name: string, status_id: string, options: Partial<CU_Task> = {}): Promise<CU_Task | null> => {
    const tempId = 't-' + Math.random().toString(36).substring(2, 9);
    const assigneeUser = options.assignee_id ? systemUsers.find(u => u.id === options.assignee_id) : undefined;

    const newTask: CU_Task = {
      id: tempId,
      list_id,
      name,
      description: options.description || '',
      status_id,
      priority: options.priority || 'normal',
      assignee: options.assignee || options.assignee_id,
      assignee_id: options.assignee_id,
      assignee_user: assigneeUser,
      team_id: options.team_id,
      team: options.team,
      due_date: options.due_date,
      tags: options.tags || [],
      checklists: options.checklists || [],
      comments: options.comments || [],
      custom_values: options.custom_values || {},
      order_index: options.order_index ?? 0,
      created_at: new Date().toISOString()
    };

    setTasks(prev => [newTask, ...prev]);

    try {
      const { data, error } = await supabase.from('clickup_tasks').insert([{
        list_id,
        name,
        description: newTask.description,
        status_id,
        priority: newTask.priority,
        assignee_id: newTask.assignee_id,
        team_id: newTask.team_id,
        due_date: newTask.due_date,
        tags: newTask.tags,
        checklists: newTask.checklists,
        comments: newTask.comments,
        order_index: newTask.order_index
      }]).select().single();

      if (!error && data) {
        setTasks(prev => prev.map(t => t.id === tempId ? { ...newTask, id: data.id } : t));
        return { ...newTask, id: data.id };
      }
    } catch (err) {
      console.log('Using local state for addTask');
    }

    return newTask;
  };

  const updateTask = async (task_id: string, updates: Partial<CU_Task>) => {
    // If assignee_id is updated, also update assignee_user
    let assigneeUser = updates.assignee_user;
    if (updates.assignee_id && !assigneeUser) {
      assigneeUser = systemUsers.find(u => u.id === updates.assignee_id);
    }

    setTasks(prev => prev.map(t => {
      if (t.id === task_id) {
        return {
          ...t,
          ...updates,
          assignee_user: assigneeUser || t.assignee_user
        };
      }
      return t;
    }));

    try {
      const payload: Record<string, any> = {};
      if (updates.name !== undefined) payload.name = updates.name;
      if (updates.description !== undefined) payload.description = updates.description;
      if (updates.status_id !== undefined) payload.status_id = updates.status_id;
      if (updates.priority !== undefined) payload.priority = updates.priority;
      if (updates.assignee_id !== undefined) payload.assignee_id = updates.assignee_id;
      if (updates.team_id !== undefined) payload.team_id = updates.team_id;
      if (updates.due_date !== undefined) payload.due_date = updates.due_date;
      if (updates.tags !== undefined) payload.tags = updates.tags;
      if (updates.checklists !== undefined) payload.checklists = updates.checklists;
      if (updates.comments !== undefined) payload.comments = updates.comments;
      if (updates.order_index !== undefined) payload.order_index = updates.order_index;

      if (Object.keys(payload).length > 0) {
        await supabase.from('clickup_tasks').update(payload).eq('id', task_id);
      }
    } catch (err) {
      console.log('Using local state for updateTask');
    }
  };

  const deleteTask = async (task_id: string) => {
    setTasks(prev => prev.filter(t => t.id !== task_id));
    if (selectedTask?.id === task_id) setSelectedTask(null);
    try {
      await supabase.from('clickup_tasks').delete().eq('id', task_id);
    } catch (err) {
      console.log('Using local state for deleteTask');
    }
  };

  const moveTaskStatus = async (task_id: string, newStatusId: string, newOrderIndex?: number) => {
    setTasks(prev => prev.map(t => {
      if (t.id === task_id) {
        return {
          ...t,
          status_id: newStatusId,
          order_index: newOrderIndex !== undefined ? newOrderIndex : t.order_index
        };
      }
      return t;
    }));

    try {
      await supabase.from('clickup_tasks').update({
        status_id: newStatusId,
        order_index: newOrderIndex ?? 0
      }).eq('id', task_id);
    } catch (err) {
      console.log('Using local state for moveTaskStatus');
    }
  };

  const addChecklistItem = async (taskId: string, text: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    const newItem: CU_ChecklistItem = {
      id: 'ck-' + Math.random().toString(36).substring(2, 9),
      text: text.trim(),
      done: false
    };

    const newChecklists = [...(task.checklists || []), newItem];
    await updateTask(taskId, { checklists: newChecklists });
  };

  const toggleChecklistItem = async (taskId: string, itemId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    const newChecklists = (task.checklists || []).map(item =>
      item.id === itemId ? { ...item, done: !item.done } : item
    );
    await updateTask(taskId, { checklists: newChecklists });
  };

  const deleteChecklistItem = async (taskId: string, itemId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    const newChecklists = (task.checklists || []).filter(item => item.id !== itemId);
    await updateTask(taskId, { checklists: newChecklists });
  };

  const addTaskComment = async (taskId: string, text: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task || !text.trim()) return;

    const newComment: CU_Comment = {
      id: 'cm-' + Math.random().toString(36).substring(2, 9),
      user_id: user?.id || 'u-me',
      user_name: user?.name || 'Você',
      user_avatar: user?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100',
      text: text.trim(),
      created_at: new Date().toISOString()
    };

    const newComments = [...(task.comments || []), newComment];
    await updateTask(taskId, { comments: newComments });
  };

  const updateTaskField = async (task_id: string, field_id: string, value: string) => {
    setTasks(prev => prev.map(t => t.id === task_id ? { ...t, custom_values: { ...t.custom_values, [field_id]: value } } : t));
    try {
      const { data: existing } = await supabase.from('clickup_task_custom_fields')
        .select('*')
        .eq('task_id', task_id)
        .eq('field_id', field_id)
        .single();

      if (existing) {
        await supabase.from('clickup_task_custom_fields').update({ value }).eq('task_id', task_id).eq('field_id', field_id);
      } else {
        await supabase.from('clickup_task_custom_fields').insert([{ task_id, field_id, value }]);
      }
    } catch (err) {
      console.log('Using local state for custom fields');
    }
  };

  const addField = async (list_id: string, name: string, type: string) => {
    setFields(prev => [...prev, { id: 'f-' + Math.random().toString(36).substring(2, 7), list_id, name, type }]);
    try {
      await supabase.from('clickup_custom_fields').insert([{ list_id, name, type }]);
    } catch (err) {
      console.log('Using local state for addField');
    }
  };

  const addStatus = async (list_id: string, name: string, color: string) => {
    const listStatuses = statuses.filter(s => s.list_id === list_id);
    const order_index = listStatuses.length;
    const tempId = 'st-' + Math.random().toString(36).substring(2, 7);

    const newStatus: CU_Status = { id: tempId, list_id, name, color, order_index };
    setStatuses(prev => [...prev, newStatus]);

    try {
      const { data, error } = await supabase.from('clickup_statuses').insert([{ list_id, name, color, order_index }]).select().single();
      if (!error && data) {
        setStatuses(prev => prev.map(s => s.id === tempId ? data : s));
      }
    } catch (err) {
      console.log('Using local state for addStatus');
    }
  };

  const updateStatus = async (id: string, updates: Partial<CU_Status>) => {
    setStatuses(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
    try {
      await supabase.from('clickup_statuses').update(updates).eq('id', id);
    } catch (err) {
      console.log('Using local state for updateStatus');
    }
  };

  const deleteStatus = async (id: string) => {
    setStatuses(prev => prev.filter(s => s.id !== id));
    try {
      await supabase.from('clickup_statuses').delete().eq('id', id);
    } catch (err) {
      console.log('Using local state for deleteStatus');
    }
  };

  const addChannel = async (name: string, description?: string, team_id?: string) => {
    const cleanName = name.toLowerCase().trim().replace(/\s+/g, '-');
    if (!cleanName) return;

    if (channels.some(c => c.name.toLowerCase().trim() === cleanName)) {
      alert(`Já existe um canal com o nome #${cleanName}`);
      return;
    }

    const creator = user?.id || user?.email || user?.name || '';
    const tempId = 'c-' + Math.random().toString(36).substring(2, 7);
    const newChan: CU_Channel = { id: tempId, name: cleanName, description, team_id, created_by: creator };
    setChannels(prev => [...prev, newChan]);

    try {
      let { data, error } = await supabase
        .from('workspace_channels')
        .insert([{ name: cleanName, description, team_id, created_by: creator }])
        .select()
        .single();

      if (error && error.message?.includes('created_by')) {
        const fallback = await supabase
          .from('workspace_channels')
          .insert([{ name: cleanName, description, team_id }])
          .select()
          .single();
        data = fallback.data;
        error = fallback.error;
      }

      if (!error && data) {
        setChannels(prev => prev.map(c => c.id === tempId ? { ...data, name: (data.name || cleanName).toLowerCase().trim() } : c));
      }
    } catch (err) {
      console.log('Using local state for addChannel');
    }
  };

  const updateChannel = async (id: string, updates: Partial<CU_Channel>) => {
    const cleanUpdates = {
      ...updates,
      ...(updates.name ? { name: updates.name.toLowerCase().trim().replace(/\s+/g, '-') } : {})
    };

    setChannels(prev => prev.map(c => (c.id === id || c.name === id) ? { ...c, ...cleanUpdates } : c));

    try {
      const { error } = await supabase
        .from('workspace_channels')
        .update(cleanUpdates)
        .eq('id', id);

      if (error) {
        await supabase
          .from('workspace_channels')
          .update(cleanUpdates)
          .eq('name', id);
      }
    } catch (err) {
      console.error('Error updating channel in DB:', err);
    }
  };

  const deleteChannel = async (channelIdOrName: string) => {
    const target = channels.find(c => c.id === channelIdOrName || c.name === channelIdOrName);
    const idToDelete = target ? target.id : channelIdOrName;
    const nameToDelete = target ? target.name : channelIdOrName;

    setChannels(prev => prev.filter(c => c.id !== idToDelete && c.name !== nameToDelete));

    try {
      // Delete associated messages
      await supabase
        .from('workspace_messages')
        .delete()
        .or(`channel_id.eq.${idToDelete},channel_id.eq.${nameToDelete}`);

      // Delete channel
      await supabase
        .from('workspace_channels')
        .delete()
        .or(`id.eq.${idToDelete},name.eq.${nameToDelete}`);
    } catch (err) {
      console.error('Error deleting channel in DB:', err);
    }
  };

  return (
    <ClickUpContext.Provider value={{
      spaces,
      folders,
      lists,
      statuses,
      fields,
      tasks,
      channels,
      systemUsers,
      activeSpace,
      activeList,
      selectedTask,
      setActiveSpace,
      setActiveList,
      setSelectedTask,
      addSpace,
      updateSpace,
      deleteSpace,
      addList,
      updateList,
      deleteList,
      addTask,
      updateTask,
      deleteTask,
      moveTaskStatus,
      addChecklistItem,
      toggleChecklistItem,
      deleteChecklistItem,
      addTaskComment,
      updateTaskField,
      addField,
      addStatus,
      updateStatus,
      deleteStatus,
      addChannel,
      updateChannel,
      deleteChannel,
      loading,
      refreshData: fetchWorkspaceData
    }}>
      {children}
    </ClickUpContext.Provider>
  );
}

export function useClickUp() {
  const context = useContext(ClickUpContext);
  if (!context) throw new Error('useClickUp must be used within ClickUpProvider');
  return context;
}
