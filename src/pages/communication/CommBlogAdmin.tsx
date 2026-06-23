import React, { useState } from 'react';
import { Newspaper, Plus, Search, Edit2, Trash2, Eye, EyeOff, CheckCircle2, AlertCircle, X, AlignLeft, Calendar, Clock } from 'lucide-react';
import { RichTextEditor } from '../../components/communication/RichTextEditor';
import { useConfirm } from '../../contexts/ConfirmContext';

interface BlogPost {
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
}

export function CommBlogAdmin() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const { confirm } = useConfirm();

  const [isEditing, setIsEditing] = useState(false);
  const [currentPost, setCurrentPost] = useState<Partial<BlogPost> | null>(null);
  const [isBlogClosed, setIsBlogClosed] = useState(() => localStorage.getItem('yah_blog_closed') === 'true');

  const handleToggleBlog = () => {
    const newState = !isBlogClosed;
    setIsBlogClosed(newState);
    localStorage.setItem('yah_blog_closed', String(newState));
    window.dispatchEvent(new Event('storage'));
  };

  const handleDelete = async (id: string) => {
    if (await confirm('Tem certeza que deseja excluir este post?')) {
      setPosts(posts.filter(p => p.id !== id));
    }
  };

  const toggleStatus = (id: string) => {
    setPosts(posts.map(p => {
      if (p.id === id) {
        return { ...p, status: p.status === 'hidden' ? 'published' : 'hidden' };
      }
      return p;
    }));
  };

  const handleSave = (e: React.FormEvent, forceStatus?: 'draft' | 'published') => {
    e.preventDefault();
    if (!currentPost?.title) return;

    const isFuture = currentPost.published_at ? new Date(currentPost.published_at) > new Date() : false;
    let finalStatus = forceStatus || (isFuture ? 'scheduled' : 'published');

    if (currentPost.id) {
      setPosts(posts.map(p => p.id === currentPost.id ? { 
        ...p, 
        ...currentPost, 
        status: finalStatus
      } as BlogPost : p));
    } else {
      const newPost: BlogPost = {
        id: Math.random().toString(36).substring(2, 9),
        title: currentPost.title || '',
        excerpt: currentPost.excerpt || '',
        content: currentPost.content || '',
        image: currentPost.image || `https://picsum.photos/seed/${Math.random()}/800/400`,
        published_at: currentPost.published_at,
        author: 'Admin',
        date: new Date().toISOString().split('T')[0],
        status: finalStatus as any,
        category: currentPost.category || 'Geral'
      };
      setPosts([newPost, ...posts]);
    }
    setIsEditing(false);
    setCurrentPost(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Newspaper className="text-indigo-600" size={28} />
            Administração do Blog
          </h1>
          <p className="text-slate-500 mt-1">Gerencie as postagens e conteúdos em um único lugar.</p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button
            onClick={handleToggleBlog}
            className={`px-4 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all shadow-sm text-sm ${isBlogClosed ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200' : 'bg-rose-100 text-rose-700 hover:bg-rose-200'}`}
          >
            {isBlogClosed ? <Eye size={18} /> : <EyeOff size={18} />}
            {isBlogClosed ? 'Ativar Blog' : 'Ocultar Blog'}
          </button>
          <button 
            onClick={() => { setCurrentPost({ content: '', status: 'draft', image: '' }); setIsEditing(true); }}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl font-medium flex items-center gap-2 transition-colors shadow-sm"
          >
            <Plus size={20} />
            Novo Post
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row gap-4 items-center justify-between bg-slate-50/50">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Buscar posts..." 
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm"
            />
          </div>
          <div className="flex items-center gap-4 text-xs font-bold text-slate-400 uppercase tracking-widest">
            Exibindo {posts.length} postagens
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Postagem</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Categoria</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Status</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {posts.map((post) => (
                <tr key={post.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-4">
                      <img src={post.image} alt="" className="w-12 h-12 rounded-lg object-cover shadow-sm" />
                      <div>
                        <p className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">{post.title}</p>
                        <p className="text-xs text-slate-500 line-clamp-1">{post.excerpt}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-[10px] font-bold bg-slate-100 text-slate-600 px-2 py-1 rounded-md uppercase tracking-wider">
                      {post.category}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {post.status === 'published' ? (
                      <span className="flex items-center gap-1.5 text-emerald-600 font-bold text-xs">
                        <CheckCircle2 size={14} /> Público
                      </span>
                    ) : post.status === 'hidden' ? (
                      <span className="flex items-center gap-1.5 text-slate-400 font-bold text-xs">
                        <EyeOff size={14} /> Oculto
                      </span>
                    ) : post.status === 'scheduled' ? (
                      <span className="flex items-center gap-1.5 text-blue-500 font-bold text-xs">
                        <Calendar size={14} /> Programado
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5 text-amber-500 font-bold text-xs">
                        <AlertCircle size={14} /> Rascunho
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button 
                        onClick={() => toggleStatus(post.id)}
                        className={`p-2 rounded-lg transition-colors ${post.status === 'hidden' ? 'text-emerald-600 hover:bg-emerald-50' : 'text-slate-400 hover:bg-slate-100'}`}
                        title={post.status === 'hidden' ? "Mostrar" : "Ocultar"}
                      >
                        {post.status === 'hidden' ? <Eye size={18} /> : <EyeOff size={18} />}
                      </button>
                      <button 
                        onClick={() => { setCurrentPost(post); setIsEditing(true); }}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Editar"
                      >
                        <Edit2 size={18} />
                      </button>
                      <button 
                        onClick={() => handleDelete(post.id)}
                        className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        title="Excluir"
                      >
                        <Trash2 size={18} />
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
        <div className="fixed inset-0 bg-slate-900 z-50 flex flex-col animate-in fade-in duration-200">
          {/* Header */}
          <div className="bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button onClick={() => setIsEditing(false)} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 transition-all">
                <X size={24} />
              </button>
              <div>
                <h2 className="text-xl font-bold text-slate-900">{currentPost?.id ? 'Editar Postagem' : 'Criar Novo Post'}</h2>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Editor Unificado</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button 
                onClick={(e) => handleSave(e, 'draft')} 
                className="px-6 py-2 rounded-xl text-slate-600 font-bold text-sm hover:bg-slate-50 transition-all"
              >
                Salvar Rascunho
              </button>
              <button 
                onClick={(e) => handleSave(e, 'published')}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-2.5 rounded-xl font-bold text-sm shadow-xl shadow-indigo-200 transition-all active:scale-95"
              >
                {currentPost?.published_at ? 'Programar' : 'Publicar Agora'}
              </button>
            </div>
          </div>

          {/* Editor Body */}
          <div className="flex-1 overflow-y-auto bg-slate-50 p-6 md:p-12">
            <div className="max-w-6xl mx-auto space-y-8">
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                {/* Main Content Side */}
                <div className="lg:col-span-3 space-y-8">
                  {/* Basic Info Card */}
                  <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-200/50 space-y-6">
                    <div className="space-y-2">
                      <label className="text-xs font-black text-slate-400 uppercase tracking-widest px-2">Título do Post</label>
                      <input 
                        type="text" 
                        value={currentPost?.title || ''}
                        onChange={e => setCurrentPost({...currentPost, title: e.target.value})}
                        placeholder="Ex: Como a nutrição muda vidas..."
                        className="w-full bg-slate-50 border-none rounded-2xl px-6 py-4 text-xl font-bold text-slate-900 focus:ring-4 focus:ring-indigo-500/10 placeholder:text-slate-200 transition-all outline-none"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-black text-slate-400 uppercase tracking-widest px-2">Resumo (Excerpt)</label>
                      <textarea 
                        value={currentPost?.excerpt || ''}
                        onChange={e => setCurrentPost({...currentPost, excerpt: e.target.value})}
                        placeholder="Uma breve introdução para atrair leitores..."
                        className="w-full bg-slate-50 border-none rounded-2xl px-6 py-4 font-medium text-slate-600 focus:ring-4 focus:ring-indigo-500/10 placeholder:text-slate-200 transition-all outline-none resize-none"
                        rows={2}
                      />
                    </div>
                  </div>

                  {/* Main Content Editor */}
                  <div className="space-y-3">
                    <label className="flex items-center gap-2 text-xs font-black text-slate-400 uppercase tracking-widest px-4">
                      <AlignLeft size={14} className="text-indigo-400" /> Conteúdo da Postagem
                    </label>
                    <RichTextEditor 
                      content={currentPost?.content || ''}
                      onChange={(html) => setCurrentPost({...currentPost, content: html})}
                      placeholder="Escreva aqui o seu artigo completo..."
                    />
                  </div>
                </div>

                {/* Sidebar Side */}
                <div className="space-y-6">
                  {/* Cover Image Card */}
                  <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-200/50 space-y-4">
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest px-1 flex items-center gap-2">
                      <Eye size={14} /> Imagem de Capa
                    </label>
                    <div className="relative group aspect-video rounded-xl bg-slate-50 border-2 border-dashed border-slate-200 overflow-hidden flex items-center justify-center">
                      {currentPost?.image ? (
                        <>
                          <img src={currentPost.image} alt="Preview" className="w-full h-full object-cover" />
                          <button 
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
                      className="w-full bg-slate-50 border-none rounded-xl px-4 py-2 text-xs font-medium text-slate-600 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all"
                    />
                  </div>

                  {/* Category & Scheduling Card */}
                  <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-200/50 space-y-6">
                    <div className="space-y-2">
                      <label className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">Categoria</label>
                      <input 
                        type="text" 
                        value={currentPost?.category || ''}
                        onChange={e => setCurrentPost({...currentPost, category: e.target.value})}
                        placeholder="Ex: Impacto Social"
                        className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 font-bold text-slate-900 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all"
                      />
                    </div>

                    <div className="space-y-4 pt-4 border-t border-slate-100">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                          <Clock size={14} /> Programar
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
                            className="w-full bg-slate-900 text-white rounded-xl px-4 py-3 text-sm font-bold outline-none focus:ring-4 focus:ring-indigo-500/20 transition-all"
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Quick Tips */}
                  <div className="bg-indigo-50 rounded-[2rem] p-6 border border-indigo-100">
                    <h4 className="text-indigo-900 font-bold text-sm mb-2 flex items-center gap-2">
                      <CheckCircle2 size={16} /> Dica
                    </h4>
                    <p className="text-indigo-700 text-xs leading-relaxed font-medium">
                      O rascunho não aparecerá no portal público até que você clique em publicar.
                    </p>
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


