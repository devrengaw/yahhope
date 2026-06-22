import React from 'react';
import { useClickUp } from '../../contexts/ClickUpContext';
import { useAuth } from '../../contexts/AuthContext';
import { CheckSquare, Calendar, AlignLeft, CheckCircle2 } from 'lucide-react';

export function MyTasksView() {
  const { tasks, lists, statuses } = useClickUp();
  const { user } = useAuth();

  // Find tasks assigned to the current user
  const myTasks = tasks.filter(t => t.assignee === user?.id);

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-50 p-8 overflow-auto">
      <div className="max-w-4xl mx-auto w-full space-y-6">
        
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-600 text-white rounded-xl flex items-center justify-center">
              <CheckSquare size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-800">Minhas Tarefas</h1>
              <p className="text-slate-500">Acompanhe tudo o que foi atribuído a você.</p>
            </div>
          </div>
        </div>

        {myTasks.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
            <div className="w-16 h-16 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 size={32} />
            </div>
            <h3 className="text-lg font-bold text-slate-800 mb-2">Você está em dia!</h3>
            <p className="text-slate-500">Nenhuma tarefa foi atribuída a você no momento.</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden divide-y divide-slate-100">
            {myTasks.map(task => {
              const list = lists.find(l => l.id === task.list_id);
              const status = statuses.find(s => s.id === task.status_id);

              return (
                <div key={task.id} className="flex items-center p-4 hover:bg-slate-50 transition-colors group">
                  <div className="flex-1 flex flex-col justify-center">
                    <p className="text-sm font-bold text-slate-800 group-hover:text-blue-600 transition-colors">
                      {task.name}
                    </p>
                    <div className="flex items-center gap-3 mt-1.5 text-xs text-slate-500 font-medium">
                      {list && <span className="bg-slate-100 px-2 py-0.5 rounded">{list.name}</span>}
                      {task.description && (
                        <span className="flex items-center gap-1"><AlignLeft size={12} /> Detalhes</span>
                      )}
                      {task.due_date && (
                        <span className="flex items-center gap-1 text-rose-600 bg-rose-50 px-2 py-0.5 rounded">
                          <Calendar size={12} /> {new Date(task.due_date).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  {status && (
                    <div className="shrink-0 flex items-center">
                      <span 
                        className="px-3 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider"
                        style={{ backgroundColor: `${status.color}20`, color: status.color }}
                      >
                        {status.name}
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
