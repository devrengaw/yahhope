import React, { useState, useEffect, useMemo } from 'react';
import { X, Send, DollarSign, Calendar, Wallet, Layers, FileText, CheckCircle2, Building2, RefreshCw, ArrowRightLeft, Sparkles, TrendingUp } from 'lucide-react';
import { cn } from '../../../lib/utils';
import { Transaction, TransactionCategory } from '../../../pages/admin/Finance';
import { Project } from '../../../lib/mockData';
import { getMznToBrlRate, ExchangeRateResult } from '../../../services/currencyService';

export interface RepassePayload {
  projectName: string;
  module: string;
  amount: number;
  date: string;
  account: string;
  description: string;
  notes?: string;
  category_id?: string;
  currency?: 'BRL' | 'MZN';
  original_amount?: number;
  exchange_rate?: number;
}

interface ProjectRepasseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (repasse: RepassePayload) => Promise<void> | void;
  defaultModule?: 'nutrition' | 'communication' | 'global' | string;
  defaultAmount?: number;
  categories?: TransactionCategory[];
  projects?: Project[];
  transactions?: Transaction[];
  availableCentralCash?: number;
  lockModule?: boolean;
}

export function ProjectRepasseModal({
  isOpen,
  onClose,
  onSave,
  defaultModule = 'nutrition',
  defaultAmount,
  categories = [],
  projects = [],
  transactions = [],
  availableCentralCash,
  lockModule = false
}: ProjectRepasseModalProps) {
  const [selectedModule, setSelectedModule] = useState<string>(defaultModule);
  const [currency, setCurrency] = useState<'BRL' | 'MZN'>('BRL');
  const [amount, setAmount] = useState(''); // Valor em BRL quando BRL, ou MT quando MZN
  const [amountSecondary, setAmountSecondary] = useState(''); // Valor convertido na outra moeda (editável)
  const [isCustomConversion, setIsCustomConversion] = useState(false);
  const [exchangeRate, setExchangeRate] = useState<number>(0.08103);
  const [officialRate, setOfficialRate] = useState<number>(0.08103);
  const [rateInfo, setRateInfo] = useState<ExchangeRateResult | null>(null);
  const [isLoadingRate, setIsLoadingRate] = useState(false);

  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [account, setAccount] = useState('Conta Principal');
  const [description, setDescription] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const getModuleDisplayName = (mod: string) => {
    if (mod === 'nutrition') return 'Casa Nutri';
    if (mod === 'communication') return 'Comunicação';
    const matchedProj = projects.find(p => p.id === mod || p.name.toLowerCase() === mod.toLowerCase());
    if (matchedProj) return matchedProj.name;
    return mod;
  };

  // Cálculo automático de cobertura e sugestão inteligente para o projeto selecionado no mês vigente
  const moduleSummary = useMemo(() => {
    const now = new Date();
    const curMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const modNameLower = getModuleDisplayName(selectedModule).toLowerCase();

    // Repasses enviados a este módulo no mês atual
    const repassedMonth = transactions
      .filter(t => {
        if (t.type !== 'income') return false;
        const tMod = (t.module || '').toLowerCase();
        const tDesc = (t.description || '').toLowerCase();
        const isRep = (tMod !== 'global' && tMod !== '') || tDesc.includes('repasse');
        if (!isRep) return false;
        const matchesMod = tMod === selectedModule.toLowerCase() || tDesc.includes(modNameLower);
        return matchesMod && (t.date || '').startsWith(curMonthKey);
      })
      .reduce((acc, t) => acc + (Number(t.amount) || 0), 0);

    // Custos fixos (amortizados) + variáveis do mês deste módulo
    const moduleExpenses = transactions.filter(t => {
      if (t.type !== 'expense') return false;
      const tMod = (t.module || '').toLowerCase();
      return tMod === selectedModule.toLowerCase();
    });

    const fixedMonthlyCost = moduleExpenses
      .filter(t => t.expense_type === 'fixed')
      .reduce((acc, t) => {
        const rec = t.recurrence || 'monthly';
        if (rec === 'bimonthly') return acc + t.amount / 2;
        if (rec === 'quarterly') return acc + t.amount / 3;
        if (rec === 'semiannual') return acc + t.amount / 6;
        if (rec === 'yearly') return acc + t.amount / 12;
        return acc + t.amount;
      }, 0);

    const variableMonthCost = moduleExpenses
      .filter(t => t.expense_type !== 'fixed' && (t.date || '').startsWith(curMonthKey))
      .reduce((acc, t) => acc + (Number(t.amount) || 0), 0);

    const matchedProj = projects.find(p => {
      const n = (p.name || '').toLowerCase();
      if (selectedModule === 'nutrition') return n.includes('nutri');
      if (selectedModule === 'communication') return n.includes('comunica') || p.module === 'communication';
      return p.id === selectedModule || n === modNameLower;
    });

    const projectBudget = Number(matchedProj?.budget || 0);
    const calculatedMonthExpenses = fixedMonthlyCost + variableMonthCost;
    const targetMonthlyNeed = Math.max(calculatedMonthExpenses, projectBudget);
    const remainingToCover = Math.max(0, Number((targetMonthlyNeed - repassedMonth).toFixed(2)));

    return {
      targetMonthlyNeed,
      calculatedMonthExpenses,
      projectBudget,
      repassedMonth,
      remainingToCover
    };
  }, [selectedModule, transactions, projects]);

  const applySuggestedBrlAmount = (brlVal: number) => {
    if (brlVal <= 0) return;
    if (currency === 'BRL') {
      setAmount(brlVal.toFixed(2));
      if (exchangeRate > 0) {
        setAmountSecondary((brlVal / exchangeRate).toFixed(2));
      }
    } else {
      // Se estiver em modo MZN, preenche o BRL secundário e converte o MT primário
      setAmountSecondary(brlVal.toFixed(2));
      if (exchangeRate > 0) {
        setAmount((brlVal / exchangeRate).toFixed(2));
      }
    }
  };

  useEffect(() => {
    if (isOpen) {
      const mod = defaultModule || 'nutrition';
      setSelectedModule(mod);
      const name = getModuleDisplayName(mod);
      setDescription(`Repasse Orçamentário - ${name}`);
      setDate(new Date().toISOString().split('T')[0]);
      setAmount(defaultAmount && defaultAmount > 0 ? defaultAmount.toFixed(2) : '');
      setAmountSecondary('');
      setIsCustomConversion(false);
      setCurrency('BRL');
      setNotes('');

      setIsLoadingRate(true);
      getMznToBrlRate()
        .then(info => {
          setRateInfo(info);
          setOfficialRate(info.rate);
          setExchangeRate(info.rate);
        })
        .catch(() => {})
        .finally(() => setIsLoadingRate(false));
    }
  }, [isOpen, defaultModule, defaultAmount]);

  if (!isOpen) return null;

  const handleModuleChange = (newMod: string) => {
    setSelectedModule(newMod);
    const name = getModuleDisplayName(newMod);
    setDescription(`Repasse Orçamentário - ${name}`);
  };

  const handleRefreshRate = async () => {
    setIsLoadingRate(true);
    try {
      const info = await getMznToBrlRate(true);
      setRateInfo(info);
      setOfficialRate(info.rate);
      setExchangeRate(info.rate);
      setIsCustomConversion(false);
      const primary = parseFloat(amount);
      if (!isNaN(primary) && primary > 0) {
        if (currency === 'MZN') {
          setAmountSecondary((primary * info.rate).toFixed(2));
        } else if (amountSecondary) {
          setAmountSecondary((primary / info.rate).toFixed(2));
        }
      }
    } finally {
      setIsLoadingRate(false);
    }
  };

  const handlePrimaryAmountChange = (val: string) => {
    setAmount(val);
    const num = parseFloat(val);
    if (!isNaN(num) && num > 0) {
      if (currency === 'MZN') {
        if (isCustomConversion && parseFloat(amountSecondary) > 0) {
          setExchangeRate(parseFloat(amountSecondary) / num);
        } else {
          setAmountSecondary((num * exchangeRate).toFixed(2));
        }
      } else {
        // BRL primary: se já tem MT informado, atualiza a taxa
        const secMzn = parseFloat(amountSecondary);
        if (!isNaN(secMzn) && secMzn > 0) {
          setExchangeRate(num / secMzn);
        }
      }
    } else if (!isCustomConversion) {
      setAmountSecondary('');
    }
  };

  const handleSecondaryAmountChange = (val: string) => {
    setAmountSecondary(val);
    setIsCustomConversion(true);
    const primary = parseFloat(amount);
    const secondary = parseFloat(val);
    if (!isNaN(primary) && primary > 0 && !isNaN(secondary) && secondary > 0) {
      if (currency === 'MZN') {
        // primary = MT, secondary = R$
        setExchangeRate(secondary / primary);
      } else {
        // primary = R$, secondary = MT
        setExchangeRate(primary / secondary);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsedPrimary = parseFloat(amount.replace(',', '.'));
    const parsedSecondary = parseFloat(amountSecondary.replace(',', '.'));

    if (!parsedPrimary || parsedPrimary <= 0) {
      alert('Informe um valor válido para o repasse.');
      return;
    }

    let finalAmountBrl = parsedPrimary;
    let finalOriginalMzn: number | undefined = undefined;
    let finalRate = 1;
    const hasMzn = currency === 'MZN' || (!isNaN(parsedSecondary) && parsedSecondary > 0);

    if (currency === 'MZN') {
      finalOriginalMzn = parsedPrimary;
      finalAmountBrl = (!isNaN(parsedSecondary) && parsedSecondary > 0)
        ? Number(parsedSecondary.toFixed(2))
        : Number((parsedPrimary * exchangeRate).toFixed(2));
      finalRate = parsedPrimary > 0 ? (finalAmountBrl / parsedPrimary) : exchangeRate;
    } else if (!isNaN(parsedSecondary) && parsedSecondary > 0) {
      finalAmountBrl = Number(parsedPrimary.toFixed(2));
      finalOriginalMzn = parsedSecondary;
      finalRate = parsedSecondary > 0 ? (finalAmountBrl / parsedSecondary) : exchangeRate;
    }

    const incomeCat = categories.find(c => c.type === 'income');
    const projectName = getModuleDisplayName(selectedModule);
    const formattedMzn = finalOriginalMzn
      ? finalOriginalMzn.toLocaleString('pt-BR', { minimumFractionDigits: 2 })
      : '';
    const descBase = description.trim() || `Repasse para ${projectName}`;
    const descWithMzn = hasMzn && formattedMzn && !descBase.includes('MT')
      ? `${descBase} (${formattedMzn} MT)`
      : descBase;

    const mznNote = hasMzn && finalOriginalMzn
      ? `[Câmbio Repasse] Valor em Meticais: ${formattedMzn} MT | Valor em Reais: R$ ${finalAmountBrl.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} (Taxa: 1 BRL = ${(1 / finalRate).toFixed(2)} MT)`
      : '';

    setIsSubmitting(true);
    try {
      await onSave({
        projectName,
        module: selectedModule,
        amount: finalAmountBrl,
        date,
        account,
        description: descWithMzn,
        notes: [notes.trim(), mznNote].filter(Boolean).join(' • ') || undefined,
        category_id: incomeCat?.id,
        currency: hasMzn ? 'MZN' : 'BRL',
        original_amount: hasMzn ? finalOriginalMzn : undefined,
        exchange_rate: hasMzn ? finalRate : 1
      });
      onClose();
    } catch (err) {
      console.error('Erro ao registrar repasse:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Projetos customizados que não são Casa Nutri nem Comunicação
  const extraProjects = projects.filter(p => {
    const n = p.name.toLowerCase();
    return !n.includes('nutri') && !n.includes('comunica');
  });

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
      <div className="bg-white rounded-[2.5rem] w-full max-w-lg shadow-2xl overflow-hidden border border-slate-100 flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 sm:p-8 border-b border-slate-100 bg-gradient-to-r from-emerald-500/10 via-teal-500/5 to-transparent shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-emerald-600 text-white rounded-2xl shadow-lg shadow-emerald-600/30">
              <Send size={22} />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900">
                Repasse para Projeto
              </h2>
              <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mt-0.5">
                Transferência do Caixa Central para o Projeto
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-2 hover:bg-slate-100 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-5 overflow-y-auto flex-1">
          
          {/* Seletor de Projeto Destino */}
          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-slate-500 mb-2">
              Projeto / Setor de Destino
            </label>
            {lockModule ? (
              <div className="flex items-center gap-2 px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-800 text-sm">
                <Building2 size={18} className="text-emerald-600" />
                {getModuleDisplayName(selectedModule)}
              </div>
            ) : (
              <div className="space-y-2.5">
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => handleModuleChange('nutrition')}
                    className={cn(
                      "flex items-center justify-center gap-2 p-3.5 rounded-2xl border-2 font-bold text-xs transition-all cursor-pointer",
                      selectedModule === 'nutrition' 
                        ? "border-emerald-600 bg-emerald-50 text-emerald-900 shadow-sm"
                        : "border-slate-200 text-slate-600 hover:border-slate-300"
                    )}
                  >
                    <Building2 size={16} className={selectedModule === 'nutrition' ? "text-emerald-600" : "text-slate-400"} />
                    Casa Nutri
                  </button>
                  <button
                    type="button"
                    onClick={() => handleModuleChange('communication')}
                    className={cn(
                      "flex items-center justify-center gap-2 p-3.5 rounded-2xl border-2 font-bold text-xs transition-all cursor-pointer",
                      selectedModule === 'communication' 
                        ? "border-purple-600 bg-purple-50 text-purple-900 shadow-sm"
                        : "border-slate-200 text-slate-600 hover:border-slate-300"
                    )}
                  >
                    <Layers size={16} className={selectedModule === 'communication' ? "text-purple-600" : "text-slate-400"} />
                    Comunicação
                  </button>
                </div>

                {extraProjects.length > 0 && (
                  <select
                    value={selectedModule !== 'nutrition' && selectedModule !== 'communication' ? selectedModule : ''}
                    onChange={e => { if (e.target.value) handleModuleChange(e.target.value); }}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:border-emerald-500"
                  >
                    <option value="">Ou selecione outro projeto cadastrado...</option>
                    {extraProjects.map(p => (
                      <option key={p.id} value={p.id}>
                        Projeto: {p.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            )}
          </div>

          {/* Card de Diagnóstico Mensal & Sugestão Inteligente de Repasse */}
          <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] font-black uppercase tracking-wider text-emerald-900 flex items-center gap-1.5">
                <Sparkles size={13} className="text-emerald-600" />
                Resumo do Mês: {getModuleDisplayName(selectedModule)}
              </span>
              {availableCentralCash !== undefined && (
                <span className="text-[10px] font-bold bg-white/90 text-slate-700 px-2.5 py-0.5 rounded-full border border-emerald-200">
                  Caixa Livre: <strong>R$ {availableCentralCash.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong>
                </span>
              )}
            </div>

            <div className="grid grid-cols-3 gap-2 text-center bg-white/90 p-2.5 rounded-xl border border-emerald-100">
              <div>
                <p className="text-[9px] font-black uppercase tracking-wider text-slate-400">Demanda Mês</p>
                <p className="text-xs font-black text-slate-900 mt-0.5">
                  R$ {moduleSummary.targetMonthlyNeed.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div className="border-x border-slate-100">
                <p className="text-[9px] font-black uppercase tracking-wider text-slate-400">Já Repassado</p>
                <p className="text-xs font-black text-emerald-700 mt-0.5">
                  R$ {moduleSummary.repassedMonth.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div>
                <p className="text-[9px] font-black uppercase tracking-wider text-slate-400">Falta Cobrir</p>
                <p className={cn(
                  "text-xs font-black mt-0.5",
                  moduleSummary.remainingToCover > 0 ? "text-amber-700" : "text-emerald-600"
                )}>
                  {moduleSummary.remainingToCover > 0
                    ? `R$ ${moduleSummary.remainingToCover.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                    : '100% Coberto ✓'}
                </p>
              </div>
            </div>

            {(moduleSummary.remainingToCover > 0 || moduleSummary.targetMonthlyNeed > 0) && (
              <div className="flex flex-wrap items-center gap-2 pt-0.5">
                <span className="text-[10px] font-bold text-emerald-800">Preencher rápido:</span>
                {moduleSummary.remainingToCover > 0 && (
                  <button
                    type="button"
                    onClick={() => applySuggestedBrlAmount(moduleSummary.remainingToCover)}
                    className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-black transition-all cursor-pointer shadow-2xs"
                  >
                    Sugerir Restante: R$ {moduleSummary.remainingToCover.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </button>
                )}
                {moduleSummary.targetMonthlyNeed > 0 && moduleSummary.targetMonthlyNeed !== moduleSummary.remainingToCover && (
                  <button
                    type="button"
                    onClick={() => applySuggestedBrlAmount(moduleSummary.targetMonthlyNeed)}
                    className="px-2.5 py-1 bg-white hover:bg-emerald-100 text-emerald-900 border border-emerald-200 rounded-lg text-[11px] font-bold transition-all cursor-pointer"
                  >
                    Custo Total Mês: R$ {moduleSummary.targetMonthlyNeed.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Moeda e Conversão BRL / MZN */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-black uppercase tracking-wider text-slate-500">
                Moeda do Repasse
              </label>
              <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl">
                <button
                  type="button"
                  onClick={() => setCurrency('BRL')}
                  className={cn(
                    "px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer",
                    currency === 'BRL' ? "bg-white text-slate-900 shadow-2xs" : "text-slate-500"
                  )}
                >
                  🇧🇷 BRL (R$)
                </button>
                <button
                  type="button"
                  onClick={() => setCurrency('MZN')}
                  className={cn(
                    "px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer",
                    currency === 'MZN' ? "bg-emerald-600 text-white shadow-2xs" : "text-slate-500"
                  )}
                >
                  🇲🇿 MZN + R$
                </button>
              </div>
            </div>

            {currency === 'MZN' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-slate-500 mb-1.5">
                    Valor em Meticais (MT) *
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-black text-slate-400 text-sm">
                      MT
                    </span>
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      required
                      value={amount}
                      onChange={e => handlePrimaryAmountChange(e.target.value)}
                      placeholder="Ex: 64000"
                      className="w-full pl-11 pr-3 py-3.5 bg-slate-50 border-2 border-slate-100 rounded-2xl font-black text-lg text-slate-900 focus:outline-none focus:border-emerald-500 focus:bg-white transition-all"
                    />
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-black uppercase tracking-wider text-emerald-700">
                      Valor em Reais (R$) *
                    </label>
                    <span className="text-[10px] font-bold text-emerald-600">
                      {isCustomConversion ? 'Cotação manual' : 'Editável'}
                    </span>
                  </div>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-black text-emerald-600 text-sm">
                      R$
                    </span>
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      required
                      value={amountSecondary}
                      onChange={e => handleSecondaryAmountChange(e.target.value)}
                      placeholder="0,00"
                      className="w-full pl-11 pr-3 py-3.5 bg-emerald-50/50 border-2 border-emerald-200 rounded-2xl font-black text-lg text-emerald-950 focus:outline-none focus:border-emerald-600 focus:bg-white transition-all"
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-slate-500 mb-1.5">
                    Valor do Repasse (R$) *
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-slate-400 text-lg">
                      R$
                    </span>
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      required
                      value={amount}
                      onChange={e => handlePrimaryAmountChange(e.target.value)}
                      placeholder="0,00"
                      className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border-2 border-slate-100 rounded-2xl font-black text-xl text-slate-900 focus:outline-none focus:border-emerald-500 focus:bg-white transition-all shadow-inner"
                    />
                  </div>
                </div>

                {/* Opcional em Meticais */}
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-600 flex items-center gap-1">
                      <ArrowRightLeft size={12} className="text-emerald-600" />
                      Valor recebido em Meticais (MT) <span className="text-slate-400 font-normal">(Opcional)</span>
                    </span>
                    {amountSecondary && parseFloat(amountSecondary) > 0 && parseFloat(amount) > 0 && (
                      <span className="text-[10px] font-black text-emerald-700">
                        1 BRL = {(parseFloat(amountSecondary) / parseFloat(amount)).toFixed(2)} MT
                      </span>
                    )}
                  </div>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-black text-slate-400">MT</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={amountSecondary}
                      onChange={e => handleSecondaryAmountChange(e.target.value)}
                      placeholder="Informe os Meticais se já foi convertido..."
                      className="w-full pl-10 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Data e Conta de Origem */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-slate-500 mb-2">
                Data da Transferência
              </label>
              <div className="relative">
                <Calendar size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="date"
                  required
                  value={date}
                  onChange={e => setDate(e.target.value)}
                  className="w-full pl-10 pr-3 py-3 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-slate-500 mb-2">
                Conta de Origem
              </label>
              <div className="relative">
                <Wallet size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <select
                  value={account}
                  onChange={e => setAccount(e.target.value)}
                  className="w-full pl-10 pr-3 py-3 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:border-emerald-500"
                >
                  <option value="Conta Principal">Conta Principal</option>
                  <option value="Conta Doações & Padrinhos">Conta Doações & Padrinhos</option>
                  <option value="Fundo de Reserva">Fundo de Reserva</option>
                  <option value="Conta Projetos">Conta Projetos</option>
                </select>
              </div>
            </div>
          </div>

          {/* Descrição */}
          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-slate-500 mb-2">
              Descrição / Finalidade
            </label>
            <input
              type="text"
              required
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Ex: Repasse Orçamentário Mensal"
              className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Observações */}
          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-slate-500 mb-2">
              Observações (Opcional)
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Informações adicionais sobre a destinação deste repasse..."
              className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-none focus:border-emerald-500 resize-none"
            />
          </div>

          {/* Footer Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-3 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-all"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-emerald-600/30 transition-all active:scale-95 disabled:opacity-50"
            >
              <CheckCircle2 size={16} />
              {isSubmitting ? 'Salvando...' : 'Confirmar Repasse'}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
