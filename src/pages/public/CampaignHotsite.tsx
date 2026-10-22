import React, { useEffect, useState } from 'react';
import { 
  Heart, 
  Users, 
  ShieldCheck, 
  Sparkles, 
  CheckCircle2, 
  ArrowRight, 
  MapPin, 
  HeartHandshake, 
  Sprout, 
  Compass, 
  FileText, 
  Bell, 
  LayoutDashboard, 
  Activity
} from 'lucide-react';
import { SEO } from '../../components/common/SEO';
import { cn } from '../../lib/utils';
import { 
  recordCampaignClick, 
  detectTrafficSource 
} from '../../services/campaignTrackingService';
import { trackPageView } from '../../services/analyticsService';
import { HomeDonationCard } from '../../components/public/HomeDonationCard';
import { PublicFooter } from '../../components/PublicFooter';
import { MonthlySupporterCounterCard } from '../../components/public/MonthlySupporterCounterCard';

/**
 * Estrutura escalável de projetos para a campanha institucional da YAH Hope.
 * Permite cadastrar e exibir novas frentes aprovadas no futuro (Educação, Geração de Renda,
 * Desenvolvimento Comunitário, Assistência Humanitária) sem necessidade de refatorar a página.
 */
export interface CampaignProjectItem {
  id: string;
  name: string;
  summary: string;
  image: string;
  imageAlt: string;
  location: string;
  category: string;
  status: 'active' | 'completed';
  statusLabel: string;
  verifiedHighlights: string[];
  contributionMode: 'sponsorship' | 'general';
}

/**
 * Lista estrita de projetos efetivamente em execução e verificados para publicação.
 * Projetos em fase de planejamento não são exibidos como cards ativos.
 */
const PUBLISHED_CAMPAIGN_PROJECTS: CampaignProjectItem[] = [
  {
    id: 'acompanhamento-nutricional-mocambique',
    name: 'Acompanhamento nutricional infantil — Moçambique',
    summary:
      'Atualmente, acompanhamos 10 crianças em situação de desnutrição infantil, oferecendo cuidado contínuo e apoio às suas famílias. Nosso compromisso é acompanhar cada história com responsabilidade, atenção e proximidade.',
    image: '/login_bg_real.jpg',
    imageAlt: 'Crianças acompanhadas pela YAH Hope em Moçambique',
    location: 'Moçambique',
    category: 'Saúde e Nutrição',
    status: 'active',
    statusLabel: 'Em execução',
    verifiedHighlights: [
      '10 crianças atualmente acompanhadas',
      'Apoio e orientação às famílias',
      'Continuidade do acompanhamento'
    ],
    contributionMode: 'sponsorship'
  }
];

const INSTITUTIONAL_PILLARS = [
  {
    id: 'cuidar',
    title: 'CUIDAR',
    description:
      'Estar presente diante das necessidades humanas, oferecendo acolhimento, atenção e apoio.',
    icon: HeartHandshake,
    accentClass: 'text-[#F49853] bg-[#F49853]/15 border-[#F49853]/25'
  },
  {
    id: 'fortalecer',
    title: 'FORTALECER',
    description:
      'Contribuir para que famílias e comunidades desenvolvam autonomia, segurança e novas possibilidades.',
    icon: Sprout,
    accentClass: 'text-[#92BF78] bg-[#92BF78]/15 border-[#92BF78]/25'
  },
  {
    id: 'transformar',
    title: 'TRANSFORMAR',
    description:
      'Construir oportunidades que possam gerar mudanças duradouras na vida das pessoas.',
    icon: Compass,
    accentClass: 'text-[#88A1F2] bg-[#88A1F2]/15 border-[#88A1F2]/25'
  }
];

const TRANSPARENCY_FEATURES = [
  {
    title: 'Portal exclusivo',
    description: 'Ambiente dedicado para mantenedores, padrinhos e madrinhas acompanharem sua caminhada com a YAH Hope.',
    icon: LayoutDashboard
  },
  {
    title: 'Notícias das crianças',
    description: 'Informações cuidadosas e respeitosas sobre o desenvolvimento das crianças acompanhadas pelo projeto.',
    icon: Heart
  },
  {
    title: 'Atualizações dos projetos',
    description: 'Relatos periódicos sobre o andamento das ações em execução e os passos dados em campo.',
    icon: Sparkles
  },
  {
    title: 'Acompanhamento das iniciativas',
    description: 'Visão clara de como cada frente de trabalho evolui junto às famílias e comunidades atendidas.',
    icon: Activity
  },
  {
    title: 'Aplicação dos recursos',
    description: 'Consulta transparente às suas contribuições mensais e à prestação de contas das atividades.',
    icon: FileText
  },
  {
    title: 'Comunicação da YAH Hope',
    description: 'Acesso em primeira mão aos comunicados institucionais, novidades e próximos passos da organização.',
    icon: Bell
  }
];

const SPONSORSHIP_QUOTA_OPTIONS = [
  { quotas: 1, label: '1 criança', price: 'R$ 90/mês' },
  { quotas: 2, label: '2 crianças', price: 'R$ 180/mês' },
  { quotas: 3, label: '3 crianças', price: 'R$ 270/mês' },
  { quotas: 4, label: '4 crianças', price: 'R$ 360/mês' }
];

export function CampaignHotsite() {
  const [selectedModality, setSelectedModality] = useState<'sponsorship' | 'general'>('sponsorship');
  const [selectedQuotas, setSelectedQuotas] = useState<number>(1);

  useEffect(() => {
    trackPageView('/campanha-yahhope', 'Hotsite - Um convite para levar esperança | YAH Hope');
    recordCampaignClick('Visualização do Hotsite de Mantenedores', 'page_view', {
      source: detectTrafficSource(),
      referrer: document.referrer
    });
  }, []);

  const scrollToSection = (sectionId: string, buttonLabel: string) => {
    recordCampaignClick(buttonLabel, 'cta_click', { target: sectionId });
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleSelectModality = (
    modality: 'sponsorship' | 'general',
    buttonLabel: string,
    quotas?: number
  ) => {
    setSelectedModality(modality);
    if (quotas) {
      setSelectedQuotas(quotas);
    }
    scrollToSection('participar', buttonLabel);
  };

  return (
    <div className="min-h-screen bg-[#070B12] text-slate-100 antialiased selection:bg-[#F49853] selection:text-white overflow-x-hidden flex flex-col">
      <SEO 
        title="Um convite para levar esperança | YAH Hope" 
        description="A YAH Hope existe para transformar cuidado em oportunidades. Hoje, acompanhamos crianças e famílias em Moçambique. Com você, queremos continuar presentes e alcançar novas vidas."
        keywords="YAH Hope, apadrinhar criança, mantenedor YAH Hope, desnutrição infantil Moçambique, ONG ajuda humanitária"
        canonical="https://yahhope.com/campanha-yahhope"
        ogImage="https://yahhope.com/login_bg_real.jpg"
      />

      {/* TOPO INSTITUCIONAL LIMPO: Apenas o Logo Centralizado apontando para www.yahhope.com */}
      <header className="sticky top-0 z-40 py-2.5 sm:py-3 px-4 border-b border-white/10 bg-[#070B12]/85 backdrop-blur-md flex items-center justify-center">
        <a 
          href="https://www.yahhope.com" 
          title="Ir para o site principal da YAH Hope"
          className="inline-block transition-transform duration-200 hover:scale-105 active:scale-95 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#F49853] rounded-lg"
        >
          <img 
            src="/logo.png" 
            alt="YAH Hope" 
            className="h-14 sm:h-18 md:h-20 w-auto object-contain drop-shadow-xl"
          />
        </a>
      </header>

      <main className="flex-1">
        {/* =====================================================================
            SEÇÃO 01 — HERO: UM CONVITE PARA LEVAR ESPERANÇA
        ===================================================================== */}
        <section 
          aria-labelledby="hero-heading"
          className="relative min-h-[78vh] sm:min-h-[82vh] flex items-center overflow-hidden border-b border-white/10"
        >
          {/* Fotografia real com enquadramento cuidadoso e contraste controlado */}
          <div className="absolute inset-0 z-0 pointer-events-none">
            <img
              src="/login_bg_real.jpg"
              alt="Crianças acompanhadas pela YAH Hope em Moçambique"
              className="w-full h-full object-cover object-[65%_30%] sm:object-center"
              fetchPriority="high"
            />
            {/* Gradiente direcional para garantir leitura WCAG AA sem esconder a fotografia */}
            <div className="absolute inset-0 bg-gradient-to-r from-[#070B12]/95 via-[#070B12]/80 to-[#070B12]/40" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#070B12] via-[#070B12]/30 to-transparent" />
          </div>

          <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 md:py-28 w-full">
            <div className="max-w-2xl space-y-6 text-left">
              <h1 
                id="hero-heading"
                className="text-3xl sm:text-5xl md:text-6xl font-black text-white tracking-tight leading-[1.1] drop-shadow-sm"
              >
                Um convite para levar esperança.
              </h1>

              <p className="text-base sm:text-xl text-slate-200 leading-relaxed font-normal max-w-xl text-justify">
                A YAH Hope existe para transformar cuidado em oportunidades. Hoje, acompanhamos crianças e famílias em Moçambique. Com você, queremos continuar presentes e alcançar novas vidas.
              </p>

              {/* CTAs Primário e Secundário */}
              <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5 sm:gap-4">
                <button
                  type="button"
                  onClick={() => scrollToSection('participar', 'Hero CTA - Quero fazer parte')}
                  className="min-h-[50px] px-7 py-3.5 rounded-2xl bg-[#F49853] hover:bg-[#e38640] text-white font-bold text-sm sm:text-base tracking-wide shadow-xl shadow-[#F49853]/25 transition-all flex items-center justify-center gap-2.5 cursor-pointer active:scale-[0.99]"
                >
                  <Heart size={18} className="fill-current" />
                  <span>Quero fazer parte</span>
                </button>

                <button
                  type="button"
                  onClick={() => scrollToSection('quem-somos', 'Hero CTA - Conheça nosso trabalho')}
                  className="min-h-[50px] px-7 py-3.5 rounded-2xl bg-white/10 hover:bg-white/15 text-white border border-white/25 backdrop-blur-md font-semibold text-sm sm:text-base transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]"
                >
                  <span>Conheça nosso trabalho</span>
                  <ArrowRight size={17} />
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* =====================================================================
            SEÇÃO 02 — QUEM SOMOS E O QUE NOS MOVE
        ===================================================================== */}
        <section 
          id="quem-somos" 
          aria-labelledby="quem-somos-heading"
          className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8 bg-[#070B12] scroll-mt-20"
        >
          <div className="max-w-6xl mx-auto space-y-12">
            <div className="max-w-3xl mx-auto text-left sm:text-center space-y-4">
              <span className="text-xs font-bold uppercase tracking-widest text-[#F49853] block">
                Quem Somos e o Que Nos Move
              </span>
              <h2 
                id="quem-somos-heading"
                className="text-2xl sm:text-4xl font-black text-white tracking-tight leading-tight"
              >
                Cuidar hoje. Construir possibilidades para o amanhã.
              </h2>
              <p className="text-base sm:text-lg text-slate-300 leading-relaxed text-justify">
                Acreditamos que cada vida carrega uma história e um futuro de possibilidades. Nosso compromisso é caminhar ao lado de pessoas e comunidades, oferecendo cuidado, fortalecendo vínculos e criando oportunidades de transformação.
              </p>
            </div>

            {/* Três Pilares Institucionais */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {INSTITUTIONAL_PILLARS.map((pillar) => {
                const IconComponent = pillar.icon;
                return (
                  <div
                    key={pillar.id}
                    className="rounded-3xl p-6 sm:p-8 bg-slate-900/70 border border-white/10 hover:border-white/20 transition-colors flex flex-col justify-between space-y-5"
                  >
                    <div className="space-y-4">
                      <div className={cn("w-12 h-12 rounded-2xl border flex items-center justify-center", pillar.accentClass)}>
                        <IconComponent size={22} />
                      </div>
                      <h3 className="text-lg sm:text-xl font-black text-white tracking-wide">
                        {pillar.title}
                      </h3>
                      <p className="text-sm sm:text-base text-slate-300 leading-relaxed text-justify">
                        {pillar.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* =====================================================================
            SEÇÃO 03 — NOSSO TRABALHO NA PRÁTICA (ARQUITETURA ESCALÁVEL DE PROJETOS)
        ===================================================================== */}
        <section 
          id="projetos" 
          aria-labelledby="projetos-heading"
          className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8 bg-[#0B111E] border-y border-white/10 scroll-mt-20"
        >
          <div className="max-w-6xl mx-auto space-y-10">
            <div className="max-w-3xl text-left space-y-3">
              <span className="text-xs font-bold uppercase tracking-widest text-[#92BF78] block">
                Nosso Trabalho na Prática
              </span>
              <h2 
                id="projetos-heading"
                className="text-2xl sm:text-4xl font-black text-white tracking-tight leading-tight"
              >
                Esperança que se transforma em ação.
              </h2>
              <p className="text-base sm:text-lg text-slate-300 leading-relaxed text-justify">
                Cada iniciativa da YAH Hope nasce para responder a necessidades reais com responsabilidade, acompanhamento próximo e compromisso com a dignidade humana.
              </p>
            </div>

            {/* Lista de Projetos Ativos Aprovados */}
            <div className="space-y-8">
              {PUBLISHED_CAMPAIGN_PROJECTS.map((project) => (
                <div
                  key={project.id}
                  className="rounded-3xl bg-slate-900/90 border border-white/15 overflow-hidden shadow-2xl grid grid-cols-1 lg:grid-cols-12"
                >
                  {/* Imagem do Projeto */}
                  <div className="lg:col-span-5 relative min-h-[260px] sm:min-h-[320px] overflow-hidden">
                    <img
                      src={project.image}
                      alt={project.imageAlt}
                      className="w-full h-full object-cover object-center"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent lg:bg-gradient-to-r lg:from-transparent lg:to-slate-900/80" />
                    <div className="absolute top-4 left-4 flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#92BF78] text-slate-950 shadow-md">
                        <span className="w-2 h-2 rounded-full bg-slate-950 animate-pulse" />
                        {project.statusLabel}
                      </span>
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-slate-950/75 text-slate-200 backdrop-blur-md border border-white/15">
                        <MapPin size={12} className="text-[#F49853]" />
                        {project.location}
                      </span>
                    </div>
                  </div>

                  {/* Conteúdo do Projeto */}
                  <div className="lg:col-span-7 p-6 sm:p-8 md:p-10 flex flex-col justify-between space-y-6">
                    <div className="space-y-4">
                      <div className="text-xs font-bold uppercase tracking-wider text-[#F49853]">
                        {project.category} • Projeto Ativo
                      </div>

                      <h3 className="text-xl sm:text-2xl md:text-3xl font-black text-white leading-snug">
                        {project.name}
                      </h3>

                      <p className="text-sm sm:text-base text-slate-300 leading-relaxed text-justify">
                        {project.summary}
                      </p>

                      {/* Destaques Verificados */}
                      <div className="pt-2 grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {project.verifiedHighlights.map((highlight, idx) => (
                          <div
                            key={idx}
                            className="p-3.5 rounded-2xl bg-white/[0.04] border border-white/10 flex items-start gap-2.5"
                          >
                            <CheckCircle2 size={16} className="text-[#92BF78] shrink-0 mt-0.5" />
                            <span className="text-xs sm:text-sm font-medium text-slate-200 leading-snug">
                              {highlight}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-t border-white/10">
                      <p className="text-xs sm:text-sm text-slate-400">
                        Cuidado integral voltado à criança e à orientação da sua família.
                      </p>
                      <button
                        type="button"
                        onClick={() => handleSelectModality(project.contributionMode, `Projeto Ativo CTA - ${project.name}`)}
                        className="px-5 py-3 rounded-xl bg-white/10 hover:bg-[#F49853] text-white font-bold text-xs sm:text-sm transition-colors flex items-center justify-center gap-2 shrink-0 cursor-pointer"
                      >
                        <span>Participar desta história</span>
                        <ArrowRight size={15} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Nota transparente sobre visão de futuro (sem apresentar como projeto já ativo) */}
            <div className="rounded-2xl p-5 sm:p-6 bg-slate-900/50 border border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <h4 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                  <Sparkles size={16} className="text-[#F49853] shrink-0" />
                  <span>Visão de continuidade e novas iniciativas</span>
                </h4>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-3xl text-justify">
                  À medida que nossa rede de apoio mensal se fortalece, preparamos novos passos planejados com responsabilidade — incluindo o acolhimento a mais crianças, oficinas de capacitação e geração de renda para famílias, apoio educacional a jovens e novos programas comunitários.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* =====================================================================
            SEÇÃO 04 — FORMAS DE PARTICIPAR
        ===================================================================== */}
        <section 
          id="formas-de-participar" 
          aria-labelledby="modalidades-heading"
          className="relative py-20 sm:py-28 px-4 sm:px-6 lg:px-8 bg-[#070B12] overflow-hidden scroll-mt-20"
        >
          {/* Fotografia de fundo da seção Formas de Participar */}
          <div className="absolute inset-0 z-0 pointer-events-none">
            <img
              src="/formas_participar_bg.jpg"
              alt="Criança sorrindo acompanhada pela YAH Hope"
              className="w-full h-full object-cover object-[center_25%]"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-slate-950/70" />
            <div className="absolute inset-0 bg-gradient-to-b from-[#0B111E] via-transparent to-[#0B111E]" />
          </div>

          <div className="relative z-10 max-w-6xl mx-auto space-y-12">
            <div className="max-w-3xl mx-auto text-left sm:text-center space-y-4">
              <span className="text-xs font-bold uppercase tracking-widest text-[#F49853] block drop-shadow-sm">
                Formas de Participar
              </span>
              <h2 
                id="modalidades-heading"
                className="text-2xl sm:text-4xl font-black text-white tracking-tight leading-tight drop-shadow-md"
              >
                Existem muitas formas de fazer parte dessa história.
              </h2>
              <p className="text-base sm:text-lg text-slate-200 leading-relaxed drop-shadow-sm text-justify">
                Uma contribuição mensal permite cuidar do presente e planejar o que vem depois com mais segurança. Escolha como você prefere caminhar com a YAH Hope:
              </p>
            </div>

            {/* Dois Cards Comparativos Bem Diferenciados */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 items-stretch">
              
              {/* MODALIDADE 1 — MANTENEDOR YAH HOPE */}
              <div className="rounded-3xl p-6 sm:p-8 bg-slate-950/80 backdrop-blur-md border border-white/15 hover:border-white/25 transition-all flex flex-col justify-between space-y-6 shadow-2xl">
                <div className="space-y-5">
                  <div className="flex items-center justify-between gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-white/10 text-white flex items-center justify-center border border-white/15">
                      <Users size={22} />
                    </div>
                    <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-white/10 text-slate-200 border border-white/10">
                      Apoio Institucional Mensal
                    </span>
                  </div>

                  <div className="space-y-2">
                    <h3 className="text-xl sm:text-2xl font-black text-white">
                      Mantenedor YAH Hope
                    </h3>
                    <p className="text-sm sm:text-base text-slate-300 leading-relaxed text-justify">
                      Como mantenedor, você contribui mensalmente para a continuidade do trabalho da YAH Hope, apoiando suas ações e seu crescimento.
                    </p>
                  </div>

                  <div className="pt-2 space-y-3 border-t border-white/10 text-xs sm:text-sm text-slate-300 text-justify">
                    <div className="flex items-start gap-2.5">
                      <CheckCircle2 size={16} className="text-[#92BF78] shrink-0 mt-0.5" />
                      <span>Sua contribuição é destinada à sustentação global dos projetos ativos e à estruturação de novas iniciativas da organização.</span>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <CheckCircle2 size={16} className="text-[#92BF78] shrink-0 mt-0.5" />
                      <span>Opções mensais sugeridas de <strong>R$ 50</strong>, <strong>R$ 100</strong>, <strong>R$ 200</strong> ou qualquer outro valor de sua escolha.</span>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <CheckCircle2 size={16} className="text-[#92BF78] shrink-0 mt-0.5" />
                      <span>Acesso completo ao Portal Exclusivo com atualizações dos projetos e relatórios de prestação de contas.</span>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleSelectModality('general', 'Card Modalidade - Quero ser mantenedor')}
                  className="w-full min-h-[48px] py-3.5 px-6 rounded-2xl bg-white hover:bg-slate-100 text-slate-950 font-bold text-sm tracking-wide transition-all flex items-center justify-center gap-2 shadow-lg cursor-pointer active:scale-[0.99]"
                >
                  <Users size={17} />
                  <span>Quero ser mantenedor</span>
                </button>
              </div>

              {/* MODALIDADE 2 — PADRINHO OU MADRINHA */}
              <div className="rounded-3xl p-6 sm:p-8 bg-slate-950/80 backdrop-blur-md border-2 border-[#F49853]/45 hover:border-[#F49853]/75 transition-all flex flex-col justify-between space-y-6 relative overflow-hidden shadow-2xl">
                <div className="space-y-5">
                  <div className="flex items-center justify-between gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-[#F49853]/20 text-[#F49853] flex items-center justify-center border border-[#F49853]/30">
                      <Heart size={22} className="fill-[#F49853]" />
                    </div>
                    <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-[#F49853]/20 text-[#F49853] border border-[#F49853]/30">
                      Programa de Apadrinhamento
                    </span>
                  </div>

                  <div className="space-y-2">
                    <h3 className="text-xl sm:text-2xl font-black text-white">
                      Padrinho ou Madrinha
                    </h3>
                    <p className="text-sm sm:text-base text-slate-300 leading-relaxed text-justify">
                      Como padrinho ou madrinha, você participa do programa de apadrinhamento, contribuindo mensalmente para o cuidado das crianças acompanhadas.
                    </p>
                  </div>

                  {/* Opções de Cotas (1 a 4 crianças) */}
                  <div className="space-y-2 pt-1">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
                      Opções de participação mensal:
                    </span>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {SPONSORSHIP_QUOTA_OPTIONS.map((opt) => (
                        <button
                          key={opt.quotas}
                          type="button"
                          onClick={() =>
                            handleSelectModality(
                              'sponsorship',
                              `Card Modalidade Cota - ${opt.label}`,
                              opt.quotas
                            )
                          }
                          className="p-2.5 rounded-xl bg-white/[0.06] hover:bg-[#F49853]/20 border border-white/10 hover:border-[#F49853]/50 text-center transition-all cursor-pointer group"
                        >
                          <span className="block text-xs font-bold text-white group-hover:text-[#F49853]">
                            {opt.label}
                          </span>
                          <span className="block text-xs font-black text-[#F49853] mt-0.5">
                            {opt.price}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="pt-2 space-y-2.5 border-t border-white/10 text-xs sm:text-sm text-slate-300 text-justify">
                    <div className="flex items-start gap-2.5">
                      <CheckCircle2 size={16} className="text-[#92BF78] shrink-0 mt-0.5" />
                      <span><strong>Distribuição justa e coletiva:</strong> As contribuições sustentam o cuidado integral de todas as crianças acompanhadas com equidade.</span>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <CheckCircle2 size={16} className="text-[#92BF78] shrink-0 mt-0.5" />
                      <span>Após a confirmação, você recebe por e-mail e no portal o perfil de acompanhamento e notícias periódicas do desenvolvimento.</span>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleSelectModality('sponsorship', 'Card Modalidade - Quero apadrinhar')}
                  className="w-full min-h-[48px] py-3.5 px-6 rounded-2xl bg-[#F49853] hover:bg-[#e38640] text-white font-bold text-sm tracking-wide transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#F49853]/25 cursor-pointer active:scale-[0.99]"
                >
                  <Heart size={17} className="fill-current" />
                  <span>Quero ser padrinho ou madrinha</span>
                </button>
              </div>

            </div>
          </div>
        </section>

        {/* =====================================================================
            SEÇÃO 05 — ACOMPANHAMENTO E TRANSPARÊNCIA
        ===================================================================== */}
        <section 
          id="transparencia" 
          aria-labelledby="transparencia-heading"
          className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8 bg-[#0B111E] border-t border-white/10 scroll-mt-20"
        >
          <div className="max-w-6xl mx-auto space-y-12">
            <div className="max-w-3xl mx-auto text-left sm:text-center space-y-4">
              <span className="text-xs font-bold uppercase tracking-widest text-[#92BF78] block">
                Acompanhamento e Transparência
              </span>
              <h2 
                id="transparencia-heading"
                className="text-2xl sm:text-4xl font-black text-white tracking-tight leading-tight"
              >
                Você faz parte e acompanha essa história.
              </h2>
              <p className="text-base sm:text-lg text-slate-300 leading-relaxed text-justify">
                Queremos que você saiba como o trabalho está caminhando e o que seu apoio ajuda a construir. É uma forma de manter você por perto e cultivar uma relação de confiança ao longo do tempo.
              </p>
            </div>

            {/* Grid de 6 Cards Visuais do Portal do Mantenedor */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {TRANSPARENCY_FEATURES.map((item, idx) => {
                const IconComp = item.icon;
                return (
                  <div
                    key={idx}
                    className="p-6 rounded-2xl bg-slate-900/75 border border-white/10 flex flex-col justify-between space-y-3"
                  >
                    <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 text-[#F49853] flex items-center justify-center">
                      <IconComp size={19} />
                    </div>
                    <h3 className="text-base sm:text-lg font-bold text-white">
                      {item.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-300 leading-relaxed text-justify">
                      {item.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* =====================================================================
            SEÇÃO 06 — FORMULÁRIO DE PARTICIPAÇÃO + CONTADOR DE APOIADORES
        ===================================================================== */}
        <section 
          id="participar" 
          aria-labelledby="participar-heading"
          className="relative py-20 sm:py-28 px-4 sm:px-6 lg:px-8 bg-[#070B12] border-t border-white/10 overflow-hidden scroll-mt-16"
        >
          {/* Fotografia de fundo da seção Vamos levar esperança juntos? */}
          <div className="absolute inset-0 z-0 pointer-events-none">
            <img
              src="/participar_bg.jpg"
              alt="Crianças e voluntários de mãos dadas em Moçambique"
              className="w-full h-full object-cover object-center"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-slate-950/65" />
            <div className="absolute inset-0 bg-gradient-to-b from-[#0B111E] via-transparent to-slate-900" />
          </div>

          <div className="relative z-10 max-w-5xl mx-auto space-y-10">
            <div className="max-w-2xl mx-auto text-left sm:text-center space-y-3">
              <span className="text-xs font-bold uppercase tracking-widest text-[#F49853] block drop-shadow-sm">
                Sua Participação Começa Aqui
              </span>
              <h2 
                id="participar-heading"
                className="text-2xl sm:text-4xl font-black text-white tracking-tight leading-tight drop-shadow-md"
              >
                Vamos levar esperança juntos?
              </h2>
              <p className="text-sm sm:text-base text-slate-200 leading-relaxed drop-shadow-sm text-justify">
                Com seu apoio, queremos continuar cuidando das crianças que já acompanhamos, fortalecer suas famílias e abrir espaço para que essa rede alcance mais vidas.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center justify-center">
              {/* Contador de Mantenedores e Padrinhos Mensais */}
              <div className="lg:col-span-5 w-full flex justify-center order-2 lg:order-1">
                <div className="w-full max-w-md space-y-4">
                  <MonthlySupporterCounterCard 
                    theme="dark" 
                    className="w-full shadow-2xl" 
                  />

                  <div className="p-4 rounded-2xl bg-slate-950/70 backdrop-blur-md border border-white/15 flex items-center gap-3 text-xs text-slate-200 shadow-xl">
                    <ShieldCheck size={18} className="text-[#92BF78] shrink-0" />
                    <span>
                      Ambiente criptografado. Você pode gerenciar sua assinatura a qualquer momento pelo Portal do Mantenedor.
                    </span>
                  </div>
                </div>
              </div>

              {/* Formulário Oficial de Participação (Preservado Integralmente) */}
              <div className="lg:col-span-7 w-full flex justify-center order-1 lg:order-2">
                <HomeDonationCard 
                  initialTab={selectedModality}
                  initialQuotas={selectedQuotas}
                  className="w-full max-w-md shadow-2xl mx-auto" 
                />
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer Oficial do Site Principal */}
      <PublicFooter />
    </div>
  );
}
