import { Users, AlertCircle, Activity, Clock, Calendar, CheckCircle2, ArrowRight, UserCheck, TrendingUp, TrendingDown, Target } from 'lucide-react';
import { 
  AreaChart, Area, 
  PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useAtendimento } from '../contexts/AtendimentoContext';

const data = [
  { name: 'Jan', atendimentos: 65, meta: 60 },
  { name: 'Fev', atendimentos: 85, meta: 70 },
  { name: 'Mar', atendimentos: 120, meta: 100 },
  { name: 'Abr', atendimentos: 90, meta: 100 },
  { name: 'Mai', atendimentos: 110, meta: 110 },
  { name: 'Jun', atendimentos: 140, meta: 120 },
];

const statusData = [
  { name: 'Normal', value: 850, color: '#10b981' },
  { name: 'DAM', value: 142, color: '#f59e0b' },
  { name: 'DAG', value: 38, color: '#ef4444' },
];

export function Dashboard() {
  const today = new Date();
  const { atendimentos } = useAtendimento();
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">Dashboard Gerencial</h1>
          <p className="text-slate-500 mt-1">Visão geral do programa nutricional</p>
        </div>
        <div className="flex items-center gap-2 text-sm font-medium text-slate-600 bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm">
          <Calendar size={16} className="text-emerald-600" />
          {format(today, "d 'de' MMMM, yyyy", { locale: ptBR })}
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard 
          title="Total de Crianças" 
          value="1.248" 
          icon={Users} 
          trend="+12%" 
          trendType="up"
          color="blue" 
        />
        <MetricCard 
          title="Casos DAM" 
          value="142" 
          icon={Activity} 
          trend="-5%" 
          trendType="down"
          color="amber" 
        />
        <MetricCard 
          title="Casos DAG" 
          value="38" 
          icon={AlertCircle} 
          trend="-2%" 
          trendType="down"
          color="red" 
        />
        <MetricCard 
          title="Taxa de Recuperação" 
          value="94.2%" 
          icon={Target} 
          trend="+1.2%" 
          trendType="up"
          color="emerald" 
        />
      </div>

      {/* Charts Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Today's Appointments */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-slate-800">Crianças Esperadas Hoje</h2>
              <span className="bg-emerald-100 text-emerald-700 text-xs font-semibold px-2.5 py-1 rounded-full">
                {atendimentos.length} crianças
              </span>
            </div>
            
            <div className="space-y-3">
              {atendimentos.map((apt) => (
                <div key={apt.id} className="flex items-center justify-between p-4 rounded-xl border border-slate-100 hover:border-emerald-100 hover:bg-emerald-50/30 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-medium shrink-0">
                      {apt.patient_name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-slate-900">{apt.patient_name}</h3>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    {apt.status === 'completed' && (
                      <span className="flex items-center gap-1 text-xs font-medium text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">
                        <CheckCircle2 size={14} />
                        Atendido
                      </span>
                    )}
                    {apt.status === 'in_progress' && (
                      <span className="flex items-center gap-1 text-xs font-medium text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full">
                        <Activity size={14} />
                        Em Atendimento
                      </span>
                    )}
                    {apt.status === 'waiting' && (
                      <span className="flex items-center gap-1 text-xs font-medium text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full">
                        <UserCheck size={14} />
                        Aguardando Médico
                      </span>
                    )}
                    {apt.status === 'scheduled' && (
                      <span className="flex items-center gap-1 text-xs font-medium text-slate-600 bg-slate-50 px-2.5 py-1 rounded-full">
                        <Clock size={14} />
                        Não chegou
                      </span>
                    )}
                    <Link to={`/nutrition/patients/${apt.patient_id}`} className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors">
                      <ArrowRight size={18} />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-6">
              <Link to="/nutrition/atendimento" className="text-sm font-medium text-emerald-600 hover:text-emerald-700 flex items-center gap-1">
                Ir para área de Atendimento <ArrowRight size={16} />
              </Link>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Tendência de Atendimentos</h2>
                <p className="text-xs text-slate-500">Volume mensal vs Meta projetada</p>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Realizado</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-slate-200" />
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Meta</span>
                </div>
              </div>
            </div>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorAtendimentos" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 600 }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 600 }} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', padding: '12px' }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="atendimentos" 
                    stroke="#10b981" 
                    strokeWidth={3}
                    fillOpacity={1} 
                    fill="url(#colorAtendimentos)" 
                  />
                  <Area 
                    type="monotone" 
                    dataKey="meta" 
                    stroke="#e2e8f0" 
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    fill="none" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 h-[400px] flex flex-col">
            <h2 className="text-lg font-bold text-slate-900 mb-2">Estado Nutricional</h2>
            <p className="text-xs text-slate-500 mb-6">Distribuição atual dos beneficiários</p>
            <div className="flex-1 min-h-0 relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={8}
                    dataKey="value"
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-2xl font-black text-slate-900">1.030</span>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total</span>
              </div>
            </div>
            <div className="space-y-2 mt-4">
              {statusData.map((item, i) => (
                <div key={i} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-slate-600 font-medium">{item.name}</span>
                  </div>
                  <span className="text-slate-900 font-bold">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
          <h2 className="text-lg font-semibold text-slate-800 mb-4">Avisos Recentes</h2>
          <div className="space-y-4">
            {[
              { title: 'Falta de Suplemento', desc: 'Estoque baixo na Unidade Norte', time: 'Há 2 horas', type: 'alert' },
              { title: 'Nova Triagem', desc: '5 novas crianças cadastradas hoje', time: 'Há 4 horas', type: 'info' },
              { title: 'Alta Médica', desc: 'Ana Costa atingiu Escore-Z > -1', time: 'Ontem', type: 'success' },
            ].map((alert, i) => (
              <div key={i} className="flex gap-3 items-start pb-4 border-b border-slate-50 last:border-0 last:pb-0">
                <div className={`w-2 h-2 mt-2 rounded-full flex-shrink-0 ${
                  alert.type === 'alert' ? 'bg-red-500' : 
                  alert.type === 'success' ? 'bg-emerald-500' : 'bg-blue-500'
                }`} />
                <div>
                  <p className="text-sm font-medium text-slate-800">{alert.title}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{alert.desc}</p>
                  <p className="text-[10px] text-slate-400 mt-1 uppercase tracking-wider">{alert.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function MetricCard({ title, value, icon: Icon, trend, trendType, color }: any) {
  const colors: any = {
    blue: 'bg-blue-50 text-blue-600 border-blue-100',
    amber: 'bg-amber-50 text-amber-600 border-amber-100',
    red: 'bg-red-50 text-red-600 border-red-100',
    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100'
  };

  return (
    <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 flex flex-col relative overflow-hidden group hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-500">
      <div className="flex justify-between items-start mb-6 relative z-10">
        <div className={`p-4 rounded-2xl border ${colors[color]} group-hover:scale-110 transition-transform duration-500`}>
          <Icon size={24} />
        </div>
        <div className={`flex items-center gap-1 text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-lg ${
          trendType === 'up' ? 'text-emerald-600 bg-emerald-50' : 'text-red-600 bg-red-50'
        }`}>
          {trendType === 'up' ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
          {trend}
        </div>
      </div>
      <div className="relative z-10">
        <h3 className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] mb-1">{title}</h3>
        <p className="text-3xl font-black text-slate-900 tracking-tight">{value}</p>
      </div>
      <div className={`absolute -right-4 -bottom-4 w-24 h-24 rounded-full opacity-[0.03] group-hover:scale-150 transition-transform duration-700 ${colors[color].split(' ')[1]}`} style={{ backgroundColor: 'currentColor' }} />
    </div>
  );
}
