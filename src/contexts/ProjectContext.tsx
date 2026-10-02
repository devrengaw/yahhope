import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { Project, ProjectTask, ColumnDefinition, ColumnType, PersonalActivity } from '../lib/mockData';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';

const LOCAL_STORAGE_PROJECTS_KEY = 'yah_hope_projects_v2';
const LOCAL_STORAGE_ACTIVITIES_KEY = 'yah_hope_activities_v2';

export const isSuperAdminUser = (u: any): boolean => {
  if (!u) return false;
  const role = (u.role || '').toUpperCase();
  const email = (u.email || '').toLowerCase();
  return role === 'ADMIN' || role === 'MASTER' || email === 'contato@yahhope.com';
};

export const canUserAccessProject = (project: Project, u: any): boolean => {
  if (!u) return false;
  if (isSuperAdminUser(u)) return true;

  const uId = String(u.id || '');
  const uEmail = String(u.email || '').toLowerCase();
  const uName = String(u.name || '').toLowerCase();

  const pCreator = String(project.created_by || '');
  const pCreatorLower = pCreator.toLowerCase();

  // Created by user id or email
  if (pCreator && (pCreator === uId || pCreatorLower === uEmail)) return true;
  // Created by user name
  if (uName && project.created_by_name && project.created_by_name.toLowerCase() === uName) return true;

  // Invitees
  const invitees = Array.isArray(project.invitees) ? project.invitees : [];
  if (
    invitees.includes(uId) || 
    (u.name && invitees.includes(u.name)) || 
    (u.email && invitees.some((inv: string) => String(inv).toLowerCase() === uEmail))
  ) {
    return true;
  }

  // Assigned to any task
  const peopleCols = (project.columns || []).filter(c => c.type === 'people').map(c => c.id);
  const isAssigned = (project.tasks || []).some(t => {
    return peopleCols.some(colId => {
      const assigned = t.values?.[colId] || [];
      return Array.isArray(assigned) && (assigned.includes(uId) || (u.name && assigned.includes(u.name)));
    });
  });
  if (isAssigned) return true;

  // Fallback for legacy projects without creator that aren't private
  if (!project.created_by && !project.isPrivate) return true;

  return false;
};

const defaultColumns: ColumnDefinition[] = [
  { id: 'c1', name: 'Status', type: 'status', options: ['Todo', 'Working on it', 'Stuck', 'Done'] },
  { id: 'c2', name: 'Owner', type: 'people' },
  { id: 'c3', name: 'Timeline', type: 'date' },
];

interface ProjectContextType {
  projects: Project[];
  rawProjects: Project[];
  activities: PersonalActivity[];
  isLoaded: boolean;
  addProject: (project: Project) => Promise<void>;
  updateProject: (id: string, updates: Partial<Project>) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
  
  // Activity operations
  addActivity: (activity: PersonalActivity) => void;
  deleteActivity: (id: string) => void;
  
  // Column operations
  addColumn: (projectId: string, column: ColumnDefinition) => Promise<void>;
  updateColumn: (projectId: string, columnId: string, updates: Partial<ColumnDefinition>) => Promise<void>;
  deleteColumn: (projectId: string, columnId: string) => Promise<void>;
  
  // Task operations
  addTask: (projectId: string, task: ProjectTask) => Promise<void>;
  updateTask: (projectId: string, taskId: string, updates: Partial<ProjectTask>) => Promise<void>;
  updateTaskValue: (projectId: string, taskId: string, columnId: string, value: any) => Promise<void>;
  deleteTask: (projectId: string, taskId: string) => Promise<void>;

  canAccessProject: (project: Project) => boolean;
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

export function ProjectProvider({ children }: { children: React.ReactNode }) {
  const [rawProjects, setRawProjects] = useState<Project[]>(() => {
    try {
      const cached = localStorage.getItem(LOCAL_STORAGE_PROJECTS_KEY);
      return cached ? JSON.parse(cached) : [];
    } catch (e) {
      return [];
    }
  });

  const [activities, setActivities] = useState<PersonalActivity[]>(() => {
    try {
      const cached = localStorage.getItem(LOCAL_STORAGE_ACTIVITIES_KEY);
      return cached ? JSON.parse(cached) : [];
    } catch (e) {
      return [];
    }
  });

  const [isLoaded, setIsLoaded] = useState(false);
  const { user } = useAuth();

  // Save to local storage whenever rawProjects changes
  const saveProjectsToStorage = (updated: Project[]) => {
    try {
      localStorage.setItem(LOCAL_STORAGE_PROJECTS_KEY, JSON.stringify(updated));
    } catch (e) {
      console.error('Error saving projects to localStorage', e);
    }
  };

  const saveActivitiesToStorage = (updated: PersonalActivity[]) => {
    try {
      localStorage.setItem(LOCAL_STORAGE_ACTIVITIES_KEY, JSON.stringify(updated));
    } catch (e) {
      console.error('Error saving activities to localStorage', e);
    }
  };

  useEffect(() => {
    if (user) {
      fetchProjects();
    }
  }, [user]);

  const fetchProjects = async () => {
    try {
      const { data: projData, error: projErr } = await supabase.from('projects').select('*');
      const { data: taskData } = await supabase.from('project_tasks').select('*');
      
      if (!projErr && projData && Array.isArray(projData)) {
        const formattedProjects: Project[] = projData.map(p => {
          const pTasks = taskData ? taskData.filter(t => t.project_id === p.id) : [];
          
          return {
            id: p.id,
            name: p.name,
            description: p.description || '',
            status: p.status as any || 'planning',
            progress: p.progress || 0,
            start_date: p.start_date || '',
            end_date: p.end_date || '',
            budget: p.budget || 0,
            isPrivate: !!p.is_private,
            category: p.category || 'Geral',
            priority: p.priority as any || 'medium',
            invitees: Array.isArray(p.invitees) ? p.invitees : [],
            columns: Array.isArray(p.columns) && p.columns.length > 0 ? p.columns : defaultColumns,
            module: (p.module as any) || 'admin',
            created_by: p.created_by,
            created_by_name: p.created_by_name,
            notes: p.notes,
            enablePortalUpdates: p.enable_portal_updates,
            tasks: pTasks.map(t => ({
              id: t.id,
              title: t.title,
              description: t.description || '',
              status: t.status as any || 'todo',
              cost: t.cost || 0,
              subtasks: Array.isArray(t.subtasks) ? t.subtasks : [],
              invitees: Array.isArray(t.invitees) ? t.invitees : [],
              priority: t.priority as any || 'medium',
              values: t.values || {}
            }))
          };
        });

        // Merge with local projects that might not yet be synced to Supabase
        setRawProjects(prev => {
          const remoteIds = new Set(formattedProjects.map(p => p.id));
          const localOnly = prev.filter(p => !remoteIds.has(p.id));
          const merged = [...formattedProjects, ...localOnly];
          saveProjectsToStorage(merged);
          return merged;
        });
      } else {
        // Supabase table may not exist or error returned; preserve local cache
        if (projErr) {
          console.warn('Supabase projects table query returned error (using local storage cache):', projErr.message);
        }
      }
      setIsLoaded(true);
    } catch (e) {
      console.warn('Error fetching projects from Supabase, keeping cached projects:', e);
      setIsLoaded(true);
    }
  };

  const addProject = async (project: Project) => {
    const finalId = project.id || `proj_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const newProject: Project = {
      ...project,
      id: finalId,
      created_by: project.created_by || user?.id || user?.email || 'admin',
      created_by_name: project.created_by_name || user?.name || user?.email || 'Administrador',
      module: project.module || 'admin',
      columns: project.columns && project.columns.length > 0 ? project.columns : defaultColumns,
      tasks: project.tasks || []
    };

    setRawProjects(prev => {
      const updated = [newProject, ...prev];
      saveProjectsToStorage(updated);
      return updated;
    });

    // Try Supabase insert
    try {
      const { data, error } = await supabase.from('projects').insert({
        id: newProject.id,
        name: newProject.name,
        description: newProject.description,
        status: newProject.status,
        progress: newProject.progress || 0,
        start_date: newProject.start_date || null,
        end_date: newProject.end_date || null,
        budget: newProject.budget || 0,
        is_private: newProject.isPrivate || false,
        category: newProject.category || 'Geral',
        priority: newProject.priority || 'medium',
        invitees: newProject.invitees || [],
        columns: newProject.columns,
        module: newProject.module,
        created_by: newProject.created_by,
        created_by_name: newProject.created_by_name,
        notes: newProject.notes || '',
        enable_portal_updates: newProject.enablePortalUpdates || false
      }).select().single();

      if (!error && data) {
        // Persist initial tasks if any
        if (newProject.tasks && newProject.tasks.length > 0) {
          for (const t of newProject.tasks) {
            await supabase.from('project_tasks').insert({
              id: t.id,
              project_id: data.id,
              title: t.title,
              description: t.description || '',
              status: t.status,
              priority: t.priority,
              cost: t.cost || 0,
              subtasks: t.subtasks || [],
              invitees: t.invitees || [],
              values: t.values || {}
            });
          }
        }
      }

      // Finance integration if budget > 0
      if (newProject.budget && newProject.budget > 0) {
        await supabase.from('finance_transactions').insert({
          description: `Orçamento: ${newProject.name}`,
          amount: newProject.budget,
          type: 'expense',
          date: newProject.start_date || new Date().toISOString(),
          status: 'pending',
          account: 'Banco YAH Hope',
          expense_type: 'variable'
        });
      }
    } catch (e) {
      console.warn('Could not insert project into Supabase, safely kept in localStorage:', e);
    }
  };

  const updateProject = async (id: string, updates: Partial<Project>) => {
    setRawProjects(prev => {
      const updated = prev.map(p => p.id === id ? { ...p, ...updates } : p);
      saveProjectsToStorage(updated);
      return updated;
    });

    try {
      await supabase.from('projects').update({
        name: updates.name,
        description: updates.description,
        status: updates.status,
        progress: updates.progress,
        start_date: updates.start_date || null,
        end_date: updates.end_date || null,
        budget: updates.budget,
        is_private: updates.isPrivate,
        category: updates.category,
        priority: updates.priority,
        invitees: updates.invitees,
        columns: updates.columns,
        module: updates.module,
        notes: updates.notes,
        enable_portal_updates: updates.enablePortalUpdates
      }).eq('id', id);
    } catch (e) {
      console.warn('Could not update project in Supabase:', e);
    }
  };

  const deleteProject = async (id: string) => {
    setRawProjects(prev => {
      const updated = prev.filter(p => p.id !== id);
      saveProjectsToStorage(updated);
      return updated;
    });

    try {
      await supabase.from('projects').delete().eq('id', id);
    } catch (e) {
      console.warn('Could not delete project in Supabase:', e);
    }
  };

  const addActivity = (activity: PersonalActivity) => {
    setActivities(prev => {
      const updated = [activity, ...prev];
      saveActivitiesToStorage(updated);
      return updated;
    });
  };

  const deleteActivity = (id: string) => {
    setActivities(prev => {
      const updated = prev.filter(a => a.id !== id);
      saveActivitiesToStorage(updated);
      return updated;
    });
  };

  const addColumn = async (projectId: string, column: ColumnDefinition) => {
    let updatedColumns: ColumnDefinition[] = [];
    setRawProjects(prev => {
      const updated = prev.map(p => {
        if (p.id === projectId) {
          updatedColumns = [...(p.columns || []), column];
          return { ...p, columns: updatedColumns };
        }
        return p;
      });
      saveProjectsToStorage(updated);
      return updated;
    });

    try {
      await supabase.from('projects').update({ columns: updatedColumns }).eq('id', projectId);
    } catch (e) {
      console.warn('Could not update columns in Supabase:', e);
    }
  };

  const updateColumn = async (projectId: string, columnId: string, updates: Partial<ColumnDefinition>) => {
    let updatedColumns: ColumnDefinition[] = [];
    setRawProjects(prev => {
      const updated = prev.map(p => {
        if (p.id === projectId && p.columns) {
          updatedColumns = p.columns.map(c => c.id === columnId ? { ...c, ...updates } : c);
          return { ...p, columns: updatedColumns };
        }
        return p;
      });
      saveProjectsToStorage(updated);
      return updated;
    });

    try {
      await supabase.from('projects').update({ columns: updatedColumns }).eq('id', projectId);
    } catch (e) {
      console.warn('Could not update columns in Supabase:', e);
    }
  };

  const deleteColumn = async (projectId: string, columnId: string) => {
    let updatedColumns: ColumnDefinition[] = [];
    setRawProjects(prev => {
      const updated = prev.map(p => {
        if (p.id === projectId && p.columns) {
          updatedColumns = p.columns.filter(c => c.id !== columnId);
          return {
            ...p,
            columns: updatedColumns,
            tasks: p.tasks.map(t => {
              const newValues = { ...t.values };
              delete newValues[columnId];
              return { ...t, values: newValues };
            })
          };
        }
        return p;
      });
      saveProjectsToStorage(updated);
      return updated;
    });

    try {
      await supabase.from('projects').update({ columns: updatedColumns }).eq('id', projectId);
    } catch (e) {
      console.warn('Could not delete column in Supabase:', e);
    }
  };

  const addTask = async (projectId: string, task: ProjectTask) => {
    const finalTaskId = task.id || `task_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const fullTask: ProjectTask = { ...task, id: finalTaskId };

    setRawProjects(prev => {
      const updated = prev.map(p => {
        if (p.id === projectId) {
          return { ...p, tasks: [...(p.tasks || []), fullTask] };
        }
        return p;
      });
      saveProjectsToStorage(updated);
      return updated;
    });

    try {
      await supabase.from('project_tasks').insert({
        id: fullTask.id,
        project_id: projectId,
        title: fullTask.title,
        description: fullTask.description || '',
        status: fullTask.status,
        priority: fullTask.priority,
        cost: fullTask.cost || 0,
        subtasks: fullTask.subtasks || [],
        invitees: fullTask.invitees || [],
        values: fullTask.values || {}
      });
    } catch (e) {
      console.warn('Could not insert task in Supabase:', e);
    }
  };

  const updateTask = async (projectId: string, taskId: string, updates: Partial<ProjectTask>) => {
    setRawProjects(prev => {
      const updated = prev.map(p => {
        if (p.id === projectId) {
          return {
            ...p,
            tasks: p.tasks.map(t => t.id === taskId ? { ...t, ...updates } : t)
          };
        }
        return p;
      });
      saveProjectsToStorage(updated);
      return updated;
    });

    try {
      await supabase.from('project_tasks').update({
        title: updates.title,
        description: updates.description,
        status: updates.status,
        priority: updates.priority,
        cost: updates.cost,
        subtasks: updates.subtasks,
        invitees: updates.invitees,
        values: updates.values
      }).eq('id', taskId);
    } catch (e) {
      console.warn('Could not update task in Supabase:', e);
    }
  };

  const updateTaskValue = async (projectId: string, taskId: string, columnId: string, value: any) => {
    let updatedValues = {};
    setRawProjects(prev => {
      const updated = prev.map(p => {
        if (p.id === projectId) {
          return {
            ...p,
            tasks: p.tasks.map(t => {
              if (t.id === taskId) {
                if (columnId === 'title') {
                  return { ...t, title: value };
                } else {
                  updatedValues = { ...t.values, [columnId]: value };
                  return { ...t, values: updatedValues };
                }
              }
              return t;
            })
          };
        }
        return p;
      });
      saveProjectsToStorage(updated);
      return updated;
    });
    
    try {
      if (columnId === 'title') {
        await supabase.from('project_tasks').update({ title: value }).eq('id', taskId);
      } else {
        await supabase.from('project_tasks').update({ values: updatedValues }).eq('id', taskId);
      }
    } catch (e) {
      console.warn('Could not update task value in Supabase:', e);
    }
  };

  const deleteTask = async (projectId: string, taskId: string) => {
    setRawProjects(prev => {
      const updated = prev.map(p => {
        if (p.id === projectId) {
          return {
            ...p,
            tasks: p.tasks.filter(t => t.id !== taskId)
          };
        }
        return p;
      });
      saveProjectsToStorage(updated);
      return updated;
    });
    
    try {
      await supabase.from('project_tasks').delete().eq('id', taskId);
    } catch (e) {
      console.warn('Could not delete task in Supabase:', e);
    }
  };

  const canAccessProject = (project: Project): boolean => {
    return canUserAccessProject(project, user);
  };

  // Expose projects filtered by access rules (Super Admin sees all, creators see theirs)
  const accessibleProjects = useMemo(() => {
    if (!user) return [];
    if (isSuperAdminUser(user)) {
      return rawProjects;
    }
    return rawProjects.filter(p => canUserAccessProject(p, user));
  }, [rawProjects, user]);

  return (
    <ProjectContext.Provider value={{ 
      projects: accessibleProjects, 
      rawProjects,
      activities,
      isLoaded,
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
      deleteTask,
      canAccessProject
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

export const useProject = useProjects;
