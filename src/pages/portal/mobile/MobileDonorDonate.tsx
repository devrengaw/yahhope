import React, { useState, useMemo } from 'react';
import { 
  Heart, 
  DollarSign, 
  Copy, 
  Check, 
  Sparkles, 
  ShieldCheck, 
  QrCode, 
  Receipt, 
  ArrowRight,
  RefreshCw,
  CreditCard,
  Building2,
  Lock,
  CheckCircle2,
  TrendingUp,
  FileText
} from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import { useFundraising } from '../../../contexts/FundraisingContext';
import { sponsorshipService, SupporterCommitmentSummary } from '../../../services/sponsorshipService';
import { ManageMonthlyPlanModal } from '../../../components/portal/ManageMonthlyPlanModal';
import { PortalMyDonations } from '../PortalMyDonations';

export function MobileDonorDonate() {
  const { user } = useAuth();
  const { campaigns, activeCampaign, campaign: defaultCamp, createDonation, calculateCampaignProgress } = useFundraising();
  const [activeTab, setActiveTab] = useState<'donate' | 'history'>('donate');

  // Sincronização idêntica com a Régua da Campanha pública
  const availableCampaigns = useMemo(() => {
    const list = campaigns || [];
    const active = list.filter(c => c && c.is_active !== false);
    if (active.length > 0) return active;
    if (list.length > 0) return list;
    if (defaultCamp) return [defaultCamp];
    return [];
  }, [campaigns, defaultCamp]);

  const totalRulerGoal = useMemo(() => {
    return availableCampaigns.reduce((sum, c) => sum + (c.target_amount || 0), 0);
  }, [availableCampaigns]);

  const totalRulerRaised = useMemo(() => {
    return availableCampaigns.reduce((sum, c) => {
      const p = calculateCampaignProgress(c);
      return sum + p.currentAmount;
    }, 0);
  }, [availableCampaigns, calculateCampaignProgress]);

  const rulerOverallPercentage = totalRulerGoal > 0 
    ? Math.min(Math.round((totalRulerRaised / totalRulerGoal) * 100), 100) 
    : 0;

  const stagesData = useMemo(() => {
    let runningTarget = 0;
    return availableCampaigns.map((camp, idx) => {
      const prevTarget = runningTarget;
      runningTarget += (camp.target_amount || 0);
      const threshold = runningTarget;
      const isReached = totalRulerRaised >= threshold;
      const isCurrent = !isReached && totalRulerRaised >= prevTarget;
      const isUpcoming = totalRulerRaised < prevTarget;
      
      const campStats = calculateCampaignProgress(camp);
      const stageNumber = idx + 1;

      let stageProgress = 0;
      if (isReached) {
        stageProgress = 100;
      } else if (isCurrent && camp.target_amount > 0) {
        const raisedInThisStage = Math.max(0, totalRulerRaised - prevTarget);
        stageProgress = Math.min(100, Math.round((raisedInThisStage / camp.target_amount) * 100));
      }

      return {
        campaign: camp,
        stageNumber,
        prevTarget,
        threshold,
        isReached,
        isCurrent,
        isUpcoming,
        campStats,
        stageProgress
      };
    });
  }, [availableCampaigns, totalRulerRaised, calculateCampaignProgress]);

  const currentActiveStage = useMemo(() => {
    return stagesData.find(s => s.isCurrent) || stagesData[0] || null;
  }, [stagesData]);

  const currentCampaign = currentActiveStage?.campaign || activeCampaign || defaultCamp;
  const currentStageProgress = currentActiveStage ? currentActiveStage.stageProgress : (currentCampaign?.target_amount ? Math.min(100, Math.round((totalRulerRaised / currentCampaign.target_amount) * 100)) : 0);
  const currentStageRaised = currentActiveStage ? (currentActiveStage.isReached ? currentActiveStage.campaign.target_amount : Math.max(0, totalRulerRaised - currentActiveStage.prevTarget)) : totalRulerRaised;
  const currentStageTarget = currentCampaign?.target_amount || 0;

  // Gerenciamento de Apoio Mensal Recorrente
  const [monthlyCommitments, setMonthlyCommitments] = useState<SupporterCommitmentSummary | null>(null);
  const [isManageModalOpen, setIsManageModalOpen] = useState(false);

  const fetchCommitments = () => {
    sponsorshipService.getSupporterCommitments(user?.id, user?.email)
      .then(res => setMonthlyCommitments(res))
      .catch(e => console.warn('Erro ao carregar compromissos do mantenedor:', e));
  };

  React.useEffect(() => {
    fetchCommitments();
  }, [user?.id, user?.email]);

  // Donation form state
  const [frequency, setFrequency] = useState<'monthly' | 'single'>('monthly');
  const [selectedAmount, setSelectedAmount] = useState<number>(100);
  const [customAmount, setCustomAmount] = useState<string>('');
  const [selectedCampaignId, setSelectedCampaignId] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<'pix' | 'card'>('pix');
  const [isCopied, setIsCopied] = useState(false);
  const [pixGenerated, setPixGenerated] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const predefinedAmounts = [
    { value: 50, label: 'R$ 50', impact: 'Plano Essencial • Suplementação vitamínica' },
    { value: 100, label: 'R$ 100', impact: 'Nutrição Plena • Refeições terapêuticas diárias', badge: 'Mais Escolhido' },
    { value: 150, label: 'R$ 150', impact: 'Transformador • Tratamento clínico intensivo' },
    { value: 250, label: 'R$ 250', impact: 'Guardião da Esperança • Resgate nutricional completo' },
  ];

  const currentAmount = customAmount ? parseFloat(customAmount.replace(/\./g, '').replace(',', '.')) || 0 : selectedAmount;

  // Pix oficial da YAH Hope
  const pixKey = 'contato@yahhope.com';
  const pixCopyPaste = `00020126580014br.gov.bcb.pix0114${pixKey}520400005303986540${currentAmount.toFixed(2)}5802BR5908YAH HOPE6009SAO PAULO62070503***6304`;

  const handleCopyPix = () => {
    navigator.clipboard.writeText(pixKey);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2500);
  };

  const handleProceedPayment = async () => {
    if (currentAmount < 5) {
      alert('Por favor, selecione ou digite um valor mínimo de R$ 5,00.');
      return;
    }

    setIsSubmitting(true);

    try {
      if (paymentMethod === 'card') {
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
        if (supabaseUrl) {
          const baseUrl = supabaseUrl.replace(/\/$/, '');
          const response = await fetch(`${baseUrl}/functions/v1/create-checkout`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
            },
            body: JSON.stringify({
              campaignId: selectedCampaignId || null,
              amount: currentAmount,
              isMonthly: frequency === 'monthly',
              paymentMethod: 'card',
              donorName: user?.name || 'Mantenedor YAH Hope',
              donorEmail: user?.email || 'mantenedor@yahhope.com',
              successUrl: `${window.location.origin}/portal/donations?status=success&amount=${currentAmount}`,
              cancelUrl: `${window.location.origin}/portal/donations?status=cancel`
            })
          });

          const data = await response.json();
          if (data.url) {
            window.location.href = data.url;
            return;
          }
        }
      }

      // Se for doação mensal, atualiza e substitui o valor do apoio geral ativo
      if (frequency === 'monthly') {
        await sponsorshipService.updateGeneralMonthlySupport(
          user?.id,
          user?.email || 'mantenedor@yahhope.org',
          currentAmount,
          paymentMethod,
          user?.name || 'Mantenedor YAH Hope'
        );
        fetchCommitments();
      }

      // Registro da doação Pix
      await createDonation({
        donor_name: user?.name || 'Mantenedor YAH Hope',
        donor_email: user?.email || 'mantenedor@yahhope.com',
        amount: currentAmount,
        payment_method: paymentMethod === 'pix' ? 'pix' : 'cartao',
        campaign_id: selectedCampaignId || undefined
      });
      setPixGenerated(true);
    } catch (e) {
      console.error(e);
      setPixGenerated(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header com Abas */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200/80 pb-6">
        <div>
          <span className="text-xs font-gotham-bold text-[#F49853] uppercase tracking-widest block mb-1">
            Aliança de Transformação
          </span>
          <h2 className="text-3xl sm:text-4xl font-heading font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <Heart className="text-[#F49853]" size={32} fill="currentColor" /> 
            Central de Doações
          </h2>
          <p className="text-sm text-slate-500 font-gotham-light mt-1">
            Abençoe vidas na Casa Nutri com Pix instantâneo, cartão ou acompanhe seu histórico de contribuições.
          </p>
        </div>

        {/* Alternador de Abas */}
        <div className="flex bg-slate-200/70 p-1 rounded-2xl shrink-0 self-start md:self-auto">
          <button
            onClick={() => setActiveTab('donate')}
            className={`px-5 py-2.5 rounded-xl text-xs font-gotham-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'donate'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Heart size={14} fill={activeTab === 'donate' ? 'currentColor' : 'none'} className="text-[#F49853]" />
            <span>Fazer Doação</span>
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-5 py-2.5 rounded-xl text-xs font-gotham-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'history'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Receipt size={14} className="text-slate-600" />
            <span>Histórico de Doações</span>
          </button>
        </div>
      </div>

      {activeTab === 'history' ? (
        <PortalMyDonations />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* COLUNA ESQUERDA (7 cols): Formulário Principal de Doação */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Card de Apoio Mensal Ativo com Ações de Alteração e Cancelamento */}
            {monthlyCommitments?.generalMonthlySupport?.active && (
              <div className="bg-gradient-to-r from-orange-50 via-amber-50 to-orange-50 border border-orange-200/90 rounded-3xl p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-white border border-orange-200 flex items-center justify-center text-[#F49853] shadow-xs shrink-0">
                    <RefreshCw size={22} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-gotham-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                        Apoio Mensal Ativo
                      </span>
                      <span className="text-[11px] text-slate-500 font-gotham-medium">
                        Regra de Substituição
                      </span>
                    </div>
                    <h4 className="text-xl font-heading font-black text-slate-900 mt-0.5">
                      R$ {monthlyCommitments.generalMonthlySupport.monthlyAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}/mês
                    </h4>
                    <p className="text-xs text-slate-500 font-gotham-light">
                      Fundo Geral Casa Nutri • Ao alterar, o novo valor substitui o anterior.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={() => setIsManageModalOpen(true)}
                    className="flex-1 sm:flex-initial px-4 py-2.5 bg-[#F49853] hover:bg-[#e0853d] text-white font-gotham-bold text-xs uppercase tracking-wider rounded-xl shadow-xs transition-all cursor-pointer"
                  >
                    Alterar / Aumentar
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsManageModalOpen(true)}
                    className="px-3.5 py-2.5 bg-white hover:bg-rose-50 text-slate-600 hover:text-rose-600 border border-slate-200 rounded-xl text-xs font-gotham-medium transition-all cursor-pointer"
                    title="Cancelar apoio mensal"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            )}

            {/* Seletor Recorrência vs Pontual */}
            <div className="bg-white p-2 rounded-2xl border border-slate-200/80 shadow-xs flex">
              <button
                onClick={() => setFrequency('monthly')}
                className={`flex-1 py-3 rounded-xl text-xs font-gotham-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  frequency === 'monthly'
                    ? 'bg-[#F49853] text-white shadow-md'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <RefreshCw size={14} />
                <span>Doação Mensal (Recorrente)</span>
              </button>
              <button
                onClick={() => setFrequency('single')}
                className={`flex-1 py-3 rounded-xl text-xs font-gotham-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  frequency === 'single'
                    ? 'bg-slate-900 text-white shadow-md'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <DollarSign size={14} />
                <span>Doação Única (Pontual)</span>
              </button>
            </div>

            {!pixGenerated ? (
              /* Formulário de Seleção */
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm space-y-6">
                
                {/* Seleção de Valor */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-xs font-gotham-bold uppercase tracking-wider text-slate-500">
                      Escolha o Valor da Contribuição
                    </label>
                    <span className="text-xs text-[#F49853] font-gotham-bold">
                      {frequency === 'monthly' ? 'Cobrança Mensal' : 'Contribuição Pontual'}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                          className={`p-4 rounded-2xl border text-left transition-all relative cursor-pointer ${
                            isSelected
                              ? 'border-[#F49853] bg-orange-50/50 ring-2 ring-[#F49853]/30 shadow-xs'
                              : 'border-slate-200/80 bg-white hover:border-slate-300 hover:bg-slate-50/50'
                          }`}
                        >
                          {amt.badge && (
                            <span className="absolute -top-2 right-3 bg-[#F49853] text-white text-[9px] font-black uppercase px-2 py-0.5 rounded-full shadow-xs">
                              {amt.badge}
                            </span>
                          )}
                          <div className="flex items-baseline gap-1">
                            <span className="text-xl font-heading font-black text-slate-900">
                              {amt.label}
                            </span>
                            <span className="text-xs text-slate-400 font-gotham-medium">
                              {frequency === 'monthly' ? '/mês' : ''}
                            </span>
                          </div>
                          <span className="text-xs text-slate-500 font-gotham-light block mt-1 leading-snug">
                            {amt.impact}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Outro Valor */}
                  <div className="mt-3">
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-black text-slate-400">
                        R$
                      </span>
                      <input
                        type="text"
                        placeholder="Outro valor personalizado (Ex: 300,00)"
                        value={customAmount}
                        onChange={(e) => setCustomAmount(e.target.value)}
                        className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#F49853]/20 focus:border-[#F49853] transition-all"
                      />
                    </div>
                  </div>
                </div>

                {/* Seleção de Destino / Campanha */}
                {campaigns.length > 0 && (
                  <div>
                    <label className="block text-xs font-gotham-bold uppercase tracking-wider text-slate-500 mb-2">
                      Destinar para Campanha da Régua (Opcional)
                    </label>
                    <select
                      value={selectedCampaignId}
                      onChange={(e) => setSelectedCampaignId(e.target.value)}
                      className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#F49853]/20 focus:border-[#F49853] transition-all"
                    >
                      <option value="">Fundo Geral YAH Hope • Casa Nutri (Maior Necessidade)</option>
                      {campaigns.map((camp) => (
                        <option key={camp.id} value={camp.id}>
                          {camp.title} (Meta: R$ {camp.target_amount.toLocaleString('pt-BR')})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Método de Pagamento */}
                <div>
                  <label className="block text-xs font-gotham-bold uppercase tracking-wider text-slate-500 mb-2">
                    Forma de Pagamento
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('pix')}
                      className={`p-3.5 rounded-2xl border flex items-center justify-center gap-2 font-gotham-bold text-xs transition-all cursor-pointer ${
                        paymentMethod === 'pix'
                          ? 'border-[#F49853] bg-orange-50 text-[#F49853] ring-2 ring-[#F49853]/20'
                          : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <QrCode size={18} />
                      <span>PIX Instantâneo</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('card')}
                      className={`p-3.5 rounded-2xl border flex items-center justify-center gap-2 font-gotham-bold text-xs transition-all cursor-pointer ${
                        paymentMethod === 'card'
                          ? 'border-[#F49853] bg-orange-50 text-[#F49853] ring-2 ring-[#F49853]/20'
                          : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <CreditCard size={18} />
                      <span>Cartão de Crédito</span>
                    </button>
                  </div>
                  {paymentMethod === 'card' && frequency === 'monthly' && (
                    <div className="mt-2.5 p-3 bg-blue-50/70 border border-blue-200/70 rounded-xl text-[11px] text-blue-900 font-gotham-light flex items-center gap-2">
                      <ShieldCheck size={15} className="text-blue-600 shrink-0" />
                      <span><strong>Cobrança mensal avulsa:</strong> O valor é cobrado a cada 30 dias sem comprometer ou bloquear o limite total do seu cartão de crédito.</span>
                    </div>
                  )}
                </div>

                {/* Botão de Ação */}
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={handleProceedPayment}
                    disabled={isSubmitting || currentAmount <= 0}
                    className="w-full py-4 bg-[#F49853] hover:bg-[#e0853d] text-white font-gotham-bold text-sm uppercase tracking-wider rounded-2xl shadow-lg shadow-orange-500/20 flex items-center justify-center gap-2.5 transition-all cursor-pointer disabled:opacity-60"
                  >
                    {paymentMethod === 'pix' ? <QrCode size={18} /> : <CreditCard size={18} />}
                    <span>
                      {paymentMethod === 'pix' 
                        ? `Gerar PIX de R$ ${currentAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` 
                        : `Pagar R$ ${currentAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} no Cartão`}
                    </span>
                    <ArrowRight size={16} />
                  </button>
                </div>

                <div className="flex items-center justify-center gap-2 text-xs text-slate-400 font-gotham-light">
                  <ShieldCheck size={16} className="text-emerald-500" />
                  <span>Ambiente protegido com criptografia de 256 bits</span>
                </div>
              </div>
            ) : (
              /* Tela do PIX Gerado */
              <div className="bg-white rounded-3xl p-8 border border-emerald-200 shadow-xl text-center space-y-6 animate-fade-in">
                <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                  <CheckCircle2 size={36} />
                </div>

                <div>
                  <span className="text-xs font-gotham-bold uppercase tracking-wider text-emerald-600 block mb-1">
                    PIX Gerado com Sucesso
                  </span>
                  <h3 className="text-3xl font-heading font-black text-slate-900">
                    R$ {currentAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 font-gotham-light">
                    {frequency === 'monthly' ? 'Compromisso Mensal Recorrente' : 'Doação Única Pontual'}
                  </p>
                </div>

                {/* QR Code */}
                <div className="p-5 bg-slate-50 rounded-3xl border border-slate-200 inline-block mx-auto shadow-inner">
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(pixCopyPaste)}`}
                    alt="QR Code Pix"
                    className="w-48 h-48 mx-auto rounded-xl"
                  />
                </div>

                {/* Chave Pix Copia e Cola */}
                <div className="space-y-2 text-left max-w-md mx-auto">
                  <label className="text-xs font-gotham-bold uppercase tracking-wider text-slate-500 block">
                    Chave PIX Oficial (E-mail):
                  </label>
                  <div className="flex items-center gap-2 p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
                    <span className="text-xs font-mono font-bold text-slate-800 flex-1 truncate">
                      {pixKey}
                    </span>
                    <button
                      onClick={handleCopyPix}
                      className="px-4 py-2 bg-[#F49853] hover:bg-[#e0853d] text-white text-xs font-gotham-bold rounded-xl transition-all flex items-center gap-1.5 shrink-0 cursor-pointer shadow-xs"
                    >
                      {isCopied ? (
                        <>
                          <Check size={14} /> Copiado!
                        </>
                      ) : (
                        <>
                          <Copy size={14} /> Copiar Chave
                        </>
                      )}
                    </button>
                  </div>
                </div>

                <div className="pt-2 flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
                  <button
                    onClick={() => setActiveTab('history')}
                    className="flex-1 py-3.5 bg-slate-900 hover:bg-slate-800 text-white font-gotham-bold text-xs rounded-xl transition-all cursor-pointer"
                  >
                    Ver no Histórico
                  </button>
                  <button
                    onClick={() => setPixGenerated(false)}
                    className="flex-1 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-gotham-bold text-xs rounded-xl transition-all cursor-pointer"
                  >
                    Fazer Outra Doação
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* COLUNA DIREITA (5 cols): Impacto, Régua e Transparência */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* Card Campanha da Régua Ativa */}
            {currentCampaign && (
              <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-3xl p-6 sm:p-7 shadow-xl space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-gotham-bold uppercase tracking-widest text-[#F49853] bg-orange-500/10 px-3 py-1 rounded-full border border-orange-500/20">
                    Régua de Arrecadação
                  </span>
                  <span className="text-xs font-gotham-bold text-emerald-400 flex items-center gap-1">
                    <TrendingUp size={14} /> {currentActiveStage ? `Fase ${currentActiveStage.stageNumber}` : 'Em Andamento'}
                  </span>
                </div>

                <h3 className="text-lg font-heading font-black text-white leading-snug">
                  {currentCampaign.title}
                </h3>
                <p className="text-xs text-slate-300 font-gotham-light line-clamp-2">
                  {currentCampaign.description}
                </p>

                {/* Barra de Progresso Real da Fase */}
                <div className="space-y-1.5 pt-1">
                  <div className="flex justify-between text-xs font-gotham-bold">
                    <span className="text-slate-400">Progresso da Fase</span>
                    <span className="text-[#F49853]">
                      {currentStageProgress}%
                    </span>
                  </div>
                  <div className="h-2.5 bg-white/10 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-amber-400 via-[#F49853] to-orange-500 rounded-full transition-all duration-500"
                      style={{ width: `${currentStageProgress}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[11px] text-slate-400 font-gotham-medium pt-0.5">
                    <span>R$ {currentStageRaised.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                    <span className="text-slate-300 font-gotham-bold">Alvo da Fase: R$ {currentStageTarget.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                  </div>
                </div>

                {/* Visão Consolidada da Régua Global */}
                <div className="bg-white/[0.03] p-3 rounded-2xl border border-white/5 space-y-1.5">
                  <div className="flex justify-between items-center text-[10px]">
                    <span className="text-slate-400 font-gotham-medium">Total Geral Arrecadado:</span>
                    <span className="text-white font-gotham-bold">
                      R$ {totalRulerRaised.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} / R$ {totalRulerGoal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} ({rulerOverallPercentage}%)
                    </span>
                  </div>
                  <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-emerald-400 rounded-full transition-all duration-500"
                      style={{ width: `${rulerOverallPercentage}%` }}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Garantias de Transparência da YAH Hope */}
            <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-xs space-y-4">
              <h4 className="text-sm font-heading font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <Building2 size={16} className="text-[#F49853]" />
                Compromissos do Mantenedor
              </h4>

              <div className="space-y-3.5 text-xs text-slate-600 font-gotham-light">
                <div className="flex items-start gap-3">
                  <CheckCircle2 size={16} className="text-emerald-600 shrink-0 mt-0.5" />
                  <p><strong>100% Destinado:</strong> Todo recurso apoia diretamente alimentação terapêutica, consultas e insumos da Casa Nutri.</p>
                </div>
                <div className="flex items-start gap-3">
                  <FileText size={16} className="text-emerald-600 shrink-0 mt-0.5" />
                  <p><strong>Transparência & Prestação de Contas:</strong> Acompanhe no portal relatórios periódicos de prestação de contas e a evolução dos atendimentos da Casa Nutri.</p>
                </div>
                <div className="flex items-start gap-3">
                  <Lock size={16} className="text-emerald-600 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p><strong>Sem Burocracia:</strong> Pause, altere ou cancele seu apoio mensal a qualquer momento pelo portal.</p>
                    <button
                      type="button"
                      onClick={() => setIsManageModalOpen(true)}
                      className="text-[#F49853] hover:text-[#e0853d] font-gotham-bold text-[11px] underline mt-1 block cursor-pointer"
                    >
                      Gerenciar meu apoio mensal →
                    </button>
                  </div>
                </div>
              </div>
            </div>

          </div>

        </div>
      )}

      {/* Modal de Gestão do Apoio Mensal */}
      <ManageMonthlyPlanModal
        isOpen={isManageModalOpen}
        onClose={() => setIsManageModalOpen(false)}
        currentAmount={monthlyCommitments?.generalMonthlySupport?.monthlyAmount || 100}
        isActive={Boolean(monthlyCommitments?.generalMonthlySupport?.active)}
        onSuccess={() => fetchCommitments()}
      />
    </div>
  );
}
