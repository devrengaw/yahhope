import React, { useState } from 'react';
import { useClickUp } from '../../contexts/ClickUpContext';
import { Plus, MoreHorizontal, Calendar as CalendarIcon, AlignLeft } from 'lucide-react';
import { cn } from '../../lib/utils';

export function WorkspaceBoardView() {
  const { lists, statuses, tasks, activeList, addTask } = useClickUp();
  const [newTaskStatusId, setNewTaskStatusId] = useState<string | null>(null);
  const [newTaskName, setNewTaskName] = useState('');

  if (!activeList) return null;

  const listStatuses = statuses.filter(s => s.list_id === activeList).sort((a, b) => a.order_index - b.order_index);
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

  return (
    <div className="flex-1 flex overflow-x-auto p-6 gap-6 bg-slate-50 items-start h-full">
      {listStatuses.map(status => {
        const groupTasks = listTasks.filter(t => t.status_id === status.id);

        return (
          <div key={status.id} className="w-80 shrink-0 flex flex-col max-h-full">
            {/* Column Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div 
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: status.color }}
                />
                <h3 className="font-bold text-slate-700 uppercase tracking-wider text-xs">{status.name}</h3>
                <span className="text-xs font-bold text-slate-400">{groupTasks.length}</span>
              </div>
              <div className="flex items-center gap-1">
                <button 
                  onClick={() => setNewTaskStatusId(status.id)}
                  className="p-1 hover:bg-slate-200 text-slate-400 rounded transition-colors"
                >
                  <Plus size={16} />
                </button>
                <button className="p-1 hover:bg-slate-200 text-slate-400 rounded transition-colors">
                  <MoreHorizontal size={16} />
                </button>
              </div>
            </div>

            {/* Column Body / Cards */}
            <div className="flex-1 overflow-y-auto space-y-3 pb-4">
              {newTaskStatusId === status.id && (
                <div className="bg-white p-3 rounded-xl border border-blue-500 shadow-sm">
                  <input 
                    autoFocus
                    type="text"
                    placeholder="Nome da tarefa..."
                    value={newTaskName}
                    onChange={(e) => setNewTaskName(e.target.value)}
                    onKeyDown={(e) => handleAddTask(e, status.id)}
                    onBlur={() => setNewTaskStatusId(null)}
                    className="w-full text-sm font-medium text-slate-800 outline-none"
                  />
                </div>
              )}

              {groupTasks.map(task => (
                <div 
                  key={task.id} 
                  className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow cursor-grab group"
                >
                  <div className="flex justify-between items-start mb-2">
                    <p className="text-sm font-bold text-slate-800">{task.name}</p>
                    <button className="opacity-0 group-hover:opacity-100 p-1 hover:bg-slate-100 rounded text-slate-400 transition-opacity">
                      <MoreHorizontal size={14} />
                    </button>
                  </div>
                  
                  {task.description && (
                    <div className="flex items-center gap-1 text-slate-400 mb-3">
                      <AlignLeft size={14} />
                    </div>
                  )}

                  {task.due_date && (
                    <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-rose-50 text-rose-600 text-[10px] font-bold mt-2">
                      <CalendarIcon size={12} />
                      {new Date(task.due_date).toLocaleDateString()}
                    </div>
                  )}
                  
                  <div className="mt-3 flex items-center justify-between">
                    <div className="flex -space-x-1">
                      {/* Placeholder para assignees se houver */}
                      {task.assignee ? (
                        <div className="w-6 h-6 rounded-full bg-blue-100 border-2 border-white flex items-center justify-center text-[10px] font-bold text-blue-700">
                          {task.assignee.charAt(0)}
                        </div>
                      ) : (
                        <div className="w-6 h-6 rounded-full border-2 border-dashed border-slate-300 flex items-center justify-center text-slate-300 hover:text-slate-500 hover:border-slate-500 transition-colors cursor-pointer">
                          <Plus size={12} />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {!newTaskStatusId && (
                <button 
                  onClick={() => setNewTaskStatusId(status.id)}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <Plus size={16} /> Nova Tarefa
                </button>
              )}
            </div>
          </div>
        );
      })}

      <div className="w-80 shrink-0">
        <button className="w-full flex items-center gap-2 px-4 py-3 text-sm font-bold text-slate-400 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors">
          <Plus size={16} /> Adicionar Status
        </button>
      </div>
    </div>
  );
}
