import { Outlet, useLocation } from 'react-router-dom';
import { PublicHeader } from './PublicHeader';
import { PublicFooter } from './PublicFooter';

export function PublicLayout() {
  const location = useLocation();
  const isLoginPage = location.pathname === '/login' || location.pathname === '/set-password' || location.pathname === '/cadastro-apadrinhador';

  if (isLoginPage) {
    return (
      <main className="min-h-screen bg-slate-900">
        <Outlet />
      </main>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-white font-gotham-regular text-slate-800 antialiased selection:bg-[#F49853] selection:text-white">
      <PublicHeader />
      <main className="flex-1 flex flex-col">
        <Outlet />
      </main>
      <PublicFooter />
    </div>
  );
}
