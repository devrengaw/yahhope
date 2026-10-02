import React from 'react';
import { 
  X, 
  User, 
  Mail, 
  Phone, 
  Calendar, 
  Heart, 
  DollarSign, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  CreditCard, 
  FileText,
  Download
} from 'lucide-react';
import { cn } from '../../../lib/utils';

export interface SupporterDonation {
  id: string;
  amount: number;
  date: string;
  status: 'paid' | 'pending' | 'failed';
  payment_method: string;
  campaign_title?: string;
}

export interface SupporterData {
  id: string;
  name: string;
  email: string;
  phone?: string;
  avatar?: string;
  role: string;
  status: 'active' | 'pending' | 'inactive';
  joinedAt: string;
  sponsoredChildName?: string;
  sponsoredChildVillage?: string;
  totalDonated: number;
  donationsCount: number;
  lastDonationDate?: string;
  donations: SupporterDonation[];
}

interface SupporterFinancialModalProps {
  isOpen: boolean;
  onClose: () => void;
  supporter: SupporterData | null;
}

export function SupporterFinancialModal({ isOpen, onClose, supporter }: SupporterFinancialModalProps) {
  if (!isOpen || !supporter) return null;

  const paidDonations = supporter.donations.filter(d => d.status === 'paid');
  const pendingDonations = supporter.donations.filter(d => d.status === 'pending');
  const avgDonation = paidDonations.length > 0 ? supporter.totalDonated / paidDonations.length : 0;

  const handleExportHistory = () => {
    const headers = ['Data', 'Campanha / Finalidade', 'Forma de Pagamento', 'Valor (R$)', 'Status'];
    const rows = supporter.donations.map(d => [
      d.date,
      `"${d.campaign_title || 'Doação Geral / Apadrinhamento'}"`,
      d.payment_method.toUpperCase(),
      d.amount.toFixed(2),
      d.status === 'paid' ? 'Efetivado' : d.status === 'pending' ? 'Pendente' : 'Falha'
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(';'), ...rows.map(r => r.join(';'))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `extrato_apoiador_${supporter.name.toLowerCase().replace(/\s+/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
      <div className="bg-white rounded-[2.5rem] w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden border border-slate-100">
        
        {/* Header */}
        <div className="p-8 border-b border-slate-100 flex items-start justify-between bg-slate-50/50">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-400 text-white flex items-center justify-center font-black text-2xl shadow-lg shadow-orange-500/20">
              {supporter.avatar ? (
                <img src={supporter.avatar} alt={supporter.name} className="w-full h-full object-cover rounded-2xl" />
              ) : (
                supporter.name.charAt(0).toUpperCase()
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">{supporter.name}</h2>
                <span className={cn(
                  "px-3 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest border",
                  supporter.status === 'active' ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                  supporter.status === 'pending' ? "bg-amber-50 text-amber-700 border-amber-200" :
                  "bg-slate-100 text-slate-600 border-slate-200"
                )}>
                  {supporter.status === 'active' ? 'Ativo' : supporter.status === 'pending' ? 'Pendente' : 'Inativo'}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-xs font-medium text-slate-500">
                <span className="flex items-center gap-1">
                  <Mail size={13} className="text-slate-400" />
                  {supporter.email}
                </span>
                {supporter.phone && (
                  <span className="flex items-center gap-1">
                    <Phone size={13} className="text-slate-400" />
                    {supporter.phone}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Calendar size={13} className="text-slate-400" />
                  Cadastrado em {new Date(supporter.joinedAt).toLocaleDateString('pt-BR')}
                </span>
              </div>
            </div>
          </div>

          <button 
            onClick={onClose}
            className="p-2.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/50 rounded-2xl transition-all"
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-8 overflow-y-auto space-y-6">
          
          {/* Criança Apadrinhada se houver */}
          {supporter.sponsoredChildName && (
            <div className="p-4 bg-amber-50/60 rounded-2xl border border-amber-200/60 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-amber-500 text-white rounded-xl shadow-md shadow-amber-500/20">
                  <Heart size={20} />
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-amber-700">Criança Apadrinhada</p>
                  <p className="text-base font-black text-slate-900">{supporter.sponsoredChildName}</p>
                  {supporter.sponsoredChildVillage && (
                    <p className="text-xs text-amber-800 font-medium">Localidade: {supporter.sponsoredChildVillage}</p>
                  )}
                </div>
              </div>
              <span className="px-3 py-1 rounded-xl text-xs font-bold bg-white text-amber-700 shadow-sm border border-amber-100">
                Apadrinhamento Ativo
              </span>
            </div>
          )}

          {/* Cards de Resumo Financeiro do Apoiador */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Total Contribuído</p>
              <p className="text-2xl font-black text-emerald-600">
                R$ {supporter.totalDonated.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
              <p className="text-[11px] font-bold text-slate-500 mt-1">{paidDonations.length} doações efetivadas</p>
            </div>

            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Ticket Médio</p>
              <p className="text-2xl font-black text-slate-900">
                R$ {avgDonation.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
              <p className="text-[11px] font-bold text-slate-500 mt-1">Por contribuição</p>
            </div>

            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Lançamentos Pendentes</p>
              <p className="text-2xl font-black text-amber-600">
                {pendingDonations.length}
              </p>
              <p className="text-[11px] font-bold text-slate-500 mt-1">Aguardando compensação</p>
            </div>
          </div>

          {/* Histórico de Doações / Lançamentos */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <FileText size={16} className="text-indigo-600" />
                Histórico de Contribuições
              </h3>
              <button 
                onClick={handleExportHistory}
                className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 px-3 py-1.5 rounded-xl hover:bg-indigo-50 transition-colors"
              >
                <Download size={14} />
                Exportar Extrato
              </button>
            </div>

            <div className="border border-slate-100 rounded-2xl overflow-hidden shadow-sm">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-400 font-bold uppercase tracking-wider border-b border-slate-100">
                    <th className="px-4 py-3">Data</th>
                    <th className="px-4 py-3">Campanha / Destino</th>
                    <th className="px-4 py-3">Forma</th>
                    <th className="px-4 py-3 text-right">Valor</th>
                    <th className="px-4 py-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {supporter.donations.map((d) => (
                    <tr key={d.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-4 py-3 text-slate-600 font-bold">{d.date}</td>
                      <td className="px-4 py-3 text-slate-900 font-bold">{d.campaign_title || 'Doação Mensal / Apadrinhamento'}</td>
                      <td className="px-4 py-3 text-slate-500 uppercase font-bold text-[10px]">
                        <span className="px-2 py-0.5 bg-slate-100 rounded-md">
                          {d.payment_method === 'credit_card' ? 'Cartão' : d.payment_method.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-black text-slate-900">
                        R$ {d.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={cn(
                          "inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase",
                          d.status === 'paid' ? "bg-emerald-50 text-emerald-700" :
                          d.status === 'pending' ? "bg-amber-50 text-amber-700" :
                          "bg-rose-50 text-rose-700"
                        )}>
                          {d.status === 'paid' && <CheckCircle2 size={10} />}
                          {d.status === 'pending' && <Clock size={10} />}
                          {d.status === 'failed' && <AlertCircle size={10} />}
                          {d.status === 'paid' ? 'Pago' : d.status === 'pending' ? 'Pendente' : 'Falhou'}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {supporter.donations.length === 0 && (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-slate-400 font-medium">
                        Nenhuma doação registrada para este apoiador ainda.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-slate-900 text-white rounded-xl font-bold text-xs hover:bg-slate-800 transition-all shadow-md active:scale-95"
          >
            Fechar Extrato
          </button>
        </div>

      </div>
    </div>
  );
}
