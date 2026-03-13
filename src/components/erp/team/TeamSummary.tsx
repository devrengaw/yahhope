import React from 'react';
import { TeamMember } from '../../../lib/mockData';
import { Users, UserCheck, UserX, Heart } from 'lucide-react';

interface TeamSummaryProps {
  members: TeamMember[];
}

export function TeamSummary({ members }: TeamSummaryProps) {
  const activeCount = members.filter(m => m.status === 'active').length;
  const volunteerCount = members.filter(m => m.role === 'volunteer').length;
  const inactiveCount = members.filter(m => m.status === 'inactive' || m.status === 'on_leave').length;

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      {/* Total Membros */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 flex flex-col">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Users size={20} />
          </div>
          <h3 className="font-medium text-slate-700">Total Membros</h3>
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

      {/* Voluntários */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 flex flex-col">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
            <Heart size={20} />
          </div>
          <h3 className="font-medium text-slate-700">Voluntários</h3>
        </div>
        <p className="text-3xl font-bold text-slate-900">{volunteerCount}</p>
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
