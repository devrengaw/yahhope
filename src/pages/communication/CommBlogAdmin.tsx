import React, { useState, useRef } from 'react';
import { 
  Newspaper, 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  Eye, 
  CheckCircle2, 
  AlertCircle, 
  X, 
  AlignLeft, 
  Calendar, 
  Clock, 
  Star, 
  Sparkles,
  ExternalLink,
  Share2,
  Heart,
  MessageSquare,
  BookOpen,
  Filter,
  SlidersHorizontal,
  ChevronDown,
  Upload,
  Image as ImageIcon,
  MoreHorizontal,
  RefreshCw,
  Globe
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { RichTextEditor } from '../../components/communication/RichTextEditor';
import { useConfirm } from '../../contexts/ConfirmContext';
import { useBlog, BlogPost } from '../../contexts/BlogContext';
import { uploadBlogImage } from '../../lib/imageUpload';
import { cn } from '../../lib/utils';

type BlogTab = 'published' | 'draft' | 'review' | 'scheduled' | 'trash';

const PRESET_COLORS = [
  { name: 'Laranja YAH Hope', hex: '#F49853' },
  { name: 'Verde YAH Hope', hex: '#92BF78' },
  { name: 'Azul YAH Hope', hex: '#88A1F2' },
  { name: 'Amarelo YAH Hope', hex: '#EBC878' },
  { name: 'Cinza Neutro', hex: '#878787' }
];

function formatPtDate(dateStr: string | undefined): string {
  if (!dateStr) return 'Não definida';
  try {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const monthIndex = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      const months = ['jan.', 'fev.', 'mar.', 'abr.', 'maio', 'jun.', 'jul.', 'ago.', 'set.', 'out.', 'nov.', 'dez.'];
      if (!isNaN(day) && !isNaN(year) && months[monthIndex]) {
        return `${day} de ${months[monthIndex]} de ${year}`;
      }
    }
    const d = new Date(dateStr);
    if (!isNaN(d.getTime())) {
      const months = ['jan.', 'fev.', 'mar.', 'abr.', 'maio', 'jun.', 'jul.', 'ago.', 'set.', 'out.', 'nov.', 'dez.'];
      return `${d.getDate()} de ${months[d.getMonth()]} de ${d.getFullYear()}`;
    }
  } catch {}
  return dateStr;
}

export function CommBlogAdmin() {
  const { 
    posts, 
    loading,
    addPost, 
    updatePost, 
    deletePost, 
    moveToTrash, 
    restoreFromTrash, 
    bulkUpdateStatus, 
    toggleFeaturedHome
  } = useBlog();

  const { confirm } = useConfirm();

  // Navigation and Filtering State
  const [activeTab, setActiveTab] = useState<BlogTab>('published');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Todas');
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [selectedPostIds, setSelectedPostIds] = useState<string[]>([]);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  // Editor Modal State
  const [isEditing, setIsEditing] = useState(false);
  const [currentPost, setCurrentPost] = useState<Partial<BlogPost> | null>(null);
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const [showCoverUrlInput, setShowCoverUrlInput] = useState(false);
  const coverFileInputRef = useRef<HTMLInputElement>(null);

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Tab counts
  const publishedCount = posts.filter(p => p.status === 'published').length;
  const draftCount = posts.filter(p => p.status === 'draft').length;
  const reviewCount = posts.filter(p => p.status === 'review').length;
  const scheduledCount = posts.filter(p => p.status === 'scheduled').length;
  const trashCount = posts.filter(p => p.status === 'trash').length;

  // Filter posts based on active tab, search query, and category
  const filteredPosts = posts.filter(p => {
    // Tab filter
    if (activeTab === 'trash') {
      if (p.status !== 'trash') return false;
    } else {
      if (p.status !== activeTab) return false;
    }

    // Category filter
    if (selectedCategory !== 'Todas' && p.category !== selectedCategory) {
      return false;
    }

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = p.title.toLowerCase().includes(q);
      const matchCategory = p.category?.toLowerCase().includes(q);
      const matchAuthor = p.author?.toLowerCase().includes(q);
      if (!matchTitle && !matchCategory && !matchAuthor) return false;
    }

    return true;
  });

  // Extract all available categories
  const categories = ['Todas', ...Array.from(new Set(posts.map(p => p.category).filter(Boolean)))];

  // Selection handlers
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedPostIds(filteredPosts.map(p => p.id));
    } else {
      setSelectedPostIds([]);
    }
  };

  const handleToggleSelectPost = (id: string) => {
    setSelectedPostIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  // Bulk actions
  const handleBulkMoveToTrash = async () => {
    if (selectedPostIds.length === 0) return;
    const ok = await confirm({
      title: 'Mover para a Lixeira',
      message: `Deseja mover ${selectedPostIds.length} post(s) para a lixeira?`,
      confirmText: 'Mover',
      cancelText: 'Cancelar',
      type: 'warning'
    });
    if (ok) {
      await bulkUpdateStatus(selectedPostIds, 'trash');
      setSelectedPostIds([]);
      showToast(`${selectedPostIds.length} post(s) movidos para a lixeira.`);
    }
  };

  const handleBulkPublish = async () => {
    if (selectedPostIds.length === 0) return;
    await bulkUpdateStatus(selectedPostIds, 'published');
    setSelectedPostIds([]);
    showToast(`${selectedPostIds.length} post(s) publicados com sucesso!`);
  };

  // Single post actions
  const handleDeleteOrTrash = async (post: BlogPost) => {
    if (post.status === 'trash') {
      const ok = await confirm({
        title: 'Excluir Definitivamente',
        message: `Tem certeza que deseja apagar "${post.title}" para sempre? Essa ação não pode ser desfeita.`,
        confirmText: 'Excluir Definitivamente',
        cancelText: 'Cancelar',
        type: 'danger'
      });
      if (ok) {
        await deletePost(post.id);
        showToast('Postagem excluída permanentemente.');
      }
    } else {
      await moveToTrash(post.id);
      showToast('Artigo movido para a lixeira.');
    }
    setActiveMenuId(null);
  };

  const handleRestore = async (post: BlogPost) => {
    await restoreFromTrash(post.id);
    showToast('Artigo restaurado para Rascunho.');
    setActiveMenuId(null);
  };

  const handleToggleHomeHighlight = async (post: BlogPost) => {
    const isNowFeatured = await toggleFeaturedHome(post.id);
    showToast(
      isNowFeatured 
        ? `⭐ "${post.title}" agora está em destaque na Landing Page!` 
        : `Artigo removido dos destaques da Landing Page.`
    );
    setActiveMenuId(null);
  };

  // Image cover upload handler
  const handleCoverFileUpload = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Por favor, selecione uma imagem válida (PNG, JPG, WebP).');
      return;
    }
    try {
      setIsUploadingCover(true);
      const url = await uploadBlogImage(file, { maxWidth: 1600, quality: 0.85 });
      setCurrentPost(prev => ({ ...prev, image: url }));
      showToast('Imagem de capa carregada com sucesso!');
    } catch {
      alert('Erro ao carregar a imagem. Tente novamente.');
    } finally {
      setIsUploadingCover(false);
      if (coverFileInputRef.current) {
        coverFileInputRef.current.value = '';
      }
    }
  };

  const handleSave = async (e: React.FormEvent, forceStatus?: BlogPost['status']) => {
    e.preventDefault();
    if (!currentPost?.title?.trim()) {
      alert('Por favor, informe o título do artigo.');
      return;
    }

    const isFuture = currentPost.published_at ? new Date(currentPost.published_at) > new Date() : false;
    const finalStatus: BlogPost['status'] = forceStatus || (isFuture ? 'scheduled' : 'published');

    if (currentPost.id) {
      await updatePost(currentPost.id, {
        ...currentPost,
        status: finalStatus,
        has_unpublished_changes: false
      });
      showToast('Postagem atualizada com sucesso!');
    } else {
      await addPost({
        title: currentPost.title || '',
        excerpt: currentPost.excerpt || '',
        content: currentPost.content || '',
        image: currentPost.image || 'https://hope.yahchurch.com/wp-content/uploads/2025/09/HOPE-ALFACES.avif',
        published_at: currentPost.published_at,
        author: currentPost.author || 'YAH Hope',
        status: finalStatus,
        category: currentPost.category || 'Geral',
        featured_home: currentPost.featured_home || false,
        highlight_type: currentPost.highlight_type || 'split',
        highlight_color: currentPost.highlight_color || '#F49853',
        translations: currentPost.translations || ['pt']
      });
      showToast('Nova postagem criada com sucesso!');
    }
    setIsEditing(false);
    setCurrentPost(null);
  };

  return (
    <div className="space-y-6 pb-20 font-sans" onClick={() => setActiveMenuId(null)}>
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
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Newspaper className="text-blue-600" size={28} />
            Administração do Blog
          </h1>
          <p className="text-slate-500 mt-1 text-sm font-medium">
            Acompanhe visualizações, leituras, curtidas e compartilhamentos dos artigos.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap w-full sm:w-auto">
          {loading && (
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-slate-400 bg-slate-50 rounded-xl border border-slate-200/60">
              <RefreshCw size={12} className="animate-spin text-blue-500" />
              <span>Sincronizando...</span>
            </div>
          )}

          <Link
            to="/communication/home-highlights"
            className="px-3.5 py-2 rounded-xl font-bold text-xs bg-orange-50 text-[#F49853] hover:bg-orange-100 border border-orange-200 transition-all flex items-center gap-1.5"
            title="Ir para o Gerenciador de Destaques da Home"
          >
            <Sparkles size={14} />
            <span>Destaques da Home</span>
          </Link>

          <button 
            onClick={() => { 
              setCurrentPost({ 
                content: '', 
                status: 'draft', 
                image: 'https://hope.yahchurch.com/wp-content/uploads/2025/09/HOPE-ALFACES.avif',
                featured_home: false,
                highlight_type: 'split',
                highlight_color: '#F49853',
                author: 'YAH Hope',
                category: 'Geral',
                translations: ['pt']
              }); 
              setIsEditing(true); 
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2 transition-colors shadow-sm text-xs cursor-pointer"
          >
            <Plus size={16} />
            Novo Post
          </button>
        </div>
      </div>

      {/* Main Container with Top Tabs matching the screenshot */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        
        {/* Top Tabs Bar */}
        <div className="border-b border-slate-200 px-6 pt-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-6 overflow-x-auto w-full md:w-auto scrollbar-none pb-0">
            {/* Tab: Publicados */}
            <button
              type="button"
              onClick={() => setActiveTab('published')}
              className={cn(
                "pb-3 text-sm font-bold flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap cursor-pointer",
                activeTab === 'published'
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-slate-600 hover:text-slate-900"
              )}
            >
              <span>Publicados</span>
              <span className={cn(
                "px-2 py-0.5 rounded-full text-xs font-black",
                activeTab === 'published' ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600"
              )}>
                {publishedCount}
              </span>
            </button>

            {/* Tab: Rascunho */}
            <button
              type="button"
              onClick={() => setActiveTab('draft')}
              className={cn(
                "pb-3 text-sm font-bold flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap cursor-pointer",
                activeTab === 'draft'
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-slate-600 hover:text-slate-900"
              )}
            >
              <span>Rascunho</span>
              {draftCount > 0 && (
                <span className={cn(
                  "px-2 py-0.5 rounded-full text-xs font-black",
                  activeTab === 'draft' ? "bg-blue-600 text-white" : "bg-blue-100 text-blue-700"
                )}>
                  {draftCount}
                </span>
              )}
            </button>

            {/* Tab: Aguardando revisão */}
            <button
              type="button"
              onClick={() => setActiveTab('review')}
              className={cn(
                "pb-3 text-sm font-bold flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap cursor-pointer",
                activeTab === 'review'
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-slate-600 hover:text-slate-900"
              )}
            >
              <span>Aguardando revisão</span>
              {reviewCount > 0 && (
                <span className="px-2 py-0.5 rounded-full text-xs font-black bg-amber-100 text-amber-800">
                  {reviewCount}
                </span>
              )}
            </button>

            {/* Tab: Agendados */}
            <button
              type="button"
              onClick={() => setActiveTab('scheduled')}
              className={cn(
                "pb-3 text-sm font-bold flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap cursor-pointer",
                activeTab === 'scheduled'
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-slate-600 hover:text-slate-900"
              )}
            >
              <span>Agendados</span>
              {scheduledCount > 0 && (
                <span className="px-2 py-0.5 rounded-full text-xs font-black bg-purple-100 text-purple-800">
                  {scheduledCount}
                </span>
              )}
            </button>

            {/* Tab: Lixeira */}
            <button
              type="button"
              onClick={() => setActiveTab('trash')}
              className={cn(
                "pb-3 text-sm font-bold flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap cursor-pointer",
                activeTab === 'trash'
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-slate-600 hover:text-slate-900"
              )}
            >
              <span>Lixeira</span>
              {trashCount > 0 && (
                <span className="px-2 py-0.5 rounded-full text-xs font-black bg-rose-100 text-rose-800">
                  {trashCount}
                </span>
              )}
            </button>
          </div>

          {/* Language Selector matching screenshot */}
          <div className="pb-3 flex items-center gap-2 text-xs font-medium text-slate-700 shrink-0">
            <span className="text-base">🇧🇷</span>
            <span>Português (português)</span>
            <ChevronDown size={14} className="text-slate-400" />
          </div>
        </div>

        {/* Action and Filter Toolbar */}
        <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row gap-4 items-center justify-between bg-slate-50/40">
          
          {/* Checkbox select all & Bulk Actions */}
          <div className="flex items-center gap-3 w-full md:w-auto">
            <input 
              type="checkbox"
              checked={filteredPosts.length > 0 && selectedPostIds.length === filteredPosts.length}
              onChange={(e) => handleSelectAll(e.target.checked)}
              className="w-4 h-4 rounded text-blue-600 border-slate-300 focus:ring-blue-500 cursor-pointer"
            />
            {selectedPostIds.length > 0 ? (
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-700">
                  {selectedPostIds.length} selecionado(s)
                </span>
                {activeTab !== 'published' && (
                  <button
                    type="button"
                    onClick={handleBulkPublish}
                    className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
                  >
                    Publicar
                  </button>
                )}
                {activeTab !== 'trash' && (
                  <button
                    type="button"
                    onClick={handleBulkMoveToTrash}
                    className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                  >
                    Mover para Lixeira
                  </button>
                )}
              </div>
            ) : (
              <span className="text-xs text-slate-400 font-medium">Selecionar todos</span>
            )}
          </div>

          {/* Right Toolbar Controls: Filtrar, Quick Filter, Buscar */}
          <div className="flex items-center gap-3 w-full md:w-auto justify-end">
            
            {/* Filter Button */}
            <div className="relative">
              <button 
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowFilterDropdown(!showFilterDropdown);
                }}
                className={cn(
                  "px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs",
                  selectedCategory !== 'Todas' 
                    ? "bg-blue-50 text-blue-600 border-blue-200" 
                    : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                )}
              >
                <Filter size={14} className={selectedCategory !== 'Todas' ? "text-blue-600" : "text-blue-500"} />
                <span>{selectedCategory !== 'Todas' ? selectedCategory : 'Filtrar'}</span>
              </button>

              {/* Category Filter Menu */}
              {showFilterDropdown && (
                <div 
                  className="absolute right-0 top-full mt-2 w-52 bg-white border border-slate-200 rounded-2xl shadow-xl p-2 z-40 animate-in fade-in"
                  onClick={(e) => e.stopPropagation()}
                >
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-3 py-1 block">
                    Filtrar por Categoria
                  </span>
                  {categories.map(cat => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => {
                        setSelectedCategory(cat);
                        setShowFilterDropdown(false);
                      }}
                      className={cn(
                        "w-full text-left px-3 py-1.5 rounded-xl text-xs font-medium transition-colors flex items-center justify-between",
                        selectedCategory === cat 
                          ? "bg-blue-50 text-blue-700 font-bold" 
                          : "hover:bg-slate-50 text-slate-700"
                      )}
                    >
                      <span>{cat}</span>
                      {selectedCategory === cat && <CheckCircle2 size={13} className="text-blue-600" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Quick Filter Icon */}
            <button
              type="button"
              onClick={() => setSelectedCategory('Todas')}
              className="p-2 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-slate-500 hover:text-slate-800 transition-colors shadow-2xs cursor-pointer"
              title="Limpar filtros"
            >
              <SlidersHorizontal size={14} />
            </button>

            {/* Search Input matching screenshot */}
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
              <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar" 
                className="w-full pl-9 pr-4 py-1.5 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-xs font-medium bg-white"
              />
            </div>
          </div>
        </div>

        {/* Table View matching the screenshot */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[900px]">
            <thead>
              <tr className="bg-white border-b border-slate-200 text-slate-700 text-xs font-bold">
                <th className="w-10 px-4 py-3.5">
                  {/* Row checkbox spacing */}
                </th>
                <th className="px-4 py-3.5 font-bold">Post</th>
                <th className="px-4 py-3.5 font-bold whitespace-nowrap">Data da publicação</th>
                <th className="px-4 py-3.5 font-bold whitespace-nowrap text-center">Traduções</th>
                <th className="px-4 py-3.5 font-bold whitespace-nowrap text-center">Visualizações</th>
                <th className="px-4 py-3.5 font-bold whitespace-nowrap text-center">Leituras</th>
                <th className="px-4 py-3.5 font-bold whitespace-nowrap text-center">Comentários</th>
                <th className="px-4 py-3.5 font-bold whitespace-nowrap text-center">Curtidas</th>
                <th className="px-4 py-3.5 font-bold whitespace-nowrap text-center">Compartilhar</th>
                <th className="w-16 px-4 py-3.5 font-bold text-right"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredPosts.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-6 py-12 text-center text-slate-400">
                    <p className="font-medium text-sm">Nenhuma postagem encontrada nesta aba.</p>
                  </td>
                </tr>
              ) : (
                filteredPosts.map((post) => {
                  const isChecked = selectedPostIds.includes(post.id);
                  return (
                    <tr 
                      key={post.id} 
                      className={cn(
                        "hover:bg-slate-50/80 transition-colors group",
                        isChecked && "bg-blue-50/40"
                      )}
                    >
                      {/* Checkbox */}
                      <td className="px-4 py-4 text-center">
                        <input 
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleToggleSelectPost(post.id)}
                          className="w-4 h-4 rounded text-blue-600 border-slate-300 focus:ring-blue-500 cursor-pointer"
                        />
                      </td>

                      {/* Post Thumbnail, Title, Author & Badges */}
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-16 h-12 rounded-lg overflow-hidden bg-slate-100 shrink-0 border border-slate-200/80 shadow-2xs relative">
                            <img 
                              src={post.image} 
                              alt="" 
                              className="w-full h-full object-cover" 
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = 'https://hope.yahchurch.com/wp-content/uploads/2025/09/HOPE-ALFACES.avif';
                              }}
                            />
                          </div>

                          <div className="min-w-0 flex-1 space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p 
                                onClick={() => {
                                  setCurrentPost(post);
                                  setIsEditing(true);
                                }}
                                className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors cursor-pointer truncate max-w-md text-sm"
                              >
                                {post.title}
                              </p>
                            </div>

                            <p className="text-slate-500 text-[11px] truncate">
                              {post.author} {post.category ? `· ${post.category}` : ''}
                            </p>

                            {/* Status tags: Alterações não publicadas, Destaque */}
                            <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                              {post.has_unpublished_changes && (
                                <span className="text-[10px] font-bold text-orange-600 bg-orange-50 border border-orange-200 px-2 py-0.5 rounded-md">
                                  Alterações não publicadas
                                </span>
                              )}
                              {post.featured_home && (
                                <span className="text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md flex items-center gap-1">
                                  <Star size={10} className="fill-amber-500 text-amber-500" />
                                  <span>Destaque</span>
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Data da publicação */}
                      <td className="px-4 py-4 text-slate-600 whitespace-nowrap">
                        {formatPtDate(post.published_at || post.date)}
                      </td>

                      {/* Traduções */}
                      <td className="px-4 py-4 text-center whitespace-nowrap">
                        <span className="text-slate-600 font-medium font-mono text-[11px]">
                          {post.translations?.length || 1}/3
                        </span>
                      </td>

                      {/* Visualizações */}
                      <td className="px-4 py-4 text-center whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5 text-slate-700 font-medium">
                          <Eye size={14} className="text-slate-400" />
                          <span>{post.views_count ?? 0}</span>
                        </div>
                      </td>

                      {/* Leituras */}
                      <td className="px-4 py-4 text-center whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5 text-slate-700 font-medium">
                          <BookOpen size={14} className="text-slate-400" />
                          <span>{post.reads_count ?? 0}</span>
                        </div>
                      </td>

                      {/* Comentários */}
                      <td className="px-4 py-4 text-center whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5 text-slate-700 font-medium">
                          <MessageSquare size={14} className="text-slate-400" />
                          <span>{post.comments_count ?? 0}</span>
                        </div>
                      </td>

                      {/* Curtidas */}
                      <td className="px-4 py-4 text-center whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5 text-slate-700 font-medium">
                          <Heart size={14} className={post.likes_count ? "text-rose-500 fill-rose-500" : "text-slate-400"} />
                          <span>{post.likes_count ?? 0}</span>
                        </div>
                      </td>

                      {/* Compartilhar Button */}
                      <td className="px-4 py-4 text-center whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(`${window.location.origin}/blog?post=${post.id}`);
                            showToast('Link do artigo copiado!');
                          }}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer inline-flex items-center gap-1"
                          title="Copiar link de compartilhamento"
                        >
                          <Share2 size={15} />
                          {post.shares_count ? (
                            <span className="text-[11px] font-bold">{post.shares_count}</span>
                          ) : null}
                        </button>
                      </td>

                      {/* Menu de Ações (...) */}
                      <td className="px-4 py-4 text-right relative whitespace-nowrap">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveMenuId(activeMenuId === post.id ? null : post.id);
                          }}
                          className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                        >
                          <MoreHorizontal size={18} />
                        </button>

                        {/* Dropdown Menu */}
                        {activeMenuId === post.id && (
                          <div 
                            className="absolute right-4 top-10 mt-1 w-48 bg-white border border-slate-200 rounded-2xl shadow-xl p-1.5 z-40 animate-in fade-in"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <button
                              type="button"
                              onClick={() => {
                                setCurrentPost(post);
                                setIsEditing(true);
                                setActiveMenuId(null);
                              }}
                              className="w-full text-left px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 rounded-xl flex items-center gap-2 cursor-pointer"
                            >
                              <Edit2 size={13} className="text-blue-600" />
                              <span>Editar Post</span>
                            </button>

                            <Link
                              to={`/blog?post=${post.id}`}
                              target="_blank"
                              className="w-full text-left px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 rounded-xl flex items-center gap-2 cursor-pointer"
                            >
                              <ExternalLink size={13} className="text-slate-500" />
                              <span>Ver no Site</span>
                            </Link>

                            <button
                              type="button"
                              onClick={() => handleToggleHomeHighlight(post)}
                              className="w-full text-left px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 rounded-xl flex items-center gap-2 cursor-pointer"
                            >
                              <Star size={13} className={post.featured_home ? "text-amber-500 fill-amber-500" : "text-slate-400"} />
                              <span>{post.featured_home ? 'Remover Destaque' : 'Destacar na Home'}</span>
                            </button>

                            <div className="h-[1px] bg-slate-100 my-1" />

                            {post.status === 'trash' ? (
                              <>
                                <button
                                  type="button"
                                  onClick={() => handleRestore(post)}
                                  className="w-full text-left px-3 py-2 text-xs font-medium text-emerald-700 hover:bg-emerald-50 rounded-xl flex items-center gap-2 cursor-pointer"
                                >
                                  <RefreshCw size={13} />
                                  <span>Restaurar Artigo</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteOrTrash(post)}
                                  className="w-full text-left px-3 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 rounded-xl flex items-center gap-2 cursor-pointer"
                                >
                                  <Trash2 size={13} />
                                  <span>Excluir Definitivo</span>
                                </button>
                              </>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleDeleteOrTrash(post)}
                                className="w-full text-left px-3 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 rounded-xl flex items-center gap-2 cursor-pointer"
                              >
                                <Trash2 size={13} />
                                <span>Mover para Lixeira</span>
                              </button>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Full-Screen Editor Modal with Cover Image Upload and Rich Text Editor */}
      {isEditing && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-xs z-50 flex flex-col animate-in fade-in duration-200">
          {/* Header */}
          <div className="bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button 
                type="button"
                onClick={() => setIsEditing(false)} 
                className="p-2 hover:bg-slate-100 rounded-full text-slate-400 transition-all cursor-pointer"
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
                type="button"
                onClick={(e) => handleSave(e, 'draft')} 
                className="px-6 py-2.5 rounded-xl text-slate-600 font-bold text-xs hover:bg-slate-100 transition-all border border-slate-200 cursor-pointer"
              >
                Salvar Rascunho
              </button>
              <button 
                type="button"
                onClick={(e) => handleSave(e, 'published')}
                className="bg-blue-600 hover:bg-blue-700 text-white px-7 py-2.5 rounded-xl font-bold text-xs shadow-md shadow-blue-200 transition-all active:scale-95 cursor-pointer"
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
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3.5 text-lg font-bold text-slate-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-hidden transition-all"
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
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3.5 font-medium text-slate-700 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-hidden transition-all resize-none text-sm"
                        rows={2}
                      />
                    </div>
                  </div>

                  {/* Main Content Editor with Image Upload inside */}
                  <div className="space-y-3">
                    <label className="flex items-center gap-2 text-xs font-black text-slate-500 uppercase tracking-widest px-2">
                      <AlignLeft size={14} className="text-blue-500" /> 
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
                  
                  {/* Cover Image Upload Card */}
                  <div className="bg-white rounded-3xl p-6 shadow-xs border border-slate-200/80 space-y-4">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-black text-slate-600 uppercase tracking-widest flex items-center gap-2">
                        <ImageIcon size={14} className="text-blue-500" /> Imagem de Capa
                      </label>
                      {currentPost?.image && (
                        <button
                          type="button"
                          onClick={() => setShowCoverUrlInput(!showCoverUrlInput)}
                          className="text-[10px] font-bold text-blue-600 hover:underline"
                        >
                          {showCoverUrlInput ? 'Ocultar URL' : 'Editar URL'}
                        </button>
                      )}
                    </div>

                    {/* Hidden Cover file input */}
                    <input 
                      type="file"
                      ref={coverFileInputRef}
                      accept="image/*"
                      onChange={(e) => {
                        if (e.target.files?.[0]) {
                          handleCoverFileUpload(e.target.files[0]);
                        }
                      }}
                      className="hidden"
                    />

                    {/* Image Preview / Drag Area */}
                    <div className="relative group aspect-video rounded-2xl bg-slate-50 border-2 border-dashed border-slate-200 overflow-hidden flex flex-col items-center justify-center p-3 text-center transition-all hover:border-blue-400">
                      {currentPost?.image ? (
                        <>
                          <img 
                            src={currentPost.image} 
                            alt="Capa Preview" 
                            className="w-full h-full object-cover rounded-xl" 
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = 'https://hope.yahchurch.com/wp-content/uploads/2025/09/HOPE-ALFACES.avif';
                            }}
                          />
                          <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                            <button 
                              type="button"
                              onClick={() => coverFileInputRef.current?.click()}
                              className="px-3 py-1.5 bg-white text-slate-800 rounded-xl text-xs font-bold shadow-md hover:bg-slate-100 flex items-center gap-1.5 cursor-pointer"
                            >
                              <Upload size={13} />
                              <span>Trocar Foto</span>
                            </button>
                            <button 
                              type="button"
                              onClick={() => setCurrentPost({...currentPost, image: ''})}
                              className="p-1.5 bg-rose-500 text-white rounded-xl shadow-md hover:bg-rose-600 cursor-pointer"
                              title="Remover capa"
                            >
                              <X size={15} />
                            </button>
                          </div>
                        </>
                      ) : (
                        <div 
                          onClick={() => coverFileInputRef.current?.click()}
                          className="cursor-pointer space-y-2 p-2 w-full"
                        >
                          <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
                            <Upload size={18} />
                          </div>
                          <div>
                            <p className="text-xs font-bold text-slate-700">Fazer Upload da Foto</p>
                            <p className="text-[10px] text-slate-400 mt-0.5">Clique ou arraste um arquivo JPG, PNG ou WebP</p>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Direct Upload button if no image */}
                    {!currentPost?.image && (
                      <button
                        type="button"
                        disabled={isUploadingCover}
                        onClick={() => coverFileInputRef.current?.click()}
                        className="w-full py-2.5 px-3 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl text-xs font-bold flex items-center justify-center gap-2 border border-blue-200 transition-colors cursor-pointer"
                      >
                        <Upload size={14} />
                        <span>{isUploadingCover ? 'Processando...' : 'Selecionar do Computador'}</span>
                      </button>
                    )}

                    {/* Optional URL input */}
                    {(showCoverUrlInput || !currentPost?.image) && (
                      <div className="pt-2 border-t border-slate-100 space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                          Ou colar link de imagem externa
                        </label>
                        <input 
                          type="text" 
                          value={currentPost?.image || ''}
                          onChange={e => setCurrentPost({...currentPost, image: e.target.value})}
                          placeholder="https://..."
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-600 focus:ring-2 focus:ring-blue-500/20 outline-hidden transition-all"
                        />
                      </div>
                    )}
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
                                "px-3 py-2 rounded-xl text-xs font-bold border transition-all text-center cursor-pointer",
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
                                "px-3 py-2 rounded-xl text-xs font-bold border transition-all text-center cursor-pointer",
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
                                  "w-7 h-7 rounded-full border-2 transition-transform hover:scale-110 cursor-pointer",
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

                  {/* Metadata Settings Card */}
                  <div className="bg-white rounded-3xl p-6 shadow-xs border border-slate-200/80 space-y-4">
                    <label className="text-xs font-black text-slate-600 uppercase tracking-widest block">
                      Informações de Publicação
                    </label>

                    <div className="space-y-3">
                      <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                          Categoria
                        </label>
                        <input 
                          type="text"
                          value={currentPost?.category || ''}
                          onChange={e => setCurrentPost({...currentPost, category: e.target.value})}
                          placeholder="Ex: Nutrição, Histórias, Ação Social"
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-700 focus:ring-2 focus:ring-blue-500/20 outline-hidden"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                          Autor
                        </label>
                        <input 
                          type="text"
                          value={currentPost?.author || ''}
                          onChange={e => setCurrentPost({...currentPost, author: e.target.value})}
                          placeholder="Ex: Carolina Simionato, YAH Hope"
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-700 focus:ring-2 focus:ring-blue-500/20 outline-hidden"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                          Data de Publicação
                        </label>
                        <input 
                          type="date"
                          value={currentPost?.published_at || currentPost?.date || ''}
                          onChange={e => setCurrentPost({...currentPost, published_at: e.target.value})}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-700 focus:ring-2 focus:ring-blue-500/20 outline-hidden"
                        />
                      </div>
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
