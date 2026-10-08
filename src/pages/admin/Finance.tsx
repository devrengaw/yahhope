import React, { useState, useMemo } from 'react';
import { 
  DollarSign, 
  Plus, 
  TrendingUp, 
  TrendingDown, 
  Wallet, 
  ArrowUpRight, 
  ArrowDownRight, 
  Filter, 
  Download,
  Calendar,
  Layers,
  CheckCircle2,
  Clock,
  MoreVertical,
  Search,
  Tag,
  Edit2,
  Trash2,
  Repeat,
  Heart,
  Users,
  Send,
  Building2
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { TransactionModal } from '../../components/admin/finance/TransactionModal';
import { CategoryModal } from '../../components/admin/finance/CategoryModal';
import { SupportersList } from '../../components/admin/finance/SupportersList';
import { SponsorshipQuotasManager } from '../../components/admin/finance/SponsorshipQuotasManager';
import { MonthlyExpensesManager } from '../../components/admin/finance/MonthlyExpensesManager';
import { ExpenseModal, ExpensePayload } from '../../components/admin/finance/ExpenseModal';
import { ProjectRepasseModal, RepassePayload } from '../../components/admin/finance/ProjectRepasseModal';
import { useConfirm } from '../../contexts/ConfirmContext';
import { cn } from '../../lib/utils';

export interface Transaction {
  id: string;
  description: string;
  amount: number;
  type: 'income' | 'expense';
  category_id?: string;
  date: string;
  status: 'pending' | 'completed';
  account: string;
  expense_type?: 'fixed' | 'variable';
  recurrence?: 'monthly' | 'bimonthly' | 'quarterly' | 'semiannual' | 'yearly' | 'none';
  module?: string;
  currency?: 'BRL' | 'MZN';
  original_amount?: number;
  exchange_rate?: number;
  notes?: string;
}

export interface TransactionCategory {
  id: string;
  name: string;
  type: 'income' | 'expense';
  color: string;
  icon: string;
}

import { Project } from '../../lib/mockData';
import { 
  getLocalCategories, 
  fetchAndSyncCategories, 
  saveCategory as persistCategory, 
  deleteCategory as removePersistedCategory 
} from '../../services/financeCategoryService';

const MONTH_NAMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

function parseDateParts(dateStr?: string) {
  if (!dateStr) return { year: 0, month: 0, key: 'unknown', label: 'Sem data' };
  const match = dateStr.match(/^(\d{4})-(\d{2})/);
  if (match) {
    const year = parseInt(match[1], 10);
    const month = parseInt(match[2], 10) - 1;
    return {
      year,
      month,
      key: `${year}-${String(month + 1).padStart(2, '0')}`,
      label: `${MONTH_NAMES[month] || ''} de ${year}`
    };
  }
  const d = new Date(dateStr);
  if (!isNaN(d.getTime())) {
    const year = d.getFullYear();
    const month = d.getMonth();
    return {
      year,
      month,
      key: `${year}-${String(month + 1).padStart(2, '0')}`,
      label: `${MONTH_NAMES[month] || ''} de ${year}`
    };
  }
  return { year: 0, month: 0, key: 'unknown', label: 'Sem data' };
}

export function Finance() {
  const { confirm } = useConfirm();
  const [activeTab, setActiveTab] = useState<'transactions' | 'expenses' | 'supporters' | 'sponsorship' | 'categories' | 'projects'>('transactions');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<TransactionCategory[]>(getLocalCategories());
  const [projects, setProjects] = useState<Project[]>(() => {
    try {
      const cached = localStorage.getItem('yah_hope_projects_v2');
      return cached ? JSON.parse(cached) : [];
    } catch (e) {
      return [];
    }
  });
  
  const [isTxModalOpen, setIsTxModalOpen] = useState(false);
  const [isCatModalOpen, setIsCatModalOpen] = useState(false);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [expenseModalType, setExpenseModalType] = useState<'fixed' | 'variable'>('fixed');
  const [isRepasseModalOpen, setIsRepasseModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<TransactionCategory | null>(null);

  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all');
  const [filterExpenseType, setFilterExpenseType] = useState<'all' | 'fixed' | 'variable'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMonth, setSelectedMonth] = useState<string>('all');

  const fetchData = async () => {
    try {
      const [txRes, syncedCategories, projRes] = await Promise.all([
        supabase.from('finance_transactions').select('*').order('date', { ascending: false }),
        fetchAndSyncCategories(),
        supabase.from('projects').select('*').order('created_at', { ascending: false })
      ]);
      if (txRes.data) setTransactions(txRes.data);
      if (syncedCategories) setCategories(syncedCategories);
      if (projRes.data && projRes.data.length > 0) {
        setProjects(projRes.data);
      } else {
        try {
          const cached = localStorage.getItem('yah_hope_projects_v2');
          if (cached) setProjects(JSON.parse(cached));
        } catch (e) {}
      }
    } catch (e) {
      console.error('Error fetching finance data:', e);
    }
  };

  React.useEffect(() => {
    fetchData();

    const channels = supabase.channel('finance-updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'finance_transactions' }, () => fetchData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'finance_categories' }, () => fetchData())
      .subscribe();

    return () => {
      supabase.removeChannel(channels);
    };
  }, []);

  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  const currentMonthName = `${MONTH_NAMES[currentMonth]} de ${currentYear}`;

  const stats = useMemo(() => {
    // 1. Entradas
    const allIncome = transactions.filter(t => t.type === 'income');
    const totalIncome = allIncome.reduce((acc, t) => acc + t.amount, 0);

    const completedIncome = allIncome
      .filter(t => t.status === 'completed')
      .reduce((acc, t) => acc + t.amount, 0);

    // Total de entradas do mês corrente
    const monthlyIncome = allIncome
      .filter(t => {
        const { year, month, key } = parseDateParts(t.date);
        return key !== 'unknown' && year === currentYear && month === currentMonth;
      })
      .reduce((acc, t) => acc + t.amount, 0);

    // 2. Saídas
    const allExpenses = transactions.filter(t => t.type === 'expense');
    const totalExpense = allExpenses.reduce((acc, t) => acc + t.amount, 0);

    // Saídas Realizadas (efetivadas)
    const completedExpensesList = allExpenses.filter(t => t.status === 'completed');
    const completedExpenses = completedExpensesList.reduce((acc, t) => acc + t.amount, 0);

    // Saídas a Realizar (pendentes)
    const pendingExpensesList = allExpenses.filter(t => t.status === 'pending');
    const pendingExpenses = pendingExpensesList.reduce((acc, t) => acc + t.amount, 0);

    // 3. Saldo em Caixa Efetivo
    const effectiveIncome = completedIncome > 0 ? completedIncome : totalIncome;
    const cashBalance = effectiveIncome - completedExpenses;
    const projectedBalance = totalIncome - totalExpense;

    // 4. Custo Fixo Mensal (transações fixas amortizadas + cadastrados nos projetos)
    const fixedExpensesList = allExpenses.filter(t => t.expense_type === 'fixed');
    const fixedExpense = fixedExpensesList.reduce((acc, t) => {
      const rec = t.recurrence || 'monthly';
      if (rec === 'bimonthly') return acc + (t.amount / 2);
      if (rec === 'quarterly') return acc + (t.amount / 3);
      if (rec === 'semiannual') return acc + (t.amount / 6);
      if (rec === 'yearly') return acc + (t.amount / 12);
      return acc + t.amount;
    }, 0);

    const variableExpense = allExpenses
      .filter(t => t.expense_type === 'variable')
      .reduce((acc, t) => acc + t.amount, 0);

    // Custos cadastrados nos projetos ativos e em planejamento
    const activeProjects = projects.filter(p => p.status === 'active' || p.status === 'planning');
    const projectsFixedCost = activeProjects.reduce((acc, p) => acc + (Number(p.budget) || 0), 0);

    // Custo Fixo Mensal Total = Custos Fixos Operacionais + Custos Cadastrados nos Projetos
    const totalMonthlyFixed = fixedExpense + projectsFixedCost;

    // Cobertura do custo fixo mensal pela receita do mês
    const fixedCoverage = totalMonthlyFixed > 0 ? Math.min((monthlyIncome / totalMonthlyFixed) * 100, 100) : 100;

    return {
      totalIncome,
      monthlyIncome,
      completedIncome,
      totalExpense,
      completedExpenses,
      completedExpenseCount: completedExpensesList.length,
      pendingExpenses,
      pendingExpenseCount: pendingExpensesList.length,
      cashBalance,
      balance: cashBalance,
      projectedBalance,
      fixedExpense,
      projectsFixedCost,
      activeProjectsCount: activeProjects.length,
      totalMonthlyFixed,
      variableExpense,
      fixedCoverage,
      fixedPercentage: totalExpense > 0 ? (totalMonthlyFixed / totalExpense) * 100 : 0
    };
  }, [transactions, projects, currentMonth, currentYear]);

  const projectStats = useMemo(() => {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    const monthlyIncome = transactions
      .filter(t => {
        if (t.type !== 'income') return false;
        const d = new Date(t.date);
        return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
      })
      .reduce((acc, t) => acc + t.amount, 0);

    const activeProjectsCost = projects
      .filter(p => p.status === 'active' || p.status === 'planning')
      .reduce((acc, p) => acc + (p.budget || 0), 0);

    const coveragePercentage = activeProjectsCost > 0 ? Math.min((monthlyIncome / activeProjectsCost) * 100, 100) : 100;
    
    return { monthlyIncome, activeProjectsCost, coveragePercentage };
  }, [transactions, projects]);

  const repasseStats = useMemo(() => {
    // Todos os repasses destinados a módulos/projetos (entradas de recursos)
    const projectRepasses = transactions.filter(t => 
      t.type === 'income' && (t.module === 'nutrition' || t.module === 'communication')
    );
    const totalRepassed = projectRepasses.reduce((acc, t) => acc + t.amount, 0);

    // Nutrição
    const nutriRepassed = projectRepasses.filter(t => t.module === 'nutrition').reduce((acc, t) => acc + t.amount, 0);
    const nutriExpenses = transactions.filter(t => t.type === 'expense' && t.module === 'nutrition').reduce((acc, t) => acc + t.amount, 0);
    const nutriBalance = nutriRepassed - nutriExpenses;

    // Comunicação
    const commRepassed = projectRepasses.filter(t => t.module === 'communication').reduce((acc, t) => acc + t.amount, 0);
    const commExpenses = transactions.filter(t => t.type === 'expense' && t.module === 'communication').reduce((acc, t) => acc + t.amount, 0);
    const commBalance = commRepassed - commExpenses;

    return {
      projectRepasses,
      totalRepassed,
      nutriRepassed,
      nutriExpenses,
      nutriBalance,
      commRepassed,
      commExpenses,
      commBalance
    };
  }, [transactions]);

  const availableMonths = useMemo(() => {
    const map = new Map<string, { key: string; label: string; count: number; incomeTotal: number; expenseTotal: number }>();
    
    transactions.forEach(t => {
      const { key, label } = parseDateParts(t.date);
      if (key === 'unknown') return;
      if (!map.has(key)) {
        map.set(key, { key, label, count: 0, incomeTotal: 0, expenseTotal: 0 });
      }
      const item = map.get(key)!;
      item.count += 1;
      if (t.type === 'income') item.incomeTotal += t.amount;
      else item.expenseTotal += t.amount;
    });

    return Array.from(map.values()).sort((a, b) => b.key.localeCompare(a.key));
  }, [transactions]);

  const filteredTransactions = useMemo(() => {
    return transactions
      .filter(t => {
        const matchesType = filterType === 'all' || t.type === filterType;
        const matchesExpenseType = filterExpenseType === 'all' || t.expense_type === filterExpenseType;
        const matchesSearch = t.description.toLowerCase().includes(searchTerm.toLowerCase()) || 
                             t.account.toLowerCase().includes(searchTerm.toLowerCase());
        const { key } = parseDateParts(t.date);
        const matchesMonth = selectedMonth === 'all' || key === selectedMonth;
        return matchesType && matchesExpenseType && matchesSearch && matchesMonth;
      })
      .sort((a, b) => {
        const timeA = new Date(a.date).getTime() || 0;
        const timeB = new Date(b.date).getTime() || 0;
        return timeB - timeA;
      });
  }, [transactions, filterType, filterExpenseType, searchTerm, selectedMonth]);

  const transactionsByMonth = useMemo(() => {
    const groups: {
      key: string;
      label: string;
      transactions: Transaction[];
      totalIncome: number;
      totalExpense: number;
      balance: number;
    }[] = [];

    const map = new Map<string, typeof groups[0]>();

    filteredTransactions.forEach(t => {
      const { key, label } = parseDateParts(t.date);

      if (!map.has(key)) {
        const group = {
          key,
          label,
          transactions: [],
          totalIncome: 0,
          totalExpense: 0,
          balance: 0
        };
        map.set(key, group);
        groups.push(group);
      }

      const group = map.get(key)!;
      group.transactions.push(t);
      if (t.type === 'income') {
        group.totalIncome += t.amount;
      } else {
        group.totalExpense += t.amount;
      }
      group.balance = group.totalIncome - group.totalExpense;
    });

    return groups;
  }, [filteredTransactions]);

  const handleSaveTransaction = async (newTx: Omit<Transaction, 'id'>) => {
    const { error } = await supabase.from('finance_transactions').insert([newTx]);
    if (error) {
      console.error('Error saving transaction:', error);
      alert('Erro ao salvar transação');
    }
  };

  const handleSaveCategory = async (cat: Omit<TransactionCategory, 'id'> & { id?: string }) => {
    const id = cat.id || ('cat_' + Math.random().toString(36).substring(2, 9));
    const fullCat: TransactionCategory = {
      id,
      name: cat.name,
      type: cat.type,
      color: cat.color,
      icon: cat.icon || 'Tag'
    };
    await persistCategory(fullCat);
    const updated = await fetchAndSyncCategories();
    setCategories(updated);
    setEditingCategory(null);
  };

  const handleDeleteCategory = async (id: string) => {
    if (await confirm('Tem certeza que deseja excluir esta categoria? Transações vinculadas a ela não serão excluídas, mas perderão a referência.')) {
      await removePersistedCategory(id);
      const updated = await fetchAndSyncCategories();
      setCategories(updated);
    }
  };

  const handleSaveExpense = async (newExpense: ExpensePayload) => {
    try {
      const payload: any = {
        description: newExpense.description,
        amount: newExpense.amount,
        type: newExpense.type,
        category_id: newExpense.category_id,
        date: newExpense.date,
        status: newExpense.status,
        account: newExpense.account,
        expense_type: newExpense.expense_type,
        recurrence: newExpense.recurrence,
        notes: newExpense.notes,
        module: newExpense.module || 'global'
      };

      let { data, error } = await supabase.from('finance_transactions').insert([{
        ...payload,
        currency: newExpense.currency || 'BRL',
        original_amount: newExpense.original_amount,
        exchange_rate: newExpense.exchange_rate
      }]).select();

      if (error && error.message?.includes('column')) {
        const retry = await supabase.from('finance_transactions').insert([payload]).select();
        data = retry.data;
        error = retry.error;
      }

      if (error) throw error;
      if (data && data[0]) {
        const savedTx: Transaction = {
          ...(data[0] as Transaction),
          module: newExpense.module || (data[0] as any).module || 'global',
          currency: newExpense.currency || 'BRL',
          original_amount: newExpense.original_amount,
          exchange_rate: newExpense.exchange_rate
        };
        setTransactions(prev => [savedTx, ...prev]);
      }
    } catch (e) {
      console.warn('Erro ao salvar despesa no Supabase, adicionando localmente:', e);
      const localTx: Transaction = {
        id: 'tx_' + Math.random().toString(36).substring(2, 9),
        description: newExpense.description,
        amount: newExpense.amount,
        type: newExpense.type,
        category_id: newExpense.category_id,
        date: newExpense.date,
        status: newExpense.status,
        account: newExpense.account,
        expense_type: newExpense.expense_type,
        recurrence: newExpense.recurrence,
        notes: newExpense.notes,
        module: newExpense.module || 'global',
        currency: newExpense.currency || 'BRL',
        original_amount: newExpense.original_amount,
        exchange_rate: newExpense.exchange_rate
      };
      setTransactions(prev => [localTx, ...prev]);
    }
  };

  const handleSaveRepasse = async (repasse: RepassePayload) => {
    try {
      const incomeCat = categories.find(c => c.type === 'income');
      const payload = {
        description: repasse.description,
        amount: repasse.amount,
        type: 'income' as const,
        category_id: repasse.category_id || incomeCat?.id,
        date: repasse.date,
        status: 'completed' as const,
        account: repasse.account,
        notes: repasse.notes,
        module: repasse.module
      };
      const { data, error } = await supabase.from('finance_transactions').insert([payload]).select();
      if (error) throw error;
      if (data && data[0]) {
        setTransactions(prev => [data[0] as Transaction, ...prev]);
      }
    } catch (e) {
      console.warn('Erro ao salvar repasse no Supabase, adicionando localmente:', e);
      const localTx: Transaction = {
        id: 'tx_repasse_' + Math.random().toString(36).substring(2, 9),
        description: repasse.description,
        amount: repasse.amount,
        type: 'income',
        category_id: repasse.category_id || categories.find(c => c.type === 'income')?.id || '',
        date: repasse.date,
        status: 'completed',
        account: repasse.account,
        notes: repasse.notes,
        module: repasse.module
      };
      setTransactions(prev => [localTx, ...prev]);
    }
  };

  const handleDeleteTransaction = async (id: string) => {
    try {
      await supabase.from('finance_transactions').delete().eq('id', id);
      setTransactions(prev => prev.filter(t => t.id !== id));
    } catch (e) {
      setTransactions(prev => prev.filter(t => t.id !== id));
    }
  };

  const handleToggleStatus = async (id: string, currentStatus: 'completed' | 'pending') => {
    const nextStatus = currentStatus === 'completed' ? 'pending' : 'completed';
    try {
      await supabase.from('finance_transactions').update({ status: nextStatus }).eq('id', id);
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
      const payload: any = {
        ...(updates.status ? { status: updates.status } : {}),
        ...(updates.amount !== undefined ? { amount: updates.amount } : {}),
        ...(updates.currency ? { currency: updates.currency } : {}),
        ...(updates.date ? { date: updates.date } : {}),
        ...(updates.notes !== undefined ? { notes: updates.notes } : {}),
        ...(updates.category_id !== undefined ? { category_id: updates.category_id } : {}),
        ...(updates.description ? { description: updates.description } : {})
      };

      let { error } = await supabase.from('finance_transactions').update({
        ...payload,
        ...(updates.original_amount !== undefined ? { original_amount: updates.original_amount } : {}),
        ...(updates.exchange_rate !== undefined ? { exchange_rate: updates.exchange_rate } : {})
      }).eq('id', id);

      if (error && error.message?.includes('column')) {
        await supabase.from('finance_transactions').update(payload).eq('id', id);
      }

      setTransactions(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
    } catch (e) {
      console.error('Error updating payment in Finance:', e);
      setTransactions(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
            <div className="p-2 bg-slate-900 rounded-xl">
              <DollarSign className="text-white" size={24} />
            </div>
            Gestão Financeira Global
          </h1>
          <p className="text-slate-500 mt-2 font-medium">Controle centralizado de entradas, saídas e saúde fiscal do YAHope.</p>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <button 
            onClick={() => {
              if (activeTab === 'supporters') {
                const btn = document.querySelector('button[title="Baixar planilha de apoiadores"]') as HTMLButtonElement;
                if (btn) btn.click();
              } else if (activeTab === 'expenses') {
                const btn = document.querySelector('button[title="Baixar planilha de despesas"]') as HTMLButtonElement;
                if (btn) btn.click();
              } else {
                alert('Exportando extrato e relatórios financeiros...');
              }
            }}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-white border-2 border-slate-100 rounded-2xl text-slate-600 font-bold text-sm shadow-sm hover:bg-slate-50 transition-all active:scale-95"
          >
            <Download size={20} className="text-slate-400" />
            Relatórios
          </button>

          {activeTab === 'expenses' ? (
            <button 
              onClick={() => { setExpenseModalType('fixed'); setIsExpenseModalOpen(true); }}
              className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-rose-600 text-white rounded-2xl font-bold text-sm shadow-xl shadow-rose-200 hover:bg-rose-700 transition-all active:scale-95"
            >
              <Plus size={20} />
              Novo Gasto Mensal
            </button>
          ) : activeTab === 'supporters' ? (
            <div className="flex items-center gap-2">
              <span className="px-5 py-3 bg-amber-50 border border-amber-200 text-amber-800 rounded-2xl font-black text-xs flex items-center gap-2 shadow-sm">
                <Heart size={16} className="fill-amber-500 text-amber-500" />
                Base de Apoiadores
              </span>
            </div>
          ) : activeTab === 'projects' ? (
            <button 
              onClick={() => setIsRepasseModalOpen(true)}
              className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-2xl font-bold text-sm shadow-xl shadow-emerald-600/20 hover:bg-emerald-700 transition-all active:scale-95"
            >
              <Send size={18} />
              + Novo Repasse para Projeto
            </button>
          ) : (
            <button 
              onClick={() => activeTab === 'transactions' ? setIsTxModalOpen(true) : setIsCatModalOpen(true)}
              className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-2xl font-bold text-sm shadow-xl shadow-slate-200 hover:bg-slate-800 transition-all active:scale-95"
            >
              <Plus size={20} />
              {activeTab === 'transactions' ? 'Novo Lançamento' : 'Nova Categoria'}
            </button>
          )}
        </div>
      </div>

      {/* Stats Cards: Entradas do Mês, Saídas Realizadas, Saídas a Realizar, Saldo em Caixa, Custo Fixo Mensal */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-5">
        {/* Card 1: Total de Entradas do Mês */}
        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-200/50 group hover:border-slate-200 transition-all flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-start mb-3">
              <div className="p-3 bg-emerald-50 rounded-2xl text-emerald-600 group-hover:scale-110 transition-transform">
                <TrendingUp size={22} />
              </div>
              <div className="flex items-center gap-1 text-emerald-700 font-black text-[10px] bg-emerald-50 border border-emerald-100 px-2.5 py-1 rounded-lg uppercase tracking-wider">
                Mês Atual
              </div>
            </div>
            <p className="text-slate-500 text-[11px] font-bold uppercase tracking-wider">Entradas do Mês</p>
            <p className="text-2xl font-black text-slate-900 mt-1">
              R$ {stats.monthlyIncome.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
          </div>
          <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400 font-medium">
            <span>Histórico total:</span>
            <strong className="text-slate-700">R$ {stats.totalIncome.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong>
          </div>
        </div>

        {/* Card 2: Saídas Realizadas */}
        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-200/50 group hover:border-slate-200 transition-all flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-start mb-3">
              <div className="p-3 bg-rose-50 rounded-2xl text-rose-600 group-hover:scale-110 transition-transform">
                <CheckCircle2 size={22} />
              </div>
              <div className="flex items-center gap-1 text-rose-700 font-black text-[10px] bg-rose-50 border border-rose-100 px-2.5 py-1 rounded-lg uppercase tracking-wider">
                {stats.completedExpenseCount} efetivadas
              </div>
            </div>
            <p className="text-slate-500 text-[11px] font-bold uppercase tracking-wider">Saídas Realizadas</p>
            <p className="text-2xl font-black text-rose-600 mt-1">
              R$ {stats.completedExpenses.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
          </div>
          <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400 font-medium">
            <span>Status:</span>
            <span className="text-emerald-700 font-bold">✓ Pagamentos quitados</span>
          </div>
        </div>

        {/* Card 3: Saídas a Realizar */}
        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-200/50 group hover:border-slate-200 transition-all flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-start mb-3">
              <div className="p-3 bg-amber-50 rounded-2xl text-amber-600 group-hover:scale-110 transition-transform">
                <Clock size={22} />
              </div>
              <div className="flex items-center gap-1 text-amber-700 font-black text-[10px] bg-amber-50 border border-amber-100 px-2.5 py-1 rounded-lg uppercase tracking-wider">
                {stats.pendingExpenseCount} a pagar
              </div>
            </div>
            <p className="text-slate-500 text-[11px] font-bold uppercase tracking-wider">Saídas a Realizar</p>
            <p className="text-2xl font-black text-amber-600 mt-1">
              R$ {stats.pendingExpenses.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
          </div>
          <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400 font-medium">
            <span>Total despesas:</span>
            <span className="text-slate-700 font-bold">R$ {stats.totalExpense.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
          </div>
        </div>

        {/* Card 4: Saldo em Caixa */}
        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-200/50 group hover:border-slate-200 transition-all flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-start mb-3">
              <div className="p-3 bg-indigo-50 rounded-2xl text-indigo-600 group-hover:scale-110 transition-transform">
                <Wallet size={22} />
              </div>
              <div className={cn(
                "flex items-center gap-1 font-black text-[10px] px-2.5 py-1 rounded-lg uppercase tracking-wider border",
                stats.cashBalance >= 0 ? "bg-emerald-50 text-emerald-700 border-emerald-100" : "bg-rose-50 text-rose-700 border-rose-100"
              )}>
                {stats.cashBalance >= 0 ? 'Disponível' : 'Déficit'}
              </div>
            </div>
            <p className="text-slate-500 text-[11px] font-bold uppercase tracking-wider">Saldo em Caixa</p>
            <p className={cn(
              "text-2xl font-black mt-1",
              stats.cashBalance >= 0 ? "text-slate-900" : "text-rose-600"
            )}>
              R$ {stats.cashBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
          </div>
          <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400 font-medium">
            <span>Saldo previsto:</span>
            <strong className={cn(
              stats.projectedBalance >= 0 ? "text-slate-700" : "text-rose-600"
            )}>
              R$ {stats.projectedBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </strong>
          </div>
        </div>

        {/* Card 5: Custo Fixo Mensal (inclui projetos cadastrados) */}
        <div className="bg-slate-900 p-6 rounded-[2rem] shadow-xl shadow-slate-200 transition-all relative overflow-hidden group flex flex-col justify-between text-white">
          <div className="relative z-10">
            <div className="flex justify-between items-start mb-3">
              <div className="p-3 bg-white/10 rounded-2xl text-white">
                <Layers size={22} />
              </div>
              <span className="px-2.5 py-1 bg-white/10 text-indigo-300 font-black text-[10px] rounded-lg uppercase tracking-wider">
                {stats.activeProjectsCount} Projetos
              </span>
            </div>
            <p className="text-slate-400 text-[11px] font-bold uppercase tracking-wider">Custo Fixo Mensal</p>
            <p className="text-2xl font-black text-white mt-1">
              R$ {stats.totalMonthlyFixed.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
            <div className="mt-2.5 bg-white/10 h-1.5 rounded-full overflow-hidden">
              <div 
                className="bg-indigo-400 h-full rounded-full transition-all duration-1000" 
                style={{ width: `${Math.min(stats.fixedCoverage, 100)}%` }}
              />
            </div>
          </div>
          <div className="pt-3 mt-3 border-t border-white/10 flex items-center justify-between text-[10px] text-slate-300 relative z-10 font-bold">
            <span title="Custos fixos operacionais">Fixos: R$ {stats.fixedExpense.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}</span>
            <span title="Custos cadastrados nos projetos">Projetos: R$ {stats.projectsFixedCost.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}</span>
          </div>
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full -mr-16 -mt-16 blur-2xl group-hover:bg-indigo-500/20 transition-all duration-700"></div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-2xl shadow-slate-200/50 overflow-hidden">
        {/* Tabs */}
        <div className="px-8 pt-6 flex flex-wrap border-b border-slate-100 gap-1">
          <button 
            onClick={() => setActiveTab('transactions')}
            className={cn(
              "px-5 py-4 font-bold text-sm transition-all relative",
              activeTab === 'transactions' ? "text-slate-900" : "text-slate-400 hover:text-slate-600"
            )}
          >
            Transações
            {activeTab === 'transactions' && <div className="absolute bottom-0 left-5 right-5 h-1 bg-slate-900 rounded-t-full"></div>}
          </button>
          
          <button 
            onClick={() => setActiveTab('expenses')}
            className={cn(
              "px-5 py-4 font-bold text-sm transition-all relative flex items-center gap-2",
              activeTab === 'expenses' ? "text-slate-900" : "text-slate-400 hover:text-slate-600"
            )}
          >
            <Repeat size={15} className={activeTab === 'expenses' ? "text-indigo-600" : "text-slate-400"} />
            Custos Mensais
            <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-50 text-rose-600 border border-rose-100">
              Fixos & Variáveis
            </span>
            {activeTab === 'expenses' && <div className="absolute bottom-0 left-5 right-5 h-1 bg-rose-600 rounded-t-full"></div>}
          </button>

          <button 
            onClick={() => setActiveTab('supporters')}
            className={cn(
              "px-5 py-4 font-bold text-sm transition-all relative flex items-center gap-2",
              activeTab === 'supporters' ? "text-slate-900" : "text-slate-400 hover:text-slate-600"
            )}
          >
            <Heart size={15} className={activeTab === 'supporters' ? "text-amber-500 fill-amber-500" : "text-slate-400"} />
            Apoiadores Cadastrados
            <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-50 text-amber-700 border border-amber-200">
              Comunidade
            </span>
            {activeTab === 'supporters' && <div className="absolute bottom-0 left-5 right-5 h-1 bg-amber-500 rounded-t-full"></div>}
          </button>

          <button 
            onClick={() => setActiveTab('sponsorship')}
            className={cn(
              "px-5 py-4 font-bold text-sm transition-all relative flex items-center gap-2",
              activeTab === 'sponsorship' ? "text-slate-900" : "text-slate-400 hover:text-slate-600"
            )}
          >
            <Users size={15} className={activeTab === 'sponsorship' ? "text-orange-500" : "text-slate-400"} />
            Apadrinhamento & Cotas
            <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-orange-50 text-orange-700 border border-orange-200">
              Quotização
            </span>
            {activeTab === 'sponsorship' && <div className="absolute bottom-0 left-5 right-5 h-1 bg-orange-500 rounded-t-full"></div>}
          </button>

          <button 
            onClick={() => setActiveTab('categories')}
            className={cn(
              "px-5 py-4 font-bold text-sm transition-all relative",
              activeTab === 'categories' ? "text-slate-900" : "text-slate-400 hover:text-slate-600"
            )}
          >
            Categorias
            {activeTab === 'categories' && <div className="absolute bottom-0 left-5 right-5 h-1 bg-slate-900 rounded-t-full"></div>}
          </button>
          
          <button 
            onClick={() => setActiveTab('projects')}
            className={cn(
              "px-5 py-4 font-bold text-sm transition-all relative",
              activeTab === 'projects' ? "text-slate-900" : "text-slate-400 hover:text-slate-600"
            )}
          >
            Projetos
            {activeTab === 'projects' && <div className="absolute bottom-0 left-5 right-5 h-1 bg-slate-900 rounded-t-full"></div>}
          </button>
        </div>

        {activeTab === 'transactions' ? (
          <>
            {/* Filters & Search Toolbar */}
            <div className="p-8 border-b border-slate-100 bg-slate-50/30 space-y-6">
              <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
                <div className="relative flex-1 w-full lg:max-w-md group">
                  <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-slate-900 transition-colors" size={20} />
                  <input 
                    type="text" 
                    placeholder="Buscar por descrição ou conta..." 
                    className="w-full pl-14 pr-6 py-4 bg-white border-2 border-slate-100 rounded-[1.5rem] focus:outline-none focus:ring-4 focus:ring-slate-500/5 focus:border-slate-200 transition-all shadow-sm font-medium"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex bg-white p-1 rounded-2xl border-2 border-slate-100 shadow-sm">
                    <button 
                      onClick={() => setFilterType('all')}
                      className={cn(
                        "px-4 py-2 rounded-xl text-xs font-bold transition-all",
                        filterType === 'all' ? "bg-slate-900 text-white shadow-md" : "text-slate-500 hover:text-slate-800"
                      )}
                    >
                      Tudo
                    </button>
                    <button 
                      onClick={() => setFilterType('income')}
                      className={cn(
                        "px-4 py-2 rounded-xl text-xs font-bold transition-all",
                        filterType === 'income' ? "bg-emerald-500 text-white shadow-md" : "text-slate-500 hover:text-emerald-600"
                      )}
                    >
                      Entradas
                    </button>
                    <button 
                      onClick={() => setFilterType('expense')}
                      className={cn(
                        "px-4 py-2 rounded-xl text-xs font-bold transition-all",
                        filterType === 'expense' ? "bg-rose-500 text-white shadow-md" : "text-slate-500 hover:text-rose-600"
                      )}
                    >
                      Saídas
                    </button>
                  </div>

                  <select 
                    className="bg-white border-2 border-slate-100 rounded-2xl px-4 py-3 text-xs font-bold text-slate-600 focus:outline-none hover:bg-slate-50 transition-colors shadow-sm outline-none"
                    value={filterExpenseType}
                    onChange={(e) => setFilterExpenseType(e.target.value as any)}
                  >
                    <option value="all">Tipos de Despesa (Todos)</option>
                    <option value="fixed">Apenas Fixas</option>
                    <option value="variable">Apenas Variáveis</option>
                  </select>

                  <select 
                    className="bg-white border-2 border-slate-100 rounded-2xl px-4 py-3 text-xs font-bold text-slate-600 focus:outline-none hover:bg-slate-50 transition-colors shadow-sm outline-none"
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                  >
                    <option value="all">📅 Todos os Meses ({transactions.length})</option>
                    {availableMonths.map(m => (
                      <option key={m.key} value={m.key}>
                        {m.label} ({m.count})
                      </option>
                    ))}
                  </select>

                  <button className="p-3 bg-white border-2 border-slate-100 rounded-2xl text-slate-400 hover:text-slate-600 transition-all shadow-sm active:scale-95">
                    <Filter size={20} />
                  </button>
                </div>
              </div>
            </div>

            {/* Transactions Grouped by Month */}
            {filteredTransactions.length === 0 ? (
              <div className="p-20 text-center">
                <div className="w-20 h-20 bg-slate-50 rounded-[2rem] flex items-center justify-center mx-auto mb-6">
                  <Filter className="text-slate-200" size={40} />
                </div>
                <h3 className="text-xl font-bold text-slate-900">Nenhum lançamento encontrado</h3>
                <p className="text-slate-400 mt-2 font-medium max-w-xs mx-auto">
                  {selectedMonth !== 'all' 
                    ? 'Não foram encontrados lançamentos no mês selecionado.' 
                    : 'Tente ajustar seus filtros ou busca para encontrar o que procura.'}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {transactionsByMonth.map((monthGroup) => (
                  <div key={monthGroup.key} className="space-y-0">
                    {/* Month Section Header */}
                    <div className="bg-slate-50/90 px-8 py-3.5 flex flex-wrap items-center justify-between gap-3 border-y border-slate-100 sticky top-0 z-10 backdrop-blur-xs">
                      <div className="flex items-center gap-2.5">
                        <div className="p-1.5 bg-white rounded-lg border border-slate-200 text-slate-700 shadow-2xs">
                          <Calendar size={14} />
                        </div>
                        <span className="font-black text-xs text-slate-900 uppercase tracking-wider">
                          {monthGroup.label}
                        </span>
                        <span className="text-[11px] bg-slate-200/80 text-slate-700 font-bold px-2.5 py-0.5 rounded-full">
                          {monthGroup.transactions.length} {monthGroup.transactions.length === 1 ? 'lançamento' : 'lançamentos'}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 text-xs font-bold">
                        {(filterType === 'all' || filterType === 'income') && (
                          <span className="text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-100">
                            Entradas: + R$ {monthGroup.totalIncome.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </span>
                        )}
                        {(filterType === 'all' || filterType === 'expense') && (
                          <span className="text-rose-700 bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-100">
                            Saídas: - R$ {monthGroup.totalExpense.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </span>
                        )}
                        {filterType === 'all' && (
                          <span className={cn(
                            "px-2.5 py-1 rounded-lg border font-black",
                            monthGroup.balance >= 0 
                              ? "text-slate-800 bg-white border-slate-200" 
                              : "text-rose-700 bg-white border-rose-200"
                          )}>
                            Saldo: R$ {monthGroup.balance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Table for this Month */}
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-slate-50/40 text-slate-400 text-[10px] uppercase font-black tracking-[0.2em] border-b border-slate-100">
                            <th className="px-8 py-4">Status / Data</th>
                            <th className="px-8 py-4">Descrição / Categoria</th>
                            <th className="px-8 py-4">Tipo / Recorrência</th>
                            <th className="px-8 py-4">Conta / Origem</th>
                            <th className="px-8 py-4 text-right">Valor</th>
                            <th className="px-8 py-4 text-center">Ações</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                          {monthGroup.transactions.map((t) => {
                            const category = categories.find(c => c.id === t.category_id);
                            return (
                              <tr key={t.id} className="hover:bg-slate-50/80 transition-all group/row">
                                <td className="px-8 py-6">
                                  <div className="flex items-center gap-4">
                                    <div className={cn(
                                      "w-10 h-10 rounded-2xl flex items-center justify-center shadow-sm transition-transform group-hover/row:scale-110",
                                      t.status === 'completed' ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"
                                    )}>
                                      {t.status === 'completed' ? <CheckCircle2 size={18} /> : <Clock size={18} />}
                                    </div>
                                    <div>
                                      <p className="text-xs font-black text-slate-900 uppercase tracking-widest">{t.date}</p>
                                      <p className={cn(
                                        "text-[10px] font-bold uppercase",
                                        t.status === 'completed' ? "text-emerald-500" : "text-amber-500"
                                      )}>
                                        {t.status === 'completed' ? 'Efetivado' : 'Pendente'}
                                      </p>
                                    </div>
                                  </div>
                                </td>
                                <td className="px-8 py-6">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <p className="font-bold text-slate-900 leading-tight group-hover/row:text-slate-600 transition-colors uppercase text-sm tracking-tight">{t.description}</p>
                                    {t.currency === 'MZN' && (
                                      <span 
                                        className="px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-200 shrink-0 inline-flex items-center gap-1"
                                        title={t.exchange_rate ? `Câmbio: 1 MZN = R$ ${t.exchange_rate.toFixed(4)}` : 'Moeda Moçambique'}
                                      >
                                        🇲🇿 MZN
                                      </span>
                                    )}
                                    {t.module && t.module !== 'global' && (
                                      <span className={cn(
                                        "px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider",
                                        t.module === 'nutrition' ? "bg-amber-100 text-amber-800 border border-amber-200" :
                                        t.module === 'communication' ? "bg-purple-100 text-purple-800 border border-purple-200" :
                                        "bg-slate-100 text-slate-700 border border-slate-200"
                                      )}>
                                        {t.module === 'nutrition' ? 'Casa Nutri' : t.module === 'communication' ? 'Comunicação' : t.module}
                                      </span>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-2 mt-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                    <span className={cn("w-2 h-2 rounded-full", category?.color || 'bg-slate-300')}></span>
                                    {category?.name || (t.type === 'income' && t.module ? `Repasse ${t.module === 'nutrition' ? 'Nutrição' : 'Comunicação'}` : 'Sem Categoria')}
                                  </div>
                                </td>
                                <td className="px-8 py-6">
                                  <div className="flex flex-col gap-2">
                                    {t.type === 'expense' ? (
                                      <span className={cn(
                                        "inline-flex items-center justify-center px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-tighter w-fit border shadow-sm",
                                        t.expense_type === 'fixed' 
                                          ? "bg-indigo-50 text-indigo-700 border-indigo-100" 
                                          : "bg-amber-50 text-amber-700 border-amber-100"
                                      )}>
                                        {t.expense_type === 'fixed' ? 'Fixa' : 'Variável'}
                                      </span>
                                    ) : (
                                      <span className={cn(
                                        "inline-flex items-center justify-center px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-tighter w-fit border shadow-sm",
                                        t.module && t.module !== 'global'
                                          ? "bg-emerald-100 text-emerald-800 border-emerald-200"
                                          : "bg-emerald-50 text-emerald-700 border border-emerald-100"
                                      )}>
                                        {t.module && t.module !== 'global' ? `Repasse ${t.module === 'nutrition' ? 'Nutrição' : 'Comunicação'}` : 'Receita'}
                                      </span>
                                    )}
                                    {t.recurrence && t.recurrence !== 'none' && (
                                      <div className="flex items-center gap-1 text-indigo-600 bg-indigo-50/70 px-2 py-0.5 rounded-md w-fit">
                                        <Calendar size={11} />
                                        <span className="text-[10px] font-bold uppercase tracking-wider">
                                          {t.recurrence === 'monthly' ? 'Mensal' :
                                           t.recurrence === 'bimonthly' ? 'Bimestral' :
                                           t.recurrence === 'quarterly' ? 'Trimestral' :
                                           t.recurrence === 'semiannual' ? 'Semestral' :
                                           t.recurrence === 'yearly' ? 'Anual' : t.recurrence}
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                </td>
                                <td className="px-8 py-6 text-sm font-bold text-slate-500 uppercase tracking-widest">
                                  {t.account}
                                </td>
                                <td className="px-8 py-6 text-right">
                                  {t.currency === 'MZN' ? (
                                    <>
                                      <p className="text-lg font-black tracking-tighter text-emerald-700">
                                        {t.type === 'income' ? '+' : '-'} {(t.original_amount ?? (t.exchange_rate ? t.amount / t.exchange_rate : t.amount)).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} MT
                                      </p>
                                      <p className="text-[11px] font-bold text-slate-500 mt-0.5" title={t.exchange_rate ? `Taxa: 1 MZN = R$ ${t.exchange_rate.toFixed(4)}` : undefined}>
                                        ~ R$ {t.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                      </p>
                                    </>
                                  ) : (
                                    <p className={cn(
                                      "text-lg font-black tracking-tighter",
                                      t.type === 'income' ? "text-emerald-600" : "text-rose-600"
                                    )}>
                                      {t.type === 'income' ? '+' : '-'} R$ {t.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                    </p>
                                  )}
                                </td>
                                <td className="px-8 py-6 text-center">
                                  <button className="p-3 text-slate-300 hover:text-slate-900 hover:bg-white rounded-xl transition-all active:scale-95 shadow-none hover:shadow-lg hover:shadow-slate-100">
                                    <MoreVertical size={20} />
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        ) : activeTab === 'categories' ? (
          <div className="p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {categories.map((cat) => (
                <div key={cat.id} className="bg-slate-50/50 rounded-3xl p-6 border-2 border-slate-100 group hover:border-slate-200 transition-all">
                  <div className="flex justify-between items-start mb-4">
                    <div className={cn(
                      "px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-widest text-white shadow-sm",
                      cat.color
                    )}>
                      {cat.name}
                    </div>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => { setEditingCategory(cat); setIsCatModalOpen(true); }}
                        className="p-2 bg-white text-slate-400 hover:text-slate-900 rounded-lg transition-all shadow-sm active:scale-90"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button 
                         onClick={() => handleDeleteCategory(cat.id)}
                        className="p-2 bg-white text-slate-400 hover:text-rose-600 rounded-lg transition-all shadow-sm active:scale-90"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 mt-2">
                    <div className={cn(
                      "w-2 h-2 rounded-full",
                      cat.type === 'income' ? 'bg-emerald-500' : 'bg-rose-500'
                    )}></div>
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                      {cat.type === 'income' ? 'Receita' : 'Despesa'}
                    </p>
                  </div>

                  <div className="mt-6 pt-6 border-t border-slate-200/50 flex justify-between items-center text-slate-400">
                    <p className="text-[10px] font-black uppercase tracking-widest">Total Vinculado</p>
                    <p className="text-sm font-black text-slate-900">
                      R$ {transactions
                        .filter(t => t.category_id === cat.id)
                        .reduce((acc, t) => acc + t.amount, 0)
                        .toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                </div>
              ))}
              
              <button 
                onClick={() => { setEditingCategory(null); setIsCatModalOpen(true); }}
                className="bg-white rounded-3xl p-8 border-2 border-dashed border-slate-200 flex flex-col items-center justify-center gap-4 text-slate-400 hover:border-slate-300 hover:text-slate-600 transition-all group"
              >
                <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Plus size={24} />
                </div>
                <p className="text-sm font-bold uppercase tracking-widest">Nova Categoria</p>
              </button>
            </div>
          </div>
        ) : activeTab === 'projects' ? (
          <div className="p-8 space-y-8 bg-slate-50">
            {/* Bloco de Repasses Financeiros para Projetos */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm space-y-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-200">
                      Orçamento & Destinação
                    </span>
                    <span className="text-xs text-slate-400 font-bold">• Recursos para Projetos</span>
                  </div>
                  <h3 className="text-xl font-black text-slate-950 flex items-center gap-2">
                    <Send size={20} className="text-emerald-600" />
                    Repasses Financeiros para os Projetos
                  </h3>
                  <p className="text-xs text-slate-500 font-medium mt-1">
                    Valores repassados pela gestão central para cobrir as despesas operacionais da Casa Nutri e frentes setoriais.
                  </p>
                </div>

                <button
                  onClick={() => setIsRepasseModalOpen(true)}
                  className="flex items-center gap-2 px-5 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl text-xs font-bold shadow-lg shadow-emerald-600/25 transition-all active:scale-95"
                >
                  <Send size={15} />
                  + Novo Repasse para Projeto
                </button>
              </div>

              {/* 3 Cards de Indicadores de Repasse */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                
                {/* Total Repassado a Projetos */}
                <div className="bg-slate-900 text-white p-5 rounded-2xl shadow-md relative overflow-hidden">
                  <div className="flex justify-between items-start mb-2">
                    <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Total Repassado Acumulado</p>
                    <span className="px-2 py-0.5 bg-white/10 text-emerald-400 font-bold text-[10px] rounded-lg">
                      {repasseStats.projectRepasses.length} repasses
                    </span>
                  </div>
                  <p className="text-2xl font-black text-white mt-1">
                    R$ {repasseStats.totalRepassed.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                  <p className="text-[11px] text-slate-400 font-medium mt-2">
                    Total transferido para todos os projetos
                  </p>
                </div>

                {/* Casa Nutri */}
                <div className="bg-emerald-50/70 border border-emerald-200/80 p-5 rounded-2xl shadow-sm">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-1.5">
                      <Building2 size={16} className="text-emerald-700" />
                      <p className="text-emerald-900 text-[10px] font-black uppercase tracking-widest">Repasse Casa Nutri</p>
                    </div>
                    <span className={cn(
                      "px-2 py-0.5 font-black text-[9px] rounded-md uppercase tracking-wider",
                      repasseStats.nutriBalance >= 0 ? "bg-emerald-200/60 text-emerald-900" : "bg-rose-100 text-rose-800"
                    )}>
                      {repasseStats.nutriBalance >= 0 ? 'Superávit' : 'Déficit'}
                    </span>
                  </div>
                  <p className="text-2xl font-black text-emerald-950 mt-1">
                    R$ {repasseStats.nutriRepassed.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                  <div className="mt-2 pt-2 border-t border-emerald-200/60 flex justify-between text-[11px] font-bold text-emerald-800">
                    <span>Despesas: R$ {repasseStats.nutriExpenses.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                    <span>Saldo: R$ {repasseStats.nutriBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                  </div>
                </div>

                {/* Comunicação */}
                <div className="bg-purple-50/70 border border-purple-200/80 p-5 rounded-2xl shadow-sm">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-1.5">
                      <Layers size={16} className="text-purple-700" />
                      <p className="text-purple-900 text-[10px] font-black uppercase tracking-widest">Repasse Comunicação</p>
                    </div>
                    <span className={cn(
                      "px-2 py-0.5 font-black text-[9px] rounded-md uppercase tracking-wider",
                      repasseStats.commBalance >= 0 ? "bg-purple-200/60 text-purple-900" : "bg-rose-100 text-rose-800"
                    )}>
                      {repasseStats.commBalance >= 0 ? 'Superávit' : 'Déficit'}
                    </span>
                  </div>
                  <p className="text-2xl font-black text-purple-950 mt-1">
                    R$ {repasseStats.commRepassed.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                  <div className="mt-2 pt-2 border-t border-purple-200/60 flex justify-between text-[11px] font-bold text-purple-800">
                    <span>Despesas: R$ {repasseStats.commExpenses.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                    <span>Saldo: R$ {repasseStats.commBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                  </div>
                </div>

              </div>

              {/* Tabela do Histórico de Repasses */}
              <div className="pt-2">
                <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">
                  Histórico Detalhado de Repasses
                </h4>
                <div className="overflow-x-auto rounded-2xl border border-slate-100">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 text-slate-400 text-[10px] uppercase font-black tracking-widest border-b border-slate-100">
                        <th className="px-5 py-3">Data</th>
                        <th className="px-5 py-3">Projeto Destino</th>
                        <th className="px-5 py-3">Finalidade / Descrição</th>
                        <th className="px-5 py-3">Conta Débito</th>
                        <th className="px-5 py-3 text-right">Valor Repassado</th>
                        <th className="px-5 py-3 text-center">Status</th>
                        <th className="px-5 py-3 text-center">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs">
                      {repasseStats.projectRepasses.map((r) => (
                        <tr key={r.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="px-5 py-3.5 font-bold text-slate-900">{r.date}</td>
                          <td className="px-5 py-3.5">
                            <span className={cn(
                              "px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider",
                              r.module === 'nutrition' ? "bg-amber-100 text-amber-800 border border-amber-200" :
                              r.module === 'communication' ? "bg-purple-100 text-purple-800 border border-purple-200" :
                              "bg-slate-100 text-slate-700 border border-slate-200"
                            )}>
                              {r.module === 'nutrition' ? 'Casa Nutri' : r.module === 'communication' ? 'Comunicação' : r.module}
                            </span>
                          </td>
                          <td className="px-5 py-3.5 font-medium text-slate-700">{r.description}</td>
                          <td className="px-5 py-3.5 text-slate-500">{r.account}</td>
                          <td className="px-5 py-3.5 text-right font-black text-emerald-600">
                            R$ {r.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </td>
                          <td className="px-5 py-3.5 text-center">
                            <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 font-bold text-[10px] rounded-lg">
                              Efetivado
                            </span>
                          </td>
                          <td className="px-5 py-3.5 text-center">
                            <button
                              onClick={() => handleDeleteTransaction(r.id)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                              title="Excluir lançamento de repasse"
                            >
                              <Trash2 size={14} />
                            </button>
                          </td>
                        </tr>
                      ))}
                      {repasseStats.projectRepasses.length === 0 && (
                        <tr>
                          <td colSpan={7} className="p-8 text-center text-slate-400 font-medium">
                            Nenhum repasse registrado até o momento. Clique em "+ Novo Repasse para Projeto" para realizar o primeiro repasse.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>

            {/* Dashboard: Projeção Mensal */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-6 items-center">
              <div className="flex-1">
                <h3 className="text-lg font-bold text-slate-900 mb-1">Projeção de Cobertura</h3>
                <p className="text-sm text-slate-500">Receita do mês vs Custo de projetos ativos</p>
                <div className="mt-4 flex items-baseline gap-2">
                  <span className="text-3xl font-black text-slate-900">
                    {projectStats.coveragePercentage.toFixed(1)}%
                  </span>
                  <span className="text-sm font-bold text-slate-400">coberto</span>
                </div>
              </div>
              <div className="flex-1 w-full space-y-4">
                <div>
                  <div className="flex justify-between text-sm font-bold mb-1">
                    <span className="text-emerald-600">Receita Mês Atual</span>
                    <span className="text-slate-900">R$ {projectStats.monthlyIncome.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div className="bg-emerald-500 h-full rounded-full" style={{ width: '100%' }}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm font-bold mb-1">
                    <span className="text-amber-600">Custo Projetos Ativos</span>
                    <span className="text-slate-900">R$ {projectStats.activeProjectsCost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div className="bg-amber-500 h-full rounded-full" style={{ width: `${Math.min((projectStats.activeProjectsCost / (projectStats.monthlyIncome || 1)) * 100, 100)}%` }}></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Listagem de Projetos */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {projects.map(p => (
                <div key={p.id} className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start mb-4">
                    <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
                      <Layers size={20} />
                    </div>
                    <span className={cn(
                      "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider",
                      p.status === 'active' ? "bg-emerald-100 text-emerald-700" :
                      p.status === 'planning' ? "bg-amber-100 text-amber-700" :
                      "bg-slate-100 text-slate-700"
                    )}>
                      {p.status === 'active' ? 'Em Andamento' : p.status === 'planning' ? 'Planejamento' : p.status}
                    </span>
                  </div>
                  <h4 className="font-bold text-slate-900 mb-1">{p.name}</h4>
                  <p className="text-sm text-slate-500 line-clamp-2 mb-4">{p.description || 'Sem descrição'}</p>
                  
                  <div className="pt-4 border-t border-slate-100 flex justify-between items-end">
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Custo Estimado</p>
                      <p className="text-lg font-black text-slate-900">
                        R$ {(p.budget || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                    {p.start_date && (
                      <div className="text-right">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Início</p>
                        <p className="text-xs font-bold text-slate-700">{new Date(p.start_date).toLocaleDateString('pt-BR')}</p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {projects.length === 0 && (
                <div className="col-span-full p-12 text-center text-slate-500 font-medium">
                  Nenhum projeto encontrado.
                </div>
              )}
            </div>
          </div>
        ) : activeTab === 'expenses' ? (
          <MonthlyExpensesManager
            transactions={transactions}
            categories={categories}
            totalIncome={stats.totalIncome}
            projects={projects}
            onSaveExpense={handleSaveExpense}
            onDeleteTransaction={handleDeleteTransaction}
            onToggleStatus={handleToggleStatus}
            onAddCategory={(newCat) => setCategories(prev => [...prev.filter(c => c.id !== newCat.id), newCat])}
            onUpdatePayment={handleUpdatePayment}
          />
        ) : activeTab === 'supporters' ? (
          <SupportersList />
        ) : activeTab === 'sponsorship' ? (
          <div className="p-8">
            <SponsorshipQuotasManager />
          </div>
        ) : null}

        <div className="p-6 bg-slate-50/30 border-t border-slate-100 flex justify-between items-center px-10">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
            {activeTab === 'transactions' 
              ? `Mostrando ${filteredTransactions.length} de ${transactions.length} lançamentos`
              : activeTab === 'expenses'
              ? `Mostrando ${transactions.filter(t => t.type === 'expense').length} despesas mensais gerenciadas`
              : activeTab === 'supporters'
              ? `Base consolidada de apoiadores e padrinhos ativos`
              : activeTab === 'sponsorship'
              ? `Gestão de cotas de apadrinhamento e ocupação infantil`
              : activeTab === 'categories'
              ? `Total de ${categories.length} categorias cadastradas`
              : `Total de ${projects.length} projetos monitorados`
            }
          </p>
          <div className="flex gap-2">
            <button className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-400 hover:text-slate-700 transition-all disabled:opacity-50" disabled>Anterior</button>
            <button className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 transition-all shadow-sm">Próximo</button>
          </div>
        </div>
      </div>

      <TransactionModal 
        isOpen={isTxModalOpen}
        onClose={() => setIsTxModalOpen(false)}
        onSave={handleSaveTransaction}
        categories={categories}
      />

      <CategoryModal
        isOpen={isCatModalOpen}
        onClose={() => { setIsCatModalOpen(false); setEditingCategory(null); }}
        onSave={handleSaveCategory}
        category={editingCategory}
      />

      <ExpenseModal
        isOpen={isExpenseModalOpen}
        onClose={() => setIsExpenseModalOpen(false)}
        onSave={handleSaveExpense}
        categories={categories}
        defaultExpenseType={expenseModalType}
        onAddCategory={(newCat) => setCategories(prev => [...prev.filter(c => c.id !== newCat.id), newCat])}
      />

      <ProjectRepasseModal
        isOpen={isRepasseModalOpen}
        onClose={() => setIsRepasseModalOpen(false)}
        onSave={handleSaveRepasse}
        categories={categories}
      />
    </div>
  );
}
