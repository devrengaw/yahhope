import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { 
  Heart, 
  Users, 
  Sparkles, 
  ShieldCheck, 
  ArrowRight, 
  CheckCircle2, 
  MapPin, 
  MessageCircle, 
  Calendar, 
  Smile, 
  HandHeart, 
  Star, 
  Send, 
  Check, 
  Share2, 
  Phone, 
  Mail, 
  User, 
  Compass, 
  ChevronRight,
  ChevronDown
} from 'lucide-react';
import { SEO } from '../../components/common/SEO';
import { cn } from '../../lib/utils';
import { 
  recordCampaignClick, 
  submitCampaignLead, 
  getClientLocation, 
  detectTrafficSource,
  getCampaignVisitorId 
} from '../../services/campaignTrackingService';
import { trackPageView } from '../../services/analyticsService';
import { useDonationModal } from '../../contexts/DonationModalContext';
import { DonationModal } from '../../components/common/DonationModal';

export function CampaignHotsite() {
  const { openDonationModal } = useDonationModal();
  const formRef = useRef<HTMLDivElement>(null);

  // Estado do formulário de acolhimento
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    age_range: '25-34',
    city: '',
    state: '',
    interest_type: 'volunteer' as 'volunteer' | 'sponsor' | 'donor' | 'partner' | 'other',
    message: ''
  });

  const [loadingLocation, setLoadingLocation] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [selectedPillar, setSelectedPillar] = useState<'volunteer' | 'sponsor' | 'donor' | 'partner'>('volunteer');

  // Inicialização e rastreamento da visita
  useEffect(() => {
    // Registra a visualização no analytics geral e do hotsite
    trackPageView('/campanha-yahhope', 'Hotsite da Campanha - Faça Parte da YAH Hope');
    recordCampaignClick('Visualização do Hotsite', 'page_view', {
      source: detectTrafficSource(),
      referrer: document.referrer
    });

    // Detectar geolocalização do visitante para pré-preencher o formulário
    getClientLocation().then(geo => {
      setFormData(prev => ({
        ...prev,
        city: prev.city || geo.city,
        state: prev.state || geo.state || 'SP'
      }));
      setLoadingLocation(false);
    });
  }, []);

  const scrollToForm = (interest?: 'volunteer' | 'sponsor' | 'donor' | 'partner', buttonLabel?: string) => {
    if (interest) {
      setFormData(prev => ({ ...prev, interest_type: interest }));
      setSelectedPillar(interest);
    }
    if (buttonLabel) {
      recordCampaignClick(buttonLabel, 'click_cta', { target_interest: interest });
    }
    formRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handlePillarClick = (type: 'volunteer' | 'sponsor' | 'donor' | 'partner', label: string) => {
    setSelectedPillar(type);
    setFormData(prev => ({ ...prev, interest_type: type }));
    recordCampaignClick(`Pilar: ${label}`, 'click_pillar', { pillar: type });
  };

  const handleWhatsAppDirect = () => {
    recordCampaignClick('Botão WhatsApp Direto', 'click_whatsapp');
    const text = encodeURIComponent('Olá! Estive no hotsite da YAH Hope e gostaria de saber mais sobre como posso fazer parte do projeto.');
    window.open(`https://wa.me/5511999999999?text=${text}`, '_blank');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.phone.trim()) return;

    setSubmitting(true);
    try {
      await submitCampaignLead({
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        age_range: formData.age_range,
        city: formData.city.trim() || 'São Paulo',
        state: formData.state.trim() || 'SP',
        country: 'Brasil',
        interest_type: formData.interest_type,
        message: formData.message.trim()
      });
      setSubmitted(true);
    } catch (err) {
      console.error('Erro ao enviar formulário do hotsite:', err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FFFDF9] text-slate-800 antialiased selection:bg-[#F49853] selection:text-white">
      <SEO 
        title="Faça Parte da Nossa Família | YAH Hope" 
        description="Junte-se à YAH Hope e faça parte da transformação de vidas através da nutrição, cuidado e acolhimento humano."
      />

      {/* Topo / Barra de Acolhimento */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-amber-100/60 transition-all">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-20 flex items-center justify-between">
          <Link 
            to="/" 
            onClick={() => recordCampaignClick('Logo Header YAH Hope', 'click_nav')}
            className="flex items-center gap-3 group"
          >
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-[#F49853] to-[#ffb175] flex items-center justify-center text-white shadow-md shadow-[#F49853]/25 group-hover:scale-105 transition-transform">
              <Heart className="w-6 h-6 fill-white" />
            </div>
            <div>
              <div className="text-xl font-black tracking-tight text-slate-900 font-gotham-bold leading-none">
                YAH <span className="text-[#F49853]">HOPE</span>
              </div>
              <p className="text-[10px] font-semibold tracking-wider text-slate-400 uppercase mt-0.5">
                Nutrição & Esperança
              </p>
            </div>
          </Link>

          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                recordCampaignClick('Header: Quero Doar', 'click_cta');
                openDonationModal();
              }}
              className="hidden sm:inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition-all"
            >
              <Heart className="w-4 h-4 text-[#F49853]" />
              Fazer Doação
            </button>

            <button
              onClick={() => scrollToForm(undefined, 'Header: Fazer Parte')}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#F49853] hover:bg-[#e0843f] text-white text-xs sm:text-sm font-bold shadow-md shadow-[#F49853]/25 hover:shadow-lg transition-all active:scale-95"
            >
              <span>Fazer Parte</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Hero Acolhedor e Direto */}
      <section className="relative pt-12 pb-20 sm:pt-20 sm:pb-28 overflow-hidden">
        {/* Efeitos de luz suave e acolhimento */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-tr from-amber-200/25 to-[#92BF78]/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-10 right-10 w-72 h-72 bg-[#F49853]/10 rounded-full blur-2xl pointer-events-none" />

        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-50 border border-amber-200/80 text-amber-800 text-xs font-bold mb-6 shadow-sm animate-fade-in">
            <Sparkles className="w-3.5 h-3.5 text-[#F49853]" />
            <span>Existe um lugar especial reservado para você</span>
          </div>

          <h1 className="text-3xl sm:text-5xl md:text-6xl font-black text-slate-900 tracking-tight leading-[1.15] mb-6">
            Juntos, transformamos <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#F49853] via-amber-600 to-[#92BF78]">
              fome em futuro e esperança.
            </span>
          </h1>

          <p className="text-base sm:text-xl text-slate-600 max-w-2xl mx-auto font-medium leading-relaxed mb-10">
            Nenhuma criança deveria ver seu futuro comprometido pela falta de alimento. Na YAH Hope, cada vida importa. Venha somar seu coração ao nosso.
          </p>

          {/* Botões de Ação Imediata */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 max-w-md mx-auto">
            <button
              onClick={() => scrollToForm(undefined, 'Hero: Quero Fazer Parte Agora')}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-3 px-8 py-4 rounded-2xl bg-[#F49853] hover:bg-[#e0843f] text-white text-base font-bold shadow-lg shadow-[#F49853]/30 hover:shadow-xl transition-all active:scale-95 group"
            >
              <span>Quero Fazer Parte</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>

            <button
              onClick={handleWhatsAppDirect}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-6 py-4 rounded-2xl bg-white hover:bg-slate-50 text-slate-700 text-base font-bold border border-slate-200/80 shadow-sm transition-all"
            >
              <MessageCircle className="w-5 h-5 text-emerald-500" />
              <span>Falar no WhatsApp</span>
            </button>
          </div>

          {/* Mini Indicadores de Confiança */}
          <div className="mt-12 flex flex-wrap items-center justify-center gap-6 sm:gap-10 text-xs sm:text-sm font-semibold text-slate-500">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#92BF78]" />
              <span>Transparência total</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#92BF78]" />
              <span>Acompanhamento nutricional contínuo</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#92BF78]" />
              <span>Acolhimento humanizado</span>
            </div>
          </div>
        </div>
      </section>

      {/* 4 Formas Claras de Fazer Parte (Sem textos longos) */}
      <section className="py-16 sm:py-24 bg-white border-y border-slate-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="text-xs font-bold uppercase tracking-wider text-[#F49853]">Caminhos para Somar</span>
            <h2 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight mt-2">
              Como você deseja caminhar conosco?
            </h2>
            <p className="text-slate-500 text-sm sm:text-base mt-3">
              Não importa o tamanho da sua contribuição, cada gesto planta uma nova esperança.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Card 1: Voluntariado */}
            <div 
              onClick={() => handlePillarClick('volunteer', 'Card Voluntariado')}
              className={cn(
                "p-6 rounded-3xl border transition-all cursor-pointer flex flex-col justify-between relative group",
                selectedPillar === 'volunteer'
                  ? "bg-amber-50/50 border-[#F49853] ring-2 ring-[#F49853]/20 shadow-md"
                  : "bg-white border-slate-100 hover:border-amber-200 hover:shadow-lg"
              )}
            >
              <div>
                <div className="w-12 h-12 rounded-2xl bg-amber-100 text-[#F49853] flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                  <HandHeart className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">Ser Voluntário(a)</h3>
                <p className="text-slate-600 text-sm leading-relaxed">
                  Doe suas habilidades, carinho ou algumas horas do seu mês. Sua presença faz a diferença real no dia a dia das crianças.
                </p>
              </div>

              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  scrollToForm('volunteer', 'Card: Escolher Voluntariado');
                }}
                className="mt-6 inline-flex items-center gap-2 text-xs font-bold text-[#F49853] group-hover:translate-x-1 transition-all"
              >
                <span>Quero ser voluntário</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Card 2: Apadrinhamento */}
            <div 
              onClick={() => handlePillarClick('sponsor', 'Card Apadrinhamento')}
              className={cn(
                "p-6 rounded-3xl border transition-all cursor-pointer flex flex-col justify-between relative group",
                selectedPillar === 'sponsor'
                  ? "bg-emerald-50/50 border-[#92BF78] ring-2 ring-[#92BF78]/20 shadow-md"
                  : "bg-white border-slate-100 hover:border-emerald-200 hover:shadow-lg"
              )}
            >
              <div>
                <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                  <Heart className="w-6 h-6 fill-current" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">Apadrinhar uma Criança</h3>
                <p className="text-slate-600 text-sm leading-relaxed">
                  Garanta alimentação nutritiva diária, acompanhamento clínico e relatórios mensais do desenvolvimento do seu afilhado.
                </p>
              </div>

              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  scrollToForm('sponsor', 'Card: Escolher Apadrinhamento');
                }}
                className="mt-6 inline-flex items-center gap-2 text-xs font-bold text-emerald-600 group-hover:translate-x-1 transition-all"
              >
                <span>Quero apadrinhar</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Card 3: Doação Direta */}
            <div 
              onClick={() => handlePillarClick('donor', 'Card Doação')}
              className={cn(
                "p-6 rounded-3xl border transition-all cursor-pointer flex flex-col justify-between relative group",
                selectedPillar === 'donor'
                  ? "bg-blue-50/50 border-blue-400 ring-2 ring-blue-400/20 shadow-md"
                  : "bg-white border-slate-100 hover:border-blue-200 hover:shadow-lg"
              )}
            >
              <div>
                <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                  <Sparkles className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">Doação Pontual</h3>
                <p className="text-slate-600 text-sm leading-relaxed">
                  Ajude com a compra imediata de fórmulas infantis, cestas de alimentos e insumos para os atendimentos clínicos de urgência.
                </p>
              </div>

              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  recordCampaignClick('Card: Abrir Modal Doação', 'click_cta');
                  openDonationModal();
                }}
                className="mt-6 inline-flex items-center gap-2 text-xs font-bold text-blue-600 group-hover:translate-x-1 transition-all"
              >
                <span>Doar qualquer valor</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Card 4: Empresas e Parcerias */}
            <div 
              onClick={() => handlePillarClick('partner', 'Card Parceiro')}
              className={cn(
                "p-6 rounded-3xl border transition-all cursor-pointer flex flex-col justify-between relative group",
                selectedPillar === 'partner'
                  ? "bg-purple-50/50 border-purple-400 ring-2 ring-purple-400/20 shadow-md"
                  : "bg-white border-slate-100 hover:border-purple-200 hover:shadow-lg"
              )}
            >
              <div>
                <div className="w-12 h-12 rounded-2xl bg-purple-100 text-purple-600 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                  <Users className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">Empresas & Parcerias</h3>
                <p className="text-slate-600 text-sm leading-relaxed">
                  Conecte a responsabilidade social da sua organização com impacto humano mensurável e transformação sustentável.
                </p>
              </div>

              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  scrollToForm('partner', 'Card: Escolher Parceria');
                }}
                className="mt-6 inline-flex items-center gap-2 text-xs font-bold text-purple-600 group-hover:translate-x-1 transition-all"
              >
                <span>Ser empresa parceira</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Frase de Impacto Humano */}
      <section className="py-14 bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-emerald-500/10 border-b border-amber-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <p className="text-lg sm:text-2xl font-black text-slate-800 leading-snug">
            “Cuidar de uma criança é proteger o amanhã de toda uma comunidade. <br className="hidden sm:inline" />
            <span className="text-[#F49853]">A sua presença é o elo que torna isso possível.”</span>
          </p>
        </div>
      </section>

      {/* Formulário de Acolhimento e Inscrição (Coração do Hotsite) */}
      <section ref={formRef} className="py-16 sm:py-24 bg-[#FFFDF9] relative">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <div className="bg-white rounded-[2.5rem] p-6 sm:p-12 border border-amber-100 shadow-xl shadow-amber-900/5 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-br from-[#F49853]/10 to-transparent rounded-bl-full pointer-events-none" />

            {submitted ? (
              <div className="text-center py-12 px-4 animate-fade-in">
                <div className="w-20 h-20 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-6 shadow-md shadow-emerald-500/20">
                  <Heart className="w-10 h-10 fill-current animate-pulse" />
                </div>
                <h3 className="text-2xl sm:text-3xl font-black text-slate-900 mb-3">
                  Seja muito bem-vindo(a) à família!
                </h3>
                <p className="text-slate-600 text-sm sm:text-base max-w-md mx-auto mb-8 font-medium">
                  Recebemos com muito carinho a sua manifestação de interesse. Nossa equipe de acolhimento entrará em contato para os próximos passos.
                </p>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                  <button
                    onClick={handleWhatsAppDirect}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md transition-all"
                  >
                    <MessageCircle className="w-5 h-5" />
                    <span>Falar Conosco no WhatsApp Agora</span>
                  </button>

                  <button
                    onClick={() => setSubmitted(false)}
                    className="text-xs text-slate-400 hover:text-slate-600 font-semibold underline"
                  >
                    Enviar outra mensagem
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <div className="text-center mb-8">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-700 text-xs font-bold mb-3">
                    <Smile className="w-4 h-4 text-[#F49853]" />
                    <span>Inscrição Rápida & Convidativa</span>
                  </div>
                  <h3 className="text-2xl sm:text-3xl font-black text-slate-900">
                    Venha fazer parte deste projeto
                  </h3>
                  <p className="text-slate-500 text-xs sm:text-sm mt-1 max-w-lg mx-auto">
                    Preencha os campos abaixo. É super simples e leva menos de 1 minuto.
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                  {/* Como quer participar */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                      Como você gostaria de participar?
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                      {[
                        { id: 'volunteer', label: 'Voluntário', icon: HandHeart },
                        { id: 'sponsor', label: 'Apadrinhar', icon: Heart },
                        { id: 'donor', label: 'Doar', icon: Sparkles },
                        { id: 'partner', label: 'Empresa', icon: Users },
                      ].map(opt => {
                        const Icon = opt.icon;
                        const isSelected = formData.interest_type === opt.id;
                        return (
                          <button
                            type="button"
                            key={opt.id}
                            onClick={() => {
                              setFormData(prev => ({ ...prev, interest_type: opt.id as any }));
                              setSelectedPillar(opt.id as any);
                            }}
                            className={cn(
                              "flex flex-col items-center justify-center p-3 rounded-2xl border text-center transition-all",
                              isSelected
                                ? "bg-amber-500 text-white border-amber-500 shadow-md shadow-amber-500/20 font-bold"
                                : "bg-slate-50 border-slate-200/80 text-slate-600 hover:bg-slate-100 font-semibold"
                            )}
                          >
                            <Icon className="w-5 h-5 mb-1" />
                            <span className="text-xs">{opt.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Nome Completo */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Seu Nome Completo *
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        type="text"
                        required
                        placeholder="Ex: Maria Clara Silva"
                        value={formData.name}
                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                        className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:border-[#F49853] focus:ring-2 focus:ring-[#F49853]/20 text-slate-800 text-sm font-medium outline-none transition-all"
                      />
                    </div>
                  </div>

                  {/* WhatsApp e E-mail */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                        WhatsApp / Celular *
                      </label>
                      <div className="relative">
                        <Phone className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <input
                          type="tel"
                          required
                          placeholder="(11) 99999-9999"
                          value={formData.phone}
                          onChange={e => setFormData({ ...formData, phone: e.target.value })}
                          className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:border-[#F49853] focus:ring-2 focus:ring-[#F49853]/20 text-slate-800 text-sm font-medium outline-none transition-all"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                        E-mail
                      </label>
                      <div className="relative">
                        <Mail className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <input
                          type="email"
                          placeholder="seuemail@exemplo.com"
                          value={formData.email}
                          onChange={e => setFormData({ ...formData, email: e.target.value })}
                          className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:border-[#F49853] focus:ring-2 focus:ring-[#F49853]/20 text-slate-800 text-sm font-medium outline-none transition-all"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Cidade e Faixa Etária (Requisitos explícitos: De Onde e Idade) */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                        <span>Sua Cidade / Estado *</span>
                        {loadingLocation && <span className="text-[10px] text-amber-600 font-normal">localizando...</span>}
                      </label>
                      <div className="relative">
                        <MapPin className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <input
                          type="text"
                          required
                          placeholder="Ex: São Paulo, SP"
                          value={formData.city ? `${formData.city}${formData.state ? `, ${formData.state}` : ''}` : ''}
                          onChange={e => {
                            const val = e.target.value;
                            const parts = val.split(',');
                            setFormData({
                              ...formData,
                              city: parts[0]?.trim() || val,
                              state: parts[1]?.trim() || ''
                            });
                          }}
                          className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:border-[#F49853] focus:ring-2 focus:ring-[#F49853]/20 text-slate-800 text-sm font-medium outline-none transition-all"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                        Sua Faixa Etária *
                      </label>
                      <select
                        value={formData.age_range}
                        onChange={e => setFormData({ ...formData, age_range: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:border-[#F49853] focus:ring-2 focus:ring-[#F49853]/20 text-slate-800 text-sm font-medium outline-none transition-all"
                      >
                        <option value="Menos de 18">Menos de 18 anos</option>
                        <option value="18-24">18 a 24 anos</option>
                        <option value="25-34">25 a 34 anos</option>
                        <option value="35-44">35 a 44 anos</option>
                        <option value="45-54">45 a 54 anos</option>
                        <option value="55+">55 anos ou mais</option>
                      </select>
                    </div>
                  </div>

                  {/* Mensagem Opcional */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      O que tocou o seu coração? (Opcional)
                    </label>
                    <textarea
                      rows={2}
                      placeholder="Conte um pouco sobre suas motivações ou como gostaria de somar..."
                      value={formData.message}
                      onChange={e => setFormData({ ...formData, message: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:border-[#F49853] focus:ring-2 focus:ring-[#F49853]/20 text-slate-800 text-sm font-medium outline-none transition-all resize-none"
                    />
                  </div>

                  {/* Botão de Envio Caloroso */}
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full py-4 rounded-2xl bg-[#F49853] hover:bg-[#e0843f] text-white text-base font-bold shadow-lg shadow-[#F49853]/25 hover:shadow-xl transition-all active:scale-[0.99] flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {submitting ? (
                      <span className="inline-flex items-center gap-2">
                        <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Registrando com carinho...
                      </span>
                    ) : (
                      <>
                        <Heart className="w-5 h-5 fill-white" />
                        <span>Quero Fazer Parte da Família YAH Hope</span>
                      </>
                    )}
                  </button>

                  <p className="text-[11px] text-center text-slate-400">
                    Seus dados estão seguros e serão utilizados apenas pelo projeto YAH Hope para contato acolhedor.
                  </p>
                </form>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Rodapé Simples e Acolhedor */}
      <footer className="py-12 bg-white border-t border-slate-100 text-center text-xs text-slate-500">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex items-center justify-center gap-2 mb-3">
            <span className="font-bold text-slate-700">YAH Hope</span>
            <span>•</span>
            <span>campanha.yahhope.com</span>
            <span>•</span>
            <Link to="/" className="text-[#F49853] hover:underline font-semibold">Ir para o site principal</Link>
          </div>
          <p>© {new Date().getFullYear()} YAH Hope. Todos os direitos reservados. Transformando vidas com amor e nutrição.</p>
        </div>
      </footer>
      <DonationModal />
    </div>
  );
}
