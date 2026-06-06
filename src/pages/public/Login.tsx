import React, { useState, useEffect } from 'react';
import { useAuth, Role } from '../../contexts/AuthContext';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Heart, Lock, Mail, UserPlus, LogIn, ShieldCheck, ShoppingBag } from 'lucide-react';

export function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  const [isSupporterMode, setIsSupporterMode] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');

  useEffect(() => {
    const mode = searchParams.get('mode');
    if (mode === 'supporter') {
      setIsSupporterMode(true);
    } else if (mode === 'admin') {
      setIsSupporterMode(false);
      setActiveTab('login');
    }
  }, [searchParams]);

  const handleAuth = (e: React.FormEvent) => {
    e.preventDefault();
    
    let roleToLogin: Role = 'USER';
    let permissions: string[] = ['dashboard', 'patients', 'attendance', 'waiting-list', 'inventory', 'management', 'atendimento', 'messages', 'updates', 'visits'];

    if (activeTab === 'login') {
      if (email === 'contato@yahhope.com') {
        const storedPassword = localStorage.getItem('yah_hope_admin_password');
        if (!storedPassword) {
          localStorage.setItem('yah_hope_admin_password', password);
          alert('Senha de administrador registrada com sucesso para o primeiro acesso!');
        } else if (password !== storedPassword) {
          alert('Senha incorreta!');
          return;
        }
        roleToLogin = 'ADMIN';
        permissions = ['dashboard', 'patients', 'attendance', 'inventory', 'management', 'finance', 'projects', 'team', 'calendar', 'settings', 'impact-feed', 'messages', 'gifts'];
      } else if (isSupporterMode || email.includes('apoiador')) {
        roleToLogin = 'SPONSOR';
        permissions = ['portal'];
      }
    } else {
      // Registration logic
      roleToLogin = isSupporterMode ? 'SPONSOR' : 'USER';
      permissions = roleToLogin === 'SPONSOR' ? ['portal'] : ['dashboard', 'patients', 'attendance', 'waiting-list', 'inventory', 'management', 'atendimento', 'messages', 'updates', 'visits'];
    }

    login(email || 'usuario@teste.com', roleToLogin, permissions);

    if (roleToLogin === 'SPONSOR') {
      navigate('/portal/dashboard');
    } else if (roleToLogin === 'ADMIN') {
      navigate('/admin');
    } else {
      navigate('/nutrition/patients');
    }
  };

  const themeColor = isSupporterMode ? 'amber' : 'emerald';

  return (
    <div className={`min-h-screen ${isSupporterMode ? 'bg-amber-50' : 'bg-slate-50'} flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 transition-colors duration-500`}>
      <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-[3rem] shadow-2xl border border-slate-100 relative overflow-hidden">
        {/* Decorative elements */}
        <div className={`absolute top-0 right-0 w-32 h-32 bg-${themeColor}-500/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl`}></div>
        
        <div className="relative z-10">
          <div className={`mx-auto w-16 h-16 bg-${themeColor}-600 rounded-2xl flex items-center justify-center shadow-xl shadow-${themeColor}-600/20 transition-all duration-500`}>
            {isSupporterMode ? <Heart size={32} className="text-white" fill="currentColor" /> : <ShieldCheck size={32} className="text-white" />}
          </div>
          <h2 className="mt-6 text-center text-3xl font-black text-slate-900 tracking-tight">
            {activeTab === 'login' ? 'Acesse sua conta' : 'Crie sua conta'}
          </h2>

          {isSupporterMode && (
            <div className="flex justify-center mt-6 p-1 bg-slate-100 rounded-2xl">
              <button 
                onClick={() => setActiveTab('login')}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'login' ? `bg-white text-${themeColor}-600 shadow-sm` : 'text-slate-500 hover:text-slate-700'}`}
              >
                <LogIn size={18} /> Login
              </button>
              <button 
                onClick={() => setActiveTab('register')}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'register' ? `bg-white text-${themeColor}-600 shadow-sm` : 'text-slate-500 hover:text-slate-700'}`}
              >
                <UserPlus size={18} /> Cadastrar
              </button>
            </div>
          )}
        </div>
        
        <form className="mt-8 space-y-6 relative z-10" onSubmit={handleAuth}>
          <div className="space-y-4">
            {activeTab === 'register' && (
              <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1 px-2">Nome Completo</label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className={`appearance-none block w-full px-4 py-3 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-${themeColor}-500/10 focus:border-${themeColor}-500 sm:text-sm transition-all`}
                    placeholder="João Silva"
                  />
                </div>
              </div>
            )}
            <div>
              <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1 px-2">Email</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={`appearance-none block w-full pl-10 pr-3 py-3 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-${themeColor}-500/10 focus:border-${themeColor}-500 sm:text-sm transition-all`}
                  placeholder="seu@email.com"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1 px-2">Senha</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`appearance-none block w-full pl-10 pr-3 py-3 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-${themeColor}-500/10 focus:border-${themeColor}-500 sm:text-sm transition-all`}
                  placeholder="••••••••"
                />
              </div>
            </div>
          </div>


          <div>
            <button
              type="submit"
              className={`group relative w-full flex justify-center py-4 px-4 border border-transparent text-sm font-black rounded-xl text-white bg-${themeColor}-600 hover:bg-${themeColor}-700 focus:outline-none focus:ring-4 focus:ring-${themeColor}-500/20 transition-all shadow-xl shadow-${themeColor}-600/20 active:scale-95`}
            >
              {activeTab === 'login' ? 'Acessar Conta' : 'Criar Conta'}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}

