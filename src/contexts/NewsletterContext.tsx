import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { isSpamOrMockUser } from '../utils/userCleanup';

export interface NewsletterSubscriber {
  id: string;
  email: string;
  created_at: string;
  status: 'active' | 'unsubscribed';
  source: string;
}

const STORAGE_KEY = 'yah_hope_newsletter_subscribers_v1';

export const INITIAL_SUBSCRIBERS: NewsletterSubscriber[] = [];

function isTestOrMockNewsletterEmail(email: string): boolean {
  const em = (email || '').toLowerCase().trim();
  if (!em || !em.includes('@')) return true;
  if (
    em === 'carolina.simionato@yahchurch.com' ||
    em === 'contato.apoiador@missaomocambique.org' ||
    em.includes('teste') ||
    em.includes('test@') ||
    em.includes('@test.') ||
    em.includes('mock') ||
    em.includes('fake') ||
    em.endsWith('@example.com') ||
    em.endsWith('@teste.com')
  ) {
    return true;
  }
  return isSpamOrMockUser({ email: em, name: '' });
}

interface NewsletterContextType {
  subscribers: NewsletterSubscriber[];
  loading: boolean;
  addSubscriber: (email: string, source?: string) => Promise<{ success: boolean; message: string; alreadyExisted?: boolean }>;
  removeSubscriber: (id: string) => Promise<void>;
  toggleStatus: (id: string) => Promise<void>;
  syncAllSiteEmails: () => Promise<{ added: number; total: number }>;
  purgeTestSubscribers: () => Promise<number>;
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
          return parsed.filter((s: any) => !isTestOrMockNewsletterEmail(s?.email));
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
          const cleanRows = data
            .filter((item: any) => !isTestOrMockNewsletterEmail(item.email))
            .map((item: any) => ({
              id: String(item.id),
              email: item.email,
              created_at: item.created_at || new Date().toISOString(),
              status: item.status || 'active',
              source: item.source || 'Landing Page'
            }));
          setSubscribers(cleanRows);
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

  const syncAllSiteEmails = async (): Promise<{ added: number; total: number }> => {
    const emailSourceMap = new Map<string, string>();

    try {
      const [usersRes, donationsRes, sponsorshipsRes, apoiadoresRes] = await Promise.all([
        supabase.from('users').select('name, email').not('email', 'is', null),
        supabase.from('donations').select('donor_email').not('donor_email', 'is', null),
        supabase.from('sponsorships').select('donor_email').not('donor_email', 'is', null),
        supabase.from('apoiadores').select('email, contato_email, mail')
      ]);

      (usersRes.data || []).forEach((u: any) => {
        if (isSpamOrMockUser(u)) return;
        const email = (u.email || '').toLowerCase().trim();
        if (email && email.includes('@')) {
          emailSourceMap.set(email, 'Cadastro no Site');
        }
      });

      (sponsorshipsRes.data || []).forEach((s: any) => {
        const email = (s.donor_email || '').toLowerCase().trim();
        if (email && email.includes('@') && !emailSourceMap.has(email)) {
          emailSourceMap.set(email, 'Apadrinhamento');
        }
      });

      (donationsRes.data || []).forEach((d: any) => {
        const email = (d.donor_email || '').toLowerCase().trim();
        if (email && email.includes('@') && !emailSourceMap.has(email)) {
          emailSourceMap.set(email, 'Doação');
        }
      });

      if (!apoiadoresRes.error && apoiadoresRes.data) {
        apoiadoresRes.data.forEach((a: any) => {
          const email = (a.email || a.contato_email || a.mail || '').toLowerCase().trim();
          if (email && email.includes('@') && !emailSourceMap.has(email)) {
            emailSourceMap.set(email, 'Apoiador');
          }
        });
      }

      const existingMap = new Set(subscribers.map(s => s.email.toLowerCase().trim()));
      const { data: dbSubs } = await supabase.from('newsletter_subscribers').select('email');
      (dbSubs || []).forEach((r: any) => {
        if (r.email) existingMap.add(r.email.toLowerCase().trim());
      });

      const toInsert: NewsletterSubscriber[] = [];
      emailSourceMap.forEach((source, email) => {
        if (!existingMap.has(email)) {
          toInsert.push({
            id: `sub_${crypto.randomUUID ? crypto.randomUUID() : Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
            email,
            created_at: new Date().toISOString(),
            status: 'active',
            source
          });
        }
      });

      if (toInsert.length > 0) {
        // Insere em lotes ignorando duplicatas para preservar quem já está 'unsubscribed'
        const chunkSize = 100;
        for (let i = 0; i < toInsert.length; i += chunkSize) {
          const chunk = toInsert.slice(i, i + chunkSize);
          await supabase
            .from('newsletter_subscribers')
            .upsert(chunk, { onConflict: 'email', ignoreDuplicates: true });
        }
        setSubscribers(prev => [...toInsert, ...prev]);
      }

      return { added: toInsert.length, total: existingMap.size + toInsert.length };
    } catch (e) {
      console.error('Erro ao sincronizar base de e-mails:', e);
      return { added: 0, total: subscribers.length };
    }
  };

  const purgeTestSubscribers = async (): Promise<number> => {
    try {
      const { data: dbSubs } = await supabase.from('newsletter_subscribers').select('id, email');
      const idsToDelete = (dbSubs || [])
        .filter((s: any) => isTestOrMockNewsletterEmail(s.email))
        .map((s: any) => s.id);

      const localRemovedCount = subscribers.filter(s => isTestOrMockNewsletterEmail(s.email)).length;

      if (idsToDelete.length > 0) {
        await supabase.from('newsletter_subscribers').delete().in('id', idsToDelete);
      }

      setSubscribers(prev => prev.filter(s => !isTestOrMockNewsletterEmail(s.email)));
      return Math.max(idsToDelete.length, localRemovedCount);
    } catch (e) {
      console.error('Erro ao limpar e-mails de teste da newsletter:', e);
      return 0;
    }
  };

  return (
    <NewsletterContext.Provider value={{
      subscribers,
      loading,
      addSubscriber,
      removeSubscriber,
      toggleStatus,
      syncAllSiteEmails,
      purgeTestSubscribers,
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
