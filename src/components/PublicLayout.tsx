import { Link, Outlet } from 'react-router-dom';
import { Heart } from 'lucide-react';

export function PublicLayout() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/" className="flex items-center">
              <img src="/logo.png" alt="YAH Hope" className="h-8 md:h-10 object-contain brightness-0" />
            </Link>
            
            <nav className="hidden md:flex items-center gap-8">
              <Link to="/" className="text-sm font-medium text-slate-600 hover:text-emerald-600 transition-colors">Início</Link>
              <Link to="/campanha" className="text-sm font-medium text-slate-600 hover:text-emerald-600 transition-colors">Envolva-se</Link>
              {localStorage.getItem('yah_blog_closed') !== 'true' && (
                <Link to="/blog" className="text-sm font-medium text-slate-600 hover:text-emerald-600 transition-colors">Blog</Link>
              )}
              {localStorage.getItem('yah_store_closed') !== 'true' && (
                <Link to="/loja" className="text-sm font-medium text-slate-600 hover:text-emerald-600 transition-colors">Loja</Link>
              )}
            </nav>

            <div className="flex items-center gap-4">
              <Link 
                to="/login?mode=supporter"
                className="text-sm font-bold text-slate-600 hover:text-amber-600 transition-colors"
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

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="bg-slate-900 text-slate-400 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-8">
            <div className="text-center md:text-left">
              <div className="flex justify-center md:justify-start items-center mb-4">
                <img src="/logo.png" alt="YAH Hope" className="h-10 object-contain" />
              </div>
              <p className="text-sm max-w-md">Transformando vidas através da nutrição, educação e comunidade em Moçambique.</p>
            </div>
            
            <div className="flex flex-col items-center md:items-end gap-4">
              <Link to="/login?mode=admin" className="text-xs font-black uppercase tracking-widest text-slate-500 hover:text-emerald-500 transition-colors flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                Área Administrativa
              </Link>
              <div className="text-xs">
                &copy; {new Date().getFullYear()} YAHope. Todos os direitos reservados.
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
