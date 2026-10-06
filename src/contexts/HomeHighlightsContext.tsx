import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export interface HomeHighlightItem {
  id: number | string;
  type: 'photo' | 'split';
  title: string;
  category: string;
  location: string;
  snippet?: string;
  content?: string;
  image: string;
  link: string;
  color: string;
  active?: boolean;
  order?: number;
  blogPostId?: string;
}

export const isMockupHighlight = (h: { title?: string; snippet?: string }) => {
  const t = (h.title || '').toLowerCase();
  const s = (h.snippet || '').toLowerCase();
  return (
    t.includes('costura') ||
    t.includes('hortas') ||
    t.includes('saúde preventiva') ||
    t.includes('saude preventiva') ||
    t.includes('bolsas universitárias') ||
    t.includes('bolsas universitarias') ||
    t.includes('ação humanitária: cuidado') ||
    t.includes('acao humanitaria: cuidado') ||
    t.includes('casa nutri: resgatando') ||
    s.includes('costura') ||
    s.includes('kits de higiene') ||
    s.includes('visitas domiciliares periódicas')
  );
};

export const deduplicateHighlights = (items: HomeHighlightItem[]): HomeHighlightItem[] => {
  const seenKeys = new Set<string>();
  const result: HomeHighlightItem[] = [];

  for (const item of items) {
    if (isMockupHighlight(item)) continue;

    let key = '';
    if (item.blogPostId) {
      key = `blog:${item.blogPostId}`;
    } else if (item.link && item.link.includes('post=')) {
      const match = item.link.match(/post=([^&#]+)/);
      if (match) key = `blog:${match[1]}`;
    } else if (String(item.id).startsWith('highlight-post-') || String(item.id).startsWith('blog-post-')) {
      key = `blog:${String(item.id).replace(/^(highlight|blog)-/, '')}`;
    }

    if (!key) {
      key = `title:${(item.title || '').trim().toLowerCase()}`;
    }

    if (seenKeys.has(key)) {
      continue;
    }
    seenKeys.add(key);
    result.push(item);
  }

  return result;
};


export const DEFAULT_HIGHLIGHTS: HomeHighlightItem[] = [];

interface HomeHighlightsContextType {
  highlights: HomeHighlightItem[];
  loading: boolean;
  addHighlight: (item: Omit<HomeHighlightItem, 'id'>) => Promise<void>;
  updateHighlight: (id: number | string, item: Partial<HomeHighlightItem>) => Promise<void>;
  deleteHighlight: (id: number | string) => Promise<void>;
  toggleHighlightActive: (id: number | string) => Promise<void>;
  reorderHighlights: (items: HomeHighlightItem[]) => Promise<void>;
  resetToDefaults: () => Promise<void>;
  syncBlogPostHighlight: (post: {
    id: string;
    title: string;
    category?: string;
    location?: string;
    snippet?: string;
    content?: string;
    image: string;
    highlight_type?: 'photo' | 'split';
    highlight_color?: string;
    active?: boolean;
  }) => Promise<void>;
  removeBlogPostHighlight: (blogPostId: string) => Promise<void>;
  isBlogPostHighlighted: (blogPostId: string) => boolean;
}

const HomeHighlightsContext = createContext<HomeHighlightsContextType | undefined>(undefined);

const STORAGE_KEY = 'yah_hope_home_highlights_v7';

export function HomeHighlightsProvider({ children }: { children: React.ReactNode }) {
  const [highlights, setHighlights] = useState<HomeHighlightItem[]>(() => {
    try {
      localStorage.removeItem('yah_hope_home_highlights_v1');
      localStorage.removeItem('yah_hope_home_highlights_v2');
      localStorage.removeItem('yah_hope_home_highlights_v3');
      localStorage.removeItem('yah_hope_home_highlights_v4');
      localStorage.removeItem('yah_hope_home_highlights_v5');
      localStorage.removeItem('yah_hope_home_highlights_v6');
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved !== null) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return deduplicateHighlights(parsed);
        }
      }
    } catch (e) {
      console.warn('Failed to parse highlights from localStorage', e);
    }
    return [];
  });

  const [loading, setLoading] = useState(false);

  // Sync to localStorage whenever highlights change
  useEffect(() => {
    try {
      const deduplicated = deduplicateHighlights(highlights);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(deduplicated));
    } catch (e) {
      console.warn('Failed to save highlights to localStorage', e);
    }
  }, [highlights]);

let homeHighlightsTableAvailable = true;

  // Try to load from Supabase if table exists
  useEffect(() => {
    let isMounted = true;

    async function loadFromSupabase() {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('home_highlights')
          .select('*');

        if (error) {
          if (error.code === '42P01' || error.message?.includes('does not exist') || (error as any).status === 404 || error.code === 'PGRST116') {
            homeHighlightsTableAvailable = false;
          }
          return;
        }

        homeHighlightsTableAvailable = true;

        if (data && data.length > 0 && isMounted) {
          // Detect and purge mockup rows from Supabase
          const mockupItems = data.filter((item: any) => isMockupHighlight(item));
          if (mockupItems.length > 0) {
            const mockupIds = mockupItems.map((item: any) => item.id);
            try {
              await supabase.from('home_highlights').delete().in('id', mockupIds);
            } catch {}
          }

          const validItems = data.filter((item: any) => !isMockupHighlight(item));
          if (validItems.length > 0) {
            const sortedItems = [...validItems].sort((a, b) => (Number(a.order) || 0) - (Number(b.order) || 0));
            const mapped = sortedItems.map(item => ({
              id: item.id,
              type: item.type || 'photo',
              title: item.title,
              category: item.category,
              location: item.location || 'Moçambique',
              snippet: item.snippet || '',
              content: item.content || '',
              image: item.image,
              link: item.link || (item.blog_post_id ? `/blog?post=${item.blog_post_id}` : '/blog'),
              color: item.color || '#F49853',
              active: item.active !== false,
              order: item.order || 0,
              blogPostId: item.blog_post_id || item.blogPostId
            }));
            setHighlights(deduplicateHighlights(mapped));
          } else {
            setHighlights(DEFAULT_HIGHLIGHTS);
          }
        }
      } catch (err) {
        // Fallback to local storage state
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadFromSupabase();

    // Listen to storage events across tabs
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          if (Array.isArray(parsed)) {
            setHighlights(deduplicateHighlights(parsed));
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

  const addHighlight = async (item: Omit<HomeHighlightItem, 'id'>) => {
    const targetId = item.blogPostId ? `highlight-${item.blogPostId}` : Date.now().toString();
    const newItem: HomeHighlightItem = {
      ...item,
      id: targetId,
      active: item.active !== false,
      order: highlights.length + 1
    };

    setHighlights(prev => {
      const filtered = prev.filter(h => {
        if (item.blogPostId && (
          h.blogPostId === item.blogPostId || 
          String(h.id) === `highlight-${item.blogPostId}` || 
          String(h.id) === `blog-${item.blogPostId}` ||
          (Boolean(h.link) && h.link.includes(`post=${item.blogPostId}`))
        )) {
          return false;
        }
        return true;
      });
      return deduplicateHighlights([...filtered, newItem]);
    });

    try {
      await supabase.from('home_highlights').insert([{
        id: targetId,
        type: newItem.type,
        title: newItem.title,
        category: newItem.category,
        location: newItem.location,
        snippet: newItem.snippet,
        content: newItem.content,
        image: newItem.image,
        link: newItem.link,
        color: newItem.color,
        active: newItem.active,
        order: newItem.order,
        blog_post_id: newItem.blogPostId
      }]);
    } catch {}
  };

  const updateHighlight = async (id: number | string, updatedFields: Partial<HomeHighlightItem>) => {
    setHighlights(prev => prev.map(item => 
      String(item.id) === String(id) ? { ...item, ...updatedFields } : item
    ));

    try {
      await supabase.from('home_highlights').update(updatedFields).eq('id', id);
    } catch {}
  };

  const deleteHighlight = async (id: number | string) => {
    const target = highlights.find(h => String(h.id) === String(id));
    const blogId = target?.blogPostId || (target?.link?.match(/post=([^&#]+)/)?.[1]);

    const isMatch = (h: HomeHighlightItem) =>
      String(h.id) === String(id) ||
      (blogId ? (
        h.blogPostId === blogId ||
        String(h.id) === `highlight-${blogId}` ||
        String(h.id) === `blog-${blogId}` ||
        (Boolean(h.link) && h.link.includes(`post=${blogId}`))
      ) : false);

    setHighlights(prev => deduplicateHighlights(prev.filter(item => !isMatch(item))));

    try {
      await supabase.from('home_highlights').delete().eq('id', id);
      if (blogId) {
        await supabase
          .from('home_highlights')
          .delete()
          .or(`blog_post_id.eq.${blogId},id.eq.highlight-${blogId}`);
      }
    } catch {}
  };

  const toggleHighlightActive = async (id: number | string) => {
    const target = highlights.find(h => String(h.id) === String(id));
    if (!target) return;

    const newActiveState = target.active === false ? true : false;
    await updateHighlight(id, { active: newActiveState });
  };

  const reorderHighlights = async (items: HomeHighlightItem[]) => {
    const ordered = items.map((item, idx) => ({ ...item, order: idx + 1 }));
    setHighlights(deduplicateHighlights(ordered));

    try {
      for (const item of ordered) {
        await supabase.from('home_highlights').update({ order: item.order }).eq('id', item.id);
      }
    } catch {}
  };

  const resetToDefaults = async () => {
    setHighlights(DEFAULT_HIGHLIGHTS);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_HIGHLIGHTS));
    } catch {}
  };

  const syncBlogPostHighlight = async (post: {
    id: string;
    title: string;
    category?: string;
    location?: string;
    snippet?: string;
    content?: string;
    image: string;
    highlight_type?: 'photo' | 'split';
    highlight_color?: string;
    active?: boolean;
  }) => {
    setHighlights(prev => {
      const isMatch = (h: HomeHighlightItem) =>
        h.blogPostId === post.id ||
        String(h.id) === `highlight-${post.id}` ||
        String(h.id) === `blog-${post.id}` ||
        (Boolean(h.link) && h.link.includes(`post=${post.id}`));

      const existingIndex = prev.findIndex(isMatch);
      const existing = existingIndex >= 0 ? prev[existingIndex] : null;

      const singleItem: HomeHighlightItem = {
        id: `highlight-${post.id}`,
        title: post.title,
        category: post.category || existing?.category || 'Blog',
        location: post.location || existing?.location || 'Moçambique',
        snippet: post.snippet !== undefined ? post.snippet : (existing?.snippet || ''),
        content: post.content !== undefined ? post.content : (existing?.content || ''),
        image: post.image || existing?.image || '',
        link: `/blog?post=${post.id}`,
        type: post.highlight_type || existing?.type || 'split',
        color: post.highlight_color || existing?.color || '#F49853',
        active: post.active !== undefined ? post.active : true,
        blogPostId: post.id,
        order: existing?.order || (prev.length + 1)
      };

      const nonMatching = prev.filter(h => !isMatch(h));
      let nextList: HomeHighlightItem[];
      if (existingIndex >= 0) {
        nextList = [...nonMatching];
        nextList.splice(Math.min(existingIndex, nextList.length), 0, singleItem);
      } else {
        nextList = [...nonMatching, singleItem];
      }

      return deduplicateHighlights(nextList);
    });
  };

  const removeBlogPostHighlight = async (blogPostId: string) => {
    const isMatch = (h: HomeHighlightItem) =>
      h.blogPostId === blogPostId ||
      String(h.id) === `highlight-${blogPostId}` ||
      String(h.id) === `blog-${blogPostId}` ||
      (Boolean(h.link) && h.link.includes(`post=${blogPostId}`));

    const hasMatch = highlights.some(isMatch);
    if (!hasMatch) return;

    setHighlights(prev => deduplicateHighlights(prev.filter(h => !isMatch(h))));

    if (!homeHighlightsTableAvailable) return;

    try {
      const { error } = await supabase
        .from('home_highlights')
        .delete()
        .or(`blog_post_id.eq.${blogPostId},id.eq.highlight-${blogPostId},id.eq.blog-${blogPostId}`);
      if (error && (error.code === '42P01' || (error as any).status === 404)) {
        homeHighlightsTableAvailable = false;
      }
    } catch {
      homeHighlightsTableAvailable = false;
    }
  };

  const isBlogPostHighlighted = (blogPostId: string) => {
    return highlights.some(
      h => (
        h.blogPostId === blogPostId || 
        String(h.id) === `highlight-${blogPostId}` || 
        String(h.id) === `blog-${blogPostId}` || 
        (Boolean(h.link) && h.link.includes(`post=${blogPostId}`))
      ) && h.active !== false
    );
  };

  return (
    <HomeHighlightsContext.Provider value={{
      highlights,
      loading,
      addHighlight,
      updateHighlight,
      deleteHighlight,
      toggleHighlightActive,
      reorderHighlights,
      resetToDefaults,
      syncBlogPostHighlight,
      removeBlogPostHighlight,
      isBlogPostHighlighted
    }}>
      {children}
    </HomeHighlightsContext.Provider>
  );
}

export function useHomeHighlights() {
  const context = useContext(HomeHighlightsContext);
  if (!context) {
    throw new Error('useHomeHighlights must be used within a HomeHighlightsProvider');
  }
  return context;
}
