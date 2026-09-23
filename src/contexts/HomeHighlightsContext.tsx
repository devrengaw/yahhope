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
    title: 'Casa Nutri: Resgatando 9 Crianças em Nampula',
    category: 'Nutrição & Saúde Infantil',
    location: 'Moçambique',
    snippet: 'Acompanhamento terapêutico e nutricional para 9 crianças recuperarem peso e saúde com dignidade.',
    content: `Na província de Nampula, em Moçambique, a desnutrição infantil severa é uma das maiores ameaças ao desenvolvimento e sobrevivência de crianças em seus primeiros anos de vida.

A Casa Nutri nasceu para transformar essa realidade. Com acompanhamento clínico semanal, introdução alimentar fortificada e educação nutricional para as mães, resgatamos 9 crianças da curva crítica de desnutrição.

Principais frentes de atuação:
• Refeições terapêuticas e acompanhamento nutricional contínuo.
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
    title: 'Bolsas Universitárias: Da Vulnerabilidade ao Diploma',
    category: 'Educação Superior',
    location: 'Moçambique',
    snippet: 'Custeio acadêmico e mentoria para que 5 jovens capacitados concluam a faculdade e liderem suas comunidades.',
    content: `O acesso ao ensino superior em Moçambique é um privilégio restrito a poucos. Jovens brilhantes de comunidades vulneráveis frequentemente são forçados a interromper seus estudos por falta de recursos para mensalidades, livros e transporte.

O programa de Bolsas Universitárias da YAH Hope está custeando a graduação integral e oferecendo mentoria para estudantes em cursos estratégicos para o desenvolvimento local, como Enfermagem, Administração e Pedagogia.

Além da bolsa financeira, cada jovem recebe acompanhamento pessoal para inserção no mercado de trabalho e capacitação de liderança para retornarem e multiplicarem o impacto em suas comunidades.`,
    image: 'https://hope.yahchurch.com/wp-content/uploads/2025/09/IMG5.avif',
    link: '/blog?post=post-2',
    color: '#88A1F2',
    active: false, // Inativo: "nao tem os jovens universitarios ainda"
    order: 2,
    blogPostId: 'post-2'
  },
  {
    id: 3,
    type: 'photo',
    title: 'Oficinas de Costura & Hortas para Mães',
    category: 'Autonomia & Renda',
    location: 'Moçambique',
    snippet: 'Capacitação profissional e fomento à agricultura familiar para que mães gerem renda própria e sustentem suas famílias com dignidade.',
    content: `A autonomia financeira feminina é o pilar mais sólido para erradicar a fome de forma perene. Quando uma mãe adquire uma profissão, toda a sua família é transformada.

Através das nossas oficinas de costura industrial e implantação de hortas comunitárias orgânicas, mais de 30 mulheres já aprenderam técnicas produtivas e estão vendendo seus produtos nos mercados locais.

O projeto fornece máquinas de costura, sementes selecionadas e treinamento em gestão de pequenos negócios familiares para garantir sustentabilidade a longo prazo.`,
    image: 'https://hope.yahchurch.com/wp-content/uploads/2025/09/Foto-e1758835419873-827x1024.png',
    link: '/blog?post=post-3',
    color: '#EBC878',
    active: true,
    order: 3,
    blogPostId: 'post-3'
  },
  {
    id: 4,
    type: 'photo',
    title: 'Ação Humanitária: Cuidado Integral e Fé Prática',
    category: 'Ação Social',
    location: 'Brasil & Moçambique',
    snippet: 'Levando esperança, suprimentos emergenciais e amparo espiritual para famílias em situação de vulnerabilidade extrema.',
    content: `Em momentos de crise climática e escassez, a resposta humanitária precisa ser imediata, calorosa e abrangente. Nossas equipes atuam na linha de frente distribuindo água potável, roupas, cobertores e cestas alimentares completas.

Mais do que auxílio material, levamos acolhimento humano, oração e amparo espiritual para restaurar a dignidade e a esperança de famílias que perderam tudo em enchentes e secas severas.`,
    image: 'https://hope.yahchurch.com/wp-content/uploads/2025/09/PARTICIPE-DESTA-MISSAO-1.png',
    link: '/blog?post=post-4',
    color: '#F49853',
    active: true,
    order: 4,
    blogPostId: 'post-4'
  },
  {
    id: 5,
    type: 'split',
    title: 'Saúde Preventiva e Higiene Familiar',
    category: 'Saúde Comunitária',
    location: 'Nampula',
    snippet: 'Visitas domiciliares periódicas, distribuição de kits de higiene e acompanhamento médico básico preventivo em comunidades de Nampula.',
    content: `A prevenção de doenças infecciosas e parasitárias começa com o acesso à água limpa, hábitos de higiene e diagnóstico precoce nas aldeias.

Nossos agentes de saúde comunitária realizam visitas domiciliares periódicas em Nampula, distribuindo kits familiares de higiene, pastilhas de cloro para desinfecção de poços e promovendo palestras práticas sobre saneamento básico e prevenção da malária.`,
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

const STORAGE_KEY = 'yah_hope_home_highlights_v3';

export function HomeHighlightsProvider({ children }: { children: React.ReactNode }) {
  const [highlights, setHighlights] = useState<HomeHighlightItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
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
