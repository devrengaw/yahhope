import { Link, Outlet, useLocation } from 'react-router-dom';
import { Heart } from 'lucide-react';

export function PublicLayout() {
  const location = useLocation();
  const isCampaignPage = location.pathname === '/campanha';
  const isLoginPage = location.pathname === '/login' || location.pathname === '/set-password' || location.pathname === '/cadastro-apadrinhador';

  return (
    <div className={`min-h-screen flex flex-col ${isLoginPage ? 'bg-slate-900' : 'bg-slate-50'}`}>
      <header className={`w-full z-50 transition-all ${isLoginPage ? 'absolute top-0 bg-transparent' : 'bg-white/80 backdrop-blur-md border-b border-white/20 sticky top-0'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20 md:h-24">
            <Link to="/" className="flex items-center">
              <img src="/logo.png" alt="YAH Hope" className={isLoginPage ? "h-12 md:h-16 object-contain brightness-0 invert opacity-90" : "h-12 md:h-16 object-contain brightness-0"} />
            </Link>
            
            <nav className="hidden md:flex items-center gap-8">
              <Link to="/" className={`text-sm font-medium transition-colors ${isLoginPage ? 'text-white/90 hover:text-white drop-shadow' : 'text-slate-600 hover:text-emerald-600'}`}>Início</Link>
              <Link to="/campanha" className={`text-sm font-medium transition-colors ${isLoginPage ? 'text-white/90 hover:text-white drop-shadow' : 'text-slate-600 hover:text-emerald-600'}`}>Participe</Link>
              <Link to="/projetos" className={`text-sm font-medium transition-colors ${isLoginPage ? 'text-white/90 hover:text-white drop-shadow' : 'text-slate-600 hover:text-emerald-600'}`}>Conhecer Projetos</Link>
              {localStorage.getItem('yah_blog_closed') !== 'true' && (
                <Link to="/blog" className={`text-sm font-medium transition-colors ${isLoginPage ? 'text-white/90 hover:text-white drop-shadow' : 'text-slate-600 hover:text-emerald-600'}`}>Blog</Link>
              )}
              {localStorage.getItem('yah_store_closed') !== 'true' && (
                <Link to="/loja" className={`text-sm font-medium transition-colors ${isLoginPage ? 'text-white/90 hover:text-white drop-shadow' : 'text-slate-600 hover:text-emerald-600'}`}>Loja</Link>
              )}
            </nav>

            <div className="flex items-center gap-4">
              <Link 
                to="/login"
                className={`text-sm font-bold transition-colors ${isLoginPage ? 'text-white hover:text-white/80 drop-shadow' : 'text-slate-600 hover:text-amber-600'}`}
              >
                Entrar
              </Link>
              <Link to="/apoiador" className="bg-slate-900 text-white px-5 py-2.5 rounded-xl font-black text-sm uppercase tracking-widest hover:bg-slate-800 transition-all flex items-center gap-2 shadow-sm">
                <Heart size={16} fill="currentColor" />
                Apadrinhar
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col">
        <Outlet />
      </main>

      {!isLoginPage && (
      <footer className="bg-slate-900 text-slate-400 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-8">
            <div className="text-center md:text-left">
              <div className="flex justify-center md:justify-start items-center mb-4">
                <img src="/logo.png" alt="YAH Hope" className="h-10 object-contain" />
              </div>
              <p className="text-sm max-w-md">Nosso manifesto: Transformar a realidade através da esperança, amor e dedicação.</p>
            </div>
            
            <div className="flex flex-col items-center md:items-end gap-4">
              <div className="flex items-center gap-6 text-sm">
                <Link to="/politica-de-privacidade" className="hover:text-white transition-colors">Política de Privacidade</Link>
                <Link to="/termos-de-servico" className="hover:text-white transition-colors">Termos de Serviço</Link>
              </div>
              <div className="text-xs">
                &copy; {new Date().getFullYear()} YAHope. Todos os direitos reservados.
              </div>
            </div>
          </div>
        </div>
      </footer>
      )}
    </div>
  );
}
