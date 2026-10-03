import React, { useState, useMemo } from 'react';
import { 
  Mail, 
  Search, 
  Download, 
  Copy, 
  Check, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  XCircle, 
  Users, 
  TrendingUp, 
  UserCheck, 
  UserX, 
  X,
  ExternalLink,
  Sparkles,
  Inbox
} from 'lucide-react';
import { useNewsletter, NewsletterSubscriber } from '../../contexts/NewsletterContext';
import { useConfirm } from '../../contexts/ConfirmContext';
import { cn } from '../../lib/utils';

export function CommNewsletter() {
  const { 
    subscribers, 
    loading, 
    addSubscriber, 
    removeSubscriber, 
    toggleStatus, 
    exportToCSV,
    copyAllEmails 
  } = useNewsletter();

  const { confirm } = useConfirm();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'unsubscribed'>('all');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [copiedAll, setCopiedAll] = useState(false);

  // Modal to add new subscriber manually
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [newSource, setNewSource] = useState('Manual / Equipe');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalError, setModalError] = useState('');

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // KPIs
  const stats = useMemo(() => {
    const total = subscribers.length;
    const active = subscribers.filter(s => s.status === 'active').length;
    const unsubscribed = subscribers.filter(s => s.status === 'unsubscribed').length;

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recent = subscribers.filter(s => {
      try {
        return new Date(s.created_at) >= sevenDaysAgo;
      } catch {
        return false;
      }
    }).length;

    return { total, active, unsubscribed, recent };
  }, [subscribers]);

  // Filtered subscribers list
  const filteredSubscribers = useMemo(() => {
    return subscribers.filter(sub => {
      const matchesSearch = sub.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (sub.source || '').toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = 
        statusFilter === 'all' ? true : sub.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [subscribers, searchTerm, statusFilter]);

  const handleCopySingle = async (id: string, email: string) => {
    try {
      await navigator.clipboard.writeText(email);
      setCopiedId(id);
      showToast(`E-mail copiado: ${email}`);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      showToast('Não foi possível copiar o e-mail.');
    }
  };

  const handleCopyAll = async () => {
    const success = await copyAllEmails();
    if (success) {
      setCopiedAll(true);
      showToast(`${stats.active} e-mails ativos copiados para a área de transferência!`);
      setTimeout(() => setCopiedAll(false), 2500);
    } else {
      showToast('Nenhum e-mail ativo disponível para copiar.');
    }
  };

  const handleDelete = async (sub: NewsletterSubscriber) => {
    const confirmed = await confirm({
      title: 'Excluir Inscrito',
      message: `Tem certeza que deseja remover permanentemente o e-mail "${sub.email}" da lista da newsletter?`,
      confirmText: 'Excluir',
      cancelText: 'Cancelar',
      type: 'danger'
    });

    if (confirmed) {
      await removeSubscriber(sub.id);
      showToast('Inscrito removido com sucesso.');
    }
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError('');
    if (!newEmail.trim()) {
      setModalError('Digite um e-mail válido.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await addSubscriber(newEmail, newSource);
      if (res.success) {
        showToast(res.message);
        setNewEmail('');
        setIsAddModalOpen(false);
      } else {
        setModalError(res.message);
      }
    } catch (err: any) {
      setModalError(err?.message || 'Erro ao adicionar e-mail.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return isoString;
    }
  };

  return (
    <div className="space-y-6 pb-20 font-sans">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-xl flex items-center gap-2 border border-slate-700 animate-in fade-in slide-in-from-top-4">
          <CheckCircle2 size={18} className="text-[#92BF78]" />
          <span className="text-sm font-medium">{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <div className="w-10 h-10 rounded-xl bg-orange-50 border border-orange-100 flex items-center justify-center text-[#F49853]">
              <Inbox size={22} />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                Inscritos na Newsletter
              </h1>
              <p className="text-sm text-slate-500">
                Pessoas cadastradas através do site oficial e campanhas da YAH Hope
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            type="button"
            onClick={handleCopyAll}
            disabled={stats.active === 0}
            className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
            title="Copiar lista de e-mails ativos separados por vírgula"
          >
            {copiedAll ? <Check size={15} className="text-emerald-600" /> : <Copy size={15} />}
            <span>Copiar E-mails</span>
          </button>

          <button
            type="button"
            onClick={exportToCSV}
            disabled={subscribers.length === 0}
            className="px-4 py-2.5 bg-white border border-slate-200 hover:border-slate-300 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-2xs hover:bg-slate-50 disabled:opacity-50"
          >
            <Download size={15} className="text-[#F49853]" />
            <span>Exportar CSV</span>
          </button>

          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="px-4 py-2.5 bg-[#F49853] hover:bg-[#e0853d] text-white rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-xs active:scale-95"
          >
            <Plus size={16} />
            <span>Adicionar Inscrito</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Subscribers */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total de Inscritos</p>
            <h3 className="text-2xl font-black text-slate-900 mt-1">{stats.total}</h3>
            <span className="text-[11px] text-slate-500 font-medium">Cadastros acumulados</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-600">
            <Users size={22} />
          </div>
        </div>

        {/* Active Subscribers */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Inscritos Ativos</p>
            <h3 className="text-2xl font-black text-emerald-600 mt-1">{stats.active}</h3>
            <span className="text-[11px] text-emerald-600 font-medium">Recebendo notícias</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
            <UserCheck size={22} />
          </div>
        </div>

        {/* New this week */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Últimos 7 Dias</p>
            <h3 className="text-2xl font-black text-amber-600 mt-1">+{stats.recent}</h3>
            <span className="text-[11px] text-amber-600 font-medium">Novos contatos</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600">
            <TrendingUp size={22} />
          </div>
        </div>

        {/* Unsubscribed */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Descadastrados</p>
            <h3 className="text-2xl font-black text-slate-500 mt-1">{stats.unsubscribed}</h3>
            <span className="text-[11px] text-slate-400 font-medium">Opt-out / pausados</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-500">
            <UserX size={22} />
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {/* Filters and search */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-50/50">
          {/* Search Bar */}
          <div className="relative w-full sm:w-96">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por e-mail ou origem..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-9 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-hidden focus:border-[#F49853] transition-colors"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Status Filter Tabs */}
          <div className="flex items-center gap-1.5 w-full sm:w-auto bg-slate-200/60 p-1 rounded-xl">
            <button
              onClick={() => setStatusFilter('all')}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer",
                statusFilter === 'all'
                  ? "bg-white text-slate-900 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              )}
            >
              Todos ({subscribers.length})
            </button>
            <button
              onClick={() => setStatusFilter('active')}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer",
                statusFilter === 'active'
                  ? "bg-white text-emerald-700 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              )}
            >
              Ativos ({stats.active})
            </button>
            <button
              onClick={() => setStatusFilter('unsubscribed')}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer",
                statusFilter === 'unsubscribed'
                  ? "bg-white text-slate-700 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              )}
            >
              Descadastrados ({stats.unsubscribed})
            </button>
          </div>
        </div>

        {/* Subscribers Table */}
        <div className="overflow-x-auto">
          {filteredSubscribers.length === 0 ? (
            <div className="text-center py-16 px-4">
              <div className="w-16 h-16 rounded-2xl bg-orange-50 border border-orange-100 flex items-center justify-center text-[#F49853] mx-auto mb-3">
                <Mail size={28} />
              </div>
              <h3 className="text-base font-bold text-slate-800">Nenhum inscrito encontrado</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                {searchTerm 
                  ? `Nenhum resultado corresponde à busca "${searchTerm}". Tente outros termos.` 
                  : 'Os novos cadastros realizados no formulário de newsletter da Landing Page aparecerão automaticamente aqui.'}
              </p>
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="mt-4 px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all"
                >
                  Limpar Busca
                </button>
              )}
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-[11px] font-bold uppercase tracking-wider text-slate-400 bg-slate-50/70">
                  <th className="py-3.5 px-6">E-mail</th>
                  <th className="py-3.5 px-6">Data de Inscrição</th>
                  <th className="py-3.5 px-6">Origem</th>
                  <th className="py-3.5 px-6">Status</th>
                  <th className="py-3.5 px-6 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredSubscribers.map((sub) => {
                  const isCopied = copiedId === sub.id;
                  const isActive = sub.status === 'active';

                  return (
                    <tr 
                      key={sub.id}
                      className="hover:bg-slate-50/60 transition-colors group"
                    >
                      {/* Email */}
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2.5">
                          <div className={cn(
                            "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                            isActive ? "bg-orange-50 text-[#F49853]" : "bg-slate-100 text-slate-400"
                          )}>
                            <Mail size={15} />
                          </div>
                          <div className="min-w-0">
                            <span className="font-bold text-slate-900 block truncate group-hover:text-[#F49853] transition-colors">
                              {sub.email}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Date */}
                      <td className="py-4 px-6 text-slate-500 font-medium whitespace-nowrap">
                        {formatDate(sub.created_at)}
                      </td>

                      {/* Source */}
                      <td className="py-4 px-6">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                          {sub.source || 'Landing Page'}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-4 px-6">
                        <button
                          type="button"
                          onClick={() => toggleStatus(sub.id)}
                          className={cn(
                            "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold transition-all cursor-pointer border",
                            isActive
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                              : "bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200"
                          )}
                          title="Clique para alternar status do inscrito"
                        >
                          {isActive ? (
                            <>
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                              <span>Ativo</span>
                            </>
                          ) : (
                            <>
                              <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                              <span>Descadastrado</span>
                            </>
                          )}
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-6 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleCopySingle(sub.id, sub.email)}
                            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
                            title="Copiar e-mail"
                          >
                            {isCopied ? (
                              <Check size={15} className="text-emerald-600" />
                            ) : (
                              <Copy size={15} />
                            )}
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDelete(sub)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                            title="Excluir inscrito permanentemente"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Integration Guide Box */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-orange-50/70 to-amber-50/50 border border-orange-200/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-[#F49853] text-white flex items-center justify-center shrink-0 shadow-xs">
            <Sparkles size={20} />
          </div>
          <div>
            <h4 className="font-bold text-slate-900 text-sm">Disparos de E-mail & Campanhas</h4>
            <p className="text-xs text-slate-600 mt-0.5">
              Utilize o botão "Copiar E-mails" ou "Exportar CSV" para alimentar suas campanhas em <strong>Comunicação &gt; Disparo de E-mails</strong>.
            </p>
          </div>
        </div>
      </div>

      {/* Modal: Adicionar Novo Inscrito */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
            onClick={() => setIsAddModalOpen(false)}
          />
          <div className="relative bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl z-10 border border-slate-100">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-orange-50 border border-orange-100 flex items-center justify-center text-[#F49853]">
                  <Plus size={18} />
                </div>
                <h3 className="font-black text-slate-900 text-lg">Novo Inscrito</h3>
              </div>
              <button 
                onClick={() => setIsAddModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="pt-4 space-y-4">
              {modalError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-medium">
                  {modalError}
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Endereço de E-mail *
                </label>
                <input
                  type="email"
                  required
                  placeholder="exemplo@dominio.org"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-hidden focus:border-[#F49853] transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Origem do Contato
                </label>
                <input
                  type="text"
                  placeholder="Ex: Manual, Evento Beneficente, WhatsApp"
                  value={newSource}
                  onChange={(e) => setNewSource(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-hidden focus:border-[#F49853] transition-colors"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-slate-600 hover:text-slate-800 text-xs font-bold rounded-xl hover:bg-slate-100 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 bg-[#F49853] hover:bg-[#e0853d] text-white text-xs font-bold rounded-xl transition-all shadow-xs disabled:opacity-50"
                >
                  {isSubmitting ? 'Salvando...' : 'Cadastrar Inscrito'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
export default CommNewsletter;
