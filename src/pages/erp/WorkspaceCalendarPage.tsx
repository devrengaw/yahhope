import React from 'react';
import { Calendar } from 'lucide-react';
import { WorkspaceCalendarView } from '../../components/workspace/WorkspaceCalendarView';

export function WorkspaceCalendarPage() {
  return (
    <div className="flex-1 bg-white h-full flex flex-col">
      <div className="p-6 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white/80 backdrop-blur-md z-10">
        <h1 className="text-2xl font-black text-slate-800 flex items-center gap-3">
          <Calendar className="text-blue-600" size={28} /> Agenda Geral
        </h1>
      </div>

      <div className="flex-1 overflow-auto bg-slate-50 relative">
        <WorkspaceCalendarView />
      </div>
    </div>
  );
}
