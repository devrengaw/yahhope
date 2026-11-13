import React from 'react';
import { Link } from 'react-router-dom';
import {
  GraduationCap,
  Users,
  Award,
  UserCheck,
  BookOpen,
  Heart,
  FileBarChart,
  Settings,
  CheckCircle2,
  Clock,
  ShieldCheck,
  ArrowRight,
  Lock,
} from 'lucide-react';
import { useUniversity } from '../../contexts/UniversityContext';
import { useAuth } from '../../contexts/AuthContext';

export function UniversityDashboard() {
  const { user } = useAuth();
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

  const activeStudents = students.filter(
    s => s.application_status === 'approved' && s.enrollment_status === 'active'
  );
  const pendingApplications = students.filter(s => s.application_status === 'pending');
  const activeScholarships = scholarships.filter(s => s.status === 'active');
  const monthlyBudget = activeScholarships.reduce((sum, s) => sum + Number(s.monthly_amount || 0), 0);
  const pendingApprovalPayments = payments.filter(p => p.status === 'pending_approval');
  const approvedAwaitingExecution = payments.filter(p => p.status === 'approved');
  const activeMentors = mentors.filter(m => m.status === 'active');
  const activeSponsorships = sponsorships.filter(s => s.status === 'active');
  const monthlyFunded = activeSponsorships.reduce((sum, s) => sum + Number(s.monthly_amount || 0), 0);

  const avgGpa =
    academicRecords.length > 0
      ? (academicRecords.reduce((acc, r) => acc + Number(r.gpa || 0), 0) / academicRecords.length).toFixed(1)
      : '0.0';

  const quickModules = [
    {
      title: 'Estudantes & Inscrições',
      description: 'Cadastro de bolsistas, triagem de candidatos, aprovação de inscrições e dados confidenciais protegidos.',
      path: '/futuro-universitario/students',
      icon: Users,
      allowed: can('fu:students:view'),
      badge: `${activeStudents.length} ativos • ${pendingApplications.length} pendentes`,
      color: 'bg-slate-100 text-slate-700 border-slate-200',
    },
    {
      title: 'Bolsas & Pagamentos',
      description: 'Gestão de bolsas integrais/parciais, aprovação de desembolsos e registro de pagamentos mensais.',
      path: '/futuro-universitario/scholarships',
      icon: Award,
      allowed: can('fu:scholarships:view'),
      badge: `${activeScholarships.length} bolsas • R$ ${monthlyBudget.toLocaleString('pt-BR')}/mês`,
      color: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    },
    {
      title: 'Mentores & Mentorias',
      description: 'Profissionais voluntários vinculados aos estudantes e registro seguro de encontros de mentoria.',
      path: '/futuro-universitario/mentors',
      icon: UserCheck,
      allowed: can('fu:mentors:view'),
      badge: `${activeMentors.length} mentores • ${mentorships.length} sessões`,
      color: 'bg-amber-50 text-amber-600 border-amber-100',
    },
    {
      title: 'Acompanhamento Acadêmico',
      description: 'Notas semestrais (CR/GPA), frequência, disciplinas aprovadas e horas de contrapartida comunitária.',
      path: '/futuro-universitario/academic',
      icon: BookOpen,
      allowed: can('fu:academic:view'),
      badge: `Média Geral ${avgGpa}`,
      color: 'bg-blue-50 text-blue-600 border-blue-100',
    },
    {
      title: 'Apoiadores & Padrinhos',
      description: 'Mantenedores gerais, padrinhos individuais e apoiadores parciais vinculados ao Portal do Mantenedor.',
      path: '/futuro-universitario/supporters',
      icon: Heart,
      allowed: can('fu:supporters:view'),
      badge: `${activeSponsorships.length} vínculos • R$ ${monthlyFunded.toLocaleString('pt-BR')}/mês`,
      color: 'bg-rose-50 text-rose-600 border-rose-100',
    },
    {
      title: 'Relatórios & Impacto',
      description: 'Indicadores de impacto, atualizações para o Portal dos Mantenedores e exportação de dados.',
      path: '/futuro-universitario/reports',
      icon: FileBarChart,
      allowed: can('fu:reports:view'),
      badge: 'Transparência & Exportação',
      color: 'bg-purple-50 text-purple-600 border-purple-100',
    },
    {
      title: 'Configurações do Módulo',
      description: 'Parâmetros de valores de bolsa, regras de privacidade do portal e matriz de permissões.',
      path: '/futuro-universitario/settings',
      icon: Settings,
      allowed: can('fu:settings:manage'),
      badge: 'Governança & Privacidade',
      color: 'bg-slate-100 text-slate-700 border-slate-200',
    },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header Banner */}
      <div className="relative overflow-hidden bg-gradient-to-br from-[#6e6e6e] via-[#878787] to-slate-700 rounded-[2rem] p-6 sm:p-8 text-white shadow-xl border border-slate-500/30">
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 bg-white/15 border border-white/25 px-3.5 py-1 rounded-full text-white text-xs font-bold uppercase tracking-wider">
              <GraduationCap size={15} />
              <span>Módulo Integrado • YAH Hope</span>
            </div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight">
              {config.program_name}
            </h1>
            <p className="text-xs sm:text-sm text-slate-100/90 leading-relaxed">
              {config.short_description}
            </p>
          </div>

          <div className="bg-black/20 backdrop-blur-md border border-white/15 rounded-2xl p-4 sm:p-5 space-y-2 shrink-0 min-w-[250px]">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-200 uppercase tracking-wider">
              <ShieldCheck size={16} className="text-emerald-400" />
              <span>Controle de Acesso Ativo</span>
            </div>
            <p className="text-xs text-white font-semibold">
              Operador: <span className="text-slate-200">{user?.name}</span>
            </p>
            <p className="text-[11px] text-slate-200/80">
              Privacidade LGPD/Portal: <strong className="text-emerald-300">Proteção Estrita Ativa</strong>
            </p>
            <div className="pt-1">
              <Link
                to="/portal/futuro-universitario"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-300 hover:text-amber-200 transition-colors"
              >
                <span>Ver visão no Portal do Mantenedor</span>
                <ArrowRight size={13} />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-2xl bg-slate-100 text-slate-700 flex items-center justify-center">
              <Users size={20} />
            </div>
            {pendingApplications.length > 0 && (
              <span className="text-[10px] font-bold bg-amber-100 text-amber-800 px-2.5 py-0.5 rounded-full">
                {pendingApplications.length} inscrição pendente
              </span>
            )}
          </div>
          <div>
            <span className="text-2xl sm:text-3xl font-black text-slate-900 block">
              {activeStudents.length}
            </span>
            <span className="text-xs font-bold text-slate-500">Estudantes Universitários Ativos</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Award size={20} />
            </div>
            <span className="text-[10px] font-bold bg-emerald-50 text-emerald-700 px-2.5 py-0.5 rounded-full">
              {activeScholarships.length} bolsas ativas
            </span>
          </div>
          <div>
            <span className="text-2xl sm:text-3xl font-black text-slate-900 block">
              R$ {monthlyBudget.toLocaleString('pt-BR')}
            </span>
            <span className="text-xs font-bold text-slate-500">Compromisso Mensal de Bolsas</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <UserCheck size={20} />
            </div>
            <span className="text-[10px] font-bold bg-amber-50 text-amber-800 px-2.5 py-0.5 rounded-full">
              {mentorships.length} encontros
            </span>
          </div>
          <div>
            <span className="text-2xl sm:text-3xl font-black text-slate-900 block">
              {activeMentors.length}
            </span>
            <span className="text-xs font-bold text-slate-500">Mentores Voluntários Ativos</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <Heart size={20} />
            </div>
            <span className="text-[10px] font-bold bg-rose-50 text-rose-700 px-2.5 py-0.5 rounded-full">
              {activeSponsorships.length} apoiadores
            </span>
          </div>
          <div>
            <span className="text-2xl sm:text-3xl font-black text-slate-900 block">
              R$ {monthlyFunded.toLocaleString('pt-BR')}
            </span>
            <span className="text-xs font-bold text-slate-500">Captação Mensal Vinculada</span>
          </div>
        </div>
      </div>

      {/* Filas Operacionais Pendentes */}
      {(pendingApplications.length > 0 ||
        pendingApprovalPayments.length > 0 ||
        approvedAwaitingExecution.length > 0) && (
        <div className="bg-amber-50/80 border border-amber-200 rounded-3xl p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center shrink-0">
              <Clock size={20} />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900">Pendências Operacionais do Módulo</h3>
              <p className="text-xs text-slate-600 mt-0.5">
                Existem{' '}
                <strong>{pendingApplications.length} inscrição(ões)</strong> aguardando avaliação,{' '}
                <strong>{pendingApprovalPayments.length} pagamento(s)</strong> aguardando aprovação e{' '}
                <strong>{approvedAwaitingExecution.length} pagamento(s)</strong> aprovados aguardando registro de baixa.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {pendingApplications.length > 0 && can('fu:students:view') && (
              <Link
                to="/futuro-universitario/students?filter=pending"
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all"
              >
                Avaliar Inscrições
              </Link>
            )}
            {(pendingApprovalPayments.length > 0 || approvedAwaitingExecution.length > 0) &&
              can('fu:scholarships:view') && (
                <Link
                  to="/futuro-universitario/scholarships"
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition-all"
                >
                  Gerenciar Pagamentos
                </Link>
              )}
          </div>
        </div>
      )}

      {/* Sub-módulos conforme permissões internas */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-black text-slate-900">Áreas do Futuro Universitário</h2>
          <span className="text-xs text-slate-500 font-medium">
            Acesso controlado pelas permissões internas do seu perfil
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {quickModules.map(item => {
            const Icon = item.icon;
            if (!item.allowed) {
              return (
                <div
                  key={item.path}
                  className="bg-slate-100/70 rounded-3xl p-5 border border-slate-200/70 opacity-60 flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="w-10 h-10 rounded-2xl bg-slate-200 text-slate-500 flex items-center justify-center">
                        <Icon size={20} />
                      </div>
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-500 bg-slate-200 px-2.5 py-1 rounded-full">
                        <Lock size={11} /> Sem Permissão
                      </span>
                    </div>
                    <h3 className="font-black text-slate-700 text-base">{item.title}</h3>
                    <p className="text-xs text-slate-500 leading-relaxed">{item.description}</p>
                  </div>
                </div>
              );
            }

            return (
              <Link
                key={item.path}
                to={item.path}
                className="bg-white rounded-3xl p-5 border border-slate-200/80 hover:border-slate-400 shadow-xs hover:shadow-md transition-all flex flex-col justify-between group"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className={`w-10 h-10 rounded-2xl border flex items-center justify-center ${item.color}`}>
                      <Icon size={20} />
                    </div>
                    <span className="text-[10px] font-bold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-full">
                      {item.badge}
                    </span>
                  </div>
                  <h3 className="font-black text-slate-900 text-base group-hover:text-slate-700 transition-colors">
                    {item.title}
                  </h3>
                  <p className="text-xs text-slate-500 leading-relaxed">{item.description}</p>
                </div>

                <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-slate-700">
                  <span>Acessar área</span>
                  <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
