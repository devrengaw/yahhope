import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTeam } from '../../../contexts/TeamContext';
import { useAuth } from '../../../contexts/AuthContext';
import { 
  ArrowLeft, Users, Calendar, Clock, 
  CheckCircle2, MessageSquare, Plus, Settings, 
  Activity, LayoutGrid 
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { TeamManagementModal } from '../../../components/workspace/teams/TeamManagementModal';
import { supabase } from '../../../lib/supabase';

export function TeamHub() {
  const { teamId } = useParams<{ teamId: string }>();
  const navigate = useNavigate();
  const { teams, teamMembers, activities, loadTeamDetails } = useTeam();
  const { user } = useAuth();
  
  const [isManageOpen, setIsManageOpen] = useState(false);
  const [teamTasks, setTeamTasks] = useState<any[]>([]);

  const team = teams.find(t => t.id === teamId);
  const members = teamId ? teamMembers[teamId] || [] : [];
  
  const isAdminOrLeader = user?.role === 'ADMIN' || members.some(m => m.user_id === user?.id && (m.role === 'admin' || m.role === 'leader'));

  useEffect(() => {
    if (teamId) {
      loadTeamDetails(teamId);
      loadTeamTasks(teamId);
    }
  }, [teamId]);

  const loadTeamTasks = async (tId: string) => {
    // In a real scenario, you'd fetch clickup_tasks joined with the assignee
    // For now, let's try to fetch if assignee_id exists, else mock
    try {
      const { data, error } = await supabase
        .from('clickup_tasks')
        .select('*, list:clickup_lists(name), status:clickup_statuses(name, color)')
        .not('assignee_id', 'is', null)
        .order('due_date', { ascending: true })
        .limit(20);
        
      if (!error && data) {
        // Filter tasks that belong to members of this team
        const memberIds = members.map(m => m.user_id);
        const filtered = data.filter(task => memberIds.includes(task.assignee_id));
        setTeamTasks(filtered);
      }
    } catch (err) {
      console.log('Using mock tasks for preview');
    }
  };

  if (!team) {
    return (
      <div className="flex-1 flex items-center justify-center bg-slate-50">
        <div className="text-slate-500">Equipe não encontrada.</div>
      </div>
    );
  }

  // Helper to group tasks by user
  const tasksByMember = members.map(member => {
    const memberTasks = teamTasks.filter(t => t.assignee_id === member.user_id);
    return {
      member,
      tasks: memberTasks
    };
  });

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-50 overflow-hidden">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-8 py-6 shrink-0">
        <button 
          onClick={() => navigate('/workspace/equipes')}
          className="flex items-center gap-2 text-slate-500 hover:text-slate-800 font-medium mb-4 transition-colors"
        >
          <ArrowLeft size={16} /> Voltar para Equipes
        </button>
        
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div 
              className="w-16 h-16 rounded-2xl flex items-center justify-center text-white font-bold text-2xl shadow-sm"
              style={{ backgroundColor: team.color || '#3b82f6' }}
            >
              {team.name.charAt(0)}
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-800">{team.name}</h1>
              <p className="text-slate-500">{team.description || 'Nenhuma descrição fornecida.'}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="flex -space-x-2 mr-4">
              {members.slice(0, 5).map(m => (
                <div 
                  key={m.id} 
                  title={m.user?.name}
                  className="w-10 h-10 rounded-full bg-slate-200 border-2 border-white flex items-center justify-center text-xs font-bold text-slate-600 uppercase"
                >
                  {m.user?.name?.charAt(0) || 'U'}
                </div>
              ))}
              {members.length > 5 && (
                <div className="w-10 h-10 rounded-full bg-slate-100 border-2 border-white flex items-center justify-center text-xs font-bold text-slate-500">
                  +{members.length - 5}
                </div>
              )}
            </div>
            
            {isAdminOrLeader && (
              <button 
                onClick={() => setIsManageOpen(true)}
                className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors shadow-sm"
              >
                <Settings size={16} /> Gerenciar
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-8">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Column: Agenda & Tasks */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <Calendar size={20} className="text-blue-600" />
                O que cada um está fazendo
              </h2>
            </div>

            {members.length === 0 ? (
              <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
                <p className="text-slate-500 mb-4">Nenhum membro nesta equipe.</p>
                {isAdminOrLeader && (
                  <button 
                    onClick={() => setIsManageOpen(true)}
                    className="text-blue-600 font-medium hover:underline"
                  >
                    Adicionar membros
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {tasksByMember.map(({ member, tasks }) => (
                  <div key={member.id} className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
                    <div className="flex items-center justify-between mb-4 pb-4 border-b border-slate-100">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-sm font-bold text-blue-700 uppercase">
                          {member.user?.name?.charAt(0) || 'U'}
                        </div>
                        <div>
                          <h3 className="font-bold text-slate-800">{member.user?.name}</h3>
                          <span className="text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full capitalize">{member.role}</span>
                        </div>
                      </div>
                      <button className="text-sm text-blue-600 font-medium hover:underline">Ver agenda</button>
                    </div>
                    
                    {tasks.length > 0 ? (
                      <div className="space-y-3">
                        {tasks.map(task => (
                          <div key={task.id} className="flex items-start gap-3 p-3 rounded-lg hover:bg-slate-50 transition-colors group">
                            <CheckCircle2 size={18} className="text-slate-300 group-hover:text-emerald-500 mt-0.5" />
                            <div className="flex-1">
                              <p className="text-sm font-medium text-slate-700 line-clamp-1">{task.name}</p>
                              <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                                {task.list?.name && <span className="flex items-center gap-1"><LayoutGrid size={12}/> {task.list.name}</span>}
                                {task.due_date && <span className="flex items-center gap-1"><Clock size={12}/> {format(new Date(task.due_date), 'dd/MM/yyyy')}</span>}
                              </div>
                            </div>
                            {task.status && (
                              <span 
                                className="text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider"
                                style={{ backgroundColor: `${task.status.color}20`, color: task.status.color }}
                              >
                                {task.status.name}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-sm text-slate-400 italic px-2">
                        Nenhuma tarefa atribuída no momento.
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Sidebar: Activity Feed */}
          <div className="space-y-6">
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <Activity size={20} className="text-blue-600" />
              Feed de Atividades
            </h2>
            
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
              {activities.length === 0 ? (
                <div className="text-center py-8 text-slate-500 text-sm">
                  Nenhuma atividade recente.
                </div>
              ) : (
                <div className="space-y-6">
                  {activities.map((act, index) => (
                    <div key={act.id} className="relative flex gap-4">
                      {/* Timeline line */}
                      {index !== activities.length - 1 && (
                        <div className="absolute top-8 bottom-[-24px] left-[15px] w-px bg-slate-200"></div>
                      )}
                      
                      <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0 z-10 text-xs font-bold text-slate-600 uppercase">
                        {act.user?.name?.charAt(0) || 'U'}
                      </div>
                      
                      <div className="flex-1 pt-1">
                        <p className="text-sm text-slate-800">
                          <span className="font-bold">{act.user?.name}</span>{' '}
                          <span className="text-slate-600">{act.action}</span>{' '}
                          <span className="font-medium text-blue-600">{act.target_name}</span>
                        </p>
                        <p className="text-xs text-slate-400 mt-1">
                          {formatDistanceToNow(new Date(act.created_at), { addSuffix: true, locale: ptBR })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          
        </div>
      </div>
      
      {isManageOpen && (
        <TeamManagementModal 
          onClose={() => setIsManageOpen(false)} 
          initialTeam={team} 
        />
      )}
    </div>
  );
}
