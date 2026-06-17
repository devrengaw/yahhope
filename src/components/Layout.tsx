import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, ClipboardList, Settings, Package, Menu, X, Stethoscope, Briefcase, DollarSign, Calendar, LogOut, ArrowLeft, Home, Heart, ShoppingBag, BarChart3, Globe, MessageSquare, Newspaper, TrendingUp, Gift, Target, Mail, Activity } from 'lucide-react';
import { cn } from '../lib/utils';
import { useAuth } from '../contexts/AuthContext';
import { ChatWidget } from './ChatWidget';
import { NotificationBell } from './NotificationBell';

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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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
    
  const themeColor = 
    module === 'nutrition' ? 'emerald' : 
    module === 'workspace' ? 'blue' : 
    module === 'communication' ? 'indigo' :
    module === 'supporter' ? 'amber' :
    'slate';

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isLightSidebar = module === 'supporter';

  const hasNutrition = user?.permissions && user.permissions.some(p => ['patients', 'attendance', 'inventory', 'management', 'updates', 'visits'].includes(p));
  const hasCommunication = user?.permissions && user.permissions.some(p => ['projects', 'chat', 'blog', 'email-templates'].includes(p));
  const hasAdmin = user?.permissions && user.permissions.some(p => ['settings', 'impact-feed', 'messages', 'gifts', 'fundraising', 'store', 'local-projects', 'users'].includes(p));

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row overflow-hidden">
      
      {/* Primary Sidebar - Workspaces */}
      {module !== 'supporter' && (
        <div className="w-16 sm:w-[72px] bg-slate-900 flex-col items-center py-4 shrink-0 shadow-2xl z-30 hidden md:flex">
          <Link 
            to="/workspace" 
            className={cn("w-12 h-12 rounded-2xl flex items-center justify-center transition-all mb-4 group relative", module === 'workspace' ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/20' : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white')}
          >
            <Home size={22} className={module === 'workspace' ? '' : 'group-hover:scale-110 transition-transform'} />
          </Link>
          
          <div className="w-8 h-px bg-white/10 my-2" />
          
          <div className="flex flex-col gap-3 mt-2">
            {hasNutrition && (
              <Link 
                to="/nutrition" 
                className={cn("w-12 h-12 rounded-2xl flex items-center justify-center transition-all group relative", module === 'nutrition' ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 'text-slate-400 hover:bg-white/10 hover:text-white')}
              >
                <Activity size={22} className={module === 'nutrition' ? '' : 'group-hover:scale-110 transition-transform'} />
              </Link>
            )}
            
            {hasCommunication && (
              <Link 
                to="/communication" 
                className={cn("w-12 h-12 rounded-2xl flex items-center justify-center transition-all group relative", module === 'communication' ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/20' : 'text-slate-400 hover:bg-white/10 hover:text-white')}
              >
                <MessageSquare size={22} className={module === 'communication' ? '' : 'group-hover:scale-110 transition-transform'} />
              </Link>
            )}
            
            {hasAdmin && (
              <Link 
                to="/admin" 
                className={cn("w-12 h-12 rounded-2xl flex items-center justify-center transition-all group relative", module === 'admin' ? 'bg-slate-700 text-white shadow-lg shadow-slate-700/20' : 'text-slate-400 hover:bg-white/10 hover:text-white')}
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
          isLightSidebar ? "bg-white text-slate-900" : `bg-${themeColor}-700 text-white`
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
          isLightSidebar ? "bg-white border-slate-100 text-slate-600" : `bg-${themeColor}-800 border-transparent text-${themeColor}-50`,
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
          <p className={cn("text-xs mt-1 font-medium tracking-wider uppercase", isLightSidebar ? "text-slate-400" : `text-${themeColor}-300`)}>{moduleName}</p>
        </div>

        <nav className="mt-6 md:mt-2 flex-1 overflow-y-auto" aria-label="Navegação Lateral">
          <ul className="space-y-1 px-3">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path || (item.path !== (module === 'nutrition' ? '/nutrition' : module === 'erp' ? '/erp' : module === 'communication' ? '/communication' : '/admin') && location.pathname.startsWith(item.path));
              return (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    onClick={() => setIsMobileMenuOpen(false)}
                      className={cn(
                        "w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-black transition-all duration-300 group",
                        isActive 
                          ? (isLightSidebar ? "bg-amber-50 text-amber-600 shadow-sm" : `bg-${themeColor}-900/40 text-slate-50 shadow-inner`)
                          : (isLightSidebar ? "text-slate-500 hover:bg-slate-50 hover:text-slate-900" : `text-${themeColor}-200 hover:bg-${themeColor}-600/50 hover:text-white`)
                      )}
                    >
                      <item.icon size={20} className={isActive ? (isLightSidebar ? "text-amber-500" : `text-${themeColor}-100`) : (isLightSidebar ? "text-slate-400" : `text-${themeColor}-300`)} />
                    {item.name}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
        
        <div className={cn("shrink-0 p-4 border-t", isLightSidebar ? "border-slate-100" : `border-${themeColor}-700/50`)}>
          {user?.role === 'ADMIN' && (
            <Link to="/admin" className={cn("flex items-center gap-2 text-sm font-bold mb-4 px-2 transition-colors", isLightSidebar ? "text-slate-400 hover:text-slate-600" : `text-${themeColor}-200 hover:text-white`)}>
              <ArrowLeft size={16} /> Voltar aos Módulos
            </Link>
          )}
          <div className="flex items-center justify-between px-2">
            <Link 
              to="/admin/profile" 
              className="flex items-center gap-3 hover:opacity-80 transition-opacity group"
            >
              <div className={cn("w-10 h-10 rounded-full flex items-center justify-center text-white font-bold border-2 shadow-sm transition-colors", isLightSidebar ? "bg-amber-500 border-amber-400 group-hover:border-amber-600" : `bg-${themeColor}-600 border-${themeColor}-500 group-hover:border-white`)}>
                {user?.avatar || (user?.name ? user.name.charAt(0) : 'U')}
              </div>
              <div className="overflow-hidden text-left">
                <p className={cn("text-sm font-bold truncate", isLightSidebar ? "text-slate-900" : "text-white")}>{user?.name || 'Usuário'}</p>
                <p className={cn("text-[10px] uppercase tracking-wider font-black", isLightSidebar ? "text-slate-400" : `text-${themeColor}-300`)}>{user?.role || 'Visitante'}</p>
              </div>
            </Link>
            <button 
              onClick={handleLogout} 
              className={cn("p-2 rounded-lg transition-colors tooltip-target", isLightSidebar ? "text-slate-400 hover:text-slate-600 hover:bg-slate-50" : `text-${themeColor}-300 hover:text-white hover:bg-${themeColor}-700/50`)} 
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
    </div>
  );
}

