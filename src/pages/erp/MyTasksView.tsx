import React, { useState } from 'react';
import { useClickUp, CU_Task } from '../../contexts/ClickUpContext';
import { useAuth } from '../../contexts/AuthContext';
import { 
  CheckSquare, Calendar as CalendarIcon, AlignLeft, CheckCircle2, 
  Clock, Flag, AlertCircle, Sparkles
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { WorkspaceTaskModal } from '../../components/workspace/WorkspaceTaskModal';
import { cn } from '../../lib/utils';

export function MyTasksView() {
  const { tasks, lists, statuses, selectedTask, setSelectedTask } = useClickUp();
  const { user } = useAuth();

  // Find tasks assigned to the current user (smart matching by id, email or name, or fallback if admin)
  const myTasks = tasks.filter(t => {
    if (!user) return false;
    const isAssigned = t.assignee_id === user.id || 
                       t.assignee === user.id || 
                       t.assignee === user.name ||
                       (user.email && t.assignee_user?.email === user.email);
    // If admin and no tasks directly assigned, show tasks where user is assignee or all tasks with assignee
    return isAssigned;
  });

  // Fallback for demo if no tasks assigned yet
  const displayedTasks = myTasks.length > 0 ? myTasks : tasks.slice(0, 5);

  const now = Date.now();
  const overdueTasks = displayedTasks.filter(t => {
    const isDone = statuses.find(s => s.id === t.status_id)?.name.includes('CONCLU');
    return !isDone && t.due_date && new Date(t.due_date).getTime() < now;
  });

  const pendingTasks = displayedTasks.filter(t => {
    const isDone = statuses.find(s => s.id === t.status_id)?.name.includes('CONCLU');
    const isOverdue = t.due_date && new Date(t.due_date).getTime() < now;
    return !isDone && !isOverdue;
  });

  const completedTasks = displayedTasks.filter(t => {
    const isDone = statuses.find(s => s.id === t.status_id)?.name.includes('CONCLU');
    return isDone;
  });

  const renderTaskRow = (task: CU_Task) => {
    const list = lists.find(l => l.id === task.list_id);
    const status = statuses.find(s => s.id === task.status_id);
    const totalCheck = task.checklists?.length || 0;
    const doneCheck = task.checklists?.filter(c => c.done).length || 0;
    const isOverdue = task.due_date && new Date(task.due_date).getTime() < now;

    return (
      <div 
        key={task.id} 
        onClick={() => setSelectedTask(task)}
        className="flex items-center justify-between p-4 hover:bg-slate-50/80 transition-colors cursor-pointer group"
      >
        <div className="flex-1 flex flex-col justify-center min-w-0 pr-4">
          <p className="text-sm font-bold text-slate-800 group-hover:text-blue-600 transition-colors truncate">
            {task.name}
          </p>
          <div className="flex flex-wrap items-center gap-2 mt-1.5 text-xs text-slate-500 font-medium">
            {list && (
              <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-[10px] font-bold">
                {list.name}
              </span>
            )}
            {task.team && (
              <span 
                className="text-[10px] font-bold px-1.5 py-0.5 rounded"
                style={{ backgroundColor: `${task.team.color || '#3b82f6'}15`, color: task.team.color || '#3b82f6' }}
              >
                {task.team.name}
              </span>
            )}
            {totalCheck > 0 && (
              <span className="flex items-center gap-1 text-[11px] text-slate-500">
                <CheckSquare size={12} /> {doneCheck}/{totalCheck}
              </span>
            )}
            {task.due_date && (
              <span className={cn(
                "flex items-center gap-1 text-[11px] px-1.5 py-0.5 rounded font-bold",
                isOverdue ? "text-rose-600 bg-rose-50" : "text-slate-600 bg-slate-100"
              )}>
                <CalendarIcon size={12} /> {format(new Date(task.due_date), "dd/MM")}
              </span>
            )}
          </div>
        </div>
        
        {status && (
          <div className="shrink-0 flex items-center">
            <span 
              className="px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider shadow-2xs"
              style={{ backgroundColor: `${status.color}20`, color: status.color }}
            >
              {status.name}
            </span>
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      <div className="flex-1 flex flex-col h-full bg-slate-50 p-6 sm:p-8 overflow-y-auto">
        <div className="max-w-4xl mx-auto w-full space-y-6">
          
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-600 text-white rounded-2xl flex items-center justify-center shadow-xs">
                <CheckSquare size={24} />
              </div>
              <div>
                <h1 className="text-2xl font-black text-slate-900">Minhas Tarefas</h1>
                <p className="text-sm text-slate-500">
                  Acompanhe e gerencie tudo o que foi atribuído a você ou à sua equipe.
                </p>
              </div>
            </div>
          </div>

          {displayedTasks.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
              <div className="w-16 h-16 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 size={32} />
              </div>
              <h3 className="text-lg font-bold text-slate-800 mb-2">Você está em dia!</h3>
              <p className="text-slate-500 text-sm">Nenhuma tarefa pendente atribuída a você no momento.</p>
            </div>
          ) : (
            <div className="space-y-6">
              
              {/* Overdue Section */}
              {overdueTasks.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-rose-600">
                    <AlertCircle size={15} /> Atrasadas ({overdueTasks.length})
                  </div>
                  <div className="bg-white rounded-2xl border border-rose-200/80 shadow-xs overflow-hidden divide-y divide-slate-100">
                    {overdueTasks.map(renderTaskRow)}
                  </div>
                </div>
              )}

              {/* Pending / Active Section */}
              {pendingTasks.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-slate-600">
                    <Clock size={15} className="text-blue-600" /> Em Andamento & Próximas ({pendingTasks.length})
                  </div>
                  <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden divide-y divide-slate-100">
                    {pendingTasks.map(renderTaskRow)}
                  </div>
                </div>
              )}

              {/* Completed Section */}
              {completedTasks.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-emerald-600">
                    <CheckCircle2 size={15} /> Concluídas ({completedTasks.length})
                  </div>
                  <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden divide-y divide-slate-100 opacity-80">
                    {completedTasks.map(renderTaskRow)}
                  </div>
                </div>
              )}

            </div>
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
