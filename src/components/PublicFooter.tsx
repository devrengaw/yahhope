import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Instagram, 
  Youtube, 
  Facebook, 
  Linkedin, 
  ShieldCheck, 
  CheckCircle2, 
  Clock 
} from 'lucide-react';

export function PublicFooter() {
  return (
    <footer className="bg-slate-900 text-white font-gotham-regular pt-16 pb-12 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10 lg:gap-12 pb-14">
          
          {/* Column 1: Organization Identity & Mission */}
          <div className="lg:col-span-5 space-y-4">
            <Link to="/" className="inline-block">
              <img 
                src="https://hope.yahchurch.com/wp-content/uploads/2025/09/Logo_Laranja-1024x511.png" 
                alt="YAH Hope Logo" 
                className="h-11 w-auto object-contain brightness-105"
              />
            </Link>
            <p className="text-slate-400 text-sm font-gotham-light max-w-sm leading-relaxed">
              Agência humanitária dedicada a erradicar a desnutrição infantil, fomentar a educação universitária e desenvolver comunidades em extrema vulnerabilidade.
            </p>
            <div className="pt-2 space-y-1.5 text-xs text-slate-400 font-gotham-light">
              <p className="flex items-center gap-2">
                <span className="font-gotham-bold text-slate-300">Presença:</span> Moçambique (Nampula) & Brasil (São Paulo)
              </p>
              <p className="flex items-center gap-2">
                <span className="font-gotham-bold text-slate-300">Contato:</span> contato@yahhope.org
              </p>
              <p className="text-slate-500">Organização da Sociedade Civil sem Fins Lucrativos</p>
            </div>

            {/* Social Media Links */}
            <div className="pt-3">
              <span className="text-xs font-gotham-bold uppercase tracking-wider text-slate-400 block mb-3">
                Siga a YAH Hope
              </span>
              <div className="flex items-center gap-3">
                <a href="https://instagram.com" target="_blank" rel="noreferrer" className="w-9 h-9 rounded-full bg-slate-800 hover:bg-[#F49853] text-white flex items-center justify-center transition-colors" aria-label="Instagram">
                  <Instagram size={17} />
                </a>
                <a href="https://youtube.com" target="_blank" rel="noreferrer" className="w-9 h-9 rounded-full bg-slate-800 hover:bg-[#F49853] text-white flex items-center justify-center transition-colors" aria-label="YouTube">
                  <Youtube size={17} />
                </a>
                <a href="https://facebook.com" target="_blank" rel="noreferrer" className="w-9 h-9 rounded-full bg-slate-800 hover:bg-[#F49853] text-white flex items-center justify-center transition-colors" aria-label="Facebook">
                  <Facebook size={17} />
                </a>
                <a href="https://linkedin.com" target="_blank" rel="noreferrer" className="w-9 h-9 rounded-full bg-slate-800 hover:bg-[#F49853] text-white flex items-center justify-center transition-colors" aria-label="LinkedIn">
                  <Linkedin size={17} />
                </a>
              </div>
            </div>
          </div>

          {/* Column 2: Navigation Links */}
          <div className="lg:col-span-3 space-y-3">
            <h3 className="text-sm font-bold uppercase tracking-wider text-white mb-4">
              Explorar
            </h3>
            <ul className="space-y-2.5 text-sm font-gotham-light text-slate-400">
              <li><Link to="/projetos" className="hover:text-[#F49853] transition-colors">Nossos Projetos</Link></li>
              <li><Link to="/campanha" className="hover:text-[#F49853] transition-colors">Formas de Doar</Link></li>
              <li><Link to="/campanha" className="hover:text-[#F49853] transition-colors">Campanhas Ativas</Link></li>
              <li><Link to="/blog" className="hover:text-[#F49853] transition-colors">Notícias & Histórias</Link></li>
              <li><Link to="/loja" className="hover:text-[#F49853] transition-colors">Loja Solidária</Link></li>
              <li><Link to="/login" className="text-[#F49853] font-gotham-bold hover:underline">Portal do Doador / Login</Link></li>
            </ul>
          </div>

          {/* Column 3: Transparency & Accountability */}
          <div className="lg:col-span-4 space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-white mb-4">
              Transparência & Integridade
            </h3>
            <p className="text-xs text-slate-400 font-gotham-light leading-relaxed">
              A YAH Hope adota rigorosos padrões de integridade na gestão de cada contribuição, com auditoria contínua e relatórios públicos de impacto social.
            </p>
            
            <div className="space-y-2 pt-2 text-xs text-slate-300 font-gotham-regular">
              <div className="flex items-center gap-2">
                <ShieldCheck size={16} className="text-[#F49853]" />
                <span>Auditoria e Prestação de Contas Mensal</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 size={16} className="text-[#92BF78]" />
                <span>Relatórios Periódicos de Evolução Médica</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock size={16} className="text-[#88A1F2]" />
                <span>Atualizações Diretas no Portal do Apoiador</span>
              </div>
            </div>
          </div>

        </div>

        {/* Bottom Legal & Copyright Bar */}
        <div className="pt-8 border-t border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4 text-xs font-gotham-light text-slate-500">
          <p>© {new Date().getFullYear()} YAH Hope. Todos os direitos reservados.</p>
          <div className="flex items-center gap-6 font-gotham-regular">
            <Link to="/politica-de-privacidade" className="hover:text-slate-300 transition-colors">Política de Privacidade</Link>
            <Link to="/termos-de-servico" className="hover:text-slate-300 transition-colors">Termos de Serviço</Link>
            <Link to="/login" className="hover:text-[#F49853] transition-colors font-gotham-bold">Acesso Restrito</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
