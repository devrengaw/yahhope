import React, { useState, useEffect } from 'react';
import { X, RefreshCw } from 'lucide-react';
import { Transaction, TransactionCategory, TransactionType } from '../../../lib/mockData';
import { CategorySelectWithCreate } from './CategorySelectWithCreate';
import { getMznToBrlRate, ExchangeRateResult } from '../../../services/currencyService';
import { cn } from '../../../lib/utils';

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (transaction: Omit<Transaction, 'id'>) => void;
  categories: TransactionCategory[];
  onAddCategory?: (category: TransactionCategory) => void;
}

export function TransactionModal({ isOpen, onClose, onSave, categories, onAddCategory }: TransactionModalProps) {
  const [type, setType] = useState<TransactionType>('expense');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState<'BRL' | 'MZN'>('BRL');
  const [exchangeRate, setExchangeRate] = useState<number>(0.08103);
  const [rateInfo, setRateInfo] = useState<ExchangeRateResult | null>(null);
  const [isLoadingRate, setIsLoadingRate] = useState(false);
  const [categoryId, setCategoryId] = useState('');
  const [localCategories, setLocalCategories] = useState<TransactionCategory[]>(categories);

  useEffect(() => {
    setLocalCategories(categories);
  }, [categories]);

  useEffect(() => {
    if (isOpen) {
      setIsLoadingRate(true);
      getMznToBrlRate()
        .then(info => {
          setRateInfo(info);
          setExchangeRate(info.rate);
        })
        .catch(err => console.warn('Erro ao obter cotação:', err))
        .finally(() => setIsLoadingRate(false));
    }
  }, [isOpen]);

  const handleRefreshRate = async () => {
    setIsLoadingRate(true);
    try {
      const info = await getMznToBrlRate(true);
      setRateInfo(info);
      setExchangeRate(info.rate);
    } finally {
      setIsLoadingRate(false);
    }
  };

  const handleCategoryCreated = (newCat: TransactionCategory) => {
    setLocalCategories(prev => {
      if (prev.some(c => c.id === newCat.id)) return prev;
      return [...prev, newCat];
    });
    setCategoryId(newCat.id);
    onAddCategory?.(newCat);
  };
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [account, setAccount] = useState('Conta Principal');
  const [status, setStatus] = useState<'pending' | 'completed'>('completed');
  const [expenseType, setExpenseType] = useState<'fixed' | 'variable'>('variable');
  const [recurrence, setRecurrence] = useState<'monthly' | 'bimonthly' | 'quarterly' | 'semiannual' | 'yearly' | 'none'>('none');

  if (!isOpen) return null;

  const filteredCategories = categories.filter(c => c.type === type);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!description || !amount || !categoryId || !date || !account) return;

    const rawAmount = parseFloat(amount);
    const finalAmountInBrl = currency === 'MZN' 
      ? Number((rawAmount * exchangeRate).toFixed(2)) 
      : rawAmount;
    const formattedOriginal = rawAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 });
    const currencySuffix = currency === 'MZN' && !description.includes('MT') ? ` (${formattedOriginal} MT)` : '';

    onSave({
      description: description + currencySuffix,
      amount: finalAmountInBrl,
      type,
      category_id: categoryId,
      date,
      status,
      account,
      expense_type: type === 'expense' ? expenseType : undefined,
      recurrence: type === 'expense' ? recurrence : undefined,
      currency,
      original_amount: currency === 'MZN' ? rawAmount : undefined,
      exchange_rate: currency === 'MZN' ? exchangeRate : 1,
      notes: currency === 'MZN' ? `[Moçambique] Lançado em Meticais: ${formattedOriginal} MT (Cotação aplicada: 1 MZN = R$ ${exchangeRate.toFixed(4)})` : undefined
    });
    
    // Reset form
    setDescription('');
    setAmount('');
    setCurrency('BRL');
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

            {/* Moeda e Valor */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="block text-sm font-bold text-slate-700">Moeda do Lançamento</label>
                <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setCurrency('BRL')}
                    className={cn(
                      "px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer",
                      currency === 'BRL' ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-900"
                    )}
                  >
                    <span>🇧🇷 BRL (R$)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setCurrency('MZN')}
                    className={cn(
                      "px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer",
                      currency === 'MZN' ? "bg-emerald-600 text-white shadow-sm" : "text-slate-500 hover:text-slate-900"
                    )}
                  >
                    <span>🇲🇿 MZN (MT)</span>
                    <span className="text-[9px] bg-emerald-700/60 text-white px-1.5 py-0.2 rounded font-black">Moçambique</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    Valor ({currency === 'MZN' ? 'Meticais - MT' : 'Reais - R$'})
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">
                      {currency === 'MZN' ? 'MT' : 'R$'}
                    </span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={amount}
                      onChange={e => setAmount(e.target.value)}
                      placeholder={currency === 'MZN' ? "0,00 MT" : "0,00"}
                      className="w-full border-2 border-slate-100 rounded-2xl pl-14 pr-5 py-3.5 focus:outline-none focus:ring-4 focus:ring-slate-500/10 focus:border-slate-300 transition-all font-bold"
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

              {currency === 'MZN' && (
                <div className="p-4 bg-emerald-50/70 border border-emerald-200/90 rounded-2xl space-y-2 animate-in fade-in duration-200">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                      <div>
                        <p className="text-xs font-black text-emerald-950 flex items-center gap-1.5">
                          <span>Cotação Oficial Metical (MZN) → Real (BRL)</span>
                          <span className="text-[10px] bg-emerald-200/80 text-emerald-800 px-1.5 py-0.2 rounded font-black">
                            {rateInfo?.source === 'api' ? 'Tempo Real' : rateInfo?.source === 'cache' ? 'Em Cache' : 'Estimada'}
                          </span>
                        </p>
                        <p className="text-[11px] text-emerald-700 font-bold">
                          1 MZN = R$ {exchangeRate.toFixed(4)} &bull; 1 BRL = {(1 / (exchangeRate || 1)).toFixed(2)} MT
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleRefreshRate}
                      disabled={isLoadingRate}
                      className="px-2.5 py-1 text-xs font-bold text-emerald-800 hover:bg-emerald-100/70 rounded-lg transition-all flex items-center gap-1"
                      title="Atualizar cotação oficial"
                    >
                      <RefreshCw size={12} className={isLoadingRate ? "animate-spin" : ""} />
                      <span>Atualizar</span>
                    </button>
                  </div>
                  {parseFloat(amount) > 0 && (
                    <div className="pt-2 border-t border-emerald-200/60 flex items-center justify-between">
                      <span className="text-xs font-bold text-emerald-900">Total Convertido em Reais:</span>
                      <span className="text-sm font-black text-emerald-800">
                        R$ {(parseFloat(amount) * exchangeRate).toFixed(2)}
                      </span>
                    </div>
                  )}
                </div>
              )}
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
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Periodicidade do Pagamento</label>
                    <select
                      value={recurrence}
                      onChange={e => setRecurrence(e.target.value as any)}
                      className="w-full border-2 border-slate-200 rounded-xl px-4 py-2 text-sm font-bold focus:outline-none focus:border-indigo-500 transition-all bg-white"
                    >
                      <option value="none">Apenas uma vez (Não recorrente)</option>
                      <option value="monthly">Mensal (1x por mês)</option>
                      <option value="bimonthly">Bimestral (A cada 2 meses)</option>
                      <option value="quarterly">Trimestral (A cada 3 meses)</option>
                      <option value="semiannual">Semestral (A cada 6 meses)</option>
                      <option value="yearly">Anual (1x por ano)</option>
                    </select>
                  </div>
                )}
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Categoria</label>
                <CategorySelectWithCreate
                  value={categoryId}
                  onChange={setCategoryId}
                  categories={localCategories}
                  type={type}
                  onCategoryCreated={handleCategoryCreated}
                  required
                />
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
