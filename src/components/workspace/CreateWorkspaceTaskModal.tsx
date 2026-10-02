import React, { useState, useEffect } from 'react';
import { useClickUp, TaskPriority, CU_ChecklistItem } from '../../contexts/ClickUpContext';
import { useAuth } from '../../contexts/AuthContext';
import { useTeam } from '../../contexts/TeamContext';
import { 
  X, Plus, CheckSquare, Calendar as CalendarIcon, 
  Flag, User as UserIcon, Layers, AlignLeft, Trash2, 
  Sparkles, CheckCircle2 
} from 'lucide-react';
import { cn } from '../../lib/utils';

interface CreateWorkspaceTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultSpaceId?: string;
  defaultListId?: string;
  defaultAssigneeId?: string;
  onTaskCreated?: (taskId: string) => void;
}

export function CreateWorkspaceTaskModal({
  isOpen,
  onClose,
  defaultSpaceId,
  defaultListId,
  defaultAssigneeId,
  onTaskCreated
}: CreateWorkspaceTaskModalProps) {
  const { spaces, lists, statuses, systemUsers, addTask, activeSpace, activeList } = useClickUp();
  const { user } = useAuth();
  const { teams } = useTeam();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedSpaceId, setSelectedSpaceId] = useState<string>('');
  const [selectedListId, setSelectedListId] = useState<string>('');
  const [selectedStatusId, setSelectedStatusId] = useState<string>('');
  const [priority, setPriority] = useState<TaskPriority>('normal');
  const [dueDate, setDueDate] = useState('');
  const [assigneeId, setAssigneeId] = useState<string>('');
  const [teamId, setTeamId] = useState<string>('');
  const [newChecklistText, setNewChecklistText] = useState('');
  const [checklists, setChecklists] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Initialize space, list, status and default assignee
  useEffect(() => {
    if (isOpen) {
      setName('');
      setDescription('');
      setChecklists([]);
      setNewChecklistText('');
      setErrorMessage('');
      setIsSubmitting(false);

      // Determine initial space
      const initialSpaceId = defaultSpaceId || activeSpace || (spaces[0]?.id ?? '');
      setSelectedSpaceId(initialSpaceId);

      // Determine lists for that space
      const spaceLists = lists.filter(l => l.space_id === initialSpaceId);
      const initialListId = (defaultListId && spaceLists.some(l => l.id === defaultListId))
        ? defaultListId
        : (spaceLists[0]?.id || activeList || (lists[0]?.id ?? ''));
      setSelectedListId(initialListId);

      // Determine initial status for that list
      const listStatuses = statuses.filter(s => s.list_id === initialListId);
      setSelectedStatusId(listStatuses[0]?.id || '');

      // Determine initial assignee
      if (defaultAssigneeId) {
        setAssigneeId(defaultAssigneeId);
      } else if (user?.id) {
        setAssigneeId(user.id);
      } else {
        setAssigneeId('');
      }

      setPriority('normal');
      setDueDate('');
      setTeamId('');
    }
  }, [isOpen, defaultSpaceId, defaultListId, defaultAssigneeId, activeSpace, activeList, spaces, lists, statuses, user?.id]);

  // When selected space changes, adjust available lists
  const handleSpaceChange = (spaceId: string) => {
    setSelectedSpaceId(spaceId);
    const availableLists = lists.filter(l => l.space_id === spaceId);
    const nextListId = availableLists[0]?.id || '';
    setSelectedListId(nextListId);

    const availableStatuses = statuses.filter(s => s.list_id === nextListId);
    setSelectedStatusId(availableStatuses[0]?.id || '');
  };

  // When selected list changes, adjust available statuses
  const handleListChange = (listId: string) => {
    setSelectedListId(listId);
    const availableStatuses = statuses.filter(s => s.list_id === listId);
    setSelectedStatusId(availableStatuses[0]?.id || '');
  };

  const handleAddChecklist = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChecklistText.trim()) return;
    setChecklists(prev => [...prev, newChecklistText.trim()]);
    setNewChecklistText('');
  };

  const handleRemoveChecklist = (indexToRemove: number) => {
    setChecklists(prev => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMessage('Por favor, informe o título da tarefa.');
      return;
    }

    // Ensure we have a list_id
    let effectiveListId = selectedListId;
    if (!effectiveListId && lists.length > 0) {
      effectiveListId = lists[0].id;
    }

    if (!effectiveListId) {
      setErrorMessage('Nenhuma lista de tarefas encontrada. Crie uma lista em um Espaço primeiro.');
      return;
    }

    // Determine status ID
    let effectiveStatusId = selectedStatusId;
    if (!effectiveStatusId) {
      const listStatuses = statuses.filter(s => s.list_id === effectiveListId);
      effectiveStatusId = listStatuses[0]?.id || `default-todo-${effectiveListId}`;
    }

    try {
      setIsSubmitting(true);
      setErrorMessage('');

      const parsedChecklists: CU_ChecklistItem[] = checklists.map((item, idx) => ({
        id: `ck-${Date.now()}-${idx}`,
        text: item,
        done: false
      }));

      const selectedAssignee = assigneeId ? systemUsers.find(u => u.id === assigneeId) : undefined;
      const selectedTeam = teamId ? teams.find(t => t.id === teamId) : undefined;

      const created = await addTask(effectiveListId, name.trim(), effectiveStatusId, {
        description: description.trim(),
        priority,
        assignee_id: assigneeId || undefined,
        assignee: assigneeId || undefined,
        assignee_user: selectedAssignee ? {
          id: selectedAssignee.id,
          name: selectedAssignee.name,
          avatar: selectedAssignee.avatar,
          email: selectedAssignee.email,
          role: selectedAssignee.role
        } : undefined,
        team_id: teamId || undefined,
        team: selectedTeam ? {
          id: selectedTeam.id,
          name: selectedTeam.name,
          color: selectedTeam.color
        } : undefined,
        due_date: dueDate ? new Date(dueDate).toISOString() : undefined,
        checklists: parsedChecklists,
        created_by: user?.id || user?.email
      });

      if (created && onTaskCreated) {
        onTaskCreated(created.id);
      }

      onClose();
    } catch (err: any) {
      console.error('Error creating task:', err);
      setErrorMessage(err?.message || 'Erro ao criar tarefa. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const filteredLists = selectedSpaceId ? lists.filter(l => l.space_id === selectedSpaceId) : lists;
  const filteredStatuses = selectedListId ? statuses.filter(s => s.list_id === selectedListId) : [];
  const selectedUser = systemUsers.find(u => u.id === assigneeId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="fixed inset-0"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="relative w-full max-w-2xl max-h-[92vh] bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden z-10 animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
              <CheckSquare size={18} />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-900">Nova Tarefa</h2>
              <p className="text-xs text-slate-500">Defina os detalhes e atribua a um colaborador da equipe.</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
            aria-label="Fechar"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
              {errorMessage}
            </div>
          )}

          {/* Title */}
          <div className="space-y-1.5">
            <label className="text-xs font-black uppercase tracking-wider text-slate-600">
              Título da Tarefa <span className="text-rose-500">*</span>
            </label>
            <input 
              type="text"
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Elaborar relatório de acompanhamento, Revisar post..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-none text-sm font-semibold text-slate-800 transition-all placeholder:text-slate-400"
            />
          </div>

          {/* Space and List Selectors */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-black uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                <Layers size={13} className="text-slate-400" /> Espaço
              </label>
              <select
                value={selectedSpaceId}
                onChange={(e) => handleSpaceChange(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 bg-white focus:border-blue-600 outline-none cursor-pointer"
              >
                {spaces.length === 0 && <option value="">Nenhum espaço disponível</option>}
                {spaces.map(sp => (
                  <option key={sp.id} value={sp.id}>{sp.name}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-black uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                <CheckSquare size={13} className="text-slate-400" /> Lista / Funil
              </label>
              <select
                value={selectedListId}
                onChange={(e) => handleListChange(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 bg-white focus:border-blue-600 outline-none cursor-pointer"
              >
                {filteredLists.length === 0 && <option value="">Sem listas no espaço</option>}
                {filteredLists.map(lst => (
                  <option key={lst.id} value={lst.id}>{lst.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Status, Priority, and Due Date row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Status */}
            <div className="space-y-1.5">
              <label className="text-xs font-black uppercase tracking-wider text-slate-600">
                Status Inicial
              </label>
              <select
                value={selectedStatusId}
                onChange={(e) => setSelectedStatusId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 bg-white focus:border-blue-600 outline-none cursor-pointer"
              >
                {filteredStatuses.length > 0 ? (
                  filteredStatuses.map(st => (
                    <option key={st.id} value={st.id}>{st.name}</option>
                  ))
                ) : (
                  <>
                    <option value="A FAZER">A FAZER</option>
                    <option value="EM ANDAMENTO">EM ANDAMENTO</option>
                    <option value="CONCLUÍDO">CONCLUÍDO</option>
                  </>
                )}
              </select>
            </div>

            {/* Priority */}
            <div className="space-y-1.5">
              <label className="text-xs font-black uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                <Flag size={13} className="text-slate-400" /> Prioridade
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as TaskPriority)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 bg-white focus:border-blue-600 outline-none cursor-pointer"
              >
                <option value="urgent">🔴 Urgente</option>
                <option value="high">🟠 Alta</option>
                <option value="normal">🔵 Normal</option>
                <option value="low">⚪ Baixa</option>
              </select>
            </div>

            {/* Due Date */}
            <div className="space-y-1.5">
              <label className="text-xs font-black uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                <CalendarIcon size={13} className="text-slate-400" /> Prazo / Data
              </label>
              <input 
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 bg-white focus:border-blue-600 outline-none cursor-pointer"
              />
            </div>
          </div>

          {/* Responsável / Marcar Colaborador (Assignee) */}
          <div className="space-y-2 p-4 bg-slate-50/80 rounded-2xl border border-slate-200/80">
            <label className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <UserIcon size={14} className="text-blue-600" />
                Marcar Colaborador (Responsável)
              </span>
              <span className="text-[11px] font-bold text-slate-400">
                {systemUsers.length} {systemUsers.length === 1 ? 'usuário cadastrado' : 'usuários cadastrados'}
              </span>
            </label>

            <select
              value={assigneeId}
              onChange={(e) => setAssigneeId(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 bg-white focus:border-blue-600 outline-none cursor-pointer"
            >
              <option value="">Sem responsável definido (Não atribuída)</option>
              {user && (
                <option value={user.id}>
                  👤 Atribuir a Mim ({user.name || user.email})
                </option>
              )}
              {systemUsers
                .filter(u => u.id !== user?.id)
                .map(u => (
                  <option key={u.id} value={u.id}>
                    {u.name} {u.department ? `(${u.department})` : ''} - {u.email}
                  </option>
                ))}
            </select>

            {/* Selected User Preview Badge */}
            {selectedUser && (
              <div className="flex items-center gap-3 p-2.5 bg-blue-50/70 border border-blue-100 rounded-xl mt-2 animate-in fade-in duration-150">
                <img 
                  src={selectedUser.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedUser.name)}&background=3b82f6&color=fff`} 
                  alt={selectedUser.name} 
                  className="w-7 h-7 rounded-full object-cover shrink-0 border border-blue-200 shadow-2xs"
                />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-slate-800 truncate">
                    {selectedUser.name} {selectedUser.id === user?.id && <span className="text-[10px] text-blue-600 font-extrabold">(Você)</span>}
                  </p>
                  <p className="text-[10px] text-slate-500 truncate">{selectedUser.email}</p>
                </div>
                {selectedUser.department && (
                  <span className="text-[10px] font-bold bg-white text-slate-600 border border-slate-200 px-2 py-0.5 rounded-md shrink-0">
                    {selectedUser.department}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label className="text-xs font-black uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
              <AlignLeft size={13} className="text-slate-400" /> Descrição & Instruções
            </label>
            <textarea 
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descreva o objetivo da tarefa, links úteis, critérios de entrega ou observações..."
              className="w-full p-3 rounded-xl border border-slate-200 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-none text-xs text-slate-800 transition-all resize-y placeholder:text-slate-400"
            />
          </div>

          {/* Initial Checklists */}
          <div className="space-y-2">
            <label className="text-xs font-black uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
              <CheckSquare size={13} className="text-slate-400" /> Subtarefas / Checklist Inicial
            </label>

            <div className="flex gap-2">
              <input 
                type="text"
                value={newChecklistText}
                onChange={(e) => setNewChecklistText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddChecklist(e);
                  }
                }}
                placeholder="Adicionar item de checklist e pressionar Enter..."
                className="flex-1 px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-800 outline-none focus:border-blue-600"
              />
              <button 
                type="button"
                onClick={handleAddChecklist}
                className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer shrink-0"
              >
                + Adicionar
              </button>
            </div>

            {checklists.length > 0 && (
              <div className="space-y-1.5 mt-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200/70">
                {checklists.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between gap-2 px-2.5 py-1.5 bg-white rounded-lg border border-slate-200/60 text-xs text-slate-700">
                    <span className="truncate">{item}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveChecklist(idx)}
                      className="text-slate-400 hover:text-rose-600 p-0.5 transition-colors cursor-pointer shrink-0"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !name.trim()}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-xs font-black tracking-wide flex items-center gap-2 transition-all shadow-xs cursor-pointer"
            >
              {isSubmitting ? (
                <span>Salvando...</span>
              ) : (
                <>
                  <Plus size={16} />
                  <span>Criar Tarefa</span>
                </>
              )}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
