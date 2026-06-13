import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { KeyRound, Lock, ArrowRight, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

export function SetPassword() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // Custom theme colors for this page to look modern and elegant
  const themeColor = 'blue';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      setError('As senhas não coincidem. Tente novamente.');
      return;
    }
    
    if (password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password: password
      });

      if (updateError) throw updateError;
      
      // If successful, navigate based on their role
      if (user?.role === 'ADMIN' || user?.permissions?.length && user.permissions.length > 0) {
        navigate('/admin');
      } else {
        navigate('/login');
      }
      
    } catch (err: any) {
      console.error('Error updating password:', err);
      setError(err.message || 'Ocorreu um erro ao definir sua senha. O link de convite pode ter expirado.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center font-sans relative py-12 px-4 sm:px-6 lg:px-8 bg-slate-900 overflow-hidden">
      
      {/* Background Image Setup */}
      <div className="absolute inset-0 z-0">
        <img 
          src="/login_bg_real.jpg" 
          alt="Crianças sorrindo" 
          className="w-full h-full object-cover object-center"
        />
        <div className="absolute inset-0 bg-slate-900/70 backdrop-blur-[4px]"></div>
      </div>

      {/* Centered Set Password Box */}
      <div className="w-full max-w-md space-y-8 bg-white/95 backdrop-blur-xl p-10 rounded-[2.5rem] shadow-2xl border border-white/20 relative z-10 overflow-hidden">
        
        {/* Decorative elements */}
        <div className={`absolute top-0 right-0 w-32 h-32 bg-${themeColor}-500/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl`}></div>
        <div className={`absolute bottom-0 left-0 w-40 h-40 bg-emerald-500/10 rounded-full translate-y-1/2 -translate-x-1/2 blur-2xl`}></div>
        
        <div className="relative z-10 text-center flex flex-col items-center">
          <div className={`w-16 h-16 bg-${themeColor}-50 text-${themeColor}-600 rounded-3xl flex items-center justify-center shadow-inner border border-${themeColor}-100 transition-all duration-500 mb-6 group-hover:scale-110`}>
            <ShieldCheck size={32} />
          </div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">
            Configure seu Acesso
          </h2>
          <p className="mt-3 text-sm text-slate-500 font-medium px-2 leading-relaxed">
            Bem-vindo(a) à plataforma YAH Hope! Defina uma senha segura para começar a utilizar o sistema.
          </p>

          <form className="mt-8 space-y-5 w-full text-left" onSubmit={handleSubmit}>
            {error && (
              <div className="p-4 bg-red-50/80 border border-red-100 rounded-xl text-red-600 text-xs font-bold text-center">
                {error}
              </div>
            )}
            
            <div>
              <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-1.5 px-1">Nova Senha</label>
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
                  placeholder="Mínimo de 6 caracteres"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-1.5 px-1">Confirmar Senha</label>
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
                  placeholder="Repita sua nova senha"
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading || !password || !confirmPassword}
                className={`group relative w-full flex justify-center items-center gap-2 py-4 px-4 border border-transparent text-sm font-black rounded-xl text-white bg-${themeColor}-600 hover:bg-${themeColor}-700 focus:outline-none focus:ring-4 focus:ring-${themeColor}-500/20 transition-all shadow-lg shadow-${themeColor}-500/20 active:scale-[0.98] disabled:opacity-70`}
              >
                {isLoading ? 'Salvando...' : 'Acessar o Sistema'}
                {!isLoading && <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
