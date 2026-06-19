import React, { useState } from 'react';
import { WorkspaceTopNav } from '../../components/workspace/WorkspaceTopNav';
import { WorkspaceListView } from '../../components/workspace/WorkspaceListView';
import { useClickUp } from '../../contexts/ClickUpContext';

export function WorkspaceViewContainer() {
  const [activeView, setActiveView] = useState<'list' | 'board' | 'calendar'>('list');
  const { activeSpace, activeList } = useClickUp();

  if (!activeSpace && !activeList) {
    return (
      <div className="flex-1 flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <h2 className="text-xl font-bold text-slate-700 mb-2">Bem-vindo ao Workspace</h2>
          <p className="text-slate-500">Selecione um espaço ou lista no menu lateral para começar.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-white relative">
      <WorkspaceTopNav activeView={activeView} setActiveView={setActiveView} />
      
      <div className="flex-1 overflow-auto bg-white">
        {activeView === 'list' && <WorkspaceListView />}
        {activeView === 'board' && (
          <div className="p-8 flex items-center justify-center text-slate-400 font-bold border-2 border-dashed border-slate-100 m-8 rounded-2xl h-[calc(100%-4rem)]">
            Kanban / Quadro em construção...
          </div>
        )}
        {activeView === 'calendar' && (
          <div className="p-8 flex items-center justify-center text-slate-400 font-bold border-2 border-dashed border-slate-100 m-8 rounded-2xl h-[calc(100%-4rem)]">
            Calendário em construção...
          </div>
        )}
      </div>
    </div>
  );
}
