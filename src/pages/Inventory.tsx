import React, { useState } from 'react';
import { Package, Plus, Search, AlertCircle, Edit2, Trash2, X, ArrowDownToLine, ArrowUpFromLine, BriefcaseMedical } from 'lucide-react';
import { InventoryItem, mockInventoryCategories, Kit } from '../lib/mockData';
import { useInventory } from '../contexts/InventoryContext';

export function Inventory() {
  const { items, setItems, kits, setKits } = useInventory();
  const [activeTab, setActiveTab] = useState<'items' | 'kits'>('items');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Item Modal
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [name, setName] = useState('');
  const [category, setCategory] = useState(mockInventoryCategories[0]?.name || '');
  const [quantity, setQuantity] = useState('');
  const [unit, setUnit] = useState('');
  const [minQuantity, setMinQuantity] = useState('');
  const [expirationDate, setExpirationDate] = useState('');
  const [purchasePrice, setPurchasePrice] = useState('');

  // Transaction Modal
  const [transactionModal, setTransactionModal] = useState<{isOpen: boolean, type: 'in'|'out', item: InventoryItem | null}>({isOpen: false, type: 'in', item: null});
  const [transQuantity, setTransQuantity] = useState('');
  const [transPrice, setTransPrice] = useState('');
  const [transNotes, setTransNotes] = useState('');

  // Kit Modal
  const [isKitModalOpen, setIsKitModalOpen] = useState(false);
  const [editingKit, setEditingKit] = useState<Kit | null>(null);
  const [kitName, setKitName] = useState('');
  const [kitDesc, setKitDesc] = useState('');
  const [kitItems, setKitItems] = useState<{item_id: string, quantity: number}[]>([]);

  const filteredItems = items.filter(item => 
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredKits = kits.filter(kit => 
    kit.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // --- Item Handlers ---
  const openItemModal = (item?: InventoryItem) => {
    if (item) {
      setEditingItem(item);
      setName(item.name);
      setCategory(item.category);
      setQuantity(item.quantity.toString());
      setUnit(item.unit);
      setMinQuantity(item.min_quantity.toString());
      setExpirationDate(item.expiration_date || '');
      setPurchasePrice(item.purchase_price?.toString() || '');
    } else {
      setEditingItem(null);
      setName(''); setCategory(mockInventoryCategories[0]?.name || ''); setQuantity(''); setUnit(''); setMinQuantity(''); setExpirationDate(''); setPurchasePrice('');
    }
    setIsItemModalOpen(true);
  };

  const handleSaveItem = (e: React.FormEvent) => {
    e.preventDefault();
    const newItem: InventoryItem = {
      id: editingItem ? editingItem.id : Date.now().toString(),
      name, category, quantity: parseInt(quantity) || 0, unit,
      min_quantity: parseInt(minQuantity) || 0,
      expiration_date: expirationDate || undefined,
      purchase_price: parseFloat(purchasePrice) || undefined
    };

    if (editingItem) {
      setItems(items.map(i => i.id === editingItem.id ? newItem : i));
    } else {
      setItems([newItem, ...items]);
    }
    setIsItemModalOpen(false);
  };

  const handleDeleteItem = (id: string) => {
    if (confirm('Tem certeza que deseja excluir este item?')) {
      setItems(items.filter(i => i.id !== id));
    }
  };

  // --- Transaction Handlers ---
  const openTransactionModal = (item: InventoryItem, type: 'in' | 'out') => {
    setTransactionModal({ isOpen: true, type, item });
    setTransQuantity('');
    setTransPrice(item.purchase_price?.toString() || '');
    setTransNotes('');
  };

  const handleSaveTransaction = (e: React.FormEvent) => {
    e.preventDefault();
    const { item, type } = transactionModal;
    if (!item) return;

    const q = parseInt(transQuantity) || 0;
    const p = parseFloat(transPrice) || undefined;

    setItems(items.map(i => {
      if (i.id === item.id) {
        return {
          ...i,
          quantity: type === 'in' ? i.quantity + q : Math.max(0, i.quantity - q),
          purchase_price: type === 'in' && p !== undefined ? p : i.purchase_price
        };
      }
      return i;
    }));
    setTransactionModal({ isOpen: false, type: 'in', item: null });
  };

  // --- Kit Handlers ---
  const openKitModal = (kit?: Kit) => {
    if (kit) {
      setEditingKit(kit);
      setKitName(kit.name);
      setKitDesc(kit.description || '');
      setKitItems([...kit.items]);
    } else {
      setEditingKit(null);
      setKitName(''); setKitDesc(''); setKitItems([]);
    }
    setIsKitModalOpen(true);
  };

  const handleSaveKit = (e: React.FormEvent) => {
    e.preventDefault();
    const newKit: Kit = {
      id: editingKit ? editingKit.id : Date.now().toString(),
      name: kitName,
      description: kitDesc,
      items: kitItems.filter(ki => ki.item_id && ki.quantity > 0)
    };

    if (editingKit) {
      setKits(kits.map(k => k.id === editingKit.id ? newKit : k));
    } else {
      setKits([newKit, ...kits]);
    }
    setIsKitModalOpen(false);
  };

  const handleDeleteKit = (id: string) => {
    if (confirm('Tem certeza que deseja excluir este kit?')) {
      setKits(kits.filter(k => k.id !== id));
    }
  };

  const addKitItem = () => {
    setKitItems([...kitItems, { item_id: '', quantity: 1 }]);
  };

  const updateKitItem = (index: number, field: 'item_id' | 'quantity', value: string | number) => {
    const newItems = [...kitItems];
    newItems[index] = { ...newItems[index], [field]: value };
    setKitItems(newItems);
  };

  const removeKitItem = (index: number) => {
    setKitItems(kitItems.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Package className="text-emerald-600" size={28} />
            Estoque e Kits
          </h1>
          <p className="text-slate-500 mt-1">Gestão de medicamentos, suplementos, materiais e kits de entrega.</p>
        </div>
        <div className="flex gap-2">
          {activeTab === 'items' ? (
            <button 
              onClick={() => openItemModal()}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl font-medium flex items-center gap-2 transition-colors shadow-sm"
            >
              <Plus size={20} />
              Novo Item
            </button>
          ) : (
            <button 
              onClick={() => openKitModal()}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl font-medium flex items-center gap-2 transition-colors shadow-sm"
            >
              <Plus size={20} />
              Novo Kit
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 border-b border-slate-200">
        <button 
          onClick={() => setActiveTab('items')}
          className={`pb-3 px-2 font-medium text-sm transition-colors relative ${activeTab === 'items' ? 'text-emerald-600' : 'text-slate-500 hover:text-slate-700'}`}
        >
          Itens em Estoque
          {activeTab === 'items' && <span className="absolute bottom-0 left-0 w-full h-0.5 bg-emerald-600 rounded-t-full"></span>}
        </button>
        <button 
          onClick={() => setActiveTab('kits')}
          className={`pb-3 px-2 font-medium text-sm transition-colors relative ${activeTab === 'kits' ? 'text-emerald-600' : 'text-slate-500 hover:text-slate-700'}`}
        >
          Kits de Entrega
          {activeTab === 'kits' && <span className="absolute bottom-0 left-0 w-full h-0.5 bg-emerald-600 rounded-t-full"></span>}
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input 
            type="text" 
            placeholder={activeTab === 'items' ? "Buscar item no estoque..." : "Buscar kit..."}
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
          />
        </div>
      </div>

      {/* Items List */}
      {activeTab === 'items' && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden animate-in fade-in duration-300">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-100">
                  <th className="p-4 font-medium text-slate-500 text-sm">Item</th>
                  <th className="p-4 font-medium text-slate-500 text-sm">Categoria</th>
                  <th className="p-4 font-medium text-slate-500 text-sm">Quantidade</th>
                  <th className="p-4 font-medium text-slate-500 text-sm">Validade</th>
                  <th className="p-4 font-medium text-slate-500 text-sm">Valor (Un.)</th>
                  <th className="p-4 font-medium text-slate-500 text-sm">Status</th>
                  <th className="p-4 font-medium text-slate-500 text-sm text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredItems.map((item) => {
                  const isLowStock = item.quantity <= item.min_quantity;
                  const isExpired = item.expiration_date && new Date(item.expiration_date) < new Date();
                  
                  return (
                    <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-4 font-medium text-slate-900">{item.name}</td>
                      <td className="p-4 text-slate-600">
                        <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded-lg text-xs font-medium">
                          {item.category}
                        </span>
                      </td>
                      <td className="p-4 text-slate-900 font-medium">
                        {item.quantity} <span className="text-slate-500 text-sm font-normal">{item.unit}</span>
                      </td>
                      <td className="p-4 text-slate-600">
                        {item.expiration_date ? new Date(item.expiration_date).toLocaleDateString() : '--'}
                      </td>
                      <td className="p-4 text-slate-600">
                        {item.purchase_price ? `R$ ${item.purchase_price.toFixed(2)}` : '--'}
                      </td>
                      <td className="p-4">
                        {isExpired ? (
                          <span className="flex items-center gap-1 text-red-600 text-sm font-medium bg-red-50 px-2 py-1 rounded-lg w-fit">
                            <AlertCircle size={14} /> Vencido
                          </span>
                        ) : isLowStock ? (
                          <span className="flex items-center gap-1 text-amber-600 text-sm font-medium bg-amber-50 px-2 py-1 rounded-lg w-fit">
                            <AlertCircle size={14} /> Baixo Estoque
                          </span>
                        ) : (
                          <span className="text-emerald-600 text-sm font-medium bg-emerald-50 px-2 py-1 rounded-lg w-fit">
                            Normal
                          </span>
                        )}
                      </td>
                      <td className="p-4 flex justify-end gap-1">
                        <button onClick={() => openTransactionModal(item, 'in')} title="Registrar Entrada" className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors">
                          <ArrowDownToLine size={18} />
                        </button>
                        <button onClick={() => openTransactionModal(item, 'out')} title="Registrar Retirada" className="p-2 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors">
                          <ArrowUpFromLine size={18} />
                        </button>
                        <div className="w-px h-6 bg-slate-200 mx-1 self-center"></div>
                        <button onClick={() => openItemModal(item)} title="Editar Item" className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                          <Edit2 size={18} />
                        </button>
                        <button onClick={() => handleDeleteItem(item.id)} title="Excluir Item" className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                          <Trash2 size={18} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {filteredItems.length === 0 && (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-500">
                      Nenhum item encontrado no estoque.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Kits List */}
      {activeTab === 'kits' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in duration-300">
          {filteredKits.map(kit => (
            <div key={kit.id} className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 flex flex-col">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                    <BriefcaseMedical size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900">{kit.name}</h3>
                    <p className="text-xs text-slate-500">{kit.items.length} itens no kit</p>
                  </div>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => openKitModal(kit)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                    <Edit2 size={16} />
                  </button>
                  <button onClick={() => handleDeleteKit(kit.id)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
              <p className="text-sm text-slate-600 mb-4 flex-1">{kit.description}</p>
              <div className="bg-slate-50 rounded-xl p-3 space-y-2">
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">Composição</p>
                {kit.items.map((ki, idx) => {
                  const invItem = items.find(i => i.id === ki.item_id);
                  return (
                    <div key={idx} className="flex justify-between items-center text-sm">
                      <span className="text-slate-700">{invItem?.name || 'Item não encontrado'}</span>
                      <span className="font-medium text-slate-900">{ki.quantity} {invItem?.unit}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
          {filteredKits.length === 0 && (
            <div className="col-span-full p-8 text-center text-slate-500 bg-white rounded-2xl border border-slate-100">
              Nenhum kit cadastrado.
            </div>
          )}
        </div>
      )}

      {/* Item Modal */}
      {isItemModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <Package size={24} className="text-emerald-600" />
                {editingItem ? 'Editar Item' : 'Novo Item'}
              </h2>
              <button onClick={() => setIsItemModalOpen(false)} className="p-2 text-slate-400 hover:bg-slate-200 rounded-xl transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto">
              <form id="inventory-form" onSubmit={handleSaveItem} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-700">Nome do Item *</label>
                  <input required type="text" value={name} onChange={e => setName(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none" />
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-700">Categoria *</label>
                  <select required value={category} onChange={e => setCategory(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none">
                    <option value="">Selecione...</option>
                    {mockInventoryCategories.map(c => (
                      <option key={c.id} value={c.name}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-slate-700">Quantidade Atual *</label>
                    <input required type="number" value={quantity} onChange={e => setQuantity(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-slate-700">Unidade *</label>
                    <input required type="text" placeholder="Ex: caixas, frascos" value={unit} onChange={e => setUnit(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-slate-700">Estoque Mínimo</label>
                    <input type="number" value={minQuantity} onChange={e => setMinQuantity(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-slate-700">Data de Validade</label>
                    <input type="date" value={expirationDate} onChange={e => setExpirationDate(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none" />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-700">Valor de Compra (Unitário)</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">R$</span>
                    <input type="number" step="0.01" value={purchasePrice} onChange={e => setPurchasePrice(e.target.value)} className="w-full pl-12 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none" placeholder="0.00" />
                  </div>
                </div>
              </form>
            </div>

            <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
              <button onClick={() => setIsItemModalOpen(false)} className="px-6 py-2.5 rounded-xl font-medium text-slate-600 hover:bg-slate-200 transition-colors">
                Cancelar
              </button>
              <button type="submit" form="inventory-form" className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2.5 rounded-xl font-medium transition-colors shadow-sm">
                Salvar Item
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Transaction Modal */}
      {transactionModal.isOpen && transactionModal.item && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col">
            <div className={`p-6 border-b border-slate-100 flex items-center justify-between ${transactionModal.type === 'in' ? 'bg-emerald-50' : 'bg-amber-50'}`}>
              <h2 className={`text-xl font-bold flex items-center gap-2 ${transactionModal.type === 'in' ? 'text-emerald-800' : 'text-amber-800'}`}>
                {transactionModal.type === 'in' ? <ArrowDownToLine size={24} /> : <ArrowUpFromLine size={24} />}
                {transactionModal.type === 'in' ? 'Registrar Entrada' : 'Registrar Retirada'}
              </h2>
              <button onClick={() => setTransactionModal({isOpen: false, type: 'in', item: null})} className="p-2 text-slate-400 hover:bg-white/50 rounded-xl transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto">
              <div className="mb-6 p-4 bg-slate-50 rounded-xl border border-slate-100">
                <p className="text-sm text-slate-500">Item Selecionado</p>
                <p className="font-bold text-slate-900">{transactionModal.item.name}</p>
                <p className="text-sm text-slate-600 mt-1">Estoque atual: {transactionModal.item.quantity} {transactionModal.item.unit}</p>
              </div>

              <form id="transaction-form" onSubmit={handleSaveTransaction} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-700">Quantidade ({transactionModal.item.unit}) *</label>
                  <input required type="number" min="1" value={transQuantity} onChange={e => setTransQuantity(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none" />
                </div>

                {transactionModal.type === 'in' && (
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-slate-700">Valor de Compra (Unitário Atualizado)</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">R$</span>
                      <input type="number" step="0.01" value={transPrice} onChange={e => setTransPrice(e.target.value)} className="w-full pl-12 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none" placeholder="0.00" />
                    </div>
                  </div>
                )}

                {transactionModal.type === 'out' && (
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-slate-700">Motivo / Observação</label>
                    <input type="text" value={transNotes} onChange={e => setTransNotes(e.target.value)} placeholder="Ex: Entrega para família, descarte..." className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none" />
                  </div>
                )}
              </form>
            </div>

            <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
              <button onClick={() => setTransactionModal({isOpen: false, type: 'in', item: null})} className="px-6 py-2.5 rounded-xl font-medium text-slate-600 hover:bg-slate-200 transition-colors">
                Cancelar
              </button>
              <button type="submit" form="transaction-form" className={`px-6 py-2.5 rounded-xl font-medium text-white transition-colors shadow-sm ${transactionModal.type === 'in' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-amber-600 hover:bg-amber-700'}`}>
                Confirmar {transactionModal.type === 'in' ? 'Entrada' : 'Retirada'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Kit Modal */}
      {isKitModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <BriefcaseMedical size={24} className="text-emerald-600" />
                {editingKit ? 'Editar Kit' : 'Novo Kit'}
              </h2>
              <button onClick={() => setIsKitModalOpen(false)} className="p-2 text-slate-400 hover:bg-slate-200 rounded-xl transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1">
              <form id="kit-form" onSubmit={handleSaveKit} className="space-y-6">
                <div className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-slate-700">Nome do Kit *</label>
                    <input required type="text" value={kitName} onChange={e => setKitName(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none" />
                  </div>

                  <div className="space-y-1">
                    <label className="text-sm font-medium text-slate-700">Descrição</label>
                    <textarea rows={2} value={kitDesc} onChange={e => setKitDesc(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"></textarea>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-4">
                    <label className="text-sm font-medium text-slate-700">Itens do Kit</label>
                    <button type="button" onClick={addKitItem} className="text-sm font-medium text-emerald-600 hover:text-emerald-700 flex items-center gap-1">
                      <Plus size={16} /> Adicionar Item
                    </button>
                  </div>
                  
                  <div className="space-y-3">
                    {kitItems.map((ki, index) => (
                      <div key={index} className="flex gap-3 items-start">
                        <div className="flex-1">
                          <select required value={ki.item_id} onChange={e => updateKitItem(index, 'item_id', e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none">
                            <option value="">Selecione um item...</option>
                            {items.map(item => (
                              <option key={item.id} value={item.id}>{item.name} ({item.unit})</option>
                            ))}
                          </select>
                        </div>
                        <div className="w-32">
                          <input required type="number" min="1" placeholder="Qtd" value={ki.quantity} onChange={e => updateKitItem(index, 'quantity', parseInt(e.target.value) || 0)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none" />
                        </div>
                        <button type="button" onClick={() => removeKitItem(index)} className="p-2.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors mt-0.5">
                          <Trash2 size={20} />
                        </button>
                      </div>
                    ))}
                    {kitItems.length === 0 && (
                      <div className="text-center p-4 border border-dashed border-slate-200 rounded-xl text-slate-500 text-sm">
                        Nenhum item adicionado ao kit.
                      </div>
                    )}
                  </div>
                </div>
              </form>
            </div>

            <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
              <button onClick={() => setIsKitModalOpen(false)} className="px-6 py-2.5 rounded-xl font-medium text-slate-600 hover:bg-slate-200 transition-colors">
                Cancelar
              </button>
              <button type="submit" form="kit-form" className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2.5 rounded-xl font-medium transition-colors shadow-sm">
                Salvar Kit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
