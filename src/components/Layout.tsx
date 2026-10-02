import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, ClipboardList, Settings, Package, Menu, X, Stethoscope, Briefcase, DollarSign, Calendar, LogOut, ArrowLeft, Home, Heart, ShoppingBag, BarChart3, Globe, MessageSquare, Newspaper, TrendingUp, Gift, Target, Mail, Activity, Plus, Sparkles, Megaphone, Send, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
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
  { name: 'Finanças', path: '/nutrition/finance', icon: DollarSign },
  { name: 'Gestão', path: '/nutrition/management', icon: Settings },
];

const workspaceNavItems = [
  { name: 'Início', path: '/workspace/inicio', icon: Home },
  { name: 'Minhas Tarefas', path: '/workspace/my-tasks', icon: ClipboardList },
  { name: 'Projetos', path: '/workspace/projects', icon: Briefcase },
  { name: 'Agenda', path: '/workspace/calendar', icon: Calendar },
  { name: 'Caixa de Entrada', path: '/workspace/inbox', icon: Mail },
];

const adminNavItems = [
  { name: 'Dashboard de Acessos', path: '/admin/analytics', icon: BarChart3 },
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
  { name: 'Aviso do Topo', path: '/communication/top-banner', icon: Megaphone },
  { name: 'Destaques Home', path: '/communication/home-highlights', icon: Sparkles },
  { name: 'Cards de Impacto', path: '/communication/impact-metrics', icon: BarChart3 },
  { name: 'Projetos', path: '/communication/projects', icon: Briefcase },
  { name: 'Chat', path: '/communication/chat', icon: MessageSquare },
  { name: 'Blog', path: '/communication/blog', icon: Newspaper },
  { name: 'Disparo de E-mails', path: '/communication/campaigns', icon: Send },
  { name: 'Templates de E-mail', path: '/communication/email-templates', icon: Mail },
  { name: 'Custos Fixos & Variados', path: '/communication/costs', icon: DollarSign },
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
  const [isDesktopSidebarHidden, setIsDesktopSidebarHidden] = useState(false);
  const [isChannelModalOpen, setIsChannelModalOpen] = useState(false);
  const [newChannelName, setNewChannelName] = useState('');

  // Fechar o menu automaticamente ao mudar de rota
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  // Fechar ao pressionar a tecla Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsMobileMenuOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const isAdmin = user?.role === 'ADMIN';

  // Workspace: Admin e membros com perfil de equipe/projeto (exceto Apoiador e Observador)
  const hasWorkspace = 
    isAdmin || 
    (user?.role !== 'OBSERVER' && user?.role !== 'SPONSOR' && (
      !user?.permissions || 
      user.permissions.length === 0 || 
      user.permissions.some(p => ['workspace', 'projects', 'team', 'calendar', 'tasks', 'my-tasks', 'inicio', 'inbox', 'dashboard', 'all'].includes(p))
    ));

  // Nutrição Infantil: Admin, Observador, funções clínicas ou permissões de nutrição
  const nutritionPermissions = ['patients', 'attendance', 'waiting-list', 'inventory', 'visits', 'atendimento', 'nutrition', 'nutrition-finance', 'updates'];
  const hasNutrition = 
    isAdmin || 
    user?.role === 'OBSERVER' ||
    ['STAFF', 'SOCIAL_WORKER', 'NURSE', 'DOCTOR', 'ACS', 'COORDINATOR'].includes(user?.role || '') ||
    Boolean(user?.permissions && user.permissions.some(p => nutritionPermissions.includes(p)));

  // Comunicação: Admin ou quem possui permissões de comunicação
  const communicationPermissions = ['projects', 'chat', 'blog', 'campaigns', 'email-templates', 'communication', 'top-banner', 'home-highlights', 'impact-metrics'];
  const hasCommunication = 
    isAdmin || 
    Boolean(user?.permissions && user.permissions.some(p => communicationPermissions.includes(p)));

  // Administração: Admin ou usuário com permissões administrativas explícitas
  const adminPermissions = ['settings', 'impact-feed', 'fundraising', 'store', 'local-projects', 'users', 'finance', 'analytics', 'top-banner', 'home-highlights', 'impact-metrics', 'gifts', 'admin'];
  const hasAdmin = 
    isAdmin || 
    Boolean(user?.permissions && user.permissions.some(p => adminPermissions.includes(p)));

  const initialNavItems = 
    module === 'nutrition' ? nutritionNavItems : 
    module === 'workspace' ? workspaceNavItems : 
    module === 'communication' ? communicationNavItems :
    module === 'supporter' ? supporterNavItems :
    adminNavItems;
  
  // Filter items by permission
  const navItems = initialNavItems.filter(item => {
    // Admin has access to all items unconditionally
    if (isAdmin) return true;

    // Supporter and Workspace items are available to all authorized users
    if (module === 'supporter' || module === 'workspace') return true;

    // If permissions array is empty or includes 'all', allow all items for this module
    if (!user?.permissions || user.permissions.length === 0 || user.permissions.includes('all')) return true;

    // Check if the path or a part of it is in user's permissions
    const permissionKey = item.path.split('/').pop() || 'dashboard';
    const isDashboard = item.path === '/nutrition' || item.path === '/admin' || item.path === '/communication' || permissionKey === 'analytics';
    if (isDashboard) return true;

    const mappedKey = 
      permissionKey === 'atendimento' ? 'attendance' :
      permissionKey === 'estoque' ? 'inventory' :
      permissionKey === 'top-banner' ? 'settings' :
      permissionKey === 'home-highlights' ? 'settings' :
      permissionKey === 'impact-metrics' ? 'settings' :
      permissionKey === 'nutrition-finance' ? 'finance' :
      permissionKey;

    const actualKey = 
      (module === 'nutrition' && (mappedKey === 'finance' || mappedKey === 'costs')) ? 'nutrition-finance' : 
      (module === 'communication' && (mappedKey === 'costs' || mappedKey === 'finance')) ? 'communication-finance' : 
      mappedKey;

    return user.permissions.includes(actualKey) || user.permissions.includes(permissionKey) || user.permissions.includes(item.path);
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
          mobileHeader: "bg-[#EBC878] text-slate-900",
          sidebarBg: "bg-[#EBC878] border-transparent text-slate-900",
          moduleName: "text-slate-700",
          itemActiveBg: "bg-black/10 text-slate-900 shadow-inner",
          itemInactiveBg: "text-slate-800 hover:bg-black/5 hover:text-slate-900",
          iconActive: "text-slate-900",
          iconInactive: "text-slate-700",
          borderTop: "border-black/10",
          backLink: "text-slate-700 hover:text-slate-900",
          avatarBg: "bg-black/10 border-transparent group-hover:border-slate-900",
          roleText: "text-slate-700",
          logoutBtn: "text-slate-700 hover:text-slate-900 hover:bg-black/5"
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

  const getMobileBottomNavItems = () => {
    switch (module) {
      case 'nutrition':
        return [
          { name: 'Início', path: '/nutrition', icon: LayoutDashboard },
          { name: 'Crianças', path: '/nutrition/patients', icon: Users },
          { name: 'Atendimento', path: '/nutrition/atendimento', icon: Stethoscope },
          { name: 'Fila', path: '/nutrition/waiting-list', icon: ClipboardList },
        ];
      case 'workspace':
        return [
          { name: 'Início', path: '/workspace/inicio', icon: Home },
          { name: 'Tarefas', path: '/workspace/my-tasks', icon: ClipboardList },
          { name: 'Projetos', path: '/workspace/projects', icon: Briefcase },
          { name: 'Agenda', path: '/workspace/calendar', icon: Calendar },
        ];
      case 'communication':
        return [
          { name: 'Início', path: '/communication', icon: LayoutDashboard },
          { name: 'Projetos', path: '/communication/projects', icon: Briefcase },
          { name: 'Chat', path: '/communication/chat', icon: MessageSquare },
          { name: 'Disparos', path: '/communication/campaigns', icon: Send },
        ];
      case 'admin':
      default:
        return [
          { name: 'Acessos', path: '/admin/analytics', icon: BarChart3 },
          { name: 'Captação', path: '/admin/fundraising', icon: Target },
          { name: 'Financeiro', path: '/admin/finance', icon: DollarSign },
          { name: 'Mensagens', path: '/admin/messages', icon: MessageSquare },
        ];
    }
  };

  const theme = getThemeClasses();


  const handleLogout = () => {
    logout();
    navigate('/login');
  };


  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row overflow-hidden">
      
      {/* Primary Sidebar - Workspaces & Módulos no PC */}
      {module !== 'supporter' && user?.role !== 'OBSERVER' && (
        <div className="w-16 sm:w-[72px] bg-[#878787] flex-col items-center py-4 shrink-0 shadow-2xl z-30 hidden md:flex">
          {hasWorkspace && (
            <Link 
              to="/workspace" 
              title="Meu Workspace"
              className={cn("w-12 h-12 rounded-2xl flex items-center justify-center transition-all group relative", (module as string) === 'workspace' ? 'bg-black/15 text-white shadow-lg shadow-black/5' : 'text-white/70 hover:bg-white/10 hover:text-white')}
            >
              <Home size={22} className={(module as string) === 'workspace' ? '' : 'group-hover:scale-110 transition-transform'} />
            </Link>
          )}
          
          <div className="w-8 h-px bg-white/20 my-4 rounded-full" />
          
          <div className="flex flex-col gap-3 mt-2">
            {hasNutrition && (
              <Link 
                to="/nutrition" 
                title="Nutrição Infantil"
                className={cn("w-12 h-12 rounded-2xl flex items-center justify-center transition-all group relative", module === 'nutrition' ? 'bg-black/15 text-white shadow-lg shadow-black/5' : 'text-white/70 hover:bg-white/10 hover:text-white')}
              >
                <Activity size={22} className={module === 'nutrition' ? '' : 'group-hover:scale-110 transition-transform'} />
              </Link>
            )}
            
            {hasCommunication && (
              <Link 
                to="/communication" 
                title="Comunicação"
                className={cn("w-12 h-12 rounded-2xl flex items-center justify-center transition-all group relative", module === 'communication' ? 'bg-black/15 text-white shadow-lg shadow-black/5' : 'text-white/70 hover:bg-white/10 hover:text-white')}
              >
                <MessageSquare size={22} className={module === 'communication' ? '' : 'group-hover:scale-110 transition-transform'} />
              </Link>
            )}
            
            {hasAdmin && (
              <Link 
                to="/admin" 
                title="Administração"
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
        {/* Mobile Header with Safe Area for Notch and Status Bar */}
        <div className={cn(
          "md:hidden px-4 pt-[calc(0.85rem+env(safe-area-inset-top,0px))] pb-3.5 flex justify-between items-center shadow-md z-30 transition-colors shrink-0",
          theme.mobileHeader
        )}>
          <div className="flex items-center gap-2.5">
            <button 
              onClick={() => setIsMobileMenuOpen(prev => !prev)} 
              aria-label={isMobileMenuOpen ? "Fechar Menu Lateral" : "Abrir Menu Lateral"}
              className="px-2.5 py-1.5 rounded-xl bg-black/15 active:scale-95 transition-all text-white flex items-center gap-1.5 text-xs font-bold shadow-xs cursor-pointer"
            >
              {isMobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
              <span className="text-[11px]">{isMobileMenuOpen ? 'Fechar' : 'Menu'}</span>
            </button>
            <div className="flex items-center gap-2">
              <img src="/logo.png" alt="YAH Hope" className={cn("h-6 object-contain", isLightSidebar ? "brightness-0" : "")} />
              <span className="text-xs font-bold opacity-90 truncate max-w-[140px]">{moduleName}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <NotificationBell isLight={isLightSidebar} />
          </div>
        </div>

        {/* Secondary Sidebar */}
        <aside
          className={cn(
            "fixed inset-y-0 left-0 z-50 w-72 max-w-[85vw] transform transition-transform duration-300 ease-in-out shadow-2xl flex flex-col border-r pt-safe pb-safe",
            theme.sidebarBg,
            module === 'workspace' 
              ? "md:hidden" 
              : (isDesktopSidebarHidden ? "md:hidden" : "md:relative md:translate-x-0 md:shadow-none"),
            isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
          )}
        >
          {/* Header Mobile do Menu Lateral com botão Fechar bem destacado */}
          <div className={cn("p-4 md:hidden flex items-center justify-between border-b shrink-0", theme.borderTop)}>
            <div className="flex items-center gap-2.5">
              <img src="/logo.png" alt="YAH Hope" className={cn("h-7 object-contain", isLightSidebar ? "brightness-0" : "")} />
              <div>
                <p className={cn("text-xs font-black leading-tight", isLightSidebar ? "text-slate-900" : "text-white")}>YAH Hope</p>
                <p className={cn("text-[10px] font-semibold uppercase tracking-wider", theme.moduleName)}>{moduleName}</p>
              </div>
            </div>
            <button
              onClick={() => setIsMobileMenuOpen(false)}
              className={cn(
                "px-3 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 text-xs font-bold shadow-xs active:scale-95",
                isLightSidebar 
                  ? "bg-slate-100 text-slate-700 hover:bg-slate-200" 
                  : "bg-white/20 text-white hover:bg-white/30 border border-white/20"
              )}
              aria-label="Esconder menu lateral"
            >
              <span>Esconder</span>
              <X size={16} />
            </button>
          </div>

          {/* Header Desktop da Barra Lateral */}
          <div className="p-6 hidden md:block shrink-0">
            <div className={cn("font-bold text-2xl tracking-tight flex items-center justify-between gap-2 w-full", isLightSidebar ? "text-slate-900" : "text-white")}>
              <div className="flex items-center gap-2">
                <img src="/logo.png" alt="YAH Hope" className={cn("h-8 object-contain", isLightSidebar ? "brightness-0" : "")} />
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsDesktopSidebarHidden(true)}
                  className="p-1.5 rounded-lg hover:bg-white/10 text-white/70 hover:text-white transition-colors cursor-pointer"
                  title="Esconder menu lateral no computador"
                  aria-label="Esconder menu lateral"
                >
                  <PanelLeftClose size={18} />
                </button>
                <NotificationBell isLight={isLightSidebar} />
              </div>
            </div>
            <p className={cn("text-xs mt-1 font-medium tracking-wider uppercase", theme.moduleName)}>{moduleName}</p>
          </div>

          {/* Seletor de Módulos (Apenas Mobile - no PC fica apenas na barra lateral cinza) */}
          {module !== 'supporter' && user?.role !== 'OBSERVER' && (
            <div className={cn("md:hidden p-3 border-b shrink-0", theme.borderTop)}>
              <div className="flex items-center justify-between mb-2 px-1">
                <p className={cn("text-[10px] font-black uppercase tracking-wider", theme.roleText)}>
                  Módulos do Sistema
                </p>
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-black/10 font-bold opacity-80">
                  Alternar
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {hasWorkspace && (
                  <Link
                    to="/workspace"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={cn(
                      "flex items-center gap-2 p-2 rounded-xl text-xs font-bold transition-all",
                      (module as string) === 'workspace'
                        ? "bg-white text-slate-900 shadow-sm ring-2 ring-white/50"
                        : "bg-black/15 text-white/90 hover:bg-black/25 hover:text-white"
                    )}
                  >
                    <Home size={16} className={(module as string) === 'workspace' ? "text-amber-500" : "text-white/80"} />
                    <span className="truncate">Workspace</span>
                  </Link>
                )}

                {hasNutrition && (
                  <Link
                    to="/nutrition"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={cn(
                      "flex items-center gap-2 p-2 rounded-xl text-xs font-bold transition-all",
                      module === 'nutrition'
                        ? "bg-white text-slate-900 shadow-sm ring-2 ring-white/50"
                        : "bg-black/15 text-white/90 hover:bg-black/25 hover:text-white"
                    )}
                  >
                    <Activity size={16} className={module === 'nutrition' ? "text-emerald-600" : "text-white/80"} />
                    <span className="truncate">Nutrição</span>
                  </Link>
                )}

                {hasCommunication && (
                  <Link
                    to="/communication"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={cn(
                      "flex items-center gap-2 p-2 rounded-xl text-xs font-bold transition-all",
                      module === 'communication'
                        ? "bg-white text-slate-900 shadow-sm ring-2 ring-white/50"
                        : "bg-black/15 text-white/90 hover:bg-black/25 hover:text-white"
                    )}
                  >
                    <MessageSquare size={16} className={module === 'communication' ? "text-blue-500" : "text-white/80"} />
                    <span className="truncate">Comunicação</span>
                  </Link>
                )}

                {hasAdmin && (
                  <Link
                    to="/admin"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={cn(
                      "flex items-center gap-2 p-2 rounded-xl text-xs font-bold transition-all",
                      module === 'admin'
                        ? "bg-white text-slate-900 shadow-sm ring-2 ring-white/50"
                        : "bg-black/15 text-white/90 hover:bg-black/25 hover:text-white"
                    )}
                  >
                    <Settings size={16} className={module === 'admin' ? "text-indigo-600" : "text-white/80"} />
                    <span className="truncate">Admin</span>
                  </Link>
                )}
              </div>
            </div>
          )}
          
          <nav 
            className="mt-3 flex-1 overflow-y-auto overscroll-contain px-3 pb-32" 
            style={{ WebkitOverflowScrolling: 'touch' }}
            aria-label="Navegação Lateral"
          >
            {(module as string) === 'workspace' ? (
              <div className="pb-4">
                <div className="mb-4">
                  <div className="flex items-center justify-between px-2 mb-2">
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
                            "w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition-all duration-200 group",
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

                <div>
                  <p className={cn("px-2 text-xs font-bold uppercase tracking-wider mb-2", theme.roleText)}>Atalhos do Workspace</p>
                  <ul className="space-y-1">
                    {workspaceNavItems.map(item => (
                      <li key={item.path}>
                        <Link
                          to={item.path}
                          onClick={() => setIsMobileMenuOpen(false)}
                          className={cn(
                            "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 group",
                            location.pathname === item.path ? theme.itemActiveBg : theme.itemInactiveBg
                          )}
                        >
                          <item.icon size={18} className={location.pathname === item.path ? theme.iconActive : theme.iconInactive} />
                          <span>{item.name}</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ) : (
              <div>
                <ul className="space-y-1">
                  {navItems.map((item) => {
                    const isActive = location.pathname === item.path || (item.path !== (module === 'nutrition' ? '/nutrition' : (module as string) === 'workspace' ? '/workspace' : module === 'communication' ? '/communication' : '/admin') && location.pathname.startsWith(item.path));
                    return (
                      <li key={item.path}>
                        <Link
                          to={item.path}
                          onClick={() => setIsMobileMenuOpen(false)}
                          className={cn(
                            "w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 group",
                            isActive ? theme.itemActiveBg : theme.itemInactiveBg
                          )}
                        >
                          <item.icon size={18} className={isActive ? theme.iconActive : theme.moduleName} />
                          <span className="truncate">{item.name}</span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
          </nav>

          <div className="p-4 pb-[calc(1.25rem+env(safe-area-inset-bottom,0px))] border-t border-white/20 shrink-0 space-y-2">
            <Link to="/profile" onClick={() => setIsMobileMenuOpen(false)} className={cn("flex items-center gap-3 w-full p-2 rounded-xl transition-colors group", theme.avatarBg)}>
              <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 font-bold overflow-hidden">
                {user?.avatar_url ? (
                  <img src={user.avatar_url} alt={user.name} className="w-full h-full object-cover" />
                ) : (
                  user?.name.charAt(0)
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className={cn("text-sm font-bold truncate", isLightSidebar ? "text-slate-900" : "text-white")}>{user?.name}</p>
                <p className={cn("text-xs truncate", theme.roleText)}>
                  {user?.role === 'ADMIN' ? 'Administrador' : 
                   user?.role === 'VOLUNTEER' ? 'Voluntário' : 
                   user?.role === 'SPONSOR' ? 'Padrinho' : 
                   user?.role === 'OBSERVER' ? 'Observador(a)' : 'Usuário'}
                </p>
              </div>
            </Link>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className={cn(
                  "flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all md:hidden cursor-pointer",
                  isLightSidebar ? "bg-slate-100 text-slate-700 hover:bg-slate-200" : "bg-white/15 text-white hover:bg-white/25"
                )}
                aria-label="Esconder menu lateral"
              >
                <X size={15} />
                <span>Esconder</span>
              </button>
              <button
                onClick={handleLogout}
                className={cn(
                  "flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer",
                  theme.logoutBtn
                )}
              >
                <LogOut size={15} />
                <span>Sair</span>
              </button>
            </div>
          </div>
        </aside>

      {/* Main Content */}
      <main className={cn("flex-1 w-full pb-20 md:pb-0 relative", module === 'workspace' ? "flex flex-col min-w-0 h-screen overflow-hidden" : "overflow-auto")}>
        {/* Botão flutuante para reabrir menu no Desktop se estiver oculto */}
        {isDesktopSidebarHidden && module !== 'workspace' && (
          <button
            onClick={() => setIsDesktopSidebarHidden(false)}
            className="hidden md:flex fixed top-4 left-20 z-30 items-center gap-1.5 px-3 py-1.5 bg-white text-slate-700 rounded-xl shadow-md border border-slate-200 text-xs font-bold hover:bg-slate-50 transition-all cursor-pointer"
            title="Expandir menu lateral"
          >
            <PanelLeftOpen size={16} className="text-[#88A1F2]" />
            <span>Expandir Menu</span>
          </button>
        )}

        {module === 'workspace' ? (
          children
        ) : (
          <div className="p-4 md:p-8 max-w-7xl mx-auto pb-24 md:pb-8">
            {children}
          </div>
        )}
        {/* Floating Chat for Supporters */}
        {module === 'supporter' && <ChatWidget />}
      </main>
      
      {/* Mobile Bottom Navigation Bar for ERP / Internal Modules */}
      {module !== 'supporter' && (
        <nav className="fixed bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-md border-t border-slate-200/80 pb-safe md:hidden shadow-lg shadow-slate-900/10">
          <div className="flex items-center justify-around h-16 px-1">
            {getMobileBottomNavItems().map((item) => {
              const isActive = location.pathname === item.path || (item.path !== '/nutrition' && (item.path as string) !== '/workspace' && item.path !== '/communication' && item.path !== '/admin' && location.pathname.startsWith(item.path));
              const Icon = item.icon;
              return (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className={cn(
                    "flex flex-col items-center justify-center flex-1 h-14 rounded-xl transition-all",
                    isActive ? "text-[#F49853] font-bold" : "text-slate-400 hover:text-slate-600 font-medium"
                  )}
                >
                  <div className={cn("p-1 rounded-lg transition-transform", isActive && "scale-110")}>
                    <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                  </div>
                  <span className="text-[10px] tracking-tight">{item.name}</span>
                </button>
              );
            })}
            <button
              onClick={() => setIsMobileMenuOpen(prev => !prev)}
              className={cn(
                "flex flex-col items-center justify-center flex-1 h-14 rounded-xl transition-all cursor-pointer",
                isMobileMenuOpen ? "text-[#F49853] font-bold" : "text-slate-400 hover:text-slate-600 font-medium"
              )}
              aria-label={isMobileMenuOpen ? "Esconder Menu Lateral" : "Mostrar Menu Lateral"}
            >
              <div className="p-1">
                {isMobileMenuOpen ? <X size={20} strokeWidth={2.5} /> : <Menu size={20} strokeWidth={2} />}
              </div>
              <span className="text-[10px] tracking-tight">{isMobileMenuOpen ? 'Fechar' : 'Menu'}</span>
            </button>
          </div>
        </nav>
      )}

      {/* Mobile Overlay (Backdrop escuro para fechar ao tocar fora) */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-40 md:hidden transition-all duration-300 cursor-pointer animate-in fade-in"
          onClick={() => setIsMobileMenuOpen(false)}
          aria-hidden="true"
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

