import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  Heart, 
  ArrowRight, 
  ChevronDown, 
  Search, 
  Menu, 
  X, 
  CreditCard 
} from 'lucide-react';
import { useTopBanner } from '../contexts/TopBannerContext';
import { useWebsiteProjects } from '../contexts/WebsiteProjectsContext';

const STRIPE_QUOTAS = [
  { amount: 50, label: 'Alimenta uma criança', icon: Heart },
  { amount: 120, label: 'Apadrinhamento mensal', icon: Heart, isPopular: true },
  { amount: 300, label: 'Cesta básica + Suplementos', icon: Heart },
];

export function PublicHeader() {
  const navigate = useNavigate();
  const location = useLocation();
  const { banner: topBanner } = useTopBanner();
  const { projects: websiteProjects } = useWebsiteProjects();

  const activeLocalProjects = websiteProjects.filter(p => p.status === 'active' || !p.status);
  const localProjects = activeLocalProjects.length > 0 ? activeLocalProjects : websiteProjects;

  const [alertVisible, setAlertVisible] = useState(true);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeMobileSubmenu, setActiveMobileSubmenu] = useState<string | null>(null);
  const [donationModalOpen, setDonationModalOpen] = useState(false);
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  // Quick donate action handler
  const handleDonateAction = () => {
    if (location.pathname === '/') {
      const el = document.getElementById('hero-donation-card');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
        return;
      }
    }
    setDonationModalOpen(true);
  };

  // Search submit handler
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setSearchOpen(false);
    navigate(`/blog?post=${encodeURIComponent(searchQuery.trim())}`);
  };

  // Stripe Checkout direct handler
  const handleStripeCheckout = async (amount: number) => {
    setIsCheckingOut(true);
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
      if (!supabaseUrl) {
        navigate(`/campanha?amount=${amount}&isMonthly=true&method=card`);
        return;
      }

      const baseUrl = supabaseUrl.replace(/\/$/, '');
      const response = await fetch(`${baseUrl}/functions/v1/create-checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify({
          amount,
          isMonthly: true,
          successUrl: `${window.location.origin}/campanha?status=success`,
          cancelUrl: `${window.location.origin}/?status=cancel`
        })
      });

      const data = await response.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        navigate(`/campanha?amount=${amount}&isMonthly=true&method=card`);
      }
    } catch {
      navigate(`/campanha?amount=${amount}&isMonthly=true&method=card`);
    } finally {
      setIsCheckingOut(false);
    }
  };

  return (
    <>
      {/* 1. Global Alert Banner */}
      {topBanner.enabled && alertVisible && (
        <aside 
          aria-label="Alerta Humanitário Urgente"
          style={{ backgroundColor: topBanner.bgColor || '#0F172A' }}
          className="text-white text-xs md:text-sm py-2.5 px-4 sticky top-0 z-50 border-b border-white/10 shadow-md transition-all duration-300"
        >
          <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 flex-1 min-w-[280px]">
              {topBanner.tag && (
                <span 
                  style={{ backgroundColor: topBanner.tagColor || '#F49853' }}
                  className="text-white font-gotham-bold uppercase text-[10px] tracking-wider px-2.5 py-0.5 rounded-full shadow-xs shrink-0"
                >
                  {topBanner.tag}
                </span>
              )}
              <p 
                style={{ color: topBanner.textColor || '#FFFFFF' }}
                className="font-gotham-regular truncate text-xs md:text-sm"
              >
                {topBanner.message}
              </p>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              {topBanner.buttonActionType === 'donation_modal' ? (
                <button
                  onClick={() => setDonationModalOpen(true)}
                  style={{ backgroundColor: topBanner.tagColor || '#F49853' }}
                  className="inline-flex items-center gap-1.5 hover:opacity-90 text-white font-gotham-bold text-xs uppercase tracking-wider px-4 py-1.5 rounded-full transition-transform active:scale-95 shadow-sm cursor-pointer"
                >
                  <span>{topBanner.buttonText || 'Apoiar Agora'}</span>
                  <ArrowRight size={13} />
                </button>
              ) : topBanner.buttonLink && topBanner.buttonLink.startsWith('http') ? (
                <a
                  href={topBanner.buttonLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ backgroundColor: topBanner.tagColor || '#F49853' }}
                  className="inline-flex items-center gap-1.5 hover:opacity-90 text-white font-gotham-bold text-xs uppercase tracking-wider px-4 py-1.5 rounded-full transition-transform active:scale-95 shadow-sm cursor-pointer"
                >
                  <span>{topBanner.buttonText || 'Saiba Mais'}</span>
                  <ArrowRight size={13} />
                </a>
              ) : (
                <Link
                  to={topBanner.buttonLink || '/projetos'}
                  style={{ backgroundColor: topBanner.tagColor || '#F49853' }}
                  className="inline-flex items-center gap-1.5 hover:opacity-90 text-white font-gotham-bold text-xs uppercase tracking-wider px-4 py-1.5 rounded-full transition-transform active:scale-95 shadow-sm cursor-pointer"
                >
                  <span>{topBanner.buttonText || 'Saiba Mais'}</span>
                  <ArrowRight size={13} />
                </Link>
              )}
              <button 
                onClick={() => setAlertVisible(false)}
                className="text-white/60 hover:text-white p-1 transition-colors cursor-pointer"
                aria-label="Fechar alerta"
              >
                <X size={16} />
              </button>
            </div>
          </div>
        </aside>
      )}

      {/* 2. Site Header & Navbars */}
      <header className="site-header relative z-40 bg-white border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 md:py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-3 shrink-0">
              <img 
                src="https://hope.yahchurch.com/wp-content/uploads/2025/09/Logo_Laranja-1024x511.png" 
                alt="YAH Hope" 
                className="h-10 md:h-12 w-auto object-contain"
              />
            </Link>

            {/* Desktop Navigation Links with Dropdown Menu Previews */}
            <nav className="hidden lg:flex items-center gap-5 xl:gap-7 text-xs xl:text-sm font-gotham-bold text-slate-800">
              <div className="relative group py-2">
                <button className="flex items-center gap-1 hover:text-[#F49853] transition-colors cursor-pointer">
                  <span>A Crise Humanitária</span>
                  <ChevronDown size={14} className="text-slate-400 group-hover:text-[#F49853] transition-transform group-hover:rotate-180" />
                </button>
                <div className="absolute top-full left-0 w-72 bg-white shadow-xl rounded-2xl p-4 border border-slate-100 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                  <p className="text-[11px] text-[#F49853] font-gotham-bold uppercase tracking-wider mb-2">Desafios que Enfrentamos</p>
                  <ul className="space-y-2 text-sm font-gotham-regular text-slate-700">
                    <li><Link to="/projetos" className="block hover:text-[#F49853] hover:translate-x-1 transition-all">Desnutrição Infantil em Nampula</Link></li>
                    <li><Link to="/projetos" className="block hover:text-[#F49853] hover:translate-x-1 transition-all">Evasão e Pobreza Universitária</Link></li>
                    <li><Link to="/projetos" className="block hover:text-[#F49853] hover:translate-x-1 transition-all">Segurança Alimentar e Saúde Materna</Link></li>
                  </ul>
                </div>
              </div>

              <div className="relative group py-2">
                <button className="flex items-center gap-1 hover:text-[#F49853] transition-colors cursor-pointer">
                  <span>Nossas Soluções</span>
                  <ChevronDown size={14} className="text-slate-400 group-hover:text-[#F49853] transition-transform group-hover:rotate-180" />
                </button>
                <div className="absolute top-full left-0 w-84 bg-white shadow-xl rounded-2xl p-5 border border-slate-100 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                  <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2">
                    <p className="text-[11px] text-[#F49853] font-gotham-bold uppercase tracking-wider">Projetos Locais</p>
                    <Link to="/projetos" className="text-[10px] text-slate-400 hover:text-[#F49853] font-medium transition-colors">
                      Ver todos ({localProjects.length})
                    </Link>
                  </div>
                  <div className="space-y-2.5 font-gotham-regular max-h-[360px] overflow-y-auto pr-1">
                    {localProjects.map((proj) => (
                      <Link 
                        key={proj.id} 
                        to={proj.link || '/projetos'}
                        className="block p-2.5 rounded-xl hover:bg-orange-50/70 transition-colors group/proj"
                      >
                        <div className="flex items-center gap-2">
                          <span 
                            className="w-2 h-2 rounded-full shrink-0" 
                            style={{ backgroundColor: proj.tag_color || '#F49853' }} 
                          />
                          <p className="font-gotham-bold text-slate-900 group-hover/proj:text-[#F49853] text-xs transition-colors line-clamp-1">
                            {proj.title}
                          </p>
                        </div>
                        {proj.description && (
                          <p className="text-[11px] text-slate-500 font-gotham-light line-clamp-2 mt-1 pl-4 leading-relaxed">
                            {proj.description}
                          </p>
                        )}
                      </Link>
                    ))}
                  </div>
                  <div className="pt-3 mt-2 border-t border-slate-100">
                    <Link 
                      to="/projetos" 
                      className="text-xs font-gotham-bold text-[#F49853] hover:text-[#e0853d] flex items-center justify-between transition-colors"
                    >
                      <span>Conhecer Todos os Projetos</span>
                      <ArrowRight size={13} />
                    </Link>
                  </div>
                </div>
              </div>

              <div className="relative group py-2">
                <button className="flex items-center gap-1 hover:text-[#F49853] transition-colors cursor-pointer">
                  <span>Alcance Global</span>
                  <ChevronDown size={14} className="text-slate-400 group-hover:text-[#F49853] transition-transform group-hover:rotate-180" />
                </button>
                <div className="absolute top-full left-0 w-64 bg-white shadow-xl rounded-2xl p-4 border border-slate-100 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                  <ul className="space-y-2 text-sm font-gotham-regular text-slate-700">
                    <li><Link to="/projetos" className="block hover:text-[#F49853] hover:translate-x-1 transition-all">Nampula (Moçambique)</Link></li>
                    <li><Link to="/projetos" className="block hover:text-[#F49853] hover:translate-x-1 transition-all">Ações Sociais no Brasil</Link></li>
                    <li><Link to="/projetos" className="block hover:text-[#F49853] hover:translate-x-1 transition-all">Novas Frentes Comunitárias</Link></li>
                  </ul>
                </div>
              </div>

              <Link to="/blog" className="hover:text-[#F49853] transition-colors">
                Notícias & Histórias
              </Link>

              <div className="relative group py-2">
                <button className="flex items-center gap-1 hover:text-[#F49853] transition-colors cursor-pointer">
                  <span>Como Ajudar</span>
                  <ChevronDown size={14} className="text-slate-400 group-hover:text-[#F49853] transition-transform group-hover:rotate-180" />
                </button>
                <div className="absolute top-full right-0 w-72 bg-white shadow-xl rounded-2xl p-4 border border-slate-100 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                  <ul className="space-y-2 text-sm font-gotham-regular text-slate-700">
                    <li>
                      <Link to="/campanha" className="block font-gotham-bold text-[#F49853] hover:translate-x-1 transition-all">
                        Seja Mantenedor Mensal
                      </Link>
                    </li>
                    <li><Link to="/campanha" className="block hover:text-[#F49853] hover:translate-x-1 transition-all">Campanhas em Andamento</Link></li>
                    <li><Link to="/loja" className="block hover:text-[#F49853] hover:translate-x-1 transition-all">Loja Solidária</Link></li>
                    <li><Link to="/projetos" className="block hover:text-[#F49853] hover:translate-x-1 transition-all">Voluntariado & Parcerias</Link></li>
                  </ul>
                </div>
              </div>
            </nav>

            {/* Header Right Actions */}
            <div className="flex items-center gap-2 sm:gap-3 lg:gap-4">
              {/* Search Toggle */}
              <button 
                onClick={() => setSearchOpen(!searchOpen)}
                className="p-2 text-slate-600 hover:text-[#F49853] transition-colors cursor-pointer"
                aria-label="Buscar no site"
              >
                <Search size={19} />
              </button>

              {/* Portal do Doador / Entrar */}
              <Link 
                to="/login"
                className="hidden md:inline-flex items-center gap-1.5 text-xs lg:text-sm font-gotham-bold text-slate-700 hover:text-[#F49853] px-3 py-2 rounded-full hover:bg-orange-50/80 transition-colors whitespace-nowrap"
              >
                <span>Portal do Doador / Entrar</span>
                <ArrowRight size={13} className="text-[#F49853]" />
              </Link>

              {/* Main Action Button */}
              <button
                onClick={handleDonateAction}
                className="bg-[#F49853] hover:bg-[#e0853d] text-white px-4 lg:px-5 py-2.5 rounded-full font-gotham-bold text-xs lg:text-sm tracking-wide transition-all shadow-md flex items-center gap-2 shrink-0 whitespace-nowrap cursor-pointer"
              >
                <span>Apoiar Agora</span>
                <Heart size={15} className="fill-white" />
              </button>

              {/* Mobile Hamburger Toggle */}
              <button
                onClick={() => setMobileMenuOpen(true)}
                className="lg:hidden p-2 text-slate-700 hover:text-[#F49853] transition-colors cursor-pointer"
                aria-label="Abrir Menu"
              >
                <Menu size={24} />
              </button>
            </div>
          </div>

          {/* Search Bar Collapsible */}
          {searchOpen && (
            <form onSubmit={handleSearchSubmit} className="mt-3 pt-3 border-t border-slate-100 flex items-center gap-3">
              <Search size={18} className="text-slate-400 shrink-0" />
              <input 
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar matérias, projetos ou palavras-chave..."
                className="w-full text-sm bg-transparent border-none focus:outline-hidden text-slate-800 placeholder-slate-400 font-gotham-regular"
                autoFocus
              />
              <button 
                type="submit"
                className="text-xs bg-[#F49853] hover:bg-[#e0853d] text-white px-3 py-1.5 rounded-lg font-gotham-bold cursor-pointer"
              >
                Buscar
              </button>
              <button 
                type="button"
                onClick={() => setSearchOpen(false)}
                className="text-xs text-slate-400 hover:text-slate-600 font-gotham-bold cursor-pointer"
              >
                Fechar
              </button>
            </form>
          )}
        </div>
      </header>

      {/* 3. Mobile Drawer Navigation */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex font-gotham-regular">
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity" 
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="relative ml-auto w-full max-w-xs sm:max-w-sm bg-white h-full shadow-2xl flex flex-col z-10 overflow-y-auto">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <img 
                src="https://hope.yahchurch.com/wp-content/uploads/2025/09/Logo_Laranja-1024x511.png" 
                alt="YAH Hope Logo" 
                className="h-8 w-auto object-contain"
              />
              <button 
                onClick={() => setMobileMenuOpen(false)}
                className="p-1.5 text-slate-500 hover:text-slate-800 cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-5 flex-1 space-y-5 text-sm font-gotham-bold text-slate-800">
              <div>
                <button 
                  onClick={() => setActiveMobileSubmenu(activeMobileSubmenu === 'crisis' ? null : 'crisis')}
                  className="flex items-center justify-between w-full py-2 hover:text-[#F49853] cursor-pointer"
                >
                  <span>A Crise Humanitária</span>
                  <ChevronDown size={16} className={`transition-transform ${activeMobileSubmenu === 'crisis' ? 'rotate-180' : ''}`} />
                </button>
                {activeMobileSubmenu === 'crisis' && (
                  <div className="pl-4 py-2 space-y-2 text-xs font-gotham-regular text-slate-600 border-l-2 border-[#F49853]/30 ml-2">
                    <Link to="/projetos" onClick={() => setMobileMenuOpen(false)} className="block py-1 hover:text-[#F49853]">Desnutrição Infantil</Link>
                    <Link to="/projetos" onClick={() => setMobileMenuOpen(false)} className="block py-1 hover:text-[#F49853]">Evasão Universitária</Link>
                    <Link to="/projetos" onClick={() => setMobileMenuOpen(false)} className="block py-1 hover:text-[#F49853]">Vulnerabilidade Social</Link>
                  </div>
                )}
              </div>

              <div>
                <button 
                  onClick={() => setActiveMobileSubmenu(activeMobileSubmenu === 'solutions' ? null : 'solutions')}
                  className="flex items-center justify-between w-full py-2 hover:text-[#F49853] cursor-pointer"
                >
                  <span>Nossas Soluções (Projetos Locais)</span>
                  <ChevronDown size={16} className={`transition-transform ${activeMobileSubmenu === 'solutions' ? 'rotate-180' : ''}`} />
                </button>
                {activeMobileSubmenu === 'solutions' && (
                  <div className="pl-4 py-2 space-y-2 text-xs font-gotham-regular text-slate-600 border-l-2 border-[#F49853]/30 ml-2">
                    {localProjects.map((proj) => (
                      <Link 
                        key={proj.id} 
                        to={proj.link || '/projetos'} 
                        onClick={() => setMobileMenuOpen(false)} 
                        className="block py-1 hover:text-[#F49853]"
                      >
                        {proj.title}
                      </Link>
                    ))}
                    <Link 
                      to="/projetos" 
                      onClick={() => setMobileMenuOpen(false)} 
                      className="block pt-1 font-gotham-bold text-[#F49853] hover:underline"
                    >
                      Ver todos os projetos →
                    </Link>
                  </div>
                )}
              </div>

              <div>
                <button 
                  onClick={() => setActiveMobileSubmenu(activeMobileSubmenu === 'reach' ? null : 'reach')}
                  className="flex items-center justify-between w-full py-2 hover:text-[#F49853] cursor-pointer"
                >
                  <span>Alcance Global</span>
                  <ChevronDown size={16} className={`transition-transform ${activeMobileSubmenu === 'reach' ? 'rotate-180' : ''}`} />
                </button>
                {activeMobileSubmenu === 'reach' && (
                  <div className="pl-4 py-2 space-y-2 text-xs font-gotham-regular text-slate-600 border-l-2 border-[#F49853]/30 ml-2">
                    <Link to="/projetos" onClick={() => setMobileMenuOpen(false)} className="block py-1 hover:text-[#F49853]">Nampula (Moçambique)</Link>
                    <Link to="/projetos" onClick={() => setMobileMenuOpen(false)} className="block py-1 hover:text-[#F49853]">Ações Sociais no Brasil</Link>
                  </div>
                )}
              </div>

              <div>
                <Link to="/blog" onClick={() => setMobileMenuOpen(false)} className="block py-2 hover:text-[#F49853]">
                  Notícias & Histórias
                </Link>
              </div>

              <div>
                <Link to="/campanha" onClick={() => setMobileMenuOpen(false)} className="block py-2 text-[#F49853]">
                  Como Ajudar / Seja Mantenedor
                </Link>
              </div>

              <div className="pt-4 border-t border-slate-100 space-y-3">
                <Link 
                  to="/login" 
                  onClick={() => setMobileMenuOpen(false)}
                  className="block text-center py-2.5 px-4 rounded-xl bg-slate-100 text-slate-700 font-gotham-bold hover:bg-slate-200"
                >
                  Portal do Doador / Entrar
                </Link>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    setDonationModalOpen(true);
                  }}
                  className="w-full text-center py-3 px-4 rounded-xl bg-[#F49853] text-white font-gotham-bold hover:bg-[#e0853d] shadow-md flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Heart size={16} fill="currentColor" />
                  Apoiar Agora
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. Sticky Floating Donate Button in Brand Orange */}
      <aside aria-label="Acesso Rápido para Doação" className="fixed bottom-6 right-6 z-40">
        <button
          onClick={handleDonateAction}
          className="bg-[#F49853] hover:bg-[#e0853d] text-white px-5 py-3.5 rounded-full font-gotham-bold text-sm tracking-wide shadow-2xl hover:shadow-[#F49853]/40 hover:scale-105 active:scale-95 transition-all duration-300 flex items-center gap-2.5 group cursor-pointer"
          title="Fazer uma doação"
        >
          <span className="uppercase text-xs tracking-wider">Apoiar</span>
          <Heart size={18} className="fill-white group-hover:scale-110 transition-transform" />
        </button>
      </aside>

      {/* 5. Donation Lightbox Modal */}
      {donationModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 font-gotham-regular">
          <div 
            className="fixed inset-0 bg-black/75 backdrop-blur-xs transition-opacity"
            onClick={() => setDonationModalOpen(false)}
          />
          <div className="relative bg-white rounded-3xl max-w-lg w-full shadow-2xl overflow-hidden z-10 border border-orange-100">
            <button 
              onClick={() => setDonationModalOpen(false)}
              className="absolute top-4 right-4 z-20 bg-black/40 hover:bg-black/60 text-white p-2 rounded-full transition-colors cursor-pointer"
              aria-label="Fechar"
            >
              <X size={18} />
            </button>

            <div className="relative h-44 sm:h-48 bg-slate-900">
              <img 
                src="https://hope.yahchurch.com/wp-content/uploads/2025/09/HOPE-ALFACES.avif" 
                alt="Casa Nutri" 
                className="w-full h-full object-cover opacity-80"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent"></div>
              <div className="absolute bottom-4 left-6 right-6 text-white">
                <span className="bg-[#F49853] text-white text-[10px] font-gotham-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full mb-1 inline-block">
                  Apoio Imediato
                </span>
                <h3 className="text-xl sm:text-2xl font-black">
                  Resgate a Infância na Casa Nutri
                </h3>
              </div>
            </div>

            <div className="p-6 sm:p-7">
              <p className="text-slate-600 text-xs sm:text-sm font-gotham-light leading-relaxed mb-4">
                Selecione uma das cotas para iniciar sua contribuição:
              </p>

              <div className="space-y-2 mb-5">
                {STRIPE_QUOTAS.map((q) => (
                  <button
                    key={q.amount}
                    type="button"
                    disabled={isCheckingOut}
                    onClick={() => {
                      setDonationModalOpen(false);
                      handleStripeCheckout(q.amount);
                    }}
                    className="w-full flex items-center justify-between p-3 rounded-xl border-2 border-slate-200 hover:border-[#F49853] hover:bg-orange-50/50 transition-all text-left group cursor-pointer"
                  >
                    <div>
                      <span className="text-sm font-gotham-bold text-slate-900 block">R$ {q.amount}</span>
                      <span className="text-xs text-slate-500 font-gotham-regular">{q.label}</span>
                    </div>
                    <ArrowRight size={16} className="text-slate-400 group-hover:text-[#F49853] group-hover:translate-x-1 transition-all" />
                  </button>
                ))}
              </div>

              <div className="space-y-2">
                <button
                  onClick={() => {
                    setDonationModalOpen(false);
                    navigate('/campanha');
                  }}
                  className="w-full bg-[#F49853] hover:bg-[#e0853d] text-white py-3 rounded-xl font-gotham-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-md cursor-pointer"
                >
                  <CreditCard size={15} />
                  <span>Outro Valor / Definir Quantia</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
