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

export const DEFAULT_HIGHLIGHTS: HomeHighlightItem[] = [
  {
    id: 1,
    type: 'photo',
    title: 'O propósito de uma ilha',
    category: 'Nutrição & Saúde Infantil',
    location: 'Moçambique',
    snippet: 'Nosso centro nutricional acolhe crianças em estado crítico de vulnerabilidade alimentar, fornecendo dietas balanceadas e assistência médica contínua.',
    content: `Na província de Nampula, em Moçambique, a desnutrição infantil severa é uma das maiores ameaças ao desenvolvimento e sobrevivência de crianças em seus primeiros anos de vida.

A Casa Nutri nasceu para transformar essa realidade. Com acompanhamento clínico semanal, introdução alimentar fortificada e educação nutricional para as mães, resgatamos crianças da curva crítica de desnutrição.

Impacto Direto:
• Mais de 1.800 refeições terapêuticas distribuídas a cada mês.
• Recuperação do peso ideal e fortalecimento imunológico.
• Acompanhamento médico e psicológico com a família.

Cada sorriso devolvido representa o futuro que renasce em solo fértil de esperança e solidariedade.`,
    image: 'https://hope.yahchurch.com/wp-content/uploads/2025/09/HOPE-ALFACES.avif',
    link: '/blog?post=post-1',
    color: '#92BF78',
    active: true,
    order: 1,
    blogPostId: 'post-1'
  },
  {
    id: 2,
    type: 'split',
    title: 'Um problema crônico',
    category: 'Tudo sobre Moçambique',
    location: 'Moçambique',
    snippet: 'Compreendendo as raízes históricas e estruturais das dificuldades alimentares e como a capacitação comunitária rompe ciclos geracionais.',
    content: `O acesso à água potável e nutrição digna em Moçambique continua sendo um desafio para milhões de famílias vulneráveis.

Nossa missão atua não somente no socorro emergencial imediato, mas no empoderamento sustentável da comunidade com poços artesianos e hortas agroecológicas.

A educação sanitária e a autonomia familiar garantem que as conquistas nutricionais de hoje permaneçam amanhã.`,
    image: 'https://hope.yahchurch.com/wp-content/uploads/2025/09/IMG5.avif',
    link: '/blog?post=post-2',
    color: '#88A1F2',
    active: false,
    order: 2,
    blogPostId: 'post-2'
  },
  {
    id: 3,
    type: 'photo',
    title: 'Você tem a firme certeza?',
    category: 'Pense e reflita',
    location: 'Moçambique',
    snippet: 'Uma reflexão sobre fé em ação prática, generosidade com propósito e o chamado individual para transformar a dor do próximo em esperança.',
    content: `A compaixão que não se move em direção ao necessitado permanece apenas como um belo sentimento. O Evangelho vivo se manifesta no prato de comida e no remédio entregue.

Quando nos perguntamos sobre o impacto da nossa vida, o padrão não é quanto acumulamos, mas quantas vidas puderam respirar aliviadas pela nossa presença.`,
    image: 'https://hope.yahchurch.com/wp-content/uploads/2025/09/PARTICIPE-DESTA-MISSAO-1.png',
    link: '/blog?post=post-3',
    color: '#EBC878',
    active: false,
    order: 3,
    blogPostId: 'post-3'
  },
  {
    id: 4,
    type: 'photo',
    title: 'O início',
    category: 'Viagens',
    location: 'Moçambique',
    snippet: 'Relato dos primeiros passos da YAH Hope nas aldeias de Nampula, os desafios do acolhimento e as sementes que germinaram.',
    content: `Chegar em uma nova comunidade exige respeito, escuta atenta e vínculo sincero. Antes de qualquer projeto, sentamos com os anciãos e as mães locais.

Foi a partir desse diálogo que entendemos as urgências: nutrição infantil, capacitação profissional e acesso à água limpa.`,
    image: 'https://hope.yahchurch.com/wp-content/uploads/2025/09/Foto-e1758835419873-827x1024.png',
    link: '/blog?post=post-4',
    color: '#F49853',
    active: true,
    order: 4,
    blogPostId: 'post-4'
  },
  {
    id: 5,
    type: 'split',
    title: 'Um pouco sobre Moçambique',
    category: 'Tudo sobre Moçambique',
    location: 'Nampula',
    snippet: 'Cultura, resiliência e as histórias humanas por trás das paisagens e da nossa frente de atuação humanitária.',
    content: `Moçambique é uma terra de rica herança cultural, acolhimento caloroso e pessoas extraordinariamente resilientes.

Cada comunidade possui um potencial gigantesco que precisa apenas de suporte para florescer com autonomia e dignidade.`,
    image: '/login_bg_real.jpg',
    link: '/blog?post=post-5',
    color: '#92BF78',
    active: true,
    order: 5,
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

const STORAGE_KEY = 'yah_hope_home_highlights_v4';

export function HomeHighlightsProvider({ children }: { children: React.ReactNode }) {
  const [highlights, setHighlights] = useState<HomeHighlightItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const hasOldMockups = parsed.some(h => String(h.title).toLowerCase().includes('casa nutri'));
          if (!hasOldMockups) {
            return parsed;
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
      localStorage.setItem(STORAGE_KEY, JSON.stringify(highlights));
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
          setHighlights(data.map(item => ({
            id: item.id,
            type: item.type || 'photo',
            title: item.title,
            category: item.category,
            location: item.location,
            snippet: item.snippet || '',
            content: item.content || '',
            image: item.image,
            link: item.link || '/projetos',
            color: item.color || '#F49853',
            active: item.active !== false,
            order: item.order || 0
          })));
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
    setHighlights(prev => prev.filter(item => String(item.id) !== String(id)));

    try {
      await supabase.from('home_highlights').delete().eq('id', id);
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
    setHighlights(ordered);

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
    const existingIndex = highlights.findIndex(
      h => h.blogPostId === post.id || String(h.id) === `blog-${post.id}`
    );

    if (existingIndex >= 0) {
      const existing = highlights[existingIndex];
      const updated: Partial<HomeHighlightItem> = {
        title: post.title,
        category: post.category || existing.category,
        location: post.location || existing.location || 'Moçambique',
        snippet: post.snippet !== undefined ? post.snippet : existing.snippet,
        content: post.content !== undefined ? post.content : existing.content,
        image: post.image || existing.image,
        link: `/blog?post=${post.id}`,
        type: post.highlight_type || existing.type,
        color: post.highlight_color || existing.color,
        active: post.active !== undefined ? post.active : true,
        blogPostId: post.id
      };
      await updateHighlight(existing.id, updated);
    } else {
      const newItem: Omit<HomeHighlightItem, 'id'> = {
        title: post.title,
        category: post.category || 'Blog',
        location: post.location || 'Moçambique',
        snippet: post.snippet || '',
        content: post.content || '',
        image: post.image,
        link: `/blog?post=${post.id}`,
        type: post.highlight_type || 'split',
        color: post.highlight_color || '#F49853',
        active: post.active !== undefined ? post.active : true,
        blogPostId: post.id,
        order: highlights.length + 1
      };
      await addHighlight(newItem);
    }
  };

  const removeBlogPostHighlight = async (blogPostId: string) => {
    const target = highlights.find(
      h => h.blogPostId === blogPostId || String(h.id) === `blog-${blogPostId}`
    );
    if (target) {
      await deleteHighlight(target.id);
    }
  };

  const isBlogPostHighlighted = (blogPostId: string) => {
    return highlights.some(
      h => (h.blogPostId === blogPostId || String(h.id) === `blog-${blogPostId}`) && h.active !== false
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
