import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../lib/supabase';

export type ImpactFeedStatus = 'pending' | 'published' | 'rejected';
export type ImpactFeedType = 'child' | 'news' | 'project' | 'geral';

export interface ImpactFeedItem {
  id: string; // Changed to string for UUID
  type: ImpactFeedType;
  source: string;
  title: string;
  content: string;
  author: string;
  status: ImpactFeedStatus;
  date: string;
  child_id?: string;
  img_url?: string;
  created_at?: string;
}

interface ImpactContextData {
  feedItems: ImpactFeedItem[];
  addFeedItem: (item: Omit<ImpactFeedItem, 'id' | 'status' | 'date' | 'created_at'>) => void;
  updateFeedItem: (id: string, updates: Partial<ImpactFeedItem>) => void;
  deleteFeedItem: (id: string) => void;
  getPublishedItems: () => ImpactFeedItem[];
}

const ImpactContext = createContext<ImpactContextData | undefined>(undefined);

export function ImpactProvider({ children }: { children: ReactNode }) {
  const [feedItems, setFeedItems] = useState<ImpactFeedItem[]>([]);

  useEffect(() => {
    fetchFeedItems();
    
    const channel = supabase.channel('impact-updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'impact_feed' }, () => {
        fetchFeedItems();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchFeedItems = async () => {
    try {
      const { data } = await supabase.from('impact_feed').select('*').order('created_at', { ascending: false });
      if (data) {
        const formatted = data.map(item => ({
          id: item.id,
          type: item.type as ImpactFeedType,
          source: item.source,
          title: item.title,
          content: item.content,
          author: item.author,
          status: item.status as ImpactFeedStatus,
          date: new Date(item.created_at).toLocaleDateString('pt-BR'),
          child_id: item.child_id,
          img_url: item.img_url,
          created_at: item.created_at
        }));
        setFeedItems(formatted);
      }
    } catch (e) {
      console.error('Error fetching impact feed:', e);
    }
  };

  const addFeedItem = async (item: Omit<ImpactFeedItem, 'id' | 'status' | 'date' | 'created_at'>) => {
    try {
      await supabase.from('impact_feed').insert({
        type: item.type,
        source: item.source,
        title: item.title,
        content: item.content,
        author: item.author,
        status: 'pending',
        child_id: item.child_id,
        img_url: item.img_url
      });
      // Will be updated via realtime subscription
    } catch (e) {
      console.error('Error adding feed item:', e);
    }
  };

  const updateFeedItem = async (id: string, updates: Partial<ImpactFeedItem>) => {
    try {
      // Optimistic update
      setFeedItems(prev => prev.map(item => item.id === id ? { ...item, ...updates } : item));
      
      const dbUpdates: any = {};
      if (updates.status) dbUpdates.status = updates.status;
      if (updates.content) dbUpdates.content = updates.content;
      if (updates.title) dbUpdates.title = updates.title;

      await supabase.from('impact_feed').update(dbUpdates).eq('id', id);
    } catch (e) {
      console.error('Error updating feed item:', e);
      fetchFeedItems(); // Revert on failure
    }
  };

  const deleteFeedItem = async (id: string) => {
    try {
      setFeedItems(prev => prev.filter(item => item.id !== id));
      await supabase.from('impact_feed').delete().eq('id', id);
    } catch (e) {
      console.error('Error deleting feed item:', e);
      fetchFeedItems(); // Revert on failure
    }
  };

  const getPublishedItems = () => {
    return feedItems.filter(item => item.status === 'published');
  };

  return (
    <ImpactContext.Provider value={{ feedItems, addFeedItem, updateFeedItem, deleteFeedItem, getPublishedItems }}>
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
