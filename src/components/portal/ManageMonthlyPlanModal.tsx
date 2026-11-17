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
import { useLanguage } from '../../contexts/LanguageContext';

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
  const { tr, isEn } = useLanguage();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'update' | 'cancel'>('update');
  const [selectedAmount, setSelectedAmount] = useState<number>(currentAmount > 0 ? currentAmount : 100);
  const [customAmount, setCustomAmount] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<'pix' | 'card'>('pix');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  if (!isOpen) return null;

  const predefinedAmounts = [
    { value: 50, label: tr('R$ 50/mês', 'R$ 50/mo'), desc: tr('Plano Essencial • Vitaminas e insumos', 'Essential Plan • Vitamins & supplies') },
    { value: 100, label: tr('R$ 100/mês', 'R$ 100/mo'), desc: tr('Nutrição Plena • Refeições diárias', 'Full Nutrition • Daily meals') },
    { value: 150, label: tr('R$ 150/mês', 'R$ 150/mo'), desc: tr('Transformador • Tratamento clínico intensivo', 'Transformer • Intensive clinical care') },
    { value: 250, label: tr('R$ 250/mês', 'R$ 250/mo'), desc: tr('Guardião da Esperança • Resgate completo', 'Guardian of Hope • Complete rescue') },
  ];

  const targetAmount = customAmount 
    ? parseFloat(customAmount.replace(/\./g, '').replace(',', '.')) || 0 
    : selectedAmount;

  const handleUpdate = async () => {
    if (targetAmount < 10) {
      alert(tr('Por favor, selecione ou informe um valor mensal mínimo de R$ 10,00.', 'Please select or enter a minimum monthly amount of R$ 10.00.'));
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
        user?.name || tr('Mantenedor YAH Hope', 'YAH Hope Supporter')
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
      setFeedbackMessage({ type: 'error', text: e.message || tr('Erro ao atualizar apoio mensal.', 'Error updating monthly support.') });
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
      setFeedbackMessage({ type: 'error', text: e.message || tr('Erro ao cancelar apoio mensal.', 'Error canceling monthly support.') });
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
                {tr('Portal do Mantenedor', 'Supporter Portal')}
              </span>
              <h3 className="text-xl font-heading font-black text-white">
                {tr('Gerenciar Apoio Mensal', 'Manage Monthly Support')}
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
              <span>{tr('Aumentar / Alterar Valor', 'Increase / Change Amount')}</span>
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
              <span>{tr('Cancelar Apoio', 'Cancel Support')}</span>
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
                      {tr('Regra de Atualização:', 'Update Rule:')}
                    </strong>
                    {tr('O novo valor selecionado', 'The newly selected amount')} <strong>{tr('substituirá', 'will replace')}</strong> {tr('o seu apoio atual de', 'your current support of')}{' '}
                    <span className="font-bold text-slate-900">
                      R$ {currentAmount.toLocaleString(isEn ? 'en-US' : 'pt-BR', { minimumFractionDigits: 2 })}/{tr('mês', 'mo')}
                    </span>
                    . {tr('Não haverá acúmulo nem soma duplicada no seu compromisso geral.', 'There will be no duplicate charges or accumulation on your commitment.')}
                  </div>
                </div>
              </div>

              {/* Seleção do Novo Valor */}
              <div>
                <label className="text-xs font-gotham-bold uppercase tracking-wider text-slate-500 block mb-2.5">
                  {tr('Escolha o Novo Valor Mensal', 'Choose the New Monthly Amount')}
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
                    placeholder={tr('Outro valor mensal personalizado (ex: 200,00)', 'Other custom monthly amount (e.g., 200.00)')}
                    value={customAmount}
                    onChange={(e) => setCustomAmount(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#F49853]/20 focus:border-[#F49853] transition-all"
                  />
                </div>
              </div>

              {/* Forma de Pagamento */}
              <div>
                <label className="text-xs font-gotham-bold uppercase tracking-wider text-slate-500 block mb-2">
                  {tr('Forma de Cobrança', 'Billing Method')}
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
                    <span>{tr('PIX Mensal', 'Monthly PIX')}</span>
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
                    <span>{tr('Cartão de Crédito', 'Credit Card')}</span>
                  </button>
                </div>
                {paymentMethod === 'card' && (
                  <div className="mt-2 p-2.5 bg-blue-50/70 border border-blue-200/70 rounded-xl text-[11px] text-blue-900 font-gotham-light flex items-center gap-2">
                    <ShieldCheck size={14} className="text-blue-600 shrink-0" />
                    <span>
                      <strong>{tr('Não compromete seu limite:', 'Does not tie up your credit limit:')}</strong>{' '}
                      {tr(
                        'cobrança mensal avulsa, sem parcelamento e sem bloquear o limite total do cartão.',
                        'single monthly charge, without installments or holding your full card limit.'
                      )}
                    </span>
                  </div>
                )}
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
                    {tr('Substituir para', 'Update to')} R$ {targetAmount.toLocaleString(isEn ? 'en-US' : 'pt-BR', { minimumFractionDigits: 2 })}/{tr('mês', 'mo')}
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
                  <span>{tr('Deseja cancelar seu apoio mensal?', 'Do you want to cancel your monthly support?')}</span>
                </div>
                <p className="text-xs text-rose-800/90 font-gotham-light leading-relaxed">
                  {tr('Seu apoio mensal atual de', 'Your current monthly support of')}{' '}
                  <strong className="font-gotham-bold">
                    R$ {currentAmount.toLocaleString(isEn ? 'en-US' : 'pt-BR', { minimumFractionDigits: 2 })}/{tr('mês', 'mo')}
                  </strong>{' '}
                  {tr(
                    'sustenta a alimentação terapêutica e exames médicos de crianças na Casa Nutri em Moçambique.',
                    'sustains therapeutic nutrition and medical exams for children at Casa Nutri in Mozambique.'
                  )}
                </p>
                <p className="text-xs text-slate-600 font-gotham-light">
                  {tr(
                    'Se estiver passando por um momento difícil, você pode reduzir o valor para R$ 50/mês na aba de alteração em vez de cancelar.',
                    'If you are going through a difficult time, you can lower the amount to R$ 50/mo in the update tab instead of canceling.'
                  )}
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
                  <span>{tr('Confirmar Cancelamento', 'Confirm Cancellation')}</span>
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="py-3.5 px-6 bg-slate-100 hover:bg-slate-200 text-slate-700 font-gotham-medium text-xs rounded-xl transition-all cursor-pointer"
                >
                  {tr('Manter Apoio', 'Keep Support')}
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-center gap-2 text-[11px] text-slate-400 font-gotham-light">
          <ShieldCheck size={14} className="text-emerald-500" />
          <span>{tr('Gestão segura sem fidelidade forçada • YAH Hope', 'Secure management with no forced lock-in • YAH Hope')}</span>
        </div>

      </div>
    </div>
  );
}
