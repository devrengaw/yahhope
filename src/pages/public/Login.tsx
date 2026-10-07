import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Heart, Lock, Mail, UserPlus, LogIn, CheckSquare, Square } from 'lucide-react';

export function Login() {
  const { loginWithEmail, loginWithGoogle, registerWithEmail, sendPasswordResetEmail, user, loading } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [activeTab, setActiveTab] = useState<'login' | 'register' | 'recovery'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [acceptCommunications, setAcceptCommunications] = useState(true);
  const [acceptPrivacy, setAcceptPrivacy] = useState(false);
  const [consentError, setConsentError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRegisteredSuccess, setIsRegisteredSuccess] = useState(false);

  // Preenche dados vindos da URL caso venha de um fluxo pós-doação (?register=true ou ?tab=register&email=...)
  useEffect(() => {
    const tabParam = searchParams.get('tab') || (searchParams.get('register') === 'true' ? 'register' : null);
    if (tabParam === 'register' || tabParam === 'recovery' || tabParam === 'login') {
      setActiveTab(tabParam);
    }
    const emailParam = searchParams.get('email');
    if (emailParam) setEmail(emailParam);
    const nameParam = searchParams.get('name');
    if (nameParam) setName(nameParam);
  }, [searchParams]);

  // If user is already logged in, redirect them
  useEffect(() => {
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

      if (user.role === 'OBSERVER') {
        navigate('/nutrition/patients');
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
    setConsentError('');
    setIsLoading(true);
    
    try {
      if (activeTab === 'login') {
        const res = await loginWithEmail(email, password);
        
        if (!res.success) {
          alert(res.error || 'Credenciais inválidas! Verifique seu e-mail e senha.');
        }
      } else if (activeTab === 'register') {
        if (!acceptPrivacy) {
          setConsentError('Você precisa aceitar a Política de Privacidade para criar sua conta.');
          setIsLoading(false);
          return;
        }

        // Registration is strictly for Sponsors on the public page
        const res = await registerWithEmail(name, email, password);
        
        if (!res.success) {
          alert(res.error || 'Ocorreu um erro ao realizar o cadastro.');
        } else {
          setIsRegisteredSuccess(true);
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
      <div className="w-full max-w-md space-y-6 bg-white/95 backdrop-blur-xl p-8 sm:p-10 rounded-[2.5rem] shadow-2xl border border-white/20 relative z-10 overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl"></div>
        
        {isRegisteredSuccess ? (
          <div className="relative z-10 text-center py-2 space-y-5 animate-fade-in">
            <div className="w-20 h-20 bg-orange-100 text-[#F49853] rounded-3xl flex items-center justify-center mx-auto shadow-lg shadow-orange-500/10">
              <Mail size={40} className="animate-pulse" />
            </div>

            <div>
              <span className="text-xs font-black uppercase tracking-widest text-[#F49853] block mb-1">
                Quase Pronto!
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                Confirme seu E-mail
              </h2>
            </div>

            <div className="bg-orange-50/80 border border-orange-200/80 rounded-2xl p-4 text-left space-y-2">
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

            <div className="bg-slate-50 rounded-2xl p-3.5 border border-slate-100 text-left text-xs text-slate-500 space-y-1">
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
              <h2 className="text-4xl font-black text-slate-900 tracking-tight">
                Ihale!
              </h2>
              <h3 className="text-xl font-bold text-slate-700 mt-1">
                {activeTab === 'recovery' 
                  ? 'Recuperar Senha' 
                  : activeTab === 'register' 
                    ? 'Cadastro de Mantenedor' 
                    : 'Portal do Mantenedor'}
              </h3>
              <p className="mt-1 text-xs sm:text-sm text-slate-500 font-medium">
                {activeTab === 'recovery' 
                  ? 'Insira seu e-mail para receber as instruções de recuperação.' 
                  : activeTab === 'register'
                    ? 'Crie sua conta para acompanhar seus impactos, crianças e doações.'
                    : 'Acesse sua área exclusiva para acompanhar o impacto das suas doações.'}
              </p>
            </div>

            {/* Abas Alternadoras: Entrar vs Quero me Cadastrar */}
            {activeTab !== 'recovery' && (
              <div className="relative z-10 grid grid-cols-2 gap-1.5 p-1 bg-slate-100 rounded-2xl text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setActiveTab('login')}
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
                  onClick={() => setActiveTab('register')}
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
        
        <form className="space-y-4 relative z-10" onSubmit={handleAuth}>
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
                      onClick={() => setActiveTab('recovery')}
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
            <div className="text-center pt-2">
              {activeTab === 'login' ? (
                <p className="text-xs text-slate-500">
                  Ainda não tem conta?{' '}
                  <button
                    type="button"
                    onClick={() => setActiveTab('register')}
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
                    onClick={() => setActiveTab('login')}
                    className="font-bold text-orange-600 hover:text-orange-700 underline cursor-pointer"
                  >
                    Fazer Login
                  </button>
                </p>
              ) : (
                <button
                  type="button"
                  onClick={() => setActiveTab('login')}
                  className="text-xs font-bold text-orange-600 hover:text-orange-700 transition-all cursor-pointer"
                >
                  Voltar para o login
                </button>
              )}
            </div>

          </form>
          </>
        )}

      </div>
    </div>
  );
}

