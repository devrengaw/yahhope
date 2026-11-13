import React, { useState } from 'react';
import {
  GraduationCap,
  Heart,
  BookOpen,
  Award,
  Users,
  MapPin,
  Receipt,
  Newspaper,
  CheckCircle2,
  ShieldCheck,
  Sparkles,
  X,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import {
  useUniversity,
  UniversitySupporterModality,
} from '../../contexts/UniversityContext';
import { useFundraising } from '../../contexts/FundraisingContext';

export function PortalUniversityProgram() {
  const { user } = useAuth();
  const { getPortalDataForSupporter, addSponsorship } = useUniversity();
  const { allDonations } = useFundraising();

  const portalData = getPortalDataForSupporter(user?.id, user?.email);
  const {
    config,
    impactMetrics,
    mySponsorships,
    primaryModality,
    totalMonthlyCommitted,
    authorizedStudents,
    availableStudentsForSponsorship,
    programUpdates,
  } = portalData;

  const [isSupportModalOpen, setIsSupportModalOpen] = useState(false);
  const [selectedModality, setSelectedModality] = useState<UniversitySupporterModality>('general');
  const [selectedStudentId, setSelectedStudentId] = useState<string>(
    availableStudentsForSponsorship[0]?.id || ''
  );
  const [customAmount, setCustomAmount] = useState<number>(config.default_general_amount);
  const [supportSuccess, setSupportSuccess] = useState(false);

  // Filtra histórico de contribuições confirmadas deste usuário
  const myDonationHistory = allDonations.filter(d => {
    const emailMatches = Boolean(
      d.donor_email && user?.email && d.donor_email.toLowerCase().trim() === user.email.toLowerCase().trim()
    );
    const idMatches = Boolean(user?.id && (d.sponsor_id === user.id || d.user_id === user.id));
    return (emailMatches || idMatches) && d.status === 'paid';
  });

  const openModalityModal = (
    modality: UniversitySupporterModality,
    studentId?: string
  ) => {
    setSelectedModality(modality);
    if (studentId) {
      setSelectedStudentId(studentId);
    } else if (availableStudentsForSponsorship[0]) {
      setSelectedStudentId(availableStudentsForSponsorship[0].id);
    }
    if (modality === 'individual') {
      setCustomAmount(config.full_scholarship_amount);
    } else if (modality === 'partial') {
      setCustomAmount(config.partial_quota_amount);
    } else {
      setCustomAmount(config.default_general_amount);
    }
    setSupportSuccess(false);
    setIsSupportModalOpen(true);
  };

  const handleConfirmSupport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.email) return;

    const quotaPct =
      selectedModality === 'individual'
        ? 100
        : selectedModality === 'partial'
        ? Math.min(100, Math.round((customAmount / Math.max(1, config.full_scholarship_amount)) * 100))
        : 100;

    const res = await addSponsorship({
      sponsor_user_id: user.id,
      student_id: selectedModality === 'general' ? null : selectedStudentId,
      donor_name: user.name || 'Mantenedor YAH Hope',
      donor_email: user.email,
      donor_phone: user.phone,
      modality: selectedModality,
      monthly_amount: Number(customAmount),
      quota_percentage: quotaPct,
      currency: 'BRL',
      payment_method: 'credit_card',
      status: 'active',
      allow_student_updates: selectedModality !== 'general',
    });

    if (res.success) {
      setSupportSuccess(true);
      setTimeout(() => {
        setIsSupportModalOpen(false);
        setSupportSuccess(false);
      }, 1500);
    } else {
      alert(res.error);
    }
  };

  return (
    <div className="space-y-8 pb-20 animate-fade-in">
      {/* 1. Hero Institucional do Programa no Portal */}
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 rounded-[2rem] p-6 sm:p-10 text-white shadow-xl border border-indigo-800/40">
        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-7 space-y-4">
            <div className="inline-flex items-center gap-2 bg-indigo-500/20 border border-indigo-400/30 px-3.5 py-1.5 rounded-full text-indigo-200 text-xs font-bold uppercase tracking-wider">
              <GraduationCap size={15} />
              <span>Educação Superior & Mentoria • YAH Hope</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight leading-tight">
              {config.program_name}
            </h1>
            <p className="text-xs sm:text-sm text-slate-200 leading-relaxed max-w-2xl">
              {config.full_description}
            </p>
            <div className="pt-2 flex flex-wrap gap-3">
              <button
                onClick={() => openModalityModal('general')}
                className="px-5 py-3 bg-[#F49853] hover:bg-[#e0853d] text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-orange-500/20 transition-all cursor-pointer"
              >
                <Heart size={15} fill="currentColor" />
                <span>Apoiar como Mantenedor Geral</span>
              </button>
              <button
                onClick={() => openModalityModal('individual')}
                className="px-5 py-3 bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer"
              >
                <GraduationCap size={16} />
                <span>Apadrinhar Estudante (Integral ou Parcial)</span>
              </button>
            </div>
          </div>

          {/* Resumo do Vínculo do Mantenedor Logado */}
          <div className="lg:col-span-5">
            <div className="bg-white/10 backdrop-blur-md border border-white/15 rounded-2xl p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-200 flex items-center gap-2">
                  <Sparkles size={15} className="text-amber-400" />
                  Seu Vínculo no Programa
                </span>
                <span className="text-[10px] font-bold uppercase px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                  {primaryModality === 'individual'
                    ? 'Padrinho Individual'
                    : primaryModality === 'partial'
                    ? 'Apoiador Parcial'
                    : primaryModality === 'general'
                    ? 'Mantenedor Geral'
                    : 'Convidado a Apoiar'}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-black/25 p-3.5 rounded-xl border border-white/10">
                  <span className="text-[10px] text-slate-300 uppercase font-semibold block">
                    Seu Compromisso Mensal
                  </span>
                  <span className="text-lg font-black text-white mt-0.5 block">
                    R$ {totalMonthlyCommitted.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="bg-black/25 p-3.5 rounded-xl border border-white/10">
                  <span className="text-[10px] text-slate-300 uppercase font-semibold block">
                    Estudantes Vinculados
                  </span>
                  <span className="text-lg font-black text-amber-300 mt-0.5 block">
                    {authorizedStudents.length}{' '}
                    {authorizedStudents.length === 1 ? 'estudante' : 'estudantes'}
                  </span>
                </div>
              </div>

              <p className="text-[11px] text-indigo-100/80 flex items-center gap-1.5">
                <ShieldCheck size={14} className="text-emerald-400 shrink-0" />
                <span>
                  As informações exibidas respeitam os vínculos ativos e a privacidade estudantil.
                </span>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Indicadores de Impacto do Programa */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs">
          <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-3">
            <Users size={20} />
          </div>
          <span className="text-2xl font-black text-slate-900 block">
            {impactMetrics.activeStudentsCount}
          </span>
          <span className="text-xs font-bold text-slate-500">Universitários Bolsistas Ativos</span>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs">
          <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3">
            <Award size={20} />
          </div>
          <span className="text-2xl font-black text-slate-900 block">
            {impactMetrics.averageGpa} / 10
          </span>
          <span className="text-xs font-bold text-slate-500">Média Acadêmica Geral</span>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs">
          <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mb-3">
            <BookOpen size={20} />
          </div>
          <span className="text-2xl font-black text-slate-900 block">
            {impactMetrics.totalCommunityHours}h
          </span>
          <span className="text-xs font-bold text-slate-500">Retribuição Comunitária Cumprida</span>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs">
          <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mb-3">
            <GraduationCap size={20} />
          </div>
          <span className="text-2xl font-black text-slate-900 block">
            {impactMetrics.partnerInstitutionsCount}
          </span>
          <span className="text-xs font-bold text-slate-500">Universidades Parceiras</span>
        </div>
      </div>

      {/* 3. Estudantes Apoiados pelo Usuário (Exibido apenas para Padrinho Individual ou Apoiador Parcial com vínculo autorizado) */}
      {authorizedStudents.length > 0 && (
        <div className="space-y-4">
          <div>
            <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
              <GraduationCap className="text-indigo-600" size={24} />
              Estudante(s) Sob Seu Acompanhamento Autorizado
            </h2>
            <p className="text-xs text-slate-500">
              Informações acadêmicas e institucionais autorizadas conforme seu vínculo de{' '}
              {primaryModality === 'individual' ? 'Padrinho Individual' : 'Apoiador Parcial'}.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {authorizedStudents.map(st => (
              <div
                key={st.id}
                className="bg-white rounded-3xl border border-indigo-200/80 overflow-hidden shadow-sm flex flex-col justify-between"
              >
                <div className="p-6 bg-gradient-to-br from-slate-900 to-indigo-950 text-white flex items-start gap-4">
                  <div className="w-16 h-16 rounded-2xl overflow-hidden bg-white/10 border border-white/20 shrink-0 flex items-center justify-center font-black text-xl">
                    {st.photo_url ? (
                      <img src={st.photo_url} alt={st.name} className="w-full h-full object-cover" />
                    ) : (
                      st.name.charAt(0)
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-amber-400 text-slate-950">
                        {st.sponsorshipModality === 'individual'
                          ? 'Padrinho Individual (100%)'
                          : `Apoiador Parcial (${st.quotaPercentage}%)`}
                      </span>
                      <span className="text-xs font-bold text-indigo-200">
                        R$ {st.monthlyContribution}/mês
                      </span>
                    </div>
                    <h3 className="text-xl font-black text-white mt-2">{st.name}</h3>
                    <p className="text-xs text-indigo-200 font-semibold">{st.course}</p>
                    <p className="text-[11px] text-slate-300">{st.institution}</p>
                  </div>
                </div>

                <div className="p-6 space-y-4">
                  <div className="grid grid-cols-3 gap-2 text-center text-xs">
                    <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">Semestre</span>
                      <span className="font-black text-slate-900">
                        {st.current_semester}º / {st.total_semesters}
                      </span>
                    </div>
                    <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">Formatura</span>
                      <span className="font-black text-slate-900">{st.expected_graduation}</span>
                    </div>
                    <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">Cidade</span>
                      <span className="font-black text-slate-900">{st.city}</span>
                    </div>
                  </div>

                  {st.public_bio && (
                    <p className="text-xs text-slate-600 leading-relaxed">{st.public_bio}</p>
                  )}

                  {st.latestAcademicSummary && (
                    <div className="p-4 rounded-2xl bg-indigo-50/70 border border-indigo-100 space-y-1.5">
                      <div className="flex items-center justify-between text-xs font-black text-indigo-950">
                        <span>Boletim Autorizado ({st.latestAcademicSummary.period})</span>
                        <span className="text-emerald-700">
                          Média {st.latestAcademicSummary.gpa} • {st.latestAcademicSummary.attendance_rate}% freq.
                        </span>
                      </div>
                      {st.latestAcademicSummary.public_highlight && (
                        <p className="text-xs text-indigo-900 leading-relaxed">
                          {st.latestAcademicSummary.public_highlight}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. Modalidades de Apoio e Estudantes Elegíveis para Apadrinhamento */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-xl font-black text-slate-900">
              Modalidades de Participação & Bolsistas Elegíveis
            </h2>
            <p className="text-xs text-slate-500">
              Escolha apoiar o programa como Mantenedor Geral, Padrinho Individual ou Apoiador Parcial.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {availableStudentsForSponsorship.map(st => (
            <div
              key={st.id}
              className="bg-white rounded-3xl border border-slate-200/80 overflow-hidden shadow-xs flex flex-col justify-between"
            >
              <div>
                <div className="p-5 bg-slate-900 text-white flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-2xl overflow-hidden bg-white/10 shrink-0 flex items-center justify-center font-black">
                    {st.photo_url ? (
                      <img src={st.photo_url} alt={st.name} className="w-full h-full object-cover" />
                    ) : (
                      st.name.charAt(0)
                    )}
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-black text-white text-base truncate">{st.name}</h3>
                    <p className="text-xs text-indigo-300 truncate">{st.course}</p>
                    <p className="text-[11px] text-slate-400 truncate flex items-center gap-1">
                      <MapPin size={11} /> {st.institution}
                    </p>
                  </div>
                </div>

                <div className="p-5 space-y-3">
                  <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">{st.public_bio}</p>

                  <div className="space-y-1.5 pt-2">
                    <div className="flex justify-between text-xs font-bold">
                      <span className="text-slate-500">Cobertura da Bolsa</span>
                      <span className="text-indigo-600">{st.fundedPercentage}%</span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-indigo-600 rounded-full"
                        style={{ width: `${st.fundedPercentage}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-5 pt-0 flex gap-2">
                <button
                  onClick={() => openModalityModal('partial', st.id)}
                  className="flex-1 py-2.5 px-3 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  Apoiador Parcial
                </button>
                <button
                  onClick={() => openModalityModal('individual', st.id)}
                  className="flex-1 py-2.5 px-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  Padrinho Individual
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 5. Atualizações do Programa, Relatórios de Impacto e Histórico de Contribuições */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 space-y-4">
          <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
            <Newspaper size={20} className="text-indigo-600" />
            Atualizações do Programa & Relatórios de Impacto
          </h2>
          <div className="space-y-3">
            {programUpdates.map(upd => (
              <div
                key={upd.id}
                className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700">
                    {upd.update_type === 'impact_report'
                      ? 'Relatório de Impacto'
                      : upd.update_type === 'student_milestone'
                      ? 'Evolução de Bolsista'
                      : 'Atualização Geral'}
                  </span>
                  <span className="text-xs text-slate-400">
                    {new Date(upd.published_at).toLocaleDateString('pt-BR')}
                  </span>
                </div>
                <h3 className="text-base font-black text-slate-900">{upd.title}</h3>
                <p className="text-xs text-slate-600 leading-relaxed">{upd.content}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-5 space-y-4">
          <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
            <Receipt size={20} className="text-emerald-600" />
            Histórico de Contribuições & Vínculos
          </h2>
          <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs space-y-3">
            {mySponsorships.length === 0 && myDonationHistory.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-6">
                Você ainda não possui contribuições vinculadas ao Futuro Universitário. Escolha uma modalidade acima para participar!
              </p>
            ) : (
              <>
                {mySponsorships.map(sp => (
                  <div
                    key={sp.id}
                    className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between"
                  >
                    <div>
                      <span className="text-xs font-black text-slate-900 block">
                        {sp.modality === 'individual'
                          ? 'Padrinho Individual — Futuro Universitário'
                          : sp.modality === 'partial'
                          ? 'Apoiador Parcial — Futuro Universitário'
                          : 'Mantenedor Geral — Futuro Universitário'}
                      </span>
                      <span className="text-[11px] text-slate-500">
                        Ativo desde {new Date(sp.started_at).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                    <span className="text-sm font-black text-emerald-600">
                      R$ {Number(sp.monthly_amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}/mês
                    </span>
                  </div>
                ))}
                {myDonationHistory.slice(0, 4).map(d => (
                  <div
                    key={d.id}
                    className="p-3 rounded-2xl border border-slate-100 flex items-center justify-between text-xs"
                  >
                    <span className="text-slate-600">
                      Contribuição Confirmada ({new Date(d.paid_at || d.date || '').toLocaleDateString('pt-BR')})
                    </span>
                    <span className="font-bold text-slate-900">
                      R$ {Number(d.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                ))}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Modal de Adesão às 3 Modalidades */}
      {isSupportModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-black text-slate-900">Apoiar o Futuro Universitário</h3>
              <button onClick={() => setIsSupportModalOpen(false)} className="text-slate-400">
                <X size={20} />
              </button>
            </div>

            {supportSuccess ? (
              <div className="py-8 text-center space-y-3">
                <CheckCircle2 size={42} className="text-emerald-500 mx-auto" />
                <h4 className="text-lg font-black text-slate-900">Vínculo Registrado com Sucesso!</h4>
                <p className="text-xs text-slate-500">
                  As informações autorizadas do programa já estão disponíveis no seu Portal do Mantenedor.
                </p>
              </div>
            ) : (
              <form onSubmit={handleConfirmSupport} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Modalidade de Participação
                  </label>
                  <select
                    value={selectedModality}
                    onChange={e => {
                      const m = e.target.value as UniversitySupporterModality;
                      setSelectedModality(m);
                      if (m === 'individual') setCustomAmount(config.full_scholarship_amount);
                      else if (m === 'partial') setCustomAmount(config.partial_quota_amount);
                      else setCustomAmount(config.default_general_amount);
                    }}
                    className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm bg-white font-semibold"
                  >
                    <option value="general">Mantenedor Geral (Apoia o programa como um todo)</option>
                    <option value="individual">Padrinho Individual (Acompanha um estudante)</option>
                    <option value="partial">Apoiador Parcial (Cota parcial de um estudante)</option>
                  </select>
                </div>

                {selectedModality !== 'general' && (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Estudante Universitário
                    </label>
                    <select
                      value={selectedStudentId}
                      onChange={e => setSelectedStudentId(e.target.value)}
                      className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm bg-white"
                    >
                      {availableStudentsForSponsorship.map(st => (
                        <option key={st.id} value={st.id}>
                          {st.name} — {st.course}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Valor Mensal (R$)
                  </label>
                  <input
                    type="number"
                    min={25}
                    required
                    value={customAmount}
                    onChange={e => setCustomAmount(Number(e.target.value))}
                    className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm font-bold"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsSupportModalOpen(false)}
                    className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black uppercase"
                  >
                    Confirmar Apoio
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
