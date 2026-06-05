import React, { createContext, useContext, useState, useEffect } from 'react';
import { Project, mockProjects, ProjectTask, ColumnDefinition, ColumnType, PersonalActivity } from '../lib/mockData';

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

const STORAGE_KEY = 'yah_hope_projects';
const ACTIVITIES_KEY = 'yah_hope_activities';

export function ProjectProvider({ children }: { children: React.ReactNode }) {
  const [projects, setProjects] = useState<Project[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.length > 0 && !parsed[0].columns) {
        return mockProjects;
      }
      return parsed;
    }
    return mockProjects;
  });

  const [activities, setActivities] = useState<PersonalActivity[]>(() => {
    const saved = localStorage.getItem(ACTIVITIES_KEY);
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
  }, [projects]);

  useEffect(() => {
    localStorage.setItem(ACTIVITIES_KEY, JSON.stringify(activities));
  }, [activities]);

  const addProject = (project: Project) => {
    setProjects(prev => [...prev, project]);
  };

  const updateProject = (id: string, updates: Partial<Project>) => {
    setProjects(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
  };

  const deleteProject = (id: string) => {
    setProjects(prev => prev.filter(p => p.id !== id));
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
        return { ...p, columns: [...p.columns, column] };
      }
      return p;
    }));
  };

  const updateColumn = (projectId: string, columnId: string, updates: Partial<ColumnDefinition>) => {
    setProjects(prev => prev.map(p => {
      if (p.id === projectId) {
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
      if (p.id === projectId) {
        return {
          ...p,
          columns: p.columns.filter(c => c.id !== columnId),
          // Also clean up task values for this column
          tasks: p.tasks.map(t => {
            const { [columnId]: removed, ...rest } = t.values;
            return { ...t, values: rest };
          })
        };
      }
      return p;
    }));
  };

  const addTask = (projectId: string, task: ProjectTask) => {
    setProjects(prev => prev.map(p => {
      if (p.id === projectId) {
        return { ...p, tasks: [...(p.tasks || []), task] };
      }
      return p;
    }));
  };

  const updateTask = (projectId: string, taskId: string, updates: Partial<ProjectTask>) => {
    setProjects(prev => prev.map(p => {
      if (p.id === projectId) {
        return {
          ...p,
          tasks: p.tasks.map(t => t.id === taskId ? { ...t, ...updates } : t)
        };
      }
      return p;
    }));
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

  const deleteTask = (projectId: string, taskId: string) => {
    setProjects(prev => prev.map(p => {
      if (p.id === projectId) {
        return {
          ...p,
          tasks: p.tasks.filter(t => t.id !== taskId)
        };
      }
      return p;
    }));
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
