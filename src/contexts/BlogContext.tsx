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
  status: 'published' | 'draft' | 'hidden' | 'scheduled';
  category: string;
  image: string;
  featured_home?: boolean;
  highlight_type?: 'photo' | 'split';
  highlight_color?: string;
}

export const DEFAULT_BLOG_POSTS: BlogPost[] = [
  {
    id: 'post-1',
    title: 'Casa Nutri: Resgatando 9 Crianças em Nampula',
    excerpt: 'Nosso centro nutricional acolhe crianças em estado crítico de vulnerabilidade alimentar, fornecendo dietas balanceadas e assistência médica contínua.',
    content: `
      <p>Na província de Nampula, em Moçambique, a desnutrição infantil severa é uma das maiores ameaças ao desenvolvimento e sobrevivência de crianças em seus primeiros anos de vida.</p>
      <p>A Casa Nutri nasceu para transformar essa realidade. Com acompanhamento clínico semanal, introdução alimentar fortificada e educação nutricional para as mães, resgatamos 9 crianças da curva crítica de desnutrição.</p>
      <h3>Impacto Direto</h3>
      <ul>
        <li>Mais de 1.800 refeições terapêuticas distribuídas a cada mês.</li>
        <li>Recuperação do peso ideal e fortalecimento imunológico.</li>
        <li>Acompanhamento médico e psicológico com a família.</li>
      </ul>
      <p>Cada sorriso devolvido representa o futuro que renasce em solo fértil de esperança e solidariedade.</p>
    `,
    author: 'Equipe de Nutrição YAH Hope',
    date: '2025-09-15',
    status: 'published',
    category: 'Nutrição & Saúde Infantil',
    image: 'https://hope.yahchurch.com/wp-content/uploads/2025/09/HOPE-ALFACES.avif',
    featured_home: true,
    highlight_type: 'photo',
    highlight_color: '#92BF78'
  },
  {
    id: 'post-2',
    title: 'Bolsas Universitárias: Da Vulnerabilidade ao Diploma',
    excerpt: 'Custeio acadêmico e mentoria para jovens capacitados concluírem a faculdade e liderarem suas comunidades.',
    content: `
      <p>O acesso ao ensino superior em Moçambique é um privilégio restrito a poucos. Jovens brilhantes de comunidades vulneráveis frequentemente são forçados a interromper seus estudos por falta de recursos para mensalidades, livros e transporte.</p>
      <p>O programa de Bolsas Universitárias da YAH Hope planeja custear a graduação integral e oferecer mentoria para estudantes em cursos estratégicos para o desenvolvimento local, como Enfermagem, Administração e Pedagogia.</p>
      <h3>Educação como Ferramenta de Libertação</h3>
      <p>Além da bolsa financeira, cada jovem receberá acompanhamento pessoal para inserção no mercado de trabalho e capacitação de liderança para retornarem e multiplicarem o impacto em suas comunidades.</p>
    `,
    author: 'Coordenação Acadêmica',
    date: '2025-09-18',
    status: 'published',
    category: 'Educação Superior',
    image: 'https://hope.yahchurch.com/wp-content/uploads/2025/09/IMG5.avif',
    featured_home: false, // Inativo na Home: "nao tem os jovens universitarios ainda"
    highlight_type: 'split',
    highlight_color: '#88A1F2'
  },
  {
    id: 'post-3',
    title: 'Oficinas de Costura & Hortas para Mães',
    excerpt: 'Capacitação profissional e fomento à agricultura familiar para que mães gerem renda própria e sustentem suas famílias com dignidade.',
    content: `
      <p>A autonomia financeira feminina é o pilar mais sólido para erradicar a fome de forma perene. Quando uma mãe adquire uma profissão, toda a sua família é transformada.</p>
      <p>Através das nossas oficinas de costura industrial e implantação de hortas comunitárias orgânicas, mais de 30 mulheres já aprenderam técnicas produtivas e estão vendendo seus produtos nos mercados locais.</p>
    `,
    author: 'Geração de Renda YAH Hope',
    date: '2025-09-20',
    status: 'published',
    category: 'Autonomia & Renda',
    image: 'https://hope.yahchurch.com/wp-content/uploads/2025/09/Foto-e1758835419873-827x1024.png',
    featured_home: true,
    highlight_type: 'photo',
    highlight_color: '#EBC878'
  },
  {
    id: 'post-4',
    title: 'Ação Humanitária: Cuidado Integral e Fé Prática',
    excerpt: 'Levando esperança, suprimentos emergenciais e amparo espiritual para famílias em situação de vulnerabilidade extrema.',
    content: `
      <p>Em momentos de crise climática e escassez, a resposta humanitária precisa ser imediata, calorosa e abrangente. Nossas equipes atuam na linha de frente distribuindo água potável, roupas e cestas alimentares.</p>
    `,
    author: 'Missões & Socorro',
    date: '2025-09-21',
    status: 'published',
    category: 'Ação Social',
    image: 'https://hope.yahchurch.com/wp-content/uploads/2025/09/PARTICIPE-DESTA-MISSAO-1.png',
    featured_home: true,
    highlight_type: 'photo',
    highlight_color: '#F49853'
  },
  {
    id: 'post-5',
    title: 'Saúde Preventiva e Higiene Familiar',
    excerpt: 'Visitas domiciliares periódicas, distribuição de kits de higiene e acompanhamento médico básico preventivo em comunidades de Nampula.',
    content: `
      <p>A prevenção de doenças infecciosas e parasitárias começa com o acesso à água limpa, hábitos de higiene e diagnóstico precoce nas aldeias.</p>
    `,
    author: 'Saúde Comunitária',
    date: '2025-09-22',
    status: 'published',
    category: 'Saúde Comunitária',
    image: '/login_bg_real.jpg',
    featured_home: true,
    highlight_type: 'split',
    highlight_color: '#92BF78'
  }
];

interface BlogContextType {
  posts: BlogPost[];
  loading: boolean;
  addPost: (post: Omit<BlogPost, 'id' | 'date'>) => Promise<BlogPost>;
  updatePost: (id: string, post: Partial<BlogPost>) => Promise<void>;
  deletePost: (id: string) => Promise<void>;
  toggleFeaturedHome: (id: string) => Promise<boolean>;
  resetBlogToDefaults: () => Promise<void>;
}

const BlogContext = createContext<BlogContextType | undefined>(undefined);

const BLOG_STORAGE_KEY = 'yah_hope_blog_posts_v2';

export function BlogProvider({ children }: { children: React.ReactNode }) {
  const { syncBlogPostHighlight, removeBlogPostHighlight, isBlogPostHighlighted } = useHomeHighlights();

  const [posts, setPosts] = useState<BlogPost[]>(() => {
    try {
      const saved = localStorage.getItem(BLOG_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Failed to parse blog posts from localStorage', e);
    }
    return DEFAULT_BLOG_POSTS;
  });

  const [loading, setLoading] = useState(false);

  // Sync to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(BLOG_STORAGE_KEY, JSON.stringify(posts));
    } catch (e) {
      console.warn('Failed to save blog posts to localStorage', e);
    }
  }, [posts]);

  // Sync with Supabase if table exists
  useEffect(() => {
    let isMounted = true;
    async function loadFromSupabase() {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('blog_posts')
          .select('*')
          .order('date', { ascending: false });

        if (!error && data && data.length > 0 && isMounted) {
          setPosts(data.map(p => ({
            id: p.id,
            title: p.title,
            excerpt: p.excerpt || '',
            content: p.content || '',
            author: p.author || 'Admin',
            date: p.date || new Date().toISOString().split('T')[0],
            published_at: p.published_at,
            status: p.status || 'published',
            category: p.category || 'Geral',
            image: p.image || 'https://hope.yahchurch.com/wp-content/uploads/2025/09/HOPE-ALFACES.avif',
            featured_home: p.featured_home === true,
            highlight_type: p.highlight_type || 'split',
            highlight_color: p.highlight_color || '#F49853'
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
      if (e.key === BLOG_STORAGE_KEY && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          if (Array.isArray(parsed)) {
            setPosts(parsed);
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

  const addPost = async (postData: Omit<BlogPost, 'id' | 'date'>): Promise<BlogPost> => {
    const newId = `post-${Date.now().toString(36)}`;
    const newPost: BlogPost = {
      ...postData,
      id: newId,
      date: new Date().toISOString().split('T')[0],
      featured_home: postData.featured_home || false
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
    } catch {}

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
      if (p.featured_home) {
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
    } catch {}
  };

  const deletePost = async (id: string) => {
    setPosts(prev => prev.filter(p => p.id !== id));
    await removeBlogPostHighlight(id);

    try {
      await supabase.from('blog_posts').delete().eq('id', id);
    } catch {}
  };

  // Toggle "Colocar no destaque" button directly
  const toggleFeaturedHome = async (id: string): Promise<boolean> => {
    const post = posts.find(p => p.id === id);
    if (!post) return false;

    // Check if currently highlighted either on post or in highlights context
    const currentIsHighlighted = post.featured_home === true || isBlogPostHighlighted(id);
    const nextState = !currentIsHighlighted;

    await updatePost(id, { featured_home: nextState });

    if (nextState) {
      await syncBlogPostHighlight({
        id: post.id,
        title: post.title,
        category: post.category,
        snippet: post.excerpt,
        content: post.content,
        image: post.image,
        highlight_type: post.highlight_type || 'split',
        highlight_color: post.highlight_color || '#F49853',
        active: true
      });
    } else {
      await removeBlogPostHighlight(post.id);
    }

    return nextState;
  };

  const resetBlogToDefaults = async () => {
    setPosts(DEFAULT_BLOG_POSTS);
    try {
      localStorage.setItem(BLOG_STORAGE_KEY, JSON.stringify(DEFAULT_BLOG_POSTS));
    } catch {}
  };

  return (
    <BlogContext.Provider value={{
      posts,
      loading,
      addPost,
      updatePost,
      deletePost,
      toggleFeaturedHome,
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
