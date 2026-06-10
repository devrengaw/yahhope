import React, { useState } from 'react';
import { useAuth, Role } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Heart, Lock, Mail, UserPlus, LogIn, ShieldCheck } from 'lucide-react';

export function Login() {
  const { login, registerUser } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');

  const handleAuth = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (activeTab === 'login') {
      const loggedUser = login(email, password);
      
      if (!loggedUser) {
        alert('Credenciais inválidas! Verifique seu e-mail e senha.');
        return;
      }

      if (loggedUser.role === 'SPONSOR') {
        navigate('/portal/dashboard');
      } else if (loggedUser.role === 'ADMIN') {
        navigate('/admin');
      } else {
        navigate('/nutrition/patients');
      }
    } else {
      // Registration is strictly for Sponsors on the public page
      const success = registerUser(name, email, password, 'SPONSOR');
      
      if (!success) {
        alert('Este e-mail já está cadastrado!');
        return;
      }
      
      // Auto-login after register
      const loggedUser = login(email, password);
      if (loggedUser) {
        navigate('/portal/dashboard');
      }
    }
  };

  const themeColor = 'orange';

  return (
    <div className="min-h-screen flex font-sans bg-slate-50">
      {/* Left Side - Image Cover */}
      <div className="hidden lg:flex lg:w-1/2 relative">
        <img
          src="/login_bg_real.jpg"
          alt="Crianças sorrindo, YAH Hope"
          className="absolute inset-0 w-full h-full object-cover"
        />
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/40 to-transparent"></div>
        
        <div className="relative z-10 flex flex-col justify-end p-12 text-white h-full">
          <div className="mb-4">
            <Heart size={48} className={`text-${themeColor}-500`} fill="currentColor" />
          </div>
          <h1 className="text-4xl md:text-5xl font-black mb-4 leading-tight">
            Levando esperança para quem mais precisa.
          </h1>
          <p className="text-lg text-slate-200 max-w-lg font-medium">
            Junte-se a nós nesta missão de transformar vidas. Acesse sua conta e acompanhe o impacto que estamos gerando juntos.
          </p>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-[2.5rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 relative overflow-hidden">
          {/* Decorative elements */}
          <div className={`absolute top-0 right-0 w-32 h-32 bg-${themeColor}-500/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl`}></div>
          
          <div className="relative z-10">
            <div className={`w-14 h-14 bg-${themeColor}-50 text-${themeColor}-600 rounded-2xl flex items-center justify-center shadow-sm border border-${themeColor}-100 transition-all duration-500 mb-6`}>
              <Heart size={28} fill="currentColor" />
            </div>
            <h2 className="text-3xl font-black text-slate-900 tracking-tight">
              {activeTab === 'login' ? 'Bem-vindo de volta' : 'Crie sua conta'}
            </h2>
            <p className="mt-2 text-sm text-slate-500 font-medium">
              {activeTab === 'login' 
                ? 'Insira suas credenciais para acessar a plataforma.'
                : 'Preencha seus dados para se tornar um apadrinhador.'}
            </p>

            <div className="flex mt-8 p-1.5 bg-slate-100/80 rounded-2xl">
              <button 
                onClick={() => setActiveTab('login')}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'login' ? `bg-white text-${themeColor}-600 shadow-sm border border-slate-200/50` : 'text-slate-500 hover:text-slate-700'}`}
              >
                <LogIn size={18} /> Login
              </button>
              <button 
                onClick={() => setActiveTab('register')}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'register' ? `bg-white text-${themeColor}-600 shadow-sm border border-slate-200/50` : 'text-slate-500 hover:text-slate-700'}`}
              >
                <UserPlus size={18} /> Cadastrar
              </button>
            </div>
          </div>
          
          <form className="mt-8 space-y-5 relative z-10" onSubmit={handleAuth}>
            {activeTab === 'register' && (
              <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-1.5 px-1">Nome Completo</label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className={`block w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-${themeColor}-500/20 focus:border-${themeColor}-500 sm:text-sm transition-all`}
                    placeholder="João Silva"
                  />
                </div>
              </div>
            )}
            <div>
              <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-1.5 px-1">Email</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={`block w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-${themeColor}-500/20 focus:border-${themeColor}-500 sm:text-sm transition-all`}
                  placeholder="seu@email.com"
                />
              </div>
            </div>
            <div>
              <div className="flex justify-between items-center mb-1.5 px-1">
                <label className="block text-xs font-black text-slate-500 uppercase tracking-widest">Senha</label>
                {activeTab === 'login' && (
                  <a href="#" className={`text-xs font-bold text-${themeColor}-600 hover:text-${themeColor}-700`}>Esqueceu?</a>
                )}
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`block w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-${themeColor}-500/20 focus:border-${themeColor}-500 sm:text-sm transition-all`}
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                className={`group relative w-full flex justify-center py-4 px-4 border border-transparent text-sm font-black rounded-xl text-white bg-${themeColor}-500 hover:bg-${themeColor}-600 focus:outline-none focus:ring-4 focus:ring-${themeColor}-500/20 transition-all shadow-lg shadow-${themeColor}-500/20 active:scale-[0.98]`}
              >
                {activeTab === 'login' ? 'Entrar na Plataforma' : 'Criar minha conta'}
              </button>
            </div>
          </form>

        </div>
      </div>
    </div>
  );
}

