import React, { useState } from 'react';
import { X, Layout, Plus, CheckCircle2, Circle, Clock, PlayCircle, MessageSquare, DollarSign, Users, Shield, Edit3, Save, UserPlus, Trash2, Globe, Lock } from 'lucide-react';
import { Project, ProjectTask, TaskStatus, mockTeamMembers, Priority } from '../../../lib/mockData';
import { ProjectTaskModal } from './ProjectTaskModal';
import { ProjectModal } from './ProjectModal';

interface ProjectDetailsProps {
  project: Project;
  onClose: () => void;
  onUpdateProject: (updatedProject: Project) => void;
}

export function ProjectDetails({ project, onClose, onUpdateProject }: ProjectDetailsProps) {
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<ProjectTask | null>(null);
  const [activeTab, setActiveTab] = useState<'tasks' | 'team'>('tasks');
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [notes, setNotes] = useState(project.notes || '');

  const totalCost = project.tasks.reduce((sum, task) => sum + task.cost, 0);
  const budgetProgress = (totalCost / project.budget) * 100;

  const getMemberInfo = (userId: string) => {
    return mockTeamMembers.find(m => m.id === userId);
  };

  const getMemberInitial = (userId: string) => {
    return getMemberInfo(userId)?.name.charAt(0) || '?';
  };

  const handleSaveNotes = () => {
    onUpdateProject({ ...project, notes });
    setIsEditingNotes(false);
  };

  const handleSaveTask = (task: ProjectTask) => {
    let updatedTasks: ProjectTask[];
    if (editingTask) {
      updatedTasks = project.tasks.map(t => t.id === task.id ? task : t);
    } else {
      updatedTasks = [...project.tasks, task];
    }
    
    // Update progress based on completed tasks
    const completedTasks = updatedTasks.filter(t => t.status === 'done').length;
    const newProgress = updatedTasks.length > 0 
      ? Math.round((completedTasks / updatedTasks.length) * 100) 
      : 0;

    onUpdateProject({ ...project, tasks: updatedTasks, progress: newProgress });
    setEditingTask(null);
  };

  const handleDeleteTask = (taskId: string) => {
    const updatedTasks = project.tasks.filter(t => t.id !== taskId);
    onUpdateProject({ ...project, tasks: updatedTasks });
  };

  const handleToggleSubtask = (taskId: string, subtaskId: string) => {
    const updatedTasks = project.tasks.map(t => {
      if (t.id === taskId) {
        const updatedSubs = t.subtasks.map(s => 
          s.id === subtaskId ? { ...s, completed: !s.completed } : s
        );
        return { ...t, subtasks: updatedSubs };
      }
      return t;
    });
    onUpdateProject({ ...project, tasks: updatedTasks });
  };

  const handleToggleSubtaskInvitee = (taskId: string, subtaskId: string, userId: string) => {
    const updatedTasks = project.tasks.map(t => {
      if (t.id === taskId) {
        const updatedSubs = t.subtasks.map(s => {
          if (s.id === subtaskId) {
            const invitees = s.invitees.includes(userId) 
              ? s.invitees.filter(id => id !== userId) 
              : [...s.invitees, userId];
            return { ...s, invitees };
          }
          return s;
        });
        return { ...t, subtasks: updatedSubs };
      }
      return t;
    });
    onUpdateProject({ ...project, tasks: updatedTasks });
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-3xl w-full max-w-5xl shadow-2xl h-[90vh] flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-8 duration-300">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-white sticky top-0 z-10">
          <div className="flex flex-col">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-slate-900">{project.name}</h1>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                project.priority === 'high' ? 'bg-rose-100 text-rose-700' : 
                project.priority === 'medium' ? 'bg-amber-100 text-amber-700' : 
                'bg-emerald-100 text-emerald-700'
              }`}>
                {project.priority === 'high' ? 'Alta' : project.priority === 'medium' ? 'Média' : 'Baixa'}
              </span>
              <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px] font-bold uppercase tracking-wider">
                {project.category}
              </span>
            </div>
            <div className="flex items-center gap-2 mt-1">
              <div className="flex items-center gap-1.5 text-sm text-slate-500">
                {project.isPrivate ? <Shield size={14} className="text-amber-500" /> : <Globe size={14} className="text-blue-500" />}
                <span>{project.isPrivate ? 'Projeto Privado' : 'Projeto Público'}</span>
              </div>
              <span className="text-slate-300">•</span>
              <span className="text-sm text-slate-500">ID: #{project.id}</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsProjectModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 text-slate-600 hover:bg-slate-50 rounded-xl transition-colors font-medium border border-slate-200"
            >
              <Edit3 size={18} />
              Editar Projeto
            </button>
            <button onClick={onClose} className="p-2 hover:bg-slate-50 rounded-full transition-colors text-slate-400">
              <X size={24} />
            </button>
          </div>
        </div>

        <div className="flex border-b border-slate-100 px-8 gap-8">
          <button 
            onClick={() => setActiveTab('tasks')}
            className={`py-4 text-sm font-bold transition-all border-b-2 relative ${
              activeTab === 'tasks' ? 'text-blue-600 border-blue-600' : 'text-slate-400 border-transparent hover:text-slate-600'
            }`}
          >
            Quadro de Tarefas
          </button>
          <button 
            onClick={() => setActiveTab('team')}
            className={`py-4 text-sm font-bold transition-all border-b-2 relative ${
              activeTab === 'team' ? 'text-blue-600 border-blue-600' : 'text-slate-400 border-transparent hover:text-slate-600'
            }`}
          >
            Equipe e Acesso
          </button>
        </div>

        <div className="flex-1 overflow-y-auto bg-slate-50/50">
          <div className="max-w-5xl mx-auto p-8 space-y-8">
            {activeTab === 'tasks' ? (
              <>
                <div className="grid grid-cols-3 gap-6">
                  <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">Progresso Geral</span>
                    <div className="flex items-end gap-2">
                      <span className="text-3xl font-bold text-slate-900">{project.progress}%</span>
                      <span className="text-slate-400 text-sm mb-1 font-medium">concluído</span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded-full mt-4 overflow-hidden">
                      <div className="h-full bg-blue-600 transition-all duration-500" style={{ width: `${project.progress}%` }}></div>
                    </div>
                  </div>

                  <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">Custo Atual</span>
                    <div className="flex items-end gap-2">
                      <span className="text-2xl font-bold text-emerald-600">R$ {totalCost.toLocaleString('pt-BR')}</span>
                    </div>
                    <div className="flex items-center justify-between mt-4">
                      <span className="text-xs text-slate-400 font-medium">Meta: R$ {project.budget.toLocaleString('pt-BR')}</span>
                      <span className={`text-xs font-bold ${budgetProgress > 100 ? 'text-rose-500' : 'text-emerald-500'}`}>
                        {budgetProgress.toFixed(1)}%
                      </span>
                    </div>
                  </div>

                  <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">Prazo Final</span>
                    <div className="flex items-center gap-2 text-slate-900 font-bold text-lg">
                      <Clock size={20} className="text-blue-500" />
                      {new Date(project.end_date).toLocaleDateString('pt-BR')}
                    </div>
                    <div className="mt-4 text-xs text-slate-400 font-medium">
                      Iniciado em {new Date(project.start_date).toLocaleDateString('pt-BR')}
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                  <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50/50">
                    <div className="flex items-center gap-2 text-slate-900 font-bold">
                      <MessageSquare size={18} className="text-blue-500" />
                      Observações e Detalhes
                    </div>
                    {isEditingNotes ? (
                      <button onClick={handleSaveNotes} className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 hover:text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg">
                        <Save size={14} /> Salvar Notas
                      </button>
                    ) : (
                      <button onClick={() => setIsEditingNotes(true)} className="flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-700 bg-blue-50 px-3 py-1.5 rounded-lg">
                        <Edit3 size={14} /> Editar
                      </button>
                    )}
                  </div>
                  <div className="p-6">
                    {isEditingNotes ? (
                      <textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        className="w-full h-40 border border-slate-200 rounded-xl p-4 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all resize-none text-slate-600 leading-relaxed"
                        placeholder="Adicione informações relevantes sobre o projeto..."
                      />
                    ) : (
                      <div className="text-slate-600 whitespace-pre-wrap leading-relaxed min-h-[100px]">
                        {notes || <span className="text-slate-400 italic">Nenhuma observação adicionada ainda.</span>}
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-slate-900 font-bold">
                      <Layout size={20} className="text-blue-500" />
                      Tarefas do Projeto
                    </div>
                    <button 
                      onClick={() => { setEditingTask(null); setIsTaskModalOpen(true); }}
                      className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-xl hover:bg-blue-700 transition-all shadow-sm text-sm font-bold"
                    >
                      <Plus size={18} /> Nova Tarefa
                    </button>
                  </div>

                  <div className="space-y-4">
                    {project.tasks.map(task => (
                      <div key={task.id} className="bg-white rounded-2xl border border-slate-200 hover:border-blue-200 transition-all shadow-sm overflow-hidden group">
                        <div className="p-5 flex items-start justify-between">
                          <div className="flex items-start gap-4 flex-1">
                            <div className={`mt-1 p-2 rounded-xl ${
                              task.status === 'done' ? 'bg-emerald-50 text-emerald-600' :
                              task.status === 'in-progress' ? 'bg-blue-50 text-blue-600' :
                              task.status === 'review' ? 'bg-amber-50 text-amber-600' :
                              'bg-slate-50 text-slate-400'
                            }`}>
                              {task.status === 'done' ? <CheckCircle2 size={24} /> :
                               task.status === 'in-progress' ? <PlayCircle size={24} /> :
                               task.status === 'review' ? <Clock size={24} /> :
                               <Circle size={24} />}
                            </div>
                            <div className="flex-1 pr-8">
                              <div className="flex items-center gap-3">
                                <h3 className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors uppercase tracking-tight">{task.title}</h3>
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                                  task.priority === 'high' ? 'bg-rose-100 text-rose-700' : 
                                  task.priority === 'medium' ? 'bg-amber-100 text-amber-700' : 
                                  'bg-emerald-100 text-emerald-700'
                                }`}>
                                  {task.priority === 'high' ? 'Alta' : task.priority === 'medium' ? 'Média' : 'Baixa'}
                                </span>
                              </div>
                              <p className="text-sm text-slate-500 mt-1 line-clamp-2 leading-relaxed">{task.description}</p>
                              
                              <div className="flex items-center gap-4 mt-4">
                                <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg">
                                  <DollarSign size={14} />
                                  {task.cost.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                </div>
                                <div className="flex -space-x-2">
                                  {task.invitees.map(userId => (
                                    <div key={userId} title={getMemberInfo(userId)?.name} className="w-8 h-8 rounded-full border-2 border-white bg-blue-100 flex items-center justify-center text-[10px] font-bold text-blue-600">
                                      {getMemberInitial(userId)}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="flex flex-col gap-2">
                            <button onClick={() => { setEditingTask(task); setIsTaskModalOpen(true); }} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all">
                              <Edit3 size={18} />
                            </button>
                            <button onClick={() => handleDeleteTask(task.id)} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all">
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </div>
                        
                        {task.subtasks.length > 0 && (
                          <div className="px-5 pb-5 pt-1 border-t border-slate-50 bg-slate-50/30">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
                              {task.subtasks.map(sub => (
                                <div key={sub.id} className="flex items-center justify-between bg-white p-2.5 rounded-xl border border-slate-100 group/sub shadow-sm transition-all hover:shadow-md">
                                  <div className="flex items-center gap-3">
                                    <button onClick={() => handleToggleSubtask(task.id, sub.id)} className="text-slate-300 hover:text-blue-600 transition-colors">
                                      {sub.completed ? <CheckCircle2 size={18} className="text-emerald-500" /> : <Circle size={18} />}
                                    </button>
                                    <span className={`text-xs font-medium ${sub.completed ? 'text-slate-400 line-through' : 'text-slate-700'}`}>{sub.title}</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <div className="flex -space-x-1.5">
                                      {sub.invitees.map(userId => (
                                        <div key={userId} className="w-6 h-6 rounded-full border-2 border-white bg-slate-100 flex items-center justify-center text-[8px] font-bold text-slate-500" title={getMemberInfo(userId)?.name}>
                                          {getMemberInitial(userId)}
                                        </div>
                                      ))}
                                    </div>
                                    <button 
                                      onClick={() => handleToggleSubtaskInvitee(task.id, sub.id, '1')} 
                                      className={`p-1.5 rounded-lg transition-all ${sub.invitees.includes('1') ? 'bg-blue-50 text-blue-600' : 'text-slate-300 hover:text-blue-600'}`}
                                    >
                                      <UserPlus size={14} />
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <div className="space-y-6">
                <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm">
                  <div className="flex items-center justify-between mb-8">
                    <div>
                      <h2 className="text-xl font-bold text-slate-900">Equipe do Projeto</h2>
                      <p className="text-slate-500 text-sm mt-1">Gerencie os membros que têm acesso e visibilidade sobre este projeto.</p>
                    </div>
                    <div className="flex items-center gap-2 text-sm font-bold text-blue-600 bg-blue-50 px-4 py-2 rounded-xl">
                      <Users size={18} /> {project.invitees.length} Membros
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {mockTeamMembers.map(member => {
                      const isInvited = project.invitees.includes(member.id);
                      return (
                        <div key={member.id} className={`flex items-center justify-between p-4 rounded-2xl border-2 transition-all ${isInvited ? 'border-blue-100 bg-blue-50/50' : 'border-slate-50 bg-white hover:border-slate-200'}`}>
                          <div className="flex items-center gap-4">
                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-lg font-bold ${isInvited ? 'bg-blue-600 text-white shadow-lg' : 'bg-slate-100 text-slate-400'}`}>
                              {member.name.charAt(0)}
                            </div>
                            <div>
                              <h4 className="font-bold text-slate-900">{member.name}</h4>
                              <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">{member.role}</p>
                            </div>
                          </div>
                          <button
                            onClick={() => {
                              const newInvitees = isInvited 
                                ? project.invitees.filter(id => id !== member.id)
                                : [...project.invitees, member.id];
                              onUpdateProject({ ...project, invitees: newInvitees });
                            }}
                            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${isInvited ? 'bg-white text-rose-600 hover:bg-rose-600 hover:text-white border border-rose-100' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
                          >
                            {isInvited ? 'Remover' : 'Adicionar'}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <ProjectTaskModal 
        isOpen={isTaskModalOpen}
        onClose={() => { setIsTaskModalOpen(false); setEditingTask(null); }}
        onSave={handleSaveTask}
        initialTask={editingTask || undefined}
      />

      {isProjectModalOpen && (
        <ProjectModal 
          isOpen={isProjectModalOpen}
          onClose={() => setIsProjectModalOpen(false)}
          onSave={(updatedProject) => {
            onUpdateProject(updatedProject);
            setIsProjectModalOpen(false);
          }}
          initialProject={project}
        />
      )}
    </div>
  );
}
