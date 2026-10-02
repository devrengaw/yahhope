import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export interface Announcement {
  id: string;
  title: string;
  content: string;
  date: string;
  author: string;
  targetTeam: string; // e.g. 'Comunicação', 'Saúde', 'Todos', 'Geral'
}

interface AnnouncementContextType {
  announcements: Announcement[];
  addAnnouncement: (announcement: Announcement) => Promise<void>;
  deleteAnnouncement: (id: string) => Promise<void>;
}

const AnnouncementContext = createContext<AnnouncementContextType | undefined>(undefined);

const STORAGE_KEY = 'yah_hope_announcements_v2';

export function AnnouncementProvider({ children }: { children: React.ReactNode }) {
  const [announcements, setAnnouncements] = useState<Announcement[]>(() => {
    try {
      const cached = localStorage.getItem(STORAGE_KEY);
      return cached ? JSON.parse(cached) : [];
    } catch (e) {
      return [];
    }
  });

  const saveToStorage = (items: Announcement[]) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch (e) {
      console.warn('Could not save announcements to localStorage', e);
    }
  };

  useEffect(() => {
    fetchAnnouncements();

    try {
      const sub = supabase.channel('announcements_updates')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'announcements' }, () => {
          fetchAnnouncements();
        })
        .subscribe();

      return () => { supabase.removeChannel(sub); };
    } catch (e) {
      console.warn('Realtime subscription not available for announcements', e);
    }
  }, []);

  const fetchAnnouncements = async () => {
    try {
      const { data, error } = await supabase
        .from('announcements')
        .select('*')
        .order('date', { ascending: false });

      if (!error && data && Array.isArray(data)) {
        const formatted = data.map(a => ({
          id: a.id,
          title: a.title,
          content: a.content,
          date: a.date,
          author: a.author_name || a.author || 'Administrador',
          targetTeam: a.targetTeam || 'Todos'
        }));
        setAnnouncements(formatted);
        saveToStorage(formatted);
      }
    } catch (e) {
      console.warn('Error fetching announcements from Supabase, keeping cached:', e);
    }
  };

  const addAnnouncement = async (announcement: Announcement) => {
    const tempId = announcement.id || (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `ann_${Date.now()}`);
    const newNotice = { ...announcement, id: tempId };

    setAnnouncements(prev => {
      const updated = [newNotice, ...prev];
      saveToStorage(updated);
      return updated;
    });

    try {
      const { data } = await supabase.from('announcements').insert([{
        id: newNotice.id,
        title: newNotice.title,
        content: newNotice.content,
        date: newNotice.date || new Date().toISOString(),
        type: 'info',
        priority: 'normal',
        author_id: 'unknown',
        author_name: newNotice.author,
        targetTeam: newNotice.targetTeam
      }]).select().single();
      
      if (data) {
        setAnnouncements(prev => {
          const updated = prev.map(a => a.id === tempId ? { ...a, id: data.id } : a);
          saveToStorage(updated);
          return updated;
        });
      }
    } catch (e) {
      console.warn('Could not insert announcement into Supabase, saved to localStorage:', e);
    }
  };

  const deleteAnnouncement = async (id: string) => {
    setAnnouncements(prev => {
      const updated = prev.filter(a => a.id !== id);
      saveToStorage(updated);
      return updated;
    });

    try {
      await supabase.from('announcements').delete().eq('id', id);
    } catch (e) {
      console.warn('Could not delete announcement in Supabase:', e);
    }
  };

  return (
    <AnnouncementContext.Provider value={{ announcements, addAnnouncement, deleteAnnouncement }}>
      {children}
    </AnnouncementContext.Provider>
  );
}

export function useAnnouncements() {
  const context = useContext(AnnouncementContext);
  if (context === undefined) {
    throw new Error('useAnnouncements must be used within an AnnouncementProvider');
  }
  return context;
}
