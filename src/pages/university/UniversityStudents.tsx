import React, { useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Users,
  Plus,
  Search,
  CheckCircle2,
  XCircle,
  Edit3,
  Lock,
  Eye,
  EyeOff,
  GraduationCap,
  MapPin,
  ShieldAlert,
  X,
} from 'lucide-react';
import {
  useUniversity,
  UniversityStudent,
  UniversityStudentSensitiveData,
} from '../../contexts/UniversityContext';

export function UniversityStudents() {
  const { students, can, addStudent, updateStudent, approveApplication } = useUniversity();
  const [searchParams] = useSearchParams();
  const initialFilter = searchParams.get('filter') === 'pending' ? 'pending' : 'all';

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'pending' | 'graduated'>(
    initialFilter
  );

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<UniversityStudent | null>(null);
  const [modalTab, setModalTab] = useState<'public' | 'sensitive'>('public');

  // Form states (Public/Academic)
  const [name, setName] = useState('');
  const [registrationCode, setRegistrationCode] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('Nampula');
  const [province, setProvince] = useState('Nampula');
  const [photoUrl, setPhotoUrl] = useState('');
  const [institution, setInstitution] = useState('');
  const [course, setCourse] = useState('');
  const [currentSemester, setCurrentSemester] = useState(1);
  const [totalSemesters, setTotalSemesters] = useState(8);
  const [expectedGraduation, setExpectedGraduation] = useState('2029.2');
  const [applicationStatus, setApplicationStatus] = useState<'pending' | 'approved' | 'rejected'>('approved');
  const [enrollmentStatus, setEnrollmentStatus] = useState<
    'candidate' | 'active' | 'graduated' | 'suspended' | 'inactive'
  >('active');
  const [publicBio, setPublicBio] = useState('');
  const [careerGoal, setCareerGoal] = useState('');
  const [portalVisible, setPortalVisible] = useState(true);

  // Form states (Sensitive - NUNCA exibidos no Portal do Mantenedor)
  const [documentIdNumber, setDocumentIdNumber] = useState('');
  const [nuit, setNuit] = useState('');
  const [familySensitiveNotes, setFamilySensitiveNotes] = useState('');
  const [socioeconomicDetails, setSocioeconomicDetails] = useState('');
  const [monthlyFamilyIncome, setMonthlyFamilyIncome] = useState<number>(0);
  const [householdMembers, setHouseholdMembers] = useState<number>(1);
  const [bankName, setBankName] = useState('');
  const [bankAccount, setBankAccount] = useState('');
  const [mobileWallet, setMobileWallet] = useState('');
  const [spiritualFollowupNotes, setSpiritualFollowupNotes] = useState('');

  const filteredStudents = useMemo(() => {
    return students.filter(st => {
      const q = search.toLowerCase().trim();
      const matchesSearch =
        !q ||
        st.name.toLowerCase().includes(q) ||
        st.course.toLowerCase().includes(q) ||
        st.institution.toLowerCase().includes(q) ||
        (st.registration_code || '').toLowerCase().includes(q);

      if (!matchesSearch) return false;
      if (statusFilter === 'pending') return st.application_status === 'pending';
      if (statusFilter === 'active')
        return st.application_status === 'approved' && st.enrollment_status === 'active';
      if (statusFilter === 'graduated') return st.enrollment_status === 'graduated';
      return true;
    });
  }, [students, search, statusFilter]);

  const openCreateModal = () => {
    if (!can('fu:students:create')) return;
    setEditingStudent(null);
    setModalTab('public');
    setName('');
    setRegistrationCode(`FU-${new Date().getFullYear()}-${String(students.length + 1).padStart(3, '0')}`);
    setEmail('');
    setPhone('');
    setCity('Nampula');
    setProvince('Nampula');
    setPhotoUrl('');
    setInstitution('');
    setCourse('');
    setCurrentSemester(1);
    setTotalSemesters(8);
    setExpectedGraduation('2030.1');
    setApplicationStatus('pending');
    setEnrollmentStatus('candidate');
    setPublicBio('');
    setCareerGoal('');
    setPortalVisible(false);

    setDocumentIdNumber('');
    setNuit('');
    setFamilySensitiveNotes('');
    setSocioeconomicDetails('');
    setMonthlyFamilyIncome(0);
    setHouseholdMembers(1);
    setBankName('');
    setBankAccount('');
    setMobileWallet('');
    setSpiritualFollowupNotes('');
    setIsModalOpen(true);
  };

  const openEditModal = (st: UniversityStudent) => {
    setEditingStudent(st);
    setModalTab('public');
    setName(st.name);
    setRegistrationCode(st.registration_code);
    setEmail(st.email || '');
    setPhone(st.phone || '');
    setCity(st.city);
    setProvince(st.province);
    setPhotoUrl(st.photo_url || '');
    setInstitution(st.institution);
    setCourse(st.course);
    setCurrentSemester(st.current_semester);
    setTotalSemesters(st.total_semesters);
    setExpectedGraduation(st.expected_graduation);
    setApplicationStatus(st.application_status);
    setEnrollmentStatus(st.enrollment_status);
    setPublicBio(st.public_bio || '');
    setCareerGoal(st.career_goal || '');
    setPortalVisible(st.portal_visible);

    setDocumentIdNumber(st.sensitive?.document_id_number || '');
    setNuit(st.sensitive?.nuit || '');
    setFamilySensitiveNotes(st.sensitive?.family_sensitive_notes || '');
    setSocioeconomicDetails(st.sensitive?.socioeconomic_details || '');
    setMonthlyFamilyIncome(st.sensitive?.monthly_family_income || 0);
    setHouseholdMembers(st.sensitive?.household_members || 1);
    setBankName(st.sensitive?.bank_name || '');
    setBankAccount(st.sensitive?.bank_account || '');
    setMobileWallet(st.sensitive?.mobile_wallet || '');
    setSpiritualFollowupNotes(st.sensitive?.spiritual_followup_notes || '');
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const publicPayload = {
      registration_code: registrationCode,
      name,
      email,
      phone,
      city,
      province,
      photo_url: photoUrl,
      institution,
      course,
      current_semester: Number(currentSemester),
      total_semesters: Number(totalSemesters),
      expected_graduation: expectedGraduation,
      application_status: applicationStatus,
      enrollment_status: enrollmentStatus,
      public_bio: publicBio,
      career_goal: careerGoal,
      portal_visible: portalVisible,
    };

    const sensitivePayload: Omit<UniversityStudentSensitiveData, 'student_id'> = {
      document_id_number: documentIdNumber,
      nuit,
      family_sensitive_notes: familySensitiveNotes,
      socioeconomic_details: socioeconomicDetails,
      monthly_family_income: Number(monthlyFamilyIncome),
      household_members: Number(householdMembers),
      bank_name: bankName,
      bank_account: bankAccount,
      mobile_wallet: mobileWallet,
      spiritual_followup_notes: spiritualFollowupNotes,
    };

    if (editingStudent) {
      const res = await updateStudent(editingStudent.id, publicPayload, sensitivePayload);
      if (!res.success) {
        alert(res.error);
        return;
      }
    } else {
      const res = await addStudent(publicPayload, sensitivePayload);
      if (!res.success) {
        alert(res.error);
        return;
      }
    }

    setIsModalOpen(false);
  };

  const handleDecision = async (studentId: string, decision: 'approved' | 'rejected') => {
    const res = await approveApplication(studentId, decision);
    if (!res.success) {
      alert(res.error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 flex items-center gap-2.5">
            <Users className="text-indigo-600" size={28} />
            Estudantes & Inscrições
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Gerencie bolsistas ativos, candidaturas e visibilidade autorizada para o Portal dos Mantenedores.
          </p>
        </div>

        {can('fu:students:create') && (
          <button
            onClick={openCreateModal}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-3 rounded-2xl text-xs font-black uppercase tracking-wider flex items-center gap-2 shadow-md shadow-indigo-600/20 transition-all cursor-pointer"
          >
            <Plus size={18} />
            <span>Cadastrar Estudante</span>
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar estudante por nome, código, curso ou universidade..."
            className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1 sm:pb-0">
          {[
            { id: 'all', label: `Todos (${students.length})` },
            {
              id: 'active',
              label: `Bolsistas Ativos (${
                students.filter(s => s.application_status === 'approved' && s.enrollment_status === 'active').length
              })`,
            },
            {
              id: 'pending',
              label: `Inscrições Pendentes (${students.filter(s => s.application_status === 'pending').length})`,
            },
            {
              id: 'graduated',
              label: `Formados (${students.filter(s => s.enrollment_status === 'graduated').length})`,
            },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id as any)}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold shrink-0 transition-all cursor-pointer ${
                statusFilter === tab.id
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Students Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredStudents.map(st => (
          <div
            key={st.id}
            className="bg-white rounded-3xl border border-slate-200/80 overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
          >
            <div>
              <div className="p-5 bg-gradient-to-br from-slate-900 to-indigo-950 text-white">
                <div className="flex items-start justify-between gap-2">
                  <div className="w-14 h-14 rounded-2xl overflow-hidden bg-white/10 border border-white/20 flex items-center justify-center font-black text-xl text-indigo-200 shrink-0">
                    {st.photo_url ? (
                      <img src={st.photo_url} alt={st.name} className="w-full h-full object-cover" />
                    ) : (
                      st.name.charAt(0).toUpperCase()
                    )}
                  </div>
                  <div className="flex flex-wrap gap-1.5 justify-end">
                    <span
                      className={`text-[10px] font-bold uppercase px-2.5 py-1 rounded-full ${
                        st.application_status === 'approved'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/30'
                          : st.application_status === 'pending'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-400/30'
                          : 'bg-rose-500/20 text-rose-300 border border-rose-400/30'
                      }`}
                    >
                      {st.application_status === 'approved'
                        ? 'Aprovado'
                        : st.application_status === 'pending'
                        ? 'Inscrição Pendente'
                        : 'Não Aprovado'}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-1 ${
                        st.portal_visible
                          ? 'bg-indigo-500/30 text-indigo-200'
                          : 'bg-white/10 text-slate-300'
                      }`}
                      title={
                        st.portal_visible
                          ? 'Perfil público autorizado para padrinhos vinculados no Portal'
                          : 'Oculto no Portal do Mantenedor'
                      }
                    >
                      {st.portal_visible ? <Eye size={11} /> : <EyeOff size={11} />}
                      {st.portal_visible ? 'Portal Autorizado' : 'Oculto no Portal'}
                    </span>
                  </div>
                </div>

                <div className="mt-4">
                  <span className="text-[10px] font-bold text-indigo-300 uppercase tracking-wider">
                    {st.registration_code}
                  </span>
                  <h3 className="text-lg font-black text-white leading-tight">{st.name}</h3>
                  <p className="text-xs text-indigo-200 flex items-center gap-1 mt-1">
                    <GraduationCap size={13} /> {st.course}
                  </p>
                  <p className="text-[11px] text-slate-300 mt-0.5">{st.institution}</p>
                </div>
              </div>

              <div className="p-5 space-y-3">
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">Semestre</span>
                    <span className="font-black text-slate-800">
                      {st.current_semester}º de {st.total_semesters}
                    </span>
                  </div>
                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">Formatura</span>
                    <span className="font-black text-slate-800">{st.expected_graduation}</span>
                  </div>
                </div>

                <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                  {st.public_bio || 'Sem biografia pública cadastrada.'}
                </p>

                <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                  <span className="flex items-center gap-1">
                    <MapPin size={12} className="text-indigo-500" /> {st.city}, {st.province}
                  </span>
                  <span className="flex items-center gap-1 text-slate-400">
                    <Lock size={11} /> Dados sensíveis isolados
                  </span>
                </div>
              </div>
            </div>

            <div className="px-5 pb-5 pt-2 border-t border-slate-100 flex flex-wrap gap-2">
              {st.application_status === 'pending' && can('fu:applications:approve') && (
                <>
                  <button
                    onClick={() => handleDecision(st.id, 'approved')}
                    className="flex-1 py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                  >
                    <CheckCircle2 size={14} /> Aprovar Inscrição
                  </button>
                  <button
                    onClick={() => handleDecision(st.id, 'rejected')}
                    className="py-2 px-3 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl text-xs font-bold flex items-center justify-center gap-1 transition-all cursor-pointer"
                  >
                    <XCircle size={14} /> Reprovar
                  </button>
                </>
              )}

              <button
                onClick={() => openEditModal(st)}
                className="w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                <Edit3 size={14} />
                <span>{can('fu:students:edit') ? 'Ver / Editar Prontuário Completo' : 'Visualizar Ficha'}</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal de Cadastro / Edição com Segregação de Privacidade */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[92vh] overflow-hidden flex flex-col shadow-2xl border border-slate-100">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-black text-slate-900">
                  {editingStudent ? `Prontuário: ${editingStudent.name}` : 'Novo Estudante Universitário'}
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Separação estrita entre informações autorizadas para padrinhos e dados confidenciais internos.
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X size={20} />
              </button>
            </div>

            {/* Tabs */}
            <div className="px-6 pt-3 bg-slate-50 border-b border-slate-100 flex gap-2">
              <button
                type="button"
                onClick={() => setModalTab('public')}
                className={`px-4 py-2.5 rounded-t-xl text-xs font-bold border-b-2 transition-all cursor-pointer ${
                  modalTab === 'public'
                    ? 'border-indigo-600 text-indigo-600 bg-white'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                1. Dados Acadêmicos & Perfil Autorizável
              </button>
              <button
                type="button"
                onClick={() => setModalTab('sensitive')}
                className={`px-4 py-2.5 rounded-t-xl text-xs font-bold border-b-2 flex items-center gap-1.5 transition-all cursor-pointer ${
                  modalTab === 'sensitive'
                    ? 'border-rose-600 text-rose-600 bg-white'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <Lock size={13} />
                <span>2. Dados Sensíveis & Confidenciais (Restrito)</span>
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 overflow-y-auto space-y-4 flex-1">
              {modalTab === 'public' ? (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Nome Completo *</label>
                      <input
                        type="text"
                        required
                        disabled={Boolean(editingStudent && !can('fu:students:edit'))}
                        value={name}
                        onChange={e => setName(e.target.value)}
                        className="w-full border border-slate-200 rounded-xl px-3.5 py-2 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Código de Matrícula *</label>
                      <input
                        type="text"
                        required
                        disabled={Boolean(editingStudent && !can('fu:students:edit'))}
                        value={registrationCode}
                        onChange={e => setRegistrationCode(e.target.value)}
                        className="w-full border border-slate-200 rounded-xl px-3.5 py-2 text-sm"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Universidade / Instituição *</label>
                      <input
                        type="text"
                        required
                        disabled={Boolean(editingStudent && !can('fu:students:edit'))}
                        value={institution}
                        onChange={e => setInstitution(e.target.value)}
                        placeholder="Ex: Universidade Lúrio (UniLúrio)"
                        className="w-full border border-slate-200 rounded-xl px-3.5 py-2 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Curso Superior *</label>
                      <input
                        type="text"
                        required
                        disabled={Boolean(editingStudent && !can('fu:students:edit'))}
                        value={course}
                        onChange={e => setCourse(e.target.value)}
                        placeholder="Ex: Medicina Geral"
                        className="w-full border border-slate-200 rounded-xl px-3.5 py-2 text-sm"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Semestre Atual</label>
                      <input
                        type="number"
                        min={1}
                        max={16}
                        disabled={Boolean(editingStudent && !can('fu:students:edit'))}
                        value={currentSemester}
                        onChange={e => setCurrentSemester(Number(e.target.value))}
                        className="w-full border border-slate-200 rounded-xl px-3.5 py-2 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Total Semestres</label>
                      <input
                        type="number"
                        min={2}
                        max={16}
                        disabled={Boolean(editingStudent && !can('fu:students:edit'))}
                        value={totalSemesters}
                        onChange={e => setTotalSemesters(Number(e.target.value))}
                        className="w-full border border-slate-200 rounded-xl px-3.5 py-2 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Prev. Formatura</label>
                      <input
                        type="text"
                        disabled={Boolean(editingStudent && !can('fu:students:edit'))}
                        value={expectedGraduation}
                        onChange={e => setExpectedGraduation(e.target.value)}
                        placeholder="Ex: 2029.2"
                        className="w-full border border-slate-200 rounded-xl px-3.5 py-2 text-sm"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Cidade</label>
                      <input
                        type="text"
                        disabled={Boolean(editingStudent && !can('fu:students:edit'))}
                        value={city}
                        onChange={e => setCity(e.target.value)}
                        className="w-full border border-slate-200 rounded-xl px-3.5 py-2 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Status da Inscrição</label>
                      <select
                        disabled={!can('fu:applications:approve')}
                        value={applicationStatus}
                        onChange={e => setApplicationStatus(e.target.value as any)}
                        className="w-full border border-slate-200 rounded-xl px-3.5 py-2 text-sm bg-white"
                      >
                        <option value="pending">Pendente</option>
                        <option value="approved">Aprovada</option>
                        <option value="rejected">Reprovada</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Situação Matrícula</label>
                      <select
                        disabled={Boolean(editingStudent && !can('fu:students:edit'))}
                        value={enrollmentStatus}
                        onChange={e => setEnrollmentStatus(e.target.value as any)}
                        className="w-full border border-slate-200 rounded-xl px-3.5 py-2 text-sm bg-white"
                      >
                        <option value="candidate">Candidato</option>
                        <option value="active">Ativo</option>
                        <option value="graduated">Formado</option>
                        <option value="suspended">Suspenso</option>
                        <option value="inactive">Inativo</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">URL da Foto do Estudante</label>
                    <input
                      type="text"
                      disabled={Boolean(editingStudent && !can('fu:students:edit'))}
                      value={photoUrl}
                      onChange={e => setPhotoUrl(e.target.value)}
                      placeholder="https://..."
                      className="w-full border border-slate-200 rounded-xl px-3.5 py-2 text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Biografia Pública Autorizada (visível apenas aos padrinhos vinculados)
                    </label>
                    <textarea
                      rows={2}
                      disabled={Boolean(editingStudent && !can('fu:students:edit'))}
                      value={publicBio}
                      onChange={e => setPublicBio(e.target.value)}
                      className="w-full border border-slate-200 rounded-xl px-3.5 py-2 text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Objetivo Vocacional / Carreira
                    </label>
                    <input
                      type="text"
                      disabled={Boolean(editingStudent && !can('fu:students:edit'))}
                      value={careerGoal}
                      onChange={e => setCareerGoal(e.target.value)}
                      className="w-full border border-slate-200 rounded-xl px-3.5 py-2 text-sm"
                    />
                  </div>

                  <label className="flex items-center gap-3 p-3.5 rounded-2xl bg-indigo-50/70 border border-indigo-200 cursor-pointer">
                    <input
                      type="checkbox"
                      disabled={Boolean(editingStudent && !can('fu:students:edit'))}
                      checked={portalVisible}
                      onChange={e => setPortalVisible(e.target.checked)}
                      className="w-4 h-4 rounded text-indigo-600"
                    />
                    <div>
                      <span className="text-xs font-black text-indigo-950 block">
                        Autorizar exibição dos dados públicos no Portal dos Mantenedores/Padrinhos
                      </span>
                      <span className="text-[11px] text-indigo-700 block">
                        Apenas nome, curso, universidade, semestre e bio pública serão exibidos aos padrinhos vinculados.
                      </span>
                    </div>
                  </label>
                </>
              ) : (
                <div className="space-y-4">
                  <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 flex items-start gap-2.5">
                    <ShieldAlert size={18} className="text-rose-600 shrink-0 mt-0.5" />
                    <p className="text-xs text-rose-900 leading-relaxed">
                      <strong>Proteção de Privacidade Ativa:</strong> Os dados desta aba são estritamente
                      confidenciais para gestão interna e <strong>nunca</strong> são disponibilizados no Portal
                      dos Mantenedores/Padrinhos.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Documento Pessoal (BI / Passaporte)
                      </label>
                      <input
                        type="text"
                        disabled={Boolean(editingStudent && !can('fu:students:edit'))}
                        value={documentIdNumber}
                        onChange={e => setDocumentIdNumber(e.target.value)}
                        className="w-full border border-slate-200 rounded-xl px-3.5 py-2 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">NUIT / CPF</label>
                      <input
                        type="text"
                        disabled={Boolean(editingStudent && !can('fu:students:edit'))}
                        value={nuit}
                        onChange={e => setNuit(e.target.value)}
                        className="w-full border border-slate-200 rounded-xl px-3.5 py-2 text-sm"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Banco Privado</label>
                      <input
                        type="text"
                        disabled={Boolean(editingStudent && !can('fu:students:edit'))}
                        value={bankName}
                        onChange={e => setBankName(e.target.value)}
                        className="w-full border border-slate-200 rounded-xl px-3.5 py-2 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Conta Bancária</label>
                      <input
                        type="text"
                        disabled={Boolean(editingStudent && !can('fu:students:edit'))}
                        value={bankAccount}
                        onChange={e => setBankAccount(e.target.value)}
                        className="w-full border border-slate-200 rounded-xl px-3.5 py-2 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Carteira Móvel (M-Pesa)</label>
                      <input
                        type="text"
                        disabled={Boolean(editingStudent && !can('fu:students:edit'))}
                        value={mobileWallet}
                        onChange={e => setMobileWallet(e.target.value)}
                        className="w-full border border-slate-200 rounded-xl px-3.5 py-2 text-sm"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Dados Familiares Sensíveis (Confidencial)
                    </label>
                    <textarea
                      rows={2}
                      disabled={Boolean(editingStudent && !can('fu:students:edit'))}
                      value={familySensitiveNotes}
                      onChange={e => setFamilySensitiveNotes(e.target.value)}
                      className="w-full border border-slate-200 rounded-xl px-3.5 py-2 text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Informações Socioeconômicas Detalhadas (Confidencial)
                    </label>
                    <textarea
                      rows={2}
                      disabled={Boolean(editingStudent && !can('fu:students:edit'))}
                      value={socioeconomicDetails}
                      onChange={e => setSocioeconomicDetails(e.target.value)}
                      className="w-full border border-slate-200 rounded-xl px-3.5 py-2 text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Registros de Acompanhamento Espiritual (Confidencial)
                    </label>
                    <textarea
                      rows={2}
                      disabled={Boolean(editingStudent && !can('fu:students:edit'))}
                      value={spiritualFollowupNotes}
                      onChange={e => setSpiritualFollowupNotes(e.target.value)}
                      className="w-full border border-slate-200 rounded-xl px-3.5 py-2 text-sm"
                    />
                  </div>
                </div>
              )}

              <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50"
                >
                  Fechar
                </button>
                {((!editingStudent && can('fu:students:create')) ||
                  (editingStudent && can('fu:students:edit'))) && (
                  <button
                    type="submit"
                    className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black uppercase tracking-wider shadow-md cursor-pointer"
                  >
                    Salvar Estudante
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
