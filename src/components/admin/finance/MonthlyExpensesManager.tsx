import React, { useState, useMemo } from 'react';
import { 
  Layers, 
  Repeat, 
  Clock, 
  Plus, 
  Search, 
  Filter, 
  Download, 
  DollarSign, 
  TrendingDown, 
  CheckCircle2, 
  AlertCircle, 
  Calendar, 
  MoreVertical, 
  Trash2, 
  Check, 
  ArrowUpRight,
  ShieldAlert,
  Building2,
  Edit2,
  X,
  Receipt,
  Wallet,
  RefreshCw
} from 'lucide-react';
import { Transaction, TransactionCategory } from '../../../pages/admin/Finance';
import { ExpenseModal, ExpensePayload } from './ExpenseModal';
import { CategorySelectWithCreate } from './CategorySelectWithCreate';
import { cn } from '../../../lib/utils';
import { useConfirm } from '../../../contexts/ConfirmContext';
import { supabase } from '../../../lib/supabase';
import { convertMznToBrl } from '../../../services/currencyService';

import { Project } from '../../../lib/mockData';
import { 
  PaymentAccount, 
  getLocalPaymentAccounts, 
  savePaymentAccount 
} from '../../../services/paymentAccountService';

interface MonthlyExpensesManagerProps {
  transactions: Transaction[];
  categories: TransactionCategory[];
  totalIncome: number;
  projects?: Project[];
  hideProjectBreakdown?: boolean;
  onSaveExpense: (expense: ExpensePayload) => Promise<void> | void;
  onDeleteTransaction: (id: string) => Promise<void> | void;
  onToggleStatus: (id: string, currentStatus: 'completed' | 'pending') => Promise<void> | void;
  onAddCategory?: (category: TransactionCategory) => void;
  onUpdatePayment?: (id: string, updates: { status?: 'completed' | 'pending'; amount?: number; original_amount?: number; exchange_rate?: number; date?: string; notes?: string; category_id?: string }) => Promise<void> | void;
}

export function MonthlyExpensesManager({
  transactions,
  categories,
  totalIncome,
  projects = [],
  hideProjectBreakdown = false,
  onSaveExpense,
  onDeleteTransaction,
  onToggleStatus,
  onAddCategory,
  onUpdatePayment
}: MonthlyExpensesManagerProps) {
  const { confirm } = useConfirm();
  const [localCategories, setLocalCategories] = useState<TransactionCategory[]>(categories);

  React.useEffect(() => {
    setLocalCategories(categories);
  }, [categories]);

  const handleCategoryCreated = (newCat: TransactionCategory) => {
    setLocalCategories(prev => {
      if (prev.some(c => c.id === newCat.id)) return prev;
      return [...prev, newCat];
    });
    onAddCategory?.(newCat);
  };

  // Contas de pagamento cadastradas
  const [paymentAccounts, setPaymentAccounts] = useState<PaymentAccount[]>(() => getLocalPaymentAccounts());
  const [selectedAccountFilter, setSelectedAccountFilter] = useState<string>('all');

  // Modal para criação de nova conta de pagamento
  const [isCreateAccountModalOpen, setIsCreateAccountModalOpen] = useState(false);
  const [newAccountName, setNewAccountName] = useState('');
  const [newAccountProjectId, setNewAccountProjectId] = useState('global');
  const [newAccountCustomProject, setNewAccountCustomProject] = useState('');
  const [newAccountDescription, setNewAccountDescription] = useState('');

  const handleAddPaymentAccount = (acc: PaymentAccount) => {
    const updated = savePaymentAccount(acc);
    setPaymentAccounts(updated);
  };

  const handleSaveNewPaymentAccount = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAccountName.trim()) return;

    const finalProjectId = newAccountProjectId === 'custom'
      ? (newAccountCustomProject.trim().toLowerCase().replace(/\s+/g, '_') || 'global')
      : newAccountProjectId;

    const newAcc: PaymentAccount = {
      id: `acc_${Date.now()}`,
      name: newAccountName.trim(),
      description: newAccountDescription.trim() || undefined,
      project_id: finalProjectId,
      color: 'indigo'
    };

    const updated = savePaymentAccount(newAcc);
    setPaymentAccounts(updated);
    setNewAccountName('');
    setNewAccountDescription('');
    setNewAccountProjectId('global');
    setNewAccountCustomProject('');
    setIsCreateAccountModalOpen(false);
  };

  const [activeSubTab, setActiveSubTab] = useState<'all' | 'fixed' | 'variable'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'completed' | 'pending'>('all');
  const [moduleFilter, setModuleFilter] = useState<'all' | 'nutrition' | 'communication' | 'global'>('all');
  const [selectedMonth, setSelectedMonth] = useState<string>('all');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalDefaultType, setModalDefaultType] = useState<'fixed' | 'variable'>('fixed');

  // Modal de Registro e Ajuste de Pagamento
  const [paymentModalTx, setPaymentModalTx] = useState<Transaction | null>(null);
  const [paymentCurrency, setPaymentCurrency] = useState<'BRL' | 'MZN'>('BRL');
  const [paymentAmount, setPaymentAmount] = useState<string>('');
  const [paymentOriginalAmount, setPaymentOriginalAmount] = useState<string>('');
  const [paymentExchangeRate, setPaymentExchangeRate] = useState<string>('');
  const [paymentDate, setPaymentDate] = useState<string>('');
  const [paymentNotes, setPaymentNotes] = useState<string>('');
  const [paymentStatus, setPaymentStatus] = useState<'completed' | 'pending'>('completed');
  const [paymentCategoryId, setPaymentCategoryId] = useState<string>('');
  const [isSavingPayment, setIsSavingPayment] = useState(false);

  const openPaymentModal = (t: Transaction) => {
    const curr = t.currency || 'BRL';
    setPaymentCurrency(curr);
    setPaymentModalTx(t);
    setPaymentAmount(t.amount.toString());
    const rate = t.exchange_rate ? t.exchange_rate.toString() : '0.08103';
    setPaymentExchangeRate(rate);
    const orig = t.original_amount 
      ? t.original_amount.toString() 
      : (t.amount > 0 ? (t.amount / (parseFloat(rate) || 0.08103)).toFixed(2) : '');
    setPaymentOriginalAmount(orig);
    setPaymentDate(t.status === 'completed' && t.date ? t.date : new Date().toISOString().split('T')[0]);
    setPaymentNotes(t.notes || '');
    setPaymentStatus(t.status || 'completed');
    setPaymentCategoryId(t.category_id || '');
  };

  const handleTogglePaymentCurrency = (newCurr: 'BRL' | 'MZN') => {
    setPaymentCurrency(newCurr);
    const rate = parseFloat(paymentExchangeRate) || 0.08103;
    if (newCurr === 'MZN') {
      const currBrl = parseFloat(paymentAmount) || paymentModalTx?.amount || 0;
      if (currBrl > 0 && rate > 0) {
        setPaymentOriginalAmount((currBrl / rate).toFixed(2));
      }
    } else {
      const orig = parseFloat(paymentOriginalAmount) || 0;
      if (orig > 0 && rate > 0) {
        setPaymentAmount((orig * rate).toFixed(2));
      }
    }
  };

  const handleOriginalAmountChange = (val: string) => {
    setPaymentOriginalAmount(val);
    const orig = parseFloat(val);
    const rate = parseFloat(paymentExchangeRate) || 0.08103;
    if (!isNaN(orig) && orig >= 0 && rate > 0) {
      setPaymentAmount((orig * rate).toFixed(2));
    }
  };

  const handleExchangeRateChange = (val: string) => {
    setPaymentExchangeRate(val);
    const rate = parseFloat(val);
    const orig = parseFloat(paymentOriginalAmount);
    if (!isNaN(orig) && orig >= 0 && !isNaN(rate) && rate > 0) {
      setPaymentAmount((orig * rate).toFixed(2));
    }
  };

  const handleSavePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentModalTx) return;

    setIsSavingPayment(true);
    try {
      const finalAmount = parseFloat(paymentAmount) || paymentModalTx.amount;
      const finalOriginalAmount = paymentCurrency === 'MZN'
        ? (parseFloat(paymentOriginalAmount) || paymentModalTx.original_amount)
        : undefined;
      const finalRate = paymentCurrency === 'MZN'
        ? (parseFloat(paymentExchangeRate) || paymentModalTx.exchange_rate || 0.08103)
        : undefined;

      const updates = {
        status: paymentStatus,
        amount: finalAmount,
        currency: paymentCurrency,
        original_amount: finalOriginalAmount,
        exchange_rate: finalRate,
        date: paymentDate,
        notes: paymentNotes,
        category_id: paymentCategoryId || undefined
      };

      if (onUpdatePayment) {
        await onUpdatePayment(paymentModalTx.id, updates);
      } else {
        const payload: any = {
          status: updates.status,
          amount: updates.amount,
          date: updates.date,
          notes: updates.notes,
          category_id: updates.category_id || null
        };
        let { error } = await supabase.from('finance_transactions').update({
          ...payload,
          original_amount: updates.original_amount,
          exchange_rate: updates.exchange_rate
        }).eq('id', paymentModalTx.id);

        if (error && error.message?.includes('column')) {
          await supabase.from('finance_transactions').update(payload).eq('id', paymentModalTx.id);
        }
        await onToggleStatus(paymentModalTx.id, paymentModalTx.status === 'completed' ? 'completed' : 'pending');
      }

      setPaymentModalTx(null);
    } catch (err) {
      console.error('Erro ao salvar pagamento:', err);
      alert('Erro ao registrar alterações.');
    } finally {
      setIsSavingPayment(false);
    }
  };

  // Detecta se existem lançamentos de múltiplos setores
  const hasMultipleModules = useMemo(() => {
    const modules = new Set(transactions.map(t => t.module || 'global'));
    return modules.size > 1;
  }, [transactions]);

  // Todas as despesas
  const allExpenses = useMemo(() => {
    return transactions.filter(t => t.type === 'expense');
  }, [transactions]);

  // Meses disponíveis com gastos para o filtro
  const availableMonths = useMemo(() => {
    const monthSet = new Set<string>();
    allExpenses.forEach(t => {
      if (t.date) {
        monthSet.add(t.date.substring(0, 7)); // YYYY-MM
      }
    });
    return Array.from(monthSet).sort((a, b) => b.localeCompare(a));
  }, [allExpenses]);

  // Mês de referência ativo para métricas mensais
  const activeMonthKey = useMemo(() => {
    if (selectedMonth !== 'all') return selectedMonth;
    const currentMonthKey = new Date().toISOString().substring(0, 7);
    if (availableMonths.includes(currentMonthKey)) return currentMonthKey;
    return availableMonths[0] || currentMonthKey;
  }, [selectedMonth, availableMonths]);

  // Nome formatado do mês de referência
  const activeMonthLabel = useMemo(() => {
    if (!activeMonthKey) return '';
    const parts = activeMonthKey.split('-');
    if (parts.length === 2) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const dateObj = new Date(year, month, 1);
      const raw = dateObj.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
      return raw.charAt(0).toUpperCase() + raw.slice(1);
    }
    return activeMonthKey;
  }, [activeMonthKey]);

  // Cálculos de Indicadores de Custos Mensais (com escopo dinâmico por Conta/Projeto)
  const stats = useMemo(() => {
    const targetExpenses = allExpenses.filter(t => {
      const matchAcc = selectedAccountFilter === 'all' || t.account.toLowerCase() === selectedAccountFilter.toLowerCase();
      const matchMod = moduleFilter === 'all' || (t.module || 'global') === moduleFilter;
      return matchAcc && matchMod;
    });

    const fixedExpenses = targetExpenses.filter(t => t.expense_type === 'fixed');
    // Gastos variáveis pertencentes ao mês ativo (ou ao mês selecionado)
    const variableExpensesInMonth = targetExpenses.filter(t => 
      t.expense_type === 'variable' && 
      t.date && t.date.startsWith(activeMonthKey)
    );

    // Total nominal dos contratos fixos cadastrados
    const totalFixedNominal = fixedExpenses.reduce((acc, t) => acc + t.amount, 0);

    // Custo mensal estrutural equivalente (amortizado: bimestral /2, trimestral /3, semestral /6, anual /12)
    const monthlyEquivalentFixed = fixedExpenses.reduce((acc, t) => {
      const rec = t.recurrence || 'monthly';
      if (rec === 'bimonthly') return acc + (t.amount / 2);
      if (rec === 'quarterly') return acc + (t.amount / 3);
      if (rec === 'semiannual') return acc + (t.amount / 6);
      if (rec === 'yearly') return acc + (t.amount / 12);
      return acc + t.amount;
    }, 0);

    const totalVariable = variableExpensesInMonth.reduce((acc, t) => acc + t.amount, 0);
    const totalVariableMzn = variableExpensesInMonth
      .filter(t => t.currency === 'MZN' && t.original_amount)
      .reduce((acc, t) => acc + (t.original_amount || 0), 0);
    const totalExpense = monthlyEquivalentFixed + totalVariable;

    // Percentual de cobertura do custo fixo pelas receitas totais
    const fixedCoverage = monthlyEquivalentFixed > 0 ? (totalIncome / monthlyEquivalentFixed) * 100 : 100;
    const balance = totalIncome - totalExpense;

    return {
      totalFixed: monthlyEquivalentFixed,
      totalFixedNominal,
      totalVariable,
      totalVariableMzn,
      totalExpense,
      fixedCount: fixedExpenses.length,
      variableCount: variableExpensesInMonth.length,
      allVariableCount: targetExpenses.filter(t => t.expense_type === 'variable').length,
      fixedCoverage,
      balance,
      isFiltered: selectedAccountFilter !== 'all' || moduleFilter !== 'all'
    };
  }, [allExpenses, totalIncome, activeMonthKey, selectedAccountFilter, moduleFilter]);

  // Opções de Projetos disponíveis para filtro e agrupamento
  const availableProjectOptions = useMemo(() => {
    const list: { id: string; name: string }[] = [];
    const seen = new Set<string>();

    // Adiciona módulos estruturais conhecidos
    list.push({ id: 'nutrition', name: 'Casa Nutri' });
    list.push({ id: 'communication', name: 'Comunicação' });
    list.push({ id: 'global', name: 'Geral / Institucional' });
    seen.add('nutrition');
    seen.add('communication');
    seen.add('global');

    // Adiciona projetos vindos do banco de projetos
    projects.forEach(p => {
      if (p.id && !seen.has(p.id)) {
        seen.add(p.id);
        list.push({ id: p.id, name: p.name });
      }
    });

    // Adiciona outros módulos existentes em transações
    transactions.forEach(t => {
      if (t.module && !seen.has(t.module)) {
        seen.add(t.module);
        list.push({ id: t.module, name: t.module });
      }
    });

    return list;
  }, [projects, transactions]);

  // Custos mensais calculados por projeto/módulo
  const projectCostBreakdown = useMemo(() => {
    // Gastos que pertencem ao período do mês ativo
    const monthlyExpenses = allExpenses.filter(t => {
      if (selectedMonth !== 'all') {
        return t.date && t.date.startsWith(selectedMonth);
      }
      return t.date && t.date.startsWith(activeMonthKey);
    });

    const map = new Map<string, {
      projectId: string;
      name: string;
      fixedTotal: number;
      variableTotal: number;
      total: number;
      count: number;
    }>();

    // Inicializa os principais setores
    map.set('nutrition', { projectId: 'nutrition', name: 'Casa Nutri', fixedTotal: 0, variableTotal: 0, total: 0, count: 0 });
    map.set('communication', { projectId: 'communication', name: 'Comunicação', fixedTotal: 0, variableTotal: 0, total: 0, count: 0 });
    map.set('global', { projectId: 'global', name: 'Geral / Institucional', fixedTotal: 0, variableTotal: 0, total: 0, count: 0 });

    monthlyExpenses.forEach(t => {
      const modKey = t.module || 'global';
      if (!map.has(modKey)) {
        const foundProj = projects.find(p => p.id === modKey);
        map.set(modKey, {
          projectId: modKey,
          name: foundProj ? foundProj.name : (modKey === 'nutrition' ? 'Casa Nutri' : modKey === 'communication' ? 'Comunicação' : modKey),
          fixedTotal: 0,
          variableTotal: 0,
          total: 0,
          count: 0
        });
      }

      const item = map.get(modKey)!;
      item.count += 1;
      item.total += t.amount;
      if (t.expense_type === 'fixed') {
        item.fixedTotal += t.amount;
      } else {
        item.variableTotal += t.amount;
      }
    });

    return Array.from(map.values())
      .filter(item => item.count > 0 || item.projectId === 'nutrition')
      .sort((a, b) => b.total - a.total);
  }, [allExpenses, activeMonthKey, selectedMonth, projects]);

  // Lista Filtrada (Ordenada pelos mais recentes no topo)
  const filteredExpenses = useMemo(() => {
    return allExpenses
      .filter(t => {
        const matchType = 
          activeSubTab === 'all' || 
          (activeSubTab === 'fixed' && t.expense_type === 'fixed') ||
          (activeSubTab === 'variable' && t.expense_type === 'variable');

        const matchSearch = 
          t.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
          t.account.toLowerCase().includes(searchTerm.toLowerCase());

        const matchCat = categoryFilter === 'all' || t.category_id === categoryFilter;
        const matchStatus = statusFilter === 'all' || t.status === statusFilter;
        const matchModule = moduleFilter === 'all' || (t.module || 'global') === moduleFilter;
        const matchAccount = selectedAccountFilter === 'all' || t.account.toLowerCase() === selectedAccountFilter.toLowerCase();
        const matchMonth = selectedMonth === 'all' || (t.date && t.date.startsWith(selectedMonth));

        return matchType && matchSearch && matchCat && matchStatus && matchModule && matchAccount && matchMonth;
      })
      .sort((a, b) => {
        const timeA = new Date(a.date).getTime() || 0;
        const timeB = new Date(b.date).getTime() || 0;
        return timeB - timeA;
      });
  }, [allExpenses, activeSubTab, searchTerm, categoryFilter, statusFilter, moduleFilter, selectedAccountFilter, selectedMonth]);

  // Agrupamento por Mês (os mais recentes primeiro)
  const expensesByMonth = useMemo(() => {
    const groups: {
      [key: string]: {
        monthKey: string;
        monthLabel: string;
        items: Transaction[];
        totalBrl: number;
        totalMzn: number;
      };
    } = {};

    filteredExpenses.forEach(t => {
      const monthKey = t.date ? t.date.substring(0, 7) : 'sem-data';
      if (!groups[monthKey]) {
        let label = 'Sem Data Definida';
        if (monthKey !== 'sem-data') {
          const parts = monthKey.split('-');
          if (parts.length === 2) {
            const year = parseInt(parts[0], 10);
            const month = parseInt(parts[1], 10) - 1;
            const dateObj = new Date(year, month, 1);
            const rawLabel = dateObj.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
            label = rawLabel.charAt(0).toUpperCase() + rawLabel.slice(1);
          }
        }

        groups[monthKey] = {
          monthKey,
          monthLabel: label,
          items: [],
          totalBrl: 0,
          totalMzn: 0
        };
      }

      groups[monthKey].items.push(t);
      groups[monthKey].totalBrl += t.amount;
      if (t.currency === 'MZN' && t.original_amount) {
        groups[monthKey].totalMzn += t.original_amount;
      }
    });

    return Object.values(groups).sort((a, b) => b.monthKey.localeCompare(a.monthKey));
  }, [filteredExpenses]);

  const handleOpenModal = (type: 'fixed' | 'variable') => {
    setModalDefaultType(type);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string, description: string) => {
    if (await confirm({
      title: 'Excluir Despesa',
      message: `Tem certeza que deseja remover o lançamento "${description}"?`,
      type: 'danger'
    })) {
      await onDeleteTransaction(id);
    }
  };

  const handleExportCSV = () => {
    const headers = ['Tipo de Gasto', 'Descrição', ...(hasMultipleModules ? ['Setor'] : []), 'Categoria', 'Data / Vencimento', 'Conta', 'Valor (R$)', 'Status'];
    const rows = filteredExpenses.map(t => {
      const cat = categories.find(c => c.id === t.category_id);
      return [
        t.expense_type === 'fixed' ? 'Fixo Recorrente' : 'Variável',
        `"${t.description}"`,
        ...(hasMultipleModules ? [t.module === 'nutrition' ? '"Casa Nutri"' : t.module === 'communication' ? '"Comunicação"' : '"Geral"'] : []),
        `"${cat?.name || 'Sem Categoria'}"`,
        t.date,
        `"${t.account}"`,
        t.amount.toFixed(2),
        t.status === 'completed' ? 'Efetivado' : 'Pendente'
      ];
    });

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(';'), ...rows.map(r => r.join(';'))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `relatorio_gastos_mensais_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      
      {/* Barra de Seleção: Contas de Pagamento & Visão por Projeto */}
      <div className="px-8 pt-4">
        <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-indigo-50 text-indigo-700 border border-indigo-200">
                  Contas & Projetos
                </span>
                <span className="text-xs text-slate-400 font-bold">• Seletor Central Financeiro</span>
                {stats.isFiltered && (
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-200">
                    Filtro Ativo: {selectedAccountFilter !== 'all' ? selectedAccountFilter : moduleFilter === 'nutrition' ? 'Casa Nutri' : moduleFilter === 'communication' ? 'Comunicação' : moduleFilter}
                  </span>
                )}
              </div>
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <Wallet size={18} className="text-indigo-600" />
                Visão Financeira por Conta e Centro de Custo
              </h3>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Clique nas contas de pagamento para isolar os gastos do respectivo projeto vinculado, ou veja tudo na Visão Global.
              </p>
            </div>
            
            {/* Botão de Criar Nova Conta de Pagamento (No Módulo Global) */}
            {!hideProjectBreakdown && (
              <button
                type="button"
                onClick={() => setIsCreateAccountModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-bold text-xs shadow-md transition-all active:scale-95 shrink-0"
              >
                <Plus size={15} className="text-amber-400" />
                + Nova Conta de Pagamento
              </button>
            )}
          </div>

          {/* Botões Seletores: Visão Global + Contas Vinculadas + Projetos */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            {/* Botão Visão Global */}
            <button
              type="button"
              onClick={() => {
                setSelectedAccountFilter('all');
                setModuleFilter('all');
              }}
              className={cn(
                "px-4 py-2.5 rounded-2xl font-black text-xs transition-all flex items-center gap-2 border shadow-sm",
                selectedAccountFilter === 'all' && moduleFilter === 'all'
                  ? "bg-slate-900 text-white border-slate-900 shadow-slate-900/20 ring-2 ring-slate-900/10"
                  : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100 hover:text-slate-900"
              )}
            >
              <span>🌐</span>
              <span>Visão Global (Tudo)</span>
              <span className={cn(
                "px-2 py-0.5 rounded-full text-[10px]",
                selectedAccountFilter === 'all' && moduleFilter === 'all' ? "bg-white/20 text-white" : "bg-slate-200/70 text-slate-700"
              )}>
                {allExpenses.length}
              </span>
            </button>

            <div className="h-6 w-px bg-slate-200 mx-1 hidden sm:block" />

            {/* Contas de Pagamento cadastradas */}
            {paymentAccounts.map((acc) => {
              const isSelected = selectedAccountFilter.toLowerCase() === acc.name.toLowerCase();
              const count = allExpenses.filter(e => e.account?.toLowerCase() === acc.name.toLowerCase()).length;
              const projName = acc.project_id === 'nutrition' 
                ? 'Casa Nutri' 
                : acc.project_id === 'communication' 
                ? 'Comunicação' 
                : acc.project_id === 'global' 
                ? 'Geral' 
                : projects.find(p => p.id === acc.project_id)?.name || acc.project_id || 'Geral';

              return (
                <button
                  key={acc.id}
                  type="button"
                  onClick={() => {
                    if (isSelected) {
                      setSelectedAccountFilter('all');
                      setModuleFilter('all');
                    } else {
                      setSelectedAccountFilter(acc.name);
                      if (acc.project_id) {
                        setModuleFilter(acc.project_id as any);
                      }
                    }
                  }}
                  className={cn(
                    "px-3.5 py-2 rounded-2xl font-bold text-xs transition-all flex items-center gap-2 border shadow-sm",
                    isSelected
                      ? "bg-indigo-600 text-white border-indigo-600 shadow-indigo-600/20 ring-2 ring-indigo-200"
                      : "bg-white text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                  )}
                  title={`Filtrar financeiro da conta "${acc.name}" vinculada ao projeto ${projName}`}
                >
                  <Wallet size={13} className={isSelected ? "text-indigo-200" : "text-slate-400"} />
                  <div className="flex flex-col items-start text-left">
                    <span className="leading-tight">{acc.name}</span>
                    <span className={cn(
                      "text-[9px] font-semibold uppercase tracking-wider",
                      isSelected ? "text-indigo-200" : "text-slate-400"
                    )}>
                      {projName}
                    </span>
                  </div>
                  <span className={cn(
                    "px-1.5 py-0.5 rounded-lg text-[10px] font-black ml-1",
                    isSelected ? "bg-white/20 text-white" : "bg-slate-100 text-slate-600"
                  )}>
                    {count}
                  </span>
                </button>
              );
            })}

            {/* Botões individuais de Projetos para acesso direto */}
            {availableProjectOptions.filter(p => !paymentAccounts.some(a => a.name.toLowerCase() === p.name.toLowerCase())).map(proj => {
              const isSelected = moduleFilter === proj.id && selectedAccountFilter === 'all';
              const count = allExpenses.filter(e => (e.module || 'global') === proj.id).length;
              return (
                <button
                  key={proj.id}
                  type="button"
                  onClick={() => {
                    if (isSelected) {
                      setModuleFilter('all');
                    } else {
                      setModuleFilter(proj.id as any);
                      setSelectedAccountFilter('all');
                    }
                  }}
                  className={cn(
                    "px-3 py-2 rounded-2xl font-bold text-xs transition-all flex items-center gap-1.5 border shadow-sm",
                    isSelected
                      ? "bg-slate-800 text-white border-slate-800 ring-2 ring-slate-800/10"
                      : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                  )}
                  title={`Filtrar todos os gastos do projeto ${proj.name}`}
                >
                  <Building2 size={13} />
                  <span>{proj.name}</span>
                  <span className="text-[10px] opacity-70">({count})</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
      
      {/* Cards de Métricas de Gastos */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 p-8 pb-0">
        
        {/* Total Fixo Mensal */}
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/40 group hover:border-slate-200 transition-all">
          <div className="flex justify-between items-start mb-3">
            <div className="p-3 bg-indigo-50 rounded-2xl text-indigo-600 group-hover:scale-110 transition-transform">
              <Repeat size={22} />
            </div>
            <span className="px-2.5 py-1 bg-indigo-50 text-indigo-700 font-black text-[10px] rounded-lg uppercase tracking-wider">
              {stats.fixedCount} itens fixos
            </span>
          </div>
          <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Gastos Fixos Recorrentes</p>
          <p className="text-3xl font-black text-slate-900 mt-1">
            R$ {stats.totalFixed.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
          <p className="text-[11px] text-slate-400 font-bold mt-2">
            Compromisso estrutural mensal
          </p>
        </div>

        {/* Total Variável do Mês */}
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/40 group hover:border-slate-200 transition-all">
          <div className="flex justify-between items-start mb-3">
            <div className="p-3 bg-rose-50 rounded-2xl text-rose-600 group-hover:scale-110 transition-transform">
              <Clock size={22} />
            </div>
            <span className="px-2.5 py-1 bg-rose-50 text-rose-700 font-black text-[10px] rounded-lg uppercase tracking-wider">
              {stats.variableCount} no período
            </span>
          </div>
          <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">
            Gastos Variáveis {activeMonthLabel ? `(${activeMonthLabel})` : 'do Mês'}
          </p>
          <p className="text-3xl font-black text-rose-600 mt-1">
            R$ {stats.totalVariable.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
          {stats.totalVariableMzn > 0 && (
            <p className="text-xs font-black text-emerald-600 mt-1 flex items-center gap-1.5" title="Total em Meticais das despesas variáveis">
              <span>🇲🇿</span>
              <span>~ {stats.totalVariableMzn.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} MT em Meticais</span>
            </p>
          )}
          <p className="text-[11px] text-slate-400 font-bold mt-2">
            {selectedMonth === 'all' 
              ? `Base: ${activeMonthLabel || 'mês mais recente'} (${stats.allVariableCount} variáveis no total)` 
              : `Filtrado por: ${activeMonthLabel}`}
          </p>
        </div>

        {/* Total Operacional Consolidado */}
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/40 group hover:border-slate-200 transition-all">
          <div className="flex justify-between items-start mb-3">
            <div className="p-3 bg-slate-900 text-white rounded-2xl group-hover:scale-110 transition-transform">
              <Layers size={22} />
            </div>
            <div className="flex items-center gap-1 text-slate-700 font-bold text-xs bg-slate-100 px-2 py-0.5 rounded-lg">
              Custo Total
            </div>
          </div>
          <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Custo Operacional Total</p>
          <p className="text-3xl font-black text-slate-900 mt-1">
            R$ {stats.totalExpense.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
          <p className="text-[11px] text-slate-400 font-bold mt-2">
            Fixo ({((stats.totalFixed / (stats.totalExpense || 1)) * 100).toFixed(0)}%) + Variável ({((stats.totalVariable / (stats.totalExpense || 1)) * 100).toFixed(0)}%)
          </p>
        </div>

        {/* Cobertura com Receitas */}
        <div className="bg-slate-900 p-6 rounded-3xl shadow-xl shadow-slate-200 transition-all text-white relative overflow-hidden group">
          <div className="relative z-10">
            <div className="flex justify-between items-start mb-3">
              <div className="p-3 bg-white/10 rounded-2xl text-emerald-400">
                <DollarSign size={22} />
              </div>
              <span className={cn(
                "px-2.5 py-1 text-white font-bold text-[10px] rounded-lg uppercase tracking-wider",
                stats.fixedCoverage >= 100 ? "bg-emerald-500/30 text-emerald-300" : "bg-amber-500/30 text-amber-300"
              )}>
                {stats.fixedCoverage.toFixed(0)}% Coberto
              </span>
            </div>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Ponto de Equilíbrio</p>
            <p className={cn(
              "text-3xl font-black mt-1",
              stats.balance >= 0 ? "text-white" : "text-rose-400"
            )}>
              {stats.balance >= 0 ? '+' : '-'} R$ {Math.abs(stats.balance).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
            <p className="text-[11px] text-slate-400 font-bold mt-2">
              Saldo pós-cobertura de custos
            </p>
          </div>
          <div className="absolute top-0 right-0 w-28 h-28 bg-emerald-500/10 rounded-full -mr-12 -mt-12 blur-2xl group-hover:bg-emerald-500/20 transition-all"></div>
        </div>

      </div>

      {/* Seção: Custos Mensais por Projeto / Setor (Oculto no Módulo Nutrição) */}
      {!hideProjectBreakdown && (
        <div className="px-8">
          <div className="bg-slate-50/70 border border-slate-200/80 rounded-3xl p-6 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-indigo-100 text-indigo-800 border border-indigo-200">
                    Rateio por Centro de Custo
                  </span>
                  <span className="text-xs text-slate-400 font-bold">• {activeMonthLabel || 'Mês Atual'}</span>
                </div>
                <h4 className="text-base font-black text-slate-900 flex items-center gap-2">
                  <Building2 size={18} className="text-indigo-600" />
                  Custos Mensais por Projeto e Frente Setorial
                </h4>
              </div>
              <div className="text-left sm:text-right">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total Alocado no Período</span>
                <p className="text-lg font-black text-slate-900">
                  R$ {projectCostBreakdown.reduce((acc, p) => acc + p.total, 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>

            {/* Cards dos Projetos */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              {projectCostBreakdown.map((proj) => {
                const isSelected = moduleFilter === proj.projectId;
                const totalCost = stats.totalExpense || 1;
                const percentOfTotal = Math.min(100, (proj.total / totalCost) * 100);

                return (
                  <div 
                    key={proj.projectId}
                    onClick={() => setModuleFilter(prev => prev === proj.projectId ? 'all' : (proj.projectId as any))}
                    className={cn(
                      "p-5 rounded-2xl border transition-all cursor-pointer relative group",
                      isSelected 
                        ? "bg-white border-indigo-500 ring-2 ring-indigo-500/20 shadow-md" 
                        : "bg-white border-slate-200/70 hover:border-slate-300 hover:shadow-sm"
                    )}
                    title="Clique para filtrar apenas os gastos deste projeto"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-2">
                        <div className={cn(
                          "w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs",
                          proj.projectId === 'nutrition' ? "bg-amber-100 text-amber-800" :
                          proj.projectId === 'communication' ? "bg-purple-100 text-purple-800" :
                          "bg-slate-100 text-slate-800"
                        )}>
                          {proj.projectId === 'nutrition' ? 'CN' : proj.projectId === 'communication' ? 'COM' : 'GER'}
                        </div>
                        <div>
                          <h5 className="font-black text-sm text-slate-900">{proj.name}</h5>
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                            {proj.count} {proj.count === 1 ? 'gasto registrado' : 'gastos registrados'}
                          </p>
                        </div>
                      </div>
                      {isSelected && (
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-indigo-50 text-indigo-700 border border-indigo-200">
                          Ativo
                        </span>
                      )}
                    </div>

                    {/* Valor Total do Projeto */}
                    <p className="text-xl font-black text-slate-900 mt-3">
                      R$ {proj.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>

                    {/* Barra de Distribuição */}
                    <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden mt-3">
                      <div 
                        className={cn(
                          "h-full rounded-full transition-all duration-700",
                          proj.projectId === 'nutrition' ? "bg-amber-500" :
                          proj.projectId === 'communication' ? "bg-purple-500" :
                          "bg-indigo-600"
                        )}
                        style={{ width: `${percentOfTotal}%` }}
                      />
                    </div>

                    {/* Detalhamento Fixo vs Variável */}
                    <div className="flex justify-between items-center text-[10px] font-bold text-slate-500 mt-2.5 pt-2 border-t border-slate-100">
                      <span>Fixo: R$ {proj.fixedTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                      <span>Var: R$ {proj.variableTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Ações Rápidas: Botões de Adicionar Gasto Fixo e Variável */}
      <div className="px-8">
        <div className="p-6 bg-slate-900 rounded-3xl text-white shadow-xl flex flex-col sm:flex-row items-center justify-between gap-6 border border-slate-800">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-amber-400/20 text-amber-300 border border-amber-400/30">
                Lançamentos
              </span>
              <span className="text-xs text-slate-400 font-medium">• Custos Mensais</span>
            </div>
            <h3 className="text-xl font-black tracking-tight flex items-center gap-2 text-white">
              <Plus className="text-amber-400" size={22} />
              Área de Lançamento de Custos Mensais
            </h3>
            <p className="text-slate-300 text-xs font-medium mt-1">
              Cadastre despesas fixas recorrentes (aluguel, folha, serviços) ou despesas variáveis do período.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
            <button
              onClick={() => handleOpenModal('fixed')}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-bold text-xs shadow-lg shadow-indigo-600/30 transition-all active:scale-95"
            >
              <Repeat size={16} />
              + Adicionar Gasto Fixo
            </button>
            <button
              onClick={() => handleOpenModal('variable')}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-3 bg-rose-500 hover:bg-rose-400 text-white rounded-2xl font-bold text-xs shadow-lg shadow-rose-500/30 transition-all active:scale-95"
            >
              <Clock size={16} />
              + Adicionar Gasto Variável
            </button>
          </div>
        </div>
      </div>

      {/* Toolbar: Filtros e Abas Segregadas (Design Responsivo Sem Cortes) */}
      <div className="px-8">
        <div className="flex flex-col gap-3.5 bg-slate-50/70 p-4.5 rounded-2xl border border-slate-200/80 shadow-sm">
          
          {/* Linha Superior: Abas e Botão Exportar */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            {/* Seletor de Sub-aba */}
            <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200 shadow-sm text-xs font-bold overflow-x-auto max-w-full">
              <button
                onClick={() => setActiveSubTab('all')}
                className={cn(
                  "px-3.5 py-2 rounded-lg transition-all whitespace-nowrap shrink-0",
                  activeSubTab === 'all' ? "bg-slate-900 text-white shadow-sm" : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/60"
                )}
              >
                Todos ({allExpenses.length})
              </button>
              <button
                onClick={() => setActiveSubTab('fixed')}
                className={cn(
                  "px-3.5 py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 whitespace-nowrap shrink-0",
                  activeSubTab === 'fixed' ? "bg-indigo-600 text-white shadow-sm" : "text-slate-600 hover:text-indigo-700 hover:bg-slate-100/60"
                )}
              >
                <Repeat size={12} className="shrink-0" />
                Fixos ({stats.fixedCount})
              </button>
              <button
                onClick={() => setActiveSubTab('variable')}
                className={cn(
                  "px-3.5 py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 whitespace-nowrap shrink-0",
                  activeSubTab === 'variable' ? "bg-rose-600 text-white shadow-sm" : "text-slate-600 hover:text-rose-700 hover:bg-slate-100/60"
                )}
              >
                <Clock size={12} className="shrink-0" />
                Variáveis ({stats.allVariableCount})
              </button>
            </div>

            {/* Exportar CSV */}
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl text-xs font-bold text-slate-700 shadow-sm transition-all active:scale-95 shrink-0 ml-auto"
              title="Baixar planilha de despesas filtradas"
            >
              <Download size={14} className="text-slate-500 shrink-0" />
              <span>Exportar CSV</span>
            </button>
          </div>

          {/* Linha Inferior: Campo de Busca e Dropdowns de Filtro */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-12 gap-2.5 items-center">
            
            {/* Campo de Busca */}
            <div className="relative col-span-1 sm:col-span-2 md:col-span-3 lg:col-span-4 min-w-[200px]">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input
                type="text"
                placeholder="Buscar despesa ou conta..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-slate-400 shadow-sm"
              />
            </div>

            {/* Filtro de Categoria */}
            <div className="col-span-1 sm:col-span-1 md:col-span-1 lg:col-span-3">
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 shadow-sm focus:outline-none truncate"
              >
                <option value="all">Todas Categorias</option>
                {localCategories.filter(c => c.type === 'expense').map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>

            {/* Filtro de Status */}
            <div className="col-span-1 sm:col-span-1 md:col-span-1 lg:col-span-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 shadow-sm focus:outline-none truncate"
              >
                <option value="all">Todos os Status</option>
                <option value="completed">Efetivados / Pagos</option>
                <option value="pending">Pendentes</option>
              </select>
            </div>

            {/* Filtro de Mês */}
            <div className={cn(
              "col-span-1 sm:col-span-1 md:col-span-1",
              hasMultipleModules ? "lg:col-span-2" : "lg:col-span-3"
            )}>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 shadow-sm focus:outline-none truncate"
              >
                <option value="all">Todos os Meses</option>
                {availableMonths.map(mKey => {
                  const parts = mKey.split('-');
                  let label = mKey;
                  if (parts.length === 2) {
                    const year = parseInt(parts[0], 10);
                    const month = parseInt(parts[1], 10) - 1;
                    const dateObj = new Date(year, month, 1);
                    const rawLabel = dateObj.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
                    label = rawLabel.charAt(0).toUpperCase() + rawLabel.slice(1);
                  }
                  return (
                    <option key={mKey} value={mKey}>{label}</option>
                  );
                })}
              </select>
            </div>

            {/* Filtro de Setor / Projeto (se houver múltiplos) */}
            {hasMultipleModules && (
              <div className="col-span-1 sm:col-span-1 md:col-span-1 lg:col-span-1">
                <select
                  value={moduleFilter}
                  onChange={(e) => setModuleFilter(e.target.value as any)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-2 text-xs font-bold text-slate-700 shadow-sm focus:outline-none truncate"
                >
                  <option value="all">Todos Projetos</option>
                  {availableProjectOptions.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
            )}

          </div>
        </div>
      </div>

      {/* Tabela de Gastos */}
      <div className="px-8 pb-8 overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/50 text-slate-400 text-[10px] uppercase font-black tracking-[0.2em] border-b border-slate-100">
              <th className="px-6 py-4">Status / Vencimento</th>
              <th className="px-6 py-4">Descrição / Categoria</th>
              <th className="px-6 py-4">Tipo de Gasto</th>
              <th className="px-6 py-4">Conta de Débito</th>
              <th className="px-6 py-4 text-right">Valor Mensal</th>
              <th className="px-6 py-4 text-center">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-medium">
            {expensesByMonth.map((group) => (
              <React.Fragment key={group.monthKey}>
                {/* Cabeçalho do Mês */}
                <tr className="bg-slate-100/80 border-y border-slate-200/80">
                  <td colSpan={6} className="px-6 py-2.5">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <Calendar size={14} className="text-slate-600" />
                        <span className="text-xs font-black text-slate-800 tracking-wide uppercase">
                          {group.monthLabel}
                        </span>
                        <span className="text-[11px] font-bold text-slate-500 bg-white px-2 py-0.5 rounded-full border border-slate-200">
                          {group.items.length} {group.items.length === 1 ? 'gasto' : 'gastos'}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                          Subtotal do mês:
                        </span>
                        <span className="text-xs font-black text-rose-600 bg-rose-50 px-2.5 py-0.5 rounded-lg border border-rose-200/60">
                          R$ {group.totalBrl.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                        {group.totalMzn > 0 && (
                          <span className="text-xs font-black text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-lg border border-emerald-200/60">
                            {group.totalMzn.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} MT
                          </span>
                        )}
                      </div>
                    </div>
                  </td>
                </tr>

                {/* Linhas de Gastos do Mês */}
                {group.items.map((t) => {
                  const category = localCategories.find(c => c.id === t.category_id);
                  const isFixed = t.expense_type === 'fixed';

                  return (
                    <tr key={t.id} className="hover:bg-slate-50/80 transition-all group/row">
                      
                      {/* Status e Data */}
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-3">
                          {isFixed ? (
                            <div className="flex flex-col gap-1.5 items-start">
                              {t.status === 'pending' ? (
                                <button
                                  type="button"
                                  onClick={() => openPaymentModal(t)}
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-xs bg-emerald-600 hover:bg-emerald-700 text-white transition-all shadow-sm active:scale-95 group/btn"
                                  title="Clique para registrar o pagamento e alterar o valor pago se necessário"
                                >
                                  <CheckCircle2 size={14} className="group-hover/btn:scale-110 transition-transform" />
                                  <span>Registrar Pagamento</span>
                                </button>
                              ) : (
                                <div className="flex items-center gap-2">
                                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/70">
                                    <CheckCircle2 size={13} className="text-emerald-600" />
                                    <span>Efetivado</span>
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => openPaymentModal(t)}
                                    className="p-1 text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors"
                                    title="Editar pagamento ou alterar valor pago"
                                  >
                                    <Edit2 size={12} />
                                  </button>
                                </div>
                              )}
                              <p className="text-[11px] font-bold text-slate-500">
                                Vencimento: Dia {t.date.split('-')[2] || '10'} todo mês
                              </p>
                            </div>
                          ) : (
                            <>
                              <button
                                type="button"
                                onClick={() => openPaymentModal(t)}
                                title={t.status === 'completed' ? 'Editar pagamento / Marcar como pendente' : 'Registrar pagamento'}
                                className={cn(
                                  "w-9 h-9 rounded-xl flex items-center justify-center transition-all group-hover/row:scale-105 active:scale-90",
                                  t.status === 'completed' ? "bg-emerald-50 text-emerald-600 hover:bg-emerald-100" : "bg-amber-50 text-amber-600 hover:bg-amber-100"
                                )}
                              >
                                {t.status === 'completed' ? <CheckCircle2 size={18} /> : <Clock size={18} />}
                              </button>
                              <div>
                                <p className="text-xs font-black text-slate-900 tracking-wider">
                                  {t.date}
                                </p>
                                <p className={cn(
                                  "text-[10px] font-bold uppercase",
                                  t.status === 'completed' ? "text-emerald-600" : "text-amber-600"
                                )}>
                                  {t.status === 'completed' ? 'Efetivado' : 'A Vencer / Pendente'}
                                </p>
                              </div>
                            </>
                          )}
                        </div>
                      </td>

                      {/* Descrição e Categoria */}
                      <td className="px-6 py-5">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-bold text-slate-900 text-sm">{t.description}</p>
                          {t.currency === 'MZN' && (
                            <span 
                              className="px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-200 shrink-0 inline-flex items-center gap-1"
                              title={t.exchange_rate ? `Câmbio: 1 MZN = R$ ${t.exchange_rate.toFixed(4)}` : 'Moeda Moçambique'}
                            >
                              🇲🇿 MZN
                            </span>
                          )}
                          {hasMultipleModules && t.module && t.module !== 'global' && (
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
                        <div className="flex items-center gap-2 mt-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          <span className={cn("w-2 h-2 rounded-full", category?.color || 'bg-slate-300')}></span>
                          {category?.name || 'Geral / Operações'}
                        </div>
                      </td>

                      {/* Tipo de Gasto */}
                      <td className="px-6 py-5">
                        <div className="flex flex-col gap-1">
                          <span className={cn(
                            "inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider w-fit border shadow-sm",
                            isFixed 
                              ? "bg-indigo-50 text-indigo-700 border-indigo-100" 
                              : "bg-rose-50 text-rose-700 border-rose-100"
                          )}>
                            {isFixed ? (
                              <>
                                <Repeat size={11} />
                                Fixo Recorrente
                              </>
                            ) : (
                              <>
                                <Clock size={11} />
                                Variável
                              </>
                            )}
                          </span>
                          {t.recurrence && t.recurrence !== 'none' && (
                            <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50/80 px-2 py-0.5 rounded-md uppercase tracking-wider w-fit">
                              {t.recurrence === 'monthly' ? 'Mensal' : 
                               t.recurrence === 'bimonthly' ? 'Bimestral' :
                               t.recurrence === 'quarterly' ? 'Trimestral' :
                               t.recurrence === 'semiannual' ? 'Semestral' :
                               t.recurrence === 'yearly' ? 'Anual' : t.recurrence}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Conta de Débito (Clicável para filtrar financeiro do projeto/conta) */}
                      <td className="px-6 py-5">
                        <button
                          type="button"
                          onClick={() => {
                            const isCurrentlySelected = selectedAccountFilter.toLowerCase() === t.account.toLowerCase();
                            if (isCurrentlySelected) {
                              setSelectedAccountFilter('all');
                              setModuleFilter('all');
                            } else {
                              setSelectedAccountFilter(t.account);
                              const matchedAcc = paymentAccounts.find(a => a.name.toLowerCase() === t.account.toLowerCase());
                              if (matchedAcc?.project_id) {
                                setModuleFilter(matchedAcc.project_id as any);
                              } else if (t.module) {
                                setModuleFilter(t.module as any);
                              }
                            }
                          }}
                          className={cn(
                            "px-3 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all inline-flex items-center gap-1.5 border group",
                            selectedAccountFilter.toLowerCase() === t.account.toLowerCase()
                              ? "bg-indigo-600 text-white border-indigo-600 ring-2 ring-indigo-200 shadow-sm"
                              : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-200"
                          )}
                          title={`Clique para filtrar as informações financeiras da conta "${t.account}"`}
                        >
                          <Wallet size={12} className={selectedAccountFilter.toLowerCase() === t.account.toLowerCase() ? "text-indigo-200" : "text-slate-400 group-hover:text-indigo-600"} />
                          <span>{t.account}</span>
                        </button>
                      </td>

                      {/* Valor */}
                      <td className="px-6 py-5 text-right">
                        <p className="text-base font-black text-rose-600 tracking-tight">
                          - R$ {t.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </p>
                        {t.currency === 'MZN' && t.original_amount && (
                          <p 
                            className="text-[11px] font-black text-emerald-700 mt-0.5" 
                            title={t.exchange_rate ? `Taxa aplicada: 1 MZN = R$ ${t.exchange_rate.toFixed(4)}` : undefined}
                          >
                            {t.original_amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} MT
                          </p>
                        )}
                        {isFixed && t.recurrence && t.recurrence !== 'monthly' && t.recurrence !== 'none' && (
                          <p className="text-[10px] font-bold text-indigo-600 mt-0.5">
                            ~ R$ {(t.amount / (t.recurrence === 'bimonthly' ? 2 : t.recurrence === 'quarterly' ? 3 : t.recurrence === 'semiannual' ? 6 : 12)).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}/mês
                          </p>
                        )}
                      </td>

                      {/* Ações */}
                      <td className="px-6 py-5 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => openPaymentModal(t)}
                            className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
                            title="Editar categoria, valor e dados do gasto"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            type="button"
                            onClick={() => openPaymentModal(t)}
                            className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all"
                            title={t.status === 'completed' ? 'Ver / Ajustar valor pago e categoria' : 'Registrar pagamento'}
                          >
                            <Receipt size={16} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(t.id, t.description)}
                            className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                            title="Remover despesa"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>

                    </tr>
                  );
                })}
              </React.Fragment>
            ))}
          </tbody>
        </table>

        {filteredExpenses.length === 0 && (
          <div className="p-16 text-center">
            <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4 text-slate-300">
              <Layers size={32} />
            </div>
            <p className="text-base font-bold text-slate-900">Nenhum gasto encontrado</p>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              Utilize os botões acima para cadastrar seu primeiro gasto mensal fixo ou variável.
            </p>
          </div>
        )}
      </div>

      {/* Modal Dedicado de Cadastro */}
      <ExpenseModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={onSaveExpense}
        categories={localCategories}
        defaultExpenseType={modalDefaultType}
        onAddCategory={handleCategoryCreated}
        paymentAccounts={paymentAccounts}
        onAddPaymentAccount={handleAddPaymentAccount}
      />

      {/* Modal de Criação de Conta de Pagamento */}
      {isCreateAccountModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col animate-in fade-in duration-200">
            {/* Header */}
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-indigo-50/60">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-sm">
                  <Wallet size={20} />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">Nova Conta de Pagamento</h3>
                  <p className="text-xs text-slate-500 font-medium">Vincule a conta a um projeto ou frente financeira</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateAccountModalOpen(false)}
                className="w-8 h-8 rounded-full bg-white hover:bg-slate-100 text-slate-400 hover:text-slate-600 flex items-center justify-center shadow-sm transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSaveNewPaymentAccount} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-slate-500 mb-1.5">
                  Nome da Conta *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Conta Projetos, Conta Obra, Fundo Reserva..."
                  value={newAccountName}
                  onChange={(e) => setNewAccountName(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-800 focus:outline-none focus:border-indigo-500 focus:bg-white transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-slate-500 mb-1.5">
                  Projeto / Setor Vinculado *
                </label>
                <select
                  value={newAccountProjectId}
                  onChange={(e) => setNewAccountProjectId(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-800 focus:outline-none focus:border-indigo-500 focus:bg-white transition-all"
                >
                  <option value="global">Geral / Global (Institucional)</option>
                  <option value="nutrition">Casa Nutri (Nutrição Infantil)</option>
                  <option value="communication">Comunicação & Mídia</option>
                  {projects.filter(p => p.id !== 'nutrition' && p.id !== 'communication').map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                  <option value="custom">+ Outro Projeto / Digitar Novo...</option>
                </select>
              </div>

              {newAccountProjectId === 'custom' && (
                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-slate-500 mb-1.5">
                    Nome do Projeto *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Projeto Alfabetização, Construção..."
                    value={newAccountCustomProject}
                    onChange={(e) => setNewAccountCustomProject(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-800 focus:outline-none focus:border-indigo-500 focus:bg-white transition-all"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-slate-500 mb-1.5">
                  Descrição ou Finalidade (Opcional)
                </label>
                <textarea
                  rows={2}
                  placeholder="Ex: Utilizada para compras de insumos e custeio deste projeto."
                  value={newAccountDescription}
                  onChange={(e) => setNewAccountDescription(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium text-slate-800 focus:outline-none focus:border-indigo-500 focus:bg-white transition-all resize-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsCreateAccountModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 font-bold text-xs text-slate-600 hover:bg-slate-50 transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md shadow-indigo-600/20 transition-all active:scale-95"
                >
                  Salvar Conta
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Registro e Ajuste de Pagamento */}
      {paymentModalTx && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in duration-200">
            {/* Header */}
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-emerald-50/70">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-sm">
                  <CheckCircle2 size={22} />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900">
                    {paymentModalTx.status === 'completed' ? 'Editar Dados / Pagamento' : 'Registrar Pagamento'}
                  </h2>
                  <p className="text-xs text-slate-500 font-medium">
                    Ajuste categoria, data, notas ou valor pago deste lançamento
                  </p>
                </div>
              </div>
              <button 
                type="button"
                onClick={() => setPaymentModalTx(null)} 
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-white/60 rounded-xl transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Form */}
            <form id="payment-form" onSubmit={handleSavePayment} className="p-6 overflow-y-auto flex-1 space-y-5">
              {/* Card de Identificação da Conta */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-2">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Conta / Descrição</span>
                    <p className="font-bold text-slate-900 text-base mt-0.5">{paymentModalTx.description}</p>
                  </div>
                  {paymentModalTx.currency === 'MZN' && (
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-200">
                      🇲🇿 MZN
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap gap-4 pt-1 text-xs text-slate-600">
                  <span>Conta: <strong className="text-slate-800">{paymentModalTx.account}</strong></span>
                  <span>Vencimento: <strong className="text-slate-800">
                    {paymentModalTx.expense_type === 'fixed' ? `Dia ${paymentModalTx.date.split('-')[2] || '10'} todo mês` : paymentModalTx.date}
                  </strong></span>
                </div>
              </div>

              {/* Seção de Valores (Previsto vs Pago) */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Valor Efetivamente Pago
                  </label>
                  <span className="text-xs text-slate-400">
                    Valor Previsto: <strong className="text-slate-600">
                      {paymentModalTx.currency === 'MZN' && paymentModalTx.original_amount 
                        ? `${paymentModalTx.original_amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} MT (R$ ${paymentModalTx.amount.toFixed(2)})`
                        : `R$ ${paymentModalTx.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                      }
                    </strong>
                  </span>
                </div>

                {/* Seletor de Moeda do Pagamento */}
                <div className="flex items-center justify-between pb-1">
                  <span className="text-xs font-semibold text-slate-600">Moeda da Efetivação:</span>
                  <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl">
                    <button
                      type="button"
                      onClick={() => handleTogglePaymentCurrency('BRL')}
                      className={cn(
                        "px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer",
                        paymentCurrency === 'BRL' ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-900"
                      )}
                    >
                      <span>🇧🇷 BRL (R$)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleTogglePaymentCurrency('MZN')}
                      className={cn(
                        "px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer",
                        paymentCurrency === 'MZN' ? "bg-emerald-600 text-white shadow-sm" : "text-slate-500 hover:text-slate-900"
                      )}
                    >
                      <span>🇲🇿 MZN (MT)</span>
                    </button>
                  </div>
                </div>

                {paymentCurrency === 'MZN' ? (
                  <div className="space-y-3 p-4 bg-emerald-50/40 rounded-2xl border border-emerald-100">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-700">Valor Pago em MT (MZN) *</label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">MT</span>
                          <input 
                            required
                            type="number" 
                            step="0.01" 
                            value={paymentOriginalAmount} 
                            onChange={e => handleOriginalAmountChange(e.target.value)} 
                            className="w-full pl-10 pr-3 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none text-base font-bold text-slate-900" 
                            placeholder="0.00" 
                          />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-700">Taxa Câmbio (1 MT = R$)</label>
                        <input 
                          type="number" 
                          step="0.0001" 
                          value={paymentExchangeRate} 
                          onChange={e => handleExchangeRateChange(e.target.value)} 
                          className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none text-sm font-medium text-slate-700" 
                        />
                      </div>
                    </div>

                    <div className="pt-2 border-t border-emerald-100 flex items-center justify-between">
                      <span className="text-xs font-medium text-emerald-900">Total Convertido em Reais:</span>
                      <div className="relative w-44">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">R$</span>
                        <input 
                          required
                          type="number" 
                          step="0.01" 
                          value={paymentAmount} 
                          onChange={e => setPaymentAmount(e.target.value)} 
                          className="w-full pl-10 pr-3 py-1.5 bg-white border border-emerald-300 rounded-xl text-sm font-black text-emerald-800 outline-none" 
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-base font-bold text-slate-400">R$</span>
                      <input 
                        required
                        type="number" 
                        step="0.01" 
                        value={paymentAmount} 
                        onChange={e => setPaymentAmount(e.target.value)} 
                        className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none text-xl font-black text-slate-900" 
                        placeholder="0.00" 
                      />
                    </div>
                  </div>
                )}

                {/* Feedback de alteração de valor */}
                {(() => {
                  const currentVal = parseFloat(paymentAmount) || 0;
                  const prevVal = paymentModalTx.amount;
                  const diff = currentVal - prevVal;
                  if (Math.abs(diff) > 0.01) {
                    return (
                      <div className={cn(
                        "p-2.5 rounded-xl text-xs flex items-center gap-2 border font-medium",
                        diff > 0 
                          ? "bg-amber-50 text-amber-800 border-amber-200" 
                          : "bg-emerald-50 text-emerald-800 border-emerald-200"
                      )}>
                        <AlertCircle size={14} className="shrink-0" />
                        <span>
                          {diff > 0 
                            ? `Valor pago é R$ ${diff.toFixed(2)} maior que o valor cadastrado originalmente.`
                            : `Valor pago é R$ ${Math.abs(diff).toFixed(2)} menor que o valor cadastrado originalmente.`
                          }
                        </span>
                      </div>
                    );
                  }
                  return null;
                })()}
              </div>

              {/* Categoria do Gasto */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Categoria da Despesa *
                </label>
                <CategorySelectWithCreate
                  value={paymentCategoryId}
                  onChange={setPaymentCategoryId}
                  categories={localCategories}
                  type="expense"
                  onCategoryCreated={(newCat) => {
                    setLocalCategories(prev => [...prev.filter(c => c.id !== newCat.id), newCat]);
                    onAddCategory?.(newCat);
                  }}
                  placeholder="Selecione ou altere a categoria..."
                />
              </div>

              {/* Data do Pagamento */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Data em que foi Pago / Vencimento *
                </label>
                <div className="relative">
                  <Calendar size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input 
                    required 
                    type="date" 
                    value={paymentDate} 
                    onChange={e => setPaymentDate(e.target.value)} 
                    className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none text-sm font-medium" 
                  />
                </div>
              </div>

              {/* Observação / Comprovante */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Observações / Comprovante (Opcional)
                </label>
                <textarea 
                  rows={2}
                  value={paymentNotes} 
                  onChange={e => setPaymentNotes(e.target.value)} 
                  placeholder="Ex: Pago via M-Pesa, comprovante #891, desconto aplicado de pontualidade..." 
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none text-sm" 
                />
              </div>

              {/* Status do Lançamento */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-700 block">Status do Lançamento</span>
                  <span className="text-[11px] text-slate-400 block">Definir se a conta consta como liquidada</span>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentStatus('completed')}
                    className={cn(
                      "px-3 py-1.5 rounded-xl font-bold text-xs border transition-all flex items-center gap-1",
                      paymentStatus === 'completed'
                        ? "bg-emerald-600 text-white border-emerald-600 shadow-sm"
                        : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                    )}
                  >
                    <CheckCircle2 size={13} />
                    <span>Efetivado (Pago)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentStatus('pending')}
                    className={cn(
                      "px-3 py-1.5 rounded-xl font-bold text-xs border transition-all flex items-center gap-1",
                      paymentStatus === 'pending'
                        ? "bg-amber-600 text-white border-amber-600 shadow-sm"
                        : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                    )}
                  >
                    <Clock size={13} />
                    <span>Pendente</span>
                  </button>
                </div>
              </div>
            </form>

            {/* Footer */}
            <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
              <button 
                type="button" 
                disabled={isSavingPayment}
                onClick={() => setPaymentModalTx(null)} 
                className="px-5 py-2.5 rounded-xl font-medium text-slate-600 hover:bg-slate-200 transition-colors text-sm"
              >
                Cancelar
              </button>
              <button 
                type="submit" 
                form="payment-form" 
                disabled={isSavingPayment}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2.5 rounded-xl font-bold text-sm transition-colors shadow-sm flex items-center gap-2"
              >
                {isSavingPayment ? (
                  <>
                    <RefreshCw size={16} className="animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Check size={16} />
                    Confirmar Pagamento
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
