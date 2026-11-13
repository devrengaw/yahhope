import React, { useState } from 'react';
import {
  Heart,
  Plus,
  Users,
  Eye,
  EyeOff,
  X,
} from 'lucide-react';
import {
  useUniversity,
  UniversitySupporterModality,
} from '../../contexts/UniversityContext';

export function UniversitySupporters() {
  const { students, sponsorships, config, can, addSponsorship, updateSponsorship } = useUniversity();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [donorName, setDonorName] = useState('');
  const [donorEmail, setDonorEmail] = useState('');
  const [donorPhone, setDonorPhone] = useState('');
  const [modality, setModality] = useState<UniversitySupporterModality>('individual');
  const [studentId, setStudentId] = useState<string>(students[0]?.id || '');
  const [monthlyAmount, setMonthlyAmount] = useState<number>(config.full_scholarship_amount);
  const [quotaPercentage, setQuotaPercentage] = useState<number>(100);
  const [allowStudentUpdates, setAllowStudentUpdates] = useState(true);

  const getStudentName = (id?: string | null) => {
    if (!id) return 'Fundo Geral do Programa';
    return students.find(s => s.id === id)?.name || 'Estudante';
  };

  const modalityBadge = (m: UniversitySupporterModality) => {
    if (m === 'individual') {
      return {
        label: 'Padrinho Individual',
        className: 'bg-indigo-50 text-indigo-700 border-indigo-200',
      };
    }
    if (m === 'partial') {
      return {
        label: 'Apoiador Parcial',
        className: 'bg-amber-50 text-amber-800 border-amber-200',
      };
    }
    return {
      label: 'Mantenedor Geral',
      className: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    };
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await addSponsorship({
      student_id: modality === 'general' ? null : studentId,
      donor_name: donorName,
      donor_email: donorEmail.toLowerCase().trim(),
      donor_phone: donorPhone,
      modality,
      monthly_amount: Number(monthlyAmount),
      quota_percentage: modality === 'general' ? 100 : Number(quotaPercentage),
      currency: 'BRL',
      payment_method: 'credit_card',
      status: 'active',
      allow_student_updates: modality === 'general' ? false : allowStudentUpdates,
    });
    if (!res.success) {
      alert(res.error);
      return;
    }
    setIsModalOpen(false);
    setDonorName('');
    setDonorEmail('');
    setDonorPhone('');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 flex items-center gap-2.5">
            <Heart className="text-rose-600" size={28} />
            Apoiadores & Modalidades de Apadrinhamento
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Gerencie Mantenedores Gerais, Padrinhos Individuais e Apoiadores Parciais vinculados ao Portal.
          </p>
        </div>

        {can('fu:supporters:manage') && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-rose-600 hover:bg-rose-700 text-white px-5 py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow-sm cursor-pointer"
          >
            <Plus size={16} /> Vincular Apoiador
          </button>
        )}
      </div>

      {/* Modalidades Explicativas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 space-y-1.5">
          <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700">
            Modalidade 1
          </span>
          <h3 className="text-sm font-black text-slate-900">Mantenedor Geral</h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Contribui para o programa Futuro Universitário sem vinculação a um estudante específico. Visualiza indicadores de impacto, atualizações e relatórios no Portal.
          </p>
        </div>
        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 space-y-1.5">
          <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700">
            Modalidade 2
          </span>
          <h3 className="text-sm font-black text-slate-900">Padrinho Individual</h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Contribui integralmente para o acompanhamento de um estudante determinado e visualiza as informações públicas/acadêmicas autorizadas daquele estudante.
          </p>
        </div>
        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 space-y-1.5">
          <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800">
            Modalidade 3
          </span>
          <h3 className="text-sm font-black text-slate-900">Apoiador Parcial</h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Contribui com parte do valor (cota) destinado a um estudante específico e acompanha as informações autorizadas e evolução acadêmica no Portal.
          </p>
        </div>
      </div>

      {/* Tabela de Vínculos */}
      <div className="bg-white rounded-3xl border border-slate-200/80 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 text-xs uppercase">
                <th className="p-4 font-bold">Apoiador / E-mail</th>
                <th className="p-4 font-bold">Modalidade</th>
                <th className="p-4 font-bold">Destino / Estudante</th>
                <th className="p-4 font-bold">Contribuição Mensal</th>
                <th className="p-4 font-bold">Acesso Dados Estudante</th>
                {can('fu:supporters:manage') && <th className="p-4 font-bold text-right">Ações</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {sponsorships.map(sp => {
                const badge = modalityBadge(sp.modality);
                return (
                  <tr key={sp.id} className="hover:bg-slate-50/70">
                    <td className="p-4">
                      <div className="font-bold text-slate-900">{sp.donor_name}</div>
                      <div className="text-xs text-slate-500">{sp.donor_email}</div>
                    </td>
                    <td className="p-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold border ${badge.className}`}
                      >
                        {badge.label}
                      </span>
                    </td>
                    <td className="p-4 font-semibold text-slate-800">{getStudentName(sp.student_id)}</td>
                    <td className="p-4 font-black text-slate-900">
                      R$ {Number(sp.monthly_amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}{' '}
                      <span className="text-xs text-slate-400 font-medium">({sp.quota_percentage}%)</span>
                    </td>
                    <td className="p-4">
                      {sp.modality === 'general' ? (
                        <span className="text-xs text-slate-400">Apenas Impacto Geral</span>
                      ) : sp.allow_student_updates ? (
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700">
                          <Eye size={13} /> Autorizado no Portal
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-slate-500">
                          <EyeOff size={13} /> Oculto
                        </span>
                      )}
                    </td>
                    {can('fu:supporters:manage') && (
                      <td className="p-4 text-right">
                        {sp.modality !== 'general' && (
                          <button
                            onClick={() =>
                              updateSponsorship(sp.id, {
                                allow_student_updates: !sp.allow_student_updates,
                              })
                            }
                            className="px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-xs font-bold text-slate-700 cursor-pointer"
                          >
                            {sp.allow_student_updates ? 'Revogar Visão Estudante' : 'Autorizar Visão Estudante'}
                          </button>
                        )}
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Vincular Apoiador */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-black text-slate-900">Vincular Apoiador / Padrinho</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSave} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nome do Apoiador *</label>
                <input
                  type="text"
                  required
                  value={donorName}
                  onChange={e => setDonorName(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3.5 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  E-mail (mesmo e-mail utilizado no Portal do Mantenedor) *
                </label>
                <input
                  type="email"
                  required
                  value={donorEmail}
                  onChange={e => setDonorEmail(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3.5 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Modalidade de Apoio</label>
                <select
                  value={modality}
                  onChange={e => {
                    const m = e.target.value as UniversitySupporterModality;
                    setModality(m);
                    if (m === 'individual') {
                      setMonthlyAmount(config.full_scholarship_amount);
                      setQuotaPercentage(100);
                    } else if (m === 'partial') {
                      setMonthlyAmount(config.partial_quota_amount);
                      setQuotaPercentage(25);
                    } else {
                      setMonthlyAmount(config.default_general_amount);
                      setQuotaPercentage(100);
                    }
                  }}
                  className="w-full border border-slate-200 rounded-xl px-3.5 py-2 text-sm bg-white"
                >
                  <option value="individual">Padrinho Individual (Estudante Determinado)</option>
                  <option value="partial">Apoiador Parcial (Cota de Estudante)</option>
                  <option value="general">Mantenedor Geral (Fundo do Programa)</option>
                </select>
              </div>

              {modality !== 'general' && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Estudante Vinculado</label>
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
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Valor Mensal (R$)</label>
                  <input
                    type="number"
                    required
                    value={monthlyAmount}
                    onChange={e => setMonthlyAmount(Number(e.target.value))}
                    className="w-full border border-slate-200 rounded-xl px-3.5 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">% Cota</label>
                  <input
                    type="number"
                    min={5}
                    max={100}
                    value={quotaPercentage}
                    onChange={e => setQuotaPercentage(Number(e.target.value))}
                    className="w-full border border-slate-200 rounded-xl px-3.5 py-2 text-sm"
                  />
                </div>
              </div>

              {modality !== 'general' && (
                <label className="flex items-center gap-2 text-xs font-bold text-slate-700 pt-1 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={allowStudentUpdates}
                    onChange={e => setAllowStudentUpdates(e.target.checked)}
                  />
                  <span>Autorizar visualização das informações públicas do estudante no Portal</span>
                </label>
              )}

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-rose-600 text-white text-xs font-black uppercase"
                >
                  Confirmar Vínculo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
