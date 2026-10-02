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
import { cn } from '../../../lib/utils';

export interface ExpensePayload {
  description: string;
  amount: number;
  type: 'expense';
  category_id: string;
  date: string;
  status: 'pending' | 'completed';
  account: string;
  expense_type: 'fixed' | 'variable';
  recurrence: 'monthly' | 'yearly' | 'none';
  due_day?: number;
  department?: string;
  notes?: string;
}

interface ExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (expense: ExpensePayload) => Promise<void> | void;
  categories: TransactionCategory[];
  defaultExpenseType?: 'fixed' | 'variable';
}

export function ExpenseModal({
  isOpen,
  onClose,
  onSave,
  categories,
  defaultExpenseType = 'fixed'
}: ExpenseModalProps) {
  const [expenseType, setExpenseType] = useState<'fixed' | 'variable'>(defaultExpenseType);
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [dueDay, setDueDay] = useState(10);
  const [recurrence, setRecurrence] = useState<'monthly' | 'yearly' | 'none'>('monthly');
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
        date: expenseType === 'fixed' 
          ? `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(dueDay).padStart(2, '0')}`
          : date,
        status,
        account,
        expense_type: expenseType,
        recurrence: expenseType === 'fixed' ? recurrence : 'none',
        due_day: expenseType === 'fixed' ? dueDay : undefined,
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
              Lançar Gasto Mensal
            </h2>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mt-1">
              Classifique entre compromisso fixo ou despesa variável
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
              Gasto Fixo Mensal
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
              Gasto Variável
            </button>
          </div>

          {/* Dica descritiva do tipo */}
          <div className={cn(
            "p-3.5 rounded-2xl text-xs font-medium border",
            expenseType === 'fixed' 
              ? "bg-indigo-50/60 text-indigo-900 border-indigo-100" 
              : "bg-rose-50/60 text-rose-900 border-rose-100"
          )}>
            {expenseType === 'fixed' ? (
              <p>
                <strong>Compromisso Recorrente:</strong> Aluguéis, salários, energia, internet e outros custos que ocorrem com frequência mensal ou anual.
              </p>
            ) : (
              <p>
                <strong>Despesa Variável / Flutuante:</strong> Compras de urgência, manutenção pontual, medicamentos de emergência ou despesas operacionais deste mês.
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
                placeholder={expenseType === 'fixed' ? "Ex: Aluguel da Casa Nutri Boane" : "Ex: Insumos de emergência e transporte"}
                className="w-full border-2 border-slate-100 rounded-2xl px-4 py-3 text-sm font-bold focus:outline-none focus:ring-4 focus:ring-slate-500/5 focus:border-slate-300 transition-all"
                required
              />
            </div>

            {/* Valor e Vencimento / Data */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-2">
                  Valor Estimado (R$)
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

              {expenseType === 'fixed' ? (
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
                    Data da Despesa
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
                <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-2">
                  Categoria
                </label>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full border-2 border-slate-100 rounded-2xl px-4 py-3 text-xs font-bold text-slate-700 focus:outline-none focus:border-slate-300 transition-all bg-white"
                  required
                >
                  <option value="" disabled>Selecione a categoria...</option>
                  {expenseCategories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                  {expenseCategories.length === 0 && (
                    <>
                      <option value="cat_salary">Folha / Pessoal</option>
                      <option value="cat_office">Aluguel / Sede</option>
                      <option value="cat_marketing">Marketing / Eventos</option>
                    </>
                  )}
                </select>
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
