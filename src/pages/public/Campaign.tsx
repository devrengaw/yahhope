import React, { useState, useMemo } from 'react';
import { Heart, Target, ChevronRight, CheckCircle2, TrendingUp, DollarSign, Calendar, Sparkles } from 'lucide-react';
import { useFundraising } from '../../contexts/FundraisingContext';
import { cn } from '../../lib/utils';
import { Link, useSearchParams } from 'react-router-dom';
import { SEO } from '../../components/common/SEO';

const QUOTAS = [
  { amount: 50, label: 'Alimenta uma criança', icon: Heart },
  { amount: 120, label: 'Apadrinhamento mensal', icon: Target },
  { amount: 300, label: 'Cesta básica + Suplementos', icon: TrendingUp },
];

const FALLBACK_CAMPAIGN: Campaign = {
  id: '1',
  title: 'Campanha de Nutrição Infantil',
  description: 'Ajude-nos a combater a desnutrição infantil e transformar vidas.',
  target_amount: 20000,
  current_amount: 0,
  type: 'monthly',
  is_active: true,
  milestones: []
};

export function Campaign() {
  const [searchParams, setSearchParams] = useSearchParams();
  const urlCampaignId = searchParams.get('id') || searchParams.get('campaign');

  const { 
    campaigns = [], 
    activeCampaign, 
    campaign: defaultCamp, 
    createDonation, 
    currentMonthName,
    calculateCampaignProgress 
  } = useFundraising();

  // Lista de campanhas ativas
  const availableCampaigns = useMemo(() => {
    const list = campaigns || [];
    const active = list.filter(c => c && c.is_active !== false);
    if (active.length > 0) return active;
    if (list.length > 0) return list;
    if (defaultCamp) return [defaultCamp];
    return [FALLBACK_CAMPAIGN];
  }, [campaigns, defaultCamp]);

  const [selectedCampaignId, setSelectedCampaignId] = useState<string>(() => {
    if (urlCampaignId) {
      const found = campaigns?.find(c => c && c.id === urlCampaignId);
      if (found) return found.id;
    }
    return activeCampaign?.id || defaultCamp?.id || campaigns?.[0]?.id || FALLBACK_CAMPAIGN.id;
  });

  React.useEffect(() => {
    if (urlCampaignId && availableCampaigns.some(c => c && c.id === urlCampaignId)) {
      setSelectedCampaignId(urlCampaignId);
    }
  }, [urlCampaignId, availableCampaigns]);

  // Campanha selecionada atualmente
  const currentCampaign = useMemo(() => {
    return availableCampaigns.find(c => c && c.id === selectedCampaignId) || availableCampaigns[0] || defaultCamp || FALLBACK_CAMPAIGN;
  }, [availableCampaigns, selectedCampaignId, defaultCamp]);

  const handleSelectCampaign = (campId: string) => {
    setSelectedCampaignId(campId);
    setSearchParams({ id: campId }, { replace: true });
    
    setTimeout(() => {
      const el = document.getElementById(`campaign-card-${campId}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }, 50);
  };

  const stats = useMemo(() => {
    return calculateCampaignProgress(currentCampaign);
  }, [calculateCampaignProgress, currentCampaign]);

  const [selectedAmount, setSelectedAmount] = useState<number>(50);
  const [customAmount, setCustomAmount] = useState<string>('');
  const [isCustom, setIsCustom] = useState(false);
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'pix' | 'credit_card'>('pix');
  const [isMonthly, setIsMonthly] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleCustomAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '');
    if (!value) {
      setCustomAmount('');
      return;
    }

    const numericValue = parseInt(value, 10) / 100;
    const formatted = numericValue.toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
    setCustomAmount(formatted);
  };

  React.useEffect(() => {
    if (currentCampaign.accept_pix === false && currentCampaign.accept_card !== false) {
      setPaymentMethod('credit_card');
    } else if (currentCampaign.accept_card === false && currentCampaign.accept_pix !== false) {
      setPaymentMethod('pix');
    }
  }, [currentCampaign.accept_pix, currentCampaign.accept_card]);

  const handleDonate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    let finalAmount = selectedAmount;
    if (isCustom) {
      const numericString = customAmount.replace(/\./g, '').replace(',', '.');
      finalAmount = parseFloat(numericString);
    }

    if (!finalAmount || isNaN(finalAmount)) return;

    setIsLoading(true);

    try {
      if (paymentMethod === 'pix') {
        createDonation({
          campaign_id: currentCampaign.id,
          donor_name: name,
          donor_email: email,
          amount: finalAmount,
          payment_method: paymentMethod
        });

        setTimeout(() => {
          setIsLoading(false);
          setIsSubmitted(true);
        }, 1500);
      } else {
        // Pagamento por Cartão (Stripe)
        if (!import.meta.env.VITE_SUPABASE_URL) {
          setTimeout(() => {
            setIsLoading(false);
            alert('Integração com Cartão de Crédito (Stripe) em modo de demonstração.\nA doação será registrada como pendente.');
            createDonation({
              campaign_id: currentCampaign.id,
              donor_name: name,
              donor_email: email,
              amount: finalAmount,
              payment_method: paymentMethod
            });
            setIsSubmitted(true);
          }, 1500);
          return;
        }

        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
        const baseUrl = supabaseUrl.replace(/\/$/, '');
        const response = await fetch(`${baseUrl}/functions/v1/create-checkout`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
          },
          body: JSON.stringify({
            campaignId: currentCampaign.id,
            amount: finalAmount,
            isMonthly,
            donorName: name,
            donorEmail: email,
            successUrl: `${window.location.origin}/campanha?id=${currentCampaign.id}&status=success`,
            cancelUrl: `${window.location.origin}/campanha?id=${currentCampaign.id}&status=cancel`
          })
        });

        const data = await response.json();
        if (data.url) {
          window.location.href = data.url;
        } else {
          console.error('Error starting checkout:', data);
          alert('Erro ao iniciar o pagamento. Tente via PIX ou verifique a conexão.');
          setIsLoading(false);
        }
      }
    } catch (error: any) {
      console.error('Donation error:', error);
      alert(`Erro ao processar a doação: ${error.message || 'Falha na rede'}.`);
      setIsLoading(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 text-center shadow-xl border border-emerald-100">
          <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 size={40} />
          </div>
          <h2 className="text-2xl font-black text-slate-900 mb-2">Obrigado pela sua doação!</h2>
          <p className="text-slate-500 mb-8">
            Seu apoio à campanha <strong>{currentCampaign.title}</strong> transforma vidas e restaura a esperança.
          </p>
          <Link to="/" className="inline-block bg-slate-900 text-white font-bold px-6 py-3 rounded-xl hover:bg-slate-800 transition-colors">
            Voltar ao Início
          </Link>
        </div>
      </div>
    );
  }

  const renderDonationForm = (camp: Campaign) => (
    <div className="flex flex-col h-full justify-between">
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-black text-slate-900">Escolha o valor</h3>
          <span className="text-xs font-bold text-slate-400">Doação segura</span>
        </div>
        
        <div className="space-y-3 mb-6">
          {QUOTAS.map((q) => (
            <button
              key={q.amount}
              type="button"
              onClick={() => { setIsCustom(false); setSelectedAmount(q.amount); }}
              className={cn(
                "w-full flex items-center justify-between p-3.5 rounded-2xl border-2 transition-all cursor-pointer",
                !isCustom && selectedAmount === q.amount 
                  ? "border-emerald-500 bg-emerald-50/50 shadow-xs" 
                  : "border-slate-200 bg-white hover:border-emerald-200"
              )}
            >
              <div className="flex items-center gap-3">
                <div className={cn(
                  "w-9 h-9 rounded-full flex items-center justify-center",
                  !isCustom && selectedAmount === q.amount ? "bg-emerald-500 text-white" : "bg-slate-100 text-slate-500"
                )}>
                  <q.icon size={18} />
                </div>
                <div className="text-left">
                  <p className={cn("font-black text-lg", !isCustom && selectedAmount === q.amount ? "text-emerald-900" : "text-slate-900")}>
                    R$ {q.amount}
                  </p>
                  <p className="text-xs text-slate-400 font-medium">{q.label}</p>
                </div>
              </div>
              <div className={cn(
                "w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0",
                !isCustom && selectedAmount === q.amount ? "border-emerald-500" : "border-slate-300"
              )}>
                {!isCustom && selectedAmount === q.amount && <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full" />}
              </div>
            </button>
          ))}

          <button
            type="button"
            onClick={() => setIsCustom(true)}
            className={cn(
              "w-full flex items-center justify-between p-3.5 rounded-2xl border-2 transition-all cursor-pointer",
              isCustom 
                ? "border-emerald-500 bg-emerald-50/50 shadow-xs" 
                : "border-slate-200 bg-white hover:border-emerald-200"
            )}
          >
            <div className="flex items-center gap-3 w-full">
              <div className={cn(
                "w-9 h-9 rounded-full flex items-center justify-center shrink-0",
                isCustom ? "bg-emerald-500 text-white" : "bg-slate-100 text-slate-500"
              )}>
                <DollarSign size={18} />
              </div>
              <div className="text-left w-full">
                <p className={cn("font-black text-lg", isCustom ? "text-emerald-900" : "text-slate-900")}>
                  Outro Valor
                </p>
                {isCustom && (
                  <div className="mt-2 relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-bold text-sm">R$</span>
                    <input 
                      type="text"
                      inputMode="numeric"
                      value={customAmount}
                      onChange={handleCustomAmountChange}
                      placeholder="0,00"
                      className="w-full pl-10 pr-4 py-2 rounded-xl border border-emerald-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white text-base font-black text-slate-900"
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>
                )}
              </div>
            </div>
            <div className={cn(
              "w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ml-2",
              isCustom ? "border-emerald-500" : "border-slate-300"
            )}>
              {isCustom && <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full" />}
            </div>
          </button>
        </div>

        <form onSubmit={handleDonate} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Nome Completo</label>
            <input 
              type="text" 
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-emerald-500 text-sm font-medium bg-white"
              placeholder="Seu nome"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">E-mail</label>
            <input 
              type="email" 
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-emerald-500 text-sm font-medium bg-white"
              placeholder="seu@email.com"
            />
          </div>

          {(camp.accept_pix !== false || camp.accept_card !== false) && (
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Forma de Pagamento</label>
              <div className="flex gap-3">
                {camp.accept_pix !== false && (
                  <label className="flex-1 cursor-pointer">
                    <input 
                      type="radio" 
                      name={`payment-${camp.id}`} 
                      value="pix" 
                      checked={paymentMethod === 'pix'} 
                      onChange={() => setPaymentMethod('pix')}
                      className="peer sr-only" 
                    />
                    <div className="p-2.5 text-center border border-slate-200 rounded-xl font-bold text-xs text-slate-600 peer-checked:bg-emerald-500 peer-checked:text-white peer-checked:border-emerald-500 transition-colors shadow-xs">
                      PIX ou Boleto
                    </div>
                  </label>
                )}
                {camp.accept_card !== false && (
                  <label className="flex-1 cursor-pointer">
                    <input 
                      type="radio" 
                      name={`payment-${camp.id}`} 
                      value="credit_card" 
                      checked={paymentMethod === 'credit_card'} 
                      onChange={() => setPaymentMethod('credit_card')}
                      className="peer sr-only" 
                    />
                    <div className="p-2.5 text-center border border-slate-200 rounded-xl font-bold text-xs text-slate-600 peer-checked:bg-emerald-500 peer-checked:text-white peer-checked:border-emerald-500 transition-colors shadow-xs">
                      Cartão de Crédito
                    </div>
                  </label>
                )}
              </div>
            </div>
          )}

          <div className="flex items-center gap-3 pt-1">
            <button
              type="button"
              onClick={() => setIsMonthly(!isMonthly)}
              className={cn(
                "w-5 h-5 rounded flex items-center justify-center border-2 transition-colors cursor-pointer",
                isMonthly ? "bg-emerald-500 border-emerald-500 text-white" : "border-slate-300"
              )}
            >
              {isMonthly && <CheckCircle2 size={14} />}
            </button>
            <div className="text-xs">
              <span className="font-bold text-slate-700">Tornar essa doação mensal recorrente</span>
              <p className="text-slate-400 text-[11px]">Contribua todos os meses com essa causa</p>
            </div>
          </div>

          <button 
            type="submit"
            disabled={isLoading}
            className="w-full bg-slate-900 hover:bg-emerald-600 disabled:opacity-70 text-white font-black text-base py-3.5 rounded-xl flex items-center justify-center gap-2 transition-all mt-4 shadow-lg shadow-slate-900/10 cursor-pointer"
          >
            {isLoading ? (
              <span className="animate-pulse">Processando...</span>
            ) : (
              <>
                Doar R$ {isCustom ? (customAmount || '0') : selectedAmount} {isMonthly && '/ mês'}
                <ChevronRight size={18} />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <SEO 
        title={`${currentCampaign.title} | Faça sua Doação - YAH Hope`}
        description={currentCampaign.description || "Doe para as ações humanitárias da YAH Hope. Sua contribuição combate a desnutrição infantil e financia projetos sociais."}
        keywords="doação humanitária, doar para ONG, combate à desnutrição, doação Moçambique, apadrinhar criança YAH Hope"
        canonical={`https://yahhope.org/campanha?id=${currentCampaign.id}`}
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "DonateAction",
          "name": currentCampaign.title,
          "description": currentCampaign.description || "Contribua com a campanha solidária da YAH Hope.",
          "recipient": {
            "@type": "NGO",
            "name": "YAH Hope",
            "url": "https://yahhope.org"
          }
        }}
      />

      {/* Hero Section */}
      <div 
        className="w-full pt-32 pb-48 px-4 relative overflow-hidden flex items-end justify-center min-h-[500px]"
        style={{
          backgroundImage: `url('https://static.wixstatic.com/media/bd919d_bed3073991f74b9ebe78f14e8b11c13c~mv2.jpg/v1/fill/w_3000,h_1175,fp_0.50_0.49,q_90,enc_avif,quality_auto/IMG_6252.jpg')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      >
        <div className="absolute inset-0 bg-black/25" />
        <h1 
          className="relative z-10 text-white font-black uppercase tracking-[0.1em] translate-y-8 text-center" 
          style={{ 
            fontSize: 'clamp(2.5rem, 8vw, 8rem)',
            transform: 'scaleX(1.08)',
            textShadow: '0 4px 20px rgba(0,0,0,0.6)'
          }}
        >
          {availableCampaigns.length > 1 ? 'Campanhas Solidárias' : (currentCampaign.type === 'specific' ? currentCampaign.title : 'Participe')}
        </h1>
      </div>

      {/* Main Content: 2 Colunas */}
      <div className="max-w-7xl mx-auto px-4 -mt-24 relative z-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Coluna Esquerda (lg:col-span-7): Campanhas uma embaixo da outra */}
          <div className="lg:col-span-7 space-y-6">
            {availableCampaigns.map((camp, index) => {
              const isSelected = camp.id === currentCampaign.id;
              const campStats = calculateCampaignProgress(camp);

              if (isSelected) {
                return (
                  <div 
                    key={camp.id}
                    id={`campaign-card-${camp.id}`}
                    onClick={() => handleSelectCampaign(camp.id)}
                    className="bg-white rounded-3xl shadow-xl border-2 border-emerald-500 ring-4 ring-emerald-500/10 p-6 md:p-8 transition-all duration-300 relative overflow-hidden"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                      <div className="flex items-center gap-2">
                        {campStats.isMonthly ? (
                          <span className="bg-blue-100 text-blue-800 text-xs font-black px-3 py-1 rounded-full flex items-center gap-1.5">
                            <Calendar size={12} /> Meta do Mês • {currentMonthName}
                          </span>
                        ) : (
                          <span className="bg-purple-100 text-purple-800 text-xs font-black px-3 py-1 rounded-full flex items-center gap-1.5">
                            <Target size={12} /> Campanha Especial
                          </span>
                        )}
                        <span className="bg-emerald-100 text-emerald-800 text-xs font-black px-3 py-1 rounded-full uppercase tracking-wider flex items-center gap-1">
                          <Sparkles size={12} /> Selecionada
                        </span>
                      </div>

                      <span className="text-xs font-bold text-slate-400">
                        #{index + 1}
                      </span>
                    </div>

                    <h2 className="text-2xl md:text-3xl font-black text-slate-900 mb-2">
                      {camp.title}
                    </h2>

                    {camp.description && (
                      <p className="text-sm text-slate-600 mb-6 leading-relaxed">
                        {camp.description}
                      </p>
                    )}

                    {/* Régua de Arrecadação Crescida / Expandida */}
                    <div className="bg-emerald-50/40 rounded-2xl p-5 border border-emerald-100">
                      <div className="flex justify-between items-end mb-4">
                        <div>
                          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">
                            {campStats.isMonthly ? 'Arrecadado no Mês' : 'Total Arrecadado'}
                          </p>
                          <p className="text-3xl md:text-4xl font-black text-emerald-600">
                            {campStats.percentage}%
                          </p>
                          <p className="text-xs text-slate-500 font-bold mt-0.5">
                            R$ {campStats.currentAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">
                            Objetivo
                          </p>
                          <p className="text-xl md:text-2xl font-black text-slate-900">
                            R$ {campStats.targetAmount.toLocaleString('pt-BR')}
                          </p>
                        </div>
                      </div>

                      {/* Barra de Progresso Crescida com Milestones */}
                      <div className="relative pt-6 pb-2">
                        <div className="h-6 bg-slate-200/80 rounded-full overflow-hidden relative z-10 shadow-inner ring-1 ring-slate-300/60">
                          <div 
                            className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full transition-all duration-1000 ease-out relative"
                            style={{ width: `${campStats.percentage}%` }}
                          >
                            <div className="absolute inset-0 bg-white/30 w-full animate-[shimmer_2s_infinite]" />
                          </div>
                        </div>

                        {/* Marcadores de Milestones */}
                        {camp.milestones?.map((m) => {
                          const percent = Math.min((m.target_amount / campStats.targetAmount) * 100, 100);
                          const isReached = campStats.currentAmount >= m.target_amount;
                          return (
                            <div 
                              key={m.id} 
                              className="absolute top-0 flex flex-col items-center -ml-3.5"
                              style={{ left: `${percent}%` }}
                            >
                              <div className={cn(
                                "w-7 h-7 rounded-full border-4 border-white shadow-md flex items-center justify-center z-20 relative transition-transform hover:scale-125",
                                isReached ? "bg-emerald-500 text-white" : "bg-slate-300 text-transparent"
                              )}>
                                {isReached && <CheckCircle2 size={13} />}
                              </div>
                              <div className="absolute top-12 w-24 text-center">
                                <p className={cn("text-[10px] font-black uppercase tracking-tight", isReached ? "text-emerald-700" : "text-slate-400")}>
                                  R$ {m.target_amount >= 1000 ? `${m.target_amount / 1000}k` : m.target_amount}
                                </p>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Lista de Marcos da Régua se existirem */}
                      {camp.milestones && camp.milestones.length > 0 && (
                        <div className="mt-8 pt-4 border-t border-emerald-100/80 space-y-3">
                          <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">
                            Estágios da meta:
                          </h4>
                          <div className="space-y-2">
                            {camp.milestones.map((m, idx) => {
                              const isReached = campStats.currentAmount >= m.target_amount;
                              return (
                                <div key={m.id} className="flex items-start gap-2.5 text-xs">
                                  <div className={cn(
                                    "w-5 h-5 rounded-full flex items-center justify-center shrink-0 font-black text-[10px] mt-0.5",
                                    isReached ? "bg-emerald-500 text-white" : "bg-slate-200 text-slate-500"
                                  )}>
                                    {isReached ? <CheckCircle2 size={12} /> : idx + 1}
                                  </div>
                                  <div>
                                    <span className={cn("font-bold", isReached ? "text-emerald-950 font-black" : "text-slate-700")}>
                                      {m.title}
                                    </span>
                                    <span className="text-slate-400 font-semibold ml-1.5">
                                      (R$ {m.target_amount.toLocaleString('pt-BR')})
                                    </span>
                                    {m.description && <p className="text-[11px] text-slate-500 mt-0.5">{m.description}</p>}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              }

              // Card Não Selecionado (embaixo da selecionada)
              return (
                <div 
                  key={camp.id}
                  id={`campaign-card-${camp.id}`}
                  onClick={() => handleSelectCampaign(camp.id)}
                  className="bg-white rounded-3xl shadow-sm hover:shadow-xl border-2 border-slate-200/80 hover:border-emerald-300 transition-all duration-300 p-6 md:p-7 cursor-pointer group"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                    <div className="flex items-center gap-2">
                      {campStats.isMonthly ? (
                        <span className="bg-blue-50 text-blue-700 text-xs font-black px-3 py-1 rounded-full flex items-center gap-1.5 border border-blue-100">
                          <Calendar size={12} /> Meta do Mês • {currentMonthName}
                        </span>
                      ) : (
                        <span className="bg-purple-50 text-purple-700 text-xs font-black px-3 py-1 rounded-full flex items-center gap-1.5 border border-purple-100">
                          <Target size={12} /> Campanha Especial
                        </span>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSelectCampaign(camp.id);
                      }}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-100 group-hover:bg-emerald-600 text-slate-700 group-hover:text-white font-bold text-xs uppercase tracking-wider transition-colors shrink-0 self-start sm:self-auto cursor-pointer"
                    >
                      <span>Apoiar esta</span>
                      <ChevronRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
                    </button>
                  </div>

                  <h3 className="text-xl md:text-2xl font-black text-slate-900 group-hover:text-emerald-700 transition-colors mb-2">
                    {camp.title}
                  </h3>

                  {camp.description && (
                    <p className="text-sm text-slate-500 line-clamp-2 mb-4 leading-relaxed">
                      {camp.description}
                    </p>
                  )}

                  {/* Régua de Arrecadação Compacta da Campanha */}
                  <div className="bg-slate-50/80 rounded-2xl p-4 border border-slate-100 group-hover:border-emerald-100 transition-colors">
                    <div className="flex justify-between items-center mb-2.5 text-xs">
                      <div className="flex items-baseline gap-2">
                        <span className="font-black text-lg text-emerald-600">{campStats.percentage}%</span>
                        <span className="text-slate-500 font-bold">
                          R$ {campStats.currentAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} arrecadados
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-slate-400 font-medium">Meta: </span>
                        <span className="font-black text-slate-800">R$ {campStats.targetAmount.toLocaleString('pt-BR')}</span>
                      </div>
                    </div>

                    {/* Barra de Progresso Compacta */}
                    <div className="h-3.5 bg-slate-200/80 rounded-full overflow-hidden relative">
                      <div 
                        className="h-full bg-emerald-500 rounded-full transition-all duration-700 ease-out"
                        style={{ width: `${campStats.percentage}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Coluna Direita (lg:col-span-5): Caixa Fixa "Faça sua contribuição" */}
          <div className="lg:col-span-5 lg:sticky lg:top-24">
            <div className="bg-white rounded-3xl shadow-xl border border-slate-100 p-6 md:p-8">
              <h2 className="text-xl md:text-2xl font-black text-slate-900 mb-4">Faça sua contribuição</h2>
              
              {/* Identificação Clara da Campanha Clicada */}
              <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200/80 rounded-2xl p-4 mb-6">
                <div className="flex items-center gap-1.5 text-emerald-800 text-xs font-black uppercase tracking-wider mb-1">
                  <Sparkles size={14} className="text-emerald-600" />
                  Você está apoiando:
                </div>
                <h3 className="font-black text-slate-900 text-lg leading-snug">
                  {currentCampaign.title}
                </h3>
                <p className="text-xs text-slate-500 mt-1 font-medium">
                  {currentCampaign.description 
                    ? (currentCampaign.description.length > 90 ? `${currentCampaign.description.substring(0, 90)}...` : currentCampaign.description)
                    : 'Sua doação será destinada diretamente a este projeto.'}
                </p>
              </div>

              {renderDonationForm(currentCampaign)}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
