import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
  DollarSign, 
  Plus, 
  TrendingUp, 
  TrendingDown, 
  Wallet, 
  ArrowDownRight,
  Filter, 
  Download, 
  Calendar, 
  Layers, 
  CheckCircle2, 
  Clock, 
  Search, 
  Tag, 
  Repeat,
  ShieldCheck,
  Send,
  ShoppingCart
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { cn } from '../../lib/utils';
import { TransactionModal } from '../../components/admin/finance/TransactionModal';
import { MonthlyExpensesManager } from '../../components/admin/finance/MonthlyExpensesManager';
import { ExpenseModal, ExpensePayload } from '../../components/admin/finance/ExpenseModal';
import { ManageCostsAccessModal } from '../../components/admin/finance/ManageCostsAccessModal';
import { CostsAccessGuard } from '../../components/common/CostsAccessGuard';
import { NutritionPurchasingPlanner } from '../../components/nutrition/NutritionPurchasingPlanner';
import { 
  fetchModuleTransactions, 
  saveExpenseTransaction, 
  deleteModuleTransaction, 
  toggleModuleTransactionStatus, 
  updateModuleTransactionPayment 
} from '../../services/financeTransactionService';
import { useConfirm } from '../../contexts/ConfirmContext';
import { useAuth } from '../../contexts/AuthContext';
import { Transaction, TransactionCategory } from '../admin/Finance';
import { getLocalCategories, fetchAndSyncCategories } from '../../services/financeCategoryService';

export function NutritionFinance() {
  const { user } = useAuth();
  const { confirm } = useConfirm();
  const isMasterAdmin = user?.role === 'ADMIN' || user?.email?.toLowerCase() === 'contato@yahhope.com';

  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = (searchParams.get('tab') as 'expenses' | 'transactions' | 'planning') || 'expenses';
  const [activeTab, setActiveTab] = useState<'expenses' | 'transactions' | 'planning'>(initialTab);

  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam && (tabParam === 'expenses' || tabParam === 'transactions' || tabParam === 'planning')) {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  const handleTabChange = (tab: 'expenses' | 'transactions' | 'planning') => {
    setActiveTab(tab);
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      next.set('tab', tab);
      return next;
    }, { replace: true });
  };
  
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<TransactionCategory[]>(getLocalCategories());

  const [isTxModalOpen, setIsTxModalOpen] = useState(false);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [expenseModalType, setExpenseModalType] = useState<'fixed' | 'variable'>('fixed');
  const [isAccessModalOpen, setIsAccessModalOpen] = useState(false);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all');

  const fetchData = async () => {
    try {
      const [txs, syncedCats] = await Promise.all([
        fetchModuleTransactions('nutrition'),
        fetchAndSyncCategories()
      ]);
      setTransactions(txs);
      if (syncedCats) setCategories(syncedCats);
    } catch (e) {
      console.error('Error fetching nutrition finance data:', e);
    }
  };

  useEffect(() => {
    fetchData();

    const channels = supabase.channel('nutrition-finance-updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'finance_transactions', filter: 'module=eq.nutrition' }, () => fetchData())
      .subscribe();

    return () => {
      supabase.removeChannel(channels);
    };
  }, []);

  const [periodMode, setPeriodMode] = useState<'month' | 'all'>('month');

  const currentMonthKey = useMemo(() => new Date().toISOString().substring(0, 7), []);

  const currentMonthLabel = useMemo(() => {
    const parts = currentMonthKey.split('-');
    if (parts.length === 2) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const dateObj = new Date(year, month, 1);
      const raw = dateObj.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
      return raw.charAt(0).toUpperCase() + raw.slice(1);
    }
    return currentMonthKey;
  }, [currentMonthKey]);

  const stats = useMemo(() => {
    // 1. Métricas de Todos os Meses (Geral / Acumulado Histórico)
    const allIncomes = transactions.filter(t => t.type === 'income');
    const allExpenses = transactions.filter(t => t.type === 'expense');

    const totalIncome = allIncomes.reduce((acc, t) => acc + (Number(t.amount) || 0), 0);
    const totalExpense = allExpenses.reduce((acc, t) => acc + (Number(t.amount) || 0), 0);
    const totalExpenseMzn = allExpenses
      .filter(t => t.currency === 'MZN')
      .reduce((acc, t) => acc + (t.original_amount ?? (t.exchange_rate ? t.amount / t.exchange_rate : t.amount)), 0);
    const totalBalance = totalIncome - totalExpense;

    // 2. Métricas do Mês Atual (Operacional do Mês)
    const fixedExpenses = allExpenses.filter(t => t.expense_type === 'fixed');
    const monthlyEquivalentFixed = fixedExpenses.reduce((acc, t) => {
      const rec = t.recurrence || 'monthly';
      if (rec === 'bimonthly') return acc + (t.amount / 2);
      if (rec === 'quarterly') return acc + (t.amount / 3);
      if (rec === 'semiannual') return acc + (t.amount / 6);
      if (rec === 'yearly') return acc + (t.amount / 12);
      return acc + t.amount;
    }, 0);

    const monthlyEquivalentFixedMzn = fixedExpenses
      .filter(t => t.currency === 'MZN')
      .reduce((acc, t) => {
        const val = t.original_amount ?? (t.exchange_rate ? t.amount / t.exchange_rate : t.amount);
        const rec = t.recurrence || 'monthly';
        if (rec === 'bimonthly') return acc + (val / 2);
        if (rec === 'quarterly') return acc + (val / 3);
        if (rec === 'semiannual') return acc + (val / 6);
        if (rec === 'yearly') return acc + (val / 12);
        return acc + val;
      }, 0);

    const currentMonthVariables = allExpenses.filter(t => 
      t.expense_type === 'variable' && 
      t.date && t.date.startsWith(currentMonthKey)
    );
    const monthlyVariable = currentMonthVariables.reduce((acc, t) => acc + (Number(t.amount) || 0), 0);
    const monthlyVariableMzn = currentMonthVariables
      .filter(t => t.currency === 'MZN')
      .reduce((acc, t) => acc + (t.original_amount ?? (t.exchange_rate ? t.amount / t.exchange_rate : t.amount)), 0);

    const monthlyExpense = monthlyEquivalentFixed + monthlyVariable;
    const monthlyExpenseMzn = monthlyEquivalentFixedMzn + monthlyVariableMzn;
    const monthlyExpenseItemsCount = fixedExpenses.length + currentMonthVariables.length;

    const currentMonthIncomes = allIncomes.filter(t => t.date && t.date.startsWith(currentMonthKey));
    const monthlyIncome = currentMonthIncomes.reduce((acc, t) => acc + (Number(t.amount) || 0), 0);
    const monthlyBalance = monthlyIncome - monthlyExpense;

    return {
      // Geral (Todos os meses)
      totalIncome,
      totalExpense,
      totalExpenseMzn,
      totalBalance,
      totalExpenseCount: allExpenses.length,
      // Mês atual
      monthlyIncome,
      monthlyExpense,
      monthlyExpenseMzn,
      monthlyBalance,
      monthlyFixed: monthlyEquivalentFixed,
      monthlyVariable,
      monthlyExpenseCount: monthlyExpenseItemsCount
    };
  }, [transactions, currentMonthKey]);

  const filteredTransactions = useMemo(() => {
    return transactions
      .filter(t => {
        const matchesType = filterType === 'all' || t.type === filterType;
        const desc = t.description || '';
        const matchesSearch = desc.toLowerCase().includes((searchTerm || '').toLowerCase());
        return matchesType && matchesSearch;
      })
      .sort((a, b) => {
        const timeA = new Date(a.date || '').getTime() || 0;
        const timeB = new Date(b.date || '').getTime() || 0;
        return timeB - timeA;
      });
  }, [transactions, filterType, searchTerm]);

  const handleSaveTransaction = async (newTx: Omit<Transaction, 'id'>) => {
    const { error } = await supabase.from('finance_transactions').insert([{ ...newTx, module: 'nutrition' }]);
    if (error) {
      console.error('Error saving transaction:', error);
      alert('Erro ao salvar transação');
    }
  };

  const handleSaveExpense = async (newExpense: ExpensePayload) => {
    try {
      const savedTx = await saveExpenseTransaction(newExpense, 'nutrition');
      setTransactions(prev => [savedTx, ...prev.filter(t => t.id !== savedTx.id)]);
      setIsExpenseModalOpen(false);
    } catch (e) {
      console.error('Erro ao salvar despesa na Nutrição:', e);
      alert('Erro inesperado ao salvar despesa.');
    }
  };

  const handleDeleteTransaction = async (id: string) => {
    try {
      await deleteModuleTransaction(id, 'nutrition');
      setTransactions(prev => prev.filter(t => t.id !== id));
    } catch (e) {
      setTransactions(prev => prev.filter(t => t.id !== id));
    }
  };

  const handleToggleStatus = async (id: string, currentStatus: 'completed' | 'pending') => {
    const nextStatus = currentStatus === 'completed' ? 'pending' : 'completed';
    try {
      await toggleModuleTransactionStatus(id, nextStatus, 'nutrition');
      setTransactions(prev => prev.map(t => t.id === id ? { ...t, status: nextStatus } : t));
    } catch (e) {
      setTransactions(prev => prev.map(t => t.id === id ? { ...t, status: nextStatus } : t));
    }
  };

  const handleUpdatePayment = async (
    id: string, 
    updates: { 
      status?: 'completed' | 'pending'; 
      amount?: number; 
      original_amount?: number; 
      exchange_rate?: number; 
      currency?: 'BRL' | 'MZN';
      date?: string; 
      notes?: string; 
      category_id?: string;
      description?: string;
    }
  ) => {
    try {
      await updateModuleTransactionPayment(id, updates, 'nutrition');
      setTransactions(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
    } catch (e) {
      console.error('Error updating payment in NutritionFinance:', e);
      setTransactions(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
    }
  };

  return (
    <CostsAccessGuard module="nutrition">
      <div className="space-y-8 animate-in fade-in duration-700">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-200">
                Casa Nutri
              </span>
              <span className="text-xs text-slate-400 font-bold">• Conectado ao Financeiro Global</span>
            </div>
            <h1 className="text-3xl font-extrabold text-emerald-950 tracking-tight flex items-center gap-3">
              <div className="p-2 bg-emerald-600 text-white rounded-xl shadow-md shadow-emerald-600/20">
                <DollarSign size={24} />
              </div>
              Custos & Finanças da Nutrição
            </h1>
            <p className="text-slate-500 mt-1 font-medium text-sm">
              Gestão de despesas fixas recorrentes, compras de insumos e controle de custos operacionais.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            {/* Botão de Controle de Acesso para Super Admin */}
            {isMasterAdmin && (
              <button
                onClick={() => setIsAccessModalOpen(true)}
                className="flex items-center gap-1.5 px-4 py-3 bg-white border-2 border-emerald-100 hover:border-emerald-300 text-emerald-800 rounded-2xl font-bold text-xs shadow-sm hover:bg-emerald-50/50 transition-all active:scale-95"
                title="Configurar colaboradores que podem ver os custos"
              >
                <ShieldCheck size={16} className="text-emerald-600" />
                Quem Tem Acesso
              </button>
            )}

            {/* Novo Gasto */}
            <button 
              onClick={() => { setExpenseModalType('fixed'); setIsExpenseModalOpen(true); }}
              className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-2xl font-bold text-sm shadow-xl shadow-emerald-600/20 hover:bg-emerald-700 transition-all active:scale-95"
            >
              <Plus size={20} />
              Novo Gasto Nutrição
            </button>
          </div>
        </div>

        {/* Filtro de Período e Indicadores */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white/80 backdrop-blur-sm p-3 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center gap-2.5">
            <span className="text-xs font-black text-slate-500 uppercase tracking-wider pl-1">Visualização:</span>
            <div className="inline-flex bg-slate-100 p-1 rounded-xl border border-slate-200/60 shadow-inner">
              <button
                type="button"
                onClick={() => setPeriodMode('month')}
                className={cn(
                  "px-3.5 py-1.5 rounded-lg text-xs font-black transition-all flex items-center gap-1.5",
                  periodMode === 'month' 
                    ? "bg-white text-emerald-900 shadow-sm border border-emerald-100" 
                    : "text-slate-500 hover:text-slate-800"
                )}
              >
                <Calendar size={13} className={periodMode === 'month' ? "text-emerald-600" : "text-slate-400"} />
                Mês Atual ({currentMonthLabel})
              </button>
              <button
                type="button"
                onClick={() => setPeriodMode('all')}
                className={cn(
                  "px-3.5 py-1.5 rounded-lg text-xs font-black transition-all flex items-center gap-1.5",
                  periodMode === 'all' 
                    ? "bg-white text-emerald-900 shadow-sm border border-emerald-100" 
                    : "text-slate-500 hover:text-slate-800"
                )}
              >
                <Layers size={13} className={periodMode === 'all' ? "text-emerald-600" : "text-slate-400"} />
                Todos os Meses (Acumulado)
              </button>
            </div>
          </div>
          <div className="text-xs font-bold text-slate-400 pr-1">
            {periodMode === 'month' 
              ? `Exibindo custos operacionais de ${currentMonthLabel}`
              : 'Exibindo histórico acumulado de todos os meses'
            }
          </div>
        </div>

        {/* Stats Cards (3 Colunas) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Valor Repassado para o Projeto */}
          <div className="bg-white p-6 rounded-3xl border border-emerald-100 shadow-xl shadow-emerald-50/60 hover:border-emerald-200 transition-all flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-emerald-50 rounded-2xl text-emerald-600"><TrendingUp size={24} /></div>
                <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 font-black text-[10px] rounded-lg uppercase tracking-wider">
                  {periodMode === 'month' ? 'Repasse do Mês' : 'Repasses Acumulados'}
                </span>
              </div>
              <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">
                {periodMode === 'month' ? 'Valor Repassado (Mês Atual)' : 'Valor Repassado (Geral)'}
              </p>
              <p className="text-3xl font-black text-slate-900 mt-1">
                R$ {(periodMode === 'month' ? stats.monthlyIncome : stats.totalIncome).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
              <p className="text-[11px] text-slate-400 font-bold mt-2">
                Recursos transferidos pela gestão financeira
              </p>
            </div>

            <div className="mt-4 pt-3 border-t border-emerald-50 flex items-center justify-between text-[11px]">
              <span className="text-slate-500 font-bold">
                {periodMode === 'month' ? 'Todos os Meses:' : `Mês Atual (${currentMonthLabel}):`}
              </span>
              <span className="font-extrabold text-slate-800 bg-slate-50 px-2 py-0.5 rounded-lg border border-slate-200/60">
                R$ {(periodMode === 'month' ? stats.totalIncome : stats.monthlyIncome).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>
          
          {/* Despesas da Nutrição */}
          <div className="bg-white p-6 rounded-3xl border border-rose-100 shadow-xl shadow-rose-50/60 hover:border-rose-200 transition-all flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-rose-50 rounded-2xl text-rose-600"><TrendingDown size={24} /></div>
                <span className="px-2.5 py-1 bg-rose-50 text-rose-700 font-black text-[10px] rounded-lg uppercase tracking-wider">
                  {periodMode === 'month' ? `${stats.monthlyExpenseCount} itens no mês` : `${stats.totalExpenseCount} itens no total`}
                </span>
              </div>
              <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">
                {periodMode === 'month' ? `Despesas Nutrição (${currentMonthLabel})` : 'Despesas Nutrição (Todos os Meses)'}
              </p>
              <p className="text-3xl font-black text-slate-900 mt-1">
                R$ {(periodMode === 'month' ? stats.monthlyExpense : stats.totalExpense).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
              {(periodMode === 'month' ? stats.monthlyExpenseMzn : stats.totalExpenseMzn) > 0 && (
                <p className="text-xs font-bold text-emerald-600 mt-1">
                  ~ {(periodMode === 'month' ? stats.monthlyExpenseMzn : stats.totalExpenseMzn).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} MT em Meticais
                </p>
              )}
              <p className="text-[11px] text-slate-400 font-bold mt-2">
                {periodMode === 'month' 
                  ? 'Custo fixo estrutural + despesas variáveis de ' + currentMonthLabel
                  : 'Custos fixos recorrentes e gastos variáveis acumulados'}
              </p>
            </div>

            <div className="mt-4 pt-3 border-t border-rose-50 flex items-center justify-between text-[11px]">
              <span className="text-slate-500 font-bold">
                {periodMode === 'month' ? 'Todos os Meses (Acumulado):' : `Mês Atual (${currentMonthLabel}):`}
              </span>
              <span className="font-extrabold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-lg border border-rose-100">
                R$ {(periodMode === 'month' ? stats.totalExpense : stats.monthlyExpense).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                {periodMode === 'month' && ` (${stats.totalExpenseCount} itens)`}
              </span>
            </div>
          </div>

          {/* Saldo Disponível no Setor */}
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xl shadow-slate-50/60 hover:border-slate-200 transition-all flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-indigo-50 rounded-2xl text-indigo-600"><Wallet size={24} /></div>
                <span className={cn(
                  "px-2.5 py-1 font-black text-[10px] rounded-lg uppercase tracking-wider",
                  (periodMode === 'month' ? stats.monthlyBalance : stats.totalBalance) >= 0 ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"
                )}>
                  {(periodMode === 'month' ? stats.monthlyBalance : stats.totalBalance) >= 0 ? 'Superávit' : 'Déficit'}
                </span>
              </div>
              <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">
                {periodMode === 'month' ? 'Saldo no Setor (Mês Atual)' : 'Saldo no Setor (Acumulado)'}
              </p>
              <p className={cn("text-3xl font-black mt-1", (periodMode === 'month' ? stats.monthlyBalance : stats.totalBalance) >= 0 ? "text-slate-900" : "text-rose-600")}>
                R$ {(periodMode === 'month' ? stats.monthlyBalance : stats.totalBalance).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
              <p className="text-[11px] text-slate-400 font-bold mt-2">
                Repasses recebidos menos despesas efetuadas
              </p>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-50 flex items-center justify-between text-[11px]">
              <span className="text-slate-500 font-bold">
                {periodMode === 'month' ? 'Saldo Geral (Acumulado):' : `Saldo Mês (${currentMonthLabel}):`}
              </span>
              <span className={cn(
                "font-extrabold px-2 py-0.5 rounded-lg border",
                (periodMode === 'month' ? stats.totalBalance : stats.monthlyBalance) >= 0 
                  ? "text-emerald-700 bg-emerald-50 border-emerald-100" 
                  : "text-rose-700 bg-rose-50 border-rose-100"
              )}>
                R$ {(periodMode === 'month' ? stats.totalBalance : stats.monthlyBalance).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>

        </div>

        {/* Content Box */}
        <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-2xl shadow-slate-200/50 overflow-hidden">
          
          {/* Tabs (Sem RH e Voluntários) */}
          <div className="px-8 pt-6 flex flex-wrap border-b border-slate-100 gap-1">
            <button 
              onClick={() => handleTabChange('expenses')}
              className={cn(
                "px-5 py-4 font-bold text-sm transition-all relative flex items-center gap-2",
                activeTab === 'expenses' ? "text-emerald-800" : "text-slate-400 hover:text-slate-600"
              )}
            >
              <Repeat size={15} className={activeTab === 'expenses' ? "text-emerald-600" : "text-slate-400"} />
              Custos Fixos & Variáveis
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-50 text-emerald-700 border border-emerald-200">
                Gestão
              </span>
              {activeTab === 'expenses' && <div className="absolute bottom-0 left-5 right-5 h-1 bg-emerald-600 rounded-t-full"></div>}
            </button>

            <button 
              onClick={() => handleTabChange('transactions')}
              className={cn(
                "px-5 py-4 font-bold text-sm transition-all relative",
                activeTab === 'transactions' ? "text-slate-900" : "text-slate-400 hover:text-slate-600"
              )}
            >
              Extrato Geral
              {activeTab === 'transactions' && <div className="absolute bottom-0 left-5 right-5 h-1 bg-slate-900 rounded-t-full"></div>}
            </button>

            <button 
              onClick={() => handleTabChange('planning')}
              className={cn(
                "px-5 py-4 font-bold text-sm transition-all relative flex items-center gap-2",
                activeTab === 'planning' ? "text-emerald-800" : "text-slate-400 hover:text-slate-600"
              )}
            >
              <ShoppingCart size={15} className={activeTab === 'planning' ? "text-emerald-600" : "text-slate-400"} />
              Setor de Compras & Previsão
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-indigo-50 text-indigo-700 border border-indigo-200">
                Insumos
              </span>
              {activeTab === 'planning' && <div className="absolute bottom-0 left-5 right-5 h-1 bg-emerald-600 rounded-t-full"></div>}
            </button>
          </div>

          {/* Tab 1: Custos Fixos & Variáveis */}
          {activeTab === 'expenses' ? (
            <MonthlyExpensesManager
              transactions={transactions}
              categories={categories}
              totalIncome={periodMode === 'month' ? stats.monthlyIncome : stats.totalIncome}
              onSaveExpense={handleSaveExpense}
              onDeleteTransaction={handleDeleteTransaction}
              onToggleStatus={handleToggleStatus}
              onAddCategory={(newCat) => setCategories(prev => [...prev.filter(c => c.id !== newCat.id), newCat])}
              onUpdatePayment={handleUpdatePayment}
              hideProjectBreakdown={true}
            />
          ) : activeTab === 'transactions' ? (
            <div>
              <div className="p-8 border-b border-slate-100 bg-slate-50/30 flex justify-between">
                <div className="relative w-full max-w-md">
                  <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                  <input 
                    type="text" 
                    placeholder="Buscar transações..." 
                    className="w-full pl-14 pr-6 py-4 bg-white border-2 border-slate-100 rounded-2xl focus:ring-4 focus:ring-emerald-50 focus:border-emerald-200"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/50 text-slate-400 text-[10px] uppercase font-black tracking-widest border-b border-slate-100">
                      <th className="px-8 py-5">Data / Status</th>
                      <th className="px-8 py-5">Descrição</th>
                      <th className="px-8 py-5">Tipo</th>
                      <th className="px-8 py-5 text-right">Valor</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {filteredTransactions.map(t => {
                      const category = categories.find(c => c.id === t.category_id);
                      return (
                        <tr key={t.id} className="hover:bg-slate-50/80 transition-all">
                          <td className="px-8 py-4">
                            <p className="text-xs font-black text-slate-900">{t.date}</p>
                            <p className={cn("text-[10px] font-bold uppercase", t.status === 'completed' ? "text-emerald-500" : "text-amber-500")}>
                              {t.status === 'completed' ? 'Efetivado' : 'Pendente'}
                            </p>
                          </td>
                          <td className="px-8 py-4">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="font-bold text-slate-900 uppercase text-sm">{t.description || 'Sem descrição'}</p>
                              {t.currency === 'MZN' && (
                                <span 
                                  className="px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-200 shrink-0 inline-flex items-center gap-1"
                                  title={t.exchange_rate ? `Câmbio: 1 MZN = R$ ${t.exchange_rate.toFixed(4)}` : 'Moeda Moçambique'}
                                >
                                  🇲🇿 MZN
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 mt-1 text-[10px] font-bold text-slate-400">
                              <span className={cn("w-2 h-2 rounded-full", category?.color || 'bg-slate-300')}></span>
                              {category?.name || (t.type === 'income' ? 'Repasse Financeiro' : 'Sem categoria')}
                            </div>
                          </td>
                          <td className="px-8 py-4">
                            <div className="flex flex-col gap-1">
                              <span className={cn(
                                "px-3 py-1 rounded-lg text-[10px] font-black uppercase w-fit border",
                                t.type === 'income' ? "bg-emerald-50 text-emerald-700 border-emerald-100" : "bg-rose-50 text-rose-700 border-rose-100"
                              )}>
                                {t.type === 'income' ? 'Repasse Recebido' : t.expense_type === 'fixed' ? 'Fixa' : 'Variável'}
                              </span>
                              {t.type === 'expense' && t.expense_type === 'fixed' && t.recurrence && t.recurrence !== 'none' && (
                                <span className="text-[9px] font-bold text-indigo-600 bg-indigo-50/80 px-2 py-0.5 rounded uppercase tracking-wider w-fit">
                                  {t.recurrence === 'monthly' ? 'Mensal' : 
                                   t.recurrence === 'bimonthly' ? 'Bimestral' :
                                   t.recurrence === 'quarterly' ? 'Trimestral' :
                                   t.recurrence === 'semiannual' ? 'Semestral' :
                                   t.recurrence === 'yearly' ? 'Anual' : t.recurrence}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-8 py-4 text-right">
                            {t.currency === 'MZN' ? (
                              <>
                                <p className="text-lg font-black text-emerald-700">
                                  {t.type === 'income' ? '+' : '-'} {(Number(t.original_amount ?? (t.exchange_rate ? t.amount / t.exchange_rate : t.amount)) || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} MT
                                </p>
                                <p className="text-[11px] font-bold text-slate-500 mt-0.5" title={t.exchange_rate ? `Taxa: 1 MZN = R$ ${t.exchange_rate.toFixed(4)}` : undefined}>
                                  ~ R$ {(Number(t.amount) || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                </p>
                              </>
                            ) : (
                              <p className={cn("text-lg font-black", t.type === 'income' ? "text-emerald-600" : "text-rose-600")}>
                                {t.type === 'income' ? '+' : '-'} R$ {(Number(t.amount) || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                              </p>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                    {filteredTransactions.length === 0 && (
                      <tr>
                        <td colSpan={4} className="p-12 text-center text-slate-400 font-medium">Nenhuma transação encontrada.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="p-8">
              <NutritionPurchasingPlanner onRefreshFinance={fetchData} />
            </div>
          )}

        </div>

        <TransactionModal 
          isOpen={isTxModalOpen}
          onClose={() => setIsTxModalOpen(false)}
          onSave={handleSaveTransaction}
          categories={categories}
        />

        <ExpenseModal
          isOpen={isExpenseModalOpen}
          onClose={() => setIsExpenseModalOpen(false)}
          onSave={handleSaveExpense}
          categories={categories}
          defaultExpenseType={expenseModalType}
          onAddCategory={(newCat) => setCategories(prev => [...prev.filter(c => c.id !== newCat.id), newCat])}
        />

        <ManageCostsAccessModal
          isOpen={isAccessModalOpen}
          onClose={() => setIsAccessModalOpen(false)}
          targetModule="nutrition"
        />

      </div>
    </CostsAccessGuard>
  );
}
