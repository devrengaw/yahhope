import React, { useState } from 'react';
import { 
  TrendingUp, 
  Check, 
  X, 
  Eye, 
  Filter, 
  Search, 
  MessageSquare, 
  Heart, 
  Briefcase, 
  Newspaper, 
  ShieldAlert, 
  CheckCircle2, 
  Edit3, 
  Save, 
  Trash2, 
  Clock, 
  Globe, 
  Plus, 
  AlertCircle,
  Image as ImageIcon
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { useImpact, ImpactFeedStatus, ImpactFeedType } from '../../contexts/ImpactContext';
import { usePatients } from '../../contexts/PatientContext';
import { useAuth } from '../../contexts/AuthContext';

export function ImpactFeedManager() {
  const { feedItems, updateFeedItem, approveFeedItem, rejectFeedItem, deleteFeedItem, addFeedItem } = useImpact();
  const { patients } = usePatients();
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState<'pending' | 'published' | 'rejected'>('pending');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const [successFeedback, setSuccessFeedback] = useState<string | null>(null);

  // Modal para Admin criar atualização direta
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newChildId, setNewChildId] = useState('');
  const [newStatus, setNewStatus] = useState<ImpactFeedStatus>('published'); // Admin pode publicar direto

  const showFeedback = (msg: string) => {
    setSuccessFeedback(msg);
    setTimeout(() => setSuccessFeedback(null), 3500);
  };

  const startEdit = (id: string, content: string) => {
    setEditingId(id);
    setEditContent(content);
  };

  const saveEdit = async (id: string) => {
    await updateFeedItem(id, { content: editContent });
    setEditingId(null);
    showFeedback('Conteúdo atualizado com sucesso!');
  };

  const handleApprove = async (id: string) => {
    await approveFeedItem(id);
    showFeedback('Atualização APROVADA e publicada no portal dos apoiadores!');
  };

  const handleReject = async (id: string) => {
    await rejectFeedItem(id);
    showFeedback('Atualização reprovada.');
  };

  const handleRevertToPending = async (id: string) => {
    await updateFeedItem(id, { status: 'pending' });
    showFeedback('Atualização retornada para revisão pendente.');
  };

  const executeDelete = async () => {
    if (itemToDelete) {
      await deleteFeedItem(itemToDelete);
      setItemToDelete(null);
      showFeedback('Atualização excluída permanentemente.');
    }
  };

  const handleCreateDirect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContent.trim()) return;

    const patient = patients.find(p => p.id === newChildId);
    const childName = patient ? patient.name : undefined;

    await addFeedItem({
      title: newTitle.trim() || (childName ? `Atualização: ${childName}` : 'Comunicado da Direção'),
      content: newContent.trim(),
      type: childName ? 'child' : 'geral',
      source: 'Administração Geral',
      author: user?.name || 'Administrador',
      child_id: newChildId || undefined,
      child: childName,
      status: newStatus
    });

    setIsCreateModalOpen(false);
    setNewTitle('');
    setNewContent('');
    setNewChildId('');
    showFeedback(newStatus === 'published' ? 'Atualização criada e publicada diretamente!' : 'Atualização criada como pendente para revisão!');
  };

  const counts = {
    pending: feedItems.filter(i => i.status === 'pending').length,
    published: feedItems.filter(i => i.status === 'published').length,
    rejected: feedItems.filter(i => i.status === 'rejected').length,
  };

  const filteredItems = feedItems.filter(i => {
    if (i.status !== activeTab) return false;
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    const childMatch = i.child ? i.child.toLowerCase().includes(term) : false;
    const titleMatch = i.title ? i.title.toLowerCase().includes(term) : false;
    const contentMatch = i.content ? i.content.toLowerCase().includes(term) : false;
    return childMatch || titleMatch || contentMatch;
  });

  return (
    <div className="space-y-6 pb-20">
      {/* Toast Feedback */}
      {successFeedback && (
        <div className="fixed top-6 right-6 z-50 bg-slate-900 text-white px-6 py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-3 shadow-2xl animate-in slide-in-from-top-4 duration-300 border border-slate-700">
          <CheckCircle2 size={18} className="text-emerald-400" />
          {successFeedback}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <TrendingUp className="text-amber-500" size={28} />
            Gestão & Moderação do Feed de Impacto
          </h1>
          <p className="text-slate-500 text-sm font-medium">
            Aprove conteúdos enviados pelos módulos clínicos antes de serem visíveis aos apoiadores e padrinhos.
          </p>
        </div>
        
        <div className="flex items-center gap-3 w-full md:w-auto">
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="bg-slate-900 hover:bg-black text-white px-4 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest flex items-center gap-2 transition-all shadow-md active:scale-95 cursor-pointer shrink-0"
          >
            <Plus size={16} /> Nova Atualização
          </button>

          <div className="bg-slate-100 p-1 rounded-xl flex shrink-0">
            <button 
              onClick={() => setActiveTab('pending')}
              className={cn(
                "px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 cursor-pointer",
                activeTab === 'pending' ? "bg-white text-amber-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
              )}
            >
              Pendentes {counts.pending > 0 && (
                <span className="bg-amber-500 text-white w-4 h-4 rounded-full flex items-center justify-center text-[9px]">
                  {counts.pending}
                </span>
              )}
            </button>
            <button 
              onClick={() => setActiveTab('published')}
              className={cn(
                "px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 cursor-pointer",
                activeTab === 'published' ? "bg-white text-emerald-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
              )}
            >
              Publicados <span className="bg-slate-200 px-1.5 py-0.5 rounded-md text-[9px]">{counts.published}</span>
            </button>
            <button 
              onClick={() => setActiveTab('rejected')}
              className={cn(
                "px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 cursor-pointer",
                activeTab === 'rejected' ? "bg-white text-red-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
              )}
            >
              Rejeitados <span className="bg-slate-200 px-1.5 py-0.5 rounded-md text-[9px]">{counts.rejected}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Regra de Moderação Alerta */}
      {activeTab === 'pending' && counts.pending > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center gap-3">
          <Clock className="text-amber-600 shrink-0" size={20} />
          <div className="text-xs text-amber-900 font-medium">
            Você tem <strong>{counts.pending} {counts.pending === 1 ? 'atualização pendente' : 'atualizações pendentes'}</strong>. 
            Elas estão salvas com segurança no sistema, mas <strong>não aparecem no portal do apoiador</strong> até que você clique em <strong>"Aprovar"</strong>.
          </div>
        </div>
      )}

      {/* Barra de Pesquisa */}
      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center">
        <div className="relative w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input 
            type="text"
            placeholder="Buscar por criança, conteúdo, título ou autor..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all font-medium"
          />
        </div>
      </div>

      {/* Lista de Itens */}
      <div className="grid grid-cols-1 gap-4">
        {filteredItems.map((item) => (
          <div key={item.id} className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden hover:border-slate-200 transition-all group">
            <div className="flex">
              <div className={cn(
                "w-2 shrink-0",
                item.status === 'published' ? "bg-emerald-500" : 
                item.status === 'pending' ? "bg-amber-500" : "bg-red-500"
              )}></div>

              <div className="flex-1 p-6 space-y-4">
                <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={cn(
                        "text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border",
                        item.type === 'child' ? "bg-amber-50 text-amber-700 border-amber-200" : 
                        item.type === 'project' ? "bg-blue-50 text-blue-700 border-blue-200" : 
                        "bg-emerald-50 text-emerald-700 border-emerald-200"
                      )}>
                        {item.type === 'child' ? 'Criança' : item.type === 'project' ? 'Projeto' : 'Geral'}
                      </span>
                      <span className="text-slate-300 text-xs">•</span>
                      <span className="text-[10px] font-bold text-slate-500">{item.source}</span>
                      <span className="text-slate-300 text-xs">•</span>
                      <span className="text-[10px] font-bold text-slate-400">{item.date}</span>
                      
                      {item.type === 'child' && (
                        <>
                          <span className="text-slate-300 text-xs">•</span>
                          <span className="text-[9px] font-bold text-amber-700 bg-amber-100/70 px-2 py-0.5 rounded-full flex items-center gap-1">
                            🔒 Visível aos padrinhos de {item.child || 'criança'}
                          </span>
                        </>
                      )}
                    </div>

                    <h3 className="text-lg font-black text-slate-900 leading-tight">
                      {item.title}
                    </h3>
                    <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">
                      Autor: {item.author}
                    </p>
                  </div>

                  {/* Ações de Moderação */}
                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-start">
                    {editingId === item.id ? (
                      <button 
                        onClick={() => saveEdit(item.id)}
                        className="p-2.5 bg-emerald-500 text-white hover:bg-emerald-600 rounded-xl transition-all shadow-lg shadow-emerald-500/20 cursor-pointer"
                        title="Salvar Edição"
                      >
                        <Save size={18} />
                      </button>
                    ) : (
                      <button 
                        onClick={() => startEdit(item.id, item.content)}
                        className="p-2.5 bg-slate-50 text-slate-400 hover:bg-amber-50 hover:text-amber-600 rounded-xl transition-all cursor-pointer"
                        title="Editar Texto"
                      >
                        <Edit3 size={18} />
                      </button>
                    )}

                    <button 
                      onClick={() => setItemToDelete(item.id)}
                      className="p-2.5 bg-slate-50 text-slate-400 hover:bg-red-50 hover:text-red-600 rounded-xl transition-all cursor-pointer"
                      title="Excluir Item"
                    >
                      <Trash2 size={18} />
                    </button>
                    
                    {activeTab === 'pending' && (
                      <div className="flex gap-2">
                        <button 
                          onClick={() => handleReject(item.id)}
                          className="px-3 py-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-xl transition-all font-bold text-xs flex items-center gap-1.5 cursor-pointer"
                          title="Rejeitar Publicação"
                        >
                          <X size={16} /> Rejeitar
                        </button>
                        <button 
                          onClick={() => handleApprove(item.id)}
                          className="bg-emerald-600 text-white hover:bg-emerald-700 rounded-xl px-4 py-2 font-black text-[10px] uppercase tracking-widest transition-all shadow-lg shadow-emerald-600/20 flex items-center gap-2 cursor-pointer active:scale-95"
                          title="Aprovar e Publicar no Feed dos Apoiadores"
                        >
                          <Check size={16} /> Aprovar & Publicar
                        </button>
                      </div>
                    )}

                    {activeTab === 'published' && (
                      <button 
                        onClick={() => handleRevertToPending(item.id)}
                        className="p-2 bg-amber-50 text-amber-700 hover:bg-amber-100 rounded-xl transition-all text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                        title="Tirar do ar e retornar para Pendentes"
                      >
                        <ShieldAlert size={16} /> Despublicar
                      </button>
                    )}

                    {activeTab === 'rejected' && (
                      <button 
                        onClick={() => handleApprove(item.id)}
                        className="bg-emerald-600 text-white hover:bg-emerald-700 rounded-xl px-3 py-2 font-black text-[10px] uppercase tracking-widest transition-all cursor-pointer flex items-center gap-1.5"
                      >
                        <Check size={14} /> Reaprovar
                      </button>
                    )}
                  </div>
                </div>

                {/* Conteúdo com Suporte a Edição */}
                <div className="relative">
                  {editingId === item.id ? (
                    <div className="space-y-2">
                      <textarea 
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        className="w-full p-4 bg-amber-50 border border-amber-200 rounded-2xl text-sm font-medium text-slate-800 outline-none focus:ring-2 focus:ring-amber-500/20 transition-all min-h-[90px]"
                        autoFocus
                      />
                      <div className="flex justify-end gap-2">
                        <button 
                          onClick={() => setEditingId(null)}
                          className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-xs font-bold transition-all cursor-pointer"
                        >
                          Cancelar
                        </button>
                        <button 
                          onClick={() => saveEdit(item.id)}
                          className="px-4 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-bold shadow-sm transition-all cursor-pointer"
                        >
                          Salvar Alterações
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div 
                      onClick={() => startEdit(item.id, item.content)}
                      className="p-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-medium text-slate-700 leading-relaxed cursor-text hover:bg-slate-100/80 transition-colors"
                      title="Clique para editar"
                    >
                      {item.content}
                    </div>
                  )}
                </div>

                {/* Imagem se houver */}
                {item.img_url && (
                  <div className="max-w-md rounded-2xl overflow-hidden border border-slate-200">
                    <img src={item.img_url} alt="Foto da atualização" className="w-full h-44 object-cover" />
                  </div>
                )}

                {/* Status Footer */}
                <div className="pt-2 flex items-center justify-between text-[11px] font-bold text-slate-400 border-t border-slate-50">
                  <div className="flex items-center gap-2">
                    {item.status === 'published' ? (
                      <span className="flex items-center gap-1 text-emerald-600">
                        <Globe size={13} /> Publicado e visível para apoiadores
                      </span>
                    ) : item.status === 'pending' ? (
                      <span className="flex items-center gap-1 text-amber-600">
                        <Clock size={13} /> Aguardando sua aprovação
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-red-500">
                        <X size={13} /> Rejeitado (invisível para apoiadores)
                      </span>
                    )}
                  </div>
                  <span>ID: {item.id.slice(0, 8)}...</span>
                </div>
              </div>
            </div>
          </div>
        ))}

        {filteredItems.length === 0 && (
          <div className="text-center py-16 bg-white rounded-[2.5rem] border border-dashed border-slate-200 space-y-2">
            <CheckCircle2 size={36} className="text-slate-300 mx-auto mb-2" />
            <h3 className="text-lg font-black text-slate-900">
              {activeTab === 'pending' ? 'Nenhuma atualização pendente!' : 'Nenhum item nesta seção'}
            </h3>
            <p className="text-slate-500 text-sm font-medium">
              {activeTab === 'pending' 
                ? 'Todas as novidades enviadas pela equipe foram revisadas e aprovadas.' 
                : 'Não há itens correspondentes aos filtros.'}
            </p>
          </div>
        )}
      </div>

      {/* Modal Criar Atualização Direta pelo Admin */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] p-8 max-w-lg w-full shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
                  <Plus size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900">Nova Atualização de Impacto</h3>
                  <p className="text-xs text-slate-400 font-medium">Publicar diretamente ou salvar como rascunho</p>
                </div>
              </div>
              <button 
                onClick={() => setIsCreateModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateDirect} className="space-y-4">
              <div>
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest block mb-1">Título</label>
                <input 
                  type="text"
                  placeholder="Ex: Entrega de cestas e pesagem semanal"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none transition-all font-bold text-slate-700"
                />
              </div>

              <div>
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest block mb-1">Vincular Criança (Opcional)</label>
                <select 
                  value={newChildId}
                  onChange={(e) => setNewChildId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none transition-all font-bold text-slate-700"
                >
                  <option value="">Geral (Todos os Apoiadores)</option>
                  {patients.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest block mb-1">Mensagem *</label>
                <textarea 
                  rows={4}
                  required
                  placeholder="Escreva a atualização de impacto..."
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none transition-all font-medium text-slate-700 resize-none"
                />
              </div>

              <div>
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest block mb-1">Status Imediato</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setNewStatus('published')}
                    className={cn(
                      "py-2.5 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer",
                      newStatus === 'published' ? "bg-emerald-50 border-emerald-500 text-emerald-700" : "bg-slate-50 border-slate-200 text-slate-600"
                    )}
                  >
                    Publicar Imediatamente
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewStatus('pending')}
                    className={cn(
                      "py-2.5 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer",
                      newStatus === 'pending' ? "bg-amber-50 border-amber-500 text-amber-700" : "bg-slate-50 border-slate-200 text-slate-600"
                    )}
                  >
                    Salvar como Pendente
                  </button>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button 
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 py-3.5 rounded-xl font-bold transition-all cursor-pointer text-sm"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  disabled={!newContent.trim()}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white py-3.5 rounded-xl font-bold transition-all shadow-lg shadow-emerald-600/20 cursor-pointer text-sm"
                >
                  Salvar Atualização
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
            <p className="text-slate-500 text-center text-sm mb-8 font-medium">
              Esta ação removerá permanentemente a atualização do sistema e do feed de todos os apoiadores.
            </p>
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
