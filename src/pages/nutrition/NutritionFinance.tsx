import React, { useState, useEffect, useMemo } from 'react';
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
  Users
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { cn } from '../../lib/utils';
import { TransactionModal } from '../../components/admin/finance/TransactionModal';
import { CategoryModal } from '../../components/admin/finance/CategoryModal';
import { useConfirm } from '../../contexts/ConfirmContext';
import { Transaction, TransactionCategory } from '../admin/Finance';

interface NutritionStaff {
  id: string;
  name: string;
  role: string;
  cost_aid_amount: number;
  status: 'active' | 'inactive';
}

export function NutritionFinance() {
  const { confirm } = useConfirm();
  const [activeTab, setActiveTab] = useState<'transactions' | 'planning' | 'staff'>('transactions');
  
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<TransactionCategory[]>([]);
  const [staff, setStaff] = useState<NutritionStaff[]>([]);

  const [isTxModalOpen, setIsTxModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all');

  const fetchData = async () => {
    try {
      const [txRes, catRes, staffRes] = await Promise.all([
        supabase.from('finance_transactions').select('*').eq('module', 'nutrition').order('date', { ascending: false }),
        supabase.from('finance_categories').select('*').order('name', { ascending: true }),
        supabase.from('nutrition_staff').select('*').order('name', { ascending: true })
      ]);
      if (txRes.data) setTransactions(txRes.data);
      if (catRes.data) setCategories(catRes.data);
      if (staffRes.data) setStaff(staffRes.data);
    } catch (e) {
      console.error('Error fetching nutrition finance data:', e);
    }
  };

  useEffect(() => {
    fetchData();

    const channels = supabase.channel('nutrition-finance-updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'finance_transactions', filter: 'module=eq.nutrition' }, () => fetchData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'nutrition_staff' }, () => fetchData())
      .subscribe();

    return () => {
      supabase.removeChannel(channels);
    };
  }, []);

  const stats = useMemo(() => {
    const income = transactions.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
    const expense = transactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);
    const fixedExpense = transactions.filter(t => t.type === 'expense' && t.expense_type === 'fixed').reduce((acc, t) => acc + t.amount, 0);
    const totalCostAid = staff.filter(s => s.status === 'active').reduce((acc, s) => acc + (s.cost_aid_amount || 0), 0);
    
    return {
      totalIncome: income,
      totalExpense: expense,
      balance: income - expense,
      fixedExpense,
      totalCostAid
    };
  }, [transactions, staff]);

  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      const matchesType = filterType === 'all' || t.type === filterType;
      const matchesSearch = t.description.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesType && matchesSearch;
    });
  }, [transactions, filterType, searchTerm]);

  const handleSaveTransaction = async (newTx: Omit<Transaction, 'id'>) => {
    const { error } = await supabase.from('finance_transactions').insert([{ ...newTx, module: 'nutrition' }]);
    if (error) {
      console.error('Error saving transaction:', error);
      alert('Erro ao salvar transação');
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-3xl font-extrabold text-emerald-900 tracking-tight flex items-center gap-3">
            <div className="p-2 bg-emerald-100 rounded-xl">
              <DollarSign className="text-emerald-700" size={24} />
            </div>
            Finanças - Nutrição
          </h1>
          <p className="text-emerald-700/70 mt-2 font-medium">Gestão financeira, planejamento e controle de RH da Nutrição.</p>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          {activeTab === 'transactions' && (
            <button 
              onClick={() => setIsTxModalOpen(true)}
              className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-2xl font-bold text-sm shadow-xl shadow-emerald-200 hover:bg-emerald-700 transition-all active:scale-95"
            >
              <Plus size={20} />
              Nova Despesa/Receita
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-emerald-100 shadow-xl shadow-emerald-50">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-emerald-50 rounded-2xl text-emerald-600"><TrendingUp size={24} /></div>
          </div>
          <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">Total de Receitas</p>
          <p className="text-2xl font-black text-slate-900 mt-1">R$ {stats.totalIncome.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
        </div>
        
        <div className="bg-white p-6 rounded-3xl border border-rose-100 shadow-xl shadow-rose-50">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-rose-50 rounded-2xl text-rose-600"><TrendingDown size={24} /></div>
          </div>
          <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">Total de Despesas</p>
          <p className="text-2xl font-black text-slate-900 mt-1">R$ {stats.totalExpense.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xl shadow-slate-50">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-indigo-50 rounded-2xl text-indigo-600"><Wallet size={24} /></div>
          </div>
          <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">Saldo do Departamento</p>
          <p className={cn("text-2xl font-black mt-1", stats.balance >= 0 ? "text-slate-900" : "text-rose-600")}>
            R$ {stats.balance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
        </div>

        <div className="bg-emerald-900 p-6 rounded-3xl shadow-xl shadow-emerald-200 text-white relative overflow-hidden">
          <div className="relative z-10">
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-white/10 rounded-2xl"><Users size={24} /></div>
            </div>
            <p className="text-emerald-200 text-xs font-bold uppercase tracking-widest">Custo de Equipe / Mês</p>
            <p className="text-2xl font-black mt-1">R$ {stats.totalCostAid.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-2xl shadow-slate-200/50 overflow-hidden">
        <div className="px-8 pt-6 flex border-b border-slate-100">
          {['transactions', 'planning', 'staff'].map((tab) => (
            <button 
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={cn(
                "px-6 py-4 font-bold text-sm transition-all relative",
                activeTab === tab ? "text-emerald-700" : "text-slate-400 hover:text-slate-600"
              )}
            >
              {tab === 'transactions' ? 'Transações' : tab === 'planning' ? 'Planejamento' : 'RH e Voluntários'}
              {activeTab === tab && <div className="absolute bottom-0 left-6 right-6 h-1 bg-emerald-600 rounded-t-full"></div>}
            </button>
          ))}
        </div>

        {activeTab === 'transactions' ? (
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
                          <p className="font-bold text-slate-900 uppercase text-sm">{t.description}</p>
                          <div className="flex items-center gap-2 mt-1 text-[10px] font-bold text-slate-400">
                            <span className={cn("w-2 h-2 rounded-full", category?.color || 'bg-slate-300')}></span>
                            {category?.name || 'Sem categoria'}
                          </div>
                        </td>
                        <td className="px-8 py-4">
                          <span className={cn(
                            "px-3 py-1 rounded-lg text-[10px] font-black uppercase w-fit border",
                            t.type === 'income' ? "bg-emerald-50 text-emerald-700 border-emerald-100" : "bg-rose-50 text-rose-700 border-rose-100"
                          )}>
                            {t.type === 'income' ? 'Receita' : t.expense_type === 'fixed' ? 'Fixa' : 'Variável'}
                          </span>
                        </td>
                        <td className="px-8 py-4 text-right">
                          <p className={cn("text-lg font-black", t.type === 'income' ? "text-emerald-600" : "text-rose-600")}>
                            {t.type === 'income' ? '+' : '-'} R$ {t.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </p>
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
        ) : activeTab === 'planning' ? (
          <div className="p-8">
            <h3 className="text-xl font-bold text-slate-900 mb-6">Orçamento e Planejamento</h3>
            <div className="bg-slate-50 p-6 rounded-2xl text-center text-slate-500">
              Funcionalidade de planejamento orçamentário detalhado em desenvolvimento.
            </div>
          </div>
        ) : (
          <div className="p-8">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-slate-900">Equipe de Apoio</h3>
              <button className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-xl font-bold text-sm shadow-md hover:bg-slate-800">
                <Plus size={16} /> Adicionar Membro
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {staff.map(s => (
                <div key={s.id} className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm">
                  <div className="flex justify-between items-start mb-4">
                    <div className="w-12 h-12 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center font-bold text-xl">
                      {s.name.charAt(0)}
                    </div>
                    <span className={cn(
                      "px-2 py-1 rounded text-[10px] font-bold uppercase",
                      s.status === 'active' ? "bg-emerald-50 text-emerald-600" : "bg-slate-100 text-slate-500"
                    )}>
                      {s.status}
                    </span>
                  </div>
                  <h4 className="font-bold text-slate-900">{s.name}</h4>
                  <p className="text-xs text-slate-500 uppercase tracking-widest font-bold mt-1 mb-4">{s.role}</p>
                  
                  <div className="pt-4 border-t border-slate-100 flex justify-between items-center">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Ajuda de Custo</span>
                    <span className="text-lg font-black text-slate-900">R$ {(s.cost_aid_amount || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                  </div>
                </div>
              ))}
              {staff.length === 0 && (
                <div className="col-span-full p-12 text-center text-slate-500 bg-slate-50 rounded-2xl">
                  Nenhum membro cadastrado.
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <TransactionModal 
        isOpen={isTxModalOpen}
        onClose={() => setIsTxModalOpen(false)}
        onSave={handleSaveTransaction}
        categories={categories}
      />
    </div>
  );
}
