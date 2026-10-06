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

export function isValidCssColor(val: unknown): boolean {
  if (typeof val !== 'string') return false;
  const s = val.trim();
  return s.startsWith('#') || s.startsWith('rgb(') || s.startsWith('rgba(') || s.startsWith('hsl(') || s.startsWith('hsla(');
}

export function sanitizeTopBannerConfig(raw: any, fallback: TopBannerConfig = DEFAULT_TOP_BANNER): TopBannerConfig {
  if (!raw || typeof raw !== 'object') return fallback;

  // Resolve message (support legacy `text` and `message`)
  const message = (typeof raw.message === 'string' && raw.message.trim())
    ? raw.message.trim()
    : (typeof raw.text === 'string' && raw.text.trim())
      ? raw.text.trim()
      : fallback.message;

  // Resolve buttonText (support legacy `linkText` and `buttonText`)
  const buttonText = (typeof raw.buttonText === 'string' && raw.buttonText.trim())
    ? raw.buttonText.trim()
    : (typeof raw.linkText === 'string' && raw.linkText.trim())
      ? raw.linkText.trim()
      : fallback.buttonText;

  // Resolve buttonLink (support legacy `link` and `buttonLink`)
  const buttonLink = (typeof raw.buttonLink === 'string' && raw.buttonLink.trim())
    ? raw.buttonLink.trim()
    : (typeof raw.link === 'string' && raw.link.trim())
      ? raw.link.trim()
      : fallback.buttonLink;

  // Resolve tag
  const tag = (typeof raw.tag === 'string' && raw.tag.trim())
    ? raw.tag.trim()
    : fallback.tag;

  // Resolve tagColor
  let tagColor = fallback.tagColor;
  if (isValidCssColor(raw.tagColor)) {
    tagColor = raw.tagColor.trim();
  }

  // Resolve bgColor (convert Tailwind classes like 'bg-emerald-600' to hex, or fallback to solid dark '#0F172A')
  let bgColor = fallback.bgColor;
  if (isValidCssColor(raw.bgColor)) {
    bgColor = raw.bgColor.trim();
  } else if (typeof raw.bgColor === 'string' && raw.bgColor.includes('emerald')) {
    bgColor = '#059669';
  } else if (typeof raw.bgColor === 'string' && raw.bgColor.includes('slate')) {
    bgColor = '#0F172A';
  }

  // Resolve textColor (convert 'text-white' to hex '#FFFFFF')
  let textColor = fallback.textColor;
  if (isValidCssColor(raw.textColor)) {
    textColor = raw.textColor.trim();
  } else if (typeof raw.textColor === 'string' && (raw.textColor.includes('white') || raw.textColor === 'text-white')) {
    textColor = '#FFFFFF';
  }

  return {
    enabled: raw.enabled !== false,
    tag,
    tagColor,
    message,
    buttonText,
    buttonActionType: raw.buttonActionType === 'custom_link' ? 'custom_link' : (fallback.buttonActionType || 'donation_modal'),
    buttonLink,
    bgColor,
    textColor,
  };
}

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
          return sanitizeTopBannerConfig(parsed, DEFAULT_TOP_BANNER);
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
          const sanitized = sanitizeTopBannerConfig(data.value, DEFAULT_TOP_BANNER);
          setBanner(sanitized);

          // If the stored value in Supabase was legacy, sanitize it in Supabase as well
          if ((data.value.text && !data.value.message) || !isValidCssColor(data.value.bgColor)) {
            supabase.from('site_settings').upsert({
              key: 'top_banner',
              value: {
                ...sanitized,
                text: sanitized.message,
                linkText: sanitized.buttonText,
                link: sanitized.buttonLink,
              },
              updated_at: new Date().toISOString()
            }, { onConflict: 'key' }).then(() => {}).catch(() => {});
          }
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
            setBanner(prev => sanitizeTopBannerConfig(parsed, prev));
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
    const updated = sanitizeTopBannerConfig({ ...banner, ...updates }, banner);
    setBanner(updated);

    try {
      await supabase.from('site_settings').upsert({
        key: 'top_banner',
        value: {
          ...updated,
          text: updated.message,
          linkText: updated.buttonText,
          link: updated.buttonLink,
        },
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
        value: {
          ...DEFAULT_TOP_BANNER,
          text: DEFAULT_TOP_BANNER.message,
          linkText: DEFAULT_TOP_BANNER.buttonText,
          link: DEFAULT_TOP_BANNER.buttonLink,
        },
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
