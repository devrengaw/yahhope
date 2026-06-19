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
  addList: (space_id: string, name: string) => Promise<void>;
  addTask: (list_id: string, name: string, status_id: string) => Promise<void>;
  updateTaskStatus: (task_id: string, status_id: string) => Promise<void>;
  updateTaskField: (task_id: string, field_id: string, value: string) => Promise<void>;
  addField: (list_id: string, name: string, type: string) => Promise<void>;
  loading: boolean;
}

const ClickUpContext = createContext<ClickUpContextType | undefined>(undefined);

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
    } catch (e) {
      console.error('Error fetching workspace:', e);
    } finally {
      setLoading(false);
    }
  };

  const addSpace = async (name: string, color: string, icon: string) => {
    await supabase.from('clickup_spaces').insert([{ name, color, icon }]);
    fetchWorkspaceData();
  };

  const addList = async (space_id: string, name: string) => {
    await supabase.from('clickup_lists').insert([{ space_id, name, color: '#94a3b8' }]);
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
      addSpace, addList, addTask, updateTaskStatus, updateTaskField, addField, loading
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
