import React, { useState } from 'react';
import {
  FileBarChart,
  Download,
  Plus,
  Newspaper,
  CheckCircle2,
  X,
} from 'lucide-react';
import { useUniversity } from '../../contexts/UniversityContext';

export function UniversityReports() {
  const {
    students,
    scholarships,
    payments,
    academicRecords,
    sponsorships,
    updates,
    can,
    addProgramUpdate,
  } = useUniversity();

  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [content, setContent] = useState('');
  const [updateType, setUpdateType] = useState<'program_update' | 'impact_report' | 'student_milestone'>(
    'program_update'
  );
  const [studentId, setStudentId] = useState<string>('');

  const handleExportCsv = () => {
    if (!can('fu:reports:export')) {
      alert('Você não possui a permissão fu:reports:export para exportar relatórios.');
      return;
    }

    const headers = [
      'Codigo',
      'Nome',
      'Curso',
      'Instituicao',
      'Semestre_Atual',
      'Status_Inscricao',
      'Status_Matricula',
      'Visivel_Portal',
    ];
    const rows = students.map(s => [
      s.registration_code,
      `"${s.name}"`,
      `"${s.course}"`,
      `"${s.institution}"`,
      s.current_semester,
      s.application_status,
      s.enrollment_status,
      s.portal_visible ? 'SIM' : 'NAO',
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `relatorio_futuro_universitario_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePublishUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await addProgramUpdate({
      student_id: studentId ? studentId : null,
      title,
      summary,
      content,
      update_type: updateType,
      published_to_portal: true,
    });
    if (!res.success) {
      alert(res.error);
      return;
    }
    setIsUpdateModalOpen(false);
    setTitle('');
    setSummary('');
    setContent('');
    setStudentId('');
  };

  const totalPaidAmount = payments
    .filter(p => p.status === 'paid')
    .reduce((acc, p) => acc + Number(p.amount || 0), 0);

  const totalHours = academicRecords.reduce(
    (acc, r) => acc + Number(r.community_hours_completed || 0),
    0
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 flex items-center gap-2.5">
            <FileBarChart className="text-purple-600" size={28} />
            Relatórios & Transparência no Portal
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Indicadores consolidados de impacto, relatórios para mantenedores e exportação de dados.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setIsUpdateModalOpen(true)}
            className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow-sm cursor-pointer"
          >
            <Plus size={16} /> Publicar Relatório no Portal
          </button>

          {can('fu:reports:export') && (
            <button
              onClick={handleExportCsv}
              className="bg-slate-900 hover:bg-slate-800 text-white px-4 py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              <Download size={16} /> Exportar CSV
            </button>
          )}
        </div>
      </div>

      {/* Resumo Consolidado */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-3xl border border-slate-200/80">
          <span className="text-xs font-bold text-slate-400 uppercase block">Total Desembolsado (Pago)</span>
          <span className="text-2xl font-black text-slate-900 mt-1 block">
            R$ {totalPaidAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </span>
          <span className="text-xs text-emerald-600 font-semibold mt-1 block">
            {scholarships.length} bolsas monitoradas
          </span>
        </div>
        <div className="bg-white p-5 rounded-3xl border border-slate-200/80">
          <span className="text-xs font-bold text-slate-400 uppercase block">Horas de Retribuição Comunitária</span>
          <span className="text-2xl font-black text-indigo-600 mt-1 block">{totalHours} horas</span>
          <span className="text-xs text-slate-500 mt-1 block">
            Reforço escolar e ações comunitárias em Moçambique
          </span>
        </div>
        <div className="bg-white p-5 rounded-3xl border border-slate-200/80">
          <span className="text-xs font-bold text-slate-400 uppercase block">Apoiadores Ativos</span>
          <span className="text-2xl font-black text-rose-600 mt-1 block">
            {sponsorships.filter(s => s.status === 'active').length} vínculos
          </span>
          <span className="text-xs text-slate-500 mt-1 block">
            Geral, Individual e Parcial sincronizados
          </span>
        </div>
      </div>

      {/* Lista de Atualizações e Relatórios Publicados no Portal do Mantenedor */}
      <div className="space-y-3">
        <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
          <Newspaper size={20} className="text-purple-600" />
          Atualizações e Relatórios de Impacto Disponíveis no Portal
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {updates.map(u => (
            <div
              key={u.id}
              className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-2"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-purple-50 text-purple-700">
                  {u.update_type === 'impact_report'
                    ? 'Relatório de Impacto'
                    : u.update_type === 'student_milestone'
                    ? 'Marco do Estudante'
                    : 'Atualização do Programa'}
                </span>
                <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700">
                  <CheckCircle2 size={13} /> Publicado no Portal
                </span>
              </div>
              <h3 className="text-base font-black text-slate-900">{u.title}</h3>
              <p className="text-xs text-slate-600 leading-relaxed">{u.summary}</p>
            </div>
          ))}
        </div>
      </div>

      {isUpdateModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-black text-slate-900">Publicar Atualização / Relatório no Portal</h3>
              <button onClick={() => setIsUpdateModalOpen(false)} className="text-slate-400">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handlePublishUpdate} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Tipo</label>
                  <select
                    value={updateType}
                    onChange={e => setUpdateType(e.target.value as any)}
                    className="w-full border border-slate-200 rounded-xl px-3.5 py-2 text-sm bg-white"
                  >
                    <option value="program_update">Atualização do Programa</option>
                    <option value="impact_report">Relatório de Impacto</option>
                    <option value="student_milestone">Marco de Estudante</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Destinatários no Portal</label>
                  <select
                    value={studentId}
                    onChange={e => setStudentId(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-3.5 py-2 text-sm bg-white"
                  >
                    <option value="">Todos os Mantenedores do Programa</option>
                    {students.map(s => (
                      <option key={s.id} value={s.id}>
                        Apenas Padrinhos de {s.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Título *</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3.5 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Resumo *</label>
                <input
                  type="text"
                  required
                  value={summary}
                  onChange={e => setSummary(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3.5 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Conteúdo Completo *</label>
                <textarea
                  rows={3}
                  required
                  value={content}
                  onChange={e => setContent(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3.5 py-2 text-sm"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsUpdateModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-purple-600 text-white text-xs font-black uppercase"
                >
                  Publicar no Portal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
