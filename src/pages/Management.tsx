import React, { useState } from 'react';
import { CheckCircle, Activity, Plus, Edit2, Trash2, X, Tags, Shield } from 'lucide-react';
import { mockInventoryCategories, InventoryCategory } from '../lib/mockData';

export function Management() {
  const [activeTab, setActiveTab] = useState<'visits_config' | 'categories'>('visits_config');
  
  // Categories State
  const [categories, setCategories] = useState<InventoryCategory[]>(mockInventoryCategories);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<InventoryCategory | null>(null);
  const [catName, setCatName] = useState('');
  const [catDesc, setCatDesc] = useState('');

  // Visits Config State
  const [visitItems, setVisitItems] = useState([
    { id: '1', label: 'Vitamina em dia', required: true },
    { id: '2', label: 'Segue recomendações médicas', required: true },
    { id: '3', label: 'Limpeza da casa adequada', required: false },
    { id: '4', label: 'Armazenamento seguro de alimentos', required: false },
  ]);
  const [newItemLabel, setNewItemLabel] = useState('');

  const addVisitItem = () => {
    if (!newItemLabel.trim()) return;
    setVisitItems([...visitItems, { id: Date.now().toString(), label: newItemLabel, required: false }]);
    setNewItemLabel('');
  };

  const removeVisitItem = (id: string) => {
    setVisitItems(visitItems.filter(item => item.id !== id));
  };

  const openCategoryModal = (category?: InventoryCategory) => {
    if (category) {
      setEditingCategory(category);
      setCatName(category.name);
      setCatDesc(category.description || '');
    } else {
      setEditingCategory(null);
      setCatName(''); setCatDesc('');
    }
    setIsCategoryModalOpen(true);
  };

  const handleSaveCategory = (e: React.FormEvent) => {
    e.preventDefault();
    const newCat: InventoryCategory = {
      id: editingCategory ? editingCategory.id : Date.now().toString(),
      name: catName,
      description: catDesc
    };

    if (editingCategory) {
      setCategories(categories.map(c => c.id === editingCategory.id ? newCat : c));
    } else {
      setCategories([...categories, newCat]);
    }
    setIsCategoryModalOpen(false);
  };

  const handleDeleteCategory = (id: string) => {
    if (confirm('Tem certeza que deseja excluir esta categoria?')) {
      setCategories(categories.filter(c => c.id !== id));
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <Activity className="text-emerald-600" size={28} />
          Gestão e Configurações
        </h1>
        <p className="text-slate-500 mt-1">Configurações específicas do módulo de Nutrição.</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 border-b border-slate-200">
        <button 
          onClick={() => setActiveTab('visits_config')}
          className={`pb-3 px-2 font-medium text-sm transition-colors relative ${activeTab === 'visits_config' ? 'text-emerald-600' : 'text-slate-500 hover:text-slate-700'}`}
        >
          Configuração de Visitas
          {activeTab === 'visits_config' && <span className="absolute bottom-0 left-0 w-full h-0.5 bg-emerald-600 rounded-t-full"></span>}
        </button>
        <button 
          onClick={() => setActiveTab('categories')}
          className={`pb-3 px-2 font-medium text-sm transition-colors relative ${activeTab === 'categories' ? 'text-emerald-600' : 'text-slate-500 hover:text-slate-700'}`}
        >
          Categorias de Estoque
          {activeTab === 'categories' && <span className="absolute bottom-0 left-0 w-full h-0.5 bg-emerald-600 rounded-t-full"></span>}
        </button>
      </div>

      {activeTab === 'visits_config' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
            <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
              <CheckCircle className="text-emerald-600" size={20} />
              Checklist de Visita Domiciliar
            </h2>
            <p className="text-sm text-slate-500 mb-6">Defina os itens que os ativistas e ACS devem verificar durante as visitas às famílias.</p>
            
            <div className="space-y-4">
              {visitItems.map(item => (
                <div key={item.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100 group transition-all hover:bg-white hover:shadow-md">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-white border border-slate-100 flex items-center justify-center text-slate-400 group-hover:text-emerald-600 group-hover:border-emerald-100 transition-colors">
                      <CheckCircle size={16} />
                    </div>
                    <div>
                      <span className="font-medium text-slate-900">{item.label}</span>
                      {item.required && <span className="ml-2 text-[10px] bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded uppercase tracking-wider font-bold">Obrigatório</span>}
                    </div>
                  </div>
                  {!item.required && (
                    <button 
                      onClick={() => removeVisitItem(item.id)}
                      className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 size={18} />
                    </button>
                  )}
                </div>
              ))}

              <div className="pt-4 flex gap-3">
                <input 
                  type="text" 
                  value={newItemLabel}
                  onChange={e => setNewItemLabel(e.target.value)}
                  placeholder="Novo item do checklist..."
                  className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                />
                <button 
                  onClick={addVisitItem}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2.5 rounded-xl font-medium flex items-center gap-2 transition-colors shadow-sm"
                >
                  <Plus size={20} />
                  Adicionar
                </button>
              </div>
            </div>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 flex gap-4">
            <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-xl flex items-center justify-center shrink-0">
              <Shield size={24} />
            </div>
            <div>
              <h3 className="font-bold text-amber-900">Itens Obrigatórios</h3>
              <p className="text-amber-800 text-sm mt-1">
                Os itens marcados como obrigatórios não podem ser removidos e estarão sempre presentes em todas as fichas de visita. 
                Estes são fundamentais para o acompanhamento clínico do projeto.
              </p>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'categories' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <Tags className="text-emerald-600" size={20} />
              Categorias de Estoque
            </h2>
            <button 
              onClick={() => openCategoryModal()}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl font-medium flex items-center gap-2 transition-colors shadow-sm text-sm"
            >
              <Plus size={18} />
              Nova Categoria
            </button>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/50 border-b border-slate-100">
                    <th className="p-4 font-medium text-slate-500 text-sm">Nome da Categoria</th>
                    <th className="p-4 font-medium text-slate-500 text-sm">Descrição</th>
                    <th className="p-4 font-medium text-slate-500 text-sm text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {categories.map((cat) => (
                    <tr key={cat.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-4 font-medium text-slate-900">{cat.name}</td>
                      <td className="p-4 text-slate-600">{cat.description || '--'}</td>
                      <td className="p-4 flex justify-end gap-2">
                        <button onClick={() => openCategoryModal(cat)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                          <Edit2 size={18} />
                        </button>
                        <button onClick={() => handleDeleteCategory(cat.id)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                          <Trash2 size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {categories.length === 0 && (
                    <tr>
                      <td colSpan={3} className="p-8 text-center text-slate-500">Nenhuma categoria cadastrada.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Category Modal */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <Tags size={24} className="text-emerald-600" />
                {editingCategory ? 'Editar Categoria' : 'Nova Categoria'}
              </h2>
              <button onClick={() => setIsCategoryModalOpen(false)} className="p-2 text-slate-400 hover:bg-slate-200 rounded-xl transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto">
              <form id="category-form" onSubmit={handleSaveCategory} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-700">Nome da Categoria *</label>
                  <input required type="text" value={catName} onChange={e => setCatName(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none" />
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-700">Descrição</label>
                  <textarea rows={3} value={catDesc} onChange={e => setCatDesc(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"></textarea>
                </div>
              </form>
            </div>

            <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
              <button onClick={() => setIsCategoryModalOpen(false)} className="px-6 py-2.5 rounded-xl font-medium text-slate-600 hover:bg-slate-200 transition-colors">
                Cancelar
              </button>
              <button type="submit" form="category-form" className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2.5 rounded-xl font-medium transition-colors shadow-sm">
                Salvar Categoria
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
