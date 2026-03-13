import React, { useState } from 'react';
import { Project, ProjectStatus, mockTeamMembers, Priority } from '../../../lib/mockData';
import { X, Lock, Globe, UserPlus, Trash2, Plus } from 'lucide-react';

interface ProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (project: Project) => void;
  initialProject?: Project;
}

export function ProjectModal({ isOpen, onClose, onSave, initialProject }: ProjectModalProps) {
  const [name, setName] = useState(initialProject?.name || '');
  const [description, setDescription] = useState(initialProject?.description || '');
  const [status, setStatus] = useState<ProjectStatus>(initialProject?.status || 'planning');
  const [progress, setProgress] = useState(initialProject?.progress?.toString() || '0');
  const [budget, setBudget] = useState(initialProject?.budget?.toString() || '');
  const [startDate, setStartDate] = useState(initialProject?.start_date || new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(initialProject?.end_date || '');
  const [isPrivate, setIsPrivate] = useState(initialProject?.isPrivate || false);
  const [invitees, setInvitees] = useState<string[]>(initialProject?.invitees || []);
  const [category, setCategory] = useState(initialProject?.category || '');
  const [priority, setPriority] = useState<Priority>(initialProject?.priority || 'medium');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name || !description || !startDate || !budget) return;

    onSave({
      id: initialProject?.id || Math.random().toString(36).substring(2, 9),
      name,
      description,
      status,
      progress: parseInt(progress),
      start_date: startDate,
      end_date: endDate,
      budget: parseFloat(budget),
      isPrivate,
      invitees,
      category,
      priority,
      tasks: initialProject?.tasks || []
    });
    
    // Reset form
    setName('');
    setDescription('');
    setStatus('planning');
    setProgress('0');
    setBudget('');
    setStartDate(new Date().toISOString().split('T')[0]);
    setEndDate('');
    setIsPrivate(false);
    setInvitees([]);
    setCategory('');
    setPriority('medium');
    onClose();
  };

  const toggleInvitee = (userId: string) => {
    setInvitees(prev => 
      prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
    );
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-2xl w-full max-w-xl shadow-xl animate-in fade-in zoom-in-95 duration-200 my-8">
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <h2 className="text-xl font-bold text-slate-900">
            {initialProject ? 'Editar Projeto' : 'Novo Projeto'}
          </h2>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors p-2 hover:bg-slate-50 rounded-full"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Nome do Projeto</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Ex: Reforma da área de recreação"
              className="w-full border border-slate-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium text-lg"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Descrição</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Descreva o propósito e escopo do projeto..."
              rows={3}
              className="w-full border border-slate-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all resize-none"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Categoria</label>
              <input
                type="text"
                value={category}
                onChange={e => setCategory(e.target.value)}
                placeholder="Ex: Saúde, Infra..."
                className="w-full border border-slate-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                required
              />
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

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
              <select
                value={status}
                onChange={e => setStatus(e.target.value as ProjectStatus)}
                className="w-full border border-slate-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all appearance-none bg-white"
                required
              >
                <option value="planning">Em Planejamento</option>
                <option value="active">Em Andamento</option>
                <option value="on-hold">Pausado</option>
                <option value="completed">Concluído</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Progresso (%)</label>
              <input
                type="number"
                min="0"
                max="100"
                value={progress}
                onChange={e => setProgress(e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Data de Início</label>
              <input
                type="date"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Previsão Fim</label>
              <input
                type="date"
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                required
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Orçamento Planejado (R$)</label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={budget}
              onChange={e => setBudget(e.target.value)}
              placeholder="0.00"
              className="w-full border border-slate-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-emerald-600 font-medium"
              required
            />
          </div>

          <div className="pt-2">
            <label className="block text-sm font-medium text-slate-700 mb-3">Privacidade do Projeto</label>
            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => setIsPrivate(false)}
                className={`flex-1 p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 ${!isPrivate ? 'border-blue-500 bg-blue-50/50 text-blue-600 shadow-sm' : 'border-slate-100 bg-white text-slate-400 hover:border-slate-200'}`}
              >
                <Globe size={24} />
                <span className="text-xs font-bold uppercase tracking-wider">Público</span>
              </button>
              <button
                type="button"
                onClick={() => setIsPrivate(true)}
                className={`flex-1 p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 ${isPrivate ? 'border-slate-900 bg-slate-900 text-white shadow-md' : 'border-slate-100 bg-white text-slate-400 hover:border-slate-200'}`}
              >
                <Lock size={24} />
                <span className="text-xs font-bold uppercase tracking-wider">Privado</span>
              </button>
            </div>
            <p className="text-[11px] text-slate-500 mt-2 italic px-1">
              {isPrivate 
                ? "Apenas pessoas convidadas poderão visualizar este projeto."
                : "Qualquer membro da equipe poderá ver este projeto."}
            </p>
          </div>

          <div className="space-y-3">
            <label className="block text-sm font-medium text-slate-700">Convidar Membros da Equipe</label>
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 max-h-48 overflow-y-auto space-y-2">
              {mockTeamMembers.map(member => (
                <div 
                  key={member.id} 
                  onClick={() => toggleInvitee(member.id)}
                  className={`flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition-all ${invitees.includes(member.id) ? 'bg-white border-blue-100 ring-1 ring-blue-100' : 'hover:bg-white/50 border-transparent border'}`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-600 uppercase">
                      {member.name.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-700">{member.name}</p>
                      <p className="text-[10px] text-slate-500">{member.department}</p>
                    </div>
                  </div>
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${invitees.includes(member.id) ? 'bg-blue-600 border-blue-600' : 'border-slate-300'}`}>
                    {invitees.includes(member.id) && <Plus size={12} className="text-white" />}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 border border-slate-200 text-slate-600 font-medium rounded-xl hover:bg-slate-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2.5 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-colors shadow-sm"
            >
              Salvar Projeto
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
