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
  Receipt,
  Calculator,
  HeartPulse,
  Users,
  Filter,
  Info,
  SlidersHorizontal
} from 'lucide-react';
import { useInventory } from '../../contexts/InventoryContext';
import { usePatients } from '../../contexts/PatientContext';
import { supabase } from '../../lib/supabase';
import { getMznToBrlRate, convertMznToBrl, convertBrlToMzn } from '../../services/currencyService';
import { saveExpenseTransaction } from '../../services/financeTransactionService';
import { cn } from '../../lib/utils';
import { Kit, InventoryItem } from '../../lib/mockData';

interface NutritionPurchasingPlannerProps {
  onRefreshFinance?: () => void;
}

export function NutritionPurchasingPlanner({ onRefreshFinance }: NutritionPurchasingPlannerProps) {
  const { items, kits, updateItem, addTransaction } = useInventory();
  const { patients } = usePatients();

  // Cotação do dia MZN -> BRL
  const [mznRate, setMznRate] = useState<number>(0.08103);
  useEffect(() => {
    getMznToBrlRate().then(res => setMznRate(res.rate));
  }, []);

  // Total de crianças ativas no programa
  const activeChildrenCount = useMemo(() => {
    const active = patients.filter(p => 
      p.status === 'DAM' || 
      p.status === 'DAG' || 
      p.status === 'Risco' ||
      p.status === 'Adequado'
    );
    return active.length > 0 ? active.length : (patients.length > 0 ? patients.length : 9);
  }, [patients]);

  // Estatísticas demográficas e clínicas dos pacientes cadastrados
  const patientStats = useMemo(() => {
    let under6m = 0;
    let between6and24m = 0;
    let over24m = 0;
    let hivCount = 0;

    patients.forEach(p => {
      // Cálculo de faixa etária via DOB
      if (p.dob) {
        const birth = new Date(p.dob);
        if (!isNaN(birth.getTime())) {
          const now = new Date();
          const months = (now.getFullYear() - birth.getFullYear()) * 12 + (now.getMonth() - birth.getMonth());
          if (months < 6) under6m++;
          else if (months <= 24) between6and24m++;
          else over24m++;
        }
      }
      
      // Checagem de HIV (status, exposicao ou exames)
      const anyP = p as any;
      const isHiv = anyP.hiv_status === 'Reagente' || 
                    anyP.hiv_status === 'Positivo' || 
                    anyP.hiv_exposed === true || 
                    (typeof anyP.exams_hiv === 'string' && (
                      anyP.exams_hiv.toLowerCase().includes('reag') || 
                      anyP.exams_hiv.toLowerCase().includes('pos') ||
                      anyP.exams_hiv.toLowerCase().includes('sim')
                    ));
      if (isHiv) {
        hivCount++;
      }
    });

    // Se não tiver dados suficientes em cadastro, adota perfil típico da Casa Nutri (ex: 9 crianças)
    if (under6m === 0 && between6and24m === 0 && over24m === 0) {
      under6m = 2;
      between6and24m = 4;
      over24m = 3;
    }
    if (hivCount === 0) {
      hivCount = 2; // Perfil de vigilância epidemiológica
    }

    return {
      totalFamilies: activeChildrenCount,
      under6m,
      between6and24m,
      over24m,
      hivCount
    };
  }, [patients, activeChildrenCount]);

  // Metas de distribuição de cada Kit no mês (kitId -> quantidade)
  const [kitTargets, setKitTargets] = useState<Record<string, number>>({});
  const [hasInitializedTargets, setHasInitializedTargets] = useState(false);

  // Inicializa as metas de kits com inteligência clínica
  useEffect(() => {
    if (kits.length === 0 || hasInitializedTargets) return;

    const initial: Record<string, number> = {};
    kits.forEach(kit => {
      const name = kit.name.toLowerCase();
      // 1. Cesta Básica é entregue a 100% das famílias
      if (name.includes('cesta') || name.includes('básica') || name.includes('basica') || name.includes('familiar')) {
        initial[kit.id] = patientStats.totalFamilies;
      } 
      // 2. Faixa 0 a 6 meses
      else if (name.includes('0 a 6') || name.includes('0-6') || name.includes('lactente') || name.includes('fórmula') || name.includes('formula')) {
        initial[kit.id] = patientStats.under6m;
      } 
      // 3. Faixa 6 a 24 meses
      else if (name.includes('6 a 24') || name.includes('6-24') || name.includes('transição') || name.includes('transicao')) {
        initial[kit.id] = patientStats.between6and24m;
      } 
      // 4. Faixa > 24 meses / 2 a 5 anos
      else if (name.includes('2 a 5') || name.includes('2-5') || name.includes('> 24') || name.includes('maior')) {
        initial[kit.id] = patientStats.over24m;
      } 
      // 5. Suporte HIV / Terapêutico
      else if (name.includes('hiv') || name.includes('imun') || name.includes('terapêut') || name.includes('terapeut')) {
        initial[kit.id] = patientStats.hivCount;
      } 
      // 6. Kit genérico / Outro
      else {
        initial[kit.id] = 1;
      }
    });

    setKitTargets(initial);
    setHasInitializedTargets(true);
  }, [kits, patientStats, hasInitializedTargets]);

  const handleUpdateKitTarget = (kitId: string, val: number) => {
    setKitTargets(prev => ({
      ...prev,
      [kitId]: Math.max(0, val)
    }));
  };

  const handleResetKitTargets = () => {
    const initial: Record<string, number> = {};
    kits.forEach(kit => {
      const name = kit.name.toLowerCase();
      if (name.includes('cesta') || name.includes('básica') || name.includes('basica') || name.includes('familiar')) {
        initial[kit.id] = patientStats.totalFamilies;
      } else if (name.includes('0 a 6') || name.includes('0-6')) {
        initial[kit.id] = patientStats.under6m;
      } else if (name.includes('6 a 24') || name.includes('6-24')) {
        initial[kit.id] = patientStats.between6and24m;
      } else if (name.includes('2 a 5') || name.includes('2-5') || name.includes('> 24')) {
        initial[kit.id] = patientStats.over24m;
      } else if (name.includes('hiv') || name.includes('imun')) {
        initial[kit.id] = patientStats.hivCount;
      } else {
        initial[kit.id] = 1;
      }
    });
    setKitTargets(initial);
  };

  // Modo de visualização: Consolidado (todos os kits) ou Kit Específico
  const [activeKitFilter, setActiveKitFilter] = useState<'all' | string>('all');

  // Custo unitário calculado de cada kit (alimentado diretamente pelos insumos)
  const kitsWithCosts = useMemo(() => {
    return kits.map(kit => {
      let unitCostMzn = 0;
      let hasMissingPrice = false;

      kit.items.forEach(ki => {
        const item = items.find(i => i.id === ki.item_id);
        if (!item || item.purchase_price === undefined || item.purchase_price === null) {
          hasMissingPrice = true;
          return;
        }
        const itemCurrency = item.currency || 'MZN';
        const priceMzn = itemCurrency === 'BRL' ? convertBrlToMzn(item.purchase_price, mznRate) : item.purchase_price;
        unitCostMzn += priceMzn * ki.quantity;
      });

      const unitCostBrl = convertMznToBrl(unitCostMzn, mznRate);
      const targetCount = kitTargets[kit.id] || 0;
      const totalBudgetMzn = unitCostMzn * targetCount;
      const totalBudgetBrl = convertMznToBrl(totalBudgetMzn, mznRate);

      // Classificação clínica amigável
      const name = kit.name.toLowerCase();
      let categoryBadge = 'Específico';
      if (name.includes('cesta') || name.includes('básica') || name.includes('familiar')) {
        categoryBadge = 'Universal (100% Famílias)';
      } else if (name.includes('0 a 6') || name.includes('0-6')) {
        categoryBadge = 'Idade: 0 a 6 meses';
      } else if (name.includes('6 a 24') || name.includes('6-24')) {
        categoryBadge = 'Idade: 6 a 24 meses';
      } else if (name.includes('2 a 5') || name.includes('> 24')) {
        categoryBadge = 'Idade: > 24 meses';
      } else if (name.includes('hiv') || name.includes('imun')) {
        categoryBadge = 'Clínico: HIV / Imune';
      }

      return {
        kit,
        unitCostMzn,
        unitCostBrl,
        targetCount,
        totalBudgetMzn,
        totalBudgetBrl,
        hasMissingPrice,
        categoryBadge
      };
    });
  }, [kits, items, kitTargets, mznRate]);

  // Edição inline de Preço Unitário de Insumos
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editingItemPrice, setEditingItemPrice] = useState<string>('');
  const [isUpdatingPrice, setIsUpdatingPrice] = useState(false);

  // Modal Auxiliar: Calculadora de Lote / Fardo (para calcular unitário a partir do valor total pago)
  const [calculatorItem, setCalculatorItem] = useState<InventoryItem | null>(null);
  const [calcBatchTotalPrice, setCalcBatchTotalPrice] = useState<string>('');
  const [calcBatchQuantity, setCalcBatchQuantity] = useState<string>('');

  const openCalculator = (item: InventoryItem) => {
    setCalculatorItem(item);
    setCalcBatchTotalPrice('');
    setCalcBatchQuantity('');
  };

  const calculatedUnitPrice = useMemo(() => {
    const total = parseFloat(calcBatchTotalPrice) || 0;
    const qty = parseFloat(calcBatchQuantity) || 0;
    if (total > 0 && qty > 0) {
      return Number((total / qty).toFixed(2));
    }
    return 0;
  }, [calcBatchTotalPrice, calcBatchQuantity]);

  const handleApplyCalculatorPrice = async () => {
    if (!calculatorItem || calculatedUnitPrice <= 0) return;
    try {
      await updateItem(calculatorItem.id, {
        purchase_price: calculatedUnitPrice,
        currency: 'MZN'
      });
      setToastMessage(`Preço unitário de ${calculatorItem.name} atualizado para ${calculatedUnitPrice.toFixed(2)} MT com sucesso!`);
      setCalculatorItem(null);
      setTimeout(() => setToastMessage(null), 4000);
    } catch (e) {
      console.error(e);
      alert('Erro ao atualizar preço unitário.');
    }
  };

  const handleStartEditPrice = (item: InventoryItem) => {
    setEditingItemId(item.id);
    const currPrice = item.purchase_price !== undefined && item.purchase_price !== null 
      ? (item.currency === 'BRL' ? convertBrlToMzn(item.purchase_price, mznRate) : item.purchase_price)
      : 0;
    setEditingItemPrice(currPrice > 0 ? currPrice.toString() : '');
  };

  const handleSavePrice = async (itemId: string) => {
    const newPrice = parseFloat(editingItemPrice);
    if (isNaN(newPrice) || newPrice < 0) {
      alert('Informe um preço unitário válido.');
      return;
    }

    setIsUpdatingPrice(true);
    try {
      await updateItem(itemId, {
        purchase_price: newPrice,
        currency: 'MZN'
      });
      const updatedItem = items.find(i => i.id === itemId);
      setToastMessage(`Preço unitário de ${updatedItem?.name || 'insumo'} atualizado para ${newPrice.toFixed(2)} MT! Todos os kits foram recalculados.`);
      setEditingItemId(null);
      setTimeout(() => setToastMessage(null), 4000);
    } catch (err) {
      console.error('Erro ao atualizar preço unitário:', err);
      alert('Erro ao atualizar preço unitário no banco.');
    } finally {
      setIsUpdatingPrice(false);
    }
  };

  // Cálculo da Análise de Compras Consolidada (Multikits ou Filtrada)
  const purchasingAnalysis = useMemo(() => {
    // Determinar quais kits participam do cálculo
    const targetKits = activeKitFilter === 'all'
      ? kitsWithCosts.filter(k => k.targetCount > 0)
      : kitsWithCosts.filter(k => k.kit.id === activeKitFilter);

    // Mapear demandas consolidadas de cada item único
    const itemMap = new Map<string, {
      itemId: string;
      item: InventoryItem | undefined;
      name: string;
      unit: string;
      category: string;
      currentStock: number;
      unitPriceMzn: number;
      grossDemand: number;
      kitBreakdown: { kitName: string; qtyPerKit: number; kitsCount: number; subtotalDemand: number }[];
    }>();

    targetKits.forEach(kData => {
      const { kit, targetCount } = kData;
      if (targetCount <= 0 && activeKitFilter === 'all') return;

      const effectiveTarget = targetCount > 0 ? targetCount : (activeKitFilter === kit.id ? 1 : 0);

      kit.items.forEach(ki => {
        const item = items.find(i => i.id === ki.item_id);
        const itemId = ki.item_id;
        const name = item ? item.name : 'Insumo Removido';
        const unit = item ? item.unit : 'un';
        const category = item ? item.category : 'Geral';
        const currentStock = item ? item.quantity : 0;

        const itemCurrency = item?.currency || 'MZN';
        const rawPrice = item?.purchase_price || 0;
        const unitPriceMzn = itemCurrency === 'BRL' ? convertBrlToMzn(rawPrice, mznRate) : rawPrice;

        const subtotalDemand = ki.quantity * effectiveTarget;

        if (!itemMap.has(itemId)) {
          itemMap.set(itemId, {
            itemId,
            item,
            name,
            unit,
            category,
            currentStock,
            unitPriceMzn,
            grossDemand: 0,
            kitBreakdown: []
          });
        }

        const entry = itemMap.get(itemId)!;
        entry.grossDemand += subtotalDemand;
        entry.kitBreakdown.push({
          kitName: kit.name,
          qtyPerKit: ki.quantity,
          kitsCount: effectiveTarget,
          subtotalDemand
        });
      });
    });

    // Converter para array e calcular sobras, compras líquidas e orçamentos
    return Array.from(itemMap.values()).map(entry => {
      const { itemId, item, name, unit, category, currentStock, unitPriceMzn, grossDemand, kitBreakdown } = entry;

      // Necessidade Líquida a Comprar (descontando o que já tem em despensa)
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
        itemId,
        item,
        name,
        unit,
        category,
        currentStock,
        grossDemand,
        netNeeded,
        stockApplied,
        unitPriceMzn,
        grossBudgetMzn,
        stockValueSavedMzn,
        netPurchaseCostMzn,
        netPurchaseCostBrl,
        status,
        kitBreakdown
      };
    }).sort((a, b) => a.name.localeCompare(b.name));
  }, [kitsWithCosts, items, activeKitFilter, mznRate]);

  // Totais Executivos do Planejador
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

    // Total de kits somados
    const totalKitsPlanned = Object.values(kitTargets).reduce((acc, q) => acc + q, 0);

    return {
      theoreticalBudgetMzn,
      theoreticalBudgetBrl,
      stockSavingsMzn,
      stockSavingsBrl,
      netPurchaseMzn,
      netPurchaseBrl,
      itemsToBuyCount,
      itemsSufficientCount,
      totalKitsPlanned
    };
  }, [purchasingAnalysis, mznRate, kitTargets]);

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
    setPurchaseNotes(`Compra consolidada mensal para cobrir ${summary.totalKitsPlanned} kits da Casa Nutri`);
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

  // Efetivação da Compra: Alimenta o estoque e lança a despesa
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
          description: `Compra de Insumos Casa Nutri (${summary.totalKitsPlanned} kits planejados)`,
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
      setToastMessage(`Compra de ${totalMznSpent.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} MT efetivada! Estoque atualizado e despesa registrada.`);
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
        description: `Insumos Nutricionais (Previsão Mensal Consolidada - ${summary.totalKitsPlanned} kits)`,
        amount: budgetBrl,
        type: 'expense',
        category_id: '',
        date: new Date().toISOString().split('T')[0],
        status: 'pending',
        account: 'Caixa Moçambique',
        expense_type: 'fixed',
        recurrence: 'monthly',
        module: 'nutrition',
        notes: `Previsão estrutural multi-kits calculada pelo Planejador: ${summary.totalKitsPlanned} kits somados = ${budgetMzn.toFixed(2)} MT`.trim(),
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
          <div className="max-w-3xl">
            <span className="px-3 py-1 bg-white/10 backdrop-blur-md rounded-xl text-emerald-200 text-xs font-black uppercase tracking-wider inline-flex items-center gap-1.5 mb-3">
              <ShoppingCart size={14} /> Setor de Compras & Previsão Mensal
            </span>
            <h2 className="text-2xl md:text-3xl font-black tracking-tight">
              Previsão & Gestão de Custos por Insumo
            </h2>
            <p className="text-emerald-100/90 text-sm mt-2 leading-relaxed">
              O sistema consolida a demanda de todos os kits das <strong>{activeChildrenCount} crianças</strong> atendidas 
              (Cesta Básica para 100% das famílias + kits segmentados por faixa etária e condição clínica/HIV). 
              Defina o <strong>preço unitário</strong> de cada alimento diretamente aqui para alimentar automaticamente 
              o custo de todos os kits e cruzar com o saldo disponível na despensa.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
            <button
              onClick={handleFixMonthlyBudget}
              disabled={isFixingBudget || summary.theoreticalBudgetMzn <= 0}
              className="px-5 py-3 rounded-2xl bg-white/15 hover:bg-white/25 border border-white/20 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all active:scale-95"
              title="Registra este compromisso mensal consolidado nos gastos fixos da Casa Nutri"
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

      {/* Painel de Metas Multi-Kits da Casa Nutri */}
      <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/40 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div>
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="text-emerald-600" size={20} />
              <h3 className="text-lg font-bold text-slate-900">
                Planejador de Distribuição dos Kits do Mês
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              A <strong>Cesta Básica</strong> é entregue para todas as famílias ({patientStats.totalFamilies} famílias). 
              Os kits nutricionais complementares são entregues conforme a idade e necessidade clínica (HIV).
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleResetKitTargets}
              className="text-xs font-bold text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 px-3.5 py-2 rounded-xl border border-emerald-200/60 transition-colors flex items-center gap-1.5"
              title="Recalcula as metas sugeridas conforme a idade e status dos pacientes cadastrados"
            >
              <RefreshCw size={13} />
              Sugerir pelo Cadastro ({patientStats.totalFamilies} crianças)
            </button>
            <div className="text-right pl-3 border-l border-slate-100">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Câmbio</span>
              <span className="text-xs font-black text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-lg border border-emerald-200 inline-block">
                1 MT = R$ {mznRate.toFixed(4)}
              </span>
            </div>
          </div>
        </div>

        {/* Grade de Modelos de Kits com Custo Unitário Alimentado */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {kitsWithCosts.map(kData => {
            const { kit, unitCostMzn, unitCostBrl, targetCount, totalBudgetMzn, hasMissingPrice, categoryBadge } = kData;
            const isSelected = activeKitFilter === kit.id;

            return (
              <div 
                key={kit.id} 
                className={cn(
                  "p-5 rounded-2xl border transition-all flex flex-col justify-between",
                  targetCount > 0 
                    ? "bg-slate-50/70 border-emerald-200/80 shadow-sm" 
                    : "bg-slate-50/30 border-slate-200/60 opacity-75"
                )}
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-600">
                      {categoryBadge}
                    </span>
                    {hasMissingPrice && (
                      <span className="text-[10px] text-amber-600 font-bold bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 flex items-center gap-0.5" title="Existem insumos neste kit sem preço unitário cadastrado">
                        <AlertCircle size={10} /> sem preço
                      </span>
                    )}
                  </div>

                  <h4 className="font-bold text-slate-900 text-sm line-clamp-1">{kit.name}</h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">{kit.items.length} itens compõem este kit</p>

                  {/* Custo Unitário Alimentado pelos Insumos */}
                  <div className="mt-3 p-2.5 bg-white rounded-xl border border-slate-200/70">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">
                      Custo Unitário do Kit
                    </span>
                    <div className="flex items-baseline justify-between mt-0.5">
                      <span className="text-sm font-black text-emerald-800">
                        {unitCostMzn.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} MT
                      </span>
                      <span className="text-[10px] font-semibold text-slate-400">
                        ≈ R$ {unitCostBrl.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Seletor de Quantidade de Kits para o Mês */}
                <div className="mt-4 pt-3 border-t border-slate-200/60 flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-600">Meta no Mês:</span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleUpdateKitTarget(kit.id, targetCount - 1)}
                      className="w-7 h-7 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 flex items-center justify-center transition-colors font-bold text-xs shadow-sm"
                    >
                      <Minus size={12} />
                    </button>
                    <input
                      type="number"
                      min="0"
                      value={targetCount}
                      onChange={e => handleUpdateKitTarget(kit.id, parseInt(e.target.value) || 0)}
                      className="w-12 text-center font-black text-slate-900 bg-white border border-slate-200 rounded-lg py-1 text-xs outline-none focus:border-emerald-500"
                    />
                    <button
                      type="button"
                      onClick={() => handleUpdateKitTarget(kit.id, targetCount + 1)}
                      className="w-7 h-7 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 flex items-center justify-center transition-colors font-bold text-xs shadow-sm"
                    >
                      <Plus size={12} />
                    </button>
                  </div>
                </div>

                {targetCount > 0 && (
                  <div className="mt-2 text-right text-[10px] font-medium text-slate-400">
                    Total: <strong className="text-slate-700 font-bold">{totalBudgetMzn.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} MT</strong>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Filtro de Visualização da Tabela */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-100">
          <div className="flex items-center gap-2">
            <Filter size={15} className="text-slate-400" />
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Filtro de Insumos:</span>
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => setActiveKitFilter('all')}
                className={cn(
                  "px-3 py-1 rounded-lg text-xs font-bold transition-all",
                  activeKitFilter === 'all'
                    ? "bg-emerald-600 text-white shadow-sm"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                )}
              >
                Visão Consolidada ({summary.totalKitsPlanned} kits no mês)
              </button>
              {kits.map(k => (
                <button
                  key={k.id}
                  type="button"
                  onClick={() => setActiveKitFilter(k.id)}
                  className={cn(
                    "px-3 py-1 rounded-lg text-xs font-bold transition-all",
                    activeKitFilter === k.id
                      ? "bg-emerald-600 text-white shadow-sm"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  )}
                >
                  {k.name}
                </button>
              ))}
            </div>
          </div>

          <span className="text-xs text-slate-400 font-medium">
            {purchasingAnalysis.length} insumos mapeados
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
              {summary.totalKitsPlanned} kits no mês
            </span>
          </div>
          <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Orçamento Base (Bruto)</p>
          <p className="text-2xl font-black text-slate-900 mt-1">
            {summary.theoreticalBudgetMzn.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} MT
          </p>
          <p className="text-xs text-slate-500 font-semibold mt-1">
            ≈ R$ {summary.theoreticalBudgetBrl.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <p className="text-[10px] text-slate-400 mt-2">Custo total estrutural de todos os kits planejados</p>
        </div>

        {/* Card 2: Saldo em Estoque / Sobras */}
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/40">
          <div className="flex justify-between items-start mb-3">
            <div className="p-3 bg-emerald-50 rounded-2xl text-emerald-600">
              <Package size={22} />
            </div>
            <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 font-black text-[10px] rounded-lg uppercase tracking-wider">
              Economia
            </span>
          </div>
          <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Saldo Já em Despensa</p>
          <p className="text-2xl font-black text-emerald-600 mt-1">
            - {summary.stockSavingsMzn.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} MT
          </p>
          <p className="text-xs text-emerald-700 font-semibold mt-1">
            ≈ R$ {summary.stockSavingsBrl.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <p className="text-[10px] text-slate-400 mt-2">Sobras do estoque físico reaproveitadas</p>
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
          <p className="text-[10px] text-amber-700 mt-2 font-medium">Desembolso financeiro real para repor o que falta</p>
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
            com estoque suficiente para a demanda
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
              Setor de Compras: Demanda Consolidada x Saldo em Despensa
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Edite o <strong>preço unitário</strong> de qualquer insumo diretamente na tabela. Kits que compartilham o insumo recalculam automaticamente.
            </p>
          </div>

          {summary.itemsToBuyCount > 0 && (
            <button
              onClick={openPurchaseModal}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center gap-2 shadow-sm transition-all shrink-0"
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
                <th className="px-6 py-4">Insumo & Kits Onde Está Presente</th>
                <th className="px-6 py-4 text-center">Demanda Mês</th>
                <th className="px-6 py-4 text-center">Estoque Atual</th>
                <th className="px-6 py-4 text-center">Falta Comprar</th>
                <th className="px-6 py-4 text-right">
                  <div>Preço Unitário</div>
                  <div className="text-[9px] text-slate-400 lowercase font-medium">(por un/kg/L)</div>
                </th>
                <th className="px-6 py-4 text-right">
                  <div>Custo da Compra</div>
                  <div className="text-[9px] text-slate-400 lowercase font-medium">(falta comprar × unitário)</div>
                </th>
                <th className="px-6 py-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-sm">
              {purchasingAnalysis.map(row => {
                const isEditing = editingItemId === row.itemId;

                return (
                  <tr key={row.itemId} className="hover:bg-slate-50/80 transition-colors">
                    {/* Nome do Insumo e Badges dos Kits onde está inserido */}
                    <td className="px-6 py-4 max-w-xs">
                      <p className="font-bold text-slate-900">{row.name}</p>
                      <span className="text-[10px] text-slate-400 font-bold uppercase">{row.category}</span>
                      
                      {/* Tags dos Kits que usam este alimento */}
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {row.kitBreakdown.map((kb, i) => (
                          <span 
                            key={i} 
                            className="text-[9px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200/60 px-1.5 py-0.5 rounded-md"
                            title={`${kb.kitsCount} kits × ${kb.qtyPerKit} ${row.unit} = ${kb.subtotalDemand} ${row.unit}`}
                          >
                            {kb.kitName}: {kb.subtotalDemand} {row.unit}
                          </span>
                        ))}
                      </div>
                    </td>

                    {/* Demanda Total do Mês */}
                    <td className="px-6 py-4 text-center">
                      <span className="font-bold text-slate-900 bg-slate-100 px-2 py-1 rounded-lg text-xs">
                        {row.grossDemand} {row.unit}
                      </span>
                    </td>

                    {/* Estoque Físico Atual na Despensa */}
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

                    {/* Necessidade Líquida a Comprar */}
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

                    {/* Preço Unitário (EDITÁVEL INLINE + CALCULADORA) */}
                    <td className="px-6 py-4 text-right">
                      {isEditing ? (
                        <div className="flex items-center justify-end gap-1.5">
                          <div className="relative">
                            <span className="absolute left-2 top-1.5 text-xs text-slate-400 font-bold">MT</span>
                            <input
                              type="number"
                              step="0.01"
                              autoFocus
                              value={editingItemPrice}
                              onChange={e => setEditingItemPrice(e.target.value)}
                              onKeyDown={e => {
                                if (e.key === 'Enter') handleSavePrice(row.itemId);
                                if (e.key === 'Escape') setEditingItemId(null);
                              }}
                              className="w-24 pl-8 pr-2 py-1 text-right font-black text-slate-900 bg-white border-2 border-emerald-500 rounded-lg text-xs outline-none shadow-sm"
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => handleSavePrice(row.itemId)}
                            disabled={isUpdatingPrice}
                            className="p-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors shadow-sm"
                            title="Salvar preço unitário"
                          >
                            <Check size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingItemId(null)}
                            className="p-1.5 bg-slate-200 hover:bg-slate-300 text-slate-600 rounded-lg transition-colors"
                            title="Cancelar"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-end gap-2 group/price">
                          <div className="text-right">
                            <span className="font-black text-slate-900 text-sm">
                              {row.unitPriceMzn > 0 
                                ? `${row.unitPriceMzn.toFixed(2)} MT` 
                                : <span className="text-rose-500 font-bold text-xs">Sem valor</span>}
                            </span>
                            <span className="text-[10px] text-slate-400 block font-normal">
                              por {row.unit}
                            </span>
                          </div>

                          <div className="flex items-center gap-1 opacity-0 group-hover/price:opacity-100 transition-opacity">
                            <button
                              type="button"
                              onClick={() => row.item && handleStartEditPrice(row.item)}
                              className="p-1.5 text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors"
                              title="Editar Preço Unitário deste insumo"
                            >
                              <Edit2 size={13} />
                            </button>
                            <button
                              type="button"
                              onClick={() => row.item && openCalculator(row.item)}
                              className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                              title="Calculadora de Preço Unitário (calcular por fardo ou compra fechada)"
                            >
                              <Calculator size={13} />
                            </button>
                          </div>
                        </div>
                      )}
                    </td>

                    {/* Custo Total da Compra (Falta Comprar × Preço Un.) */}
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

                    {/* Diagnóstico */}
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
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Auxiliar: Calculadora de Preço Unitário (Lote/Fardo) */}
      {calculatorItem && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in duration-200">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-indigo-50/70">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-sm">
                  <Calculator size={20} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Calculadora de Preço Unitário
                  </h3>
                  <p className="text-xs text-slate-500">
                    {calculatorItem.name} ({calculatorItem.unit})
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setCalculatorItem(null)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-xl"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 leading-relaxed">
                Comprou uma saca, fardo ou pacote fechado? Digite o valor total pago e a quantidade para calcular o <strong>custo exato por {calculatorItem.unit}</strong>.
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block">
                  Valor Total Pago (MT)
                </label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="Ex: 1200.00"
                  value={calcBatchTotalPrice}
                  onChange={e => setCalcBatchTotalPrice(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold outline-none focus:border-indigo-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block">
                  Quantidade Total no Pacote / Fardo ({calculatorItem.unit})
                </label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="Ex: 25"
                  value={calcBatchQuantity}
                  onChange={e => setCalcBatchQuantity(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold outline-none focus:border-indigo-500"
                />
              </div>

              {calculatedUnitPrice > 0 && (
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-black text-emerald-800 uppercase tracking-widest block">Preço Unitário Calculado</span>
                    <span className="text-xs text-emerald-600">Alimentará todos os kits com este item</span>
                  </div>
                  <div className="text-right">
                    <span className="text-xl font-black text-emerald-900">
                      {calculatedUnitPrice.toFixed(2)} MT
                    </span>
                    <span className="text-xs text-slate-500 block">/ {calculatorItem.unit}</span>
                  </div>
                </div>
              )}
            </div>

            <div className="p-5 border-t border-slate-100 bg-slate-50 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setCalculatorItem(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-xl transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={calculatedUnitPrice <= 0}
                onClick={handleApplyCalculatorPrice}
                className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white px-5 py-2 rounded-xl text-xs font-bold transition-colors shadow-sm flex items-center gap-1.5"
              >
                <Check size={14} />
                Salvar Preço Unitário
              </button>
            </div>
          </div>
        </div>
      )}

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
                    Abastece o estoque físico e registra a despesa no financeiro da Casa Nutri
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
                  Itens consolidados para cobrir a demanda de <strong>{summary.totalKitsPlanned} kits</strong> descontando o estoque existente.
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
