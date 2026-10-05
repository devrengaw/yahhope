import React, { useState, useEffect, useMemo } from 'react';
import { 
  ShoppingCart, 
  Package, 
  AlertCircle, 
  CheckCircle2, 
  TrendingUp, 
  DollarSign, 
  Calendar, 
  RefreshCw, 
  ArrowRight, 
  Plus, 
  Minus, 
  Layers, 
  Check, 
  Edit2, 
  ShieldCheck, 
  Sparkles, 
  ChevronRight, 
  HelpCircle,
  X,
  Repeat,
  Receipt
} from 'lucide-react';
import { useInventory } from '../../contexts/InventoryContext';
import { usePatients } from '../../contexts/PatientContext';
import { supabase } from '../../lib/supabase';
import { getMznToBrlRate, convertMznToBrl, convertBrlToMzn } from '../../services/currencyService';
import { saveExpenseTransaction } from '../../services/financeTransactionService';
import { cn } from '../../lib/utils';
import { Kit } from '../../lib/mockData';

interface NutritionPurchasingPlannerProps {
  onRefreshFinance?: () => void;
}

export function NutritionPurchasingPlanner({ onRefreshFinance }: NutritionPurchasingPlannerProps) {
  const { items, kits, updateItem, addTransaction } = useInventory();
  const { patients } = usePatients();

  // Cotação do dia
  const [mznRate, setMznRate] = useState<number>(0.08103);
  useEffect(() => {
    getMznToBrlRate().then(res => setMznRate(res.rate));
  }, []);

  // Crianças ativas em monitoramento nutricional (DAM, DAG, Risco ou total com status clínico)
  const activeChildrenCount = useMemo(() => {
    const active = patients.filter(p => 
      p.status === 'DAM' || 
      p.status === 'DAG' || 
      p.status === 'Risco' ||
      p.status === 'Adequado'
    );
    return active.length > 0 ? active.length : patients.length;
  }, [patients]);

  // Kit selecionado para a previsão (por padrão o primeiro kit ou um com "nutri")
  const defaultKitId = useMemo(() => {
    if (kits.length === 0) return '';
    const nutriKit = kits.find(k => k.name.toLowerCase().includes('nutri') || k.name.toLowerCase().includes('padrão'));
    return nutriKit ? nutriKit.id : kits[0].id;
  }, [kits]);

  const [selectedKitId, setSelectedKitId] = useState<string>('');
  useEffect(() => {
    if (!selectedKitId && defaultKitId) {
      setSelectedKitId(defaultKitId);
    }
  }, [defaultKitId, selectedKitId]);

  // Quantidade de kits planejados para o mês
  const [targetKitsCount, setTargetKitsCount] = useState<number>(40);
  useEffect(() => {
    if (activeChildrenCount > 0 && targetKitsCount === 40) {
      setTargetKitsCount(activeChildrenCount);
    }
  }, [activeChildrenCount]);

  const currentKit = useMemo(() => {
    return kits.find(k => k.id === selectedKitId) || kits[0] || null;
  }, [kits, selectedKitId]);

  // Cálculo da Análise de Compras (Item a Item)
  const purchasingAnalysis = useMemo(() => {
    if (!currentKit || !currentKit.items) return [];

    return currentKit.items.map(ki => {
      const item = items.find(i => i.id === ki.item_id);
      const name = item ? item.name : 'Insumo Removido';
      const unit = item ? item.unit : 'un';
      const category = item ? item.category : 'Geral';
      const currentStock = item ? item.quantity : 0;
      
      const itemCurrency = item?.currency || 'MZN';
      const rawPrice = item?.purchase_price || 0;
      const unitPriceMzn = itemCurrency === 'BRL' ? convertBrlToMzn(rawPrice, mznRate) : rawPrice;

      // Demanda Bruta do Mês para este insumo
      const grossDemand = ki.quantity * targetKitsCount;

      // Necessidade Líquida a Comprar (descontando o que já tem em estoque)
      const netNeeded = Math.max(0, grossDemand - currentStock);

      // Valor do estoque remanescente que foi aproveitado
      const stockApplied = Math.min(currentStock, grossDemand);
      const stockValueSavedMzn = stockApplied * unitPriceMzn;

      // Custo líquido de compra para repor
      const netPurchaseCostMzn = netNeeded * unitPriceMzn;
      const netPurchaseCostBrl = convertMznToBrl(netPurchaseCostMzn, mznRate);

      // Custo bruto orçado (se comprasse 100% do zero)
      const grossBudgetMzn = grossDemand * unitPriceMzn;

      let status: 'sufficient' | 'partial' | 'empty' = 'empty';
      if (currentStock >= grossDemand) {
        status = 'sufficient';
      } else if (currentStock > 0) {
        status = 'partial';
      } else {
        status = 'empty';
      }

      return {
        itemId: ki.item_id,
        item,
        name,
        unit,
        category,
        qtyPerKit: ki.quantity,
        currentStock,
        grossDemand,
        netNeeded,
        stockApplied,
        unitPriceMzn,
        grossBudgetMzn,
        stockValueSavedMzn,
        netPurchaseCostMzn,
        netPurchaseCostBrl,
        status
      };
    });
  }, [currentKit, items, targetKitsCount, mznRate]);

  // Totais do Planejador
  const summary = useMemo(() => {
    let theoreticalBudgetMzn = 0; // Custo Teórico do Mês (Orçamento Estrutural)
    let stockSavingsMzn = 0;      // Economia gerada pelo saldo em estoque
    let netPurchaseMzn = 0;       // Quanto realmente precisa comprar

    purchasingAnalysis.forEach(row => {
      theoreticalBudgetMzn += row.grossBudgetMzn;
      stockSavingsMzn += row.stockValueSavedMzn;
      netPurchaseMzn += row.netPurchaseCostMzn;
    });

    const theoreticalBudgetBrl = convertMznToBrl(theoreticalBudgetMzn, mznRate);
    const stockSavingsBrl = convertMznToBrl(stockSavingsMzn, mznRate);
    const netPurchaseBrl = convertMznToBrl(netPurchaseMzn, mznRate);

    const itemsToBuyCount = purchasingAnalysis.filter(r => r.netNeeded > 0).length;
    const itemsSufficientCount = purchasingAnalysis.filter(r => r.status === 'sufficient').length;

    return {
      theoreticalBudgetMzn,
      theoreticalBudgetBrl,
      stockSavingsMzn,
      stockSavingsBrl,
      netPurchaseMzn,
      netPurchaseBrl,
      itemsToBuyCount,
      itemsSufficientCount
    };
  }, [purchasingAnalysis, mznRate]);

  // Modal de Efetivação de Compra
  const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);
  const [purchaseItems, setPurchaseItems] = useState<{
    itemId: string;
    name: string;
    unit: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
  }[]>([]);
  const [purchaseNotes, setPurchaseNotes] = useState('');
  const [isSavingPurchase, setIsSavingPurchase] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Inicializa a lista de compras para o modal
  const openPurchaseModal = () => {
    const toBuy = purchasingAnalysis
      .filter(r => r.netNeeded > 0)
      .map(r => ({
        itemId: r.itemId,
        name: r.name,
        unit: r.unit,
        quantity: r.netNeeded,
        unitPrice: r.unitPriceMzn,
        totalPrice: Number((r.netNeeded * r.unitPriceMzn).toFixed(2))
      }));
    setPurchaseItems(toBuy);
    setPurchaseNotes(`Compra de reposição mensal para ${targetKitsCount} kits da Casa Nutri`);
    setIsPurchaseModalOpen(true);
  };

  const handleUpdatePurchaseItem = (index: number, field: 'quantity' | 'unitPrice' | 'totalPrice', val: number) => {
    const next = [...purchaseItems];
    const item = { ...next[index], [field]: val };
    
    if (field === 'quantity') {
      item.totalPrice = Number((val * item.unitPrice).toFixed(2));
    } else if (field === 'unitPrice') {
      item.totalPrice = Number((item.quantity * val).toFixed(2));
    } else if (field === 'totalPrice') {
      item.unitPrice = item.quantity > 0 ? Number((val / item.quantity).toFixed(2)) : item.unitPrice;
    }

    next[index] = item;
    setPurchaseItems(next);
  };

  // Efetivação: Alimenta o estoque e lança a despesa
  const handleConfirmPurchase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (purchaseItems.length === 0) return;

    setIsSavingPurchase(true);
    try {
      let totalMznSpent = 0;

      // 1. Atualizar estoque de cada item comprado
      for (const pItem of purchaseItems) {
        if (pItem.quantity <= 0) continue;
        const currentInvItem = items.find(i => i.id === pItem.itemId);
        if (!currentInvItem) continue;

        const newQty = currentInvItem.quantity + pItem.quantity;
        updateItem(pItem.itemId, {
          quantity: newQty,
          purchase_price: pItem.unitPrice > 0 ? pItem.unitPrice : currentInvItem.purchase_price,
          currency: 'MZN'
        });

        addTransaction({
          item_id: pItem.itemId,
          type: 'in',
          quantity: pItem.quantity,
          price: pItem.unitPrice,
          reason: `Compra Mensal Casa Nutri: ${purchaseNotes} [MZN]`
        });

        totalMznSpent += pItem.totalPrice;
      }

      // 2. Registrar despesa no Financeiro da Nutrição
      if (totalMznSpent > 0) {
        const totalBrlSpent = convertMznToBrl(totalMznSpent, mznRate);
        await saveExpenseTransaction({
          description: `Compra de Insumos Casa Nutri (${targetKitsCount} kits)`,
          amount: totalBrlSpent,
          type: 'expense',
          category_id: '',
          date: new Date().toISOString().split('T')[0],
          status: 'completed',
          account: 'Caixa Moçambique',
          expense_type: 'variable',
          recurrence: 'none',
          module: 'nutrition',
          notes: `${purchaseNotes}. Total: ${totalMznSpent.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} MT (Câmbio: R$ ${mznRate})`.trim(),
          currency: 'MZN',
          original_amount: totalMznSpent,
          exchange_rate: mznRate
        }, 'nutrition');
      }

      setIsPurchaseModalOpen(false);
      setToastMessage(`Compra de ${totalMznSpent.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} MT efetivada com sucesso! Estoque abastecido e despesa registrada.`);
      onRefreshFinance?.();
      setTimeout(() => setToastMessage(null), 5000);
    } catch (err) {
      console.error('Erro ao efetivar compra de insumos:', err);
      alert('Erro ao registrar a compra de insumos.');
    } finally {
      setIsSavingPurchase(false);
    }
  };

  // Fixar Previsão no Orçamento Mensal
  const [isFixingBudget, setIsFixingBudget] = useState(false);
  const handleFixMonthlyBudget = async () => {
    setIsFixingBudget(true);
    try {
      const budgetBrl = summary.theoreticalBudgetBrl;
      const budgetMzn = summary.theoreticalBudgetMzn;

      await saveExpenseTransaction({
        description: `Insumos Nutricionais (Previsão Mensal - ${targetKitsCount} kits)`,
        amount: budgetBrl,
        type: 'expense',
        category_id: '',
        date: new Date().toISOString().split('T')[0],
        status: 'pending',
        account: 'Caixa Moçambique',
        expense_type: 'fixed',
        recurrence: 'monthly',
        module: 'nutrition',
        notes: `Previsão estrutural calculada pelo Planejador de Compras: ${targetKitsCount} kits x ${currentKit?.name || 'Kit Padrão'} = ${budgetMzn.toFixed(2)} MT`.trim(),
        currency: 'MZN',
        original_amount: budgetMzn,
        exchange_rate: mznRate
      }, 'nutrition');

      setToastMessage(`Compromisso fixo de insumos de R$ ${budgetBrl.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} registrado nas despesas fixas com sucesso!`);
      onRefreshFinance?.();
      setTimeout(() => setToastMessage(null), 5000);
    } catch (e) {
      console.error('Erro ao fixar orçamento:', e);
      alert('Erro ao registrar previsão orçamentária.');
    } finally {
      setIsFixingBudget(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* Top Banner / Explicação */}
      <div className="bg-gradient-to-r from-emerald-800 to-teal-900 rounded-3xl p-8 text-white relative overflow-hidden shadow-xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="max-w-2xl">
            <span className="px-3 py-1 bg-white/10 backdrop-blur-md rounded-xl text-emerald-200 text-xs font-black uppercase tracking-wider inline-flex items-center gap-1.5 mb-3">
              <ShoppingCart size={14} /> Setor de Compras & Planejamento
            </span>
            <h2 className="text-2xl md:text-3xl font-black tracking-tight">
              Previsão de Insumos da Casa Nutri
            </h2>
            <p className="text-emerald-100/90 text-sm mt-2 leading-relaxed">
              O sistema cruza a demanda dos kits das crianças com o estoque físico atual da despensa. 
              As sobras do mês anterior diminuem automaticamente a compra necessária, garantindo 
              previsão orçamentária antecipada e compras eficientes.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
            <button
              onClick={handleFixMonthlyBudget}
              disabled={isFixingBudget || summary.theoreticalBudgetMzn <= 0}
              className="px-5 py-3 rounded-2xl bg-white/15 hover:bg-white/25 border border-white/20 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all active:scale-95"
              title="Registra ou atualiza este compromisso mensal na lista de gastos fixos da Casa Nutri"
            >
              <Repeat size={16} />
              <span>{isFixingBudget ? 'Salvando...' : 'Fixar Previsão no Orçamento'}</span>
            </button>

            <button
              onClick={openPurchaseModal}
              disabled={summary.itemsToBuyCount === 0}
              className={cn(
                "px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg transition-all active:scale-95",
                summary.itemsToBuyCount > 0 
                  ? "bg-amber-400 hover:bg-amber-300 text-slate-950 shadow-amber-400/20" 
                  : "bg-white/20 text-white/50 cursor-not-allowed"
              )}
            >
              <ShoppingCart size={16} />
              <span>Efetivar Compra do Mês</span>
            </button>
          </div>
        </div>
      </div>

      {/* Painel de Controles de Demanda */}
      <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/40 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex flex-wrap items-center gap-6">
          {/* Seletor de Kit */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest block">
              Modelo de Kit
            </label>
            <select
              value={selectedKitId}
              onChange={e => setSelectedKitId(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm font-bold text-slate-800 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
            >
              {kits.map(kit => (
                <option key={kit.id} value={kit.id}>
                  {kit.name} ({kit.items.length} itens)
                </option>
              ))}
            </select>
          </div>

          {/* Quantidade de Kits para o Mês */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest block">
              Meta de Crianças / Kits no Mês
            </label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setTargetKitsCount(prev => Math.max(1, prev - 5))}
                className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center transition-colors font-bold"
              >
                <Minus size={16} />
              </button>
              <input
                type="number"
                min="1"
                value={targetKitsCount}
                onChange={e => setTargetKitsCount(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-20 text-center font-black text-slate-900 bg-slate-50 border border-slate-200 rounded-xl py-1.5 text-base outline-none focus:border-emerald-500"
              />
              <button
                type="button"
                onClick={() => setTargetKitsCount(prev => prev + 5)}
                className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center transition-colors font-bold"
              >
                <Plus size={16} />
              </button>
              <span className="text-xs text-slate-400 font-medium ml-1">
                (Atualmente {activeChildrenCount} crianças ativas)
              </span>
            </div>
          </div>
        </div>

        <div className="text-right">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Cotação Atual</span>
          <span className="text-xs font-black text-emerald-700 bg-emerald-50 px-3 py-1 rounded-lg border border-emerald-200/60 inline-block mt-0.5">
            1 MT = R$ {mznRate.toFixed(4)}
          </span>
        </div>
      </div>

      {/* 4 Cards de Resumo Executivo */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Card 1: Custo Teórico Orçado (Bruto) */}
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/40">
          <div className="flex justify-between items-start mb-3">
            <div className="p-3 bg-blue-50 rounded-2xl text-blue-600">
              <Layers size={22} />
            </div>
            <span className="px-2.5 py-1 bg-blue-50 text-blue-700 font-black text-[10px] rounded-lg uppercase tracking-wider">
              {targetKitsCount} kits
            </span>
          </div>
          <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Orçamento Base (Bruto)</p>
          <p className="text-2xl font-black text-slate-900 mt-1">
            {summary.theoreticalBudgetMzn.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} MT
          </p>
          <p className="text-xs text-slate-500 font-semibold mt-1">
            ≈ R$ {summary.theoreticalBudgetBrl.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <p className="text-[10px] text-slate-400 mt-2">Custo total se partisse sem estoque algum</p>
        </div>

        {/* Card 2: Saldo em Estoque / Sobras do Mês Anterior */}
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/40">
          <div className="flex justify-between items-start mb-3">
            <div className="p-3 bg-emerald-50 rounded-2xl text-emerald-600">
              <Package size={22} />
            </div>
            <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 font-black text-[10px] rounded-lg uppercase tracking-wider">
              Economia
            </span>
          </div>
          <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Saldo Já em Estoque</p>
          <p className="text-2xl font-black text-emerald-600 mt-1">
            - {summary.stockSavingsMzn.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} MT
          </p>
          <p className="text-xs text-emerald-700 font-semibold mt-1">
            ≈ R$ {summary.stockSavingsBrl.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <p className="text-[10px] text-slate-400 mt-2">Sobras do mês anterior reaproveitadas</p>
        </div>

        {/* Card 3: Previsão Real de Compra (Necessidade Líquida) */}
        <div className="bg-white p-6 rounded-3xl border-2 border-amber-300 shadow-xl shadow-amber-200/40">
          <div className="flex justify-between items-start mb-3">
            <div className="p-3 bg-amber-50 rounded-2xl text-amber-700">
              <ShoppingCart size={22} />
            </div>
            <span className="px-2.5 py-1 bg-amber-100 text-amber-900 font-black text-[10px] rounded-lg uppercase tracking-wider">
              A Comprar
            </span>
          </div>
          <p className="text-amber-800 text-xs font-bold uppercase tracking-widest">Compra Líquida do Mês</p>
          <p className="text-3xl font-black text-amber-900 mt-1">
            {summary.netPurchaseMzn.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} MT
          </p>
          <p className="text-xs text-amber-800 font-black mt-1">
            ≈ R$ {summary.netPurchaseBrl.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <p className="text-[10px] text-amber-700 mt-2 font-medium">Desembolso real necessário para o mês</p>
        </div>

        {/* Card 4: Status da Despensa */}
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/40">
          <div className="flex justify-between items-start mb-3">
            <div className="p-3 bg-purple-50 rounded-2xl text-purple-600">
              <ShieldCheck size={22} />
            </div>
            <span className="px-2.5 py-1 bg-purple-50 text-purple-700 font-black text-[10px] rounded-lg uppercase tracking-wider">
              Cobertura
            </span>
          </div>
          <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Diagnóstico da Despensa</p>
          <p className="text-2xl font-black text-slate-900 mt-1">
            {summary.itemsSufficientCount} / {purchasingAnalysis.length} itens
          </p>
          <p className="text-xs text-slate-500 font-semibold mt-1">
            com estoque suficiente para cobrir os {targetKitsCount} kits
          </p>
          <p className="text-[10px] text-purple-600 font-bold mt-2">
            {summary.itemsToBuyCount} insumos necessitam reposição
          </p>
        </div>
      </div>

      {/* Tabela do Setor de Compras (Item a Item) */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/40 overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/50">
          <div>
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <ShoppingCart className="text-emerald-600" size={20} />
              Check de Insumos: Demanda x Saldo em Despensa
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Tabela comparativa do que é consumido vs. o que já temos armazenado
            </p>
          </div>

          {summary.itemsToBuyCount > 0 && (
            <button
              onClick={openPurchaseModal}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center gap-2 shadow-sm transition-all"
            >
              <ShoppingCart size={15} />
              <span>Gerar Pedido de Compra ({summary.itemsToBuyCount} itens)</span>
            </button>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-400 text-[10px] uppercase font-black tracking-widest border-b border-slate-100">
                <th className="px-6 py-4">Insumo</th>
                <th className="px-6 py-4 text-center">Por Kit</th>
                <th className="px-6 py-4 text-center">Demanda Mês ({targetKitsCount} kits)</th>
                <th className="px-6 py-4 text-center">Estoque Atual</th>
                <th className="px-6 py-4 text-center">Falta Comprar</th>
                <th className="px-6 py-4 text-right">Preço Un.</th>
                <th className="px-6 py-4 text-right">Custo da Compra</th>
                <th className="px-6 py-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-sm">
              {purchasingAnalysis.map(row => (
                <tr key={row.itemId} className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-6 py-4">
                    <p className="font-bold text-slate-900">{row.name}</p>
                    <span className="text-[10px] text-slate-400 font-bold uppercase">{row.category}</span>
                  </td>

                  <td className="px-6 py-4 text-center">
                    <span className="font-semibold text-slate-700">
                      {row.qtyPerKit} {row.unit}
                    </span>
                  </td>

                  <td className="px-6 py-4 text-center">
                    <span className="font-bold text-slate-900">
                      {row.grossDemand} {row.unit}
                    </span>
                  </td>

                  <td className="px-6 py-4 text-center">
                    <span className={cn(
                      "font-black px-2.5 py-1 rounded-lg text-xs",
                      row.currentStock >= row.grossDemand 
                        ? "bg-emerald-50 text-emerald-700" 
                        : row.currentStock > 0 
                        ? "bg-amber-50 text-amber-700" 
                        : "bg-red-50 text-red-600"
                    )}>
                      {row.currentStock} {row.unit}
                    </span>
                  </td>

                  <td className="px-6 py-4 text-center">
                    {row.netNeeded > 0 ? (
                      <span className="font-black text-rose-600 text-sm bg-rose-50 px-2.5 py-1 rounded-lg">
                        +{row.netNeeded} {row.unit}
                      </span>
                    ) : (
                      <span className="text-emerald-600 text-xs font-bold inline-flex items-center gap-1">
                        <Check size={14} /> Completo
                      </span>
                    )}
                  </td>

                  <td className="px-6 py-4 text-right font-medium text-slate-600">
                    {row.unitPriceMzn > 0 ? `${row.unitPriceMzn.toFixed(2)} MT` : '-'}
                  </td>

                  <td className="px-6 py-4 text-right">
                    {row.netPurchaseCostMzn > 0 ? (
                      <div>
                        <p className="font-black text-slate-900">
                          {row.netPurchaseCostMzn.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} MT
                        </p>
                        <p className="text-[10px] text-slate-400 font-semibold">
                          ≈ R$ {row.netPurchaseCostBrl.toFixed(2)}
                        </p>
                      </div>
                    ) : (
                      <span className="text-emerald-700 font-bold text-xs bg-emerald-50 px-2 py-0.5 rounded">
                        0,00 MT (R$ 0)
                      </span>
                    )}
                  </td>

                  <td className="px-6 py-4 text-center">
                    {row.status === 'sufficient' ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <CheckCircle2 size={13} />
                        <span>Suficiente</span>
                      </span>
                    ) : row.status === 'partial' ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
                        <AlertCircle size={13} />
                        <span>Repor Parcial</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-red-50 text-red-600 border border-red-200">
                        <AlertCircle size={13} />
                        <span>Zerado</span>
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Efetivação de Compra */}
      {isPurchaseModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in duration-200">
            {/* Header */}
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-emerald-50/70">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-sm">
                  <ShoppingCart size={22} />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900">
                    Efetivar Compra de Insumos
                  </h2>
                  <p className="text-xs text-slate-500 font-medium">
                    Abastece o estoque e registra o desembolso no financeiro da Casa Nutri
                  </p>
                </div>
              </div>
              <button 
                type="button"
                onClick={() => setIsPurchaseModalOpen(false)} 
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-white/60 rounded-xl transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Form */}
            <form id="purchase-form" onSubmit={handleConfirmPurchase} className="p-6 overflow-y-auto flex-1 space-y-6">
              <div className="p-4 bg-amber-50/60 border border-amber-200/60 rounded-2xl flex items-center justify-between text-xs text-amber-900">
                <span className="font-medium">
                  Itens calculados para cobrir a demanda de <strong>{targetKitsCount} kits</strong> descontando as sobras em estoque.
                </span>
                <span className="font-black text-sm">
                  {purchaseItems.length} insumos a repor
                </span>
              </div>

              {/* Tabela de Itens a Comprar */}
              <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 uppercase font-black">
                    <tr>
                      <th className="p-3">Insumo</th>
                      <th className="p-3 text-center">Qtd a Comprar</th>
                      <th className="p-3 text-right">Preço Un. (MT)</th>
                      <th className="p-3 text-right">Total (MT)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {purchaseItems.map((pi, idx) => (
                      <tr key={pi.itemId} className="hover:bg-slate-50/50">
                        <td className="p-3 font-bold text-slate-900">
                          {pi.name} ({pi.unit})
                        </td>
                        <td className="p-3 text-center">
                          <input
                            type="number"
                            min="0"
                            value={pi.quantity}
                            onChange={e => handleUpdatePurchaseItem(idx, 'quantity', parseFloat(e.target.value) || 0)}
                            className="w-20 px-2 py-1 text-center font-bold bg-white border border-slate-200 rounded-lg outline-none focus:border-emerald-500"
                          />
                        </td>
                        <td className="p-3 text-right">
                          <input
                            type="number"
                            step="0.01"
                            value={pi.unitPrice}
                            onChange={e => handleUpdatePurchaseItem(idx, 'unitPrice', parseFloat(e.target.value) || 0)}
                            className="w-24 px-2 py-1 text-right font-medium bg-white border border-slate-200 rounded-lg outline-none focus:border-emerald-500"
                          />
                        </td>
                        <td className="p-3 text-right font-black text-slate-900">
                          {pi.totalPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} MT
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Totalizador da Compra */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block">Total Real a Pagar</span>
                  <span className="text-xs text-slate-500">Moeda: Metical Moçambicano (MZN)</span>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-black text-emerald-800">
                    {purchaseItems.reduce((acc, i) => acc + i.totalPrice, 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} MT
                  </p>
                  <p className="text-xs font-bold text-slate-500">
                    ≈ R$ {convertMznToBrl(purchaseItems.reduce((acc, i) => acc + i.totalPrice, 0), mznRate).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                </div>
              </div>

              {/* Observação */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Observações da Compra
                </label>
                <input
                  type="text"
                  value={purchaseNotes}
                  onChange={e => setPurchaseNotes(e.target.value)}
                  placeholder="Ex: Compra no mercado central de Boane..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-emerald-500"
                />
              </div>
            </form>

            {/* Footer */}
            <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
              <button 
                type="button" 
                disabled={isSavingPurchase}
                onClick={() => setIsPurchaseModalOpen(false)} 
                className="px-5 py-2.5 rounded-xl font-medium text-slate-600 hover:bg-slate-200 transition-colors text-sm"
              >
                Cancelar
              </button>
              <button 
                type="submit" 
                form="purchase-form" 
                disabled={isSavingPurchase || purchaseItems.length === 0}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2.5 rounded-xl font-bold text-sm transition-colors shadow-sm flex items-center gap-2"
              >
                {isSavingPurchase ? (
                  <>
                    <RefreshCw size={16} className="animate-spin" />
                    Efetivando Compra...
                  </>
                ) : (
                  <>
                    <Check size={16} />
                    Confirmar e Abastecer Estoque
                  </>
                )}
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
