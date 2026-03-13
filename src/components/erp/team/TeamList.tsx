import React from 'react';
import { TeamMember, TeamMemberRole, TeamMemberStatus, mockUserCategories } from '../../../lib/mockData';
import { Mail, Phone, Edit2, Trash2 } from 'lucide-react';

interface TeamListProps {
  members: TeamMember[];
  onEdit?: (member: TeamMember) => void;
  onDelete?: (id: string) => void;
}

export function TeamList({ members, onEdit, onDelete }: TeamListProps) {
  
  const getRoleBadge = (role: TeamMemberRole) => {
    switch (role) {
      case 'admin':
        return { label: 'Administrador', colors: 'bg-slate-800 text-white' };
      case 'coordinator':
        return { label: 'Coordenador', colors: 'bg-blue-100 text-blue-800 border-blue-200' };
      case 'doctor':
        return { label: 'Médico(a)', colors: 'bg-emerald-100 text-emerald-800 border-emerald-200' };
      case 'nurse':
        return { label: 'Enfermeiro(a)', colors: 'bg-teal-100 text-teal-800 border-teal-200' };
      case 'social_worker':
        return { label: 'Assistente Social', colors: 'bg-orange-100 text-orange-800 border-orange-200' };
      case 'volunteer':
        return { label: 'Voluntário(a)', colors: 'bg-purple-100 text-purple-800 border-purple-200' };
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
                                const cat = mockUserCategories.find(c => c.id === member.category_id);
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
                        {member.email}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Phone size={14} className="text-slate-400" />
                        {member.phone}
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium border ${roleBadge.colors}`}>
                        {roleBadge.label}
                      </span>
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
