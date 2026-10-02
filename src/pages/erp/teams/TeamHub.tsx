import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTeam } from '../../../contexts/TeamContext';
import { useAuth } from '../../../contexts/AuthContext';
import { useClickUp, CU_Task } from '../../../contexts/ClickUpContext';
import { 
  ArrowLeft, Users, Calendar, Clock, 
  CheckCircle2, MessageSquare, Plus, Settings, 
  Activity, LayoutGrid, Kanban, Flag, CheckSquare
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { TeamManagementModal } from '../../../components/workspace/teams/TeamManagementModal';
import { WorkspaceTaskModal } from '../../../components/workspace/WorkspaceTaskModal';
import { cn } from '../../../lib/utils';

export function TeamHub() {
  const { teamId } = useParams<{ teamId: string }>();
  const navigate = useNavigate();
  const { teams, teamMembers, activities, loadTeamDetails } = useTeam();
  const { user } = useAuth();
  const { tasks, statuses, lists, selectedTask, setSelectedTask, moveTaskStatus } = useClickUp();
  
  const [activeTab, setActiveTab] = useState<'workload' | 'kanban'>('workload');
  const [isManageOpen, setIsManageOpen] = useState(false);

  const team = teams.find(t => t.id === teamId);
  const members = teamId ? teamMembers[teamId] || [] : [];
  
  const isAdminOrLeader = user?.role === 'ADMIN' || members.some(m => m.user_id === user?.id && (m.role === 'admin' || m.role === 'leader'));

  useEffect(() => {
    if (teamId) {
      loadTeamDetails(teamId);
    }
  }, [teamId]);

  if (!team) {
    return (
      <div className="flex-1 flex items-center justify-center bg-slate-50">
        <div className="text-slate-500">Equipe não encontrada.</div>
      </div>
    );
  }

  // Get tasks that belong to this team OR are assigned to a member of this team
  const memberUserIds = members.map(m => m.user_id);
  const relevantTasks = tasks.filter(t => 
    t.team_id === team.id || (t.assignee_id && memberUserIds.includes(t.assignee_id))
  );

  // Group tasks by member
  const tasksByMember = members.map(member => {
    const userTasks = relevantTasks.filter(t => t.assignee_id === member.user_id);
    return {
      member,
      tasks: userTasks
    };
  });

  // Team Channel slug
  const channelSlug = team.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');

  return (
    <>
      <div className="flex-1 flex flex-col h-full bg-slate-50 overflow-hidden">
        {/* Header */}
        <div className="bg-white border-b border-slate-200 px-6 sm:px-8 py-5 shrink-0">
          <button 
            onClick={() => navigate('/workspace/equipes')}
            className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 font-bold mb-3 transition-colors cursor-pointer"
          >
            <ArrowLeft size={14} /> Voltar para Equipes
          </button>
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div 
                className="w-14 h-14 rounded-2xl flex items-center justify-center text-white font-black text-xl shadow-xs"
                style={{ backgroundColor: team.color || '#3b82f6' }}
              >
                {team.name.charAt(0)}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-black text-slate-900">{team.name}</h1>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-slate-100 text-slate-600">
                    {members.length} {members.length === 1 ? 'membro' : 'membros'}
                  </span>
                </div>
                <p className="text-sm text-slate-500 mt-0.5">{team.description || 'Equipe de operações e entregas da YAH Hope.'}</p>
              </div>
            </div>
            
            <div className="flex flex-wrap items-center gap-2">
              <button 
                onClick={() => navigate(`/workspace/chat/${channelSlug}`)}
                className="px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <MessageSquare size={15} /> Chat da Equipe
              </button>

              {isAdminOrLeader && (
                <button 
                  onClick={() => setIsManageOpen(true)}
                  className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
                >
                  <Settings size={15} /> Gerenciar Membros
                </button>
              )}
            </div>
          </div>

          {/* Sub Navigation Tabs */}
          <div className="flex items-center gap-4 mt-5 border-t border-slate-100 pt-3">
            <button
              onClick={() => setActiveTab('workload')}
              className={cn(
                "pb-2 text-xs font-bold flex items-center gap-1.5 border-b-2 transition-all cursor-pointer",
                activeTab === 'workload'
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              )}
            >
              <Users size={14} /> Carga de Trabalho ("Quem faz o quê")
            </button>
            <button
              onClick={() => setActiveTab('kanban')}
              className={cn(
                "pb-2 text-xs font-bold flex items-center gap-1.5 border-b-2 transition-all cursor-pointer",
                activeTab === 'kanban'
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              )}
            >
              <Kanban size={14} /> Quadro da Equipe ({relevantTasks.length})
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-auto p-6 sm:p-8">
          {activeTab === 'workload' ? (
            <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* Member Task Cards */}
              <div className="lg:col-span-2 space-y-4">
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-xs font-black uppercase tracking-wider text-slate-500 flex items-center gap-2">
                    <Calendar size={16} className="text-blue-600" /> Tarefas Atribuídas por Membro
                  </h2>
                </div>

                {members.length === 0 ? (
                  <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center">
                    <p className="text-slate-500 mb-4">Nenhum membro nesta equipe.</p>
                    {isAdminOrLeader && (
                      <button 
                        onClick={() => setIsManageOpen(true)}
                        className="text-blue-600 font-bold text-sm hover:underline cursor-pointer"
                      >
                        Adicionar membros agora
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {tasksByMember.map(({ member, tasks: userTasks }) => (
                      <div key={member.id} className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs">
                        <div className="flex items-center justify-between mb-3 pb-3 border-b border-slate-100">
                          <div className="flex items-center gap-3">
                            <div 
                              className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white uppercase shadow-xs"
                              style={{ backgroundColor: team.color || '#3b82f6' }}
                            >
                              {member.user?.name?.charAt(0) || 'U'}
                            </div>
                            <div>
                              <h3 className="font-bold text-slate-900 text-sm">{member.user?.name || 'Membro'}</h3>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full capitalize">
                                  {member.role === 'leader' ? 'Líder' : member.role === 'admin' ? 'Admin' : 'Membro'}
                                </span>
                                <span className="text-[11px] text-slate-400">
                                  {userTasks.length} {userTasks.length === 1 ? 'tarefa ativa' : 'tarefas ativas'}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        {userTasks.length > 0 ? (
                          <div className="space-y-2">
                            {userTasks.map(task => {
                              const st = statuses.find(s => s.id === task.status_id);
                              const totalCheck = task.checklists?.length || 0;
                              const doneCheck = task.checklists?.filter(c => c.done).length || 0;

                              return (
                                <div 
                                  key={task.id} 
                                  onClick={() => setSelectedTask(task)}
                                  className="flex items-center justify-between gap-3 p-3 rounded-xl border border-slate-100 hover:border-slate-300 hover:bg-slate-50 transition-all cursor-pointer group"
                                >
                                  <div className="flex items-center gap-2.5 min-w-0">
                                    <CheckCircle2 size={16} className="text-slate-300 group-hover:text-blue-600 shrink-0" />
                                    <div className="min-w-0">
                                      <p className="text-xs font-bold text-slate-800 group-hover:text-blue-600 transition-colors truncate">
                                        {task.name}
                                      </p>
                                      <div className="flex items-center gap-3 mt-1 text-[10px] text-slate-400 font-medium">
                                        {task.due_date && (
                                          <span className="flex items-center gap-1">
                                            <Clock size={11} /> {format(new Date(task.due_date), 'dd/MM')}
                                          </span>
                                        )}
                                        {totalCheck > 0 && (
                                          <span className="flex items-center gap-1">
                                            <CheckSquare size={11} /> {doneCheck}/{totalCheck}
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  </div>

                                  {st && (
                                    <span 
                                      className="text-[10px] font-black px-2 py-0.5 rounded-md uppercase tracking-wider shrink-0"
                                      style={{ backgroundColor: `${st.color}15`, color: st.color }}
                                    >
                                      {st.name}
                                    </span>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="text-xs text-slate-400 italic py-2">
                            Nenhuma tarefa pendente atribuída a este membro.
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Sidebar: Activity & Summary */}
              <div className="space-y-6">
                <div>
                  <h2 className="text-xs font-black uppercase tracking-wider text-slate-500 flex items-center gap-2 mb-2">
                    <Activity size={16} className="text-blue-600" /> Resumo da Equipe
                  </h2>
                  <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs space-y-4">
                    <div>
                      <span className="text-xs text-slate-500 font-medium">Total de Tarefas da Equipe</span>
                      <p className="text-3xl font-black text-slate-900 mt-1">{relevantTasks.length}</p>
                    </div>

                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                      <span className="text-slate-500">Membros Ativos:</span>
                      <span className="font-bold text-slate-800">{members.length}</span>
                    </div>

                    <div className="pt-2 border-t border-slate-100">
                      <span className="text-xs text-slate-500 block mb-2 font-medium">Canais de Discussão:</span>
                      <button 
                        onClick={() => navigate(`/workspace/chat/${channelSlug}`)}
                        className="w-full text-left px-3 py-2 rounded-xl bg-slate-50 hover:bg-blue-50 text-slate-700 hover:text-blue-700 font-bold text-xs flex items-center gap-2 transition-colors cursor-pointer"
                      >
                        <MessageSquare size={14} className="text-blue-500" /> #{channelSlug}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          ) : (
            /* Kanban View of Team Tasks */
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold text-slate-500">
                  Todas as tarefas vinculadas a esta equipe e aos seus membros.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {relevantTasks.map(task => {
                  const st = statuses.find(s => s.id === task.status_id);
                  const totalCheck = task.checklists?.length || 0;
                  const doneCheck = task.checklists?.filter(c => c.done).length || 0;

                  return (
                    <div 
                      key={task.id}
                      onClick={() => setSelectedTask(task)}
                      className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs hover:shadow-md hover:border-slate-300 transition-all cursor-pointer group"
                    >
                      <div className="flex items-center justify-between mb-2">
                        {st && (
                          <span 
                            className="text-[10px] font-black px-2 py-0.5 rounded-md uppercase tracking-wider"
                            style={{ backgroundColor: `${st.color}15`, color: st.color }}
                          >
                            {st.name}
                          </span>
                        )}
                        {task.priority && (
                          <span className="text-[10px] font-bold text-slate-400 uppercase">
                            {task.priority}
                          </span>
                        )}
                      </div>

                      <h4 className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                        {task.name}
                      </h4>
                      {task.description && (
                        <p className="text-xs text-slate-500 line-clamp-2 mt-1">
                          {task.description}
                        </p>
                      )}

                      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2 text-[11px] text-slate-400">
                          {totalCheck > 0 && (
                            <span className="flex items-center gap-1 font-semibold text-slate-500">
                              <CheckSquare size={12} /> {doneCheck}/{totalCheck}
                            </span>
                          )}
                          {task.due_date && (
                            <span className="flex items-center gap-1">
                              <Clock size={12} /> {format(new Date(task.due_date), "dd/MM")}
                            </span>
                          )}
                        </div>

                        {task.assignee_user && (
                          <img 
                            src={task.assignee_user.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'} 
                            alt={task.assignee_user.name}
                            title={task.assignee_user.name}
                            className="w-6 h-6 rounded-full object-cover ring-2 ring-white"
                          />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Team Management Modal */}
        {isManageOpen && (
          <TeamManagementModal 
            initialTeam={team}
            onClose={() => setIsManageOpen(false)} 
          />
        )}
      </div>

      {/* Task Modal Drawer */}
      <WorkspaceTaskModal 
        task={selectedTask}
        onClose={() => setSelectedTask(null)}
      />
    </>
  );
}
