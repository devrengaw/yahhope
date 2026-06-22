import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useClickUp } from '../../contexts/ClickUpContext';
import { 
  Home, CheckSquare, Inbox, Search, Plus, 
  ChevronRight, ChevronDown, MoreHorizontal, 
  Hash, Link2, Star, Briefcase, Calendar, Users
} from 'lucide-react';
import { cn } from '../../lib/utils';

export function WorkspaceSidebar() {
  const { spaces, lists, channels, addChannel, activeSpace, activeList, setActiveSpace, setActiveList, addSpace, deleteSpace, updateSpace, addList, deleteList, updateList } = useClickUp();
  const [expandedSpaces, setExpandedSpaces] = useState<Record<string, boolean>>({ 's1': true });
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  
  const [newListSpaceId, setNewListSpaceId] = useState<string | null>(null);
  const [newListName, setNewListName] = useState('');
  
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
            <NavLink 
              to="/workspace/inicio"
              className={({ isActive }) => cn(
                "w-full flex items-center gap-3 px-2 py-1.5 rounded-lg transition-colors text-sm font-medium",
                isActive ? "bg-white/20 text-white font-bold" : "text-white hover:bg-white/10"
              )}
            >
              <Home size={16} className="text-white/70" /> Início
            </NavLink>
            <NavLink 
              to="/workspace/inbox"
              className={({ isActive }) => cn(
                "w-full flex items-center justify-between px-2 py-1.5 rounded-lg transition-colors text-sm font-medium",
                isActive ? "bg-white/20 text-white font-bold" : "text-white hover:bg-white/10"
              )}
            >
              <div className="flex items-center gap-3">
                <Inbox size={16} className="text-white/70" /> Caixa de Entrada
              </div>
            </NavLink>
            <NavLink 
              to="/workspace/my-tasks"
              className={({ isActive }) => cn(
                "w-full flex items-center gap-3 px-2 py-1.5 rounded-lg transition-colors text-sm font-medium",
                isActive ? "bg-white/20 text-white font-bold" : "text-white hover:bg-white/10"
              )}
            >
              <CheckSquare size={16} className="text-white/70" /> Minhas Tarefas
            </NavLink>
            <NavLink 
              to="/workspace/search"
              className={({ isActive }) => cn(
                "w-full flex items-center gap-3 px-2 py-1.5 rounded-lg transition-colors text-sm font-medium",
                isActive ? "bg-white/20 text-white font-bold" : "text-white hover:bg-white/10"
              )}
            >
              <Search size={16} className="text-white/70" /> Pesquisar
            </NavLink>
          </div>
        </div>

        {/* Canais */}
        <div className="p-3 border-b border-white/20">
          <div className="flex items-center justify-between px-2 mb-2 group">
            <h3 className="text-[10px] font-black text-white/60 uppercase tracking-widest cursor-pointer hover:text-white">Canais</h3>
            <button 
              onClick={() => {
                const name = window.prompt('Nome do canal:');
                if (name) addChannel(name.toLowerCase().replace(/\s+/g, '-'));
              }}
              className="w-5 h-5 flex items-center justify-center rounded hover:bg-white/10 text-white/70 transition-colors"
            >
              <Plus size={14} />
            </button>
          </div>
          {channels.map(channel => (
            <NavLink
              key={channel.id}
              to={`/workspace/chat/${channel.name}`}
              className={({ isActive }) => cn(
                "w-full flex items-center gap-3 px-2 py-1.5 rounded-lg text-sm transition-all duration-300",
                isActive ? "bg-black/10 font-bold" : "text-white hover:bg-white/10 font-medium"
              )}
            >
              <Hash size={16} className="text-white/70" /> {channel.name}
            </NavLink>
          ))}
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
              to="/workspace/equipes"
              className={({ isActive }) => cn(
                "w-full flex items-center gap-3 px-2 py-1.5 rounded-lg text-sm transition-all duration-300",
                isActive ? "bg-black/10 font-bold" : "text-white hover:bg-white/10 font-medium"
              )}
            >
              <Users size={16} className="text-white/70" /> Equipes
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
                    <div className="relative flex items-center">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenMenu(openMenu === `space-${space.id}` ? null : `space-${space.id}`);
                        }}
                        className="opacity-0 group-hover:opacity-100 p-1 hover:bg-white/20 rounded text-white/70"
                      >
                        <MoreHorizontal size={14} />
                      </button>
                      
                      {openMenu === `space-${space.id}` && (
                        <>
                          <div className="fixed inset-0 z-40" onClick={(e) => { e.stopPropagation(); setOpenMenu(null); }}></div>
                          <div className="absolute right-0 top-full mt-1 w-32 bg-white rounded-lg shadow-xl z-50 py-1 border border-slate-100">
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                setOpenMenu(null);
                                const newName = window.prompt('Novo nome do Espaço:', space.name);
                                if (newName) updateSpace(space.id, { name: newName });
                              }}
                              className="w-full text-left px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50 font-medium"
                            >Editar</button>
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                setOpenMenu(null);
                                if (window.confirm(`Tem certeza que deseja excluir o espaço "${space.name}"?`)) {
                                  deleteSpace(space.id);
                                }
                              }}
                              className="w-full text-left px-3 py-1.5 text-xs text-rose-600 hover:bg-rose-50 font-bold"
                            >Excluir</button>
                          </div>
                        </>
                      )}
                    </div>
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
                          <div className="flex items-center gap-2 min-w-0 flex-1">
                            <Hash size={14} className={activeList === list.id && location.pathname === '/workspace' ? "text-white" : "text-white/60"} />
                            <span className="text-sm truncate">
                              {list.name}
                            </span>
                          </div>
                          
                          <div className="relative flex items-center">
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                setOpenMenu(openMenu === `list-${list.id}` ? null : `list-${list.id}`);
                              }}
                              className="opacity-0 group-hover:opacity-100 p-1 hover:bg-white/20 rounded text-white/70"
                            >
                              <MoreHorizontal size={14} />
                            </button>
                            
                            {openMenu === `list-${list.id}` && (
                              <>
                                <div className="fixed inset-0 z-40" onClick={(e) => { e.stopPropagation(); setOpenMenu(null); }}></div>
                                <div className="absolute right-0 top-full mt-1 w-32 bg-white rounded-lg shadow-xl z-50 py-1 border border-slate-100">
                                  <button 
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setOpenMenu(null);
                                      const newName = window.prompt('Novo nome da Lista:', list.name);
                                      if (newName) updateList(list.id, { name: newName });
                                    }}
                                    className="w-full text-left px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50 font-medium"
                                  >Editar</button>
                                  <button 
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setOpenMenu(null);
                                      if (window.confirm(`Tem certeza que deseja excluir a lista "${list.name}"?`)) {
                                        deleteList(list.id);
                                      }
                                    }}
                                    className="w-full text-left px-3 py-1.5 text-xs text-rose-600 hover:bg-rose-50 font-bold"
                                  >Excluir</button>
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                      ))}
                      {newListSpaceId === space.id ? (
                        <div className="flex items-center gap-2 px-2 py-1 bg-white/10 rounded-lg">
                          <input 
                            autoFocus
                            type="text"
                            placeholder="Nome da Lista..."
                            value={newListName}
                            onChange={(e) => setNewListName(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && newListName.trim()) {
                                addList(space.id, newListName.trim());
                                setNewListSpaceId(null);
                                setNewListName('');
                              } else if (e.key === 'Escape') {
                                setNewListSpaceId(null);
                                setNewListName('');
                              }
                            }}
                            onBlur={() => {
                              setNewListSpaceId(null);
                              setNewListName('');
                            }}
                            className="w-full bg-transparent text-sm text-white placeholder:text-white/50 outline-none"
                          />
                        </div>
                      ) : (
                        <div 
                          onClick={(e) => {
                            e.stopPropagation();
                            setNewListSpaceId(space.id);
                          }}
                          className="flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-pointer hover:bg-white/10 text-white/60"
                        >
                          <Plus size={14} />
                          <span className="text-xs font-medium">Adicionar Lista</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <button 
            onClick={() => {
              const name = window.prompt('Nome do novo Espaço:');
              if (name) addSpace(name, '#3b82f6', 'layout');
            }}
            className="w-full mt-2 flex items-center gap-2 px-2 py-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors text-sm font-medium"
          >
            <Plus size={14} /> Novo Espaço
          </button>
        </div>
      </div>
    </div>
  );
}
