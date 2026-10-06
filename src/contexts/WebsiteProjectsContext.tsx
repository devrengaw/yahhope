import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { YAHHopeProject, mockYAHHopeProjects } from '../lib/mockData';

interface WebsiteProjectsContextType {
  projects: YAHHopeProject[];
  loading: boolean;
  addProject: (data: Omit<YAHHopeProject, 'id' | 'created_at'>) => Promise<YAHHopeProject>;
  updateProject: (id: string, updates: Partial<YAHHopeProject>) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
  resetToDefaults: () => Promise<void>;
}

const WebsiteProjectsContext = createContext<WebsiteProjectsContextType | undefined>(undefined);

const STORAGE_KEY = 'yah_hope_website_projects_v1';

export function WebsiteProjectsProvider({ children }: { children: React.ReactNode }) {
  const [projects, setProjects] = useState<YAHHopeProject[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map((p: any) => {
            const def = mockYAHHopeProjects.find(m => m.id === p.id);
            return {
              ...def,
              ...p,
              full_description: p.full_description || def?.full_description || '',
              location: p.location || def?.location || '',
              coordinator: p.coordinator || def?.coordinator || '',
              beneficiaries_target: p.beneficiaries_target || def?.beneficiaries_target || '',
              beneficiaries_reached: p.beneficiaries_reached || def?.beneficiaries_reached || '',
              gallery_images: p.gallery_images || def?.gallery_images || [],
              admin_notes: p.admin_notes || def?.admin_notes || '',
            };
          });
        }
      }
    } catch (e) {
      console.warn('Failed to parse website projects from localStorage', e);
    }
    return mockYAHHopeProjects;
  });

  const [loading, setLoading] = useState(false);

  // Sync to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
    } catch (e) {
      console.warn('Failed to save website projects to localStorage', e);
    }
  }, [projects]);

  // Load from Supabase if table exists
  useEffect(() => {
    let isMounted = true;
    async function loadFromSupabase() {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('website_projects')
          .select('*');

        if (!error && data && data.length > 0 && isMounted) {
          const sorted = [...data].sort((a, b) => (Number(a.order) || 0) - (Number(b.order) || 0));
          setProjects(sorted.map(p => ({
            id: p.id,
            title: p.title,
            description: p.description || '',
            full_description: p.full_description || '',
            category: p.category || 'Geral',
            tag_color: p.tag_color || '#F49853',
            link: p.link || '/projetos',
            status: p.status || 'active',
            image_url: p.image_url || 'https://hope.yahchurch.com/wp-content/uploads/2025/09/HOPE-ALFACES.avif',
            location: p.location || '',
            coordinator: p.coordinator || '',
            beneficiaries_target: p.beneficiaries_target || '',
            beneficiaries_reached: p.beneficiaries_reached || '',
            gallery_images: Array.isArray(p.gallery_images) ? p.gallery_images : [],
            admin_notes: p.admin_notes || '',
            start_date: p.start_date || '',
            created_at: p.created_at || new Date().toISOString(),
            order: p.order || 0
          })));
        }
      } catch {
        // Fallback to localStorage state
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadFromSupabase();

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          if (Array.isArray(parsed)) {
            setProjects(parsed);
          }
        } catch {}
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => {
      isMounted = false;
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const addProject = async (data: Omit<YAHHopeProject, 'id' | 'created_at'>): Promise<YAHHopeProject> => {
    const newId = `proj-${Date.now().toString(36)}`;
    const newProject: YAHHopeProject = {
      ...data,
      id: newId,
      created_at: new Date().toISOString(),
      order: projects.length + 1
    };

    setProjects(prev => [...prev, newProject]);

    try {
      await supabase.from('website_projects').insert([newProject]);
    } catch {}

    return newProject;
  };

  const updateProject = async (id: string, updates: Partial<YAHHopeProject>) => {
    setProjects(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));

    try {
      await supabase.from('website_projects').update(updates).eq('id', id);
    } catch {}
  };

  const deleteProject = async (id: string) => {
    setProjects(prev => prev.filter(p => p.id !== id));

    try {
      await supabase.from('website_projects').delete().eq('id', id);
    } catch {}
  };

  const resetToDefaults = async () => {
    setProjects(mockYAHHopeProjects);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(mockYAHHopeProjects));
    } catch {}
  };

  return (
    <WebsiteProjectsContext.Provider value={{
      projects,
      loading,
      addProject,
      updateProject,
      deleteProject,
      resetToDefaults
    }}>
      {children}
    </WebsiteProjectsContext.Provider>
  );
}

export function useWebsiteProjects() {
  const context = useContext(WebsiteProjectsContext);
  if (!context) {
    throw new Error('useWebsiteProjects must be used within a WebsiteProjectsProvider');
  }
  return context;
}
