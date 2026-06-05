import React, { createContext, useContext, useState, ReactNode } from 'react';

export type ImpactFeedStatus = 'pending' | 'published' | 'rejected';
export type ImpactFeedType = 'child' | 'news' | 'project' | 'geral';

export interface ImpactFeedItem {
  id: number;
  type: ImpactFeedType;
  source: string;
  title: string;
  content: string;
  author: string;
  status: ImpactFeedStatus;
  date: string;
  child?: string;
  img?: string;
}

interface ImpactContextData {
  feedItems: ImpactFeedItem[];
  addFeedItem: (item: Omit<ImpactFeedItem, 'id' | 'status'>) => void;
  updateFeedItem: (id: number, updates: Partial<ImpactFeedItem>) => void;
  deleteFeedItem: (id: number) => void;
  getPublishedItems: () => ImpactFeedItem[];
}

const ImpactContext = createContext<ImpactContextData | undefined>(undefined);

export function ImpactProvider({ children }: { children: ReactNode }) {
  const [feedItems, setFeedItems] = useState<ImpactFeedItem[]>([]);

  const addFeedItem = (item: Omit<ImpactFeedItem, 'id' | 'status'>) => {
    const newItem: ImpactFeedItem = {
      ...item,
      id: Date.now(),
      status: 'pending'
    };
    setFeedItems(prev => [newItem, ...prev]);
  };

  const updateFeedItem = (id: number, updates: Partial<ImpactFeedItem>) => {
    setFeedItems(prev => prev.map(item => item.id === id ? { ...item, ...updates } : item));
  };

  const deleteFeedItem = (id: number) => {
    setFeedItems(prev => prev.filter(item => item.id !== id));
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
