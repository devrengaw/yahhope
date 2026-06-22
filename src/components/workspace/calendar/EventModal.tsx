import React, { useState, useEffect } from 'react';
import { useCalendar } from '../../../contexts/CalendarContext';
import { supabase } from '../../../lib/supabase';
import { X, Calendar as CalendarIcon, Clock, Users } from 'lucide-react';

interface UserOption {
  id: string;
  name: string;
  email: string;
}

export function EventModal({ onClose }: { onClose: () => void }) {
  const { createEvent } = useCalendar();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [type, setType] = useState<'meeting' | 'availability'>('meeting');
  
  const [users, setUsers] = useState<UserOption[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);

  useEffect(() => {
    async function loadUsers() {
      const { data } = await supabase.from('users').select('id, name, email');
      if (data) setUsers(data);
    }
    loadUsers();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !date || !startTime || !endTime) return;

    const startDateTime = new Date(`${date}T${startTime}:00`).toISOString();
    const endDateTime = new Date(`${date}T${endTime}:00`).toISOString();

    await createEvent({
      title,
      description,
      start_time: startDateTime,
      end_time: endDateTime,
      event_type: type
    }, type === 'meeting' ? selectedUsers : []);
    
    onClose();
  };

  const toggleUser = (id: string) => {
    setSelectedUsers(prev => prev.includes(id) ? prev.filter(u => u !== id) : [...prev, id]);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <h2 className="text-xl font-bold text-slate-800">Novo Evento</h2>
          <button onClick={onClose} className="text-slate-400 hover:bg-slate-100 p-2 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-6">
          
          <div className="flex bg-slate-100 p-1 rounded-lg">
            <button 
              type="button" 
              onClick={() => setType('meeting')} 
              className={`flex-1 py-2 text-sm font-bold rounded-md transition-all ${type === 'meeting' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Reunião
            </button>
            <button 
              type="button" 
              onClick={() => setType('availability')} 
              className={`flex-1 py-2 text-sm font-bold rounded-md transition-all ${type === 'availability' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Disponibilidade
            </button>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Título do Evento</label>
            <input 
              required
              type="text" 
              value={title} 
              onChange={e => setTitle(e.target.value)} 
              placeholder={type === 'meeting' ? "Ex: Alinhamento de Sprint" : "Ex: Horário de Foco"}
              className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-slate-800 outline-none focus:border-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-2"><CalendarIcon size={14}/> Data</label>
              <input 
                required
                type="date" 
                value={date} 
                onChange={e => setDate(e.target.value)} 
                className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-slate-800 outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-2"><Clock size={14}/> Início</label>
              <input 
                required
                type="time" 
                value={startTime} 
                onChange={e => setStartTime(e.target.value)} 
                className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-slate-800 outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-2"><Clock size={14}/> Fim</label>
              <input 
                required
                type="time" 
                value={endTime} 
                onChange={e => setEndTime(e.target.value)} 
                className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-slate-800 outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {type === 'meeting' && (
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-2"><Users size={14}/> Convidados</label>
              <div className="border border-slate-200 rounded-lg max-h-40 overflow-y-auto divide-y divide-slate-100">
                {users.map(u => (
                  <label key={u.id} className="flex items-center gap-3 p-3 hover:bg-slate-50 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={selectedUsers.includes(u.id)}
                      onChange={() => toggleUser(u.id)}
                      className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                    />
                    <div>
                      <p className="text-sm font-medium text-slate-800">{u.name}</p>
                      <p className="text-xs text-slate-500">{u.email}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Descrição / Link (Opcional)</label>
            <textarea 
              value={description} 
              onChange={e => setDescription(e.target.value)} 
              rows={3}
              className="w-full border border-slate-200 rounded-lg px-4 py-2 text-slate-800 outline-none focus:border-blue-500 resize-none"
            />
          </div>

          <button 
            type="submit" 
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg transition-colors"
          >
            {type === 'meeting' ? 'Agendar Reunião' : 'Salvar Disponibilidade'}
          </button>
        </form>
      </div>
    </div>
  );
}
