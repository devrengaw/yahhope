import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../lib/supabase';

export interface NewsletterSubscriber {
  id: string;
  email: string;
  created_at: string;
  status: 'active' | 'unsubscribed';
  source: string;
}

const STORAGE_KEY = 'yah_hope_newsletter_subscribers_v1';

export const INITIAL_SUBSCRIBERS: NewsletterSubscriber[] = [
  {
    id: 'sub-1',
    email: 'carolina.simionato@yahchurch.com',
    created_at: '2026-09-15T14:32:00.000Z',
    status: 'active',
    source: 'Landing Page'
  },
  {
    id: 'sub-2',
    email: 'contato.apoiador@missaomocambique.org',
    created_at: '2026-09-28T10:15:00.000Z',
    status: 'active',
    source: 'Landing Page'
  }
];

interface NewsletterContextType {
  subscribers: NewsletterSubscriber[];
  loading: boolean;
  addSubscriber: (email: string, source?: string) => Promise<{ success: boolean; message: string; alreadyExisted?: boolean }>;
  removeSubscriber: (id: string) => Promise<void>;
  toggleStatus: (id: string) => Promise<void>;
  exportToCSV: () => void;
  copyAllEmails: () => Promise<boolean>;
}

const NewsletterContext = createContext<NewsletterContextType | undefined>(undefined);

export function NewsletterProvider({ children }: { children: ReactNode }) {
  const [subscribers, setSubscribers] = useState<NewsletterSubscriber[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Failed to parse newsletter subscribers from localStorage', e);
    }
    return INITIAL_SUBSCRIBERS;
  });

  const [loading, setLoading] = useState(false);

  // Sync state to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(subscribers));
    } catch (e) {
      console.warn('Failed to save newsletter subscribers to localStorage', e);
    }
  }, [subscribers]);

  // Attempt to load and sync with Supabase table
  useEffect(() => {
    let isMounted = true;

    async function loadFromSupabase() {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('newsletter_subscribers')
          .select('*')
          .order('created_at', { ascending: false });

        if (!error && data && data.length > 0 && isMounted) {
          setSubscribers(data.map((item: any) => ({
            id: String(item.id),
            email: item.email,
            created_at: item.created_at || new Date().toISOString(),
            status: item.status || 'active',
            source: item.source || 'Landing Page'
          })));
        }
      } catch (err) {
        // Fallback to local storage
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadFromSupabase();

    // Cross-tab sync
    const handleStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          if (Array.isArray(parsed)) {
            setSubscribers(parsed);
          }
        } catch {}
      }
    };

    window.addEventListener('storage', handleStorage);
    return () => {
      isMounted = false;
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  const addSubscriber = async (
    email: string, 
    source = 'Landing Page'
  ): Promise<{ success: boolean; message: string; alreadyExisted?: boolean }> => {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      return { success: false, message: 'Por favor, insira um e-mail válido.' };
    }

    const existingIndex = subscribers.findIndex(s => s.email.toLowerCase() === cleanEmail);
    if (existingIndex >= 0) {
      const existing = subscribers[existingIndex];
      if (existing.status === 'unsubscribed') {
        // Reactivate
        const updated: NewsletterSubscriber = { ...existing, status: 'active' };
        setSubscribers(prev => prev.map(s => s.id === existing.id ? updated : s));
        try {
          await supabase
            .from('newsletter_subscribers')
            .update({ status: 'active' })
            .eq('id', existing.id);
        } catch {}
        return { success: true, message: 'Sua inscrição foi reativada com sucesso!', alreadyExisted: true };
      }
      return { success: true, message: 'Este e-mail já está inscrito em nossa newsletter!', alreadyExisted: true };
    }

    const newSubscriber: NewsletterSubscriber = {
      id: `sub-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
      email: cleanEmail,
      created_at: new Date().toISOString(),
      status: 'active',
      source
    };

    setSubscribers(prev => [newSubscriber, ...prev]);

    try {
      await supabase.from('newsletter_subscribers').insert([{
        id: newSubscriber.id,
        email: newSubscriber.email,
        created_at: newSubscriber.created_at,
        status: newSubscriber.status,
        source: newSubscriber.source
      }]);
    } catch {}

    return { success: true, message: 'Inscrição realizada com sucesso!' };
  };

  const removeSubscriber = async (id: string) => {
    setSubscribers(prev => prev.filter(s => s.id !== id));
    try {
      await supabase.from('newsletter_subscribers').delete().eq('id', id);
    } catch {}
  };

  const toggleStatus = async (id: string) => {
    let nextStatus: 'active' | 'unsubscribed' = 'active';
    setSubscribers(prev => prev.map(s => {
      if (s.id === id) {
        nextStatus = s.status === 'active' ? 'unsubscribed' : 'active';
        return { ...s, status: nextStatus };
      }
      return s;
    }));

    try {
      await supabase
        .from('newsletter_subscribers')
        .update({ status: nextStatus })
        .eq('id', id);
    } catch {}
  };

  const exportToCSV = () => {
    if (subscribers.length === 0) return;

    const headers = ['E-mail', 'Data de Inscrição', 'Origem', 'Status'];
    const rows = subscribers.map(s => [
      s.email,
      new Date(s.created_at).toLocaleString('pt-BR'),
      s.source,
      s.status === 'active' ? 'Ativo' : 'Descadastrado'
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' 
      + [headers, ...rows].map(e => e.map(item => `"${(item || '').toString().replace(/"/g, '""')}"`).join(',')).join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `yah_hope_newsletter_inscritos_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const copyAllEmails = async (): Promise<boolean> => {
    const activeEmails = subscribers
      .filter(s => s.status === 'active')
      .map(s => s.email)
      .join(', ');

    if (!activeEmails) return false;

    try {
      await navigator.clipboard.writeText(activeEmails);
      return true;
    } catch {
      return false;
    }
  };

  return (
    <NewsletterContext.Provider value={{
      subscribers,
      loading,
      addSubscriber,
      removeSubscriber,
      toggleStatus,
      exportToCSV,
      copyAllEmails
    }}>
      {children}
    </NewsletterContext.Provider>
  );
}

export function useNewsletter() {
  const context = useContext(NewsletterContext);
  if (!context) {
    throw new Error('useNewsletter must be used within a NewsletterProvider');
  }
  return context;
}
