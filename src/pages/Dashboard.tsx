import React from 'react';
import { 
  Users, AlertCircle, Activity, Clock, Calendar, 
  CheckCircle2, ArrowRight, UserCheck, TrendingUp, 
  TrendingDown, Target, Globe
} from 'lucide-react';
import { 
  AreaChart, Area, 
  PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts';
import { Link } from 'react-router-dom';
import { format, subMonths, startOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useAtendimento } from '../contexts/AtendimentoContext';
import { usePatients } from '../contexts/PatientContext';
import { useAuth } from '../contexts/AuthContext';
import { formatLocalDate, cn } from '../lib/utils';

export function Dashboard() {
  const today = new Date();
  const todayDate = formatLocalDate(today);
  const { atendimentos } = useAtendimento();
  const { patients, events } = usePatients();
  
  const todayAtendimentos = atendimentos.filter(a => a.date === todayDate);

  // Metrics calculation
  const activePatientsCount = patients.filter(p => p.status !== 'Alta').length;
  const damCases = patients.filter(p => p.status === 'DAM').length;
  const dagCases = patients.filter(p => p.status === 'DAG').length;
  const dischargeCount = events.filter(e => e.is_discharge).length;
  const totalPatients = patients.length;
  
  const referralEvents = events
    .filter(e => e.event_type === 'referral')
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const statusData = [
    { name: 'Normal', value: patients.filter(p => p.status === 'Adequado').length, color: '#10b981' },
    { name: 'DAM', value: damCases, color: '#f59e0b' },
    { name: 'DAG', value: dagCases, color: '#ef4444' },
    { name: 'Risco', value: patients.filter(p => p.status === 'Risco').length, color: '#6366f1' },
  ];

  // Chart data generation
  const chartData = Array.from({ length: 6 }).map((_, i) => {
    const date = subMonths(today, 5 - i);
    const monthName = format(date, 'MMM', { locale: ptBR });
    const monthStart = startOfMonth(date);
    const nextMonthStart = startOfMonth(subMonths(date, -1));

    const count = events.filter(e => {
      const eDate = new Date(e.date);
      return eDate >= monthStart && eDate < nextMonthStart;
    }).length;

    return {
      name: monthName.charAt(0).toUpperCase() + monthName.slice(1),
      atendimentos: count,
      meta: 10
    };
  });

  const alerts = [
    { title: 'Estoque Baixo', desc: 'Plumpy\'Nut atingindo nível crítico.', type: 'alert', time: '10:30' },
    { title: 'Novo Cadastro', desc: 'Adisa Okoro foi registrado hoje.', type: 'info', time: '09:15' },
    { title: 'Recuperação', desc: 'Juma Nkosi atingiu peso ideal.', type: 'success', time: 'Ontem' },
  ];
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            Dashboard Geral
          </h1>
          <p className="text-slate-500 mt-1 font-medium italic">Visão consolidada de saúde e operações</p>
        </div>
        <div className="flex items-center gap-2 text-sm font-bold text-slate-600 bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm">
          <Calendar size={16} className="text-emerald-600" />
          {format(today, "d 'de' MMMM, yyyy", { locale: ptBR })}
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard title="Em Atendimento" value={activePatientsCount.toString()} icon={Users} trend="+5%" trendType="up" color="blue" />
        <MetricCard title="Casos DAM" value={damCases.toString()} icon={Activity} trend="-5%" trendType="down" color="amber" />
        <MetricCard title="Casos DAG" value={dagCases.toString()} icon={AlertCircle} trend="-2%" trendType="down" color="red" />
        <MetricCard title="Total de Altas" value={dischargeCount.toString()} icon={Target} trend="+12%" trendType="up" color="emerald" />
      </div>

      {/* Charts Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Today's Appointments */}
          <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 relative overflow-hidden">
            <div className="flex items-center justify-between mb-8 relative z-10">
              <div>
                <h2 className="text-xl font-black text-slate-900">Fila de Atendimento</h2>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Status em tempo real</p>
              </div>
              <span className="bg-emerald-500 text-white text-[10px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full shadow-lg shadow-emerald-500/20">
                {todayAtendimentos.length} Pacientes
              </span>
            </div>
            
            <div className="space-y-4 relative z-10">
              {todayAtendimentos.length > 0 ? todayAtendimentos.map((apt) => (
                <div key={apt.id} className="flex items-center justify-between p-5 rounded-2xl border border-slate-50 bg-slate-50/30 hover:border-emerald-200 hover:bg-white transition-all group shadow-sm hover:shadow-md">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-slate-900 font-black shadow-sm group-hover:scale-110 transition-transform">
                      {apt.patient_name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-slate-900">{apt.patient_name}</h3>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Triagem concluída</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <StatusTag status={apt.status} />
                    <Link to={`/nutrition/patients/${apt.patient_id}`} className="p-2.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all">
                      <ArrowRight size={20} />
                    </Link>
                  </div>
                </div>
              )) : (
                <div className="py-10 text-center">
                  <p className="text-slate-400 font-medium italic">Nenhuma criança na fila no momento.</p>
                </div>
              )}
            </div>
          </div>

          {/* New Referrals Section */}
          <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-xl font-black text-slate-900">Encaminhamentos Hospitalares</h2>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Casos enviados para o hospital</p>
              </div>
              <span className="bg-red-100 text-red-600 text-[10px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full">
                {referralEvents.length} Casos
              </span>
            </div>
            
            <div className="space-y-4">
              {referralEvents.length > 0 ? referralEvents.map((ref) => {
                const patient = patients.find(p => p.id === ref.patient_id);
                return (
                  <div key={ref.id} className="flex items-center justify-between p-5 rounded-2xl border border-red-50 bg-red-50/10 hover:bg-red-50/20 transition-all group">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-red-100 text-red-600 flex items-center justify-center font-black shadow-sm">
                        <Globe size={24} />
                      </div>
                      <div>
                        <h3 className="text-sm font-black text-slate-900">{patient?.name || 'Criança'}</h3>
                        <p className="text-xs text-slate-500 font-medium">Motivo: {ref.notes.split('.')[0]}</p>
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">Encaminhado em {new Date(ref.date).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <Link to={`/nutrition/patients/${ref.patient_id}`} className="p-2.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all">
                      <ArrowRight size={20} />
                    </Link>
                  </div>
                );
              }) : (
                <div className="py-10 text-center">
                  <p className="text-slate-400 font-medium italic">Nenhum encaminhamento registrado.</p>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
            <h2 className="text-xl font-black text-slate-900 mb-10 text-center lg:text-left">Fluxo de Impacto Nutricional</h2>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorAtendimentos" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f8fafc" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 800 }} dy={15} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 800 }} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', padding: '16px', fontWeight: 'bold' }}
                  />
                  <Area type="monotone" dataKey="atendimentos" stroke="#10b981" strokeWidth={4} fill="url(#colorAtendimentos)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 flex flex-col">
            <h2 className="text-xl font-black text-slate-900 mb-1">Cenário Atual</h2>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mb-8">Estado Nutricional Global</p>
            <div className="flex-1 min-h-[250px] relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={statusData} cx="50%" cy="50%" innerRadius={70} outerRadius={95} paddingAngle={10} dataKey="value">
                    {statusData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-4xl font-black text-slate-900 tracking-tighter">{totalPatients}</span>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Crianças</span>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-8">
              {statusData.map((item, i) => (
                <div key={i} className="bg-slate-50/50 p-3 rounded-2xl border border-slate-50 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{item.name}</span>
                  </div>
                  <span className="text-sm font-black text-slate-900">{item.value}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-slate-900 p-8 rounded-[2.5rem] shadow-xl text-white relative overflow-hidden group">
            <div className="relative z-10">
              <h2 className="text-lg font-black mb-6 flex items-center gap-2">
                <AlertCircle className="text-amber-500" size={20} />
                Alertas Críticos
              </h2>
              <div className="space-y-6">
                {alerts.map((alert, i) => (
                  <div key={i} className="flex gap-4 items-start group/item">
                    <div className={`w-2 h-2 mt-2 rounded-full flex-shrink-0 animate-pulse ${
                      alert.type === 'alert' ? 'bg-red-500' : 
                      alert.type === 'success' ? 'bg-emerald-500' : 'bg-blue-500'
                    }`} />
                    <div>
                      <p className="text-sm font-black text-slate-100 group-hover/item:text-emerald-400 transition-colors">{alert.title}</p>
                      <p className="text-xs text-slate-400 font-medium mt-1 leading-relaxed">{alert.desc}</p>
                      <p className="text-[9px] font-black text-slate-500 mt-2 uppercase tracking-widest">{alert.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-emerald-500/10 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-1000" />
          </div>
        </div>
      </div>
    </div>
  );
}

function StatusTag({ status }: { status: string }) {
  const configs: any = {
    completed: { color: 'text-emerald-600 bg-emerald-50 border-emerald-100', icon: CheckCircle2, text: 'Atendido' },
    in_progress: { color: 'text-blue-600 bg-blue-50 border-blue-100', icon: Activity, text: 'Em Curso' },
    waiting: { color: 'text-amber-600 bg-amber-50 border-amber-100', icon: UserCheck, text: 'Na Fila' },
    scheduled: { color: 'text-slate-400 bg-slate-50 border-slate-100', icon: Clock, text: 'Aguardado' },
  };
  const config = configs[status] || configs.scheduled;
  const Icon = config.icon;
  return <span className={`flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-xl border ${config.color}`}><Icon size={12} />{config.text}</span>;
}

function MetricCard({ title, value, icon: Icon, trend, trendType, color }: any) {
  const colors: any = { blue: 'bg-blue-50 text-blue-600 border-blue-100', amber: 'bg-amber-50 text-amber-600 border-amber-100', red: 'bg-red-50 text-red-600 border-red-100', emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100' };
  return (
    <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 flex flex-col relative overflow-hidden group hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-500">
      <div className="flex justify-between items-start mb-6 relative z-10">
        <div className={`p-4 rounded-2xl border ${colors[color]} group-hover:scale-110 transition-transform duration-500 shadow-sm`}><Icon size={24} /></div>
        <div className={`flex items-center gap-1 text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-lg ${trendType === 'up' ? 'text-emerald-600 bg-emerald-50' : 'text-red-600 bg-red-50'}`}>{trendType === 'up' ? <TrendingUp size={12} /> : <TrendingDown size={12} />}{trend}</div>
      </div>
      <div className="relative z-10"><h3 className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] mb-1">{title}</h3><p className="text-3xl font-black text-slate-900 tracking-tight">{value}</p></div>
    </div>
  );
}
