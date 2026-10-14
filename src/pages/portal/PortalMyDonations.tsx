import React, { useState, useMemo, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useFundraising, Donation } from '../../contexts/FundraisingContext';
import { useDonationModal } from '../../contexts/DonationModalContext';
import { 
  Heart, 
  DollarSign, 
  Calendar, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  ArrowUpRight, 
  Sparkles, 
  Search, 
  Filter, 
  Receipt, 
  ChevronRight,
  Plus,
  Trash2
} from 'lucide-react';
import { Link } from 'react-router-dom';

export function PortalMyDonations() {
  const { user } = useAuth();
  const { allDonations, campaigns, deleteDonation } = useFundraising();
  const { openDonationModal } = useDonationModal();

  const [statusFilter, setStatusFilter] = useState<'all' | 'paid' | 'pending'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Auto-purga de doações indevidas geradas por bug de apadrinhamento (ex: "Compra de Moto")
  useEffect(() => {
    if (!user?.email || allDonations.length === 0) return;
    const userEmail = user.email.toLowerCase().trim();

    const erroneous = allDonations.filter(d => {
      if (d.donor_email?.toLowerCase().trim() !== userEmail) return false;
      const camp = campaigns.find(c => c.id === d.campaign_id);
      const title = (camp?.title || '').toLowerCase();
      return title.includes('moto') || title.includes('compra de moto');
    });

    if (erroneous.length > 0) {
      erroneous.forEach(d => {
        deleteDonation(d.id);
      });
    }
  }, [user?.email, allDonations, campaigns, deleteDonation]);

  const handleDeleteDonation = async (id: string, title: string) => {
    const confirm = window.confirm(`Deseja remover esta doação ("${title}") do seu histórico?`);
    if (!confirm) return;

    const res = await deleteDonation(id);
    if (!res.success) {
      alert('Não foi possível remover a doação. Tente novamente.');
    }
  };

  // Filter donations strictly for the logged-in supporter
  const myDonations = useMemo(() => {
    if (!user?.email && !user?.id) return [];
    const userEmail = (user?.email || '').toLowerCase().trim();
    const userId = user?.id;

    return allDonations.filter(d => {
      const emailMatches = Boolean(d.donor_email && d.donor_email.toLowerCase().trim() === userEmail);
      const userMatches = Boolean(userId && (d.sponsor_id === userId || d.user_id === userId));
      return emailMatches || userMatches;
    });
  }, [allDonations, user]);

  // Statistics
  const stats = useMemo(() => {
    const paidDonations = myDonations.filter(d => d.status === 'paid');
    const totalPaid = paidDonations.reduce((acc, curr) => acc + (curr.amount || 0), 0);
    const pendingCount = myDonations.filter(d => d.status === 'pending').length;

    // Social impact equivalence metrics
    // R$ 15 provides roughly 3 fortified meals or supplements for a child in Boane/Nampula
    const mealsProvided = Math.floor(totalPaid / 5);
    const medicalKits = Math.floor(totalPaid / 60);

    return {
      totalPaid,
      count: paidDonations.length,
      pendingCount,
      mealsProvided,
      medicalKits
    };
  }, [myDonations]);

  const getCampaignTitle = (donation: Donation) => {
    if (donation.campaign_title) return donation.campaign_title;
    if (donation.is_sponsorship || donation.id?.startsWith('sp_')) return 'Apadrinhamento Mensal (Casa Nutri)';
    if (!donation.campaign_id) return 'Doação Geral - YAH Hope';
    const camp = campaigns.find(c => c.id === donation.campaign_id);
    return camp ? camp.title : 'Campanha Humanitária';
  };

  // Filtered list
  const filteredDonations = useMemo(() => {
    return myDonations.filter(d => {
      const matchStatus = statusFilter === 'all' || d.status === statusFilter;
      const title = (d.campaign_title || getCampaignTitle(d)).toLowerCase();
      const matchSearch = searchTerm === '' || title.includes(searchTerm.toLowerCase());
      return matchStatus && matchSearch;
    });
  }, [myDonations, statusFilter, searchTerm, campaigns]);

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="space-y-8 pb-24">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <Receipt className="text-amber-500" size={32} />
            Minhas Doações
          </h1>
          <p className="text-slate-500 text-sm mt-1 font-medium">
            Histórico das suas contribuições e o impacto gerado na vida das crianças.
          </p>
        </div>

        <button
          onClick={() => openDonationModal()}
          className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-black px-5 py-3 rounded-2xl shadow-lg shadow-amber-500/25 flex items-center gap-2 transition-all active:scale-[0.98] text-sm"
        >
          <Plus size={18} />
          <span>Fazer Nova Doação</span>
        </button>
      </div>

      {/* Impact & Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total Contributed */}
        <div className="bg-gradient-to-br from-amber-500 to-orange-500 text-white p-6 rounded-3xl shadow-lg shadow-amber-500/20 relative overflow-hidden">
          <div className="absolute right-0 top-0 translate-x-4 -translate-y-4 w-32 h-32 bg-white/10 rounded-full blur-xl pointer-events-none"></div>
          <span className="text-[11px] font-black uppercase tracking-wider text-amber-100 flex items-center gap-1.5">
            <DollarSign size={14} /> Total Doado
          </span>
          <h2 className="text-3xl font-black mt-2 tracking-tight">
            R$ {stats.totalPaid.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </h2>
          <p className="text-xs text-amber-100/90 mt-2 font-medium">
            {stats.count} {stats.count === 1 ? 'doação confirmada' : 'doações confirmadas'}
          </p>
        </div>

        {/* Meals Provided Impact */}
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-between">
          <span className="text-[11px] font-black uppercase tracking-wider text-emerald-600 flex items-center gap-1.5">
            <Sparkles size={14} /> Impacto Alimentar
          </span>
          <div>
            <h3 className="text-3xl font-black text-slate-900 mt-2">
              ~{stats.mealsProvided}
            </h3>
            <p className="text-xs text-slate-500 mt-1 font-medium">
              Refeições nutritivas e suplementos viabilizados
            </p>
          </div>
        </div>

        {/* Support status */}
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-between">
          <span className="text-[11px] font-black uppercase tracking-wider text-blue-600 flex items-center gap-1.5">
            <Heart size={14} /> Vidas Alcançadas
          </span>
          <div>
            <h3 className="text-3xl font-black text-slate-900 mt-2">
              {stats.medicalKits > 0 ? `${stats.medicalKits} kits` : 'Apoio Ativo'}
            </h3>
            <p className="text-xs text-slate-500 mt-1 font-medium">
              Apoio essencial para famílias vulneráveis
            </p>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="flex items-center gap-1.5 bg-slate-50 p-1 rounded-xl w-full sm:w-auto">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
              statusFilter === 'all'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Todas ({myDonations.length})
          </button>
          <button
            onClick={() => setStatusFilter('paid')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
              statusFilter === 'paid'
                ? 'bg-white text-emerald-700 shadow-sm'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Pagas ({myDonations.filter(d => d.status === 'paid').length})
          </button>
          <button
            onClick={() => setStatusFilter('pending')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
              statusFilter === 'pending'
                ? 'bg-white text-amber-700 shadow-sm'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Pendentes ({myDonations.filter(d => d.status === 'pending').length})
          </button>
        </div>

        <div className="relative w-full sm:w-64">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por campanha..."
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
          />
        </div>
      </div>

      {/* Donations List */}
      <div className="space-y-3">
        {filteredDonations.length === 0 ? (
          <div className="bg-white rounded-3xl border border-slate-100 p-12 text-center space-y-4 shadow-sm">
            <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-500 flex items-center justify-center mx-auto">
              <Receipt size={32} />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-800">Nenhuma doação encontrada</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto font-medium">
                {myDonations.length === 0
                  ? 'Você ainda não possui doações registradas com este e-mail. Faça sua primeira doação para apoiar os projetos da YAH Hope!'
                  : 'Nenhuma doação corresponde aos filtros selecionados.'}
              </p>
            </div>
            <button
              onClick={() => openDonationModal()}
              className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-md shadow-amber-500/20 transition-all"
            >
              <Heart size={16} /> Fazer uma Doação Agora
            </button>
          </div>
        ) : (
          filteredDonations.map((donation) => {
            const isPaid = donation.status === 'paid';
            const isPending = donation.status === 'pending';

            return (
              <div
                key={donation.id}
                className="bg-white p-5 rounded-2xl border border-slate-100 hover:border-amber-200 shadow-sm transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
              >
                <div className="flex items-center gap-4">
                  <div
                    className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
                      isPaid
                        ? 'bg-emerald-50 text-emerald-600'
                        : isPending
                        ? 'bg-amber-50 text-amber-600'
                        : 'bg-rose-50 text-rose-600'
                    }`}
                  >
                    {isPaid ? (
                      <CheckCircle2 size={24} />
                    ) : isPending ? (
                      <Clock size={24} />
                    ) : (
                      <AlertCircle size={24} />
                    )}
                  </div>

                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-black text-slate-900 text-sm sm:text-base">
                        {getCampaignTitle(donation)}
                      </h4>
                      {donation.is_sponsorship && (
                        <span className="px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 text-[10px] font-black uppercase tracking-wider border border-rose-200">
                          Apadrinhamento
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-slate-400 mt-0.5 font-medium">
                      <span className="flex items-center gap-1">
                        <Calendar size={13} /> {formatDate(donation.date)}
                      </span>
                      <span>•</span>
                      <span className="uppercase text-[10px] font-bold tracking-wider">
                        {donation.payment_method === 'pix' ? 'PIX' : 'Cartão de Crédito'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto gap-4 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                  <div className="text-left sm:text-right">
                    <span className="text-base sm:text-lg font-black text-slate-900 block">
                      R$ {donation.amount?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                    <span
                      className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full inline-block mt-0.5 ${
                        isPaid
                          ? 'bg-emerald-100 text-emerald-800'
                          : isPending
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {isPaid ? 'Confirmada' : isPending ? 'Pendente' : 'Cancelada'}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {isPending && donation.payment_method === 'pix' && (
                      <button
                        onClick={() => openDonationModal({ campaignId: donation.campaign_id, initialAmount: donation.amount })}
                        className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 text-xs font-bold rounded-xl transition-all"
                      >
                        Pagar Pix
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleDeleteDonation(donation.id, getCampaignTitle(donation.campaign_id))}
                      className="p-2 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all cursor-pointer"
                      title="Excluir doação do histórico"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
