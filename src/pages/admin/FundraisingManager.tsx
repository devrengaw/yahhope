import React, { useState, useMemo } from 'react';
import { 
  Target, 
  TrendingUp, 
  DollarSign, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  Clock, 
  Check, 
  Edit2, 
  X, 
  RotateCcw, 
  Calendar, 
  Layers, 
  ExternalLink, 
  Copy, 
  AlertCircle,
  Flag,
  Sparkles,
  ArrowUp,
  ArrowDown
} from 'lucide-react';
import { useFundraising, CampaignMilestone, Campaign } from '../../contexts/FundraisingContext';
import { cn } from '../../lib/utils';
import { Link } from 'react-router-dom';

export function FundraisingManager() {
  const { 
    campaigns, 
    selectedCampaign, 
    activeCampaign, 
    allDonations, 
    donations, 
    selectCampaign, 
    createCampaign, 
    updateCampaign, 
    deleteCampaign, 
    setActiveCampaign, 
    toggleCampaignActive,
    updateCampaignPriority,
    reorderCampaigns,
    resetCampaignMonth, 
    addMilestone, 
    updateMilestone, 
    removeMilestone, 
    approveDonation,
    currentMonthName,
    calculateCampaignProgress
  } = useFundraising();

  const [activeTab, setActiveTab] = useState<'config' | 'milestones' | 'donations'>('config');
  const [isNewCampaignModalOpen, setIsNewCampaignModalOpen] = useState(false);
  const [donationFilter, setDonationFilter] = useState<'selected' | 'all'>('selected');
  const [copiedLink, setCopiedLink] = useState(false);

  // Formulário de Nova Campanha
  const [newCampTitle, setNewCampTitle] = useState('');
  const [newCampType, setNewCampType] = useState<'monthly' | 'specific'>('monthly');
  const [newCampGoal, setNewCampGoal] = useState('20000');
  const [newCampDesc, setNewCampDesc] = useState('');

  // Formulário de Edição da Campanha Selecionada
  const [campaignTitle, setCampaignTitle] = useState(selectedCampaign.title);
  const [campaignDesc, setCampaignDesc] = useState(selectedCampaign.description);
  const [campaignGoal, setCampaignGoal] = useState(selectedCampaign.target_amount.toString());
  const [campaignType, setCampaignType] = useState<'monthly' | 'specific'>(selectedCampaign.type || 'monthly');
  const [acceptPix, setAcceptPix] = useState(selectedCampaign.accept_pix ?? true);
  const [acceptCard, setAcceptCard] = useState(selectedCampaign.accept_card ?? true);
  const [campaignPriority, setCampaignPriority] = useState<number>(selectedCampaign.priority ?? 1);
  const [campaignIsActive, setCampaignIsActive] = useState<boolean>(selectedCampaign.is_active !== false);

  // Sincroniza formulário de edição quando seleciona outra campanha
  React.useEffect(() => {
    setCampaignTitle(selectedCampaign.title);
    setCampaignDesc(selectedCampaign.description);
    setCampaignGoal(selectedCampaign.target_amount.toString());
    setCampaignType(selectedCampaign.type || 'monthly');
    setAcceptPix(selectedCampaign.accept_pix ?? true);
    setAcceptCard(selectedCampaign.accept_card ?? true);
    setCampaignPriority(selectedCampaign.priority ?? 1);
    setCampaignIsActive(selectedCampaign.is_active !== false);
  }, [selectedCampaign.id, selectedCampaign.title, selectedCampaign.description, selectedCampaign.target_amount, selectedCampaign.type, selectedCampaign.accept_pix, selectedCampaign.accept_card, selectedCampaign.priority, selectedCampaign.is_active]);

  // Formulário de Milestones
  const [newMilestoneTitle, setNewMilestoneTitle] = useState('');
  const [newMilestoneTarget, setNewMilestoneTarget] = useState('');
  const [newMilestoneDesc, setNewMilestoneDesc] = useState('');
  const [editingMilestoneId, setEditingMilestoneId] = useState<string | null>(null);

  // Lista de campanhas ativas
  const activeCampaigns = useMemo(() => {
    return campaigns.filter(c => c && c.is_active !== false);
  }, [campaigns]);

  // Estatísticas calculadas
  const selectedStats = useMemo(() => {
    return calculateCampaignProgress(selectedCampaign);
  }, [calculateCampaignProgress, selectedCampaign]);

  const activeStats = useMemo(() => {
    return activeCampaign ? calculateCampaignProgress(activeCampaign) : selectedStats;
  }, [calculateCampaignProgress, activeCampaign, selectedStats]);

  // Totais combinados de todas as campanhas ativas
  const combinedStats = useMemo(() => {
    const list = activeCampaigns.length > 0 ? activeCampaigns : campaigns;
    
    // Meta global somando todas as campanhas ativas
    const totalGoal = list.reduce((sum, c) => sum + (c.target_amount || 0), 0);
    
    // Total arrecadado no momento (mensais pegam mês atual, específicas pegam total acumulado que não zera)
    const totalRaised = list.reduce((sum, c) => {
      const p = calculateCampaignProgress(c);
      return sum + p.currentAmount;
    }, 0);

    // Total arrecadado no mês atual apenas para campanhas mensais
    const totalMonthRaised = list
      .filter(c => c.type !== 'specific')
      .reduce((sum, c) => {
        const p = calculateCampaignProgress(c);
        return sum + p.currentMonthTotal;
      }, 0);

    const percentage = totalGoal > 0 ? Math.min(Math.round((totalRaised / totalGoal) * 100), 100) : 0;

    return {
      totalGoal,
      totalRaised,
      totalMonthRaised,
      percentage,
      activeCount: activeCampaigns.length,
      totalCount: campaigns.length,
      specificCount: campaigns.filter(c => c.type === 'specific').length,
      monthlyCount: campaigns.filter(c => c.type !== 'specific').length
    };
  }, [activeCampaigns, campaigns, calculateCampaignProgress]);

  const pendingDonations = useMemo(() => {
    return allDonations.filter(d => d.status === 'pending');
  }, [allDonations]);

  const handleCreateCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCampTitle || !newCampGoal) return;

    const res = await createCampaign({
      title: newCampTitle,
      description: newCampDesc,
      target_amount: parseFloat(newCampGoal),
      type: newCampType,
      accept_pix: true,
      accept_card: true
    });

    if (res.success) {
      setIsNewCampaignModalOpen(false);
      setNewCampTitle('');
      setNewCampDesc('');
      setNewCampGoal('20000');
      setNewCampType('monthly');
      alert('Campanha criada com sucesso!');
    } else {
      alert('Erro ao criar campanha: ' + (res.error?.message || 'Tente novamente.'));
    }
  };

  const handleMoveCampaign = async (index: number, direction: 'up' | 'down', e: React.MouseEvent) => {
    e.stopPropagation();
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= campaigns.length) return;
    const newOrder = [...campaigns];
    const temp = newOrder[index];
    newOrder[index] = newOrder[targetIndex];
    newOrder[targetIndex] = temp;
    await reorderCampaigns(newOrder.map(c => c.id));
  };

  const handleSaveCampaign = async () => {
    const result = await updateCampaign({
      title: campaignTitle,
      description: campaignDesc,
      target_amount: parseFloat(campaignGoal),
      type: campaignType,
      accept_pix: acceptPix,
      accept_card: acceptCard,
      priority: campaignPriority,
      is_active: campaignIsActive
    }, selectedCampaign.id);
    
    if (result && result.error) {
      alert('Erro ao salvar no banco: ' + result.error.message);
    } else {
      alert('Configurações da campanha salvas com sucesso!');
    }
  };

  const handleResetMonth = async () => {
    const confirm = window.confirm(
      `Deseja realmente zerar a régua de doações deste mês para a campanha "${selectedCampaign.title}"?\n\n` +
      `Isso fará com que o valor arrecadado no mês recomece em R$ 0,00.\n` +
      `Nenhuma doação do histórico financeiro será excluída.`
    );
    if (!confirm) return;

    const res = await resetCampaignMonth(selectedCampaign.id);
    if (res.success) {
      alert('Régua zerada com sucesso para o mês!');
    } else {
      alert('Erro ao zerar régua: ' + (res.error?.message || 'Tente novamente.'));
    }
  };

  const handleSetActive = async (id: string) => {
    await setActiveCampaign(id);
    alert('Esta campanha foi definida como a Campanha Principal no site e telão!');
  };

  const handleDeleteCampaign = async (camp: Campaign) => {
    if (campaigns.length <= 1) {
      alert('Você não pode excluir a única campanha existente.');
      return;
    }
    const confirm = window.confirm(`Tem certeza que deseja excluir a campanha "${camp.title}"?`);
    if (!confirm) return;

    const res = await deleteCampaign(camp.id);
    if (res.success) {
      alert('Campanha excluída com sucesso.');
    } else {
      alert('Erro ao excluir campanha: ' + (res.error?.message || 'Erro desconhecido.'));
    }
  };

  const handleAddOrEditMilestone = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMilestoneTitle || !newMilestoneTarget) return;

    if (editingMilestoneId) {
      await updateMilestone(editingMilestoneId, {
        title: newMilestoneTitle,
        target_amount: parseFloat(newMilestoneTarget),
        description: newMilestoneDesc
      });
      setEditingMilestoneId(null);
    } else {
      await addMilestone({
        title: newMilestoneTitle,
        target_amount: parseFloat(newMilestoneTarget),
        description: newMilestoneDesc
      }, selectedCampaign.id);
    }

    setNewMilestoneTitle('');
    setNewMilestoneTarget('');
    setNewMilestoneDesc('');
  };

  const startEditMilestone = (m: CampaignMilestone) => {
    setEditingMilestoneId(m.id);
    setNewMilestoneTitle(m.title);
    setNewMilestoneTarget(m.target_amount.toString());
    setNewMilestoneDesc(m.description);
  };

  const cancelEditMilestone = () => {
    setEditingMilestoneId(null);
    setNewMilestoneTitle('');
    setNewMilestoneTarget('');
    setNewMilestoneDesc('');
  };

  const copyCampaignLink = () => {
    const url = `${window.location.origin}/campanha?id=${selectedCampaign.id}`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const displayedDonations = donationFilter === 'selected' ? donations : allDonations;

  return (
    <div className="space-y-8 pb-16">
      {/* Header & Metrics */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full">
              Captação & Doações
            </span>
            <span className="text-xs font-bold text-slate-400">
              • {currentMonthName}
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">Régua de Doações & Campanhas</h1>
          <p className="text-slate-500 font-medium">Controle metas mensais recorrentes com zeramento automático ou crie campanhas específicas.</p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to={`/campanha?id=${selectedCampaign.id}`}
            target="_blank"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 bg-white font-bold text-sm text-slate-700 hover:bg-slate-50 transition-colors shadow-sm"
          >
            <ExternalLink size={16} /> Ver Página Pública
          </Link>
          <Link
            to={`/campanha-display?id=${selectedCampaign.id}`}
            target="_blank"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 font-bold text-sm text-white hover:bg-slate-800 transition-colors shadow-sm"
          >
            <Sparkles size={16} className="text-amber-400" /> Telão / Display
          </Link>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Arrecadado */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-center text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">
              {combinedStats.activeCount > 1 ? 'Total Arrecadado' : 'Arrecadado no Mês'}
            </span>
            <Calendar size={18} className="text-emerald-500" />
          </div>
          <div>
            <p className="text-2xl font-black text-slate-900">
              R$ {combinedStats.totalRaised.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
            <p className="text-xs text-slate-500 mt-1">
              {combinedStats.activeCount > 1 
                ? `${combinedStats.activeCount} campanhas ativas (R$ ${combinedStats.totalMonthRaised.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} neste mês)`
                : `Campanha Ativa: ${activeCampaign?.title || selectedCampaign.title}`
              }
            </p>
          </div>
        </div>

        {/* Card 2: Metas & Evolução Total */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-center text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">
              {combinedStats.activeCount > 1 ? 'Metas & Evolução Total' : 'Meta & Evolução'}
            </span>
            <Target size={18} className="text-blue-500" />
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-slate-900">{combinedStats.percentage}%</span>
              <span className="text-xs text-slate-400">
                de R$ {combinedStats.totalGoal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="w-full bg-slate-100 h-2 rounded-full mt-2 overflow-hidden">
              <div 
                className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${combinedStats.percentage}%` }}
              />
            </div>
            {combinedStats.activeCount > 1 && (
              <p className="text-[11px] text-slate-400 mt-1.5">
                Total conjunto de {combinedStats.activeCount} campanhas ativas
              </p>
            )}
          </div>
        </div>

        {/* Card 3: Campanhas Criadas / Ativas */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-center text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Campanhas Criadas</span>
            <Layers size={18} className="text-purple-500" />
          </div>
          <div>
            <p className="text-2xl font-black text-slate-900">{campaigns.length}</p>
            <p className="text-xs text-slate-500 mt-1">
              <span className="font-bold text-emerald-700">{combinedStats.activeCount} ativas</span> • {combinedStats.specificCount} específicas, {combinedStats.monthlyCount} mensais
            </p>
          </div>
        </div>

        {/* Card 4: Doações Pendentes */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-center text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Doações Pendentes</span>
            <Clock size={18} className="text-amber-500" />
          </div>
          <div>
            <p className="text-2xl font-black text-amber-600">{pendingDonations.length}</p>
            <p className="text-xs text-slate-500 mt-1">Aguardando confirmação manual</p>
          </div>
        </div>
      </div>

      {/* Campaigns Selector Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-2">
            <Flag size={20} className="text-emerald-500" />
            <h2 className="text-base font-black text-slate-900">Selecione a Campanha para Gerenciar</h2>
          </div>
          <button
            onClick={() => setIsNewCampaignModalOpen(true)}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl transition-colors shadow-sm"
          >
            <Plus size={16} /> Nova Campanha
          </button>
        </div>

        {/* Campaign Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {campaigns.map((camp, idx) => {
            const isSelected = camp.id === selectedCampaign.id;
            const stats = calculateCampaignProgress(camp);
            const isMonthly = camp.type !== 'specific';

            return (
              <div
                key={camp.id}
                onClick={() => selectCampaign(camp.id)}
                className={cn(
                  "p-4 rounded-xl border transition-all cursor-pointer relative flex flex-col justify-between",
                  isSelected 
                    ? "border-emerald-500 bg-emerald-50/40 shadow-sm ring-2 ring-emerald-500/20" 
                    : "border-slate-200 bg-white hover:border-slate-300 hover:shadow-xs"
                )}
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-1.5">
                      <span className={cn(
                        "text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full flex items-center gap-1",
                        isMonthly ? "bg-blue-100 text-blue-800" : "bg-purple-100 text-purple-800"
                      )}>
                        {isMonthly ? <Calendar size={10} /> : <Target size={10} />}
                        {isMonthly ? 'Meta Mensal' : 'Específica'}
                      </span>
                      <span className="text-[10px] font-black bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full">
                        #{camp.priority ?? (idx + 1)}
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      {/* Botões de Mover Prioridade */}
                      <button
                        type="button"
                        disabled={idx === 0}
                        onClick={(e) => handleMoveCampaign(idx, 'up', e)}
                        className="p-1 rounded bg-slate-100 hover:bg-slate-200 disabled:opacity-30 disabled:pointer-events-none text-slate-600 transition-colors"
                        title="Aumentar prioridade"
                      >
                        <ArrowUp size={12} />
                      </button>
                      <button
                        type="button"
                        disabled={idx === campaigns.length - 1}
                        onClick={(e) => handleMoveCampaign(idx, 'down', e)}
                        className="p-1 rounded bg-slate-100 hover:bg-slate-200 disabled:opacity-30 disabled:pointer-events-none text-slate-600 transition-colors"
                        title="Diminuir prioridade"
                      >
                        <ArrowDown size={12} />
                      </button>

                      {/* Botão de Toggle Ativa / Inativa */}
                      <button
                        type="button"
                        onClick={async (e) => {
                          e.stopPropagation();
                          await toggleCampaignActive(camp.id);
                        }}
                        className={cn(
                          "text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full transition-colors",
                          camp.is_active !== false 
                            ? "bg-emerald-500 text-white" 
                            : "bg-slate-200 text-slate-600 hover:bg-slate-300"
                        )}
                        title={camp.is_active !== false ? "Clique para desativar esta campanha" : "Clique para ativar esta campanha"}
                      >
                        {camp.is_active !== false ? "✓ Ativa" : "Inativa"}
                      </button>
                    </div>
                  </div>

                  <h3 className="font-bold text-slate-900 text-sm line-clamp-1">{camp.title}</h3>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-1">
                    {camp.description || 'Sem descrição adicional.'}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100">
                  <div className="flex justify-between items-baseline text-xs mb-1.5">
                    <span className="font-bold text-slate-700">
                      R$ {stats.currentAmount.toLocaleString('pt-BR')}
                    </span>
                    <span className="text-slate-400 font-medium">
                      Meta: R$ {stats.targetAmount.toLocaleString('pt-BR')} ({stats.percentage}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                    <div 
                      className="bg-emerald-500 h-full rounded-full"
                      style={{ width: `${stats.percentage}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Selected Campaign Management Box */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        {/* Banner Informando o Modo da Campanha Selecionada */}
        <div className={cn(
          "px-6 py-4 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-4",
          selectedCampaign.type === 'specific' 
            ? "bg-purple-50/60 border-purple-100 text-purple-900" 
            : "bg-blue-50/60 border-blue-100 text-blue-900"
        )}>
          <div className="flex items-center gap-3">
            <div className={cn(
              "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 font-bold",
              selectedCampaign.type === 'specific' ? "bg-purple-200 text-purple-800" : "bg-blue-200 text-blue-800"
            )}>
              {selectedCampaign.type === 'specific' ? <Target size={20} /> : <Calendar size={20} />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-sm uppercase tracking-wide">
                  {selectedCampaign.type === 'specific' ? 'Campanha Específica' : `Meta Mensal (${currentMonthName})`}
                </span>
                {selectedCampaign.is_active ? (
                  <span className="bg-emerald-100 text-emerald-800 text-[10px] font-black px-2 py-0.5 rounded-full">
                    Ativa no Site
                  </span>
                ) : (
                  <button
                    onClick={() => handleSetActive(selectedCampaign.id)}
                    className="text-[11px] font-bold text-slate-500 hover:text-emerald-700 underline"
                  >
                    Tornar Ativa no Site
                  </button>
                )}
              </div>
              <p className="text-xs text-slate-600 mt-0.5">
                {selectedCampaign.type === 'specific'
                  ? 'Esta campanha acumula todo o valor arrecadado permanentemente para esta meta e NÃO zera ao virar o mês.'
                  : 'Esta régua zera automaticamente todo dia 1º de mês, mostrando a arrecadação do mês corrente.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {selectedCampaign.type !== 'specific' && (
              <button
                onClick={handleResetMonth}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-blue-200 hover:bg-blue-50 text-blue-800 rounded-lg text-xs font-bold transition-colors shadow-xs"
                title="Zerar a régua de arrecadação deste mês"
              >
                <RotateCcw size={14} /> Zerar Régua do Mês
              </button>
            )}

            <button
              onClick={copyCampaignLink}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-bold transition-colors shadow-xs"
              title="Copiar link direto para esta campanha"
            >
              {copiedLink ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
              {copiedLink ? 'Link Copiado!' : 'Copiar Link'}
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-100 px-4">
          <button
            onClick={() => setActiveTab('config')}
            className={cn(
              "px-5 py-4 font-bold text-sm border-b-2 transition-colors flex items-center gap-2",
              activeTab === 'config' ? "border-emerald-500 text-emerald-600" : "border-transparent text-slate-500 hover:text-slate-900"
            )}
          >
            <Target size={16} /> Configurações da Campanha
          </button>
          <button
            onClick={() => setActiveTab('milestones')}
            className={cn(
              "px-5 py-4 font-bold text-sm border-b-2 transition-colors flex items-center gap-2",
              activeTab === 'milestones' ? "border-emerald-500 text-emerald-600" : "border-transparent text-slate-500 hover:text-slate-900"
            )}
          >
            <TrendingUp size={16} /> Estágios da Régua ({selectedCampaign.milestones?.length || 0})
          </button>
          <button
            onClick={() => setActiveTab('donations')}
            className={cn(
              "px-5 py-4 font-bold text-sm border-b-2 transition-colors flex items-center gap-2",
              activeTab === 'donations' ? "border-emerald-500 text-emerald-600" : "border-transparent text-slate-500 hover:text-slate-900"
            )}
          >
            <DollarSign size={16} /> Doações Recebidas
            {pendingDonations.length > 0 && (
              <span className="bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full text-[10px] font-black">
                {pendingDonations.length} pendentes
              </span>
            )}
          </button>
        </div>

        {/* Tab 1: Config */}
        {activeTab === 'config' && (
          <div className="p-6">
            <div className="max-w-3xl space-y-6">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Título da Campanha</label>
                <input 
                  type="text" 
                  value={campaignTitle}
                  onChange={e => setCampaignTitle(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-emerald-500 text-slate-900 font-medium"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Tipo da Campanha</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <label 
                    onClick={() => setCampaignType('monthly')}
                    className={cn(
                      "p-4 rounded-xl border-2 cursor-pointer flex flex-col justify-between transition-all",
                      campaignType === 'monthly' ? "border-blue-500 bg-blue-50/30" : "border-slate-200 hover:border-slate-300"
                    )}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-black text-sm text-slate-900 flex items-center gap-2">
                        <Calendar size={16} className="text-blue-500" /> Meta Mensal Recorrente
                      </span>
                      <input 
                        type="radio" 
                        name="campaign_type" 
                        checked={campaignType === 'monthly'} 
                        onChange={() => setCampaignType('monthly')}
                        className="text-blue-600 focus:ring-blue-500" 
                      />
                    </div>
                    <p className="text-xs text-slate-500">
                      Zera todo dia 1º de mês automaticamente. A régua calcula apenas as doações do mês atual.
                    </p>
                  </label>

                  <label 
                    onClick={() => setCampaignType('specific')}
                    className={cn(
                      "p-4 rounded-xl border-2 cursor-pointer flex flex-col justify-between transition-all",
                      campaignType === 'specific' ? "border-purple-500 bg-purple-50/30" : "border-slate-200 hover:border-slate-300"
                    )}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-black text-sm text-slate-900 flex items-center gap-2">
                        <Target size={16} className="text-purple-500" /> Campanha Específica
                      </span>
                      <input 
                        type="radio" 
                        name="campaign_type" 
                        checked={campaignType === 'specific'} 
                        onChange={() => setCampaignType('specific')}
                        className="text-purple-600 focus:ring-purple-500" 
                      />
                    </div>
                    <p className="text-xs text-slate-500">
                      Acumula o total arrecadado até atingir 100% da meta. Barra de evolução contínua para projetos pontuais.
                    </p>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Descrição Curta</label>
                <textarea 
                  value={campaignDesc}
                  onChange={e => setCampaignDesc(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-emerald-500 text-slate-900 h-24 font-normal"
                  placeholder="Explique o propósito desta campanha..."
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Meta Global de Arrecadação (R$)</label>
                <div className="relative">
                  <span className="absolute left-4 top-3 text-slate-400 font-bold text-lg">R$</span>
                  <input 
                    type="number" 
                    value={campaignGoal}
                    onChange={e => setCampaignGoal(e.target.value)}
                    className="w-full pl-12 pr-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-emerald-500 font-black text-xl text-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">
                    Ordem de Prioridade (Telão / Régua)
                  </label>
                  <input 
                    type="number" 
                    min="1"
                    value={campaignPriority}
                    onChange={e => setCampaignPriority(parseInt(e.target.value, 10) || 1)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-emerald-500 font-black text-slate-900"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    Define a posição na régua geral de arrecadação do telão.
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">
                    Visibilidade Pública
                  </label>
                  <label className="flex items-center gap-2.5 p-3 rounded-xl border border-slate-200 cursor-pointer hover:bg-slate-50 transition-colors">
                    <input 
                      type="checkbox" 
                      checked={campaignIsActive}
                      onChange={(e) => setCampaignIsActive(e.target.checked)}
                      className="w-5 h-5 rounded border-slate-300 text-emerald-500 focus:ring-emerald-500"
                    />
                    <div>
                      <span className="text-sm font-bold text-slate-800 block">Campanha Ativa</span>
                      <span className="text-[11px] text-slate-500">Exibida na página pública e no telão</span>
                    </div>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Métodos de Pagamento Permitidos</label>
                <div className="flex gap-6">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={acceptPix}
                      onChange={(e) => setAcceptPix(e.target.checked)}
                      className="w-5 h-5 rounded border-slate-300 text-emerald-500 focus:ring-emerald-500"
                    />
                    <span className="text-sm font-medium text-slate-700">PIX</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={acceptCard}
                      onChange={(e) => setAcceptCard(e.target.checked)}
                      className="w-5 h-5 rounded border-slate-300 text-emerald-500 focus:ring-emerald-500"
                    />
                    <span className="text-sm font-medium text-slate-700">Cartão de Crédito</span>
                  </label>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
                <button 
                  onClick={handleSaveCampaign}
                  className="bg-slate-900 text-white px-8 py-3 rounded-xl font-bold hover:bg-slate-800 transition-colors shadow-sm w-full sm:w-auto"
                >
                  Salvar Alterações
                </button>

                <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                  {!selectedCampaign.is_active && (
                    <button
                      onClick={() => handleSetActive(selectedCampaign.id)}
                      className="px-4 py-2.5 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-xl transition-colors border border-emerald-200"
                    >
                      ★ Definir como Principal no Site
                    </button>
                  )}

                  {campaigns.length > 1 && (
                    <button
                      onClick={() => handleDeleteCampaign(selectedCampaign)}
                      className="px-4 py-2.5 text-xs font-bold text-red-600 hover:text-red-700 hover:bg-red-50 rounded-xl transition-colors"
                    >
                      Excluir Campanha
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Milestones */}
        {activeTab === 'milestones' && (
          <div className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Form de Milestones */}
              <div className="space-y-4">
                <div>
                  <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                    <TrendingUp size={18} className="text-emerald-500" />
                    {editingMilestoneId ? 'Editar Estágio' : 'Adicionar Novo Estágio na Régua'}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Cada estágio representa um marco visível na barra de evolução (ex: R$ 5.000 para Aluguel, R$ 10.000 para Alimentação).
                  </p>
                </div>

                <form onSubmit={handleAddOrEditMilestone} className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1">Valor do Estágio (R$)</label>
                      <input 
                        type="number" required
                        value={newMilestoneTarget} onChange={e => setNewMilestoneTarget(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-900 font-bold" 
                        placeholder="Ex: 5000"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1">Título do Estágio</label>
                      <input 
                        type="text" required
                        value={newMilestoneTitle} onChange={e => setNewMilestoneTitle(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-900" 
                        placeholder="Ex: 50 Cestas Básicas"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">Descrição do Impacto</label>
                    <input 
                      type="text" 
                      value={newMilestoneDesc} onChange={e => setNewMilestoneDesc(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-900" 
                      placeholder="Ex: Garante a compra de suplementação e cestas para todas as famílias cadastradas."
                    />
                  </div>

                  <div className="flex gap-2 pt-1">
                    <button 
                      type="submit" 
                      className="flex-1 bg-emerald-600 text-white font-bold py-2.5 rounded-xl flex items-center justify-center gap-2 hover:bg-emerald-700 transition-colors shadow-sm"
                    >
                      {editingMilestoneId ? <Edit2 size={16} /> : <Plus size={16} />} 
                      {editingMilestoneId ? 'Salvar Alterações' : 'Adicionar Estágio'}
                    </button>
                    {editingMilestoneId && (
                      <button 
                        type="button" 
                        onClick={cancelEditMilestone} 
                        className="px-4 bg-slate-200 text-slate-700 font-bold rounded-xl flex items-center justify-center hover:bg-slate-300 transition-colors"
                      >
                        <X size={16} />
                      </button>
                    )}
                  </div>
                </form>
              </div>

              {/* Lista dos Milestones */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-black text-slate-900">
                    Estágios Cadastrados ({selectedCampaign.milestones?.length || 0})
                  </h3>
                  <span className="text-xs text-slate-500">
                    Arrecadado: <strong className="text-emerald-600">R$ {selectedStats.currentAmount.toLocaleString('pt-BR')}</strong>
                  </span>
                </div>

                {(!selectedCampaign.milestones || selectedCampaign.milestones.length === 0) ? (
                  <div className="p-8 text-center border-2 border-dashed border-slate-200 rounded-2xl text-slate-400">
                    <TrendingUp size={32} className="mx-auto mb-2 opacity-30" />
                    <p className="text-sm font-medium">Nenhum estágio adicionado ainda para esta campanha.</p>
                    <p className="text-xs mt-1">Use o formulário ao lado para adicionar os marcos da régua.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {selectedCampaign.milestones.map((m, idx) => {
                      const isReached = selectedStats.currentAmount >= m.target_amount;
                      return (
                        <div 
                          key={m.id} 
                          className={cn(
                            "flex items-center justify-between p-4 rounded-xl border transition-all",
                            isReached ? "bg-emerald-50/50 border-emerald-200" : "bg-white border-slate-200"
                          )}
                        >
                          <div className="flex items-center gap-3">
                            <div className={cn(
                              "w-8 h-8 rounded-full flex items-center justify-center font-black text-xs shrink-0",
                              isReached ? "bg-emerald-500 text-white" : "bg-slate-100 text-slate-600"
                            )}>
                              {isReached ? <CheckCircle2 size={16} /> : idx + 1}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="font-bold text-slate-900 text-sm">{m.title}</p>
                                <span className={cn(
                                  "text-[10px] font-black uppercase px-2 py-0.5 rounded-full",
                                  isReached ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-600"
                                )}>
                                  R$ {m.target_amount.toLocaleString('pt-BR')}
                                </span>
                              </div>
                              {m.description && (
                                <p className="text-xs text-slate-500 mt-0.5">{m.description}</p>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-1">
                            <button 
                              onClick={() => startEditMilestone(m)} 
                              className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                              title="Editar"
                            >
                              <Edit2 size={16} />
                            </button>
                            <button 
                              onClick={() => removeMilestone(m.id)} 
                              className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Remover"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Donations */}
        {activeTab === 'donations' && (
          <div className="p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setDonationFilter('selected')}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-xs font-bold transition-colors",
                    donationFilter === 'selected' ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  )}
                >
                  Desta Campanha ({donations.length})
                </button>
                <button
                  onClick={() => setDonationFilter('all')}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-xs font-bold transition-colors",
                    donationFilter === 'all' ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  )}
                >
                  Todas as Doações ({allDonations.length})
                </button>
              </div>

              <div className="text-xs text-slate-500 font-medium">
                Total nesta lista: <strong className="text-slate-900 font-black">
                  R$ {displayedDonations
                    .filter(d => d.status === 'paid')
                    .reduce((acc, d) => acc + d.amount, 0)
                    .toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </strong>
              </div>
            </div>

            {displayedDonations.length === 0 ? (
              <div className="text-center p-12 text-slate-400 border border-dashed rounded-2xl">
                <DollarSign size={48} className="mx-auto mb-4 opacity-20" />
                <p className="font-bold text-slate-600">Nenhuma doação registrada nesta visualização.</p>
                <p className="text-xs text-slate-400 mt-1">As doações realizadas via PIX ou Cartão aparecerão listadas aqui.</p>
              </div>
            ) : (
              <div className="overflow-x-auto border border-slate-100 rounded-xl">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/70 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                      <th className="p-4">Doador</th>
                      <th className="p-4">Valor</th>
                      <th className="p-4">Método</th>
                      <th className="p-4">Data</th>
                      <th className="p-4">Status</th>
                      <th className="p-4 text-right">Ação</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {displayedDonations.map(d => (
                      <tr key={d.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="p-4">
                          <p className="font-bold text-sm text-slate-900">{d.donor_name}</p>
                          <p className="text-xs text-slate-500">{d.donor_email || 'E-mail não informado'}</p>
                        </td>
                        <td className="p-4 font-black text-slate-900">
                          R$ {d.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="p-4">
                          <span className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded-md font-bold uppercase tracking-wider">
                            {d.payment_method}
                          </span>
                        </td>
                        <td className="p-4 text-xs text-slate-500">
                          {new Date(d.date).toLocaleDateString('pt-BR')}
                        </td>
                        <td className="p-4">
                          {d.status === 'paid' ? (
                            <span className="inline-flex items-center gap-1 text-xs text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full font-bold">
                              <CheckCircle2 size={12} /> Pago
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-xs text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full font-bold">
                              <Clock size={12} /> Pendente
                            </span>
                          )}
                        </td>
                        <td className="p-4 text-right">
                          {d.status === 'pending' && (
                            <button 
                              onClick={() => approveDonation(d.id)}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg transition-colors inline-flex items-center gap-1 text-xs font-bold shadow-xs"
                              title="Aprovar Pagamento Manualmente"
                            >
                              <Check size={14} /> Aprovar
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal: Nova Campanha */}
      {isNewCampaignModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-5">
              <div className="flex items-center gap-2">
                <Flag size={20} className="text-emerald-500" />
                <h3 className="text-lg font-black text-slate-900">Criar Nova Campanha</h3>
              </div>
              <button 
                onClick={() => setIsNewCampaignModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateCampaign} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Título da Campanha</label>
                <input 
                  type="text" required
                  value={newCampTitle} onChange={e => setNewCampTitle(e.target.value)}
                  placeholder="Ex: Reforma do Refeitório Infantil"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-emerald-500 text-sm font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Tipo da Campanha</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setNewCampType('monthly')}
                    className={cn(
                      "p-3 rounded-xl border text-left transition-all",
                      newCampType === 'monthly' ? "border-blue-500 bg-blue-50/50 text-blue-900" : "border-slate-200 text-slate-600 hover:border-slate-300"
                    )}
                  >
                    <p className="font-black text-xs flex items-center gap-1.5">
                      <Calendar size={14} className="text-blue-500" /> Meta Mensal
                    </p>
                    <p className="text-[10px] text-slate-500 mt-1">Zera todo mês automaticamente</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setNewCampType('specific')}
                    className={cn(
                      "p-3 rounded-xl border text-left transition-all",
                      newCampType === 'specific' ? "border-purple-500 bg-purple-50/50 text-purple-900" : "border-slate-200 text-slate-600 hover:border-slate-300"
                    )}
                  >
                    <p className="font-black text-xs flex items-center gap-1.5">
                      <Target size={14} className="text-purple-500" /> Específica
                    </p>
                    <p className="text-[10px] text-slate-500 mt-1">Barra contínua para projeto pontual</p>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Meta de Arrecadação (R$)</label>
                <input 
                  type="number" required
                  value={newCampGoal} onChange={e => setNewCampGoal(e.target.value)}
                  placeholder="20000"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-emerald-500 text-sm font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Descrição</label>
                <textarea 
                  value={newCampDesc} onChange={e => setNewCampDesc(e.target.value)}
                  placeholder="Descreva o propósito da campanha..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-emerald-500 text-sm h-20"
                />
              </div>

              <div className="pt-3 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsNewCampaignModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold text-sm hover:bg-slate-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm transition-colors shadow-sm"
                >
                  Criar Campanha
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
