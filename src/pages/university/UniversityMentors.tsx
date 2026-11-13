import React, { useState } from 'react';
import {
  UserCheck,
  Plus,
  Calendar,
  Lock,
  ShieldCheck,
  Briefcase,
  Mail,
  Phone,
  X,
} from 'lucide-react';
import { useUniversity } from '../../contexts/UniversityContext';

export function UniversityMentors() {
  const {
    students,
    mentors,
    mentorships,
    can,
    addMentor,
    addMentorshipSession,
  } = useUniversity();

  const [activeTab, setActiveTab] = useState<'mentors' | 'sessions'>('mentors');
  const [isMentorModalOpen, setIsMentorModalOpen] = useState(false);
  const [isSessionModalOpen, setIsSessionModalOpen] = useState(false);

  // Mentor Form
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [profession, setProfession] = useState('');
  const [company, setCompany] = useState('');
  const [specialtyArea, setSpecialtyArea] = useState('');
  const [bio, setBio] = useState('');
  const [maxStudents, setMaxStudents] = useState(2);
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);

  // Session Form
  const [sessionStudentId, setSessionStudentId] = useState(students[0]?.id || '');
  const [sessionMentorId, setSessionMentorId] = useState(mentors[0]?.id || '');
  const [sessionDate, setSessionDate] = useState(new Date().toISOString().split('T')[0]);
  const [modality, setModality] = useState<'online' | 'presencial'>('online');
  const [topic, setTopic] = useState('');
  const [publicSummary, setPublicSummary] = useState('');
  const [confidentialNotes, setConfidentialNotes] = useState('');
  const [spiritualNotes, setSpiritualNotes] = useState('');
  const [nextSteps, setNextSteps] = useState('');

  const getStudentName = (id: string) => students.find(s => s.id === id)?.name || 'Estudante';
  const getMentorName = (id: string) => mentors.find(m => m.id === id)?.name || 'Mentor';

  const handleSaveMentor = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await addMentor({
      name,
      email,
      phone,
      profession,
      company_or_institution: company,
      specialty_area: specialtyArea,
      bio,
      max_students: Number(maxStudents),
      linked_student_ids: selectedStudents,
      status: 'active',
    });
    if (!res.success) {
      alert(res.error);
      return;
    }
    setIsMentorModalOpen(false);
    setName('');
    setEmail('');
    setPhone('');
    setProfession('');
    setCompany('');
    setSpecialtyArea('');
    setBio('');
    setSelectedStudents([]);
  };

  const handleSaveSession = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await addMentorshipSession({
      student_id: sessionStudentId,
      mentor_id: sessionMentorId,
      session_date: sessionDate,
      modality,
      topic,
      status: 'completed',
      public_summary: publicSummary,
      confidential_notes: confidentialNotes,
      spiritual_notes: spiritualNotes,
      next_steps: nextSteps,
    });
    if (!res.success) {
      alert(res.error);
      return;
    }
    setIsSessionModalOpen(false);
    setTopic('');
    setPublicSummary('');
    setConfidentialNotes('');
    setSpiritualNotes('');
    setNextSteps('');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 flex items-center gap-2.5">
            <UserCheck className="text-amber-600" size={28} />
            Mentores & Acompanhamento de Mentoria
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Gestão de profissionais voluntários vinculados aos estudantes e registro de encontros.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {can('fu:mentors:manage') && (
            <button
              onClick={() => setIsMentorModalOpen(true)}
              className="bg-amber-600 hover:bg-amber-700 text-white px-4 py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              <Plus size={16} /> Cadastrar Mentor
            </button>
          )}
          {can('fu:mentorships:manage') && (
            <button
              onClick={() => setIsSessionModalOpen(true)}
              className="bg-slate-900 hover:bg-slate-800 text-white px-4 py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              <Calendar size={16} /> Registrar Encontro
            </button>
          )}
        </div>
      </div>

      {/* Regra de Arquitetura Seção 5 */}
      <div className="bg-indigo-50/70 border border-indigo-200 rounded-2xl p-4 flex items-start gap-3">
        <ShieldCheck size={18} className="text-indigo-600 shrink-0 mt-0.5" />
        <p className="text-xs text-indigo-950 leading-relaxed">
          <strong>Isolamento de Perfil de Mentor:</strong> Os mentores cadastrados nesta área são profissionais
          voluntários vinculados aos estudantes e <strong>não recebem acesso ao painel administrativo</strong>.
          Anotações confidenciais e espirituais de mentoria ficam restritas à equipe autorizada e nunca são
          exibidas aos padrinhos.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-200 pb-3">
        <button
          onClick={() => setActiveTab('mentors')}
          className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'mentors'
              ? 'bg-slate-900 text-white'
              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          Mentores Voluntários ({mentors.length})
        </button>
        <button
          onClick={() => setActiveTab('sessions')}
          className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'sessions'
              ? 'bg-slate-900 text-white'
              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          Encontros de Mentoria ({mentorships.length})
        </button>
      </div>

      {activeTab === 'mentors' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {mentors.map(m => (
            <div
              key={m.id}
              className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4"
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800">
                    Mentor Voluntário (Sem Acesso Admin)
                  </span>
                  <h3 className="text-lg font-black text-slate-900 mt-2">{m.name}</h3>
                  <p className="text-xs font-bold text-indigo-600 flex items-center gap-1 mt-0.5">
                    <Briefcase size={13} /> {m.profession}
                  </p>
                  {m.company_or_institution && (
                    <p className="text-xs text-slate-500">{m.company_or_institution}</p>
                  )}
                </div>
                <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full">
                  Ativo
                </span>
              </div>

              {m.bio && <p className="text-xs text-slate-600 leading-relaxed">{m.bio}</p>}

              <div className="flex flex-wrap gap-3 text-xs text-slate-500 pt-1">
                <span className="flex items-center gap-1">
                  <Mail size={13} /> {m.email}
                </span>
                {m.phone && (
                  <span className="flex items-center gap-1">
                    <Phone size={13} /> {m.phone}
                  </span>
                )}
              </div>

              <div className="pt-3 border-t border-slate-100">
                <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1.5">
                  Estudantes Vinculados ({m.linked_student_ids.length}/{m.max_students})
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {m.linked_student_ids.length === 0 ? (
                    <span className="text-xs text-slate-400">Nenhum estudante vinculado</span>
                  ) : (
                    m.linked_student_ids.map(stId => (
                      <span
                        key={stId}
                        className="text-xs font-bold bg-indigo-50 text-indigo-800 px-3 py-1 rounded-xl border border-indigo-100"
                      >
                        {getStudentName(stId)}
                      </span>
                    ))
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {mentorships.map(ms => (
            <div
              key={ms.id}
              className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-3"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 mr-2">
                    {ms.modality}
                  </span>
                  <span className="text-xs font-bold text-slate-500">{ms.session_date}</span>
                  <h3 className="text-base font-black text-slate-900 mt-1">{ms.topic}</h3>
                </div>
                <div className="text-xs font-bold text-slate-700 bg-slate-100 px-3 py-1.5 rounded-xl">
                  Estudante: <span className="text-indigo-600">{getStudentName(ms.student_id)}</span> • Mentor:{' '}
                  <span>{getMentorName(ms.mentor_id)}</span>
                </div>
              </div>

              {ms.public_summary && (
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
                  <span className="text-[10px] font-black uppercase text-slate-400 block mb-1">
                    Resumo Geral de Evolução Vocacional
                  </span>
                  <p className="text-xs text-slate-700 leading-relaxed">{ms.public_summary}</p>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {ms.confidential_notes && (
                  <div className="p-3.5 rounded-2xl bg-rose-50/60 border border-rose-200/70">
                    <span className="text-[10px] font-black uppercase text-rose-700 flex items-center gap-1 mb-1">
                      <Lock size={11} /> Anotações Confidenciais de Mentoria (Restrito)
                    </span>
                    <p className="text-xs text-rose-950 leading-relaxed">{ms.confidential_notes}</p>
                  </div>
                )}
                {ms.spiritual_notes && (
                  <div className="p-3.5 rounded-2xl bg-amber-50/60 border border-amber-200/70">
                    <span className="text-[10px] font-black uppercase text-amber-800 flex items-center gap-1 mb-1">
                      <Lock size={11} /> Registro de Acompanhamento Espiritual (Restrito)
                    </span>
                    <p className="text-xs text-amber-950 leading-relaxed">{ms.spiritual_notes}</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Novo Mentor */}
      {isMentorModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-black text-slate-900">Cadastrar Mentor Voluntário</h3>
              <button onClick={() => setIsMentorModalOpen(false)} className="text-slate-400">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSaveMentor} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nome Completo *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3.5 py-2 text-sm"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">E-mail *</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-3.5 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Telefone</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-3.5 py-2 text-sm"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Profissão / Área *</label>
                  <input
                    type="text"
                    required
                    value={profession}
                    onChange={e => setProfession(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-3.5 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Instituição / Empresa</label>
                  <input
                    type="text"
                    value={company}
                    onChange={e => setCompany(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-3.5 py-2 text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Vincular Estudantes</label>
                <div className="grid grid-cols-2 gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200">
                  {students.map(st => (
                    <label key={st.id} className="flex items-center gap-2 text-xs cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedStudents.includes(st.id)}
                        onChange={e => {
                          if (e.target.checked) {
                            setSelectedStudents([...selectedStudents, st.id]);
                          } else {
                            setSelectedStudents(selectedStudents.filter(id => id !== st.id));
                          }
                        }}
                      />
                      <span className="truncate">{st.name}</span>
                    </label>
                  ))}
                </div>
              </div>
              <p className="text-[11px] text-slate-500">
                Nota: O cadastro de mentor não concede acesso ao painel administrativo.
              </p>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsMentorModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-600 text-white text-xs font-black uppercase"
                >
                  Salvar Mentor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Registrar Encontro */}
      {isSessionModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-black text-slate-900">Registrar Encontro de Mentoria</h3>
              <button onClick={() => setIsSessionModalOpen(false)} className="text-slate-400">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSaveSession} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Estudante</label>
                  <select
                    value={sessionStudentId}
                    onChange={e => setSessionStudentId(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-3.5 py-2 text-sm bg-white"
                  >
                    {students.map(s => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Mentor</label>
                  <select
                    value={sessionMentorId}
                    onChange={e => setSessionMentorId(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-3.5 py-2 text-sm bg-white"
                  >
                    {mentors.map(m => (
                      <option key={m.id} value={m.id}>
                        {m.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Data</label>
                  <input
                    type="date"
                    required
                    value={sessionDate}
                    onChange={e => setSessionDate(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-3.5 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Modalidade</label>
                  <select
                    value={modality}
                    onChange={e => setModality(e.target.value as any)}
                    className="w-full border border-slate-200 rounded-xl px-3.5 py-2 text-sm bg-white"
                  >
                    <option value="online">Online</option>
                    <option value="presencial">Presencial</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Tema / Pauta do Encontro *</label>
                <input
                  type="text"
                  required
                  value={topic}
                  onChange={e => setTopic(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3.5 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Resumo Vocacional Geral (Sem dados sensíveis)
                </label>
                <textarea
                  rows={2}
                  value={publicSummary}
                  onChange={e => setPublicSummary(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3.5 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-rose-700 mb-1">
                  Anotações Confidenciais de Mentoria (Privado - Nunca exibido no Portal)
                </label>
                <textarea
                  rows={2}
                  value={confidentialNotes}
                  onChange={e => setConfidentialNotes(e.target.value)}
                  className="w-full border border-rose-200 rounded-xl px-3.5 py-2 text-sm bg-rose-50/30"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-amber-800 mb-1">
                  Acompanhamento Espiritual (Privado - Nunca exibido no Portal)
                </label>
                <textarea
                  rows={2}
                  value={spiritualNotes}
                  onChange={e => setSpiritualNotes(e.target.value)}
                  className="w-full border border-amber-200 rounded-xl px-3.5 py-2 text-sm bg-amber-50/30"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsSessionModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-slate-900 text-white text-xs font-black uppercase"
                >
                  Salvar Encontro
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
