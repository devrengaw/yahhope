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
  Trash2
} from 'lucide-react';
import { mockTransactions, mockTransactionCategories, Transaction, TransactionCategory } from '../../lib/mockData';
import { TransactionModal } from '../../components/admin/finance/TransactionModal';
import { CategoryModal } from '../../components/admin/finance/CategoryModal';
import { cn } from '../../lib/utils';

export function Finance() {
  const [activeTab, setActiveTab] = useState<'transactions' | 'categories'>('transactions');
  const [transactions, setTransactions] = useState<Transaction[]>(
    [...mockTransactions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  );
  const [categories, setCategories] = useState<TransactionCategory[]>(mockTransactionCategories);
  
  const [isTxModalOpen, setIsTxModalOpen] = useState(false);
  const [isCatModalOpen, setIsCatModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<TransactionCategory | null>(null);

  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all');
  const [filterExpenseType, setFilterExpenseType] = useState<'all' | 'fixed' | 'variable'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const stats = useMemo(() => {
    const income = transactions
      .filter(t => t.type === 'income')
      .reduce((acc, t) => acc + t.amount, 0);
    const expense = transactions
      .filter(t => t.type === 'expense')
      .reduce((acc, t) => acc + t.amount, 0);
    const fixedExpense = transactions
      .filter(t => t.type === 'expense' && t.expense_type === 'fixed')
      .reduce((acc, t) => acc + t.amount, 0);
    const variableExpense = transactions
      .filter(t => t.type === 'expense' && t.expense_type === 'variable')
      .reduce((acc, t) => acc + t.amount, 0);
    
    return {
      totalIncome: income,
      totalExpense: expense,
      balance: income - expense,
      fixedExpense,
      variableExpense,
      fixedPercentage: expense > 0 ? (fixedExpense / expense) * 100 : 0
    };
  }, [transactions]);

  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      const matchesType = filterType === 'all' || t.type === filterType;
      const matchesExpenseType = filterExpenseType === 'all' || t.expense_type === filterExpenseType;
      const matchesSearch = t.description.toLowerCase().includes(searchTerm.toLowerCase()) || 
                           t.account.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesType && matchesExpenseType && matchesSearch;
    });
  }, [transactions, filterType, filterExpenseType, searchTerm]);

  const handleSaveTransaction = (newTx: Omit<Transaction, 'id'>) => {
    const transaction: Transaction = {
      ...newTx,
      id: Math.random().toString(36).substring(2, 9),
    };
    
    const updated = [transaction, ...transactions].sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
    
    setTransactions(updated);
  };

  const handleSaveCategory = (cat: Omit<TransactionCategory, 'id'> & { id?: string }) => {
    if (cat.id) {
      setCategories(prev => prev.map(c => c.id === cat.id ? { ...c, ...cat } as TransactionCategory : c));
    } else {
      const newCategory: TransactionCategory = {
        ...cat,
        id: Math.random().toString(36).substring(2, 9)
      } as TransactionCategory;
      setCategories(prev => [...prev, newCategory]);
    }
    setEditingCategory(null);
  };

  const handleDeleteCategory = (id: string) => {
    if (confirm('Tem certeza que deseja excluir esta categoria? Transações vinculadas a ela não serão excluídas, mas perderão a referência.')) {
      setCategories(prev => prev.filter(c => c.id !== id));
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
          <button className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-white border-2 border-slate-100 rounded-2xl text-slate-600 font-bold text-sm shadow-sm hover:bg-slate-50 transition-all active:scale-95">
            <Download size={20} className="text-slate-400" />
            Relatórios
          </button>
          <button 
            onClick={() => activeTab === 'transactions' ? setIsTxModalOpen(true) : setIsCatModalOpen(true)}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-2xl font-bold text-sm shadow-xl shadow-slate-200 hover:bg-slate-800 transition-all active:scale-95"
          >
            <Plus size={20} />
            {activeTab === 'transactions' ? 'Novo Lançamento' : 'Nova Categoria'}
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-200/50 group hover:border-slate-200 transition-all">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-emerald-50 rounded-2xl text-emerald-600 group-hover:scale-110 transition-transform">
              <TrendingUp size={24} />
            </div>
            <div className="flex items-center gap-1 text-emerald-600 font-bold text-xs bg-emerald-50 px-2 py-1 rounded-lg">
              <ArrowUpRight size={14} />
              +12%
            </div>
          </div>
          <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">Total de Entradas</p>
          <p className="text-2xl font-black text-slate-900 mt-1">
            R$ {stats.totalIncome.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
        </div>

        <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-200/50 group hover:border-slate-200 transition-all">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-rose-50 rounded-2xl text-rose-600 group-hover:scale-110 transition-transform">
              <TrendingDown size={24} />
            </div>
            <div className="flex items-center gap-1 text-rose-600 font-bold text-xs bg-rose-50 px-2 py-1 rounded-lg">
              <ArrowDownRight size={14} />
              -5%
            </div>
          </div>
          <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">Total de Saídas</p>
          <p className="text-2xl font-black text-slate-900 mt-1">
            R$ {stats.totalExpense.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
        </div>

        <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-200/50 group hover:border-slate-200 transition-all">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-indigo-50 rounded-2xl text-indigo-600 group-hover:scale-110 transition-transform">
              <Wallet size={24} />
            </div>
          </div>
          <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">Saldo em Caixa</p>
          <p className={cn(
            "text-2xl font-black mt-1",
            stats.balance >= 0 ? "text-slate-900" : "text-rose-600"
          )}>
            R$ {stats.balance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
        </div>

        <div className="bg-slate-900 p-8 rounded-[2rem] shadow-xl shadow-slate-200 transition-all relative overflow-hidden group">
          <div className="relative z-10">
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-white/10 rounded-2xl text-white">
                <Layers size={24} />
              </div>
            </div>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Custo Fixo Mensal</p>
            <p className="text-2xl font-black text-white mt-1">
              R$ {stats.fixedExpense.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
            <div className="mt-4 bg-white/10 h-1.5 rounded-full overflow-hidden">
              <div 
                className="bg-indigo-400 h-full rounded-full transition-all duration-1000" 
                style={{ width: `${stats.fixedPercentage}%` }}
              />
            </div>
            <p className="text-[10px] text-slate-400 mt-2 font-bold uppercase tracking-wider text-right">
              {stats.fixedPercentage.toFixed(1)}% das despesas totais
            </p>
          </div>
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full -mr-16 -mt-16 blur-2xl group-hover:bg-indigo-500/20 transition-all duration-700"></div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-2xl shadow-slate-200/50 overflow-hidden">
        {/* Tabs */}
        <div className="px-8 pt-6 flex border-b border-slate-100">
          <button 
            onClick={() => setActiveTab('transactions')}
            className={cn(
              "px-6 py-4 font-bold text-sm transition-all relative",
              activeTab === 'transactions' ? "text-slate-900" : "text-slate-400 hover:text-slate-600"
            )}
          >
            Transações
            {activeTab === 'transactions' && <div className="absolute bottom-0 left-6 right-6 h-1 bg-slate-900 rounded-t-full"></div>}
          </button>
          <button 
            onClick={() => setActiveTab('categories')}
            className={cn(
              "px-6 py-4 font-bold text-sm transition-all relative",
              activeTab === 'categories' ? "text-slate-900" : "text-slate-400 hover:text-slate-600"
            )}
          >
            Categorias
            {activeTab === 'categories' && <div className="absolute bottom-0 left-6 right-6 h-1 bg-slate-900 rounded-t-full"></div>}
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

                  <button className="p-3 bg-white border-2 border-slate-100 rounded-2xl text-slate-400 hover:text-slate-600 transition-all shadow-sm active:scale-95">
                    <Filter size={20} />
                  </button>
                </div>
              </div>
            </div>

            {/* Transactions Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/50 text-slate-400 text-[10px] uppercase font-black tracking-[0.2em] border-b border-slate-100">
                    <th className="px-8 py-5">Status / Data</th>
                    <th className="px-8 py-5">Descrição / Categoria</th>
                    <th className="px-8 py-5">Tipo / Recorrência</th>
                    <th className="px-8 py-5">Conta / Origem</th>
                    <th className="px-8 py-5 text-right">Valor</th>
                    <th className="px-8 py-5 text-center">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredTransactions.map((t) => {
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
                          <p className="font-bold text-slate-900 leading-tight group-hover/row:text-slate-600 transition-colors uppercase text-sm tracking-tight">{t.description}</p>
                          <div className="flex items-center gap-2 mt-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                            <span className={cn("w-2 h-2 rounded-full", category?.color || 'bg-slate-300')}></span>
                            {category?.name || 'Sem Categoria'}
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
                              <span className="inline-flex items-center justify-center px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-tighter w-fit bg-emerald-50 text-emerald-700 border border-emerald-100 shadow-sm">
                                Receita
                              </span>
                            )}
                            {t.recurrence && t.recurrence !== 'none' && (
                              <div className="flex items-center gap-1 text-slate-400">
                                <Calendar size={12} />
                                <span className="text-[10px] font-bold uppercase">{t.recurrence}</span>
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-8 py-6 text-sm font-bold text-slate-500 uppercase tracking-widest">
                          {t.account}
                        </td>
                        <td className="px-8 py-6 text-right">
                          <p className={cn(
                            "text-lg font-black tracking-tighter",
                            t.type === 'income' ? "text-emerald-600" : "text-rose-600"
                          )}>
                            {t.type === 'income' ? '+' : '-'} R$ {t.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </p>
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

            {/* Empty State */}
            {filteredTransactions.length === 0 && (
              <div className="p-20 text-center">
                <div className="w-20 h-20 bg-slate-50 rounded-[2rem] flex items-center justify-center mx-auto mb-6">
                  <Filter className="text-slate-200" size={40} />
                </div>
                <h3 className="text-xl font-bold text-slate-900">Nenhum lançamento encontrado</h3>
                <p className="text-slate-400 mt-2 font-medium max-w-xs mx-auto">Tente ajustar seus filtros ou busca para encontrar o que procura.</p>
              </div>
            )}
          </>
        ) : (
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
        )}

        {/* Pagination Footer */}
        <div className="p-6 bg-slate-50/30 border-t border-slate-100 flex justify-between items-center px-10">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
            {activeTab === 'transactions' 
              ? `Mostrando ${filteredTransactions.length} de ${transactions.length} lançamentos`
              : `Total de ${categories.length} categorias cadastradas`
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
    </div>
  );
}
