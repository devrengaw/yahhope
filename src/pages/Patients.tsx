import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Plus, Filter, ChevronRight } from 'lucide-react';
import { mockPatients } from '../lib/mockData';
import { calculateAge, cn } from '../lib/utils';

export function Patients() {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredPatients = mockPatients.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.registration_number.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">Crianças</h1>
          <p className="text-slate-500 mt-1">Gestão de prontuários e acompanhamentos</p>
        </div>
        <Link 
          to="/nutrition/patients/new"
          className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl font-medium flex items-center gap-2 transition-colors shadow-sm"
        >
          <Plus size={20} />
          Novo Cadastro
        </Link>
      </div>

      <div className="bg-white rounded-[2rem] shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-700">
        {/* Toolbar */}
        <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row gap-4 bg-slate-50/30">
          <div className="relative flex-1 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-500 transition-colors" size={20} />
            <input 
              type="text" 
              placeholder="Buscar por nome ou ID..." 
              className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all shadow-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button className="flex items-center gap-2 px-6 py-3 bg-white border border-slate-200 rounded-2xl text-slate-600 hover:bg-slate-50 font-bold text-sm transition-all shadow-sm hover:shadow-md active:scale-95">
            <Filter size={20} className="text-emerald-600" />
            Filtros Avançados
          </button>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 text-slate-400 text-[10px] uppercase font-bold tracking-[0.2em] border-b border-slate-100">
                <th className="p-6">ID / Nome da Criança</th>
                <th className="p-6">Idade</th>
                <th className="p-6">Comunidade</th>
                <th className="p-6">Status Nutricional</th>
                <th className="p-6 text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredPatients.map((patient) => (
                <tr key={patient.id} className="hover:bg-emerald-50/30 transition-all group/row">
                  <td className="p-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-100 to-emerald-50 text-emerald-700 flex items-center justify-center font-bold text-lg shadow-sm border border-emerald-200/50 group-hover/row:scale-110 transition-transform">
                        {patient.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-bold text-slate-900 group-hover/row:text-emerald-700 transition-colors">{patient.name}</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{patient.registration_number}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-6 text-sm font-semibold text-slate-600">{calculateAge(patient.dob)}</td>
                  <td className="p-6 text-sm font-semibold text-slate-600">
                    <div className="flex items-center gap-2">
                       <div className="w-1.5 h-1.5 rounded-full bg-emerald-400"></div>
                       {patient.community}
                    </div>
                  </td>
                  <td className="p-6">
                    <StatusBadge status={patient.status} />
                  </td>
                  <td className="p-6 text-right">
                    <Link 
                      to={`/nutrition/patients/${patient.id}`}
                      className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-slate-50 text-slate-400 hover:text-white hover:bg-emerald-600 hover:shadow-lg hover:shadow-emerald-200 transition-all active:scale-90"
                    >
                      <ChevronRight size={20} />
                    </Link>
                  </td>
                </tr>
              ))}
              {filteredPatients.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-12 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <Search size={40} className="text-slate-200" />
                      <p className="text-slate-400 font-medium">Nenhuma criança encontrada.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    'Adequado': 'bg-emerald-100 text-emerald-700 border-emerald-200',
    'DAM': 'bg-amber-100 text-amber-700 border-amber-200',
    'DAG': 'bg-red-100 text-red-700 border-red-200',
    'Risco': 'bg-orange-100 text-orange-700 border-orange-200',
  };

  return (
    <span className={cn(
      "px-3 py-1 rounded-xl text-[10px] font-bold uppercase tracking-widest border shadow-sm transition-all hover:scale-105",
      styles[status] || 'bg-slate-100 text-slate-700 border-slate-200'
    )}>
      {status}
    </span>
  );
}
