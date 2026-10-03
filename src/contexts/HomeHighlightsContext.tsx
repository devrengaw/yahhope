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


export const DEFAULT_HIGHLIGHTS: HomeHighlightItem[] = [
  {
    id: 'highlight-post-1',
    type: 'photo',
    title: 'O propósito de uma ilha',
    category: 'Nutrição & Saúde Infantil',
    location: 'Moçambique',
    snippet: 'Nosso centro nutricional acolhe crianças em estado crítico de vulnerabilidade alimentar, fornecendo dietas balanceadas e assistência médica contínua.',
    content: `<p>Na província de Nampula, em Moçambique, a desnutrição infantil severa é uma das maiores ameaças ao desenvolvimento e sobrevivência de crianças em seus primeiros anos de vida.</p><p>A Casa Nutri nasceu para transformar essa realidade. Com acompanhamento clínico semanal, introdução alimentar fortificada e educação nutricional para as mães, resgatamos crianças da curva crítica de desnutrição.</p><h3>Impacto Direto</h3><ul><li>Mais de 1.800 refeições terapêuticas distribuídas a cada mês.</li><li>Recuperação do peso ideal e fortalecimento imunológico.</li><li>Acompanhamento médico e psicológico com a família.</li></ul><p>Cada sorriso devolvido representa o futuro que renasce em solo fértil de esperança e solidariedade.</p>`,
    image: 'https://hope.yahchurch.com/wp-content/uploads/2025/09/HOPE-ALFACES.avif',
    link: '/blog?post=post-1',
    color: '#92BF78',
    active: true,
    order: 1,
    blogPostId: 'post-1'
  },
  {
    id: 'highlight-post-4',
    type: 'photo',
    title: 'O início',
    category: 'Viagens',
    location: 'Brasil & Moçambique',
    snippet: 'Relato dos primeiros passos da YAH Hope nas aldeias de Nampula, os desafios do acolhimento e as sementes que germinaram.',
    content: `<p>Chegar em uma nova comunidade exige respeito, escuta atenta e vínculo sincero. Antes de qualquer projeto, sentamos com os anciãos e as mães locais.</p><p>Foi a partir desse diálogo que entendemos as urgências: nutrição infantil, capacitação profissional e acesso à água limpa.</p>`,
    image: 'https://hope.yahchurch.com/wp-content/uploads/2025/09/Foto-e1758835419873-827x1024.png',
    link: '/blog?post=post-4',
    color: '#F49853',
    active: true,
    order: 2,
    blogPostId: 'post-4'
  },
  {
    id: 'highlight-post-5',
    type: 'split',
    title: 'Um pouco sobre Moçambique',
    category: 'Tudo sobre Moçambique',
    location: 'Nampula',
    snippet: 'Cultura, resiliência e as histórias humanas por trás das paisagens e da nossa frente de atuação humanitária.',
    content: `<p>Moçambique é uma terra de rica herança cultural, acolhimento caloroso e pessoas extraordinariamente resilientes.</p><p>Cada comunidade possui um potencial gigantesco que precisa apenas de suporte para florescer com autonomia e dignidade.</p>`,
    image: '/login_bg_real.jpg',
    link: '/blog?post=post-5',
    color: '#92BF78',
    active: true,
    order: 3,
    blogPostId: 'post-5'
  }
];

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

const STORAGE_KEY = 'yah_hope_home_highlights_v6';

export function HomeHighlightsProvider({ children }: { children: React.ReactNode }) {
  const [highlights, setHighlights] = useState<HomeHighlightItem[]>(() => {
    try {
      localStorage.removeItem('yah_hope_home_highlights_v1');
      localStorage.removeItem('yah_hope_home_highlights_v2');
      localStorage.removeItem('yah_hope_home_highlights_v3');
      localStorage.removeItem('yah_hope_home_highlights_v4');
      localStorage.removeItem('yah_hope_home_highlights_v5');
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const deduplicated = deduplicateHighlights(parsed);
          if (deduplicated.length > 0) {
            return deduplicated;
          }
        }
      }
    } catch (e) {
      console.warn('Failed to parse highlights from localStorage', e);
    }
    return DEFAULT_HIGHLIGHTS;
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

  // Try to load from Supabase if table exists
  useEffect(() => {
    let isMounted = true;

    async function loadFromSupabase() {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('home_highlights')
          .select('*')
          .order('order', { ascending: true });

        if (!error && data && data.length > 0 && isMounted) {
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
            const mapped = validItems.map(item => ({
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
            setHighlights(parsed);
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
    const newId = Date.now().toString();
    const newItem: HomeHighlightItem = {
      ...item,
      id: newId,
      active: item.active !== false,
      order: highlights.length + 1
    };

    setHighlights(prev => [...prev, newItem]);

    try {
      await supabase.from('home_highlights').insert([{
        id: newId,
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
        order: newItem.order
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
        id: existing?.id || `highlight-${post.id}`,
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

    setHighlights(prev => deduplicateHighlights(prev.filter(h => !isMatch(h))));

    try {
      await supabase
        .from('home_highlights')
        .delete()
        .or(`blog_post_id.eq.${blogPostId},id.eq.highlight-${blogPostId},id.eq.blog-${blogPostId}`);
    } catch {}
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
