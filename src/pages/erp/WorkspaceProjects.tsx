import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useClickUp } from '../../contexts/ClickUpContext';
import { useTeam } from '../../contexts/TeamContext';
import { 
  Briefcase, FolderKanban, Plus, CheckCircle2, Clock, 
  ArrowRight, Users, LayoutGrid, List, Sparkles, Filter, 
  Layers, ExternalLink
} from 'lucide-react';
import { cn } from '../../lib/utils';

export function WorkspaceProjects() {
  const navigate = useNavigate();
  const { spaces, lists, tasks, statuses, setActiveSpace, setActiveList, addList, addSpace } = useClickUp();
  const { teams } = useTeam();

  const [filterModule, setFilterModule] = useState<string>('all');
  const [isNewProjectModalOpen, setIsNewProjectModalOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [selectedSpaceId, setSelectedSpaceId] = useState('');

  // Global calculations
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => {
    const st = statuses.find(s => s.id === t.status_id);
    return st?.name.includes('CONCLU') || st?.name.includes('FINALIZ') || st?.name.includes('PUBLICADO');
  }).length;
  const globalProgress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // Filter spaces
  const displayedSpaces = spaces.filter(s => {
    if (filterModule === 'all') return true;
    return s.module === filterModule || s.id === filterModule;
  });

  const handleOpenList = (spaceId: string, listId: string) => {
    setActiveSpace(spaceId);
    setActiveList(listId);
    navigate('/workspace');
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectName.trim() || !selectedSpaceId) return;
    await addList(selectedSpaceId, newProjectName.trim());
    setNewProjectName('');
    setIsNewProjectModalOpen(false);
  };

  return (
    <div className="flex-1 bg-slate-50 h-full flex flex-col p-6 sm:p-8 overflow-y-auto">
      <div className="max-w-7xl mx-auto w-full space-y-8">
        
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-blue-600 uppercase tracking-wider mb-1">
              <FolderKanban size={14} /> Organizador Geral
            </div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">
              Projetos & Módulos
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Visão consolidada de todos os módulos institucionais, fluxos de trabalho e iniciativas da YAH Hope.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                if (spaces[0]) setSelectedSpaceId(spaces[0].id);
                setIsNewProjectModalOpen(true);
              }}
              className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition-colors shadow-xs cursor-pointer"
            >
              <Plus size={16} /> Novo Projeto / Lista
            </button>
          </div>
        </div>

        {/* Metric Cards Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Módulos Ativos</span>
            <p className="text-2xl font-black text-slate-900 mt-1">{spaces.length}</p>
            <span className="text-[11px] text-slate-500 mt-1 block">Áreas integradas no workspace</span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Listas & Quadros</span>
            <p className="text-2xl font-black text-slate-900 mt-1">{lists.length}</p>
            <span className="text-[11px] text-slate-500 mt-1 block">Iniciativas e funis em andamento</span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total de Tarefas</span>
            <p className="text-2xl font-black text-slate-900 mt-1">{totalTasks}</p>
            <span className="text-[11px] text-slate-500 mt-1 block">{completedTasks} concluídas</span>
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

        {/* Modules & Spaces Breakdown */}
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
                          {spaceLists.length} {spaceLists.length === 1 ? 'projeto/lista' : 'projetos/listas'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Módulo Institucional • Gestão e acompanhamento das entregas
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

      </div>

      {/* Modal Novo Projeto / Lista */}
      {isNewProjectModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl border border-slate-200 space-y-4">
            <h3 className="text-lg font-black text-slate-900">Novo Projeto / Lista</h3>
            
            <form onSubmit={handleCreateProject} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-600 block mb-1">Nome do Projeto ou Lista:</label>
                <input 
                  autoFocus
                  type="text"
                  placeholder="Ex: Campanha Solidária 2026..."
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 focus:border-blue-500 outline-none text-slate-800"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600 block mb-1">Vincular ao Módulo / Espaço:</label>
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
                  Criar Projeto
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
