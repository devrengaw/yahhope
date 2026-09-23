import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../lib/supabase';

export interface ImpactMetricItem {
  id: string | number;
  metric: string;         // Ex: "9 crianças", "100%"
  subtitle: string;       // Ex: "resgatadas da desnutrição aguda na Casa Nutri"
  description: string;    // Detalhes do atendimento/transparência
  icon: string;           // 'users' | 'shield-check' | 'graduation-cap' | 'heart' | 'utensils' | 'sparkles' | 'target' | 'trending-up' | 'award'
  color: string;          // '#92BF78', '#F49853', '#88A1F2', '#EBC878'
  active: boolean;        // Exibido na landing page
  order: number;
}

export const DEFAULT_IMPACT_METRICS: ImpactMetricItem[] = [
  {
    id: 'metric-1',
    metric: '9 crianças',
    subtitle: 'resgatadas da desnutrição aguda na Casa Nutri',
    description: 'Acompanhamento clínico semanal, pesagem periódica, introdução alimentar rica em nutrientes e suplementos para salvar vidas e restabelecer o desenvolvimento infantil.',
    icon: 'users',
    color: '#92BF78',
    active: true,
    order: 1
  },
  {
    id: 'metric-2',
    metric: '100%',
    subtitle: 'transparência e prestação de contas aos apoiadores',
    description: 'Cada real investido é detalhado em relatórios com fotos, evolução médica dos atendidos e prestação de contas auditada e verificável.',
    icon: 'shield-check',
    color: '#F49853',
    active: true,
    order: 2
  },
  {
    id: 'metric-3',
    metric: '5 jovens',
    subtitle: 'universitários com bolsa integral e mentoria (Em Breve)',
    description: 'Suporte para custos acadêmicos, acompanhamento por profissionais mentores e desenvolvimento de liderança com princípios éticos.',
    icon: 'graduation-cap',
    color: '#88A1F2',
    active: false, // Inativo por padrão: "nao tem os jovens universitarios ainda"
    order: 3
  }
];

interface ImpactMetricsContextType {
  metrics: ImpactMetricItem[];
  activeMetrics: ImpactMetricItem[];
  loading: boolean;
  addMetric: (item: Omit<ImpactMetricItem, 'id'>) => Promise<void>;
  updateMetric: (id: string | number, updates: Partial<ImpactMetricItem>) => Promise<void>;
  deleteMetric: (id: string | number) => Promise<void>;
  toggleMetricActive: (id: string | number) => Promise<void>;
  reorderMetrics: (items: ImpactMetricItem[]) => Promise<void>;
  resetToDefaults: () => Promise<void>;
}

const ImpactMetricsContext = createContext<ImpactMetricsContextType | undefined>(undefined);

const STORAGE_KEY = 'yah_hope_impact_metrics_v2';

export function ImpactMetricsProvider({ children }: { children: ReactNode }) {
  const [metrics, setMetrics] = useState<ImpactMetricItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Failed to parse impact metrics from localStorage', e);
    }
    return DEFAULT_IMPACT_METRICS;
  });

  const [loading, setLoading] = useState(false);

  // Sync to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(metrics));
    } catch (e) {
      console.warn('Failed to save impact metrics to localStorage', e);
    }
  }, [metrics]);

  // Try to load from Supabase if table exists
  useEffect(() => {
    let isMounted = true;
    async function loadFromSupabase() {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('impact_metrics')
          .select('*')
          .order('order', { ascending: true });

        if (!error && data && data.length > 0 && isMounted) {
          setMetrics(data.map(item => ({
            id: item.id,
            metric: item.metric,
            subtitle: item.subtitle,
            description: item.description,
            icon: item.icon || 'users',
            color: item.color || '#F49853',
            active: item.active !== false,
            order: item.order || 0
          })));
        }
      } catch {
        // Fallback to local storage state
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
            setMetrics(parsed);
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

  const addMetric = async (item: Omit<ImpactMetricItem, 'id'>) => {
    const newId = `metric-${Date.now().toString(36)}`;
    const newItem: ImpactMetricItem = {
      ...item,
      id: newId,
      order: metrics.length + 1
    };

    setMetrics(prev => [...prev, newItem]);

    try {
      await supabase.from('impact_metrics').insert([newItem]);
    } catch {}
  };

  const updateMetric = async (id: string | number, updates: Partial<ImpactMetricItem>) => {
    setMetrics(prev => prev.map(m => String(m.id) === String(id) ? { ...m, ...updates } : m));

    try {
      await supabase.from('impact_metrics').update(updates).eq('id', id);
    } catch {}
  };

  const deleteMetric = async (id: string | number) => {
    setMetrics(prev => prev.filter(m => String(m.id) !== String(id)));

    try {
      await supabase.from('impact_metrics').delete().eq('id', id);
    } catch {}
  };

  const toggleMetricActive = async (id: string | number) => {
    const target = metrics.find(m => String(m.id) === String(id));
    if (!target) return;
    await updateMetric(id, { active: !target.active });
  };

  const reorderMetrics = async (items: ImpactMetricItem[]) => {
    const ordered = items.map((item, idx) => ({ ...item, order: idx + 1 }));
    setMetrics(ordered);

    try {
      for (const item of ordered) {
        await supabase.from('impact_metrics').update({ order: item.order }).eq('id', item.id);
      }
    } catch {}
  };

  const resetToDefaults = async () => {
    setMetrics(DEFAULT_IMPACT_METRICS);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_IMPACT_METRICS));
    } catch {}
  };

  const activeMetrics = metrics
    .filter(m => m.active !== false)
    .sort((a, b) => (a.order || 0) - (b.order || 0));

  return (
    <ImpactMetricsContext.Provider value={{
      metrics,
      activeMetrics,
      loading,
      addMetric,
      updateMetric,
      deleteMetric,
      toggleMetricActive,
      reorderMetrics,
      resetToDefaults
    }}>
      {children}
    </ImpactMetricsContext.Provider>
  );
}

export function useImpactMetrics() {
  const context = useContext(ImpactMetricsContext);
  if (!context) {
    throw new Error('useImpactMetrics must be used within an ImpactMetricsProvider');
  }
  return context;
}
