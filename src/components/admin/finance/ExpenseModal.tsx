import React, { useState } from 'react';
import { 
  X, 
  Layers, 
  Calendar, 
  DollarSign, 
  Clock, 
  CheckCircle2, 
  Building2, 
  AlertCircle,
  Repeat
} from 'lucide-react';
import { TransactionCategory } from '../../../pages/admin/Finance';
import { CategorySelectWithCreate } from './CategorySelectWithCreate';
import { cn } from '../../../lib/utils';

export type RecurrenceType = 'monthly' | 'bimonthly' | 'quarterly' | 'semiannual' | 'yearly' | 'none';

export interface ExpensePayload {
  description: string;
  amount: number;
  type: 'expense';
  category_id: string;
  date: string;
  status: 'pending' | 'completed';
  account: string;
  expense_type: 'fixed' | 'variable';
  recurrence: RecurrenceType;
  due_day?: number;
  department?: string;
  notes?: string;
  module?: string;
}

interface ExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (expense: ExpensePayload) => Promise<void> | void;
  categories: TransactionCategory[];
  defaultExpenseType?: 'fixed' | 'variable';
  onAddCategory?: (category: TransactionCategory) => void;
}

export function ExpenseModal({
  isOpen,
  onClose,
  onSave,
  categories,
  defaultExpenseType = 'fixed',
  onAddCategory
}: ExpenseModalProps) {
  const [expenseType, setExpenseType] = useState<'fixed' | 'variable'>(defaultExpenseType);
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [localCategories, setLocalCategories] = useState<TransactionCategory[]>(categories);

  React.useEffect(() => {
    setLocalCategories(categories);
  }, [categories]);

  const handleCategoryCreated = (newCat: TransactionCategory) => {
    setLocalCategories(prev => {
      if (prev.some(c => c.id === newCat.id)) return prev;
      return [...prev, newCat];
    });
    setCategoryId(newCat.id);
    onAddCategory?.(newCat);
  };
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [dueDay, setDueDay] = useState(10);
  const [recurrence, setRecurrence] = useState<RecurrenceType>('monthly');
  const [account, setAccount] = useState('Conta Principal');
  const [status, setStatus] = useState<'pending' | 'completed'>('completed');
  const [department, setDepartment] = useState('Operações & Nutrição');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sincroniza tipo inicial quando modal abre
  React.useEffect(() => {
    if (isOpen) {
      setExpenseType(defaultExpenseType);
      if (defaultExpenseType === 'fixed') {
        setRecurrence('monthly');
      } else {
        setRecurrence('none');
      }
    }
  }, [isOpen, defaultExpenseType]);

  if (!isOpen) return null;

  const expenseCategories = categories.filter(c => c.type === 'expense');

  // Amortização mensal estimada quando semestral/anual/etc.
  const getMonthlyAmortization = () => {
    const val = parseFloat(amount);
    if (isNaN(val) || val <= 0) return null;
    if (recurrence === 'bimonthly') return val / 2;
    if (recurrence === 'quarterly') return val / 3;
    if (recurrence === 'semiannual') return val / 6;
    if (recurrence === 'yearly') return val / 12;
    return null;
  };
  const monthlyAmortization = getMonthlyAmortization();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description || !amount || !categoryId || !account) return;

    setIsSubmitting(true);
    try {
      await onSave({
        description,
        amount: parseFloat(amount),
        type: 'expense',
        category_id: categoryId,
        date: expenseType === 'fixed' && recurrence === 'monthly'
          ? `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(dueDay).padStart(2, '0')}`
          : date,
        status,
        account,
        expense_type: expenseType,
        recurrence: expenseType === 'fixed' ? recurrence : 'none',
        due_day: expenseType === 'fixed' && recurrence === 'monthly' ? dueDay : undefined,
        department,
        notes
      });

      // Reset
      setDescription('');
      setAmount('');
      setCategoryId('');
      setNotes('');
      onClose();
    } catch (err) {
      console.error(err);
      alert('Erro ao salvar despesa.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
      <div className="bg-white rounded-[2.5rem] w-full max-w-xl shadow-2xl overflow-hidden border border-slate-100 flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
              <span className="p-2 bg-rose-500 text-white rounded-xl shadow-md shadow-rose-500/20">
                <DollarSign size={20} />
              </span>
              Lançar Despesa
            </h2>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mt-1">
              Classifique o tipo de gasto e a periodicidade do pagamento
            </p>
          </div>
          <button 
            onClick={onClose}
            className="p-2.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/50 rounded-2xl transition-all"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-8 space-y-6 overflow-y-auto">
          
          {/* Seletor Fixo vs Variável */}
          <div className="grid grid-cols-2 gap-3 p-1.5 bg-slate-100 rounded-2xl">
            <button
              type="button"
              onClick={() => {
                setExpenseType('fixed');
                setRecurrence('monthly');
              }}
              className={cn(
                "py-3 px-4 rounded-xl font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2",
                expenseType === 'fixed'
                  ? "bg-slate-900 text-white shadow-md shadow-slate-900/20"
                  : "text-slate-500 hover:text-slate-900"
              )}
            >
              <Repeat size={14} className={expenseType === 'fixed' ? "text-amber-400" : ""} />
              Gasto Fixo Recorrente
            </button>
            <button
              type="button"
              onClick={() => {
                setExpenseType('variable');
                setRecurrence('none');
              }}
              className={cn(
                "py-3 px-4 rounded-xl font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2",
                expenseType === 'variable'
                  ? "bg-rose-500 text-white shadow-md shadow-rose-500/20"
                  : "text-slate-500 hover:text-slate-900"
              )}
            >
              <Clock size={14} />
              Gasto Variável / Pontual
            </button>
          </div>

          {/* Opções de Periodicidade de Pagamento (Quando Gasto Fixo) */}
          {expenseType === 'fixed' && (
            <div className="space-y-2 p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100/80 animate-in fade-in duration-300">
              <label className="block text-[11px] font-black uppercase tracking-wider text-indigo-950">
                Periodicidade do Pagamento
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                {[
                  { key: 'monthly', label: 'Mensal', hint: '1x/mês' },
                  { key: 'bimonthly', label: 'Bimestral', hint: 'A cada 2m' },
                  { key: 'quarterly', label: 'Trimestral', hint: 'A cada 3m' },
                  { key: 'semiannual', label: 'Semestral', hint: 'A cada 6m' },
                  { key: 'yearly', label: 'Anual', hint: '1x/ano' },
                ].map(item => (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => setRecurrence(item.key as RecurrenceType)}
                    className={cn(
                      "py-2.5 px-2 rounded-xl text-xs font-bold transition-all flex flex-col items-center justify-center border",
                      recurrence === item.key
                        ? "bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-600/20"
                        : "bg-white text-slate-600 border-slate-200 hover:border-indigo-300 hover:text-indigo-600"
                    )}
                  >
                    <span>{item.label}</span>
                    <span className={cn(
                      "text-[9px] font-medium mt-0.5",
                      recurrence === item.key ? "text-indigo-100" : "text-slate-400"
                    )}>
                      {item.hint}
                    </span>
                  </button>
                ))}
              </div>

              {monthlyAmortization !== null && (
                <div className="mt-2.5 pt-2 border-t border-indigo-100 flex items-center justify-between text-xs text-indigo-900 font-medium">
                  <span className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
                    Custo mensal equivalente amortizado:
                  </span>
                  <strong className="font-black text-indigo-700">
                    ~ R$ {monthlyAmortization.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} / mês
                  </strong>
                </div>
              )}
            </div>
          )}

          {/* Dica descritiva do tipo */}
          <div className={cn(
            "p-3.5 rounded-2xl text-xs font-medium border",
            expenseType === 'fixed' 
              ? "bg-indigo-50/60 text-indigo-900 border-indigo-100" 
              : "bg-rose-50/60 text-rose-900 border-rose-100"
          )}>
            {expenseType === 'fixed' ? (
              <p>
                <strong>Compromisso Recorrente:</strong> Aluguéis, salários, energia, internet, licenças de software ou contratos com pagamentos mensais, semestrais ou anuais.
              </p>
            ) : (
              <p>
                <strong>Despesa Variável / Flutuante:</strong> Compras de urgência, manutenção pontual, medicamentos de emergência ou despesas operacionais pontuais deste período.
              </p>
            )}
          </div>

          {/* Campos Principais */}
          <div className="space-y-4">
            
            {/* Descrição */}
            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-2">
                Descrição do Gasto
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={expenseType === 'fixed' ? "Ex: Aluguel da Casa Nutri, Assinatura Servidor, Folha de Pessoal..." : "Ex: Insumos de emergência, conserto hidráulico..."}
                className="w-full border-2 border-slate-100 rounded-2xl px-4 py-3 text-sm font-bold focus:outline-none focus:ring-4 focus:ring-slate-500/5 focus:border-slate-300 transition-all"
                required
              />
            </div>

            {/* Valor e Vencimento / Data */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-2">
                  Valor {expenseType === 'fixed' && recurrence !== 'monthly' ? `do Pagamento (${recurrence === 'semiannual' ? 'Semestral' : recurrence === 'yearly' ? 'Anual' : recurrence === 'quarterly' ? 'Trimestral' : 'Bimestral'})` : 'Estimado'} (R$)
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">R$</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0,00"
                    className="w-full border-2 border-slate-100 rounded-2xl pl-12 pr-4 py-3 text-sm font-black text-slate-900 focus:outline-none focus:ring-4 focus:ring-slate-500/5 focus:border-slate-300 transition-all"
                    required
                  />
                </div>
              </div>

              {expenseType === 'fixed' && recurrence === 'monthly' ? (
                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-2">
                    Dia do Vencimento Mensal
                  </label>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-400">Todo dia</span>
                    <input
                      type="number"
                      min="1"
                      max="31"
                      value={dueDay}
                      onChange={(e) => setDueDay(Number(e.target.value))}
                      className="w-20 border-2 border-slate-100 rounded-2xl px-3 py-3 text-sm font-black text-center text-slate-900 focus:outline-none focus:border-slate-300 transition-all"
                      required
                    />
                    <span className="text-xs font-bold text-slate-400">de cada mês</span>
                  </div>
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-2">
                    {expenseType === 'fixed' ? 'Data do Próximo Pagamento' : 'Data da Despesa'}
                  </label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full border-2 border-slate-100 rounded-2xl px-4 py-3 text-sm font-medium focus:outline-none focus:border-slate-300 transition-all"
                    required
                  />
                </div>
              )}
            </div>

            {/* Categoria e Conta */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-black uppercase tracking-wider text-slate-700">
                    Categoria
                  </label>
                  <span className="text-[10px] text-slate-400 font-bold">
                    Busque ou crie nova
                  </span>
                </div>
                <CategorySelectWithCreate
                  value={categoryId}
                  onChange={setCategoryId}
                  categories={localCategories}
                  type="expense"
                  onCategoryCreated={handleCategoryCreated}
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-2">
                  Conta de Pagamento
                </label>
                <select
                  value={account}
                  onChange={(e) => setAccount(e.target.value)}
                  className="w-full border-2 border-slate-100 rounded-2xl px-4 py-3 text-xs font-bold text-slate-700 focus:outline-none focus:border-slate-300 transition-all bg-white"
                >
                  <option value="Conta Principal">Conta Principal (Operações)</option>
                  <option value="Conta Projetos">Conta Projetos / Nutrição</option>
                  <option value="Fundo de Reserva">Fundo de Reserva Emergencial</option>
                </select>
              </div>
            </div>

            {/* Recorrência e Departamento */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-2">
                  Departamento / Centro de Custo
                </label>
                <input
                  type="text"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  placeholder="Ex: Nutrição Infantil, Saúde..."
                  className="w-full border-2 border-slate-100 rounded-2xl px-4 py-3 text-xs font-medium focus:outline-none focus:border-slate-300 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-2">
                  Status de Pagamento
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as any)}
                  className="w-full border-2 border-slate-100 rounded-2xl px-4 py-3 text-xs font-bold text-slate-700 focus:outline-none focus:border-slate-300 transition-all bg-white"
                >
                  <option value="completed">Efetivado / Pago</option>
                  <option value="pending">Pendente / A Pagar</option>
                </select>
              </div>
            </div>

            {/* Observações */}
            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-2">
                Observações / Justificativa (Opcional)
              </label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Insira notas sobre contrato, fornecedor ou justificativa deste gasto..."
                className="w-full border-2 border-slate-100 rounded-2xl px-4 py-2.5 text-xs font-medium focus:outline-none focus:border-slate-300 transition-all"
              />
            </div>

          </div>

          {/* Botões do Rodapé */}
          <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 border-2 border-slate-100 text-slate-500 font-bold text-xs rounded-xl hover:bg-slate-50 transition-all"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition-all shadow-lg shadow-slate-900/20 active:scale-95 disabled:opacity-50"
            >
              {isSubmitting ? 'Salvando...' : 'Confirmar Despesa'}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
