import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Users,
  Building2,
  Search,
  RefreshCw,
  Download,
  MessageCircle,
  Mail,
  MapPin,
  Clock,
  CheckCircle2,
  XCircle,
  Eye,
  Trash2,
  X,
  Globe,
  FileText,
  Sparkles,
  Calendar,
  ExternalLink,
  Bell
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { cn } from '../../lib/utils';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export type VolunteerStatus = 'pending' | 'reviewed' | 'contacted' | 'approved' | 'rejected';
export type PartnershipStatus = 'pending' | 'reviewed' | 'meeting_scheduled' | 'partnership_active' | 'declined';

export interface VolunteerApplication {
  id: string;
  name: string;
  email: string;
  phone: string;
  city: string;
  state_country: string;
  desired_location: 'brasil' | 'mocambique' | 'ambos';
  availability?: string | null;
  skills_areas?: string[] | null;
  experience?: string | null;
  motivation: string;
  status: VolunteerStatus;
  notes?: string | null;
  created_at: string;
  _localOnly?: boolean;
}

export interface CorporatePartnership {
  id: string;
  company_name: string;
  contact_person: string;
  email: string;
  phone: string;
  partnership_type: 'investimento' | 'doacao_produto' | 'doacao_servico' | 'multiplas';
  cnpj?: string | null;
  website_social?: string | null;
  estimated_value_or_scope?: string | null;
  proposal_details: string;
  status: PartnershipStatus;
  notes?: string | null;
  created_at: string;
  _localOnly?: boolean;
}

const VOLUNTEER_STATUS_OPTIONS: { value: VolunteerStatus; label: string; badge: string }[] = [
  { value: 'pending', label: 'Pendente', badge: 'bg-amber-50 text-amber-700 border-amber-200' },
  { value: 'reviewed', label: 'Em Análise', badge: 'bg-sky-50 text-sky-700 border-sky-200' },
  { value: 'contacted', label: 'Contatado', badge: 'bg-blue-50 text-blue-700 border-blue-200' },
  { value: 'approved', label: 'Aprovado', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  { value: 'rejected', label: 'Não Selecionado', badge: 'bg-slate-100 text-slate-600 border-slate-200' },
];

const PARTNERSHIP_STATUS_OPTIONS: { value: PartnershipStatus; label: string; badge: string }[] = [
  { value: 'pending', label: 'Pendente', badge: 'bg-amber-50 text-amber-700 border-amber-200' },
  { value: 'reviewed', label: 'Em Análise', badge: 'bg-sky-50 text-sky-700 border-sky-200' },
  { value: 'meeting_scheduled', label: 'Reunião Agendada', badge: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  { value: 'partnership_active', label: 'Parceria Ativa', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  { value: 'declined', label: 'Recusada', badge: 'bg-slate-100 text-slate-600 border-slate-200' },
];

const LOCATION_LABELS: Record<string, string> = {
  brasil: 'Brasil',
  mocambique: 'Moçambique',
  ambos: 'Brasil e Moçambique',
};

const PARTNERSHIP_TYPE_LABELS: Record<string, string> = {
  investimento: 'Investimento Financeiro / ESG',
  doacao_produto: 'Doação de Produtos',
  doacao_servico: 'Doação de Serviços / Pro Bono',
  multiplas: 'Múltiplas Frentes',
};

const LOCAL_VOL_KEY = 'yahhope_volunteer_applications';
const LOCAL_PART_KEY = 'yahhope_corporate_partnerships';

function buildWhatsAppUrl(phone: string, message: string): string | null {
  const clean = (phone || '').replace(/\D/g, '');
  if (!clean) return null;
  const full = clean.startsWith('55') ? clean : `55${clean}`;
  return `https://wa.me/${full}?text=${encodeURIComponent(message)}`;
}

function formatDateTime(iso?: string): string {
  if (!iso) return '-';
  try {
    return format(parseISO(iso), 'dd/MM/yyyy HH:mm', { locale: ptBR });
  } catch {
    return iso;
  }
}

function downloadCsv(filename: string, headers: string[], rows: string[][]) {
  const escape = (val: string) => `"${String(val ?? '').replace(/"/g, '""')}"`;
  const csv = [headers.map(escape).join(','), ...rows.map(r => r.map(escape).join(','))].join('\n');
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function VolunteerPartnershipsAdmin() {
  const [activeTab, setActiveTab] = useState<'volunteers' | 'partnerships'>('volunteers');
  const [loading, setLoading] = useState(true);
  const [volunteers, setVolunteers] = useState<VolunteerApplication[]>([]);
  const [partnerships, setPartnerships] = useState<CorporatePartnership[]>([]);
  const [realtimeAlert, setRealtimeAlert] = useState<string | null>(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [volStatusFilter, setVolStatusFilter] = useState<string>('all');
  const [volLocationFilter, setVolLocationFilter] = useState<string>('all');
  const [partStatusFilter, setPartStatusFilter] = useState<string>('all');
  const [partTypeFilter, setPartTypeFilter] = useState<string>('all');

  // Detail Modal
  const [selectedVol, setSelectedVol] = useState<VolunteerApplication | null>(null);
  const [selectedPart, setSelectedPart] = useState<CorporatePartnership | null>(null);
  const [editingNotes, setEditingNotes] = useState('');
  const [savingNotes, setSavingNotes] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [volRes, partRes] = await Promise.all([
        supabase.from('volunteer_applications').select('*').order('created_at', { ascending: false }),
        supabase.from('corporate_partnerships').select('*').order('created_at', { ascending: false }),
      ]);

      // Merge Volunteers (Supabase + localStorage fallback)
      const volMap = new Map<string, VolunteerApplication>();
      (volRes.data || []).forEach((v: any) => {
        volMap.set(v.id, { ...v, _localOnly: false });
      });
      try {
        const localVols: any[] = JSON.parse(localStorage.getItem(LOCAL_VOL_KEY) || '[]');
        localVols.forEach((v, idx) => {
          const alreadyInDb = Array.from(volMap.values()).some(
            db => db.email === v.email && db.created_at?.slice(0, 16) === v.created_at?.slice(0, 16)
          );
          if (!alreadyInDb) {
            const localId = v.id || `local_vol_${idx}_${v.created_at || Date.now()}`;
            volMap.set(localId, { ...v, id: localId, status: v.status || 'pending', _localOnly: true });
          }
        });
      } catch {
        // ignore localStorage parse error
      }
      setVolunteers(
        Array.from(volMap.values()).sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''))
      );

      // Merge Partnerships (Supabase + localStorage fallback)
      const partMap = new Map<string, CorporatePartnership>();
      (partRes.data || []).forEach((p: any) => {
        partMap.set(p.id, { ...p, _localOnly: false });
      });
      try {
        const localParts: any[] = JSON.parse(localStorage.getItem(LOCAL_PART_KEY) || '[]');
        localParts.forEach((p, idx) => {
          const alreadyInDb = Array.from(partMap.values()).some(
            db => db.email === p.email && db.created_at?.slice(0, 16) === p.created_at?.slice(0, 16)
          );
          if (!alreadyInDb) {
            const localId = p.id || `local_part_${idx}_${p.created_at || Date.now()}`;
            partMap.set(localId, { ...p, id: localId, status: p.status || 'pending', _localOnly: true });
          }
        });
      } catch {
        // ignore localStorage parse error
      }
      setPartnerships(
        Array.from(partMap.values()).sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''))
      );
    } catch (err) {
      console.error('Erro ao carregar inscrições e parcerias:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();

    const channel = supabase
      .channel('volunteer_partnerships_realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'volunteer_applications' },
        payload => {
          if (payload.eventType === 'INSERT') {
            const name = (payload.new as any)?.name || 'Novo voluntário';
            setRealtimeAlert(`Nova inscrição de voluntário recebida: ${name}`);
          }
          loadData();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'corporate_partnerships' },
        payload => {
          if (payload.eventType === 'INSERT') {
            const company = (payload.new as any)?.company_name || 'Nova empresa';
            setRealtimeAlert(`Nova proposta de parceria recebida: ${company}`);
          }
          loadData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadData]);

  const showFeedback = (msg: string) => {
    setFeedbackMsg(msg);
    setTimeout(() => setFeedbackMsg(null), 3500);
  };

  const handleUpdateVolunteerStatus = async (item: VolunteerApplication, newStatus: VolunteerStatus) => {
    setVolunteers(prev => prev.map(v => (v.id === item.id ? { ...v, status: newStatus } : v)));
    if (selectedVol?.id === item.id) {
      setSelectedVol({ ...selectedVol, status: newStatus });
    }

    if (!item._localOnly) {
      const { error } = await supabase
        .from('volunteer_applications')
        .update({ status: newStatus })
        .eq('id', item.id);
      if (error) {
        console.error('Erro ao atualizar status do voluntário:', error);
        showFeedback('Erro ao salvar status no Supabase (verifique permissões RLS).');
        return;
      }
    }
    showFeedback('Status do voluntário atualizado.');
  };

  const handleUpdatePartnershipStatus = async (item: CorporatePartnership, newStatus: PartnershipStatus) => {
    setPartnerships(prev => prev.map(p => (p.id === item.id ? { ...p, status: newStatus } : p)));
    if (selectedPart?.id === item.id) {
      setSelectedPart({ ...selectedPart, status: newStatus });
    }

    if (!item._localOnly) {
      const { error } = await supabase
        .from('corporate_partnerships')
        .update({ status: newStatus })
        .eq('id', item.id);
      if (error) {
        console.error('Erro ao atualizar status da parceria:', error);
        showFeedback('Erro ao salvar status no Supabase (verifique permissões RLS).');
        return;
      }
    }
    showFeedback('Status da parceria atualizado.');
  };

  const handleSaveNotes = async () => {
    setSavingNotes(true);
    try {
      if (selectedVol) {
        if (!selectedVol._localOnly) {
          const { error } = await supabase
            .from('volunteer_applications')
            .update({ notes: editingNotes })
            .eq('id', selectedVol.id);
          if (error) throw error;
        }
        setVolunteers(prev => prev.map(v => (v.id === selectedVol.id ? { ...v, notes: editingNotes } : v)));
        setSelectedVol({ ...selectedVol, notes: editingNotes });
        showFeedback('Observações salvas.');
      } else if (selectedPart) {
        if (!selectedPart._localOnly) {
          const { error } = await supabase
            .from('corporate_partnerships')
            .update({ notes: editingNotes })
            .eq('id', selectedPart.id);
          if (error) throw error;
        }
        setPartnerships(prev => prev.map(p => (p.id === selectedPart.id ? { ...p, notes: editingNotes } : p)));
        setSelectedPart({ ...selectedPart, notes: editingNotes });
        showFeedback('Observações salvas.');
      }
    } catch (err) {
      console.error('Erro ao salvar observações:', err);
      showFeedback('Não foi possível salvar as observações no banco.');
    } finally {
      setSavingNotes(false);
    }
  };

  const handleDeleteRecord = async (type: 'volunteer' | 'partnership', id: string, localOnly?: boolean) => {
    if (!window.confirm('Tem certeza que deseja excluir este registro? Essa ação não pode ser desfeita.')) {
      return;
    }

    if (type === 'volunteer') {
      if (!localOnly) {
        const { error } = await supabase.from('volunteer_applications').delete().eq('id', id);
        if (error) {
          showFeedback('Erro ao excluir no Supabase (verifique permissões RLS).');
          return;
        }
      }
      setVolunteers(prev => prev.filter(v => v.id !== id));
      if (selectedVol?.id === id) setSelectedVol(null);
      showFeedback('Inscrição de voluntário excluída.');
    } else {
      if (!localOnly) {
        const { error } = await supabase.from('corporate_partnerships').delete().eq('id', id);
        if (error) {
          showFeedback('Erro ao excluir no Supabase (verifique permissões RLS).');
          return;
        }
      }
      setPartnerships(prev => prev.filter(p => p.id !== id));
      if (selectedPart?.id === id) setSelectedPart(null);
      showFeedback('Registro de parceria excluído.');
    }
  };

  const filteredVolunteers = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return volunteers.filter(v => {
      const matchSearch =
        !q ||
        v.name?.toLowerCase().includes(q) ||
        v.email?.toLowerCase().includes(q) ||
        v.phone?.includes(q) ||
        v.city?.toLowerCase().includes(q) ||
        v.motivation?.toLowerCase().includes(q) ||
        (v.skills_areas || []).some(s => s.toLowerCase().includes(q));
      const matchStatus = volStatusFilter === 'all' || v.status === volStatusFilter;
      const matchLoc = volLocationFilter === 'all' || v.desired_location === volLocationFilter;
      return matchSearch && matchStatus && matchLoc;
    });
  }, [volunteers, searchTerm, volStatusFilter, volLocationFilter]);

  const filteredPartnerships = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return partnerships.filter(p => {
      const matchSearch =
        !q ||
        p.company_name?.toLowerCase().includes(q) ||
        p.contact_person?.toLowerCase().includes(q) ||
        p.email?.toLowerCase().includes(q) ||
        p.phone?.includes(q) ||
        (p.cnpj || '').includes(q) ||
        p.proposal_details?.toLowerCase().includes(q);
      const matchStatus = partStatusFilter === 'all' || p.status === partStatusFilter;
      const matchType = partTypeFilter === 'all' || p.partnership_type === partTypeFilter;
      return matchSearch && matchStatus && matchType;
    });
  }, [partnerships, searchTerm, partStatusFilter, partTypeFilter]);

  const pendingVolCount = volunteers.filter(v => v.status === 'pending').length;
  const approvedVolCount = volunteers.filter(v => v.status === 'approved').length;
  const pendingPartCount = partnerships.filter(p => p.status === 'pending').length;
  const activePartCount = partnerships.filter(p => p.status === 'partnership_active').length;

  const handleExportCurrentTab = () => {
    if (activeTab === 'volunteers') {
      downloadCsv(
        `voluntarios-yah-hope-${new Date().toISOString().slice(0, 10)}.csv`,
        ['Nome', 'E-mail', 'Telefone', 'Cidade', 'Estado/País', 'Local Desejado', 'Disponibilidade', 'Áreas', 'Experiência', 'Motivação', 'Status', 'Notas', 'Data'],
        filteredVolunteers.map(v => [
          v.name,
          v.email,
          v.phone,
          v.city,
          v.state_country,
          LOCATION_LABELS[v.desired_location] || v.desired_location,
          v.availability || '',
          (v.skills_areas || []).join('; '),
          v.experience || '',
          v.motivation,
          VOLUNTEER_STATUS_OPTIONS.find(o => o.value === v.status)?.label || v.status,
          v.notes || '',
          formatDateTime(v.created_at),
        ])
      );
    } else {
      downloadCsv(
        `parcerias-yah-hope-${new Date().toISOString().slice(0, 10)}.csv`,
        ['Empresa', 'CNPJ', 'Contato', 'E-mail', 'Telefone', 'Tipo', 'Site/Rede Social', 'Proposta', 'Status', 'Notas', 'Data'],
        filteredPartnerships.map(p => [
          p.company_name,
          p.cnpj || '',
          p.contact_person,
          p.email,
          p.phone,
          PARTNERSHIP_TYPE_LABELS[p.partnership_type] || p.partnership_type,
          p.website_social || '',
          p.proposal_details,
          PARTNERSHIP_STATUS_OPTIONS.find(o => o.value === p.status)?.label || p.status,
          p.notes || '',
          formatDateTime(p.created_at),
        ])
      );
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2.5">
            <Sparkles className="text-amber-500" size={24} />
            Voluntários & Parcerias Empresariais
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Receba, acompanhe e administre em tempo real todas as inscrições enviadas pela página pública.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleExportCurrentTab}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 text-sm font-medium hover:bg-slate-50 transition-colors"
          >
            <Download size={16} />
            Exportar CSV
          </button>
          <button
            onClick={loadData}
            disabled={loading}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-900 text-white text-sm font-medium hover:bg-slate-800 transition-colors disabled:opacity-60"
          >
            <RefreshCw size={16} className={cn(loading && 'animate-spin')} />
            Atualizar
          </button>
        </div>
      </div>

      {/* Realtime / Feedback banners */}
      {realtimeAlert && (
        <div className="flex items-center justify-between gap-3 px-4 py-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-sm">
          <div className="flex items-center gap-2.5 font-medium">
            <Bell size={18} className="text-emerald-600 animate-bounce" />
            <span>{realtimeAlert}</span>
          </div>
          <button onClick={() => setRealtimeAlert(null)} className="text-emerald-700 hover:text-emerald-900">
            <X size={16} />
          </button>
        </div>
      )}

      {feedbackMsg && (
        <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 text-white text-sm font-medium shadow-sm">
          <CheckCircle2 size={16} className="text-emerald-400" />
          <span>{feedbackMsg}</span>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase tracking-wider">
            <span>Voluntários</span>
            <Users size={16} className="text-amber-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">{volunteers.length}</span>
            {pendingVolCount > 0 && (
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                {pendingVolCount} pendente{pendingVolCount > 1 ? 's' : ''}
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400 mt-1">{approvedVolCount} aprovado(s)</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase tracking-wider">
            <span>Parcerias</span>
            <Building2 size={16} className="text-indigo-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">{partnerships.length}</span>
            {pendingPartCount > 0 && (
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800">
                {pendingPartCount} nova{pendingPartCount > 1 ? 's' : ''}
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400 mt-1">{activePartCount} parceria(s) ativa(s)</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase tracking-wider">
            <span>Interesse Moçambique</span>
            <Globe size={16} className="text-emerald-500" />
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900">
            {volunteers.filter(v => v.desired_location === 'mocambique' || v.desired_location === 'ambos').length}
          </div>
          <p className="text-xs text-slate-400 mt-1">Voluntários disponíveis p/ missão</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase tracking-wider">
            <span>Aguardando Retorno</span>
            <Clock size={16} className="text-rose-500" />
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900">
            {pendingVolCount + pendingPartCount}
          </div>
          <p className="text-xs text-slate-400 mt-1">Total com status pendente</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('volunteers')}
          className={cn(
            'px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2',
            activeTab === 'volunteers'
              ? 'border-amber-500 text-amber-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          )}
        >
          <Users size={16} />
          Inscrições de Voluntários
          <span className="px-2 py-0.5 text-xs rounded-full bg-slate-100 text-slate-700">
            {volunteers.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('partnerships')}
          className={cn(
            'px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2',
            activeTab === 'partnerships'
              ? 'border-indigo-600 text-indigo-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          )}
        >
          <Building2 size={16} />
          Parcerias Empresariais
          <span className="px-2 py-0.5 text-xs rounded-full bg-slate-100 text-slate-700">
            {partnerships.length}
          </span>
        </button>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col md:flex-row gap-3 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder={
              activeTab === 'volunteers'
                ? 'Buscar por nome, e-mail, telefone, cidade ou habilidade...'
                : 'Buscar por empresa, CNPJ, contato, e-mail ou proposta...'
            }
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500"
          />
        </div>

        {activeTab === 'volunteers' ? (
          <>
            <select
              value={volStatusFilter}
              onChange={e => setVolStatusFilter(e.target.value)}
              className="px-3.5 py-2 rounded-xl border border-slate-200 text-sm bg-white text-slate-700"
            >
              <option value="all">Todos os status</option>
              {VOLUNTEER_STATUS_OPTIONS.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
            <select
              value={volLocationFilter}
              onChange={e => setVolLocationFilter(e.target.value)}
              className="px-3.5 py-2 rounded-xl border border-slate-200 text-sm bg-white text-slate-700"
            >
              <option value="all">Todos os locais</option>
              <option value="brasil">Brasil</option>
              <option value="mocambique">Moçambique</option>
              <option value="ambos">Brasil e Moçambique</option>
            </select>
          </>
        ) : (
          <>
            <select
              value={partStatusFilter}
              onChange={e => setPartStatusFilter(e.target.value)}
              className="px-3.5 py-2 rounded-xl border border-slate-200 text-sm bg-white text-slate-700"
            >
              <option value="all">Todos os status</option>
              {PARTNERSHIP_STATUS_OPTIONS.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
            <select
              value={partTypeFilter}
              onChange={e => setPartTypeFilter(e.target.value)}
              className="px-3.5 py-2 rounded-xl border border-slate-200 text-sm bg-white text-slate-700"
            >
              <option value="all">Todos os formatos</option>
              {Object.entries(PARTNERSHIP_TYPE_LABELS).map(([k, label]) => (
                <option key={k} value={k}>{label}</option>
              ))}
            </select>
          </>
        )}
      </div>

      {/* Table Content */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400 text-sm">Carregando respostas...</div>
        ) : activeTab === 'volunteers' ? (
          filteredVolunteers.length === 0 ? (
            <div className="p-12 text-center text-slate-400 text-sm">
              Nenhuma inscrição de voluntário encontrada com os filtros atuais.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/70 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    <th className="py-3 px-4">Voluntário</th>
                    <th className="py-3 px-4">Localidade</th>
                    <th className="py-3 px-4">Destino / Disponibilidade</th>
                    <th className="py-3 px-4">Áreas / Motivação</th>
                    <th className="py-3 px-4">Recebido em</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {filteredVolunteers.map(v => {
                    const waUrl = buildWhatsAppUrl(
                      v.phone,
                      `Olá ${v.name}! Tudo bem? Recebemos sua inscrição como voluntário(a) na YAH Hope e gostaríamos de conversar com você.`
                    );
                    const statusMeta = VOLUNTEER_STATUS_OPTIONS.find(o => o.value === v.status) || VOLUNTEER_STATUS_OPTIONS[0];

                    return (
                      <tr key={v.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                            {v.name}
                            {v._localOnly && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-500">Local</span>
                            )}
                          </div>
                          <div className="text-xs text-slate-500 mt-0.5">{v.email}</div>
                          <div className="text-xs text-slate-500">{v.phone}</div>
                        </td>
                        <td className="py-3.5 px-4 text-slate-600">
                          <div className="flex items-center gap-1 text-xs">
                            <MapPin size={13} className="text-slate-400 shrink-0" />
                            <span>{v.city}{v.state_country ? ` - ${v.state_country}` : ''}</span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="inline-block px-2 py-0.5 rounded-md text-xs font-semibold bg-amber-50 text-amber-800">
                            {LOCATION_LABELS[v.desired_location] || v.desired_location}
                          </span>
                          {v.availability && (
                            <div className="text-xs text-slate-500 mt-1">{v.availability}</div>
                          )}
                        </td>
                        <td className="py-3.5 px-4 max-w-[260px]">
                          {Array.isArray(v.skills_areas) && v.skills_areas.length > 0 && (
                            <div className="flex flex-wrap gap-1 mb-1">
                              {v.skills_areas.slice(0, 3).map((s, i) => (
                                <span key={i} className="px-1.5 py-0.5 text-[11px] rounded bg-slate-100 text-slate-700">
                                  {s}
                                </span>
                              ))}
                              {v.skills_areas.length > 3 && (
                                <span className="text-[11px] text-slate-400">+{v.skills_areas.length - 3}</span>
                              )}
                            </div>
                          )}
                          <p className="text-xs text-slate-500 truncate" title={v.motivation}>
                            {v.motivation}
                          </p>
                        </td>
                        <td className="py-3.5 px-4 text-xs text-slate-500 whitespace-nowrap">
                          {formatDateTime(v.created_at)}
                        </td>
                        <td className="py-3.5 px-4">
                          <select
                            value={v.status || 'pending'}
                            onChange={e => handleUpdateVolunteerStatus(v, e.target.value as VolunteerStatus)}
                            className={cn(
                              'text-xs font-semibold px-2.5 py-1.5 rounded-lg border cursor-pointer focus:outline-none',
                              statusMeta.badge
                            )}
                          >
                            {VOLUNTEER_STATUS_OPTIONS.map(o => (
                              <option key={o.value} value={o.value}>{o.label}</option>
                            ))}
                          </select>
                        </td>
                        <td className="py-3.5 px-4 text-right whitespace-nowrap">
                          <div className="inline-flex items-center gap-1.5">
                            {waUrl && (
                              <a
                                href={waUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                title="Chamar no WhatsApp"
                                className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 transition-colors"
                              >
                                <MessageCircle size={16} />
                              </a>
                            )}
                            <button
                              onClick={() => {
                                setSelectedPart(null);
                                setSelectedVol(v);
                                setEditingNotes(v.notes || '');
                              }}
                              title="Ver detalhes completos"
                              className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors"
                            >
                              <Eye size={16} />
                            </button>
                            <button
                              onClick={() => handleDeleteRecord('volunteer', v.id, v._localOnly)}
                              title="Excluir registro"
                              className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 transition-colors"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )
        ) : filteredPartnerships.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-sm">
            Nenhuma proposta de parceria encontrada com os filtros atuais.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/70 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <th className="py-3 px-4">Empresa / CNPJ</th>
                  <th className="py-3 px-4">Responsável & Contato</th>
                  <th className="py-3 px-4">Formato</th>
                  <th className="py-3 px-4">Proposta</th>
                  <th className="py-3 px-4">Recebido em</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {filteredPartnerships.map(p => {
                  const waUrl = buildWhatsAppUrl(
                    p.phone,
                    `Olá ${p.contact_person}! Tudo bem? Recebemos a proposta de parceria da ${p.company_name} na YAH Hope e gostaríamos de conversar.`
                  );
                  const statusMeta = PARTNERSHIP_STATUS_OPTIONS.find(o => o.value === p.status) || PARTNERSHIP_STATUS_OPTIONS[0];

                  return (
                    <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                          {p.company_name}
                          {p._localOnly && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-500">Local</span>
                          )}
                        </div>
                        {p.cnpj && <div className="text-xs text-slate-500 mt-0.5">CNPJ: {p.cnpj}</div>}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="text-slate-800 font-medium text-xs">{p.contact_person}</div>
                        <div className="text-xs text-slate-500 mt-0.5">{p.email}</div>
                        <div className="text-xs text-slate-500">{p.phone}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="inline-block px-2 py-0.5 rounded-md text-xs font-semibold bg-indigo-50 text-indigo-800">
                          {PARTNERSHIP_TYPE_LABELS[p.partnership_type] || p.partnership_type}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 max-w-[260px]">
                        <p className="text-xs text-slate-600 truncate" title={p.proposal_details}>
                          {p.proposal_details}
                        </p>
                      </td>
                      <td className="py-3.5 px-4 text-xs text-slate-500 whitespace-nowrap">
                        {formatDateTime(p.created_at)}
                      </td>
                      <td className="py-3.5 px-4">
                        <select
                          value={p.status || 'pending'}
                          onChange={e => handleUpdatePartnershipStatus(p, e.target.value as PartnershipStatus)}
                          className={cn(
                            'text-xs font-semibold px-2.5 py-1.5 rounded-lg border cursor-pointer focus:outline-none',
                            statusMeta.badge
                          )}
                        >
                          {PARTNERSHIP_STATUS_OPTIONS.map(o => (
                            <option key={o.value} value={o.value}>{o.label}</option>
                          ))}
                        </select>
                      </td>
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5">
                          {waUrl && (
                            <a
                              href={waUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              title="Chamar no WhatsApp"
                              className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 transition-colors"
                            >
                              <MessageCircle size={16} />
                            </a>
                          )}
                          <button
                            onClick={() => {
                              setSelectedVol(null);
                              setSelectedPart(p);
                              setEditingNotes(p.notes || '');
                            }}
                            title="Ver detalhes completos"
                            className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors"
                          >
                            <Eye size={16} />
                          </button>
                          <button
                            onClick={() => handleDeleteRecord('partnership', p.id, p._localOnly)}
                            title="Excluir registro"
                            className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 transition-colors"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {(selectedVol || selectedPart) && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 sticky top-0 bg-white z-10">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  {selectedVol ? 'Ficha de Inscrição — Voluntário' : 'Proposta — Parceria Empresarial'}
                </span>
                <h2 className="text-lg font-bold text-slate-900">
                  {selectedVol ? selectedVol.name : selectedPart?.company_name}
                </h2>
              </div>
              <button
                onClick={() => {
                  setSelectedVol(null);
                  setSelectedPart(null);
                }}
                className="p-2 rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-5 text-sm">
              {selectedVol && (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl">
                    <div>
                      <span className="text-xs text-slate-400 block">E-mail</span>
                      <a href={`mailto:${selectedVol.email}`} className="font-medium text-slate-800 hover:underline flex items-center gap-1.5 mt-0.5">
                        <Mail size={14} className="text-slate-400" />
                        {selectedVol.email}
                      </a>
                    </div>
                    <div>
                      <span className="text-xs text-slate-400 block">Telefone / WhatsApp</span>
                      <span className="font-medium text-slate-800 block mt-0.5">{selectedVol.phone}</span>
                    </div>
                    <div>
                      <span className="text-xs text-slate-400 block">Cidade / Estado-País</span>
                      <span className="font-medium text-slate-800 block mt-0.5">
                        {selectedVol.city}{selectedVol.state_country ? ` - ${selectedVol.state_country}` : ''}
                      </span>
                    </div>
                    <div>
                      <span className="text-xs text-slate-400 block">Recebido em</span>
                      <span className="font-medium text-slate-800 flex items-center gap-1.5 mt-0.5">
                        <Calendar size={14} className="text-slate-400" />
                        {formatDateTime(selectedVol.created_at)}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <span className="text-xs font-semibold text-slate-500 block mb-1">Local de Atuação Desejado</span>
                      <span className="inline-block px-2.5 py-1 rounded-lg text-xs font-semibold bg-amber-50 text-amber-800">
                        {LOCATION_LABELS[selectedVol.desired_location] || selectedVol.desired_location}
                      </span>
                    </div>
                    <div>
                      <span className="text-xs font-semibold text-slate-500 block mb-1">Disponibilidade</span>
                      <span className="text-slate-800">{selectedVol.availability || 'Não informada'}</span>
                    </div>
                  </div>

                  {Array.isArray(selectedVol.skills_areas) && selectedVol.skills_areas.length > 0 && (
                    <div>
                      <span className="text-xs font-semibold text-slate-500 block mb-1.5">Áreas de Interesse / Habilidades</span>
                      <div className="flex flex-wrap gap-1.5">
                        {selectedVol.skills_areas.map((s, idx) => (
                          <span key={idx} className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 text-xs font-medium">
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {selectedVol.experience && (
                    <div>
                      <span className="text-xs font-semibold text-slate-500 block mb-1">Experiência Prévia</span>
                      <p className="text-slate-700 bg-slate-50 p-3.5 rounded-xl whitespace-pre-wrap">{selectedVol.experience}</p>
                    </div>
                  )}

                  <div>
                    <span className="text-xs font-semibold text-slate-500 block mb-1">Motivação</span>
                    <p className="text-slate-700 bg-slate-50 p-3.5 rounded-xl whitespace-pre-wrap">{selectedVol.motivation}</p>
                  </div>

                  <div>
                    <span className="text-xs font-semibold text-slate-500 block mb-1.5">Status da Inscrição</span>
                    <select
                      value={selectedVol.status}
                      onChange={e => handleUpdateVolunteerStatus(selectedVol, e.target.value as VolunteerStatus)}
                      className="w-full sm:w-auto px-3 py-2 rounded-xl border border-slate-200 text-sm font-semibold bg-white"
                    >
                      {VOLUNTEER_STATUS_OPTIONS.map(o => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                      ))}
                    </select>
                  </div>
                </>
              )}

              {selectedPart && (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl">
                    <div>
                      <span className="text-xs text-slate-400 block">Responsável</span>
                      <span className="font-medium text-slate-800 block mt-0.5">{selectedPart.contact_person}</span>
                    </div>
                    <div>
                      <span className="text-xs text-slate-400 block">CNPJ</span>
                      <span className="font-medium text-slate-800 block mt-0.5">{selectedPart.cnpj || 'Não informado'}</span>
                    </div>
                    <div>
                      <span className="text-xs text-slate-400 block">E-mail Corporativo</span>
                      <a href={`mailto:${selectedPart.email}`} className="font-medium text-slate-800 hover:underline flex items-center gap-1.5 mt-0.5">
                        <Mail size={14} className="text-slate-400" />
                        {selectedPart.email}
                      </a>
                    </div>
                    <div>
                      <span className="text-xs text-slate-400 block">Telefone / WhatsApp</span>
                      <span className="font-medium text-slate-800 block mt-0.5">{selectedPart.phone}</span>
                    </div>
                    <div>
                      <span className="text-xs text-slate-400 block">Site / Rede Social</span>
                      {selectedPart.website_social ? (
                        <a
                          href={selectedPart.website_social.startsWith('http') ? selectedPart.website_social : `https://${selectedPart.website_social}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-medium text-indigo-600 hover:underline flex items-center gap-1 mt-0.5"
                        >
                          {selectedPart.website_social}
                          <ExternalLink size={12} />
                        </a>
                      ) : (
                        <span className="text-slate-400 block mt-0.5">Não informado</span>
                      )}
                    </div>
                    <div>
                      <span className="text-xs text-slate-400 block">Recebido em</span>
                      <span className="font-medium text-slate-800 flex items-center gap-1.5 mt-0.5">
                        <Calendar size={14} className="text-slate-400" />
                        {formatDateTime(selectedPart.created_at)}
                      </span>
                    </div>
                  </div>

                  <div>
                    <span className="text-xs font-semibold text-slate-500 block mb-1">Formato de Parceria</span>
                    <span className="inline-block px-2.5 py-1 rounded-lg text-xs font-semibold bg-indigo-50 text-indigo-800">
                      {PARTNERSHIP_TYPE_LABELS[selectedPart.partnership_type] || selectedPart.partnership_type}
                    </span>
                  </div>

                  <div>
                    <span className="text-xs font-semibold text-slate-500 block mb-1">Detalhes da Proposta</span>
                    <p className="text-slate-700 bg-slate-50 p-3.5 rounded-xl whitespace-pre-wrap">
                      {selectedPart.proposal_details}
                    </p>
                  </div>

                  <div>
                    <span className="text-xs font-semibold text-slate-500 block mb-1.5">Status da Parceria</span>
                    <select
                      value={selectedPart.status}
                      onChange={e => handleUpdatePartnershipStatus(selectedPart, e.target.value as PartnershipStatus)}
                      className="w-full sm:w-auto px-3 py-2 rounded-xl border border-slate-200 text-sm font-semibold bg-white"
                    >
                      {PARTNERSHIP_STATUS_OPTIONS.map(o => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                      ))}
                    </select>
                  </div>
                </>
              )}

              {/* Internal Notes */}
              <div className="pt-2 border-t border-slate-100">
                <label className="text-xs font-semibold text-slate-600 flex items-center gap-1.5 mb-1.5">
                  <FileText size={14} />
                  Notas Internas da Gestão
                </label>
                <textarea
                  rows={3}
                  value={editingNotes}
                  onChange={e => setEditingNotes(e.target.value)}
                  placeholder="Registre observações, histórico de contato, próximos passos..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500"
                />
                <div className="mt-2.5 flex items-center justify-between gap-3">
                  <button
                    onClick={handleSaveNotes}
                    disabled={savingNotes}
                    className="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 disabled:opacity-60"
                  >
                    {savingNotes ? 'Salvando...' : 'Salvar Notas'}
                  </button>

                  {(() => {
                    const phone = selectedVol ? selectedVol.phone : selectedPart?.phone || '';
                    const msg = selectedVol
                      ? `Olá ${selectedVol.name}! Tudo bem? Recebemos sua inscrição como voluntário(a) na YAH Hope.`
                      : `Olá ${selectedPart?.contact_person}! Tudo bem? Recebemos a proposta de parceria da ${selectedPart?.company_name} na YAH Hope.`;
                    const url = buildWhatsAppUrl(phone, msg);
                    return url ? (
                      <a
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700"
                      >
                        <MessageCircle size={14} />
                        Contatar via WhatsApp
                      </a>
                    ) : null;
                  })()}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
