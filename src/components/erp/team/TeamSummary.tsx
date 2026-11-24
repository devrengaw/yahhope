import React from 'react';
import { TeamMember } from '../../../lib/mockData';
import { Users, UserCheck, UserX, Heart, Globe } from 'lucide-react';

interface TeamSummaryProps {
  members: TeamMember[];
}

export function TeamSummary({ members }: TeamSummaryProps) {
  const activeCount = members.filter(m => m.status === 'active').length;
  const accessedSupportersCount = members.filter(
    m => ['SPONSOR', 'MANTENEDOR', 'USER'].includes(String(m.role || '').toUpperCase()) && m.siteAccessStatus === 'accessed'
  ).length;
  const inactiveCount = members.filter(m => m.status === 'inactive' || m.status === 'on_leave').length;

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      {/* Total Membros */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 flex flex-col">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Users size={20} />
          </div>
          <h3 className="font-medium text-slate-700">Total Usuários</h3>
        </div>
        <p className="text-3xl font-bold text-slate-900">{members.length}</p>
      </div>

      {/* Ativos */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 flex flex-col">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <UserCheck size={20} />
          </div>
          <h3 className="font-medium text-slate-700">Ativos</h3>
        </div>
        <p className="text-3xl font-bold text-slate-900">{activeCount}</p>
      </div>

      {/* Padrinhos/Mantenedores que Acessaram o Site */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 flex flex-col">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
            <Globe size={20} />
          </div>
          <h3 className="font-medium text-slate-700">Apoiadores no Site</h3>
        </div>
        <p className="text-3xl font-bold text-slate-900">{accessedSupportersCount}</p>
        <p className="text-[11px] text-slate-400 mt-1">Padrinhos e mantenedores que já acessaram</p>
      </div>

      {/* Inativos / Licença */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 flex flex-col">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center">
            <UserX size={20} />
          </div>
          <h3 className="font-medium text-slate-700">Inativos/Licença</h3>
        </div>
        <p className="text-3xl font-bold text-slate-900">{inactiveCount}</p>
      </div>
    </div>
  );
}
