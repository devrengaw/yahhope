import React, { useState } from 'react';
import { UserCategory, mockUserCategories } from '../../lib/mockData';
import { Plus, Trash2, Edit3, Save, X, Tag } from 'lucide-react';

export function UserCategorySettings() {
  const [categories, setCategories] = useState<UserCategory[]>(mockUserCategories);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // New/Edit State
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState('bg-blue-500');

  const colors = [
    { name: 'Azul', value: 'bg-blue-500' },
    { name: 'Verde', value: 'bg-emerald-500' },
    { name: 'Roxo', value: 'bg-purple-500' },
    { name: 'Amarelo', value: 'bg-amber-500' },
    { name: 'Vermelho', value: 'bg-rose-500' },
    { name: 'Índigo', value: 'bg-indigo-500' },
    { name: 'Grafite', value: 'bg-slate-500' },
  ];

  const handleAdd = () => {
    if (!name) return;
    const newCategory: UserCategory = {
      id: Math.random().toString(36).substring(2, 9),
      name,
      description,
      color,
    };
    setCategories([...categories, newCategory]);
    resetForm();
  };

  const handleEdit = (cat: UserCategory) => {
    setEditingId(cat.id);
    setName(cat.name);
    setDescription(cat.description || '');
    setColor(cat.color);
    setIsAdding(true);
  };

  const handleSave = () => {
    if (!editingId || !name) return;
    setCategories(categories.map(c => 
      c.id === editingId ? { ...c, name, description, color } : c
    ));
    resetForm();
  };

  const handleDelete = (id: string) => {
    setCategories(categories.filter(c => c.id !== id));
  };

  const resetForm = () => {
    setName('');
    setDescription('');
    setColor('bg-blue-500');
    setIsAdding(false);
    setEditingId(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Tag size={20} className="text-blue-600" />
            Categorias de Usuários
          </h2>
          <p className="text-slate-500 text-sm">Gerencie as categorias clicáveis para agrupar sua equipe.</p>
        </div>
        {!isAdding && (
          <button 
            onClick={() => setIsAdding(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-all shadow-sm"
          >
            <Plus size={18} />
            Nova Categoria
          </button>
        )}
      </div>

      {isAdding && (
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 animate-in fade-in slide-in-from-top-4 duration-200">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nome da Categoria</label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Ex: Consultores, Financeiro..."
                  className="w-full border border-slate-200 rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Descrição (Opcional)</label>
                <textarea
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Breve descrição do grupo..."
                  rows={2}
                  className="w-full border border-slate-200 rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all resize-none"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-3">Cor de Identificação</label>
              <div className="flex flex-wrap gap-3">
                {colors.map(c => (
                  <button
                    key={c.value}
                    type="button"
                    onClick={() => setColor(c.value)}
                    className={`w-10 h-10 rounded-full ${c.value} flex items-center justify-center transition-all ${color === c.value ? 'ring-4 ring-slate-200 scale-110 shadow-lg' : 'hover:scale-105'}`}
                    title={c.name}
                  >
                    {color === c.value && <div className="w-2 h-2 bg-white rounded-full" />}
                  </button>
                ))}
              </div>
              <div className="mt-6 flex gap-3">
                <button
                  onClick={editingId ? handleSave : handleAdd}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-sm"
                >
                  <Save size={18} />
                  {editingId ? 'Salvar Alterações' : 'Criar Categoria'}
                </button>
                <button
                  onClick={resetForm}
                  className="px-4 py-2.5 border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-white transition-all"
                >
                  <X size={18} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {categories.map(cat => (
          <div key={cat.id} className="bg-white border border-slate-200 rounded-2xl p-5 hover:border-blue-200 transition-all group overflow-hidden relative shadow-sm">
            <div className={`absolute top-0 right-0 w-1.5 h-full ${cat.color}`} />
            <div className="flex items-start justify-between mb-3">
              <div className={`w-10 h-10 rounded-xl ${cat.color} flex items-center justify-center text-white shadow-sm`}>
                <Tag size={20} />
              </div>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                <button onClick={() => handleEdit(cat)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg">
                  <Edit3 size={16} />
                </button>
                <button onClick={() => handleDelete(cat.id)} className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg">
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
            <h3 className="font-bold text-slate-900 text-lg">{cat.name}</h3>
            <p className="text-sm text-slate-500 mt-1 line-clamp-2 leading-relaxed">
              {cat.description || 'Sem descrição definida.'}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
