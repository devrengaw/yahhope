import React, { useState, useMemo } from 'react';
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
  Plus
} from 'lucide-react';
import { Link } from 'react-router-dom';

export function PortalMyDonations() {
  const { user } = useAuth();
  const { allDonations, campaigns } = useFundraising();
  const { openDonationModal } = useDonationModal();

  const [statusFilter, setStatusFilter] = useState<'all' | 'paid' | 'pending'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Filter donations strictly for the logged-in supporter
  const myDonations = useMemo(() => {
    if (!user?.email) return [];
    const userEmail = user.email.toLowerCase().trim();
    return allDonations.filter(d => d.donor_email?.toLowerCase().trim() === userEmail);
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

  // Filtered list
  const filteredDonations = useMemo(() => {
    return myDonations.filter(d => {
      const matchStatus = statusFilter === 'all' || d.status === statusFilter;
      const camp = campaigns.find(c => c.id === d.campaign_id);
      const campTitle = camp ? camp.title.toLowerCase() : 'doação geral';
      const matchSearch = searchTerm === '' || campTitle.includes(searchTerm.toLowerCase());
      return matchStatus && matchSearch;
    });
  }, [myDonations, statusFilter, searchTerm, campaigns]);

  const getCampaignTitle = (campaignId?: string) => {
    if (!campaignId) return 'Doação Geral - YAH Hope';
    const camp = campaigns.find(c => c.id === campaignId);
    return camp ? camp.title : 'Campanha Humanitária';
  };

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
                    <h4 className="font-black text-slate-900 text-sm sm:text-base">
                      {getCampaignTitle(donation.campaign_id)}
                    </h4>
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

                  {isPending && donation.payment_method === 'pix' && (
                    <button
                      onClick={() => openDonationModal({ campaignId: donation.campaign_id, initialAmount: donation.amount })}
                      className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 text-xs font-bold rounded-xl transition-all"
                    >
                      Pagar Pix
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
