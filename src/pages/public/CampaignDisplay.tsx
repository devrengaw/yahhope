import React, { useMemo, useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useFundraising } from '../../contexts/FundraisingContext';
import { cn } from '../../lib/utils';
import { CheckCircle2, Calendar, Target, Sparkles, ChevronLeft, ChevronRight, Layers } from 'lucide-react';

export function CampaignDisplay() {
  const [searchParams] = useSearchParams();
  const urlCampaignId = searchParams.get('id') || searchParams.get('campaign');

  const { 
    campaigns = [], 
    activeCampaign, 
    campaign: defaultCamp,
    currentMonthName,
    calculateCampaignProgress 
  } = useFundraising();

  // Lista de todas as campanhas ativas ordenadas por prioridade
  const activeCampaigns = useMemo(() => {
    const list = (campaigns || []).filter(c => c && c.is_active !== false);
    if (list.length > 0) {
      return [...list].sort((a, b) => (a.priority ?? 0) - (b.priority ?? 0));
    }
    if (activeCampaign) return [activeCampaign];
    if (defaultCamp) return [defaultCamp];
    return [];
  }, [campaigns, activeCampaign, defaultCamp]);

  // Índice da campanha sendo exibida no slide
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);

  // Inicializa índice se houver ID na URL
  useEffect(() => {
    if (urlCampaignId && activeCampaigns.length > 0) {
      const idx = activeCampaigns.findIndex(c => c.id === urlCampaignId);
      if (idx !== -1) setCurrentSlideIndex(idx);
    }
  }, [urlCampaignId, activeCampaigns]);

  // Rotaciona automaticamente o slider a cada 8 segundos
  useEffect(() => {
    if (activeCampaigns.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentSlideIndex(prev => (prev + 1) % activeCampaigns.length);
    }, 8000);
    return () => clearInterval(interval);
  }, [activeCampaigns.length]);

  // Campanha em destaque no slide atual
  const currentSlide = activeCampaigns[currentSlideIndex] || activeCampaigns[0] || defaultCamp;
  const slideStats = useMemo(() => {
    return calculateCampaignProgress(currentSlide);
  }, [calculateCampaignProgress, currentSlide]);

  // Métricas acumuladas de todas as campanhas ativas
  const totalGoal = useMemo(() => {
    return activeCampaigns.reduce((sum, c) => sum + (c.target_amount || 0), 0);
  }, [activeCampaigns]);

  const totalRaised = useMemo(() => {
    return activeCampaigns.reduce((sum, c) => {
      const stats = calculateCampaignProgress(c);
      return sum + stats.currentAmount;
    }, 0);
  }, [activeCampaigns, calculateCampaignProgress]);

  const overallPercentage = totalGoal > 0 
    ? Math.min(Math.round((totalRaised / totalGoal) * 100), 100) 
    : 0;

  // Marcos cumulativos por campanha em ordem de prioridade na régua geral
  const cumulativeMilestones = useMemo(() => {
    let runningTarget = 0;
    return activeCampaigns.map((camp, idx) => {
      const prevTarget = runningTarget;
      runningTarget += (camp.target_amount || 0);
      const threshold = runningTarget;
      const positionPercent = totalGoal > 0 ? Math.min((threshold / totalGoal) * 100, 100) : 0;
      const isReached = totalRaised >= threshold;
      const isCurrent = !isReached && totalRaised >= prevTarget;

      return {
        campaign: camp,
        index: idx,
        prevTarget,
        threshold,
        positionPercent,
        isReached,
        isCurrent
      };
    });
  }, [activeCampaigns, totalGoal, totalRaised]);

  // URL para a qual o QR Code apontará: SEMPRE a página geral de campanhas!
  const donationUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/campanha`
    : `https://yahhope.com/campanha`;
  
  // QR Code limpo e de alta leitura
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(donationUrl)}&color=000000&bgcolor=ffffff`;

  const prevSlide = () => {
    setCurrentSlideIndex(prev => (prev === 0 ? activeCampaigns.length - 1 : prev - 1));
  };

  const nextSlide = () => {
    setCurrentSlideIndex(prev => (prev + 1) % activeCampaigns.length);
  };

  return (
    <div 
      className="min-h-screen w-full flex flex-col items-center justify-between py-6 md:py-8 px-4 md:px-8 relative overflow-x-hidden bg-brand-green"
      style={{
        backgroundImage: `url('https://static.wixstatic.com/media/bd919d_bed3073991f74b9ebe78f14e8b11c13c~mv2.jpg/v1/fill/w_3000,h_1175,fp_0.50_0.49,q_90,enc_avif,quality_auto/IMG_6252.jpg')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      }}
    >
      {/* Background Elements */}
      <div className="absolute inset-0 opacity-25 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-emerald-400 via-transparent to-transparent z-0" />

      {/* Header Topo */}
      <div className="w-full max-w-7xl mx-auto z-10 flex flex-col items-center justify-center flex-shrink-0 mt-2 mb-4 md:mb-6">
        <h1 className="font-heading text-4xl md:text-5xl lg:text-6xl font-black text-white tracking-tight drop-shadow-2xl text-center uppercase tracking-[0.1em] transform scale-x-105">
          Participe
        </h1>
      </div>

      {/* Grid Principal: Slide + Barra Geral e QR Code */}
      <div className="w-full max-w-7xl mx-auto z-10 grid grid-cols-1 lg:grid-cols-3 gap-6 items-center flex-grow py-2">
        
        {/* Painel Esquerdo: Slider das Campanhas + Barra de Arrecadação Cumulativa */}
        <div className="lg:col-span-2 h-full flex flex-col justify-between bg-slate-950/80 backdrop-blur-2xl p-6 md:p-8 lg:p-10 rounded-[2rem] lg:rounded-[2.5rem] border border-white/10 shadow-2xl">
          
          {/* Topo do Painel: Slide da Campanha Atual */}
          <div>
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <div className="flex items-center gap-2">
                {slideStats.isMonthly ? (
                  <span className="bg-blue-500/25 text-blue-200 border border-blue-400/40 text-xs font-black px-3 py-1 rounded-full flex items-center gap-1.5 uppercase tracking-wider">
                    <Calendar size={13} /> Meta do Mês • {currentMonthName}
                  </span>
                ) : (
                  <span className="bg-purple-500/25 text-purple-200 border border-purple-400/40 text-xs font-black px-3 py-1 rounded-full flex items-center gap-1.5 uppercase tracking-wider">
                    <Target size={13} /> Campanha Especial
                  </span>
                )}

                <span className="bg-emerald-500/20 text-emerald-200 border border-emerald-400/30 text-xs font-black px-2.5 py-1 rounded-full uppercase tracking-wider flex items-center gap-1">
                  <Sparkles size={12} className="text-amber-400" />
                  Prioridade #{currentSlide.priority ?? (currentSlideIndex + 1)}
                </span>
              </div>

              {/* Controles de Slide */}
              {activeCampaigns.length > 1 && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={prevSlide}
                    className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
                    title="Campanha anterior"
                  >
                    <ChevronLeft size={16} />
                  </button>

                  <div className="flex items-center gap-1.5 px-2">
                    {activeCampaigns.map((_, idx) => (
                      <button
                        key={idx}
                        onClick={() => setCurrentSlideIndex(idx)}
                        className={cn(
                          "h-2 rounded-full transition-all cursor-pointer",
                          idx === currentSlideIndex 
                            ? "w-6 bg-amber-400" 
                            : "w-2 bg-white/30 hover:bg-white/60"
                        )}
                        title={`Ir para campanha ${idx + 1}`}
                      />
                    ))}
                  </div>

                  <button
                    onClick={nextSlide}
                    className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
                    title="Próxima campanha"
                  >
                    <ChevronRight size={16} />
                  </button>

                  <span className="text-xs font-black text-emerald-200/80 ml-1">
                    {currentSlideIndex + 1}/{activeCampaigns.length}
                  </span>
                </div>
              )}
            </div>

            {/* Informações da Campanha Atual no Slide */}
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-heading font-black text-white mb-3 drop-shadow-md tracking-wide line-clamp-2">
              {currentSlide.title}
            </h2>

            {currentSlide.description && (
              <p className="text-sm md:text-base text-emerald-100/90 font-medium leading-relaxed line-clamp-3 mb-4">
                {currentSlide.description}
              </p>
            )}

            {/* Mini barra da campanha individual em exibição no slide */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-3.5 mb-6">
              <div className="flex justify-between items-center text-xs mb-1.5">
                <span className="text-emerald-200/90 font-bold">
                  Evolução desta campanha individual:
                </span>
                <span className="text-white font-black">
                  R$ {slideStats.currentAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} de R$ {slideStats.targetAmount.toLocaleString('pt-BR')} ({slideStats.percentage}%)
                </span>
              </div>
              <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-emerald-400 rounded-full transition-all duration-700"
                  style={{ width: `${slideStats.percentage}%` }}
                />
              </div>
            </div>
          </div>

          {/* Base do Painel: A Barra de Arrecadação Geral Cumulativa */}
          <div className="pt-4 border-t border-white/10">
            <div className="flex justify-between items-end mb-3 text-white">
              <div>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl md:text-5xl font-black text-amber-400 drop-shadow-lg">
                    {overallPercentage}%
                  </span>
                  <span className="text-emerald-200/90 text-sm md:text-base font-bold">
                    (R$ {totalRaised.toLocaleString('pt-BR', { minimumFractionDigits: 2 })})
                  </span>
                </div>
              </div>
              
              <div className="text-right">
                <p className="text-emerald-200/80 uppercase tracking-widest font-bold text-xs md:text-sm mb-1">
                  Meta Geral Unificada
                </p>
                <p className="text-2xl md:text-3xl font-black text-white">
                  R$ {totalGoal.toLocaleString('pt-BR')}
                </p>
                <p className="text-[11px] text-emerald-300/80 font-medium">
                  {activeCampaigns.length} {activeCampaigns.length === 1 ? 'campanha ativa' : 'campanhas ativas'}
                </p>
              </div>
            </div>

            {/* Barra Cumulativa Gigante com Marcadores das Campanhas */}
            <div className="relative pt-6 pb-20">
              <div className="h-9 bg-black/40 rounded-full overflow-hidden relative z-10 backdrop-blur-md border border-white/15 shadow-inner">
                <div 
                  className="h-full bg-gradient-to-r from-emerald-500 via-teal-400 to-amber-400 rounded-full transition-all duration-1000 ease-out relative"
                  style={{ width: `${overallPercentage}%` }}
                >
                  <div className="absolute inset-0 bg-white/20 w-full animate-[shimmer_2s_infinite]" />
                </div>
              </div>

              {/* Marcadores de Cada Campanha ao longo da barra em ordem de prioridade */}
              {cumulativeMilestones.map((m) => {
                const isCurrentSlide = m.campaign.id === currentSlide.id;
                const isAlternate = m.index % 2 === 1;

                return (
                  <div 
                    key={m.campaign.id} 
                    className="absolute top-4 flex flex-col items-center -ml-4 cursor-pointer group"
                    style={{ left: `${m.positionPercent}%` }}
                    onClick={() => setCurrentSlideIndex(m.index)}
                  >
                    <div className={cn(
                      "w-8 h-8 rounded-full border-4 shadow-xl flex items-center justify-center z-20 transition-all group-hover:scale-125",
                      m.isReached 
                        ? "bg-emerald-400 border-white text-emerald-950 scale-110" 
                        : m.isCurrent
                          ? "bg-amber-400 border-white text-amber-950 animate-pulse scale-110"
                          : "bg-slate-800 border-slate-600 text-slate-300",
                      isCurrentSlide && "ring-4 ring-amber-400/60"
                    )}>
                      {m.isReached ? (
                        <CheckCircle2 size={16} />
                      ) : (
                        <span className="text-[11px] font-black">#{m.index + 1}</span>
                      )}
                    </div>

                    <div className={cn(
                      "absolute w-28 text-center drop-shadow-md pointer-events-none transition-all",
                      isAlternate ? "top-14" : "top-11"
                    )}>
                      <p className={cn(
                        "text-xs font-black uppercase tracking-tight truncate", 
                        m.isReached 
                          ? "text-emerald-300 font-bold" 
                          : m.isCurrent
                            ? "text-amber-300 font-black"
                            : "text-slate-400"
                      )}>
                        {m.campaign.title}
                      </p>
                      <p className={cn("text-[10px] font-bold mt-0.5", m.isReached ? "text-white" : "text-slate-400")}>
                        R$ {m.threshold >= 1000 ? `${(m.threshold / 1000).toFixed(m.threshold % 1000 !== 0 ? 1 : 0)}k` : m.threshold}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

        {/* Painel Direito: QR Code que leva para a Página Geral de Campanhas */}
        <div className="bg-slate-950/80 backdrop-blur-2xl border border-white/10 rounded-[2rem] lg:rounded-[2.5rem] p-6 md:p-8 text-center shadow-2xl flex flex-col items-center justify-center transform lg:scale-105 relative z-20 self-stretch mt-4 lg:mt-0">
          <div className="absolute -top-5 bg-brand-orange text-white font-black uppercase tracking-widest px-6 py-1.5 rounded-full shadow-lg text-sm flex items-center gap-1.5">
            <Sparkles size={14} /> Apoie Agora
          </div>
          
          <h2 className="text-2xl font-black text-white mb-1 mt-3">Escaneie para Doar</h2>
          <p className="text-emerald-100/90 mb-6 text-sm font-medium px-4">
            Aponte a câmera do celular para escolher uma das campanhas no site e transformar vidas.
          </p>
          
          <div className="bg-white p-4 rounded-3xl shadow-inner border-4 border-white/20">
            <img 
              src={qrCodeUrl} 
              alt="QR Code para Página de Doação" 
              className="w-48 h-48 sm:w-56 sm:h-56 rounded-2xl"
              crossOrigin="anonymous"
            />
          </div>

          <div className="mt-4">
            <p className="text-amber-300 font-mono text-xs font-black tracking-wider uppercase">
              yahhope.com/campanha
            </p>
            <p className="text-emerald-200/60 text-[11px] mt-1 uppercase font-bold tracking-widest">
              PIX • Cartão de Crédito
            </p>
          </div>
        </div>

      </div>

      {/* Logo Inferior */}
      <div className="w-full z-10 flex justify-center flex-shrink-0 mt-6 md:mt-4">
        <img src="/Logo+icone.png" alt="YAH Hope" className="h-14 md:h-20 lg:h-24 object-contain drop-shadow-2xl" />
      </div>
    </div>
  );
}
