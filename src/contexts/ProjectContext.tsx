import React, { createContext, useContext, useState, useEffect } from 'react';
import { Project, mockProjects, ProjectTask, ColumnDefinition, ColumnType, PersonalActivity } from '../lib/mockData';
import { supabase } from '../lib/supabase';

import { useAuth } from './AuthContext';

interface ProjectContextType {
  projects: Project[];
  activities: PersonalActivity[];
  addProject: (project: Project) => void;
  updateProject: (id: string, updates: Partial<Project>) => void;
  deleteProject: (id: string) => void;
  
  // Activity operations
  addActivity: (activity: PersonalActivity) => void;
  deleteActivity: (id: string) => void;
  
  // Column operations
  addColumn: (projectId: string, column: ColumnDefinition) => void;
  updateColumn: (projectId: string, columnId: string, updates: Partial<ColumnDefinition>) => void;
  deleteColumn: (projectId: string, columnId: string) => void;
  
  // Task operations
  addTask: (projectId: string, task: ProjectTask) => void;
  updateTask: (projectId: string, taskId: string, updates: Partial<ProjectTask>) => void;
  updateTaskValue: (projectId: string, taskId: string, columnId: string, value: any) => void;
  deleteTask: (projectId: string, taskId: string) => void;
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

export function ProjectProvider({ children }: { children: React.ReactNode }) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [activities, setActivities] = useState<PersonalActivity[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchProjects();
    }
  }, [user]);

  const fetchProjects = async () => {
    try {
      const { data: projData } = await supabase.from('projects').select('*');
      const { data: taskData } = await supabase.from('project_tasks').select('*');
      
      const hasAdminPerm = user?.role === 'ADMIN' || user?.permissions.includes('management');
      
      if (projData) {
        let filteredProjData = projData;
        if (!hasAdminPerm && user) {
          // Filtrar projetos: só vê se for não-privado (opcional) ou se estiver na lista de invitees
          filteredProjData = projData.filter(p => {
            const invitees = Array.isArray(p.invitees) ? p.invitees : [];
            return !p.is_private || invitees.includes(user.name) || invitees.includes(user.id);
          });
        }

        const formattedProjects: Project[] = filteredProjData.map(p => {
          const pTasks = taskData ? taskData.filter(t => t.project_id === p.id) : [];
          
          return {
            id: p.id,
            name: p.name,
            description: p.description || '',
            status: p.status as any,
            progress: 0,
            start_date: p.start_date || '',
            end_date: p.end_date || '',
            budget: p.budget || 0,
            isPrivate: false,
            category: 'Geral',
            priority: 'medium',
            invitees: [],
            columns: [],
            tasks: pTasks.map(t => ({
              id: t.id,
              title: t.title,
              description: t.description || '',
              status: t.status as any,
              cost: t.cost || 0,
              subtasks: [],
              invitees: [],
              priority: t.priority as any,
              values: {}
            }))
          };
        });
        setProjects(formattedProjects);
      }
      setIsLoaded(true);
    } catch (e) {
      console.error('Error fetching projects', e);
    }
  };

  const addProject = async (project: Project) => {
    const tempId = project.id || Math.random().toString();
    setProjects(prev => [...prev, { ...project, id: tempId }]);

    const { data } = await supabase.from('projects').insert({
      name: project.name,
      description: project.description,
      status: project.status,
      start_date: project.start_date || null,
      end_date: project.end_date || null,
      budget: project.budget
    }).select().single();

    if (data) {
      setProjects(prev => prev.map(p => p.id === tempId ? { ...p, id: data.id } : p));
      
      // Integração com Finanças: se tiver orçamento, cria um lançamento de despesa pendente
      if (project.budget && project.budget > 0) {
        await supabase.from('finance_transactions').insert({
          description: `Orçamento: ${project.name}`,
          amount: project.budget,
          type: 'expense',
          date: project.start_date || new Date().toISOString(),
          status: 'pending',
          account: 'Banco YAH Hope',
          expense_type: 'variable'
        });
      }
    }
  };

  const updateProject = async (id: string, updates: Partial<Project>) => {
    setProjects(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
    if (id.length > 10) {
      await supabase.from('projects').update({
        name: updates.name,
        description: updates.description,
        status: updates.status,
        start_date: updates.start_date || null,
        end_date: updates.end_date || null,
        budget: updates.budget
      }).eq('id', id);
    }
  };

  const deleteProject = async (id: string) => {
    setProjects(prev => prev.filter(p => p.id !== id));
    if (id.length > 10) {
      await supabase.from('projects').delete().eq('id', id);
    }
  };

  const addActivity = (activity: PersonalActivity) => {
    setActivities(prev => [activity, ...prev]);
  };

  const deleteActivity = (id: string) => {
    setActivities(prev => prev.filter(a => a.id !== id));
  };

  const addColumn = (projectId: string, column: ColumnDefinition) => {
    setProjects(prev => prev.map(p => {
      if (p.id === projectId) {
        return { ...p, columns: [...(p.columns || []), column] };
      }
      return p;
    }));
  };

  const updateColumn = (projectId: string, columnId: string, updates: Partial<ColumnDefinition>) => {
    setProjects(prev => prev.map(p => {
      if (p.id === projectId && p.columns) {
        return {
          ...p,
          columns: p.columns.map(c => c.id === columnId ? { ...c, ...updates } : c)
        };
      }
      return p;
    }));
  };

  const deleteColumn = (projectId: string, columnId: string) => {
    setProjects(prev => prev.map(p => {
      if (p.id === projectId && p.columns) {
        return {
          ...p,
          columns: p.columns.filter(c => c.id !== columnId),
          tasks: p.tasks.map(t => {
            const newValues = { ...t.values };
            delete newValues[columnId];
            return { ...t, values: newValues };
          })
        };
      }
      return p;
    }));
  };

  const addTask = async (projectId: string, task: ProjectTask) => {
    const tempId = task.id || Math.random().toString();
    setProjects(prev => prev.map(p => {
      if (p.id === projectId) {
        return { ...p, tasks: [...(p.tasks || []), { ...task, id: tempId }] };
      }
      return p;
    }));

    if (projectId.length > 10) {
      const { data } = await supabase.from('project_tasks').insert({
        project_id: projectId,
        title: task.title,
        description: task.description,
        status: task.status,
        priority: task.priority,
        cost: task.cost
      }).select().single();

      if (data) {
        setProjects(prev => prev.map(p => {
          if (p.id === projectId) {
            return { ...p, tasks: p.tasks.map(t => t.id === tempId ? { ...t, id: data.id } : t) };
          }
          return p;
        }));
      }
    }
  };

  const updateTask = async (projectId: string, taskId: string, updates: Partial<ProjectTask>) => {
    setProjects(prev => prev.map(p => {
      if (p.id === projectId) {
        return {
          ...p,
          tasks: p.tasks.map(t => t.id === taskId ? { ...t, ...updates } : t)
        };
      }
      return p;
    }));

    if (taskId.length > 10) {
      await supabase.from('project_tasks').update({
        title: updates.title,
        description: updates.description,
        status: updates.status,
        priority: updates.priority,
        cost: updates.cost
      }).eq('id', taskId);
    }
  };

  const updateTaskValue = (projectId: string, taskId: string, columnId: string, value: any) => {
    setProjects(prev => prev.map(p => {
      if (p.id === projectId) {
        return {
          ...p,
          tasks: p.tasks.map(t => t.id === taskId ? { 
            ...t, 
            values: { ...t.values, [columnId]: value } 
          } : t)
        };
      }
      return p;
    }));
  };

  const deleteTask = async (projectId: string, taskId: string) => {
    setProjects(prev => prev.map(p => {
      if (p.id === projectId) {
        return {
          ...p,
          tasks: p.tasks.filter(t => t.id !== taskId)
        };
      }
      return p;
    }));
    
    if (taskId.length > 10) {
      await supabase.from('project_tasks').delete().eq('id', taskId);
    }
  };

  return (
    <ProjectContext.Provider value={{ 
      projects, 
      activities,
      addProject, 
      updateProject, 
      deleteProject,
      addColumn,
      updateColumn,
      deleteColumn,
      addActivity,
      deleteActivity,
      addTask, 
      updateTask, 
      updateTaskValue,
      deleteTask 
    }}>
      {children}
    </ProjectContext.Provider>
  );
}

export function useProjects() {
  const context = useContext(ProjectContext);
  if (context === undefined) {
    throw new Error('useProjects must be used within a ProjectProvider');
  }
  return context;
}
