import { Link, Outlet } from 'react-router-dom';
import { Heart } from 'lucide-react';

export function PublicLayout() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center">
                <Heart size={18} className="text-white" />
              </div>
              <span className="font-bold text-xl text-slate-900 tracking-tight">YAHope</span>
            </div>
            
            <nav className="hidden md:flex items-center gap-8">
              <Link to="/" className="text-sm font-medium text-slate-600 hover:text-emerald-600 transition-colors">Início</Link>
              <Link to="/blog" className="text-sm font-medium text-slate-600 hover:text-emerald-600 transition-colors">Blog</Link>
              <Link to="/loja" className="text-sm font-medium text-slate-600 hover:text-emerald-600 transition-colors">Loja</Link>
            </nav>

            <div className="flex items-center gap-4">
              <Link 
                to="/login"
                className="text-sm font-medium text-emerald-700 hover:text-emerald-800 transition-colors"
              >
                Entrar
              </Link>
              <Link 
                to="/login"
                className="text-sm font-medium bg-emerald-600 text-white px-4 py-2 rounded-xl hover:bg-emerald-700 transition-colors"
              >
                Apadrinhar
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="bg-slate-900 text-slate-400 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex justify-center items-center gap-2 mb-4">
            <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center">
              <Heart size={18} className="text-white" />
            </div>
            <span className="font-bold text-xl text-white tracking-tight">YAHope</span>
          </div>
          <p className="text-sm mb-8">Transformando vidas através da nutrição, educação e comunidade.</p>
          <div className="text-xs">
            &copy; {new Date().getFullYear()} YAHope. Todos os direitos reservados.
          </div>
        </div>
      </footer>
    </div>
  );
}
