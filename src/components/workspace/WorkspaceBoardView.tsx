import React, { useState } from 'react';
import { useClickUp, CU_Task, TaskPriority } from '../../contexts/ClickUpContext';
import { 
  Plus, MoreHorizontal, Calendar as CalendarIcon, AlignLeft, 
  CheckSquare, MessageSquare, Flag, Trash2, Edit2, ChevronRight, X
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { WorkspaceTaskModal } from './WorkspaceTaskModal';

export function WorkspaceBoardView() {
  const { 
    statuses, tasks, activeList, 
    addTask, moveTaskStatus, addStatus, updateStatus, deleteStatus,
    selectedTask, setSelectedTask 
  } = useClickUp();

  const [newTaskStatusId, setNewTaskStatusId] = useState<string | null>(null);
  const [newTaskName, setNewTaskName] = useState('');
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [dragOverStatusId, setDragOverStatusId] = useState<string | null>(null);

  const [isAddingStatus, setIsAddingStatus] = useState(false);
  const [newStatusName, setNewStatusName] = useState('');
  const [newStatusColor, setNewStatusColor] = useState('#3b82f6');
  const [activeMenuStatusId, setActiveMenuStatusId] = useState<string | null>(null);

  if (!activeList) return null;

  const listStatuses = statuses.filter(s => s.list_id === activeList).sort((a, b) => a.order_index - b.order_index);
  const effectiveStatuses = listStatuses.length > 0 ? listStatuses : [
    { id: `default-todo-${activeList}`, list_id: activeList, name: 'A FAZER', color: '#94a3b8', order_index: 0 },
    { id: `default-progress-${activeList}`, list_id: activeList, name: 'EM ANDAMENTO', color: '#3b82f6', order_index: 1 },
    { id: `default-done-${activeList}`, list_id: activeList, name: 'CONCLUÍDO', color: '#10b981', order_index: 2 }
  ];
  const listTasks = tasks.filter(t => t.list_id === activeList);

  const handleAddTask = async (e: React.KeyboardEvent, statusId: string) => {
    if (e.key === 'Enter' && newTaskName.trim()) {
      await addTask(activeList, newTaskName.trim(), statusId);
      setNewTaskName('');
      setNewTaskStatusId(null);
    } else if (e.key === 'Escape') {
      setNewTaskName('');
      setNewTaskStatusId(null);
    }
  };

  const handleCreateStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStatusName.trim()) return;
    await addStatus(activeList, newStatusName.trim().toUpperCase(), newStatusColor);
    setNewStatusName('');
    setIsAddingStatus(false);
  };

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    e.dataTransfer.setData('text/plain', taskId);
    e.dataTransfer.effectAllowed = 'move';
    setDraggedTaskId(taskId);
  };

  const handleDragOver = (e: React.DragEvent, statusId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverStatusId !== statusId) {
      setDragOverStatusId(statusId);
    }
  };

  const handleDragLeave = (e: React.DragEvent, statusId: string) => {
    if (dragOverStatusId === statusId) {
      setDragOverStatusId(null);
    }
  };

  const handleDrop = async (e: React.DragEvent, targetStatusId: string) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('text/plain') || draggedTaskId;
    setDraggedTaskId(null);
    setDragOverStatusId(null);

    if (taskId) {
      await moveTaskStatus(taskId, targetStatusId);
    }
  };

  const priorityColors: Record<TaskPriority, { color: string; label: string }> = {
    urgent: { color: '#ef4444', label: 'Urgente' },
    high: { color: '#f97316', label: 'Alta' },
    normal: { color: '#3b82f6', label: 'Normal' },
    low: { color: '#94a3b8', label: 'Baixa' }
  };

  return (
    <>
      <div className="flex-1 flex overflow-x-auto p-6 gap-6 bg-slate-100/70 items-start h-full">
        {effectiveStatuses.map(status => {
          const groupTasks = listTasks.filter(t => {
            if (t.status_id === status.id) return true;
            if (!effectiveStatuses.some(s => s.id === t.status_id) && status === effectiveStatuses[0]) return true;
            return false;
          });
          const isDraggingOver = dragOverStatusId === status.id;

          return (
            <div 
              key={status.id} 
              onDragOver={(e) => handleDragOver(e, status.id)}
              onDragLeave={(e) => handleDragLeave(e, status.id)}
              onDrop={(e) => handleDrop(e, status.id)}
              className={cn(
                "w-80 shrink-0 flex flex-col max-h-full rounded-2xl p-2 transition-all duration-200",
                isDraggingOver ? "bg-blue-50/80 ring-2 ring-blue-400 ring-dashed" : "bg-slate-200/50"
              )}
            >
              {/* Column Header */}
              <div className="flex items-center justify-between px-3 py-2 mb-2">
                <div className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: status.color }}
                  />
                  <h3 className="font-black text-slate-800 uppercase tracking-wider text-xs">
                    {status.name}
                  </h3>
                  <span className="px-1.5 py-0.5 rounded-full bg-slate-300/60 text-[10px] font-black text-slate-600">
                    {groupTasks.length}
                  </span>
                </div>
                
                <div className="relative flex items-center gap-1">
                  <button 
                    onClick={() => setNewTaskStatusId(status.id)}
                    className="p-1 hover:bg-slate-300/60 text-slate-500 rounded-lg transition-colors cursor-pointer"
                    title="Adicionar Tarefa"
                  >
                    <Plus size={16} />
                  </button>
                  <button 
                    onClick={() => setActiveMenuStatusId(activeMenuStatusId === status.id ? null : status.id)}
                    className="p-1 hover:bg-slate-300/60 text-slate-500 rounded-lg transition-colors cursor-pointer"
                  >
                    <MoreHorizontal size={16} />
                  </button>

                  {/* Status Options Dropdown */}
                  {activeMenuStatusId === status.id && (
                    <>
                      <div className="fixed inset-0 z-30" onClick={() => setActiveMenuStatusId(null)} />
                      <div className="absolute right-0 top-full mt-1 w-36 bg-white rounded-xl shadow-xl z-40 py-1 border border-slate-100">
                        <button
                          onClick={() => {
                            setActiveMenuStatusId(null);
                            const newName = window.prompt('Novo nome para a coluna:', status.name);
                            if (newName) updateStatus(status.id, { name: newName.toUpperCase() });
                          }}
                          className="w-full text-left px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50 font-medium flex items-center gap-2"
                        >
                          <Edit2 size={12} /> Renomear
                        </button>
                        <button
                          onClick={() => {
                            setActiveMenuStatusId(null);
                            if (window.confirm(`Excluir a coluna "${status.name}"?`)) {
                              deleteStatus(status.id);
                            }
                          }}
                          className="w-full text-left px-3 py-1.5 text-xs text-rose-600 hover:bg-rose-50 font-bold flex items-center gap-2"
                        >
                          <Trash2 size={12} /> Excluir
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Column Body / Cards */}
              <div className="flex-1 overflow-y-auto space-y-2.5 px-1 pb-2">
                {/* Inline New Task Input */}
                {newTaskStatusId === status.id && (
                  <div className="bg-white p-3 rounded-xl border-2 border-blue-500 shadow-md">
                    <input 
                      autoFocus
                      type="text"
                      placeholder="Nome do card (Enter para salvar)..."
                      value={newTaskName}
                      onChange={(e) => setNewTaskName(e.target.value)}
                      onKeyDown={(e) => handleAddTask(e, status.id)}
                      onBlur={() => {
                        if (!newTaskName.trim()) setNewTaskStatusId(null);
                      }}
                      className="w-full text-sm font-bold text-slate-800 outline-none placeholder:font-normal placeholder:text-slate-400"
                    />
                    <div className="flex justify-end gap-1 mt-2">
                      <button
                        onClick={() => setNewTaskStatusId(null)}
                        className="px-2 py-1 text-[11px] text-slate-500 hover:bg-slate-100 rounded cursor-pointer"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                )}

                {/* Cards List */}
                {groupTasks.map(task => {
                  const totalCheck = task.checklists?.length || 0;
                  const doneCheck = task.checklists?.filter(c => c.done).length || 0;
                  const commentsCount = task.comments?.length || 0;
                  const isOverdue = task.due_date && new Date(task.due_date).getTime() < Date.now();

                  return (
                    <div 
                      key={task.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, task.id)}
                      onClick={() => setSelectedTask(task)}
                      className={cn(
                        "bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs hover:shadow-md hover:border-slate-300 transition-all cursor-grab active:cursor-grabbing group relative",
                        draggedTaskId === task.id ? "opacity-40 scale-95" : "opacity-100"
                      )}
                    >
                      {/* Priority Flag & Tags Top Row */}
                      <div className="flex items-center justify-between gap-1 mb-2">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {task.priority && task.priority !== 'normal' && (
                            <span 
                              className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-md"
                              style={{ 
                                backgroundColor: `${priorityColors[task.priority].color}15`, 
                                color: priorityColors[task.priority].color 
                              }}
                            >
                              <Flag size={10} />
                              {priorityColors[task.priority].label}
                            </span>
                          )}
                          {(task.tags || []).slice(0, 2).map(tag => (
                            <span key={tag} className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-medium">
                              #{tag}
                            </span>
                          ))}
                        </div>

                        {task.team && (
                          <span 
                            className="text-[10px] font-black px-1.5 py-0.5 rounded-md truncate max-w-[100px]"
                            style={{ 
                              backgroundColor: `${task.team.color || '#3b82f6'}15`, 
                              color: task.team.color || '#3b82f6' 
                            }}
                          >
                            {task.team.name}
                          </span>
                        )}
                      </div>

                      {/* Card Title */}
                      <p className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors leading-snug">
                        {task.name}
                      </p>

                      {/* Card Description Preview */}
                      {task.description && (
                        <p className="text-xs text-slate-500 line-clamp-2 mt-1 leading-relaxed">
                          {task.description}
                        </p>
                      )}

                      {/* Bottom Meta Row */}
                      <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
                        <div className="flex items-center gap-3">
                          {/* Due Date */}
                          {task.due_date && (
                            <span className={cn(
                              "inline-flex items-center gap-1 font-bold text-[11px] px-1.5 py-0.5 rounded-md",
                              isOverdue ? "bg-rose-50 text-rose-600" : "text-slate-500"
                            )}>
                              <CalendarIcon size={12} />
                              {format(new Date(task.due_date), "dd/MM")}
                            </span>
                          )}

                          {/* Checklist Progress */}
                          {totalCheck > 0 && (
                            <span className={cn(
                              "inline-flex items-center gap-1 text-[11px] font-bold",
                              doneCheck === totalCheck ? "text-emerald-600" : "text-slate-500"
                            )}>
                              <CheckSquare size={12} />
                              {doneCheck}/{totalCheck}
                            </span>
                          )}

                          {/* Comments Count */}
                          {commentsCount > 0 && (
                            <span className="inline-flex items-center gap-1 text-[11px] text-slate-500 font-medium">
                              <MessageSquare size={12} />
                              {commentsCount}
                            </span>
                          )}
                        </div>

                        {/* Assignee Avatar */}
                        {task.assignee_user ? (
                          <img 
                            src={task.assignee_user.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'} 
                            alt={task.assignee_user.name}
                            title={task.assignee_user.name}
                            className="w-6 h-6 rounded-full object-cover ring-2 ring-white shrink-0"
                          />
                        ) : task.assignee ? (
                          <div 
                            title={task.assignee}
                            className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 font-black text-[10px] flex items-center justify-center ring-2 ring-white shrink-0"
                          >
                            {task.assignee.charAt(0).toUpperCase()}
                          </div>
                        ) : null}
                      </div>
                    </div>
                  );
                })}

                {/* Quick Add Button at bottom of column */}
                {!newTaskStatusId && (
                  <button 
                    onClick={() => setNewTaskStatusId(status.id)}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-slate-500 hover:text-slate-800 hover:bg-white/80 rounded-xl transition-all cursor-pointer"
                  >
                    <Plus size={15} /> Adicionar card
                  </button>
                )}
              </div>
            </div>
          );
        })}

        {/* Add Status Column Button */}
        <div className="w-72 shrink-0">
          {isAddingStatus ? (
            <form onSubmit={handleCreateStatus} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Nova Etapa / Coluna</h4>
              <input 
                autoFocus
                type="text"
                placeholder="Ex: EM REVISÃO..."
                value={newStatusName}
                onChange={(e) => setNewStatusName(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:border-blue-500 outline-none text-slate-800 font-bold"
              />
              <div className="flex items-center gap-2">
                <label className="text-[11px] text-slate-500 font-medium">Cor:</label>
                {['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#ef4444', '#64748b'].map(c => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setNewStatusColor(c)}
                    className={cn(
                      "w-5 h-5 rounded-full transition-transform cursor-pointer",
                      newStatusColor === c ? "scale-125 ring-2 ring-slate-400" : "hover:scale-110"
                    )}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
              <div className="flex items-center gap-2 pt-1">
                <button 
                  type="submit" 
                  disabled={!newStatusName.trim()}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
                >
                  Adicionar
                </button>
                <button 
                  type="button" 
                  onClick={() => setIsAddingStatus(false)}
                  className="px-2.5 py-1.5 text-slate-500 hover:bg-slate-100 rounded-lg text-xs cursor-pointer"
                >
                  Cancelar
                </button>
              </div>
            </form>
          ) : (
            <button 
              onClick={() => setIsAddingStatus(true)}
              className="w-full flex items-center justify-center gap-2 px-4 py-3.5 text-xs font-bold text-slate-500 bg-slate-200/60 hover:bg-slate-200 rounded-2xl transition-colors cursor-pointer"
            >
              <Plus size={16} /> Adicionar Coluna
            </button>
          )}
        </div>
      </div>

      {/* Task Modal Drawer */}
      <WorkspaceTaskModal 
        task={selectedTask}
        onClose={() => setSelectedTask(null)}
      />
    </>
  );
}
