import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Heart, Activity, Briefcase, Settings, ArrowRight, LogOut, Shield, DollarSign } from 'lucide-react';
import { useEffect, useState } from 'react';

// Define the same structure as in Settings.tsx
interface PersistedModule {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
}

export function ModuleSelector() {
  const { user, logout } = useAuth();
  const [activeModules, setActiveModules] = useState<string[]>(['nutrition', 'erp', 'projects', 'finance']);

  useEffect(() => {
    const saved = localStorage.getItem('yahhope_modules');
    if (saved) {
      try {
        const parsed: PersistedModule[] = JSON.parse(saved);
        setActiveModules(parsed.filter(m => m.enabled).map(m => m.id));
      } catch (e) {
        console.error('Failed to parse modules', e);
      }
    }
  }, []);

  const modules = [
    {
      id: 'nutrition',
      path: '/nutrition',
      name: 'Nutrição Infantil',
      description: 'Gestão de pacientes, triagem e acompanhamento nutricional.',
      icon: Activity,
      color: 'bg-emerald-100 text-emerald-600',
      hoverColor: 'hover:border-emerald-200',
      arrowColor: 'text-emerald-600',
      permission: ['patients', 'attendance', 'inventory', 'management']
    }
  ];

  // Filter modules based on user role/permissions
  const visibleModules = modules.filter(m => {
    return user?.role === 'ADMIN' || (m.permission.length === 0 || user?.permissions.some(p => m.permission.includes(p)));
  });

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        <div className="flex justify-between items-center mb-12">
          <div className="flex items-center gap-4 text-left">
            <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center shadow-lg shadow-slate-900/20">
              <Heart size={24} className="text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tighter uppercase">Portal YAHope</h1>
              <p className="text-slate-500 font-bold uppercase text-[10px] tracking-widest">Bem-vindo(a), {user?.name}</p>
            </div>
          </div>
          <button 
            onClick={logout}
            className="flex items-center gap-2 text-slate-500 hover:text-red-500 transition-colors font-black text-[10px] uppercase tracking-widest bg-white px-5 py-3 rounded-2xl border border-slate-100 shadow-sm active:scale-95"
          >
            <LogOut size={16} /> Sair
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-2xl mx-auto">
          {visibleModules.map(m => (
            <Link 
              key={m.id} 
              to={m.path} 
              className={`group bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-2xl hover:shadow-slate-200 transition-all text-left flex flex-col h-full ${m.hoverColor}`}
            >
              <div className={`w-16 h-16 ${m.color} rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform`}>
                <m.icon size={32} />
              </div>
              <h2 className="text-xl font-black text-slate-900 mb-3 tracking-tight">{m.name}</h2>
              <p className="text-slate-500 text-sm font-medium mb-8 leading-relaxed flex-grow">{m.description}</p>
              <div className={`flex items-center ${m.arrowColor} font-black text-[10px] uppercase tracking-[0.2em] group-hover:translate-x-2 transition-transform`}>
                Acessar Módulo <ArrowRight size={16} className="ml-1.5" />
              </div>
            </Link>
          ))}

          {/* Configurações Globais (YAH Hope Admin) */}
          {(user?.role === 'ADMIN' || user?.permissions.includes('settings')) && (
            <Link to="/admin/settings" className="group h-full">
              <div className="bg-white group-hover:bg-slate-900 border-2 border-slate-100 group-hover:border-slate-800 p-10 rounded-[2.5rem] transition-all duration-500 shadow-xl shadow-slate-200/50 flex flex-col items-center text-center relative overflow-hidden h-full">
                <div className="w-20 h-20 bg-slate-50 group-hover:bg-slate-800 rounded-3xl flex items-center justify-center text-slate-400 group-hover:text-white mb-8 transform group-hover:scale-110 transition-all duration-700">
                  <Shield size={40} />
                </div>
                <h3 className="text-xl font-black text-slate-900 group-hover:text-white mb-3 tracking-tight">Gestão YAH Hope</h3>
                <p className="text-slate-500 group-hover:text-slate-400 text-sm font-medium leading-relaxed">Configurações globais, usuários e gestão de infraestrutura administrativa.</p>
                <div className="mt-8 flex items-center text-slate-400 group-hover:text-white font-black text-[10px] uppercase tracking-[0.2em] opacity-0 group-hover:opacity-100 transition-all duration-500">
                  Configurar <Settings size={14} className="ml-1.5" />
                </div>
              </div>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
