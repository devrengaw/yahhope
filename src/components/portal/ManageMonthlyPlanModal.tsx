import React, { useState } from 'react';
import { 
  X, 
  Heart, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle2, 
  ArrowRight, 
  RefreshCw,
  QrCode,
  CreditCard,
  ShieldCheck
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { sponsorshipService } from '../../services/sponsorshipService';

interface ManageMonthlyPlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentAmount: number;
  isActive: boolean;
  onSuccess: () => void;
}

export function ManageMonthlyPlanModal({
  isOpen,
  onClose,
  currentAmount,
  isActive,
  onSuccess
}: ManageMonthlyPlanModalProps) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'update' | 'cancel'>('update');
  const [selectedAmount, setSelectedAmount] = useState<number>(currentAmount > 0 ? currentAmount : 100);
  const [customAmount, setCustomAmount] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<'pix' | 'card'>('pix');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  if (!isOpen) return null;

  const predefinedAmounts = [
    { value: 50, label: 'R$ 50/mês', desc: 'Plano Essencial • Vitaminas e insumos' },
    { value: 100, label: 'R$ 100/mês', desc: 'Nutrição Plena • Refeições diárias' },
    { value: 150, label: 'R$ 150/mês', desc: 'Transformador • Tratamento clínico intensivo' },
    { value: 250, label: 'R$ 250/mês', desc: 'Guardião da Esperança • Resgate completo' },
  ];

  const targetAmount = customAmount 
    ? parseFloat(customAmount.replace(/\./g, '').replace(',', '.')) || 0 
    : selectedAmount;

  const handleUpdate = async () => {
    if (targetAmount < 10) {
      alert('Por favor, selecione ou informe um valor mensal mínimo de R$ 10,00.');
      return;
    }

    setIsSubmitting(true);
    setFeedbackMessage(null);

    try {
      const result = await sponsorshipService.updateGeneralMonthlySupport(
        user?.id,
        user?.email || 'mantenedor@yahhope.org',
        targetAmount,
        paymentMethod,
        user?.name || 'Mantenedor YAH Hope'
      );

      if (result.success) {
        setFeedbackMessage({ type: 'success', text: result.message });
        setTimeout(() => {
          onSuccess();
          onClose();
        }, 1500);
      } else {
        setFeedbackMessage({ type: 'error', text: result.message });
      }
    } catch (e: any) {
      setFeedbackMessage({ type: 'error', text: e.message || 'Erro ao atualizar apoio mensal.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = async () => {
    setIsSubmitting(true);
    setFeedbackMessage(null);

    try {
      const result = await sponsorshipService.cancelGeneralMonthlySupport(
        user?.id,
        user?.email || 'mantenedor@yahhope.org'
      );

      if (result.success) {
        setFeedbackMessage({ type: 'success', text: result.message });
        setTimeout(() => {
          onSuccess();
          onClose();
        }, 1500);
      } else {
        setFeedbackMessage({ type: 'error', text: result.message });
      }
    } catch (e: any) {
      setFeedbackMessage({ type: 'error', text: e.message || 'Erro ao cancelar apoio mensal.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl animate-fade-in relative flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-slate-950 to-slate-900 text-white flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-orange-500/20 border border-orange-500/30 flex items-center justify-center text-[#F49853] shrink-0">
              <RefreshCw size={22} />
            </div>
            <div>
              <span className="text-[10px] font-gotham-bold uppercase tracking-wider text-[#F49853] block">
                Portal do Mantenedor
              </span>
              <h3 className="text-xl font-heading font-black text-white">
                Gerenciar Apoio Mensal
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Abas Alternadoras */}
        {isActive && (
          <div className="p-4 bg-slate-50 border-b border-slate-200/80 flex gap-2">
            <button
              onClick={() => {
                setActiveTab('update');
                setFeedbackMessage(null);
              }}
              className={`flex-1 py-2.5 rounded-xl text-xs font-gotham-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                activeTab === 'update'
                  ? 'bg-white text-slate-900 shadow-sm border border-slate-200/80'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <TrendingUp size={14} className="text-[#F49853]" />
              <span>Aumentar / Alterar Valor</span>
            </button>
            <button
              onClick={() => {
                setActiveTab('cancel');
                setFeedbackMessage(null);
              }}
              className={`flex-1 py-2.5 rounded-xl text-xs font-gotham-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                activeTab === 'cancel'
                  ? 'bg-rose-50 text-rose-700 shadow-sm border border-rose-200'
                  : 'text-slate-500 hover:text-rose-700'
              }`}
            >
              <AlertTriangle size={14} />
              <span>Cancelar Apoio</span>
            </button>
          </div>
        )}

        {/* Mensagem de Feedback */}
        {feedbackMessage && (
          <div className={`p-4 text-xs font-gotham-medium flex items-center gap-2 ${
            feedbackMessage.type === 'success' ? 'bg-emerald-50 text-emerald-800' : 'bg-rose-50 text-rose-800'
          }`}>
            {feedbackMessage.type === 'success' ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
            <span>{feedbackMessage.text}</span>
          </div>
        )}

        {/* Corpo do Modal */}
        <div className="p-6 space-y-5 overflow-y-auto">
          {activeTab === 'update' ? (
            <div className="space-y-5">
              {/* Informação sobre substituição de valor */}
              <div className="p-4 bg-orange-50/70 border border-orange-200/80 rounded-2xl">
                <div className="flex items-start gap-3">
                  <div className="p-1.5 rounded-lg bg-orange-100 text-[#F49853] shrink-0 mt-0.5">
                    <RefreshCw size={16} />
                  </div>
                  <div className="text-xs text-slate-700 leading-relaxed font-gotham-light">
                    <strong className="text-slate-900 font-gotham-bold block mb-0.5">
                      Regra de Atualização:
                    </strong>
                    O novo valor selecionado <strong>substituirá</strong> o seu apoio atual de{' '}
                    <span className="font-bold text-slate-900">
                      R$ {currentAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}/mês
                    </span>
                    . Não haverá acúmulo nem soma duplicada no seu compromisso geral.
                  </div>
                </div>
              </div>

              {/* Seleção do Novo Valor */}
              <div>
                <label className="text-xs font-gotham-bold uppercase tracking-wider text-slate-500 block mb-2.5">
                  Escolha o Novo Valor Mensal
                </label>
                <div className="grid grid-cols-2 gap-2.5">
                  {predefinedAmounts.map((amt) => {
                    const isSelected = selectedAmount === amt.value && !customAmount;
                    return (
                      <button
                        key={amt.value}
                        type="button"
                        onClick={() => {
                          setSelectedAmount(amt.value);
                          setCustomAmount('');
                        }}
                        className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                          isSelected
                            ? 'border-[#F49853] bg-orange-50/60 ring-2 ring-[#F49853]/30 shadow-xs'
                            : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        <span className="text-base font-heading font-black text-slate-900 block">
                          {amt.label}
                        </span>
                        <span className="text-[11px] text-slate-500 font-gotham-light block mt-0.5 leading-snug">
                          {amt.desc}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Valor Livre */}
                <div className="mt-3 relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xs font-black text-slate-400">
                    R$
                  </span>
                  <input
                    type="text"
                    placeholder="Outro valor mensal personalizado (ex: 200,00)"
                    value={customAmount}
                    onChange={(e) => setCustomAmount(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#F49853]/20 focus:border-[#F49853] transition-all"
                  />
                </div>
              </div>

              {/* Forma de Pagamento */}
              <div>
                <label className="text-xs font-gotham-bold uppercase tracking-wider text-slate-500 block mb-2">
                  Forma de Cobrança
                </label>
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('pix')}
                    className={`p-3 rounded-xl border flex items-center justify-center gap-2 font-gotham-bold text-xs transition-all cursor-pointer ${
                      paymentMethod === 'pix'
                        ? 'border-[#F49853] bg-orange-50 text-[#F49853] ring-2 ring-[#F49853]/20'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <QrCode size={16} />
                    <span>PIX Mensal</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('card')}
                    className={`p-3 rounded-xl border flex items-center justify-center gap-2 font-gotham-bold text-xs transition-all cursor-pointer ${
                      paymentMethod === 'card'
                        ? 'border-[#F49853] bg-orange-50 text-[#F49853] ring-2 ring-[#F49853]/20'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <CreditCard size={16} />
                    <span>Cartão de Crédito</span>
                  </button>
                </div>
              </div>

              {/* Botão de Ação */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleUpdate}
                  disabled={isSubmitting || targetAmount <= 0}
                  className="w-full py-4 bg-[#F49853] hover:bg-[#e0853d] text-white font-gotham-bold text-xs uppercase tracking-wider rounded-2xl shadow-lg shadow-orange-500/20 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-60"
                >
                  <RefreshCw size={16} className={isSubmitting ? 'animate-spin' : ''} />
                  <span>
                    Substituir para R$ {targetAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}/mês
                  </span>
                  <ArrowRight size={14} />
                </button>
              </div>
            </div>
          ) : (
            /* Aba de Cancelamento */
            <div className="space-y-5">
              <div className="p-5 bg-rose-50 border border-rose-200 rounded-2xl space-y-3">
                <div className="flex items-center gap-2 text-rose-700 font-gotham-bold text-sm">
                  <AlertTriangle size={18} />
                  <span>Deseja cancelar seu apoio mensal?</span>
                </div>
                <p className="text-xs text-rose-800/90 font-gotham-light leading-relaxed">
                  Seu apoio mensal atual de{' '}
                  <strong className="font-gotham-bold">
                    R$ {currentAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}/mês
                  </strong>{' '}
                  sustenta a alimentação terapêutica e exames médicos de crianças na Casa Nutri em Moçambique.
                </p>
                <p className="text-xs text-slate-600 font-gotham-light">
                  Se estiver passando por um momento difícil, você pode reduzir o valor para R$ 50/mês na aba de alteração em vez de cancelar.
                </p>
              </div>

              <div className="pt-2 flex flex-col sm:flex-row gap-3">
                <button
                  type="button"
                  onClick={handleCancel}
                  disabled={isSubmitting}
                  className="flex-1 py-3.5 bg-rose-600 hover:bg-rose-700 text-white font-gotham-bold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  <AlertTriangle size={14} />
                  <span>Confirmar Cancelamento</span>
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="py-3.5 px-6 bg-slate-100 hover:bg-slate-200 text-slate-700 font-gotham-medium text-xs rounded-xl transition-all cursor-pointer"
                >
                  Manter Apoio
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-center gap-2 text-[11px] text-slate-400 font-gotham-light">
          <ShieldCheck size={14} className="text-emerald-500" />
          <span>Gestão segura sem fidelidade forçada • YAH Hope</span>
        </div>

      </div>
    </div>
  );
}
