import React, { useState } from 'react';
import { ClipboardList, Plus, Search, UserPlus, X } from 'lucide-react';
import { calculateAge } from '../lib/utils';

interface WaitingChild {
  id: string;
  name: string;
  dob: string;
  guardian_name: string;
  address: string;
  contact: string;
  weight: string;
  height: string;
  notes: string;
  created_at: string;
}

export function WaitingList() {
  const [list, setList] = useState<WaitingChild[]>([
    {
      id: '1',
      name: 'Lucas Mendes',
      dob: '2023-08-15',
      guardian_name: 'Carla Mendes',
      address: 'Rua das Flores, 123',
      contact: '84 9999-0000',
      weight: '6.2',
      height: '65',
      notes: 'Encaminhado pelo posto local, suspeita de DAM.',
      created_at: '2024-03-12'
    }
  ]);
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
  const [notes, setNotes] = useState('');

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const newChild: WaitingChild = {
      id: Date.now().toString(),
      name, dob, guardian_name: guardianName, address, contact, weight, height, notes,
      created_at: new Date().toISOString().split('T')[0]
    };
    setList([newChild, ...list]);
    setIsModalOpen(false);
    // reset
    setName(''); setDob(''); setGuardianName(''); setAddress(''); setContact(''); setWeight(''); setHeight(''); setNotes('');
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
          <p className="text-slate-500 mt-1">Cadastro simplificado de crianças aguardando vaga ou triagem completa.</p>
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
                <th className="p-4 font-medium text-slate-500 text-sm">Idade</th>
                <th className="p-4 font-medium text-slate-500 text-sm">Responsável</th>
                <th className="p-4 font-medium text-slate-500 text-sm">Contato</th>
                <th className="p-4 font-medium text-slate-500 text-sm">Peso / Estatura</th>
                <th className="p-4 font-medium text-slate-500 text-sm">Observação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredList.map((child) => (
                <tr key={child.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="p-4">
                    <p className="font-medium text-slate-900">{child.name}</p>
                    <p className="text-xs text-slate-500">Cadastrado em: {new Date(child.created_at).toLocaleDateString()}</p>
                  </td>
                  <td className="p-4 text-slate-600">{calculateAge(child.dob)}</td>
                  <td className="p-4 text-slate-600">
                    <p>{child.guardian_name}</p>
                    <p className="text-xs text-slate-500">{child.address}</p>
                  </td>
                  <td className="p-4 text-slate-600">{child.contact}</td>
                  <td className="p-4 text-slate-600">
                    {child.weight ? `${child.weight} kg` : '--'} / {child.height ? `${child.height} cm` : '--'}
                  </td>
                  <td className="p-4 text-slate-600 max-w-xs truncate" title={child.notes}>{child.notes || '--'}</td>
                </tr>
              ))}
              {filteredList.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-500">
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
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <UserPlus size={24} className="text-emerald-600" />
                Adicionar à Fila de Espera
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="p-2 text-slate-400 hover:bg-slate-200 rounded-xl transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1">
              <form id="waiting-form" onSubmit={handleSave} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-slate-700">Nome da Criança *</label>
                    <input required type="text" value={name} onChange={e => setName(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-slate-700">Data de Nascimento *</label>
                    <input required type="date" value={dob} onChange={e => setDob(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none" />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-slate-700">Responsável *</label>
                    <input required type="text" value={guardianName} onChange={e => setGuardianName(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-slate-700">Contato (Telefone) *</label>
                    <input required type="text" value={contact} onChange={e => setContact(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none" />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-700">Endereço de Referência</label>
                  <input type="text" value={address} onChange={e => setAddress(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-slate-700">Peso (kg)</label>
                    <input type="number" step="0.01" value={weight} onChange={e => setWeight(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-slate-700">Estatura (cm)</label>
                    <input type="number" step="0.1" value={height} onChange={e => setHeight(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none" />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-700">Observação</label>
                  <textarea rows={3} value={notes} onChange={e => setNotes(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"></textarea>
                </div>
              </form>
            </div>

            <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
              <button onClick={() => setIsModalOpen(false)} className="px-6 py-2.5 rounded-xl font-medium text-slate-600 hover:bg-slate-200 transition-colors">
                Cancelar
              </button>
              <button type="submit" form="waiting-form" className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2.5 rounded-xl font-medium transition-colors shadow-sm">
                Salvar Cadastro
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
