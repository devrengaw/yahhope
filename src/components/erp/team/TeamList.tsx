import React, { useState, useEffect } from 'react';
import { TeamMember, TeamMemberRole, TeamMemberStatus } from '../../../lib/mockData';
import { supabase } from '../../../lib/supabase';
import { Mail, Phone, Edit2, Trash2, Send } from 'lucide-react';

interface TeamListProps {
  members: TeamMember[];
  onEdit?: (member: TeamMember) => void;
  onDelete?: (id: string) => void;
  onResendInvite?: (member: TeamMember) => void;
  onQuickRoleChange?: (member: TeamMember, newRole: TeamMemberRole) => void;
}

export function TeamList({ members, onEdit, onDelete, onResendInvite, onQuickRoleChange }: TeamListProps) {
  const [categories, setCategories] = useState<{ id: string; name: string; color: string }[]>([]);

  useEffect(() => {
    supabase.from('user_categories').select('id, name, color').then(({ data }) => {
      if (data) setCategories(data);
    });
  }, []);
  
  const getRoleBadge = (role: TeamMemberRole) => {
    const normalized = String(role || '').toUpperCase();
    switch (normalized) {
      case 'ADMIN':
      case 'MASTER':
        return { label: 'Administrador', colors: 'bg-slate-800 text-white' };
      case 'COORDINATOR':
      case 'COORDENADOR':
        return { label: 'Coordenador', colors: 'bg-blue-100 text-blue-800 border-blue-200' };
      case 'DOCTOR':
        return { label: 'Médico(a)', colors: 'bg-emerald-100 text-emerald-800 border-emerald-200' };
      case 'NURSE':
        return { label: 'Enfermeiro(a)', colors: 'bg-teal-100 text-teal-800 border-teal-200' };
      case 'SOCIAL_WORKER':
        return { label: 'Assistente Social', colors: 'bg-orange-100 text-orange-800 border-orange-200' };
      case 'VOLUNTEER':
      case 'VOLUNTARIO':
        return { label: 'Voluntário(a)', colors: 'bg-purple-100 text-purple-800 border-purple-200' };
      case 'OBSERVER':
        return { label: 'Observador(a)', colors: 'bg-indigo-100 text-indigo-800 border-indigo-200' };
      case 'SPONSOR':
      case 'PADRINHO':
        return { label: 'Padrinho (Site)', colors: 'bg-amber-100 text-amber-800 border-amber-200' };
      case 'MANTENEDOR':
        return { label: 'Mantenedor (Site)', colors: 'bg-emerald-100 text-emerald-800 border-emerald-200' };
      case 'USER':
        return { label: 'Conta do Site', colors: 'bg-sky-100 text-sky-800 border-sky-200' };
      default:
        return { label: role, colors: 'bg-slate-100 text-slate-800 border-slate-200' };
    }
  };

  const getStatusBadge = (status: TeamMemberStatus) => {
    switch (status) {
      case 'active':
        return <span className="inline-flex items-center justify-center px-2.5 py-1 text-xs font-medium rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">Ativo</span>;
      case 'inactive':
        return <span className="inline-flex items-center justify-center px-2.5 py-1 text-xs font-medium rounded-full bg-rose-50 text-rose-700 border border-rose-200">Inativo</span>;
      case 'on_leave':
        return <span className="inline-flex items-center justify-center px-2.5 py-1 text-xs font-medium rounded-full bg-amber-50 text-amber-700 border border-amber-200">Em Licença</span>;
      default:
        return <span className="text-slate-500">-</span>;
    }
  };

  return (
    <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 text-sm">
              <th className="font-medium p-4 pl-6">Nome</th>
              <th className="font-medium p-4">Contato</th>
              <th className="font-medium p-4">Cargo / Função</th>
              <th className="font-medium p-4">Departamento</th>
              <th className="font-medium p-4">Entrada</th>
              <th className="font-medium p-4">Status</th>
              <th className="font-medium p-4 pr-6 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {members.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-8 text-center text-slate-500">
                  Nenhum membro encontrado.
                </td>
              </tr>
            ) : (
              members.map(member => {
                const roleBadge = getRoleBadge(member.role);

                return (
                  <tr key={member.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-4 pl-6">
                      <div className="flex items-center gap-3">
                        <div>
                          <div className="font-medium text-slate-900">{member.name}</div>
                          {member.category_id && (
                            <div className="flex items-center gap-1 mt-0.5">
                              {(() => {
                                const cat = categories.find(c => c.id === member.category_id);
                                return cat ? (
                                  <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold text-white uppercase tracking-wider ${cat.color}`}>
                                    {cat.name}
                                  </span>
                                ) : null;
                              })()}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-slate-500 text-sm space-y-1">
                      <div className="flex items-center gap-1.5">
                        <Mail size={14} className="text-slate-400" />
                        <a href={`mailto:${member.email}`} className="hover:text-blue-600 hover:underline transition-colors">{member.email}</a>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Phone size={14} className="text-slate-400" />
                        {member.phone && member.phone !== '-' ? (
                          <a 
                            href={`https://wa.me/${member.phone.replace(/\\D/g, '')}`} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="hover:text-emerald-600 hover:underline transition-colors"
                          >
                            {member.phone}
                          </a>
                        ) : (
                          <span>-</span>
                        )}
                      </div>
                    </td>
                    <td className="p-4">
                      {(['SPONSOR', 'MANTENEDOR', 'USER'].includes(String(member.role || '').toUpperCase()) && onQuickRoleChange) ? (
                        <select
                          value={String(member.role || 'USER').toUpperCase()}
                          onChange={(e) => onQuickRoleChange(member, e.target.value as TeamMemberRole)}
                          className={`px-2.5 py-1 rounded-md text-xs font-semibold border cursor-pointer focus:outline-none focus:ring-2 focus:ring-amber-400/40 ${roleBadge.colors}`}
                          title="Alterar classificação entre Padrinho e Mantenedor"
                        >
                          <option value="SPONSOR">Padrinho</option>
                          <option value="MANTENEDOR">Mantenedor</option>
                          <option value="USER">Conta do Site (Sem tipo)</option>
                        </select>
                      ) : (
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium border ${roleBadge.colors}`}>
                          {roleBadge.label}
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-slate-600 text-sm">
                      {member.department || '-'}
                    </td>
                    <td className="p-4 text-slate-600 text-sm">
                      {new Date(member.join_date + 'T00:00:00').toLocaleDateString('pt-BR')}
                    </td>
                    <td className="p-4 pr-6">
                      <div className="flex items-center justify-between gap-4">
                        {getStatusBadge(member.status)}
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={() => onResendInvite?.(member)}
                            className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all active:scale-95"
                            title="Reenviar E-mail de Convite"
                          >
                            <Send size={16} />
                          </button>
                          <button 
                            onClick={() => onEdit?.(member)}
                            className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all active:scale-95"
                            title="Editar Usuário"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button 
                            onClick={() => onDelete?.(member.id)}
                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all active:scale-95"
                            title="Excluir Usuário"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
