import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate, useParams, Link } from 'react-router-dom';
import { useBlog, BlogPost } from '../../contexts/BlogContext';
import { 
  Calendar, 
  User, 
  ArrowRight, 
  ArrowLeft, 
  Star, 
  Share2, 
  Heart, 
  Clock, 
  Check, 
  Bookmark,
  Sparkles,
  Eye,
  BookOpen
} from 'lucide-react';
import { SEO } from '../../components/common/SEO';

export function Blog() {
  const { posts, incrementViews, incrementReads, toggleLike, incrementShares } = useBlog();
  const { id } = useParams<{ id?: string }>();
  const location = useLocation();
  const navigate = useNavigate();

  const [selectedPost, setSelectedPost] = useState<BlogPost | null>(null);
  const [copied, setCopied] = useState(false);
  const [hasLiked, setHasLiked] = useState(false);
  const [isLiking, setIsLiking] = useState(false);

  // Sync selectedPost with URL (?post=... or /blog/:id)
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const targetId = id || params.get('post');

    if (targetId) {
      const found = posts.find(
        p => String(p.id) === String(targetId) || 
             p.id === `post-${targetId}` || 
             `post-${p.id}` === String(targetId)
      );
      if (found) {
        setSelectedPost(found);
        setHasLiked(localStorage.getItem(`yah_blog_liked_${found.id}`) === 'true');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        setSelectedPost(null);
      }
    } else {
      setSelectedPost(null);
    }
  }, [location.search, id, posts]);

  // Track Views & Reads when an article is opened
  useEffect(() => {
    if (!selectedPost) return;

    const postId = selectedPost.id;
    const viewKey = `yah_viewed_${postId}`;
    const readKey = `yah_read_${postId}`;

    // 1. Register View once per session
    if (!sessionStorage.getItem(viewKey)) {
      sessionStorage.setItem(viewKey, 'true');
      incrementViews(postId);
    }

    // 2. Register Read after 15 seconds or scroll past 60%
    let readRegistered = !!sessionStorage.getItem(readKey);

    const markAsRead = () => {
      if (!readRegistered) {
        readRegistered = true;
        sessionStorage.setItem(readKey, 'true');
        incrementReads(postId);
      }
    };

    const timer = setTimeout(markAsRead, 15000);

    const handleScroll = () => {
      const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (scrollHeight > 0) {
        const scrollPercent = (window.scrollY / scrollHeight) * 100;
        if (scrollPercent >= 60) {
          markAsRead();
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      clearTimeout(timer);
      window.removeEventListener('scroll', handleScroll);
    };
  }, [selectedPost?.id]);

  const publishedPosts = posts.filter(p => p.status === 'published');

  const handleOpenPost = (post: BlogPost) => {
    setSelectedPost(post);
    navigate(`/blog?post=${post.id}`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleClosePost = () => {
    setSelectedPost(null);
    navigate('/blog');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleShare = async () => {
    if (!selectedPost) return;
    try {
      incrementShares(selectedPost.id);
      if (navigator.share) {
        await navigator.share({
          title: selectedPost.title,
          text: selectedPost.excerpt,
          url: window.location.href,
        });
      } else {
        await navigator.clipboard.writeText(window.location.href);
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      }
    } catch {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleToggleLike = async () => {
    if (!selectedPost || isLiking) return;
    setIsLiking(true);
    const nowLiked = await toggleLike(selectedPost.id);
    setHasLiked(nowLiked);
    setIsLiking(false);
  };

  // ==========================================
  // DEDICATED FULL ARTICLE PAGE
  // ==========================================
  if (selectedPost) {
    const relatedPosts = publishedPosts.filter(p => p.id !== selectedPost.id).slice(0, 3);

    return (
      <div className="min-h-screen bg-slate-50/60 py-10 sm:py-14 px-4 sm:px-6 lg:px-8 font-gotham-regular">
        <SEO 
          title={`${selectedPost.title} | Blog YAH Hope`}
          description={selectedPost.excerpt || selectedPost.content?.slice(0, 155) || 'Acompanhe esta história de transformação e impacto social da YAH Hope.'}
          ogImage={selectedPost.image}
          ogType="article"
          canonical={`https://yahhope.org/blog/${selectedPost.id}`}
          jsonLd={{
            "@context": "https://schema.org",
            "@type": "BlogPosting",
            "headline": selectedPost.title,
            "image": selectedPost.image ? [selectedPost.image] : undefined,
            "author": {
              "@type": "Person",
              "name": selectedPost.author || 'Equipe YAH Hope'
            },
            "publisher": {
              "@type": "NGO",
              "name": "YAH Hope",
              "logo": {
                "@type": "ImageObject",
                "url": "https://yahhope.org/logo.png"
              }
            },
            "description": selectedPost.excerpt || selectedPost.title
          }}
        />
        <div className="max-w-4xl mx-auto">
          
          {/* Top Bar Navigation */}
          <div className="mb-6 sm:mb-8 flex items-center justify-between gap-4">
            <button
              type="button"
              onClick={handleClosePost}
              className="inline-flex items-center gap-2 text-xs sm:text-sm font-gotham-bold text-slate-600 hover:text-[#F49853] transition-colors py-2 px-3 sm:px-4 rounded-xl hover:bg-white bg-white/60 border border-slate-200/80 shadow-xs cursor-pointer group"
            >
              <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
              <span>Voltar para todas as matérias</span>
            </button>

            <div className="flex items-center gap-2">
              {/* Like Button in Header */}
              <button
                type="button"
                onClick={handleToggleLike}
                className={`inline-flex items-center gap-1.5 text-xs font-gotham-bold py-2 px-3.5 rounded-xl border shadow-xs transition-all cursor-pointer ${
                  hasLiked 
                    ? 'bg-rose-50 text-rose-600 border-rose-200' 
                    : 'bg-white text-slate-600 border-slate-200/80 hover:text-rose-600'
                }`}
              >
                <Heart size={14} className={hasLiked ? "fill-rose-500 text-rose-500" : ""} />
                <span>{selectedPost.likes_count ?? 0}</span>
              </button>

              {/* Share Button in Header */}
              <button
                type="button"
                onClick={handleShare}
                className="inline-flex items-center gap-2 text-xs font-gotham-bold text-slate-600 hover:text-slate-900 bg-white border border-slate-200/80 py-2 px-3.5 sm:px-4 rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                {copied ? <Check size={14} className="text-emerald-500" /> : <Share2 size={14} />}
                <span>{copied ? 'Link Copiado!' : 'Compartilhar'}</span>
              </button>
            </div>
          </div>

          {/* Dedicated Article Document */}
          <article className="bg-white rounded-3xl shadow-sm border border-slate-200/80 overflow-hidden">
            
            {/* Article Hero Cover */}
            <div className="relative aspect-video sm:aspect-21/9 w-full bg-slate-900 overflow-hidden">
              <img 
                src={selectedPost.image} 
                alt={selectedPost.title} 
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'https://hope.yahchurch.com/wp-content/uploads/2025/09/HOPE-ALFACES.avif';
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />
              
              <div className="absolute bottom-6 left-6 right-6 text-white">
                <div className="flex items-center gap-2 mb-3 flex-wrap">
                  <span className="bg-[#F49853] text-white text-xs font-gotham-bold px-3 py-1 rounded-full shadow-md uppercase tracking-wider">
                    {selectedPost.category || 'Geral'}
                  </span>
                  {selectedPost.featured_home && (
                    <span className="bg-white/20 backdrop-blur-xs text-white text-xs font-gotham-bold px-3 py-1 rounded-full shadow-md flex items-center gap-1">
                      <Star size={12} className="fill-amber-400 text-amber-400" />
                      <span>Destaque na Home</span>
                    </span>
                  )}
                </div>

                <h1 className="text-2xl sm:text-4xl lg:text-5xl font-heading font-black text-white leading-tight drop-shadow-sm">
                  {selectedPost.title}
                </h1>

                {/* Metadata & Engagement Metrics */}
                <div className="flex items-center gap-4 text-xs text-white/80 font-mono mt-4 flex-wrap">
                  <span className="flex items-center gap-1.5">
                    <Calendar size={13} /> {selectedPost.date}
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1.5">
                    <User size={13} /> {selectedPost.author}
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1.5 text-white/90">
                    <Eye size={13} /> {selectedPost.views_count ?? 0} visualizações
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1.5 text-white/90">
                    <BookOpen size={13} /> {selectedPost.reads_count ?? 0} leituras
                  </span>
                </div>
              </div>
            </div>

            {/* Article Main Body */}
            <div className="p-6 sm:p-12 space-y-8">
              
              {/* Highlight Lead / Excerpt */}
              {selectedPost.excerpt && (
                <div className="p-6 rounded-2xl bg-orange-50/70 border-l-4 border-[#F49853] text-slate-800 font-gotham-regular text-base sm:text-lg leading-relaxed shadow-xs">
                  {selectedPost.excerpt}
                </div>
              )}

              {/* Story Content */}
              <div className="text-slate-800 text-base sm:text-lg leading-relaxed font-gotham-regular space-y-5">
                {selectedPost.content.includes('<p>') || selectedPost.content.includes('<br>') || selectedPost.content.includes('<img') ? (
                  <div 
                    className="prose prose-slate max-w-none prose-p:leading-relaxed prose-headings:font-heading prose-headings:font-bold prose-a:text-[#F49853] prose-img:rounded-2xl prose-img:mx-auto prose-img:shadow-sm"
                    dangerouslySetInnerHTML={{ __html: selectedPost.content }}
                  />
                ) : (
                  <div className="whitespace-pre-line leading-relaxed space-y-4">
                    {selectedPost.content}
                  </div>
                )}
              </div>

              {/* Reader Action Bar (Like and Share) */}
              <div className="py-6 border-y border-slate-100 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={handleToggleLike}
                    className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl font-gotham-bold text-sm transition-all cursor-pointer shadow-xs active:scale-95 ${
                      hasLiked
                        ? 'bg-rose-50 text-rose-600 border border-rose-200'
                        : 'bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-600'
                    }`}
                  >
                    <Heart size={18} className={hasLiked ? "fill-rose-500 text-rose-500" : ""} />
                    <span>{hasLiked ? 'Você curtiu' : 'Curtir este artigo'}</span>
                    <span className="ml-1 px-2 py-0.5 rounded-full bg-white text-xs font-mono text-slate-700">
                      {selectedPost.likes_count ?? 0}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={handleShare}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-gotham-bold text-sm transition-all cursor-pointer shadow-xs active:scale-95"
                  >
                    <Share2 size={16} />
                    <span>Compartilhar</span>
                    {selectedPost.shares_count ? (
                      <span className="ml-1 px-2 py-0.5 rounded-full bg-white text-xs font-mono text-slate-700">
                        {selectedPost.shares_count}
                      </span>
                    ) : null}
                  </button>
                </div>

                <div className="flex items-center gap-4 text-xs text-slate-400 font-mono">
                  <span className="flex items-center gap-1">
                    <Eye size={13} /> {selectedPost.views_count ?? 0} visualizações
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <BookOpen size={13} /> {selectedPost.reads_count ?? 0} pessoas leram
                  </span>
                </div>
              </div>

              {/* Support Call to Action Box */}
              <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white flex flex-col sm:flex-row items-center justify-between gap-6 shadow-xl">
                <div>
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#F49853]/20 text-[#F49853] text-xs font-gotham-bold uppercase tracking-wider mb-2">
                    <Heart size={12} fill="currentColor" />
                    <span>Faça Parte Desta Missão</span>
                  </div>
                  <h3 className="text-xl sm:text-2xl font-heading font-black text-white">
                    Transforme Vidas Conosco
                  </h3>
                  <p className="text-white/70 text-xs sm:text-sm mt-1 max-w-md font-gotham-light">
                    Sua doação ajuda a alimentar crianças, financiar bolsas e manter a esperança viva em comunidades vulneráveis.
                  </p>
                </div>
                <Link
                  to="/campanha"
                  className="bg-[#F49853] hover:bg-[#e0853d] text-white px-7 py-3.5 rounded-2xl font-gotham-bold text-xs uppercase tracking-wider transition-all shadow-lg shadow-orange-500/30 flex items-center justify-center gap-2 shrink-0 hover:scale-105"
                >
                  <Heart size={16} fill="currentColor" />
                  <span>Apoiar Este Projeto</span>
                </Link>
              </div>

              {/* Bottom Back Button */}
              <div className="pt-6 border-t border-slate-100 flex items-center justify-between">
                <button
                  type="button"
                  onClick={handleClosePost}
                  className="inline-flex items-center gap-2 text-xs font-gotham-bold text-slate-500 hover:text-slate-900 py-2 transition-colors cursor-pointer"
                >
                  <ArrowLeft size={14} />
                  <span>Voltar para todas as matérias</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleShare}
                    className="inline-flex items-center gap-1.5 text-xs font-gotham-bold text-slate-500 hover:text-slate-800 py-2 px-3 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                  >
                    <Share2 size={13} />
                    <span>Compartilhar</span>
                  </button>
                </div>
              </div>

            </div>
          </article>

          {/* Related Articles Section */}
          {relatedPosts.length > 0 && (
            <div className="mt-16">
              <div className="flex items-center gap-2 mb-6">
                <Sparkles size={18} className="text-[#F49853]" />
                <h3 className="text-2xl font-heading font-black text-slate-900">
                  Outras Histórias de Transformação
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 sm:grid-cols-3 gap-6">
                {relatedPosts.map((rel) => (
                  <article
                    key={rel.id}
                    onClick={() => handleOpenPost(rel)}
                    className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
                  >
                    <div>
                      <div className="aspect-video rounded-xl overflow-hidden mb-4 bg-slate-900">
                        <img 
                          src={rel.image} 
                          alt={rel.title} 
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
                        />
                      </div>
                      <span className="text-[10px] font-gotham-bold uppercase px-2 py-0.5 rounded-md bg-orange-50 text-[#F49853] mb-2 inline-block">
                        {rel.category}
                      </span>
                      <h4 className="font-heading font-bold text-slate-900 text-sm group-hover:text-[#F49853] transition-colors line-clamp-2 leading-snug">
                        {rel.title}
                      </h4>
                      <p className="text-xs text-slate-500 line-clamp-2 mt-2 font-gotham-light">
                        {rel.excerpt}
                      </p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-gotham-bold">
                      <div className="flex items-center gap-3 text-slate-400 font-mono text-[11px]">
                        <span className="flex items-center gap-1">
                          <Eye size={12} /> {rel.views_count ?? 0}
                        </span>
                        <span className="flex items-center gap-1">
                          <Heart size={12} /> {rel.likes_count ?? 0}
                        </span>
                      </div>
                      <span className="text-[#F49853] flex items-center gap-1">
                        Ler história
                        <ArrowRight size={12} className="group-hover:translate-x-1 transition-transform" />
                      </span>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>
    );
  }

  // ==========================================
  // BLOG CATALOG GRID (LISTING VIEW)
  // ==========================================
  return (
    <div className="min-h-screen bg-slate-50/50 py-12 px-4 sm:px-6 lg:px-8 font-gotham-regular">
      <SEO 
        title="Histórias de Esperança e Notícias | Blog YAH Hope"
        description="Acompanhe histórias reais de transformação, notícias de ações humanitárias e relatórios de campo da YAH Hope em Moçambique e no Brasil."
        keywords="blog YAH Hope, histórias de superação, missões Moçambique, ajuda humanitária notícias, testemunhos, voluntariado"
        canonical="https://yahhope.org/blog"
      />
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-14">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-orange-100 text-[#F49853] text-xs font-gotham-bold uppercase tracking-wider mb-3">
            <span>Histórias & Transformação</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight font-heading">
            Blog YAH Hope
          </h1>
          <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto mt-3 font-gotham-light">
            Acompanhe nossas histórias, relatórios de campo e o impacto que o amor prático está gerando no Brasil e em Moçambique.
          </p>
        </div>

        {/* Posts Grid */}
        {publishedPosts.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-slate-200 shadow-xs max-w-lg mx-auto p-8">
            <h3 className="font-heading font-bold text-slate-800 text-lg">Nenhum artigo publicado ainda</h3>
            <p className="text-sm text-slate-500 mt-2">
              Volte em breve para acompanhar as novidades e relatórios de campo da YAH Hope.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {publishedPosts.map((post) => (
              <article 
                key={post.id}
                onClick={() => handleOpenPost(post)}
                className="bg-white rounded-3xl shadow-sm hover:shadow-xl border border-slate-100 overflow-hidden transition-all duration-300 hover:-translate-y-1 cursor-pointer flex flex-col group"
              >
                {/* Image Aspect Box */}
                <div className="aspect-video relative overflow-hidden bg-slate-900">
                  <img 
                    src={post.image} 
                    alt={post.title} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://hope.yahchurch.com/wp-content/uploads/2025/09/HOPE-ALFACES.avif';
                    }}
                  />
                  <div className="absolute top-3 left-3 flex items-center gap-2">
                    <span className="bg-white/95 backdrop-blur-xs text-slate-800 text-[11px] font-gotham-bold px-3 py-1 rounded-full shadow-sm">
                      {post.category || 'Geral'}
                    </span>
                    {post.featured_home && (
                      <span className="bg-amber-500 text-white text-[10px] font-gotham-bold px-2.5 py-1 rounded-full shadow-sm flex items-center gap-1">
                        <Star size={10} className="fill-white" />
                        <span>Destaque</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Content Box */}
                <div className="p-6 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between text-xs text-slate-400 mb-2 font-mono">
                      <div className="flex items-center gap-1.5">
                        <Calendar size={13} />
                        <span>{post.date}</span>
                      </div>

                      {/* Views & Likes Badges in Card */}
                      <div className="flex items-center gap-2.5">
                        <span className="flex items-center gap-1 text-slate-500" title="Visualizações">
                          <Eye size={12} /> {post.views_count ?? 0}
                        </span>
                        <span className="flex items-center gap-1 text-slate-500" title="Curtidas">
                          <Heart size={12} className={post.likes_count ? "fill-rose-500 text-rose-500" : ""} /> {post.likes_count ?? 0}
                        </span>
                      </div>
                    </div>

                    <h2 className="text-lg sm:text-xl font-heading font-bold text-slate-900 group-hover:text-[#F49853] transition-colors leading-snug line-clamp-2">
                      {post.title}
                    </h2>

                    <p className="text-slate-600 text-sm mt-2.5 font-gotham-light line-clamp-3 leading-relaxed">
                      {post.excerpt}
                    </p>
                  </div>

                  <div className="pt-5 mt-4 border-t border-slate-100 flex items-center justify-between text-xs font-gotham-bold text-[#F49853]">
                    <span className="group-hover:translate-x-1 transition-transform inline-flex items-center gap-1">
                      Ler matéria completa
                      <ArrowRight size={13} />
                    </span>

                    <span className="text-slate-400 font-mono text-[11px] font-normal flex items-center gap-1">
                      <BookOpen size={12} /> {post.reads_count ?? 0} leram
                    </span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}
