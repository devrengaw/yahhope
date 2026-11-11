import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { supabase } from '../lib/supabase';

export type ImpactFeedStatus = 'pending' | 'published' | 'rejected' | 'scheduled';
export type ImpactFeedType = 'child' | 'news' | 'project' | 'geral';

export interface ImpactFeedItem {
  id: string;
  type: ImpactFeedType;
  source: string;
  title: string;
  content: string;
  author: string;
  status: ImpactFeedStatus;
  date: string;
  child_id?: string;
  child?: string;
  img_url?: string;
  created_at?: string;
  scheduled_for?: string; // ISO datetime
  published_at?: string;  // ISO datetime
}

export type NewImpactFeedItem = {
  title: string;
  content: string;
  type?: ImpactFeedType;
  source?: string;
  author?: string;
  status?: ImpactFeedStatus;
  date?: string;
  child_id?: string;
  child?: string;
  img_url?: string;
  scheduled_for?: string;
  published_at?: string;
};

interface ImpactContextData {
  feedItems: ImpactFeedItem[];
  isLoading: boolean;
  addFeedItem: (item: NewImpactFeedItem) => Promise<ImpactFeedItem>;
  updateFeedItem: (id: string, updates: Partial<ImpactFeedItem>) => Promise<void>;
  approveFeedItem: (id: string) => Promise<void>;
  rejectFeedItem: (id: string) => Promise<void>;
  scheduleFeedItem: (id: string, scheduledFor: string) => Promise<void>;
  deleteFeedItem: (id: string) => Promise<void>;
  getPublishedItems: () => ImpactFeedItem[];
  getPendingItems: () => ImpactFeedItem[];
  getScheduledItems: () => ImpactFeedItem[];
}

const STORAGE_KEY = 'yah_hope_impact_feed_v2';

// Gerador robusto de UUID v4 para compatibilidade com a coluna UUID do PostgreSQL
function generateUUID(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function isValidUUID(val?: string | null): boolean {
  if (!val) return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(val);
}

const INITIAL_DEMO_ITEMS: ImpactFeedItem[] = [
  {
    id: 'a1000000-0000-4000-8000-000000000001',
    type: 'geral',
    source: 'Módulo Nutrição',
    title: 'Novos Suprimentos Terapêuticos em Boane',
    content: 'Recebemos nova remessa de fórmulas fortificadas e suplementos para o atendimento intensivo das crianças na Casa Nutri.',
    author: 'Nutrição Boane',
    status: 'published',
    date: new Date().toLocaleDateString('pt-BR'),
    created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
    img_url: 'https://hope.yahchurch.com/wp-content/uploads/2025/09/HOPE-ALFACES.avif'
  },
  {
    id: 'a2000000-0000-4000-8000-000000000002',
    type: 'project',
    source: 'Módulo Nutrição',
    title: 'Monitoramento Clínico e Recuperação Ponderal',
    content: 'O acompanhamento diário com pesagem e testes de edema permitiu que 92% das crianças atendidas no mês registrassem ganho contínuo de peso.',
    author: 'Coordenação Clínica',
    status: 'published',
    date: new Date().toLocaleDateString('pt-BR'),
    created_at: new Date(Date.now() - 86400000 * 5).toISOString(),
  }
];

const ImpactContext = createContext<ImpactContextData | undefined>(undefined);

export function ImpactProvider({ children }: { children: ReactNode }) {
  const [feedItems, setFeedItems] = useState<ImpactFeedItem[]>(() => {
    try {
      const cached = localStorage.getItem(STORAGE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Erro ao ler cache do feed de impacto:', e);
    }
    return INITIAL_DEMO_ITEMS;
  });

  const [isLoading, setIsLoading] = useState(false);

  const saveToStorage = (items: ImpactFeedItem[]) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch (e) {
      console.warn('Erro ao salvar feed de impacto no localStorage:', e);
    }
  };

  const fetchFeedItems = useCallback(async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('impact_feed')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('Tabela impact_feed indisponível no Supabase, usando armazenamento local:', error.message);
        return;
      }

      if (data && Array.isArray(data)) {
        const now = Date.now();
        const dbItems: ImpactFeedItem[] = data.map(item => {
          let status = (item.status as ImpactFeedStatus) || 'pending';
          
          // Se estava programado e a data/hora já chegou, auto-promove para publicado
          if (status === 'scheduled' && item.scheduled_for && new Date(item.scheduled_for).getTime() <= now) {
            status = 'published';
          }

          return {
            id: String(item.id),
            type: (item.type as ImpactFeedType) || 'geral',
            source: item.source || 'Módulo Nutrição',
            title: item.title || 'Atualização de Impacto',
            content: item.content || '',
            author: item.author || 'Equipe Nutrição',
            status,
            date: item.created_at ? new Date(item.created_at).toLocaleDateString('pt-BR') : new Date().toLocaleDateString('pt-BR'),
            child_id: item.child_id ? String(item.child_id) : undefined,
            child: item.child_name || item.child || undefined,
            img_url: item.img_url || undefined,
            created_at: item.created_at || new Date().toISOString(),
            scheduled_for: item.scheduled_for || undefined,
            published_at: item.published_at || undefined
          };
        });

        setFeedItems(prev => {
          const dbIds = new Set(dbItems.map(i => i.id));
          const localOnly = prev.filter(i => !dbIds.has(i.id) && !i.id.startsWith('a1000000-') && !i.id.startsWith('a2000000-') && !i.id.startsWith('impact-seed-'));
          const merged = [...dbItems, ...localOnly];
          const sorted = merged.sort((a, b) => {
            const dateA = new Date(a.created_at || 0).getTime();
            const dateB = new Date(b.created_at || 0).getTime();
            return dateB - dateA;
          });
          saveToStorage(sorted);
          return sorted;
        });
      }
    } catch (e) {
      console.warn('Erro ao buscar feed de impacto:', e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Intervalo de verificação a cada 60s para publicar itens cujo horário agendado chegou
  useEffect(() => {
    const timer = setInterval(() => {
      setFeedItems(prev => {
        let changed = false;
        const now = Date.now();
        const updated = prev.map(item => {
          if (item.status === 'scheduled' && item.scheduled_for && new Date(item.scheduled_for).getTime() <= now) {
            changed = true;
            return { ...item, status: 'published' as ImpactFeedStatus, published_at: new Date().toISOString() };
          }
          return item;
        });
        if (changed) {
          saveToStorage(updated);
        }
        return changed ? updated : prev;
      });
    }, 60000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    fetchFeedItems();

    try {
      const channel = supabase.channel('impact-feed-changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'impact_feed' }, () => {
          fetchFeedItems();
        })
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    } catch (e) {
      console.warn('Realtime indisponível para impact_feed:', e);
    }
  }, [fetchFeedItems]);

  const addFeedItem = async (item: NewImpactFeedItem): Promise<ImpactFeedItem> => {
    const newId = generateUUID();
    const nowIso = new Date().toISOString();
    const formattedDate = new Date().toLocaleDateString('pt-BR');

    // Determina status inicial: se foi programado com data futura, 'scheduled'
    let initialStatus: ImpactFeedStatus = item.status || 'pending';
    if (item.scheduled_for && new Date(item.scheduled_for).getTime() > Date.now()) {
      initialStatus = 'scheduled';
    }

    const newItem: ImpactFeedItem = {
      id: newId,
      type: item.type || (item.child_id ? 'child' : 'geral'),
      source: item.source || 'Módulo Nutrição',
      title: item.title,
      content: item.content,
      author: item.author || 'Equipe Nutrição',
      status: initialStatus,
      date: item.date || formattedDate,
      child_id: item.child_id,
      child: item.child,
      img_url: item.img_url,
      created_at: nowIso,
      scheduled_for: item.scheduled_for,
      published_at: initialStatus === 'published' ? nowIso : undefined
    };

    // 1. Atualiza o estado React e localStorage imediatamente
    setFeedItems(prev => {
      const updated = [newItem, ...prev.filter(i => i.id !== newItem.id)];
      saveToStorage(updated);
      return updated;
    });

    // 2. Tenta persistir no Supabase em segundo plano
    try {
      const payload: any = {
        id: newItem.id,
        type: newItem.type,
        source: newItem.source,
        title: newItem.title,
        content: newItem.content,
        author: newItem.author,
        status: newItem.status,
        child_name: newItem.child || null,
        img_url: newItem.img_url || null,
        created_at: newItem.created_at,
        scheduled_for: newItem.scheduled_for || null,
        published_at: newItem.published_at || null
      };

      if (isValidUUID(newItem.child_id)) {
        payload.child_id = newItem.child_id;
      } else {
        payload.child_id = null;
      }

      const { error } = await supabase.from('impact_feed').insert(payload);

      if (error) {
        console.warn('Não foi possível gravar impact_feed no Supabase (salvo localmente):', error.message);
      }
    } catch (e) {
      console.warn('Exceção ao inserir no Supabase (salvo localmente):', e);
    }

    return newItem;
  };

  const updateFeedItem = async (id: string, updates: Partial<ImpactFeedItem>) => {
    // Se o scheduled_for for alterado para futuro, ajusta status para 'scheduled' se não for explicitamente rejected
    const computedUpdates = { ...updates };
    if (computedUpdates.scheduled_for) {
      const schedTime = new Date(computedUpdates.scheduled_for).getTime();
      if (schedTime > Date.now() && computedUpdates.status !== 'rejected') {
        computedUpdates.status = 'scheduled';
      }
    }
    if (computedUpdates.status === 'published' && !computedUpdates.published_at) {
      computedUpdates.published_at = new Date().toISOString();
    }

    // 1. Atualização imediata no estado local e localStorage
    setFeedItems(prev => {
      const updated = prev.map(item => item.id === id ? { ...item, ...computedUpdates } : item);
      saveToStorage(updated);
      return updated;
    });

    // 2. Tenta sincronizar com Supabase
    try {
      const dbUpdates: any = {};
      if (computedUpdates.status !== undefined) dbUpdates.status = computedUpdates.status;
      if (computedUpdates.content !== undefined) dbUpdates.content = computedUpdates.content;
      if (computedUpdates.title !== undefined) dbUpdates.title = computedUpdates.title;
      if (computedUpdates.type !== undefined) dbUpdates.type = computedUpdates.type;
      if (computedUpdates.source !== undefined) dbUpdates.source = computedUpdates.source;
      if (computedUpdates.author !== undefined) dbUpdates.author = computedUpdates.author;
      if (computedUpdates.img_url !== undefined) dbUpdates.img_url = computedUpdates.img_url;
      if (computedUpdates.child !== undefined) dbUpdates.child_name = computedUpdates.child;
      if (computedUpdates.scheduled_for !== undefined) dbUpdates.scheduled_for = computedUpdates.scheduled_for;
      if (computedUpdates.published_at !== undefined) dbUpdates.published_at = computedUpdates.published_at;

      if (computedUpdates.child_id !== undefined) {
        dbUpdates.child_id = isValidUUID(computedUpdates.child_id) ? computedUpdates.child_id : null;
      }

      const { error } = await supabase.from('impact_feed').update(dbUpdates).eq('id', id);
      if (error) {
        console.warn('Erro ao atualizar impact_feed no Supabase (mantido localmente):', error.message);
      }
    } catch (e) {
      console.warn('Exceção ao atualizar no Supabase:', e);
    }
  };

  const approveFeedItem = async (id: string) => {
    await updateFeedItem(id, { 
      status: 'published', 
      published_at: new Date().toISOString(),
      scheduled_for: undefined 
    });
  };

  const rejectFeedItem = async (id: string) => {
    await updateFeedItem(id, { status: 'rejected' });
  };

  const scheduleFeedItem = async (id: string, scheduledFor: string) => {
    await updateFeedItem(id, { 
      status: 'scheduled', 
      scheduled_for: scheduledFor 
    });
  };

  const deleteFeedItem = async (id: string) => {
    // 1. Remove do estado e localStorage imediatamente
    setFeedItems(prev => {
      const updated = prev.filter(item => item.id !== id);
      saveToStorage(updated);
      return updated;
    });

    // 2. Tenta deletar no Supabase
    try {
      const { error } = await supabase.from('impact_feed').delete().eq('id', id);
      if (error) {
        console.warn('Erro ao deletar impact_feed no Supabase:', error.message);
      }
    } catch (e) {
      console.warn('Exceção ao deletar no Supabase:', e);
    }
  };

  const getPublishedItems = () => {
    const now = Date.now();
    return feedItems.filter(item => {
      if (item.status === 'published') return true;
      if (item.status === 'scheduled' && item.scheduled_for && new Date(item.scheduled_for).getTime() <= now) {
        return true;
      }
      return false;
    });
  };

  const getPendingItems = () => {
    return feedItems.filter(item => item.status === 'pending');
  };

  const getScheduledItems = () => {
    const now = Date.now();
    return feedItems.filter(item => 
      item.status === 'scheduled' && 
      item.scheduled_for && 
      new Date(item.scheduled_for).getTime() > now
    );
  };

  return (
    <ImpactContext.Provider value={{ 
      feedItems, 
      isLoading,
      addFeedItem, 
      updateFeedItem, 
      approveFeedItem,
      rejectFeedItem,
      scheduleFeedItem,
      deleteFeedItem, 
      getPublishedItems,
      getPendingItems,
      getScheduledItems
    }}>
      {children}
    </ImpactContext.Provider>
  );
}

export function useImpact() {
  const context = useContext(ImpactContext);
  if (context === undefined) {
    throw new Error('useImpact must be used within an ImpactProvider');
  }
  return context;
}
