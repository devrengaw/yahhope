import React, { useState } from 'react';
import { useAuth, Role } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Heart, Lock, Mail } from 'lucide-react';

export function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Mock login logic: emails with 'admin' or 'gestor' get ADMIN role, otherwise USER
    const roleToLogin: Role = (email.includes('admin') || email === 'gestor@yahope.org') ? 'ADMIN' : 'USER';
    
    // Default permissions for demo
    const permissions = roleToLogin === 'ADMIN' 
      ? ['dashboard', 'patients', 'attendance', 'inventory', 'management', 'finance', 'projects', 'team', 'calendar', 'settings']
      : ['patients']; // Example limited access

    login(email || 'usuario@teste.com', roleToLogin, permissions);

    // Smart redirect: if user has only one primary module, go there
    if (permissions.length === 1) {
      const module = permissions[0];
      const paths: Record<string, string> = {
        'patients': '/patients',
        'attendance': '/atendimentos',
        'inventory': '/estoque',
        'finance': '/erp/finance',
        'projects': '/erp/projects',
        'team': '/erp/team',
        'calendar': '/erp/calendar'
      };
      navigate(paths[module] || '/admin');
    } else {
      navigate('/admin');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-3xl shadow-xl border border-slate-100">
        <div>
          <div className="mx-auto w-16 h-16 bg-emerald-600 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-600/20">
            <Heart size={32} className="text-white" />
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-slate-900">
            Acesse sua conta
          </h2>
          <p className="mt-2 text-center text-sm text-slate-500">
            Bem-vindo ao portal YAHope
          </p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleLogin}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="appearance-none block w-full pl-10 pr-3 py-3 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm transition-colors"
                  placeholder="seu@email.com"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Senha</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none block w-full pl-10 pr-3 py-3 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm transition-colors"
                  placeholder="••••••••"
                />
              </div>
            </div>
          </div>

          <div>
            <button
              type="submit"
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-bold rounded-xl text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-colors shadow-md"
            >
              Entrar
            </button>
          </div>
        </form>

        {/* Demo hints */}
        <div className="mt-8 text-center bg-slate-50 border border-slate-100 rounded-xl p-4">
          <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mb-2">Dica de Acesso</p>
          <p className="text-xs text-slate-600">Email com <span className="font-bold text-emerald-600">"admin"</span> = Acesso Total</p>
          <p className="text-xs text-slate-600 mt-1">Outros emails = Acesso Limitado</p>
        </div>
      </div>
    </div>
  );
}
