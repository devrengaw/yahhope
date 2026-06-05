import React, { useState } from 'react';
import { 
  ShoppingBag, 
  Package, 
  ShoppingCart, 
  Settings, 
  Plus,
  TrendingUp,
  DollarSign,
  Tag,
  Search,
  Filter,
  Eye,
  EyeOff,
  Edit2,
  Trash2,
  X,
  Image as ImageIcon
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { useStore } from '../../contexts/StoreContext';

type TabType = 'dashboard' | 'products' | 'orders' | 'settings';

export interface StoreProduct {
  id: string;
  name: string;
  description: string;
  cost_price: number;
  sale_price: number;
  stock_quantity: number;
  image_url: string;
  category: string;
  status: 'active' | 'inactive';
}

export function AdminStoreManager() {
  const { products, addProduct, updateProduct, deleteProduct } = useStore();
  
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [isStoreClosed, setIsStoreClosed] = useState(() => localStorage.getItem('yah_store_closed') === 'true');
  
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<StoreProduct | null>(null);

  const handleToggleStore = () => {
    const newState = !isStoreClosed;
    setIsStoreClosed(newState);
    localStorage.setItem('yah_store_closed', String(newState));
    window.dispatchEvent(new Event('storage'));
  };

  const handleSaveProduct = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const newProduct: StoreProduct = {
      id: editingProduct ? editingProduct.id : Math.random().toString(36).substring(2, 9),
      name: formData.get('name') as string,
      description: formData.get('description') as string,
      cost_price: parseFloat(formData.get('cost_price') as string) || 0,
      sale_price: parseFloat(formData.get('sale_price') as string) || 0,
      stock_quantity: parseInt(formData.get('stock_quantity') as string) || 0,
      image_url: formData.get('image_url') as string,
      category: formData.get('category') as string,
      status: formData.get('status') as 'active' | 'inactive'
    };

    if (editingProduct) {
      updateProduct(newProduct);
    } else {
      addProduct(newProduct);
    }
    
    setIsProductModalOpen(false);
    setEditingProduct(null);
  };

  const handleDeleteProduct = (id: string) => {
    if (confirm('Tem certeza que deseja remover este produto? Esta ação não pode ser desfeita.')) {
      deleteProduct(id);
    }
  };

  return (
    <div className="animate-in fade-in duration-700 pb-20">
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tighter flex items-center gap-3">
              <div className="p-2 bg-slate-900 rounded-xl">
                <ShoppingBag className="text-white" size={24} />
              </div>
              Marketplace Solidário
            </h1>
            <p className="text-slate-500 mt-2 font-medium">Gestão completa do catálogo, pedidos e configurações da loja.</p>
          </div>
          
          <div className="flex items-center gap-3 w-full sm:w-auto">
            {activeTab === 'products' && (
              <button 
                onClick={() => {
                  setEditingProduct(null);
                  setIsProductModalOpen(true);
                }}
                className="bg-slate-900 hover:bg-slate-800 text-white px-6 py-3.5 rounded-[1.25rem] font-bold flex items-center justify-center gap-2 transition-all shadow-xl shadow-slate-200"
              >
                <Plus size={20} /> Novo Produto
              </button>
            )}
            <div className={cn(
              "px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-2",
              isStoreClosed ? "bg-rose-100 text-rose-600" : "bg-emerald-100 text-emerald-600"
            )}>
              {isStoreClosed ? <EyeOff size={16} /> : <Eye size={16} />}
              {isStoreClosed ? 'Loja Oculta' : 'Loja Pública'}
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          <TabButton active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} icon={TrendingUp} label="Dashboard" />
          <TabButton active={activeTab === 'products'} onClick={() => setActiveTab('products')} icon={Package} label="Catálogo de Produtos" />
          <TabButton active={activeTab === 'orders'} onClick={() => setActiveTab('orders')} icon={ShoppingCart} label="Pedidos" />
          <TabButton active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} icon={Settings} label="Configurações" />
        </div>

        {/* Main Content Area */}
        <div className="flex-1 min-h-[600px]">
          
          {/* DASHBOARD TAB */}
          {activeTab === 'dashboard' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-5">
                  <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center shrink-0">
                    <DollarSign size={32} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Faturamento Mês</p>
                    <h3 className="text-3xl font-black text-slate-900 mt-1">R$ 0,00</h3>
                  </div>
                </div>
                <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-5">
                  <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center shrink-0">
                    <ShoppingCart size={32} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Pedidos Mês</p>
                    <h3 className="text-3xl font-black text-slate-900 mt-1">0</h3>
                  </div>
                </div>
                <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-5">
                  <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center shrink-0">
                    <Package size={32} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Produtos Ativos</p>
                    <h3 className="text-3xl font-black text-slate-900 mt-1">0</h3>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-[2.5rem] border border-slate-100 p-10 shadow-sm text-center">
                <div className="w-20 h-20 bg-slate-50 text-slate-300 rounded-full flex items-center justify-center mx-auto mb-4">
                  <TrendingUp size={40} />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">Sem dados suficientes</h3>
                <p className="text-slate-500">Cadastre produtos e comece a vender para visualizar gráficos financeiros aqui.</p>
              </div>
            </div>
          )}

          {/* PRODUCTS TAB */}
          {activeTab === 'products' && (
            <div className="bg-white rounded-[2.5rem] border border-slate-100 p-8 shadow-sm animate-in fade-in slide-in-from-bottom-4">
              <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-8">
                <div className="relative w-full sm:w-96">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                  <input 
                    type="text" 
                    placeholder="Buscar produtos..." 
                    className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
                  />
                </div>
                <button className="flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-900 px-4 py-3 bg-slate-50 rounded-xl transition-colors">
                  <Filter size={18} /> Filtrar
                </button>
              </div>

              {products.length === 0 ? (
                <div className="text-center py-20 border-2 border-dashed border-slate-100 rounded-[2rem]">
                  <Package className="mx-auto text-slate-300 mb-4" size={48} />
                  <h3 className="text-xl font-bold text-slate-900 mb-2">Nenhum produto cadastrado</h3>
                  <p className="text-slate-500 mb-6 max-w-sm mx-auto">Adicione seu primeiro produto para começar a vender no marketplace solidário.</p>
                  <button 
                    onClick={() => {
                      setEditingProduct(null);
                      setIsProductModalOpen(true);
                    }}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-bold inline-flex items-center gap-2 transition-colors"
                  >
                    <Plus size={20} /> Cadastrar Produto
                  </button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-slate-100">
                        <th className="pb-4 font-black text-xs text-slate-400 uppercase tracking-widest pl-4">Produto</th>
                        <th className="pb-4 font-black text-xs text-slate-400 uppercase tracking-widest">Categoria</th>
                        <th className="pb-4 font-black text-xs text-slate-400 uppercase tracking-widest">Custo / Venda</th>
                        <th className="pb-4 font-black text-xs text-slate-400 uppercase tracking-widest">Estoque</th>
                        <th className="pb-4 font-black text-xs text-slate-400 uppercase tracking-widest">Status</th>
                        <th className="pb-4 font-black text-xs text-slate-400 uppercase tracking-widest text-right pr-4">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {products.map(product => (
                        <tr key={product.id} className="hover:bg-slate-50/50 transition-colors group">
                          <td className="py-4 pl-4">
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center shrink-0">
                                {product.image_url ? (
                                  <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                                ) : (
                                  <ImageIcon className="text-slate-400" size={20} />
                                )}
                              </div>
                              <div>
                                <p className="font-bold text-slate-900">{product.name}</p>
                                <p className="text-xs text-slate-500 truncate w-40">{product.description || 'Sem descrição'}</p>
                              </div>
                            </div>
                          </td>
                          <td className="py-4">
                            <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-lg text-xs font-bold uppercase tracking-wider">
                              {product.category || 'Sem Categoria'}
                            </span>
                          </td>
                          <td className="py-4">
                            <p className="text-xs font-bold text-slate-500 line-through">R$ {product.cost_price.toFixed(2)}</p>
                            <p className="font-bold text-emerald-600">R$ {product.sale_price.toFixed(2)}</p>
                          </td>
                          <td className="py-4">
                            <span className={cn(
                              "font-bold",
                              product.stock_quantity === 0 ? "text-rose-500" : 
                              product.stock_quantity < 10 ? "text-amber-500" : "text-slate-900"
                            )}>
                              {product.stock_quantity} un
                            </span>
                          </td>
                          <td className="py-4">
                            <div className={cn(
                              "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold uppercase tracking-wider",
                              product.status === 'active' ? "bg-emerald-50 text-emerald-600 border border-emerald-100" : "bg-slate-100 text-slate-500"
                            )}>
                              <div className={cn("w-1.5 h-1.5 rounded-full", product.status === 'active' ? "bg-emerald-500" : "bg-slate-400")} />
                              {product.status === 'active' ? 'Ativo' : 'Inativo'}
                            </div>
                          </td>
                          <td className="py-4 pr-4 text-right">
                            <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button 
                                onClick={() => {
                                  setEditingProduct(product);
                                  setIsProductModalOpen(true);
                                }}
                                className="p-2 hover:bg-white bg-slate-100 rounded-xl text-slate-500 transition-colors shadow-sm"
                              >
                                <Edit2 size={16} />
                              </button>
                              <button 
                                onClick={() => handleDeleteProduct(product.id)}
                                className="p-2 hover:bg-rose-50 hover:text-rose-600 bg-slate-100 rounded-xl text-slate-500 transition-colors shadow-sm"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* ORDERS TAB */}
          {activeTab === 'orders' && (
            <div className="bg-white rounded-[2.5rem] border border-slate-100 p-8 shadow-sm animate-in fade-in slide-in-from-bottom-4">
              <div className="text-center py-20 border-2 border-dashed border-slate-100 rounded-[2rem]">
                <ShoppingCart className="mx-auto text-slate-300 mb-4" size={48} />
                <h3 className="text-xl font-bold text-slate-900 mb-2">Caixa Vazia</h3>
                <p className="text-slate-500 max-w-sm mx-auto">Nenhum pedido foi realizado ainda. Compartilhe sua loja com os apoiadores!</p>
              </div>
            </div>
          )}

          {/* SETTINGS TAB */}
          {activeTab === 'settings' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in fade-in slide-in-from-bottom-4">
              <div className="bg-white rounded-[2.5rem] border border-slate-100 p-10 shadow-sm">
                <div className="flex items-center gap-4 mb-6">
                  <div className="p-3 bg-slate-100 text-slate-600 rounded-xl">
                    <Eye size={24} />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-slate-900 tracking-tighter">Visibilidade da Loja</h3>
                    <p className="text-sm text-slate-500 font-medium">Controle se o público pode acessar as vendas.</p>
                  </div>
                </div>
                
                <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 mb-6">
                  <p className="text-sm text-slate-600 font-medium mb-4">
                    Quando a loja está <strong>fechada</strong>, o link some do menu principal e o checkout é desabilitado. Use isso para balanços de estoque ou manutenção.
                  </p>
                  <button
                    onClick={handleToggleStore}
                    className={cn(
                      "w-full py-4 rounded-xl font-black transition-all flex items-center justify-center gap-2",
                      isStoreClosed ? "bg-emerald-500 hover:bg-emerald-600 text-white" : "bg-rose-500 hover:bg-rose-600 text-white"
                    )}
                  >
                    {isStoreClosed ? 'Abrir Loja Solidária' : 'Fechar Loja Temporariamente'}
                  </button>
                </div>
              </div>

              <div className="bg-white rounded-[2.5rem] border border-slate-100 p-10 shadow-sm opacity-50 pointer-events-none">
                <div className="flex items-center gap-4 mb-6">
                  <div className="p-3 bg-slate-100 text-slate-600 rounded-xl">
                    <Tag size={24} />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-slate-900 tracking-tighter">Frete e Entregas</h3>
                    <p className="text-sm text-slate-500 font-medium">Configurações de Correios e retiradas.</p>
                  </div>
                </div>
                <div className="text-center p-6 border-2 border-dashed border-slate-200 rounded-2xl">
                  <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-2">Em Breve</p>
                  <p className="text-slate-500">Integração com Melhor Envio e transportadoras estará disponível na próxima atualização.</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Product Form Modal */}
      {isProductModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="sticky top-0 bg-white/80 backdrop-blur-md z-10 px-8 py-6 border-b border-slate-100 flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-black text-slate-900">{editingProduct ? 'Editar Produto' : 'Novo Produto'}</h2>
                <p className="text-slate-500 text-sm font-medium mt-1">Preencha os detalhes para disponibilizar na loja pública.</p>
              </div>
              <button 
                onClick={() => {
                  setIsProductModalOpen(false);
                  setEditingProduct(null);
                }}
                className="p-3 hover:bg-slate-100 rounded-2xl transition-colors"
              >
                <X size={24} className="text-slate-400" />
              </button>
            </div>
            
            <form onSubmit={handleSaveProduct} className="p-8 space-y-8">
              {/* Basic Info */}
              <div className="space-y-6">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <Package size={14} /> Informações Básicas
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2 md:col-span-2">
                    <label className="text-sm font-bold text-slate-700">Nome do Produto *</label>
                    <input 
                      name="name"
                      defaultValue={editingProduct?.name}
                      required
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                      placeholder="Ex: Cesta Básica Completa"
                    />
                  </div>
                  
                  <div className="space-y-2 md:col-span-2">
                    <label className="text-sm font-bold text-slate-700">Descrição</label>
                    <textarea 
                      name="description"
                      defaultValue={editingProduct?.description}
                      rows={3}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all resize-none"
                      placeholder="Descreva o produto detalhadamente..."
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">Categoria</label>
                    <input 
                      name="category"
                      defaultValue={editingProduct?.category}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                      placeholder="Ex: Alimentos"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">URL da Imagem</label>
                    <div className="relative">
                      <ImageIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                      <input 
                        name="image_url"
                        defaultValue={editingProduct?.image_url}
                        className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                        placeholder="https://..."
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Pricing & Stock */}
              <div className="space-y-6 pt-6 border-t border-slate-100">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <DollarSign size={14} /> Financeiro & Estoque
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">Preço de Custo (R$)</label>
                    <input 
                      name="cost_price"
                      type="number"
                      step="0.01"
                      min="0"
                      required
                      defaultValue={editingProduct?.cost_price}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                      placeholder="0.00"
                    />
                    <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Uso interno</p>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">Preço de Venda (R$)</label>
                    <input 
                      name="sale_price"
                      type="number"
                      step="0.01"
                      min="0"
                      required
                      defaultValue={editingProduct?.sale_price}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                      placeholder="0.00"
                    />
                    <p className="text-[10px] text-emerald-600 uppercase font-bold tracking-wider">Preço público</p>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">Estoque Inicial</label>
                    <input 
                      name="stock_quantity"
                      type="number"
                      min="0"
                      required
                      defaultValue={editingProduct?.stock_quantity}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                      placeholder="0"
                    />
                  </div>
                </div>
              </div>

              {/* Status */}
              <div className="space-y-6 pt-6 border-t border-slate-100">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <Tag size={14} /> Status
                </h3>
                
                <div className="space-y-2">
                  <select 
                    name="status"
                    defaultValue={editingProduct?.status || 'active'}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all appearance-none"
                  >
                    <option value="active">Ativo (Visível na loja)</option>
                    <option value="inactive">Inativo (Oculto)</option>
                  </select>
                </div>
              </div>

              {/* Actions */}
              <div className="pt-8 border-t border-slate-100 flex justify-end gap-3">
                <button 
                  type="button"
                  onClick={() => setIsProductModalOpen(false)}
                  className="px-6 py-3 font-bold text-slate-500 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  className="bg-slate-900 hover:bg-slate-800 text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2 transition-all shadow-xl shadow-slate-200"
                >
                  <Plus size={20} /> Salvar Produto
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function TabButton({ active, onClick, icon: Icon, label }: { active: boolean, onClick: () => void, icon: any, label: string }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-2 px-6 py-3 rounded-2xl font-bold whitespace-nowrap transition-all",
        active 
          ? "bg-slate-900 text-white shadow-lg shadow-slate-900/20" 
          : "bg-white text-slate-500 hover:bg-slate-100 hover:text-slate-900"
      )}
    >
      <Icon size={18} />
      {label}
    </button>
  );
}
