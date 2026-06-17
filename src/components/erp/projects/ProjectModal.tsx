import React, { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
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
  const [enablePortalUpdates, setEnablePortalUpdates] = useState(initialProject?.enablePortalUpdates || false);
  const [availableMembers, setAvailableMembers] = useState<any[]>([]);

  useEffect(() => {
    if (isOpen) {
      supabase.from('users').select('id, name, department').then(({ data }) => {
        if (data) setAvailableMembers(data);
      });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name || !startDate) return;

    onSave({
      id: initialProject?.id || Math.random().toString(36).substring(2, 9),
      name,
      description,
      status,
      progress: parseInt(progress),
      start_date: startDate,
      end_date: endDate,
      budget: budget ? parseFloat(budget) : 0,
      isPrivate,
      invitees,
      category,
      priority,
      enablePortalUpdates,
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
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
            />
          </div>

          <div className="p-4 rounded-2xl border-2 border-amber-100 bg-amber-50/50 flex items-center justify-between transition-all">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-500 rounded-xl flex items-center justify-center text-white shadow-lg shadow-amber-500/20">
                <Globe size={20} />
              </div>
              <div>
                <p className="text-sm font-black text-slate-900 tracking-tight">Habilitar Atualização no Portal</p>
                <p className="text-[10px] text-slate-500 font-medium">Subir marcos e notícias deste projeto no Feed do Apoiador.</p>
              </div>
            </div>
            <button 
              type="button"
              onClick={() => setEnablePortalUpdates(!enablePortalUpdates)}
              className={`w-12 h-6 rounded-full relative transition-all duration-300 ${enablePortalUpdates ? 'bg-amber-500' : 'bg-slate-300'}`}
            >
              <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform duration-300 ${enablePortalUpdates ? 'translate-x-6' : ''}`}></div>
            </button>
          </div>

          <div className="space-y-3">
            <label className="block text-sm font-medium text-slate-700">Convidar Membros da Equipe</label>
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 max-h-48 overflow-y-auto space-y-2">
              {availableMembers.map(member => (
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
