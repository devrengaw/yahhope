import React, { useState, useEffect } from 'react';
import { X, Tag, Palette } from 'lucide-react';
import { TransactionCategory, TransactionType } from '../../../lib/mockData';

interface CategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (category: Omit<TransactionCategory, 'id'> & { id?: string }) => void;
  category?: TransactionCategory | null;
}

const COLORS = [
  'bg-emerald-500', 'bg-emerald-600', 'bg-teal-500', 
  'bg-blue-500', 'bg-blue-600', 'bg-indigo-500', 
  'bg-purple-500', 'bg-rose-500', 'bg-rose-600', 
  'bg-amber-500', 'bg-orange-500', 'bg-slate-500'
];

export function CategoryModal({ isOpen, onClose, onSave, category }: CategoryModalProps) {
  const [name, setName] = useState('');
  const [type, setType] = useState<TransactionType>('expense');
  const [color, setColor] = useState(COLORS[0]);

  useEffect(() => {
    if (category) {
      setName(category.name);
      setType(category.type);
      setColor(category.color);
    } else {
      setName('');
      setType('expense');
      setColor(COLORS[0]);
    }
  }, [category, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;

    onSave({
      id: category?.id,
      name,
      type,
      color,
    });
    
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-[2rem] w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-8 border-b border-slate-100">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">
              {category ? 'Editar Categoria' : 'Nova Categoria'}
            </h2>
            <p className="text-slate-500 text-sm mt-1">
              Organize suas transações com categorias personalizadas.
            </p>
          </div>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors p-2 hover:bg-slate-50 rounded-full"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">
              <Tag size={16} className="text-slate-400" />
              Nome da Categoria
            </label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Ex: Aluguel, Doações, etc"
              className="w-full border-2 border-slate-100 rounded-2xl px-5 py-3.5 focus:outline-none focus:ring-4 focus:ring-slate-500/10 focus:border-slate-300 transition-all font-medium"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-3">Tipo de Transação</label>
            <div className="flex bg-slate-100 p-1.5 rounded-2xl">
              <button
                type="button"
                onClick={() => setType('expense')}
                className={`flex-1 py-3 font-bold text-sm rounded-xl transition-all ${
                  type === 'expense' ? 'bg-white text-rose-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                Saída (Despesa)
              </button>
              <button
                type="button"
                onClick={() => setType('income')}
                className={`flex-1 py-3 font-bold text-sm rounded-xl transition-all ${
                  type === 'income' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                Entrada (Receita)
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
              <Palette size={16} className="text-slate-400" />
              Selecione uma Cor
            </label>
            <div className="grid grid-cols-6 gap-3">
              {COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`w-full aspect-square rounded-xl transition-all transform active:scale-90 flex items-center justify-center ${c} ${
                    color === c ? 'ring-4 ring-slate-200 scale-110 shadow-lg' : 'opacity-80 hover:opacity-100 hover:scale-105'
                  }`}
                >
                  {color === c && <div className="w-2 h-2 bg-white rounded-full"></div>}
                </button>
              ))}
            </div>
          </div>

          <div className="pt-4 flex gap-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-4 border-2 border-slate-100 text-slate-400 font-bold rounded-2xl hover:bg-slate-50 transition-all active:scale-95"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 px-6 py-4 bg-slate-900 text-white font-bold rounded-2xl hover:bg-slate-800 transition-all shadow-lg shadow-slate-200 active:scale-95"
            >
              {category ? 'Salvar Alterações' : 'Criar Categoria'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
