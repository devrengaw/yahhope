import React from 'react';
import { useClickUp } from '../../contexts/ClickUpContext';
import { Share2, Settings, Users, Star, Lock, Layout, List, Kanban, Calendar, Bell } from 'lucide-react';
import { cn } from '../../lib/utils';

interface TopNavProps {
  activeView: 'list' | 'board' | 'calendar';
  setActiveView: (view: 'list' | 'board' | 'calendar') => void;
}

export function WorkspaceTopNav({ activeView, setActiveView }: TopNavProps) {
  const { spaces, lists, activeSpace, activeList } = useClickUp();

  const currentSpace = spaces.find(s => s.id === activeSpace);
  const currentList = lists.find(l => l.id === activeList);

  return (
    <div className="flex flex-col border-b border-slate-200 bg-white">
      {/* Top Row: Breadcrumbs and Global Actions */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-slate-100">
        <div className="flex items-center gap-3">
          {currentSpace && (
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded text-white flex items-center justify-center text-[10px] font-bold" style={{ backgroundColor: currentSpace.color }}>
                {currentSpace.name.charAt(0)}
              </div>
              <span className="font-bold text-slate-800 text-lg uppercase tracking-tight">{currentSpace.name}</span>
              <Lock size={14} className="text-slate-400" />
            </div>
          )}
          
          {currentList && (
            <>
              <span className="text-slate-300">/</span>
              <span className="font-medium text-slate-600 flex items-center gap-2">
                <span style={{ color: currentList.color }}>#</span>
                {currentList.name}
              </span>
              <Star size={14} className="text-slate-300 cursor-pointer hover:text-amber-400 transition-colors" />
            </>
          )}
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <Users size={16} /> <span className="font-medium">Equipe</span>
            <span className="bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded text-[10px] font-bold">4</span>
          </div>
          <button className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-800 transition-colors">
            <Share2 size={16} /> Compartilhar
          </button>
          <div className="w-px h-4 bg-slate-200"></div>
          <button className="relative p-1.5 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors">
            <Bell size={18} />
            <span className="absolute top-1 right-1 w-2 h-2 bg-rose-500 rounded-full border border-white"></span>
          </button>
        </div>
      </div>

      {/* Bottom Row: Views Tabs */}
      <div className="flex items-center px-6 pt-2">
        <div className="flex gap-1 border-b-2 border-transparent">
          <button 
            onClick={() => setActiveView('list')}
            className={cn(
              "flex items-center gap-2 px-4 py-2 border-b-2 font-medium text-sm transition-all",
              activeView === 'list' ? "border-blue-600 text-blue-600" : "border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50 rounded-t-lg"
            )}
          >
            <List size={16} /> Lista
          </button>
          <button 
            onClick={() => setActiveView('board')}
            className={cn(
              "flex items-center gap-2 px-4 py-2 border-b-2 font-medium text-sm transition-all",
              activeView === 'board' ? "border-blue-600 text-blue-600" : "border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50 rounded-t-lg"
            )}
          >
            <Kanban size={16} /> Quadro
          </button>
          <button 
            onClick={() => setActiveView('calendar')}
            className={cn(
              "flex items-center gap-2 px-4 py-2 border-b-2 font-medium text-sm transition-all",
              activeView === 'calendar' ? "border-blue-600 text-blue-600" : "border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50 rounded-t-lg"
            )}
          >
            <Calendar size={16} /> Calendário
          </button>
          <button className="flex items-center gap-2 px-4 py-2 font-medium text-sm text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-t-lg transition-all">
            <Plus size={16} /> Visualização
          </button>
        </div>
      </div>
    </div>
  );
}
