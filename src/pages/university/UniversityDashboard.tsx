import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  Award,
  UserCheck,
  BookOpen,
  Heart,
  Calendar,
  AlertCircle,
  ArrowRight,
  Clock,
  CheckCircle2,
  GraduationCap,
  TrendingUp,
  DollarSign,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { format, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useUniversity } from '../../contexts/UniversityContext';

export function UniversityDashboard() {
  const today = new Date();
  const {
    config,
    students,
    scholarships,
    payments,
    mentors,
    mentorships,
    academicRecords,
    sponsorships,
    can,
  } = useUniversity();

  // Métricas de estudantes
  const activeStudents = students.filter(
    s => s.application_status === 'approved' && s.enrollment_status === 'active'
  );
  const pendingApplications = students.filter(s => s.application_status === 'pending');
  const graduatedStudents = students.filter(s => s.enrollment_status === 'graduated');
  const inactiveOrSuspended = students.filter(
    s => s.enrollment_status === 'suspended' || s.enrollment_status === 'inactive' || s.application_status === 'rejected'
  );

  // Métricas de bolsas e pagamentos
  const activeScholarships = scholarships.filter(s => s.status === 'active');
  const monthlyBudget = activeScholarships.reduce((sum, s) => sum + Number(s.monthly_amount || 0), 0);
  const pendingApprovalPayments = payments.filter(p => p.status === 'pending_approval');
  const approvedAwaitingExecution = payments.filter(p => p.status === 'approved');
  const paidPaymentsTotal = payments
    .filter(p => p.status === 'paid')
    .reduce((sum, p) => sum + Number(p.amount || 0), 0);

  // Métricas de mentores e mentorias
  const activeMentors = mentors.filter(m => m.status === 'active');
  const completedMentorships = mentorships.filter(m => m.status === 'completed');
  const scheduledMentorships = mentorships.filter(m => m.status === 'scheduled');

  // Métricas acadêmicas
  const avgGpa =
    academicRecords.length > 0
      ? (academicRecords.reduce((acc, r) => acc + Number(r.gpa || 0), 0) / academicRecords.length).toFixed(1)
      : '0.0';
  const avgAttendance =
    academicRecords.length > 0
      ? Math.round(
          academicRecords.reduce((acc, r) => acc + Number(r.attendance_rate || 0), 0) / academicRecords.length
        )
      : 0;
  const totalCommunityHours = academicRecords.reduce(
    (acc, r) => acc + Number(r.community_hours_completed || 0),
    0
  );
  const academicAlerts = academicRecords.filter(
    r => r.academic_status === 'atencao' || r.academic_status === 'reprovado'
  );

  // Métricas de apoiadores
  const activeSponsorships = sponsorships.filter(s => s.status === 'active');
  const monthlyFunded = activeSponsorships.reduce((sum, s) => sum + Number(s.monthly_amount || 0), 0);
  const individualCount = activeSponsorships.filter(s => s.modality === 'individual').length;
  const partialCount = activeSponsorships.filter(s => s.modality === 'partial').length;
  const generalCount = activeSponsorships.filter(s => s.modality === 'general').length;

  // Dados do gráfico de rosca (Cenário Atual dos Estudantes)
  const statusData = [
    { name: 'Ativos', value: activeStudents.length, color: '#10b981' },
    { name: 'Pendentes', value: pendingApplications.length, color: '#f59e0b' },
    { name: 'Formados', value: graduatedStudents.length, color: '#64748b' },
    { name: 'Inativos', value: inactiveOrSuspended.length, color: '#ef4444' },
  ];

  // Dados do gráfico de área (Fluxo dos últimos 6 meses de pagamentos & captação)
  const chartData = useMemo(() => {
    return Array.from({ length: 6 }).map((_, i) => {
      const date = subMonths(today, 5 - i);
      const monthName = format(date, 'MMM', { locale: ptBR });
      const refMonth = format(date, 'yyyy-MM');

      const desembolsos = payments
        .filter(p => p.reference_month === refMonth && p.status === 'paid')
        .reduce((acc, p) => acc + Number(p.amount || 0), 0);

      return {
        name: monthName.charAt(0).toUpperCase() + monthName.slice(1),
        desembolsos,
        captacao: monthlyFunded,
      };
    });
  }, [payments, monthlyFunded]);

  // Alertas & Parâmetros críticos do módulo
  const alerts = useMemo(() => {
    const list: Array<{ title: string; desc: string; type: 'alert' | 'info' | 'success'; meta: string }> = [];

    if (pendingApplications.length > 0) {
      list.push({
        title: `${pendingApplications.length} Inscrição(ões) Pendente(s)`,
        desc: 'Candidatos aguardando avaliação e aprovação da coordenação.',
        type: 'alert',
        meta: 'Estudantes',
      });
    }
    if (pendingApprovalPayments.length > 0) {
      list.push({
        title: `${pendingApprovalPayments.length} Pagamento(s) para Aprovar`,
        desc: 'Desembolsos de bolsas aguardando aprovação financeira.',
        type: 'alert',
        meta: 'Bolsas',
      });
    }
    if (academicAlerts.length > 0) {
      list.push({
        title: `${academicAlerts.length} Alerta(s) Acadêmico(s)`,
        desc: 'Estudantes com status de atenção ou risco de reprovação.',
        type: 'alert',
        meta: 'Acadêmico',
      });
    }
    list.push({
      title: 'Valores Vigentes das Modalidades',
      desc: `Padrinho: R$ ${config.full_scholarship_amount} (${config.full_scholarship_amount_mzn} MT) • Parcial: R$ ${config.partial_quota_amount} (${config.partial_quota_amount_mzn} MT)`,
      type: 'info',
      meta: 'Configurações',
    });
    list.push({
      title: 'Contrapartida Comunitária',
      desc: `Meta semestral: ${config.counterpart_hours_required}h por estudante • Total registrado: ${totalCommunityHours}h.`,
      type: 'success',
      meta: 'Impacto Social',
    });

    return list;
  }, [
    pendingApplications.length,
    pendingApprovalPayments.length,
    academicAlerts.length,
    config,
    totalCommunityHours,
  ]);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header estilo Dashboard Nutrição */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            Dashboard Geral
          </h1>
          <p className="text-slate-500 mt-1 font-medium italic">
            Visão consolidada do {config.program_name}
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm font-bold text-slate-600 bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm">
          <Calendar size={16} className="text-slate-600" />
          {format(today, "d 'de' MMMM, yyyy", { locale: ptBR })}
        </div>
      </div>

      {/* Metrics Grid (4 KPIs principais) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Estudantes Ativos"
          value={activeStudents.length.toString()}
          icon={Users}
          badge={`${pendingApplications.length} pendentes`}
          badgeType={pendingApplications.length > 0 ? 'amber' : 'emerald'}
          color="slate"
        />
        <MetricCard
          title="Bolsas Mensais"
          value={`R$ ${monthlyBudget.toLocaleString('pt-BR')}`}
          icon={Award}
          badge={`${activeScholarships.length} ativas`}
          badgeType="emerald"
          color="emerald"
        />
        <MetricCard
          title="Mentores & Sessões"
          value={activeMentors.length.toString()}
          icon={UserCheck}
          badge={`${completedMentorships.length} realizadas`}
          badgeType="slate"
          color="amber"
        />
        <MetricCard
          title="Captação Apoiadores"
          value={`R$ ${monthlyFunded.toLocaleString('pt-BR')}`}
          icon={Heart}
          badge={`${activeSponsorships.length} vínculos`}
          badgeType="emerald"
          color="rose"
        />
      </div>

      {/* Main Content Grid (2/3 + 1/3) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Coluna Esquerda (2/3) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Fila de Inscrições & Pendências Operacionais */}
          <div className="bg-white p-6 sm:p-8 rounded-[2.5rem] shadow-sm border border-slate-100 relative overflow-hidden">
            <div className="flex items-center justify-between mb-6 relative z-10">
              <div>
                <h2 className="text-xl font-black text-slate-900">Fila de Inscrições & Bolsas</h2>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">
                  Acompanhamento em tempo real
                </p>
              </div>
              <span className="bg-[#878787] text-white text-[10px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full shadow-sm">
                {pendingApplications.length + pendingApprovalPayments.length} Pendências
              </span>
            </div>

            <div className="space-y-3 relative z-10">
              {pendingApplications.map(st => (
                <div
                  key={st.id}
                  className="flex items-center justify-between p-4 rounded-2xl border border-slate-100 bg-slate-50/40 hover:border-slate-300 hover:bg-white transition-all group shadow-xs"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-11 h-11 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-800 font-black shadow-xs">
                      {st.name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-slate-900">{st.name}</h3>
                      <p className="text-[11px] font-semibold text-slate-500">
                        Inscrição pendente • {st.course} ({st.institution})
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-xl border text-amber-700 bg-amber-50 border-amber-200 flex items-center gap-1">
                      <Clock size={12} /> Pendente
                    </span>
                    {can('fu:students:view') && (
                      <Link
                        to="/futuro-universitario/students?filter=pending"
                        className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-all"
                      >
                        <ArrowRight size={18} />
                      </Link>
                    )}
                  </div>
                </div>
              ))}

              {pendingApprovalPayments.map(pay => {
                const st = students.find(s => s.id === pay.student_id);
                return (
                  <div
                    key={pay.id}
                    className="flex items-center justify-between p-4 rounded-2xl border border-slate-100 bg-slate-50/40 hover:border-slate-300 hover:bg-white transition-all group shadow-xs"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-11 h-11 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-700 font-black shadow-xs">
                        <DollarSign size={18} />
                      </div>
                      <div>
                        <h3 className="text-sm font-black text-slate-900">
                          {st?.name || 'Estudante'} — {pay.reference_month}
                        </h3>
                        <p className="text-[11px] font-semibold text-slate-500">
                          Pagamento ({pay.category}) aguardando aprovação • R$ {pay.amount.toLocaleString('pt-BR')}
                        </p>
                      </div>
                    </div>
                    {can('fu:scholarships:view') && (
                      <Link
                        to="/futuro-universitario/scholarships"
                        className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-all"
                      >
                        <ArrowRight size={18} />
                      </Link>
                    )}
                  </div>
                );
              })}

              {pendingApplications.length === 0 && pendingApprovalPayments.length === 0 && (
                <div className="py-10 text-center">
                  <CheckCircle2 size={28} className="mx-auto text-emerald-500 mb-2 opacity-70" />
                  <p className="text-slate-400 font-medium italic text-sm">
                    Nenhuma inscrição ou pagamento pendente de aprovação no momento.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Parâmetros Acadêmicos, Mentoria e Financeiro Consolidados */}
          <div className="bg-white p-6 sm:p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-black text-slate-900">Parâmetros Operacionais do Módulo</h2>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">
                  Acadêmico, Mentoria, Financeiro & Contrapartida
                </p>
              </div>
              {can('fu:academic:view') && (
                <Link
                  to="/futuro-universitario/academic"
                  className="text-xs font-bold text-slate-600 hover:text-slate-900 flex items-center gap-1"
                >
                  <span>Ver Acadêmico</span>
                  <ArrowRight size={14} />
                </Link>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                  Média Acadêmica (CR)
                </span>
                <span className="text-2xl font-black text-slate-900 mt-1 block">{avgGpa}</span>
                <span className="text-[11px] text-slate-500">{academicRecords.length} registros</span>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                  Frequência Média
                </span>
                <span className="text-2xl font-black text-slate-900 mt-1 block">{avgAttendance}%</span>
                <span className="text-[11px] text-slate-500">Presença semestral</span>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                  Horas Comunitárias
                </span>
                <span className="text-2xl font-black text-slate-900 mt-1 block">{totalCommunityHours}h</span>
                <span className="text-[11px] text-slate-500">
                  Meta: {config.counterpart_hours_required}h/semestre
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                  Total Pago em Bolsas
                </span>
                <span className="text-2xl font-black text-emerald-700 mt-1 block">
                  R$ {paidPaymentsTotal.toLocaleString('pt-BR')}
                </span>
                <span className="text-[11px] text-slate-500">
                  {approvedAwaitingExecution.length} aguardando baixa
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                  Mentorias Agendadas
                </span>
                <span className="text-2xl font-black text-slate-900 mt-1 block">
                  {scheduledMentorships.length}
                </span>
                <span className="text-[11px] text-slate-500">
                  {mentorships.length} sessões no total
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                  Modalidades de Apoio
                </span>
                <span className="text-sm font-black text-slate-900 mt-1 block">
                  {individualCount} Indiv. • {partialCount} Parc. • {generalCount} Geral
                </span>
                <span className="text-[11px] text-slate-500">Apoiadores ativos</span>
              </div>
            </div>
          </div>

          {/* Gráfico de Fluxo Financeiro */}
          <div className="bg-white p-6 sm:p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
            <h2 className="text-xl font-black text-slate-900 mb-6 text-center lg:text-left">
              Fluxo de Desembolsos vs Captação (6 Meses)
            </h2>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 0, right: 0, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorDesembolsos" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#878787" stopOpacity={0.28} />
                      <stop offset="95%" stopColor="#878787" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 800 }}
                    dy={10}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 800 }}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: '20px',
                      border: 'none',
                      boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)',
                      padding: '14px',
                      fontWeight: 'bold',
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="desembolsos"
                    name="Desembolsos Pagos (R$)"
                    stroke="#64748b"
                    strokeWidth={3}
                    fill="url(#colorDesembolsos)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Coluna Direita (1/3) */}
        <div className="space-y-6">
          {/* Cenário Atual (Donut Chart) */}
          <div className="bg-white p-6 sm:p-8 rounded-[2.5rem] shadow-sm border border-slate-100 flex flex-col">
            <h2 className="text-xl font-black text-slate-900 mb-1">Cenário Atual</h2>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mb-6">
              Distribuição dos Estudantes
            </p>
            <div className="flex-1 min-h-[220px] relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={
                      students.length > 0
                        ? statusData
                        : [{ name: 'Sem cadastros', value: 1, color: '#e2e8f0' }]
                    }
                    cx="50%"
                    cy="50%"
                    innerRadius={65}
                    outerRadius={90}
                    paddingAngle={students.length > 0 ? 8 : 0}
                    dataKey="value"
                  >
                    {(students.length > 0
                      ? statusData
                      : [{ name: 'Sem cadastros', value: 1, color: '#e2e8f0' }]
                    ).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-4xl font-black text-slate-900 tracking-tighter">
                  {students.length}
                </span>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                  Estudantes
                </span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 mt-6">
              {statusData.map((item, i) => (
                <div
                  key={i}
                  className="bg-slate-50/70 p-3 rounded-2xl border border-slate-100 flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider">
                      {item.name}
                    </span>
                  </div>
                  <span className="text-sm font-black text-slate-900">{item.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Card Escuro de Parâmetros & Alertas (estilo Nutrição) */}
          <div className="bg-slate-900 p-6 sm:p-8 rounded-[2.5rem] shadow-xl text-white relative overflow-hidden group">
            <div className="relative z-10">
              <h2 className="text-lg font-black mb-6 flex items-center gap-2">
                <AlertCircle className="text-amber-500" size={20} />
                Parâmetros & Alertas
              </h2>
              <div className="space-y-5">
                {alerts.map((alert, i) => (
                  <div key={i} className="flex gap-3.5 items-start">
                    <div
                      className={`w-2 h-2 mt-2 rounded-full shrink-0 ${
                        alert.type === 'alert'
                          ? 'bg-red-500 animate-pulse'
                          : alert.type === 'success'
                          ? 'bg-emerald-500'
                          : 'bg-slate-400'
                      }`}
                    />
                    <div>
                      <p className="text-sm font-black text-slate-100">{alert.title}</p>
                      <p className="text-xs text-slate-400 font-medium mt-0.5 leading-relaxed">
                        {alert.desc}
                      </p>
                      <p className="text-[9px] font-black text-slate-500 mt-1.5 uppercase tracking-widest">
                        {alert.meta}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-6 pt-4 border-t border-white/10 flex flex-wrap gap-3">
                {can('fu:settings:manage') && (
                  <Link
                    to="/futuro-universitario/settings"
                    className="text-xs font-bold text-slate-300 hover:text-white flex items-center gap-1"
                  >
                    <span>Ajustar Parâmetros</span>
                    <ArrowRight size={13} />
                  </Link>
                )}
                <Link
                  to="/portal/futuro-universitario"
                  className="text-xs font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1 ml-auto"
                >
                  <GraduationCap size={14} />
                  <span>Portal do Mantenedor</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function MetricCard({
  title,
  value,
  icon: Icon,
  badge,
  badgeType,
  color,
}: {
  title: string;
  value: string;
  icon: any;
  badge: string;
  badgeType: 'emerald' | 'amber' | 'slate';
  color: 'slate' | 'emerald' | 'amber' | 'rose';
}) {
  const colors = {
    slate: 'bg-slate-100 text-slate-700 border-slate-200',
    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    amber: 'bg-amber-50 text-amber-600 border-amber-100',
    rose: 'bg-rose-50 text-rose-600 border-rose-100',
  };
  const badgeColors = {
    emerald: 'text-emerald-700 bg-emerald-50',
    amber: 'text-amber-800 bg-amber-50',
    slate: 'text-slate-600 bg-slate-100',
  };

  return (
    <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 flex flex-col relative overflow-hidden group hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-300">
      <div className="flex justify-between items-start mb-5 relative z-10">
        <div
          className={`p-3.5 rounded-2xl border ${colors[color]} group-hover:scale-105 transition-transform duration-300 shadow-xs`}
        >
          <Icon size={22} />
        </div>
        <div
          className={`flex items-center gap-1 text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-lg ${badgeColors[badgeType]}`}
        >
          <TrendingUp size={11} />
          <span>{badge}</span>
        </div>
      </div>
      <div className="relative z-10">
        <h3 className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] mb-1">
          {title}
        </h3>
        <p className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">{value}</p>
      </div>
    </div>
  );
}
