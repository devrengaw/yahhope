import React, { useState, useEffect, useMemo } from 'react';
import { 
  Users, 
  Search, 
  Filter, 
  Download, 
  Heart, 
  DollarSign, 
  TrendingUp, 
  ArrowUpRight, 
  Calendar, 
  ExternalLink,
  ChevronRight,
  Mail,
  Phone,
  FileText,
  UserCheck,
  ShieldCheck,
  RefreshCw
} from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { cn } from '../../../lib/utils';
import { SupporterFinancialModal, SupporterData } from './SupporterFinancialModal';

export function SupportersList() {
  const [supporters, setSupporters] = useState<SupporterData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'pending' | 'inactive'>('all');
  const [roleFilter, setRoleFilter] = useState<'all' | 'sponsor' | 'donor'>('all');
  const [selectedSupporter, setSelectedSupporter] = useState<SupporterData | null>(null);

  const fetchSupporters = async () => {
    setIsLoading(true);
    try {
      const [usersRes, sponsorshipsRes, donationsRes] = await Promise.all([
        supabase.from('users').select('*').order('created_at', { ascending: false }),
        supabase.from('sponsorships').select('*, children(id, name, address)'),
        supabase.from('donations').select('*').order('created_at', { ascending: false })
      ]);

      const dbUsers = usersRes.data || [];
      const dbSponsorships = sponsorshipsRes.data || [];
      const dbDonations = donationsRes.data || [];

      // Mapear usuários por email e id
      const usersByEmail = new Map<string, any>();
      dbUsers.forEach(u => {
        if (u.email) usersByEmail.set(u.email.toLowerCase().trim(), u);
      });

      // Mapear apadrinhamentos por sponsor_id
      const sponsorshipsBySponsor = new Map<string, any>();
      dbSponsorships.forEach(sp => {
        if (sp.sponsor_id) sponsorshipsBySponsor.set(sp.sponsor_id, sp);
      });

      // Agrupar doações por email do doador
      const donationsByEmail = new Map<string, any[]>();
      dbDonations.forEach(d => {
        const email = (d.donor_email || d.email || '').toLowerCase().trim();
        if (email) {
          if (!donationsByEmail.has(email)) donationsByEmail.set(email, []);
          donationsByEmail.get(email)!.push(d);
        }
      });

      // Lista consolidada de emails únicos
      const allEmails = new Set([...donationsByEmail.keys(), ...usersByEmail.keys()]);
      const mappedSupporters: SupporterData[] = [];

      for (const email of allEmails) {
        const user = usersByEmail.get(email);
        const userDonations = donationsByEmail.get(email) || [];
        const sponsorship = user ? sponsorshipsBySponsor.get(user.id) : null;

        const isSponsorRole = user?.role === 'SPONSOR' || user?.role === 'PADRINHO';
        const hasSponsorship = !!sponsorship;
        const hasDonations = userDonations.length > 0;

        // Se não tiver doações nem apadrinhamento nem papel de apoiador, ignora
        if (!hasDonations && !hasSponsorship && !isSponsorRole) {
          continue;
        }

        const paidDonations = userDonations.filter((d: any) => d.status === 'paid');
        const totalDonated = paidDonations.reduce((acc: number, curr: any) => acc + (Number(curr.amount) || 0), 0);
        const lastDonation = userDonations[0];
        const donorName = user?.name || lastDonation?.donor_name || email.split('@')[0];

        mappedSupporters.push({
          id: user?.id || `donor_${email}`,
          name: donorName,
          email: email,
          phone: user?.phone || lastDonation?.donor_phone || undefined,
          avatar: user?.avatar || undefined,
          role: hasSponsorship ? 'Padrinho' : isSponsorRole ? 'Padrinho' : 'Doador Recorrente',
          status: user?.status === 'inactive' ? 'inactive' : userDonations.some((d: any) => d.status === 'pending') ? 'pending' : 'active',
          joinedAt: userDonations[userDonations.length - 1]?.created_at || user?.created_at || new Date().toISOString(),
          sponsoredChildName: sponsorship?.children?.name || undefined,
          sponsoredChildVillage: sponsorship?.children?.address || undefined,
          totalDonated,
          donationsCount: paidDonations.length,
          lastDonationDate: lastDonation ? (lastDonation.paid_at || lastDonation.created_at)?.split('T')[0] : undefined,
          donations: userDonations.map((d: any) => ({
            id: d.id,
            amount: Number(d.amount) || 0,
            date: (d.paid_at || d.created_at)?.split('T')[0] || new Date().toISOString().split('T')[0],
            status: d.status || 'paid',
            payment_method: d.payment_method || 'pix',
            campaign_title: d.campaign_title || 'Doação YAH Hope'
          }))
        });
      }

      mappedSupporters.sort((a, b) => b.totalDonated - a.totalDonated);
      setSupporters(mappedSupporters);
    } catch (err) {
      console.error('Erro ao consultar apoiadores reais no banco:', err);
      setSupporters([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSupporters();

    const channel = supabase.channel('supporters-finance-updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'users' }, () => fetchSupporters())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'donations' }, () => fetchSupporters())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'sponsorships' }, () => fetchSupporters())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Métricas Consolidadas dos Apoiadores
  const stats = useMemo(() => {
    const total = supporters.length;
    const active = supporters.filter(s => s.status === 'active').length;
    const withSponsorship = supporters.filter(s => !!s.sponsoredChildName).length;
    const totalRaised = supporters.reduce((acc, s) => acc + s.totalDonated, 0);
    const avgTicket = total > 0 ? totalRaised / total : 0;

    return {
      total,
      active,
      withSponsorship,
      totalRaised,
      avgTicket
    };
  }, [supporters]);

  // Lista Filtrada
  const filteredSupporters = useMemo(() => {
    return supporters.filter(s => {
      const matchSearch = 
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (s.phone && s.phone.includes(searchTerm)) ||
        (s.sponsoredChildName && s.sponsoredChildName.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchStatus = statusFilter === 'all' || s.status === statusFilter;
      const matchRole = 
        roleFilter === 'all' || 
        (roleFilter === 'sponsor' && (s.role === 'Padrinho' || !!s.sponsoredChildName)) ||
        (roleFilter === 'donor' && s.role !== 'Padrinho' && !s.sponsoredChildName);

      return matchSearch && matchStatus && matchRole;
    });
  }, [supporters, searchTerm, statusFilter, roleFilter]);

  // Exportar Relatório Geral de Apoiadores
  const handleExportCSV = () => {
    const headers = [
      'Nome do Apoiador',
      'E-mail',
      'Telefone',
      'Papel / Vínculo',
      'Criança Apadrinhada',
      'Data de Cadastro',
      'Status',
      'Total Contribuído (R$)',
      'Qtd Doações',
      'Última Contribuição'
    ];

    const rows = filteredSupporters.map(s => [
      `"${s.name}"`,
      s.email,
      s.phone || '-',
      s.role,
      `"${s.sponsoredChildName || '-'}"`,
      new Date(s.joinedAt).toLocaleDateString('pt-BR'),
      s.status === 'active' ? 'Ativo' : s.status === 'pending' ? 'Pendente' : 'Inativo',
      s.totalDonated.toFixed(2),
      s.donationsCount,
      s.lastDonationDate || '-'
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(';'), ...rows.map(r => r.join(';'))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `relatorio_financeiro_apoiadores_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      
      {/* Cards de Métricas dos Apoiadores */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 p-8 pb-0">
        
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/40 group hover:border-slate-200 transition-all">
          <div className="flex justify-between items-start mb-3">
            <div className="p-3 bg-amber-50 rounded-2xl text-amber-600 group-hover:scale-110 transition-transform">
              <Users size={22} />
            </div>
            <span className="px-2.5 py-1 bg-amber-50 text-amber-700 font-black text-[10px] rounded-lg uppercase tracking-wider">
              Base Geral
            </span>
          </div>
          <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Total de Apoiadores</p>
          <p className="text-3xl font-black text-slate-900 mt-1">
            {stats.total}
          </p>
          <p className="text-[11px] text-slate-400 font-bold mt-2">
            {stats.active} apoiadores ativos no momento
          </p>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/40 group hover:border-slate-200 transition-all">
          <div className="flex justify-between items-start mb-3">
            <div className="p-3 bg-rose-50 rounded-2xl text-rose-600 group-hover:scale-110 transition-transform">
              <Heart size={22} />
            </div>
            <span className="px-2.5 py-1 bg-rose-50 text-rose-700 font-black text-[10px] rounded-lg uppercase tracking-wider">
              Apadrinhamento
            </span>
          </div>
          <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Padrinhos Ativos</p>
          <p className="text-3xl font-black text-slate-900 mt-1">
            {stats.withSponsorship}
          </p>
          <p className="text-[11px] text-slate-400 font-bold mt-2">
            Crianças diretamente apoiadas
          </p>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/40 group hover:border-slate-200 transition-all">
          <div className="flex justify-between items-start mb-3">
            <div className="p-3 bg-emerald-50 rounded-2xl text-emerald-600 group-hover:scale-110 transition-transform">
              <TrendingUp size={22} />
            </div>
            <div className="flex items-center gap-1 text-emerald-600 font-bold text-xs bg-emerald-50 px-2 py-0.5 rounded-lg">
              <ArrowUpRight size={13} />
              Receita Real
            </div>
          </div>
          <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Arrecadação Apoiadores</p>
          <p className="text-3xl font-black text-emerald-600 mt-1">
            R$ {stats.totalRaised.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
          <p className="text-[11px] text-slate-400 font-bold mt-2">
            Total liquidado na base histórica
          </p>
        </div>

        <div className="bg-slate-900 p-6 rounded-3xl shadow-xl shadow-slate-200 transition-all text-white relative overflow-hidden group">
          <div className="relative z-10">
            <div className="flex justify-between items-start mb-3">
              <div className="p-3 bg-white/10 rounded-2xl text-amber-400">
                <DollarSign size={22} />
              </div>
              <span className="px-2.5 py-1 bg-white/10 text-white font-bold text-[10px] rounded-lg uppercase tracking-wider">
                Média Geral
              </span>
            </div>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Contribuição Média</p>
            <p className="text-3xl font-black text-white mt-1">
              R$ {stats.avgTicket.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
            <p className="text-[11px] text-slate-400 font-bold mt-2">
              Ticket acumulado por apoiador
            </p>
          </div>
          <div className="absolute top-0 right-0 w-28 h-28 bg-amber-500/10 rounded-full -mr-12 -mt-12 blur-2xl group-hover:bg-amber-500/20 transition-all"></div>
        </div>

      </div>

      {/* Toolbar: Filtros e Busca */}
      <div className="px-8 pt-4">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-slate-50/60 p-4 rounded-2xl border border-slate-100">
          
          <div className="relative flex-1 w-full lg:max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Buscar por nome, e-mail ou criança..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500 transition-all shadow-sm"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
            {/* Filtro Status */}
            <div className="flex bg-white p-1 rounded-xl border border-slate-200 shadow-sm text-xs font-bold">
              <button
                onClick={() => setStatusFilter('all')}
                className={cn(
                  "px-3 py-1.5 rounded-lg transition-all",
                  statusFilter === 'all' ? "bg-slate-900 text-white shadow" : "text-slate-500 hover:text-slate-900"
                )}
              >
                Todos
              </button>
              <button
                onClick={() => setStatusFilter('active')}
                className={cn(
                  "px-3 py-1.5 rounded-lg transition-all",
                  statusFilter === 'active' ? "bg-emerald-600 text-white shadow" : "text-slate-500 hover:text-emerald-700"
                )}
              >
                Ativos
              </button>
              <button
                onClick={() => setStatusFilter('pending')}
                className={cn(
                  "px-3 py-1.5 rounded-lg transition-all",
                  statusFilter === 'pending' ? "bg-amber-500 text-white shadow" : "text-slate-500 hover:text-amber-700"
                )}
              >
                Pendentes
              </button>
            </div>

            {/* Filtro Modalidade */}
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value as any)}
              className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 shadow-sm focus:outline-none"
            >
              <option value="all">Todas as Modalidades</option>
              <option value="sponsor">Apenas Padrinhos de Criança</option>
              <option value="donor">Apenas Doadores Recorrentes</option>
            </select>

            {/* Exportar CSV */}
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl text-xs font-bold text-slate-700 shadow-sm transition-all active:scale-95 ml-auto lg:ml-0"
              title="Baixar planilha de apoiadores"
            >
              <Download size={14} className="text-slate-500" />
              Exportar CSV
            </button>
          </div>

        </div>
      </div>

      {/* Tabela de Apoiadores Cadastrados */}
      <div className="px-8 pb-8 overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/50 text-slate-400 text-[10px] uppercase font-black tracking-[0.2em] border-b border-slate-100">
              <th className="px-6 py-4">Apoiador / Contato</th>
              <th className="px-6 py-4">Modalidade / Papel</th>
              <th className="px-6 py-4">Criança Apadrinhada</th>
              <th className="px-6 py-4">Data Cadastro</th>
              <th className="px-6 py-4 text-right">Total Efetivamente Doado</th>
              <th className="px-6 py-4 text-center">Status</th>
              <th className="px-6 py-4 text-center">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-medium">
            {filteredSupporters.map((s) => (
              <tr key={s.id} className="hover:bg-slate-50/80 transition-all group/row">
                
                {/* Nome e Contato */}
                <td className="px-6 py-5">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-700 flex items-center justify-center font-black text-sm border border-amber-200/50 group-hover/row:scale-105 transition-transform">
                      {s.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-bold text-slate-900 text-sm">{s.name}</p>
                      <p className="text-xs text-slate-400 font-medium flex items-center gap-1">
                        <Mail size={11} /> {s.email}
                      </p>
                      {s.phone && (
                        <p className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                          <Phone size={10} /> {s.phone}
                        </p>
                      )}
                    </div>
                  </div>
                </td>

                {/* Tipo / Modalidade */}
                <td className="px-6 py-5">
                  <span className={cn(
                    "inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider border shadow-sm",
                    s.role === 'Padrinho' || !!s.sponsoredChildName
                      ? "bg-rose-50 text-rose-700 border-rose-100"
                      : "bg-blue-50 text-blue-700 border-blue-100"
                  )}>
                    {s.role === 'Padrinho' || !!s.sponsoredChildName ? (
                      <>
                        <Heart size={11} className="fill-rose-500 text-rose-500" />
                        Padrinho
                      </>
                    ) : (
                      <>
                        <Users size={11} />
                        Doador Mensal
                      </>
                    )}
                  </span>
                </td>

                {/* Criança Apadrinhada */}
                <td className="px-6 py-5">
                  {s.sponsoredChildName ? (
                    <div>
                      <p className="text-xs font-black text-slate-900 flex items-center gap-1">
                        <Heart size={12} className="text-rose-500" />
                        {s.sponsoredChildName}
                      </p>
                      {s.sponsoredChildVillage && (
                        <p className="text-[10px] text-slate-400">{s.sponsoredChildVillage}</p>
                      )}
                    </div>
                  ) : (
                    <span className="text-xs text-slate-400 font-bold italic">
                      Apoio Geral / Fundo
                    </span>
                  )}
                </td>

                {/* Data de Cadastro */}
                <td className="px-6 py-5 text-xs text-slate-500 font-bold">
                  {new Date(s.joinedAt).toLocaleDateString('pt-BR')}
                </td>

                {/* Total Efetivamente Doado */}
                <td className="px-6 py-5 text-right">
                  <p className="text-sm font-black text-emerald-600">
                    R$ {s.totalDonated.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                  <p className="text-[10px] text-slate-400 font-bold">
                    {s.donationsCount} {s.donationsCount === 1 ? 'doação paga' : 'doações pagas'}
                  </p>
                </td>

                {/* Status */}
                <td className="px-6 py-5 text-center">
                  <span className={cn(
                    "inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border",
                    s.status === 'active' ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                    s.status === 'pending' ? "bg-amber-50 text-amber-700 border-amber-200" :
                    "bg-slate-100 text-slate-600 border-slate-200"
                  )}>
                    {s.status === 'active' ? 'Ativo' : s.status === 'pending' ? 'Pendente' : 'Inativo'}
                  </span>
                </td>

                {/* Ações */}
                <td className="px-6 py-5 text-center">
                  <button
                    onClick={() => setSelectedSupporter(s)}
                    className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-50 hover:bg-slate-900 hover:text-white text-slate-700 text-xs font-bold rounded-xl transition-all shadow-sm active:scale-95 group/btn"
                  >
                    <FileText size={13} className="text-slate-400 group-hover/btn:text-white" />
                    Ver Extrato
                  </button>
                </td>

              </tr>
            ))}
          </tbody>
        </table>

        {filteredSupporters.length === 0 && (
          <div className="p-16 text-center">
            <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4 text-slate-300">
              <Users size={32} />
            </div>
            <p className="text-base font-bold text-slate-900">Nenhum apoiador localizado</p>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              Verifique os filtros selecionados ou digite outro termo na barra de busca.
            </p>
          </div>
        )}
      </div>

      {/* Modal de Extrato e Detalhes do Apoiador */}
      <SupporterFinancialModal
        isOpen={!!selectedSupporter}
        onClose={() => setSelectedSupporter(null)}
        supporter={selectedSupporter}
      />

    </div>
  );
}
