import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../lib/supabase';

export interface TopBannerConfig {
  enabled: boolean;
  tag: string;
  tagColor: string;
  message: string;
  buttonText: string;
  buttonActionType: 'donation_modal' | 'custom_link';
  buttonLink: string;
  bgColor: string;
  textColor: string;
}

export const DEFAULT_TOP_BANNER: TopBannerConfig = {
  enabled: true,
  tag: 'URGENTE',
  tagColor: '#F49853',
  message: 'Moçambique & Casa Nutri: Apoio emergencial a 9 crianças e famílias em risco nutricional',
  buttonText: 'Apoiar Agora',
  buttonActionType: 'donation_modal',
  buttonLink: '/campanha',
  bgColor: '#0F172A',
  textColor: '#FFFFFF',
};

interface TopBannerContextType {
  banner: TopBannerConfig;
  loading: boolean;
  updateBanner: (updates: Partial<TopBannerConfig>) => Promise<void>;
  resetToDefaults: () => Promise<void>;
}

const TopBannerContext = createContext<TopBannerContextType | undefined>(undefined);

const STORAGE_KEY = 'yah_hope_top_banner_v1';

export function TopBannerProvider({ children }: { children: ReactNode }) {
  const [banner, setBanner] = useState<TopBannerConfig>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object') {
          return { ...DEFAULT_TOP_BANNER, ...parsed };
        }
      }
    } catch (e) {
      console.warn('Failed to parse top banner config from localStorage', e);
    }
    return DEFAULT_TOP_BANNER;
  });

  const [loading, setLoading] = useState(false);

  // Sync to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(banner));
    } catch (e) {
      console.warn('Failed to save top banner config to localStorage', e);
    }
  }, [banner]);

  // Try to load from Supabase if table exists
  useEffect(() => {
    let isMounted = true;
    async function loadFromSupabase() {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('site_settings')
          .select('value')
          .eq('key', 'top_banner')
          .maybeSingle();

        if (!error && data && data.value && isMounted) {
          setBanner(prev => ({ ...prev, ...data.value }));
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
          if (parsed && typeof parsed === 'object') {
            setBanner(prev => ({ ...prev, ...parsed }));
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

  const updateBanner = async (updates: Partial<TopBannerConfig>) => {
    const updated = { ...banner, ...updates };
    setBanner(updated);

    try {
      await supabase.from('site_settings').upsert({
        key: 'top_banner',
        value: updated,
        updated_at: new Date().toISOString()
      }, { onConflict: 'key' });
    } catch {}
  };

  const resetToDefaults = async () => {
    setBanner(DEFAULT_TOP_BANNER);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_TOP_BANNER));
      await supabase.from('site_settings').upsert({
        key: 'top_banner',
        value: DEFAULT_TOP_BANNER,
        updated_at: new Date().toISOString()
      }, { onConflict: 'key' });
    } catch {}
  };

  return (
    <TopBannerContext.Provider value={{ banner, loading, updateBanner, resetToDefaults }}>
      {children}
    </TopBannerContext.Provider>
  );
}

export function useTopBanner() {
  const context = useContext(TopBannerContext);
  if (!context) {
    throw new Error('useTopBanner must be used within a TopBannerProvider');
  }
  return context;
}
