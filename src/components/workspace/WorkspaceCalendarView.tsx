import React from 'react';
import { useClickUp } from '../../contexts/ClickUpContext';
import { format, startOfWeek, addDays, startOfMonth, endOfMonth, endOfWeek, isSameMonth, isSameDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export function WorkspaceCalendarView() {
  const { tasks, activeList, statuses } = useClickUp();
  const [currentDate, setCurrentDate] = React.useState(new Date());

  if (!activeList) return null;

  const listTasks = tasks.filter(t => t.list_id === activeList && t.due_date);
  
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
      
      // Encontrar tarefas deste dia
      const dayTasks = listTasks.filter(t => t.due_date && isSameDay(new Date(t.due_date), cloneDay));

      days.push(
        <div
          className={`min-h-[120px] p-2 border-r border-b border-slate-200 ${
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
            {dayTasks.map(task => {
              const status = statuses.find(s => s.id === task.status_id);
              return (
                <div 
                  key={task.id}
                  className="px-2 py-1 text-xs rounded truncate text-white"
                  style={{ backgroundColor: status?.color || '#3b82f6' }}
                  title={task.name}
                >
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
        <div className="flex gap-2">
          <button 
            onClick={() => setCurrentDate(new Date())}
            className="px-4 py-2 text-sm font-medium border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-600"
          >
            Hoje
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
    </div>
  );
}
