import React from 'react';
import { useClickUp } from '../../contexts/ClickUpContext';
import { useAuth } from '../../contexts/AuthContext';
import { 
  Inbox, CheckSquare, MessageSquare, Flag, 
  Clock, ArrowRight, BellRing, Sparkles 
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { WorkspaceTaskModal } from '../../components/workspace/WorkspaceTaskModal';

export function WorkspaceInbox() {
  const { tasks, selectedTask, setSelectedTask, lists } = useClickUp();
  const { user } = useAuth();

  // Create activity notifications from recent tasks and comments
  const notifications: Array<{
    id: string;
    type: 'assignment' | 'comment' | 'status';
    title: string;
    description: string;
    time: string;
    task: any;
  }> = [];

  tasks.forEach(task => {
    // Comments notifications
    (task.comments || []).forEach((c, idx) => {
      notifications.push({
        id: `notif-c-${task.id}-${idx}`,
        type: 'comment',
        title: `Novo comentário de ${c.user_name}`,
        description: `"${c.text}" na tarefa "${task.name}"`,
        time: c.created_at,
        task: task
      });
    });

    // Assignment notifications
    if (task.assignee_user) {
      notifications.push({
        id: `notif-a-${task.id}`,
        type: 'assignment',
        title: `Tarefa atribuída`,
        description: `"${task.name}" foi atribuída a ${task.assignee_user.name}`,
        time: task.created_at || new Date().toISOString(),
        task: task
      });
    }
  });

  // Sort notifications by time descending
  notifications.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());

  return (
    <>
      <div className="flex-1 bg-white h-full flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white/90 backdrop-blur-md z-10 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Inbox size={22} />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-800">Caixa de Entrada & Notificações</h1>
              <p className="text-xs text-slate-400">Atualizações de tarefas, comentários da equipe e menções.</p>
            </div>
          </div>
          <span className="px-3 py-1 bg-blue-50 text-blue-700 text-xs font-bold rounded-full">
            {notifications.length} {notifications.length === 1 ? 'notificação' : 'notificações'}
          </span>
        </div>

        {/* Notifications Feed */}
        <div className="flex-1 overflow-y-auto bg-slate-50 p-6">
          <div className="max-w-3xl mx-auto space-y-3">
            {notifications.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-16 h-16 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Inbox size={32} />
                </div>
                <h3 className="text-base font-bold text-slate-700 mb-1">Caixa de entrada limpa!</h3>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  Você não tem novas notificações no momento.
                </p>
              </div>
            ) : (
              notifications.map(notif => (
                <div 
                  key={notif.id}
                  onClick={() => setSelectedTask(notif.task)}
                  className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md hover:border-blue-300 transition-all cursor-pointer flex items-start gap-4 group"
                >
                  <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600 shrink-0 mt-0.5">
                    {notif.type === 'comment' ? <MessageSquare size={16} /> : <CheckSquare size={16} />}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-0.5">
                      <h4 className="text-xs font-black text-slate-800 group-hover:text-blue-600 transition-colors truncate">
                        {notif.title}
                      </h4>
                      <span className="text-[10px] text-slate-400 shrink-0">
                        {format(new Date(notif.time), "dd/MM 'às' HH:mm")}
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                      {notif.description}
                    </p>

                    <div className="mt-2.5 flex items-center gap-2 text-[11px] text-blue-600 font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                      <span>Ver tarefa</span>
                      <ArrowRight size={12} />
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
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
