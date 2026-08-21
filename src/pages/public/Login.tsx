import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Heart, Lock, Mail, UserPlus, LogIn } from 'lucide-react';

export function Login() {
  const { loginWithEmail, loginWithGoogle, registerWithEmail, sendPasswordResetEmail, user, loading } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'login' | 'register' | 'recovery'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // If user is already logged in, redirect them
  React.useEffect(() => {
    if (!loading && user) {
      const hash = window.location.hash || '';
      const search = window.location.search || '';
      if (hash.includes('type=recovery') || search.includes('type=recovery') || hash.includes('recovery') || search.includes('recovery')) {
        navigate('/set-password');
        return;
      }

      if (user.role === 'SPONSOR') {
        navigate('/portal/dashboard');
        return;
      }

      if (user.role === 'ADMIN') {
        navigate('/workspace');
        return;
      }

      // Calculate accessible modules for USER role
      const hasNutrition = user.permissions?.some(p => ['patients', 'attendance', 'inventory', 'management', 'waiting-list', 'atendimento', 'updates', 'visits'].includes(p));
      const hasCommunication = user.permissions?.some(p => ['projects', 'chat', 'blog'].includes(p));
      const hasSettings = user.permissions?.includes('settings');

      const accessibleCount = [hasNutrition, hasCommunication, hasSettings].filter(Boolean).length;

      if (accessibleCount > 1 || accessibleCount === 0) {
        navigate('/workspace');
      } else if (hasNutrition) {
        navigate('/nutrition/patients');
      } else if (hasCommunication) {
        navigate('/communication/projects');
      } else if (hasSettings) {
        navigate('/admin/settings');
      }
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#F49853]"></div>
      </div>
    );
  }

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      if (activeTab === 'login') {
        const success = await loginWithEmail(email, password);
        
        if (!success) {
          alert('Credenciais inválidas! Verifique seu e-mail e senha.');
        }
      } else if (activeTab === 'register') {
        // Registration is strictly for Sponsors on the public page
        const success = await registerWithEmail(name, email, password);
        
        if (!success) {
          alert('Ocorreu um erro ou este e-mail já está cadastrado!');
        }
      } else if (activeTab === 'recovery') {
        const success = await sendPasswordResetEmail(email);
        
        if (success) {
          alert('Link de recuperação enviado com sucesso! Verifique sua caixa de entrada.');
          setActiveTab('login');
        } else {
          alert('Erro ao enviar o link de recuperação. Por favor, verifique se o email é válido.');
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
            {activeTab === 'recovery' ? 'Recuperar Senha' : 'Bem-Vindo'}
          </h3>
          <p className="mt-2 text-sm text-slate-500 font-medium">
            {activeTab === 'recovery' 
              ? 'Insira seu email para receber um link de redefinição de senha.' 
              : 'Insira suas credenciais para acessar a plataforma.'}
          </p>
        </div>
        
        <form className="mt-8 space-y-5 relative z-10" onSubmit={handleAuth}>
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
            {activeTab !== 'recovery' && (
              <div>
                <div className="flex justify-between items-center mb-1.5 px-1">
                  <label className="block text-xs font-black text-slate-500 uppercase tracking-widest">Senha</label>
                  <button
                    type="button"
                    onClick={() => setActiveTab('recovery')}
                    className={`text-xs font-bold text-${themeColor}-600 hover:text-${themeColor}-700`}
                  >
                    Esqueceu?
                  </button>
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
            )}

            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className={`group relative w-full flex justify-center py-4 px-4 border border-transparent text-sm font-black rounded-xl text-white bg-${themeColor}-500 hover:bg-${themeColor}-600 focus:outline-none focus:ring-4 focus:ring-${themeColor}-500/20 transition-all shadow-lg shadow-${themeColor}-500/20 active:scale-[0.98] disabled:opacity-70`}
              >
                {isLoading ? 'Aguarde...' : activeTab === 'recovery' ? 'Enviar Link de Recuperação' : 'Entrar na Plataforma'}
              </button>
            </div>

            {activeTab === 'recovery' && (
              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('login')}
                  className={`text-xs font-bold text-${themeColor}-600 hover:text-${themeColor}-700 transition-all`}
                >
                  Voltar para o login
                </button>
              </div>
            )}

          </form>

      </div>
    </div>
  );
}

