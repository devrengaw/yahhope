import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Heart, Lock, Mail, UserPlus, LogIn } from 'lucide-react';

export function Login() {
  const { loginWithEmail, loginWithGoogle, registerWithEmail, user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // If user is already logged in, redirect them (handled by the protected routes, but good to have here too)
  React.useEffect(() => {
    if (user) {
      if (user.role === 'SPONSOR') {
        navigate('/portal/dashboard');
      } else if (user.role === 'ADMIN') {
        navigate('/admin');
      } else {
        navigate('/nutrition/patients');
      }
    }
  }, [user, navigate]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      if (activeTab === 'login') {
        const success = await loginWithEmail(email, password);
        
        if (!success) {
          alert('Credenciais inválidas! Verifique seu e-mail e senha.');
        }
      } else {
        // Registration is strictly for Sponsors on the public page
        const success = await registerWithEmail(name, email, password);
        
        if (!success) {
          alert('Ocorreu um erro ou este e-mail já está cadastrado!');
        } else {
          // Auto-login after register is handled by Supabase Auth which signs you in automatically
          // The onAuthStateChange will trigger and set the user, and the useEffect above will redirect
        }
      }
    } catch (error) {
      console.error(error);
      alert('Ocorreu um erro inesperado.');
    } finally {
      setIsLoading(false);
    }
  };

  const themeColor = 'orange';

  return (
    <div className="min-h-screen flex items-center justify-center font-sans relative py-12 px-4 sm:px-6 lg:px-8">
      {/* Full Background Image */}
      <div className="absolute inset-0 z-0">
        <img
          src="/login_bg_real.jpg"
          alt="Crianças sorrindo, YAH Hope"
          className="absolute inset-0 w-full h-full object-cover"
        />
        {/* Dark Overlay for contrast */}
        <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-[2px]"></div>
      </div>

      {/* Centered Login Box */}
      <div className="w-full max-w-md space-y-8 bg-white/95 backdrop-blur-xl p-10 rounded-[2.5rem] shadow-2xl border border-white/20 relative z-10 overflow-hidden">
        <div className={`absolute top-0 right-0 w-32 h-32 bg-${themeColor}-500/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl`}></div>
        
        <div className="relative z-10 text-center flex flex-col items-center">
          <h2 className="text-4xl font-black text-slate-900 tracking-tight">
            Ihale!
          </h2>
          <h3 className="text-xl font-bold text-slate-700 mt-1">
            {activeTab === 'login' ? 'Bem-Vindo' : 'Crie sua conta'}
          </h3>
          <p className="mt-2 text-sm text-slate-500 font-medium">
            {activeTab === 'login' 
              ? 'Insira suas credenciais para acessar a plataforma.'
              : 'Preencha seus dados para se tornar um apadrinhador.'}
          </p>

          <div className="flex w-full mt-8 p-1.5 bg-slate-100/80 rounded-2xl">
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
                disabled={isLoading}
                className={`group relative w-full flex justify-center py-4 px-4 border border-transparent text-sm font-black rounded-xl text-white bg-${themeColor}-500 hover:bg-${themeColor}-600 focus:outline-none focus:ring-4 focus:ring-${themeColor}-500/20 transition-all shadow-lg shadow-${themeColor}-500/20 active:scale-[0.98] disabled:opacity-70`}
              >
                {isLoading ? 'Aguarde...' : (activeTab === 'login' ? 'Entrar na Plataforma' : 'Criar minha conta')}
              </button>
            </div>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-slate-500 font-medium">Ou continue com</span>
              </div>
            </div>

            <button
              type="button"
              disabled={isLoading}
              onClick={async () => {
                setIsLoading(true);
                try {
                  await loginWithGoogle();
                } catch (err) {
                  setIsLoading(false);
                }
              }}
              className="w-full flex items-center justify-center gap-3 py-3.5 px-4 bg-white border border-slate-200 rounded-xl text-slate-700 font-bold hover:bg-slate-50 transition-all active:scale-[0.98] shadow-sm disabled:opacity-70"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
              {activeTab === 'login' ? 'Entrar com Google' : 'Cadastrar com Google'}
            </button>

          </form>

      </div>
    </div>
  );
}

