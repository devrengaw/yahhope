import React, { useState, useEffect, useMemo } from 'react';
import { 
  DollarSign, 
  Plus, 
  TrendingUp, 
  TrendingDown, 
  Wallet, 
  Repeat, 
  Clock, 
  ShieldCheck, 
  MessageSquare,
  Sparkles,
  Layers,
  Search,
  Download
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { cn } from '../../lib/utils';
import { MonthlyExpensesManager } from '../../components/admin/finance/MonthlyExpensesManager';
import { ExpenseModal, ExpensePayload } from '../../components/admin/finance/ExpenseModal';
import { ManageCostsAccessModal } from '../../components/admin/finance/ManageCostsAccessModal';
import { CostsAccessGuard } from '../../components/common/CostsAccessGuard';
import { useAuth } from '../../contexts/AuthContext';
import { Transaction, TransactionCategory } from '../admin/Finance';

export function CommCosts() {
  const { user } = useAuth();
  const isMasterAdmin = user?.role === 'ADMIN' || user?.email?.toLowerCase() === 'contato@yahhope.com';

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<TransactionCategory[]>([]);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [expenseModalType, setExpenseModalType] = useState<'fixed' | 'variable'>('fixed');
  const [isAccessModalOpen, setIsAccessModalOpen] = useState(false);

  const fetchData = async () => {
    try {
      const [txRes, catRes] = await Promise.all([
        supabase.from('finance_transactions').select('*').eq('module', 'communication').order('date', { ascending: false }),
        supabase.from('finance_categories').select('*').order('name', { ascending: true })
      ]);
      if (txRes.data) setTransactions(txRes.data);
      if (catRes.data) setCategories(catRes.data);
    } catch (e) {
      console.error('Erro ao carregar finanças de comunicação:', e);
    }
  };

  useEffect(() => {
    fetchData();

    const channel = supabase.channel('comm-finance-updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'finance_transactions', filter: 'module=eq.communication' }, () => fetchData())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const stats = useMemo(() => {
    const fixedExpenses = transactions.filter(t => t.type === 'expense' && t.expense_type === 'fixed');
    const variableExpenses = transactions.filter(t => t.type === 'expense' && t.expense_type === 'variable');
    
    // Custo mensal estrutural amortizado
    const monthlyEquivalentFixed = fixedExpenses.reduce((acc, t) => {
      const rec = t.recurrence || 'monthly';
      if (rec === 'bimonthly') return acc + (t.amount / 2);
      if (rec === 'quarterly') return acc + (t.amount / 3);
      if (rec === 'semiannual') return acc + (t.amount / 6);
      if (rec === 'yearly') return acc + (t.amount / 12);
      return acc + t.amount;
    }, 0);

    const totalVariable = variableExpenses.reduce((acc, t) => acc + t.amount, 0);
    const totalExpense = monthlyEquivalentFixed + totalVariable;

    return {
      totalFixed: monthlyEquivalentFixed,
      totalVariable,
      totalExpense,
      fixedCount: fixedExpenses.length,
      variableCount: variableExpenses.length
    };
  }, [transactions]);

  const handleSaveExpense = async (newExpense: ExpensePayload) => {
    try {
      const payload = {
        description: newExpense.description,
        amount: newExpense.amount,
        type: newExpense.type,
        category_id: newExpense.category_id,
        date: newExpense.date,
        status: newExpense.status,
        account: newExpense.account,
        expense_type: newExpense.expense_type,
        recurrence: newExpense.recurrence,
        module: 'communication'
      };
      const { data, error } = await supabase.from('finance_transactions').insert([payload]).select();
      if (error) throw error;
      if (data && data[0]) {
        setTransactions(prev => [data[0] as Transaction, ...prev]);
      }
    } catch (e) {
      console.warn('Erro ao salvar no Supabase, adicionando localmente:', e);
      const localTx: Transaction = {
        id: 'tx_comm_' + Math.random().toString(36).substring(2, 9),
        description: newExpense.description,
        amount: newExpense.amount,
        type: newExpense.type,
        category_id: newExpense.category_id,
        date: newExpense.date,
        status: newExpense.status,
        account: newExpense.account,
        expense_type: newExpense.expense_type,
        recurrence: newExpense.recurrence,
        module: 'communication'
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

  return (
    <CostsAccessGuard module="communication">
      <div className="space-y-8 animate-in fade-in duration-700">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-purple-100 text-purple-800 border border-purple-200">
                Comunicação & Mídia
              </span>
              <span className="text-xs text-slate-400 font-bold">• Conectado ao Financeiro Global</span>
            </div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
              <div className="p-2 bg-purple-600 text-white rounded-xl shadow-md shadow-purple-600/20">
                <DollarSign size={24} />
              </div>
              Custos Fixos & Variados da Comunicação
            </h1>
            <p className="text-slate-500 mt-1 font-medium text-sm">
              Controle orçamentário de softwares de e-mail, servidores de mídia, tráfego pago e produção de conteúdo.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            {/* Botão de Controle de Acesso para Super Admin */}
            {isMasterAdmin && (
              <button
                onClick={() => setIsAccessModalOpen(true)}
                className="flex items-center gap-1.5 px-4 py-3 bg-white border-2 border-purple-100 hover:border-purple-300 text-purple-800 rounded-2xl font-bold text-xs shadow-sm hover:bg-purple-50/50 transition-all active:scale-95"
                title="Configurar colaboradores que podem ver os custos"
              >
                <ShieldCheck size={16} className="text-purple-600" />
                Quem Tem Acesso
              </button>
            )}

            <button 
              onClick={() => { setExpenseModalType('fixed'); setIsExpenseModalOpen(true); }}
              className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-2xl font-bold text-sm shadow-xl shadow-purple-600/20 hover:bg-purple-700 transition-all active:scale-95"
            >
              <Plus size={20} />
              Novo Gasto Comunicação
            </button>
          </div>
        </div>

        {/* Stats Cards de Comunicação */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/40">
            <div className="flex justify-between items-start mb-3">
              <div className="p-3 bg-indigo-50 rounded-2xl text-indigo-600">
                <Repeat size={22} />
              </div>
              <span className="px-2.5 py-1 bg-indigo-50 text-indigo-700 font-black text-[10px] rounded-lg uppercase tracking-wider">
                {stats.fixedCount} itens fixos
              </span>
            </div>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Custos Fixos Mensais</p>
            <p className="text-3xl font-black text-slate-900 mt-1">
              R$ {stats.totalFixed.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
            <p className="text-[11px] text-slate-400 font-bold mt-2">
              Softwares, servidores e assinaturas
            </p>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/40">
            <div className="flex justify-between items-start mb-3">
              <div className="p-3 bg-rose-50 rounded-2xl text-rose-600">
                <Clock size={22} />
              </div>
              <span className="px-2.5 py-1 bg-rose-50 text-rose-700 font-black text-[10px] rounded-lg uppercase tracking-wider">
                {stats.variableCount} itens variáveis
              </span>
            </div>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Gastos Variáveis do Mês</p>
            <p className="text-3xl font-black text-rose-600 mt-1">
              R$ {stats.totalVariable.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
            <p className="text-[11px] text-slate-400 font-bold mt-2">
              Tráfego pago, gráfica e campanhas
            </p>
          </div>

          <div className="bg-slate-900 p-6 rounded-3xl shadow-xl shadow-slate-200 text-white relative overflow-hidden group">
            <div className="relative z-10">
              <div className="flex justify-between items-start mb-3">
                <div className="p-3 bg-white/10 rounded-2xl text-purple-400">
                  <Layers size={22} />
                </div>
                <span className="px-2.5 py-1 bg-white/10 text-white font-bold text-[10px] rounded-lg uppercase tracking-wider">
                  Total Setor
                </span>
              </div>
              <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Custo Total de Comunicação</p>
              <p className="text-3xl font-black text-white mt-1">
                R$ {stats.totalExpense.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
              <p className="text-[11px] text-slate-400 font-bold mt-2">
                Comprometimento orçamentário mensal
              </p>
            </div>
            <div className="absolute top-0 right-0 w-28 h-28 bg-purple-500/10 rounded-full -mr-12 -mt-12 blur-2xl group-hover:bg-purple-500/20 transition-all"></div>
          </div>

        </div>

        {/* Gerenciador de Custos Segregados */}
        <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-2xl shadow-slate-200/50 overflow-hidden">
          <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
            <h3 className="text-base font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Repeat size={18} className="text-purple-600" />
              Lançamentos de Custos Fixos & Variáveis
            </h3>
            <span className="text-xs font-bold text-slate-500">
              {transactions.length} registros no setor
            </span>
          </div>

          <MonthlyExpensesManager
            transactions={transactions}
            categories={categories}
            totalIncome={0}
            onSaveExpense={handleSaveExpense}
            onDeleteTransaction={handleDeleteTransaction}
            onToggleStatus={handleToggleStatus}
          />
        </div>

        {/* Modais */}
        <ExpenseModal
          isOpen={isExpenseModalOpen}
          onClose={() => setIsExpenseModalOpen(false)}
          onSave={handleSaveExpense}
          categories={categories}
          defaultExpenseType={expenseModalType}
        />

        <ManageCostsAccessModal
          isOpen={isAccessModalOpen}
          onClose={() => setIsAccessModalOpen(false)}
          targetModule="communication"
        />

      </div>
    </CostsAccessGuard>
  );
}
