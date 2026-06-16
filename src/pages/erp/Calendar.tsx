import React, { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, Plus } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { CalendarSummary } from '../../components/erp/calendar/CalendarSummary';
import { CalendarView } from '../../components/erp/calendar/CalendarView';
import { CalendarEventModal } from '../../components/erp/calendar/CalendarEventModal';
import { CalendarEvent } from '../../lib/mockData';

export function Calendar() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    const { data } = await supabase.from('calendar_events').select('*');
    if (data) setEvents(data as CalendarEvent[]);
  };

  const handleSaveEvent = async (newEvent: Omit<CalendarEvent, 'id'>) => {
    const { data, error } = await supabase.from('calendar_events').insert([newEvent]).select().single();
    if (data) {
      setEvents([data, ...events]);
    } else if (error) {
      console.error(error);
      alert('Erro ao salvar evento');
    }
    setIsModalOpen(false);
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
