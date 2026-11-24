import React, { useState, useEffect } from 'react';
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
  Download,
  Trash2,
  Loader2,
  Copy,
  Check,
  Link2,
  MessageCircle
} from 'lucide-react';
import { cn } from '../../../lib/utils';
import { sponsorshipService } from '../../../services/sponsorshipService';

export interface SupporterDonation {
  id: string;
  amount: number;
  date: string;
  status: 'paid' | 'pending' | 'failed';
  payment_method: string;
  campaign_title?: string;
}

export interface SupporterChildItem {
  id: string;
  name: string;
  village?: string;
  photo_url?: string;
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
  sponsoredChildId?: string;
  sponsoredChildren?: SupporterChildItem[];
  sponsorshipId?: string;
  sponsorships?: any[];
  totalDonated: number;
  monthlyAmount?: number;
  donationsCount: number;
  lastDonationDate?: string;
  donations: SupporterDonation[];
  isChurned?: boolean;
  formerRole?: 'Ex-Padrinho' | 'Ex-Mantenedor';
  daysSinceLastContribution?: number;
}

interface SupporterFinancialModalProps {
  isOpen: boolean;
  onClose: () => void;
  supporter: SupporterData | null;
  onDeleteDonation?: (donationId: string) => Promise<void>;
}

export function SupporterFinancialModal({ isOpen, onClose, supporter, onDeleteDonation }: SupporterFinancialModalProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [inviteData, setInviteData] = useState<{ text: string; link: string; whatsappUrl: string } | null>(null);
  const [loadingInvite, setLoadingInvite] = useState(false);
  const [copiedMode, setCopiedMode] = useState<'text' | 'link' | null>(null);

  useEffect(() => {
    let cancelled = false;
    if (!isOpen || !supporter || supporter.role !== 'Padrinho' || !supporter.email) {
      setInviteData(null);
      return;
    }

    setLoadingInvite(true);
    const fallbackChildrenNames = supporter.sponsoredChildren && supporter.sponsoredChildren.length > 0
      ? supporter.sponsoredChildren.map(c => c.name).filter(Boolean)
      : (supporter.sponsoredChildName && supporter.sponsoredChildName !== 'Aguardando vínculo' ? [supporter.sponsoredChildName] : []);

    sponsorshipService
      .buildSponsorInviteMessage(supporter.email, supporter.name, {
        phone: supporter.phone,
        fallbackChildrenNames
      })
      .then(res => {
        if (!cancelled) {
          setInviteData({ text: res.text, link: res.link, whatsappUrl: res.whatsappUrl });
        }
      })
      .catch(() => {
        if (!cancelled) setInviteData(null);
      })
      .finally(() => {
        if (!cancelled) setLoadingInvite(false);
      });

    return () => {
      cancelled = true;
    };
  }, [isOpen, supporter?.id, supporter?.email, supporter?.role]);

  if (!isOpen || !supporter) return null;

  const copyValue = async (value: string, mode: 'text' | 'link') => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(value);
      } else {
        const ta = document.createElement('textarea');
        ta.value = value;
        ta.style.position = 'fixed';
        ta.style.left = '-9999px';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
      }
      setCopiedMode(mode);
      setTimeout(() => setCopiedMode(prev => (prev === mode ? null : prev)), 2500);
    } catch {
      // ignore
    }
  };

  const paidDonations = supporter.donations.filter(d => d.status === 'paid');
  const pendingDonations = supporter.donations.filter(d => d.status === 'pending');
  const avgDonation = paidDonations.length > 0 ? supporter.totalDonated / paidDonations.length : 0;

  const handleDeleteDonation = async (id: string, amount: number, title?: string) => {
    if (!onDeleteDonation) return;
    const confirmDelete = window.confirm(
      `Deseja realmente remover este lançamento de R$ ${amount.toFixed(2)} (${title || 'Doação'})?\nEsta ação atualizará o extrato do apoiador imediatamente.`
    );
    if (!confirmDelete) return;

    try {
      setDeletingId(id);
      await onDeleteDonation(id);
    } catch (err) {
      console.error('Falha ao remover doação:', err);
    } finally {
      setDeletingId(null);
    }
  };

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
          
          {/* Criança(s) Apadrinhada(s) */}
          {(supporter.sponsoredChildren && supporter.sponsoredChildren.length > 0) ? (
            <div className="p-4 bg-amber-50/70 rounded-2xl border border-amber-200/80 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-amber-500 text-white rounded-xl shadow-md shadow-amber-500/20">
                    <Heart size={18} fill="currentColor" />
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-amber-800">
                      {supporter.sponsoredChildren.length > 1 ? 'Crianças Apadrinhadas' : 'Criança Apadrinhada'}
                    </p>
                    <p className="text-[11px] text-amber-700 font-medium">
                      {supporter.sponsoredChildren.length > 1 
                        ? `${supporter.sponsoredChildren.length} crianças acolhidas com cotas ativas` 
                        : '1 criança acolhida com cota ativa'}
                    </p>
                  </div>
                </div>
                <span className="px-3 py-1 rounded-xl text-xs font-black bg-white text-amber-800 shadow-sm border border-amber-200">
                  {supporter.sponsoredChildren.length} {supporter.sponsoredChildren.length === 1 ? 'Cota' : 'Cotas'}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                {supporter.sponsoredChildren.map((child, idx) => (
                  <div key={child.id || idx} className="bg-white p-3 rounded-xl border border-amber-200/60 shadow-xs flex items-center gap-3">
                    {child.photo_url ? (
                      <img 
                        src={child.photo_url} 
                        alt={child.name} 
                        className="w-10 h-10 rounded-xl object-cover border border-amber-300 shrink-0" 
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-black text-sm shrink-0">
                        {child.name?.[0] || 'C'}
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="text-xs font-black text-slate-900 truncate">{child.name}</p>
                      {child.village && (
                        <p className="text-[10px] text-slate-500 truncate">{child.village}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : supporter.sponsoredChildName ? (
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
          ) : null}

          {/* Convite de Acesso do Padrinho para WhatsApp */}
          {supporter.role === 'Padrinho' && supporter.email && (
            <div className="p-5 bg-emerald-50/60 rounded-2xl border border-emerald-200/80 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-emerald-600 text-white rounded-xl shadow-sm">
                    <MessageCircle size={16} />
                  </div>
                  <div>
                    <p className="text-xs font-black uppercase tracking-wider text-emerald-900">
                      Convite do Padrinho para WhatsApp
                    </p>
                    <p className="text-[11px] text-emerald-700 font-medium">
                      Copie o texto e link do e-mail convite ou abra diretamente no WhatsApp.
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    disabled={!inviteData || loadingInvite}
                    onClick={() => inviteData && copyValue(inviteData.text, 'text')}
                    className={cn(
                      "inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition-all active:scale-95 disabled:opacity-50 cursor-pointer",
                      copiedMode === 'text'
                        ? "bg-emerald-600 text-white border-emerald-600"
                        : "bg-white hover:bg-slate-900 hover:text-white text-slate-700 border-emerald-200"
                    )}
                  >
                    {copiedMode === 'text' ? <Check size={13} /> : <Copy size={13} />}
                    {copiedMode === 'text' ? 'Copiado!' : 'Copiar Texto + Link'}
                  </button>
                  <button
                    type="button"
                    disabled={!inviteData || loadingInvite}
                    onClick={() => inviteData && copyValue(inviteData.link, 'link')}
                    className={cn(
                      "inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition-all active:scale-95 disabled:opacity-50 cursor-pointer",
                      copiedMode === 'link'
                        ? "bg-emerald-600 text-white border-emerald-600"
                        : "bg-white hover:bg-slate-900 hover:text-white text-slate-700 border-emerald-200"
                    )}
                  >
                    {copiedMode === 'link' ? <Check size={13} /> : <Link2 size={13} />}
                    {copiedMode === 'link' ? 'Link Copiado!' : 'Copiar Link'}
                  </button>
                  <a
                    href={inviteData?.whatsappUrl || '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => {
                      if (!inviteData || loadingInvite) e.preventDefault();
                    }}
                    className={cn(
                      "inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition-all active:scale-95",
                      (!inviteData || loadingInvite) && "opacity-50 pointer-events-none"
                    )}
                  >
                    <MessageCircle size={13} />
                    Enviar pelo WhatsApp
                  </a>
                </div>
              </div>

              {loadingInvite ? (
                <div className="flex items-center gap-2 text-xs text-emerald-700 py-2">
                  <Loader2 size={14} className="animate-spin" />
                  Preparando texto e link do convite...
                </div>
              ) : inviteData ? (
                <div className="bg-white/90 border border-emerald-200/70 rounded-xl p-3.5 text-xs text-slate-700 whitespace-pre-wrap max-h-36 overflow-y-auto leading-relaxed font-medium">
                  {inviteData.text}
                </div>
              ) : null}
            </div>
          )}

          {/* Cards de Resumo Financeiro do Apoiador */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Total Efetivamente Doado</p>
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
                    {onDeleteDonation && <th className="px-4 py-3 text-center w-12">Ações</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {supporter.donations.map((d) => (
                    <tr key={d.id} className="hover:bg-slate-50/60 transition-colors group">
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
                      {onDeleteDonation && (
                        <td className="px-4 py-3 text-center">
                          <button
                            type="button"
                            onClick={() => handleDeleteDonation(d.id, d.amount, d.campaign_title)}
                            disabled={deletingId === d.id}
                            title="Remover lançamento duplicado/indevido"
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all disabled:opacity-50"
                          >
                            {deletingId === d.id ? (
                              <Loader2 size={13} className="animate-spin text-rose-500" />
                            ) : (
                              <Trash2 size={13} />
                            )}
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                  {supporter.donations.length === 0 && (
                    <tr>
                      <td colSpan={onDeleteDonation ? 6 : 5} className="p-8 text-center text-slate-400 font-medium">
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
