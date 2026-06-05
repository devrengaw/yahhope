import React, { useState } from 'react';
import { Gift, Plus, Search, Filter, Edit2, Trash2, Check, X, Image as ImageIcon, DollarSign, Heart } from 'lucide-react';
import { cn } from '../../lib/utils';

export function GiftManager() {
  const [gifts, setGifts] = useState<{ id: string, name: string, price: string, impact: string, active: boolean, category: string, img: string }[]>([]);

  return (
    <div className="space-y-8 pb-20">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Gestão de Presentes</h1>
          <p className="text-slate-500 mt-2 font-medium">Gerencie os itens disponíveis para os apoiadores presentearem as crianças.</p>
        </div>
        <button className="bg-slate-900 text-white px-6 py-3 rounded-2xl font-black flex items-center gap-2 hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/20 active:scale-95">
          <Plus size={20} /> Novo Presente
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input 
            type="text" 
            placeholder="Buscar presente..." 
            className="w-full pl-12 pr-4 py-3.5 bg-white border border-slate-200 rounded-[1.5rem] focus:ring-4 focus:ring-slate-900/5 focus:border-slate-900 outline-none transition-all shadow-sm"
          />
        </div>
        <button className="flex items-center gap-2 px-6 py-3.5 bg-white border border-slate-200 rounded-[1.5rem] text-slate-600 font-bold hover:bg-slate-50 transition-all shadow-sm">
          <Filter size={20} /> Filtros
        </button>
      </div>

      {/* Gifts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {gifts.map(gift => (
          <div key={gift.id} className="bg-white rounded-[2.5rem] border border-slate-100 p-6 shadow-sm hover:shadow-xl transition-all group relative overflow-hidden">
            <div className="flex gap-6">
              <div className="w-32 h-32 rounded-[1.5rem] overflow-hidden shrink-0 relative">
                <img src={gift.img} alt={gift.name} className="w-full h-full object-cover" />
                {!gift.active && (
                  <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center">
                    <span className="text-[10px] font-black text-white uppercase tracking-widest">Inativo</span>
                  </div>
                )}
              </div>
              
              <div className="flex-1 space-y-2">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">{gift.category}</span>
                    <h3 className="text-xl font-black text-slate-900 leading-tight">{gift.name}</h3>
                  </div>
                  <div className="flex gap-2">
                    <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-xl transition-all">
                      <Edit2 size={18} />
                    </button>
                    <button className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all">
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-sm font-medium text-slate-500">
                  <div className="flex items-center gap-1.5 bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-lg">
                    <DollarSign size={14} />
                    <span className="font-bold">R$ {gift.price}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-400">
                    <Heart size={14} />
                    <span>{gift.impact}</span>
                  </div>
                </div>

                <div className="pt-4 flex items-center justify-between">
                  <button 
                    onClick={() => setGifts(prev => prev.map(g => g.id === gift.id ? { ...g, active: !g.active } : g))}
                    className={cn(
                      "flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all",
                      gift.active 
                        ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20" 
                        : "bg-slate-100 text-slate-400"
                    )}
                  >
                    {gift.active ? <Check size={14} /> : <X size={14} />}
                    {gift.active ? 'Ativo no Portal' : 'Oculto'}
                  </button>
                  
                  <div className="flex -space-x-2">
                    {[1,2,3].map(i => (
                      <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-slate-100 flex items-center justify-center overflow-hidden">
                        <img src={`https://i.pravatar.cc/100?u=${gift.id}${i}`} className="w-full h-full object-cover opacity-60" />
                      </div>
                    ))}
                    <div className="w-8 h-8 rounded-full border-2 border-white bg-slate-900 flex items-center justify-center text-[10px] font-black text-white">
                      +12
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}

        {/* Add Card Placeholder */}
        <button className="border-2 border-dashed border-slate-200 rounded-[2.5rem] p-12 flex flex-col items-center justify-center text-slate-400 hover:text-slate-600 hover:border-slate-300 transition-all group">
          <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <Plus size={32} />
          </div>
          <p className="font-black text-sm uppercase tracking-widest">Adicionar Categoria</p>
        </button>
      </div>
    </div>
  );
}
