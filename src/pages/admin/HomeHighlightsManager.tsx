import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Sparkles, 
  Plus, 
  Trash2, 
  Edit3, 
  ArrowUp, 
  ArrowDown, 
  Check, 
  X, 
  ExternalLink, 
  RotateCcw, 
  Image as ImageIcon, 
  Layers, 
  Globe, 
  Palette, 
  ArrowRight,
  Eye,
  CheckCircle2,
  Newspaper,
  Star,
  BookOpen,
  BarChart3,
  Megaphone
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { useHomeHighlights, HomeHighlightItem } from '../../contexts/HomeHighlightsContext';
import { useBlog, BlogPost } from '../../contexts/BlogContext';
import { useConfirm } from '../../contexts/ConfirmContext';

const PRESET_COLORS = [
  { name: 'Laranja YAH Hope', hex: '#F49853' },
  { name: 'Verde YAH Hope', hex: '#92BF78' },
  { name: 'Azul YAH Hope', hex: '#88A1F2' },
  { name: 'Amarelo YAH Hope', hex: '#EBC878' },
  { name: 'Cinza Neutro', hex: '#878787' },
  { name: 'Branco / Claro', hex: '#FFFFFF' }
];

const PRESET_IMAGES = [
  { label: 'Casa Nutri (Alfaces)', url: 'https://hope.yahchurch.com/wp-content/uploads/2025/09/HOPE-ALFACES.avif' },
  { label: 'Bolsas Universitárias', url: 'https://hope.yahchurch.com/wp-content/uploads/2025/09/IMG5.avif' },
  { label: 'Oficinas & Hortas Mães', url: 'https://hope.yahchurch.com/wp-content/uploads/2025/09/Foto-e1758835419873-827x1024.png' },
  { label: 'Ação Humanitária', url: 'https://hope.yahchurch.com/wp-content/uploads/2025/09/PARTICIPE-DESTA-MISSAO-1.png' },
  { label: 'Saúde Preventiva', url: '/login_bg_real.jpg' },
  { label: 'Hero Banner Principal', url: '/hero_bg.jpg' }
];

interface FormState {
  type: 'photo' | 'split';
  title: string;
  category: string;
  location: string;
  snippet: string;
  content: string;
  image: string;
  link: string;
  color: string;
  active: boolean;
  blogPostId?: string;
}

const INITIAL_FORM: FormState = {
  type: 'photo',
  title: '',
  category: '',
  location: 'Moçambique',
  snippet: '',
  content: '',
  image: 'https://hope.yahchurch.com/wp-content/uploads/2025/09/HOPE-ALFACES.avif',
  link: '/projetos',
  color: '#F49853',
  active: true,
  blogPostId: ''
};

export function HomeHighlightsManager() {
  const { 
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
  } = useHomeHighlights();

  const { posts, toggleFeaturedHome } = useBlog();
  const { confirm } = useConfirm();

  const [modalOpen, setModalOpen] = useState(false);
  const [blogPickerOpen, setBlogPickerOpen] = useState(false);
  const [previewStoryItem, setPreviewStoryItem] = useState<HomeHighlightItem | null>(null);
  const [editingId, setEditingId] = useState<number | string | null>(null);
  const [formData, setFormData] = useState<FormState>(INITIAL_FORM);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(null), 3500);
  };

  const handleOpenAddModal = () => {
    setEditingId(null);
    setFormData(INITIAL_FORM);
    setModalOpen(true);
  };

  const handleOpenEditModal = (item: HomeHighlightItem) => {
    setEditingId(item.id);
    setFormData({
      type: item.type,
      title: item.title,
      category: item.category,
      location: item.location,
      snippet: item.snippet || '',
      content: item.content || '',
      image: item.image,
      link: item.link,
      color: item.color,
      active: item.active !== false,
      blogPostId: item.blogPostId || ''
    });
    setModalOpen(true);
  };

  const handleSelectBlogPost = (postId: string) => {
    const post = posts.find(p => p.id === postId);
    if (post) {
      setFormData({
        ...formData,
        title: post.title,
        category: post.category || 'Blog',
        snippet: post.excerpt || '',
        content: post.content || '',
        image: post.image || 'https://hope.yahchurch.com/wp-content/uploads/2025/09/HOPE-ALFACES.avif',
        link: `/blog?post=${post.id}`,
        type: post.highlight_type || formData.type,
        color: post.highlight_color || formData.color,
        blogPostId: post.id
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.image.trim()) {
      alert('Por favor, preencha o título e a imagem.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingId !== null) {
        await updateHighlight(editingId, {
          type: formData.type,
          title: formData.title,
          category: formData.category,
          location: formData.location,
          snippet: formData.snippet,
          content: formData.content,
          image: formData.image,
          link: formData.link,
          color: formData.color,
          active: formData.active,
          blogPostId: formData.blogPostId || undefined
        });
        showToast('Destaque atualizado com sucesso!');
      } else {
        await addHighlight({
          type: formData.type,
          title: formData.title,
          category: formData.category,
          location: formData.location,
          snippet: formData.snippet,
          content: formData.content,
          image: formData.image,
          link: formData.link,
          color: formData.color,
          active: formData.active,
          blogPostId: formData.blogPostId || undefined,
          order: highlights.length + 1
        });
        showToast('Novo destaque adicionado!');
      }
      setModalOpen(false);
    } catch (err: any) {
      alert('Erro ao salvar destaque: ' + (err.message || 'Tente novamente'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: number | string, title: string) => {
    const ok = await confirm({
      title: 'Excluir Destaque',
      message: `Tem certeza que deseja excluir o destaque "${title}"?`,
      confirmText: 'Excluir',
      cancelText: 'Cancelar',
      type: 'danger'
    });
    if (ok) {
      await deleteHighlight(id);
      showToast('Destaque excluído.');
    }
  };

  const handleReset = async () => {
    const ok = await confirm({
      title: 'Restaurar Destaques Originais',
      message: 'Isso redefinirá a lista para os 5 destaques padrão oficiais da YAH Hope. Deseja continuar?',
      confirmText: 'Restaurar',
      cancelText: 'Cancelar',
      type: 'warning'
    });
    if (ok) {
      await resetToDefaults();
      showToast('Destaques padrão restaurados!');
    }
  };

  const moveItem = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= highlights.length) return;

    const newArr = [...highlights];
    const temp = newArr[index];
    newArr[index] = newArr[targetIndex];
    newArr[targetIndex] = temp;

    reorderHighlights(newArr);
  };

  const handleToggleBlogArticleHighlight = async (post: BlogPost) => {
    const isNow = await toggleFeaturedHome(post.id);
    showToast(
      isNow 
        ? `⭐ "${post.title}" colocado no carrossel da Home!` 
        : `Artigo removido do carrossel da Home.`
    );
  };

  return (
    <div className="space-y-6 pb-20 font-sans">
      {/* Toast Notification */}
      {successToast && (
        <div className="fixed top-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-xl flex items-center gap-2 border border-slate-700 animate-in fade-in slide-in-from-top-4">
          <CheckCircle2 size={18} className="text-[#92BF78]" />
          <span className="text-sm font-medium">{successToast}</span>
        </div>
      )}

      {/* Navigation Tabs for Landing Page Management */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-3 flex-wrap">
        <div className="px-4 py-2 rounded-xl text-xs font-bold bg-[#F49853]/15 text-[#F49853] flex items-center gap-1.5 border border-[#F49853]/30">
          <Sparkles size={14} />
          <span>Carrossel de Destaques</span>
        </div>
        <Link
          to="/admin/impact-metrics"
          className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors flex items-center gap-1.5"
        >
          <BarChart3 size={14} />
          <span>Cards de Impacto & Resultados</span>
        </Link>
        <Link
          to="/admin/top-banner"
          className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors flex items-center gap-1.5"
        >
          <Megaphone size={14} />
          <span>Aviso do Topo (Banner)</span>
        </Link>
      </div>

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-orange-50 border border-orange-200 flex items-center justify-center text-[#F49853]">
              <Sparkles size={20} />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">Destaques da Página Inicial</h1>
              <p className="text-slate-500 text-sm font-medium mt-0.5">
                Gerencie os cards e matérias do blog exibidos no carrossel da Landing Page.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={() => setBlogPickerOpen(true)}
            className="px-3.5 py-2 rounded-xl text-xs font-bold text-indigo-700 hover:text-indigo-900 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 transition-colors flex items-center gap-1.5"
            title="Importar matérias publicadas no Blog"
          >
            <Newspaper size={14} />
            <span>Matérias do Blog ({posts.length})</span>
          </button>

          <button
            onClick={handleReset}
            className="px-3.5 py-2 rounded-xl text-xs font-bold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 transition-colors flex items-center gap-1.5"
            title="Redefinir para os cards padrão"
          >
            <RotateCcw size={14} />
            <span>Restaurar Padrão</span>
          </button>

          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="px-3.5 py-2 rounded-xl text-xs font-bold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 transition-colors flex items-center gap-1.5"
          >
            <Eye size={14} />
            <span>Ver no Site</span>
            <ExternalLink size={12} className="text-slate-400" />
          </a>

          <button
            onClick={handleOpenAddModal}
            className="bg-[#F49853] hover:bg-[#e0853d] text-white px-4 py-2 rounded-xl text-xs font-bold tracking-wide transition-all shadow-md shadow-orange-500/20 flex items-center gap-2"
          >
            <Plus size={16} />
            <span>Adicionar Destaque</span>
          </button>
        </div>
      </div>

      {/* Highlights List */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
          <div className="flex items-center gap-2">
            <span className="text-xs font-black uppercase tracking-wider text-slate-500">
              Cards Configurados ({highlights.length})
            </span>
            <span className="text-[11px] text-slate-400 font-medium">
              • A ordem abaixo é a mesma exibida no carrossel da Home
            </span>
          </div>
          <div className="text-xs text-slate-400">
            {highlights.filter(h => h.active !== false).length} ativos
          </div>
        </div>

        {highlights.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-12 h-12 rounded-full bg-orange-100 text-[#F49853] flex items-center justify-center mx-auto mb-3">
              <Sparkles size={24} />
            </div>
            <h3 className="font-bold text-slate-800 text-base">Nenhum destaque cadastrado</h3>
            <p className="text-sm text-slate-500 mt-1 max-w-sm mx-auto">
              Clique em "Adicionar Destaque", selecione uma matéria do Blog ou restaure os cards padrão.
            </p>
            <div className="mt-4 flex items-center justify-center gap-2">
              <button
                onClick={() => setBlogPickerOpen(true)}
                className="px-4 py-2 bg-indigo-600 text-white text-xs font-bold rounded-xl shadow-xs"
              >
                Importar Matérias do Blog
              </button>
              <button
                onClick={handleReset}
                className="px-4 py-2 bg-[#F49853] text-white text-xs font-bold rounded-xl shadow-xs"
              >
                Restaurar Cards Oficiais
              </button>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {highlights.map((item, index) => {
              const isActive = item.active !== false;
              return (
                <div 
                  key={item.id} 
                  className={cn(
                    "p-4 sm:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-colors hover:bg-slate-50/80",
                    !isActive && "opacity-60 bg-slate-50/50"
                  )}
                >
                  {/* Left: Reorder arrows + Thumbnail + Info */}
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    {/* Reorder Buttons */}
                    <div className="flex flex-col gap-1 shrink-0">
                      <button
                        onClick={() => moveItem(index, 'up')}
                        disabled={index === 0}
                        className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-200 disabled:opacity-30 disabled:pointer-events-none transition-colors"
                        title="Mover para cima"
                      >
                        <ArrowUp size={14} />
                      </button>
                      <button
                        onClick={() => moveItem(index, 'down')}
                        disabled={index === highlights.length - 1}
                        className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-200 disabled:opacity-30 disabled:pointer-events-none transition-colors"
                        title="Mover para baixo"
                      >
                        <ArrowDown size={14} />
                      </button>
                    </div>

                    {/* Thumbnail */}
                    <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden bg-slate-100 shrink-0 relative border border-slate-200 shadow-xs">
                      <img 
                        src={item.image} 
                        alt={item.title} 
                        className="w-full h-full object-cover" 
                      />
                      <div 
                        className="absolute bottom-0 left-0 right-0 h-1.5" 
                        style={{ backgroundColor: item.color || '#F49853' }} 
                      />
                    </div>

                    {/* Content Details */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span 
                          className="w-2.5 h-2.5 rounded-full shrink-0" 
                          style={{ backgroundColor: item.color || '#F49853' }} 
                        />
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200">
                          {item.category || 'Geral'}
                        </span>
                        <span className="text-[10px] font-medium text-slate-400">
                          • {item.location}
                        </span>
                        <span className={cn(
                          "text-[10px] font-bold px-2 py-0.5 rounded-md",
                          item.type === 'split' ? "bg-blue-50 text-blue-700 border border-blue-200" : "bg-purple-50 text-purple-700 border border-purple-200"
                        )}>
                          {item.type === 'split' ? 'Dividido (Split)' : 'Foto Inteira'}
                        </span>
                        {item.blogPostId && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200 inline-flex items-center gap-1">
                            <Newspaper size={10} /> Artigo do Blog
                          </span>
                        )}
                        {!isActive && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-rose-50 text-rose-600 border border-rose-200">
                            Pausado
                          </span>
                        )}
                      </div>

                      <h4 className="font-bold text-slate-900 text-sm sm:text-base leading-snug truncate">
                        {item.title}
                      </h4>

                      {item.snippet && (
                        <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">
                          {item.snippet}
                        </p>
                      )}

                      {item.content && (
                        <div className="mt-1.5 flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setPreviewStoryItem(item)}
                            className="inline-flex items-center gap-1.5 text-[11px] font-bold text-[#F49853] hover:text-[#d87c35] bg-orange-50 hover:bg-orange-100/80 px-2 py-0.5 rounded-lg border border-orange-200 transition-colors"
                          >
                            <BookOpen size={12} />
                            <span>Ver História Completa</span>
                          </button>
                          <span className="text-[10px] text-slate-400 font-medium">
                            • {item.content.length} caracteres ({item.content.split('\n').filter(Boolean).length} blocos)
                          </span>
                        </div>
                      )}

                      <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-1 font-mono">
                        <Globe size={11} />
                        <span>Link: {item.link || '/projetos'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Right Actions */}
                  <div className="flex items-center gap-2 self-end md:self-center shrink-0">
                    <button
                      onClick={() => toggleHighlightActive(item.id)}
                      className={cn(
                        "px-3 py-1.5 rounded-xl text-xs font-bold transition-all border cursor-pointer",
                        isActive 
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100" 
                          : "bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200"
                      )}
                    >
                      {isActive ? 'Ativo na Home' : 'Inativo'}
                    </button>

                    <button
                      onClick={() => handleOpenEditModal(item)}
                      className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors border border-transparent hover:border-slate-200"
                      title="Editar destaque"
                    >
                      <Edit3 size={16} />
                    </button>

                    <button
                      onClick={() => handleDelete(item.id, item.title)}
                      className="p-2 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-xl transition-colors border border-transparent hover:border-rose-100"
                      title="Excluir destaque"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Blog Articles Quick Picker Modal */}
      {blogPickerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity" 
            onClick={() => setBlogPickerOpen(false)} 
          />

          <div className="relative bg-white rounded-3xl max-w-2xl w-full max-h-[85vh] overflow-y-auto shadow-2xl z-10 border border-slate-200">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white/95 backdrop-blur-xs z-20">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600">
                  <Newspaper size={20} />
                </div>
                <div>
                  <h3 className="font-black text-slate-900 text-lg">Matérias do Blog</h3>
                  <p className="text-xs text-slate-500">
                    Clique em "Colocar no Destaque" para exibir qualquer artigo no carrossel da Landing Page.
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setBlogPickerOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-3">
              {posts.map((post) => {
                const isHighlighted = post.featured_home || isBlogPostHighlighted(post.id);
                return (
                  <div 
                    key={post.id}
                    className="p-4 rounded-2xl border border-slate-100 hover:border-slate-200 bg-slate-50/50 hover:bg-white transition-all flex items-center justify-between gap-4 shadow-2xs"
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className="w-14 h-14 rounded-xl overflow-hidden bg-slate-100 shrink-0 border border-slate-200 relative">
                        <img 
                          src={post.image} 
                          alt="" 
                          className="w-full h-full object-cover" 
                        />
                        {isHighlighted && (
                          <div className="absolute top-1 right-1 bg-amber-500 text-white rounded-full p-0.5">
                            <Star size={10} className="fill-white" />
                          </div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100">
                          {post.category}
                        </span>
                        <h4 className="font-bold text-slate-900 text-sm truncate mt-1">
                          {post.title}
                        </h4>
                        <p className="text-xs text-slate-500 truncate mt-0.5">
                          {post.excerpt}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleToggleBlogArticleHighlight(post)}
                      className={cn(
                        "px-3.5 py-2 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 transition-all shrink-0 cursor-pointer",
                        isHighlighted 
                          ? "bg-amber-500 hover:bg-amber-600 text-white shadow-xs" 
                          : "bg-white hover:bg-orange-50 text-slate-700 hover:text-[#F49853] border border-slate-200 hover:border-orange-200"
                      )}
                    >
                      <Star size={13} className={isHighlighted ? "fill-white text-white" : "text-slate-400"} />
                      <span>{isHighlighted ? 'No Destaque' : 'Colocar no Destaque'}</span>
                    </button>
                  </div>
                );
              })}
            </div>

            <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
              <Link 
                to="/communication/blog" 
                className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
              >
                <span>Abrir Gestão do Blog</span>
                <ExternalLink size={12} />
              </Link>
              <button
                onClick={() => setBlogPickerOpen(false)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-xs font-bold transition-colors"
              >
                Concluir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity" 
            onClick={() => setModalOpen(false)} 
          />

          <div className="relative bg-white rounded-3xl max-w-4xl w-full max-h-[92vh] overflow-y-auto shadow-2xl z-10 border border-slate-200">
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white/95 backdrop-blur-xs z-20">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-orange-50 border border-orange-200 flex items-center justify-center text-[#F49853]">
                  <Sparkles size={20} />
                </div>
                <div>
                  <h3 className="font-black text-slate-900 text-lg">
                    {editingId !== null ? 'Editar Destaque' : 'Novo Destaque da Home'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Personalize o conteúdo, imagem, cor e formato do card.
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Content: Form on Left, Live Preview on Right */}
            <form onSubmit={handleSubmit}>
              <div className="p-6 grid grid-cols-1 lg:grid-cols-12 gap-8">
                
                {/* Form Fields Column */}
                <div className="lg:col-span-7 space-y-5">
                  {/* Select from Blog Dropdown */}
                  <div className="bg-indigo-50/60 p-4 rounded-2xl border border-indigo-100 space-y-2">
                    <label className="block text-xs font-bold text-indigo-900 uppercase tracking-wider flex items-center gap-1.5">
                      <Newspaper size={14} className="text-indigo-600" />
                      <span>Preencher a partir de uma Matéria do Blog (Opcional)</span>
                    </label>
                    <select
                      value={formData.blogPostId || ''}
                      onChange={(e) => handleSelectBlogPost(e.target.value)}
                      className="w-full bg-white border border-indigo-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-700 outline-hidden focus:ring-2 focus:ring-indigo-500/20"
                    >
                      <option value="">-- Selecione uma matéria para auto-preencher --</option>
                      {posts.map(p => (
                        <option key={p.id} value={p.id}>
                          {p.title} ({p.category})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Card Type Selector */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                      Estilo / Formato do Card
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, type: 'photo' })}
                        className={cn(
                          "p-3 rounded-2xl border text-left flex flex-col gap-1 transition-all",
                          formData.type === 'photo' 
                            ? "border-[#F49853] bg-orange-50/50 shadow-xs ring-1 ring-[#F49853]" 
                            : "border-slate-200 hover:border-slate-300 bg-white"
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-xs text-slate-900">Foto Inteira</span>
                          <ImageIcon size={14} className={formData.type === 'photo' ? 'text-[#F49853]' : 'text-slate-400'} />
                        </div>
                        <span className="text-[11px] text-slate-500">
                          Foto em tela cheia com degradê escuro e texto sobreposto.
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, type: 'split' })}
                        className={cn(
                          "p-3 rounded-2xl border text-left flex flex-col gap-1 transition-all",
                          formData.type === 'split' 
                            ? "border-[#F49853] bg-orange-50/50 shadow-xs ring-1 ring-[#F49853]" 
                            : "border-slate-200 hover:border-slate-300 bg-white"
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-xs text-slate-900">Dividido (Split)</span>
                          <Layers size={14} className={formData.type === 'split' ? 'text-[#F49853]' : 'text-slate-400'} />
                        </div>
                        <span className="text-[11px] text-slate-500">
                          Metade imagem e metade card branco com texto explicativo.
                        </span>
                      </button>
                    </div>
                  </div>

                  {/* Title */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                      Título do Destaque *
                    </label>
                    <input 
                      type="text" 
                      value={formData.title} 
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })} 
                      placeholder="Ex: Casa Nutri: Resgatando 20 Crianças em Nampula" 
                      required
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-[#F49853] focus:ring-2 focus:ring-[#F49853]/20 text-sm font-medium text-slate-800 transition-all outline-hidden"
                    />
                  </div>

                  {/* Category & Location */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                        Categoria / Tag
                      </label>
                      <input 
                        type="text" 
                        value={formData.category} 
                        onChange={(e) => setFormData({ ...formData, category: e.target.value })} 
                        placeholder="Ex: Nutrição & Saúde Infantil" 
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-[#F49853] focus:ring-2 focus:ring-[#F49853]/20 text-sm font-medium text-slate-800 transition-all outline-hidden"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                        Localização
                      </label>
                      <input 
                        type="text" 
                        value={formData.location} 
                        onChange={(e) => setFormData({ ...formData, location: e.target.value })} 
                        placeholder="Ex: Moçambique, Brasil, Nampula" 
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-[#F49853] focus:ring-2 focus:ring-[#F49853]/20 text-sm font-medium text-slate-800 transition-all outline-hidden"
                      />
                    </div>
                  </div>

                  {/* Snippet / Descrição Curta */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                      Resumo Curto (Exibido no Card)
                    </label>
                    <textarea 
                      rows={2}
                      value={formData.snippet} 
                      onChange={(e) => setFormData({ ...formData, snippet: e.target.value })} 
                      placeholder="Breve texto introdutório da história..." 
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-[#F49853] focus:ring-2 focus:ring-[#F49853]/20 text-sm font-medium text-slate-800 transition-all outline-hidden resize-none"
                    />
                  </div>

                  {/* Conteúdo Completo / História Detalhada */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                        História Completa / Conteúdo Detalhado
                      </label>
                      <span className="text-[11px] text-slate-400 font-mono">
                        {formData.content.length} caracteres
                      </span>
                    </div>
                    <textarea 
                      rows={7}
                      value={formData.content} 
                      onChange={(e) => setFormData({ ...formData, content: e.target.value })} 
                      placeholder="Escreva a história completa deste destaque... Você pode usar parágrafos, marcadores e detalhes sobre o impacto em Moçambique ou Brasil." 
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-[#F49853] focus:ring-2 focus:ring-[#F49853]/20 text-sm font-medium text-slate-800 transition-all outline-hidden resize-y font-sans leading-relaxed"
                    />
                    <p className="text-[11px] text-slate-400 mt-1">
                      Este conteúdo será apresentado em detalhes quando o usuário abrir a história.
                    </p>
                  </div>

                  {/* Color Accent Picker */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                      Cor de Identidade (Paleta YAH Hope)
                    </label>
                    <div className="flex items-center gap-2 flex-wrap mb-2">
                      {PRESET_COLORS.map((c) => (
                        <button
                          key={c.hex}
                          type="button"
                          onClick={() => setFormData({ ...formData, color: c.hex })}
                          className={cn(
                            "w-8 h-8 rounded-full border-2 transition-transform hover:scale-110 flex items-center justify-center",
                            formData.color.toLowerCase() === c.hex.toLowerCase() 
                              ? "border-slate-900 scale-110 shadow-xs" 
                              : "border-slate-200"
                          )}
                          style={{ backgroundColor: c.hex }}
                          title={c.name}
                        >
                          {formData.color.toLowerCase() === c.hex.toLowerCase() && (
                            <Check size={14} className={c.hex === '#FFFFFF' ? 'text-slate-900' : 'text-white'} />
                          )}
                        </button>
                      ))}
                    </div>
                    <div className="flex items-center gap-2">
                      <input 
                        type="color" 
                        value={formData.color} 
                        onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                        className="w-8 h-8 rounded-lg cursor-pointer border border-slate-200" 
                      />
                      <input 
                        type="text" 
                        value={formData.color} 
                        onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                        className="w-28 px-2 py-1 rounded-lg border border-slate-200 text-xs font-mono text-slate-700 outline-hidden" 
                      />
                    </div>
                  </div>

                  {/* Image URL & Presets */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                      URL da Foto *
                    </label>
                    <input 
                      type="text" 
                      value={formData.image} 
                      onChange={(e) => setFormData({ ...formData, image: e.target.value })} 
                      placeholder="https://... ou /nome-da-imagem.jpg" 
                      required
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-[#F49853] focus:ring-2 focus:ring-[#F49853]/20 text-sm font-medium text-slate-800 transition-all outline-hidden"
                    />

                    {/* Quick Preset Buttons */}
                    <div className="mt-2">
                      <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1">
                        Imagens Rápidas do Projeto:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {PRESET_IMAGES.map((img) => (
                          <button
                            key={img.url}
                            type="button"
                            onClick={() => setFormData({ ...formData, image: img.url })}
                            className={cn(
                              "px-2 py-1 rounded-md text-[10px] font-bold border transition-colors",
                              formData.image === img.url
                                ? "bg-orange-100 text-orange-800 border-orange-300"
                                : "bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200"
                            )}
                          >
                            {img.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Destination Link */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                      Link de Destino ao Clicar
                    </label>
                    <input 
                      type="text" 
                      value={formData.link} 
                      onChange={(e) => setFormData({ ...formData, link: e.target.value })} 
                      placeholder="/blog?post=..., /projetos, ou URL externa" 
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-[#F49853] focus:ring-2 focus:ring-[#F49853]/20 text-sm font-medium text-slate-800 transition-all outline-hidden"
                    />
                  </div>

                  {/* Active Toggle */}
                  <div className="pt-2">
                    <label className="flex items-center gap-2.5 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={formData.active} 
                        onChange={(e) => setFormData({ ...formData, active: e.target.checked })} 
                        className="w-4 h-4 rounded text-[#F49853] focus:ring-[#F49853] border-slate-300"
                      />
                      <span className="text-xs font-bold text-slate-800">
                        Exibir este card no carrossel da Home
                      </span>
                    </label>
                  </div>
                </div>

                {/* Live Preview Column */}
                <div className="lg:col-span-5 flex flex-col justify-start">
                  <div className="sticky top-24">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-black uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                        <Eye size={13} className="text-[#F49853]" />
                        Prévia ao Vivo na Home
                      </span>
                      <span className="text-[11px] font-bold text-slate-400">
                        {formData.type === 'split' ? 'Card Dividido' : 'Card Foto'}
                      </span>
                    </div>

                    {/* Exact Card Component Render */}
                    <div className="bg-slate-100 p-4 rounded-3xl border border-slate-200">
                      {formData.type === 'split' ? (
                        <div className="bg-white rounded-2xl overflow-hidden shadow-xl border border-orange-100 flex flex-col h-72">
                          <div className="w-full h-36 relative overflow-hidden bg-slate-900 shrink-0">
                            <img 
                              src={formData.image || '/hero_bg.jpg'} 
                              alt={formData.title} 
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = 'https://hope.yahchurch.com/wp-content/uploads/2025/09/HOPE-ALFACES.avif';
                              }}
                            />
                          </div>
                          <div className="p-4 flex flex-col justify-between flex-1">
                            <div>
                              <div 
                                className="w-8 h-1 rounded-full mb-2" 
                                style={{ backgroundColor: formData.color || '#F49853' }} 
                              />
                              <h4 className="font-heading font-bold text-slate-900 text-sm leading-snug line-clamp-2">
                                {formData.title || 'Título do seu destaque'}
                              </h4>
                              <p className="text-xs text-slate-500 mt-1.5 font-gotham-light line-clamp-2 leading-relaxed">
                                {formData.snippet || 'Texto explicativo breve que aparecerá na lateral do card...'}
                              </p>
                            </div>
                            <div 
                              className="flex items-center gap-1 text-[11px] font-gotham-bold pt-2" 
                              style={{ color: formData.color || '#F49853' }}
                            >
                              <span>Saiba mais</span>
                              <ArrowRight size={12} />
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="relative rounded-2xl overflow-hidden shadow-xl h-72 flex flex-col justify-end p-5 border border-orange-100/40">
                          <img 
                            src={formData.image || '/hero_bg.jpg'} 
                            alt={formData.title} 
                            className="absolute inset-0 w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = 'https://hope.yahchurch.com/wp-content/uploads/2025/09/HOPE-ALFACES.avif';
                            }}
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
                          
                          <div className="relative z-10 text-white">
                            <div 
                              className="w-8 h-1 rounded-full mb-2" 
                              style={{ backgroundColor: formData.color || '#F49853' }} 
                            />
                            <h4 className="font-heading font-bold text-sm leading-snug text-white line-clamp-3">
                              {formData.title || 'Título do seu destaque'}
                            </h4>
                            <div 
                              className="flex items-center gap-1.5 text-[11px] font-gotham-bold mt-2" 
                              style={{ color: formData.color || '#EBC878' }}
                            >
                              <span>{formData.category || 'Categoria'}</span>
                              <span className="text-white/40">•</span>
                              <span>{formData.location || 'Local'}</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

              </div>

              {/* Modal Footer */}
              <div className="p-6 border-t border-slate-100 flex items-center justify-end gap-3 bg-slate-50/60 sticky bottom-0 rounded-b-3xl">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:text-slate-800 hover:bg-slate-200 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-[#F49853] hover:bg-[#e0853d] text-white px-6 py-2.5 rounded-xl text-xs font-bold tracking-wide transition-all shadow-md shadow-orange-500/20 disabled:opacity-50"
                >
                  {isSubmitting ? 'Salvando...' : editingId !== null ? 'Salvar Alterações' : 'Criar Destaque'}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* Story Preview Modal (Full Content View) */}
      {previewStoryItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="fixed inset-0 bg-black/70 backdrop-blur-xs transition-opacity" 
            onClick={() => setPreviewStoryItem(null)} 
          />

          <div className="relative bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl z-10 border border-slate-200">
            {/* Header with image */}
            <div className="relative h-64 w-full bg-slate-900 overflow-hidden rounded-t-3xl">
              <img 
                src={previewStoryItem.image} 
                alt={previewStoryItem.title} 
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
              
              <button 
                onClick={() => setPreviewStoryItem(null)}
                className="absolute top-4 right-4 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors z-10"
              >
                <X size={18} />
              </button>

              <div className="absolute bottom-4 left-6 right-6 text-white">
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <span 
                    className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md text-white shadow-xs"
                    style={{ backgroundColor: previewStoryItem.color || '#F49853' }}
                  >
                    {previewStoryItem.category || 'Destaque'}
                  </span>
                  <span className="text-xs text-white/80 font-medium">
                    • {previewStoryItem.location}
                  </span>
                </div>
                <h2 className="text-xl sm:text-2xl font-black leading-snug">
                  {previewStoryItem.title}
                </h2>
              </div>
            </div>

            {/* Content Body */}
            <div className="p-6 sm:p-8 space-y-4">
              {previewStoryItem.snippet && (
                <div className="p-4 rounded-2xl bg-orange-50/60 border border-orange-100 text-slate-700 text-sm font-medium leading-relaxed italic">
                  "{previewStoryItem.snippet}"
                </div>
              )}

              <div className="text-slate-700 text-sm sm:text-base leading-relaxed space-y-3 font-normal whitespace-pre-line">
                {previewStoryItem.content || (
                  <p className="text-slate-400 italic">
                    Nenhum conteúdo detalhado cadastrado ainda para este destaque.
                  </p>
                )}
              </div>

              {/* Destination info */}
              <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
                <span className="font-mono">Link: {previewStoryItem.link}</span>
                <div className="flex items-center gap-2">
                  {previewStoryItem.link?.startsWith('/blog') && (
                    <a
                      href={previewStoryItem.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 rounded-lg bg-orange-50 hover:bg-orange-100 text-[#F49853] font-bold transition-colors inline-flex items-center gap-1.5 border border-orange-200"
                    >
                      <ExternalLink size={12} />
                      <span>Abrir no Blog</span>
                    </a>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      const item = previewStoryItem;
                      setPreviewStoryItem(null);
                      handleOpenEditModal(item);
                    }}
                    className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition-colors inline-flex items-center gap-1.5"
                  >
                    <Edit3 size={12} />
                    <span>Editar História</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-slate-100 bg-slate-50/70 rounded-b-3xl flex justify-end">
              <button
                type="button"
                onClick={() => setPreviewStoryItem(null)}
                className="px-5 py-2 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 transition-colors shadow-xs"
              >
                Fechar Leitura
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
