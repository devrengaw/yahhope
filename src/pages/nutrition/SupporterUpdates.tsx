import React, { useState, useRef } from 'react';
import { 
  MessageSquare, 
  Send, 
  Image as ImageIcon, 
  Heart, 
  Search, 
  Filter, 
  Trash2, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  Globe, 
  X, 
  UploadCloud, 
  Calendar, 
  Edit3, 
  Save 
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { useImpact, ImpactFeedItem } from '../../contexts/ImpactContext';
import { usePatients } from '../../contexts/PatientContext';
import { useAuth } from '../../contexts/AuthContext';
import { optimizeImageFile } from '../../lib/imageUpload';

type UpdateFilterStatus = 'all' | 'pending' | 'scheduled' | 'published';

export function NutritionSupporterUpdates() {
  const { feedItems, addFeedItem, updateFeedItem, deleteFeedItem } = useImpact();
  const { patients } = usePatients();
  const { user } = useAuth();

  // Formulário de Criação
  const [title, setTitle] = useState('');
  const [news, setNews] = useState('');
  const [selectedChild, setSelectedChild] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<UpdateFilterStatus>('all');
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Programação na Criação
  const [isScheduled, setIsScheduled] = useState(false);
  const [scheduledDateTime, setScheduledDateTime] = useState('');

  // Imagem na Criação
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isProcessingImage, setIsProcessingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Estado do Modal de Edição
  const [editingItem, setEditingItem] = useState<ImpactFeedItem | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [editChildId, setEditChildId] = useState('');
  const [editImageUrl, setEditImageUrl] = useState<string | null>(null);
  const [editIsScheduled, setEditIsScheduled] = useState(false);
  const [editScheduledDateTime, setEditScheduledDateTime] = useState('');
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const editFileInputRef = useRef<HTMLInputElement | null>(null);

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsProcessingImage(true);
      const optimizedUrl = await optimizeImageFile(file, {
        maxWidth: 1200,
        maxHeight: 1200,
        quality: 0.85
      });
      setImageUrl(optimizedUrl);
    } catch (err) {
      console.error('Erro ao processar imagem:', err);
    } finally {
      setIsProcessingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleEditImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsProcessingImage(true);
      const optimizedUrl = await optimizeImageFile(file, {
        maxWidth: 1200,
        maxHeight: 1200,
        quality: 0.85
      });
      setEditImageUrl(optimizedUrl);
    } catch (err) {
      console.error('Erro ao processar imagem:', err);
    } finally {
      setIsProcessingImage(false);
      if (editFileInputRef.current) editFileInputRef.current.value = '';
    }
  };

  const handleSendUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!news.trim() || isSubmitting) return;

    const patient = patients.find(p => p.id === selectedChild);
    const childName = patient ? patient.name : undefined;

    try {
      setIsSubmitting(true);

      const scheduledIso = isScheduled && scheduledDateTime 
        ? new Date(scheduledDateTime).toISOString() 
        : undefined;

      await addFeedItem({
        title: title.trim() || (childName ? `Atualização: ${childName}` : 'Comunicado Geral da Nutrição'),
        content: news.trim(),
        author: user?.name || 'Módulo Nutrição',
        source: 'Módulo Nutrição',
        type: childName ? 'child' : 'geral',
        child_id: selectedChild || undefined,
        child: childName,
        img_url: imageUrl || undefined,
        scheduled_for: scheduledIso,
        status: scheduledIso ? 'scheduled' : 'pending'
      });

      setTitle('');
      setNews('');
      setSelectedChild('');
      setImageUrl(null);
      setIsScheduled(false);
      setScheduledDateTime('');
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3500);
    } catch (err) {
      console.error('Erro ao salvar atualização de impacto:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Abrir Modal de Edição
  const startEditing = (item: ImpactFeedItem) => {
    setEditingItem(item);
    setEditTitle(item.title);
    setEditContent(item.content);
    const matchedChildId = item.child_id || (item.child ? patients.find(p => p.name.toLowerCase() === item.child?.toLowerCase())?.id : '') || '';
    setEditChildId(matchedChildId);
    setEditImageUrl(item.img_url || null);
    if (item.scheduled_for) {
      setEditIsScheduled(true);
      // Converte ISO para formato datetime-local (YYYY-MM-DDTHH:mm)
      const d = new Date(item.scheduled_for);
      const localIso = new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
      setEditScheduledDateTime(localIso);
    } else {
      setEditIsScheduled(false);
      setEditScheduledDateTime('');
    }
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem || !editContent.trim() || isSavingEdit) return;

    const patient = patients.find(p => p.id === editChildId);
    const childName = patient ? patient.name : undefined;

    try {
      setIsSavingEdit(true);

      const scheduledIso = editIsScheduled && editScheduledDateTime 
        ? new Date(editScheduledDateTime).toISOString() 
        : undefined;

      const updates: Partial<ImpactFeedItem> = {
        title: editTitle.trim() || (childName ? `Atualização: ${childName}` : 'Comunicado da Nutrição'),
        content: editContent.trim(),
        child_id: editChildId || undefined,
        child: childName,
        img_url: editImageUrl || undefined,
        type: childName ? 'child' : 'geral'
      };

      if (scheduledIso) {
        updates.scheduled_for = scheduledIso;
        updates.status = 'scheduled';
      } else {
        updates.scheduled_for = undefined;
        // Se desativou agendamento de um item que estava agendado, volta para pendente
        if (editingItem.status === 'scheduled') {
          updates.status = 'pending';
        }
      }

      await updateFeedItem(editingItem.id, updates);
      setEditingItem(null);
    } catch (err) {
      console.error('Erro ao editar atualização:', err);
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleDelete = (id: string) => {
    setItemToDelete(id);
  };

  const executeDelete = async () => {
    if (itemToDelete !== null) {
      await deleteFeedItem(itemToDelete);
      setItemToDelete(null);
    }
  };

  const filteredUpdates = feedItems.filter(u => {
    const childMatch = u.child ? u.child.toLowerCase().includes(searchTerm.toLowerCase()) : false;
    const titleMatch = u.title ? u.title.toLowerCase().includes(searchTerm.toLowerCase()) : false;
    const contentMatch = u.content ? u.content.toLowerCase().includes(searchTerm.toLowerCase()) : false;
    const matchesSearch = contentMatch || childMatch || titleMatch;

    if (activeTab === 'all') return matchesSearch;
    if (activeTab === 'scheduled') return matchesSearch && u.status === 'scheduled';
    if (activeTab === 'pending') return matchesSearch && u.status === 'pending';
    if (activeTab === 'published') return matchesSearch && u.status === 'published';
    return matchesSearch;
  });

  const counts = {
    all: feedItems.length,
    pending: feedItems.filter(u => u.status === 'pending').length,
    scheduled: feedItems.filter(u => u.status === 'scheduled').length,
    published: feedItems.filter(u => u.status === 'published').length,
  };

  const formatDateTimeDisplay = (isoStr?: string) => {
    if (!isoStr) return '';
    try {
      const d = new Date(isoStr);
      return d.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return isoStr;
    }
  };

  return (
    <div className="space-y-8 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <Globe className="text-emerald-600" size={32} />
            Atualizações para Apoiadores
          </h1>
          <p className="text-slate-500 mt-2 font-medium">
            Comunique as vitórias da Casa Nutri diretamente para quem financia a esperança.
          </p>
        </div>
        {showSuccess && (
          <div className="bg-emerald-500 text-white px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-3 animate-in slide-in-from-right-4 duration-300 shadow-lg shadow-emerald-500/20">
            <CheckCircle2 size={20} /> Atualização salva com sucesso!
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Creation Form */}
        <div className="lg:col-span-1 space-y-6">
          <form onSubmit={handleSendUpdate} className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-6 sticky top-8">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-black text-slate-900">Nova Atualização</h2>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest block mb-2 px-1">Título (Opcional)</label>
                <input 
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ex: Entrega de cestas e pesagem semanal"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all font-medium text-slate-700"
                />
              </div>

              <div>
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest block mb-2 px-1">Público / Criança Vinculada</label>
                <select 
                  value={selectedChild}
                  onChange={(e) => setSelectedChild(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all appearance-none cursor-pointer font-bold text-slate-700"
                >
                  <option value="">Atualização Geral (Todos os Apoiadores)</option>
                  {patients.map(p => (
                    <option key={p.id} value={p.id}>{p.name} (Apenas Padrinhos)</option>
                  ))}
                </select>
                <p className={cn(
                  "text-[11px] font-bold mt-2 px-3 py-2 rounded-xl border flex items-center gap-1.5",
                  selectedChild
                    ? "bg-amber-50 text-amber-800 border-amber-200"
                    : "bg-emerald-50 text-emerald-800 border-emerald-200"
                )}>
                  {selectedChild ? (
                    <>🔒 Visível exclusivamente para os padrinhos desta criança.</>
                  ) : (
                    <>🌐 Atualização Geral: aparecerá para todos os apoiadores.</>
                  )}
                </p>
              </div>

              <div>
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest block mb-2 px-1">O que aconteceu? *</label>
                <textarea 
                  value={news}
                  onChange={(e) => setNews(e.target.value)}
                  rows={4}
                  required
                  placeholder="Ex: Novos suprimentos chegaram em Boane e o acompanhamento nutricional semanal iniciou..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all resize-none font-medium text-slate-700"
                />
              </div>

              {/* Anexo de Foto */}
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleImageSelect} 
                accept="image/*" 
                className="hidden" 
              />

              {imageUrl ? (
                <div className="relative rounded-2xl overflow-hidden border border-slate-200 group">
                  <img src={imageUrl} alt="Anexo" className="w-full h-36 object-cover" />
                  <button
                    type="button"
                    onClick={() => setImageUrl(null)}
                    className="absolute top-2 right-2 bg-red-600/90 hover:bg-red-700 text-white p-1.5 rounded-full shadow-md transition-all cursor-pointer"
                    title="Remover Foto"
                  >
                    <X size={16} />
                  </button>
                  <div className="absolute bottom-2 left-2 bg-slate-900/75 backdrop-blur-xs text-white text-[10px] font-bold px-2 py-0.5 rounded-md">
                    Foto anexada
                  </div>
                </div>
              ) : (
                <button 
                  type="button" 
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isProcessingImage}
                  className="w-full bg-slate-100 hover:bg-slate-200 text-slate-600 py-3 rounded-xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                >
                  <ImageIcon size={18} /> {isProcessingImage ? 'Processando foto...' : 'Adicionar Foto'}
                </button>
              )}

              {/* Seção Programar Atualização */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-3">
                <label className="flex items-center gap-3 cursor-pointer select-none">
                  <input 
                    type="checkbox"
                    checked={isScheduled}
                    onChange={(e) => setIsScheduled(e.target.checked)}
                    className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500 cursor-pointer"
                  />
                  <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <Calendar size={14} className="text-emerald-600" />
                    Programar Publicação
                  </span>
                </label>

                {isScheduled && (
                  <div className="pt-1 animate-in fade-in duration-200">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">
                      Data e Hora da Publicação
                    </label>
                    <input 
                      type="datetime-local"
                      required={isScheduled}
                      value={scheduledDateTime}
                      onChange={(e) => setScheduledDateTime(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                )}
              </div>

              <button 
                type="submit"
                disabled={!news.trim() || isSubmitting}
                className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:bg-slate-200 text-white py-4 rounded-2xl font-black shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer"
              >
                <Send size={18} /> {isSubmitting ? 'Salvando...' : (isScheduled ? 'Programar Atualização' : 'Salvar Atualização')}
              </button>
            </div>
          </form>
        </div>

        {/* History / Status */}
        <div className="lg:col-span-2 space-y-6">
          {/* Filters & Search */}
          <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm space-y-6">
            <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
              <div className="bg-slate-100 p-1 rounded-xl flex w-full md:w-auto overflow-x-auto">
                <button 
                  onClick={() => setActiveTab('all')}
                  className={cn(
                    "px-3 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-1.5 cursor-pointer shrink-0",
                    activeTab === 'all' ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
                  )}
                >
                  Todos <span className="bg-slate-200 px-1.5 py-0.5 rounded-md">{counts.all}</span>
                </button>
                <button 
                  onClick={() => setActiveTab('pending')}
                  className={cn(
                    "px-3 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-1.5 cursor-pointer shrink-0",
                    activeTab === 'pending' ? "bg-white text-amber-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
                  )}
                >
                  Pendentes <span className="bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-md">{counts.pending}</span>
                </button>
                <button 
                  onClick={() => setActiveTab('scheduled')}
                  className={cn(
                    "px-3 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-1.5 cursor-pointer shrink-0",
                    activeTab === 'scheduled' ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
                  )}
                >
                  Programadas <span className="bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded-md">{counts.scheduled}</span>
                </button>
                <button 
                  onClick={() => setActiveTab('published')}
                  className={cn(
                    "px-3 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-1.5 cursor-pointer shrink-0",
                    activeTab === 'published' ? "bg-white text-emerald-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
                  )}
                >
                  Publicados <span className="bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-md">{counts.published}</span>
                </button>
              </div>

              <div className="relative w-full md:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input 
                  type="text"
                  placeholder="Buscar atualizações..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium"
                />
              </div>
            </div>
          </div>

          {/* List */}
          <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
            <div className="divide-y divide-slate-50">
              {filteredUpdates.length > 0 ? (
                filteredUpdates.map(update => (
                  <div key={update.id} className="p-8 hover:bg-slate-50/50 transition-colors group relative">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-4">
                        <div className={cn(
                          "w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm shrink-0",
                          update.status === 'scheduled' ? "bg-indigo-100 text-indigo-600" :
                          update.type === 'child' ? "bg-amber-100 text-amber-600" : "bg-emerald-100 text-emerald-600"
                        )}>
                          {update.status === 'scheduled' ? <Calendar size={22} /> :
                           update.type === 'child' ? <Heart size={22} fill="currentColor" /> : <MessageSquare size={22} />}
                        </div>
                        <div>
                          <div className="flex items-center gap-3 flex-wrap">
                            <h4 className="font-black text-slate-900 text-base">
                              {update.type === 'child' ? `Atualização: ${update.child || update.title.replace('Atualização: ', '')}` : update.title}
                            </h4>
                            <span className={cn(
                              "text-[8px] font-black uppercase px-2.5 py-1 rounded-full flex items-center gap-1.5",
                              update.status === 'scheduled' ? "bg-indigo-100 text-indigo-700 border border-indigo-200" :
                              update.status === 'pending' ? "bg-amber-100 text-amber-700 border border-amber-200" : 
                              update.status === 'published' ? "bg-emerald-100 text-emerald-700 border border-emerald-200" :
                              "bg-red-100 text-red-700 border border-red-200"
                            )}>
                              {update.status === 'scheduled' ? <Calendar size={10} /> :
                               update.status === 'pending' ? <Clock size={10} /> : <CheckCircle2 size={10} />}
                              {update.status === 'scheduled' ? `Programado (${formatDateTimeDisplay(update.scheduled_for)})` :
                               update.status === 'pending' ? 'Em Revisão' : 
                               update.status === 'published' ? 'Publicado' : 'Rejeitado'}
                            </span>
                            {(update.type === 'child' || update.child_id || update.child) ? (
                              <span className="text-[9px] font-bold text-amber-800 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-full">
                                🔒 Exclusivo: Padrinhos de {update.child || 'Criança'}
                              </span>
                            ) : (
                              <span className="text-[9px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                                🌐 Atualização Geral (Todos os Apoiadores)
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1 flex items-center gap-2">
                            {update.date}
                            <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                            {update.source || 'Nutrição Boane'}
                            <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                            Por: {update.author}
                          </p>
                        </div>
                      </div>

                      {/* Botões de Ação: Editar e Excluir */}
                      <div className="flex gap-1.5 opacity-90 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => startEditing(update)}
                          className="p-2.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all cursor-pointer"
                          title="Editar Atualização"
                        >
                          <Edit3 size={18} />
                        </button>
                        <button 
                          onClick={() => handleDelete(update.id)}
                          className="p-2.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all cursor-pointer"
                          title="Excluir"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                    
                    <div className="pl-16 space-y-3">
                      <p className="text-slate-600 text-sm leading-relaxed font-medium">
                        {update.content}
                      </p>

                      {update.img_url && (
                        <div className="mt-2 max-w-sm rounded-2xl overflow-hidden border border-slate-200">
                          <img src={update.img_url} alt="Foto da atualização" className="w-full h-44 object-cover" />
                        </div>
                      )}

                      <div className="flex items-center gap-4 text-[10px] font-bold">
                        {update.status === 'published' ? (
                          (update.type === 'child' || update.child_id || update.child) ? (
                            <span className="flex items-center gap-1.5 text-amber-700">
                              <Heart size={12} fill="currentColor" /> Visível apenas para os padrinhos de {update.child || 'criança'} no portal
                            </span>
                          ) : (
                            <span className="flex items-center gap-1.5 text-emerald-600">
                              <Globe size={12} /> Atualização Geral • Visível para todos os apoiadores no portal
                            </span>
                          )
                        ) : update.status === 'scheduled' ? (
                          <span className="flex items-center gap-1.5 text-indigo-600">
                            <Calendar size={12} /> Publicação programada para: {formatDateTimeDisplay(update.scheduled_for)}
                          </span>
                        ) : (
                          <span className="flex items-center gap-1.5 text-amber-600">
                            <Clock size={12} /> Salvo no sistema • Em revisão
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-20 text-center space-y-4">
                  <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-slate-300">
                    <Search size={32} />
                  </div>
                  <p className="text-slate-400 font-medium">Nenhuma atualização encontrada para os filtros selecionados.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal de Edição Completa */}
      {editingItem && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <Edit3 size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900">Editar Atualização</h3>
                  <p className="text-xs text-slate-400 font-medium">Altere o texto, foto ou reprograme a data</p>
                </div>
              </div>
              <button 
                onClick={() => setEditingItem(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="p-6 sm:p-8 space-y-4 max-h-[80vh] overflow-y-auto">
              <div>
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest block mb-1">Título</label>
                <input 
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all font-medium text-slate-700"
                />
              </div>

              <div>
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest block mb-1">Público / Criança Vinculada</label>
                <select 
                  value={editChildId}
                  onChange={(e) => setEditChildId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all font-bold text-slate-700"
                >
                  <option value="">Atualização Geral (Todos os Apoiadores)</option>
                  {patients.map(p => (
                    <option key={p.id} value={p.id}>{p.name} (Apenas Padrinhos)</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest block mb-1">Conteúdo *</label>
                <textarea 
                  rows={4}
                  required
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all font-medium text-slate-700 resize-none"
                />
              </div>

              {/* Foto na Edição */}
              <input 
                type="file" 
                ref={editFileInputRef} 
                onChange={handleEditImageSelect} 
                accept="image/*" 
                className="hidden" 
              />

              {editImageUrl ? (
                <div className="relative rounded-2xl overflow-hidden border border-slate-200">
                  <img src={editImageUrl} alt="Foto" className="w-full h-36 object-cover" />
                  <button
                    type="button"
                    onClick={() => setEditImageUrl(null)}
                    className="absolute top-2 right-2 bg-red-600 text-white p-1.5 rounded-full shadow-md cursor-pointer"
                  >
                    <X size={16} />
                  </button>
                </div>
              ) : (
                <button 
                  type="button" 
                  onClick={() => editFileInputRef.current?.click()}
                  className="w-full bg-slate-100 hover:bg-slate-200 text-slate-600 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 cursor-pointer"
                >
                  <ImageIcon size={16} /> Alterar/Adicionar Foto
                </button>
              )}

              {/* Programação na Edição */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-3">
                <label className="flex items-center gap-3 cursor-pointer select-none">
                  <input 
                    type="checkbox"
                    checked={editIsScheduled}
                    onChange={(e) => setEditIsScheduled(e.target.checked)}
                    className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500 cursor-pointer"
                  />
                  <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <Calendar size={14} className="text-emerald-600" />
                    Programar Publicação
                  </span>
                </label>

                {editIsScheduled && (
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">
                      Data e Hora da Publicação
                    </label>
                    <input 
                      type="datetime-local"
                      required={editIsScheduled}
                      value={editScheduledDateTime}
                      onChange={(e) => setEditScheduledDateTime(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-700"
                    />
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-2">
                <button 
                  type="button"
                  onClick={() => setEditingItem(null)}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 py-3 rounded-xl font-bold transition-all cursor-pointer text-xs"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  disabled={!editContent.trim() || isSavingEdit}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white py-3 rounded-xl font-bold transition-all shadow-lg shadow-emerald-600/20 cursor-pointer text-xs flex items-center justify-center gap-2"
                >
                  <Save size={16} /> {isSavingEdit ? 'Salvando...' : 'Salvar Alterações'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {itemToDelete !== null && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex justify-center items-center z-50 p-4">
          <div className="bg-white rounded-[2rem] max-w-sm w-full p-8 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
            <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertCircle size={32} />
            </div>
            <h3 className="text-xl font-black text-slate-900 text-center mb-2">Excluir Atualização?</h3>
            <p className="text-slate-500 text-center text-sm mb-8 font-medium">Esta ação não pode ser desfeita. A atualização será removida permanentemente do sistema.</p>
            <div className="flex gap-3">
              <button 
                onClick={() => setItemToDelete(null)}
                className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 py-3 rounded-xl font-bold transition-all cursor-pointer"
              >
                Cancelar
              </button>
              <button 
                onClick={executeDelete}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white py-3 rounded-xl font-bold transition-all shadow-lg shadow-red-600/20 cursor-pointer"
              >
                Sim, Excluir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
