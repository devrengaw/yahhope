import React, { useState } from 'react';
import { 
  LayoutDashboard, MessageSquare, Briefcase, Newspaper, 
  TrendingUp, Users, Target, Plus, Bell, Trash2,
  Clock, ArrowRight, X, UserPlus, Info, Calendar as CalendarIcon,
  ChevronLeft, ChevronRight, Check
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { 
  format, addMonths, subMonths, startOfMonth, endOfMonth, 
  startOfWeek, endOfWeek, isSameMonth, isSameDay, addDays, 
  eachDayOfInterval, isToday, parseISO
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useProjects } from '../../contexts/ProjectContext';
import { useAuth } from '../../contexts/AuthContext';
import { useAnnouncements } from '../../contexts/AnnouncementContext';
import { cn } from '../../lib/utils';
import { mockUsers, PersonalActivity } from '../../lib/mockData';
import { Announcement } from '../../contexts/AnnouncementContext';

export function CommDashboard() {
  const { user } = useAuth();
  const { projects, activities, addActivity, deleteActivity } = useProjects();
  const { announcements, addAnnouncement, deleteAnnouncement } = useAnnouncements();
  
  const [showActivityModal, setShowActivityModal] = useState(false);
  const [showNoticeModal, setShowNoticeModal] = useState(false);
  const [selectedVisibleUsers, setSelectedVisibleUsers] = useState<string[]>([]);
  const [isAllDay, setIsAllDay] = useState(true);
  
  // Calendar State
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());

  const stats = [
    { name: 'Projetos Ativos', value: projects.length.toString(), icon: Briefcase, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { name: 'Mensagens Novas', value: '0', icon: MessageSquare, color: 'text-purple-600', bg: 'bg-purple-50' },
    { name: 'Posts no Blog', value: '0', icon: Newspaper, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { name: 'Avisos Equipe', value: announcements.length.toString(), icon: Bell, color: 'text-amber-600', bg: 'bg-amber-50' },
  ];

  // Fix timezone issue by creating date from YYYY-MM-DD string at midday
  const parseLocalDate = (dateStr: string) => {
    const [year, month, day] = dateStr.split('-').map(Number);
    return new Date(year, month - 1, day, 12, 0, 0);
  };

  // Personal Agenda Logic
  const allTasksAndActivities = [
    ...projects.flatMap(project => {
      const peopleCols = (project.columns || []).filter(c => c.type === 'people');
      const dateCol = (project.columns || []).find(c => c.type === 'date' || c.name.toLowerCase().includes('prazo') || c.name.toLowerCase().includes('deadline'));
      const statusCol = (project.columns || []).find(c => c.type === 'status');

      return project.tasks
        .filter(task => {
          return peopleCols.some(col => {
            const val = task.values[col.id];
            return Array.isArray(val) && val.includes(user?.id);
          });
        })
        .map(task => ({
          id: task.id,
          title: task.title,
          type: 'task',
          context: project.name,
          deadline: dateCol ? task.values[dateCol.id] : null,
          status: statusCol ? task.values[statusCol.id] : 'Pendente',
          isAllDay: true
        }));
    }),
    ...activities
      .filter(act => act.visibleTo.includes(user?.id || '') || act.authorId === user?.id)
      .map(act => ({
        id: act.id,
        title: act.title,
        type: 'activity',
        context: 'Atividade Pessoal',
        deadline: act.date,
        startTime: act.startTime,
        endTime: act.endTime,
        isAllDay: act.isAllDay,
        status: 'Agenda'
      }))
  ];

  // Filtered by selected date in calendar
  const filteredActivities = allTasksAndActivities.filter(item => {
    if (!item.deadline) return false;
    const itemDate = item.deadline.includes('-') ? parseLocalDate(item.deadline) : new Date(item.deadline);
    return isSameDay(itemDate, selectedDate);
  }).sort((a, b) => {
    if (a.isAllDay && !b.isAllDay) return -1;
    if (!a.isAllDay && b.isAllDay) return 1;
    if (a.startTime && b.startTime) return a.startTime.localeCompare(b.startTime);
    return 0;
  });

  const handleAddActivity = (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.currentTarget as any;
    const newActivity: PersonalActivity = {
      id: Math.random().toString(36).substring(2, 9),
      title: form.activityTitle.value,
      description: '',
      date: form.activityDate.value,
      startTime: isAllDay ? undefined : form.startTime?.value,
      endTime: isAllDay ? undefined : form.endTime?.value,
      isAllDay: isAllDay,
      visibleTo: selectedVisibleUsers,
      authorId: user?.id || ''
    };
    addActivity(newActivity);
    setShowActivityModal(false);
    setSelectedVisibleUsers([]);
    setIsAllDay(true);
  };

  const handleAddNotice = (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.currentTarget as any;
    const newNotice: Announcement = {
      id: Math.random().toString(36).substring(2, 9),
      title: form.noticeTitle.value,
      content: form.noticeContent.value,
      date: new Date().toISOString(),
      author: user?.name || 'Admin',
      targetTeam: form.noticeTeam.value
    };
    addAnnouncement(newNotice);
    setShowNoticeModal(false);
  };

  // Calendar Rendering Logic
  const renderHeader = () => (
    <div className="flex items-center justify-between mb-6">
      <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">
        {format(currentMonth, 'MMMM yyyy', { locale: ptBR })}
      </h3>
      <div className="flex gap-2">
        <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-indigo-600 transition-all">
          <ChevronLeft size={16} />
        </button>
        <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-indigo-600 transition-all">
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );

  const renderDays = () => {
    const days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    return (
      <div className="grid grid-cols-7 mb-2">
        {days.map(day => (
          <div key={day} className="text-center text-[10px] font-black text-slate-300 uppercase tracking-widest py-2">
            {day}
          </div>
        ))}
      </div>
    );
  };

  const renderCells = () => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);

    const rows = [];
    let days = [];
    let day = startDate;

    while (day <= endDate) {
      for (let i = 0; i < 7; i++) {
        const formattedDate = format(day, 'd');
        const cloneDay = day;
        
        const hasActivities = allTasksAndActivities.some(item => {
          if (!item.deadline) return false;
          const itemDate = item.deadline.includes('-') ? parseLocalDate(item.deadline) : new Date(item.deadline);
          return isSameDay(itemDate, cloneDay);
        });
        
        days.push(
          <div
            key={day.toString()}
            className={cn(
              "relative h-12 flex items-center justify-center cursor-pointer rounded-xl transition-all",
              !isSameMonth(day, monthStart) ? "text-slate-200" : "text-slate-600 font-bold",
              isSameDay(day, selectedDate) ? "bg-indigo-600 text-white shadow-lg shadow-indigo-200 scale-110 z-10" : "hover:bg-indigo-50 hover:text-indigo-600",
              isToday(day) && !isSameDay(day, selectedDate) && "border border-indigo-100 bg-indigo-50/30"
            )}
            onClick={() => setSelectedDate(cloneDay)}
          >
            <span className="text-xs">{formattedDate}</span>
            {hasActivities && !isSameDay(day, selectedDate) && (
              <div className="absolute bottom-2 w-1 h-1 rounded-full bg-indigo-400" />
            )}
          </div>
        );
        day = addDays(day, 1);
      }
      rows.push(<div className="grid grid-cols-7 gap-1" key={day.toString()}>{days}</div>);
      days = [];
    }
    return <div className="space-y-1">{rows}</div>;
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <LayoutDashboard className="text-indigo-600" size={32} />
            Painel de Comunicação
          </h1>
          <p className="text-slate-500 mt-1 font-medium italic">Gestão centralizada de projetos e avisos.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div key={stat.name} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-500 group">
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 rounded-xl ${stat.bg} ${stat.color} group-hover:scale-110 transition-transform`}>
                <stat.icon size={24} />
              </div>
              <span className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg">
                <TrendingUp size={12} /> Ativo
              </span>
            </div>
            <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em]">{stat.name}</p>
            <p className="text-3xl font-black text-slate-900 tracking-tight mt-1">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 flex flex-col">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-200">
                <Target size={24} />
              </div>
              <div>
                <h2 className="text-xl font-black text-slate-900">Minha Agenda</h2>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">
                  {format(selectedDate, "d 'de' MMMM", { locale: ptBR })}
                </p>
              </div>
            </div>
            <button 
              onClick={() => setShowActivityModal(true)}
              className="flex items-center gap-2 bg-indigo-50 text-indigo-600 text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-xl border border-indigo-100 hover:bg-indigo-600 hover:text-white transition-all shadow-sm"
            >
              <Plus size={16} /> Nova Atividade
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-8 flex-1">
            <div className="md:col-span-2 border-r border-slate-50 pr-4">
              {renderHeader()}
              {renderDays()}
              {renderCells()}
            </div>

            <div className="md:col-span-3 space-y-4 overflow-y-auto max-h-[400px] pr-2 scrollbar-hide">
              <div className="mb-4">
                <h4 className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-4">Compromissos do Dia</h4>
                {filteredActivities.length > 0 ? filteredActivities.map((item) => (
                  <div key={item.id} className="p-5 rounded-3xl border border-slate-100 bg-slate-50/30 hover:bg-white hover:border-indigo-200 hover:shadow-xl hover:shadow-indigo-500/5 transition-all group flex flex-col mb-4">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] font-black uppercase tracking-widest text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-lg">{item.context}</span>
                        {item.type === 'activity' && <span className="text-[9px] font-black uppercase tracking-widest text-amber-600 bg-amber-50 px-2 py-0.5 rounded-lg">Atividade</span>}
                      </div>
                      <div className={cn("px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-widest border text-center", item.status === 'Done' || item.status === 'Concluído' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-amber-50 text-amber-600 border-amber-100')}>{item.status}</div>
                    </div>
                    <h3 className="text-sm font-black text-slate-800 mb-4 group-hover:text-indigo-600 transition-colors line-clamp-2">{item.title}</h3>
                    <div className="flex items-center justify-between mt-auto">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400">
                          <Clock size={12} className="text-indigo-400" />
                          {item.isAllDay ? 'Dia Todo' : `${item.startTime} - ${item.endTime}`}
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        {item.type === 'activity' && <button onClick={() => deleteActivity(item.id)} className="p-2 text-slate-200 hover:text-red-500 transition-all"><Trash2 size={14} /></button>}
                        <Link to={item.type === 'task' ? `/communication/projects` : '#'} className="p-2 text-slate-300 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"><ArrowRight size={16} /></Link>
                      </div>
                    </div>
                  </div>
                )) : (
                  <div className="py-12 flex flex-col items-center justify-center text-center bg-slate-50/50 rounded-3xl border border-dashed border-slate-200">
                    <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center mb-4 text-slate-200"><Clock size={24} /></div>
                    <p className="text-slate-400 font-medium italic text-xs px-10">Livre para hoje!</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-slate-900 p-8 rounded-[3rem] shadow-xl text-white flex flex-col relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-40 h-40 bg-emerald-500/10 rounded-full blur-3xl -mr-20 -mt-20 group-hover:scale-150 transition-transform duration-1000" />
          <div className="relative z-10 flex flex-col h-full">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3"><div className="p-3 rounded-2xl bg-emerald-500 shadow-lg shadow-emerald-500/20"><Bell size={20} /></div><div><h2 className="text-lg font-black tracking-tight">Quadro de Avisos</h2><p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1">Comunicação Painel</p></div></div>
              <button onClick={() => setShowNoticeModal(true)} className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center text-white hover:bg-white hover:text-slate-900 transition-all shadow-sm"><Plus size={16} /></button>
            </div>
            <div className="space-y-4 flex-1 overflow-y-auto max-h-[350px] pr-2 scrollbar-hide">
              {announcements.filter(a => a.targetTeam === 'Comunicação' || a.targetTeam === 'Todos').map((notice) => (
                <div key={notice.id} className="p-6 rounded-[2rem] bg-white/5 border border-white/10 hover:bg-white/10 transition-all group/item relative">
                  <button onClick={() => deleteAnnouncement(notice.id)} className="absolute top-4 right-4 opacity-0 group-hover/item:opacity-100 text-white/20 hover:text-red-400 transition-all"><Trash2 size={12} /></button>
                  <div className="flex items-center gap-2 mb-3"><span className="text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/20">{notice.targetTeam}</span><span className="text-[8px] font-black uppercase tracking-widest text-slate-500">{new Date(notice.date).toLocaleDateString()}</span></div>
                  <h4 className="text-sm font-black text-slate-100 mb-2">{notice.title}</h4>
                  <p className="text-xs text-slate-400 font-medium leading-relaxed">{notice.content}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      {showActivityModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-[3rem] w-full max-w-lg shadow-2xl animate-in zoom-in-95 duration-300 overflow-hidden">
            <div className="bg-indigo-600 p-12 text-white relative">
              <h3 className="text-3xl font-black tracking-tight">Nova Atividade</h3>
              <p className="text-white/80 text-sm font-bold uppercase tracking-widest mt-2">Agenda de Comunicação</p>
              <button onClick={() => setShowActivityModal(false)} className="absolute top-10 right-10 p-3 rounded-2xl bg-white/10 hover:bg-white/20"><X size={24} /></button>
            </div>
            <form onSubmit={handleAddActivity} className="p-10 space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Descrição</label>
                <input name="activityTitle" required className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-black text-slate-700 outline-none" placeholder="Ex: Campanha de Marketing" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Data</label>
                  <input name="activityDate" type="date" required className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-slate-600 outline-none" defaultValue={format(selectedDate, 'yyyy-MM-dd')} />
                </div>
                <div className="flex items-end pb-2">
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <div className={cn(
                      "w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all",
                      isAllDay ? "bg-indigo-600 border-indigo-600 text-white" : "border-slate-200 bg-white"
                    )} onClick={() => setIsAllDay(!isAllDay)}>
                      {isAllDay && <Check size={14} />}
                    </div>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest group-hover:text-indigo-600 transition-colors">Dia Todo</span>
                  </label>
                </div>
              </div>
              
              {!isAllDay && (
                <div className="grid grid-cols-2 gap-4 animate-in slide-in-from-top-2 duration-300">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Início</label>
                    <input name="startTime" type="time" required={!isAllDay} className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-slate-600 outline-none" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Término</label>
                    <input name="endTime" type="time" required={!isAllDay} className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-slate-600 outline-none" />
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Visibilidade</label>
                <div className="flex flex-wrap gap-2">
                  {mockUsers.map(u => (
                    <button key={u.id} type="button" onClick={() => setSelectedVisibleUsers(prev => prev.includes(u.id) ? prev.filter(id => id !== u.id) : [...prev, u.id])} className={cn("px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all", selectedVisibleUsers.includes(u.id) ? "bg-indigo-600 border-indigo-600 text-white shadow-lg" : "bg-slate-50 border-slate-100 text-slate-400")}>{u.name}</button>
                  ))}
                </div>
              </div>
              <button type="submit" className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-black uppercase text-sm tracking-widest shadow-xl shadow-indigo-200 transition-all">Salvar Atividade</button>
            </form>
          </div>
        </div>
      )}

      {showNoticeModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-[3rem] w-full max-w-lg shadow-2xl animate-in zoom-in-95 duration-300 overflow-hidden">
            <div className="bg-emerald-600 p-12 text-white relative">
              <h3 className="text-3xl font-black tracking-tight">Postar Aviso</h3>
              <p className="text-white/80 text-sm font-bold uppercase tracking-widest mt-2">Comunicado Painel</p>
              <button onClick={() => setShowNoticeModal(false)} className="absolute top-10 right-10 p-3 rounded-2xl bg-white/10 hover:bg-white/20"><X size={24} /></button>
            </div>
            <form onSubmit={handleAddNotice} className="p-12 space-y-8">
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Título</label>
                <input name="noticeTitle" required className="w-full px-6 py-5 bg-slate-50 border border-slate-100 rounded-2xl font-black text-slate-700 outline-none" placeholder="Título do aviso" />
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Conteúdo</label>
                <textarea name="noticeContent" rows={3} required className="w-full px-6 py-5 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-slate-600 outline-none resize-none" placeholder="O que você quer avisar?" />
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Destinatários</label>
                <select name="noticeTeam" className="w-full px-6 py-5 bg-slate-50 border border-slate-100 rounded-2xl font-black text-slate-700 outline-none appearance-none">
                  <option value="Comunicação">Equipe de Comunicação</option>
                  <option value="Todos">Todos os Módulos</option>
                </select>
              </div>
              <button type="submit" className="w-full py-5 bg-emerald-600 text-white rounded-2xl font-black uppercase text-sm tracking-widest shadow-xl shadow-emerald-200 transition-all">Publicar no Quadro</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
