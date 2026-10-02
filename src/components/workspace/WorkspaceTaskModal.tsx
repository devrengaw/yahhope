import React, { useState, useEffect } from 'react';
import { useClickUp, CU_Task, TaskPriority } from '../../contexts/ClickUpContext';
import { useTeam } from '../../contexts/TeamContext';
import { 
  X, CheckSquare, MessageSquare, Calendar as CalendarIcon, 
  User as UserIcon, Tag, Trash2, Plus, Flag, 
  Send, Clock, AlertCircle, ArrowRight, Layers
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '../../lib/utils';

interface WorkspaceTaskModalProps {
  task: CU_Task | null;
  onClose: () => void;
}

export function WorkspaceTaskModal({ task, onClose }: WorkspaceTaskModalProps) {
  const { 
    statuses, lists, spaces, systemUsers, 
    updateTask, deleteTask, 
    addChecklistItem, toggleChecklistItem, deleteChecklistItem, 
    addTaskComment 
  } = useClickUp();
  const { teams } = useTeam();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [newChecklistText, setNewChecklistText] = useState('');
  const [newCommentText, setNewCommentText] = useState('');
  const [newTagText, setNewTagText] = useState('');
  const [isEditingDescription, setIsEditingDescription] = useState(false);

  useEffect(() => {
    if (task) {
      setTitle(task.name);
      setDescription(task.description || '');
      setIsEditingDescription(!task.description);
    }
  }, [task?.id]);

  if (!task) return null;

  const currentList = lists.find(l => l.id === task.list_id);
  const currentSpace = currentList ? spaces.find(s => s.id === currentList.space_id) : null;
  const listStatuses = statuses.filter(s => s.list_id === task.list_id).sort((a, b) => a.order_index - b.order_index);
  const currentStatus = statuses.find(s => s.id === task.status_id);

  // Checklists calculations
  const totalChecklist = task.checklists?.length || 0;
  const completedChecklist = task.checklists?.filter(c => c.done).length || 0;
  const checklistPercent = totalChecklist > 0 ? Math.round((completedChecklist / totalChecklist) * 100) : 0;

  // Handlers
  const handleTitleBlur = () => {
    if (title.trim() && title !== task.name) {
      updateTask(task.id, { name: title.trim() });
    }
  };

  const handleSaveDescription = () => {
    updateTask(task.id, { description: description.trim() });
    setIsEditingDescription(false);
  };

  const handleAddChecklist = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChecklistText.trim()) return;
    addChecklistItem(task.id, newChecklistText.trim());
    setNewChecklistText('');
  };

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommentText.trim()) return;
    addTaskComment(task.id, newCommentText.trim());
    setNewCommentText('');
  };

  const handleAddTag = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && newTagText.trim()) {
      e.preventDefault();
      const cleanTag = newTagText.trim().replace(/^#/, '');
      if (!task.tags.includes(cleanTag)) {
        updateTask(task.id, { tags: [...task.tags, cleanTag] });
      }
      setNewTagText('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    updateTask(task.id, { tags: task.tags.filter(t => t !== tagToRemove) });
  };

  const priorityConfig: Record<TaskPriority, { label: string; color: string; bg: string }> = {
    urgent: { label: 'Urgente', color: '#ef4444', bg: 'bg-rose-50 text-rose-700 border-rose-200' },
    high: { label: 'Alta', color: '#f97316', bg: 'bg-orange-50 text-orange-700 border-orange-200' },
    normal: { label: 'Normal', color: '#3b82f6', bg: 'bg-blue-50 text-blue-700 border-blue-200' },
    low: { label: 'Baixa', color: '#94a3b8', bg: 'bg-slate-50 text-slate-600 border-slate-200' }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="fixed inset-0"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="relative w-full max-w-4xl max-h-[92vh] bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden z-10 animate-in zoom-in-95 duration-200">
        
        {/* Top Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80 shrink-0">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 overflow-hidden">
            {currentSpace && (
              <span className="flex items-center gap-1 text-slate-700 truncate font-bold">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: currentSpace.color }} />
                {currentSpace.name}
              </span>
            )}
            {currentList && (
              <>
                <ArrowRight size={12} className="text-slate-400 shrink-0" />
                <span className="truncate">{currentList.name}</span>
              </>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                if (window.confirm(`Tem certeza que deseja excluir a tarefa "${task.name}"?`)) {
                  deleteTask(task.id);
                  onClose();
                }
              }}
              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
              title="Excluir Tarefa"
            >
              <Trash2 size={16} />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
              aria-label="Fechar"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Left Content Area */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Task Title */}
            <div>
              <input 
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onBlur={handleTitleBlur}
                className="w-full text-2xl font-black text-slate-900 border-b border-transparent hover:border-slate-300 focus:border-blue-600 outline-none transition-colors py-1 bg-transparent"
                placeholder="Título da tarefa..."
              />
            </div>

            {/* Quick Properties row */}
            <div className="flex flex-wrap items-center gap-3 pt-1">
              
              {/* Status Picker */}
              <div className="relative group">
                <div 
                  className="px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-2 cursor-pointer shadow-xs transition-all hover:scale-102"
                  style={{
                    backgroundColor: `${currentStatus?.color || '#94a3b8'}15`,
                    borderColor: `${currentStatus?.color || '#94a3b8'}40`,
                    color: currentStatus?.color || '#64748b'
                  }}
                >
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: currentStatus?.color || '#94a3b8' }} />
                  <span>{currentStatus?.name || 'Status'}</span>
                </div>
                <select
                  value={task.status_id}
                  onChange={(e) => updateTask(task.id, { status_id: e.target.value })}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                >
                  {listStatuses.map(st => (
                    <option key={st.id} value={st.id}>{st.name}</option>
                  ))}
                </select>
              </div>

              {/* Priority Picker */}
              <div className="relative group">
                <div className={cn(
                  "px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs transition-all hover:scale-102",
                  priorityConfig[task.priority || 'normal'].bg
                )}>
                  <Flag size={13} style={{ color: priorityConfig[task.priority || 'normal'].color }} />
                  <span>{priorityConfig[task.priority || 'normal'].label}</span>
                </div>
                <select
                  value={task.priority || 'normal'}
                  onChange={(e) => updateTask(task.id, { priority: e.target.value as TaskPriority })}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                >
                  <option value="urgent">🔴 Urgente</option>
                  <option value="high">🟠 Alta</option>
                  <option value="normal">🔵 Normal</option>
                  <option value="low">⚪ Baixa</option>
                </select>
              </div>

              {/* Due Date Indicator */}
              {task.due_date && (
                <div className={cn(
                  "px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5",
                  new Date(task.due_date).getTime() < Date.now()
                    ? "bg-rose-50 text-rose-600 border-rose-200"
                    : "bg-slate-50 text-slate-700 border-slate-200"
                )}>
                  <CalendarIcon size={13} />
                  <span>
                    {format(new Date(task.due_date), "dd 'de' MMM", { locale: ptBR })}
                  </span>
                </div>
              )}
            </div>

            {/* Description Section */}
            <div className="space-y-2 pt-2">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  Descrição & Instruções
                </h3>
                {!isEditingDescription && task.description && (
                  <button 
                    onClick={() => setIsEditingDescription(true)}
                    className="text-xs text-blue-600 font-bold hover:underline cursor-pointer"
                  >
                    Editar
                  </button>
                )}
              </div>

              {isEditingDescription ? (
                <div className="space-y-2">
                  <textarea
                    autoFocus
                    rows={4}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Adicione detalhes, diretrizes, links ou observações da tarefa..."
                    className="w-full p-3.5 text-sm rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none text-slate-800 transition-all resize-y"
                  />
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={handleSaveDescription}
                      className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-colors cursor-pointer"
                    >
                      Salvar Descrição
                    </button>
                    <button 
                      onClick={() => {
                        setDescription(task.description || '');
                        setIsEditingDescription(false);
                      }}
                      className="px-3 py-1.5 rounded-lg text-slate-500 hover:bg-slate-100 text-xs font-medium cursor-pointer"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              ) : (
                <div 
                  onClick={() => setIsEditingDescription(true)}
                  className="p-3.5 rounded-xl bg-slate-50 hover:bg-slate-100/70 border border-slate-200/60 text-sm text-slate-700 cursor-pointer min-h-[60px] whitespace-pre-wrap transition-colors"
                >
                  {task.description || (
                    <span className="text-slate-400 italic">Nenhuma descrição informada. Clique para adicionar detalhes...</span>
                  )}
                </div>
              )}
            </div>

            {/* Checklist Section */}
            <div className="space-y-3 pt-4 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckSquare size={16} className="text-blue-600" />
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-700">
                    Checklist & Subtarefas
                  </h3>
                </div>
                {totalChecklist > 0 && (
                  <span className="text-xs font-bold text-slate-500">
                    {completedChecklist}/{totalChecklist} ({checklistPercent}%)
                  </span>
                )}
              </div>

              {/* Progress Bar */}
              {totalChecklist > 0 && (
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                  <div 
                    className="bg-emerald-500 h-full rounded-full transition-all duration-300"
                    style={{ width: `${checklistPercent}%` }}
                  />
                </div>
              )}

              {/* Checklist Items */}
              <div className="space-y-1.5">
                {(task.checklists || []).map((item) => (
                  <div 
                    key={item.id}
                    className="flex items-center justify-between gap-3 p-2 rounded-lg hover:bg-slate-50 group transition-colors"
                  >
                    <label className="flex items-center gap-3 flex-1 cursor-pointer">
                      <input 
                        type="checkbox"
                        checked={item.done}
                        onChange={() => toggleChecklistItem(task.id, item.id)}
                        className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300 cursor-pointer"
                      />
                      <span className={cn(
                        "text-sm transition-all",
                        item.done ? "line-through text-slate-400" : "text-slate-700 font-medium"
                      )}>
                        {item.text}
                      </span>
                    </label>
                    <button 
                      onClick={() => deleteChecklistItem(task.id, item.id)}
                      className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-rose-600 rounded transition-opacity cursor-pointer"
                      title="Remover item"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}
              </div>

              {/* Add Checklist Form */}
              <form onSubmit={handleAddChecklist} className="flex gap-2 pt-1">
                <input 
                  type="text"
                  placeholder="+ Adicionar item de checklist..."
                  value={newChecklistText}
                  onChange={(e) => setNewChecklistText(e.target.value)}
                  className="flex-1 px-3 py-2 text-xs rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none text-slate-800"
                />
                <button 
                  type="submit"
                  disabled={!newChecklistText.trim()}
                  className="px-3 py-2 bg-blue-50 text-blue-600 hover:bg-blue-100 disabled:opacity-50 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                >
                  Adicionar
                </button>
              </form>
            </div>

            {/* Comments & Team Discussion Section */}
            <div className="space-y-3 pt-4 border-t border-slate-100">
              <div className="flex items-center gap-2">
                <MessageSquare size={16} className="text-blue-600" />
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-700">
                  Comunicação & Discussão da Tarefa
                </h3>
              </div>

              {/* Comments Feed */}
              <div className="space-y-3 max-h-56 overflow-y-auto pr-1">
                {(task.comments || []).length === 0 ? (
                  <p className="text-xs text-slate-400 italic py-2">
                    Nenhum comentário na tarefa ainda. Use este espaço para alinhar dúvidas e atualizações com a equipe.
                  </p>
                ) : (
                  (task.comments || []).map((comment) => (
                    <div key={comment.id} className="flex gap-3 bg-slate-50/80 p-3 rounded-xl border border-slate-100">
                      <img 
                        src={comment.user_avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'} 
                        alt={comment.user_name}
                        className="w-8 h-8 rounded-full object-cover shrink-0" 
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <span className="text-xs font-bold text-slate-800 truncate">{comment.user_name}</span>
                          <span className="text-[10px] text-slate-400 shrink-0">
                            {format(new Date(comment.created_at), "dd/MM HH:mm")}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 whitespace-pre-wrap leading-relaxed">
                          {comment.text}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* New Comment Input */}
              <form onSubmit={handleAddComment} className="flex gap-2 pt-2">
                <input 
                  type="text"
                  placeholder="Escreva um comentário ou feedback para a equipe..."
                  value={newCommentText}
                  onChange={(e) => setNewCommentText(e.target.value)}
                  className="flex-1 px-4 py-2.5 text-xs rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none text-slate-800"
                />
                <button 
                  type="submit"
                  disabled={!newCommentText.trim()}
                  className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
                >
                  <Send size={13} />
                  <span>Enviar</span>
                </button>
              </form>
            </div>

          </div>

          {/* Right Sidebar Properties Area */}
          <div className="space-y-6 lg:border-l lg:border-slate-100 lg:pl-6">
            
            {/* Responsável (Assignee) */}
            <div className="space-y-2">
              <label className="text-[11px] font-black uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <UserIcon size={14} /> Responsável
              </label>
              <select
                value={task.assignee_id || task.assignee || ''}
                onChange={(e) => {
                  const uid = e.target.value;
                  const selected = systemUsers.find(u => u.id === uid);
                  updateTask(task.id, {
                    assignee_id: uid || undefined,
                    assignee: uid || undefined,
                    assignee_user: selected
                  });
                }}
                className="w-full px-3 py-2 text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl focus:border-blue-500 outline-none text-slate-800 cursor-pointer"
              >
                <option value="">Sem responsável</option>
                {systemUsers.map(u => (
                  <option key={u.id} value={u.id}>
                    {u.name} {u.department ? `(${u.department})` : ''}
                  </option>
                ))}
              </select>

              {task.assignee_user && (
                <div className="flex items-center gap-2 px-3 py-2 bg-blue-50/60 rounded-xl border border-blue-100 text-xs">
                  <img 
                    src={task.assignee_user.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'} 
                    alt={task.assignee_user.name}
                    className="w-6 h-6 rounded-full object-cover" 
                  />
                  <div className="truncate">
                    <p className="font-bold text-slate-800 truncate">{task.assignee_user.name}</p>
                    <p className="text-[10px] text-slate-500">{task.assignee_user.email}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Equipe Atribuída */}
            <div className="space-y-2">
              <label className="text-[11px] font-black uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <Layers size={14} /> Equipe
              </label>
              <select
                value={task.team_id || ''}
                onChange={(e) => {
                  const tid = e.target.value;
                  const teamObj = teams.find(t => t.id === tid);
                  updateTask(task.id, {
                    team_id: tid || undefined,
                    team: teamObj ? { id: teamObj.id, name: teamObj.name, color: teamObj.color } : undefined
                  });
                }}
                className="w-full px-3 py-2 text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl focus:border-blue-500 outline-none text-slate-800 cursor-pointer"
              >
                <option value="">Nenhuma equipe vinculada</option>
                {teams.map(t => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>

            {/* Data de Vencimento */}
            <div className="space-y-2">
              <label className="text-[11px] font-black uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <CalendarIcon size={14} /> Prazo / Data de Entrega
              </label>
              <input 
                type="date"
                value={task.due_date ? task.due_date.substring(0, 10) : ''}
                onChange={(e) => {
                  const val = e.target.value;
                  updateTask(task.id, { due_date: val ? new Date(val).toISOString() : undefined });
                }}
                className="w-full px-3 py-2 text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl focus:border-blue-500 outline-none text-slate-800 cursor-pointer"
              />
            </div>

            {/* Tags / Marcadores */}
            <div className="space-y-2">
              <label className="text-[11px] font-black uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <Tag size={14} /> Marcadores & Tags
              </label>
              
              <div className="flex flex-wrap gap-1.5 min-h-[30px]">
                {(task.tags || []).map(tag => (
                  <span 
                    key={tag}
                    className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium transition-colors"
                  >
                    #{tag}
                    <button 
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="text-slate-400 hover:text-rose-600 cursor-pointer"
                    >
                      <X size={11} />
                    </button>
                  </span>
                ))}
              </div>

              <input 
                type="text"
                placeholder="Digitar tag e dar Enter..."
                value={newTagText}
                onChange={(e) => setNewTagText(e.target.value)}
                onKeyDown={handleAddTag}
                className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:border-blue-500 outline-none text-slate-800"
              />
            </div>

            {/* Mover Lista */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <label className="text-[11px] font-black uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                Lista / Projeto
              </label>
              <select
                value={task.list_id}
                onChange={(e) => {
                  const newListId = e.target.value;
                  const firstStatus = statuses.find(s => s.list_id === newListId);
                  updateTask(task.id, {
                    list_id: newListId,
                    status_id: firstStatus?.id || task.status_id
                  });
                }}
                className="w-full px-3 py-2 text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl focus:border-blue-500 outline-none text-slate-800 cursor-pointer"
              >
                {lists.map(l => (
                  <option key={l.id} value={l.id}>{l.name}</option>
                ))}
              </select>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
