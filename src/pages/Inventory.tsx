import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { 
  Package, Plus, Search, AlertCircle, Edit2, Trash2, X, ArrowDownToLine, ArrowUpFromLine, 
  BriefcaseMedical, History, Receipt, DollarSign, Check, RefreshCw, Layers, ArrowRight, CheckCircle2,
  Landmark, ShieldCheck, MapPin, Tag, Wrench, Boxes, SlidersHorizontal, ShoppingCart, Calculator
} from 'lucide-react';
import { InventoryItem, Kit } from '../lib/mockData';
import { useInventory } from '../contexts/InventoryContext';
import { useConfirm } from '../contexts/ConfirmContext';
import { supabase } from '../lib/supabase';
import { getMznToBrlRate, convertMznToBrl, convertBrlToMzn } from '../services/currencyService';
import { saveExpenseTransaction } from '../services/financeTransactionService';

const KitItemSelect = ({ items, categories, value, onChange }: { items: InventoryItem[], categories: any[], value: string, onChange: (id: string) => void }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState('');
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedItem = items.find(i => i.id === value);
  const sortedItems = [...items].filter(i => !i.is_patrimonio).sort((a, b) => a.name.localeCompare(b.name));
  const filtered = sortedItems.filter(i => 
    i.name.toLowerCase().includes(search.toLowerCase()) &&
    (filterCat === '' || i.category === filterCat)
  );

  return (
    <div className="relative flex-1" ref={wrapperRef}>
      <div 
        onClick={() => setIsOpen(!isOpen)} 
        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none cursor-pointer flex justify-between items-center"
      >
        <span className={selectedItem ? "text-slate-900" : "text-slate-500"}>
          {selectedItem ? `${selectedItem.name} (${selectedItem.unit})` : 'Selecione um item...'}
        </span>
        <ArrowDownToLine size={16} className="text-slate-400" />
      </div>
      
      {isOpen && (
        <div className="absolute z-20 w-full mt-1 bg-white border border-slate-200 shadow-xl rounded-xl overflow-hidden" style={{ minWidth: '300px' }}>
          <div className="p-2 space-y-2 border-b border-slate-100 bg-slate-50">
            <input 
              type="text" 
              placeholder="Buscar item..." 
              value={search} 
              onChange={e => setSearch(e.target.value)} 
              className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-emerald-500"
            />
            <select 
              value={filterCat} 
              onChange={e => setFilterCat(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-emerald-500"
            >
              <option value="">Todas as categorias</option>
              {categories.map(c => (
                <option key={c.id} value={c.name}>{c.name}</option>
              ))}
            </select>
          </div>
          <div className="max-h-48 overflow-y-auto">
            {filtered.map(item => (
              <div 
                key={item.id}
                onClick={() => { onChange(item.id); setIsOpen(false); }} 
                className="px-4 py-2 hover:bg-emerald-50 cursor-pointer flex justify-between items-center transition-colors border-b border-slate-50 last:border-0"
              >
                <span className="text-sm font-medium text-slate-800">{item.name}</span>
                <span className="text-xs text-slate-500 ml-2 truncate text-right">({item.category})</span>
              </div>
            ))}
            {filtered.length === 0 && (
              <div className="p-4 text-center text-sm text-slate-500">Nenhum item encontrado.</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export function Inventory() {
  const { items, addItem, updateItem, deleteItem, kits, addKit, updateKit, deleteKit, categories, transactions, addTransaction } = useInventory();
  const { confirm } = useConfirm();
  const [activeTab, setActiveTab] = useState<'consumo' | 'patrimonio' | 'kits' | 'history'>('consumo');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterCondition, setFilterCondition] = useState('');
  const [filterLocation, setFilterLocation] = useState('');
  
  // Item Modal State
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [name, setName] = useState('');
  const [category, setCategory] = useState(categories[0]?.name || '');
  const [quantity, setQuantity] = useState('');
  const [unit, setUnit] = useState('');
  const [minQuantity, setMinQuantity] = useState('');
  const [expirationDate, setExpirationDate] = useState('');
  const [purchasePrice, setPurchasePrice] = useState('');
  const [currency, setCurrency] = useState<'MZN' | 'BRL'>('MZN');
  const [internalUse, setInternalUse] = useState(false);
  // Patrimônio specific state
  const [isPatrimonio, setIsPatrimonio] = useState(false);
  const [patrimonyNumber, setPatrimonyNumber] = useState('');
  const [location, setLocation] = useState('');
  const [condition, setCondition] = useState<'novo' | 'bom' | 'regular' | 'danificado' | 'manutencao'>('bom');
  // Medication specific state
  const [dosageForm, setDosageForm] = useState<'comprimido' | 'liquido' | 'outro'>('outro');
  const [packageUnits, setPackageUnits] = useState(''); // Comprimidos por caixa
  const [liquidVolumeMl, setLiquidVolumeMl] = useState(''); // Volume em ml por frasco

  // Transaction Modal State & Integrations
  const [transactionModal, setTransactionModal] = useState<{isOpen: boolean, type: 'in'|'out', item: InventoryItem | null}>({isOpen: false, type: 'in', item: null});
  const [transQuantity, setTransQuantity] = useState('');
  const [transUnitPrice, setTransUnitPrice] = useState('');
  const [transTotalPrice, setTransTotalPrice] = useState('');
  const [transCurrency, setTransCurrency] = useState<'MZN' | 'BRL'>('MZN');
  const [integrateFinance, setIntegrateFinance] = useState(true);
  const [transFinanceCat, setTransFinanceCat] = useState('');
  const [transNotes, setTransNotes] = useState('');
  const [isSavingTrans, setIsSavingTrans] = useState(false);

  // Cost History & Extra State
  const [historyModalItem, setHistoryModalItem] = useState<InventoryItem | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [mznRate, setMznRate] = useState<number>(0.08103);
  const [financeCategories, setFinanceCategories] = useState<{ id: string; name: string }[]>([]);

  // Fetch exchange rate and finance categories
  useEffect(() => {
    getMznToBrlRate().then(res => setMznRate(res.rate));

    async function loadFinanceCategories() {
      try {
        const { data } = await supabase
          .from('finance_categories')
          .select('id, name')
          .eq('type', 'expense')
          .order('name');
        if (data && data.length > 0) {
          setFinanceCategories(data);
          const foodCat = data.find(c => 
            c.name.toLowerCase().includes('aliment') || 
            c.name.toLowerCase().includes('insumo') ||
            c.name.toLowerCase().includes('nutri')
          );
          if (foodCat) setTransFinanceCat(foodCat.id);
          else setTransFinanceCat(data[0].id);
        }
      } catch (e) {
        console.warn('Erro ao carregar categorias financeiras:', e);
      }
    }
    loadFinanceCategories();
  }, []);

  // Kit Modal
  const [isKitModalOpen, setIsKitModalOpen] = useState(false);
  const [editingKit, setEditingKit] = useState<Kit | null>(null);
  const [kitName, setKitName] = useState('');
  const [kitDesc, setKitDesc] = useState('');
  const [kitItems, setKitItems] = useState<{item_id: string, quantity: number}[]>([]);

  // Separação dos itens em Consumo vs Patrimônio
  const consumableItems = useMemo(() => items.filter(i => !i.is_patrimonio), [items]);
  const patrimonioItems = useMemo(() => items.filter(i => !!i.is_patrimonio), [items]);

  const filteredConsumableItems = useMemo(() => {
    return consumableItems.filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            item.category.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = filterCategory === '' || item.category === filterCategory;
      
      let matchesStatus = true;
      if (filterStatus === 'out_of_stock') {
        matchesStatus = item.quantity === 0;
      } else if (filterStatus === 'low_stock') {
        matchesStatus = item.quantity > 0 && item.quantity <= item.min_quantity;
      }

      return matchesSearch && matchesCategory && matchesStatus;
    }).sort((a, b) => a.name.localeCompare(b.name));
  }, [consumableItems, searchTerm, filterCategory, filterStatus]);

  const filteredPatrimonioItems = useMemo(() => {
    return patrimonioItems.filter(item => {
      const term = searchTerm.toLowerCase();
      const matchesSearch = item.name.toLowerCase().includes(term) ||
                            item.category.toLowerCase().includes(term) ||
                            (item.patrimony_number && item.patrimony_number.toLowerCase().includes(term)) ||
                            (item.location && item.location.toLowerCase().includes(term));
      const matchesCategory = filterCategory === '' || item.category === filterCategory;
      const matchesCondition = filterCondition === '' || item.condition === filterCondition;
      const matchesLocation = filterLocation === '' || item.location === filterLocation;

      return matchesSearch && matchesCategory && matchesCondition && matchesLocation;
    }).sort((a, b) => a.name.localeCompare(b.name));
  }, [patrimonioItems, searchTerm, filterCategory, filterCondition, filterLocation]);

  const patrimonioLocations = useMemo(() => {
    const locs = new Set<string>();
    patrimonioItems.forEach(i => {
      if (i.location && i.location.trim()) locs.add(i.location.trim());
    });
    return Array.from(locs).sort();
  }, [patrimonioItems]);

  const patrimonioStats = useMemo(() => {
    let totalMzn = 0;
    let totalUnits = 0;
    let inMaintenance = 0;
    let damaged = 0;

    patrimonioItems.forEach(item => {
      totalUnits += item.quantity || 1;
      if (item.condition === 'manutencao') inMaintenance += 1;
      if (item.condition === 'danificado') damaged += 1;

      if (item.purchase_price) {
        const itemCurrency = item.currency || 'MZN';
        const priceMzn = itemCurrency === 'BRL' ? convertBrlToMzn(item.purchase_price, mznRate) : item.purchase_price;
        totalMzn += priceMzn * (item.quantity || 1);
      }
    });

    const totalBrl = convertMznToBrl(totalMzn, mznRate);

    return {
      totalItems: patrimonioItems.length,
      totalUnits,
      inMaintenance,
      damaged,
      totalMzn,
      totalBrl
    };
  }, [patrimonioItems, mznRate]);

  const consumableStats = useMemo(() => {
    const lowStockCount = consumableItems.filter(i => i.quantity > 0 && i.quantity <= i.min_quantity).length;
    const outOfStockCount = consumableItems.filter(i => i.quantity === 0).length;
    let totalValueMzn = 0;

    consumableItems.forEach(item => {
      if (item.purchase_price) {
        const itemCurrency = item.currency || 'MZN';
        const priceMzn = itemCurrency === 'BRL' ? convertBrlToMzn(item.purchase_price, mznRate) : item.purchase_price;
        totalValueMzn += priceMzn * item.quantity;
      }
    });
    const totalValueBrl = convertMznToBrl(totalValueMzn, mznRate);

    return {
      totalItems: consumableItems.length,
      lowStockCount,
      outOfStockCount,
      totalValueMzn,
      totalValueBrl
    };
  }, [consumableItems, mznRate]);

  const filteredKits = kits.filter(kit => 
    kit.name.toLowerCase().includes(searchTerm.toLowerCase())
  ).sort((a, b) => a.name.localeCompare(b.name));

  // Helper: Custo total estimado de um kit
  const calculateKitCost = (kit: Kit) => {
    let totalMzn = 0;
    let hasMissingPrice = false;

    kit.items.forEach(ki => {
      const item = items.find(i => i.id === ki.item_id);
      if (!item || item.purchase_price === undefined || item.purchase_price === null) {
        hasMissingPrice = true;
        return;
      }
      const itemPrice = item.purchase_price;
      const itemCurrency = item.currency || 'MZN';
      const priceMzn = itemCurrency === 'BRL' ? convertBrlToMzn(itemPrice, mznRate) : itemPrice;
      totalMzn += priceMzn * ki.quantity;
    });

    const totalBrl = convertMznToBrl(totalMzn, mznRate);

    return {
      totalMzn,
      totalBrl,
      hasMissingPrice
    };
  };

  // Helper: Custo em tempo real do kit que está sendo editado no modal
  const currentModalKitCost = useMemo(() => {
    let totalMzn = 0;
    kitItems.forEach(ki => {
      const item = items.find(i => i.id === ki.item_id);
      if (!item || item.purchase_price === undefined || item.purchase_price === null) return;
      const priceMzn = (item.currency || 'MZN') === 'BRL' ? convertBrlToMzn(item.purchase_price, mznRate) : item.purchase_price;
      totalMzn += priceMzn * (ki.quantity || 0);
    });
    const totalBrl = convertMznToBrl(totalMzn, mznRate);
    return { totalMzn, totalBrl };
  }, [kitItems, items, mznRate]);

  // Histórico focado exclusivamente em ENTRADAS para acompanhamento dos valores dos produtos
  const inflowTransactions = useMemo(() => {
    return transactions
      .filter(t => t.type === 'in')
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transactions]);

  const filteredInflowTransactions = useMemo(() => {
    if (!searchTerm.trim()) return inflowTransactions;
    const term = searchTerm.toLowerCase();
    return inflowTransactions.filter(t => {
      const item = items.find(i => i.id === t.item_id);
      const itemName = item?.name?.toLowerCase() || '';
      const itemCategory = item?.category?.toLowerCase() || '';
      const reason = t.reason?.toLowerCase() || '';
      return itemName.includes(term) || itemCategory.includes(term) || reason.includes(term);
    });
  }, [inflowTransactions, searchTerm, items]);

  const inflowStats = useMemo(() => {
    let totalSpentMzn = 0;
    let totalUnits = 0;

    inflowTransactions.forEach(t => {
      totalUnits += t.quantity || 0;
      if (t.price) {
        totalSpentMzn += (t.price || 0) * (t.quantity || 0);
      }
    });

    const totalSpentBrl = convertMznToBrl(totalSpentMzn, mznRate);

    return {
      count: inflowTransactions.length,
      totalUnits,
      totalSpentMzn,
      totalSpentBrl
    };
  }, [inflowTransactions, mznRate]);

  // Helper para renderizar badge de estado de conservação
  const renderConditionBadge = (cond?: string) => {
    switch (cond) {
      case 'novo':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-sky-50 text-sky-700 border border-sky-200">Novo</span>;
      case 'regular':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">Regular</span>;
      case 'manutencao':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-orange-50 text-orange-700 border border-orange-200"><Wrench size={11} /> Em Manutenção</span>;
      case 'danificado':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200"><AlertCircle size={11} /> Danificado</span>;
      case 'bom':
      default:
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">Bom</span>;
    }
  };

  // --- Item Handlers ---
  const openItemModal = (item?: InventoryItem, forcePatrimonio?: boolean) => {
    if (item) {
      setEditingItem(item);
      setName(item.name);
      setCategory(item.category);
      setQuantity(item.quantity.toString());
      setUnit(item.unit);
      setMinQuantity(item.min_quantity.toString());
      setExpirationDate(item.expiration_date || '');
      setPurchasePrice(item.purchase_price?.toString() || '');
      setCurrency(item.currency || 'MZN');
      setInternalUse(item.internal_use || false);
      setIsPatrimonio(item.is_patrimonio || false);
      setPatrimonyNumber(item.patrimony_number || '');
      setLocation(item.location || '');
      setCondition(item.condition || 'bom');
      setDosageForm(item.dosage_form || (item.unit?.toLowerCase().includes('frasco') ? 'liquido' : item.unit?.toLowerCase().includes('caixa') ? 'comprimido' : 'outro'));
      setPackageUnits(item.package_units !== undefined && item.package_units !== null ? item.package_units.toString() : '');
      setLiquidVolumeMl(item.liquid_volume_ml !== undefined && item.liquid_volume_ml !== null ? item.liquid_volume_ml.toString() : '');
    } else {
      const willBePatrimonio = forcePatrimonio !== undefined ? forcePatrimonio : (activeTab === 'patrimonio');
      setEditingItem(null);
      setName('');
      setCategory(categories[0]?.name || '');
      setQuantity(willBePatrimonio ? '1' : '');
      setUnit(willBePatrimonio ? 'un' : '');
      setMinQuantity('');
      setExpirationDate('');
      setPurchasePrice('');
      setCurrency('MZN');
      setInternalUse(false);
      setIsPatrimonio(willBePatrimonio);
      setPatrimonyNumber('');
      setLocation('');
      setCondition('bom');
      setDosageForm('outro');
      setPackageUnits('');
      setLiquidVolumeMl('');
    }
    setIsItemModalOpen(true);
  };

  const handleSaveItem = (e: React.FormEvent) => {
    e.preventDefault();
    const newItem: InventoryItem = {
      id: editingItem ? editingItem.id : Date.now().toString(),
      name,
      category,
      quantity: parseInt(quantity) || 0,
      unit,
      min_quantity: parseInt(minQuantity) || 0,
      expiration_date: !isPatrimonio ? (expirationDate || undefined) : undefined,
      purchase_price: parseFloat(purchasePrice) || undefined,
      currency: currency,
      internal_use: !isPatrimonio ? internalUse : false,
      is_patrimonio: isPatrimonio,
      patrimony_number: isPatrimonio ? (patrimonyNumber || undefined) : undefined,
      location: isPatrimonio ? (location || undefined) : undefined,
      condition: isPatrimonio ? condition : undefined,
      dosage_form: !isPatrimonio ? dosageForm : undefined,
      package_units: (!isPatrimonio && dosageForm === 'comprimido' && packageUnits) ? parseInt(packageUnits) : undefined,
      liquid_volume_ml: (!isPatrimonio && dosageForm === 'liquido' && liquidVolumeMl) ? parseFloat(liquidVolumeMl) : undefined,
    };

    if (editingItem) {
      updateItem(editingItem.id, newItem);
    } else {
      addItem(newItem);
    }
    setIsItemModalOpen(false);
  };

  const handleDeleteItem = async (id: string) => {
    if (await confirm('Tem certeza que deseja excluir este item?')) {
      deleteItem(id);
    }
  };

  // --- Quick Price Edit Handlers (permite definir valor unitário mesmo zerado) ---
  const [quickPriceModalItem, setQuickPriceModalItem] = useState<InventoryItem | null>(null);
  const [quickPriceVal, setQuickPriceVal] = useState('');
  const [quickPriceCurr, setQuickPriceCurr] = useState<'MZN' | 'BRL'>('MZN');
  const [isSavingQuickPrice, setIsSavingQuickPrice] = useState(false);
  const [calcBatchTotal, setCalcBatchTotal] = useState('');
  const [calcBatchQty, setCalcBatchQty] = useState('');

  const openQuickPriceModal = (item: InventoryItem) => {
    setQuickPriceModalItem(item);
    setQuickPriceVal(item.purchase_price !== undefined && item.purchase_price !== null ? item.purchase_price.toString() : '');
    setQuickPriceCurr(item.currency || 'MZN');
    setCalcBatchTotal('');
    setCalcBatchQty('');
  };

  const handleSaveQuickPrice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickPriceModalItem) return;
    const price = parseFloat(quickPriceVal);
    if (isNaN(price) || price < 0) {
      alert('Informe um valor unitário válido.');
      return;
    }
    setIsSavingQuickPrice(true);
    try {
      await updateItem(quickPriceModalItem.id, {
        purchase_price: price,
        currency: quickPriceCurr
      });
      setToastMessage(`Preço unitário de "${quickPriceModalItem.name}" atualizado para ${quickPriceCurr === 'BRL' ? 'R$' : 'MT'} ${price.toFixed(2)}! Custos do projeto e kits recalculados.`);
      setQuickPriceModalItem(null);
      setTimeout(() => setToastMessage(null), 4000);
    } catch (err) {
      console.error('Erro ao atualizar preço unitário:', err);
      alert('Erro ao atualizar preço.');
    } finally {
      setIsSavingQuickPrice(false);
    }
  };

  const handleCalcApply = () => {
    const tot = parseFloat(calcBatchTotal) || 0;
    const q = parseFloat(calcBatchQty) || 0;
    if (tot > 0 && q > 0) {
      setQuickPriceVal((tot / q).toFixed(2));
    }
  };

  // --- Transaction Handlers ---
  const openTransactionModal = (item: InventoryItem, type: 'in' | 'out') => {
    setTransactionModal({ isOpen: true, type, item });
    setTransQuantity('');
    const defaultPrice = item.purchase_price ? item.purchase_price.toString() : '';
    setTransUnitPrice(defaultPrice);
    setTransTotalPrice('');
    setTransNotes('');
    setTransCurrency(item.currency || 'MZN');
    setIntegrateFinance(true);
    if (financeCategories.length > 0 && !transFinanceCat) {
      const foodCat = financeCategories.find(c => 
        c.name.toLowerCase().includes('aliment') || 
        c.name.toLowerCase().includes('insumo')
      );
      setTransFinanceCat(foodCat ? foodCat.id : financeCategories[0].id);
    }
  };

  // Bidirectional price handlers
  const handleQuantityChange = (val: string) => {
    setTransQuantity(val);
    const q = parseFloat(val);
    const u = parseFloat(transUnitPrice);
    if (!isNaN(q) && q > 0 && !isNaN(u) && u > 0) {
      setTransTotalPrice((q * u).toFixed(2));
    }
  };

  const handleUnitPriceChange = (val: string) => {
    setTransUnitPrice(val);
    const u = parseFloat(val);
    const q = parseFloat(transQuantity);
    if (!isNaN(q) && q > 0 && !isNaN(u) && u >= 0) {
      setTransTotalPrice((q * u).toFixed(2));
    }
  };

  const handleTotalPriceChange = (val: string) => {
    setTransTotalPrice(val);
    const t = parseFloat(val);
    const q = parseFloat(transQuantity);
    if (!isNaN(q) && q > 0 && !isNaN(t) && t >= 0) {
      setTransUnitPrice((t / q).toFixed(2));
    }
  };

  const handleSaveTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    const { item, type } = transactionModal;
    if (!item) return;

    const q = parseInt(transQuantity) || 0;
    if (q <= 0) return;

    setIsSavingTrans(true);
    try {
      const unitP = parseFloat(transUnitPrice) || 0;
      const totalP = parseFloat(transTotalPrice) || (unitP * q);

      const newQuantity = type === 'in' ? item.quantity + q : Math.max(0, item.quantity - q);
      
      // 1. Atualizar saldo e preço de compra no item do estoque
      updateItem(item.id, {
        quantity: newQuantity,
        purchase_price: type === 'in' && unitP > 0 ? unitP : item.purchase_price,
        currency: type === 'in' ? transCurrency : (item.currency || 'MZN')
      });

      // 2. Registrar no histórico de transações do estoque
      const curr = type === 'in' ? transCurrency : (item.currency || 'MZN');
      const noteReason = transNotes 
        ? `${transNotes} [${curr}]` 
        : (type === 'in' ? `Entrada de estoque [${curr}]` : 'Saída manual');

      addTransaction({
        item_id: item.id,
        type,
        quantity: q,
        price: type === 'in' && unitP > 0 ? unitP : undefined,
        reason: noteReason
      });

      // 3. Integração automática com o Financeiro da Nutrição (Casa Nutri)
      if (type === 'in' && integrateFinance && totalP > 0) {
        try {
          const rate = transCurrency === 'MZN' ? mznRate : 1;
          const amountBrl = transCurrency === 'MZN' ? convertMznToBrl(totalP, rate) : totalP;

          await saveExpenseTransaction({
            description: `Entrada Estoque: ${q} ${item.unit} de ${item.name}`,
            amount: amountBrl,
            type: 'expense',
            category_id: transFinanceCat || '',
            date: new Date().toISOString().split('T')[0],
            status: 'completed',
            account: 'Caixa Moçambique',
            expense_type: 'variable',
            recurrence: 'none',
            module: 'nutrition',
            notes: `Insumos Casa Nutri: ${q} ${item.unit} x ${unitP.toFixed(2)} ${transCurrency} = ${totalP.toFixed(2)} ${transCurrency}. ${transNotes || ''}`.trim(),
            currency: transCurrency,
            original_amount: totalP,
            exchange_rate: rate
          }, 'nutrition');

          setToastMessage(`Entrada de ${q} ${item.unit} registrada e despesa lançada no Financeiro da Nutrição!`);
        } catch (finErr) {
          console.error('Erro ao integrar despesa no financeiro:', finErr);
          setToastMessage(`Entrada registrada no estoque! (Aviso: falha na integração financeira)`);
        }
      } else {
        setToastMessage(`Movimentação de estoque de ${item.name} registrada com sucesso!`);
      }

      setTransactionModal({ isOpen: false, type: 'in', item: null });
      setTimeout(() => setToastMessage(null), 4000);
    } catch (err) {
      console.error('Erro ao salvar transação:', err);
      alert('Ocorreu um erro ao salvar a movimentação.');
    } finally {
      setIsSavingTrans(false);
    }
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

  const handleSaveKit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newKit: Kit = {
      id: editingKit ? editingKit.id : Date.now().toString(),
      name: kitName,
      description: kitDesc,
      items: kitItems.filter(ki => ki.item_id && ki.quantity > 0)
    };

    if (editingKit) {
      await updateKit(editingKit.id, newKit);
    } else {
      await addKit(newKit);
    }
    setIsKitModalOpen(false);
  };

  const handleDeleteKit = async (id: string) => {
    const kit = kits.find(k => k.id === id);
    const confirmed = await confirm({
      title: 'Excluir Kit',
      message: `Tem certeza que deseja excluir o kit "${kit?.name || 'selecionado'}"? Esta ação não pode ser desfeita.`,
      confirmText: 'Excluir',
      cancelText: 'Cancelar',
      type: 'danger'
    });
    if (confirmed) {
      await deleteKit(id);
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
            Estoque & Patrimônio
          </h1>
          <p className="text-slate-500 mt-1">Gestão de insumos, medicamentos, itens de patrimônio e kits de entrega.</p>
        </div>
        <div className="flex gap-2">
          {activeTab === 'consumo' && (
            <button 
              onClick={() => openItemModal(undefined, false)}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl font-medium flex items-center gap-2 transition-colors shadow-sm text-sm"
            >
              <Plus size={18} />
              Novo Insumo
            </button>
          )}
          {activeTab === 'patrimonio' && (
            <button 
              onClick={() => openItemModal(undefined, true)}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl font-medium flex items-center gap-2 transition-colors shadow-sm text-sm"
            >
              <Plus size={18} />
              Novo Patrimônio
            </button>
          )}
          {activeTab === 'kits' && (
            <div className="flex items-center gap-2">
              <Link
                to="/nutrition/finance?tab=planning"
                className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 px-4 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all shadow-sm text-sm"
              >
                <ShoppingCart size={17} className="text-indigo-600" />
                Previsão & Setor de Compras
              </Link>
              <button 
                onClick={() => openKitModal()}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl font-medium flex items-center gap-2 transition-colors shadow-sm text-sm"
              >
                <Plus size={18} />
                Novo Kit
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 sm:gap-4 border-b border-slate-200 overflow-x-auto">
        <button 
          onClick={() => setActiveTab('consumo')}
          className={`pb-3 px-3 font-semibold text-sm transition-colors relative flex items-center gap-2 whitespace-nowrap ${activeTab === 'consumo' ? 'text-emerald-600' : 'text-slate-500 hover:text-slate-700'}`}
        >
          <Package size={17} />
          <span>Insumos & Consumo</span>
          <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${activeTab === 'consumo' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
            {consumableItems.length}
          </span>
          {activeTab === 'consumo' && <span className="absolute bottom-0 left-0 w-full h-0.5 bg-emerald-600 rounded-t-full"></span>}
        </button>

        <button 
          onClick={() => setActiveTab('patrimonio')}
          className={`pb-3 px-3 font-semibold text-sm transition-colors relative flex items-center gap-2 whitespace-nowrap ${activeTab === 'patrimonio' ? 'text-emerald-600' : 'text-slate-500 hover:text-slate-700'}`}
        >
          <Landmark size={17} />
          <span>Patrimônio</span>
          <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${activeTab === 'patrimonio' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
            {patrimonioItems.length}
          </span>
          {activeTab === 'patrimonio' && <span className="absolute bottom-0 left-0 w-full h-0.5 bg-emerald-600 rounded-t-full"></span>}
        </button>

        <button 
          onClick={() => setActiveTab('kits')}
          className={`pb-3 px-3 font-semibold text-sm transition-colors relative flex items-center gap-2 whitespace-nowrap ${activeTab === 'kits' ? 'text-emerald-600' : 'text-slate-500 hover:text-slate-700'}`}
        >
          <Boxes size={17} />
          <span>Kits de Entrega</span>
          <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${activeTab === 'kits' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
            {kits.length}
          </span>
          {activeTab === 'kits' && <span className="absolute bottom-0 left-0 w-full h-0.5 bg-emerald-600 rounded-t-full"></span>}
        </button>

        <button 
          onClick={() => setActiveTab('history')}
          className={`pb-3 px-3 font-semibold text-sm transition-colors relative flex items-center gap-2 whitespace-nowrap ${activeTab === 'history' ? 'text-emerald-600' : 'text-slate-500 hover:text-slate-700'}`}
        >
          <History size={17} />
          <span>Histórico de Entradas</span>
          <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${activeTab === 'history' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
            {inflowTransactions.length}
          </span>
          {activeTab === 'history' && <span className="absolute bottom-0 left-0 w-full h-0.5 bg-emerald-600 rounded-t-full"></span>}
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input 
            type="text" 
            placeholder={
              activeTab === 'consumo' ? "Buscar insumo ou medicamento por nome ou categoria..." :
              activeTab === 'patrimonio' ? "Buscar patrimônio por nome, nº tombamento, setor..." :
              activeTab === 'kits' ? "Buscar kit de entrega..." : "Buscar no histórico de entradas por item, fornecedor ou observação..."
            }
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all text-sm"
          />
        </div>
        
        {activeTab === 'consumo' && (
          <div className="flex flex-wrap gap-3">
            <select 
              value={filterCategory} 
              onChange={e => setFilterCategory(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none min-w-[150px] text-sm"
            >
              <option value="">Todas as categorias</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.name}>{cat.name}</option>
              ))}
            </select>

            <select 
              value={filterStatus} 
              onChange={e => setFilterStatus(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none min-w-[150px] text-sm"
            >
              <option value="">Todos os status</option>
              <option value="out_of_stock">Sem Estoque</option>
              <option value="low_stock">Baixo Estoque</option>
            </select>
          </div>
        )}

        {activeTab === 'patrimonio' && (
          <div className="flex flex-wrap gap-3">
            <select 
              value={filterCategory} 
              onChange={e => setFilterCategory(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none min-w-[140px] text-sm"
            >
              <option value="">Todas as categorias</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.name}>{cat.name}</option>
              ))}
            </select>

            <select 
              value={filterCondition} 
              onChange={e => setFilterCondition(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none min-w-[140px] text-sm"
            >
              <option value="">Todos os estados</option>
              <option value="novo">Novo</option>
              <option value="bom">Bom</option>
              <option value="regular">Regular</option>
              <option value="manutencao">Em Manutenção</option>
              <option value="danificado">Danificado</option>
            </select>

            {patrimonioLocations.length > 0 && (
              <select 
                value={filterLocation} 
                onChange={e => setFilterLocation(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none min-w-[140px] text-sm"
              >
                <option value="">Todos os setores</option>
                {patrimonioLocations.map(loc => (
                  <option key={loc} value={loc}>{loc}</option>
                ))}
              </select>
            )}
          </div>
        )}
      </div>

      {/* Insumos & Consumo List */}
      {activeTab === 'consumo' && (
        <div className="space-y-4 animate-in fade-in duration-300">
          {/* Quick Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total de Itens</span>
              <span className="text-2xl font-bold text-slate-800 mt-1">{consumableStats.totalItems}</span>
              <span className="text-[11px] text-slate-500 mt-0.5">Cadastrados em consumo</span>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col">
              <span className="text-xs font-semibold text-amber-600 uppercase tracking-wider flex items-center gap-1">
                <AlertCircle size={13} /> Baixo Estoque
              </span>
              <span className="text-2xl font-bold text-amber-600 mt-1">{consumableStats.lowStockCount}</span>
              <span className="text-[11px] text-slate-500 mt-0.5">Atingiram nível mínimo</span>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col">
              <span className="text-xs font-semibold text-rose-600 uppercase tracking-wider flex items-center gap-1">
                <AlertCircle size={13} /> Sem Estoque
              </span>
              <span className="text-2xl font-bold text-rose-600 mt-1">{consumableStats.outOfStockCount}</span>
              <span className="text-[11px] text-slate-500 mt-0.5">Necessitam reposição imediata</span>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col">
              <span className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">Valor Estimado</span>
              <span className="text-xl font-bold text-slate-800 mt-1">
                MT {consumableStats.totalValueMzn.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}
              </span>
              <span className="text-[11px] text-slate-500 mt-0.5">
                ≈ R$ {consumableStats.totalValueBrl.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
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
                  {filteredConsumableItems.map((item) => {
                    const isLowStock = item.quantity <= item.min_quantity;
                    const isExpired = item.expiration_date && new Date(item.expiration_date) < new Date();
                    
                    return (
                      <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="p-4 font-medium text-slate-900">
                          <button
                            type="button"
                            onClick={() => setHistoryModalItem(item)}
                            className="text-left font-bold text-slate-900 hover:text-emerald-600 transition-colors flex items-center gap-1.5 group/name"
                            title="Clique para ver o histórico de custos e compras deste item"
                          >
                            <span>{item.name}</span>
                            <History size={14} className="text-slate-400 group-hover/name:text-emerald-600 transition-colors opacity-70" />
                          </button>
                          {item.dosage_form === 'comprimido' && item.package_units && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200/60 px-2 py-0.5 rounded-md mt-1 w-fit">
                              💊 {item.package_units} comp/caixa
                            </span>
                          )}
                          {item.dosage_form === 'liquido' && item.liquid_volume_ml && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-cyan-700 bg-cyan-50 border border-cyan-200/60 px-2 py-0.5 rounded-md mt-1 w-fit">
                              🧴 {item.liquid_volume_ml} ml/frasco
                            </span>
                          )}
                        </td>
                        <td className="p-4 text-slate-600">
                          <div className="flex flex-col gap-1 items-start">
                            <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded-lg text-xs font-medium">
                              {item.category}
                            </span>
                            {item.internal_use && (
                              <span className="bg-purple-100 text-purple-700 px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase tracking-wider">
                                Uso Interno
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="p-4 text-slate-900 font-medium">
                          {item.quantity} <span className="text-slate-500 text-sm font-normal">{item.unit}</span>
                        </td>
                        <td className="p-4 text-slate-600">
                          {item.expiration_date ? new Date(item.expiration_date).toLocaleDateString() : '--'}
                        </td>
                        <td className="p-4 text-slate-600">
                          {item.purchase_price !== undefined && item.purchase_price !== null && item.purchase_price > 0 ? (
                            <div className="flex items-center gap-1.5 group/price">
                              <button
                                type="button"
                                onClick={() => openQuickPriceModal(item)}
                                className="text-left font-bold text-slate-800 hover:text-emerald-600 transition-colors text-sm"
                                title="Clique para editar o preço unitário deste item"
                              >
                                <span>
                                  {item.currency === 'BRL' ? 'R$' : 'MT'} {item.purchase_price.toFixed(2)}
                                </span>
                                <span className="text-[10px] text-slate-400 font-medium block">
                                  por {item.unit || 'un'}
                                </span>
                              </button>
                              <button
                                type="button"
                                onClick={() => openQuickPriceModal(item)}
                                className="p-1 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-md transition-colors opacity-0 group-hover/price:opacity-100"
                                title="Editar valor unitário"
                              >
                                <Edit2 size={13} />
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => openQuickPriceModal(item)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-black bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 transition-all shadow-sm"
                              title="Produto sem valor cadastrado. Clique para definir o preço unitário e calcular o custo do projeto"
                            >
                              <Plus size={12} />
                              <span>Definir Custo</span>
                            </button>
                          )}
                        </td>
                        <td className="p-4">
                          {item.quantity === 0 ? (
                            <span className="flex items-center gap-1 text-red-600 text-sm font-medium bg-red-50 px-2 py-1 rounded-lg w-fit">
                              <AlertCircle size={14} /> Sem Estoque
                            </span>
                          ) : isExpired ? (
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
                          <button onClick={() => openTransactionModal(item, 'in')} title="Registrar Entrada / Compra" className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors">
                            <ArrowDownToLine size={18} />
                          </button>
                          <div className="w-px h-6 bg-slate-200 mx-1 self-center"></div>
                          <button onClick={() => setHistoryModalItem(item)} title="Ver Histórico de Custos e Entradas" className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors">
                            <History size={18} />
                          </button>
                          <button onClick={() => openItemModal(item, false)} title="Editar Item" className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                            <Edit2 size={18} />
                          </button>
                          <button onClick={() => handleDeleteItem(item.id)} title="Excluir Item" className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                            <Trash2 size={18} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {filteredConsumableItems.length === 0 && (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-slate-500">
                        Nenhum item de consumo encontrado.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Patrimônio List */}
      {activeTab === 'patrimonio' && (
        <div className="space-y-4 animate-in fade-in duration-300">
          {/* Quick Metrics for Patrimônio */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <Landmark size={13} className="text-slate-500" /> Bens Tombados
              </span>
              <span className="text-2xl font-bold text-slate-800 mt-1">{patrimonioStats.totalItems}</span>
              <span className="text-[11px] text-slate-500 mt-0.5">{patrimonioStats.totalUnits} unidades registradas</span>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col">
              <span className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">Valor do Patrimônio</span>
              <span className="text-xl font-bold text-slate-800 mt-1">
                MT {patrimonioStats.totalMzn.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}
              </span>
              <span className="text-[11px] text-slate-500 mt-0.5">
                ≈ R$ {patrimonioStats.totalBrl.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col">
              <span className="text-xs font-semibold text-orange-600 uppercase tracking-wider flex items-center gap-1">
                <Wrench size={13} /> Em Manutenção
              </span>
              <span className={`text-2xl font-bold mt-1 ${patrimonioStats.inMaintenance > 0 ? 'text-orange-600' : 'text-slate-800'}`}>
                {patrimonioStats.inMaintenance}
              </span>
              <span className="text-[11px] text-slate-500 mt-0.5">Necessitam reparo/revisão</span>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col">
              <span className="text-xs font-semibold text-rose-600 uppercase tracking-wider flex items-center gap-1">
                <AlertCircle size={13} /> Danificados / Baixa
              </span>
              <span className={`text-2xl font-bold mt-1 ${patrimonioStats.damaged > 0 ? 'text-rose-600' : 'text-slate-800'}`}>
                {patrimonioStats.damaged}
              </span>
              <span className="text-[11px] text-slate-500 mt-0.5">Inutilizados ou avariados</span>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/50 border-b border-slate-100">
                    <th className="p-4 font-medium text-slate-500 text-sm">Bem / Equipamento</th>
                    <th className="p-4 font-medium text-slate-500 text-sm">Nº Patrimônio</th>
                    <th className="p-4 font-medium text-slate-500 text-sm">Categoria</th>
                    <th className="p-4 font-medium text-slate-500 text-sm">Localização / Setor</th>
                    <th className="p-4 font-medium text-slate-500 text-sm">Qtd</th>
                    <th className="p-4 font-medium text-slate-500 text-sm">Estado</th>
                    <th className="p-4 font-medium text-slate-500 text-sm">Valor de Aquisição</th>
                    <th className="p-4 font-medium text-slate-500 text-sm text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredPatrimonioItems.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-4 font-medium text-slate-900">
                        <button
                          type="button"
                          onClick={() => setHistoryModalItem(item)}
                          className="text-left font-bold text-slate-900 hover:text-emerald-600 transition-colors flex items-center gap-1.5 group/name"
                          title="Clique para ver o histórico deste bem"
                        >
                          <span>{item.name}</span>
                          <History size={14} className="text-slate-400 group-hover/name:text-emerald-600 transition-colors opacity-70" />
                        </button>
                      </td>
                      <td className="p-4">
                        {item.patrimony_number ? (
                          <span className="bg-slate-100 text-slate-700 font-mono text-xs px-2.5 py-1 rounded-md font-bold border border-slate-200">
                            {item.patrimony_number}
                          </span>
                        ) : (
                          <span className="text-slate-400 text-xs italic">Não tombado</span>
                        )}
                      </td>
                      <td className="p-4 text-slate-600">
                        <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded-lg text-xs font-medium">
                          {item.category}
                        </span>
                      </td>
                      <td className="p-4 text-slate-600">
                        {item.location ? (
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-700 bg-slate-50 px-2 py-1 rounded-md border border-slate-200/60">
                            <MapPin size={12} className="text-slate-400" />
                            {item.location}
                          </span>
                        ) : (
                          <span className="text-slate-400 text-xs italic">--</span>
                        )}
                      </td>
                      <td className="p-4 text-slate-900 font-medium">
                        {item.quantity} <span className="text-slate-500 text-sm font-normal">{item.unit || 'un'}</span>
                      </td>
                      <td className="p-4">
                        {renderConditionBadge(item.condition)}
                      </td>
                      <td className="p-4 text-slate-600">
                        {item.purchase_price !== undefined && item.purchase_price !== null && item.purchase_price > 0 ? (
                          <div className="flex items-center gap-1.5 group/price">
                            <button
                              type="button"
                              onClick={() => openQuickPriceModal(item)}
                              className="text-left font-bold text-slate-800 hover:text-emerald-600 transition-colors text-sm"
                              title="Clique para editar o valor deste patrimônio"
                            >
                              <span>
                                {item.currency === 'BRL' ? 'R$' : 'MT'} {item.purchase_price.toFixed(2)}
                              </span>
                            </button>
                            <button
                              type="button"
                              onClick={() => openQuickPriceModal(item)}
                              className="p-1 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-md transition-colors opacity-0 group-hover/price:opacity-100"
                              title="Editar valor de aquisição"
                            >
                              <Edit2 size={13} />
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => openQuickPriceModal(item)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-black bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 transition-all shadow-sm"
                          >
                            <Plus size={12} />
                            <span>Definir Valor</span>
                          </button>
                        )}
                      </td>
                      <td className="p-4 flex justify-end gap-1">
                        <button onClick={() => openTransactionModal(item, 'in')} title="Registrar Entrada / Aquisição" className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors">
                          <ArrowDownToLine size={18} />
                        </button>
                        <div className="w-px h-6 bg-slate-200 mx-1 self-center"></div>
                        <button onClick={() => setHistoryModalItem(item)} title="Ver Histórico de Valores" className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors">
                          <History size={18} />
                        </button>
                        <button onClick={() => openItemModal(item, true)} title="Editar Patrimônio" className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                          <Edit2 size={18} />
                        </button>
                        <button onClick={() => handleDeleteItem(item.id)} title="Excluir Patrimônio" className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                          <Trash2 size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {filteredPatrimonioItems.length === 0 && (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-slate-500">
                        Nenhum item de patrimônio cadastrado. Clique em <strong>Novo Patrimônio</strong> para adicionar equipamentos, mobiliário ou ativos duráveis.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Kits List */}
      {activeTab === 'kits' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <BriefcaseMedical className="text-emerald-600" size={20} />
                Kits de Distribuição
              </h2>
              <Link
                to="/nutrition/finance?tab=planning"
                className="inline-flex items-center gap-2 text-xs font-black text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-3.5 py-2 rounded-xl border border-indigo-200 transition-colors w-fit"
              >
                <ShoppingCart size={14} />
                Previsão de Compras Mensais & Saldo &rarr;
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredKits.map(kit => {
                const cost = calculateKitCost(kit);

                return (
                  <div key={kit.id} className="bg-slate-50 rounded-2xl p-6 border border-slate-200 flex flex-col group hover:shadow-md transition-all">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="font-bold text-slate-800 text-lg">{kit.name}</h3>
                        {kit.description && <p className="text-sm text-slate-500 mt-1">{kit.description}</p>}
                      </div>
                      <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => openKitModal(kit)} 
                          className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                          title="Editar Kit"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button 
                          onClick={() => handleDeleteKit(kit.id)} 
                          className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                          title="Excluir Kit"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                    <div className="space-y-3 mt-2 flex-grow">
                      <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">Itens do Kit</h4>
                      {[...kit.items].sort((a, b) => {
                        const itemA = items.find(i => i.id === a.item_id);
                        const itemB = items.find(i => i.id === b.item_id);
                        if (!itemA || !itemB) return 0;
                        return itemA.name.localeCompare(itemB.name);
                      }).map(ki => {
                        const item = items.find(i => i.id === ki.item_id);
                        if (!item) return null;

                        const itemPrice = item.purchase_price;
                        const itemCurr = item.currency || 'MZN';
                        const priceMzn = itemPrice !== undefined && itemPrice !== null
                          ? (itemCurr === 'BRL' ? convertBrlToMzn(itemPrice, mznRate) : itemPrice)
                          : null;
                        const subtotalMzn = priceMzn !== null ? priceMzn * ki.quantity : null;

                        return (
                          <div key={ki.item_id} className="flex justify-between items-center text-sm border-b border-slate-200/50 pb-2 last:border-0 last:pb-0">
                            <span className="text-slate-700 font-medium">{item.name}</span>
                            <div className="flex items-center gap-2">
                              <span className="bg-white px-2 py-1 rounded-md text-slate-600 border border-slate-100 font-bold text-xs">
                                {ki.quantity} {item.unit}
                              </span>
                              {subtotalMzn !== null ? (
                                <div className="text-right">
                                  <span className="text-xs font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100/80 inline-block">
                                    {subtotalMzn.toFixed(2)} MT
                                  </span>
                                  {priceMzn !== null && ki.quantity > 1 && (
                                    <span className="text-[10px] text-slate-400 block mt-0.5">
                                      ({priceMzn.toFixed(2)} MT/{item.unit})
                                    </span>
                                  )}
                                </div>
                              ) : (
                                <span className="text-[10px] text-slate-400 italic">sem valor</span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Custo Total do Kit */}
                    <div className="mt-4 pt-3 border-t border-slate-200/80 flex items-center justify-between bg-white/70 p-3 rounded-xl border border-slate-200/40">
                      <div>
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Custo Total do Kit</span>
                        {cost.hasMissingPrice && (
                          <span className="text-[10px] text-amber-600 flex items-center gap-1 font-medium mt-0.5">
                            <AlertCircle size={10} /> Item sem preço
                          </span>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="text-base font-black text-emerald-700">
                          {cost.totalMzn.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} MT
                        </div>
                        <div className="text-xs font-medium text-slate-500">
                          ≈ R$ {cost.totalBrl.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* History List - Entradas e Valores de Produtos */}
      {activeTab === 'history' && (
        <div className="space-y-4 animate-in fade-in duration-300">
          {/* Quick Metrics for Inflow */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <ArrowDownToLine size={14} className="text-emerald-600" /> Total de Entradas
              </span>
              <span className="text-2xl font-bold text-slate-800 mt-1">{inflowStats.count}</span>
              <span className="text-[11px] text-slate-500 mt-0.5">Compras e chegadas registradas</span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Package size={14} className="text-blue-600" /> Quantidade Adquirida
              </span>
              <span className="text-2xl font-bold text-slate-800 mt-1">{inflowStats.totalUnits}</span>
              <span className="text-[11px] text-slate-500 mt-0.5">Unidades totais registradas</span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col">
              <span className="text-xs font-semibold text-emerald-600 uppercase tracking-wider flex items-center gap-1.5">
                <DollarSign size={14} /> Valor Total Investido
              </span>
              <span className="text-xl font-bold text-slate-800 mt-1">
                MT {inflowStats.totalSpentMzn.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              <span className="text-[11px] text-slate-500 mt-0.5">
                ≈ R$ {inflowStats.totalSpentBrl.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/50 border-b border-slate-100">
                    <th className="p-4 font-medium text-slate-500 text-sm">Data / Hora</th>
                    <th className="p-4 font-medium text-slate-500 text-sm">Item / Produto</th>
                    <th className="p-4 font-medium text-slate-500 text-sm">Categoria</th>
                    <th className="p-4 font-medium text-slate-500 text-sm text-center">Qtd Recebida</th>
                    <th className="p-4 font-medium text-slate-500 text-sm">Valor Unitário</th>
                    <th className="p-4 font-medium text-slate-500 text-sm">Valor Total</th>
                    <th className="p-4 font-medium text-slate-500 text-sm">Fornecedor / Observação</th>
                    <th className="p-4 font-medium text-slate-500 text-sm text-right">Histórico do Item</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredInflowTransactions.map(t => {
                    const item = items.find(i => i.id === t.item_id);
                    const unitPrice = t.price !== undefined && t.price !== null ? t.price : item?.purchase_price;
                    const totalPrice = unitPrice ? unitPrice * t.quantity : null;
                    const totalBrl = totalPrice ? convertMznToBrl(totalPrice, mznRate) : null;

                    return (
                      <tr key={t.id} className="hover:bg-slate-50/50 transition-colors group">
                        <td className="p-4 text-slate-600 font-medium text-sm whitespace-nowrap">
                          {new Date(t.date).toLocaleDateString('pt-BR')} {new Date(t.date).toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})}
                        </td>
                        <td className="p-4 text-slate-900 font-bold text-sm">
                          <button
                            type="button"
                            onClick={() => item && setHistoryModalItem(item)}
                            className="text-left hover:text-emerald-600 transition-colors flex items-center gap-1.5"
                          >
                            <span>{item ? item.name : 'Item Removido'}</span>
                            {item?.is_patrimonio && (
                              <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-mono font-bold">
                                {item.patrimony_number || 'Patrimônio'}
                              </span>
                            )}
                          </button>
                        </td>
                        <td className="p-4 text-slate-600 text-xs">
                          {item ? (
                            <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded-md font-medium">
                              {item.category}
                            </span>
                          ) : '--'}
                        </td>
                        <td className="p-4 text-center">
                          <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-lg font-bold text-xs border border-emerald-100">
                            +{t.quantity} {item?.unit || 'un'}
                          </span>
                        </td>
                        <td className="p-4 text-slate-700 font-medium text-sm whitespace-nowrap">
                          {unitPrice !== undefined && unitPrice !== null ? (
                            <span>{unitPrice.toFixed(2)} MT</span>
                          ) : (
                            <span className="text-slate-400 italic text-xs">Sem valor</span>
                          )}
                        </td>
                        <td className="p-4 whitespace-nowrap">
                          {totalPrice !== null ? (
                            <div>
                              <span className="font-bold text-emerald-700 text-sm block">
                                {totalPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} MT
                              </span>
                              {totalBrl !== null && (
                                <span className="text-[11px] text-slate-400 block">
                                  ≈ R$ {totalBrl.toFixed(2)}
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-slate-400 italic text-xs">--</span>
                          )}
                        </td>
                        <td className="p-4 text-slate-600 text-sm max-w-xs truncate" title={t.reason}>
                          {t.reason || '--'}
                        </td>
                        <td className="p-4 text-right">
                          {item && (
                            <button
                              type="button"
                              onClick={() => setHistoryModalItem(item)}
                              title="Ver histórico de valores deste produto"
                              className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors inline-flex items-center gap-1 text-xs font-semibold"
                            >
                              <History size={16} />
                              <span className="hidden lg:inline">Valores</span>
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                  {filteredInflowTransactions.length === 0 && (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-slate-500">
                        Nenhuma entrada de mercadoria registrada no histórico.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Item Modal */}
      {isItemModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                {isPatrimonio ? <Landmark size={24} className="text-emerald-600" /> : <Package size={24} className="text-emerald-600" />}
                {editingItem 
                  ? (isPatrimonio ? 'Editar Item de Patrimônio' : 'Editar Insumo') 
                  : (isPatrimonio ? 'Novo Item de Patrimônio' : 'Novo Insumo')}
              </h2>
              <button onClick={() => setIsItemModalOpen(false)} className="p-2 text-slate-400 hover:bg-slate-200 rounded-xl transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto max-h-[75vh]">
              {/* Type Switcher */}
              <div className="p-1 bg-slate-100 rounded-xl flex gap-1 mb-5">
                <button
                  type="button"
                  onClick={() => setIsPatrimonio(false)}
                  className={`flex-1 py-2 px-3 rounded-lg text-xs sm:text-sm font-semibold flex items-center justify-center gap-1.5 transition-all ${
                    !isPatrimonio ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <Package size={15} />
                  <span>Insumo / Consumo</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsPatrimonio(true);
                    if (!quantity || quantity === '0') setQuantity('1');
                    if (!unit) setUnit('un');
                  }}
                  className={`flex-1 py-2 px-3 rounded-lg text-xs sm:text-sm font-semibold flex items-center justify-center gap-1.5 transition-all ${
                    isPatrimonio ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <Landmark size={15} />
                  <span>Item de Patrimônio</span>
                </button>
              </div>

              <form id="inventory-form" onSubmit={handleSaveItem} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-700">
                    {isPatrimonio ? 'Nome do Bem / Equipamento *' : 'Nome do Item *'}
                  </label>
                  <input 
                    required 
                    type="text" 
                    placeholder={isPatrimonio ? "Ex: Balança Digital Pediátrica, Estetoscópio, Computador" : "Ex: Amoxicilina 250mg, Plumpy'Nut"}
                    value={name} 
                    onChange={e => setName(e.target.value)} 
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none text-sm" 
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-700">Categoria *</label>
                  <select 
                    value={category} 
                    onChange={(e) => setCategory(e.target.value)} 
                    required 
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none text-sm"
                  >
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.name}>{cat.name}</option>
                    ))}
                  </select>
                </div>

                {/* Patrimônio Specific Fields */}
                {isPatrimonio ? (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-sm font-medium text-slate-700">Nº de Tombamento / Plaqueta</label>
                        <input 
                          type="text" 
                          placeholder="Ex: PAT-001, BAL-04" 
                          value={patrimonyNumber} 
                          onChange={e => setPatrimonyNumber(e.target.value)} 
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none text-sm font-mono" 
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-sm font-medium text-slate-700">Localização / Setor</label>
                        <input 
                          type="text" 
                          placeholder="Ex: Consultório 1, Triagem, Galpão" 
                          value={location} 
                          onChange={e => setLocation(e.target.value)} 
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none text-sm" 
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-sm font-medium text-slate-700">Quantidade *</label>
                        <input 
                          required 
                          type="number" 
                          min="1"
                          value={quantity} 
                          onChange={e => setQuantity(e.target.value)} 
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none text-sm" 
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-sm font-medium text-slate-700">Unidade *</label>
                        <input 
                          required 
                          type="text" 
                          placeholder="Ex: unidades, peças" 
                          value={unit} 
                          onChange={e => setUnit(e.target.value)} 
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none text-sm" 
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-sm font-medium text-slate-700">Estado de Conservação</label>
                        <select 
                          value={condition} 
                          onChange={e => setCondition(e.target.value as any)} 
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none text-sm"
                        >
                          <option value="novo">Novo</option>
                          <option value="bom">Bom (Em uso)</option>
                          <option value="regular">Regular</option>
                          <option value="manutencao">Em Manutenção</option>
                          <option value="danificado">Danificado / Baixa</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Valor de Aquisição</label>
                        <div className="relative">
                          <select
                            value={currency}
                            onChange={(e) => setCurrency(e.target.value as 'MZN' | 'BRL')}
                            className="absolute left-0 top-0 bottom-0 px-3 py-2 bg-slate-100 border border-slate-200 rounded-l-xl text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                          >
                            <option value="MZN">MZN</option>
                            <option value="BRL">R$</option>
                          </select>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={purchasePrice}
                            onChange={(e) => setPurchasePrice(e.target.value)}
                            className="w-full pl-24 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                            placeholder="0.00"
                          />
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  /* Consumable Fields */
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-sm font-medium text-slate-700">Quantidade Atual *</label>
                        <input 
                          required 
                          type="number" 
                          value={quantity} 
                          onChange={e => setQuantity(e.target.value)} 
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none text-sm" 
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-sm font-medium text-slate-700">Unidade *</label>
                        <input 
                          required 
                          type="text" 
                          placeholder="Ex: caixas, frascos" 
                          value={unit} 
                          onChange={e => setUnit(e.target.value)} 
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none text-sm" 
                        />
                      </div>
                    </div>

                    {/* Forma Farmacêutica / Unidades por Embalagem */}
                    <div className="p-4 bg-slate-50/80 rounded-2xl border border-slate-200 space-y-3">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                          <BriefcaseMedical size={15} className="text-emerald-600" />
                          Apresentação do Medicamento
                        </label>
                        <span className="text-[10px] font-medium text-slate-400">Previsão de reposição (caixa/frasco)</span>
                      </div>

                      <div className="grid grid-cols-3 gap-2">
                        <button
                          type="button"
                          onClick={() => setDosageForm('outro')}
                          className={`py-2 px-2.5 rounded-xl text-xs font-bold border transition-all text-center cursor-pointer ${
                            dosageForm === 'outro'
                              ? 'bg-white text-slate-800 border-slate-300 shadow-xs'
                              : 'bg-slate-100/70 text-slate-500 border-transparent hover:text-slate-800'
                          }`}
                        >
                          Outro / Insumo
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setDosageForm('comprimido');
                            if (!unit || unit === 'un') setUnit('caixas');
                          }}
                          className={`py-2 px-2.5 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-1 cursor-pointer ${
                            dosageForm === 'comprimido'
                              ? 'bg-indigo-50 text-indigo-700 border-indigo-200 shadow-xs'
                              : 'bg-slate-100/70 text-slate-500 border-transparent hover:text-slate-800'
                          }`}
                        >
                          💊 Comprimido
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setDosageForm('liquido');
                            if (!unit || unit === 'un') setUnit('frascos');
                          }}
                          className={`py-2 px-2.5 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-1 cursor-pointer ${
                            dosageForm === 'liquido'
                              ? 'bg-cyan-50 text-cyan-700 border-cyan-200 shadow-xs'
                              : 'bg-slate-100/70 text-slate-500 border-transparent hover:text-slate-800'
                          }`}
                        >
                          🧴 Líquido
                        </button>
                      </div>

                      {dosageForm === 'comprimido' && (
                        <div className="pt-1 space-y-1 animate-in fade-in duration-200">
                          <label className="text-xs font-bold text-indigo-950 block">
                            Quantidade de Comprimidos por Caixa *
                          </label>
                          <div className="relative">
                            <input
                              type="number"
                              min="1"
                              required={dosageForm === 'comprimido'}
                              placeholder="Ex: 30"
                              value={packageUnits}
                              onChange={e => setPackageUnits(e.target.value)}
                              className="w-full bg-white border border-indigo-200 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none font-medium"
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-indigo-500 font-bold">
                              comprimidos/caixa
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 leading-tight">
                            Com base nessa quantidade, o sistema calcula quando a criança vai precisar receber uma nova caixa conforme os comprimidos que toma por dia.
                          </p>
                        </div>
                      )}

                      {dosageForm === 'liquido' && (
                        <div className="pt-1 space-y-1 animate-in fade-in duration-200">
                          <label className="text-xs font-bold text-cyan-950 block">
                            Volume Total do Frasco (ml) *
                          </label>
                          <div className="relative">
                            <input
                              type="number"
                              min="1"
                              step="0.1"
                              required={dosageForm === 'liquido'}
                              placeholder="Ex: 100"
                              value={liquidVolumeMl}
                              onChange={e => setLiquidVolumeMl(e.target.value)}
                              className="w-full bg-white border border-cyan-200 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 outline-none font-medium"
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-cyan-600 font-bold">
                              ml/frasco
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 leading-tight">
                            Com base nesse volume em ml, o sistema calcula quando a criança deve receber outro frasco dependendo de quantos ml toma ao dia.
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-sm font-medium text-slate-700">Estoque Mínimo</label>
                        <input 
                          type="number" 
                          value={minQuantity} 
                          onChange={e => setMinQuantity(e.target.value)} 
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none text-sm" 
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-sm font-medium text-slate-700">Data de Validade</label>
                        <input 
                          type="date" 
                          value={expirationDate} 
                          onChange={e => setExpirationDate(e.target.value)} 
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none text-sm" 
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                          Preço Unitário de Custo <span className="text-xs text-slate-400 font-normal">(por {unit || 'unidade'})</span>
                        </label>
                        <div className="relative">
                          <select
                            value={currency}
                            onChange={(e) => setCurrency(e.target.value as 'MZN' | 'BRL')}
                            className="absolute left-0 top-0 bottom-0 px-3 py-2 bg-slate-100 border border-slate-200 rounded-l-xl text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                          >
                            <option value="MZN">MZN</option>
                            <option value="BRL">R$</option>
                          </select>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={purchasePrice}
                            onChange={(e) => setPurchasePrice(e.target.value)}
                            className="w-full pl-24 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                            placeholder="0.00"
                          />
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3 pt-2">
                      <input 
                        type="checkbox" 
                        id="internalUse" 
                        checked={internalUse} 
                        onChange={e => setInternalUse(e.target.checked)} 
                        className="w-5 h-5 rounded-md border-slate-300 text-emerald-600 focus:ring-emerald-500" 
                      />
                      <label htmlFor="internalUse" className="text-sm font-medium text-slate-700 cursor-pointer">
                        Item de Uso Interno <span className="text-slate-400 font-normal">(não aparece para médicos prescreverem)</span>
                      </label>
                    </div>
                  </>
                )}
              </form>
            </div>

            <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
              <button onClick={() => setIsItemModalOpen(false)} className="px-6 py-2.5 rounded-xl font-medium text-slate-600 hover:bg-slate-200 transition-colors text-sm">
                Cancelar
              </button>
              <button type="submit" form="inventory-form" className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2.5 rounded-xl font-medium transition-colors shadow-sm text-sm">
                {isPatrimonio ? 'Salvar Patrimônio' : 'Salvar Item'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Transaction Modal */}
      {transactionModal.isOpen && transactionModal.item && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            <div className={`p-6 border-b border-slate-100 flex items-center justify-between ${transactionModal.type === 'in' ? 'bg-emerald-50' : 'bg-amber-50'}`}>
              <h2 className={`text-xl font-bold flex items-center gap-2 ${transactionModal.type === 'in' ? 'text-emerald-800' : 'text-amber-800'}`}>
                {transactionModal.type === 'in' ? <ArrowDownToLine size={24} /> : <ArrowUpFromLine size={24} />}
                {transactionModal.type === 'in' ? 'Registrar Entrada no Estoque' : 'Registrar Retirada'}
              </h2>
              <button 
                type="button" 
                onClick={() => setTransactionModal({isOpen: false, type: 'in', item: null})} 
                className="p-2 text-slate-400 hover:bg-white/50 rounded-xl transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1">
              <div className="mb-5 p-4 bg-slate-50 rounded-xl border border-slate-100 flex justify-between items-center">
                <div>
                  <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Item Selecionado</p>
                  <p className="font-bold text-slate-900 text-base">{transactionModal.item.name}</p>
                  <p className="text-xs text-slate-500 mt-0.5">Categoria: {transactionModal.item.category}</p>
                </div>
                <div className="text-right">
                  <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold block">Estoque Atual</span>
                  <span className="text-lg font-black text-slate-800">{transactionModal.item.quantity} {transactionModal.item.unit}</span>
                </div>
              </div>

              <form id="transaction-form" onSubmit={handleSaveTransaction} className="space-y-4">
                {/* Quantidade */}
                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-700">Quantidade ({transactionModal.item.unit}) *</label>
                  <input 
                    required 
                    type="number" 
                    min="1" 
                    value={transQuantity} 
                    onChange={e => handleQuantityChange(e.target.value)} 
                    placeholder="Ex: 50"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none text-base font-semibold" 
                  />
                </div>

                {transactionModal.type === 'in' && (
                  <>
                    {/* Seletor de Moeda */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Moeda do Pagamento</label>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setTransCurrency('MZN')}
                          className={`py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 border transition-all ${
                            transCurrency === 'MZN'
                              ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                              : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          <span>🇲🇿 MZN (Metical)</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setTransCurrency('BRL')}
                          className={`py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 border transition-all ${
                            transCurrency === 'BRL'
                              ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                              : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          <span>🇧🇷 BRL (Real)</span>
                        </button>
                      </div>
                    </div>

                    {/* Preço Unitário e Valor Total (Cálculo Bidirecional) */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-700">Preço Unitário ({transCurrency === 'MZN' ? 'MT' : 'R$'})</label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                            {transCurrency === 'MZN' ? 'MT' : 'R$'}
                          </span>
                          <input 
                            type="number" 
                            step="0.01" 
                            value={transUnitPrice} 
                            onChange={e => handleUnitPriceChange(e.target.value)} 
                            className="w-full pl-10 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none text-sm font-medium" 
                            placeholder="0.00" 
                          />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-700">Valor Total Pago</label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                            {transCurrency === 'MZN' ? 'MT' : 'R$'}
                          </span>
                          <input 
                            type="number" 
                            step="0.01" 
                            value={transTotalPrice} 
                            onChange={e => handleTotalPriceChange(e.target.value)} 
                            className="w-full pl-10 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none text-sm font-bold text-emerald-800" 
                            placeholder="0.00" 
                          />
                        </div>
                      </div>
                    </div>

                    {/* Resumo de Câmbio / Conversão */}
                    {transCurrency === 'MZN' && parseFloat(transTotalPrice) > 0 && (
                      <div className="p-3 bg-amber-50/70 border border-amber-200/70 rounded-xl flex items-center justify-between text-xs">
                        <span className="text-amber-800 font-medium">Conversão automática para Real:</span>
                        <span className="font-bold text-amber-900">
                          ≈ R$ {convertMznToBrl(parseFloat(transTotalPrice), mznRate).toFixed(2)}
                          <span className="font-normal text-[10px] text-amber-700 ml-1.5">(1 MT = R$ {mznRate})</span>
                        </span>
                      </div>
                    )}

                    {/* Integração Financeira */}
                    <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                      <label className="flex items-center gap-2 cursor-pointer select-none">
                        <input 
                          type="checkbox" 
                          checked={integrateFinance} 
                          onChange={e => setIntegrateFinance(e.target.checked)} 
                          className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300" 
                        />
                        <div>
                          <span className="text-xs font-bold text-slate-800 block">Lançar no Financeiro da Nutrição</span>
                          <span className="text-[11px] text-slate-500 block">Cria automaticamente a despesa de saída da Casa Nutri</span>
                        </div>
                      </label>

                      {integrateFinance && financeCategories.length > 0 && (
                        <div className="pt-2 border-t border-slate-200/70">
                          <label className="text-[11px] font-semibold text-slate-600 block mb-1">Categoria Financeira</label>
                          <select
                            value={transFinanceCat}
                            onChange={e => setTransFinanceCat(e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs outline-none focus:border-emerald-500 font-medium"
                          >
                            {financeCategories.map(cat => (
                              <option key={cat.id} value={cat.id}>{cat.name}</option>
                            ))}
                          </select>
                        </div>
                      )}
                    </div>
                  </>
                )}

                {/* Motivo / Notas */}
                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-700">
                    {transactionModal.type === 'in' ? 'Fornecedor / Observação (Opcional)' : 'Motivo / Observação *'}
                  </label>
                  <input 
                    type="text" 
                    required={transactionModal.type === 'out'}
                    value={transNotes} 
                    onChange={e => setTransNotes(e.target.value)} 
                    placeholder={transactionModal.type === 'in' ? "Ex: Mercado Municipal de Boane, nota 124..." : "Ex: Entrega para família, descarte..."} 
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none text-sm" 
                  />
                </div>
              </form>
            </div>

            <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
              <button 
                type="button"
                disabled={isSavingTrans}
                onClick={() => setTransactionModal({isOpen: false, type: 'in', item: null})} 
                className="px-5 py-2.5 rounded-xl font-medium text-slate-600 hover:bg-slate-200 transition-colors text-sm"
              >
                Cancelar
              </button>
              <button 
                type="submit" 
                form="transaction-form" 
                disabled={isSavingTrans}
                className={`px-6 py-2.5 rounded-xl font-medium text-white transition-colors shadow-sm flex items-center gap-2 text-sm ${
                  transactionModal.type === 'in' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-amber-600 hover:bg-amber-700'
                } ${isSavingTrans ? 'opacity-70 cursor-not-allowed' : ''}`}
              >
                {isSavingTrans ? (
                  <>
                    <RefreshCw size={16} className="animate-spin" />
                    Processando...
                  </>
                ) : (
                  <>
                    Confirmar {transactionModal.type === 'in' ? 'Entrada' : 'Retirada'}
                  </>
                )}
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

                {/* Banner de Custo Estimado do Kit no Modal */}
                {kitItems.length > 0 && (
                  <div className="bg-emerald-50/80 border border-emerald-200/80 rounded-xl p-3.5 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold text-xs">
                        MT
                      </div>
                      <div>
                        <span className="text-xs font-bold text-emerald-950 uppercase tracking-wider block">Custo Estimado do Kit</span>
                        <span className="text-[11px] text-emerald-700">Soma automática com base nos preços dos insumos</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-base font-black text-emerald-800">
                        {currentModalKitCost.totalMzn.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} MT
                      </div>
                      <div className="text-xs font-semibold text-emerald-600">
                        ≈ R$ {currentModalKitCost.totalBrl.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </div>
                    </div>
                  </div>
                )}

                <div>
                  <div className="flex justify-between items-center mb-4">
                    <label className="text-sm font-medium text-slate-700">Itens do Kit</label>
                    <button type="button" onClick={addKitItem} className="text-sm font-medium text-emerald-600 hover:text-emerald-700 flex items-center gap-1">
                      <Plus size={16} /> Adicionar Item
                    </button>
                  </div>
                  
                  <div className="space-y-3">
                    {kitItems.map((ki, index) => {
                      return (
                        <div key={index} className="flex gap-3 items-center p-3 bg-slate-50/50 rounded-xl border border-slate-100">
                          <div className="flex-1 min-w-[200px]">
                            <KitItemSelect 
                              items={items} 
                              categories={categories}
                              value={ki.item_id}
                              onChange={(val) => updateKitItem(index, 'item_id', val)}
                            />
                          </div>
                          <div className="w-24">
                            <input required type="number" min="1" placeholder="Qtd" value={ki.quantity} onChange={e => updateKitItem(index, 'quantity', parseInt(e.target.value) || 0)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none" />
                          </div>
                          <button type="button" onClick={() => removeKitItem(index)} className="p-2.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors">
                            <Trash2 size={20} />
                          </button>
                        </div>
                      );
                    })}
                    {kitItems.length === 0 && (
                      <div className="text-center p-4 border border-dashed border-slate-200 rounded-xl text-slate-500 text-sm">
                        Nenhum item adicionado ao kit.
                      </div>
                    )}
                  </div>
                </div>
              </form>
            </div>

            <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-between items-center gap-3">
              {editingKit ? (
                <button
                  type="button"
                  onClick={async () => {
                    const kitId = editingKit.id;
                    setIsKitModalOpen(false);
                    await handleDeleteKit(kitId);
                  }}
                  className="px-4 py-2.5 rounded-xl font-medium text-red-600 hover:bg-red-50 hover:border-red-200 border border-transparent transition-colors flex items-center gap-2 text-sm cursor-pointer"
                  title="Excluir este kit permanentemente"
                >
                  <Trash2 size={16} />
                  Excluir Kit
                </button>
              ) : (
                <div />
              )}
              <div className="flex items-center gap-3">
                <button onClick={() => setIsKitModalOpen(false)} className="px-6 py-2.5 rounded-xl font-medium text-slate-600 hover:bg-slate-200 transition-colors cursor-pointer">
                  Cancelar
                </button>
                <button type="submit" form="kit-form" className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2.5 rounded-xl font-medium transition-colors shadow-sm cursor-pointer">
                  Salvar Kit
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Quick Price Edit Modal (Permite definir preço unitário mesmo com estoque zerado) */}
      {quickPriceModalItem && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in duration-200">
            {/* Header */}
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-emerald-50/70">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-sm">
                  <DollarSign size={20} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Definir Preço Unitário
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    {quickPriceModalItem.name} • {quickPriceModalItem.category}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setQuickPriceModalItem(null)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-xl"
              >
                <X size={18} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSaveQuickPrice} className="p-6 space-y-4">
              {/* Status do estoque atual */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs">
                <span className="text-slate-600 font-medium">Saldo Físico Atual:</span>
                <span className={cn(
                  "font-black px-2 py-0.5 rounded-md",
                  quickPriceModalItem.quantity > 0 
                    ? "bg-emerald-100 text-emerald-800" 
                    : "bg-red-100 text-red-800"
                )}>
                  {quickPriceModalItem.quantity} {quickPriceModalItem.unit || 'un'} {quickPriceModalItem.quantity === 0 ? '(Zerado)' : ''}
                </span>
              </div>

              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 leading-relaxed">
                Mesmo que o produto esteja <strong>sem estoque (zerado)</strong>, definir o valor unitário permite que o sistema calcule a previsão de custos mensais da Casa Nutri e o valor exato dos kits.
              </div>

              {/* Preço Unitário */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                  Preço Unitário de Custo (por {quickPriceModalItem.unit || 'unidade'}) *
                </label>
                <div className="relative">
                  <select
                    value={quickPriceCurr}
                    onChange={e => setQuickPriceCurr(e.target.value as 'MZN' | 'BRL')}
                    className="absolute left-0 top-0 bottom-0 px-3 bg-slate-100 border border-slate-200 rounded-l-xl text-sm font-bold text-slate-700 outline-none"
                  >
                    <option value="MZN">MT</option>
                    <option value="BRL">R$</option>
                  </select>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    autoFocus
                    placeholder="0.00"
                    value={quickPriceVal}
                    onChange={e => setQuickPriceVal(e.target.value)}
                    className="w-full pl-20 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-base font-black text-slate-900 outline-none focus:border-emerald-500 focus:bg-white"
                  />
                </div>
              </div>

              {/* Conversão em Real se for MZN */}
              {quickPriceCurr === 'MZN' && parseFloat(quickPriceVal) > 0 && (
                <div className="text-right text-xs text-slate-400 font-medium">
                  ≈ R$ {convertMznToBrl(parseFloat(quickPriceVal), mznRate).toFixed(2)} por {quickPriceModalItem.unit || 'un'}
                </div>
              )}

              {/* Calculadora de Lote / Fardo Auxiliar */}
              <div className="pt-3 border-t border-slate-100">
                <details className="group/calc text-xs">
                  <summary className="font-bold text-indigo-600 hover:text-indigo-700 cursor-pointer flex items-center gap-1 select-none">
                    <Calculator size={13} />
                    <span>Comprou fardo ou pacote fechado? Calcular unitário</span>
                  </summary>
                  <div className="mt-3 p-3 bg-indigo-50/60 border border-indigo-100 rounded-xl space-y-2.5">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <span className="text-[10px] font-bold text-indigo-900 block mb-1">Total Pago ({quickPriceCurr === 'BRL' ? 'R$' : 'MT'})</span>
                        <input
                          type="number"
                          step="0.01"
                          placeholder="Ex: 1200"
                          value={calcBatchTotal}
                          onChange={e => setCalcBatchTotal(e.target.value)}
                          className="w-full bg-white border border-indigo-200 rounded-lg px-2.5 py-1.5 text-xs font-bold outline-none"
                        />
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-indigo-900 block mb-1">Qtd no Pacote ({quickPriceModalItem.unit || 'un'})</span>
                        <input
                          type="number"
                          step="0.01"
                          placeholder="Ex: 24"
                          value={calcBatchQty}
                          onChange={e => setCalcBatchQty(e.target.value)}
                          className="w-full bg-white border border-indigo-200 rounded-lg px-2.5 py-1.5 text-xs font-bold outline-none"
                        />
                      </div>
                    </div>
                    {parseFloat(calcBatchTotal) > 0 && parseFloat(calcBatchQty) > 0 && (
                      <div className="flex items-center justify-between pt-1">
                        <span className="text-xs text-indigo-900 font-bold">
                          = {(parseFloat(calcBatchTotal) / parseFloat(calcBatchQty)).toFixed(2)} {quickPriceCurr === 'BRL' ? 'R$' : 'MT'}/{quickPriceModalItem.unit || 'un'}
                        </span>
                        <button
                          type="button"
                          onClick={handleCalcApply}
                          className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md text-[11px] font-bold transition-colors"
                        >
                          Aplicar
                        </button>
                      </div>
                    )}
                  </div>
                </details>
              </div>

              {/* Botões */}
              <div className="pt-4 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setQuickPriceModalItem(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSavingQuickPrice || !quickPriceVal}
                  className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white px-5 py-2 rounded-xl text-xs font-bold transition-colors shadow-sm flex items-center gap-1.5"
                >
                  <Check size={14} />
                  {isSavingQuickPrice ? 'Salvando...' : 'Salvar Preço'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Item Cost History Modal */}
      {historyModalItem && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in duration-200">
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-3">
                <span className="p-2.5 bg-emerald-100 text-emerald-700 rounded-xl">
                  <History size={22} />
                </span>
                <div>
                  <h2 className="text-xl font-bold text-slate-800">
                    Histórico de Custos e Entradas
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {historyModalItem.name} • <span className="font-semibold text-slate-700">{historyModalItem.category}</span> • Estoque atual: <span className="font-semibold text-emerald-700">{historyModalItem.quantity} {historyModalItem.unit}</span>
                  </p>
                </div>
              </div>
              <button 
                type="button"
                onClick={() => setHistoryModalItem(null)} 
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 rounded-xl transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto flex-1 space-y-6">
              {(() => {
                const itemInflows = transactions
                  .filter(t => t.item_id === historyModalItem.id && t.type === 'in')
                  .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
                
                const totalQtyPurchased = itemInflows.reduce((acc, t) => acc + t.quantity, 0);
                const totalSpent = itemInflows.reduce((acc, t) => acc + (t.quantity * (t.price || 0)), 0);
                const avgPrice = totalQtyPurchased > 0 ? (totalSpent / totalQtyPurchased) : (historyModalItem.purchase_price || 0);
                const lastPurchase = itemInflows[0];
                const curr = historyModalItem.currency || 'MZN';

                return (
                  <>
                    {/* KPI Cards */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Estoque Atual</span>
                        <p className="text-xl font-black text-slate-800 mt-1">
                          {historyModalItem.quantity} <span className="text-sm font-medium text-slate-500">{historyModalItem.unit}</span>
                        </p>
                      </div>
                      <div className="p-4 bg-emerald-50/60 rounded-xl border border-emerald-100">
                        <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider block">Último Preço</span>
                        <p className="text-xl font-black text-emerald-800 mt-1">
                          {lastPurchase?.price !== undefined
                            ? `${lastPurchase.price.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${curr}` 
                            : (historyModalItem.purchase_price !== undefined
                                ? `${historyModalItem.purchase_price.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${curr}` 
                                : '--')}
                        </p>
                      </div>
                      <div className="p-4 bg-blue-50/60 rounded-xl border border-blue-100">
                        <span className="text-[11px] font-bold text-blue-700 uppercase tracking-wider block">Preço Médio</span>
                        <p className="text-xl font-black text-blue-800 mt-1">
                          {avgPrice > 0 
                            ? `${avgPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${curr}` 
                            : '--'}
                        </p>
                      </div>
                      <div className="p-4 bg-purple-50/60 rounded-xl border border-purple-100">
                        <span className="text-[11px] font-bold text-purple-700 uppercase tracking-wider block">Total Investido</span>
                        <p className="text-xl font-black text-purple-800 mt-1">
                          {totalSpent.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {curr}
                        </p>
                        {curr === 'MZN' && totalSpent > 0 && (
                          <span className="text-[10px] text-purple-600 block mt-0.5">
                            ≈ R$ {convertMznToBrl(totalSpent, mznRate).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Table of Entries */}
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
                          Registros de Entrada e Compras ({itemInflows.length})
                        </h3>
                        <button
                          type="button"
                          onClick={() => {
                            const itemToOpen = historyModalItem;
                            setHistoryModalItem(null);
                            openTransactionModal(itemToOpen, 'in');
                          }}
                          className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200/50 hover:bg-emerald-100/60 transition-colors"
                        >
                          <Plus size={14} /> Registrar Nova Entrada
                        </button>
                      </div>

                      {itemInflows.length === 0 ? (
                        <div className="text-center py-10 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                          <Receipt size={32} className="mx-auto text-slate-300 mb-2" />
                          <p className="text-sm font-semibold text-slate-700">Nenhuma entrada com valor registrada ainda</p>
                          <p className="text-xs text-slate-500 mt-1">
                            Você pode registrar uma entrada com preço para iniciar o histórico deste item.
                          </p>
                        </div>
                      ) : (
                        <div className="border border-slate-200/80 rounded-xl overflow-hidden shadow-sm">
                          <table className="w-full text-left border-collapse text-sm">
                            <thead>
                              <tr className="bg-slate-50 border-b border-slate-100 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                <th className="p-3">Data</th>
                                <th className="p-3 text-center">Quantidade</th>
                                <th className="p-3 text-right">Preço Un.</th>
                                <th className="p-3 text-right">Total Pago</th>
                                <th className="p-3">Observações / Fornecedor</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {itemInflows.map(t => {
                                const unitPrice = t.price || 0;
                                const totalPaid = unitPrice * t.quantity;
                                return (
                                  <tr key={t.id} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="p-3 text-slate-600 whitespace-nowrap">
                                      <span className="font-medium text-slate-900">
                                        {new Date(t.date).toLocaleDateString('pt-BR')}
                                      </span>
                                      <span className="text-xs text-slate-400 block">
                                        {new Date(t.date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                      </span>
                                    </td>
                                    <td className="p-3 text-center font-bold text-emerald-700 whitespace-nowrap">
                                      +{t.quantity} {historyModalItem.unit}
                                    </td>
                                    <td className="p-3 text-right font-medium text-slate-700 whitespace-nowrap">
                                      {unitPrice > 0 
                                        ? `${unitPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${curr}` 
                                        : '-'}
                                    </td>
                                    <td className="p-3 text-right font-bold text-slate-900 whitespace-nowrap">
                                      {totalPaid > 0 ? (
                                        <>
                                          <span>{totalPaid.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {curr}</span>
                                          {curr === 'MZN' && (
                                            <span className="text-[10px] text-slate-400 block font-normal">
                                              ≈ R$ {convertMznToBrl(totalPaid, mznRate).toFixed(2)}
                                            </span>
                                          )}
                                        </>
                                      ) : '-'}
                                    </td>
                                    <td className="p-3 text-slate-600 text-xs">
                                      {t.reason || '--'}
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  </>
                );
              })()}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end">
              <button 
                type="button"
                onClick={() => setHistoryModalItem(null)} 
                className="px-6 py-2 rounded-xl font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-100 transition-colors text-sm"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-5 py-3.5 rounded-2xl shadow-2xl flex items-center gap-3 border border-slate-700 animate-in slide-in-from-bottom-5">
          <CheckCircle2 size={20} className="text-emerald-400 shrink-0" />
          <span className="text-sm font-medium">{toastMessage}</span>
          <button 
            type="button"
            onClick={() => setToastMessage(null)} 
            className="p-1 text-slate-400 hover:text-white rounded-lg transition-colors ml-2"
          >
            <X size={16} />
          </button>
        </div>
      )}
    </div>
  );
}
