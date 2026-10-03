import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Heart, 
  ArrowRight, 
  Target, 
  Eye, 
  ShieldCheck, 
  Sparkles, 
  HeartHandshake, 
  Flame, 
  Sprout, 
  Award, 
  Sun,
  Users2, 
  Scale, 
  FileCheck
} from 'lucide-react';
import { SEO } from '../../components/common/SEO';
import { useDonationModal } from '../../contexts/DonationModalContext';

export function MissionVisionValues() {
  const { openDonationModal } = useDonationModal();

  const values = [
    {
      icon: HeartHandshake,
      title: 'Dignidade Humana Inegociável',
      tag: 'Princípio Central',
      color: 'bg-orange-50 text-[#F49853] border-orange-100',
      description: 'Toda vida humana possui valor intrínseco, sagrado e imensurável, independentemente de etnia, crença ou condição socioeconômica. Cada projeto nosso visa restaurar a honra e o respeito devido a cada indivíduo.'
    },
    {
      icon: Flame,
      title: 'Amor em Ação (Fé Prática)',
      tag: 'Ação Real',
      color: 'bg-rose-50 text-rose-600 border-rose-100',
      description: 'A verdadeira compaixão não se limita a discursos ou boas intenções; ela se materializa no campo, no cuidado com o faminto, no socorro à criança desnutrida e na prontidão para servir aos que mais sofrem.'
    },
    {
      icon: ShieldCheck,
      title: 'Integridade & Rigor Ético',
      tag: 'Transparência',
      color: 'bg-blue-50 text-blue-600 border-blue-100',
      description: 'Administramos cada recurso confiado à YAH Hope com transparência absoluta, auditoria contínua e prestação de contas clara para nossos mantenedores, parceiros e a sociedade.'
    },
    {
      icon: Sprout,
      title: 'Desenvolvimento Sustentável',
      tag: 'Emancipação',
      color: 'bg-emerald-50 text-emerald-600 border-emerald-100',
      description: 'Não geramos relações de dependência. Desenvolvemos capacidades locais com água potável, formação acadêmica e hortas comunitárias para que as populações conquistem sua própria autonomia.'
    },
    {
      icon: Award,
      title: 'Excelência & Cuidado Integral',
      tag: 'Padrão Ouro',
      color: 'bg-amber-50 text-amber-600 border-amber-100',
      description: 'Acreditamos que quem vive em vulnerabilidade merece o que há de melhor. Empregamos rigor técnico em protocolos de nutrição clínica, saneamento e atendimento comunitário humanizado.'
    },
    {
      icon: Sun,
      title: 'Esperança Inabalável & Resiliência',
      tag: 'Superação',
      color: 'bg-purple-50 text-purple-600 border-purple-100',
      description: 'Não recuamos diante de cenários considerados impossíveis. Acreditamos firmemente no poder da perseverança para transformar terras áridas em nascentes de vida e futuro.'
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      <SEO 
        title="Missão, Visão e Valores | YAH Hope"
        description="Conheça a missão humanitária, a visão de futuro e os valores inegociáveis que regem as ações da YAH Hope no combate à desnutrição e na promoção da dignidade humana."
        keywords="missão YAH Hope, visão YAH Hope, valores humanitários, ética na ONG, princípios YAH Hope"
        canonical="https://yahhope.org/missao-visao-valores"
      />

      {/* 1. Hero Section */}
      <section className="relative pt-32 pb-20 md:pt-40 md:pb-28 bg-[#0F172A] text-white overflow-hidden font-gotham-regular">
        <div className="absolute inset-0 bg-gradient-to-b from-[#0F172A]/90 via-[#0F172A]/95 to-[#0F172A]"></div>
        
        {/* Subtle decorative background circles */}
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-[#F49853]/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute top-1/2 -left-24 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-heading font-black tracking-tight leading-tight text-white mb-6 max-w-4xl mx-auto">
            Missão, Visão e <br />
            <span className="text-[#F49853]">Nossos Valores</span>
          </h1>

          <p className="text-base sm:text-lg md:text-xl text-slate-300 font-gotham-light leading-relaxed max-w-3xl mx-auto mb-10">
            Conheça os princípios inabaláveis que direcionam cada projeto em campo, cada acolhimento de criança desnutrida e a gestão ética de cada recurso confiado à YAH Hope.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link
              to="/sobre-nos"
              className="bg-white/10 hover:bg-white/20 text-white border border-white/20 px-6 py-3.5 rounded-full font-gotham-bold text-sm tracking-wide transition-all flex items-center gap-2"
            >
              <span>Ler o Manifesto YAH Hope</span>
              <ArrowRight size={16} />
            </Link>
            <button
              onClick={() => openDonationModal()}
              className="bg-[#F49853] hover:bg-[#e0853d] text-white px-7 py-3.5 rounded-full font-gotham-bold text-sm tracking-wide shadow-lg hover:shadow-[#F49853]/40 transition-all flex items-center gap-2 cursor-pointer"
            >
              <span>Apoiar Esta Causa</span>
              <Heart size={16} className="fill-white" />
            </button>
          </div>
        </div>
      </section>

      {/* 2. Missão e Visão - Cards de Destaque com Texto Oficial */}
      <section className="py-20 md:py-24 bg-white font-gotham-regular relative -mt-8 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
            
            {/* Card: Missão */}
            <div className="bg-gradient-to-br from-orange-50/70 via-white to-white p-8 sm:p-12 rounded-[2.5rem] border border-orange-100 shadow-xl shadow-orange-950/5 relative overflow-hidden flex flex-col justify-between group">
              <div className="absolute top-0 right-0 w-40 h-40 bg-[#F49853]/10 rounded-bl-[5rem] pointer-events-none transition-transform group-hover:scale-110"></div>
              
              <div>
                <div className="w-16 h-16 rounded-2xl bg-[#F49853] text-white flex items-center justify-center mb-8 shadow-md shadow-[#F49853]/30">
                  <Target size={32} />
                </div>

                <span className="text-xs font-gotham-bold uppercase tracking-widest text-[#F49853] block mb-3">
                  Propósito Principal
                </span>

                <h2 className="text-3xl sm:text-4xl font-heading font-black text-slate-900 mb-6">
                  Missão
                </h2>

                <div className="space-y-4 text-slate-700 font-gotham-regular text-base sm:text-lg leading-relaxed text-justify">
                  <p>
                    O nosso principal objetivo é promover a dignidade humana. Através de trabalhos sociais, almejamos a transformação do ser humano em sua totalidade, com o suprimento de necessidades básicas e no desenvolvimento das famílias em seu contexto social.
                  </p>
                  <p>
                    Com treinamentos e capacitação, as unidades da YAH Hope serão coordenadas e lideradas pela população local para que assim elas impactem a sua nação e possam ver não apenas a geração delas se desenvolverem, mas também todas as futuras gerações.
                  </p>
                </div>
              </div>

              <div className="pt-8 mt-8 border-t border-orange-200/60 flex items-center gap-2.5 text-xs font-gotham-bold text-slate-700">
                <Sparkles size={16} className="text-[#F49853] shrink-0" />
                <span>Promover a dignidade humana e capacitar a liderança local.</span>
              </div>
            </div>

            {/* Card: Visão */}
            <div className="bg-gradient-to-br from-slate-900 via-[#131D33] to-[#1E293B] text-white p-8 sm:p-12 rounded-[2.5rem] border border-slate-800 shadow-xl relative overflow-hidden flex flex-col justify-between group">
              <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-bl-[5rem] pointer-events-none transition-transform group-hover:scale-110"></div>

              <div>
                <div className="w-16 h-16 rounded-2xl bg-white/10 text-[#F49853] border border-white/15 flex items-center justify-center mb-8">
                  <Eye size={32} />
                </div>

                <span className="text-xs font-gotham-bold uppercase tracking-widest text-[#F49853] block mb-3">
                  Futuro em Construção
                </span>

                <h2 className="text-3xl sm:text-4xl font-heading font-black text-white mb-6">
                  Visão
                </h2>

                <div className="space-y-4 text-slate-200 font-gotham-light text-base sm:text-lg leading-relaxed text-justify">
                  <p>
                    Através da YAH Hope, vamos combater os desafios sociais locais, como o alto índice de desnutrição infantil, trazer melhoria na área da educação e promover atividades socioeconômicas.
                  </p>
                  <p>
                    Com unidades autossustentáveis e independentes lideradas por líderes locais, os quais serão treinados para aprender, ensinar, coordenar a unidade e assim, gerarem mudança dentro do seu contexto sociocultural.
                  </p>
                </div>
              </div>

              <div className="pt-8 mt-8 border-t border-white/15 flex items-center gap-2.5 text-xs font-gotham-bold text-slate-300">
                <Sparkles size={16} className="text-[#F49853] shrink-0" />
                <span>Unidades autossustentáveis lideradas pela própria população local.</span>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 3. Nossos Valores Fundamentais */}
      <section className="py-20 md:py-28 bg-slate-50 font-gotham-regular">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-gotham-bold uppercase tracking-widest text-[#F49853] block mb-2">
              Princípios Inegociáveis
            </span>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-heading font-black text-slate-900 tracking-tight mb-4">
              Nossos Valores
            </h2>
            <p className="text-slate-500 text-sm sm:text-base font-gotham-light">
              Estes são os valores que forjam nosso caráter institucional, orientam nossas decisões orçamentárias e fundamentam cada contato humano.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {values.map((val, idx) => {
              const IconComp = val.icon;
              return (
                <div 
                  key={idx}
                  className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between group"
                >
                  <div>
                    <div className="flex items-center justify-between mb-6">
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border ${val.color} group-hover:scale-105 transition-transform`}>
                        <IconComp size={26} />
                      </div>
                      <span className="text-[10px] font-gotham-bold uppercase tracking-widest text-slate-400 bg-slate-100 px-3 py-1 rounded-full">
                        {val.tag}
                      </span>
                    </div>

                    <h3 className="text-xl font-heading font-bold text-slate-900 mb-3 group-hover:text-[#F49853] transition-colors">
                      {val.title}
                    </h3>

                    <p className="text-sm text-slate-600 font-gotham-light leading-relaxed">
                      {val.description}
                    </p>
                  </div>

                  <div className="pt-6 mt-6 border-t border-slate-100 flex items-center gap-2 text-xs font-gotham-bold text-slate-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#F49853]"></span>
                    <span>Pilar de Conduta #{idx + 1}</span>
                  </div>
                </div>
              );
            })}
          </div>

        </div>
      </section>

      {/* 4. Compromissos Éticos e Governança */}
      <section className="py-20 bg-white font-gotham-regular">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-slate-900 text-white rounded-[2.5rem] p-8 sm:p-14 lg:p-16">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
              
              <div className="lg:col-span-5 space-y-4">
                <span className="text-xs font-gotham-bold uppercase tracking-widest text-[#F49853] block">
                  Governança & Prestação de Contas
                </span>
                <h2 className="text-3xl sm:text-4xl font-heading font-black leading-tight">
                  Como praticamos nossos valores no dia a dia?
                </h2>
                <p className="text-slate-300 font-gotham-light text-sm sm:text-base leading-relaxed">
                  Valores precisam se traduzir em processos auditáveis e práticas transparentes. Garantimos que a confiança dos doadores seja honrada em cada detalhe operacional.
                </p>
              </div>

              <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-6">
                
                <div className="bg-white/5 border border-white/10 p-6 rounded-2xl">
                  <div className="w-10 h-10 rounded-xl bg-[#F49853]/20 text-[#F49853] flex items-center justify-center mb-4">
                    <Scale size={20} />
                  </div>
                  <h4 className="font-gotham-bold text-white text-base mb-2">Auditoria e Compliance</h4>
                  <p className="text-xs text-slate-300 font-gotham-light leading-relaxed">
                    Registros contábeis detalhados e demonstrativos periódicos para garantir a conformidade estatutária e legal.
                  </p>
                </div>

                <div className="bg-white/5 border border-white/10 p-6 rounded-2xl">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-4">
                    <Users2 size={20} />
                  </div>
                  <h4 className="font-gotham-bold text-white text-base mb-2">Respeito às Culturas Locais</h4>
                  <p className="text-xs text-slate-300 font-gotham-light leading-relaxed">
                    Não impomos soluções externas. Planejamos e executamos os projetos em conjunto com líderes e voluntários locais.
                  </p>
                </div>

                <div className="bg-white/5 border border-white/10 p-6 rounded-2xl">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center mb-4">
                    <FileCheck size={20} />
                  </div>
                  <h4 className="font-gotham-bold text-white text-base mb-2">Comunicação Dignificante</h4>
                  <p className="text-xs text-slate-300 font-gotham-light leading-relaxed">
                    Rejeitamos o sensacionalismo de dor. Retratamos crianças e famílias assistidas sempre com respeito e dignidade.
                  </p>
                </div>

                <div className="bg-white/5 border border-white/10 p-6 rounded-2xl">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center mb-4">
                    <Heart size={20} />
                  </div>
                  <h4 className="font-gotham-bold text-white text-base mb-2">Foco no Beneficiário</h4>
                  <p className="text-xs text-slate-300 font-gotham-light leading-relaxed">
                    Otimizamos custos administrativos para que a esmagadora maioria dos fundos vá diretamente para o campo e a nutrição.
                  </p>
                </div>

              </div>

            </div>
          </div>
        </div>
      </section>

      {/* 5. CTA Section */}
      <section className="py-20 bg-slate-50 text-center font-gotham-regular">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <span className="text-[#F49853] font-gotham-bold text-xs uppercase tracking-widest block mb-3">
            Conecte-se com Esse Propósito
          </span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-heading font-black text-slate-900 mb-6">
            Ajude-nos a levar esses valores para mais comunidades.
          </h2>
          <p className="text-slate-600 font-gotham-light text-base md:text-lg mb-8 max-w-2xl mx-auto">
            Cada nova criança acolhida, cada poço aberto e cada bolsa concedida representa a materialização prática da nossa missão.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <button
              onClick={() => openDonationModal()}
              className="bg-[#F49853] hover:bg-[#e0853d] text-white px-8 py-4 rounded-full font-gotham-bold text-sm tracking-wide shadow-lg hover:shadow-[#F49853]/40 transition-all flex items-center gap-2 cursor-pointer"
            >
              <span>Apoiar Agora</span>
              <Heart size={18} className="fill-white" />
            </button>
            <Link
              to="/projetos"
              className="bg-white hover:bg-slate-100 text-slate-800 border border-slate-200 px-8 py-4 rounded-full font-gotham-bold text-sm tracking-wide transition-all"
            >
              <span>Conhecer Nossos Projetos</span>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
