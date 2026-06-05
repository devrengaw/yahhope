import React, { createContext, useContext, useState, useEffect } from 'react';

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

const mockAnnouncements: Announcement[] = [];

export function AnnouncementProvider({ children }: { children: React.ReactNode }) {
  const [announcements, setAnnouncements] = useState<Announcement[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : mockAnnouncements;
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(announcements));
  }, [announcements]);

  const addAnnouncement = (announcement: Announcement) => {
    setAnnouncements(prev => [announcement, ...prev]);
  };

  const deleteAnnouncement = (id: string) => {
    setAnnouncements(prev => prev.filter(a => a.id !== id));
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
