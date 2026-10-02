import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useClickUp } from '../../contexts/ClickUpContext';
import { useTeam } from '../../contexts/TeamContext';
import { useProjects } from '../../contexts/ProjectContext';
import { useAuth } from '../../contexts/AuthContext';
import { 
  Briefcase, FolderKanban, Plus, CheckCircle2, Clock, 
  ArrowRight, Users, LayoutGrid, List, Sparkles, Filter, 
  Layers, ExternalLink, Calendar, ShieldCheck, User
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { Project } from '../../lib/mockData';

export function WorkspaceProjects() {
  const navigate = useNavigate();
  const { spaces, lists, tasks, statuses, setActiveSpace, setActiveList, addList, addSpace } = useClickUp();
  const { teams } = useTeam();
  const { projects, addProject: addModuleProject } = useProjects();
  const { user } = useAuth();

  const [filterModule, setFilterModule] = useState<string>('all');
  const [isNewProjectModalOpen, setIsNewProjectModalOpen] = useState(false);
  const [isModuleModalOpen, setIsModuleModalOpen] = useState(false);
  
  // New ClickUp List modal state
  const [newProjectName, setNewProjectName] = useState('');
  const [selectedSpaceId, setSelectedSpaceId] = useState('');

  // New Module Project modal state
  const [newModProjName, setNewModProjName] = useState('');
  const [newModProjDesc, setNewModProjDesc] = useState('');
  const [newModProjModule, setNewModProjModule] = useState<'communication' | 'admin'>('communication');

  // ClickUp calculations
  const totalClickUpTasks = tasks.length;
  const completedClickUpTasks = tasks.filter(t => {
    const st = statuses.find(s => s.id === t.status_id);
    return st?.name.includes('CONCLU') || st?.name.includes('FINALIZ') || st?.name.includes('PUBLICADO');
  }).length;

  // Module projects calculations
  const totalModuleTasks = projects.reduce((acc, p) => acc + (p.tasks?.length || 0), 0);
  const completedModuleTasks = projects.reduce((acc, p) => {
    const count = (p.tasks || []).filter(t => {
      const isDone = t.status === 'completed' || t.status === 'done';
      const hasDoneVal = t.values && Object.values(t.values).some(v => v === 'Done' || v === 'Concluído');
      return isDone || hasDoneVal;
    }).length;
    return acc + count;
  }, 0);

  const totalAllTasks = totalClickUpTasks + totalModuleTasks;
  const completedAllTasks = completedClickUpTasks + completedModuleTasks;
  const globalProgress = totalAllTasks > 0 ? Math.round((completedAllTasks / totalAllTasks) * 100) : 0;

  // Filtered module projects
  const visibleModuleProjects = projects.filter(p => {
    if (filterModule === 'all') return true;
    if (filterModule === 'communication') return p.module === 'communication' || p.category === 'Comunicação';
    if (filterModule === 'admin') return p.module === 'admin' && p.category !== 'Comunicação';
    return false;
  });

  // Filtered ClickUp spaces
  const displayedSpaces = spaces.filter(s => {
    if (filterModule === 'all' || filterModule === 'workspace') return true;
    return s.module === filterModule || s.id === filterModule;
  });

  const handleOpenList = (spaceId: string, listId: string) => {
    setActiveSpace(spaceId);
    setActiveList(listId);
    navigate('/workspace');
  };

  const handleCreateClickUpList = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectName.trim() || !selectedSpaceId) return;
    await addList(selectedSpaceId, newProjectName.trim());
    setNewProjectName('');
    setIsNewProjectModalOpen(false);
  };

  const handleCreateModuleProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newModProjName.trim()) return;

    const newProject: Project = {
      id: `proj_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      name: newModProjName.trim(),
      description: newModProjDesc.trim(),
      status: 'planning',
      progress: 0,
      start_date: new Date().toISOString().split('T')[0],
      end_date: '',
      budget: 0,
      isPrivate: false,
      category: newModProjModule === 'communication' ? 'Comunicação' : 'Geral',
      priority: 'medium',
      invitees: user ? [user.id] : [],
      created_by: user?.id || user?.email || 'admin',
      created_by_name: user?.name || user?.email || 'Administrador',
      module: newModProjModule,
      columns: [
        { id: 'c1', name: 'Status', type: 'status', options: ['Todo', 'Working on it', 'Stuck', 'Done'] },
        { id: 'c2', name: 'Owner', type: 'people' },
        { id: 'c3', name: 'Timeline', type: 'date' },
      ],
      tasks: []
    };

    await addModuleProject(newProject);
    setNewModProjName('');
    setNewModProjDesc('');
    setIsModuleModalOpen(false);
  };

  return (
    <div className="flex-1 bg-slate-50 h-full flex flex-col p-6 sm:p-8 overflow-y-auto">
      <div className="max-w-7xl mx-auto w-full space-y-8">
        
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-blue-600 uppercase tracking-wider mb-1">
              <FolderKanban size={14} /> Organizador Integrado
            </div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">
              Projetos & Módulos
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Visão consolidada de projetos dos módulos Administrativo e Comunicação e fluxos do Workspace.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => setIsModuleModalOpen(true)}
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition-colors shadow-xs cursor-pointer"
            >
              <Briefcase size={16} /> Novo Projeto (Módulo)
            </button>
            <button
              onClick={() => {
                if (spaces[0]) setSelectedSpaceId(spaces[0].id);
                setIsNewProjectModalOpen(true);
              }}
              className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition-colors shadow-xs cursor-pointer"
            >
              <Plus size={16} /> Nova Lista Workspace
            </button>
          </div>
        </div>

        {/* Metric Cards Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Módulos & Espaços</span>
            <p className="text-2xl font-black text-slate-900 mt-1">{spaces.length + (projects.length > 0 ? 2 : 0)}</p>
            <span className="text-[11px] text-slate-500 mt-1 block">Workspace + Comunicação + Admin</span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total de Projetos</span>
            <p className="text-2xl font-black text-slate-900 mt-1">{lists.length + projects.length}</p>
            <span className="text-[11px] text-slate-500 mt-1 block">{projects.length} em módulos • {lists.length} listas</span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total de Tarefas</span>
            <p className="text-2xl font-black text-slate-900 mt-1">{totalAllTasks}</p>
            <span className="text-[11px] text-slate-500 mt-1 block">{completedAllTasks} concluídas</span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Progresso Geral</span>
            <p className="text-2xl font-black text-emerald-600 mt-1">{globalProgress}%</p>
            <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2 overflow-hidden">
              <div 
                className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${globalProgress}%` }}
              />
            </div>
          </div>
        </div>

        {/* Filter Navigation Tabs */}
        <div className="flex flex-wrap items-center gap-2 border-b border-slate-200/70 pb-4">
          <button
            onClick={() => setFilterModule('all')}
            className={cn(
              "px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer",
              filterModule === 'all'
                ? "bg-slate-900 text-white shadow-xs"
                : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
            )}
          >
            Todos ({projects.length + lists.length})
          </button>
          <button
            onClick={() => setFilterModule('communication')}
            className={cn(
              "px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer",
              filterModule === 'communication'
                ? "bg-purple-600 text-white shadow-xs"
                : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
            )}
          >
            Módulo Comunicação ({projects.filter(p => p.module === 'communication' || p.category === 'Comunicação').length})
          </button>
          <button
            onClick={() => setFilterModule('admin')}
            className={cn(
              "px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer",
              filterModule === 'admin'
                ? "bg-blue-600 text-white shadow-xs"
                : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
            )}
          >
            Módulo Administrativo ({projects.filter(p => p.module === 'admin' && p.category !== 'Comunicação').length})
          </button>
          <button
            onClick={() => setFilterModule('workspace')}
            className={cn(
              "px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer",
              filterModule === 'workspace'
                ? "bg-emerald-600 text-white shadow-xs"
                : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
            )}
          >
            Workspace Espaços ({spaces.length})
          </button>
        </div>

        {/* Section 1: Institutional Module Projects (Communication & Admin) */}
        {(filterModule === 'all' || filterModule === 'communication' || filterModule === 'admin') && (
          <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-7 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-2">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-600 flex items-center justify-center text-white font-black text-lg shadow-xs">
                  <Briefcase size={20} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-black text-slate-900">Projetos dos Módulos (Comunicação & Administrativo)</h2>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-indigo-50 text-indigo-700 border border-indigo-100">
                      {visibleModuleProjects.length} {visibleModuleProjects.length === 1 ? 'projeto' : 'projetos'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Projetos criados nos módulos operacionais integrados com o Workspace
                  </p>
                </div>
              </div>

              <button 
                onClick={() => setIsModuleModalOpen(true)}
                className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer self-start sm:self-auto"
              >
                <Plus size={14} /> Novo Projeto
              </button>
            </div>

            {visibleModuleProjects.length === 0 ? (
              <div className="text-center py-10 text-slate-400 text-sm space-y-2">
                <p className="font-semibold text-slate-600">Nenhum projeto registrado neste módulo ainda.</p>
                <p className="text-xs">Os projetos criados na Comunicação ou no Administrativo aparecerão aqui automaticamente.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {visibleModuleProjects.map(project => {
                  const isComm = project.module === 'communication' || project.category === 'Comunicação';
                  const targetUrl = isComm ? '/communication/projects' : '/admin/projects';

                  return (
                    <div 
                      key={project.id}
                      onClick={() => navigate(targetUrl)}
                      className="bg-slate-50/70 hover:bg-white rounded-2xl border border-slate-200/80 hover:border-indigo-300 hover:shadow-md p-5 transition-all duration-200 cursor-pointer flex flex-col justify-between group"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <span className={cn(
                            "px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border",
                            isComm ? "bg-purple-50 text-purple-700 border-purple-200" : "bg-blue-50 text-blue-700 border-blue-200"
                          )}>
                            {isComm ? 'Comunicação' : 'Administrativo'}
                          </span>

                          <span className={cn(
                            "px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider border",
                            project.status === 'active' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                            project.status === 'planning' ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-slate-100 text-slate-600 border-slate-200'
                          )}>
                            {project.status === 'active' ? 'Em Andamento' : project.status === 'planning' ? 'Planejamento' : 'Pausado'}
                          </span>
                        </div>

                        <h3 className="text-base font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                          {project.name}
                        </h3>

                        {project.created_by_name && (
                          <p className="text-[11px] font-semibold text-slate-400 mt-1 flex items-center gap-1">
                            <User size={12} className="text-slate-400" />
                            Criado por: <span className="text-slate-600 font-bold">{project.created_by_name}</span>
                          </p>
                        )}

                        {project.description && (
                          <p className="text-xs text-slate-500 line-clamp-2 mt-2 leading-relaxed">
                            {project.description}
                          </p>
                        )}
                      </div>

                      <div className="mt-5 pt-4 border-t border-slate-200/60 space-y-3">
                        {/* Progress */}
                        <div>
                          <div className="flex justify-between items-center text-[11px] font-bold text-slate-500 mb-1">
                            <span>Progresso</span>
                            <span className="text-slate-700">{project.progress}%</span>
                          </div>
                          <div className="w-full bg-slate-200/60 rounded-full h-1.5 overflow-hidden">
                            <div 
                              className={cn("h-full rounded-full transition-all duration-300", isComm ? "bg-purple-600" : "bg-blue-600")}
                              style={{ width: `${project.progress}%` }}
                            />
                          </div>
                        </div>

                        <div className="flex items-center justify-between text-xs pt-1">
                          <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1">
                            <Layers size={12} />
                            {(project.tasks || []).length} entregáveis
                          </span>

                          <span className={cn(
                            "text-xs font-bold flex items-center gap-1 group-hover:translate-x-0.5 transition-transform",
                            isComm ? "text-purple-600" : "text-blue-600"
                          )}>
                            Abrir no Módulo <ArrowRight size={13} />
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Section 2: Workspace Spaces & Lists Breakdown */}
        {(filterModule === 'all' || filterModule === 'workspace') && (
          <div className="space-y-8">
            {displayedSpaces.map(space => {
              const spaceLists = lists.filter(l => l.space_id === space.id);

              return (
                <div key={space.id} className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-7 shadow-xs space-y-6">
                  
                  {/* Space Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-2">
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-10 h-10 rounded-2xl flex items-center justify-center text-white font-black text-lg shadow-xs"
                        style={{ backgroundColor: space.color || '#3b82f6' }}
                      >
                        {space.name.charAt(0)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h2 className="text-xl font-black text-slate-900">{space.name}</h2>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-600">
                            {spaceLists.length} {spaceLists.length === 1 ? 'lista' : 'listas'}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5">
                          Espaço de Trabalho • Gestão de tarefas e quadros
                        </p>
                      </div>
                    </div>

                    <button 
                      onClick={() => {
                        setSelectedSpaceId(space.id);
                        setIsNewProjectModalOpen(true);
                      }}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer self-start sm:self-auto"
                    >
                      <Plus size={14} /> Adicionar Lista
                    </button>
                  </div>

                  {/* Lists Grid */}
                  {spaceLists.length === 0 ? (
                    <div className="text-center py-8 text-slate-400 text-sm italic">
                      Nenhum projeto ou lista criada neste módulo ainda.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                      {spaceLists.map(list => {
                        const listTasks = tasks.filter(t => t.list_id === list.id);
                        const listCompleted = listTasks.filter(t => {
                          const st = statuses.find(s => s.id === t.status_id);
                          return st?.name.includes('CONCLU') || st?.name.includes('FINALIZ') || st?.name.includes('PUBLICADO');
                        }).length;
                        const progress = listTasks.length > 0 ? Math.round((listCompleted / listTasks.length) * 100) : 0;

                        // Find teams involved in this list
                        const teamIds = Array.from(new Set(listTasks.map(t => t.team_id).filter(Boolean)));
                        const involvedTeams = teams.filter(tm => teamIds.includes(tm.id));

                        return (
                          <div 
                            key={list.id}
                            onClick={() => handleOpenList(space.id, list.id)}
                            className="bg-slate-50/60 hover:bg-white rounded-2xl border border-slate-200/70 hover:border-blue-300 hover:shadow-md p-5 transition-all duration-200 cursor-pointer flex flex-col justify-between group"
                          >
                            <div>
                              <div className="flex items-center justify-between mb-2">
                                <span 
                                  className="w-2.5 h-2.5 rounded-full"
                                  style={{ backgroundColor: list.color || space.color }}
                                />
                                <span className="text-[11px] font-bold text-slate-400">
                                  {listTasks.length} {listTasks.length === 1 ? 'tarefa' : 'tarefas'}
                                </span>
                              </div>

                              <h3 className="text-base font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                                {list.name}
                              </h3>

                              {list.description && (
                                <p className="text-xs text-slate-500 line-clamp-2 mt-1 leading-relaxed">
                                  {list.description}
                                </p>
                              )}
                            </div>

                            <div className="mt-5 pt-4 border-t border-slate-200/50 space-y-3">
                              {/* Progress bar */}
                              <div>
                                <div className="flex justify-between items-center text-[11px] font-bold text-slate-500 mb-1">
                                  <span>Progresso</span>
                                  <span className={progress === 100 ? "text-emerald-600" : "text-slate-700"}>
                                    {progress}% ({listCompleted}/{listTasks.length})
                                  </span>
                                </div>
                                <div className="w-full bg-slate-200/60 rounded-full h-1.5 overflow-hidden">
                                  <div 
                                    className={cn("h-full rounded-full transition-all duration-300", progress === 100 ? "bg-emerald-500" : "bg-blue-600")}
                                    style={{ width: `${progress}%` }}
                                  />
                                </div>
                              </div>

                              {/* Teams badge or open action */}
                              <div className="flex items-center justify-between text-xs">
                                <div className="flex items-center gap-1">
                                  {involvedTeams.slice(0, 2).map(tm => (
                                    <span 
                                      key={tm.id}
                                      className="text-[9px] font-bold px-1.5 py-0.5 rounded-md truncate max-w-[90px]"
                                      style={{ backgroundColor: `${tm.color}15`, color: tm.color }}
                                    >
                                      {tm.name}
                                    </span>
                                  ))}
                                </div>

                                <span className="text-xs font-bold text-blue-600 flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                                  Abrir Quadro <ArrowRight size={13} />
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                </div>
              );
            })}
          </div>
        )}

      </div>

      {/* Modal 1: Novo Projeto no Módulo (Comunicação / Administrativo) */}
      {isModuleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-6 sm:p-7 w-full max-w-md shadow-2xl border border-slate-200 space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <Briefcase size={20} className="text-indigo-600" />
                Novo Projeto no Módulo
              </h3>
            </div>
            
            <form onSubmit={handleCreateModuleProject} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Módulo de Destino:</label>
                <select
                  value={newModProjModule}
                  onChange={(e) => setNewModProjModule(e.target.value as any)}
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 focus:border-indigo-500 outline-none text-slate-800 bg-white font-semibold"
                >
                  <option value="communication">Comunicação</option>
                  <option value="admin">Administrativo</option>
                </select>
                <p className="text-[10px] text-slate-400 mt-1">
                  O projeto ficará visível no módulo selecionado e também aqui no Workspace.
                </p>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Nome do Projeto:</label>
                <input 
                  autoFocus
                  type="text"
                  placeholder="Ex: Campanha de Arrecadação 2026..."
                  value={newModProjName}
                  onChange={(e) => setNewModProjName(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 focus:border-indigo-500 outline-none text-slate-800"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Descrição (opcional):</label>
                <textarea 
                  rows={3}
                  placeholder="Objetivos e escopo do projeto..."
                  value={newModProjDesc}
                  onChange={(e) => setNewModProjDesc(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 focus:border-indigo-500 outline-none text-slate-800 resize-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button 
                  type="button" 
                  onClick={() => setIsModuleModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-500 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  disabled={!newModProjName.trim()}
                  className="px-5 py-2 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl transition-colors cursor-pointer shadow-xs"
                >
                  Salvar Projeto
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Nova Lista Workspace */}
      {isNewProjectModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl border border-slate-200 space-y-4">
            <h3 className="text-lg font-black text-slate-900">Nova Lista no Workspace</h3>
            
            <form onSubmit={handleCreateClickUpList} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-600 block mb-1">Nome da Lista:</label>
                <input 
                  autoFocus
                  type="text"
                  placeholder="Ex: Tarefas Semanais..."
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 focus:border-blue-500 outline-none text-slate-800"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600 block mb-1">Vincular ao Espaço:</label>
                <select
                  value={selectedSpaceId}
                  onChange={(e) => setSelectedSpaceId(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 focus:border-blue-500 outline-none text-slate-800 bg-white"
                >
                  {spaces.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button 
                  type="button" 
                  onClick={() => setIsNewProjectModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-500 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  disabled={!newProjectName.trim()}
                  className="px-4 py-2 text-xs font-bold bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl transition-colors cursor-pointer"
                >
                  Criar Lista
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
