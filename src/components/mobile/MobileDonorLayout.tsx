import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link, Outlet } from 'react-router-dom';
import { 
  Home, 
  Heart, 
  Briefcase, 
  Newspaper, 
  DollarSign, 
  Bell, 
  LogOut, 
  User, 
  Receipt,
  X,
  CheckCircle,
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';
import { isNative, initializeNativeApp } from '../../lib/capacitor';

export function MobileDonorLayout({ children }: { children?: React.ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { notifications, markAsRead, markAllAsRead, requestPermission, permission } = useNotification();

  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  useEffect(() => {
    // Setup native mobile hooks
    initializeNativeApp();
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  const navItems = [
    { label: 'Visão Geral', path: '/portal/dashboard', icon: Home },
    { label: 'Crianças', path: '/portal/sponsorship', icon: Heart },
    { label: 'Projetos', path: '/portal/projects', icon: Briefcase },
    { label: 'Fazer Doação', path: '/portal/donations', icon: DollarSign },
    { label: 'Minhas Doações', path: '/portal/my-donations', icon: Receipt },
    { label: 'Blog', path: '/portal/blog', icon: Newspaper },
  ];

  const isActive = (path: string) => {
    if (path === '/portal/dashboard') {
      return location.pathname === '/portal' || location.pathname === '/portal/dashboard';
    }
    return location.pathname.startsWith(path);
  };

  const handleLogout = async () => {
    setIsProfileOpen(false);
    await logout();
    navigate('/portal/login');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans select-none">
      {/* Top Header Responsivo: Mobile & Desktop */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 pt-safe transition-all shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          
          {/* Logo & Tag YAH Hope */}
          <div className="flex items-center gap-8">
            <Link to="/portal/dashboard" className="flex items-center gap-3 group">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-[#F49853] to-orange-400 flex items-center justify-center shadow-md shadow-orange-500/20 group-hover:scale-105 transition-transform">
                <Heart className="text-white" size={22} fill="currentColor" />
              </div>
              <div>
                <span className="font-heading font-black text-slate-900 tracking-tight text-xl block leading-tight">
                  YAH Hope
                </span>
                <span className="text-[10px] font-gotham-bold text-[#F49853] uppercase tracking-widest leading-none">
                  Portal do Mantenedor
                </span>
              </div>
            </Link>

            {/* Menu de Navegação Superior (Desktop md:flex) */}
            <nav className="hidden md:flex items-center gap-1 lg:gap-2">
              {navItems.map((item) => {
                const active = isActive(item.path);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`px-3.5 py-2 rounded-xl text-xs font-gotham-bold transition-all flex items-center gap-2 ${
                      active
                        ? 'bg-orange-50 text-[#F49853] shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    <Icon size={16} strokeWidth={active ? 2.5 : 2} className={active ? 'text-[#F49853]' : 'text-slate-400'} />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Ações da Direita: Visitar Site, Notificação e Perfil */}
          <div className="flex items-center gap-3">
            {/* Link para o site principal (apenas desktop) */}
            <Link
              to="/"
              className="hidden lg:flex items-center gap-1.5 text-xs font-gotham-bold text-slate-500 hover:text-slate-900 bg-slate-100 hover:bg-slate-200/80 px-3.5 py-2 rounded-xl transition-all"
            >
              <span>Site Principal</span>
              <ExternalLink size={13} />
            </Link>

            {/* Sino de Notificações */}
            <button
              onClick={() => setIsNotifOpen(true)}
              className="relative p-2.5 rounded-full text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-all cursor-pointer"
              aria-label="Notificações"
            >
              <Bell size={20} />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-rose-500 text-white text-[9px] font-black rounded-full flex items-center justify-center ring-2 ring-white">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {/* Avatar / Menu do Usuário */}
            <button
              onClick={() => setIsProfileOpen(true)}
              className="flex items-center gap-2.5 p-1 pl-1.5 pr-3 rounded-full hover:bg-slate-100 transition-all cursor-pointer border border-slate-200/60"
            >
              <div className="w-8 h-8 rounded-full bg-orange-100 border border-orange-200 text-[#F49853] font-black text-xs flex items-center justify-center shadow-xs">
                {user?.name ? user.name[0].toUpperCase() : 'M'}
              </div>
              <span className="hidden sm:inline text-xs font-gotham-bold text-slate-700 max-w-[120px] truncate">
                {user?.name?.split(' ')[0] || 'Mantenedor'}
              </span>
            </button>
          </div>

        </div>
      </header>

      {/* Main Content View Amplo e Responsivo */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 pt-6 pb-24 md:pb-16">
        {children || <Outlet />}
      </main>

      {/* Bottom Navigation Bar (Visível APENAS no Mobile md:hidden) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-lg border-t border-slate-200/80 pb-safe shadow-lg shadow-slate-900/5">
        <div className="max-w-md mx-auto px-2 flex items-center justify-around h-16">
          {navItems.slice(0, 5).map((item) => {
            const active = isActive(item.path);
            const Icon = item.icon;

            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`relative flex flex-col items-center justify-center w-16 h-14 rounded-2xl transition-all ${
                  active ? 'text-[#F49853] font-bold' : 'text-slate-400 hover:text-slate-600 font-medium'
                }`}
              >
                <div
                  className={`relative p-1.5 rounded-xl transition-all ${
                    active ? 'bg-orange-50 scale-105' : ''
                  }`}
                >
                  <Icon size={20} strokeWidth={active ? 2.5 : 2} />
                  {item.label === 'Crianças' && (
                    <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-rose-500 rounded-full"></span>
                  )}
                </div>
                <span className="text-[10px] mt-0.5 tracking-tight font-black truncate max-w-[58px]">
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Notification Drawer / Modal */}
      {isNotifOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex justify-end">
          <div className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col pt-safe pb-safe animate-slideLeft">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bell className="text-amber-500" size={20} />
                <h3 className="font-black text-slate-900 text-lg">Notificações</h3>
                {unreadCount > 0 && (
                  <span className="text-xs bg-amber-100 text-amber-800 font-black px-2 py-0.5 rounded-full">
                    {unreadCount} novas
                  </span>
                )}
              </div>
              <button
                onClick={() => setIsNotifOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all"
              >
                <X size={20} />
              </button>
            </div>

            {/* Notification Permission Banner if not granted */}
            {permission !== 'granted' && (
              <div className="m-4 p-4 rounded-2xl bg-amber-50 border border-amber-200">
                <p className="text-xs font-bold text-amber-900 mb-2">
                  Ative as notificações para receber novidades sobre suas crianças e a Casa Nutri!
                </p>
                <button
                  onClick={() => requestPermission(user?.id)}
                  className="w-full py-2 bg-amber-500 hover:bg-amber-600 text-white text-xs font-black rounded-xl transition-all shadow-xs"
                >
                  Permitir Notificações Push
                </button>
              </div>
            )}

            {/* Notification Items List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 divide-y divide-slate-100">
              {notifications.length === 0 ? (
                <div className="text-center py-16 text-slate-400 text-xs">
                  <Bell size={32} className="mx-auto mb-2 opacity-30" />
                  Nenhuma notificação no momento.
                </div>
              ) : (
                notifications.map((notif) => (
                  <div
                    key={notif.id}
                    onClick={() => markAsRead(notif.id)}
                    className={`pt-3 first:pt-0 cursor-pointer transition-all ${
                      !notif.read ? 'bg-amber-50/50 p-3 rounded-2xl -mx-1' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="text-xs font-black text-slate-900">{notif.title}</h4>
                      {!notif.read && (
                        <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0 mt-1"></span>
                      )}
                    </div>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">{notif.message}</p>
                    <span className="text-[10px] text-slate-400 mt-2 block font-medium">
                      {new Date(notif.date).toLocaleDateString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                ))
              )}
            </div>

            {notifications.length > 0 && (
              <div className="p-4 border-t border-slate-100">
                <button
                  onClick={markAllAsRead}
                  className="w-full py-2.5 text-xs font-bold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all"
                >
                  Marcar todas como lidas
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Profile / Menu Drawer */}
      {isProfileOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex justify-end">
          <div className="w-full max-w-sm bg-white h-full shadow-2xl flex flex-col pt-safe pb-safe animate-slideLeft">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-black text-slate-900 text-lg">Meu Perfil</h3>
              <button
                onClick={() => setIsProfileOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all"
              >
                <X size={20} />
              </button>
            </div>

            {/* Profile Info Header */}
            <div className="p-6 text-center border-b border-slate-100 bg-slate-50/50">
              <div className="w-16 h-16 rounded-full bg-amber-500 text-white font-black text-xl flex items-center justify-center mx-auto shadow-md shadow-amber-500/20 mb-3">
                {user?.name ? user.name[0].toUpperCase() : 'A'}
              </div>
              <h4 className="font-black text-slate-900 text-base">{user?.name || 'Apoiador YAH Hope'}</h4>
              <p className="text-xs text-slate-500 mt-0.5">{user?.email}</p>
              <div className="inline-flex items-center gap-1.5 mt-2 bg-amber-100 text-amber-800 text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full">
                <Heart size={12} fill="currentColor" /> Apoiador Ativo
              </div>
            </div>

            {/* Profile Menu Links */}
            <div className="p-4 space-y-2 flex-1">
              <Link
                to="/portal/donations"
                onClick={() => setIsProfileOpen(false)}
                className="flex items-center justify-between p-3.5 rounded-2xl text-slate-700 hover:bg-slate-100 transition-all text-xs font-bold"
              >
                <div className="flex items-center gap-3">
                  <Receipt size={18} className="text-amber-500" />
                  <span>Minhas Doações & Recibos</span>
                </div>
                <ChevronRight size={16} className="text-slate-400" />
              </Link>

              <Link
                to="/portal/sponsorship"
                onClick={() => setIsProfileOpen(false)}
                className="flex items-center justify-between p-3.5 rounded-2xl text-slate-700 hover:bg-slate-100 transition-all text-xs font-bold"
              >
                <div className="flex items-center gap-3">
                  <Heart size={18} className="text-rose-500" />
                  <span>Crianças Apadrinhadas</span>
                </div>
                <ChevronRight size={16} className="text-slate-400" />
              </Link>

              <Link
                to="/politica-de-privacidade"
                onClick={() => setIsProfileOpen(false)}
                className="flex items-center justify-between p-3.5 rounded-2xl text-slate-700 hover:bg-slate-100 transition-all text-xs font-bold"
              >
                <div className="flex items-center gap-3">
                  <User size={18} className="text-slate-400" />
                  <span>Política de Privacidade</span>
                </div>
                <ChevronRight size={16} className="text-slate-400" />
              </Link>
            </div>

            {/* Logout Button */}
            <div className="p-4 border-t border-slate-100 pb-safe">
              <button
                onClick={handleLogout}
                className="w-full py-3 px-4 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-black flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
              >
                <LogOut size={16} />
                <span>Sair da Conta</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
