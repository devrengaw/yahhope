import React, { useState, useEffect } from 'react';
import { 
  X, 
  Shield, 
  ShieldCheck, 
  User, 
  Search, 
  Check, 
  AlertCircle, 
  DollarSign,
  Heart,
  MessageSquare,
  Lock
} from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { cn } from '../../../lib/utils';
import { useAuth } from '../../../contexts/AuthContext';

interface UserRecord {
  id: string;
  name: string;
  email: string;
  role: string;
  permissions?: string[];
  avatar?: string;
}

interface ManageCostsAccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetModule: 'nutrition' | 'communication' | 'all';
}

export function ManageCostsAccessModal({
  isOpen,
  onClose,
  targetModule
}: ManageCostsAccessModalProps) {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [savingUserId, setSavingUserId] = useState<string | null>(null);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchUsers();
    }
  }, [isOpen]);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.from('users').select('*').order('name');
      if (data) {
        setUsers(data as UserRecord[]);
      }
    } catch (err) {
      console.error('Erro ao buscar usuários:', err);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  const targetPerm = targetModule === 'nutrition' ? 'nutrition-finance' : 'communication-finance';
  const targetLabel = targetModule === 'nutrition' ? 'Casa Nutri' : 'Comunicação';

  const handleTogglePermission = async (userToUpdate: UserRecord, permKey: string) => {
    setSavingUserId(userToUpdate.id);
    setSaveSuccessMsg(null);
    try {
      const currentPerms = Array.isArray(userToUpdate.permissions) ? userToUpdate.permissions : [];
      const hasPerm = currentPerms.includes(permKey);
      
      const newPerms = hasPerm 
        ? currentPerms.filter(p => p !== permKey)
        : [...currentPerms, permKey];

      const { error } = await supabase
        .from('users')
        .update({ permissions: newPerms })
        .eq('id', userToUpdate.id);

      if (error) throw error;

      // Atualiza estado local
      setUsers(prev => prev.map(u => u.id === userToUpdate.id ? { ...u, permissions: newPerms } : u));
      setSaveSuccessMsg(`Permissão atualizada para ${userToUpdate.name}!`);
      setTimeout(() => setSaveSuccessMsg(null), 3000);
    } catch (err: any) {
      console.error('Erro ao atualizar permissão:', err);
      alert('Erro ao atualizar permissão: ' + (err.message || 'Tente novamente.'));
    } finally {
      setSavingUserId(null);
    }
  };

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (u.role && u.role.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
      <div className="bg-white rounded-[2.5rem] w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden border border-slate-100">
        
        {/* Header */}
        <div className="p-8 border-b border-slate-100 flex items-start justify-between bg-slate-50/50">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-slate-900 text-amber-400 flex items-center justify-center shadow-lg shadow-slate-900/20">
              <ShieldCheck size={28} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">Controle de Acesso a Custos</h2>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-100 text-amber-800 border border-amber-200">
                  Super Admin
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium mt-1">
                Escolha quais colaboradores podem visualizar e gerenciar os custos fixos e variados de <strong className="text-slate-900">{targetLabel}</strong>.
              </p>
            </div>
          </div>

          <button 
            onClick={onClose}
            className="p-2.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/50 rounded-2xl transition-all"
          >
            <X size={20} />
          </button>
        </div>

        {/* Toolbar de Busca e Notificação */}
        <div className="p-6 border-b border-slate-100 bg-white space-y-4">
          {saveSuccessMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-xl flex items-center gap-2 animate-in fade-in">
              <Check size={16} className="text-emerald-600" />
              {saveSuccessMsg}
            </div>
          )}

          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Buscar colaborador por nome, e-mail ou cargo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-4 focus:ring-slate-500/5 focus:border-slate-300 transition-all"
            />
          </div>
        </div>

        {/* Lista de Colaboradores */}
        <div className="p-6 overflow-y-auto divide-y divide-slate-100 space-y-3">
          {filteredUsers.map((u) => {
            const isUserAdmin = u.role === 'ADMIN' || u.email?.toLowerCase() === 'contato@yahhope.com';
            const userPerms = Array.isArray(u.permissions) ? u.permissions : [];
            const hasNutritionPerm = isUserAdmin || userPerms.includes('nutrition-finance') || userPerms.includes('all');
            const hasCommPerm = isUserAdmin || userPerms.includes('communication-finance') || userPerms.includes('all');
            const isSaving = savingUserId === u.id;

            return (
              <div key={u.id} className="pt-3 pb-3 flex items-center justify-between gap-4 group">
                
                {/* Info do Usuário */}
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-2xl bg-slate-100 text-slate-700 flex items-center justify-center font-black text-sm border border-slate-200 flex-shrink-0">
                    {u.name ? u.name.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-slate-900 text-sm truncate">{u.name || 'Sem Nome'}</p>
                      <span className={cn(
                        "px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider",
                        isUserAdmin ? "bg-amber-100 text-amber-800" : "bg-slate-100 text-slate-600"
                      )}>
                        {u.role || 'USER'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 truncate">{u.email}</p>
                  </div>
                </div>

                {/* Controles de Permissão */}
                <div className="flex items-center gap-3 flex-shrink-0">
                  {isUserAdmin ? (
                    <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200 flex items-center gap-1.5">
                      <ShieldCheck size={14} />
                      Acesso Total (Admin)
                    </span>
                  ) : (
                    <div className="flex items-center gap-2">
                      
                      {/* Permissão Casa Nutri */}
                      {(targetModule === 'nutrition' || targetModule === 'all') && (
                        <button
                          disabled={isSaving}
                          onClick={() => handleTogglePermission(u, 'nutrition-finance')}
                          className={cn(
                            "px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border shadow-sm",
                            hasNutritionPerm
                              ? "bg-emerald-600 text-white border-emerald-600 hover:bg-emerald-700"
                              : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                          )}
                          title="Permitir acesso aos custos da Casa Nutri"
                        >
                          <Heart size={13} className={hasNutritionPerm ? "fill-white" : "text-slate-400"} />
                          Casa Nutri: {hasNutritionPerm ? 'Permitido' : 'Bloqueado'}
                        </button>
                      )}

                      {/* Permissão Comunicação */}
                      {(targetModule === 'communication' || targetModule === 'all') && (
                        <button
                          disabled={isSaving}
                          onClick={() => handleTogglePermission(u, 'communication-finance')}
                          className={cn(
                            "px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border shadow-sm",
                            hasCommPerm
                              ? "bg-purple-600 text-white border-purple-600 hover:bg-purple-700"
                              : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                          )}
                          title="Permitir acesso aos custos de Comunicação"
                        >
                          <MessageSquare size={13} />
                          Comunicação: {hasCommPerm ? 'Permitido' : 'Bloqueado'}
                        </button>
                      )}

                    </div>
                  )}
                </div>

              </div>
            );
          })}

          {filteredUsers.length === 0 && !isLoading && (
            <div className="p-8 text-center text-slate-400 text-sm font-medium">
              Nenhum colaborador encontrado com o termo buscado.
            </div>
          )}

          {isLoading && (
            <div className="p-8 text-center text-slate-400 text-sm font-medium animate-pulse">
              Carregando lista de colaboradores...
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
          <p className="text-xs text-slate-400 font-medium">
            💡 Os usuários autorizados terão acesso instantâneo ao recarregarem a página.
          </p>
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-slate-900 text-white rounded-xl font-bold text-xs hover:bg-slate-800 transition-all shadow-md active:scale-95"
          >
            Concluir
          </button>
        </div>

      </div>
    </div>
  );
}
