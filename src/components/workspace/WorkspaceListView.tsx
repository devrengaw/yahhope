import React, { useState } from 'react';
import { useClickUp } from '../../contexts/ClickUpContext';
import { 
  ChevronDown, ChevronRight, Plus, CheckCircle2, 
  Circle, GripVertical, Filter, Settings2, Columns, Search
} from 'lucide-react';
import { cn } from '../../lib/utils';

export function WorkspaceListView() {
  const { lists, statuses, fields, tasks, activeList, updateTaskStatus } = useClickUp();
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});

  const toggleGroup = (statusId: string) => {
    setCollapsedGroups(prev => ({ ...prev, [statusId]: !prev[statusId] }));
  };

  if (!activeList) return null;

  const currentList = lists.find(l => l.id === activeList);
  const listStatuses = statuses.filter(s => s.list_id === activeList).sort((a, b) => a.order_index - b.order_index);
  const listFields = fields.filter(f => f.list_id === activeList);
  const listTasks = tasks.filter(t => t.list_id === activeList);

  return (
    <div className="flex flex-col h-full bg-white relative pb-20">
      {/* Top Toolbar */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-slate-100 sticky top-0 bg-white z-10">
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-2 px-3 py-1.5 text-xs font-bold text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors">
            <CheckCircle2 size={14} /> Status
          </button>
          <button className="flex items-center gap-2 px-3 py-1.5 text-xs font-bold text-slate-600 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
            Separar
          </button>
          <div className="w-px h-4 bg-slate-200 mx-1"></div>
          <button className="p-1.5 text-slate-400 hover:text-slate-800 rounded-lg transition-colors">
            <Columns size={16} />
          </button>
        </div>
        <div className="flex items-center gap-3">
          <button className="p-1.5 text-slate-400 hover:text-slate-800 rounded-lg transition-colors">
            <Filter size={16} />
          </button>
          <button className="p-1.5 text-slate-400 hover:text-slate-800 rounded-lg transition-colors">
            <Settings2 size={16} />
          </button>
          <button className="p-1.5 text-slate-400 hover:text-slate-800 rounded-lg transition-colors">
            <Search size={16} />
          </button>
          <button className="flex items-center gap-2 px-4 py-1.5 text-xs font-bold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors shadow-sm">
            <Plus size={14} /> Tarefa
          </button>
        </div>
      </div>

      {/* Table Content */}
      <div className="flex-1 overflow-x-auto min-w-max px-6 py-4">
        {listStatuses.map(status => {
          const groupTasks = listTasks.filter(t => t.status_id === status.id);
          const isCollapsed = collapsedGroups[status.id];

          return (
            <div key={status.id} className="mb-8">
              {/* Group Header */}
              <div className="flex items-center gap-3 mb-2 sticky left-0">
                <button 
                  onClick={() => toggleGroup(status.id)}
                  className="w-5 h-5 flex items-center justify-center text-slate-400 hover:bg-slate-100 rounded transition-colors"
                >
                  {isCollapsed ? <ChevronRight size={16} /> : <ChevronDown size={16} />}
                </button>
                <div 
                  className="flex items-center gap-2 px-2.5 py-1 rounded text-xs font-black tracking-widest uppercase text-white shadow-sm"
                  style={{ backgroundColor: status.color }}
                >
                  {status.name}
                </div>
                <span className="text-xs font-bold text-slate-400">{groupTasks.length}</span>
              </div>

              {!isCollapsed && (
                <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm bg-white">
                  {/* Table Header */}
                  <div className="flex items-center border-b border-slate-200 bg-slate-50/50">
                    <div className="w-12 shrink-0 border-r border-slate-200 h-10"></div>
                    <div className="w-80 shrink-0 border-r border-slate-200 px-4 py-2.5 text-[11px] font-black uppercase text-slate-400 tracking-wider">
                      Nome
                    </div>
                    {listFields.map(field => (
                      <div key={field.id} className="w-40 shrink-0 border-r border-slate-200 px-4 py-2.5 text-[11px] font-black uppercase text-slate-400 tracking-wider">
                        {field.name}
                      </div>
                    ))}
                    <div className="w-16 shrink-0 flex items-center justify-center text-slate-400 hover:bg-slate-100 cursor-pointer transition-colors">
                      <Plus size={14} />
                    </div>
                  </div>

                  {/* Table Body (Tasks) */}
                  <div className="divide-y divide-slate-100">
                    {groupTasks.length === 0 ? (
                      <div className="flex items-center px-12 py-3 text-sm font-medium text-slate-400 hover:bg-slate-50 cursor-pointer group transition-colors">
                        <Plus size={14} className="mr-2 opacity-0 group-hover:opacity-100" /> Adicionar Tarefa
                      </div>
                    ) : (
                      groupTasks.map(task => (
                        <div key={task.id} className="flex items-center hover:bg-slate-50 transition-colors group">
                          {/* Status / Drag Handle */}
                          <div className="w-12 shrink-0 border-r border-slate-100 h-11 flex items-center justify-center gap-1">
                            <GripVertical size={14} className="text-slate-300 opacity-0 group-hover:opacity-100 cursor-grab" />
                            <div 
                              className="w-3 h-3 rounded-[3px] cursor-pointer ring-2 ring-transparent hover:ring-slate-200 transition-all"
                              style={{ backgroundColor: status.color }}
                            ></div>
                          </div>
                          
                          {/* Task Name */}
                          <div className="w-80 shrink-0 border-r border-slate-100 px-4 py-3 text-sm font-medium text-slate-800 truncate flex items-center gap-2 group/name cursor-pointer">
                            {task.name}
                            <button className="opacity-0 group-hover/name:opacity-100 text-slate-400 hover:text-blue-600 transition-opacity">
                              <span className="text-[10px] font-bold uppercase tracking-wider bg-slate-100 px-1.5 py-0.5 rounded">Abrir</span>
                            </button>
                          </div>
                          
                          {/* Custom Fields */}
                          {listFields.map(field => (
                            <div key={field.id} className="w-40 shrink-0 border-r border-slate-100 px-4 py-3 text-sm text-slate-600 truncate">
                              {task.custom_values?.[field.id] || '-'}
                            </div>
                          ))}
                          
                          <div className="w-16 shrink-0 h-11"></div>
                        </div>
                      ))
                    )}
                  </div>
                  
                  {/* Add task row at bottom of group if there are tasks */}
                  {groupTasks.length > 0 && (
                    <div className="flex items-center px-12 py-2 text-xs font-bold text-slate-400 hover:text-slate-600 hover:bg-slate-50 cursor-pointer transition-colors border-t border-slate-100">
                      <Plus size={12} className="mr-1.5" /> Adicionar Tarefa
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}

        <button className="flex items-center gap-2 text-sm font-bold text-slate-400 hover:text-slate-600 mt-4 transition-colors">
          <Plus size={16} /> Novo status
        </button>
      </div>
    </div>
  );
}
