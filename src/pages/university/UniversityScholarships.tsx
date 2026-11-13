import React, { useState } from 'react';
import {
  Award,
  Plus,
  CheckCircle2,
  XCircle,
  DollarSign,
  Clock,
  Receipt,
  X,
} from 'lucide-react';
import { useUniversity } from '../../contexts/UniversityContext';

export function UniversityScholarships() {
  const {
    students,
    scholarships,
    payments,
    can,
    addScholarship,
    createPayment,
    approvePayment,
    registerPaymentExecution,
  } = useUniversity();

  const [activeTab, setActiveTab] = useState<'scholarships' | 'payments'>('scholarships');
  const [isScholarshipModalOpen, setIsScholarshipModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

  // New Scholarship Form
  const [studentId, setStudentId] = useState(students[0]?.id || '');
  const [scholarshipType, setScholarshipType] = useState<'integral' | 'parcial' | 'auxilio_material'>('integral');
  const [monthlyAmount, setMonthlyAmount] = useState(600);
  const [notes, setNotes] = useState('');

  // New Payment Form
  const [payScholarshipId, setPayScholarshipId] = useState(scholarships[0]?.id || '');
  const [referenceMonth, setReferenceMonth] = useState('2026-11');
  const [payCategory, setPayCategory] = useState<
    'mensalidade' | 'matricula' | 'material' | 'transporte' | 'manutencao' | 'outros'
  >('mensalidade');
  const [payAmount, setPayAmount] = useState(600);
  const [payNotes, setPayNotes] = useState('');

  const getStudentName = (id: string) => students.find(s => s.id === id)?.name || 'Estudante';

  const handleCreateScholarship = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await addScholarship({
      student_id: studentId,
      scholarship_type: scholarshipType,
      monthly_amount: Number(monthlyAmount),
      currency: 'BRL',
      coverage_items:
        scholarshipType === 'integral'
          ? ['Mensalidade Integral', 'Material Didático', 'Transporte']
          : ['Cota Parcial de Mensalidade'],
      start_date: new Date().toISOString().split('T')[0],
      status: 'active',
      notes,
    });
    if (!res.success) {
      alert(res.error);
      return;
    }
    setIsScholarshipModalOpen(false);
  };

  const handleCreatePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    const sch = scholarships.find(s => s.id === payScholarshipId);
    if (!sch) return;
    const res = await createPayment({
      scholarship_id: sch.id,
      student_id: sch.student_id,
      reference_month: referenceMonth,
      category: payCategory,
      amount: Number(payAmount),
      currency: 'BRL',
      status: 'pending_approval',
      due_date: `${referenceMonth}-15`,
      notes: payNotes,
    });
    if (!res.success) {
      alert(res.error);
      return;
    }
    setIsPaymentModalOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 flex items-center gap-2.5">
            <Award className="text-emerald-600" size={28} />
            Bolsas & Pagamentos
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Concessão de bolsas, aprovação de desembolsos e registro de pagamentos estudantis.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {can('fu:scholarships:manage') && (
            <button
              onClick={() => setIsScholarshipModalOpen(true)}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              <Plus size={16} /> Nova Bolsa
            </button>
          )}
          {(can('fu:scholarships:manage') || can('fu:payments:register')) && (
            <button
              onClick={() => setIsPaymentModalOpen(true)}
              className="bg-slate-900 hover:bg-slate-800 text-white px-4 py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              <DollarSign size={16} /> Lançar Desembolso
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-200 pb-3">
        <button
          onClick={() => setActiveTab('scholarships')}
          className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'scholarships'
              ? 'bg-slate-900 text-white'
              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          Bolsas Concedidas ({scholarships.length})
        </button>
        <button
          onClick={() => setActiveTab('payments')}
          className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'payments'
              ? 'bg-slate-900 text-white'
              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          Aprovação & Registro de Pagamentos ({payments.length})
        </button>
      </div>

      {activeTab === 'scholarships' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {scholarships.map(sch => (
            <div
              key={sch.id}
              className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                    Bolsa {sch.scholarship_type}
                  </span>
                  <span className="text-xs font-bold text-slate-400">Desde {sch.start_date}</span>
                </div>
                <h3 className="text-lg font-black text-slate-900">{getStudentName(sch.student_id)}</h3>
                <div className="text-2xl font-black text-emerald-600">
                  R$ {Number(sch.monthly_amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  <span className="text-xs text-slate-400 font-semibold"> /mês</span>
                </div>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {sch.coverage_items.map((item, idx) => (
                    <span
                      key={idx}
                      className="text-[10px] font-semibold bg-slate-100 text-slate-700 px-2.5 py-1 rounded-lg"
                    >
                      {item}
                    </span>
                  ))}
                </div>
                {sch.notes && <p className="text-xs text-slate-500 pt-1">{sch.notes}</p>}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200/80 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 text-xs uppercase">
                  <th className="p-4 font-bold">Estudante</th>
                  <th className="p-4 font-bold">Competência</th>
                  <th className="p-4 font-bold">Categoria</th>
                  <th className="p-4 font-bold">Valor</th>
                  <th className="p-4 font-bold">Status</th>
                  <th className="p-4 font-bold text-right">Ações (Permissões Internas)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {payments.map(pay => (
                  <tr key={pay.id} className="hover:bg-slate-50/70">
                    <td className="p-4 font-bold text-slate-900">{getStudentName(pay.student_id)}</td>
                    <td className="p-4 text-slate-600 font-medium">{pay.reference_month}</td>
                    <td className="p-4 capitalize text-slate-600">{pay.category}</td>
                    <td className="p-4 font-black text-slate-900">
                      R$ {Number(pay.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="p-4">
                      {pay.status === 'paid' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle2 size={13} /> Pago
                        </span>
                      )}
                      {pay.status === 'approved' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
                          <Clock size={13} /> Aprovado (Aguardando Baixa)
                        </span>
                      )}
                      {pay.status === 'pending_approval' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
                          <Clock size={13} /> Aguardando Aprovação
                        </span>
                      )}
                      {pay.status === 'rejected' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
                          <XCircle size={13} /> Rejeitado
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-right space-x-2">
                      {pay.status === 'pending_approval' && can('fu:payments:approve') && (
                        <>
                          <button
                            onClick={() => approvePayment(pay.id, 'approved')}
                            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
                          >
                            Aprovar Pagamento
                          </button>
                          <button
                            onClick={() => approvePayment(pay.id, 'rejected')}
                            className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
                          >
                            Reprovar
                          </button>
                        </>
                      )}
                      {pay.status === 'approved' && can('fu:payments:register') && (
                        <button
                          onClick={() =>
                            registerPaymentExecution(pay.id, 'Pagamento registrado pela tesouraria do módulo')
                          }
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold inline-flex items-center gap-1 transition-all cursor-pointer"
                        >
                          <Receipt size={13} /> Registrar Pagamento
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal Nova Bolsa */}
      {isScholarshipModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-black text-slate-900">Conceder Nova Bolsa</h3>
              <button onClick={() => setIsScholarshipModalOpen(false)} className="text-slate-400">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleCreateScholarship} className="space-y-4">
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
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Modalidade</label>
                  <select
                    value={scholarshipType}
                    onChange={e => setScholarshipType(e.target.value as any)}
                    className="w-full border border-slate-200 rounded-xl px-3.5 py-2 text-sm bg-white"
                  >
                    <option value="integral">Integral</option>
                    <option value="parcial">Parcial</option>
                    <option value="auxilio_material">Auxílio Material</option>
                  </select>
                </div>
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
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Observações</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3.5 py-2 text-sm"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsScholarshipModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 text-white text-xs font-black uppercase"
                >
                  Salvar Bolsa
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Lançar Pagamento */}
      {isPaymentModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-black text-slate-900">Lançar Desembolso de Bolsa</h3>
              <button onClick={() => setIsPaymentModalOpen(false)} className="text-slate-400">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleCreatePayment} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Bolsa / Estudante</label>
                <select
                  value={payScholarshipId}
                  onChange={e => setPayScholarshipId(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3.5 py-2 text-sm bg-white"
                >
                  {scholarships.map(sch => (
                    <option key={sch.id} value={sch.id}>
                      {getStudentName(sch.student_id)} — Bolsa {sch.scholarship_type}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Competência (AAAA-MM)</label>
                  <input
                    type="text"
                    required
                    value={referenceMonth}
                    onChange={e => setReferenceMonth(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-3.5 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Categoria</label>
                  <select
                    value={payCategory}
                    onChange={e => setPayCategory(e.target.value as any)}
                    className="w-full border border-slate-200 rounded-xl px-3.5 py-2 text-sm bg-white"
                  >
                    <option value="mensalidade">Mensalidade</option>
                    <option value="matricula">Matrícula</option>
                    <option value="material">Material Didático</option>
                    <option value="transporte">Transporte</option>
                    <option value="manutencao">Manutenção</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Valor (R$)</label>
                <input
                  type="number"
                  required
                  value={payAmount}
                  onChange={e => setPayAmount(Number(e.target.value))}
                  className="w-full border border-slate-200 rounded-xl px-3.5 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Observações</label>
                <input
                  type="text"
                  value={payNotes}
                  onChange={e => setPayNotes(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3.5 py-2 text-sm"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsPaymentModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-slate-900 text-white text-xs font-black uppercase"
                >
                  Enviar para Aprovação
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
