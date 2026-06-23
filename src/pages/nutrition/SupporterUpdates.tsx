import React, { useState } from 'react';
import { MessageSquare, Send, Image, Heart, Search, Filter, Trash2, CheckCircle2, AlertCircle, Clock, Globe } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useImpact } from '../../contexts/ImpactContext';
import { usePatients } from '../../contexts/PatientContext';

type UpdateStatus = 'all' | 'pending' | 'published';

export function NutritionSupporterUpdates() {
  const { feedItems, addFeedItem, deleteFeedItem } = useImpact();
  const { patients } = usePatients();
  const [news, setNews] = useState('');
  const [selectedChild, setSelectedChild] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<UpdateStatus>('all');
  const [itemToDelete, setItemToDelete] = useState<number | null>(null);

  const handleSendUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!news.trim()) return;

    const patient = patients.find(p => p.id === selectedChild);
    const childName = patient ? patient.name : undefined;

    addFeedItem({
      content: news,
      title: childName ? `Atualização: ${childName}` : 'Comunicado Geral',
      author: 'Módulo Nutrição',
      source: 'Módulo Nutrição',
      date: 'Agora',
      type: childName ? 'child' : 'geral',
      child: childName
    });
    setNews('');
    setSelectedChild('');
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };

  const handleDelete = (id: number) => {
    setItemToDelete(id);
  };

  const executeDelete = () => {
    if (itemToDelete !== null) {
      deleteFeedItem(itemToDelete);
      setItemToDelete(null);
    }
  };

  const filteredUpdates = feedItems.filter(u => {
    const matchesSearch = u.content.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         (u.child?.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesTab = activeTab === 'all' || u.status === activeTab;
    return matchesSearch && matchesTab;
  });

  const counts = {
    all: feedItems.length,
    pending: feedItems.filter(u => u.status === 'pending').length,
    published: feedItems.filter(u => u.status === 'published').length,
  };

  return (
    <div className="space-y-8 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            < Globe className="text-emerald-600" size={32} />
            Atualizações para Apoiadores
          </h1>
          <p className="text-slate-500 mt-2 font-medium">Comunique as vitórias da Casa Nutri diretamente para quem financia a esperança.</p>
        </div>
        {showSuccess && (
          <div className="bg-emerald-500 text-white px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-3 animate-in slide-in-from-right-4 duration-300 shadow-lg shadow-emerald-500/20">
            <CheckCircle2 size={20} /> Enviado para Aprovação!
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Creation Form */}
        <div className="lg:col-span-1 space-y-6">
          <form onSubmit={handleSendUpdate} className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-6 sticky top-8">
            <h2 className="text-xl font-black text-slate-900">Nova Atualização</h2>
            
            <div className="space-y-4">
              <div>
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest block mb-2 px-1">Vincular Criança (Opcional)</label>
                <select 
                  value={selectedChild}
                  onChange={(e) => setSelectedChild(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all appearance-none cursor-pointer font-bold text-slate-700"
                >
                  <option value="">Atualização Geral (Todos)</option>
                  {patients.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest block mb-2 px-1">O que aconteceu?</label>
                <textarea 
                  value={news}
                  onChange={(e) => setNews(e.target.value)}
                  rows={5}
                  required
                  placeholder="Ex: Novos suprimentos chegaram em Boane..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all resize-none font-medium text-slate-700"
                />
              </div>

              <div className="flex gap-2">
                <button type="button" className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-600 py-3 rounded-xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all">
                  <Image size={18} /> Foto
                </button>
              </div>

              <button 
                type="submit"
                disabled={!news.trim()}
                className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:bg-slate-200 text-white py-4 rounded-2xl font-black shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2 transition-all active:scale-95"
              >
                <Send size={18} /> Enviar para Aprovação
              </button>
            </div>
          </form>
        </div>

        {/* History / Status */}
        <div className="lg:col-span-2 space-y-6">
          {/* Filters & Search */}
          <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm space-y-6">
            <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
              <div className="bg-slate-100 p-1 rounded-xl flex w-full md:w-auto">
                <button 
                  onClick={() => setActiveTab('all')}
                  className={cn(
                    "flex-1 md:flex-none px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2",
                    activeTab === 'all' ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
                  )}
                >
                  Todos <span className="bg-slate-200 px-1.5 py-0.5 rounded-md">{counts.all}</span>
                </button>
                <button 
                  onClick={() => setActiveTab('pending')}
                  className={cn(
                    "flex-1 md:flex-none px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2",
                    activeTab === 'pending' ? "bg-white text-amber-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
                  )}
                >
                  Pendentes <span className="bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-md">{counts.pending}</span>
                </button>
                <button 
                  onClick={() => setActiveTab('published')}
                  className={cn(
                    "flex-1 md:flex-none px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2",
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
                  className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
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
                          "w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm",
                          update.type === 'child' ? "bg-amber-100 text-amber-600" : "bg-emerald-100 text-emerald-600"
                        )}>
                          {update.type === 'child' ? <Heart size={22} fill="currentColor" /> : <MessageSquare size={22} />}
                        </div>
                        <div>
                          <div className="flex items-center gap-3">
                            <h4 className="font-black text-slate-900 text-base">
                              {update.type === 'child' ? `Atualização: ${update.child}` : 'Comunicado Geral'}
                            </h4>
                            <span className={cn(
                              "text-[8px] font-black uppercase px-2.5 py-1 rounded-full flex items-center gap-1.5",
                              update.status === 'pending' ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"
                            )}>
                              {update.status === 'pending' ? <Clock size={10} /> : <CheckCircle2 size={10} />}
                              {update.status === 'pending' ? 'Em Revisão' : 'Publicado'}
                            </span>
                          </div>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1 flex items-center gap-2">
                            {update.date}
                            <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                            Nutrição Boane
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => handleDelete(update.id)}
                          className="p-2.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                          title="Excluir"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                    <div className="pl-16">
                      <p className="text-slate-600 text-sm leading-relaxed font-medium">
                        {update.content}
                      </p>
                      {update.status === 'published' && (
                        <div className="mt-4 flex items-center gap-4 text-[10px] font-bold text-slate-400">
                          <span className="flex items-center gap-1.5"><Globe size={12} /> Visível para apoiadores</span>
                        </div>
                      )}
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

      {/* Delete Confirmation Modal */}
      {itemToDelete !== null && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex justify-center items-center z-50 p-4">
          <div className="bg-white rounded-[2rem] max-w-sm w-full p-8 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
            <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertCircle size={32} />
            </div>
            <h3 className="text-xl font-black text-slate-900 text-center mb-2">Excluir Atualização?</h3>
            <p className="text-slate-500 text-center text-sm mb-8 font-medium">Esta ação não pode ser desfeita. A atualização será removida permanentemente do feed dos apoiadores.</p>
            <div className="flex gap-3">
              <button 
                onClick={() => setItemToDelete(null)}
                className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 py-3 rounded-xl font-bold transition-all"
              >
                Cancelar
              </button>
              <button 
                onClick={executeDelete}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white py-3 rounded-xl font-bold transition-all shadow-lg shadow-red-600/20"
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
