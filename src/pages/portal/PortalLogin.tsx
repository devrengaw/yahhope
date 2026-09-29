import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';
import { useNavigate, Link } from 'react-router-dom';
import { Heart, Lock, Mail, User, ArrowRight, ShieldCheck, CheckCircle2, AlertCircle } from 'lucide-react';

export function PortalLogin() {
  const { loginWithEmail, loginWithGoogle, registerWithEmail, sendPasswordResetEmail, user, loading } = useAuth();
  const { requestPermission } = useNotification();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<'login' | 'register' | 'recovery'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // If already logged in, redirect to donor portal
  useEffect(() => {
    if (!loading && user) {
      // Trigger push notification permission request silently on login
      requestPermission(user.id).catch(() => {});

      if (user.role === 'SPONSOR') {
        navigate('/portal/dashboard', { replace: true });
      } else if (user.role === 'OBSERVER') {
        navigate('/nutrition/patients', { replace: true });
      } else if (user.role === 'ADMIN') {
        navigate('/portal/dashboard', { replace: true });
      } else {
        navigate('/portal/dashboard', { replace: true });
      }
    }
  }, [user, loading, navigate, requestPermission]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsLoading(true);

    try {
      if (activeTab === 'login') {
        const success = await loginWithEmail(email, password);
        if (!success) {
          setErrorMessage('E-mail ou senha incorretos. Por favor, tente novamente.');
        }
      } else if (activeTab === 'register') {
        if (!name.trim()) {
          setErrorMessage('Por favor, informe seu nome completo.');
          setIsLoading(false);
          return;
        }
        const success = await registerWithEmail(name, email, password);
        if (!success) {
          setErrorMessage('Não foi possível criar a conta. Este e-mail pode já estar cadastrado.');
        } else {
          setSuccessMessage('Conta de Apoiador criada com sucesso! Redirecionando...');
        }
      } else if (activeTab === 'recovery') {
        const success = await sendPasswordResetEmail(email);
        if (success) {
          setSuccessMessage('Link de recuperação enviado para o seu e-mail! Verifique sua caixa de entrada.');
        } else {
          setErrorMessage('Não foi possível enviar o link. Verifique se o e-mail digitado está correto.');
        }
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Ocorreu um erro inesperado.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setIsLoading(true);
      setErrorMessage(null);
      await loginWithGoogle();
    } catch (err: any) {
      setErrorMessage('Falha ao conectar com o Google. Tente novamente.');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-between relative overflow-hidden font-sans pt-safe pb-safe">
      {/* Background Image with Warm Dark Gradient */}
      <div className="absolute inset-0 z-0">
        <img
          src="/login_bg_real.jpg"
          alt="Crianças YAH Hope"
          className="w-full h-full object-cover opacity-35 scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950/80 via-slate-900/85 to-slate-950"></div>
      </div>

      {/* Decorative Circles */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/15 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-rose-500/10 rounded-full blur-3xl translate-y-1/3 -translate-x-1/3 pointer-events-none"></div>

      {/* Top Header / Brand */}
      <div className="relative z-10 px-6 pt-8 pb-4 flex justify-between items-center max-w-md mx-auto w-full">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-400 flex items-center justify-center shadow-lg shadow-amber-500/30">
            <Heart className="text-white" size={22} fill="currentColor" />
          </div>
          <div>
            <h1 className="text-xl font-black text-white tracking-tight flex items-center gap-1.5">
              YAH Hope <span className="text-[10px] uppercase font-bold tracking-widest bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full border border-amber-500/30">Apoiador</span>
            </h1>
            <p className="text-xs text-slate-400 font-medium">Juntos transformando vidas</p>
          </div>
        </div>

        <Link
          to="/"
          className="text-xs font-semibold text-slate-400 hover:text-white bg-white/5 border border-white/10 px-3 py-1.5 rounded-xl transition-all"
        >
          Visitar Site
        </Link>
      </div>

      {/* Central Login Card */}
      <div className="relative z-10 px-4 py-4 max-w-md mx-auto w-full my-auto">
        <div className="bg-white/95 backdrop-blur-2xl rounded-[2.5rem] p-7 sm:p-9 shadow-2xl border border-white/20">
          {/* Header Title */}
          <div className="text-center mb-6">
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              {activeTab === 'login' && 'Área do Apoiador'}
              {activeTab === 'register' && 'Novo Apoiador'}
              {activeTab === 'recovery' && 'Recuperar Acesso'}
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1 font-medium">
              {activeTab === 'login' && 'Acesse para acompanhar crianças, projetos e doações'}
              {activeTab === 'register' && 'Cadastre-se para transformar vidas com a YAH Hope'}
              {activeTab === 'recovery' && 'Digite seu e-mail para receber as instruções de recuperação'}
            </p>
          </div>

          {/* Feedback Messages */}
          {errorMessage && (
            <div className="mb-4 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2.5 animate-fadeIn">
              <AlertCircle size={18} className="shrink-0 text-rose-500" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="mb-4 p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2.5 animate-fadeIn">
              <CheckCircle2 size={18} className="shrink-0 text-emerald-600" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* GOOGLE LOGIN BUTTON */}
          {activeTab !== 'recovery' && (
            <div className="mb-5">
              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-3 py-3.5 px-4 bg-white border border-slate-200 hover:border-slate-300 hover:bg-slate-50 rounded-2xl text-slate-700 font-bold text-sm shadow-sm transition-all active:scale-[0.98] disabled:opacity-60"
              >
                {/* Official Google 'G' Logo SVG */}
                <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>Continuar com o Google</span>
              </button>

              <div className="relative flex items-center justify-center my-5">
                <div className="border-t border-slate-200 w-full"></div>
                <span className="bg-white px-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider absolute">
                  ou com e-mail
                </span>
              </div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {activeTab === 'register' && (
              <div>
                <label className="block text-[11px] font-black text-slate-600 uppercase tracking-wider mb-1.5 px-1">
                  Seu Nome Completo
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ex: Maria da Silva"
                    className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-[11px] font-black text-slate-600 uppercase tracking-wider mb-1.5 px-1">
                E-mail
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
                />
              </div>
            </div>

            {activeTab !== 'recovery' && (
              <div>
                <div className="flex justify-between items-center mb-1.5 px-1">
                  <label className="block text-[11px] font-black text-slate-600 uppercase tracking-wider">
                    Senha
                  </label>
                  {activeTab === 'login' && (
                    <button
                      type="button"
                      onClick={() => {
                        setErrorMessage(null);
                        setSuccessMessage(null);
                        setActiveTab('recovery');
                      }}
                      className="text-xs font-bold text-amber-600 hover:text-amber-700"
                    >
                      Esqueceu a senha?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 px-4 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-black text-sm rounded-xl shadow-lg shadow-amber-500/25 transition-all flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-60 mt-2"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : activeTab === 'login' ? (
                <>
                  <span>Entrar no App</span>
                  <ArrowRight size={18} />
                </>
              ) : activeTab === 'register' ? (
                <>
                  <span>Cadastrar e Começar</span>
                  <ArrowRight size={18} />
                </>
              ) : (
                <span>Enviar Link de Recuperação</span>
              )}
            </button>
          </form>

          {/* Tab Switchers */}
          <div className="mt-6 pt-5 border-t border-slate-100 text-center">
            {activeTab === 'login' && (
              <p className="text-xs text-slate-600 font-medium">
                Ainda não é um apoiador cadastrado?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setErrorMessage(null);
                    setSuccessMessage(null);
                    setActiveTab('register');
                  }}
                  className="font-bold text-amber-600 hover:underline inline-flex items-center gap-0.5 ml-1"
                >
                  Cadastre-se aqui
                </button>
              </p>
            )}

            {activeTab === 'register' && (
              <p className="text-xs text-slate-600 font-medium">
                Já possui uma conta de apoiador?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setErrorMessage(null);
                    setSuccessMessage(null);
                    setActiveTab('login');
                  }}
                  className="font-bold text-amber-600 hover:underline ml-1"
                >
                  Fazer login
                </button>
              </p>
            )}

            {activeTab === 'recovery' && (
              <button
                type="button"
                onClick={() => {
                  setErrorMessage(null);
                  setSuccessMessage(null);
                  setActiveTab('login');
                }}
                className="text-xs font-bold text-amber-600 hover:underline"
              >
                Voltar para o login
              </button>
            )}
          </div>
        </div>

        {/* Security badge note */}
        <div className="mt-6 flex items-center justify-center gap-2 text-slate-400 text-xs">
          <ShieldCheck size={16} className="text-amber-400" />
          <span>Acesso seguro com criptografia de ponta a ponta</span>
        </div>
      </div>

      {/* Bottom Footer Spacing */}
      <div className="relative z-10 py-3 text-center text-[11px] text-slate-500 font-medium">
        © {new Date().getFullYear()} YAH Hope. Todos os direitos reservados.
      </div>
    </div>
  );
}
