import React from 'react';
import { CalendarEvent } from '../../../lib/mockData';
import { Calendar as CalendarIcon, Clock, CheckCircle2, AlertCircle } from 'lucide-react';

interface CalendarSummaryProps {
  events: CalendarEvent[];
}

export function CalendarSummary({ events }: CalendarSummaryProps) {
  const today = new Date().toISOString().split('T')[0];
  const todayEvents = events.filter(e => e.date === today);
  
  const upcomingEvents = events.filter(e => {
    const eventDate = new Date(e.date);
    const todayDate = new Date(today);
    return eventDate > todayDate;
  });

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Eventos Hoje */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 flex flex-col">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <CalendarIcon size={20} />
          </div>
          <h3 className="font-medium text-slate-700">Eventos Hoje</h3>
        </div>
        <p className="text-3xl font-bold text-slate-900">{todayEvents.length}</p>
      </div>

      {/* Próximos Eventos */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 flex flex-col">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Clock size={20} />
          </div>
          <h3 className="font-medium text-slate-700">Próximos Eventos</h3>
        </div>
        <p className="text-3xl font-bold text-slate-900">{upcomingEvents.length}</p>
      </div>

      {/* Tipo Administrativo */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 flex flex-col">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
            <AlertCircle size={20} />
          </div>
          <h3 className="font-medium text-slate-700">Administrativos</h3>
        </div>
        <p className="text-3xl font-bold text-slate-900">
          {events.filter(e => e.type === 'administrative').length}
        </p>
      </div>
    </div>
  );
}
