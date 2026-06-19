import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useClickUp } from '../../contexts/ClickUpContext';
import { 
  Home, CheckSquare, Inbox, Search, Plus, 
  ChevronRight, ChevronDown, MoreHorizontal, 
  Hash, Link2, Star, Briefcase, Calendar
} from 'lucide-react';
import { cn } from '../../lib/utils';

export function WorkspaceSidebar() {
  const { spaces, lists, activeSpace, activeList, setActiveSpace, setActiveList } = useClickUp();
  const [expandedSpaces, setExpandedSpaces] = React.useState<Record<string, boolean>>({ 's1': true });
  const location = useLocation();

  const toggleSpace = (id: string) => {
    setExpandedSpaces(prev => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="w-[260px] bg-[#EBBF6E] flex flex-col h-full border-r border-[#EBBF6E] shrink-0 text-white">
      {/* Top Header */}
      <div className="p-4 flex items-center justify-between border-b border-white/20 cursor-pointer hover:bg-white/10 transition-colors">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-white/20 rounded-lg text-white flex items-center justify-center font-black">
            YH
          </div>
          <div>
            <h2 className="font-bold text-sm text-white leading-tight">YAH Hope Workspace</h2>
            <p className="text-[10px] text-white/70 font-medium">Plano Premium</p>
          </div>
        </div>
        <ChevronDown size={16} className="text-white/70" />
      </div>

      <div className="flex-1 overflow-y-auto overflow-x-hidden">
        {/* Meu Workspace */}
        <div className="p-3 border-b border-white/20">
          <h3 className="text-[10px] font-black text-white/60 uppercase tracking-widest px-2 mb-2">
            Meu Workspace
          </h3>
          <div className="space-y-0.5">
            <button className="w-full flex items-center gap-3 px-2 py-1.5 rounded-lg text-white hover:bg-white/10 transition-colors text-sm font-medium">
              <Home size={16} className="text-white/70" /> Início
            </button>
            <button className="w-full flex items-center justify-between px-2 py-1.5 rounded-lg text-white hover:bg-white/10 transition-colors text-sm font-medium">
              <div className="flex items-center gap-3">
                <Inbox size={16} className="text-white/70" /> Caixa de Entrada
              </div>
            </button>
            <button className="w-full flex items-center gap-3 px-2 py-1.5 rounded-lg text-white hover:bg-white/10 transition-colors text-sm font-medium">
              <CheckSquare size={16} className="text-white/70" /> Minhas Tarefas
            </button>
            <button className="w-full flex items-center gap-3 px-2 py-1.5 rounded-lg text-white hover:bg-white/10 transition-colors text-sm font-medium">
              <Search size={16} className="text-white/70" /> Pesquisar
            </button>
          </div>
        </div>

        {/* Canais */}
        <div className="p-3 border-b border-white/20">
          <div className="flex items-center justify-between px-2 mb-2 group">
            <h3 className="text-[10px] font-black text-white/60 uppercase tracking-widest cursor-pointer hover:text-white">Canais</h3>
            <button className="w-5 h-5 flex items-center justify-center rounded hover:bg-white/10 text-white/70 transition-colors">
              <Plus size={14} />
            </button>
          </div>
          <NavLink
            to="/workspace/chat/geral"
            className={({ isActive }) => cn(
              "w-full flex items-center gap-3 px-2 py-1.5 rounded-lg text-sm transition-all duration-300",
              isActive ? "bg-black/10 font-bold" : "text-white hover:bg-white/10 font-medium"
            )}
          >
            <Hash size={16} className="text-white/70" /> geral
          </NavLink>
        </div>

        {/* Mensagens Diretas */}
        <div className="p-3 border-b border-white/20">
          <h3 className="text-[10px] font-black text-white/60 uppercase tracking-widest px-2 mb-2">Mensagens Diretas</h3>
          <div className="px-2 text-xs italic text-white/60">
            Nenhuma conversa ativa
          </div>
        </div>

        {/* Organização */}
        <div className="p-3 border-b border-white/20">
          <h3 className="text-[10px] font-black text-white/60 uppercase tracking-widest px-2 mb-2">Organização</h3>
          <div className="space-y-0.5">
            <NavLink
              to="/workspace/projects"
              className={({ isActive }) => cn(
                "w-full flex items-center gap-3 px-2 py-1.5 rounded-lg text-sm transition-all duration-300",
                isActive ? "bg-black/10 font-bold" : "text-white hover:bg-white/10 font-medium"
              )}
            >
              <Briefcase size={16} className="text-white/70" /> Projetos
            </NavLink>
            <NavLink
              to="/workspace/calendar"
              className={({ isActive }) => cn(
                "w-full flex items-center gap-3 px-2 py-1.5 rounded-lg text-sm transition-all duration-300",
                isActive ? "bg-black/10 font-bold" : "text-white hover:bg-white/10 font-medium"
              )}
            >
              <Calendar size={16} className="text-white/70" /> Agenda
            </NavLink>
          </div>
        </div>

        {/* Espaços (ClickUp) */}
        <div className="p-3">
          <div className="flex items-center justify-between px-2 mb-2 group">
            <h3 className="text-[10px] font-black text-white/60 uppercase tracking-widest cursor-pointer hover:text-white">Espaços (ClickUp)</h3>
            <button className="w-5 h-5 flex items-center justify-center rounded hover:bg-white/10 text-white/70 transition-colors">
              <Plus size={14} />
            </button>
          </div>

          <div className="space-y-1">
            {spaces.map(space => {
              const isExpanded = expandedSpaces[space.id];
              const spaceLists = lists.filter(l => l.space_id === space.id);

              return (
                <div key={space.id}>
                  <div 
                    onClick={() => {
                      toggleSpace(space.id);
                      setActiveSpace(space.id);
                    }}
                    className={cn(
                      "flex items-center justify-between px-2 py-1.5 rounded-lg cursor-pointer transition-colors group",
                      activeSpace === space.id && !activeList && location.pathname === '/workspace' ? "bg-black/10 font-bold" : "hover:bg-white/10"
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <div onClick={(e) => { e.stopPropagation(); toggleSpace(space.id); }} className="w-4 h-4 flex items-center justify-center hover:bg-white/20 rounded text-white/70">
                        {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                      </div>
                      <div className="w-4 h-4 rounded text-white flex items-center justify-center text-[10px] font-bold" style={{ backgroundColor: space.color || '#3b82f6' }}>
                        {space.name.charAt(0)}
                      </div>
                      <span className={cn("text-sm truncate", activeSpace === space.id && !activeList && location.pathname === '/workspace' ? "font-bold text-white" : "font-medium text-white/90")}>{space.name}</span>
                    </div>
                    <button className="opacity-0 group-hover:opacity-100 p-1 hover:bg-white/20 rounded text-white/70">
                      <MoreHorizontal size={14} />
                    </button>
                  </div>

                  {/* Lists under Space */}
                  {isExpanded && (
                    <div className="ml-8 mt-1 space-y-0.5">
                      {spaceLists.map(list => (
                        <div 
                          key={list.id}
                          onClick={() => {
                            setActiveSpace(space.id);
                            setActiveList(list.id);
                          }}
                          className={cn(
                            "flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-pointer transition-colors group",
                            activeList === list.id && location.pathname === '/workspace' ? "bg-white/20 text-white font-bold" : "text-white/80 hover:bg-white/10 font-medium"
                          )}
                        >
                          <Hash size={14} className={activeList === list.id && location.pathname === '/workspace' ? "text-white" : "text-white/60"} />
                          <span className="text-sm truncate">
                            {list.name}
                          </span>
                        </div>
                      ))}
                      <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-pointer hover:bg-white/10 text-white/60">
                        <Plus size={14} />
                        <span className="text-xs font-medium">Adicionar Lista</span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <button className="w-full mt-2 flex items-center gap-2 px-2 py-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors text-sm font-medium">
            <Plus size={14} /> Novo Espaço
          </button>
        </div>
      </div>
    </div>
  );
}
