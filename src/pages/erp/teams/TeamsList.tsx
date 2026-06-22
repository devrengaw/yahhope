import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Plus, LayoutGrid, List } from 'lucide-react';
import { useTeam } from '../../../contexts/TeamContext';
import { useAuth } from '../../../contexts/AuthContext';
import { TeamManagementModal } from '../../../components/workspace/teams/TeamManagementModal';

export function TeamsList() {
  const navigate = useNavigate();
  const { teams, loading } = useTeam();
  const { user } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const isAdmin = user?.role === 'ADMIN';

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-auto p-8 bg-slate-50">
      <div className="max-w-6xl mx-auto space-y-8">
        
        <div className="text-center space-y-4 mb-12">
          <h1 className="text-4xl font-black text-slate-800 tracking-tight">
            Alinhe as equipes e<br />visualize o trabalho delas!
          </h1>
          <p className="text-slate-500 text-lg max-w-2xl mx-auto">
            Use a Central de Equipes para coordenar equipes, organizar prioridades e entender os detalhes do trabalho delas.
          </p>
          <div className="flex items-center justify-center gap-4 mt-6">
            {isAdmin && (
              <button 
                onClick={() => setIsModalOpen(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg font-semibold flex items-center gap-2 transition-colors"
              >
                <Plus size={18} />
                Criar equipe
              </button>
            )}
            <button className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-6 py-2.5 rounded-lg font-medium transition-colors">
              Procurar pessoas
            </button>
          </div>
        </div>

        <div>
          <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
            <Users size={20} className="text-blue-600" />
            {isAdmin ? 'Todas as equipes' : 'Minhas equipes'}
          </h2>
          
          {teams.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
              <div className="w-16 h-16 bg-slate-100 text-slate-400 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Users size={32} />
              </div>
              <h3 className="text-lg font-bold text-slate-800 mb-2">Nenhuma equipe encontrada</h3>
              <p className="text-slate-500 mb-6">Você ainda não faz parte de nenhuma equipe.</p>
              {isAdmin && (
                <button 
                  onClick={() => setIsModalOpen(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium inline-flex items-center gap-2"
                >
                  <Plus size={16} /> Criar sua primeira equipe
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {teams.map(team => (
                <div 
                  key={team.id}
                  onClick={() => navigate(`/workspace/equipes/${team.id}`)}
                  className="bg-white rounded-2xl border border-slate-200 p-6 cursor-pointer hover:shadow-lg transition-all hover:-translate-y-1 group"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div 
                      className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg"
                      style={{ backgroundColor: team.color || '#3b82f6' }}
                    >
                      {team.name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-800 group-hover:text-blue-600 transition-colors">{team.name}</h3>
                      <p className="text-xs text-slate-500">Membros e projetos</p>
                    </div>
                  </div>
                  
                  {team.description && (
                    <p className="text-sm text-slate-600 line-clamp-2 mb-4">
                      {team.description}
                    </p>
                  )}
                  
                  <div className="flex items-center justify-between mt-auto pt-4 border-t border-slate-100">
                    <div className="flex -space-x-2">
                      <div className="w-8 h-8 rounded-full bg-blue-100 border-2 border-white flex items-center justify-center text-[10px] font-bold text-blue-700">A</div>
                      <div className="w-8 h-8 rounded-full bg-rose-100 border-2 border-white flex items-center justify-center text-[10px] font-bold text-rose-700">B</div>
                      <div className="w-8 h-8 rounded-full bg-slate-100 border-2 border-white flex items-center justify-center text-[10px] font-bold text-slate-500">+</div>
                    </div>
                    <span className="text-sm font-medium text-blue-600 flex items-center gap-1 group-hover:gap-2 transition-all">
                      Acessar Hub <Users size={14} />
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {isModalOpen && (
        <TeamManagementModal onClose={() => setIsModalOpen(false)} />
      )}
    </div>
  );
}
