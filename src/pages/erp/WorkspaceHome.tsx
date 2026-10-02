import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Megaphone, LayoutDashboard, Plus, Trash2, X, 
  CheckCircle2, Clock, FolderKanban, Briefcase, 
  ArrowRight, Users, Bell, Sparkles
} from 'lucide-react';
import { useAnnouncements, Announcement } from '../../contexts/AnnouncementContext';
import { useClickUp } from '../../contexts/ClickUpContext';
import { useProjects } from '../../contexts/ProjectContext';
import { useAuth } from '../../contexts/AuthContext';
import { cn } from '../../lib/utils';

export function WorkspaceHome() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { announcements, addAnnouncement, deleteAnnouncement } = useAnnouncements();
  const { spaces, lists, tasks, statuses, setActiveSpace, setActiveList } = useClickUp();
  const { projects } = useProjects();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [noticeTitle, setNoticeTitle] = useState('');
  const [noticeContent, setNoticeContent] = useState('');
  const [noticeTeam, setNoticeTeam] = useState('Todos');

  const isSuperAdmin = user?.role === 'ADMIN' || user?.role === 'MASTER' || user?.email?.toLowerCase() === 'contato@yahhope.com';

  // Metrics
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => {
    const st = statuses.find(s => s.id === t.status_id);
    return st?.name.includes('CONCLU') || st?.name.includes('FINALIZ') || st?.name.includes('PUBLICADO');
  }).length;
  const progressPercent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const handleCreateNotice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noticeTitle.trim() || !noticeContent.trim()) return;

    await addAnnouncement({
      id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `ann_${Date.now()}`,
      title: noticeTitle.trim(),
      content: noticeContent.trim(),
      date: new Date().toISOString(),
      author: user?.name || user?.email || 'Administrador',
      targetTeam: noticeTeam
    });

    setNoticeTitle('');
    setNoticeContent('');
    setNoticeTeam('Todos');
    setIsModalOpen(false);
  };

  const handleOpenList = (spaceId: string, listId: string) => {
    setActiveSpace(spaceId);
    setActiveList(listId);
    navigate('/workspace');
  };

  return (
    <div className="flex-1 bg-slate-50 p-6 sm:p-8 overflow-auto h-full">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Início do Workspace</h1>
            <p className="text-sm text-slate-500 mt-1">
              Olá, {user?.name || user?.email || 'Colega'}! Acompanhe avisos e o andamento das atividades.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition-colors shadow-xs cursor-pointer"
            >
              <Plus size={16} /> Publicar Aviso
            </button>
          </div>
        </div>

        {/* Quick Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Espaços Ativos</span>
            <p className="text-2xl font-black text-slate-900 mt-1">{spaces.length}</p>
            <span className="text-[11px] text-slate-500 mt-1 block">Áreas de trabalho</span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Listas & Funis</span>
            <p className="text-2xl font-black text-slate-900 mt-1">{lists.length}</p>
            <span className="text-[11px] text-slate-500 mt-1 block">{projects.length} projetos em módulos</span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total de Tarefas</span>
            <p className="text-2xl font-black text-slate-900 mt-1">{totalTasks}</p>
            <span className="text-[11px] text-slate-500 mt-1 block">{completedTasks} concluídas</span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Progresso das Entregas</span>
            <p className="text-2xl font-black text-emerald-600 mt-1">{progressPercent}%</p>
            <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2 overflow-hidden">
              <div 
                className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </div>

        {/* Content Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Mural de Avisos (Real Data & Clean Empty State) */}
          <div className="lg:col-span-1 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-700 uppercase tracking-widest flex items-center gap-2">
                <Megaphone size={16} className="text-blue-600" /> Mural de Avisos
              </h2>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                {announcements.length}
              </span>
            </div>

            <div className="bg-white rounded-3xl border border-slate-200/90 p-5 shadow-xs flex flex-col justify-between min-h-[380px]">
              {announcements.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-slate-400 space-y-3">
                  <div className="w-12 h-12 bg-slate-100 text-slate-400 rounded-2xl flex items-center justify-center">
                    <Megaphone size={22} />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-slate-700">Nenhum aviso no mural</h3>
                    <p className="text-xs text-slate-400 mt-1 max-w-[220px]">
                      Novos comunicados e avisos oficiais da equipe serão exibidos aqui.
                    </p>
                  </div>
                  <button
                    onClick={() => setIsModalOpen(true)}
                    className="mt-2 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                  >
                    Publicar Primeiro Aviso
                  </button>
                </div>
              ) : (
                <div className="space-y-3 max-h-[460px] overflow-y-auto pr-1">
                  {announcements.map((notice) => (
                    <div 
                      key={notice.id} 
                      className="p-4 bg-slate-50 hover:bg-slate-100/80 rounded-2xl border border-slate-200/70 transition-all group relative"
                    >
                      {isSuperAdmin && (
                        <button 
                          onClick={() => {
                            if (confirm(`Deseja excluir o aviso "${notice.title}"?`)) {
                              deleteAnnouncement(notice.id);
                            }
                          }}
                          className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 text-slate-400 hover:text-rose-500 p-1 transition-all"
                          title="Excluir Aviso"
                        >
                          <Trash2 size={13} />
                        </button>
                      )}

                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-blue-100 text-blue-700 border border-blue-200">
                          {notice.targetTeam}
                        </span>
                        <span className="text-[10px] font-bold text-slate-400">
                          {new Date(notice.date).toLocaleDateString('pt-BR')}
                        </span>
                      </div>

                      <h3 className="font-bold text-sm text-slate-900 mb-1 leading-snug">
                        {notice.title}
                      </h3>
                      <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-wrap">
                        {notice.content}
                      </p>

                      {notice.author && (
                        <p className="text-[10px] font-semibold text-slate-400 mt-2">
                          Por: <span className="text-slate-600">{notice.author}</span>
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Workspace Visão Geral / Atividades Recentes */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-700 uppercase tracking-widest flex items-center gap-2">
                <FolderKanban size={16} className="text-blue-600" /> Acesso Rápido aos Espaços
              </h2>
              <button 
                onClick={() => navigate('/workspace/projects')}
                className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer"
              >
                Ver todos os projetos <ArrowRight size={13} />
              </button>
            </div>

            <div className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-xs space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {spaces.map(space => {
                  const spaceLists = lists.filter(l => l.space_id === space.id);
                  const spaceTasks = tasks.filter(t => spaceLists.some(l => l.id === t.list_id));
                  const spaceCompleted = spaceTasks.filter(t => {
                    const st = statuses.find(s => s.id === t.status_id);
                    return st?.name.includes('CONCLU') || st?.name.includes('FINALIZ') || st?.name.includes('PUBLICADO');
                  }).length;
                  const pct = spaceTasks.length > 0 ? Math.round((spaceCompleted / spaceTasks.length) * 100) : 0;

                  return (
                    <div 
                      key={space.id}
                      onClick={() => {
                        if (spaceLists[0]) handleOpenList(space.id, spaceLists[0].id);
                        else navigate('/workspace');
                      }}
                      className="p-4 rounded-2xl bg-slate-50/80 hover:bg-slate-100/80 border border-slate-200/70 hover:border-blue-300 transition-all cursor-pointer group flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <div 
                            className="w-8 h-8 rounded-xl flex items-center justify-center text-white font-black text-xs shadow-xs"
                            style={{ backgroundColor: space.color || '#3b82f6' }}
                          >
                            {space.name.charAt(0)}
                          </div>
                          <span className="text-[11px] font-bold text-slate-400">
                            {spaceLists.length} {spaceLists.length === 1 ? 'lista' : 'listas'}
                          </span>
                        </div>
                        <h4 className="font-bold text-sm text-slate-900 group-hover:text-blue-600 transition-colors">
                          {space.name}
                        </h4>
                      </div>

                      <div className="mt-4 pt-3 border-t border-slate-200/60 flex items-center justify-between text-xs">
                        <span className="text-[11px] text-slate-500 font-semibold">
                          {spaceCompleted}/{spaceTasks.length} tarefas ({pct}%)
                        </span>
                        <span className="text-blue-600 font-bold flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform">
                          Abrir <ArrowRight size={12} />
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Banner Informativo */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0">
                    <Sparkles size={20} />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">Workspace Integrado com os Módulos</h4>
                    <p className="text-xs text-slate-600">
                      Projetos criados em Comunicação e no Administrativo estão sincronizados em Projetos & Módulos.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => navigate('/workspace/projects')}
                  className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-colors shrink-0 shadow-xs cursor-pointer"
                >
                  Acessar
                </button>
              </div>

            </div>
          </div>

        </div>

      </div>

      {/* Modal Novo Aviso */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-6 sm:p-7 w-full max-w-md shadow-2xl border border-slate-200 space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <Megaphone size={20} className="text-blue-600" />
                Publicar no Mural de Avisos
              </h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateNotice} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Público / Equipe Alvo:</label>
                <select
                  value={noticeTeam}
                  onChange={(e) => setNoticeTeam(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 focus:border-blue-500 outline-none text-slate-800 bg-white font-semibold"
                >
                  <option value="Todos">Todos os Colaboradores</option>
                  <option value="Geral">Geral</option>
                  <option value="Comunicação">Equipe de Comunicação</option>
                  <option value="Saúde">Equipe de Saúde & Nutrição</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Título do Aviso:</label>
                <input 
                  autoFocus
                  type="text"
                  placeholder="Ex: Reunião de Alinhamento Semanal..."
                  value={noticeTitle}
                  onChange={(e) => setNoticeTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 focus:border-blue-500 outline-none text-slate-800"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Conteúdo do Aviso:</label>
                <textarea 
                  rows={4}
                  placeholder="Escreva os detalhes, orientações, horários ou recados importantes..."
                  value={noticeContent}
                  onChange={(e) => setNoticeContent(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 focus:border-blue-500 outline-none text-slate-800 resize-none"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-500 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  disabled={!noticeTitle.trim() || !noticeContent.trim()}
                  className="px-5 py-2 text-xs font-bold bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl transition-colors cursor-pointer shadow-xs"
                >
                  Publicar Aviso
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
