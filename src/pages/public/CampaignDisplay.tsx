import React from 'react';
import { useFundraising } from '../../contexts/FundraisingContext';
import { cn } from '../../lib/utils';
import { CheckCircle2, Heart } from 'lucide-react';

export function CampaignDisplay() {
  const { campaign } = useFundraising();
  const progressPercentage = Math.min((campaign.current_amount / campaign.target_amount) * 100, 100);

  // URL que o QR Code apontará (a página de doação oficial)
  const donationUrl = 'https://yahhope.com/campanha';
  
  // Usando cor preta no QR Code para garantir a melhor leitura possível
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(donationUrl)}&color=000000&bgcolor=ffffff`;

  return (
    <div 
      className="h-screen w-screen flex flex-col items-center justify-between py-10 px-8 relative overflow-hidden bg-brand-green"
      style={{
        backgroundImage: `url('https://static.wixstatic.com/media/bd919d_bed3073991f74b9ebe78f14e8b11c13c~mv2.jpg/v1/fill/w_3000,h_1175,fp_0.50_0.49,q_90,enc_avif,quality_auto/IMG_6252.jpg')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      }}
    >
      {/* Background Elements */}
      <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-emerald-400 via-transparent to-transparent z-0" />

      <div className="w-full max-w-7xl mx-auto z-10 flex flex-col items-center justify-center flex-shrink-0 mt-4 mb-16">
        <h1 className="font-heading text-5xl md:text-6xl font-black text-white tracking-tight drop-shadow-2xl text-center uppercase tracking-[0.1em] transform scale-x-110">
          Participe
        </h1>
      </div>

      <div className="w-full max-w-7xl mx-auto z-10 grid grid-cols-1 lg:grid-cols-3 gap-8 items-center flex-grow py-6">
        
        <div className="lg:col-span-2 h-full flex flex-col justify-between bg-slate-950/70 backdrop-blur-2xl p-8 lg:p-10 rounded-[2.5rem] border border-white/10 shadow-2xl">
          <div>
            <h2 className="text-3xl md:text-4xl font-heading font-black text-white mb-6 drop-shadow-md tracking-wide">
              Transforme esperança em dignidade
            </h2>
            <div className="space-y-4">
              <p className="text-base md:text-lg text-emerald-100/90 font-medium leading-relaxed text-justify">
                Em muitos lugares, famílias enfrentam diariamente a falta do básico: alimentação, acesso à educação e oportunidades para reconstruir sua realidade. A YAH Hope atua diretamente em comunidades de extrema vulnerabilidade social, caminhando ao lado da população local para gerar transformação verdadeira e duradoura.
              </p>
              <p className="text-base md:text-lg text-emerald-100/90 font-medium leading-relaxed hidden md:block text-justify">
                Cada doação representa mais do que um valor — ela se transforma em alimento, cuidado, desenvolvimento e esperança para quem mais precisa.
              </p>
              <p className="text-base md:text-lg text-white font-bold leading-relaxed hidden md:block text-justify">
                Ao contribuir, você se torna parte dessa missão de restaurar dignidade e construir um futuro possível para famílias inteiras.
              </p>
            </div>
          </div>

          <div className="mt-8">
            <div className="flex justify-between items-end mb-6 text-white">
              <div>
                <p className="text-emerald-200/80 uppercase tracking-widest font-bold mb-2">Objetivo</p>
                <p className="text-3xl font-bold opacity-80">R$ {campaign.target_amount.toLocaleString('pt-BR')}</p>
              </div>
              <div className="text-right">
                <p className="text-emerald-200/80 uppercase tracking-widest font-bold mb-2">Arrecadado</p>
                <p className="text-5xl font-black text-brand-orange drop-shadow-lg">{Math.round(progressPercentage)}%</p>
              </div>
            </div>

            {/* Giant Progress Bar */}
            <div className="relative pt-8 pb-12">
              <div className="h-8 bg-black/20 rounded-full overflow-hidden relative z-10 backdrop-blur-sm border border-white/10">
                <div 
                  className="h-full bg-gradient-to-r from-emerald-500 to-emerald-300 rounded-full transition-all duration-1000 ease-out relative"
                  style={{ width: `${progressPercentage}%` }}
                >
                  <div className="absolute inset-0 bg-white/20 w-full animate-[shimmer_2s_infinite]" />
                </div>
              </div>

              {/* Milestones Markers */}
              {campaign.milestones.map((m) => {
                const percent = (m.target_amount / campaign.target_amount) * 100;
                const isReached = campaign.current_amount >= m.target_amount;
                return (
                  <div 
                    key={m.id} 
                    className="absolute top-4 flex flex-col items-center -ml-4"
                    style={{ left: `${percent}%` }}
                  >
                    <div className={cn(
                      "w-8 h-8 rounded-full border-4 shadow-xl flex items-center justify-center z-20 transition-all",
                      isReached ? "bg-emerald-400 border-white scale-110" : "bg-slate-800 border-slate-600"
                    )}>
                      {isReached && <CheckCircle2 size={16} className="text-emerald-900" />}
                    </div>
                    <div className="absolute top-12 w-32 text-center drop-shadow-md">
                      <p className={cn(
                        "text-sm font-black uppercase tracking-tight", 
                        isReached ? "text-emerald-300" : "text-slate-400"
                      )}>
                        {m.title}
                      </p>
                      <p className={cn("text-xs font-bold mt-1", isReached ? "text-white" : "text-slate-500")}>
                        R$ {m.target_amount/1000}k
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Side: QR Code Area */}
        <div className="bg-slate-950/70 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] p-8 text-center shadow-2xl flex flex-col items-center justify-center transform lg:scale-105 relative z-20 self-stretch">
          <div className="absolute -top-5 bg-brand-orange text-white font-black uppercase tracking-widest px-6 py-1.5 rounded-full shadow-lg text-sm">
            Apoie Agora
          </div>
          
          <h2 className="text-2xl font-black text-white mb-1 mt-3">Escaneie para Doar</h2>
          <p className="text-emerald-100/90 mb-6 text-sm font-medium px-4">Aponte a câmera do celular e faça parte dessa transformação.</p>
          
          <div className="bg-white p-3 rounded-3xl shadow-inner border-4 border-white/20">
            <img 
              src={qrCodeUrl} 
              alt="QR Code para Doação" 
              className="w-48 h-48 rounded-2xl"
              crossOrigin="anonymous"
            />
          </div>
        </div>

      </div>

      {/* Large Logo at the Bottom */}
      <div className="w-full z-10 flex justify-center flex-shrink-0">
        <img src="/Logo+icone.png" alt="YAH Hope" className="h-24 md:h-28 object-contain drop-shadow-2xl" />
      </div>
    </div>
  );
}
