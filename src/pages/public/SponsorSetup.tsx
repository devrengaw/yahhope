import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { KeyRound, Lock, ArrowRight, User, Mail, HeartHandshake, CheckCircle2, LogIn } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { SEO } from '../../components/common/SEO';
import { isSpamOrMockUser } from '../../utils/userCleanup';
import { useLanguage } from '../../contexts/LanguageContext';

export function SponsorSetup() {
  const { tr } = useLanguage();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [name, setName] = useState(searchParams.get('nome') || searchParams.get('name') || '');
  const [email, setEmail] = useState(searchParams.get('email') || '');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [detectedRole, setDetectedRole] = useState<'SPONSOR' | 'MANTENEDOR'>('SPONSOR');
  const [alreadyRegistered, setAlreadyRegistered] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const inspectSupporterEmail = async (rawEmail: string) => {
    const clean = (rawEmail || '').trim().toLowerCase();
    if (!clean || !clean.includes('@')) return;

    try {
      const [{ data: userRow }, { data: spRows }] = await Promise.all([
        supabase.from('users').select('name, role').ilike('email', clean).maybeSingle(),
        supabase.from('sponsorships').select('child_id, monthly_amount, donor_name').ilike('donor_email', clean).eq('status', 'active')
      ]);

      if (!name && (userRow?.name || spRows?.[0]?.donor_name)) {
        setName(userRow?.name || spRows?.[0]?.donor_name || '');
      }

      const hasSponsorChild = (spRows || []).some((s: any) => s.child_id !== null || Number(s.monthly_amount || 0) >= 90);
      if (userRow?.role === 'MANTENEDOR' || ((spRows || []).length > 0 && !hasSponsorChild)) {
        setDetectedRole('MANTENEDOR');
      } else {
        setDetectedRole('SPONSOR');
      }
    } catch {
      // Silencioso para não bloquear o fluxo
    }
  };

  useEffect(() => {
    const urlEmail = searchParams.get('email');
    const urlName = searchParams.get('nome') || searchParams.get('name');
    if (urlEmail && !email) setEmail(urlEmail);
    if (urlName && !name) setName(urlName);
    if (urlEmail) {
      inspectSupporterEmail(urlEmail);
    }
  }, [searchParams]);

  // Custom theme colors for this page to look modern and elegant (using orange for sponsors)
  const themeColor = 'orange';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      setError(tr('As senhas não coincidem. Tente novamente.', 'Passwords do not match. Please try again.'));
      return;
    }
    
    if (password.length < 6) {
      setError(tr('A senha deve ter pelo menos 6 caracteres.', 'Password must be at least 6 characters long.'));
      return;
    }

    if (isSpamOrMockUser({ name, email })) {
      setError(tr('Por favor, informe seu nome completo válido.', 'Please enter a valid full name.'));
      return;
    }

    setIsLoading(true);
    setError(null);
    setAlreadyRegistered(false);

    const cleanEmail = email.trim().toLowerCase();

    try {
      await inspectSupporterEmail(cleanEmail);

      // Create user in Supabase
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: cleanEmail,
        password,
        options: {
          data: {
            full_name: name.trim(),
            role: detectedRole
          }
        }
      });

      if (signUpError) throw signUpError;

      // Quando a confirmação de e-mail está ativa no Supabase, e-mails já existentes retornam identities = []
      if (data?.user && (!data.user.identities || data.user.identities.length === 0)) {
        setAlreadyRegistered(true);
        return;
      }
      
      // If successful, navigate to portal
      navigate('/portal/dashboard');
      
    } catch (err: any) {
      console.error('Error during setup:', err);
      const msg = (err.message || '').toLowerCase();
      if (msg.includes('already registered') || msg.includes('already been taken') || msg.includes('user already')) {
        setAlreadyRegistered(true);
      } else {
        setError(err.message || tr('Ocorreu um erro ao criar seu acesso. Tente novamente.', 'An error occurred while creating your account. Please try again.'));
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendPasswordReset = async () => {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) return;
    setIsLoading(true);
    setError(null);
    try {
      const { error: resetErr } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
        redirectTo: `${window.location.origin}/set-password`
      });
      if (resetErr) throw resetErr;
      setResetSent(true);
    } catch (err: any) {
      setError(err.message || tr('Não foi possível enviar o e-mail de redefinição.', 'Could not send the password reset email.'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center font-sans relative py-12 px-4 sm:px-6 lg:px-8 bg-slate-900 overflow-hidden">
      <SEO
        title={tr('Finalizar Cadastro | Portal do Mantenedor - YAH Hope', 'Complete Registration | Supporter Portal - YAH Hope')}
        description={tr('Finalize seu cadastro de mantenedor da YAH Hope para acessar o portal exclusivo.', 'Complete your YAH Hope supporter registration to access the exclusive portal.')}
        canonical="https://yahhope.com/finalizar-cadastro"
        noIndex={true}
      />
      
      {/* Background Image Setup */}
      <div className="absolute inset-0 z-0">
        <img 
          src="/login_bg_real.jpg" 
          alt="Crianças sorrindo" 
          className="w-full h-full object-cover object-center"
        />
        <div className="absolute inset-0 bg-slate-900/70 backdrop-blur-[4px]"></div>
      </div>

      {/* Centered Setup Box */}
      <div className="w-full max-w-md space-y-8 bg-white/95 backdrop-blur-xl p-10 rounded-[2.5rem] shadow-2xl border border-white/20 relative z-10 overflow-hidden">
        
        {/* Decorative elements */}
        <div className={`absolute top-0 right-0 w-32 h-32 bg-${themeColor}-500/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl`}></div>
        <div className={`absolute bottom-0 left-0 w-40 h-40 bg-yellow-500/10 rounded-full translate-y-1/2 -translate-x-1/2 blur-2xl`}></div>
        
        <div className="relative z-10 text-center flex flex-col items-center">
          <div className={`w-16 h-16 bg-${themeColor}-50 text-${themeColor}-600 rounded-3xl flex items-center justify-center shadow-inner border border-${themeColor}-100 transition-all duration-500 mb-6 group-hover:scale-110`}>
            {user || alreadyRegistered ? <CheckCircle2 size={32} /> : <HeartHandshake size={32} />}
          </div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">
            {user
              ? tr('Você já está conectado!', 'You are already signed in!')
              : alreadyRegistered
              ? tr('Cadastro já existente', 'Account already exists')
              : tr('Finalize seu Cadastro', 'Complete Your Registration')}
          </h2>
          <p className="mt-3 text-sm text-slate-500 font-medium px-2 leading-relaxed">
            {user
              ? tr(`Sua conta (${user.email}) já está ativa na YAH Hope. Acesse o portal para acompanhar suas doações e afilhados.`, `Your account (${user.email}) is already active on YAH Hope. Access the portal to track your donations and sponsored children.`)
              : alreadyRegistered
              ? tr(`O e-mail ${email} já possui uma conta cadastrada na YAH Hope. Entre com sua senha ou solicite uma nova.`, `The email ${email} already has an account registered on YAH Hope. Sign in with your password or request a new one.`)
              : tr(`Obrigado por apoiar a YAH Hope${detectedRole === 'MANTENEDOR' ? ' como Mantenedor' : ''}! Crie sua senha para acompanhar o impacto da sua doação e acessar o portal.`, `Thank you for supporting YAH Hope${detectedRole === 'MANTENEDOR' ? ' as a Monthly Supporter' : ''}! Create your password to track your impact and access the portal.`)}
          </p>

          {user ? (
            <div className="mt-8 w-full space-y-3">
              <button
                type="button"
                onClick={() => navigate('/portal/dashboard')}
                className="w-full flex justify-center items-center gap-2 py-4 px-4 rounded-xl text-sm font-black text-white bg-orange-600 hover:bg-orange-700 transition-all shadow-lg shadow-orange-500/20 cursor-pointer"
              >
                {tr('Acessar meu Portal', 'Access My Portal')}
                <ArrowRight size={18} />
              </button>
            </div>
          ) : alreadyRegistered ? (
            <div className="mt-8 w-full space-y-3">
              {error && (
                <div className="p-4 bg-red-50/80 border border-red-100 rounded-xl text-red-600 text-xs font-bold text-center">
                  {error}
                </div>
              )}
              {resetSent && (
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 text-xs font-bold text-center">
                  {tr(`Enviamos um link para redefinir sua senha para ${email}. Confira sua caixa de entrada.`, `We sent a password reset link to ${email}. Please check your inbox.`)}
                </div>
              )}
              <Link
                to={`/login?email=${encodeURIComponent(email.trim().toLowerCase())}`}
                className="w-full flex justify-center items-center gap-2 py-4 px-4 rounded-xl text-sm font-black text-white bg-orange-600 hover:bg-orange-700 transition-all shadow-lg shadow-orange-500/20"
              >
                <LogIn size={18} />
                {tr('Entrar no Portal', 'Sign In to Portal')}
              </Link>
              <button
                type="button"
                disabled={isLoading || resetSent}
                onClick={handleSendPasswordReset}
                className="w-full py-3 px-4 rounded-xl text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors disabled:opacity-60 cursor-pointer"
              >
                {resetSent ? tr('Link de redefinição enviado', 'Reset link sent') : tr('Esqueci minha senha / Criar nova senha', 'Forgot password / Create new password')}
              </button>
            </div>
          ) : (
          <form className="mt-8 space-y-5 w-full text-left" onSubmit={handleSubmit}>
            {error && (
              <div className="p-4 bg-red-50/80 border border-red-100 rounded-xl text-red-600 text-xs font-bold text-center">
                {error}
              </div>
            )}
            
            <div>
              <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-1.5 px-1">{tr('Nome Completo', 'Full Name')}</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                  <User size={18} />
                </div>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={`block w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-${themeColor}-500/20 focus:border-${themeColor}-500 sm:text-sm transition-all`}
                  placeholder={tr('Seu nome completo', 'Your full name')}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-1.5 px-1">{tr('E-mail', 'Email')}</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                  <Mail size={18} />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onBlur={() => inspectSupporterEmail(email)}
                  className={`block w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-${themeColor}-500/20 focus:border-${themeColor}-500 sm:text-sm transition-all`}
                  placeholder={tr('E-mail usado na doação', 'Email used for donation')}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-1.5 px-1">{tr('Senha', 'Password')}</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                  <KeyRound size={18} />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`block w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-${themeColor}-500/20 focus:border-${themeColor}-500 sm:text-sm transition-all`}
                  placeholder={tr('Mínimo de 6 caracteres', 'Minimum 6 characters')}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-1.5 px-1">{tr('Confirmar Senha', 'Confirm Password')}</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                  <Lock size={18} />
                </div>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={`block w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-${themeColor}-500/20 focus:border-${themeColor}-500 sm:text-sm transition-all`}
                  placeholder={tr('Repita a senha', 'Repeat password')}
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading || !password || !confirmPassword || !name || !email}
                className={`group relative w-full flex justify-center items-center gap-2 py-4 px-4 border border-transparent text-sm font-black rounded-xl text-white bg-${themeColor}-600 hover:bg-${themeColor}-700 focus:outline-none focus:ring-4 focus:ring-${themeColor}-500/20 transition-all shadow-lg shadow-${themeColor}-500/20 active:scale-[0.98] disabled:opacity-70 cursor-pointer`}
              >
                {isLoading ? tr('Aguarde...', 'Please wait...') : tr('Criar meu Acesso', 'Create My Account')}
                {!isLoading && <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />}
              </button>
            </div>

            <div className="pt-4 text-center">
              <p className="text-xs text-slate-500 font-medium">
                {tr('Já possui uma conta ou senha cadastrada?', 'Already have an account?')}{' '}
                <Link to="/login" className="text-orange-600 hover:text-orange-700 font-bold hover:underline">
                  {tr('Fazer Login', 'Sign In')}
                </Link>
              </p>
            </div>
          </form>
          )}
        </div>
      </div>
    </div>
  );
}
