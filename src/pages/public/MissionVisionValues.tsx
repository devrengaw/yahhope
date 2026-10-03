import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Heart, 
  ArrowRight, 
  Target, 
  Eye, 
  Cross, 
  MessageCircle, 
  Scale, 
  Sparkles, 
  Users2, 
  ShieldCheck, 
  Sprout, 
  GraduationCap
} from 'lucide-react';
import { SEO } from '../../components/common/SEO';
import { useDonationModal } from '../../contexts/DonationModalContext';

export function MissionVisionValues() {
  const { openDonationModal } = useDonationModal();

  const valuePillars = [
    {
      icon: Cross,
      title: 'Exemplo',
      subtitle: 'Cristo no Centro',
      description: 'Acreditamos e seguimos o maior exemplo de todos, Jesus.',
      accentColor: 'text-[#F49853]',
      bgLight: 'bg-orange-50 border-orange-200/80',
      badgeColor: 'bg-orange-100 text-[#F49853]'
    },
    {
      icon: Heart,
      title: 'Amor',
      subtitle: 'Doação Incondicional',
      description: 'Amamos o próximo sem esperar nada em troca.',
      accentColor: 'text-rose-500',
      bgLight: 'bg-rose-50 border-rose-200/80',
      badgeColor: 'bg-rose-100 text-rose-600'
    },
    {
      icon: MessageCircle,
      title: 'Comunicação',
      subtitle: 'Verdade & Clareza',
      description: 'Prezamos por uma comunicação transparente.',
      accentColor: 'text-blue-500',
      bgLight: 'bg-blue-50 border-blue-200/80',
      badgeColor: 'bg-blue-100 text-blue-600'
    },
    {
      icon: Scale,
      title: 'Justiça',
      subtitle: 'Defesa do Próximo',
      description: 'Lutamos para promover dignidade ao nosso semelhante.',
      accentColor: 'text-emerald-600',
      bgLight: 'bg-emerald-50 border-emerald-200/80',
      badgeColor: 'bg-emerald-100 text-emerald-700'
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      <SEO 
        title="Missão, Visão e Valores | YAH Hope"
        description="Conheça a Missão, Visão e os 4 Pilares de Valores da YAH Hope: Exemplo, Amor, Comunicação e Justiça no combate à vulnerabilidade e promoção da dignidade humana."
        keywords="missão YAH Hope, visão YAH Hope, valores YAH Hope, dignidade humana, Jesus exemplo, amor ao próximo, comunicação transparente, justiça social"
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
            O alicerce que guia nossas unidades, capacita líderes locais e direciona cada ação de transformação humana e comunitária.
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
              <span>Apoiar Esta Missão</span>
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

      {/* 3. Nossos Valores - Embasados em 4 Pilares */}
      <section className="py-20 md:py-28 bg-slate-50 font-gotham-regular">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-gotham-bold uppercase tracking-widest text-[#F49853] block mb-2">
              Princípios Fundamentais
            </span>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-heading font-black text-slate-900 tracking-tight mb-4">
              Nossos Valores
            </h2>
            <p className="text-slate-600 text-base md:text-lg font-gotham-regular">
              Os nossos valores estão embasados em <strong className="text-slate-900 font-gotham-bold">4 pilares</strong> essenciais:
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {valuePillars.map((pillar, idx) => {
              const IconComp = pillar.icon;
              return (
                <div 
                  key={idx}
                  className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between group"
                >
                  <div>
                    <div className="flex items-center justify-between mb-6">
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border ${pillar.bgLight} ${pillar.accentColor} group-hover:scale-110 transition-transform`}>
                        <IconComp size={28} />
                      </div>
                      <span className={`text-[10px] font-gotham-bold uppercase tracking-widest px-3 py-1 rounded-full ${pillar.badgeColor}`}>
                        Pilar #{idx + 1}
                      </span>
                    </div>

                    <h3 className="text-2xl font-heading font-black text-slate-900 mb-1 group-hover:text-[#F49853] transition-colors">
                      {pillar.title}
                    </h3>
                    <span className="text-xs font-gotham-bold text-slate-400 block mb-4">
                      {pillar.subtitle}
                    </span>

                    <p className="text-base text-slate-700 font-gotham-regular leading-relaxed">
                      {pillar.description}
                    </p>
                  </div>

                  <div className="pt-6 mt-6 border-t border-slate-100 flex items-center gap-2 text-xs font-gotham-bold text-slate-400">
                    <span className="w-2 h-2 rounded-full bg-[#F49853]"></span>
                    <span>YAH Hope • {pillar.title}</span>
                  </div>
                </div>
              );
            })}
          </div>

        </div>
      </section>

      {/* 4. Como Tornamos Isso Realidade em Campo */}
      <section className="py-20 bg-white font-gotham-regular">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-slate-900 text-white rounded-[2.5rem] p-8 sm:p-14 lg:p-16">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
              
              <div className="lg:col-span-5 space-y-4">
                <span className="text-xs font-gotham-bold uppercase tracking-widest text-[#F49853] block">
                  Da Teoria à Prática
                </span>
                <h2 className="text-3xl sm:text-4xl font-heading font-black leading-tight">
                  Como vivemos esses valores em cada unidade?
                </h2>
                <p className="text-slate-300 font-gotham-light text-sm sm:text-base leading-relaxed">
                  Para que a transformação seja real e duradoura, capacitamos os próprios moradores para serem os protagonistas da mudança em suas vilas e cidades.
                </p>
              </div>

              <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-6">
                
                <div className="bg-white/5 border border-white/10 p-6 rounded-2xl">
                  <div className="w-10 h-10 rounded-xl bg-orange-500/20 text-[#F49853] flex items-center justify-center mb-4">
                    <Users2 size={20} />
                  </div>
                  <h4 className="font-gotham-bold text-white text-base mb-2">Liderança Local Ativa</h4>
                  <p className="text-xs text-slate-300 font-gotham-light leading-relaxed">
                    Treinamos líderes comunitários para aprender, ensinar e coordenar as unidades com autonomia cultural.
                  </p>
                </div>

                <div className="bg-white/5 border border-white/10 p-6 rounded-2xl">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-4">
                    <Sprout size={20} />
                  </div>
                  <h4 className="font-gotham-bold text-white text-base mb-2">Autossustentabilidade</h4>
                  <p className="text-xs text-slate-300 font-gotham-light leading-relaxed">
                    Atividades socioeconômicas e estruturas independentes que garantem o futuro das próximas gerações.
                  </p>
                </div>

                <div className="bg-white/5 border border-white/10 p-6 rounded-2xl">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center mb-4">
                    <ShieldCheck size={20} />
                  </div>
                  <h4 className="font-gotham-bold text-white text-base mb-2">Transparência Total</h4>
                  <p className="text-xs text-slate-300 font-gotham-light leading-relaxed">
                    Comunicação aberta e prestação de contas com rigor ético a cada mantenedor e parceiro.
                  </p>
                </div>

                <div className="bg-white/5 border border-white/10 p-6 rounded-2xl">
                  <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center mb-4">
                    <GraduationCap size={20} />
                  </div>
                  <h4 className="font-gotham-bold text-white text-base mb-2">Educação e Futuro</h4>
                  <p className="text-xs text-slate-300 font-gotham-light leading-relaxed">
                    Apoio escolar e bolsas universitárias para equipar mentes e abrir portas para o amanhã.
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
            Faça Parte Desta Transformação
          </span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-heading font-black text-slate-900 mb-6">
            Junte-se a nós para promover a dignidade humana.
          </h2>
          <p className="text-slate-600 font-gotham-light text-base md:text-lg mb-8 max-w-2xl mx-auto">
            Seja através de contribuições mensais, apadrinhamento ou parcerias, você ajuda a capacitar líderes locais e salvar vidas da desnutrição.
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
