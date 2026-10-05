import React, { useState, useEffect } from 'react';
import { X, RefreshCw } from 'lucide-react';
import { Transaction, TransactionCategory, TransactionType } from '../../../lib/mockData';
import { getMznToBrlRate, ExchangeRateResult } from '../../../services/currencyService';
import { cn } from '../../../lib/utils';

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
  const [currency, setCurrency] = useState<'BRL' | 'MZN'>('BRL');
  const [exchangeRate, setExchangeRate] = useState<number>(0.08103);
  const [rateInfo, setRateInfo] = useState<ExchangeRateResult | null>(null);
  const [isLoadingRate, setIsLoadingRate] = useState(false);
  const [categoryId, setCategoryId] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [account, setAccount] = useState('Conta Principal');
  const [status, setStatus] = useState<'pending' | 'completed'>('completed');

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
      currency,
      original_amount: currency === 'MZN' ? rawAmount : undefined,
      exchange_rate: currency === 'MZN' ? exchangeRate : 1
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
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <h2 className="text-xl font-bold text-slate-900">Nova Transação</h2>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors p-2 hover:bg-slate-50 rounded-full"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Tipo */}
          <div className="flex bg-slate-100 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => { setType('expense'); setCategoryId(''); }}
              className={`flex-1 py-2 font-medium text-sm rounded-lg transition-all ${
                type === 'expense' ? 'bg-white text-red-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Despesa
            </button>
            <button
              type="button"
              onClick={() => { setType('income'); setCategoryId(''); }}
              className={`flex-1 py-2 font-medium text-sm rounded-lg transition-all ${
                type === 'income' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Receita
            </button>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Descrição</label>
            <input
              type="text"
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Ex: Pagamento de energia"
              className="w-full border border-slate-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              required
            />
          </div>

          {/* Moeda e Valor */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="block text-sm font-medium text-slate-700">Moeda</label>
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
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Valor ({currency === 'MZN' ? 'Meticais - MT' : 'Reais - R$'})
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">
                    {currency === 'MZN' ? 'MT' : 'R$'}
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={amount}
                    onChange={e => setAmount(e.target.value)}
                    placeholder={currency === 'MZN' ? "0,00 MT" : "0.00"}
                    className="w-full border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-bold"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Data</label>
                <input
                  type="date"
                  value={date}
                  onChange={e => setDate(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  required
                />
              </div>
            </div>

            {currency === 'MZN' && (
              <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl space-y-1.5 animate-in fade-in duration-200 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-emerald-950 flex items-center gap-1">
                    <span>🇲🇿 Cotação MZN → BRL:</span>
                    <span className="text-emerald-700">1 MT = R$ {exchangeRate.toFixed(4)}</span>
                  </span>
                  <button
                    type="button"
                    onClick={handleRefreshRate}
                    disabled={isLoadingRate}
                    className="text-emerald-800 hover:text-emerald-950 font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <RefreshCw size={11} className={isLoadingRate ? "animate-spin" : ""} />
                    <span>Atualizar</span>
                  </button>
                </div>
                {parseFloat(amount) > 0 && (
                  <div className="pt-1 border-t border-emerald-200/60 flex items-center justify-between text-emerald-900 font-bold">
                    <span>Equivalente em Reais:</span>
                    <span>R$ {(parseFloat(amount) * exchangeRate).toFixed(2)}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Categoria</label>
              <select
                value={categoryId}
                onChange={e => setCategoryId(e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all appearance-none bg-white"
                required
              >
                <option value="" disabled>Selecione...</option>
                {filteredCategories.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Conta</label>
              <select
                value={account}
                onChange={e => setAccount(e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all appearance-none bg-white"
                required
              >
                <option value="Conta Principal">Conta Principal</option>
                <option value="Conta Secundária">Conta Secundária</option>
                <option value="Caixinha">Caixinha</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
            <div className="flex gap-4 mt-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input 
                  type="radio" 
                  name="status" 
                  value="completed"
                  checked={status === 'completed'}
                  onChange={() => setStatus('completed')}
                  className="text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-slate-700">Concluído</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input 
                  type="radio" 
                  name="status" 
                  value="pending"
                  checked={status === 'pending'}
                  onChange={() => setStatus('pending')}
                  className="text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-slate-700">Pendente</span>
              </label>
            </div>
          </div>

          <div className="pt-4 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 border border-slate-200 text-slate-600 font-medium rounded-xl hover:bg-slate-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2.5 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-colors shadow-sm"
            >
              Salvar Transação
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
