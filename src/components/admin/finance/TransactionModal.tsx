import React, { useState, useEffect } from 'react';
import { X, RefreshCw, ArrowRightLeft, Heart, Repeat, DollarSign } from 'lucide-react';
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
  const [type, setType] = useState<TransactionType>('income');
  const [incomeOrigin, setIncomeOrigin] = useState<'doacao' | 'padrinho' | 'mantenedor'>('doacao');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState(''); // Valor principal na moeda selecionada (ou MT quando MZN)
  const [amountBrl, setAmountBrl] = useState(''); // Valor em Reais (R$) editável quando já convertido
  const [amountMzn, setAmountMzn] = useState(''); // Valor em Meticais (MT) opcional quando em BRL
  const [isCustomConversion, setIsCustomConversion] = useState(false);
  const [currency, setCurrency] = useState<'BRL' | 'MZN'>('BRL');
  const [exchangeRate, setExchangeRate] = useState<number>(0.08103);
  const [officialRate, setOfficialRate] = useState<number>(0.08103);
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
          setOfficialRate(info.rate);
          if (!isCustomConversion) {
            setExchangeRate(info.rate);
          }
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
      setOfficialRate(info.rate);
      setExchangeRate(info.rate);
      setIsCustomConversion(false);
      if (currency === 'MZN') {
        const mznVal = parseFloat(amount);
        if (!isNaN(mznVal) && mznVal > 0) {
          setAmountBrl((mznVal * info.rate).toFixed(2));
        }
      } else if (amountMzn) {
        const brlVal = parseFloat(amount);
        if (!isNaN(brlVal) && brlVal > 0 && info.rate > 0) {
          setAmountMzn((brlVal / info.rate).toFixed(2));
        }
      }
    } finally {
      setIsLoadingRate(false);
    }
  };

  // Quando altera o valor em Meticais (modo MZN)
  const handleMznAmountChange = (val: string) => {
    setAmount(val);
    const numMzn = parseFloat(val);
    if (!isNaN(numMzn) && numMzn > 0) {
      if (isCustomConversion && parseFloat(amountBrl) > 0) {
        // Se já tem valor fixado em BRL manual, recalcula a taxa efetiva
        const currentBrl = parseFloat(amountBrl);
        setExchangeRate(currentBrl / numMzn);
      } else {
        // Calcula BRL pela taxa atual
        setAmountBrl((numMzn * exchangeRate).toFixed(2));
      }
    } else {
      if (!isCustomConversion) setAmountBrl('');
    }
  };

  // Quando o usuário digita diretamente o valor convertido em Reais (BRL) no modo MZN
  const handleConvertedBrlChange = (val: string) => {
    setAmountBrl(val);
    setIsCustomConversion(true);
    const numBrl = parseFloat(val);
    const numMzn = parseFloat(amount);
    if (!isNaN(numBrl) && numBrl > 0 && !isNaN(numMzn) && numMzn > 0) {
      setExchangeRate(numBrl / numMzn);
    }
  };

  // Quando está no modo BRL e informa também o valor em Meticais (MT)
  const handleOptionalMznInBrlModeChange = (val: string) => {
    setAmountMzn(val);
    setIsCustomConversion(true);
    const numMzn = parseFloat(val);
    const numBrl = parseFloat(amount);
    if (!isNaN(numMzn) && numMzn > 0 && !isNaN(numBrl) && numBrl > 0) {
      setExchangeRate(numBrl / numMzn);
    }
  };

  const handleSwitchCurrency = (target: 'BRL' | 'MZN') => {
    if (target === currency) return;
    if (target === 'MZN') {
      // Se já tinha digitado algo em BRL, preserva no campo de BRL convertido
      if (amount && parseFloat(amount) > 0 && !amountBrl) {
        const currentBrl = parseFloat(amount);
        setAmountBrl(currentBrl.toFixed(2));
        if (amountMzn && parseFloat(amountMzn) > 0) {
          setAmount(amountMzn);
        } else if (exchangeRate > 0) {
          setAmount((currentBrl / exchangeRate).toFixed(2));
        }
      }
    } else {
      // Voltando para BRL
      if (amountBrl && parseFloat(amountBrl) > 0) {
        setAmountMzn(amount);
        setAmount(amountBrl);
      }
    }
    setCurrency(target);
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!description || !amount || !date || !account) return;

    const rawAmount = parseFloat(amount);
    const parsedBrl = parseFloat(amountBrl);
    const parsedOptionalMzn = parseFloat(amountMzn);

    // Determina se há conversão MZN <-> BRL (seja lançando em MZN, seja lançando em BRL com equivalente em MT)
    const hasMznConversion = currency === 'MZN' || (!isNaN(parsedOptionalMzn) && parsedOptionalMzn > 0);

    let finalAmountInBrl = rawAmount;
    let finalOriginalAmountMzn: number | undefined = undefined;
    let finalExchangeRate = 1;

    if (currency === 'MZN') {
      finalOriginalAmountMzn = rawAmount;
      finalAmountInBrl = (!isNaN(parsedBrl) && parsedBrl > 0)
        ? Number(parsedBrl.toFixed(2))
        : Number((rawAmount * exchangeRate).toFixed(2));
      finalExchangeRate = rawAmount > 0 ? (finalAmountInBrl / rawAmount) : exchangeRate;
    } else if (!isNaN(parsedOptionalMzn) && parsedOptionalMzn > 0) {
      // Lançado em BRL mas com valor convertido em Meticais informado
      finalAmountInBrl = Number(rawAmount.toFixed(2));
      finalOriginalAmountMzn = parsedOptionalMzn;
      finalExchangeRate = parsedOptionalMzn > 0 ? (finalAmountInBrl / parsedOptionalMzn) : exchangeRate;
    }

    const formattedOriginalMzn = finalOriginalAmountMzn
      ? finalOriginalAmountMzn.toLocaleString('pt-BR', { minimumFractionDigits: 2 })
      : '';
    const currencySuffix = hasMznConversion && formattedOriginalMzn && !description.includes('MT')
      ? ` (${formattedOriginalMzn} MT)`
      : '';

    // Prefixo ou categoria inteligente quando for Entrada (Receita)
    let baseDesc = description.trim();
    let effectiveCatId = categoryId;
    if (type === 'income') {
      if (incomeOrigin === 'padrinho') {
        if (!baseDesc.toLowerCase().includes('apadrinh') && !baseDesc.toLowerCase().includes('padrinho')) {
          baseDesc = `Apadrinhamento - ${baseDesc}`;
        }
        if (!effectiveCatId) effectiveCatId = 'cat_sponsorship';
      } else if (incomeOrigin === 'mantenedor') {
        if (!baseDesc.toLowerCase().includes('mantenedor')) {
          baseDesc = `Mantenedor Mensal - ${baseDesc}`;
        }
        if (!effectiveCatId) effectiveCatId = 'cat_donations';
      } else {
        if (!effectiveCatId) {
          const defaultIncCat = localCategories.find(c => c.type === 'income');
          effectiveCatId = defaultIncCat?.id || 'cat_donations';
        }
      }
    } else if (!effectiveCatId) {
      const defaultExpCat = localCategories.find(c => c.type === 'expense');
      effectiveCatId = defaultExpCat?.id || '';
    }

    const inverseRate = finalExchangeRate > 0 ? (1 / finalExchangeRate).toFixed(2) : '0.00';

    onSave({
      description: baseDesc + currencySuffix,
      amount: finalAmountInBrl,
      type,
      category_id: effectiveCatId,
      date,
      status,
      account,
      expense_type: type === 'expense' ? expenseType : undefined,
      recurrence: type === 'expense' ? recurrence : (incomeOrigin === 'mantenedor' || incomeOrigin === 'padrinho' ? 'monthly' : undefined),
      currency: hasMznConversion ? 'MZN' : 'BRL',
      original_amount: hasMznConversion ? finalOriginalAmountMzn : undefined,
      exchange_rate: hasMznConversion ? finalExchangeRate : 1,
      notes: hasMznConversion
        ? `[Moçambique] Valor em Meticais: ${formattedOriginalMzn} MT | Valor em Reais: R$ ${finalAmountInBrl.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} (Cotação efetiva: 1 MZN = R$ ${finalExchangeRate.toFixed(4)} • 1 BRL = ${inverseRate} MT${isCustomConversion ? ' - Cotação Negociada' : ''})`
        : undefined
    });
    
    // Reset form
    setDescription('');
    setAmount('');
    setAmountBrl('');
    setAmountMzn('');
    setIsCustomConversion(false);
    setCurrency('BRL');
    setCategoryId('');
    setDate(new Date().toISOString().split('T')[0]);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-[2rem] w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[92vh]">
        <div className="flex items-center justify-between p-6 sm:p-8 border-b border-slate-100 shrink-0">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Nova Transação</h2>
            <p className="text-slate-500 text-sm mt-1">Registre uma entrada ou saída em Reais (R$) e/ou Meticais (MT).</p>
          </div>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors p-2 hover:bg-slate-50 rounded-full"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-5 overflow-y-auto flex-1">
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

          {/* Origem da Entrada quando for Receita */}
          {type === 'income' && (
            <div className="space-y-1.5">
              <label className="block text-xs font-black uppercase tracking-wider text-slate-500">
                Classificação da Entrada
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setIncomeOrigin('doacao')}
                  className={cn(
                    "py-2.5 px-2 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-1.5 cursor-pointer",
                    incomeOrigin === 'doacao'
                      ? "bg-amber-50 border-amber-400 text-amber-900 shadow-2xs"
                      : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                  )}
                >
                  <DollarSign size={13} className={incomeOrigin === 'doacao' ? "text-amber-600" : "text-slate-400"} />
                  <span>Doação Geral</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIncomeOrigin('padrinho')}
                  className={cn(
                    "py-2.5 px-2 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-1.5 cursor-pointer",
                    incomeOrigin === 'padrinho'
                      ? "bg-rose-50 border-rose-400 text-rose-900 shadow-2xs"
                      : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                  )}
                >
                  <Heart size={13} className={incomeOrigin === 'padrinho' ? "text-rose-600 fill-rose-600" : "text-slate-400"} />
                  <span>Padrinho</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIncomeOrigin('mantenedor')}
                  className={cn(
                    "py-2.5 px-2 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-1.5 cursor-pointer",
                    incomeOrigin === 'mantenedor'
                      ? "bg-blue-50 border-blue-400 text-blue-900 shadow-2xs"
                      : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                  )}
                >
                  <Repeat size={13} className={incomeOrigin === 'mantenedor' ? "text-blue-600" : "text-slate-400"} />
                  <span>Mantenedor</span>
                </button>
              </div>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Descrição</label>
              <input
                type="text"
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder={type === 'income' ? "Ex: Doação YAH Church / Oferta Missões" : "Ex: Pagamento de aluguel da sede"}
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
                    onClick={() => handleSwitchCurrency('BRL')}
                    className={cn(
                      "px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer",
                      currency === 'BRL' ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-900"
                    )}
                  >
                    <span>🇧🇷 BRL (R$)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSwitchCurrency('MZN')}
                    className={cn(
                      "px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer",
                      currency === 'MZN' ? "bg-amber-700 text-white shadow-sm" : "text-slate-500 hover:text-slate-900"
                    )}
                  >
                    <span>🇲🇿 MZN (MT)</span>
                    <span className="text-[9px] bg-black/20 text-white px-1.5 py-0.2 rounded font-black">Moçambique</span>
                  </button>
                </div>
              </div>

              {currency === 'MZN' ? (
                <>
                  {/* Modo MZN: Permite informar Valor em Meticais E editar o Valor em Reais (quando já convertido / cotação melhor) */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-1.5">
                        Valor em Meticais (MT) *
                      </label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">
                          MT
                        </span>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={amount}
                          onChange={e => handleMznAmountChange(e.target.value)}
                          placeholder="Ex: 64000"
                          className="w-full border-2 border-slate-100 rounded-2xl pl-12 pr-4 py-3.5 focus:outline-none focus:ring-4 focus:ring-amber-500/10 focus:border-amber-400 transition-all font-black text-slate-900"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="block text-xs font-black uppercase tracking-wider text-emerald-800">
                          Valor em Reais (R$) *
                        </label>
                        <span className="text-[10px] font-bold text-emerald-600">
                          {isCustomConversion ? 'Editado manual' : 'Auto / Editável'}
                        </span>
                      </div>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-600 font-bold text-sm">
                          R$
                        </span>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={amountBrl}
                          onChange={e => handleConvertedBrlChange(e.target.value)}
                          placeholder="0,00"
                          className="w-full border-2 border-emerald-200 bg-emerald-50/40 rounded-2xl pl-12 pr-4 py-3.5 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all font-black text-emerald-950"
                          required
                        />
                      </div>
                    </div>
                  </div>

                  {/* Data */}
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1.5">Data do Lançamento</label>
                    <input
                      type="date"
                      value={date}
                      onChange={e => setDate(e.target.value)}
                      className="w-full border-2 border-slate-100 rounded-2xl px-5 py-3 focus:outline-none focus:ring-4 focus:ring-slate-500/10 focus:border-slate-300 transition-all font-medium"
                      required
                    />
                  </div>

                  {/* Box de Cotação Oficial vs Cotação Negociada */}
                  <div className="p-4 bg-amber-50/70 border border-amber-200/90 rounded-2xl space-y-2.5 animate-in fade-in duration-200">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className={cn(
                          "w-2.5 h-2.5 rounded-full",
                          isCustomConversion ? "bg-indigo-500" : "bg-amber-500 animate-pulse"
                        )}></span>
                        <div>
                          <p className="text-xs font-black text-slate-900 flex items-center gap-1.5 flex-wrap">
                            <span>
                              {isCustomConversion
                                ? 'Cotação Negociada Aplicada (MZN ↔ BRL)'
                                : 'Cotação Oficial Metical (MZN) → Real (BRL)'}
                            </span>
                            <span className={cn(
                              "text-[10px] px-1.5 py-0.5 rounded font-black",
                              isCustomConversion
                                ? "bg-indigo-100 text-indigo-800"
                                : "bg-amber-200/80 text-amber-900"
                            )}>
                              {isCustomConversion
                                ? 'Valor Já Convertido'
                                : rateInfo?.source === 'api' ? 'Tempo Real' : rateInfo?.source === 'cache' ? 'Em Cache' : 'Estimada'}
                            </span>
                          </p>
                          <p className="text-[11px] text-amber-900 font-bold mt-0.5">
                            1 MZN = R$ {exchangeRate.toFixed(4)} &bull; 1 BRL = {(1 / (exchangeRate || 1)).toFixed(2)} MT
                          </p>
                          {isCustomConversion && officialRate > 0 && (
                            <p className="text-[10px] text-slate-500 font-medium">
                              Oficial de referência: 1 BRL = {(1 / officialRate).toFixed(2)} MT (R$ {(parseFloat(amount || '0') * officialRate).toFixed(2)})
                            </p>
                          )}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={handleRefreshRate}
                        disabled={isLoadingRate}
                        className="px-2.5 py-1.5 text-xs font-bold text-amber-900 bg-white/80 hover:bg-white border border-amber-200 rounded-xl transition-all flex items-center gap-1 shadow-2xs cursor-pointer"
                        title="Restaurar e atualizar cotação oficial"
                      >
                        <RefreshCw size={12} className={isLoadingRate ? "animate-spin" : ""} />
                        <span>{isCustomConversion ? 'Usar Cotação Oficial' : 'Atualizar'}</span>
                      </button>
                    </div>

                    <div className="pt-2 border-t border-amber-200/60 flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-700">
                        {isCustomConversion ? 'Valor Convertido Informado (R$):' : 'Total Convertido em Reais:'}
                      </span>
                      <span className="text-sm font-black text-amber-950">
                        R$ {(parseFloat(amountBrl) || (parseFloat(amount || '0') * exchangeRate)).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  {/* Modo BRL: Valor em Reais + opção de informar também o valor em Meticais se houve conversão */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">
                        Valor (Reais - R$) *
                      </label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">
                          R$
                        </span>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={amount}
                          onChange={e => {
                            setAmount(e.target.value);
                            const numBrl = parseFloat(e.target.value);
                            const numMzn = parseFloat(amountMzn);
                            if (!isNaN(numBrl) && numBrl > 0 && !isNaN(numMzn) && numMzn > 0) {
                              setExchangeRate(numBrl / numMzn);
                            }
                          }}
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

                  {/* Campo opcional para informar Meticais quando o lançamento em BRL já foi convertido */}
                  <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-600 flex items-center gap-1.5">
                        <ArrowRightLeft size={13} className="text-amber-600" />
                        Já convertido para Meticais (MT)? <span className="text-slate-400 font-normal">(Opcional)</span>
                      </span>
                      {amountMzn && parseFloat(amountMzn) > 0 && parseFloat(amount) > 0 && (
                        <span className="text-[10px] font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                          1 BRL = {(parseFloat(amountMzn) / parseFloat(amount)).toFixed(2)} MT
                        </span>
                      )}
                    </div>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-black text-slate-400">
                        MT
                      </span>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={amountMzn}
                        onChange={e => handleOptionalMznInBrlModeChange(e.target.value)}
                        placeholder="Informe o valor correspondente em Meticais se houver (Ex: 64000)"
                        className="w-full bg-white border border-slate-200 rounded-xl pl-11 pr-4 py-2.5 text-xs font-bold text-slate-800 focus:outline-none focus:border-amber-500"
                      />
                    </div>
                  </div>
                </>
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
                  <option value="Conta Doações & Padrinhos">Conta Doações & Padrinhos</option>
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
