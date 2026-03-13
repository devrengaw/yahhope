import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, ClipboardList, Settings, Package, Menu, X, Stethoscope, Briefcase, DollarSign, Calendar, LogOut, ArrowLeft, Home, Shield, Tag, Bell, Globe } from 'lucide-react';
import { cn } from '../lib/utils';
import { useAuth } from '../contexts/AuthContext';

const nutritionNavItems = [
  { name: 'Dashboard', path: '/nutrition', icon: LayoutDashboard },
  { name: 'Atendimento', path: '/nutrition/atendimento', icon: Stethoscope },
  { name: 'Crianças', path: '/nutrition/patients', icon: Users },
  { name: 'Fila de Espera', path: '/nutrition/waiting-list', icon: ClipboardList },
  { name: 'Estoque', path: '/nutrition/inventory', icon: Package },
  { name: 'Visitas', path: '/nutrition/visits', icon: Home },
  { name: 'Gestão', path: '/nutrition/management', icon: Settings },
];

const erpNavItems = [
  { name: 'Dashboard', path: '/erp', icon: LayoutDashboard },
  { name: 'Projetos', path: '/erp/projects', icon: Briefcase },
  { name: 'Financeiro', path: '/erp/finance', icon: DollarSign },
  { name: 'Equipe', path: '/erp/team', icon: Users },
  { name: 'Agenda', path: '/erp/calendar', icon: Calendar },
];

const adminNavItems = [
  { name: 'Projetos', path: '/admin/projects', icon: Briefcase },
  { name: 'Usuários', path: '/admin/users', icon: Users },
  { name: 'Financeiro', path: '/admin/finance', icon: DollarSign },
  { name: 'Geral', path: '/admin/settings', icon: Globe },
];

export function Layout({ children, module }: { children: React.ReactNode, module: 'nutrition' | 'erp' | 'admin' }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const initialNavItems = module === 'nutrition' ? nutritionNavItems : module === 'erp' ? erpNavItems : adminNavItems;
  
  // Filter items by permission (simplified mapping)
  const navItems = initialNavItems.filter(item => {
    if (user?.role === 'ADMIN') return true;
    
    // Check if the path or a part of it is in user's permissions
    const permissionKey = item.path.split('/').pop() || 'dashboard';
    const isDashboard = item.path === '/nutrition' || item.path === '/erp' || item.path === '/admin';
    const finalKey = isDashboard ? 'dashboard' : (permissionKey === 'atendimento' ? 'attendance' : (permissionKey === 'estoque' ? 'inventory' : (permissionKey === 'settings' ? 'settings' : permissionKey)));
    
    return user?.permissions.includes(finalKey);
  });

  const moduleName = module === 'nutrition' ? 'Nutrição Infantil' : module === 'erp' ? 'Gestão de Projetos' : 'YAH Hope';
  const themeColor = module === 'nutrition' ? 'emerald' : module === 'erp' ? 'blue' : 'slate';

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
      {/* Mobile Header */}
      <div className={`md:hidden bg-${themeColor}-700 text-white p-4 flex justify-between items-center shadow-md z-20`}>
        <div className="font-bold text-xl tracking-tight">YAHope</div>
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Sidebar */}
      <aside
        className={cn(
          `fixed inset-y-0 left-0 z-10 w-64 bg-${themeColor}-800 text-${themeColor}-50 transform transition-transform duration-200 ease-in-out md:relative md:translate-x-0 shadow-xl flex flex-col`,
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="p-6 hidden md:block shrink-0">
          <div className="font-bold text-2xl tracking-tight text-white flex items-center gap-2">
            <div className={`w-8 h-8 bg-${themeColor}-500 rounded-lg flex items-center justify-center`}>
              <span className="text-white font-black">Y</span>
            </div>
            YAHope
          </div>
          <p className={`text-${themeColor}-300 text-xs mt-1 font-medium tracking-wider uppercase`}>{moduleName}</p>
        </div>

        <nav className="mt-6 md:mt-2 flex-1 overflow-y-auto" aria-label="Navegação Lateral">
          <ul className="space-y-1 px-3">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path || (item.path !== (module === 'nutrition' ? '/nutrition' : module === 'erp' ? '/erp' : '/admin') && location.pathname.startsWith(item.path));
              return (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors font-medium text-sm",
                      isActive 
                        ? `bg-${themeColor}-900/50 text-white shadow-inner` 
                        : `text-${themeColor}-100 hover:bg-${themeColor}-700/50 hover:text-white`
                    )}
                  >
                    <item.icon size={20} className={isActive ? `text-${themeColor}-400` : `text-${themeColor}-300`} />
                    {item.name}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
        
        <div className={`shrink-0 p-4 border-t border-${themeColor}-700/50`}>
          {user?.role === 'ADMIN' && (
            <Link to="/admin" className={`flex items-center gap-2 text-sm font-medium text-${themeColor}-200 hover:text-white mb-4 px-2 transition-colors`}>
              <ArrowLeft size={16} /> Voltar aos Módulos
            </Link>
          )}
          <div className="flex items-center justify-between px-2">
            <Link 
              to="/admin/profile" 
              className="flex items-center gap-3 hover:opacity-80 transition-opacity group"
            >
              <div className={`w-10 h-10 rounded-full bg-${themeColor}-600 flex items-center justify-center text-white font-bold border-2 border-${themeColor}-500 shadow-sm group-hover:border-white transition-colors`}>
                {user?.avatar || (user?.name ? user.name.charAt(0) : 'U')}
              </div>
              <div className="overflow-hidden text-left">
                <p className="text-sm font-semibold text-white truncate">{user?.name || 'Usuário'}</p>
                <p className={`text-[10px] text-${themeColor}-300 uppercase tracking-wider font-bold`}>{user?.role || 'Visitante'}</p>
              </div>
            </Link>
            <button 
              onClick={handleLogout} 
              className={`text-${themeColor}-300 hover:text-white p-2 rounded-lg hover:bg-${themeColor}-700/50 transition-colors tooltip-target`} 
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
      </main>
      
      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-0 md:hidden transition-all duration-300"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
    </div>
  );
}
