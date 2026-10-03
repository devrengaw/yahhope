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
  Building2
} from 'lucide-react';
import { Transaction, TransactionCategory } from '../../../pages/admin/Finance';
import { ExpenseModal, ExpensePayload } from './ExpenseModal';
import { cn } from '../../../lib/utils';
import { useConfirm } from '../../../contexts/ConfirmContext';

interface MonthlyExpensesManagerProps {
  transactions: Transaction[];
  categories: TransactionCategory[];
  totalIncome: number;
  onSaveExpense: (expense: ExpensePayload) => Promise<void> | void;
  onDeleteTransaction: (id: string) => Promise<void> | void;
  onToggleStatus: (id: string, currentStatus: 'completed' | 'pending') => Promise<void> | void;
}

export function MonthlyExpensesManager({
  transactions,
  categories,
  totalIncome,
  onSaveExpense,
  onDeleteTransaction,
  onToggleStatus
}: MonthlyExpensesManagerProps) {
  const { confirm } = useConfirm();
  const [activeSubTab, setActiveSubTab] = useState<'all' | 'fixed' | 'variable'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'completed' | 'pending'>('all');
  const [moduleFilter, setModuleFilter] = useState<'all' | 'nutrition' | 'communication' | 'global'>('all');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalDefaultType, setModalDefaultType] = useState<'fixed' | 'variable'>('fixed');

  // Detecta se existem lançamentos de múltiplos setores
  const hasMultipleModules = useMemo(() => {
    const modules = new Set(transactions.map(t => t.module || 'global'));
    return modules.size > 1;
  }, [transactions]);

  // Todas as despesas
  const allExpenses = useMemo(() => {
    return transactions.filter(t => t.type === 'expense');
  }, [transactions]);

  // Cálculos de Indicadores de Custos Mensais
  const stats = useMemo(() => {
    const fixedExpenses = allExpenses.filter(t => t.expense_type === 'fixed');
    const variableExpenses = allExpenses.filter(t => t.expense_type === 'variable');

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

    const totalVariable = variableExpenses.reduce((acc, t) => acc + t.amount, 0);
    const totalExpense = monthlyEquivalentFixed + totalVariable;

    // Percentual de cobertura do custo fixo pelas receitas totais
    const fixedCoverage = monthlyEquivalentFixed > 0 ? (totalIncome / monthlyEquivalentFixed) * 100 : 100;
    const balance = totalIncome - totalExpense;

    return {
      totalFixed: monthlyEquivalentFixed,
      totalFixedNominal,
      totalVariable,
      totalExpense,
      fixedCount: fixedExpenses.length,
      variableCount: variableExpenses.length,
      fixedCoverage,
      balance
    };
  }, [allExpenses, totalIncome]);

  // Lista Filtrada
  const filteredExpenses = useMemo(() => {
    return allExpenses.filter(t => {
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

      return matchType && matchSearch && matchCat && matchStatus && matchModule;
    });
  }, [allExpenses, activeSubTab, searchTerm, categoryFilter, statusFilter, moduleFilter]);

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
              {stats.variableCount} itens variáveis
            </span>
          </div>
          <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Gastos Variáveis do Mês</p>
          <p className="text-3xl font-black text-rose-600 mt-1">
            R$ {stats.totalVariable.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
          <p className="text-[11px] text-slate-400 font-bold mt-2">
            Despesas operacionais e emergências
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

      {/* Ações Rápidas: Botões de Adicionar Gasto Fixo e Variável */}
      <div className="px-8">
        <div className="p-6 bg-gradient-to-r from-slate-900 to-slate-800 rounded-3xl text-white shadow-xl flex flex-col sm:flex-row items-center justify-between gap-6">
          <div>
            <h3 className="text-xl font-black tracking-tight flex items-center gap-2">
              <Plus className="text-amber-400" size={24} />
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

      {/* Toolbar: Filtros e Abas Segregadas */}
      <div className="px-8">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-slate-50/60 p-4 rounded-2xl border border-slate-100">
          
          {/* Seletor de Sub-aba */}
          <div className="flex bg-white p-1 rounded-xl border border-slate-200 shadow-sm text-xs font-bold w-full sm:w-auto">
            <button
              onClick={() => setActiveSubTab('all')}
              className={cn(
                "flex-1 sm:flex-none px-4 py-2 rounded-lg transition-all",
                activeSubTab === 'all' ? "bg-slate-900 text-white shadow" : "text-slate-500 hover:text-slate-900"
              )}
            >
              Todos ({allExpenses.length})
            </button>
            <button
              onClick={() => setActiveSubTab('fixed')}
              className={cn(
                "flex-1 sm:flex-none px-4 py-2 rounded-lg transition-all flex items-center justify-center gap-1.5",
                activeSubTab === 'fixed' ? "bg-indigo-600 text-white shadow" : "text-slate-500 hover:text-indigo-700"
              )}
            >
              <Repeat size={12} />
              Fixos ({stats.fixedCount})
            </button>
            <button
              onClick={() => setActiveSubTab('variable')}
              className={cn(
                "flex-1 sm:flex-none px-4 py-2 rounded-lg transition-all flex items-center justify-center gap-1.5",
                activeSubTab === 'variable' ? "bg-rose-600 text-white shadow" : "text-slate-500 hover:text-rose-700"
              )}
            >
              <Clock size={12} />
              Variáveis ({stats.variableCount})
            </button>
          </div>

          {/* Busca e Filtros Complementares */}
          <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input
                type="text"
                placeholder="Buscar despesa ou conta..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-slate-400 shadow-sm"
              />
            </div>

            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 shadow-sm focus:outline-none"
            >
              <option value="all">Todas Categorias</option>
              {categories.filter(c => c.type === 'expense').map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 shadow-sm focus:outline-none"
            >
              <option value="all">Todos os Status</option>
              <option value="completed">Efetivados / Pagos</option>
              <option value="pending">Pendentes</option>
            </select>

            {hasMultipleModules && (
              <select
                value={moduleFilter}
                onChange={(e) => setModuleFilter(e.target.value as any)}
                className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 shadow-sm focus:outline-none"
              >
                <option value="all">Todos os Setores</option>
                <option value="nutrition">Casa Nutri</option>
                <option value="communication">Comunicação</option>
                <option value="global">Geral / Global</option>
              </select>
            )}

            <button
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl text-xs font-bold text-slate-700 shadow-sm transition-all active:scale-95 ml-auto lg:ml-0"
              title="Baixar planilha de despesas"
            >
              <Download size={14} className="text-slate-500" />
              Exportar CSV
            </button>
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
            {filteredExpenses.map((t) => {
              const category = categories.find(c => c.id === t.category_id);
              const isFixed = t.expense_type === 'fixed';

              return (
                <tr key={t.id} className="hover:bg-slate-50/80 transition-all group/row">
                  
                  {/* Status e Data */}
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => onToggleStatus(t.id, t.status)}
                        title={t.status === 'completed' ? 'Marcar como pendente' : 'Marcar como pago'}
                        className={cn(
                          "w-9 h-9 rounded-xl flex items-center justify-center transition-all group-hover/row:scale-105 active:scale-90",
                          t.status === 'completed' ? "bg-emerald-50 text-emerald-600 hover:bg-emerald-100" : "bg-amber-50 text-amber-600 hover:bg-amber-100"
                        )}
                      >
                        {t.status === 'completed' ? <CheckCircle2 size={18} /> : <Clock size={18} />}
                      </button>
                      <div>
                        <p className="text-xs font-black text-slate-900 tracking-wider">
                          {isFixed ? `Dia ${t.date.split('-')[2] || '10'} todo mês` : t.date}
                        </p>
                        <p className={cn(
                          "text-[10px] font-bold uppercase",
                          t.status === 'completed' ? "text-emerald-600" : "text-amber-600"
                        )}>
                          {t.status === 'completed' ? 'Efetivado' : 'A Vencer / Pendente'}
                        </p>
                      </div>
                    </div>
                  </td>

                  {/* Descrição e Categoria */}
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-slate-900 text-sm">{t.description}</p>
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

                  {/* Conta de Débito */}
                  <td className="px-6 py-5 text-xs font-bold text-slate-600 uppercase">
                    {t.account}
                  </td>

                  {/* Valor */}
                  <td className="px-6 py-5 text-right">
                    <p className="text-base font-black text-rose-600 tracking-tight">
                      - R$ {t.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                    {isFixed && t.recurrence && t.recurrence !== 'monthly' && t.recurrence !== 'none' && (
                      <p className="text-[10px] font-bold text-indigo-600 mt-0.5">
                        ~ R$ {(t.amount / (t.recurrence === 'bimonthly' ? 2 : t.recurrence === 'quarterly' ? 3 : t.recurrence === 'semiannual' ? 6 : 12)).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}/mês
                      </p>
                    )}
                  </td>

                  {/* Ações */}
                  <td className="px-6 py-5 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button
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
        categories={categories}
        defaultExpenseType={modalDefaultType}
      />

    </div>
  );
}
