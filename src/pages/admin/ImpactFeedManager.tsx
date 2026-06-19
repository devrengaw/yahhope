import React, { useState } from 'react';
import { TrendingUp, Check, X, Eye, Filter, Search, MessageSquare, Heart, Briefcase, Newspaper, ShieldAlert, CheckCircle2, Edit3, Save } from 'lucide-react';
import { cn } from '../../lib/utils';

import { useImpact, ImpactFeedStatus } from '../../contexts/ImpactContext';

export function ImpactFeedManager() {
  const { feedItems, updateFeedItem } = useImpact();
  const [activeTab, setActiveTab] = useState<'pending' | 'published'>('pending');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');

  const startEdit = (id: string, content: string) => {
    setEditingId(id);
    setEditContent(content);
  };

  const saveEdit = (id: string) => {
    updateFeedItem(id, { content: editContent });
    setEditingId(null);
  };

  const handleStatusChange = (id: string, newStatus: ImpactFeedStatus) => {
    updateFeedItem(id, { status: newStatus });
  };

  const pendingCount = feedItems.filter(i => i.status === 'pending').length;

  return (
    <div className="space-y-6 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Gestão do Feed de Impacto</h1>
          <p className="text-slate-500 text-sm font-medium">Moderação de conteúdos enviados pelos módulos.</p>
        </div>
        
        <div className="bg-slate-100 p-1 rounded-xl flex shrink-0">
          <button 
            onClick={() => setActiveTab('pending')}
            className={cn(
              "px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2",
              activeTab === 'pending' ? "bg-white text-amber-600 shadow-sm" : "text-slate-500"
            )}
          >
            Pendentes {pendingCount > 0 && <span className="bg-amber-500 text-white w-4 h-4 rounded-full flex items-center justify-center text-[9px]">{pendingCount}</span>}
          </button>
          <button 
            onClick={() => setActiveTab('published')}
            className={cn(
              "px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all",
              activeTab === 'published' ? "bg-white text-emerald-600 shadow-sm" : "text-slate-500"
            )}
          >
            Publicados
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {feedItems.filter(i => i.status === activeTab).map((item) => (
          <div key={item.id} className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden hover:border-slate-200 transition-all group">
            <div className="flex">
              <div className={cn(
                "w-1.5 shrink-0",
                item.type === 'child' ? "bg-amber-500" : item.type === 'project' ? "bg-blue-500" : "bg-emerald-500"
              )}></div>

              <div className="flex-1 p-5">
                <div className="flex justify-between items-start gap-4 mb-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className={cn(
                        "text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded",
                        item.type === 'child' ? "bg-amber-50 text-amber-600" : item.type === 'project' ? "bg-blue-50 text-blue-600" : "bg-emerald-50 text-emerald-600"
                      )}>
                        {item.source}
                      </span>
                      <span className="text-slate-300 text-xs">•</span>
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">{item.date}</span>
                    </div>
                    <h3 className="text-base font-black text-slate-900 leading-tight">{item.title}</h3>
                    <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">Autor: {item.author}</p>
                  </div>

                  <div className="flex gap-1.5 shrink-0">
                    {editingId === item.id ? (
                      <button 
                        onClick={() => saveEdit(item.id)}
                        className="p-2 bg-emerald-500 text-white hover:bg-emerald-600 rounded-xl transition-all shadow-lg shadow-emerald-500/20"
                      >
                        <Save size={18} />
                      </button>
                    ) : (
                      <button 
                        onClick={() => startEdit(item.id, item.content)}
                        className="p-2 bg-slate-50 text-slate-400 hover:bg-amber-50 hover:text-amber-600 rounded-xl transition-all"
                      >
                        <Edit3 size={18} />
                      </button>
                    )}
                    
                    {activeTab === 'pending' ? (
                      <div className="flex gap-1.5">
                        <button 
                          onClick={() => handleStatusChange(item.id, 'rejected')}
                          className="p-2 bg-red-50 text-red-500 hover:bg-red-100 rounded-xl transition-all"
                        >
                          <X size={18} />
                        </button>
                        <button 
                          onClick={() => handleStatusChange(item.id, 'published')}
                          className="bg-emerald-500 text-white hover:bg-emerald-600 rounded-xl px-4 py-2 font-black text-[10px] uppercase tracking-widest transition-all shadow-lg shadow-emerald-500/20 flex items-center gap-2"
                        >
                          <Check size={16} /> Aprovar
                        </button>
                      </div>
                    ) : (
                      <button 
                        onClick={() => handleStatusChange(item.id, 'pending')}
                        className="p-2 bg-slate-100 text-slate-500 hover:bg-slate-200 rounded-xl transition-all"
                        title="Remover do Feed"
                      >
                        <ShieldAlert size={18} />
                      </button>
                    )}
                  </div>
                </div>

                <div className="relative group/edit">
                  {editingId === item.id ? (
                    <textarea 
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      className="w-full p-4 bg-amber-50 border border-amber-100 rounded-2xl text-sm font-medium text-slate-700 outline-none focus:ring-2 focus:ring-amber-500/20 transition-all min-h-[80px]"
                      autoFocus
                    />
                  ) : (
                    <div 
                      onClick={() => startEdit(item.id, item.content)}
                      className="p-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-medium text-slate-600 leading-relaxed cursor-text hover:bg-slate-100 transition-colors"
                    >
                      {item.content}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}

        {feedItems.filter(i => i.status === activeTab).length === 0 && (
          <div className="text-center py-16 bg-white rounded-[2.5rem] border border-dashed border-slate-200">
            <CheckCircle2 size={32} className="text-slate-200 mx-auto mb-3" />
            <h3 className="text-lg font-black text-slate-900">Feed atualizado!</h3>
            <p className="text-slate-500 text-sm font-medium">Não há novos itens para moderação.</p>
          </div>
        )}
      </div>
    </div>
  );
}
