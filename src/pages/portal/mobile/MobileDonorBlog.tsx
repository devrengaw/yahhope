import React, { useState } from 'react';
import { useBlog, BlogPost } from '../../../contexts/BlogContext';
import { 
  Newspaper, 
  Search, 
  Calendar, 
  User, 
  ArrowLeft, 
  Share2, 
  Bookmark, 
  ChevronRight,
  Clock
} from 'lucide-react';

export function MobileDonorBlog() {
  const { posts } = useBlog();
  const [selectedPost, setSelectedPost] = useState<BlogPost | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Todas');

  const publishedPosts = posts.filter(p => p.status === 'published');

  // Categories list
  const categories = ['Todas', ...Array.from(new Set(publishedPosts.map(p => p.category)))];

  const filteredPosts = publishedPosts.filter(p => {
    const matchCategory = selectedCategory === 'Todas' || p.category === selectedCategory;
    const matchSearch = searchTerm === '' || 
      p.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
      p.excerpt.toLowerCase().includes(searchTerm.toLowerCase());
    return matchCategory && matchSearch;
  });

  const handleShare = (post: BlogPost) => {
    if (navigator.share) {
      navigator.share({
        title: post.title,
        text: post.excerpt,
        url: window.location.href,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('Link copiado para a área de transferência!');
    }
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
          <Newspaper className="text-amber-500" size={24} /> Blog & Notícias
        </h2>
        <p className="text-xs text-slate-500 mt-1 font-medium">
          Relatos missionários, avanços nutricionais e testemunhos direto do campo.
        </p>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Buscar artigos e relatos..."
          className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all shadow-2xs"
        />
      </div>

      {/* Category Pills (Horizontal Scroll) */}
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 scrollbar-none">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
              selectedCategory === cat
                ? 'bg-amber-500 text-white shadow-xs'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Blog Posts List */}
      <div className="space-y-4">
        {filteredPosts.length === 0 ? (
          <div className="bg-white p-8 rounded-3xl border border-slate-100 text-center text-xs text-slate-400">
            Nenhum artigo encontrado.
          </div>
        ) : (
          filteredPosts.map((post) => (
            <div
              key={post.id}
              onClick={() => setSelectedPost(post)}
              className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-xs hover:border-amber-200 transition-all cursor-pointer active:scale-[0.99] flex flex-col"
            >
              <div className="relative h-44 w-full">
                <img
                  src={post.image || 'https://hope.yahchurch.com/wp-content/uploads/2025/09/HOPE-ALFACES.avif'}
                  alt={post.title}
                  className="w-full h-full object-cover"
                />
                <span className="absolute top-3 left-3 bg-slate-950/80 backdrop-blur-md text-white text-[9px] font-black uppercase tracking-wider px-2.5 py-1 rounded-lg">
                  {post.category}
                </span>
              </div>

              <div className="p-5 space-y-2">
                <div className="flex items-center gap-3 text-[11px] text-slate-400 font-medium">
                  <span className="flex items-center gap-1">
                    <Calendar size={12} /> {post.date}
                  </span>
                  <span>•</span>
                  <span>{post.author}</span>
                </div>

                <h3 className="font-black text-slate-900 text-base leading-snug line-clamp-2">
                  {post.title}
                </h3>

                <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed font-medium">
                  {post.excerpt}
                </p>

                <div className="pt-2 flex items-center justify-between text-xs font-black text-amber-600">
                  <span>Ler artigo completo</span>
                  <ChevronRight size={16} />
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Full Post Reader Modal */}
      {selectedPost && (
        <div className="fixed inset-0 z-50 bg-white overflow-y-auto pt-safe pb-safe animate-slideUp">
          {/* Reader Top Bar */}
          <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-md border-b border-slate-100 px-4 h-14 flex items-center justify-between">
            <button
              onClick={() => setSelectedPost(null)}
              className="flex items-center gap-1 text-xs font-black text-slate-700 hover:text-slate-900 p-1"
            >
              <ArrowLeft size={18} />
              <span>Voltar</span>
            </button>

            <button
              onClick={() => handleShare(selectedPost)}
              className="p-2 rounded-xl text-slate-600 hover:bg-slate-100 transition-all"
            >
              <Share2 size={18} />
            </button>
          </div>

          {/* Reader Content Body */}
          <div className="max-w-md mx-auto px-4 py-6 space-y-5">
            <span className="text-[10px] font-black uppercase tracking-widest text-amber-600 bg-amber-50 px-3 py-1 rounded-full">
              {selectedPost.category}
            </span>

            <h1 className="text-2xl font-black text-slate-900 tracking-tight leading-snug">
              {selectedPost.title}
            </h1>

            <div className="flex items-center gap-3 text-xs text-slate-500 pb-2 border-b border-slate-100 font-medium">
              <span className="flex items-center gap-1">
                <User size={14} className="text-slate-400" /> {selectedPost.author}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Calendar size={14} className="text-slate-400" /> {selectedPost.date}
              </span>
            </div>

            <div className="rounded-2xl overflow-hidden shadow-sm">
              <img
                src={selectedPost.image || 'https://hope.yahchurch.com/wp-content/uploads/2025/09/HOPE-ALFACES.avif'}
                alt={selectedPost.title}
                className="w-full h-56 object-cover"
              />
            </div>

            {/* Excerpt lead paragraph */}
            <p className="text-sm font-bold text-slate-700 leading-relaxed italic bg-slate-50 p-4 rounded-2xl border-l-4 border-amber-500">
              "{selectedPost.excerpt}"
            </p>

            {/* Article Content */}
            <div 
              className="prose prose-sm max-w-none text-slate-700 leading-relaxed space-y-4"
              dangerouslySetInnerHTML={{ __html: selectedPost.content }}
            />

            {/* Bottom Back Button */}
            <div className="pt-8 pb-12">
              <button
                onClick={() => setSelectedPost(null)}
                className="w-full py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-black text-xs rounded-xl transition-all"
              >
                Voltar para todos os artigos
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
