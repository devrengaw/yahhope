import React, { useState } from 'react';
import { 
  Newspaper, 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  Eye, 
  EyeOff, 
  CheckCircle2, 
  AlertCircle, 
  X, 
  AlignLeft, 
  Calendar, 
  Clock, 
  Star, 
  Sparkles,
  ExternalLink,
  RotateCcw
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { RichTextEditor } from '../../components/communication/RichTextEditor';
import { useConfirm } from '../../contexts/ConfirmContext';
import { useBlog, BlogPost } from '../../contexts/BlogContext';
import { cn } from '../../lib/utils';

const PRESET_COLORS = [
  { name: 'Laranja YAH Hope', hex: '#F49853' },
  { name: 'Verde YAH Hope', hex: '#92BF78' },
  { name: 'Azul YAH Hope', hex: '#88A1F2' },
  { name: 'Amarelo YAH Hope', hex: '#EBC878' },
  { name: 'Cinza Neutro', hex: '#878787' }
];

export function CommBlogAdmin() {
  const { posts, addPost, updatePost, deletePost, toggleFeaturedHome, resetBlogToDefaults } = useBlog();
  const { confirm } = useConfirm();

  const [searchQuery, setSearchQuery] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [currentPost, setCurrentPost] = useState<Partial<BlogPost> | null>(null);
  const [isBlogClosed, setIsBlogClosed] = useState(() => localStorage.getItem('yah_blog_closed') === 'true');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleToggleBlog = () => {
    const newState = !isBlogClosed;
    setIsBlogClosed(newState);
    localStorage.setItem('yah_blog_closed', String(newState));
    window.dispatchEvent(new Event('storage'));
  };

  const handleDelete = async (id: string, title: string) => {
    const ok = await confirm({
      title: 'Excluir Postagem',
      message: `Tem certeza que deseja excluir o artigo "${title}"?`,
      confirmText: 'Excluir',
      cancelText: 'Cancelar',
      type: 'danger'
    });
    if (ok) {
      await deletePost(id);
      showToast('Artigo excluído.');
    }
  };

  const toggleStatus = async (post: BlogPost) => {
    const newStatus = post.status === 'hidden' ? 'published' : 'hidden';
    await updatePost(post.id, { status: newStatus });
  };

  const handleToggleHomeHighlight = async (post: BlogPost) => {
    const isNowFeatured = await toggleFeaturedHome(post.id);
    showToast(
      isNowFeatured 
        ? `⭐ "${post.title}" agora está em destaque na Landing Page!` 
        : `Artigo removido dos destaques da Landing Page.`
    );
  };

  const handleSave = async (e: React.FormEvent, forceStatus?: 'draft' | 'published') => {
    e.preventDefault();
    if (!currentPost?.title?.trim()) {
      alert('Por favor, informe o título do artigo.');
      return;
    }

    const isFuture = currentPost.published_at ? new Date(currentPost.published_at) > new Date() : false;
    const finalStatus = forceStatus || (isFuture ? 'scheduled' : 'published');

    if (currentPost.id) {
      await updatePost(currentPost.id, {
        ...currentPost,
        status: finalStatus as any
      });
      showToast('Postagem atualizada com sucesso!');
    } else {
      await addPost({
        title: currentPost.title || '',
        excerpt: currentPost.excerpt || '',
        content: currentPost.content || '',
        image: currentPost.image || 'https://hope.yahchurch.com/wp-content/uploads/2025/09/HOPE-ALFACES.avif',
        published_at: currentPost.published_at,
        author: 'Admin YAH Hope',
        status: finalStatus as any,
        category: currentPost.category || 'Geral',
        featured_home: currentPost.featured_home || false,
        highlight_type: currentPost.highlight_type || 'split',
        highlight_color: currentPost.highlight_color || '#F49853'
      });
      showToast('Nova postagem criada com sucesso!');
    }
    setIsEditing(false);
    setCurrentPost(null);
  };

  const filteredPosts = posts.filter(p => {
    const q = searchQuery.toLowerCase();
    return p.title.toLowerCase().includes(q) || (p.category && p.category.toLowerCase().includes(q));
  });

  return (
    <div className="space-y-6 pb-20">
      {/* Toast Feedback */}
      {toastMessage && (
        <div className="fixed top-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-xl flex items-center gap-2.5 border border-slate-700 animate-in fade-in slide-in-from-top-4">
          <CheckCircle2 size={18} className="text-[#92BF78] shrink-0" />
          <span className="text-sm font-medium">{toastMessage}</span>
        </div>
      )}

      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Newspaper className="text-indigo-600" size={28} />
            Administração do Blog
          </h1>
          <p className="text-slate-500 mt-1 text-sm font-medium">
            Gerencie as matérias e coloque artigos diretamente nos destaques da Landing Page.
          </p>
        </div>
        <div className="flex items-center gap-2.5 flex-wrap w-full sm:w-auto">
          <Link
            to="/admin/home-highlights"
            className="px-3.5 py-2.5 rounded-xl font-bold text-xs bg-orange-50 text-[#F49853] hover:bg-orange-100 border border-orange-200 transition-all flex items-center gap-1.5"
            title="Ir para o Gerenciador de Destaques da Home"
          >
            <Sparkles size={15} />
            <span>Ver Destaques da Home</span>
          </Link>

          <button
            onClick={async () => {
              if (await confirm('Deseja restaurar as matérias padrão da YAH Hope?')) {
                await resetBlogToDefaults();
                showToast('Artigos padrão restaurados!');
              }
            }}
            className="px-3 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 transition-colors flex items-center gap-1.5"
            title="Restaurar artigos padrão"
          >
            <RotateCcw size={14} />
            <span>Padrões</span>
          </button>

          <button
            onClick={handleToggleBlog}
            className={`px-3.5 py-2.5 rounded-xl font-bold flex items-center gap-1.5 transition-all text-xs ${
              isBlogClosed ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200' : 'bg-rose-100 text-rose-700 hover:bg-rose-200'
            }`}
          >
            {isBlogClosed ? <Eye size={15} /> : <EyeOff size={15} />}
            {isBlogClosed ? 'Ativar Blog' : 'Ocultar Blog'}
          </button>

          <button 
            onClick={() => { 
              setCurrentPost({ 
                content: '', 
                status: 'draft', 
                image: 'https://hope.yahchurch.com/wp-content/uploads/2025/09/HOPE-ALFACES.avif',
                featured_home: false,
                highlight_type: 'split',
                highlight_color: '#F49853'
              }); 
              setIsEditing(true); 
            }}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-colors shadow-sm text-xs"
          >
            <Plus size={16} />
            Novo Post
          </button>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row gap-4 items-center justify-between bg-slate-50/50">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por título ou categoria..." 
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-xs font-medium"
            />
          </div>
          <div className="flex items-center gap-4 text-xs font-bold text-slate-400 uppercase tracking-widest">
            Exibindo {filteredPosts.length} de {posts.length} postagens
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500">
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest">Postagem</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest">Categoria</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest">Status</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-center">Destaque na Landing Page</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredPosts.map((post) => (
                <tr key={post.id} className="hover:bg-slate-50/70 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-xl overflow-hidden bg-slate-100 shrink-0 border border-slate-200 shadow-xs relative">
                        <img 
                          src={post.image} 
                          alt="" 
                          className="w-full h-full object-cover" 
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = 'https://hope.yahchurch.com/wp-content/uploads/2025/09/HOPE-ALFACES.avif';
                          }}
                        />
                        {post.featured_home && (
                          <div className="absolute top-1 right-1 bg-amber-500 text-white rounded-full p-0.5 shadow-xs" title="Em destaque na Home">
                            <Star size={10} className="fill-white" />
                          </div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-1">
                          {post.title}
                        </p>
                        <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">{post.excerpt}</p>
                        <span className="text-[10px] text-slate-400 font-mono mt-1 block">
                          {post.date} • {post.author}
                        </span>
                      </div>
                    </div>
                  </td>

                  <td className="px-6 py-4">
                    <span className="text-[10px] font-bold bg-slate-100 text-slate-700 px-2.5 py-1 rounded-md uppercase tracking-wider border border-slate-200">
                      {post.category || 'Geral'}
                    </span>
                  </td>

                  <td className="px-6 py-4">
                    {post.status === 'published' ? (
                      <span className="inline-flex items-center gap-1.5 text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg font-bold text-xs">
                        <CheckCircle2 size={13} /> Público
                      </span>
                    ) : post.status === 'hidden' ? (
                      <span className="inline-flex items-center gap-1.5 text-slate-500 bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-lg font-bold text-xs">
                        <EyeOff size={13} /> Oculto
                      </span>
                    ) : post.status === 'scheduled' ? (
                      <span className="inline-flex items-center gap-1.5 text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-1 rounded-lg font-bold text-xs">
                        <Calendar size={13} /> Programado
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-lg font-bold text-xs">
                        <AlertCircle size={13} /> Rascunho
                      </span>
                    )}
                  </td>

                  {/* Destaque Button */}
                  <td className="px-6 py-4 text-center">
                    <button
                      type="button"
                      onClick={() => handleToggleHomeHighlight(post)}
                      className={cn(
                        "px-3 py-1.5 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 transition-all shadow-xs cursor-pointer",
                        post.featured_home 
                          ? "bg-amber-500 hover:bg-amber-600 text-white shadow-amber-500/20" 
                          : "bg-slate-100 hover:bg-orange-50 text-slate-700 hover:text-[#F49853] border border-slate-200 hover:border-orange-200"
                      )}
                      title={post.featured_home ? "Clique para remover do carrossel da Home" : "Clique para colocar no carrossel de destaques da Landing Page"}
                    >
                      <Star size={13} className={post.featured_home ? "fill-white text-white" : "text-slate-400"} />
                      <span>{post.featured_home ? 'No Destaque' : 'Colocar no Destaque'}</span>
                    </button>
                  </td>

                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button 
                        onClick={() => toggleStatus(post)}
                        className={`p-2 rounded-xl transition-colors ${
                          post.status === 'hidden' ? 'text-emerald-600 hover:bg-emerald-50' : 'text-slate-400 hover:bg-slate-100'
                        }`}
                        title={post.status === 'hidden' ? "Mostrar no blog" : "Ocultar do blog"}
                      >
                        {post.status === 'hidden' ? <Eye size={17} /> : <EyeOff size={17} />}
                      </button>
                      <button 
                        onClick={() => { 
                          setCurrentPost({
                            ...post,
                            highlight_type: post.highlight_type || 'split',
                            highlight_color: post.highlight_color || '#F49853'
                          }); 
                          setIsEditing(true); 
                        }}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-xl transition-colors"
                        title="Editar artigo"
                      >
                        <Edit2 size={17} />
                      </button>
                      <button 
                        onClick={() => handleDelete(post.id, post.title)}
                        className="p-2 text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                        title="Excluir artigo"
                      >
                        <Trash2 size={17} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Full-Screen Editor Modal */}
      {isEditing && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-xs z-50 flex flex-col animate-in fade-in duration-200">
          {/* Header */}
          <div className="bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button 
                onClick={() => setIsEditing(false)} 
                className="p-2 hover:bg-slate-100 rounded-full text-slate-400 transition-all"
              >
                <X size={24} />
              </button>
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  {currentPost?.id ? 'Editar Postagem' : 'Criar Novo Post'}
                </h2>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">
                  Editor de Conteúdo YAH Hope
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button 
                onClick={(e) => handleSave(e, 'draft')} 
                className="px-6 py-2.5 rounded-xl text-slate-600 font-bold text-xs hover:bg-slate-100 transition-all border border-slate-200"
              >
                Salvar Rascunho
              </button>
              <button 
                onClick={(e) => handleSave(e, 'published')}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-7 py-2.5 rounded-xl font-bold text-xs shadow-md shadow-indigo-200 transition-all active:scale-95"
              >
                {currentPost?.published_at ? 'Programar' : 'Publicar Agora'}
              </button>
            </div>
          </div>

          {/* Editor Body */}
          <div className="flex-1 overflow-y-auto bg-slate-50 p-6 md:p-10">
            <div className="max-w-6xl mx-auto space-y-8">
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                {/* Main Content Side */}
                <div className="lg:col-span-3 space-y-8">
                  {/* Basic Info Card */}
                  <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xs border border-slate-200/80 space-y-6">
                    <div className="space-y-2">
                      <label className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">
                        Título do Post *
                      </label>
                      <input 
                        type="text" 
                        value={currentPost?.title || ''}
                        onChange={e => setCurrentPost({...currentPost, title: e.target.value})}
                        placeholder="Ex: Como a nutrição muda vidas em Moçambique..."
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3.5 text-lg font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-hidden transition-all"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">
                        Resumo (Excerpt / Snippet do Card)
                      </label>
                      <textarea 
                        value={currentPost?.excerpt || ''}
                        onChange={e => setCurrentPost({...currentPost, excerpt: e.target.value})}
                        placeholder="Uma breve introdução para atrair leitores e que aparecerá no card do carrossel..."
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3.5 font-medium text-slate-700 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-hidden transition-all resize-none text-sm"
                        rows={2}
                      />
                    </div>
                  </div>

                  {/* Main Content Editor */}
                  <div className="space-y-3">
                    <label className="flex items-center gap-2 text-xs font-black text-slate-500 uppercase tracking-widest px-2">
                      <AlignLeft size={14} className="text-indigo-500" /> 
                      Conteúdo Completo da Matéria
                    </label>
                    <RichTextEditor 
                      content={currentPost?.content || ''}
                      onChange={(html) => setCurrentPost({...currentPost, content: html})}
                      placeholder="Escreva aqui o seu artigo completo com fotos, títulos e detalhes..."
                    />
                  </div>
                </div>

                {/* Sidebar Side */}
                <div className="space-y-6">
                  {/* Cover Image Card */}
                  <div className="bg-white rounded-3xl p-6 shadow-xs border border-slate-200/80 space-y-4">
                    <label className="text-xs font-black text-slate-600 uppercase tracking-widest flex items-center gap-2">
                      <Eye size={14} className="text-indigo-500" /> Imagem de Capa
                    </label>
                    <div className="relative group aspect-video rounded-xl bg-slate-50 border-2 border-dashed border-slate-200 overflow-hidden flex items-center justify-center">
                      {currentPost?.image ? (
                        <>
                          <img 
                            src={currentPost.image} 
                            alt="Preview" 
                            className="w-full h-full object-cover" 
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = 'https://hope.yahchurch.com/wp-content/uploads/2025/09/HOPE-ALFACES.avif';
                            }}
                          />
                          <button 
                            type="button"
                            onClick={() => setCurrentPost({...currentPost, image: ''})}
                            className="absolute top-2 right-2 p-1.5 bg-rose-500 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X size={14} />
                          </button>
                        </>
                      ) : (
                        <div className="text-center p-4">
                          <Plus className="mx-auto text-slate-300 mb-2" size={24} />
                          <p className="text-[10px] font-bold text-slate-400 uppercase">Colar URL da Imagem</p>
                        </div>
                      )}
                    </div>
                    <input 
                      type="text" 
                      value={currentPost?.image || ''}
                      onChange={e => setCurrentPost({...currentPost, image: e.target.value})}
                      placeholder="https://..."
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-medium text-slate-600 focus:ring-2 focus:ring-indigo-500/20 outline-hidden transition-all"
                    />
                  </div>

                  {/* Highlight on Landing Page Card */}
                  <div className="bg-white rounded-3xl p-6 shadow-xs border border-orange-200/80 space-y-4 bg-gradient-to-b from-orange-50/30 to-white">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-2 cursor-pointer">
                        <Star size={16} className="text-[#F49853] fill-[#F49853]" />
                        <span>Destaque na Landing Page</span>
                      </label>
                      <input 
                        type="checkbox" 
                        id="featured_home_toggle"
                        checked={!!currentPost?.featured_home}
                        onChange={(e) => setCurrentPost({
                          ...currentPost, 
                          featured_home: e.target.checked 
                        })}
                        className="w-4 h-4 text-[#F49853] rounded cursor-pointer"
                      />
                    </div>
                    <p className="text-xs text-slate-500 leading-relaxed font-medium">
                      Ative para exibir este artigo como um card no carrossel de destaques da página inicial.
                    </p>

                    {currentPost?.featured_home && (
                      <div className="space-y-4 pt-3 border-t border-orange-100 animate-in fade-in">
                        <div>
                          <label className="text-[10px] font-bold text-slate-600 uppercase tracking-wider block mb-1.5">
                            Formato do Card na Home
                          </label>
                          <div className="grid grid-cols-2 gap-2">
                            <button
                              type="button"
                              onClick={() => setCurrentPost({ ...currentPost, highlight_type: 'photo' })}
                              className={cn(
                                "px-3 py-2 rounded-xl text-xs font-bold border transition-all text-center",
                                currentPost.highlight_type === 'photo' 
                                  ? "border-[#F49853] bg-orange-100/60 text-[#F49853] ring-1 ring-[#F49853]" 
                                  : "border-slate-200 text-slate-600 bg-white"
                              )}
                            >
                              Foto Inteira
                            </button>
                            <button
                              type="button"
                              onClick={() => setCurrentPost({ ...currentPost, highlight_type: 'split' })}
                              className={cn(
                                "px-3 py-2 rounded-xl text-xs font-bold border transition-all text-center",
                                (!currentPost.highlight_type || currentPost.highlight_type === 'split')
                                  ? "border-[#F49853] bg-orange-100/60 text-[#F49853] ring-1 ring-[#F49853]" 
                                  : "border-slate-200 text-slate-600 bg-white"
                              )}
                            >
                              Dividido (Split)
                            </button>
                          </div>
                        </div>

                        <div>
                          <label className="text-[10px] font-bold text-slate-600 uppercase tracking-wider block mb-1.5">
                            Cor de Destaque
                          </label>
                          <div className="flex items-center gap-2 flex-wrap">
                            {PRESET_COLORS.map(c => (
                              <button
                                key={c.hex}
                                type="button"
                                onClick={() => setCurrentPost({ ...currentPost, highlight_color: c.hex })}
                                className={cn(
                                  "w-7 h-7 rounded-full border-2 transition-transform hover:scale-110",
                                  (currentPost.highlight_color || '#F49853') === c.hex 
                                    ? "border-slate-900 scale-110 shadow-xs" 
                                    : "border-slate-200"
                                )}
                                style={{ backgroundColor: c.hex }}
                                title={c.name}
                              />
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Category & Scheduling Card */}
                  <div className="bg-white rounded-3xl p-6 shadow-xs border border-slate-200/80 space-y-5">
                    <div className="space-y-2">
                      <label className="text-xs font-black text-slate-600 uppercase tracking-widest px-1">
                        Categoria
                      </label>
                      <input 
                        type="text" 
                        value={currentPost?.category || ''}
                        onChange={e => setCurrentPost({...currentPost, category: e.target.value})}
                        placeholder="Ex: Impacto Social, Nutrição..."
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 font-bold text-slate-900 text-sm outline-hidden focus:ring-2 focus:ring-indigo-500/20 transition-all"
                      />
                    </div>

                    <div className="space-y-4 pt-3 border-t border-slate-100">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-black text-slate-600 uppercase tracking-widest flex items-center gap-2">
                          <Clock size={14} className="text-indigo-500" /> Programar
                        </label>
                        <input 
                          type="checkbox" 
                          checked={!!currentPost?.published_at}
                          onChange={(e) => setCurrentPost({
                            ...currentPost, 
                            published_at: e.target.checked ? new Date().toISOString().slice(0, 16) : undefined 
                          })}
                          className="w-4 h-4 text-indigo-600 rounded"
                        />
                      </div>
                      
                      {currentPost?.published_at && (
                        <div className="animate-in slide-in-from-top-2 duration-300">
                          <input 
                            type="datetime-local" 
                            value={currentPost.published_at}
                            onChange={(e) => setCurrentPost({...currentPost, published_at: e.target.value})}
                            className="w-full bg-slate-900 text-white rounded-xl px-4 py-3 text-xs font-bold outline-none focus:ring-4 focus:ring-indigo-500/20 transition-all"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
