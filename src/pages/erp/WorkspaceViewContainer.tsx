import React, { useState, useEffect } from 'react';
import { WorkspaceTopNav } from '../../components/workspace/WorkspaceTopNav';
import { WorkspaceListView } from '../../components/workspace/WorkspaceListView';
import { WorkspaceBoardView } from '../../components/workspace/WorkspaceBoardView';
import { WorkspaceCalendarView } from '../../components/workspace/WorkspaceCalendarView';
import { useClickUp } from '../../contexts/ClickUpContext';
import { FolderKanban, Plus } from 'lucide-react';

export function WorkspaceViewContainer() {
  const [activeView, setActiveView] = useState<'list' | 'board' | 'calendar'>('list');
  const { spaces, lists, activeSpace, activeList, setActiveSpace, setActiveList, addList } = useClickUp();

  // If no space is active, auto-select the first one available
  useEffect(() => {
    if (!activeSpace && spaces.length > 0) {
      const firstSpace = spaces[0];
      setActiveSpace(firstSpace.id);
      const firstList = lists.find(l => l.space_id === firstSpace.id);
      if (firstList) {
        setActiveList(firstList.id);
      }
    }
  }, [activeSpace, spaces, lists, setActiveSpace, setActiveList]);

  // If a space is active, ensure activeList belongs to it
  useEffect(() => {
    if (activeSpace) {
      const spaceLists = lists.filter(l => l.space_id === activeSpace);
      if (spaceLists.length > 0) {
        const currentListBelongs = spaceLists.some(l => l.id === activeList);
        if (!activeList || !currentListBelongs) {
          setActiveList(spaceLists[0].id);
        }
      }
    }
  }, [activeSpace, activeList, lists, setActiveList]);

  const currentSpace = spaces.find(s => s.id === activeSpace);
  const currentSpaceLists = activeSpace ? lists.filter(l => l.space_id === activeSpace) : [];

  // When there are no spaces at all
  if (!activeSpace && spaces.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center bg-slate-50">
        <div className="text-center p-8 max-w-md">
          <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-500 flex items-center justify-center mx-auto mb-4 shadow-xs">
            <FolderKanban size={32} />
          </div>
          <h2 className="text-xl font-bold text-slate-700 mb-2">Bem-vindo ao Workspace</h2>
          <p className="text-slate-500 text-sm">Crie seu primeiro espaço no menu lateral para começar a gerenciar seus projetos e tarefas.</p>
        </div>
      </div>
    );
  }

  // When the active space has no lists yet
  if (activeSpace && currentSpaceLists.length === 0) {
    return (
      <div className="flex-1 flex flex-col h-full bg-white relative">
        <WorkspaceTopNav activeView={activeView} setActiveView={setActiveView} />
        
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-slate-50/50">
          <div 
            className="w-16 h-16 rounded-2xl text-white flex items-center justify-center mb-4 shadow-sm text-2xl font-bold"
            style={{ backgroundColor: currentSpace?.color || '#3b82f6' }}
          >
            {currentSpace?.name?.charAt(0) || 'E'}
          </div>
          <h3 className="text-xl font-bold text-slate-800 mb-1">
            Espaço: {currentSpace?.name || 'Sem nome'}
          </h3>
          <p className="text-sm text-slate-500 max-w-md mb-6">
            Este espaço ainda não possui nenhuma lista de tarefas. Crie sua primeira lista para organizar tarefas, leads ou entregas.
          </p>
          <button
            onClick={() => {
              const name = window.prompt('Nome da nova lista:');
              if (name && name.trim()) {
                addList(activeSpace, name.trim());
              }
            }}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl shadow-sm flex items-center gap-2 cursor-pointer transition-all"
          >
            <Plus size={16} />
            Criar Primeira Lista
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-white relative">
      <WorkspaceTopNav activeView={activeView} setActiveView={setActiveView} />
      
      <div className="flex-1 overflow-auto bg-white">
        {activeView === 'list' && <WorkspaceListView />}
        {activeView === 'board' && <WorkspaceBoardView />}
        {activeView === 'calendar' && <WorkspaceCalendarView />}
      </div>
    </div>
  );
}
