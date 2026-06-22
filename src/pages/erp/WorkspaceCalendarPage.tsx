import React from 'react';
import { Calendar } from 'lucide-react';
import { WorkspaceCalendarView } from '../../components/workspace/WorkspaceCalendarView';
import { useCalendar } from '../../contexts/CalendarContext';

export function WorkspaceCalendarPage() {
  const { connectGoogle, connectMicrosoft } = useCalendar();

  return (
    <div className="flex-1 bg-white h-full flex flex-col">
      <div className="p-6 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white/80 backdrop-blur-md z-10">
        <h1 className="text-2xl font-black text-slate-800 flex items-center gap-3">
          <Calendar className="text-blue-600" size={28} /> Agenda Geral
        </h1>
        <div className="flex gap-3">
          <button 
            onClick={connectGoogle}
            className="px-4 py-2 text-sm font-bold border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-600 transition-colors flex items-center gap-2"
          >
            <img src="https://www.google.com/favicon.ico" alt="Google" className="w-4 h-4" />
            Conectar Google
          </button>
          <button 
            onClick={connectMicrosoft}
            className="px-4 py-2 text-sm font-bold border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-600 transition-colors flex items-center gap-2"
          >
            <img src="https://c.s-microsoft.com/favicon.ico" alt="Microsoft" className="w-4 h-4" />
            Conectar Microsoft
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto bg-slate-50 relative">
        <WorkspaceCalendarView />
      </div>
    </div>
  );
}
