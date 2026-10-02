import React, { useState } from 'react';
import { useClickUp, TaskPriority } from '../../contexts/ClickUpContext';
import { 
  ChevronDown, ChevronRight, Plus, CheckCircle2, 
  Calendar as CalendarIcon, Flag, CheckSquare, MessageSquare, 
  Search, Filter, Layers, User as UserIcon
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { format } from 'date-fns';
import { WorkspaceTaskModal } from './WorkspaceTaskModal';

export function WorkspaceListView() {
  const { 
    statuses, tasks, activeList, 
    addTask, addStatus, updateTask,
    selectedTask, setSelectedTask 
  } = useClickUp();

  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});
  const [newTaskStatusId, setNewTaskStatusId] = useState<string | null>(null);
  const [newTaskName, setNewTaskName] = useState('');
  const [searchFilter, setSearchFilter] = useState('');

  const toggleGroup = (statusId: string) => {
    setCollapsedGroups(prev => ({ ...prev, [statusId]: !prev[statusId] }));
  };

  const handleAddTask = async (e: React.KeyboardEvent, statusId: string) => {
    if (e.key === 'Enter' && newTaskName.trim()) {
      await addTask(activeList!, newTaskName.trim(), statusId);
      setNewTaskName('');
      setNewTaskStatusId(null);
    } else if (e.key === 'Escape') {
      setNewTaskName('');
      setNewTaskStatusId(null);
    }
  };

  if (!activeList) return null;

  const listStatuses = statuses.filter(s => s.list_id === activeList).sort((a, b) => a.order_index - b.order_index);
  const effectiveStatuses = listStatuses.length > 0 ? listStatuses : [
    { id: `default-todo-${activeList}`, list_id: activeList, name: 'A FAZER', color: '#94a3b8', order_index: 0 },
    { id: `default-progress-${activeList}`, list_id: activeList, name: 'EM ANDAMENTO', color: '#3b82f6', order_index: 1 },
    { id: `default-done-${activeList}`, list_id: activeList, name: 'CONCLUÍDO', color: '#10b981', order_index: 2 }
  ];
  const listTasks = tasks.filter(t => {
    if (t.list_id !== activeList) return false;
    if (searchFilter.trim()) {
      return t.name.toLowerCase().includes(searchFilter.toLowerCase().trim()) ||
             t.description?.toLowerCase().includes(searchFilter.toLowerCase().trim());
    }
    return true;
  });

  const priorityConfig: Record<TaskPriority, { label: string; color: string }> = {
    urgent: { label: 'Urgente', color: '#ef4444' },
    high: { label: 'Alta', color: '#f97316' },
    normal: { label: 'Normal', color: '#3b82f6' },
    low: { label: 'Baixa', color: '#94a3b8' }
  };

  return (
    <>
      <div className="flex flex-col h-full bg-white relative pb-20 overflow-y-auto">
        {/* Top Toolbar */}
        <div className="flex items-center justify-between px-6 py-3 border-b border-slate-100 sticky top-0 bg-white/90 backdrop-blur-xs z-10">
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="text"
                placeholder="Filtrar tarefas..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:border-blue-500 outline-none text-slate-700 w-48 sm:w-64"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button 
              onClick={() => {
                if (listStatuses[0]) setNewTaskStatusId(listStatuses[0].id);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors shadow-xs cursor-pointer"
            >
              <Plus size={14} /> Nova Tarefa
            </button>
          </div>
        </div>

        {/* Groups of Statuses */}
        <div className="p-6 space-y-6">
          {effectiveStatuses.map(status => {
            const groupTasks = listTasks.filter(t => {
              if (t.status_id === status.id) return true;
              if (!effectiveStatuses.some(s => s.id === t.status_id) && status === effectiveStatuses[0]) return true;
              return false;
            });
            const isCollapsed = collapsedGroups[status.id];

            return (
              <div key={status.id} className="border border-slate-200/80 rounded-2xl overflow-hidden shadow-xs">
                {/* Status Group Header */}
                <div 
                  onClick={() => toggleGroup(status.id)}
                  className="flex items-center justify-between px-4 py-2.5 bg-slate-50 hover:bg-slate-100/80 transition-colors cursor-pointer select-none border-b border-slate-200/60"
                >
                  <div className="flex items-center gap-2.5">
                    <button className="text-slate-400 hover:text-slate-700">
                      {isCollapsed ? <ChevronRight size={16} /> : <ChevronDown size={16} />}
                    </button>
                    <span 
                      className="px-2.5 py-0.5 rounded-md text-xs font-black uppercase tracking-wider text-white shadow-xs"
                      style={{ backgroundColor: status.color }}
                    >
                      {status.name}
                    </span>
                    <span className="text-xs font-bold text-slate-400">
                      {groupTasks.length} {groupTasks.length === 1 ? 'tarefa' : 'tarefas'}
                    </span>
                  </div>

                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setNewTaskStatusId(status.id);
                    }}
                    className="p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                    title="Adicionar Tarefa neste status"
                  >
                    <Plus size={16} />
                  </button>
                </div>

                {/* Table Rows */}
                {!isCollapsed && (
                  <div className="divide-y divide-slate-100">
                    {/* Header Row */}
                    <div className="grid grid-cols-12 gap-3 px-4 py-2 text-[10px] font-black uppercase tracking-wider text-slate-400 bg-slate-50/40">
                      <div className="col-span-5 sm:col-span-5">Nome da Tarefa</div>
                      <div className="col-span-2 hidden sm:block">Responsável</div>
                      <div className="col-span-2 hidden md:block">Equipe</div>
                      <div className="col-span-2 sm:col-span-2">Prioridade</div>
                      <div className="col-span-3 sm:col-span-1 text-right sm:text-left">Prazo</div>
                    </div>

                    {/* Task Rows */}
                    {groupTasks.map(task => {
                      const totalCheck = task.checklists?.length || 0;
                      const doneCheck = task.checklists?.filter(c => c.done).length || 0;
                      const isOverdue = task.due_date && new Date(task.due_date).getTime() < Date.now();

                      return (
                        <div 
                          key={task.id}
                          onClick={() => setSelectedTask(task)}
                          className="grid grid-cols-12 gap-3 px-4 py-3 items-center hover:bg-blue-50/30 transition-colors cursor-pointer group"
                        >
                          {/* Name + Subtask/Comments indicator */}
                          <div className="col-span-5 sm:col-span-5 flex items-center gap-2 min-w-0">
                            <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: status.color }} />
                            <div className="min-w-0">
                              <p className="text-sm font-bold text-slate-800 group-hover:text-blue-600 transition-colors truncate">
                                {task.name}
                              </p>
                              <div className="flex items-center gap-2 mt-0.5 text-[10px] text-slate-400">
                                {totalCheck > 0 && (
                                  <span className="flex items-center gap-1 font-semibold text-slate-500">
                                    <CheckSquare size={11} /> {doneCheck}/{totalCheck}
                                  </span>
                                )}
                                {(task.comments || []).length > 0 && (
                                  <span className="flex items-center gap-1">
                                    <MessageSquare size={11} /> {task.comments.length}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Assignee */}
                          <div className="col-span-2 hidden sm:flex items-center gap-2 min-w-0">
                            {task.assignee_user ? (
                              <>
                                <img 
                                  src={task.assignee_user.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'} 
                                  alt={task.assignee_user.name}
                                  className="w-5 h-5 rounded-full object-cover shrink-0" 
                                />
                                <span className="text-xs text-slate-700 font-medium truncate">{task.assignee_user.name}</span>
                              </>
                            ) : (
                              <span className="text-xs text-slate-300 italic flex items-center gap-1">
                                <UserIcon size={12} /> Sem resp.
                              </span>
                            )}
                          </div>

                          {/* Team */}
                          <div className="col-span-2 hidden md:flex items-center min-w-0">
                            {task.team ? (
                              <span 
                                className="text-[10px] font-bold px-2 py-0.5 rounded-md truncate"
                                style={{ backgroundColor: `${task.team.color || '#3b82f6'}15`, color: task.team.color || '#3b82f6' }}
                              >
                                {task.team.name}
                              </span>
                            ) : (
                              <span className="text-xs text-slate-300">-</span>
                            )}
                          </div>

                          {/* Priority */}
                          <div className="col-span-2 sm:col-span-2 flex items-center gap-1">
                            <span 
                              className="inline-flex items-center gap-1 text-[11px] font-bold"
                              style={{ color: priorityConfig[task.priority || 'normal'].color }}
                            >
                              <Flag size={11} />
                              {priorityConfig[task.priority || 'normal'].label}
                            </span>
                          </div>

                          {/* Due Date */}
                          <div className="col-span-3 sm:col-span-1 text-right sm:text-left">
                            {task.due_date ? (
                              <span className={cn(
                                "text-xs font-semibold",
                                isOverdue ? "text-rose-600 font-bold" : "text-slate-500"
                              )}>
                                {format(new Date(task.due_date), "dd/MM")}
                              </span>
                            ) : (
                              <span className="text-xs text-slate-300">-</span>
                            )}
                          </div>
                        </div>
                      );
                    })}

                    {/* Inline Task Creation */}
                    {newTaskStatusId === status.id && (
                      <div className="p-3 bg-blue-50/40 border-t border-blue-200">
                        <input 
                          autoFocus
                          type="text"
                          placeholder="Digite o título da tarefa e pressione Enter..."
                          value={newTaskName}
                          onChange={(e) => setNewTaskName(e.target.value)}
                          onKeyDown={(e) => handleAddTask(e, status.id)}
                          onBlur={() => {
                            if (!newTaskName.trim()) setNewTaskStatusId(null);
                          }}
                          className="w-full px-3 py-2 text-sm bg-white rounded-xl border border-blue-400 outline-none text-slate-800 shadow-xs"
                        />
                      </div>
                    )}

                    {/* Bottom Add Task Link */}
                    {newTaskStatusId !== status.id && (
                      <div 
                        onClick={() => setNewTaskStatusId(status.id)}
                        className="px-4 py-2 text-xs font-bold text-slate-400 hover:text-blue-600 hover:bg-slate-50 cursor-pointer flex items-center gap-2 transition-colors"
                      >
                        <Plus size={14} /> Adicionar tarefa
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
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
