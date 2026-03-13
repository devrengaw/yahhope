import React, { useState } from 'react';
import { Users, Plus } from 'lucide-react';
import { TeamSummary } from '../../components/erp/team/TeamSummary';
import { TeamList } from '../../components/erp/team/TeamList';
import { TeamMemberModal } from '../../components/erp/team/TeamMemberModal';
import { mockTeamMembers, TeamMember } from '../../lib/mockData';

export function Team() {
  const [members, setMembers] = useState<TeamMember[]>(
    [...mockTeamMembers].sort((a, b) => new Date(b.join_date).getTime() - new Date(a.join_date).getTime())
  );
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleSaveMember = (newMember: Omit<TeamMember, 'id'>) => {
    const member: TeamMember = {
      ...newMember,
      id: Math.random().toString(36).substring(2, 9),
    };
    
    // sort by join_date descending
    const updated = [member, ...members].sort((a, b) => 
      new Date(b.join_date).getTime() - new Date(a.join_date).getTime()
    );
    
    setMembers(updated);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Users className="text-blue-600" size={28} />
            Equipe
          </h1>
          <p className="text-slate-500 mt-1">Gestão de colaboradores e voluntários</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl font-medium flex items-center gap-2 transition-colors shadow-sm"
        >
          <Plus size={20} />
          Novo Membro
        </button>
      </div>

      <TeamSummary members={members} />

      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-slate-900 px-1">Diretório da Equipe</h2>
        <TeamList members={members} />
      </div>

      <TeamMemberModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveMember}
      />
    </div>
  );
}
