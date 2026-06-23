import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export interface Announcement {
  id: string;
  title: string;
  content: string;
  date: string;
  author: string;
  targetTeam: string; // e.g. 'Comunicação', 'Saúde', 'Todos'
}

interface AnnouncementContextType {
  announcements: Announcement[];
  addAnnouncement: (announcement: Announcement) => void;
  deleteAnnouncement: (id: string) => void;
}

const AnnouncementContext = createContext<AnnouncementContextType | undefined>(undefined);

const STORAGE_KEY = 'yah_hope_announcements';

export function AnnouncementProvider({ children }: { children: React.ReactNode }) {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);

  useEffect(() => {
    fetchAnnouncements();

    const sub = supabase.channel('announcements_updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'announcements' }, () => {
        fetchAnnouncements();
      })
      .subscribe();

    return () => { supabase.removeChannel(sub); };
  }, []);

  const fetchAnnouncements = async () => {
    const { data } = await supabase.from('announcements').select('*').order('date', { ascending: false });
    if (data) {
      setAnnouncements(data.map(a => ({
        id: a.id,
        title: a.title,
        content: a.content,
        date: a.date,
        author: a.author_name,
        targetTeam: a.targetTeam || 'Todos' // backward compat mapping
      })));
    }
  };

  const addAnnouncement = async (announcement: Announcement) => {
    const tempId = Math.random().toString();
    setAnnouncements(prev => [{ ...announcement, id: tempId }, ...prev]);

    const { data } = await supabase.from('announcements').insert([{
      title: announcement.title,
      content: announcement.content,
      date: announcement.date,
      type: 'info',
      priority: 'normal',
      author_id: 'unknown',
      author_name: announcement.author,
      targetTeam: announcement.targetTeam
    }]).select().single();
    
    if (data) {
      setAnnouncements(prev => prev.map(a => a.id === tempId ? { ...a, id: data.id } : a));
    }
  };

  const deleteAnnouncement = async (id: string) => {
    setAnnouncements(prev => prev.filter(a => a.id !== id));
    await supabase.from('announcements').delete().eq('id', id);
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
