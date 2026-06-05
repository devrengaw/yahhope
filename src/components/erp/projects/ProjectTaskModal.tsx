import React, { useState } from 'react';
import { X, Plus, Trash2, CheckCircle2, Circle, Lock, Globe, UserPlus, Users, AlertCircle } from 'lucide-react';
import { ProjectTask, TaskStatus, SubTask, mockTeamMembers, Priority } from '../../../lib/mockData';

interface ProjectTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (task: ProjectTask) => void;
  initialTask?: ProjectTask;
}

export function ProjectTaskModal({ isOpen, onClose, onSave, initialTask }: ProjectTaskModalProps) {
  const [title, setTitle] = useState(initialTask?.title || '');
  const [description, setDescription] = useState(initialTask?.description || '');
  const [status, setStatus] = useState<TaskStatus>(initialTask?.status || 'todo');
  const [priority, setPriority] = useState<Priority>(initialTask?.priority || 'medium');
  const [cost, setCost] = useState(initialTask?.cost?.toString() || '0');
  const [subtasks, setSubtasks] = useState<SubTask[]>(initialTask?.subtasks || []);
  const [invitees, setInvitees] = useState<string[]>(initialTask?.invitees || []);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');

  if (!isOpen) return null;

  const handleAddSubtask = () => {
    if (!newSubtaskTitle.trim()) return;
    const newSub: SubTask = {
      id: Math.random().toString(36).substring(2, 9),
      title: newSubtaskTitle,
      completed: false,
      invitees: []
    };
    setSubtasks([...subtasks, newSub]);
    setNewSubtaskTitle('');
  };

  const toggleSubtask = (id: string) => {
    setSubtasks(subtasks.map(s => s.id === id ? { ...s, completed: !s.completed } : s));
  };

  const removeSubtask = (id: string) => {
    setSubtasks(subtasks.filter(s => s.id !== id));
  };

  const toggleInvitee = (userId: string) => {
    setInvitees(prev => 
      prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) return;

    onSave({
      id: initialTask?.id || Math.random().toString(36).substring(2, 9),
      title,
      description,
      status,
      priority,
      cost: parseFloat(cost) || 0,
      subtasks,
      invitees
    });
    
    setTitle('');
    setDescription('');
    setStatus('todo');
    setPriority('medium');
    setCost('0');
    setSubtasks([]);
    setInvitees([]);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-[60]">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <h2 className="text-xl font-bold text-slate-900">{initialTask ? 'Editar Tarefa' : 'Nova Tarefa'}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors p-2 hover:bg-slate-50 rounded-full">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto max-h-[70vh]">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Título da Tarefa</label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Ex: Contratação de pedreiros"
              className="w-full border border-slate-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Descrição</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Detalhes sobre a tarefa..."
              rows={2}
              className="w-full border border-slate-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
              <select
                value={status}
                onChange={e => setStatus(e.target.value as TaskStatus)}
                className="w-full border border-slate-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all appearance-none bg-white font-medium"
                required
              >
                <option value="todo">Pendente</option>
                <option value="in-progress">Em Execução</option>
                <option value="review">Revisão</option>
                <option value="done">Concluído</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Prioridade</label>
              <select
                value={priority}
                onChange={e => setPriority(e.target.value as Priority)}
                className={`w-full border border-slate-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all appearance-none bg-white font-bold ${
                  priority === 'high' ? 'text-rose-600' : priority === 'medium' ? 'text-amber-600' : 'text-emerald-600'
                }`}
                required
              >
                <option value="low">Baixa</option>
                <option value="medium">Média</option>
                <option value="high">Alta</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Custo Estimado (R$)</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-medium">R$</span>
              <input
                type="number"
                step="0.01"
                min="0"
                value={cost}
                onChange={e => setCost(e.target.value)}
                className="w-full border border-slate-200 rounded-xl pl-12 pr-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-emerald-600 font-bold"
                required
              />
            </div>
          </div>

          <div className="space-y-3">
            <label className="block text-sm font-medium text-slate-700">Subtarefas</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={newSubtaskTitle}
                onChange={e => setNewSubtaskTitle(e.target.value)}
                placeholder="Adicionar subitem..."
                className="flex-grow border border-slate-200 rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm"
              />
              <button 
                type="button" 
                onClick={handleAddSubtask}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 p-2 rounded-xl transition-colors"
              >
                <Plus size={20} />
              </button>
            </div>

            <div className="space-y-2 pt-2">
              {subtasks.map(sub => (
                <div key={sub.id} className="flex items-center justify-between bg-slate-50 p-3 rounded-xl border border-slate-100 group">
                  <div className="flex items-center gap-3">
                    <button type="button" onClick={() => toggleSubtask(sub.id)} className="text-slate-400 hover:text-blue-600 transition-colors">
                      {sub.completed ? <CheckCircle2 size={18} className="text-emerald-500" /> : <Circle size={18} />}
                    </button>
                    <span className={`text-sm font-medium ${sub.completed ? 'text-slate-400 line-through' : 'text-slate-700'}`}>{sub.title}</span>
                  </div>
                  <button type="button" onClick={() => removeSubtask(sub.id)} className="text-slate-400 hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100">
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <label className="block text-sm font-medium text-slate-700 flex items-center gap-2">
              <Users size={16} className="text-slate-400" />
              Integrantes da Tarefa
            </label>
            <div className="flex flex-wrap gap-2">
              {mockTeamMembers.map(member => (
                <button
                  key={member.id}
                  type="button"
                  onClick={() => toggleInvitee(member.id)}
                  title={member.name}
                  className={`w-10 h-10 rounded-full border-2 transition-all flex items-center justify-center text-xs font-bold uppercase ${
                    invitees.includes(member.id) 
                      ? 'border-blue-500 bg-blue-50 text-blue-600' 
                      : 'border-slate-100 bg-slate-50 text-slate-400 grayscale'
                  }`}
                >
                  {member.name.charAt(0)}
                </button>
              ))}
            </div>
          </div>

          <div className="pt-4 flex gap-3">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 border border-slate-200 text-slate-600 font-medium rounded-xl hover:bg-slate-50 transition-colors">
              Cancelar
            </button>
            <button type="submit" className="flex-1 px-4 py-2.5 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-colors shadow-sm">
              {initialTask ? 'Atualizar' : 'Salvar Tarefa'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
