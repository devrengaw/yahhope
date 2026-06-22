import React, { useState } from 'react';
import { useClickUp } from '../../contexts/ClickUpContext';
import { useCalendar } from '../../contexts/CalendarContext';
import { format, startOfWeek, addDays, startOfMonth, endOfMonth, endOfWeek, isSameMonth, isSameDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Plus, Video, Calendar as CalendarIcon, Clock } from 'lucide-react';
import { EventModal } from './calendar/EventModal';

export function WorkspaceCalendarView() {
  const { tasks, activeList, statuses } = useClickUp();
  const { events, attendees } = useCalendar();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Consider all tasks if no active list is selected, or filter by activeList
  const listTasks = tasks.filter(t => t.due_date && (!activeList || t.list_id === activeList));
  
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);

  const dateFormat = "d";
  const rows = [];
  let days = [];
  let day = startDate;
  let formattedDate = "";

  while (day <= endDate) {
    for (let i = 0; i < 7; i++) {
      formattedDate = format(day, dateFormat);
      const cloneDay = day;
      
      // Encontrar tarefas e eventos deste dia
      const dayTasks = listTasks.filter(t => t.due_date && isSameDay(new Date(t.due_date), cloneDay));
      const dayEvents = events.filter(e => isSameDay(new Date(e.start_time), cloneDay));

      days.push(
        <div
          onClick={() => {
             // Future enhancement: pass selected date to modal
             setIsModalOpen(true);
          }}
          className={`min-h-[120px] p-2 border-r border-b border-slate-200 cursor-pointer hover:bg-slate-50/50 transition-colors ${
            !isSameMonth(day, monthStart)
              ? "bg-slate-50 text-slate-400"
              : isSameDay(day, new Date())
              ? "bg-blue-50/30 text-blue-600 font-bold"
              : "bg-white text-slate-700"
          }`}
          key={day.toString()}
        >
          <div className="flex justify-between items-start">
            <span className="text-sm">{formattedDate}</span>
          </div>
          
          <div className="mt-2 space-y-1">
            {/* Renderizar Eventos (Reuniões/Disponibilidade) */}
            {dayEvents.map(evt => {
               const isMeeting = evt.event_type === 'meeting';
               return (
                <div 
                  key={evt.id}
                  className={`px-2 py-1 text-[11px] font-medium rounded border ${isMeeting ? 'bg-purple-50 text-purple-700 border-purple-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'} truncate flex items-center gap-1`}
                  title={evt.title}
                >
                  {isMeeting ? <Video size={10} /> : <Clock size={10} />}
                  {format(new Date(evt.start_time), "HH:mm")} - {evt.title}
                </div>
               );
            })}

            {/* Renderizar Tarefas (Prazos) */}
            {dayTasks.map(task => {
              const status = statuses.find(s => s.id === task.status_id);
              return (
                <div 
                  key={task.id}
                  className="px-2 py-1 text-[11px] font-medium rounded truncate text-white shadow-sm flex items-center gap-1"
                  style={{ backgroundColor: status?.color || '#3b82f6' }}
                  title={`Tarefa: ${task.name}`}
                >
                  <CalendarIcon size={10} />
                  {task.name}
                </div>
              );
            })}
          </div>
        </div>
      );
      day = addDays(day, 1);
    }
    rows.push(
      <div className="grid grid-cols-7" key={day.toString()}>
        {days}
      </div>
    );
    days = [];
  }

  return (
    <div className="flex flex-col h-full bg-white p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-slate-800 capitalize">
          {format(currentDate, 'MMMM yyyy', { locale: ptBR })}
        </h2>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setCurrentDate(new Date())}
            className="px-4 py-2 text-sm font-medium border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-600 transition-colors"
          >
            Hoje
          </button>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-lg shadow-sm transition-colors"
          >
            <Plus size={16} /> Novo Evento
          </button>
        </div>
      </div>
      
      <div className="border border-slate-200 rounded-xl overflow-hidden flex-1 flex flex-col">
        {/* Days of week */}
        <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50">
          {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(d => (
            <div key={d} className="py-3 text-center text-xs font-bold text-slate-500 uppercase">
              {d}
            </div>
          ))}
        </div>
        {/* Calendar Grid */}
        <div className="flex-1 overflow-y-auto">
          {rows}
        </div>
      </div>

      {isModalOpen && <EventModal onClose={() => setIsModalOpen(false)} />}
    </div>
  );
}
