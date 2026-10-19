import React, { useEffect } from 'react';
import { 
  Heart, 
  Sparkles, 
  Lock, 
  ShieldCheck, 
  CheckCircle2, 
  Users, 
  LayoutDashboard 
} from 'lucide-react';
import { SEO } from '../../components/common/SEO';
import { cn } from '../../lib/utils';
import { 
  recordCampaignClick, 
  detectTrafficSource 
} from '../../services/campaignTrackingService';
import { trackPageView } from '../../services/analyticsService';
import { HomeDonationCard } from '../../components/public/HomeDonationCard';

export function CampaignHotsite() {
  useEffect(() => {
    // Registra a visualização do hotsite de mantenedores
    trackPageView('/campanha-yahhope', 'Hotsite - Um convite para levar esperança | YAH Hope');
    recordCampaignClick('Visualização do Hotsite de Mantenedores', 'page_view', {
      source: detectTrafficSource(),
      referrer: document.referrer
    });
  }, []);

  return (
    <div className="min-h-screen bg-[#090D16] text-slate-100 antialiased selection:bg-[#F49853] selection:text-white relative overflow-x-hidden">
      <SEO 
        title="Um convite para levar esperança | YAH Hope" 
        description="Há muitas formas de fazer parte da vida de alguém. Hoje, queremos convidar você a fazer parte da YAH Hope."
      />

      {/* Foto de Fundo Oficial da Página de Login com Overlay Escuro de Alto Contraste */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <img
          src="/login_bg_real.jpg"
          alt="Crianças sorrindo, YAH Hope"
          className="w-full h-full object-cover object-center filter brightness-50 contrast-110"
        />
        {/* Overlay escuro em camadas para garantir legibilidade absoluta do texto */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#090D16]/95 via-[#090D16]/90 to-[#090D16]/98" />
        <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" />
      </div>

      {/* Conteúdo da Página */}
      <div className="relative z-10 flex flex-col min-h-screen">
        
        {/* Topo Limpo: Apenas Logo YAH Hope e Badge Suave (Sem barra urgente, sem menus) */}
        <header className="py-6 px-4 sm:px-8 border-b border-white/10 bg-black/30 backdrop-blur-md">
          <div className="max-w-3xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#F49853] to-[#ffb175] flex items-center justify-center text-white shadow-lg shadow-[#F49853]/25">
                <Heart className="w-5 h-5 fill-white" />
              </div>
              <div>
                <div className="text-lg font-black tracking-tight text-white font-gotham-bold leading-none">
                  YAH <span className="text-[#F49853]">HOPE</span>
                </div>
                <p className="text-[10px] font-bold tracking-wider text-slate-400 uppercase mt-0.5">
                  Dignidade & Transformação
                </p>
              </div>
            </div>

            <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/10 text-amber-200 text-xs font-bold border border-white/15 backdrop-blur-sm">
              <Sparkles className="w-3.5 h-3.5 text-[#F49853]" />
              <span>Convite Especial</span>
            </div>
          </div>
        </header>

        {/* Artigo com o Texto Completo Solicitado */}
        <main className="max-w-3xl mx-auto px-4 sm:px-6 py-12 sm:py-16 flex-1">
          <article className="space-y-10 text-left">
            
            {/* Bloco 1: Abertura e Título */}
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-orange-500/15 border border-orange-500/30 text-amber-300 text-xs font-bold">
                <Heart className="w-3.5 h-3.5 text-[#F49853] fill-current" />
                <span>Faça parte desta caminhada</span>
              </div>

              {/* Título Principal */}
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight leading-[1.15]">
                Um convite para levar esperança.
              </h1>

              <div className="space-y-4 text-base sm:text-lg text-slate-300 leading-relaxed font-normal">
                <p>
                  Há muitas formas de fazer parte da vida de alguém. Hoje, queremos convidar você a fazer parte da YAH Hope.
                </p>
                <p>
                  Atualmente, acompanhamos 10 crianças que enfrentam a desnutrição infantil. Nosso cuidado também alcança suas famílias, que recebem atendimento e orientação, porque cuidar de uma criança envolve olhar para quem caminha com ela todos os dias.
                </p>
                <p>
                  Queremos continuar presentes na vida dessas famílias e alcançar outras que também precisam desse apoio. E você pode caminhar com a gente.
                </p>
              </div>
            </div>

            {/* Bloco 2: Cuidar hoje. Construir possibilidades para o amanhã. */}
            <div className="space-y-4 pt-4 border-t border-white/10">
              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                Cuidar hoje. Construir possibilidades para o amanhã.
              </h2>
              
              <div className="space-y-4 text-base sm:text-lg text-slate-300 leading-relaxed font-normal">
                <p>
                  Cada criança tem uma história, vínculos e um futuro a descobrir. Nosso compromisso começa com suas necessidades de hoje e se estende às oportunidades que ela e sua família podem encontrar ao longo do caminho.
                </p>
                <p>
                  Por isso, nossos próximos passos incluem criar oficinas para ajudar as famílias a desenvolver habilidades e gerar renda, fortalecendo a autonomia e o sustento de suas casas.
                </p>
                <p>
                  Também estamos preparando uma nova frente de atuação: acompanhar jovens universitários e custear seus estudos, para que tenham apoio para seguir sua formação.
                </p>
                <p className="text-amber-200/90 font-medium">
                  São passos que queremos dar com responsabilidade, continuidade e pessoas ao nosso lado.
                </p>
              </div>
            </div>

            {/* Bloco 3: A esperança precisa de continuidade. Seu apoio ajuda a construí-la. */}
            <div className="space-y-5 pt-4 border-t border-white/10">
              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                A esperança precisa de continuidade. Seu apoio ajuda a construí-la.
              </h2>

              <p className="text-base sm:text-lg text-slate-300 leading-relaxed font-normal">
                Uma contribuição mensal permite cuidar do presente e planejar o que vem depois com mais segurança. Ela ajuda a dar continuidade ao trabalho e cria condições para que a YAH Hope alcance mais pessoas.
              </p>

              <p className="text-base sm:text-lg text-slate-200 font-medium">
                Você pode fazer parte dessa história de duas formas:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                {/* Opção 1: Mantenedor */}
                <div className="p-5 rounded-2xl bg-white/[0.06] border border-white/15 backdrop-blur-sm space-y-2">
                  <div className="w-8 h-8 rounded-xl bg-[#F49853]/20 text-[#F49853] flex items-center justify-center font-bold text-sm">
                    1
                  </div>
                  <h3 className="text-base font-bold text-white">Como mantenedor do projeto</h3>
                  <p className="text-sm text-slate-300 leading-relaxed">
                    Contribuindo mensalmente para o trabalho da YAH Hope como um todo, apoiando suas ações e seu crescimento.
                  </p>
                </div>

                {/* Opção 2: Padrinho / Madrinha */}
                <div className="p-5 rounded-2xl bg-white/[0.06] border border-white/15 backdrop-blur-sm space-y-2">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-sm">
                    2
                  </div>
                  <h3 className="text-base font-bold text-white">Como padrinho ou madrinha de uma criança</h3>
                  <p className="text-sm text-slate-300 leading-relaxed">
                    Assumindo uma contribuição mensal por meio do apadrinhamento e participando mais de perto dessa caminhada de cuidado.
                  </p>
                </div>
              </div>

              <p className="text-base sm:text-lg text-slate-300 leading-relaxed font-normal pt-1">
                Em qualquer uma dessas escolhas, você se une a uma rede de pessoas que ajudam a tornar esse trabalho possível.
              </p>
            </div>

            {/* Bloco 4: Você faz parte e acompanha essa história. */}
            <div className="space-y-4 pt-4 border-t border-white/10">
              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                Você faz parte e acompanha essa história.
              </h2>

              <div className="space-y-4 text-base sm:text-lg text-slate-300 leading-relaxed font-normal">
                <p>
                  Queremos que você saiba como o projeto está caminhando e o que seu apoio ajuda a construir.
                </p>

                <div className="p-5 rounded-2xl bg-amber-500/10 border border-amber-500/25 space-y-2 text-slate-200">
                  <p className="text-sm sm:text-base leading-relaxed">
                    <strong className="text-amber-300 font-bold">Portal exclusivo do mantenedor:</strong> Mantenedores, padrinhos e madrinhas têm acesso a um portal exclusivo, onde podem receber notícias das crianças, acompanhar as atualizações do projeto e consultar suas doações. Também recebem em primeira mão as novidades da YAH Hope.
                  </p>
                </div>

                <p>
                  É uma forma de manter você por perto, compartilhar os próximos passos e cultivar uma relação de confiança ao longo do tempo.
                </p>
              </div>
            </div>

            {/* Bloco 5: Vamos levar esperança juntos? */}
            <div className="space-y-4 pt-4 border-t border-white/10">
              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                Vamos levar esperança juntos?
              </h2>

              <div className="space-y-4 text-base sm:text-lg text-slate-300 leading-relaxed font-normal">
                <p>
                  Nosso convite é para que você escolha uma forma de participar e caminhe com a YAH Hope.
                </p>
                <p className="text-white font-medium text-lg sm:text-xl">
                  Com seu apoio, queremos continuar cuidando das crianças que já acompanhamos, fortalecer suas famílias e abrir espaço para que essa rede alcance mais vidas.
                </p>
              </div>
            </div>

          </article>

          {/* Caixa de Doação / Apoio Mensal: Posicionada Abaixo do Texto */}
          <section className="mt-14 mb-16 max-w-xl mx-auto">
            <div className="bg-[#F49853] text-white p-4 rounded-t-3xl text-center text-xs font-bold tracking-wider uppercase flex items-center justify-center gap-2 shadow-lg">
              <Heart className="w-4 h-4 fill-white animate-pulse" />
              <span>Escolha como apoiar e faça parte</span>
            </div>

            <div className="bg-white rounded-b-3xl shadow-2xl shadow-black/60 overflow-hidden text-slate-800">
              <HomeDonationCard initialTab="sponsorship" />
            </div>

            <div className="flex items-center justify-center gap-2 mt-4 text-[11px] text-slate-400 font-medium">
              <Lock size={12} className="text-slate-400" />
              <span>Ambiente seguro criptografado com tecnologia Stripe</span>
            </div>
          </section>

        </main>

        {/* Seção Oficial do Manifesto YAH Hope */}
        <section 
          className="py-20 md:py-24 text-white relative overflow-hidden border-t border-white/10"
          style={{ 
            backgroundColor: '#F49853', 
            backgroundImage: 'url("https://hope.yahchurch.com/wp-content/uploads/2025/09/Pattern-1.png")',
            backgroundRepeat: 'repeat',
            backgroundSize: 'contain',
            backgroundPosition: 'center'
          }}
        >
          <div className="absolute inset-0 bg-black/15 pointer-events-none" />

          <div className="max-w-5xl mx-auto px-6 sm:px-8 relative z-10">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
              
              {/* Coluna Esquerda: Título MANI-FESTO */}
              <div className="lg:col-span-5 text-left">
                <h2 className="text-6xl sm:text-7xl md:text-8xl font-heading font-black text-white uppercase tracking-tight leading-[0.88] select-none drop-shadow-md">
                  MANI-<br />FESTO
                </h2>
                <p className="text-2xl sm:text-3xl font-heading font-black text-slate-900 tracking-tight mt-3">
                  YAH Hope
                </p>
              </div>

              {/* Coluna Direita: Texto Integral do Manifesto */}
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

        {/* Rodapé Limpo e Discreto */}
        <footer className="py-10 bg-black/40 border-t border-white/10 text-center text-xs text-slate-500">
          <div className="max-w-3xl mx-auto px-4 space-y-1.5">
            <p className="font-bold text-slate-300">YAH Hope • Dignidade & Transformação Humana</p>
            <p>© {new Date().getFullYear()} YAH Hope. Todos os direitos reservados.</p>
          </div>
        </footer>

      </div>
    </div>
  );
}
