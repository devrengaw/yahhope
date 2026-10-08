import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Heart, Lock, Mail, UserPlus, LogIn, CheckSquare, Square, AlertCircle, CheckCircle2 } from 'lucide-react';
import { SEO } from '../../components/common/SEO';

export function Login() {
  const { loginWithEmail, loginWithGoogle, registerWithEmail, sendPasswordResetEmail, user, loading } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isAdminMode = searchParams.get('mode') === 'admin';

  const [activeTab, setActiveTab] = useState<'login' | 'register' | 'recovery'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [acceptCommunications, setAcceptCommunications] = useState(true);
  const [acceptPrivacy, setAcceptPrivacy] = useState(false);
  const [consentError, setConsentError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRegisteredSuccess, setIsRegisteredSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [infoMessage, setInfoMessage] = useState('');

  const switchTab = (tab: 'login' | 'register' | 'recovery') => {
    setActiveTab(tab);
    setErrorMessage('');
    setInfoMessage('');
    setConsentError('');
  };

  // Preenche dados vindos da URL caso venha de um fluxo pós-doação (?register=true ou ?tab=register&email=...)
  useEffect(() => {
    if (isAdminMode) {
      if (activeTab === 'register') setActiveTab('login');
      return;
    }
    const tabParam = searchParams.get('tab') || (searchParams.get('register') === 'true' ? 'register' : null);
    if (tabParam === 'register' || tabParam === 'recovery' || tabParam === 'login') {
      setActiveTab(tabParam);
    }
    const emailParam = searchParams.get('email');
    if (emailParam) setEmail(emailParam);
    const nameParam = searchParams.get('name');
    if (nameParam) setName(nameParam);
  }, [searchParams, isAdminMode]);

  // If user is already logged in, redirect them based on mode
  useEffect(() => {
    if (!loading && user) {
      const hash = window.location.hash || '';
      const search = window.location.search || '';
      if (hash.includes('type=recovery') || search.includes('type=recovery') || hash.includes('recovery') || search.includes('recovery')) {
        navigate('/set-password');
        return;
      }

      // Se entrou pelo modo administrativo (/login?mode=admin)
      if (isAdminMode) {
        if (user.role === 'ADMIN') {
          navigate('/workspace');
          return;
        }

        if (user.role === 'OBSERVER') {
          navigate('/nutrition/patients');
          return;
        }

        if (user.role === 'USER') {
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
          return;
        }

        // Se for SPONSOR (não tem cargo administrativo), direciona para o portal do mantenedor
        navigate('/portal/dashboard');
        return;
      }

      // Se entrou pelo login geral do Mantenedor (/login)
      // Permite que qualquer mantenedor ou colaborador acesse o portal do mantenedor
      navigate('/portal/dashboard');
    }
  }, [user, loading, navigate, isAdminMode]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#F49853]"></div>
      </div>
    );
  }

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setConsentError('');
    setErrorMessage('');
    setInfoMessage('');
    setIsLoading(true);
    
    try {
      if (activeTab === 'login') {
        const res = await loginWithEmail(email, password);
        
        if (!res.success) {
          setErrorMessage(res.error || 'Credenciais inválidas! Verifique seu e-mail e senha.');
        }
      } else if (activeTab === 'register') {
        if (!acceptPrivacy) {
          setConsentError('Você precisa aceitar a Política de Privacidade para criar sua conta.');
          setIsLoading(false);
          return;
        }

        // Registration is strictly for Sponsors on the public page
        const res = await registerWithEmail(name, email, password, {
          communication: allowContact,
          privacy: acceptPrivacy
        });
        
        if (!res.success) {
          if (res.error?.includes('Error sending confirmation email')) {
            setErrorMessage('Não foi possível enviar o e-mail de confirmação pelo servidor (SMTP). Verifique as configurações de SMTP no Supabase ou os dados do domínio.');
          } else {
            setErrorMessage(res.error || 'Ocorreu um erro ao realizar o cadastro.');
          }
        } else {
          setIsRegisteredSuccess(true);
        }
      } else if (activeTab === 'recovery') {
        const success = await sendPasswordResetEmail(email);
        
        if (success) {
          setInfoMessage('Link de recuperação enviado com sucesso! Verifique sua caixa de entrada.');
          switchTab('login');
        } else {
          setErrorMessage('Erro ao enviar o link de recuperação. Por favor, verifique se o e-mail é válido.');
        }
      }
    } catch (error: any) {
      console.error(error);
      setErrorMessage(error?.message || 'Ocorreu um erro inesperado.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setIsLoading(true);
      setErrorMessage('');
      await loginWithGoogle();
    } catch (err: any) {
      setErrorMessage('Falha ao conectar com o Google. Tente novamente.');
      setIsLoading(false);
    }
  };

  const themeColor = 'orange';

  return (
    <div className="relative flex-1 min-h-[calc(100vh-140px)] flex items-center justify-center font-gotham-regular py-14 sm:py-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
      <SEO 
        title={isAdminMode ? "Área Administrativa | YAH Hope" : activeTab === 'register' ? "Cadastro de Mantenedor | YAH Hope" : "Entrar | Portal do Mantenedor - YAH Hope"}
        description={isAdminMode ? "Acesso administrativo restrito para colaboradores e gestão da YAH Hope." : "Acesse sua área exclusiva para acompanhar crianças atendidas pela Casa Nutri, projetos e relatórios de transparência."}
        canonical="https://yahhope.com/login"
      />

      {/* Full Background Image com Alta Transparência e Nitidez */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <img
          src="/login_bg_real.jpg"
          alt="Crianças sorrindo, YAH Hope"
          className="absolute inset-0 w-full h-full object-cover object-center scale-100"
        />
        {/* Overlay suave e translúcido - permite enxergar a imagem com muita clareza */}
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950/35 via-slate-900/15 to-slate-950/45"></div>
        <div className="absolute inset-0 bg-orange-950/10 mix-blend-overlay"></div>
      </div>

      {/* Card Central com Efeito Vidro Fosco (Glassmorphism Translúcido) */}
      <div className="w-full max-w-md space-y-6 bg-white/85 backdrop-blur-md p-7 sm:p-9 rounded-[2.5rem] shadow-2xl border border-white/60 relative z-10 overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-[#F49853]/15 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl pointer-events-none"></div>
        
        {isRegisteredSuccess ? (
          <div className="relative z-10 text-center py-2 space-y-5 animate-fade-in">
            <div className="w-20 h-20 bg-orange-100 text-[#F49853] rounded-3xl flex items-center justify-center mx-auto shadow-lg shadow-orange-500/10">
              <Mail size={40} className="animate-pulse" />
            </div>

            <div>
              <span className="text-xs font-black uppercase tracking-widest text-[#F49853] block mb-1">
                Quase Pronto!
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight font-heading">
                Confirme seu E-mail
              </h2>
            </div>

            <div className="bg-orange-50/90 border border-orange-200/80 rounded-2xl p-4 text-left space-y-2">
              <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-medium">
                Enviamos um link de confirmação para:
              </p>
              <p className="text-sm sm:text-base font-bold text-slate-900 bg-white px-3 py-2 rounded-xl border border-orange-200 break-all text-center">
                {email}
              </p>
              <p className="text-xs text-slate-600 leading-relaxed pt-1">
                Para ativar sua conta e liberar o acesso ao <strong>Portal do Mantenedor</strong>, abra seu e-mail e clique no botão de confirmação.
              </p>
            </div>

            <div className="bg-slate-50/90 rounded-2xl p-3.5 border border-slate-100 text-left text-xs text-slate-500 space-y-1">
              <p className="font-bold text-slate-700">Não encontrou o e-mail?</p>
              <p>Verifique sua caixa de <strong>Spam</strong> ou <strong>Lixo Eletrônico</strong>. Pode levar alguns instantes para chegar.</p>
            </div>

            <div className="pt-2 space-y-2.5">
              <button
                type="button"
                onClick={() => {
                  setIsRegisteredSuccess(false);
                  setActiveTab('login');
                }}
                className="w-full bg-[#F49853] hover:bg-[#e0853d] text-white font-bold py-3.5 px-6 rounded-2xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
              >
                <LogIn size={18} />
                <span>Já confirmei, ir para Login</span>
              </button>
              <Link
                to="/"
                className="block text-xs font-bold text-slate-500 hover:text-slate-800 py-1 transition-colors"
              >
                Voltar à Página Inicial
              </Link>
            </div>
          </div>
        ) : (
          <>
            <div className="relative z-10 text-center flex flex-col items-center">
              <h2 className="text-3xl sm:text-4xl font-heading font-black text-slate-900 tracking-tight">
                {isAdminMode ? 'Área Administrativa' : 'Ihale!'}
              </h2>
              <h3 className="text-lg sm:text-xl font-bold text-slate-700 mt-1">
                {isAdminMode 
                  ? (activeTab === 'recovery' ? 'Recuperar Acesso' : 'Gestão & Operações')
                  : activeTab === 'recovery' 
                    ? 'Recuperar Senha' 
                    : activeTab === 'register' 
                      ? 'Cadastro de Mantenedor' 
                      : 'Portal do Mantenedor'}
              </h3>
              <p className="mt-1 text-xs sm:text-sm text-slate-500 font-medium max-w-sm">
                {isAdminMode 
                  ? 'Acesso restrito para colaboradores, equipe técnica e liderança da YAH Hope.'
                  : activeTab === 'recovery' 
                    ? 'Insira seu e-mail para receber as instruções de recuperação.' 
                    : activeTab === 'register'
                      ? 'Crie sua conta para acompanhar seus impactos, crianças e doações.'
                      : 'Acesse sua área exclusiva para acompanhar o impacto das suas doações.'}
              </p>
            </div>

            {/* Abas Alternadoras (Apenas no Login do Mantenedor) */}
            {!isAdminMode && activeTab !== 'recovery' && (
              <div className="relative z-10 grid grid-cols-2 gap-1.5 p-1 bg-slate-100/90 rounded-2xl text-xs font-bold border border-slate-200/60">
                <button
                  type="button"
                  onClick={() => switchTab('login')}
                  className={`py-2.5 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    activeTab === 'login'
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  <LogIn size={14} />
                  <span>Já sou Mantenedor</span>
                </button>
                <button
                  type="button"
                  onClick={() => switchTab('register')}
                  className={`py-2.5 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    activeTab === 'register'
                      ? 'bg-[#F49853] text-white shadow-md'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  <Heart size={14} fill={activeTab === 'register' ? 'currentColor' : 'none'} />
                  <span>Quero me Cadastrar</span>
                </button>
              </div>
            )}

            {/* Login com Google */}
            {activeTab !== 'recovery' && (
              <div className="relative z-10 pt-1">
                <button
                  type="button"
                  onClick={handleGoogleLogin}
                  disabled={isLoading}
                  className="w-full flex items-center justify-center gap-3 py-3 px-4 bg-white/90 hover:bg-white border border-slate-200 hover:border-slate-300 rounded-xl text-slate-700 font-bold text-xs sm:text-sm shadow-xs hover:shadow-sm transition-all active:scale-[0.98] disabled:opacity-60 cursor-pointer"
                >
                  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                  </svg>
                  <span>Continuar com o Google</span>
                </button>

                <div className="relative my-3">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-200"></div>
                  </div>
                  <div className="relative flex justify-center text-[10px] uppercase font-bold tracking-wider">
                    <span className="bg-white/90 px-2 text-slate-400 rounded-md">ou com e-mail</span>
                  </div>
                </div>
              </div>
            )}
        
            <form className="space-y-4 relative z-10" onSubmit={handleAuth}>
            {/* Mensagem de Erro Integrada (Sem alert do navegador) */}
            {errorMessage && (
              <div className="bg-rose-50 border border-rose-200 text-rose-800 p-3.5 rounded-2xl text-xs flex items-start gap-2.5 text-left animate-shake">
                <AlertCircle size={16} className="text-rose-600 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="font-bold text-rose-900">Atenção</p>
                  <p className="text-rose-700 font-medium leading-relaxed mt-0.5">{errorMessage}</p>
                </div>
              </div>
            )}

            {/* Mensagem de Sucesso/Informativa Integrada */}
            {infoMessage && (
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-3.5 rounded-2xl text-xs flex items-start gap-2.5 text-left animate-fade-in">
                <CheckCircle2 size={16} className="text-emerald-600 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="font-bold text-emerald-950">Sucesso</p>
                  <p className="text-emerald-800 font-medium leading-relaxed mt-0.5">{infoMessage}</p>
                </div>
              </div>
            )}

            {/* Campo Nome (Apenas no Cadastro) */}
            {activeTab === 'register' && (
              <div>
                <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-1.5 px-1">
                  Nome Completo
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <UserPlus className="h-5 w-5 text-slate-400" />
                  </div>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="block w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 sm:text-sm transition-all"
                    placeholder="Seu nome completo"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-1.5 px-1">
                E-mail
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 sm:text-sm transition-all"
                  placeholder="seu@email.com"
                />
              </div>
            </div>

            {activeTab !== 'recovery' && (
              <div>
                <div className="flex justify-between items-center mb-1.5 px-1">
                  <label className="block text-xs font-black text-slate-500 uppercase tracking-widest">
                    Senha
                  </label>
                  {activeTab === 'login' && (
                    <button
                      type="button"
                      onClick={() => switchTab('recovery')}
                      className="text-xs font-bold text-orange-600 hover:text-orange-700"
                    >
                      Esqueceu?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-slate-400" />
                  </div>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="block w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 sm:text-sm transition-all"
                    placeholder="••••••••"
                  />
                </div>
                {activeTab === 'register' && (
                  <p className="text-[11px] text-slate-400 mt-1 px-1">
                    Mínimo de 6 caracteres.
                  </p>
                )}
              </div>
            )}

            {/* Checkboxes de Autorização e Termos (Apenas no Cadastro) */}
            {activeTab === 'register' && (
              <div className="space-y-3 pt-2 text-left">
                {/* Autorização de mensagens e contato */}
                <label className="flex items-start gap-2.5 cursor-pointer text-xs text-slate-600 select-none">
                  <input
                    type="checkbox"
                    checked={acceptCommunications}
                    onChange={(e) => setAcceptCommunications(e.target.checked)}
                    className="mt-0.5 rounded text-orange-500 focus:ring-orange-500 border-slate-300 w-4 h-4 cursor-pointer"
                  />
                  <span>
                    Autorizo o contato e o recebimento de mensagens, atualizações de projetos e novidades da plataforma YAH Hope via WhatsApp e e-mail.
                  </span>
                </label>

                {/* Política de Privacidade (Obrigatório) */}
                <label className="flex items-start gap-2.5 cursor-pointer text-xs text-slate-600 select-none">
                  <input
                    type="checkbox"
                    required
                    checked={acceptPrivacy}
                    onChange={(e) => {
                      setAcceptPrivacy(e.target.checked);
                      if (consentError) setConsentError('');
                    }}
                    className="mt-0.5 rounded text-orange-500 focus:ring-orange-500 border-slate-300 w-4 h-4 cursor-pointer"
                  />
                  <span>
                    Concordo com os{' '}
                    <Link to="/termos-de-servico" target="_blank" className="font-bold text-orange-600 hover:underline">
                      Termos de Serviço
                    </Link>{' '}
                    e a{' '}
                    <Link to="/politica-de-privacidade" target="_blank" className="font-bold text-orange-600 hover:underline">
                      Política de Privacidade
                    </Link>{' '}
                    da YAH Hope. *
                  </span>
                </label>

                {consentError && (
                  <p className="text-[11px] font-bold text-red-600 bg-red-50 p-2.5 rounded-xl border border-red-200">
                    {consentError}
                  </p>
                )}
              </div>
            )}

            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="group relative w-full flex justify-center py-3.5 px-4 border border-transparent text-sm font-black rounded-xl text-white bg-[#F49853] hover:bg-[#e0853d] focus:outline-none focus:ring-4 focus:ring-orange-500/20 transition-all shadow-lg shadow-orange-500/20 active:scale-[0.98] disabled:opacity-70 cursor-pointer"
              >
                {isLoading 
                  ? 'Aguarde...' 
                  : activeTab === 'recovery' 
                    ? 'Enviar Link de Recuperação' 
                    : activeTab === 'register' 
                      ? 'Criar Conta de Mantenedor' 
                      : 'Entrar na Plataforma'}
              </button>
            </div>

            {/* Alternador de rodapé */}
            <div className="text-center pt-2 space-y-2.5">
              {isAdminMode ? (
                <div>
                  <Link
                    to="/login"
                    className="text-xs font-bold text-orange-600 hover:text-orange-700 underline"
                  >
                    ← É mantenedor ou doador? Acessar Portal do Mantenedor
                  </Link>
                </div>
              ) : (
                <>
                  {activeTab === 'login' ? (
                    <p className="text-xs text-slate-500">
                      Ainda não tem conta?{' '}
                      <button
                        type="button"
                        onClick={() => switchTab('register')}
                        className="font-bold text-orange-600 hover:text-orange-700 underline cursor-pointer"
                      >
                        Cadastre-se como Mantenedor
                      </button>
                    </p>
                  ) : activeTab === 'register' ? (
                    <p className="text-xs text-slate-500">
                      Já possui conta cadastrada?{' '}
                      <button
                        type="button"
                        onClick={() => switchTab('login')}
                        className="font-bold text-orange-600 hover:text-orange-700 underline cursor-pointer"
                      >
                        Fazer Login
                      </button>
                    </p>
                  ) : (
                    <button
                      type="button"
                      onClick={() => switchTab('login')}
                      className="text-xs font-bold text-orange-600 hover:text-orange-700 transition-all cursor-pointer"
                    >
                      Voltar para o login
                    </button>
                  )}

                  <div className="pt-2 border-t border-slate-200/60">
                    <Link
                      to="/login?mode=admin"
                      className="text-[11px] font-bold text-slate-500 hover:text-orange-600 transition-colors inline-flex items-center gap-1.5"
                    >
                      <Lock size={12} className="text-orange-500" />
                      <span>Colaborador da YAH Hope? Acessar Área Administrativa</span>
                    </Link>
                  </div>
                </>
              )}
            </div>

          </form>
          </>
        )}

      </div>
    </div>
  );
}

