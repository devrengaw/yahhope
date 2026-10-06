import React, { useState, useMemo } from 'react';
import { useClickUp, CU_Task, TaskPriority } from '../../contexts/ClickUpContext';
import { useAuth } from '../../contexts/AuthContext';
import { 
  CheckSquare, Calendar as CalendarIcon, CheckCircle2, 
  Clock, Flag, AlertCircle, Plus, Search, User as UserIcon,
  Filter, Layers, ArrowUpDown, Sparkles
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { WorkspaceTaskModal } from '../../components/workspace/WorkspaceTaskModal';
import { CreateWorkspaceTaskModal } from '../../components/workspace/CreateWorkspaceTaskModal';
import { cn } from '../../lib/utils';

type TaskTab = 'assigned_to_me' | 'created_by_me' | 'all';
type StatusFilter = 'all' | 'pending' | 'overdue' | 'completed';

export function MyTasksView() {
  const { tasks, lists, spaces, statuses, systemUsers, selectedTask, setSelectedTask } = useClickUp();
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState<TaskTab>('assigned_to_me');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAssigneeFilter, setSelectedAssigneeFilter] = useState<string>('all');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Helper to determine if a task is assigned to the current user
  const isAssignedToCurrentUser = (t: CU_Task) => {
    if (!user) return false;
    const uId = String(user.id || '').toLowerCase().trim();
    const uEmail = String(user.email || '').toLowerCase().trim();
    const uName = String(user.name || '').toLowerCase().trim();

    const tAssigneeId = String(t.assignee_id || '').toLowerCase().trim();
    const tAssignee = String(t.assignee || '').toLowerCase().trim();
    const tUserEmail = String(t.assignee_user?.email || '').toLowerCase().trim();
    const tUserId = String(t.assignee_user?.id || '').toLowerCase().trim();
    const tUserName = String(t.assignee_user?.name || '').toLowerCase().trim();

    return (
      (uId && (tAssigneeId === uId || tAssignee === uId || tUserId === uId)) ||
      (uEmail && (tAssignee === uEmail || tUserEmail === uEmail)) ||
      (uName && (tAssignee === uName || tUserName === uName))
    );
  };

  // Helper to determine if a task was created by the current user
  const isCreatedByCurrentUser = (t: CU_Task) => {
    if (!user) return false;
    const uId = String(user.id || '').toLowerCase().trim();
    const uEmail = String(user.email || '').toLowerCase().trim();
    const uName = String(user.name || '').toLowerCase().trim();

    const tCreator = String(t.created_by || '').toLowerCase().trim();
    if (!tCreator) return false;

    return (
      (uId && tCreator === uId) ||
      (uEmail && tCreator === uEmail) ||
      (uName && tCreator === uName)
    );
  };

  // Counts for each tab
  const assignedToMeCount = useMemo(() => tasks.filter(isAssignedToCurrentUser).length, [tasks, user]);
  const createdByMeCount = useMemo(() => tasks.filter(isCreatedByCurrentUser).length, [tasks, user]);
  const allTasksCount = tasks.length;

  // Filter tasks based on activeTab
  const tabTasks = useMemo(() => {
    if (activeTab === 'assigned_to_me') {
      return tasks.filter(isAssignedToCurrentUser);
    }
    if (activeTab === 'created_by_me') {
      return tasks.filter(isCreatedByCurrentUser);
    }
    return tasks;
  }, [tasks, activeTab, user]);

  // Apply search and filters
  const now = Date.now();
  const displayedTasks = useMemo(() => {
    return tabTasks.filter(t => {
      // Search filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchesName = t.name.toLowerCase().includes(query);
        const matchesDesc = t.description?.toLowerCase().includes(query);
        if (!matchesName && !matchesDesc) return false;
      }

      // Assignee filter (when on "all" tab or specified)
      if (selectedAssigneeFilter !== 'all') {
        const matchesAssignee = t.assignee_id === selectedAssigneeFilter || t.assignee === selectedAssigneeFilter;
        if (!matchesAssignee) return false;
      }

      const st = statuses.find(s => s.id === t.status_id);
      const isDone = st?.name.includes('CONCLU') || st?.name.includes('FINALIZ') || st?.name.includes('PUBLICADO');
      const isOverdue = !isDone && t.due_date && new Date(t.due_date).getTime() < now;

      // Status filter
      if (statusFilter === 'pending' && (isDone || isOverdue)) return false;
      if (statusFilter === 'overdue' && !isOverdue) return false;
      if (statusFilter === 'completed' && !isDone) return false;

      return true;
    });
  }, [tabTasks, searchQuery, selectedAssigneeFilter, statusFilter, statuses, now]);

  // Categorize for grouped view
  const overdueTasks = displayedTasks.filter(t => {
    const st = statuses.find(s => s.id === t.status_id);
    const isDone = st?.name.includes('CONCLU') || st?.name.includes('FINALIZ') || st?.name.includes('PUBLICADO');
    return !isDone && t.due_date && new Date(t.due_date).getTime() < now;
  });

  const pendingTasks = displayedTasks.filter(t => {
    const st = statuses.find(s => s.id === t.status_id);
    const isDone = st?.name.includes('CONCLU') || st?.name.includes('FINALIZ') || st?.name.includes('PUBLICADO');
    const isOverdue = t.due_date && new Date(t.due_date).getTime() < now;
    return !isDone && !isOverdue;
  });

  const completedTasks = displayedTasks.filter(t => {
    const st = statuses.find(s => s.id === t.status_id);
    return st?.name.includes('CONCLU') || st?.name.includes('FINALIZ') || st?.name.includes('PUBLICADO');
  });

  const priorityConfig: Record<TaskPriority, { label: string; color: string; bg: string }> = {
    urgent: { label: 'Urgente', color: '#ef4444', bg: 'bg-rose-50 text-rose-700 border-rose-200' },
    high: { label: 'Alta', color: '#f97316', bg: 'bg-orange-50 text-orange-700 border-orange-200' },
    normal: { label: 'Normal', color: '#3b82f6', bg: 'bg-blue-50 text-blue-700 border-blue-200' },
    low: { label: 'Baixa', color: '#64748b', bg: 'bg-slate-50 text-slate-600 border-slate-200' }
  };

  const renderTaskRow = (task: CU_Task) => {
    const list = lists.find(l => l.id === task.list_id);
    const space = list ? spaces.find(s => s.id === list.space_id) : null;
    const status = statuses.find(s => s.id === task.status_id);
    const totalCheck = task.checklists?.length || 0;
    const doneCheck = task.checklists?.filter(c => c.done).length || 0;
    const isOverdue = task.due_date && new Date(task.due_date).getTime() < now;
    const priorityInfo = priorityConfig[task.priority || 'normal'];

    // Resolve assignee
    const assignee = task.assignee_user || (task.assignee_id ? systemUsers.find(u => u.id === task.assignee_id) : undefined);

    return (
      <div 
        key={task.id} 
        onClick={() => setSelectedTask(task)}
        className="flex flex-col sm:flex-row sm:items-center justify-between p-4 hover:bg-slate-50/90 transition-all cursor-pointer group gap-3"
      >
        <div className="flex-1 flex flex-col justify-center min-w-0 pr-2">
          <div className="flex items-center gap-2">
            <p className="text-sm font-bold text-slate-800 group-hover:text-blue-600 transition-colors truncate">
              {task.name}
            </p>
            {priorityInfo && (
              <span className={cn(
                "px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider border shrink-0 hidden sm:inline-flex items-center gap-1",
                priorityInfo.bg
              )}>
                <Flag size={10} style={{ color: priorityInfo.color }} />
                {priorityInfo.label}
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2 mt-2 text-xs text-slate-500 font-medium">
            {space && (
              <span 
                className="text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1"
                style={{ backgroundColor: `${space.color || '#3b82f6'}15`, color: space.color || '#3b82f6' }}
              >
                <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: space.color || '#3b82f6' }} />
                {space.name}
              </span>
            )}

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
              <span className="flex items-center gap-1 text-[11px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                <CheckSquare size={12} /> {doneCheck}/{totalCheck}
              </span>
            )}

            {task.due_date && (
              <span className={cn(
                "flex items-center gap-1 text-[11px] px-2 py-0.5 rounded font-bold",
                isOverdue ? "text-rose-600 bg-rose-50 border border-rose-200" : "text-slate-600 bg-slate-100"
              )}>
                <CalendarIcon size={12} /> {format(new Date(task.due_date), "dd/MM")}
              </span>
            )}
          </div>
        </div>
        
        {/* Right Details: Assignee & Status */}
        <div className="shrink-0 flex items-center gap-3">
          {/* Assignee Badge */}
          {assignee ? (
            <div 
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-100/80 border border-slate-200/60 text-xs"
              title={`Atribuída a ${assignee.name} (${assignee.email || ''})`}
            >
              <img 
                src={assignee.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(assignee.name)}&background=3b82f6&color=fff`} 
                alt={assignee.name}
                className="w-5 h-5 rounded-full object-cover shrink-0" 
              />
              <span className="text-[11px] font-semibold text-slate-700 max-w-[110px] truncate">
                {assignee.name} {assignee.id === user?.id && '(Você)'}
              </span>
            </div>
          ) : (
            <span className="text-[10px] text-slate-400 font-medium italic px-2 py-1 bg-slate-50 rounded-lg">
              Sem responsável
            </span>
          )}

          {/* Status Badge */}
          {status && (
            <span 
              className="px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider shadow-2xs shrink-0"
              style={{ backgroundColor: `${status.color}20`, color: status.color }}
            >
              {status.name}
            </span>
          )}
        </div>
      </div>
    );
  };

  return (
    <>
      <div className="flex-1 flex flex-col h-full bg-slate-50 p-6 sm:p-8 overflow-y-auto">
        <div className="max-w-5xl mx-auto w-full space-y-6">
          
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-600 text-white rounded-2xl flex items-center justify-center shadow-xs">
                <CheckSquare size={24} />
              </div>
              <div>
                <h1 className="text-2xl font-black text-slate-900 tracking-tight">Minhas Tarefas</h1>
                <p className="text-sm text-slate-500">
                  Acompanhe e gerencie entregas atribuídas a você ou à sua equipe em tempo real.
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-xs hover:shadow-md cursor-pointer shrink-0"
            >
              <Plus size={16} /> Nova Tarefa
            </button>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-2 border-b border-slate-200/80 pb-1 overflow-x-auto">
            <button
              onClick={() => setActiveTab('assigned_to_me')}
              className={cn(
                "px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shrink-0",
                activeTab === 'assigned_to_me' 
                  ? "bg-blue-600 text-white shadow-xs" 
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
              )}
            >
              <UserIcon size={14} /> Atribuídas a Mim
              <span className={cn(
                "px-1.5 py-0.5 rounded-full text-[10px] font-black",
                activeTab === 'assigned_to_me' ? "bg-white/20 text-white" : "bg-slate-200 text-slate-700"
              )}>
                {assignedToMeCount}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('created_by_me')}
              className={cn(
                "px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shrink-0",
                activeTab === 'created_by_me' 
                  ? "bg-blue-600 text-white shadow-xs" 
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
              )}
            >
              <Sparkles size={14} /> Criadas por Mim
              <span className={cn(
                "px-1.5 py-0.5 rounded-full text-[10px] font-black",
                activeTab === 'created_by_me' ? "bg-white/20 text-white" : "bg-slate-200 text-slate-700"
              )}>
                {createdByMeCount}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('all')}
              className={cn(
                "px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shrink-0",
                activeTab === 'all' 
                  ? "bg-blue-600 text-white shadow-xs" 
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
              )}
            >
              <Layers size={14} /> Todas as Tarefas
              <span className={cn(
                "px-1.5 py-0.5 rounded-full text-[10px] font-black",
                activeTab === 'all' ? "bg-white/20 text-white" : "bg-slate-200 text-slate-700"
              )}>
                {allTasksCount}
              </span>
            </button>
          </div>

          {/* Search and Filters Toolbar */}
          <div className="bg-white p-3.5 rounded-2xl border border-slate-200/90 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative w-full sm:w-72">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar por título ou descrição..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 placeholder:text-slate-400 outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-100"
              />
            </div>

            {/* Quick Status Chips & Assignee Filter */}
            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-start sm:justify-end">
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
                <button
                  onClick={() => setStatusFilter('all')}
                  className={cn(
                    "px-2.5 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer",
                    statusFilter === 'all' ? "bg-white text-slate-800 shadow-2xs" : "text-slate-500 hover:text-slate-800"
                  )}
                >
                  Todas
                </button>
                <button
                  onClick={() => setStatusFilter('pending')}
                  className={cn(
                    "px-2.5 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer",
                    statusFilter === 'pending' ? "bg-white text-blue-600 shadow-2xs" : "text-slate-500 hover:text-slate-800"
                  )}
                >
                  Em Aberto
                </button>
                <button
                  onClick={() => setStatusFilter('overdue')}
                  className={cn(
                    "px-2.5 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer",
                    statusFilter === 'overdue' ? "bg-white text-rose-600 shadow-2xs" : "text-slate-500 hover:text-slate-800"
                  )}
                >
                  Atrasadas
                </button>
                <button
                  onClick={() => setStatusFilter('completed')}
                  className={cn(
                    "px-2.5 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer",
                    statusFilter === 'completed' ? "bg-white text-emerald-600 shadow-2xs" : "text-slate-500 hover:text-slate-800"
                  )}
                >
                  Concluídas
                </button>
              </div>

              {/* Assignee selector when on 'all' view */}
              {activeTab === 'all' && systemUsers.length > 0 && (
                <select
                  value={selectedAssigneeFilter}
                  onChange={(e) => setSelectedAssigneeFilter(e.target.value)}
                  className="px-2.5 py-1.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-700 bg-white outline-none cursor-pointer"
                >
                  <option value="all">Todos os Colaboradores</option>
                  {systemUsers.map(u => (
                    <option key={u.id} value={u.id}>
                      {u.name} {u.id === user?.id ? '(Você)' : ''}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>

          {/* Content View */}
          {displayedTasks.length === 0 ? (
            <div className="bg-white rounded-3xl border border-slate-200/90 p-12 text-center shadow-xs">
              <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-2xs">
                <CheckCircle2 size={32} />
              </div>
              <h3 className="text-lg font-bold text-slate-800 mb-1">
                {activeTab === 'assigned_to_me' 
                  ? 'Nenhuma tarefa atribuída a você!' 
                  : activeTab === 'created_by_me'
                    ? 'Você ainda não criou tarefas.'
                    : 'Nenhuma tarefa encontrada.'}
              </h3>
              <p className="text-slate-500 text-sm max-w-md mx-auto mb-6">
                {activeTab === 'assigned_to_me'
                  ? 'Você está em dia com todas as suas pendências! Deseja criar uma nova tarefa para organizar o seu trabalho?'
                  : 'Crie uma nova tarefa agora e atribua a qualquer colega ou a você mesmo.'}
              </p>
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black inline-flex items-center gap-2 transition-all shadow-xs cursor-pointer"
              >
                <Plus size={16} /> Criar Nova Tarefa
              </button>
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

      {/* Create Task Modal */}
      <CreateWorkspaceTaskModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        defaultAssigneeId={user?.id}
      />

      {/* Task Details & Edit Modal Drawer */}
      <WorkspaceTaskModal 
        task={selectedTask}
        onClose={() => setSelectedTask(null)}
      />
    </>
  );
}
