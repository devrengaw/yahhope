import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Heart, 
  ArrowRight, 
  ShieldCheck, 
  Users, 
  MapPin, 
  Target, 
  Award,
  Droplets,
  GraduationCap,
  Activity,
  Smile
} from 'lucide-react';
import { SEO } from '../../components/common/SEO';
import { useDonationModal } from '../../contexts/DonationModalContext';
import { useLanguage } from '../../contexts/LanguageContext';

export function AboutUs() {
  const { openDonationModal } = useDonationModal();
  const { tr } = useLanguage();

  return (
    <div className="min-h-screen bg-white">
      <SEO 
        title={tr('Sobre Nós | YAH Hope - Fé em Ação e Dignidade Humana', 'About Us | YAH Hope - Faith in Action & Human Dignity')}
        description={tr(
          'Conheça a YAH Hope, nossa história, pilares de atuação e leia o nosso Manifesto oficial. Transformamos realidades através da nutrição, educação e dignidade em Moçambique e no Brasil.',
          'Learn about YAH Hope, our story, core pillars, and read our official Manifesto. We transform lives through nutrition, education, and dignity in Mozambique and Brazil.'
        )}
        keywords="sobre YAH Hope, manifesto YAH Hope, ONG Moçambique, ajuda humanitária, nutrição infantil, dignidade humana"
        canonical="https://yahhope.com/sobre-nos"
        ogImage="https://yahhope.com/login_bg_real.jpg"
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "AboutPage",
          "name": "Sobre Nós | YAH Hope - Fé em Ação e Dignidade Humana",
          "url": "https://yahhope.com/sobre-nos",
          "description": "Conheça a YAH Hope, nossa história, pilares de atuação e o Manifesto oficial no combate à desnutrição infantil em Moçambique e no Brasil.",
          "mainEntity": {
            "@type": "NGO",
            "name": "YAH Hope",
            "url": "https://yahhope.com",
            "logo": "https://yahhope.com/logo.png",
            "foundingLocation": "Brasil",
            "areaServed": ["Moçambique", "Brasil"]
          }
        }}
      />

      {/* 1. Hero Section */}
      <section className="relative pt-32 pb-20 md:pt-40 md:pb-28 bg-[#0F172A] text-white overflow-hidden font-gotham-regular">
        <img 
          src="/login_bg_real.jpg" 
          alt="Comunidade acolhida pela YAH Hope" 
          fetchPriority="high"
          className="absolute inset-0 w-full h-full object-cover object-center filter brightness-75 contrast-105"
        />
        {/* Gradients */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0F172A] via-[#0F172A]/70 to-[#0F172A]/85"></div>
        <div className="absolute inset-0 bg-gradient-to-r from-[#0F172A]/80 via-transparent to-[#0F172A]/80"></div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center md:text-left">
          <div className="max-w-3xl">
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-heading font-black tracking-tight leading-tight text-white mb-6">
              {tr('Guardiões da', 'Guardians of')} <br className="hidden sm:inline" />
              <span className="text-[#F49853]">{tr('Dignidade Humana', 'Human Dignity')}</span>
            </h1>

            <p className="text-base sm:text-lg md:text-xl text-slate-200 font-gotham-light leading-relaxed mb-8">
              {tr(
                'A YAH Hope é uma iniciativa da YAH Church nascida para transformar realidades de extrema vulnerabilidade em histórias de esperança, resiliência e autonomia. Onde muitos veem impossibilidade, nós enxergamos futuros preciosos.',
                'YAH Hope is an initiative of YAH Church born to transform realities of extreme vulnerability into stories of hope, resilience, and self-reliance. Where many see impossibility, we see precious futures.'
              )}
            </p>

            <div className="flex flex-wrap items-center gap-4 justify-center md:justify-start">
              <button
                onClick={() => openDonationModal()}
                className="bg-[#F49853] hover:bg-[#e0853d] text-white px-7 py-3.5 rounded-full font-gotham-bold text-sm tracking-wide shadow-lg hover:shadow-[#F49853]/40 transition-all flex items-center gap-2 cursor-pointer"
              >
                <span>{tr('Apoiar Essa Causa', 'Support This Cause')}</span>
                <Heart size={16} className="fill-white" />
              </button>

              <Link
                to="/missao-visao-valores"
                className="bg-white/10 hover:bg-white/20 text-white border border-white/20 px-6 py-3.5 rounded-full font-gotham-bold text-sm tracking-wide transition-all flex items-center gap-2"
              >
                <span>{tr('Missão, Visão e Valores', 'Mission, Vision & Values')}</span>
                <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Quem Somos & Contexto Institucional */}
      <section className="py-20 md:py-28 bg-white font-gotham-regular">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
            
            {/* Left Column: Visual Image Grid */}
            <div className="lg:col-span-6 relative">
              <div className="relative rounded-[2.5rem] overflow-hidden shadow-2xl border-4 border-slate-50">
                <img 
                  src="https://hope.yahchurch.com/wp-content/uploads/2025/09/HOPE-ALFACES.avif" 
                  alt="Ações sociais e comunitárias da YAH Hope" 
                  className="w-full h-[420px] sm:h-[480px] object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent"></div>
                <div className="absolute bottom-6 left-6 right-6 text-white">
                  <div className="flex items-center gap-2 text-xs font-gotham-bold uppercase tracking-wider text-[#F49853] mb-1">
                    <MapPin size={14} />
                    <span>{tr('Nampula, Moçambique & Brasil', 'Nampula, Mozambique & Brazil')}</span>
                  </div>
                  <h3 className="text-xl font-heading font-bold text-white">
                    {tr('Impacto real e duradouro no coração das comunidades', 'Real and lasting impact at the heart of communities')}
                  </h3>
                </div>
              </div>

              {/* Floating Stat Badge */}
              <div className="absolute -bottom-6 -right-2 sm:right-6 bg-white p-5 rounded-2xl shadow-xl border border-slate-100 flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-orange-50 text-[#F49853] flex items-center justify-center shrink-0">
                  <Users size={24} />
                </div>
                <div>
                  <span className="block text-2xl font-black text-slate-900 leading-none">100%</span>
                  <span className="text-xs text-slate-500 font-gotham-regular">{tr('Compromisso com cada vida', 'Commitment to every life')}</span>
                </div>
              </div>
            </div>

            {/* Right Column: Story Copy */}
            <div className="lg:col-span-6 space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-50 text-[#F49853] text-xs font-gotham-bold uppercase tracking-wider">
                <span>{tr('Nossa Origem e Identidade', 'Our Origin & Identity')}</span>
              </div>

              <h2 className="text-3xl sm:text-4xl font-heading font-black text-slate-900 leading-tight">
                {tr('Mais do que ajuda emergencial: construímos ', 'More than emergency relief: we build ')}<span className="text-[#F49853]">{tr('dignidade sustentável', 'sustainable dignity')}</span>.
              </h2>

              <p className="text-slate-600 leading-relaxed text-base sm:text-lg font-gotham-light">
                {tr(
                  'Nascida com a convicção inegociável de que a fé deve se traduzir em obras práticas e amor ativo, a ',
                  'Born with the unwavering conviction that faith must translate into practical deeds and active love, '
                )}
                <strong>YAH Hope</strong>
                {tr(
                  ' desenvolve programas integrados de assistência, saúde e capacitação.',
                  ' develops integrated assistance, healthcare, and empowerment programs.'
                )}
              </p>

              <p className="text-slate-600 leading-relaxed text-sm sm:text-base font-gotham-light">
                {tr(
                  'Atuamos de forma contínua em Nampula (Moçambique) — uma das regiões com os mais elevados índices de desnutrição crônica e extrema pobreza infantil —, bem como em comunidades vulneráveis. Nossos projetos não oferecem apenas soluções paliativas: fornecem alimentação clínica, abrem poços de água cristalina, garantem escolaridade, custeiam formações universitárias e equipam famílias para a autossuficiência econômica.',
                  'We operate continuously in Nampula (Mozambique)—one of the regions with the highest rates of chronic malnutrition and extreme child poverty—as well as in vulnerable communities. Our projects go beyond temporary relief: they provide clinical nutrition, drill clean water wells, support schooling, fund university scholarships, and equip families for economic self-sufficiency.'
                )}
              </p>

              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-100">
                <div className="p-4 rounded-2xl bg-slate-50">
                  <span className="block text-2xl font-black text-[#F49853] mb-1">+400</span>
                  <span className="text-xs font-gotham-bold text-slate-700 uppercase tracking-wide">{tr('Crianças Atendidas', 'Children Served')}</span>
                  <p className="text-[11px] text-slate-500 mt-1 font-gotham-light">{tr('Acompanhamento nutricional contínuo e exames médicos periódicos.', 'Ongoing nutritional monitoring and regular medical checkups.')}</p>
                </div>
                <div className="p-4 rounded-2xl bg-slate-50">
                  <span className="block text-2xl font-black text-emerald-600 mb-1">{tr('Poços & Água', 'Wells & Water')}</span>
                  <span className="text-xs font-gotham-bold text-slate-700 uppercase tracking-wide">{tr('Saúde Preventiva', 'Preventive Health')}</span>
                  <p className="text-[11px] text-slate-500 mt-1 font-gotham-light">{tr('Redução imediata de infecções e acesso a água limpa para vilarejos.', 'Immediate reduction in infections and clean water access for villages.')}</p>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 3. MANIFESTO YAH HOPE SECTION (Destaque Oficial) */}
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
        <div className="absolute inset-0 bg-black/15 pointer-events-none"></div>

        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-center">
            
            {/* Left Column: MANI-FESTO Title */}
            <div className="lg:col-span-5 text-left">
              <h2 className="text-6xl sm:text-7xl md:text-8xl lg:text-8xl xl:text-9xl font-heading font-black text-white uppercase tracking-tight leading-[0.88] select-none drop-shadow-md">
                MANI-<br />FESTO
              </h2>
              <p className="text-2xl sm:text-3xl lg:text-4xl font-heading font-black text-slate-900 tracking-tight mt-3">
                YAH Hope
              </p>
              <div className="mt-8 pt-6 border-t border-white/20 max-w-xs hidden lg:block">
                <p className="text-xs text-white/90 font-gotham-light italic leading-relaxed">
                  {tr(
                    '"Onde há esperança, há dignidade, e onde há dignidade, há a promessa de uma população mais forte e resplandecente."',
                    '"Where there is hope, there is dignity, and where there is dignity, there is the promise of a stronger, brighter community."'
                  )}
                </p>
              </div>
            </div>

            {/* Right Column: Manifesto Copy */}
            <div className="lg:col-span-7 text-left space-y-5 bg-black/10 backdrop-blur-xs p-6 sm:p-10 rounded-3xl border border-white/15">
              <h3 className="font-heading font-bold text-lg sm:text-xl md:text-2xl text-white leading-snug drop-shadow-xs">
                {tr(
                  'Como encontrar futuro em cenários que para muitos são impossíveis de serem mudados?',
                  'How do we find a future in places that many believe are impossible to change?'
                )}
              </h3>

              <div className="space-y-4 text-xs sm:text-sm md:text-base font-gotham-regular text-white/95 text-justify leading-relaxed drop-shadow-xs">
                <p>
                  {tr(
                    'Na jornada da esperança, nasce a missão da YAH Hope. Somos mais do que uma organização social; somos guardiões da dignidade humana, tecendo histórias de transformação e resiliência em comunidades esquecidas.',
                    'On the journey of hope, the mission of YAH Hope was born. We are more than a social organization; we are guardians of human dignity, weaving stories of transformation and resilience in forgotten communities.'
                  )}
                </p>
                <p>
                  {tr(
                    'Acreditamos no poder transformador da esperança. Plantamos sementes através de ações conectadas a nutrição, geração de renda, escolaridade e entre tantas outras que são essenciais para o desenvolvimento humano. E assim, cultivamos um futuro em que cada indivíduo possa crescer independentemente das adversidades.',
                    'We believe in the transformative power of hope. We plant seeds through initiatives connected to nutrition, income generation, education, and many other areas essential for human development. In doing so, we cultivate a future where every individual can grow regardless of adversity.'
                  )}
                </p>
                <p>
                  {tr(
                    'Nosso compromisso com a dignidade vai além do presente. Adotamos uma abordagem sustentável em todas as nossas iniciativas, assegurando que o impacto positivo seja duradouro e capaz de transformar gerações futuras.',
                    'Our commitment to dignity goes beyond the present. We adopt a sustainable approach in all our initiatives, ensuring that our positive impact is lasting and capable of transforming future generations.'
                  )}
                </p>
                <p>
                  {tr(
                    'Trabalhamos para que cada pessoa não apenas sobreviva, mas viva com dignidade. Somos construtores de comunidades resilientes. Através de cada projeto executado juntamente com a população local, subimos um degrau na promoção da dignidade humana.',
                    'We work so that every person does not merely survive, but lives with dignity. We are builders of resilient communities. Through every project carried out alongside the local population, we take another step forward in promoting human dignity.'
                  )}
                </p>
                <p className="font-gotham-bold text-white pt-2 border-t border-white/20">
                  {tr(
                    'Junte-se a nós nessa jornada. A YAH Hope é mais do que uma organização; é um movimento, uma chama ardente que ilumina caminhos antes obscuros. Onde há esperança, há dignidade, e onde há dignidade, há a promessa de uma população mais forte e resplandecente.',
                    'Join us on this journey. YAH Hope is more than an organization; it is a movement, a burning flame that illuminates once-dark paths. Where there is hope, there is dignity, and where there is dignity, there is the promise of a stronger, brighter community.'
                  )}
                </p>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 4. Quatro Pilares de Atuação */}
      <section className="py-20 md:py-28 bg-slate-50 font-gotham-regular">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-gotham-bold uppercase tracking-widest text-[#F49853] block mb-2">
              {tr('Linhas Estratégicas', 'Strategic Pillars')}
            </span>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-heading font-black text-slate-900 tracking-tight mb-4">
              {tr('Nossos Pilares de Atuação', 'Our Pillars of Action')}
            </h2>
            <p className="text-slate-500 text-sm sm:text-base font-gotham-light">
              {tr(
                'Nenhuma transformação acontece de forma isolada. Atuamos em quatro eixos integrados para garantir desenvolvimento completo da infância à vida adulta.',
                'No transformation happens in isolation. We work across four integrated pillars to ensure holistic development from childhood to adulthood.'
              )}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Pilar 1 */}
            <div className="bg-white p-7 rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between group">
              <div>
                <div className="w-14 h-14 rounded-2xl bg-orange-100 text-[#F49853] flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <Activity size={26} />
                </div>
                <h3 className="text-lg font-heading font-bold text-slate-900 mb-2">
                  {tr('Nutrição & Saúde Infantil', 'Child Nutrition & Health')}
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 font-gotham-light leading-relaxed">
                  {tr(
                    'Monitoramento antropométrico de crianças de 0 a 5 anos com desnutrição aguda e crônica, fornecimento de dietas terapêuticas e acompanhamento de saúde integral.',
                    'Anthropometric monitoring of children aged 0–5 with acute and chronic malnutrition, provision of therapeutic diets, and comprehensive healthcare.'
                  )}
                </p>
              </div>
              <div className="pt-6 mt-6 border-t border-slate-100">
                <span className="text-[11px] font-gotham-bold text-[#F49853] uppercase tracking-wider flex items-center gap-1">
                  <span>{tr('Clínica YAH Hope', 'YAH Hope Clinic')}</span>
                </span>
              </div>
            </div>

            {/* Pilar 2 */}
            <div className="bg-white p-7 rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between group">
              <div>
                <div className="w-14 h-14 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <Droplets size={26} />
                </div>
                <h3 className="text-lg font-heading font-bold text-slate-900 mb-2">
                  {tr('Água Potável & Saneamento', 'Clean Water & Sanitation')}
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 font-gotham-light leading-relaxed">
                  {tr(
                    'Perfuração de poços artesianos profundos em comunidades isoladas, erradicando doenças transmitidas pela água e devolvendo tempo para as mulheres e crianças.',
                    'Drilling deep artesian wells in isolated communities, eradicating waterborne diseases and giving time back to women and children.'
                  )}
                </p>
              </div>
              <div className="pt-6 mt-6 border-t border-slate-100">
                <span className="text-[11px] font-gotham-bold text-blue-600 uppercase tracking-wider flex items-center gap-1">
                  <span>{tr('Poços Comunitários', 'Community Wells')}</span>
                </span>
              </div>
            </div>

            {/* Pilar 3 */}
            <div className="bg-white p-7 rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between group">
              <div>
                <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <GraduationCap size={26} />
                </div>
                <h3 className="text-lg font-heading font-bold text-slate-900 mb-2">
                  {tr('Educação & Bolsas Universitárias', 'Education & University Scholarships')}
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 font-gotham-light leading-relaxed">
                  {tr(
                    'Financiamento de bolsas integrais para jovens talentosos que não teriam recursos para o ensino superior, formando os novos líderes e médicos do próprio país.',
                    'Funding full scholarships for talented young people who would otherwise lack resources for higher education, training the next leaders and doctors of their own nation.'
                  )}
                </p>
              </div>
              <div className="pt-6 mt-6 border-t border-slate-100">
                <span className="text-[11px] font-gotham-bold text-emerald-600 uppercase tracking-wider flex items-center gap-1">
                  <span>{tr('Futuro e Liderança', 'Future & Leadership')}</span>
                </span>
              </div>
            </div>

            {/* Pilar 4 */}
            <div className="bg-white p-7 rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between group">
              <div>
                <div className="w-14 h-14 rounded-2xl bg-purple-100 text-purple-600 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <Smile size={26} />
                </div>
                <h3 className="text-lg font-heading font-bold text-slate-900 mb-2">
                  {tr('Dignidade Familiar & Renda', 'Family Dignity & Income')}
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 font-gotham-light leading-relaxed">
                  {tr(
                    'Capacitação profissional, hortas comunitárias e oficinas de costura para mães e famílias locais, rompendo o ciclo intergeracional da pobreza extrema.',
                    'Vocational training, community gardens, and sewing workshops for mothers and local families, breaking the intergenerational cycle of extreme poverty.'
                  )}
                </p>
              </div>
              <div className="pt-6 mt-6 border-t border-slate-100">
                <span className="text-[11px] font-gotham-bold text-purple-600 uppercase tracking-wider flex items-center gap-1">
                  <span>{tr('Autonomia Econômica', 'Economic Self-Reliance')}</span>
                </span>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* 5. Transparência & Governança */}
      <section className="py-16 md:py-20 bg-white font-gotham-regular border-t border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-slate-900 text-white rounded-[2.5rem] p-8 sm:p-12 lg:p-16 relative overflow-hidden">
            <div className="max-w-2xl relative z-10">
              <span className="text-xs font-gotham-bold uppercase tracking-widest text-[#F49853] block mb-3">
                {tr('Integridade Inegociável', 'Non-Negotiable Integrity')}
              </span>
              <h2 className="text-3xl sm:text-4xl font-heading font-black mb-4">
                {tr('Como garantimos a transparência de cada recurso doado?', 'How do we ensure transparency for every donated resource?')}
              </h2>
              <p className="text-slate-300 font-gotham-light text-sm sm:text-base leading-relaxed mb-8">
                {tr(
                  'Toda contribuição confiada à YAH Hope é gerida com extremo rigor ético. Nossos mantenedores têm acesso a um portal exclusivo com prestação de contas, laudos de evolução médica das crianças assistidas e relatórios das obras no terreno.',
                  'Every contribution entrusted to YAH Hope is managed with strict ethical rigor. Our supporters have access to an exclusive portal with financial accountability, medical progress reports for assisted children, and field work updates.'
                )}
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                <div className="flex items-center gap-3">
                  <ShieldCheck className="text-[#F49853] shrink-0" size={20} />
                  <span className="text-xs text-slate-200 font-medium">{tr('Auditoria Interna & Externa', 'Internal & External Audit')}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Target className="text-emerald-400 shrink-0" size={20} />
                  <span className="text-xs text-slate-200 font-medium">{tr('Impacto Mensurável Real', 'Real Measurable Impact')}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Award className="text-blue-400 shrink-0" size={20} />
                  <span className="text-xs text-slate-200 font-medium">{tr('Portal do Doador Ativo', 'Active Supporter Portal')}</span>
                </div>
              </div>

              <div className="flex flex-wrap gap-4">
                <Link
                  to="/missao-visao-valores"
                  className="bg-[#F49853] hover:bg-[#e0853d] text-white px-6 py-3 rounded-full font-gotham-bold text-xs uppercase tracking-wider transition-all inline-flex items-center gap-2"
                >
                  <span>{tr('Conhecer Nossos Valores', 'Explore Our Values')}</span>
                  <ArrowRight size={14} />
                </Link>
                <Link
                  to="/projetos"
                  className="bg-white/10 hover:bg-white/20 text-white border border-white/20 px-6 py-3 rounded-full font-gotham-bold text-xs uppercase tracking-wider transition-all inline-flex items-center gap-2"
                >
                  <span>{tr('Ver Todos os Projetos', 'View All Projects')}</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. Call To Action Final */}
      <section className="py-20 bg-slate-50 text-center font-gotham-regular">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <span className="text-[#F49853] font-gotham-bold text-xs uppercase tracking-widest block mb-3">
            {tr('Faça Parte da Nossa História', 'Be Part of Our Story')}
          </span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-heading font-black text-slate-900 mb-6">
            {tr('A esperança se torna real quando agimos juntos.', 'Hope becomes real when we act together.')}
          </h2>
          <p className="text-slate-600 font-gotham-light text-base md:text-lg mb-8 max-w-2xl mx-auto">
            {tr(
              'Sua doação mensal ou pontual salva crianças da desnutrição aguda, financia poços de água potável e constrói futuros com dignidade.',
              'Your monthly or one-time gift saves children from acute malnutrition, funds clean water wells, and builds futures with dignity.'
            )}
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <button
              onClick={() => openDonationModal()}
              className="bg-[#F49853] hover:bg-[#e0853d] text-white px-8 py-4 rounded-full font-gotham-bold text-sm tracking-wide shadow-lg hover:shadow-[#F49853]/40 transition-all flex items-center gap-2 cursor-pointer"
            >
              <span>{tr('Apoiar Agora', 'Support Now')}</span>
              <Heart size={18} className="fill-white" />
            </button>
            <Link
              to="/mantenedor"
              className="bg-white hover:bg-slate-100 text-slate-800 border border-slate-200 px-8 py-4 rounded-full font-gotham-bold text-sm tracking-wide transition-all"
            >
              <span>{tr('Seja Mantenedor Mensal', 'Become a Monthly Supporter')}</span>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
