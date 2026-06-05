import React, { useState } from 'react';
import { ClipboardList, Plus, Search, UserPlus, X } from 'lucide-react';
import { calculateAge, cn } from '../lib/utils';

interface WaitingChild {
  id: string;
  name: string;
  dob: string;
  guardian_name: string;
  address: string;
  contact: string;
  weight: string;
  height: string;
  muac: string;
  edema: string;
  notes: string;
  created_at: string;
}

export function WaitingList() {
  const [list, setList] = useState<WaitingChild[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Form states
  const [name, setName] = useState('');
  const [dob, setDob] = useState('');
  const [guardianName, setGuardianName] = useState('');
  const [address, setAddress] = useState('');
  const [contact, setContact] = useState('');
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');
  const [muac, setMuac] = useState('');
  const [edema, setEdema] = useState('Não');
  const [notes, setNotes] = useState('');

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const newChild: WaitingChild = {
      id: Date.now().toString(),
      name, dob, guardian_name: guardianName, address, contact, weight, height, muac, edema, notes,
      created_at: new Date().toISOString().split('T')[0]
    };
    setList([newChild, ...list]);
    setIsModalOpen(false);
    // reset
    setName(''); setDob(''); setGuardianName(''); setAddress(''); setContact(''); setWeight(''); setHeight(''); setMuac(''); setEdema('Não'); setNotes('');
  };

  const getMalnutritionLevel = (child: WaitingChild) => {
    const muacVal = parseFloat(child.muac);
    if (child.edema !== 'Não' || (muacVal > 0 && muacVal < 11.5)) {
      return { label: 'Grave', color: 'bg-red-100 text-red-700 border-red-200' };
    }
    if (muacVal >= 11.5 && muacVal < 12.5) {
      return { label: 'Moderado', color: 'bg-amber-100 text-amber-700 border-amber-200' };
    }
    if (muacVal >= 12.5) {
      return { label: 'Normal', color: 'bg-emerald-100 text-emerald-700 border-emerald-200' };
    }
    return { label: 'Pendente', color: 'bg-slate-100 text-slate-500 border-slate-200' };
  };

  const filteredList = list.filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <ClipboardList className="text-emerald-600" size={28} />
            Fila de Espera
          </h1>
          <p className="text-slate-500 mt-1">Triagem simplificada para identificação rápida de risco nutricional.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl font-medium flex items-center gap-2 transition-colors shadow-sm"
        >
          <UserPlus size={20} />
          Nova Criança
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input 
            type="text" 
            placeholder="Buscar na fila de espera..." 
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
          />
        </div>
      </div>

      {/* List */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="p-4 font-medium text-slate-500 text-sm">Criança</th>
                <th className="p-4 font-medium text-slate-500 text-sm">Nível Risco</th>
                <th className="p-4 font-medium text-slate-500 text-sm">Responsável</th>
                <th className="p-4 font-medium text-slate-500 text-sm">Medidas</th>
                <th className="p-4 font-medium text-slate-500 text-sm">Observação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredList.map((child) => {
                const level = getMalnutritionLevel(child);
                return (
                  <tr key={child.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-4">
                      <p className="font-medium text-slate-900">{child.name}</p>
                      <p className="text-xs text-slate-500">{calculateAge(child.dob)} • Cad: {new Date(child.created_at).toLocaleDateString()}</p>
                    </td>
                    <td className="p-4">
                      <span className={cn("px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border", level.color)}>
                        {level.label}
                      </span>
                    </td>
                    <td className="p-4 text-slate-600">
                      <p className="font-medium text-sm">{child.guardian_name}</p>
                      <p className="text-xs text-slate-500">{child.contact}</p>
                    </td>
                    <td className="p-4 text-slate-600">
                      <div className="text-xs space-y-1">
                        <p><span className="font-bold text-slate-400">P/E:</span> {child.weight || '--'}kg / {child.height || '--'}cm</p>
                        <p><span className="font-bold text-slate-400">PB:</span> {child.muac || '--'}cm</p>
                        <p><span className="font-bold text-slate-400">Edema:</span> {child.edema}</p>
                      </div>
                    </td>
                    <td className="p-4 text-slate-600 max-w-xs truncate text-xs italic" title={child.notes}>{child.notes || '--'}</td>
                  </tr>
                );
              })}
              {filteredList.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-500 text-sm">
                    Nenhuma criança na fila de espera.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <UserPlus size={24} className="text-emerald-600" />
                Triagem Fila de Espera
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="p-2 text-slate-400 hover:bg-slate-100 rounded-full transition-all">
                <X size={20} />
              </button>
            </div>

            <div className="p-8 overflow-y-auto flex-1 space-y-8">
              <form id="waiting-form" onSubmit={handleSave} className="space-y-6">
                <div>
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em] mb-4">Dados da Criança</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-sm font-medium text-slate-700 px-1">Nome Completo *</label>
                      <input required type="text" value={name} onChange={e => setName(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-sm font-medium text-slate-700 px-1">Data de Nascimento *</label>
                      <input required type="date" value={dob} onChange={e => setDob(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all" />
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em] mb-4">Responsável & Contato</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-sm font-medium text-slate-700 px-1">Nome do Responsável *</label>
                      <input required type="text" value={guardianName} onChange={e => setGuardianName(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-sm font-medium text-slate-700 px-1">Telefone de Contato *</label>
                      <input required type="text" value={contact} onChange={e => setContact(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all" />
                    </div>
                  </div>
                  <div className="space-y-1 mt-4">
                    <label className="text-sm font-medium text-slate-700 px-1">Endereço de Referência</label>
                    <input type="text" value={address} onChange={e => setAddress(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all" />
                  </div>
                </div>

                <div>
                  <h3 className="text-xs font-bold text-emerald-600 uppercase tracking-[0.2em] mb-4">Medidas Antropométricas (Risco Nutricional)</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div className="space-y-1">
                      <label className="text-sm font-medium text-slate-700 px-1">Peso (kg)</label>
                      <input type="number" step="0.01" value={weight} onChange={e => setWeight(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-sm font-medium text-slate-700 px-1">Estatura (cm)</label>
                      <input type="number" step="0.1" value={height} onChange={e => setHeight(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-sm font-medium text-rose-600 px-1 font-bold">PB (cm) *</label>
                      <input type="number" step="0.1" value={muac} onChange={e => setMuac(e.target.value)} placeholder="Braço" className="w-full bg-rose-50/50 border border-rose-200 rounded-2xl px-4 py-3 focus:ring-4 focus:ring-rose-500/10 focus:border-rose-500 outline-none transition-all font-bold text-rose-700 placeholder:text-rose-300" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-sm font-medium text-slate-700 px-1">Edema Bilateral</label>
                      <select value={edema} onChange={e => setEdema(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all">
                        <option value="Não">Não</option>
                        <option value="Sim (+)">Sim (+)</option>
                        <option value="Sim (++)">Sim (++)</option>
                        <option value="Sim (+++)">Sim (+++)</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-700 px-1">Observações da Triagem</label>
                  <textarea rows={2} value={notes} onChange={e => setNotes(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2 focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all resize-none"></textarea>
                </div>
              </form>
            </div>

            <div className="p-6 border-t border-slate-100 bg-slate-50/50 flex justify-end gap-3">
              <button onClick={() => setIsModalOpen(false)} className="px-6 py-3 rounded-2xl font-bold text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all uppercase text-xs tracking-widest">
                Cancelar
              </button>
              <button type="submit" form="waiting-form" className="bg-emerald-600 hover:bg-emerald-700 text-white px-10 py-3 rounded-2xl font-bold transition-all shadow-lg shadow-emerald-200 uppercase text-xs tracking-widest active:scale-95">
                Salvar Triagem
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

