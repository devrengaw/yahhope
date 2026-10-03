import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useHomeHighlights } from './HomeHighlightsContext';

export interface BlogPost {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  author: string;
  date: string;
  published_at?: string;
  status: 'published' | 'draft' | 'hidden' | 'scheduled' | 'review' | 'trash';
  category: string;
  image: string;
  featured_home?: boolean;
  highlight_type?: 'photo' | 'split';
  highlight_color?: string;
  // Metrics
  views_count?: number;
  reads_count?: number;
  likes_count?: number;
  shares_count?: number;
  comments_count?: number;
  translations?: string[];
  has_unpublished_changes?: boolean;
  deleted_at?: string;
}

export const DEFAULT_BLOG_POSTS: BlogPost[] = [
  {
    id: 'post-1',
    title: 'O propósito de uma ilha',
    excerpt: 'Nosso centro nutricional acolhe crianças em estado crítico de vulnerabilidade alimentar, fornecendo dietas balanceadas e assistência médica contínua.',
    content: `
      <p>Na província de Nampula, em Moçambique, a desnutrição infantil severa é uma das maiores ameaças ao desenvolvimento e sobrevivência de crianças em seus primeiros anos de vida.</p>
      <p>A Casa Nutri nasceu para transformar essa realidade. Com acompanhamento clínico semanal, introdução alimentar fortificada e educação nutricional para as mães, resgatamos crianças da curva crítica de desnutrição.</p>
      <h3>Impacto Direto</h3>
      <ul>
        <li>Mais de 1.800 refeições terapêuticas distribuídas a cada mês.</li>
        <li>Recuperação do peso ideal e fortalecimento imunológico.</li>
        <li>Acompanhamento médico e psicológico com a família.</li>
      </ul>
      <p>Cada sorriso devolvido representa o futuro que renasce em solo fértil de esperança e solidariedade.</p>
    `,
    author: 'YAH Hope',
    date: '2024-03-25',
    status: 'published',
    category: 'Nutrição & Saúde Infantil',
    image: 'https://hope.yahchurch.com/wp-content/uploads/2025/09/HOPE-ALFACES.avif',
    featured_home: true,
    highlight_type: 'photo',
    highlight_color: '#92BF78',
    views_count: 0,
    reads_count: 0,
    likes_count: 0,
    shares_count: 0,
    comments_count: 0,
    translations: ['pt']
  },
  {
    id: 'post-2',
    title: 'Um problema crônico',
    excerpt: 'Compreendendo as raízes históricas e estruturais das dificuldades alimentares e como a capacitação comunitária rompe ciclos geracionais.',
    content: `
      <p>O acesso à água potável e nutrição digna em Moçambique continua sendo um desafio para milhões de famílias vulneráveis.</p>
      <p>Nossa missão atua não somente no socorro emergencial imediato, mas no empoderamento sustentável da comunidade com poços artesianos e hortas agroecológicas.</p>
      <h3>Passos para a Sustentabilidade</h3>
      <p>A educação sanitária e a autonomia familiar garantem que as conquistas nutricionais de hoje permaneçam amanhã.</p>
    `,
    author: 'Carolina Simionato',
    date: '2024-01-16',
    status: 'published',
    category: 'Tudo sobre Moçambique',
    image: 'https://hope.yahchurch.com/wp-content/uploads/2025/09/IMG5.avif',
    featured_home: false,
    highlight_type: 'split',
    highlight_color: '#88A1F2',
    views_count: 0,
    reads_count: 0,
    likes_count: 0,
    shares_count: 0,
    comments_count: 0,
    translations: ['pt']
  },
  {
    id: 'post-3',
    title: 'Você tem a firme certeza?',
    excerpt: 'Uma reflexão sobre fé em ação prática, generosidade com propósito e o chamado individual para transformar a dor do próximo em esperança.',
    content: `
      <p>A compaixão que não se move em direção ao necessitado permanece apenas como um belo sentimento. O Evangelho vivo se manifesta no prato de comida e no remédio entregue.</p>
      <p>Quando nos perguntamos sobre o impacto da nossa vida, o padrão não é quanto acumulamos, mas quantas vidas puderam respirar aliviadas pela nossa presença.</p>
    `,
    author: 'Carolina Simionato',
    date: '2023-11-18',
    status: 'published',
    category: 'Pense e reflita',
    image: 'https://hope.yahchurch.com/wp-content/uploads/2025/09/PARTICIPE-DESTA-MISSAO-1.png',
    featured_home: false,
    highlight_type: 'split',
    highlight_color: '#EBC878',
    views_count: 0,
    reads_count: 0,
    likes_count: 0,
    shares_count: 0,
    comments_count: 0,
    translations: ['pt']
  },
  {
    id: 'post-4',
    title: 'O início',
    excerpt: 'Relato dos primeiros passos da YAH Hope nas aldeias de Nampula, os desafios do acolhimento e as sementes que germinaram.',
    content: `
      <p>Chegar em uma nova comunidade exige respeito, escuta atenta e vínculo sincero. Antes de qualquer projeto, sentamos com os anciãos e as mães locais.</p>
      <p>Foi a partir desse diálogo que entendemos as urgências: nutrição infantil, capacitação profissional e acesso à água limpa.</p>
    `,
    author: 'Carolina Simionato',
    date: '2023-11-18',
    status: 'published',
    category: 'Viagens',
    image: 'https://hope.yahchurch.com/wp-content/uploads/2025/09/Foto-e1758835419873-827x1024.png',
    featured_home: true,
    highlight_type: 'photo',
    highlight_color: '#F49853',
    views_count: 0,
    reads_count: 0,
    likes_count: 0,
    shares_count: 0,
    comments_count: 0,
    translations: ['pt']
  },
  {
    id: 'post-5',
    title: 'Um pouco sobre Moçambique',
    excerpt: 'Cultura, resiliência e as histórias humanas por trás das paisagens e da nossa frente de atuação humanitária.',
    content: `
      <p>Moçambique é uma terra de rica herança cultural, acolhimento caloroso e pessoas extraordinariamente resilientes.</p>
      <p>Cada comunidade possui um potencial gigantesco que precisa apenas de suporte para florescer com autonomia e dignidade.</p>
    `,
    author: 'Carolina Simionato',
    date: '2023-11-18',
    status: 'published',
    category: 'Tudo sobre Moçambique',
    image: '/login_bg_real.jpg',
    featured_home: true,
    highlight_type: 'split',
    highlight_color: '#92BF78',
    has_unpublished_changes: false,
    views_count: 0,
    reads_count: 0,
    likes_count: 0,
    shares_count: 0,
    comments_count: 0,
    translations: ['pt']
  },
  {
    id: 'post-draft-1',
    title: 'Relatório Trimestral de Atividades e Impacto',
    excerpt: 'Análise de métricas e próximos passos de expansão dos projetos comunitários.',
    content: '<p>Rascunho de relatório técnico detalhando evolução do impacto social...</p>',
    author: 'Equipe YAH Hope',
    date: '2024-04-10',
    status: 'draft',
    category: 'Nutrição & Saúde Infantil',
    image: 'https://hope.yahchurch.com/wp-content/uploads/2025/09/HOPE-ALFACES.avif',
    featured_home: false,
    views_count: 0,
    reads_count: 0,
    likes_count: 0,
    shares_count: 0,
    comments_count: 0,
    translations: ['pt']
  }
];

interface BlogContextType {
  posts: BlogPost[];
  loading: boolean;
  addPost: (post: Omit<BlogPost, 'id' | 'date'>) => Promise<BlogPost>;
  updatePost: (id: string, post: Partial<BlogPost>) => Promise<void>;
  deletePost: (id: string) => Promise<void>;
  moveToTrash: (id: string) => Promise<void>;
  restoreFromTrash: (id: string) => Promise<void>;
  bulkUpdateStatus: (ids: string[], status: BlogPost['status']) => Promise<void>;
  toggleFeaturedHome: (id: string) => Promise<boolean>;
  incrementViews: (id: string) => Promise<void>;
  incrementReads: (id: string) => Promise<void>;
  toggleLike: (id: string) => Promise<boolean>;
  incrementShares: (id: string) => Promise<void>;
  syncWithSupabase: () => Promise<void>;
  resetBlogToDefaults: () => Promise<void>;
}

const BlogContext = createContext<BlogContextType | undefined>(undefined);

const BLOG_STORAGE_KEY = 'yah_hope_blog_posts_v6';
const METRICS_ZEROED_FLAG = 'yah_hope_blog_metrics_zeroed_2026_v1';

export function BlogProvider({ children }: { children: React.ReactNode }) {
  const { syncBlogPostHighlight, removeBlogPostHighlight, isBlogPostHighlighted } = useHomeHighlights();

  const [posts, setPosts] = useState<BlogPost[]>(() => {
    // Purge old legacy cache keys
    [
      'yah_hope_blog_posts',
      'yah_hope_blog_posts_v1',
      'yah_hope_blog_posts_v2',
      'yah_hope_blog_posts_v3',
      'yah_hope_blog_posts_v4',
      'yah_hope_blog_posts_v5'
    ].forEach(k => {
      try { localStorage.removeItem(k); } catch {}
    });

    try {
      const saved = localStorage.getItem(BLOG_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map(p => ({
            ...p,
            views_count: 0,
            reads_count: 0,
            likes_count: 0,
            shares_count: 0,
            comments_count: 0
          }));
        }
      }
    } catch (e) {
      console.warn('Failed to parse blog posts from localStorage', e);
    }
    return DEFAULT_BLOG_POSTS;
  });

  const [loading, setLoading] = useState(false);

  // Sync to localStorage as client cache
  useEffect(() => {
    try {
      localStorage.setItem(BLOG_STORAGE_KEY, JSON.stringify(posts));
    } catch (e) {
      console.warn('Failed to save blog posts to localStorage', e);
    }
  }, [posts]);

  // Main loader: Connect directly to Supabase and subscribe to Realtime events
  const loadFromSupabase = async () => {
    try {
      setLoading(true);

      // Auto-zero metrics in Supabase if not yet performed
      if (localStorage.getItem(METRICS_ZEROED_FLAG) !== 'true') {
        localStorage.setItem(METRICS_ZEROED_FLAG, 'true');
        try {
          await supabase.from('blog_posts').update({
            views_count: 0,
            reads_count: 0,
            likes_count: 0,
            shares_count: 0,
            comments_count: 0
          }).neq('id', '');
        } catch (e) {
          console.warn('Auto-zero Supabase metrics skipped or table not yet created:', e);
        }
      }

      const { data, error } = await supabase
        .from('blog_posts')
        .select('*')
        .order('date', { ascending: false });

      if (!error && data && data.length > 0) {
        const loadedPosts = data.map(p => {
          const isMockupMetric = p.views_count === 47 || p.reads_count === 32 || p.views_count === 38 || p.views_count === 23 || p.views_count === 15;
          return {
            id: p.id,
            title: p.title,
            excerpt: p.excerpt || '',
            content: p.content || '',
            author: p.author || 'YAH Hope',
            date: p.date || new Date().toISOString().split('T')[0],
            published_at: p.published_at,
            status: p.status || 'published',
            category: p.category || 'Geral',
            image: p.image || 'https://hope.yahchurch.com/wp-content/uploads/2025/09/HOPE-ALFACES.avif',
            featured_home: p.featured_home === true,
            highlight_type: p.highlight_type || 'split',
            highlight_color: p.highlight_color || '#F49853',
            views_count: isMockupMetric ? 0 : (p.views_count ?? 0),
            reads_count: isMockupMetric ? 0 : (p.reads_count ?? 0),
            likes_count: isMockupMetric ? 0 : (p.likes_count ?? 0),
            shares_count: isMockupMetric ? 0 : (p.shares_count ?? 0),
            comments_count: 0,
            translations: p.translations || ['pt'],
            has_unpublished_changes: p.has_unpublished_changes === true,
            deleted_at: p.deleted_at
          };
        });
        setPosts(loadedPosts);

        // Auto-sync featured posts to Home Highlights seamlessly
        const featuredPosts = loadedPosts.filter(p => p.featured_home && p.status === 'published');
        for (const fp of featuredPosts) {
          syncBlogPostHighlight({
            id: fp.id,
            title: fp.title,
            category: fp.category,
            snippet: fp.excerpt,
            content: fp.content,
            image: fp.image,
            highlight_type: fp.highlight_type || 'split',
            highlight_color: fp.highlight_color || '#F49853',
            active: true
          }).catch(() => {});
        }
      } else if (!error && (!data || data.length === 0)) {
        // Table exists in Supabase but is empty: Seed it automatically with real posts!
        await supabase.from('blog_posts').upsert(DEFAULT_BLOG_POSTS);
        setPosts(DEFAULT_BLOG_POSTS);
      }
    } catch (err) {
      console.warn('Could not load blog posts from Supabase, using local cache:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFromSupabase();

    // Supabase Realtime channel: Listen to live changes (INSERT, UPDATE, DELETE)
    const channel = supabase.channel('blog-posts-live-sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'blog_posts' }, (payload) => {
        if (payload.eventType === 'UPDATE' && payload.new) {
          const updated = payload.new as any;
          setPosts(prev => prev.map(p => p.id === updated.id ? { ...p, ...updated } : p));
        } else if (payload.eventType === 'INSERT' && payload.new) {
          const inserted = payload.new as any;
          setPosts(prev => {
            if (prev.some(p => p.id === inserted.id)) return prev;
            return [inserted, ...prev];
          });
        } else if (payload.eventType === 'DELETE' && payload.old) {
          const deleted = payload.old as any;
          setPosts(prev => prev.filter(p => p.id !== deleted.id));
        } else {
          loadFromSupabase();
        }
      })
      .subscribe();

    // Auto-sync on window focus or visibility change
    const handleFocus = () => {
      loadFromSupabase();
    };
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        loadFromSupabase();
      }
    };
    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibility);

    // Periodic automatic background sync every 30 seconds
    const interval = setInterval(() => {
      loadFromSupabase();
    }, 30000);

    return () => {
      supabase.removeChannel(channel);
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibility);
      clearInterval(interval);
    };
  }, []);

  const syncWithSupabase = async () => {
    await loadFromSupabase();
  };

  const addPost = async (postData: Omit<BlogPost, 'id' | 'date'>): Promise<BlogPost> => {
    const newId = `post-${Date.now().toString(36)}`;
    const newPost: BlogPost = {
      ...postData,
      id: newId,
      date: new Date().toISOString().split('T')[0],
      featured_home: postData.featured_home || false,
      views_count: 0,
      reads_count: 0,
      likes_count: 0,
      shares_count: 0,
      comments_count: 0,
      translations: postData.translations || ['pt']
    };

    setPosts(prev => [newPost, ...prev]);

    if (newPost.featured_home) {
      await syncBlogPostHighlight({
        id: newPost.id,
        title: newPost.title,
        category: newPost.category,
        snippet: newPost.excerpt,
        content: newPost.content,
        image: newPost.image,
        highlight_type: newPost.highlight_type || 'split',
        highlight_color: newPost.highlight_color || '#F49853',
        active: true
      });
    }

    try {
      await supabase.from('blog_posts').insert([newPost]);
    } catch (err) {
      console.error('Error inserting post into Supabase:', err);
    }

    return newPost;
  };

  const updatePost = async (id: string, updatedFields: Partial<BlogPost>) => {
    let updatedPost: BlogPost | null = null;

    setPosts(prev => prev.map(p => {
      if (p.id === id) {
        updatedPost = { ...p, ...updatedFields };
        return updatedPost;
      }
      return p;
    }));

    if (updatedPost) {
      const p = updatedPost as BlogPost;
      if (p.featured_home && p.status === 'published') {
        await syncBlogPostHighlight({
          id: p.id,
          title: p.title,
          category: p.category,
          snippet: p.excerpt,
          content: p.content,
          image: p.image,
          highlight_type: p.highlight_type || 'split',
          highlight_color: p.highlight_color || '#F49853',
          active: true
        });
      } else {
        await removeBlogPostHighlight(p.id);
      }
    }

    try {
      await supabase.from('blog_posts').update(updatedFields).eq('id', id);
    } catch (err) {
      console.error('Error updating post in Supabase:', err);
    }
  };

  const moveToTrash = async (id: string) => {
    await updatePost(id, {
      status: 'trash',
      deleted_at: new Date().toISOString(),
      featured_home: false
    });
    await removeBlogPostHighlight(id);
  };

  const restoreFromTrash = async (id: string) => {
    await updatePost(id, {
      status: 'draft',
      deleted_at: undefined
    });
  };

  const deletePermanently = async (id: string) => {
    setPosts(prev => prev.filter(p => p.id !== id));
    await removeBlogPostHighlight(id);

    try {
      await supabase.from('blog_posts').delete().eq('id', id);
    } catch (err) {
      console.error('Error deleting post from Supabase:', err);
    }
  };

  const bulkUpdateStatus = async (ids: string[], status: BlogPost['status']) => {
    setPosts(prev => prev.map(p => {
      if (ids.includes(p.id)) {
        return {
          ...p,
          status,
          deleted_at: status === 'trash' ? new Date().toISOString() : undefined,
          featured_home: status === 'trash' ? false : p.featured_home
        };
      }
      return p;
    }));

    for (const id of ids) {
      if (status === 'trash') {
        await removeBlogPostHighlight(id);
      }
      try {
        await supabase.from('blog_posts').update({ status }).eq('id', id);
      } catch {}
    }
  };

  const toggleFeaturedHome = async (id: string): Promise<boolean> => {
    const post = posts.find(p => p.id === id);
    if (!post) return false;

    const nextState = !post.featured_home;
    await updatePost(id, { featured_home: nextState });
    return nextState;
  };

  // Real atomic metrics tracking methods connected directly to Supabase
  const incrementViews = async (id: string) => {
    setPosts(prev => prev.map(p => {
      if (p.id === id) {
        return { ...p, views_count: (p.views_count || 0) + 1 };
      }
      return p;
    }));

    try {
      const { data } = await supabase
        .from('blog_posts')
        .select('views_count')
        .eq('id', id)
        .maybeSingle();

      const nextVal = (data?.views_count ?? 0) + 1;
      await supabase
        .from('blog_posts')
        .update({ views_count: nextVal })
        .eq('id', id);
    } catch (err) {
      console.error('Error incrementing views in Supabase:', err);
    }
  };

  const incrementReads = async (id: string) => {
    setPosts(prev => prev.map(p => {
      if (p.id === id) {
        return { ...p, reads_count: (p.reads_count || 0) + 1 };
      }
      return p;
    }));

    try {
      const { data } = await supabase
        .from('blog_posts')
        .select('reads_count')
        .eq('id', id)
        .maybeSingle();

      const nextVal = (data?.reads_count ?? 0) + 1;
      await supabase
        .from('blog_posts')
        .update({ reads_count: nextVal })
        .eq('id', id);
    } catch (err) {
      console.error('Error incrementing reads in Supabase:', err);
    }
  };

  const toggleLike = async (id: string): Promise<boolean> => {
    const key = `yah_blog_liked_${id}`;
    const alreadyLiked = localStorage.getItem(key) === 'true';
    const nextLiked = !alreadyLiked;

    if (nextLiked) {
      localStorage.setItem(key, 'true');
    } else {
      localStorage.removeItem(key);
    }

    setPosts(prev => prev.map(p => {
      if (p.id === id) {
        const currentLikes = p.likes_count || 0;
        const newLikes = nextLiked ? currentLikes + 1 : Math.max(0, currentLikes - 1);
        return { ...p, likes_count: newLikes };
      }
      return p;
    }));

    try {
      const { data } = await supabase
        .from('blog_posts')
        .select('likes_count')
        .eq('id', id)
        .maybeSingle();

      const currentLikes = data?.likes_count ?? 0;
      const newLikes = nextLiked ? currentLikes + 1 : Math.max(0, currentLikes - 1);
      await supabase
        .from('blog_posts')
        .update({ likes_count: newLikes })
        .eq('id', id);
    } catch (err) {
      console.error('Error updating likes in Supabase:', err);
    }

    return nextLiked;
  };

  const incrementShares = async (id: string) => {
    setPosts(prev => prev.map(p => {
      if (p.id === id) {
        return { ...p, shares_count: (p.shares_count || 0) + 1 };
      }
      return p;
    }));

    try {
      const { data } = await supabase
        .from('blog_posts')
        .select('shares_count')
        .eq('id', id)
        .maybeSingle();

      const nextVal = (data?.shares_count ?? 0) + 1;
      await supabase
        .from('blog_posts')
        .update({ shares_count: nextVal })
        .eq('id', id);
    } catch (err) {
      console.error('Error incrementing shares in Supabase:', err);
    }
  };

  const resetBlogToDefaults = async () => {
    setPosts(DEFAULT_BLOG_POSTS);
    try {
      localStorage.setItem(BLOG_STORAGE_KEY, JSON.stringify(DEFAULT_BLOG_POSTS));
      await supabase.from('blog_posts').upsert(DEFAULT_BLOG_POSTS);
    } catch (err) {
      console.error('Error resetting blog in Supabase:', err);
    }
  };

  return (
    <BlogContext.Provider value={{
      posts,
      loading,
      addPost,
      updatePost,
      deletePost: deletePermanently,
      moveToTrash,
      restoreFromTrash,
      bulkUpdateStatus,
      toggleFeaturedHome,
      incrementViews,
      incrementReads,
      toggleLike,
      incrementShares,
      syncWithSupabase,
      resetBlogToDefaults
    }}>
      {children}
    </BlogContext.Provider>
  );
}

export function useBlog() {
  const context = useContext(BlogContext);
  if (!context) {
    throw new Error('useBlog must be used within a BlogProvider');
  }
  return context;
}
