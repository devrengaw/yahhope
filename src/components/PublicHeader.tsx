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
import { useDonationModal } from '../contexts/DonationModalContext';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { LanguageSwitcher } from './common/LanguageSwitcher';

export function PublicHeader() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { tr } = useLanguage();
  const { banner: topBanner } = useTopBanner();
  const { projects: websiteProjects } = useWebsiteProjects();
  const { openDonationModal } = useDonationModal();

  const activeLocalProjects = websiteProjects.filter(p => p.status === 'active' || !p.status);
  const localProjects = activeLocalProjects.length > 0 ? activeLocalProjects : websiteProjects;

  const [alertVisible, setAlertVisible] = useState(true);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeMobileSubmenu, setActiveMobileSubmenu] = useState<string | null>(null);

  // Quick donate action handler
  const handleDonateAction = () => {
    if (location.pathname === '/') {
      const el = document.getElementById('hero-donation-card');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
        return;
      }
    }
    openDonationModal();
  };

  // Search submit handler
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setSearchOpen(false);
    navigate(`/blog?post=${encodeURIComponent(searchQuery.trim())}`);
  };


  // Banner fallback resolution
  const bannerBg = (typeof topBanner?.bgColor === 'string' && (topBanner.bgColor.startsWith('#') || topBanner.bgColor.startsWith('rgb') || topBanner.bgColor.startsWith('hsl')))
    ? topBanner.bgColor
    : (typeof topBanner?.bgColor === 'string' && topBanner.bgColor.includes('emerald') ? '#059669' : '#0F172A');

  const bannerTextColor = (typeof topBanner?.textColor === 'string' && (topBanner.textColor.startsWith('#') || topBanner.textColor.startsWith('rgb') || topBanner.textColor.startsWith('hsl')))
    ? topBanner.textColor
    : '#FFFFFF';

  const bannerTagColor = (typeof topBanner?.tagColor === 'string' && (topBanner.tagColor.startsWith('#') || topBanner.tagColor.startsWith('rgb') || topBanner.tagColor.startsWith('hsl')))
    ? topBanner.tagColor
    : '#F49853';

  const bannerMessage = topBanner?.message || (topBanner as any)?.text || tr(
    'Moçambique & Casa Nutri: Apoio emergencial a 9 crianças e famílias em risco nutricional',
    'Mozambique & Casa Nutri: Emergency support for 9 children and families at nutritional risk'
  );
  const bannerButtonText = topBanner?.buttonText || (topBanner as any)?.linkText || tr('Apoiar Agora', 'Support Now');
  const bannerButtonLink = topBanner?.buttonLink || (topBanner as any)?.link || '/campanha';

  return (
    <>
      {/* 1. Global Alert Banner */}
      {topBanner?.enabled && alertVisible && (
        <aside 
          aria-label={tr('Alerta Humanitário Urgente', 'Urgent Humanitarian Alert')}
          style={{ backgroundColor: bannerBg }}
          className="text-white text-xs md:text-sm py-2.5 px-4 sticky top-0 z-50 border-b border-white/10 shadow-md transition-all duration-300 pt-[calc(0.625rem+env(safe-area-inset-top,0px))]"
        >
          <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 flex-1 min-w-[280px]">
              {topBanner.tag && (
                <span 
                  style={{ backgroundColor: bannerTagColor }}
                  className="text-white font-gotham-bold uppercase text-[10px] tracking-wider px-2.5 py-0.5 rounded-full shadow-xs shrink-0"
                >
                  {topBanner.tag}
                </span>
              )}
              <p 
                style={{ color: bannerTextColor }}
                className="font-gotham-regular truncate text-xs md:text-sm"
              >
                {bannerMessage}
              </p>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              {topBanner.buttonActionType === 'donation_modal' ? (
                <button
                  onClick={() => openDonationModal()}
                  style={{ backgroundColor: bannerTagColor }}
                  className="inline-flex items-center gap-1.5 hover:opacity-90 text-white font-gotham-bold text-xs uppercase tracking-wider px-4 py-1.5 rounded-full transition-transform active:scale-95 shadow-sm cursor-pointer"
                >
                  <span>{bannerButtonText}</span>
                  <ArrowRight size={13} />
                </button>
              ) : bannerButtonLink && bannerButtonLink.startsWith('http') ? (
                <a
                  href={bannerButtonLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ backgroundColor: bannerTagColor }}
                  className="inline-flex items-center gap-1.5 hover:opacity-90 text-white font-gotham-bold text-xs uppercase tracking-wider px-4 py-1.5 rounded-full transition-transform active:scale-95 shadow-sm cursor-pointer"
                >
                  <span>{bannerButtonText}</span>
                  <ArrowRight size={13} />
                </a>
              ) : (
                <Link
                  to={bannerButtonLink}
                  style={{ backgroundColor: bannerTagColor }}
                  className="inline-flex items-center gap-1.5 hover:opacity-90 text-white font-gotham-bold text-xs uppercase tracking-wider px-4 py-1.5 rounded-full transition-transform active:scale-95 shadow-sm cursor-pointer"
                >
                  <span>{bannerButtonText}</span>
                  <ArrowRight size={13} />
                </Link>
              )}
              <button 
                onClick={() => setAlertVisible(false)}
                className="text-white/60 hover:text-white p-1 transition-colors cursor-pointer"
                aria-label={tr('Fechar alerta', 'Close alert')}
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
                src="/logo-black.png" 
                alt="YAH Hope" 
                className="h-10 md:h-12 w-auto object-contain"
              />
            </Link>

            {/* Desktop Navigation Links with Dropdown Menu Previews */}
            <nav className="hidden lg:flex items-center gap-3.5 xl:gap-6 text-xs xl:text-sm font-gotham-bold text-slate-800 shrink-0">
              <div className="relative group py-2">
                <button className="flex items-center gap-1 hover:text-[#F49853] transition-colors cursor-pointer">
                  <span>{tr('Sobre Nós', 'About Us')}</span>
                  <ChevronDown size={14} className="text-slate-400 group-hover:text-[#F49853] transition-transform group-hover:rotate-180" />
                </button>
                <div className="absolute top-full left-0 w-80 bg-white shadow-xl rounded-2xl p-4 border border-slate-100 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                  <p className="text-[11px] text-[#F49853] font-gotham-bold uppercase tracking-wider mb-3">{tr('Conheça a YAH Hope', 'Discover YAH Hope')}</p>
                  <div className="space-y-1.5">
                    <Link 
                      to="/sobre-nos" 
                      className="block p-2.5 rounded-xl hover:bg-orange-50/70 transition-colors group/item"
                    >
                      <p className="font-gotham-bold text-slate-900 group-hover/item:text-[#F49853] text-xs transition-colors">
                        {tr('Sobre Nós & Manifesto', 'About Us & Manifesto')}
                      </p>
                      <p className="text-[11px] text-slate-500 font-gotham-light mt-0.5 leading-relaxed">
                        {tr('Nossa história, propósito e a leitura do Manifesto oficial.', 'Our story, purpose, and the official YAH Hope Manifesto.')}
                      </p>
                    </Link>

                    <Link 
                      to="/missao-visao-valores" 
                      className="block p-2.5 rounded-xl hover:bg-orange-50/70 transition-colors group/item"
                    >
                      <p className="font-gotham-bold text-slate-900 group-hover/item:text-[#F49853] text-xs transition-colors">
                        {tr('Missão, Visão e Valores', 'Mission, Vision & Values')}
                      </p>
                      <p className="text-[11px] text-slate-500 font-gotham-light mt-0.5 leading-relaxed">
                        {tr('Os princípios fundamentais que regem nossas decisões e ações.', 'The core principles guiding our decisions and actions.')}
                      </p>
                    </Link>
                  </div>
                </div>
              </div>

              <div className="relative group py-2">
                <button className="flex items-center gap-1 hover:text-[#F49853] transition-colors cursor-pointer">
                  <span>{tr('Nossas Soluções', 'Our Solutions')}</span>
                  <ChevronDown size={14} className="text-slate-400 group-hover:text-[#F49853] transition-transform group-hover:rotate-180" />
                </button>
                <div className="absolute top-full left-0 w-84 bg-white shadow-xl rounded-2xl p-5 border border-slate-100 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                  <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2">
                    <p className="text-[11px] text-[#F49853] font-gotham-bold uppercase tracking-wider">{tr('Projetos Locais', 'Local Projects')}</p>
                    <Link to="/projetos" className="text-[10px] text-slate-400 hover:text-[#F49853] font-medium transition-colors">
                      {tr(`Ver todos (${localProjects.length})`, `View all (${localProjects.length})`)}
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
                      <span>{tr('Conhecer Todos os Projetos', 'Explore All Projects')}</span>
                      <ArrowRight size={13} />
                    </Link>
                  </div>
                </div>
              </div>

              <div className="relative group py-2">
                <button className="flex items-center gap-1 hover:text-[#F49853] transition-colors cursor-pointer">
                  <span>{tr('Alcance Global', 'Global Reach')}</span>
                  <ChevronDown size={14} className="text-slate-400 group-hover:text-[#F49853] transition-transform group-hover:rotate-180" />
                </button>
                <div className="absolute top-full left-0 w-64 bg-white shadow-xl rounded-2xl p-4 border border-slate-100 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                  <ul className="space-y-2 text-sm font-gotham-regular text-slate-700">
                    <li>
                      <Link to="/projetos?regiao=mocambique" className="flex items-center justify-between hover:text-[#F49853] hover:translate-x-1 transition-all">
                        <span>{tr('Nampula (Moçambique)', 'Nampula (Mozambique)')}</span>
                        <span className="text-[10px] bg-emerald-50 text-emerald-600 px-1.5 py-0.5 rounded font-gotham-medium">{tr('Campo', 'Field')}</span>
                      </Link>
                    </li>
                    <li>
                      <Link to="/projetos?regiao=brasil" className="flex items-center justify-between hover:text-[#F49853] hover:translate-x-1 transition-all">
                        <span>{tr('Brasil (Sede & Expansão)', 'Brazil (HQ & Expansion)')}</span>
                        <span className="text-[10px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded font-gotham-medium">{tr('Base', 'HQ')}</span>
                      </Link>
                    </li>
                    <li className="pt-2 border-t border-slate-100">
                      <Link to="/projetos" className="block text-xs font-gotham-bold text-[#F49853] hover:text-[#e0853d] transition-colors">
                        {tr('Ver Visão Geral & Frentes →', 'View Overview & Fronts →')}
                      </Link>
                    </li>
                  </ul>
                </div>
              </div>

              <Link to="/blog" className="hover:text-[#F49853] transition-colors">
                {tr('Notícias & Histórias', 'News & Stories')}
              </Link>

              <div className="relative group py-2">
                <button className="flex items-center gap-1 hover:text-[#F49853] transition-colors cursor-pointer">
                  <span>{tr('Como Ajudar', 'How to Help')}</span>
                  <ChevronDown size={14} className="text-slate-400 group-hover:text-[#F49853] transition-transform group-hover:rotate-180" />
                </button>
                <div className="absolute top-full right-0 w-72 bg-white shadow-xl rounded-2xl p-4 border border-slate-100 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                  <ul className="space-y-2 text-sm font-gotham-regular text-slate-700">
                    <li>
                      <Link to="/hotsite" className="block font-gotham-bold text-amber-600 hover:translate-x-1 transition-all py-1">
                        {tr('Faça Parte do Projeto (Hotsite)', 'Join the Project (Hotsite)')}
                      </Link>
                    </li>
                    <li>
                      <Link to="/mantenedor" className="block font-gotham-bold text-[#F49853] hover:translate-x-1 transition-all py-1">
                        {tr('Seja um Mantenedor Mensal/Apadrinhamento', 'Become a Monthly Supporter / Sponsor')}
                      </Link>
                    </li>
                    <li><Link to="/campanha" className="block hover:text-[#F49853] hover:translate-x-1 transition-all">{tr('Campanhas em Andamento', 'Active Campaigns')}</Link></li>
                    <li><Link to="/loja" className="block hover:text-[#F49853] hover:translate-x-1 transition-all">{tr('Loja Solidária', 'Solidarity Store')}</Link></li>
                    <li><Link to="/voluntariado-e-parcerias" className="block hover:text-[#F49853] hover:translate-x-1 transition-all">{tr('Voluntariado & Parcerias', 'Volunteering & Partnerships')}</Link></li>
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
                aria-label={tr('Buscar no site', 'Search site')}
              >
                <Search size={19} />
              </button>

              {/* Portal do Doador / Entrar */}
              <Link 
                to={user ? "/portal/dashboard" : "/login"}
                className="hidden md:inline-flex lg:hidden xl:inline-flex items-center gap-1.5 text-xs lg:text-sm font-gotham-bold text-slate-700 hover:text-[#F49853] px-3 py-2 rounded-full hover:bg-orange-50/80 transition-colors whitespace-nowrap"
              >
                <span>{user ? tr('Meu Portal', 'My Portal') : tr('Entrar / Mantenedor', 'Sign In / Supporter')}</span>
                <ArrowRight size={13} className="text-[#F49853]" />
              </Link>

              {/* Main Action Button */}
              <button
                onClick={handleDonateAction}
                className="bg-[#F49853] hover:bg-[#e0853d] text-white px-4 lg:px-5 py-2.5 rounded-full font-gotham-bold text-xs lg:text-sm tracking-wide transition-all shadow-md flex items-center gap-2 shrink-0 whitespace-nowrap cursor-pointer"
              >
                <span>{tr('Apoiar Agora', 'Support Now')}</span>
                <Heart size={15} className="fill-white" />
              </button>

              {/* Language Switcher (Brazil / USA flags) */}
              <LanguageSwitcher theme="light" className="shrink-0" />

              {/* Mobile Hamburger Toggle */}
              <button
                onClick={() => setMobileMenuOpen(true)}
                className="lg:hidden p-2 text-slate-700 hover:text-[#F49853] transition-colors cursor-pointer"
                aria-label={tr('Abrir Menu', 'Open Menu')}
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
                placeholder={tr('Buscar matérias, projetos ou palavras-chave...', 'Search stories, projects, or keywords...')}
                className="w-full text-sm bg-transparent border-none focus:outline-hidden text-slate-800 placeholder-slate-400 font-gotham-regular"
                autoFocus
              />
              <button 
                type="submit"
                className="text-xs bg-[#F49853] hover:bg-[#e0853d] text-white px-3 py-1.5 rounded-lg font-gotham-bold cursor-pointer"
              >
                {tr('Buscar', 'Search')}
              </button>
              <button 
                type="button"
                onClick={() => setSearchOpen(false)}
                className="text-xs text-slate-400 hover:text-slate-600 font-gotham-bold cursor-pointer"
              >
                {tr('Fechar', 'Close')}
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
          <div className="relative ml-auto w-full max-w-xs sm:max-w-sm bg-white h-full shadow-2xl flex flex-col z-10 overflow-y-auto pt-safe pb-safe animate-slideLeft">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <img 
                src="/logo-black.png" 
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
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <span className="text-xs font-gotham-bold uppercase tracking-wider text-slate-400">
                  {tr('Idioma', 'Language')}
                </span>
                <LanguageSwitcher theme="light" showLabels />
              </div>

              <div>
                <button 
                  onClick={() => setActiveMobileSubmenu(activeMobileSubmenu === 'about' ? null : 'about')}
                  className="flex items-center justify-between w-full py-2 hover:text-[#F49853] cursor-pointer"
                >
                  <span>{tr('Sobre Nós', 'About Us')}</span>
                  <ChevronDown size={16} className={`transition-transform ${activeMobileSubmenu === 'about' ? 'rotate-180' : ''}`} />
                </button>
                {activeMobileSubmenu === 'about' && (
                  <div className="pl-4 py-2 space-y-2 text-xs font-gotham-regular text-slate-600 border-l-2 border-[#F49853]/30 ml-2">
                    <Link to="/sobre-nos" onClick={() => setMobileMenuOpen(false)} className="block py-1 hover:text-[#F49853]">
                      {tr('Sobre Nós & Manifesto', 'About Us & Manifesto')}
                    </Link>
                    <Link to="/missao-visao-valores" onClick={() => setMobileMenuOpen(false)} className="block py-1 hover:text-[#F49853]">
                      {tr('Missão, Visão e Valores', 'Mission, Vision & Values')}
                    </Link>
                  </div>
                )}
              </div>

              <div>
                <button 
                  onClick={() => setActiveMobileSubmenu(activeMobileSubmenu === 'solutions' ? null : 'solutions')}
                  className="flex items-center justify-between w-full py-2 hover:text-[#F49853] cursor-pointer"
                >
                  <span>{tr('Nossas Soluções (Projetos Locais)', 'Our Solutions (Local Projects)')}</span>
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
                      {tr('Ver todos os projetos →', 'View all projects →')}
                    </Link>
                  </div>
                )}
              </div>

              <div>
                <button 
                  onClick={() => setActiveMobileSubmenu(activeMobileSubmenu === 'reach' ? null : 'reach')}
                  className="flex items-center justify-between w-full py-2 hover:text-[#F49853] cursor-pointer"
                >
                  <span>{tr('Alcance Global', 'Global Reach')}</span>
                  <ChevronDown size={16} className={`transition-transform ${activeMobileSubmenu === 'reach' ? 'rotate-180' : ''}`} />
                </button>
                {activeMobileSubmenu === 'reach' && (
                  <div className="pl-4 py-2 space-y-2 text-xs font-gotham-regular text-slate-600 border-l-2 border-[#F49853]/30 ml-2">
                    <Link to="/projetos?regiao=mocambique" onClick={() => setMobileMenuOpen(false)} className="block py-1 hover:text-[#F49853]">{tr('Nampula (Moçambique)', 'Nampula (Mozambique)')}</Link>
                    <Link to="/projetos?regiao=brasil" onClick={() => setMobileMenuOpen(false)} className="block py-1 hover:text-[#F49853]">{tr('Brasil (Sede & Expansão)', 'Brazil (HQ & Expansion)')}</Link>
                    <Link to="/projetos" onClick={() => setMobileMenuOpen(false)} className="block py-1 font-gotham-bold text-[#F49853]">{tr('Ver Todos os Projetos →', 'View All Projects →')}</Link>
                  </div>
                )}
              </div>

              <div>
                <Link to="/blog" onClick={() => setMobileMenuOpen(false)} className="block py-2 hover:text-[#F49853]">
                  {tr('Notícias & Histórias', 'News & Stories')}
                </Link>
              </div>

              <div className="space-y-1 py-1">
                <Link 
                  to="/hotsite" 
                  onClick={() => setMobileMenuOpen(false)} 
                  className="block py-2 text-amber-600 font-gotham-bold hover:translate-x-1 transition-all"
                >
                  {tr('Faça Parte do Projeto (Hotsite)', 'Join the Project (Hotsite)')}
                </Link>
                <Link 
                  to="/mantenedor" 
                  onClick={() => setMobileMenuOpen(false)} 
                  className="block py-2 text-[#F49853] font-gotham-bold hover:translate-x-1 transition-all"
                >
                  {tr('Seja um Mantenedor Mensal/Apadrinhamento', 'Become a Monthly Supporter / Sponsor')}
                </Link>
                <div className="pl-3 border-l-2 border-slate-100 space-y-1.5 py-1">
                  <Link 
                    to="/campanha" 
                    onClick={() => setMobileMenuOpen(false)} 
                    className="block text-xs text-slate-600 hover:text-[#F49853] py-0.5"
                  >
                    {tr('Campanhas em Andamento', 'Active Campaigns')}
                  </Link>
                  <Link 
                    to="/loja" 
                    onClick={() => setMobileMenuOpen(false)} 
                    className="block text-xs text-slate-600 hover:text-[#F49853] py-0.5"
                  >
                    {tr('Loja Solidária', 'Solidarity Store')}
                  </Link>
                  <Link 
                    to="/voluntariado-e-parcerias" 
                    onClick={() => setMobileMenuOpen(false)} 
                    className="block text-xs text-slate-600 hover:text-[#F49853] py-0.5"
                  >
                    {tr('Voluntariado & Parcerias', 'Volunteering & Partnerships')}
                  </Link>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 space-y-3">
                <Link 
                  to={user ? "/portal/dashboard" : "/login"} 
                  onClick={() => setMobileMenuOpen(false)}
                  className="block text-center py-2.5 px-4 rounded-xl bg-slate-100 text-slate-700 font-gotham-bold hover:bg-slate-200"
                >
                  {user ? tr('Meu Portal do Mantenedor', 'My Supporter Portal') : tr('Entrar / Área do Mantenedor', 'Sign In / Supporter Area')}
                </Link>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    openDonationModal();
                  }}
                  className="w-full text-center py-3 px-4 rounded-xl bg-[#F49853] text-white font-gotham-bold hover:bg-[#e0853d] shadow-md flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Heart size={16} fill="currentColor" />
                  {tr('Apoiar Agora', 'Support Now')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. Sticky Floating Donate Button in Brand Orange */}
      <aside aria-label={tr('Acesso Rápido para Doação', 'Quick Donation Access')} className="fixed bottom-[calc(1.5rem+env(safe-area-inset-bottom,0px))] right-5 sm:right-6 z-40">
        <button
          onClick={handleDonateAction}
          className="bg-[#F49853] hover:bg-[#e0853d] text-white px-5 py-3.5 rounded-full font-gotham-bold text-sm tracking-wide shadow-2xl hover:shadow-[#F49853]/40 hover:scale-105 active:scale-95 transition-all duration-300 flex items-center gap-2.5 group cursor-pointer"
          title={tr('Fazer uma doação', 'Make a donation')}
        >
          <span className="uppercase text-xs tracking-wider">{tr('Apoiar', 'Support')}</span>
          <Heart size={18} className="fill-white group-hover:scale-110 transition-transform" />
        </button>
      </aside>
    </>
  );
}
