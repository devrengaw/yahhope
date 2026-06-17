import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, ClipboardList, Settings, Package, Menu, X, Stethoscope, Briefcase, DollarSign, Calendar, LogOut, ArrowLeft, Home, Heart, ShoppingBag, BarChart3, Globe, MessageSquare, Newspaper, TrendingUp, Gift, Target, Mail, Activity, Plus } from 'lucide-react';
import { cn } from '../lib/utils';
import { useAuth } from '../contexts/AuthContext';
import { ChatWidget } from './ChatWidget';
import { NotificationBell } from './NotificationBell';

import { useWorkspace } from '../contexts/WorkspaceContext';

const nutritionNavItems = [
  { name: 'Dashboard', path: '/nutrition', icon: LayoutDashboard },
  { name: 'Crianças', path: '/nutrition/patients', icon: Users },
  { name: 'Atendimento', path: '/nutrition/atendimento', icon: Stethoscope },
  { name: 'Fila de Espera', path: '/nutrition/waiting-list', icon: ClipboardList },
  { name: 'Atualizações Apoiador', path: '/nutrition/updates', icon: Newspaper },
  { name: 'Estoque', path: '/nutrition/inventory', icon: Package },
  { name: 'Visitas', path: '/nutrition/visits', icon: Home },
  { name: 'Gestão', path: '/nutrition/management', icon: Settings },
];

const workspaceNavItems = [
  { name: 'Dashboard Pessoal', path: '/workspace', icon: LayoutDashboard },
  { name: 'Projetos', path: '/workspace/projects', icon: Briefcase },
  { name: 'Financeiro', path: '/workspace/finance', icon: DollarSign },
  { name: 'Equipe', path: '/workspace/team', icon: Users },
  { name: 'Agenda', path: '/workspace/calendar', icon: Calendar },
];

const adminNavItems = [
  { name: 'Feed de Impacto', path: '/admin/impact-feed', icon: TrendingUp },
  { name: 'Mensagens', path: '/admin/messages', icon: MessageSquare },
  { name: 'Captação', path: '/admin/fundraising', icon: Target },
  { name: 'Projetos Globais', path: '/admin/projects', icon: Briefcase },
  { name: 'Projetos Locais', path: '/admin/local-projects', icon: Heart },
  { name: 'Usuários', path: '/admin/users', icon: Users },
  { name: 'Financeiro', path: '/admin/finance', icon: DollarSign },
  { name: 'Presentes', path: '/admin/gifts', icon: Gift },
  { name: 'Gestão da Loja', path: '/admin/store', icon: ShoppingBag },
  { name: 'Geral', path: '/admin/settings', icon: Globe },
];

const communicationNavItems = [
  { name: 'Dashboard', path: '/communication', icon: LayoutDashboard },
  { name: 'Projetos', path: '/communication/projects', icon: Briefcase },
  { name: 'Chat', path: '/communication/chat', icon: MessageSquare },
  { name: 'Blog', path: '/communication/blog', icon: Newspaper },
  { name: 'Templates de E-mail', path: '/communication/email-templates', icon: Mail },
  { name: 'Gestão', path: '/communication/management', icon: Settings },
];

const supporterNavItems = [
  { name: 'Painel', path: '/portal/dashboard', icon: LayoutDashboard },
  { name: 'Presentes', path: '/portal/gifts', icon: Gift },
  { name: 'Apadrinhar', path: '/portal/sponsorship', icon: Heart },
  { name: 'Loja Solidária', path: '/portal/shop', icon: ShoppingBag },
  { name: 'Meu Impacto', path: '/portal/impact', icon: BarChart3 },
];

export function Layout({ children, module }: { children: React.ReactNode, module: 'nutrition' | 'workspace' | 'admin' | 'communication' | 'supporter' }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  
  const workspaceData = useWorkspace();
  const { channels, addChannel } = workspaceData || {};

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isChannelModalOpen, setIsChannelModalOpen] = useState(false);
  const [newChannelName, setNewChannelName] = useState('');

  const initialNavItems = 
    module === 'nutrition' ? nutritionNavItems : 
    module === 'workspace' ? workspaceNavItems : 
    module === 'communication' ? communicationNavItems :
    module === 'supporter' ? supporterNavItems :
    adminNavItems;
  
  // Filter items by permission (simplified mapping)
  const navItems = initialNavItems.filter(item => {
    if (module === 'supporter' || module === 'workspace') return true; // Workspace is open to all who log in
    
    // Check if the path or a part of it is in user's permissions
    const permissionKey = item.path.split('/').pop() || 'dashboard';
    const isDashboard = item.path === '/nutrition' || item.path === '/admin' || item.path === '/communication';
    const finalKey = isDashboard ? 'dashboard' : (permissionKey === 'atendimento' ? 'attendance' : (permissionKey === 'estoque' ? 'inventory' : (permissionKey === 'settings' ? 'settings' : (permissionKey === 'blog' ? 'blog' : (permissionKey === 'chat' ? 'chat' : permissionKey)))));
    
    return user?.permissions.includes(finalKey);
  });

  const moduleName = 
    module === 'nutrition' ? 'Nutrição Infantil' : 
    module === 'workspace' ? 'Meu Workspace' : 
    module === 'communication' ? 'Comunicação' :
    module === 'supporter' ? 'Portal do Apoiador' :
    'YAH Hope Admin';
    
  
  const isLightSidebar = module === 'supporter';

  const getThemeClasses = () => {
    if (isLightSidebar) {
      return {
        mobileHeader: "bg-white text-slate-900",
        sidebarBg: "bg-white border-slate-100 text-slate-600",
        moduleName: "text-slate-400",
        itemActiveBg: "bg-amber-50 text-amber-600 shadow-sm",
        itemInactiveBg: "text-slate-500 hover:bg-slate-50 hover:text-slate-900",
        iconActive: "text-amber-500",
        iconInactive: "text-slate-400",
        borderTop: "border-slate-100",
        backLink: "text-slate-400 hover:text-slate-600",
        avatarBg: "bg-amber-500 border-amber-400 group-hover:border-amber-600",
        roleText: "text-slate-400",
        logoutBtn: "text-slate-400 hover:text-slate-600 hover:bg-slate-50"
      };
    }
    switch (module) {
      case 'nutrition':
        return {
          mobileHeader: "bg-emerald-700 text-white",
          sidebarBg: "bg-emerald-800 border-transparent text-emerald-50",
          moduleName: "text-emerald-300",
          itemActiveBg: "bg-emerald-900/40 text-slate-50 shadow-inner",
          itemInactiveBg: "text-emerald-200 hover:bg-emerald-600/50 hover:text-white",
          iconActive: "text-emerald-100",
          iconInactive: "text-emerald-300",
          borderTop: "border-emerald-700/50",
          backLink: "text-emerald-200 hover:text-white",
          avatarBg: "bg-emerald-600 border-emerald-500 group-hover:border-white",
          roleText: "text-emerald-300",
          logoutBtn: "text-emerald-300 hover:text-white hover:bg-emerald-700/50"
        };
      case 'workspace':
        return {
          mobileHeader: "bg-[#1E1F21] text-white",
          sidebarBg: "bg-[#878787] border-transparent text-white",
          moduleName: "text-slate-200",
          itemActiveBg: "bg-black/20 text-white shadow-inner",
          itemInactiveBg: "text-white/80 hover:bg-white/10 hover:text-white",
          iconActive: "text-white",
          iconInactive: "text-white/70",
          borderTop: "border-white/20",
          backLink: "text-white/80 hover:text-white",
          avatarBg: "bg-black/20 border-transparent group-hover:border-white",
          roleText: "text-white/70",
          logoutBtn: "text-white/80 hover:text-white hover:bg-white/10"
        };
      case 'communication':
        return {
          mobileHeader: "bg-[#92BF78] text-white",
          sidebarBg: "bg-[#92BF78] border-transparent text-white",
          moduleName: "text-white/80",
          itemActiveBg: "bg-black/20 text-white shadow-inner",
          itemInactiveBg: "text-white/80 hover:bg-white/10 hover:text-white",
          iconActive: "text-white",
          iconInactive: "text-white/80",
          borderTop: "border-white/20",
          backLink: "text-white/80 hover:text-white",
          avatarBg: "bg-black/20 border-transparent group-hover:border-white",
          roleText: "text-white/80",
          logoutBtn: "text-white/80 hover:text-white hover:bg-white/10"
        };
      case 'admin':
      default:
        return {
          mobileHeader: "bg-[#88A1F2] text-white",
          sidebarBg: "bg-[#88A1F2] border-transparent text-white",
          moduleName: "text-white/80",
          itemActiveBg: "bg-black/20 text-white shadow-inner",
          itemInactiveBg: "text-white/80 hover:bg-white/10 hover:text-white",
          iconActive: "text-white",
          iconInactive: "text-white/80",
          borderTop: "border-white/20",
          backLink: "text-white/80 hover:text-white",
          avatarBg: "bg-black/20 border-transparent group-hover:border-white",
          roleText: "text-white/80",
          logoutBtn: "text-white/80 hover:text-white hover:bg-white/10"
        };
    }
  };

  const theme = getThemeClasses();


  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const hasNutrition = user?.permissions && user.permissions.some(p => ['patients', 'attendance', 'inventory', 'management', 'updates', 'visits'].includes(p));
  const hasCommunication = user?.permissions && user.permissions.some(p => ['projects', 'chat', 'blog', 'email-templates'].includes(p));
  const hasAdmin = user?.permissions && user.permissions.some(p => ['settings', 'impact-feed', 'messages', 'gifts', 'fundraising', 'store', 'local-projects', 'users'].includes(p));

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row overflow-hidden">
      
      {/* Primary Sidebar - Workspaces */}
      {module !== 'supporter' && (
        <div className="w-16 sm:w-[72px] bg-[#F49853] flex-col items-center py-4 shrink-0 shadow-2xl z-30 hidden md:flex">
          <Link 
            to="/workspace" 
            className={cn("w-12 h-12 rounded-2xl flex items-center justify-center transition-all group relative", module === 'workspace' ? 'bg-black/15 text-white shadow-lg shadow-black/5' : 'text-white/70 hover:bg-white/10 hover:text-white')}
          >
            <Home size={22} className={module === 'workspace' ? '' : 'group-hover:scale-110 transition-transform'} />
          </Link>
          
          <div className="w-8 h-px bg-white/20 my-4 rounded-full" />
          
          <div className="flex flex-col gap-3 mt-2">
            {hasNutrition && (
              <Link 
                to="/nutrition" 
                className={cn("w-12 h-12 rounded-2xl flex items-center justify-center transition-all group relative", module === 'nutrition' ? 'bg-black/15 text-white shadow-lg shadow-black/5' : 'text-white/70 hover:bg-white/10 hover:text-white')}
              >
                <Activity size={22} className={module === 'nutrition' ? '' : 'group-hover:scale-110 transition-transform'} />
              </Link>
            )}
            
            {hasCommunication && (
              <Link 
                to="/communication" 
                className={cn("w-12 h-12 rounded-2xl flex items-center justify-center transition-all group relative", module === 'communication' ? 'bg-black/15 text-white shadow-lg shadow-black/5' : 'text-white/70 hover:bg-white/10 hover:text-white')}
              >
                <MessageSquare size={22} className={module === 'communication' ? '' : 'group-hover:scale-110 transition-transform'} />
              </Link>
            )}
            
            {hasAdmin && (
              <Link 
                to="/admin" 
                className={cn("w-12 h-12 rounded-2xl flex items-center justify-center transition-all group relative", module === 'admin' ? 'bg-black/15 text-white shadow-lg shadow-black/5' : 'text-white/70 hover:bg-white/10 hover:text-white')}
              >
                <Settings size={22} className={module === 'admin' ? '' : 'group-hover:scale-110 transition-transform'} />
              </Link>
            )}
          </div>
        </div>
      )}

      {/* Main Content Area containing Secondary Sidebar and Page */}
      <div className="flex-1 flex flex-col md:flex-row relative">
        {/* Mobile Header */}
        <div className={cn(
          "md:hidden p-4 flex justify-between items-center shadow-md z-20 transition-colors shrink-0",
          theme.mobileHeader
        )}>
          <div className="flex items-center">
            <img src="/logo.png" alt="YAH Hope" className={cn("h-6 object-contain", isLightSidebar ? "brightness-0" : "")} />
          </div>
          <div className="flex items-center gap-4">
            <NotificationBell isLight={isLightSidebar} />
            <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
              {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Secondary Sidebar */}
        <aside
          className={cn(
            "fixed inset-y-0 left-0 z-40 w-64 transform transition-transform duration-200 ease-in-out md:relative md:translate-x-0 shadow-xl flex flex-col border-r",
          theme.sidebarBg,
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="p-6 hidden md:block shrink-0">
          <div className={cn("font-bold text-2xl tracking-tight flex items-center justify-between gap-2 w-full", isLightSidebar ? "text-slate-900" : "text-white")}>
            <div className="flex items-center gap-2 w-full">
              <img src="/logo.png" alt="YAH Hope" className={cn("h-8 object-contain", isLightSidebar ? "brightness-0" : "")} />
            </div>
            <NotificationBell isLight={isLightSidebar} />
          </div>
          <p className={cn("text-xs mt-1 font-medium tracking-wider uppercase", theme.moduleName)}>{moduleName}</p>
        </div>

        
        <nav className="mt-6 md:mt-2 flex-1 overflow-y-auto" aria-label="Navegação Lateral">
          {module === 'workspace' ? (
            <div className="px-3 pb-4">
              <div className="mb-6">
                <div className="flex items-center justify-between px-4 mb-2">
                  <p className={cn("text-xs font-bold uppercase tracking-wider", theme.roleText)}>Canais</p>
                  {user?.role === 'ADMIN' && (
                    <button 
                      onClick={() => setIsChannelModalOpen(true)}
                      className="text-slate-400 hover:text-white transition-colors"
                    >
                      <Plus size={14} />
                    </button>
                  )}
                </div>
                <ul className="space-y-1">
                  {channels?.map(channel => (
                    <li key={channel.id}>
                      <Link
                        to={`/workspace/chat/${channel.id}`}
                        onClick={() => setIsMobileMenuOpen(false)}
                        className={cn(
                          "w-full flex items-center gap-3 px-4 py-1.5 rounded-md text-sm transition-all duration-300 group",
                          location.pathname === `/workspace/chat/${channel.id}` || (channel.id === 'geral' && location.pathname === '/workspace')
                            ? theme.itemActiveBg
                            : theme.itemInactiveBg
                        )}
                      >
                        <span className="font-light text-lg opacity-70">#</span>
                        <span className={cn(location.pathname === `/workspace/chat/${channel.id}` || (channel.id === 'geral' && location.pathname === '/workspace') ? "font-bold" : "")}>
                          {channel.name}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mb-6">
                <p className={cn("px-4 text-xs font-bold uppercase tracking-wider mb-2", theme.roleText)}>Mensagens Diretas</p>
                <div className="px-4 text-sm text-slate-500 italic opacity-70">
                  Nenhuma conversa ativa
                </div>
              </div>

              <div>
                <p className={cn("px-4 text-xs font-bold uppercase tracking-wider mb-2", theme.roleText)}>Organização</p>
                <ul className="space-y-1">
                  <li>
                    <Link
                      to="/workspace/projects"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={cn(
                        "w-full flex items-center gap-3 px-4 py-1.5 rounded-md text-sm transition-all duration-300 group",
                        location.pathname.startsWith('/workspace/projects')
                          ? theme.itemActiveBg
                          : theme.itemInactiveBg
                      )}
                    >
                      <Briefcase size={16} className={location.pathname.startsWith('/workspace/projects') ? theme.iconActive : theme.iconInactive} />
                      <span className={cn(location.pathname.startsWith('/workspace/projects') ? "font-bold" : "")}>Projetos</span>
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/workspace/calendar"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={cn(
                        "w-full flex items-center gap-3 px-4 py-1.5 rounded-md text-sm transition-all duration-300 group",
                        location.pathname.startsWith('/workspace/calendar')
                          ? theme.itemActiveBg
                          : theme.itemInactiveBg
                      )}
                    >
                      <Calendar size={16} className={location.pathname.startsWith('/workspace/calendar') ? theme.iconActive : theme.iconInactive} />
                      <span className={cn(location.pathname.startsWith('/workspace/calendar') ? "font-bold" : "")}>Agenda</span>
                    </Link>
                  </li>
                </ul>
              </div>
            </div>
          ) : (
            <ul className="space-y-1 px-3">
              {navItems.map((item) => {
                const isActive = location.pathname === item.path || (item.path !== (module === 'nutrition' ? '/nutrition' : module === 'workspace' ? '/workspace' : module === 'communication' ? '/communication' : '/admin') && location.pathname.startsWith(item.path));
                return (
                  <li key={item.path}>
                    <Link
                      to={item.path}
                      onClick={() => setIsMobileMenuOpen(false)}
                        className={cn(
                          "w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-black transition-all duration-300 group",
                          isActive ? theme.itemActiveBg : theme.itemInactiveBg
                        )}
                      >
                        <item.icon size={20} className={isActive ? theme.iconActive : theme.moduleName} />
                      {item.name}
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </nav>
  
        
        <div className={cn("shrink-0 p-4 border-t", theme.borderTop)}>
          {user?.role === 'ADMIN' && (
            <Link to="/admin" className={cn("flex items-center gap-2 text-sm font-bold mb-4 px-2 transition-colors", theme.backLink)}>
              <ArrowLeft size={16} /> Voltar aos Módulos
            </Link>
          )}
          <div className="flex items-center justify-between px-2">
            <Link 
              to="/admin/profile" 
              className="flex items-center gap-3 hover:opacity-80 transition-opacity group"
            >
              <div className={cn("w-10 h-10 rounded-full flex items-center justify-center text-white font-bold border-2 shadow-sm transition-colors", theme.avatarBg)}>
                {user?.avatar || (user?.name ? user.name.charAt(0) : 'U')}
              </div>
              <div className="overflow-hidden text-left">
                <p className={cn("text-sm font-bold truncate", isLightSidebar ? "text-slate-900" : "text-white")}>{user?.name || 'Usuário'}</p>
                <p className={cn("text-[10px] uppercase tracking-wider font-black", theme.moduleName)}>{user?.role || 'Visitante'}</p>
              </div>
            </Link>
            <button 
              onClick={handleLogout} 
              className={cn("p-2 rounded-lg transition-colors tooltip-target", theme.logoutBtn)} 
              title="Sair"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto w-full">
        <div className="p-4 md:p-8 max-w-7xl mx-auto">
          {children}
        </div>
        {/* Floating Chat for Supporters */}
        {module === 'supporter' && <ChatWidget />}
      </main>
      
      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-0 md:hidden transition-all duration-300"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
      </div> {/* Closes Main Content Area */}

      {/* New Channel Modal */}
      {isChannelModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">Criar Novo Canal</h3>
              <button onClick={() => setIsChannelModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nome do canal</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-slate-400">#</span>
                  </div>
                  <input
                    type="text"
                    value={newChannelName}
                    onChange={(e) => setNewChannelName(e.target.value.toLowerCase().replace(/\s+/g, '-'))}
                    placeholder="ex: marketing"
                    className="w-full pl-8 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <p className="text-xs text-slate-500 mt-1">Nomes devem conter letras minúsculas, números e hifens.</p>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => setIsChannelModalOpen(false)}
                  className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-100 rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => {
                    if (newChannelName.trim() && addChannel) {
                      addChannel({ name: newChannelName, description: '', isPrivate: false, members: [user?.name || 'User'] });
                      setIsChannelModalOpen(false);
                      setNewChannelName('');
                      navigate(`/workspace/chat/${newChannelName}`);
                    }
                  }}
                  disabled={!newChannelName.trim()}
                  className="px-4 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  Criar Canal
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

