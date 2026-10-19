import React, { useEffect } from 'react';
import { 
  Heart, 
  Lock, 
  ShieldCheck 
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
    <div className="min-h-screen bg-[#070B12] text-slate-100 antialiased selection:bg-[#F49853] selection:text-white relative overflow-x-hidden">
      <SEO 
        title="Um convite para levar esperança | YAH Hope" 
        description="Há muitas formas de fazer parte da vida de alguém. Hoje, queremos convidar você a fazer parte da YAH Hope."
      />

      {/* Mesma foto de fundo oficial da tela de login com overlay suave e nítido */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <img
          src="/login_bg_real.jpg"
          alt="Crianças sorrindo, YAH Hope"
          className="w-full h-full object-cover object-center scale-100"
        />
        {/* Overlay equilibrado idêntico à atmosfera da tela de login */}
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950/75 via-slate-950/65 to-slate-950/85" />
        <div className="absolute inset-0 bg-orange-950/10 mix-blend-overlay" />
      </div>

      {/* Conteúdo da Página */}
      <div className="relative z-10 flex flex-col min-h-screen">
        
        {/* Topo Limpo: Apenas o Logo Centralizado (Sem textos, sem menus, sem botões) */}
        <header className="py-6 px-4 border-b border-white/10 bg-black/25 backdrop-blur-md flex items-center justify-center">
          <img 
            src="/logo.png" 
            alt="YAH Hope" 
            className="h-9 sm:h-11 w-auto object-contain drop-shadow-md"
          />
        </header>

        {/* Artigo com o Texto Completo Solicitado */}
        <main className="max-w-3xl mx-auto px-4 sm:px-6 py-12 sm:py-16 flex-1">
          <article className="space-y-10 text-left">
            
            {/* Bloco 1: Título Principal direto (Sem balão, sem nada no lugar) */}
            <div className="space-y-6">
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight leading-[1.15] drop-shadow-sm">
                Um convite para levar esperança.
              </h1>

              <div className="space-y-4 text-base sm:text-lg text-slate-200 leading-relaxed font-normal">
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
              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight drop-shadow-sm">
                Cuidar hoje. Construir possibilidades para o amanhã.
              </h2>
              
              <div className="space-y-4 text-base sm:text-lg text-slate-200 leading-relaxed font-normal">
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
              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight drop-shadow-sm">
                A esperança precisa de continuidade. Seu apoio ajuda a construí-la.
              </h2>

              <p className="text-base sm:text-lg text-slate-200 leading-relaxed font-normal">
                Uma contribuição mensal permite cuidar do presente e planejar o que vem depois com mais segurança. Ela ajuda a dar continuidade ao trabalho e cria condições para que a YAH Hope alcance mais pessoas.
              </p>

              <p className="text-base sm:text-lg text-white font-medium">
                Você pode fazer parte dessa história de duas formas:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                {/* Opção 1: Mantenedor */}
                <div className="p-5 rounded-2xl bg-white/[0.08] border border-white/15 backdrop-blur-md space-y-2">
                  <div className="w-8 h-8 rounded-xl bg-[#F49853]/25 text-[#F49853] flex items-center justify-center font-bold text-sm">
                    1
                  </div>
                  <h3 className="text-base font-bold text-white">Como mantenedor do projeto</h3>
                  <p className="text-sm text-slate-300 leading-relaxed">
                    Contribuindo mensalmente para o trabalho da YAH Hope como um todo, apoiando suas ações e seu crescimento.
                  </p>
                </div>

                {/* Opção 2: Padrinho / Madrinha */}
                <div className="p-5 rounded-2xl bg-white/[0.08] border border-white/15 backdrop-blur-md space-y-2">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/25 text-emerald-400 flex items-center justify-center font-bold text-sm">
                    2
                  </div>
                  <h3 className="text-base font-bold text-white">Como padrinho ou madrinha de uma criança</h3>
                  <p className="text-sm text-slate-300 leading-relaxed">
                    Assumindo uma contribuição mensal por meio do apadrinhamento e participando mais de perto dessa caminhada de cuidado.
                  </p>
                </div>
              </div>

              <p className="text-base sm:text-lg text-slate-200 leading-relaxed font-normal pt-1">
                Em qualquer uma dessas escolhas, você se une a uma rede de pessoas que ajudam a tornar esse trabalho possível.
              </p>
            </div>

            {/* Bloco 4: Você faz parte e acompanha essa história. */}
            <div className="space-y-4 pt-4 border-t border-white/10">
              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight drop-shadow-sm">
                Você faz parte e acompanha essa história.
              </h2>

              <div className="space-y-4 text-base sm:text-lg text-slate-200 leading-relaxed font-normal">
                <p>
                  Queremos que você saiba como o projeto está caminhando e o que seu apoio ajuda a construir.
                </p>

                <div className="p-5 rounded-2xl bg-amber-500/15 border border-amber-500/30 backdrop-blur-md space-y-2 text-slate-100">
                  <p className="text-sm sm:text-base leading-relaxed">
                    Mantenedores, padrinhos e madrinhas têm acesso a um portal exclusivo, onde podem receber notícias das crianças, acompanhar as atualizações do projeto e consultar suas doações. Também recebem em primeira mão as novidades da YAH Hope.
                  </p>
                </div>

                <p>
                  É uma forma de manter você por perto, compartilhar os próximos passos e cultivar uma relação de confiança ao longo do tempo.
                </p>
              </div>
            </div>

            {/* Bloco 5: Vamos levar esperança juntos? */}
            <div className="space-y-4 pt-4 border-t border-white/10">
              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight drop-shadow-sm">
                Vamos levar esperança juntos?
              </h2>

              <div className="space-y-4 text-base sm:text-lg text-slate-200 leading-relaxed font-normal">
                <p>
                  Nosso convite é para que você escolha uma forma de participar e caminhe com a YAH Hope.
                </p>
                <p className="text-white font-medium text-lg sm:text-xl">
                  Com seu apoio, queremos continuar cuidando das crianças que já acompanhamos, fortalecer suas famílias e abrir espaço para que essa rede alcance mais vidas.
                </p>
              </div>
            </div>

          </article>

          {/* Caixa de Doação / Apadrinhamento: Limpa, Sem Barras Externas, Centralizada */}
          <section className="mt-14 mb-16 flex flex-col items-center justify-center">
            <HomeDonationCard 
              initialTab="sponsorship" 
              className="w-full max-w-md shadow-2xl mx-auto" 
            />
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

        {/* Footer Oficial do Site Principal */}
        <PublicFooter />

      </div>
    </div>
  );
}
