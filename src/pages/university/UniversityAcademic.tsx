import React, { useState } from 'react';
import { BookOpen, Plus, Award, Clock, Lock, X } from 'lucide-react';
import { useUniversity } from '../../contexts/UniversityContext';

export function UniversityAcademic() {
  const { students, academicRecords, can, saveAcademicRecord } = useUniversity();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [studentId, setStudentId] = useState(students[0]?.id || '');
  const [period, setPeriod] = useState('2026.2');
  const [semesterNumber, setSemesterNumber] = useState(5);
  const [gpa, setGpa] = useState(8.8);
  const [attendanceRate, setAttendanceRate] = useState(96);
  const [approvedSubjects, setApprovedSubjects] = useState(6);
  const [totalSubjects, setTotalSubjects] = useState(6);
  const [communityHours, setCommunityHours] = useState(24);
  const [academicStatus, setAcademicStatus] = useState<'excelente' | 'regular' | 'atencao' | 'reprovado'>('excelente');
  const [publicHighlight, setPublicHighlight] = useState('');
  const [internalObservations, setInternalObservations] = useState('');

  const getStudent = (id: string) => students.find(s => s.id === id);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await saveAcademicRecord({
      student_id: studentId,
      period,
      semester_number: Number(semesterNumber),
      gpa: Number(gpa),
      attendance_rate: Number(attendanceRate),
      approved_subjects: Number(approvedSubjects),
      total_subjects: Number(totalSubjects),
      community_hours_completed: Number(communityHours),
      academic_status: academicStatus,
      public_highlight: publicHighlight,
      internal_observations: internalObservations,
    });
    if (!res.success) {
      alert(res.error);
      return;
    }
    setIsModalOpen(false);
    setPublicHighlight('');
    setInternalObservations('');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 flex items-center gap-2.5">
            <BookOpen className="text-blue-600" size={28} />
            Acompanhamento Acadêmico
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Desempenho semestral, frequência e horas de contrapartida social dos estudantes.
          </p>
        </div>

        {can('fu:academic:edit') && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow-sm cursor-pointer"
          >
            <Plus size={16} /> Registrar Boletim Semestral
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {academicRecords.map(rec => {
          const st = getStudent(rec.student_id);
          return (
            <div
              key={rec.id}
              className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4"
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700">
                    Período {rec.period} • {rec.semester_number}º Semestre
                  </span>
                  <h3 className="text-lg font-black text-slate-900 mt-2">{st?.name || 'Estudante'}</h3>
                  <p className="text-xs text-slate-500">
                    {st?.course} — {st?.institution}
                  </p>
                </div>
                <span
                  className={`text-xs font-bold uppercase px-3 py-1 rounded-full ${
                    rec.academic_status === 'excelente'
                      ? 'bg-emerald-50 text-emerald-700'
                      : rec.academic_status === 'regular'
                      ? 'bg-blue-50 text-blue-700'
                      : 'bg-amber-50 text-amber-800'
                  }`}
                >
                  {rec.academic_status}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Média (CR)</span>
                  <span className="text-xl font-black text-slate-900">{rec.gpa}</span>
                </div>
                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Frequência</span>
                  <span className="text-xl font-black text-emerald-600">{rec.attendance_rate}%</span>
                </div>
                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Contrapartida</span>
                  <span className="text-xl font-black text-indigo-600">{rec.community_hours_completed}h</span>
                </div>
              </div>

              {rec.public_highlight && (
                <div className="p-3.5 rounded-2xl bg-emerald-50/60 border border-emerald-200/70">
                  <span className="text-[10px] font-black uppercase text-emerald-800 flex items-center gap-1 mb-1">
                    <Award size={12} /> Destaque Autorizável para o Portal do Padrinho
                  </span>
                  <p className="text-xs text-emerald-950">{rec.public_highlight}</p>
                </div>
              )}

              {rec.internal_observations && (
                <div className="p-3.5 rounded-2xl bg-slate-100/80 border border-slate-200">
                  <span className="text-[10px] font-black uppercase text-slate-500 flex items-center gap-1 mb-1">
                    <Lock size={11} /> Observação Pedagógica Interna (Restrita)
                  </span>
                  <p className="text-xs text-slate-700">{rec.internal_observations}</p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-black text-slate-900">Registrar Desempenho Acadêmico</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSave} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Estudante</label>
                <select
                  value={studentId}
                  onChange={e => setStudentId(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3.5 py-2 text-sm bg-white"
                >
                  {students.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.course})
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Período</label>
                  <input
                    type="text"
                    required
                    value={period}
                    onChange={e => setPeriod(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-3.5 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Semestre Nº</label>
                  <input
                    type="number"
                    required
                    value={semesterNumber}
                    onChange={e => setSemesterNumber(Number(e.target.value))}
                    className="w-full border border-slate-200 rounded-xl px-3.5 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Média (0-10)</label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={gpa}
                    onChange={e => setGpa(Number(e.target.value))}
                    className="w-full border border-slate-200 rounded-xl px-3.5 py-2 text-sm"
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Frequência (%)</label>
                  <input
                    type="number"
                    required
                    value={attendanceRate}
                    onChange={e => setAttendanceRate(Number(e.target.value))}
                    className="w-full border border-slate-200 rounded-xl px-3.5 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Horas Comunitárias</label>
                  <input
                    type="number"
                    required
                    value={communityHours}
                    onChange={e => setCommunityHours(Number(e.target.value))}
                    className="w-full border border-slate-200 rounded-xl px-3.5 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Situação</label>
                  <select
                    value={academicStatus}
                    onChange={e => setAcademicStatus(e.target.value as any)}
                    className="w-full border border-slate-200 rounded-xl px-3.5 py-2 text-sm bg-white"
                  >
                    <option value="excelente">Excelente</option>
                    <option value="regular">Regular</option>
                    <option value="atencao">Atenção</option>
                    <option value="reprovado">Reprovado</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Destaque Público (Visível aos padrinhos vinculados)
                </label>
                <textarea
                  rows={2}
                  value={publicHighlight}
                  onChange={e => setPublicHighlight(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3.5 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Observações Pedagógicas Internas (Restrito)
                </label>
                <textarea
                  rows={2}
                  value={internalObservations}
                  onChange={e => setInternalObservations(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3.5 py-2 text-sm"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 text-white text-xs font-black uppercase"
                >
                  Salvar Registro
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
