import React, { useState, useEffect } from 'react';
import { Users, Plus } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { TeamSummary } from '../../components/erp/team/TeamSummary';
import { TeamList } from '../../components/erp/team/TeamList';
import { TeamMemberModal } from '../../components/erp/team/TeamMemberModal';
import { TeamMember } from '../../lib/mockData'; // still using type

export function Team() {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase.from('users').select('*');
      if (error) throw error;
      if (data) {
        const mappedMembers = data.map(u => ({
          id: u.id,
          name: u.name || 'Sem Nome',
          email: u.email || '',
          role: u.role || 'USER',
          phone: u.phone || '-', 
          department: u.department || '-',
          join_date: u.created_at ? u.created_at.split('T')[0] : new Date().toISOString().split('T')[0],
          status: u.status || 'active',
          category_id: u.category_id || undefined
        })) as TeamMember[];
        
        setMembers(mappedMembers.sort((a, b) => new Date(b.join_date).getTime() - new Date(a.join_date).getTime()));
      }
    } catch (e) {
      console.error('Error fetching users:', e);
    }
  };

  const handleSaveMember = async (newMember: Omit<TeamMember, 'id'>) => {
    const member: TeamMember = {
      ...newMember,
      id: Math.random().toString(36).substring(2, 9),
    };
    
    // sort by join_date descending
    const updated = [member, ...members].sort((a, b) => 
      new Date(b.join_date).getTime() - new Date(a.join_date).getTime()
    );
    
    setMembers(updated);
    setIsModalOpen(false);

    try {
      const { error } = await supabase.functions.invoke('invite-user', {
        body: { email: member.email, name: member.name, role: member.role }
      });
      if (error) throw error;
      alert(`Um e-mail de convite foi enviado para ${member.email} com as instruções para o primeiro acesso e definição de senha.`);
      fetchUsers();
    } catch (err: any) {
      console.error('Error sending invite:', err);
      alert(`O usuário foi salvo localmente, mas houve um erro ao enviar o e-mail: ${err.message}`);
    }
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
