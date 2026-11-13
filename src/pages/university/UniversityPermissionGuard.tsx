import React from 'react';
import { ShieldAlert, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useUniversity } from '../../contexts/UniversityContext';
import { UniversityPermissionKey } from '../../lib/universityPermissions';

interface UniversityPermissionGuardProps {
  requiredPermission?: UniversityPermissionKey;
  requiredPermissions?: UniversityPermissionKey[];
  sectionLabel?: string;
  children: React.ReactNode;
}

export function UniversityPermissionGuard({
  requiredPermission,
  requiredPermissions,
  sectionLabel = 'esta seção do Futuro Universitário',
  children,
}: UniversityPermissionGuardProps) {
  const { can } = useUniversity();
  const navigate = useNavigate();

  const keys = requiredPermissions || (requiredPermission ? [requiredPermission] : []);
  const isAuthorized = keys.length === 0 || keys.some(k => can(k));

  if (!isAuthorized) {
    return (
      <div className="p-8 max-w-lg mx-auto mt-12 animate-in fade-in zoom-in-95 duration-300">
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200/80 shadow-xl text-center space-y-4">
          <div className="w-16 h-16 rounded-3xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
            <ShieldAlert size={32} />
          </div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Permissão Insuficiente</h2>
          <p className="text-xs text-slate-500 font-medium leading-relaxed">
            Seu perfil não possui a permissão interna necessária para acessar <strong>{sectionLabel}</strong>{' '}
            (<code className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-700">{keys[0]}</code>).
            Solicite autorização ao Administrador no Diretório Global de Usuários.
          </p>
          <div className="pt-3 flex justify-center">
            <button
              onClick={() => navigate('/futuro-universitario')}
              className="flex items-center gap-2 px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-bold text-xs transition-all cursor-pointer"
            >
              <ArrowLeft size={16} />
              Voltar ao Painel do Futuro Universitário
            </button>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
