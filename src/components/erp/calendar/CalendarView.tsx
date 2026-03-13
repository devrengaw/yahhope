import React from 'react';
import { CalendarEvent, EventType } from '../../../lib/mockData';
import { MapPin, Clock, Calendar as CalendarIcon, User, Users, Stethoscope, Briefcase, MessageSquare } from 'lucide-react';

interface CalendarViewProps {
  events: CalendarEvent[];
}

export function CalendarView({ events }: CalendarViewProps) {
  const getEventIcon = (type: EventType) => {
    switch (type) {
      case 'medical':
        return <Stethoscope size={18} />;
      case 'administrative':
        return <Briefcase size={18} />;
      case 'meeting':
        return <Users size={18} />;
      case 'event':
        return <MessageSquare size={18} />;
      default:
        return <CalendarIcon size={18} />;
    }
  };

  const getEventColors = (type: EventType) => {
    switch (type) {
      case 'medical':
        return 'bg-emerald-50 text-emerald-700 border-emerald-100';
      case 'administrative':
        return 'bg-blue-50 text-blue-700 border-blue-100';
      case 'meeting':
        return 'bg-purple-50 text-purple-700 border-purple-100';
      case 'event':
        return 'bg-amber-50 text-amber-700 border-amber-100';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-100';
    }
  };

  const sortedEvents = [...events].sort((a, b) => {
    const dateTimeA = new Date(`${a.date}T${a.time}`).getTime();
    const dateTimeB = new Date(`${b.date}T${b.time}`).getTime();
    return dateTimeA - dateTimeB;
  });

  // Group events by date
  const groupedEvents: { [key: string]: CalendarEvent[] } = {};
  sortedEvents.forEach(event => {
    if (!groupedEvents[event.date]) {
      groupedEvents[event.date] = [];
    }
    groupedEvents[event.date].push(event);
  });

  if (events.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-12 text-center text-slate-500">
        Nenhum evento agendado.
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {Object.keys(groupedEvents).map(date => (
        <div key={date} className="space-y-4">
          <h3 className="font-semibold text-slate-900 flex items-center gap-2 sticky top-0 bg-white/80 backdrop-blur-md py-2 px-1 z-10">
            <span className="w-2 h-2 rounded-full bg-blue-600 block"></span>
            {new Date(date + 'T00:00:00').toLocaleDateString('pt-BR', { 
              weekday: 'long', 
              day: 'numeric', 
              month: 'long' 
            })}
          </h3>
          
          <div className="grid grid-cols-1 gap-4">
            {groupedEvents[date].map(event => (
              <div 
                key={event.id} 
                className={`bg-white rounded-2xl shadow-sm border border-slate-100 p-5 hover:shadow-md transition-shadow flex flex-col sm:flex-row gap-4 sm:items-center relative overflow-hidden`}
              >
                <div className={`absolute top-0 left-0 w-1 h-full ${getEventColors(event.type).split(' ')[1].replace('text-', 'bg-')}`}></div>
                
                <div className="sm:w-24 flex sm:flex-col items-center gap-2 border-r border-slate-100 sm:pr-4">
                  <span className="text-xl font-bold text-slate-900">{event.time}</span>
                  <div className={`p-2 rounded-lg ${getEventColors(event.type)}`}>
                    {getEventIcon(event.type)}
                  </div>
                </div>

                <div className="flex-grow space-y-1">
                  <h4 className="font-bold text-slate-900 text-lg">{event.title}</h4>
                  <p className="text-slate-500 text-sm">{event.description}</p>
                </div>

                <div className="sm:w-48 space-y-2">
                  <div className="flex items-center gap-2 text-xs text-slate-500 font-medium bg-slate-50 px-3 py-1.5 rounded-lg w-fit sm:w-full">
                    <MapPin size={14} className="text-slate-400 shrink-0" />
                    <span className="truncate">{event.location}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
