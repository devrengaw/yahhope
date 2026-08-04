import { Link } from 'react-router-dom';
import { Heart, ArrowRight } from 'lucide-react';

export function Home() {
  return (
    <div className="bg-white min-h-screen font-gotham-regular text-[#334155] antialiased selection:bg-[#ff6600] selection:text-white">
      
      {/* Hero Section */}
      <section 
        className="relative overflow-hidden min-h-[65vh] flex flex-col justify-center items-center px-4"
        style={{ 
          backgroundColor: '#F66006', 
          backgroundImage: 'url("https://hope.yahchurch.com/wp-content/uploads/2025/09/Pattern-1.png")',
          backgroundRepeat: 'repeat',
          backgroundSize: 'contain',
          backgroundPosition: 'center'
        }}
      >
        {/* Soft dark overlay inside style block */}
        <div className="absolute inset-0 bg-black/10 pointer-events-none"></div>
        
        <div className="relative z-10 max-w-4xl mx-auto text-center flex flex-col items-center">
          <img 
            src="https://hope.yahchurch.com/wp-content/uploads/2025/09/Logo-1-1024x576.png" 
            alt="YAH Hope Logo" 
            className="w-full max-w-[320px] md:max-w-[450px] object-contain drop-shadow-xl animate-fade-in duration-1000"
          />
        </div>
      </section>

      {/* Manifesto Section */}
      <section className="py-16 md:py-24 bg-white overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            
            {/* Left Image Column */}
            <div className="relative flex justify-center animate-slide-in-up">
              <div className="relative max-w-md md:max-w-lg lg:max-w-full">
                {/* Decorative background border effect */}
                <div className="absolute -inset-4 bg-[#F66006]/10 rounded-[2.5rem] -rotate-3 scale-95 blur-sm"></div>
                <img 
                  src="https://hope.yahchurch.com/wp-content/uploads/2025/09/Foto-e1758835419873-827x1024.png" 
                  alt="Crianças YAH Hope" 
                  className="relative z-10 w-full rounded-[2rem] shadow-2xl border-4 border-white object-cover transform hover:scale-[1.02] transition-transform duration-500"
                />
              </div>
            </div>

            {/* Right Text Column */}
            <div className="flex flex-col space-y-6 lg:pl-4">
              <div className="max-w-md lg:max-w-xl">
                <img 
                  src="https://hope.yahchurch.com/wp-content/uploads/2025/09/A-esperanca-nao-chega-sozinha.png" 
                  alt="A esperança não chega sozinha" 
                  className="w-full max-w-[420px] object-contain mb-4"
                />
                
                <p className="text-lg md:text-xl text-slate-700 leading-relaxed font-gotham-light">
                  A YAH Hope nasceu para levar o Evangelho de forma prática, unindo{' '}
                  <span className="font-gotham-bold text-[#ff6600]">fé e ação</span>. 
                  Nossa missão é{' '}
                  <span className="font-gotham-bold text-[#ff6600]">transformar realidades</span>{' '}
                  através de projetos sociais que mudam o futuro das pessoas. E para isso, precisamos de você.
                </p>
              </div>

              <div className="pt-4">
                <Link 
                  to="/apoiador" 
                  className="inline-flex items-center justify-center bg-[#F66006] text-white font-gotham-bold px-8 py-4 rounded-full text-base md:text-lg shadow-lg hover:bg-[#e05300] hover:shadow-xl hover:scale-[1.03] active:scale-[0.98] transition-all duration-300 gap-3 group"
                >
                  <span>Seja um agente de esperança!</span>
                  <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Casa Nutri Section */}
      <section className="py-16 md:py-24 bg-[#F8FAFC]">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            
            {/* Left Column (Image) */}
            <div className="relative order-1 lg:order-1 flex justify-center">
              <div className="relative max-w-md md:max-w-lg lg:max-w-full">
                <div className="absolute -inset-4 bg-emerald-500/5 rounded-[2.5rem] rotate-3 scale-95 blur-sm"></div>
                <img 
                  src="https://hope.yahchurch.com/wp-content/uploads/2025/09/HOPE-ALFACES.avif" 
                  alt="Projeto Nutrição Infantil - Casa Nutri" 
                  className="relative z-10 w-full rounded-[2rem] shadow-2xl border-4 border-white object-cover transform hover:scale-[1.02] transition-transform duration-500"
                />
              </div>
            </div>

            {/* Right Column (Text) */}
            <div className="flex flex-col space-y-6 order-2 lg:order-2">
              <div>
                <span className="text-[#ff6600] font-gotham-bold tracking-widest uppercase text-sm block mb-1">
                  Projeto Nutrição Infantil
                </span>
                <h2 className="text-3xl md:text-4xl lg:text-5xl font-gotham-black text-slate-900 leading-tight">
                  Casa Nutri
                </h2>
              </div>

              <div className="space-y-4 text-slate-700 font-gotham-light text-base md:text-lg">
                <p>
                  Em Nampula, Moçambique, apoiamos{' '}
                  <span className="font-gotham-bold text-[#ff6600]">20 crianças em situação de desnutrição</span> com:
                </p>
                
                <ul className="list-disc pl-5 space-y-2 text-slate-600 font-gotham-regular text-sm md:text-base">
                  <li>Monitoramento nutricional e visitas domiciliares;</li>
                  <li>Orientação de higiene e saúde familiar;</li>
                  <li>Atividades produtivas: kits de sementes, oficinas de costura e incentivo ao esporte;</li>
                  <li>Perspectiva de expansão para um espaço lúdico e escolinha infantil.</li>
                </ul>

                <p className="font-gotham-bold text-[#ff6600] pt-4">Como você pode ajudar:</p>
                
                <ul className="list-disc pl-5 space-y-2 text-slate-600 font-gotham-regular text-sm md:text-base">
                  <li>Contribua para manter as vagas existentes e abrir novas;</li>
                  <li>Ore pelas crianças e famílias atendidas;</li>
                  <li>Compartilhe essa causa com sua rede.</li>
                </ul>
              </div>

              <div className="pt-4">
                <Link 
                  to="/apoiador" 
                  className="inline-flex items-center justify-center bg-[#F66006] text-white font-gotham-bold px-8 py-3.5 rounded-full text-base shadow-md hover:bg-[#e05300] hover:shadow-lg hover:scale-[1.02] transition-all duration-300 gap-2 group"
                >
                  <span>Envolva-se</span>
                  <Heart size={16} fill="currentColor" className="group-hover:scale-110 transition-transform" />
                </Link>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* University Support Section */}
      <section className="py-16 md:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            
            {/* Left Column (Text) */}
            <div className="flex flex-col space-y-6 order-2 lg:order-1">
              <div>
                <span className="text-[#ff6600] font-gotham-bold tracking-widest uppercase text-sm block mb-1">
                  Desenvolvimento e Futuro
                </span>
                <h2 className="text-3xl md:text-4xl lg:text-5xl font-gotham-black text-slate-900 leading-tight">
                  Projeto Apoio a Jovens Universitários
                </h2>
              </div>

              <div className="space-y-4 text-slate-700 font-gotham-light text-base md:text-lg">
                <p>
                  Apoiamos{' '}
                  <span className="font-gotham-bold text-[#ff6600]">5 jovens universitários</span> para que possam concluir seus estudos e alcançar novos horizontes.
                </p>
                
                <ul className="list-disc pl-5 space-y-2 text-slate-600 font-gotham-regular text-sm md:text-base">
                  <li>Mentoria profissional com especialistas da área de estudo;</li>
                  <li>Ajuda financeira para garantir a continuidade da graduação.</li>
                </ul>

                <p className="font-gotham-bold text-[#ff6600] pt-4">Como você pode ajudar:</p>
                
                <ul className="list-disc pl-5 space-y-2 text-slate-600 font-gotham-regular text-sm md:text-base">
                  <li>Seja um mantenedor mensal, garantindo que nenhum jovem abandone a faculdade por falta de recursos;</li>
                  <li>Ofereça mentoria profissional ou estágios;</li>
                  <li>Ore por cada estudante.</li>
                </ul>
              </div>

              <div className="pt-4">
                <Link 
                  to="/apoiador" 
                  className="inline-flex items-center justify-center bg-[#F66006] text-white font-gotham-bold px-8 py-3.5 rounded-full text-base shadow-md hover:bg-[#e05300] hover:shadow-lg hover:scale-[1.02] transition-all duration-300 gap-2 group"
                >
                  <span>Envolva-se</span>
                  <Heart size={16} fill="currentColor" className="group-hover:scale-110 transition-transform" />
                </Link>
              </div>
            </div>

            {/* Right Column (Image) */}
            <div className="relative order-1 lg:order-2 flex justify-center">
              <div className="relative max-w-md md:max-w-lg lg:max-w-full">
                <div className="absolute -inset-4 bg-[#F66006]/5 rounded-[2.5rem] -rotate-3 scale-95 blur-sm"></div>
                <img 
                  src="https://hope.yahchurch.com/wp-content/uploads/2025/09/IMG5.avif" 
                  alt="Projeto Apoio a Jovens Universitários" 
                  className="relative z-10 w-full rounded-[2rem] shadow-2xl border-4 border-white object-cover transform hover:scale-[1.02] transition-transform duration-500"
                />
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Participe Section */}
      <section className="py-16 md:py-24 bg-[#F8FAFC]">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            
            {/* Left Column (Image) */}
            <div className="flex justify-center">
              <div className="relative max-w-md md:max-w-lg lg:max-w-full">
                <img 
                  src="https://hope.yahchurch.com/wp-content/uploads/2025/09/PARTICIPE-DESTA-MISSAO-1.png" 
                  alt="Participe desta missão" 
                  className="relative z-10 w-full rounded-2xl object-cover hover:scale-[1.01] transition-transform duration-300"
                />
              </div>
            </div>

            {/* Right Column (CTAs and Progress Bar) */}
            <div className="flex flex-col space-y-8">
              <div>
                <h2 className="text-2xl md:text-3xl lg:text-4xl font-gotham-black text-slate-900 leading-tight">
                  A esperança só se torna realidade quando caminhamos juntos.
                </h2>
              </div>

              <div>
                <Link 
                  to="/apoiador" 
                  className="inline-flex items-center justify-center w-full md:w-auto bg-[#F66006] text-white font-gotham-bold px-10 py-5 rounded-full text-base md:text-lg shadow-lg hover:bg-[#e05300] hover:shadow-xl hover:scale-[1.03] active:scale-[0.98] transition-all duration-300 gap-3 group text-center uppercase"
                >
                  <span>Torne-se um apoiador agora!</span>
                  <Heart size={20} fill="currentColor" className="group-hover:animate-ping" />
                </Link>
              </div>

              {/* Progress Bar Container */}
              <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
                <span className="text-[#ff6600] font-gotham-bold tracking-wider text-xs md:text-sm uppercase block">
                  Total arrecadado
                </span>
                <img 
                  src="https://hope.yahchurch.com/wp-content/uploads/2025/09/Barra_Progresso-1-1024x142.png" 
                  alt="Barra de Progresso" 
                  className="w-full object-contain"
                />
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Footer Section */}
      <footer className="bg-white py-16 border-t border-slate-100 text-center">
        <div className="max-w-7xl mx-auto px-6 flex flex-col items-center space-y-6">
          <img 
            src="https://hope.yahchurch.com/wp-content/uploads/2025/09/Logo_Laranja-1024x511.png" 
            alt="Logo YAH Hope Laranja" 
            className="w-full max-w-[160px] md:max-w-[200px] object-contain opacity-90"
          />
          
          <div className="space-y-2 text-slate-500 font-gotham-light text-sm">
            <p className="font-gotham-regular">© 2025 - YAH Hope | Todos os direitos reservados.</p>
            <p>Desenvolvido por <span className="font-gotham-bold text-slate-600">Agência REC</span></p>
          </div>

          {/* Navigation link for application login */}
          <div className="pt-6 border-t border-slate-100 w-full max-w-md flex justify-center gap-6 text-xs font-gotham-bold text-slate-400">
            <Link to="/login" className="hover:text-[#ff6600] transition-colors">Entrar no Painel</Link>
            <span>•</span>
            <Link to="/politica-de-privacidade" className="hover:text-[#ff6600] transition-colors">Privacidade</Link>
            <span>•</span>
            <Link to="/termos-de-servico" className="hover:text-[#ff6600] transition-colors">Termos</Link>
          </div>
        </div>
      </footer>

    </div>
  );
}
