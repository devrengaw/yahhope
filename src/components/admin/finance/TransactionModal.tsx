import React, { useState } from 'react';
import { X } from 'lucide-react';
import { Transaction, TransactionCategory, TransactionType } from '../../../lib/mockData';

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (transaction: Omit<Transaction, 'id'>) => void;
  categories: TransactionCategory[];
}

export function TransactionModal({ isOpen, onClose, onSave, categories }: TransactionModalProps) {
  const [type, setType] = useState<TransactionType>('expense');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [account, setAccount] = useState('Conta Principal');
  const [status, setStatus] = useState<'pending' | 'completed'>('completed');
  const [expenseType, setExpenseType] = useState<'fixed' | 'variable'>('variable');
  const [recurrence, setRecurrence] = useState<'monthly' | 'yearly' | 'none'>('none');

  if (!isOpen) return null;

  const filteredCategories = categories.filter(c => c.type === type);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!description || !amount || !categoryId || !date || !account) return;

    onSave({
      description,
      amount: parseFloat(amount),
      type,
      category_id: categoryId,
      date,
      status,
      account,
      expense_type: type === 'expense' ? expenseType : undefined,
      recurrence: type === 'expense' ? recurrence : undefined
    });
    
    // Reset form
    setDescription('');
    setAmount('');
    setCategoryId('');
    setDate(new Date().toISOString().split('T')[0]);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-[2rem] w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-8 border-b border-slate-100">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Nova Transação</h2>
            <p className="text-slate-500 text-sm mt-1">Registre uma entrada ou saída no caixa global.</p>
          </div>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors p-2 hover:bg-slate-50 rounded-full"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          {/* Tipo de Transação */}
          <div className="flex bg-slate-100 p-1.5 rounded-2xl">
            <button
              type="button"
              onClick={() => { setType('expense'); setCategoryId(''); }}
              className={`flex-1 py-3 font-bold text-sm rounded-xl transition-all ${
                type === 'expense' ? 'bg-white text-rose-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Saída (Despesa)
            </button>
            <button
              type="button"
              onClick={() => { setType('income'); setCategoryId(''); }}
              className={`flex-1 py-3 font-bold text-sm rounded-xl transition-all ${
                type === 'income' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Entrada (Receita)
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Descrição</label>
              <input
                type="text"
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Ex: Pagamento de aluguel da sede"
                className="w-full border-2 border-slate-100 rounded-2xl px-5 py-3.5 focus:outline-none focus:ring-4 focus:ring-slate-500/10 focus:border-slate-300 transition-all font-medium"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Valor (R$)</label>
                <div className="relative">
                  <span className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 font-bold">R$</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={amount}
                    onChange={e => setAmount(e.target.value)}
                    placeholder="0,00"
                    className="w-full border-2 border-slate-100 rounded-2xl pl-12 pr-5 py-3.5 focus:outline-none focus:ring-4 focus:ring-slate-500/10 focus:border-slate-300 transition-all font-bold"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Data</label>
                <input
                  type="date"
                  value={date}
                  onChange={e => setDate(e.target.value)}
                  className="w-full border-2 border-slate-100 rounded-2xl px-5 py-3.5 focus:outline-none focus:ring-4 focus:ring-slate-500/10 focus:border-slate-300 transition-all font-medium"
                  required
                />
              </div>
            </div>

            {type === 'expense' && (
              <div className="p-5 bg-slate-50 rounded-[1.5rem] border border-slate-100 space-y-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-3">Tipo de Despesa</label>
                  <div className="flex gap-4">
                    <label className="flex-1 flex items-center justify-center gap-2 p-3 rounded-xl border-2 cursor-pointer transition-all font-bold text-sm bg-white hover:border-slate-200 shadow-sm select-none">
                      <input 
                        type="radio" 
                        name="expense_type" 
                        className="hidden" 
                        checked={expenseType === 'fixed'}
                        onChange={() => setExpenseType('fixed')}
                      />
                      <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${expenseType === 'fixed' ? 'border-indigo-500' : 'border-slate-300'}`}>
                        {expenseType === 'fixed' && <div className="w-2 h-2 rounded-full bg-indigo-500"></div>}
                      </div>
                      <span className={expenseType === 'fixed' ? 'text-indigo-600' : 'text-slate-500'}>Fixa</span>
                    </label>
                    <label className="flex-1 flex items-center justify-center gap-2 p-3 rounded-xl border-2 cursor-pointer transition-all font-bold text-sm bg-white hover:border-slate-200 shadow-sm select-none">
                      <input 
                        type="radio" 
                        name="expense_type" 
                        className="hidden"
                        checked={expenseType === 'variable'}
                        onChange={() => setExpenseType('variable')}
                      />
                      <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${expenseType === 'variable' ? 'border-amber-500' : 'border-slate-300'}`}>
                        {expenseType === 'variable' && <div className="w-2 h-2 rounded-full bg-amber-500"></div>}
                      </div>
                      <span className={expenseType === 'variable' ? 'text-amber-600' : 'text-slate-500'}>Variável</span>
                    </label>
                  </div>
                </div>

                {expenseType === 'fixed' && (
                  <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Recorrência</label>
                    <select
                      value={recurrence}
                      onChange={e => setRecurrence(e.target.value as any)}
                      className="w-full border-2 border-slate-200 rounded-xl px-4 py-2 text-sm font-bold focus:outline-none focus:border-indigo-500 transition-all bg-white"
                    >
                      <option value="none">Apenas uma vez</option>
                      <option value="monthly">Mensal</option>
                      <option value="yearly">Anual</option>
                    </select>
                  </div>
                )}
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Categoria</label>
                <select
                  value={categoryId}
                  onChange={e => setCategoryId(e.target.value)}
                  className="w-full border-2 border-slate-100 rounded-2xl px-5 py-3.5 focus:outline-none focus:ring-4 focus:ring-slate-500/10 focus:border-slate-300 transition-all font-medium appearance-none bg-white"
                  required
                >
                  <option value="" disabled>Selecione...</option>
                  {filteredCategories.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Conta</label>
                <select
                  value={account}
                  onChange={e => setAccount(e.target.value)}
                  className="w-full border-2 border-slate-100 rounded-2xl px-5 py-3.5 focus:outline-none focus:ring-4 focus:ring-slate-500/10 focus:border-slate-300 transition-all font-medium appearance-none bg-white"
                  required
                >
                  <option value="Conta Principal">Conta Principal</option>
                  <option value="Conta Projetos">Conta Projetos</option>
                  <option value="Fundo de Reserva">Fundo de Reserva</option>
                </select>
              </div>
            </div>
          </div>

          <div className="pt-4 flex gap-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-4 border-2 border-slate-100 text-slate-400 font-bold rounded-2xl hover:bg-slate-50 transition-all active:scale-95"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 px-6 py-4 bg-slate-900 text-white font-bold rounded-2xl hover:bg-slate-800 transition-all shadow-lg shadow-slate-200 active:scale-95"
            >
              Confirmar Lançamento
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
