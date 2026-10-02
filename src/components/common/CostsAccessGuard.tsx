import React from 'react';
import { ShieldAlert, ArrowLeft } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

interface CostsAccessGuardProps {
  module: 'nutrition' | 'communication';
  children: React.ReactNode;
}

export function CostsAccessGuard({ module, children }: CostsAccessGuardProps) {
  const { user } = useAuth();
  const navigate = useNavigate();

  const isMasterAdmin = 
    user?.role === 'ADMIN' || 
    user?.email?.toLowerCase() === 'contato@yahhope.com';

  const requiredPerm = module === 'nutrition' ? 'nutrition-finance' : 'communication-finance';
  const userPerms = Array.isArray(user?.permissions) ? user?.permissions : [];
  const hasAccess = isMasterAdmin || userPerms.includes(requiredPerm) || userPerms.includes('all');

  if (!hasAccess) {
    const moduleTitle = module === 'nutrition' ? 'Casa Nutri' : 'Comunicação';
    const fallbackPath = module === 'nutrition' ? '/nutrition' : '/communication';

    return (
      <div className="p-8 max-w-lg mx-auto mt-12 animate-in fade-in zoom-in-95 duration-300">
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200/80 shadow-2xl text-center space-y-4">
          <div className="w-16 h-16 rounded-3xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto shadow-inner">
            <ShieldAlert size={32} />
          </div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Área Restrita aos Gestores</h2>
          <p className="text-xs text-slate-500 font-medium leading-relaxed">
            Você não possui permissão para visualizar ou lançar os custos fixos e variáveis de <strong>{moduleTitle}</strong>.
            Esta área é controlada pelo <strong>Super Administrador</strong> da organização.
          </p>
          <div className="pt-4 flex justify-center">
            <button
              onClick={() => navigate(fallbackPath)}
              className="flex items-center gap-2 px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-bold text-xs shadow-lg shadow-slate-900/20 transition-all active:scale-95"
            >
              <ArrowLeft size={16} />
              Voltar ao Início de {moduleTitle}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
