import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Heart, 
  ArrowRight, 
  ChevronLeft, 
  ChevronRight, 
  X, 
  Search, 
  Menu, 
  ShieldCheck, 
  CheckCircle2, 
  Users, 
  GraduationCap, 
  Sparkles,
  Instagram,
  Facebook,
  Youtube,
  Linkedin,
  Clock,
  MapPin,
  ChevronDown,
  Target,
  TrendingUp,
  CreditCard,
  Lock,
  Loader2
} from 'lucide-react';
import { useHomeHighlights, HomeHighlightItem } from '../../contexts/HomeHighlightsContext';
import { useWebsiteProjects } from '../../contexts/WebsiteProjectsContext';
import { useImpactMetrics } from '../../contexts/ImpactMetricsContext';
import { ImpactIcon } from '../../components/common/ImpactIcon';
import { SEO } from '../../components/common/SEO';
import { cn } from '../../lib/utils';

// Exact Quotas used for Stripe receipts in YAH Hope
const STRIPE_QUOTAS = [
  { amount: 50, label: 'Alimenta uma criança', icon: Heart },
  { amount: 120, label: 'Apadrinhamento mensal', icon: Target, isPopular: true },
  { amount: 300, label: 'Cesta básica + Suplementos', icon: TrendingUp },
];

export function Home() {
  const navigate = useNavigate();

  // Interactive UI States
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [donationFrequency, setDonationFrequency] = useState<'monthly' | 'single'>('monthly');
  const [selectedAmount, setSelectedAmount] = useState<number>(120);
  const [isCustom, setIsCustom] = useState(false);
  const [customAmount, setCustomAmount] = useState<string>('');
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  
  const [emailInput, setEmailInput] = useState('');
  const [emailSubmitted, setEmailSubmitted] = useState(false);
  const [readingHighlight, setReadingHighlight] = useState<HomeHighlightItem | null>(null);

  // Dynamic Carousel Cards managed via Admin Panel (/admin/home-highlights)
  const { highlights } = useHomeHighlights();
  const activeHighlights = highlights.filter(h => h.active !== false);
  const carouselItems = activeHighlights.length > 0 ? activeHighlights : highlights;

  // Dynamic Impact Metrics managed via Admin Panel (/admin/impact-metrics)
  const { activeMetrics: impactMetrics } = useImpactMetrics();

  // Dynamic Projects managed via /admin/local-projects and /projetos
  const { projects: websiteProjects } = useWebsiteProjects();

  // Carousel Navigation Handlers
  const handlePrevSlide = () => {
    if (carouselItems.length === 0) return;
    setCarouselIndex((prev) => (prev === 0 ? carouselItems.length - 1 : prev - 1));
  };

  const handleNextSlide = () => {
    if (carouselItems.length === 0) return;
    setCarouselIndex((prev) => (prev + 1) % carouselItems.length);
  };

  // Handle Stripe Checkout directly via Supabase Edge Function or fallback
  const handleStripeCheckout = async (e?: React.FormEvent, overrideAmount?: number) => {
    if (e) e.preventDefault();
    
    let finalVal = overrideAmount !== undefined 
      ? overrideAmount 
      : (isCustom && customAmount ? parseFloat(customAmount) : selectedAmount);

    if (!finalVal || isNaN(finalVal) || finalVal <= 0) {
      finalVal = 120;
    }

    setIsCheckingOut(true);

    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
      if (!supabaseUrl) {
        window.location.href = `/campanha?amount=${finalVal}&isMonthly=${donationFrequency === 'monthly'}&method=card`;
        return;
      }

      const baseUrl = supabaseUrl.replace(/\/$/, '');
      const response = await fetch(`${baseUrl}/functions/v1/create-checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify({
          amount: finalVal,
          isMonthly: donationFrequency === 'monthly',
          successUrl: `${window.location.origin}/campanha?status=success`,
          cancelUrl: `${window.location.origin}/?status=cancel`
        })
      });

      const data = await response.json();

      if (data.url) {
        window.location.href = data.url;
      } else {
        console.warn('Fallback to campaign page:', data);
        window.location.href = `/campanha?amount=${finalVal}&isMonthly=${donationFrequency === 'monthly'}&method=card`;
      }
    } catch (err) {
      console.error('Checkout error:', err);
      window.location.href = `/campanha?amount=${finalVal}&isMonthly=${donationFrequency === 'monthly'}&method=card`;
    } finally {
      setIsCheckingOut(false);
    }
  };

  // Handle newsletter subscription
  const handleNewsletter = (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput) return;
    setEmailSubmitted(true);
    setTimeout(() => {
      setEmailInput('');
    }, 4000);
  };

  return (
    <div className="bg-white min-h-screen font-gotham-regular text-slate-800 antialiased selection:bg-[#F49853] selection:text-white">
      <SEO 
        title="YAH Hope | Fé em Ação, Nutrição Infantil e Transformação Social"
        description="A YAH Hope é uma agência humanitária que combate a desnutrição infantil, garante acesso à água potável, saúde e educação em Moçambique e no Brasil. Conheça e apoie!"
        keywords="YAH Hope, ONG, ajuda humanitária, combate à desnutrição infantil, Moçambique, Nampula, apadrinhar criança, doação ONG, projetos sociais"
        canonical="https://yahhope.org/"
      />
      
      {/* Hero Home Block with YAH Hope Visual Identity & Floating Stripe Donation Card */}
      <section className="relative overflow-hidden bg-[#F49853] text-white pt-12 pb-36 lg:pt-16 lg:pb-48">
        {/* Photographic Background with YAH Hope Brand Orange Filter */}
        <div className="absolute inset-0 z-0">
          <img 
            src="/hero_bg.jpg" 
            alt="Comunidade e Acesso à Água - YAH Hope Moçambique" 
            className="w-full h-full object-cover object-center filter contrast-115 brightness-95"
          />
          {/* Official YAH Hope Orange Duotone & Gradient Filter */}
          <div className="absolute inset-0 bg-[#F49853] mix-blend-color opacity-90"></div>
          <div className="absolute inset-0 bg-gradient-to-r from-[#C2580E]/90 via-[#F49853]/80 to-[#F49853]/55"></div>
          <div className="absolute inset-0 bg-gradient-to-t from-[#A74404]/70 via-transparent to-black/20"></div>

          {/* Subtle brand pattern overlay */}
          <div 
            className="absolute inset-0 opacity-20 pointer-events-none"
            style={{ 
              backgroundImage: 'url("https://hope.yahchurch.com/wp-content/uploads/2025/09/Pattern-1.png")',
              backgroundRepeat: 'repeat',
              backgroundSize: '360px'
            }}
          />
        </div>

        {/* Concentric Animated Dashed Circles in Soft Amber / White (`circle-effect`) */}
        <div className="circle-effect" data-position="center">
          <div className="circle-effect-circle">
            <svg viewBox="0 0 1450 1450" className="w-full h-full">
              <circle cx="725" cy="725" r="720" fill="none" stroke="#FFFFFF" strokeWidth="1.5" strokeDasharray="4,10" opacity="0.35" />
            </svg>
          </div>
          <div className="circle-effect-circle">
            <svg viewBox="0 0 1450 1450" className="w-full h-full">
              <circle cx="725" cy="725" r="720" fill="none" stroke="#EBC878" strokeWidth="1.5" strokeDasharray="6,12" opacity="0.35" />
            </svg>
          </div>
          <div className="circle-effect-circle">
            <svg viewBox="0 0 1450 1450" className="w-full h-full">
              <circle cx="725" cy="725" r="720" fill="none" stroke="#FFFFFF" strokeWidth="1" strokeDasharray="3,8" opacity="0.25" />
            </svg>
          </div>
        </div>

        {/* Hero Content Container: 2 Columns */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
            
            {/* Left Column: Headline and Story */}
            <div className="lg:col-span-7 xl:col-span-7 text-left space-y-6">
              <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-heading font-black tracking-tight leading-[1.05] text-white drop-shadow-md">
                BEM-VINDO À <span className="block text-[#FFE8B3]">YAH HOPE</span>
              </h1>

              <p className="text-lg sm:text-xl md:text-2xl text-white/95 font-gotham-regular leading-relaxed max-w-xl drop-shadow-xs">
                Mais do que uma organização social; somos guardiões da dignidade humana, tecendo histórias de transformação e resiliência em comunidades esquecidas.
              </p>
            </div>

            {/* Right Column: Hero Donation Box with EXACT STRIPE BUTTONS (YAH Hope Branding) */}
            <div id="hero-donation-card" className="lg:col-span-5 xl:col-span-5 flex justify-center lg:justify-end">
              <div className="bg-white text-slate-800 rounded-3xl shadow-2xl p-6 sm:p-7 w-full max-w-sm sm:max-w-md border border-orange-100">
                
                {/* One-time vs Monthly Toggle */}
                <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1 rounded-2xl mb-4 text-xs font-gotham-bold">
                  <button
                    type="button"
                    onClick={() => setDonationFrequency('single')}
                    className={`py-2.5 rounded-xl transition-all ${
                      donationFrequency === 'single'
                        ? 'bg-white text-slate-900 shadow-sm border border-slate-200'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Doação Única
                  </button>
                  <button
                    type="button"
                    onClick={() => setDonationFrequency('monthly')}
                    className={`py-2.5 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                      donationFrequency === 'monthly'
                        ? 'bg-[#F49853] text-white shadow-md'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Heart size={12} fill="currentColor" />
                    <span>Mensal</span>
                  </button>
                </div>

                <p className="text-center text-xs text-slate-500 mb-3.5 font-gotham-regular">
                  Sua doação leva saúde e <strong className="font-gotham-bold text-[#F49853]">ESPERANÇA</strong>
                </p>

                {/* The EXACT STRIPE QUOTAS BUTTONS */}
                <div className="space-y-2 mb-3">
                  {STRIPE_QUOTAS.map((q) => {
                    const isSelected = !isCustom && selectedAmount === q.amount;
                    const IconComponent = q.icon;
                    return (
                      <button
                        key={q.amount}
                        type="button"
                        onClick={() => {
                          setIsCustom(false);
                          setSelectedAmount(q.amount);
                        }}
                        className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl border-2 transition-all ${
                          isSelected
                            ? 'border-[#F49853] bg-orange-50/70 text-[#F49853] shadow-xs ring-1 ring-[#F49853]'
                            : 'border-slate-200 bg-white hover:border-slate-300 text-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                            isSelected ? 'bg-[#F49853] text-white' : 'bg-slate-100 text-slate-500'
                          }`}>
                            <IconComponent size={15} />
                          </div>
                          <div className="text-left">
                            <span className="text-sm font-gotham-bold text-slate-900 block leading-tight">
                              R$ {q.amount}
                            </span>
                            <span className="text-[11px] text-slate-500 font-gotham-regular">
                              {q.label}
                            </span>
                          </div>
                        </div>

                        <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
                          isSelected ? 'border-[#F49853]' : 'border-slate-300'
                        }`}>
                          {isSelected && <div className="w-2 h-2 rounded-full bg-[#F49853]" />}
                        </div>
                      </button>
                    );
                  })}

                  {/* Outro Valor Button */}
                  <button
                    type="button"
                    onClick={() => setIsCustom(true)}
                    className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl border-2 transition-all ${
                      isCustom
                        ? 'border-[#F49853] bg-orange-50/70 text-[#F49853] shadow-xs ring-1 ring-[#F49853]'
                        : 'border-slate-200 bg-white hover:border-slate-300 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                        isCustom ? 'bg-[#F49853] text-white' : 'bg-slate-100 text-slate-500'
                      }`}>
                        <Sparkles size={15} />
                      </div>
                      <div className="text-left">
                        <span className="text-sm font-gotham-bold text-slate-900 block leading-tight">
                          Outro Valor
                        </span>
                        <span className="text-[11px] text-slate-500 font-gotham-regular">
                          Defina uma quantia personalizada
                        </span>
                      </div>
                    </div>

                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
                      isCustom ? 'border-[#F49853]' : 'border-slate-300'
                    }`}>
                      {isCustom && <div className="w-2 h-2 rounded-full bg-[#F49853]" />}
                    </div>
                  </button>
                </div>

                {/* Custom Amount Input Field when isCustom is selected */}
                {isCustom && (
                  <div className="relative mb-3 animate-fade-in">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 font-bold text-sm">
                      R$
                    </span>
                    <input 
                      type="number"
                      min="5"
                      step="1"
                      placeholder="0,00"
                      value={customAmount}
                      onChange={(e) => setCustomAmount(e.target.value)}
                      className="w-full pl-10 pr-14 py-2.5 rounded-xl border-2 border-[#F49853] focus:outline-hidden text-sm font-gotham-bold text-slate-800"
                      autoFocus
                    />
                    <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-gotham-bold text-xs">
                      BRL
                    </span>
                  </div>
                )}

                {/* YAH Hope Brand Orange Donation Button */}
                <button
                  onClick={handleStripeCheckout}
                  disabled={isCheckingOut}
                  className="w-full bg-[#F49853] hover:bg-[#e0853d] text-white py-3.5 rounded-2xl font-gotham-bold text-sm uppercase tracking-wider transition-all shadow-lg hover:shadow-[#F49853]/30 flex items-center justify-center gap-2 group disabled:opacity-80 active:scale-[0.99]"
                >
                  {isCheckingOut ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      <span>Conectando...</span>
                    </>
                  ) : (
                    <>
                      <CreditCard size={16} />
                      <span>DOAR</span>
                    </>
                  )}
                </button>

                {/* Security Badge */}
                <div className="mt-3 flex items-center justify-center text-[11px] text-slate-400 px-1 font-gotham-regular">
                  <div className="flex items-center gap-1.5">
                    <Lock size={12} className="text-emerald-600" />
                    <span>Pagamento Seguro SSL</span>
                  </div>
                </div>

              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 5. Smaller Overlapping Carousel in YAH Hope Visual Style */}
      <section className="-mt-24 sm:-mt-28 lg:-mt-36 relative z-30 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-16">
        <div className="relative">
          
          {/* Navigation Arrows on Left and Right of Carousel */}
          <button
            onClick={handlePrevSlide}
            className="absolute -left-3 sm:-left-5 top-1/2 -translate-y-1/2 z-30 w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-white/95 hover:bg-white text-[#F49853] shadow-xl border border-orange-100 flex items-center justify-center hover:scale-110 active:scale-95 transition-all"
            aria-label="Slide anterior"
          >
            <ChevronLeft size={20} />
          </button>
          <button
            onClick={handleNextSlide}
            className="absolute -right-3 sm:-right-5 top-1/2 -translate-y-1/2 z-30 w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-white/95 hover:bg-white text-[#F49853] shadow-xl border border-orange-100 flex items-center justify-center hover:scale-110 active:scale-95 transition-all"
            aria-label="Próximo slide"
          >
            <ChevronRight size={20} />
          </button>

          {/* Cards Row: Responsive Multi-Card Carousel */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6 font-gotham-regular">
            
            {/* Show active slice cards starting from carouselIndex */}
            {carouselItems.length > 0 && Array.from({ length: Math.min(carouselItems.length, 3) }, (_, i) => i).map((offset) => {
              const item = carouselItems[(carouselIndex + offset) % carouselItems.length];
              if (!item) return null;
              
              if (item.type === 'split') {
                return (
                  <Link
                    key={`${item.id}-${offset}`}
                    to={item.link}
                    onClick={(e) => {
                      if (item.content) {
                        e.preventDefault();
                        setReadingHighlight(item);
                      }
                    }}
                    className="bg-white rounded-2xl overflow-hidden shadow-2xl border border-orange-100 flex flex-col sm:flex-row h-72 sm:h-64 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl group cursor-pointer"
                  >
                    <div className="w-full sm:w-1/2 h-36 sm:h-full relative overflow-hidden bg-slate-900 shrink-0">
                      <img 
                        src={item.image} 
                        alt={item.title} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    </div>
                    <div className="w-full sm:w-1/2 p-4 sm:p-5 flex flex-col justify-between">
                      <div>
                        {/* YAH Hope Palette Accent Line */}
                        <div className="w-8 h-1 rounded-full mb-2" style={{ backgroundColor: item.color || '#F49853' }}></div>
                        <h3 className="font-heading font-bold text-slate-900 text-sm sm:text-base leading-snug line-clamp-3 group-hover:text-[#F49853] transition-colors">
                          {item.title}
                        </h3>
                        {item.snippet && (
                          <p className="text-xs text-slate-500 mt-2 font-gotham-light line-clamp-3 leading-relaxed">
                            {item.snippet}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-1 text-[11px] font-gotham-bold pt-2" style={{ color: item.color || '#F49853' }}>
                        <span>Ler história completa</span>
                        <ArrowRight size={12} className="group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>
                  </Link>
                );
              }

              // Photo Card with Overlay & Text
              return (
                <Link
                  key={`${item.id}-${offset}`}
                  to={item.link}
                  onClick={(e) => {
                    if (item.content) {
                      e.preventDefault();
                      setReadingHighlight(item);
                    }
                  }}
                  className="relative rounded-2xl overflow-hidden shadow-2xl h-72 sm:h-64 flex flex-col justify-end p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl group border border-orange-100/40 cursor-pointer"
                >
                  <img 
                    src={item.image} 
                    alt={item.title} 
                    className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent"></div>
                  
                  <div className="relative z-10 text-white">
                    {/* YAH Hope Palette Accent Line */}
                    <div className="w-8 h-1 rounded-full mb-2" style={{ backgroundColor: item.color || '#F49853' }}></div>
                    <h3 className="font-heading font-bold text-sm sm:text-base leading-snug text-white group-hover:text-orange-200 transition-colors line-clamp-3">
                      {item.title}
                    </h3>
                    <div className="flex items-center justify-between text-[11px] font-gotham-bold mt-2" style={{ color: item.color || '#EBC878' }}>
                      <div className="flex items-center gap-1.5">
                        <span>{item.category}</span>
                        <span className="text-white/40">•</span>
                        <span>{item.location}</span>
                      </div>
                      <span className="text-white/70 group-hover:text-white flex items-center gap-0.5 transition-colors">
                        Ler mais <ArrowRight size={10} />
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}

          </div>

          {/* Dots Indicator */}
          <div className="flex justify-center items-center gap-2 mt-6">
            {carouselItems.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCarouselIndex(idx)}
                className={`h-2 rounded-full transition-all duration-300 ${
                  carouselIndex === idx ? 'w-6 bg-[#F49853]' : 'w-2 bg-slate-300 hover:bg-slate-400'
                }`}
                aria-label={`Slide ${idx + 1}`}
              />
            ))}
          </div>

        </div>
      </section>

      {/* 6. Impact Stats Block in YAH Hope Identity (`icongrid-block -stat`) */}
      <section className="py-20 bg-white relative overflow-hidden font-gotham-regular">
        {/* Subtle Decorative Concentric Dashed Radar Effect on the Right */}
        <div className="circle-effect" data-position="right">
          <div className="circle-effect-circle">
            <svg viewBox="0 0 1450 1450" className="w-full h-full">
              <circle cx="725" cy="725" r="720" fill="none" stroke="#F49853" strokeWidth="1.5" strokeDasharray="5,10" opacity="0.3" />
            </svg>
          </div>
          <div className="circle-effect-circle">
            <svg viewBox="0 0 1450 1450" className="w-full h-full">
              <circle cx="725" cy="725" r="720" fill="none" stroke="#F49853" strokeWidth="1.5" strokeDasharray="8,16" opacity="0.2" />
            </svg>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-[#F49853] font-gotham-bold uppercase tracking-widest text-xs block mb-2">
              Resultados Reais & Metas Alcançadas
            </span>
            <h2 className="text-3xl md:text-5xl font-heading font-black text-slate-900 tracking-tight">
              O impacto da sua solidariedade.
            </h2>
          </div>

          <div className={cn(
            "grid gap-8 lg:gap-12",
            impactMetrics.length === 1 && "grid-cols-1 max-w-md mx-auto",
            impactMetrics.length === 2 && "grid-cols-1 md:grid-cols-2 max-w-4xl mx-auto",
            impactMetrics.length >= 3 && "grid-cols-1 md:grid-cols-3"
          )}>
            {impactMetrics.map((item) => (
              <div 
                key={item.id}
                className="bg-[#FFFBF7] rounded-3xl p-8 border hover:shadow-xl transition-all duration-300 group"
                style={{ borderColor: `${item.color}35` }}
              >
                <div 
                  className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform"
                  style={{ 
                    backgroundColor: `${item.color}15`,
                    color: item.color 
                  }}
                >
                  <ImpactIcon name={item.icon} size={32} />
                </div>
                <h3 
                  className="text-4xl lg:text-5xl font-heading font-black mb-2"
                  style={{ color: item.color }}
                >
                  {item.metric}
                </h3>
                <h4 className="text-base font-gotham-bold text-slate-800 mb-3 leading-snug">
                  {item.subtitle}
                </h4>
                <p className="text-sm text-slate-600 font-gotham-light leading-relaxed">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 7. Featured Work Block (`featured-work-block`) */}
      <section className="py-20 md:py-28 bg-[#F8FAFC] border-t border-slate-200/60 font-gotham-regular">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
            <div>
              <span className="text-[#F49853] font-gotham-bold tracking-widest uppercase text-xs block mb-1">
                Frentes de Atuação
              </span>
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-heading font-black text-slate-900 leading-tight">
                Levando nossa dedicação onde ela é mais necessária.
              </h2>
            </div>
            <Link
              to="/projetos"
              className="inline-flex items-center gap-2 text-[#F49853] font-gotham-bold text-sm hover:text-[#e0853d] transition-colors shrink-0"
            >
              <span>Ver Todos os Projetos</span>
              <ArrowRight size={16} />
            </Link>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {websiteProjects.map((project) => (
              <Link 
                key={project.id}
                to={project.link || '/projetos'}
                className="group relative h-[380px] rounded-3xl overflow-hidden shadow-lg border border-slate-100 flex flex-col justify-end p-6 transition-all duration-500 hover:-translate-y-1.5 hover:shadow-2xl"
              >
                <img 
                  src={project.image_url} 
                  alt={project.title} 
                  className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://hope.yahchurch.com/wp-content/uploads/2025/09/HOPE-ALFACES.avif';
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent"></div>
                <div className="relative z-10 text-white">
                  <span 
                    className="inline-block text-white px-3 py-0.5 rounded-full font-gotham-bold text-[11px] uppercase tracking-wider mb-2 shadow-xs"
                    style={{ backgroundColor: project.tag_color || '#F49853' }}
                  >
                    {project.category || 'Projeto Local'}
                  </span>
                  <h3 className="text-xl font-heading font-bold mb-2 group-hover:text-orange-200 transition-colors">
                    {project.title}
                  </h3>
                  <p className="text-xs text-slate-200 font-gotham-light line-clamp-3">
                    {project.description}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* 8. Manifesto YAH Hope Section (`manifesto-block`) */}
      <section 
        className="py-20 md:py-28 text-white relative overflow-hidden"
        style={{ 
          backgroundColor: '#F49853', 
          backgroundImage: 'url("https://hope.yahchurch.com/wp-content/uploads/2025/09/Pattern-1.png")',
          backgroundRepeat: 'repeat',
          backgroundSize: 'contain',
          backgroundPosition: 'center'
        }}
      >
        <div className="absolute inset-0 bg-black/10 pointer-events-none"></div>

        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-center">
            
            {/* Left Column: MANI-FESTO Title */}
            <div className="lg:col-span-5 text-left">
              <h2 className="text-6xl sm:text-7xl md:text-8xl lg:text-8xl xl:text-9xl font-heading font-black text-white uppercase tracking-tight leading-[0.88] select-none drop-shadow-md">
                MANI-<br />FESTO
              </h2>
              <p className="text-2xl sm:text-3xl lg:text-4xl font-heading font-black text-slate-800 tracking-tight mt-3">
                YAH Hope
              </p>
            </div>

            {/* Right Column: Manifesto Copy (Justified) */}
            <div className="lg:col-span-7 text-left space-y-4">
              <h3 className="font-heading font-bold text-base sm:text-lg md:text-xl text-white leading-snug drop-shadow-xs">
                Como encontrar futuro em cenários que para muitos são impossíveis de serem mudados?
              </h3>

              <div className="space-y-3.5 text-xs sm:text-sm md:text-base font-gotham-regular text-white/95 text-justify leading-relaxed drop-shadow-xs">
                <p>
                  Na jornada da esperança, nasce a missão da YAH Hope. Somos mais do que uma organização social; somos guardiões da dignidade humana, tecendo histórias de transformação e resiliência em comunidades esquecidas.
                </p>
                <p>
                  Acreditamos no poder transformador da esperança. Plantamos sementes através de ações conectadas a nutrição, geração de renda, escolaridade e entre tantas outras que são essenciais para o desenvolvimento humano. E assim, cultivamos um futuro em que cada indivíduo possa crescer independentemente das adversidades.
                </p>
                <p>
                  Nosso compromisso com a dignidade vai além do presente. Adotamos uma abordagem sustentável em todas as nossas iniciativas, assegurando que o impacto positivo seja duradouro e capaz de transformar gerações futuras.
                </p>
                <p>
                  Trabalhamos para que cada pessoa não apenas sobreviva, mas viva com dignidade. Somos construtores de comunidades resilientes. Através de cada projeto executado juntamente com a população local, subimos um degrau na promoção da dignidade humana.
                </p>
                <p>
                  Junte-se a nós nessa jornada. A YAH Hope é mais do que uma organização; é um movimento, uma chama ardente que ilumina caminhos antes obscuros. Onde há esperança, há dignidade, e onde há dignidade, há a promessa de uma população mais forte e resplandecente.
                </p>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 9. Call to Action Block (`cta-block`) */}
      <section className="relative py-28 md:py-36 bg-[#0F172A] text-white overflow-hidden font-gotham-regular">
        <img 
          src="/login_bg_real.jpg" 
          alt="Comunidade YAH Hope" 
          className="absolute inset-0 w-full h-full object-cover object-center filter brightness-90 contrast-105"
        />
        {/* Warm Slate & Ambient Gradient overlay (replaces pitch black so the children's photo is clearly visible) */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0F172A]/85 via-[#0F172A]/45 to-[#0F172A]/80"></div>
        <div className="absolute inset-0 bg-gradient-to-r from-[#0F172A]/60 via-transparent to-[#0F172A]/60"></div>

        {/* Concentric Animated Dashed Circles */}
        <div className="circle-effect" data-position="center">
          <div className="circle-effect-circle">
            <svg viewBox="0 0 1450 1450" className="w-full h-full">
              <circle cx="725" cy="725" r="720" fill="none" stroke="#F49853" strokeWidth="1.5" strokeDasharray="4,8" opacity="0.4" />
            </svg>
          </div>
          <div className="circle-effect-circle">
            <svg viewBox="0 0 1450 1450" className="w-full h-full">
              <circle cx="725" cy="725" r="720" fill="none" stroke="#FFFFFF" strokeWidth="1.5" strokeDasharray="4,8" opacity="0.25" />
            </svg>
          </div>
        </div>

        <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
          <span className="text-[#F49853] font-gotham-bold text-xs uppercase tracking-widest block mb-3 drop-shadow-sm">
            O Valor de Cada Vida
          </span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-heading font-black mb-6 leading-tight drop-shadow-md">
            As pessoas estão no centro de tudo o que fazemos.
          </h2>
          <div className="space-y-4 text-slate-100 text-base md:text-lg font-gotham-light leading-relaxed mb-10 max-w-2xl mx-auto drop-shadow">
            <p>
              Nosso trabalho ultrapassa fronteiras e culturas. Cremos que todos merecem esperança, que a dignidade humana é um dom inestimável e que juntos podemos transformar o futuro de quem mais precisa.
            </p>
            <p>
              A esperança não chega sozinha — ela se manifesta quando você e eu decidimos agir.
            </p>
          </div>
          <div>
            <button
              onClick={() => setDonationModalOpen(true)}
              className="inline-flex items-center gap-3 bg-[#F49853] hover:bg-[#e0853d] text-white px-8 py-4 rounded-full font-gotham-bold text-base md:text-lg shadow-xl hover:scale-105 active:scale-95 transition-all"
            >
              <span>Seja um Agente de Esperança</span>
              <ArrowRight size={18} />
            </button>
          </div>
        </div>
      </section>

      {/* 10. Email Subscribe Section (`email-subscribe -footer`) */}
      <section className="py-16 bg-[#FFFBF7] border-t border-orange-100 font-gotham-regular">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-2xl sm:text-3xl font-heading font-black text-slate-900 mb-3">
            Receba as últimas notícias e relatórios de campo da YAH Hope
          </h2>
          <p className="text-slate-600 text-sm font-gotham-light mb-8 max-w-xl mx-auto">
            Acompanhe de perto as vidas que estão sendo salvas e veja relatórios fotográficos periódicos direto de Moçambique.
          </p>

          {emailSubmitted ? (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-2xl max-w-md mx-auto flex items-center justify-center gap-2 text-sm font-gotham-bold animate-fade-in">
              <CheckCircle2 size={18} className="text-emerald-600" />
              <span>Obrigado! Você receberá nossos informativos de campo.</span>
            </div>
          ) : (
            <form onSubmit={handleNewsletter} className="flex flex-col sm:flex-row gap-3 max-w-lg mx-auto">
              <input
                type="email"
                required
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                placeholder="Digite seu melhor e-mail..."
                className="flex-1 px-5 py-3.5 rounded-full border border-slate-300 focus:border-[#F49853] focus:outline-hidden text-sm bg-white text-slate-800 font-gotham-regular"
              />
              <button
                type="submit"
                className="bg-[#F49853] hover:bg-[#e0853d] text-white px-8 py-3.5 rounded-full font-gotham-bold text-sm tracking-wide transition-all shadow-md shrink-0 flex items-center justify-center gap-2 active:scale-95"
              >
                <span>Inscrever-se</span>
                <ArrowRight size={15} />
              </button>
            </form>
          )}
        </div>
      </section>



      {/* Dynamic Highlight Story Reading Modal */}
      {readingHighlight && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
          <div 
            className="fixed inset-0 bg-black/75 backdrop-blur-xs transition-opacity" 
            onClick={() => setReadingHighlight(null)} 
          />

          <div className="relative bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl z-10 border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header Image */}
            <div className="relative h-64 sm:h-72 w-full bg-slate-900 overflow-hidden rounded-t-3xl">
              <img 
                src={readingHighlight.image} 
                alt={readingHighlight.title} 
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
              
              <button 
                onClick={() => setReadingHighlight(null)}
                className="absolute top-4 right-4 p-2 rounded-full bg-black/50 hover:bg-black/80 text-white transition-colors z-10"
                aria-label="Fechar"
              >
                <X size={20} />
              </button>

              <div className="absolute bottom-5 left-6 right-6 text-white">
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <span 
                    className="text-[11px] font-gotham-bold uppercase tracking-wider px-3 py-1 rounded-full text-white shadow-sm"
                    style={{ backgroundColor: readingHighlight.color || '#F49853' }}
                  >
                    {readingHighlight.category}
                  </span>
                  <span className="text-xs text-white/80 font-gotham-regular">
                    • {readingHighlight.location}
                  </span>
                </div>
                <h2 className="text-xl sm:text-3xl font-heading font-black leading-tight text-white drop-shadow-sm">
                  {readingHighlight.title}
                </h2>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 sm:p-8 space-y-5 font-gotham-regular">
              {readingHighlight.snippet && (
                <div className="p-4 rounded-2xl bg-orange-50/70 border border-orange-100/80 text-slate-700 text-sm sm:text-base font-gotham-light leading-relaxed italic">
                  "{readingHighlight.snippet}"
                </div>
              )}

              <div className="text-slate-700 text-sm sm:text-base leading-relaxed space-y-4 whitespace-pre-line font-gotham-regular">
                {readingHighlight.content || readingHighlight.snippet}
              </div>

              {/* Action Buttons */}
              <div className="pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={() => {
                      setReadingHighlight(null);
                      const el = document.getElementById('hero-donation-card');
                      if (el) el.scrollIntoView({ behavior: 'smooth' });
                      else navigate('/campanha');
                    }}
                    className="w-full sm:w-auto bg-[#F49853] hover:bg-[#e0853d] text-white px-6 py-3 rounded-xl font-gotham-bold text-xs uppercase tracking-wider transition-all shadow-md shadow-orange-500/20 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Heart size={16} fill="currentColor" />
                    <span>Apoiar Esta Causa</span>
                  </button>

                  <Link
                    to={
                      readingHighlight.blogPostId
                        ? `/blog?post=${readingHighlight.blogPostId}`
                        : readingHighlight.link.startsWith('/blog')
                          ? readingHighlight.link
                          : `/blog?post=${readingHighlight.id}`
                    }
                    onClick={() => setReadingHighlight(null)}
                    className="w-full sm:w-auto text-xs font-gotham-bold text-slate-700 hover:text-slate-900 px-5 py-3 rounded-xl border border-slate-200 hover:bg-slate-100 text-center transition-colors flex items-center justify-center gap-1.5"
                  >
                    <span>Ver no Blog</span>
                    <ArrowRight size={13} />
                  </Link>
                </div>

                <button
                  type="button"
                  onClick={() => setReadingHighlight(null)}
                  className="w-full sm:w-auto px-5 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-gotham-bold text-xs transition-colors"
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
