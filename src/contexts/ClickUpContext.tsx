import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../lib/supabase';

export interface CU_Space {
  id: string;
  name: string;
  color: string;
  icon: string;
}

export interface CU_Folder {
  id: string;
  space_id: string;
  name: string;
}

export interface CU_List {
  id: string;
  space_id: string;
  folder_id?: string;
  name: string;
  color: string;
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

export interface CU_Task {
  id: string;
  list_id: string;
  name: string;
  description?: string;
  status_id: string;
  assignee?: string;
  due_date?: string;
  custom_values?: Record<string, string>;
}

interface ClickUpContextType {
  spaces: CU_Space[];
  folders: CU_Folder[];
  lists: CU_List[];
  statuses: CU_Status[];
  fields: CU_CustomField[];
  tasks: CU_Task[];

  activeSpace: string | null;
  activeList: string | null;
  setActiveSpace: (id: string | null) => void;
  setActiveList: (id: string | null) => void;

  addSpace: (name: string, color: string, icon: string) => Promise<void>;
  updateSpace: (id: string, updates: Partial<CU_Space>) => Promise<void>;
  deleteSpace: (id: string) => Promise<void>;
  
  addList: (space_id: string, name: string) => Promise<void>;
  updateList: (id: string, updates: Partial<CU_List>) => Promise<void>;
  deleteList: (id: string) => Promise<void>;
  
  addTask: (list_id: string, name: string, status_id: string) => Promise<void>;
  updateTaskStatus: (task_id: string, status_id: string) => Promise<void>;
  updateTaskField: (task_id: string, field_id: string, value: string) => Promise<void>;
  addField: (list_id: string, name: string, type: string) => Promise<void>;
  loading: boolean;
}

const ClickUpContext = createContext<ClickUpContextType | undefined>(undefined);

// Initial Mock Data
const MOCK_SPACES: CU_Space[] = [
  { id: 's1', name: 'LEADS', color: '#f59e0b', icon: 'User' },
  { id: 's2', name: 'Projetos Globais', color: '#3b82f6', icon: 'Globe' }
];

const MOCK_LISTS: CU_List[] = [
  { id: 'l1', space_id: 's1', name: 'Vendas', color: '#10b981' },
  { id: 'l2', space_id: 's1', name: 'Pós Venda', color: '#8b5cf6' },
  { id: 'l3', space_id: 's1', name: 'Feedback', color: '#ec4899' },
  { id: 'l4', space_id: 's2', name: 'Desenvolvimento', color: '#3b82f6' }
];

const MOCK_STATUSES: CU_Status[] = [
  { id: 'st1', list_id: 'l2', name: 'AGUARDANDO VIAGEM', color: '#ef4444', order_index: 1 },
  { id: 'st2', list_id: 'l2', name: 'CHECK IN', color: '#eab308', order_index: 2 },
  { id: 'st3', list_id: 'l2', name: 'EM VIAGEM', color: '#3b82f6', order_index: 3 },
  { id: 'st4', list_id: 'l2', name: 'FINALIZADO', color: '#10b981', order_index: 4 }
];

const MOCK_FIELDS: CU_CustomField[] = [
  { id: 'f1', list_id: 'l2', name: 'CPF', type: 'text' },
  { id: 'f2', list_id: 'l2', name: 'E-mail', type: 'email' },
  { id: 'f3', list_id: 'l2', name: 'Celular', type: 'phone' },
  { id: 'f4', list_id: 'l2', name: 'Origem', type: 'text' },
  { id: 'f5', list_id: 'l2', name: 'Destino', type: 'text' },
  { id: 'f6', list_id: 'l2', name: 'Ida', type: 'date' },
  { id: 'f7', list_id: 'l2', name: 'Volta', type: 'date' }
];

const MOCK_TASKS: CU_Task[] = [
  { 
    id: 't1', list_id: 'l2', name: 'Herta Witzke', status_id: 'st1',
    custom_values: { 'f1': '-', 'f2': '-', 'f3': '-', 'f4': '-', 'f5': '-', 'f6': '-', 'f7': '-' }
  },
  { 
    id: 't2', list_id: 'l2', name: 'Celma Rodrigues do Nascimento', status_id: 'st2',
    custom_values: { 'f1': '84882775620', 'f2': 'celminhamanga@...', 'f3': '(31) 99319-7898', 'f4': 'CWB', 'f5': 'SAO', 'f6': '12/11/24', 'f7': '28/11/24' }
  },
  { 
    id: 't3', list_id: 'l2', name: 'Celma Rodrigues do Nascimento', status_id: 'st3',
    custom_values: { 'f1': '84882775620', 'f2': 'celminhamanga@...', 'f3': '(31) 99319-7898', 'f4': 'SAO', 'f5': 'LIS', 'f6': '12/11/24', 'f7': '27/11/24' }
  }
];

export function ClickUpProvider({ children }: { children: ReactNode }) {
  const [spaces, setSpaces] = useState<CU_Space[]>([]);
  const [folders, setFolders] = useState<CU_Folder[]>([]);
  const [lists, setLists] = useState<CU_List[]>([]);
  const [statuses, setStatuses] = useState<CU_Status[]>([]);
  const [fields, setFields] = useState<CU_CustomField[]>([]);
  const [tasks, setTasks] = useState<CU_Task[]>([]);
  const [loading, setLoading] = useState(true);

  const [activeSpace, setActiveSpace] = useState<string | null>(null);
  const [activeList, setActiveList] = useState<string | null>(null);

  useEffect(() => {
    fetchWorkspaceData();
    
    // Realtime subscriptions
    const sub = supabase.channel('clickup_updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'clickup_spaces' }, () => fetchWorkspaceData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'clickup_lists' }, () => fetchWorkspaceData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'clickup_tasks' }, () => fetchWorkspaceData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'clickup_task_custom_fields' }, () => fetchWorkspaceData())
      .subscribe();

    return () => { supabase.removeChannel(sub); };
  }, []);

  const fetchWorkspaceData = async () => {
    try {
      setLoading(true);
      const [
        resSpaces, resFolders, resLists, resStatuses, resFields, resTasks, resTaskFields
      ] = await Promise.all([
        supabase.from('clickup_spaces').select('*'),
        supabase.from('clickup_folders').select('*'),
        supabase.from('clickup_lists').select('*'),
        supabase.from('clickup_statuses').select('*'),
        supabase.from('clickup_custom_fields').select('*'),
        supabase.from('clickup_tasks').select('*'),
        supabase.from('clickup_task_custom_fields').select('*')
      ]);

      if (!resSpaces.data || resSpaces.data.length === 0) {
        // Fallback to MOCK data if DB is empty or table missing
        setSpaces(MOCK_SPACES);
        setFolders([]);
        setLists(MOCK_LISTS);
        setStatuses(MOCK_STATUSES);
        setFields(MOCK_FIELDS);
        setTasks(MOCK_TASKS);
        
        if (!activeSpace) {
          setActiveSpace(MOCK_SPACES[0].id);
          setActiveList(MOCK_LISTS.find(l => l.space_id === MOCK_SPACES[0].id)?.id || null);
        }
      } else {
        if (resSpaces.data) setSpaces(resSpaces.data);
        if (resFolders.data) setFolders(resFolders.data);
        if (resLists.data) setLists(resLists.data);
        if (resStatuses.data) setStatuses(resStatuses.data);
        if (resFields.data) setFields(resFields.data);
        
        if (resTasks.data) {
          // Map custom fields to tasks
          const mappedTasks = resTasks.data.map(task => {
            const tFields = resTaskFields.data?.filter(tf => tf.task_id === task.id) || [];
            const customValues: Record<string, string> = {};
            tFields.forEach(tf => {
              customValues[tf.field_id] = tf.value;
            });
            return { ...task, custom_values: customValues };
          });
          setTasks(mappedTasks);
        }
        
        // Auto-select first available space and list if nothing selected
        if (!activeSpace && resSpaces.data?.[0]) {
          setActiveSpace(resSpaces.data[0].id);
          const firstList = resLists.data?.find(l => l.space_id === resSpaces.data[0].id);
          if (firstList) setActiveList(firstList.id);
        }
      }
    } catch (e) {
      console.error('Error fetching workspace:', e);
      // Fallback on error
      setSpaces(MOCK_SPACES);
      setLists(MOCK_LISTS);
      setStatuses(MOCK_STATUSES);
      setFields(MOCK_FIELDS);
      setTasks(MOCK_TASKS);
      if (!activeSpace) setActiveSpace(MOCK_SPACES[0].id);
      if (!activeList) setActiveList(MOCK_LISTS[0].id);
    } finally {
      setLoading(false);
    }
  };

  const addSpace = async (name: string, color: string, icon: string) => {
    await supabase.from('clickup_spaces').insert([{ name, color, icon }]);
    fetchWorkspaceData();
  };

  const updateSpace = async (id: string, updates: Partial<CU_Space>) => {
    await supabase.from('clickup_spaces').update(updates).eq('id', id);
    fetchWorkspaceData();
  };

  const deleteSpace = async (id: string) => {
    await supabase.from('clickup_spaces').delete().eq('id', id);
    if (activeSpace === id) {
      setActiveSpace(null);
      setActiveList(null);
    }
    fetchWorkspaceData();
  };

  const addList = async (space_id: string, name: string) => {
    await supabase.from('clickup_lists').insert([{ space_id, name, color: '#94a3b8' }]);
    fetchWorkspaceData();
  };

  const updateList = async (id: string, updates: Partial<CU_List>) => {
    await supabase.from('clickup_lists').update(updates).eq('id', id);
    fetchWorkspaceData();
  };

  const deleteList = async (id: string) => {
    await supabase.from('clickup_lists').delete().eq('id', id);
    if (activeList === id) setActiveList(null);
    fetchWorkspaceData();
  };

  const addTask = async (list_id: string, name: string, status_id: string) => {
    await supabase.from('clickup_tasks').insert([{ list_id, name, status_id }]);
    fetchWorkspaceData();
  };

  const updateTaskStatus = async (task_id: string, status_id: string) => {
    setTasks(prev => prev.map(t => t.id === task_id ? { ...t, status_id } : t));
    await supabase.from('clickup_tasks').update({ status_id }).eq('id', task_id);
  };

  const updateTaskField = async (task_id: string, field_id: string, value: string) => {
    setTasks(prev => prev.map(t => t.id === task_id ? { ...t, custom_values: { ...t.custom_values, [field_id]: value } } : t));
    
    // Upsert equivalent for custom fields
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
  };

  const addField = async (list_id: string, name: string, type: string) => {
    await supabase.from('clickup_custom_fields').insert([{ list_id, name, type }]);
    fetchWorkspaceData();
  };

  return (
    <ClickUpContext.Provider value={{
      spaces, folders, lists, statuses, fields, tasks,
      activeSpace, activeList, setActiveSpace, setActiveList,
      addSpace,
      updateSpace,
      deleteSpace,
      addList,
      updateList,
      deleteList,
      addTask, updateTaskStatus, updateTaskField, addField, loading
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
