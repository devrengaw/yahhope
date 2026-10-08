import React, { useState } from 'react';
import { NavLink, Link, useLocation, useNavigate } from 'react-router-dom';
import { useClickUp, CU_Space } from '../../contexts/ClickUpContext';
import { useConfirm } from '../../contexts/ConfirmContext';
import { useAuth } from '../../contexts/AuthContext';
import { 
  Home, CheckSquare, Inbox, Search, Plus, 
  ChevronRight, ChevronDown, MoreHorizontal, 
  Hash, Link2, Star, Briefcase, Calendar, Users, X, LogOut, Heart
} from 'lucide-react';
import { cn } from '../../lib/utils';

interface WorkspaceSidebarProps {
  isMobileOpen?: boolean;
  onClose?: () => void;
}

export function WorkspaceSidebar({ isMobileOpen = false, onClose }: WorkspaceSidebarProps = {}) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { 
    spaces, lists, channels, addChannel, 
    activeSpace, activeList, setActiveSpace, setActiveList, 
    addSpace, deleteSpace, updateSpace, addList, deleteList, updateList,
    systemUsers 
  } = useClickUp();
  const { confirm } = useConfirm();
  const [expandedSpaces, setExpandedSpaces] = useState<Record<string, boolean>>({ 's1': true });
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  
  const [newListSpaceId, setNewListSpaceId] = useState<string | null>(null);
  const [newListName, setNewListName] = useState('');
  
  const location = useLocation();

  const toggleSpace = (id: string) => {
    setExpandedSpaces(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleSelectSpace = (space: CU_Space) => {
    // Open/expand the space
    setExpandedSpaces(prev => ({ ...prev, [space.id]: true }));
    setActiveSpace(space.id);

    // Pick first list in space or clear if none
    const spaceLists = lists.filter(l => l.space_id === space.id);
    if (spaceLists.length > 0) {
      if (!spaceLists.some(l => l.id === activeList)) {
        setActiveList(spaceLists[0].id);
      }
    } else {
      setActiveList(null);
    }

    if (location.pathname !== '/workspace') {
      navigate('/workspace');
    }

    onClose?.();
  };

  const handleSelectList = (spaceId: string, listId: string) => {
    setExpandedSpaces(prev => ({ ...prev, [spaceId]: true }));
    setActiveSpace(spaceId);
    setActiveList(listId);

    if (location.pathname !== '/workspace') {
      navigate('/workspace');
    }

    onClose?.();
  };

  return (
    <div className={cn(
      "w-[260px] max-w-[85vw] bg-[#EBBF6E] flex flex-col h-full border-r border-[#EBBF6E] shrink-0 text-white transition-transform duration-300 min-h-0",
      "fixed inset-y-0 left-0 z-50 md:relative md:translate-x-0",
      isMobileOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full md:translate-x-0"
    )}>
      {/* Top Header */}
      <div className="p-4 flex items-center justify-between border-b border-white/20 hover:bg-white/10 transition-colors shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-white/20 rounded-lg text-white flex items-center justify-center font-black">
            YH
          </div>
          <div>
            <h2 className="font-bold text-sm text-white leading-tight">YAH Hope Workspace</h2>
            <p className="text-[10px] text-white/70 font-medium">Plano Premium</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {onClose && (
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-white/20 text-white md:hidden cursor-pointer"
              aria-label="Fechar menu lateral"
            >
              <X size={18} />
            </button>
          )}
          <ChevronDown size={16} className="text-white/70 hidden md:block" />
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden">
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
                if (name && name.trim()) {
                  addChannel(name.trim().toLowerCase().replace(/\s+/g, '-'));
                }
              }}
              className="w-5 h-5 flex items-center justify-center rounded hover:bg-white/10 text-white/70 transition-colors cursor-pointer"
              title="Criar novo canal"
            >
              <Plus size={14} />
            </button>
          </div>
          {Array.from(new Map(channels.map(c => [c.name.toLowerCase().trim(), c])).values()).map(channel => (
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
          <div className="space-y-0.5">
            {systemUsers
              .filter(u => {
                if (!u) return false;
                if (user?.id && u.id === user.id) return false;
                if (user?.email && u.email && u.email.toLowerCase().trim() === user.email.toLowerCase().trim()) return false;
                return true;
              })
              .map(member => (
                <NavLink
                  key={member.id}
                  to={`/workspace/dm/${member.id}`}
                  className={({ isActive }) => cn(
                    "w-full flex items-center gap-2.5 px-2 py-1.5 rounded-lg text-sm transition-all duration-300 group",
                    isActive ? "bg-black/10 font-bold" : "text-white hover:bg-white/10 font-medium"
                  )}
                >
                  <div className="relative shrink-0">
                    <img 
                      src={member.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(member.name)}&background=random`} 
                      alt={member.name}
                      className="w-5 h-5 rounded-full object-cover" 
                    />
                    <span className="absolute bottom-0 right-0 w-1.5 h-1.5 bg-emerald-400 rounded-full ring-1 ring-white" />
                  </div>
                  <span className="text-xs truncate">{member.name}</span>
                </NavLink>
              ))}

            {systemUsers.filter(u => {
              if (!u) return false;
              if (user?.id && u.id === user.id) return false;
              if (user?.email && u.email && u.email.toLowerCase().trim() === user.email.toLowerCase().trim()) return false;
              return true;
            }).length === 0 && (
              <div className="px-2 text-xs italic text-white/60">
                Nenhum outro usuário cadastrado
              </div>
            )}
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
              <Briefcase size={16} className="text-white/70" /> Projetos & Módulos
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
            <h3 className="text-[10px] font-black text-white/60 uppercase tracking-widest cursor-pointer hover:text-white">Espaços & Módulos</h3>
            <button 
              onClick={() => {
                const name = window.prompt('Nome do novo Espaço / Módulo:');
                if (name) addSpace(name, '#3b82f6', 'layout');
              }}
              className="w-5 h-5 flex items-center justify-center rounded hover:bg-white/10 text-white/70 transition-colors cursor-pointer"
              title="Adicionar Espaço"
            >
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
                    onClick={() => handleSelectSpace(space)}
                    className={cn(
                      "flex items-center justify-between px-2 py-1.5 rounded-lg cursor-pointer transition-colors group",
                      activeSpace === space.id && location.pathname === '/workspace' ? "bg-black/15 font-bold" : "hover:bg-white/10"
                    )}
                  >
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <div 
                        onClick={(e) => { 
                          e.stopPropagation(); 
                          toggleSpace(space.id); 
                        }} 
                        className="w-4 h-4 flex items-center justify-center hover:bg-white/20 rounded text-white/70 shrink-0 cursor-pointer"
                        title={isExpanded ? "Recolher listas" : "Expandir listas"}
                      >
                        {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                      </div>
                      <div 
                        className="w-4 h-4 rounded text-white flex items-center justify-center text-[10px] font-bold shrink-0" 
                        style={{ backgroundColor: space.color || '#3b82f6' }}
                      >
                        {space.name.charAt(0)}
                      </div>
                      <span className={cn(
                        "text-sm truncate", 
                        activeSpace === space.id && location.pathname === '/workspace' ? "font-bold text-white" : "font-medium text-white/90"
                      )}>
                        {space.name}
                      </span>
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
                              onClick={async (e) => {
                                e.stopPropagation();
                                setOpenMenu(null);
                                if (await confirm(`Tem certeza que deseja excluir o espaço "${space.name}"?`)) {
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
                          onClick={() => handleSelectList(space.id, list.id)}
                          className={cn(
                            "flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-pointer transition-colors group",
                            activeList === list.id && location.pathname === '/workspace' ? "bg-white/20 text-white font-bold shadow-xs" : "text-white/80 hover:bg-white/10 font-medium"
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
                                    onClick={async (e) => {
                                      e.stopPropagation();
                                      setOpenMenu(null);
                                      if (await confirm(`Tem certeza que deseja excluir a lista "${list.name}"?`)) {
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
                                if (location.pathname !== '/workspace') {
                                  navigate('/workspace');
                                }
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
              if (name && name.trim()) {
                addSpace(name.trim(), '#3b82f6', 'layout');
                if (location.pathname !== '/workspace') {
                  navigate('/workspace');
                }
              }
            }}
            className="w-full mt-2 flex items-center gap-2 px-2 py-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors text-sm font-medium cursor-pointer"
          >
            <Plus size={14} /> Novo Espaço
          </button>
        </div>
      </div>

      {/* Bottom Footer: Usuário & Logoff no Workspace */}
      <div className="p-3 border-t border-white/20 shrink-0 bg-black/15">
        {/* Link para o Portal do Mantenedor */}
        <div className="mb-2">
          <Link
            to="/portal/dashboard"
            onClick={onClose}
            className="flex items-center gap-2 p-2 rounded-xl bg-white/10 hover:bg-[#F49853] text-white text-xs font-bold transition-all shadow-xs"
          >
            <Heart size={14} fill="currentColor" className="text-orange-300" />
            <span>Portal do Mantenedor</span>
          </Link>
        </div>

        <div className="flex items-center justify-between gap-2">
          <NavLink 
            to="/profile" 
            onClick={onClose}
            className="flex items-center gap-2 min-w-0 flex-1 hover:opacity-90 transition-opacity"
            title="Ir para o meu perfil"
          >
            <div className="w-8 h-8 rounded-lg bg-white/20 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
              {user?.avatar_url ? (
                <img src={user.avatar_url} alt={user.name} className="w-full h-full object-cover rounded-lg" />
              ) : (
                user?.name?.charAt(0) || 'U'
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-white truncate leading-tight">{user?.name || 'Meu Perfil'}</p>
              <p className="text-[10px] text-white/70 truncate">{user?.role === 'ADMIN' ? 'Administrador' : 'Membro'}</p>
            </div>
          </NavLink>
          <button
            onClick={() => {
              logout();
              navigate('/login');
            }}
            title="Sair do Sistema (Logoff)"
            className="p-2 rounded-xl bg-white/10 hover:bg-rose-600 text-white transition-all cursor-pointer shrink-0 shadow-xs active:scale-95"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
