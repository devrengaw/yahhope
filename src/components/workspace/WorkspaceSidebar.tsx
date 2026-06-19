import React from 'react';
import { NavLink } from 'react-router-dom';
import { useClickUp } from '../../contexts/ClickUpContext';
import { 
  Home, CheckSquare, Inbox, Search, Plus, 
  ChevronRight, ChevronDown, MoreHorizontal, 
  Hash, Layout, Link2, Star, Folder, Users
} from 'lucide-react';
import { cn } from '../../lib/utils';

export function WorkspaceSidebar() {
  const { spaces, folders, lists, activeSpace, activeList, setActiveSpace, setActiveList } = useClickUp();
  const [expandedSpaces, setExpandedSpaces] = React.useState<Record<string, boolean>>({ 's1': true });

  const toggleSpace = (id: string) => {
    setExpandedSpaces(prev => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="w-[260px] bg-slate-50 flex flex-col h-screen border-r border-slate-200 shrink-0">
      {/* Top Header */}
      <div className="p-4 flex items-center justify-between border-b border-slate-200 cursor-pointer hover:bg-slate-100 transition-colors">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg text-white flex items-center justify-center font-black">
            YH
          </div>
          <div>
            <h2 className="font-bold text-sm text-slate-900 leading-tight">YAH Hope Workspace</h2>
            <p className="text-[10px] text-slate-500 font-medium">Plano Premium</p>
          </div>
        </div>
        <ChevronDown size={16} className="text-slate-400" />
      </div>

      <div className="flex-1 overflow-y-auto overflow-x-hidden">
        {/* Global Links */}
        <div className="p-3 border-b border-slate-200">
          <div className="space-y-0.5">
            <button className="w-full flex items-center gap-3 px-2 py-1.5 rounded-lg text-slate-700 hover:bg-slate-200 transition-colors text-sm font-medium">
              <Home size={16} className="text-slate-500" /> Início
            </button>
            <button className="w-full flex items-center justify-between px-2 py-1.5 rounded-lg text-slate-700 hover:bg-slate-200 transition-colors text-sm font-medium">
              <div className="flex items-center gap-3">
                <Inbox size={16} className="text-slate-500" /> Caixa de Entrada
              </div>
            </button>
            <button className="w-full flex items-center gap-3 px-2 py-1.5 rounded-lg text-slate-700 hover:bg-slate-200 transition-colors text-sm font-medium">
              <CheckSquare size={16} className="text-slate-500" /> Minhas Tarefas
            </button>
            <button className="w-full flex items-center gap-3 px-2 py-1.5 rounded-lg text-slate-700 hover:bg-slate-200 transition-colors text-sm font-medium">
              <Search size={16} className="text-slate-500" /> Pesquisar
            </button>
          </div>
        </div>

        {/* Favorites */}
        <div className="p-3 border-b border-slate-200">
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2 mb-2 flex justify-between items-center group cursor-pointer">
            Favoritos <Plus size={12} className="opacity-0 group-hover:opacity-100" />
          </h3>
          <button className="w-full flex items-center gap-3 px-2 py-1.5 rounded-lg text-slate-700 hover:bg-slate-200 transition-colors text-sm font-medium">
            <Link2 size={16} className="text-slate-400" /> Links
          </button>
        </div>

        {/* Spaces */}
        <div className="p-3">
          <div className="flex items-center justify-between px-2 mb-2 group">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest cursor-pointer hover:text-slate-600">Espaços</h3>
            <button className="w-5 h-5 flex items-center justify-center rounded hover:bg-slate-200 text-slate-400 transition-colors">
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
                      activeSpace === space.id && !activeList ? "bg-slate-200" : "hover:bg-slate-200"
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <div onClick={(e) => { e.stopPropagation(); toggleSpace(space.id); }} className="w-4 h-4 flex items-center justify-center hover:bg-slate-300 rounded text-slate-400">
                        {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                      </div>
                      <div className="w-4 h-4 rounded text-white flex items-center justify-center text-[10px] font-bold" style={{ backgroundColor: space.color }}>
                        {space.name.charAt(0)}
                      </div>
                      <span className="text-sm font-medium text-slate-700 truncate">{space.name}</span>
                    </div>
                    <button className="opacity-0 group-hover:opacity-100 p-1 hover:bg-slate-300 rounded text-slate-400">
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
                            activeList === list.id ? "bg-slate-200 text-blue-600" : "text-slate-600 hover:bg-slate-200"
                          )}
                        >
                          <Hash size={14} className={activeList === list.id ? "text-blue-600" : "text-slate-400"} />
                          <span className={cn("text-sm truncate", activeList === list.id ? "font-bold" : "font-medium")}>
                            {list.name}
                          </span>
                        </div>
                      ))}
                      <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-pointer hover:bg-slate-200 text-slate-400">
                        <Plus size={14} />
                        <span className="text-xs font-medium">Adicionar Lista</span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <button className="w-full mt-2 flex items-center gap-2 px-2 py-1.5 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-200 transition-colors text-sm font-medium">
            <Plus size={14} /> Novo Espaço
          </button>
        </div>
      </div>
    </div>
  );
}
