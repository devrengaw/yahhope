import React, { useState } from 'react';
import { Calendar as CalendarIcon, Plus } from 'lucide-react';
import { CalendarSummary } from '../../components/erp/calendar/CalendarSummary';
import { CalendarView } from '../../components/erp/calendar/CalendarView';
import { CalendarEventModal } from '../../components/erp/calendar/CalendarEventModal';
import { mockCalendarEvents, CalendarEvent } from '../../lib/mockData';

export function Calendar() {
  const [events, setEvents] = useState<CalendarEvent[]>(mockCalendarEvents);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleSaveEvent = (newEvent: Omit<CalendarEvent, 'id'>) => {
    const event: CalendarEvent = {
      ...newEvent,
      id: Math.random().toString(36).substring(2, 9),
    };
    
    setEvents([event, ...events]);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <CalendarIcon className="text-blue-600" size={28} />
            Agenda
          </h1>
          <p className="text-slate-500 mt-1">Calendário de eventos e atividades</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl font-medium flex items-center gap-2 transition-colors shadow-sm"
        >
          <Plus size={20} />
          Novo Evento
        </button>
      </div>

      <CalendarSummary events={events} />

      <div className="space-y-4 pt-4">
        <h2 className="text-lg font-semibold text-slate-900 px-1">Atividades e Eventos</h2>
        <CalendarView events={events} />
      </div>

      <CalendarEventModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveEvent}
      />
    </div>
  );
}
