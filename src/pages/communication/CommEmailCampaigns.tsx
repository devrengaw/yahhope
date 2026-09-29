import React, { useState, useEffect } from 'react';
import { 
  Send, Mail, Users, CheckCircle2, AlertCircle, Plus, Eye, BarChart3, 
  ArrowRight, Search, Filter, RefreshCw, Copy, Trash2, ExternalLink, 
  Clock, Check, MousePointer, Smartphone, Monitor, ChevronRight, X, Sparkles,
  FileText, Upload, UserCheck, ShieldCheck, Heart, UserPlus, HelpCircle
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { cn } from '../../lib/utils';
import { RichTextEditor } from '../../components/admin/communication/RichTextEditor';
import { 
  emailCampaignService, 
  EmailCampaign, 
  CampaignRecipient, 
  AudienceStats 
} from '../../services/emailCampaignService';

export function CommEmailCampaigns() {
  const { user } = useAuth();

  // Estados principais
  const [campaigns, setCampaigns] = useState<EmailCampaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'sent' | 'draft'>('all');

  // Audiência e estatísticas disponíveis no sistema
  const [audienceStats, setAudienceStats] = useState<AudienceStats>({
    supporters: 0,
    donors: 0,
    volunteers: 0,
    caregivers: 0
  });

  // Configurações globais de e-mail (logo e cor primária)
  const [brandSettings, setBrandSettings] = useState({
    logoUrl: 'https://yahhope.com/Logo+icone.png',
    primaryColor: '#F49853'
  });

  // Modal de Criação / Edição de Campanha (Wizard Mailchimp)
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [wizardStep, setWizardStep] = useState<1 | 2 | 3>(1);

  // Estados do Formulário da Campanha
  const [campaignTitle, setCampaignTitle] = useState('');
  const [campaignSubject, setCampaignSubject] = useState('');
  const [campaignPreheader, setCampaignPreheader] = useState('');
  const [campaignHeading, setCampaignHeading] = useState('');
  const [campaignBody, setCampaignBody] = useState('<p>Olá <strong>{{nome}}</strong>,</p><p><br></p><p>Temos uma novidade especial para compartilhar com você!</p>');
  const [senderName, setSenderName] = useState('YAH Hope');
  const [senderEmail, setSenderEmail] = useState('contato@yahhope.com');
  const [replyTo, setReplyTo] = useState('');
  const [hasCta, setHasCta] = useState(true);
  const [ctaText, setCtaText] = useState('Acessar Agora');
  const [ctaUrl, setCtaUrl] = useState('https://yahhope.com');

  // Audiência selecionada no Wizard
  const [selectedSegments, setSelectedSegments] = useState<string[]>(['apoiadores']);
  const [rawExternalEmails, setRawExternalEmails] = useState('');
  const [resolvedRecipients, setResolvedRecipients] = useState<Array<{ email: string; name: string; recipient_type: CampaignRecipient['recipient_type'] }>>([]);
  const [isResolvingAudience, setIsResolvingAudience] = useState(false);
  const [audienceSearch, setAudienceSearch] = useState('');

  // Templates disponíveis para importação rápida
  const [savedTemplates, setSavedTemplates] = useState<any[]>([]);

  // Disparo de Teste e Disparo Oficial
  const [testEmailAddress, setTestEmailAddress] = useState(user?.email || '');
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [testSendSuccess, setTestSendSuccess] = useState(false);
  const [isDispatching, setIsDispatching] = useState(false);
  const [dispatchProgress, setDispatchProgress] = useState<{ current: number; total: number } | null>(null);

  // Modal de Analytics / Relatório de Leituras
  const [selectedCampaignForAnalytics, setSelectedCampaignForAnalytics] = useState<EmailCampaign | null>(null);
  const [analyticsRecipients, setAnalyticsRecipients] = useState<CampaignRecipient[]>([]);
  const [analyticsFilter, setAnalyticsFilter] = useState<'all' | 'opened' | 'clicked' | 'not_opened' | 'failed'>('all');
  const [analyticsSearch, setAnalyticsSearch] = useState('');
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);

  // Pré-visualização Desktop vs Mobile
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'mobile'>('desktop');

  // Inicialização
  useEffect(() => {
    loadData();
  }, []);

  // Recalcula destinatários quando segmentos ou e-mails externos mudam
  useEffect(() => {
    if (isWizardOpen) {
      resolveAudienceList();
    }
  }, [selectedSegments, rawExternalEmails, isWizardOpen]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [camps, counts, settingsRes, templatesRes] = await Promise.all([
        emailCampaignService.fetchCampaigns(),
        emailCampaignService.fetchAudienceCounts(),
        supabase.from('email_settings').select('*').limit(1).maybeSingle(),
        supabase.from('email_templates').select('*')
      ]);

      setCampaigns(camps);
      setAudienceStats(counts);

      if (settingsRes.data) {
        setBrandSettings({
          logoUrl: settingsRes.data.logo_url || 'https://yahhope.com/Logo+icone.png',
          primaryColor: settingsRes.data.primary_color || '#F49853'
        });
      }

      if (templatesRes.data) {
        setSavedTemplates(templatesRes.data);
      }
    } catch (e) {
      console.error('Erro ao carregar dados:', e);
    } finally {
      setLoading(false);
    }
  };

  const resolveAudienceList = async () => {
    setIsResolvingAudience(true);
    try {
      const list = await emailCampaignService.resolveRecipients(selectedSegments, rawExternalEmails);
      setResolvedRecipients(list);
    } finally {
      setIsResolvingAudience(false);
    }
  };

  // Abre wizard para nova campanha
  const handleOpenNewCampaign = () => {
    setCampaignTitle('');
    setCampaignSubject('');
    setCampaignPreheader('');
    setCampaignHeading('');
    setCampaignBody('<p>Olá <strong>{{nome}}</strong>,</p><p><br></p><p>Escreva aqui sua mensagem para os apoiadores e comunidade...</p>');
    setSenderName('YAH Hope');
    setSenderEmail('contato@yahhope.com');
    setReplyTo('');
    setHasCta(false);
    setCtaText('Saiba Mais');
    setCtaUrl('https://yahhope.com');
    setSelectedSegments(['apoiadores']);
    setRawExternalEmails('');
    setWizardStep(1);
    setTestSendSuccess(false);
    setIsWizardOpen(true);
  };

  // Importar conteúdo de um template existente
  const handleApplyTemplate = (templateName: string) => {
    const t = savedTemplates.find(item => item.name === templateName);
    if (t) {
      setCampaignSubject(t.subject || '');
      setCampaignPreheader(t.preheader || '');
      setCampaignHeading(t.heading || '');
      setCampaignBody(t.body || '');
      setHasCta(t.has_cta ?? true);
      setCtaText(t.cta_text || 'Acessar');
      setCtaUrl(t.cta_url || 'https://yahhope.com');
      if (!campaignTitle) {
        setCampaignTitle(`Campanha - ${t.subject || 'Modelo'}`);
      }
    }
  };

  // Lidar com upload de arquivo de e-mails (TXT ou CSV)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        setRawExternalEmails(prev => prev ? `${prev}\n${content}` : content);
      }
    };
    reader.readAsText(file);
  };

  // Salvar como rascunho
  const handleSaveDraft = async () => {
    if (!campaignTitle.trim()) {
      alert('Por favor, informe um título interno para identificar a campanha.');
      return;
    }

    try {
      const summary = `${selectedSegments.length > 0 ? selectedSegments.join(', ') : 'Avulsos'} (${resolvedRecipients.length} destinatários)`;
      await emailCampaignService.createCampaign({
        title: campaignTitle,
        subject: campaignSubject || 'Sem assunto',
        preheader: campaignPreheader,
        heading: campaignHeading,
        body_html: campaignBody,
        sender_name: senderName,
        sender_email: senderEmail,
        reply_to: replyTo,
        audience_type: selectedSegments.length > 0 ? (rawExternalEmails ? 'mixed' : selectedSegments[0]) : 'custom',
        audience_summary: summary,
        has_cta: hasCta,
        cta_text: ctaText,
        cta_url: ctaUrl,
        status: 'draft'
      }, resolvedRecipients);

      await loadData();
      setIsWizardOpen(false);
    } catch (e: any) {
      alert('Erro ao salvar rascunho: ' + e.message);
    }
  };

  // Disparo de teste
  const handleSendTest = async () => {
    if (!testEmailAddress || !testEmailAddress.includes('@')) {
      alert('Informe um endereço de e-mail válido para o teste.');
      return;
    }

    setIsSendingTest(true);
    setTestSendSuccess(false);

    try {
      // Cria temporariamente ou pega o template
      const tempCamp = await emailCampaignService.createCampaign({
        title: `[TESTE] ${campaignTitle || 'Campanha de Teste'}`,
        subject: campaignSubject || 'E-mail de Teste YAH Hope',
        preheader: campaignPreheader,
        heading: campaignHeading,
        body_html: campaignBody,
        sender_name: senderName,
        sender_email: senderEmail,
        has_cta: hasCta,
        cta_text: ctaText,
        cta_url: ctaUrl,
        status: 'draft'
      }, [{ email: testEmailAddress, name: 'Usuário Teste', recipient_type: 'external' }]);

      await emailCampaignService.sendTestEmail(tempCamp.id, testEmailAddress);
      setTestSendSuccess(true);
      setTimeout(() => setTestSendSuccess(false), 5000);
    } catch (e: any) {
      alert('Erro ao disparar teste: ' + e.message);
    } finally {
      setIsSendingTest(false);
    }
  };

  // Disparar campanha oficial em massa
  const handleConfirmDispatch = async () => {
    if (resolvedRecipients.length === 0) {
      alert('Você precisa selecionar pelo menos 1 destinatário válido para enviar.');
      return;
    }
    if (!campaignSubject.trim()) {
      alert('O assunto do e-mail não pode ficar em branco.');
      return;
    }

    const confirmSend = window.confirm(
      `Confirmar envio da campanha para ${resolvedRecipients.length} destinatários agora?\n\nEsta ação irá disparar os e-mails e ativar o rastreamento de leitura.`
    );
    if (!confirmSend) return;

    setIsDispatching(true);
    setDispatchProgress({ current: 0, total: resolvedRecipients.length });

    try {
      const summary = `${selectedSegments.length > 0 ? selectedSegments.join(', ') : 'Avulsos'} (${resolvedRecipients.length} destinatários)`;
      const created = await emailCampaignService.createCampaign({
        title: campaignTitle || campaignSubject,
        subject: campaignSubject,
        preheader: campaignPreheader,
        heading: campaignHeading,
        body_html: campaignBody,
        sender_name: senderName,
        sender_email: senderEmail,
        reply_to: replyTo,
        audience_type: selectedSegments.length > 0 ? (rawExternalEmails ? 'mixed' : selectedSegments[0]) : 'custom',
        audience_summary: summary,
        has_cta: hasCta,
        cta_text: ctaText,
        cta_url: ctaUrl,
        status: 'sending'
      }, resolvedRecipients);

      // Dispara os envios
      await emailCampaignService.dispatchCampaign(created.id);

      await loadData();
      setIsWizardOpen(false);
      alert(`Campanha disparada com sucesso para ${resolvedRecipients.length} destinatários! O rastreamento de leituras já está ativo.`);
    } catch (e: any) {
      alert('Erro durante o envio: ' + e.message);
    } finally {
      setIsDispatching(false);
      setDispatchProgress(null);
    }
  };

  // Abrir Modal de Analytics de uma Campanha
  const handleOpenAnalytics = async (camp: EmailCampaign) => {
    setSelectedCampaignForAnalytics(camp);
    setLoadingAnalytics(true);
    setAnalyticsFilter('all');
    setAnalyticsSearch('');

    try {
      const recs = await emailCampaignService.fetchCampaignRecipients(camp.id);
      setAnalyticsRecipients(recs);
    } catch (e) {
      console.error('Erro ao carregar métricas:', e);
    } finally {
      setLoadingAnalytics(false);
    }
  };

  // Simular interação para testar feedback imediato
  const handleSimulateInteraction = async (recipientId: string, type: 'open' | 'click') => {
    await emailCampaignService.simulateInteraction(recipientId, type);
    if (selectedCampaignForAnalytics) {
      const recs = await emailCampaignService.fetchCampaignRecipients(selectedCampaignForAnalytics.id);
      setAnalyticsRecipients(recs);
      const updatedCampaigns = await emailCampaignService.fetchCampaigns();
      setCampaigns(updatedCampaigns);
      const updatedSingle = updatedCampaigns.find(c => c.id === selectedCampaignForAnalytics.id);
      if (updatedSingle) setSelectedCampaignForAnalytics(updatedSingle);
    }
  };

  // Criar campanha de reengajamento para quem não abriu
  const handleCreateReengagementCampaign = () => {
    if (!selectedCampaignForAnalytics) return;
    const unOpened = analyticsRecipients.filter(r => (r.open_count || 0) === 0);
    if (unOpened.length === 0) {
      alert('Todos os destinatários já abriram esta campanha!');
      return;
    }

    const unOpenedEmails = unOpened.map(r => r.name ? `"${r.name}" <${r.email}>` : r.email).join('\n');
    setSelectedCampaignForAnalytics(null);
    setCampaignTitle(`Reengajamento: ${selectedCampaignForAnalytics.subject}`);
    setCampaignSubject(`[Lembrete] ${selectedCampaignForAnalytics.subject}`);
    setCampaignPreheader(selectedCampaignForAnalytics.preheader || '');
    setCampaignHeading(selectedCampaignForAnalytics.heading || '');
    setCampaignBody(selectedCampaignForAnalytics.body_html || '');
    setHasCta(selectedCampaignForAnalytics.has_cta);
    setCtaText(selectedCampaignForAnalytics.cta_text || 'Acessar');
    setCtaUrl(selectedCampaignForAnalytics.cta_url || 'https://yahhope.com');
    setSelectedSegments([]);
    setRawExternalEmails(unOpenedEmails);
    setWizardStep(1);
    setIsWizardOpen(true);
  };

  // Excluir campanha
  const handleDeleteCampaign = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm('Tem certeza de que deseja excluir esta campanha e todo o seu histórico de métricas?')) return;
    try {
      await emailCampaignService.deleteCampaign(id);
      setCampaigns(prev => prev.filter(c => c.id !== id));
    } catch (err: any) {
      alert('Erro ao excluir: ' + err.message);
    }
  };

  // Métricas Consolidadas Globais
  const totalSentGlobal = campaigns.reduce((acc, c) => acc + (c.sent_count || 0), 0);
  const totalOpenedGlobal = campaigns.reduce((acc, c) => acc + (c.opened_count || 0), 0);
  const totalClickedGlobal = campaigns.reduce((acc, c) => acc + (c.clicked_count || 0), 0);
  const globalOpenRate = totalSentGlobal > 0 ? Math.round((totalOpenedGlobal / totalSentGlobal) * 100) : 0;
  const globalClickRate = totalSentGlobal > 0 ? Math.round((totalClickedGlobal / totalSentGlobal) * 100) : 0;

  // Filtragem de Campanhas na lista
  const filteredCampaigns = campaigns.filter(c => {
    const matchesSearch = c.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          c.subject.toLowerCase().includes(searchQuery.toLowerCase());
    if (statusFilter === 'sent') return matchesSearch && c.status === 'sent';
    if (statusFilter === 'draft') return matchesSearch && c.status === 'draft';
    return matchesSearch;
  });

  // Filtragem de destinatários na tela de analytics
  const filteredAnalyticsRecipients = analyticsRecipients.filter(r => {
    const matchesSearch = r.email.toLowerCase().includes(analyticsSearch.toLowerCase()) || 
                          (r.name && r.name.toLowerCase().includes(analyticsSearch.toLowerCase()));
    if (!matchesSearch) return false;

    if (analyticsFilter === 'opened') return (r.open_count || 0) > 0;
    if (analyticsFilter === 'clicked') return (r.click_count || 0) > 0;
    if (analyticsFilter === 'not_opened') return (r.open_count || 0) === 0 && r.status !== 'failed';
    if (analyticsFilter === 'failed') return r.status === 'failed';
    return true;
  });

  return (
    <div className="max-w-[1400px] mx-auto space-y-8 pb-20">
      
      {/* HEADER DA PÁGINA */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-amber-500/10 rounded-2xl text-amber-600">
              <Send size={28} />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">
                Disparo & Campanhas de E-mail
              </h1>
              <p className="text-slate-500 text-sm mt-1">
                Crie, dispare comunicados estilo Mailchimp e acompanhe a taxa de leitura, aberturas e cliques em tempo real.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <Link
            to="/communication/email-templates"
            className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-bold hover:bg-slate-50 transition-colors text-sm flex items-center gap-2"
          >
            <FileText size={16} />
            Templates Base
          </Link>
          <button
            onClick={handleOpenNewCampaign}
            className="flex-1 md:flex-initial px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold transition-all shadow-lg shadow-amber-500/25 flex items-center justify-center gap-2 text-sm cursor-pointer"
          >
            <Plus size={18} />
            Nova Campanha
          </button>
        </div>
      </div>

      {/* CARDS DE KPI / PERFORMANCE GLOBAL */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total de Envios</p>
            <h3 className="text-2xl font-black text-slate-900 mt-1">{totalSentGlobal.toLocaleString()}</h3>
            <p className="text-xs text-slate-500 mt-1">E-mails entregues com sucesso</p>
          </div>
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center font-bold">
            <Mail size={22} />
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Taxa Média de Abertura</p>
            <h3 className="text-2xl font-black text-emerald-600 mt-1">{globalOpenRate}%</h3>
            <p className="text-xs text-slate-500 mt-1">{totalOpenedGlobal} aberturas registradas</p>
          </div>
          <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center font-bold">
            <Eye size={22} />
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Taxa de Cliques (CTR)</p>
            <h3 className="text-2xl font-black text-indigo-600 mt-1">{globalClickRate}%</h3>
            <p className="text-xs text-slate-500 mt-1">{totalClickedGlobal} cliques no botão CTA</p>
          </div>
          <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center font-bold">
            <MousePointer size={22} />
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Campanhas Criadas</p>
            <h3 className="text-2xl font-black text-amber-600 mt-1">{campaigns.length}</h3>
            <p className="text-xs text-slate-500 mt-1">{campaigns.filter(c => c.status === 'sent').length} disparadas</p>
          </div>
          <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center font-bold">
            <BarChart3 size={22} />
          </div>
        </div>
      </div>

      {/* BARRA DE PESQUISA E FILTROS */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="relative w-full sm:w-80">
          <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por título ou assunto..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:border-amber-500 transition-colors"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto bg-slate-100 p-1 rounded-xl">
          <button
            onClick={() => setStatusFilter('all')}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-bold transition-all",
              statusFilter === 'all' ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-900"
            )}
          >
            Todas ({campaigns.length})
          </button>
          <button
            onClick={() => setStatusFilter('sent')}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-bold transition-all",
              statusFilter === 'sent' ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-900"
            )}
          >
            Disparadas ({campaigns.filter(c => c.status === 'sent').length})
          </button>
          <button
            onClick={() => setStatusFilter('draft')}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-bold transition-all",
              statusFilter === 'draft' ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-900"
            )}
          >
            Rascunhos ({campaigns.filter(c => c.status === 'draft').length})
          </button>
        </div>
      </div>

      {/* LISTAGEM DE CAMPANHAS */}
      {loading ? (
        <div className="p-16 text-center bg-white rounded-3xl border border-slate-100">
          <RefreshCw size={32} className="animate-spin text-amber-500 mx-auto mb-3" />
          <p className="text-slate-500 font-medium">Carregando campanhas...</p>
        </div>
      ) : filteredCampaigns.length === 0 ? (
        <div className="p-16 text-center bg-white rounded-3xl border border-slate-100">
          <div className="w-16 h-16 bg-amber-50 text-amber-500 rounded-3xl flex items-center justify-center mx-auto mb-4">
            <Mail size={32} />
          </div>
          <h3 className="text-lg font-black text-slate-800">Nenhuma campanha encontrada</h3>
          <p className="text-slate-500 text-sm max-w-md mx-auto mt-2">
            Crie sua primeira campanha para disparar e-mails em lote com controle de visualizações e aberturas!
          </p>
          <button
            onClick={handleOpenNewCampaign}
            className="mt-6 px-5 py-2.5 rounded-xl bg-amber-500 text-white font-bold text-sm hover:bg-amber-600 transition-all shadow-md shadow-amber-500/20"
          >
            Criar Campanha Agora
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredCampaigns.map(camp => {
            const openRate = camp.sent_count > 0 ? Math.round((camp.opened_count / camp.sent_count) * 100) : 0;
            const clickRate = camp.sent_count > 0 ? Math.round((camp.clicked_count / camp.sent_count) * 100) : 0;

            return (
              <div
                key={camp.id}
                onClick={() => camp.status === 'sent' && handleOpenAnalytics(camp)}
                className={cn(
                  "bg-white rounded-3xl border border-slate-100 p-6 shadow-sm hover:shadow-md transition-all flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6",
                  camp.status === 'sent' && "cursor-pointer hover:border-amber-200"
                )}
              >
                {/* Lado Esquerdo: Info da Campanha */}
                <div className="space-y-2 flex-1">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <span className={cn(
                      "px-2.5 py-1 rounded-full text-xs font-black uppercase tracking-wider",
                      camp.status === 'sent' ? "bg-emerald-50 text-emerald-700 border border-emerald-200" :
                      camp.status === 'sending' ? "bg-blue-50 text-blue-700 animate-pulse border border-blue-200" :
                      "bg-slate-100 text-slate-700 border border-slate-200"
                    )}>
                      {camp.status === 'sent' ? '✓ Enviada' : camp.status === 'sending' ? 'Disparando...' : 'Rascunho'}
                    </span>
                    <span className="text-xs text-slate-400 font-medium">
                      {camp.sent_at ? `Enviada em ${new Date(camp.sent_at).toLocaleDateString('pt-BR')} às ${new Date(camp.sent_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}` : `Criada em ${new Date(camp.created_at).toLocaleDateString('pt-BR')}`}
                    </span>
                    <span className="text-xs bg-slate-100 text-slate-600 px-2.5 py-0.5 rounded-full font-medium">
                      {camp.audience_summary || `${camp.total_recipients} destinatários`}
                    </span>
                  </div>

                  <h3 className="text-lg font-black text-slate-900">
                    {camp.title}
                  </h3>
                  <p className="text-sm text-slate-600 flex items-center gap-1.5">
                    <span className="font-semibold text-slate-400">Assunto:</span>
                    {camp.subject}
                  </p>
                </div>

                {/* Centro: Métricas de Leitura & Engajamento (Mailchimp Feedback) */}
                {camp.status === 'sent' ? (
                  <div className="flex flex-wrap items-center gap-6 bg-slate-50/80 p-4 rounded-2xl border border-slate-100 w-full lg:w-auto">
                    {/* Aberturas / Leituras */}
                    <div className="min-w-[120px]">
                      <div className="flex items-center justify-between text-xs font-bold mb-1">
                        <span className="text-slate-600 flex items-center gap-1">
                          <Eye size={13} className="text-emerald-500" /> Aberturas
                        </span>
                        <span className="text-emerald-700">{openRate}%</span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                        <div 
                          className="bg-emerald-500 h-full rounded-full transition-all" 
                          style={{ width: `${Math.min(openRate, 100)}%` }}
                        />
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1">
                        <strong>{camp.opened_count}</strong> de {camp.sent_count} leram
                      </p>
                    </div>

                    {/* Cliques */}
                    <div className="min-w-[120px]">
                      <div className="flex items-center justify-between text-xs font-bold mb-1">
                        <span className="text-slate-600 flex items-center gap-1">
                          <MousePointer size={13} className="text-indigo-500" /> Cliques
                        </span>
                        <span className="text-indigo-700">{clickRate}%</span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                        <div 
                          className="bg-indigo-500 h-full rounded-full transition-all" 
                          style={{ width: `${Math.min(clickRate, 100)}%` }}
                        />
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1">
                        <strong>{camp.clicked_count}</strong> interagiram
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="text-sm text-slate-400 italic">
                    Rascunho pronto para envio ({camp.total_recipients} destinatários selecionados)
                  </div>
                )}

                {/* Lado Direito: Ações */}
                <div className="flex items-center gap-2 shrink-0">
                  {camp.status === 'sent' ? (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenAnalytics(camp);
                      }}
                      className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-2 shadow-sm"
                    >
                      <BarChart3 size={14} />
                      Métricas & Leituras
                    </button>
                  ) : (
                    <button
                      onClick={async () => {
                        const confirmSend = window.confirm(`Deseja disparar este rascunho para ${camp.total_recipients} destinatários agora?`);
                        if (!confirmSend) return;
                        await emailCampaignService.dispatchCampaign(camp.id);
                        await loadData();
                      }}
                      className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-2 shadow-sm shadow-amber-500/20"
                    >
                      <Send size={14} />
                      Disparar Agora
                    </button>
                  )}

                  <button
                    onClick={(e) => handleDeleteCampaign(camp.id, e)}
                    className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                    title="Excluir campanha"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ============================================================================== */}
      {/* MODAL / WIZARD DE CRIAÇÃO DE CAMPANHA (MAILCHIMP STYLE) */}
      {/* ============================================================================== */}
      {isWizardOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            
            {/* Topo do Wizard */}
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div>
                <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
                  <Sparkles size={20} className="text-amber-500" />
                  Criador de Campanha de E-mail
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Configure o público-alvo, elabore a mensagem e visualize antes de disparar.
                </p>
              </div>

              {/* Stepper */}
              <div className="hidden sm:flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold">
                <span className={cn("px-2 py-0.5 rounded-md", wizardStep === 1 ? "bg-amber-500 text-white" : "text-slate-400")}>1. Audiência</span>
                <ChevronRight size={14} className="text-slate-300" />
                <span className={cn("px-2 py-0.5 rounded-md", wizardStep === 2 ? "bg-amber-500 text-white" : "text-slate-400")}>2. Conteúdo</span>
                <ChevronRight size={14} className="text-slate-300" />
                <span className={cn("px-2 py-0.5 rounded-md", wizardStep === 3 ? "bg-amber-500 text-white" : "text-slate-400")}>3. Disparo</span>
              </div>

              <button
                onClick={() => setIsWizardOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Conteúdo das Etapas */}
            <div className="p-6 overflow-y-auto flex-1 space-y-6">

              {/* ------------------------------------------------------------- */}
              {/* ETAPA 1: SELEÇÃO DE AUDIÊNCIA (DESTINATÁRIOS) */}
              {/* ------------------------------------------------------------- */}
              {wizardStep === 1 && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-base font-extrabold text-slate-800">1. Para quem você deseja enviar?</h3>
                    <p className="text-xs text-slate-500 mt-1">
                      Escolha segmentos de pessoas já cadastradas no sistema ou cole uma lista externa de e-mails.
                    </p>
                  </div>

                  {/* Segmentos Cadastrados */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    {/* Apoiadores Cadastrados */}
                    <label className={cn(
                      "p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-start gap-3",
                      selectedSegments.includes('apoiadores') || selectedSegments.includes('all_users') ? "border-amber-500 bg-amber-50/30" : "border-slate-100 hover:border-slate-200 bg-slate-50/30"
                    )}>
                      <input
                        type="checkbox"
                        checked={selectedSegments.includes('apoiadores') || selectedSegments.includes('all_users')}
                        onChange={(e) => {
                          if (e.target.checked) setSelectedSegments(prev => [...prev, 'apoiadores']);
                          else setSelectedSegments(prev => prev.filter(s => s !== 'apoiadores' && s !== 'all_users'));
                        }}
                        className="mt-1 w-4 h-4 rounded text-amber-500 focus:ring-amber-500"
                      />
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-sm text-slate-800">Apoiadores Cadastrados</span>
                          <span className="text-xs bg-slate-200/70 text-slate-700 px-2 py-0.5 rounded-full font-bold">
                            {audienceStats.supporters} contatos
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-1">Apoiadores e membros cadastrados na base do YAH Hope.</p>
                      </div>
                    </label>

                    {/* Doadores e Apoiadores */}
                    <label className={cn(
                      "p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-start gap-3",
                      selectedSegments.includes('donors') ? "border-amber-500 bg-amber-50/30" : "border-slate-100 hover:border-slate-200 bg-slate-50/30"
                    )}>
                      <input
                        type="checkbox"
                        checked={selectedSegments.includes('donors')}
                        onChange={(e) => {
                          if (e.target.checked) setSelectedSegments(prev => [...prev, 'donors']);
                          else setSelectedSegments(prev => prev.filter(s => s !== 'donors'));
                        }}
                        className="mt-1 w-4 h-4 rounded text-amber-500 focus:ring-amber-500"
                      />
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-sm text-slate-800">Doadores & Apoiadores</span>
                          <span className="text-xs bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold">
                            {audienceStats.donors} contatos
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-1">Contatos que já realizaram doações ou apoios no portal.</p>
                      </div>
                    </label>

                    {/* Voluntários e Equipe */}
                    <label className={cn(
                      "p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-start gap-3",
                      selectedSegments.includes('volunteers') ? "border-amber-500 bg-amber-50/30" : "border-slate-100 hover:border-slate-200 bg-slate-50/30"
                    )}>
                      <input
                        type="checkbox"
                        checked={selectedSegments.includes('volunteers')}
                        onChange={(e) => {
                          if (e.target.checked) setSelectedSegments(prev => [...prev, 'volunteers']);
                          else setSelectedSegments(prev => prev.filter(s => s !== 'volunteers'));
                        }}
                        className="mt-1 w-4 h-4 rounded text-amber-500 focus:ring-amber-500"
                      />
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-sm text-slate-800">Voluntários & Equipe</span>
                          <span className="text-xs bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded-full font-bold">
                            {audienceStats.volunteers} contatos
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-1">Colaboradores internos, coordenadores e voluntários.</p>
                      </div>
                    </label>

                    {/* Famílias e Responsáveis */}
                    <label className={cn(
                      "p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-start gap-3",
                      selectedSegments.includes('caregivers') ? "border-amber-500 bg-amber-50/30" : "border-slate-100 hover:border-slate-200 bg-slate-50/30"
                    )}>
                      <input
                        type="checkbox"
                        checked={selectedSegments.includes('caregivers')}
                        onChange={(e) => {
                          if (e.target.checked) setSelectedSegments(prev => [...prev, 'caregivers']);
                          else setSelectedSegments(prev => prev.filter(s => s !== 'caregivers'));
                        }}
                        className="mt-1 w-4 h-4 rounded text-amber-500 focus:ring-amber-500"
                      />
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-sm text-slate-800">Famílias & Responsáveis</span>
                          <span className="text-xs bg-purple-100 text-purple-800 px-2 py-0.5 rounded-full font-bold">
                            {audienceStats.caregivers} contatos
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-1">Responsáveis cadastrados na triagem social e nutrição.</p>
                      </div>
                    </label>
                  </div>

                  {/* E-mails externos / avulsos */}
                  <div className="bg-slate-50/70 p-5 rounded-2xl border border-slate-200/80 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-slate-800 flex items-center gap-2">
                        <UserPlus size={16} className="text-amber-500" />
                        Adicionar Lista de E-mails Avulsos / Externos (Estilo Mailchimp)
                      </span>
                      <label className="text-xs font-bold text-amber-600 hover:text-amber-700 cursor-pointer flex items-center gap-1">
                        <Upload size={13} />
                        Importar CSV / TXT
                        <input
                          type="file"
                          accept=".csv,.txt"
                          onChange={handleFileUpload}
                          className="hidden"
                        />
                      </label>
                    </div>

                    <textarea
                      value={rawExternalEmails}
                      onChange={(e) => setRawExternalEmails(e.target.value)}
                      placeholder="Cole e-mails separados por vírgula ou uma linha por e-mail. Ex:
maria@gmail.com
João Silva <joao@empresa.com>
contato@parceiro.org"
                      rows={3}
                      className="w-full p-3 rounded-xl border border-slate-200 bg-white text-xs font-mono focus:outline-none focus:border-amber-500 transition-colors"
                    />
                    <p className="text-[11px] text-slate-400">
                      O sistema remove automaticamente duplicatas e e-mails que já constam nos segmentos selecionados acima.
                    </p>
                  </div>

                  {/* Resumo Consolidado de Destinatários */}
                  <div className="bg-amber-50/50 border border-amber-200 p-4 rounded-2xl flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-amber-500 text-white rounded-xl flex items-center justify-center font-bold">
                        <Users size={20} />
                      </div>
                      <div>
                        <h4 className="text-sm font-black text-amber-950">
                          {isResolvingAudience ? 'Calculando lista...' : `${resolvedRecipients.length} Destinatários Únicos Selecionados`}
                        </h4>
                        <p className="text-xs text-amber-800/80">
                          Prontos para receber o e-mail sem repetições.
                        </p>
                      </div>
                    </div>

                    {resolvedRecipients.length > 0 && (
                      <span className="text-xs font-bold text-amber-700 bg-amber-100 px-3 py-1 rounded-full">
                        Audiência Pronta
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* ------------------------------------------------------------- */}
              {/* ETAPA 2: CONTEÚDO & DESIGN (VISUAL BUILDER) */}
              {/* ------------------------------------------------------------- */}
              {wizardStep === 2 && (
                <div className="space-y-5">
                  {/* Atalho de Modelos */}
                  {savedTemplates.length > 0 && (
                    <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 flex flex-wrap items-center gap-2">
                      <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                        <FileText size={14} /> Usar Modelo Existente:
                      </span>
                      {savedTemplates.map(t => (
                        <button
                          key={t.id || t.name}
                          onClick={() => handleApplyTemplate(t.name)}
                          className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-white border border-slate-200 text-slate-700 hover:border-amber-500 hover:text-amber-600 transition-colors cursor-pointer"
                        >
                          {t.heading || t.name}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Título interno e remetente */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="sm:col-span-1">
                      <label className="block text-xs font-bold text-slate-700 mb-1">Título Interno da Campanha</label>
                      <input
                        type="text"
                        value={campaignTitle}
                        onChange={(e) => setCampaignTitle(e.target.value)}
                        placeholder="Ex: Newsletter Outubro 2026"
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-amber-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Nome do Remetente</label>
                      <input
                        type="text"
                        value={senderName}
                        onChange={(e) => setSenderName(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-amber-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">E-mail do Remetente</label>
                      <input
                        type="email"
                        value={senderEmail}
                        onChange={(e) => setSenderEmail(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-amber-500"
                      />
                    </div>
                  </div>

                  {/* Assunto e Preheader */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Assunto do E-mail (Subject) *</label>
                      <input
                        type="text"
                        value={campaignSubject}
                        onChange={(e) => setCampaignSubject(e.target.value)}
                        placeholder="Ex: Nossas conquistas e novidades deste mês! 🧡"
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-amber-500 font-medium"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Texto de Apoio (Preheader)</label>
                      <input
                        type="text"
                        value={campaignPreheader}
                        onChange={(e) => setCampaignPreheader(e.target.value)}
                        placeholder="Texto visível antes de abrir o e-mail na caixa de entrada..."
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-amber-500"
                      />
                    </div>
                  </div>

                  {/* Título de Destaque no Topo */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Título de Destaque no Topo do E-mail (Opcional)</label>
                    <input
                      type="text"
                      value={campaignHeading}
                      onChange={(e) => setCampaignHeading(e.target.value)}
                      placeholder="Ex: Juntos estamos transformando a vida de centenas de crianças!"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  {/* Corpo do E-mail com RichText */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-xs font-bold text-slate-700">Corpo do E-mail *</label>
                      <div className="flex items-center gap-1 text-[11px] text-slate-500">
                        <span>Variáveis dinâmicas:</span>
                        <button
                          type="button"
                          onClick={() => setCampaignBody(prev => prev + ' {{nome}}')}
                          className="px-1.5 py-0.5 bg-slate-100 hover:bg-slate-200 rounded font-mono text-slate-700"
                        >
                          &#123;&#123;nome&#125;&#125;
                        </button>
                        <button
                          type="button"
                          onClick={() => setCampaignBody(prev => prev + ' {{email}}')}
                          className="px-1.5 py-0.5 bg-slate-100 hover:bg-slate-200 rounded font-mono text-slate-700"
                        >
                          &#123;&#123;email&#125;&#125;
                        </button>
                      </div>
                    </div>

                    <RichTextEditor
                      value={campaignBody}
                      onChange={(newVal) => setCampaignBody(newVal)}
                    />
                  </div>

                  {/* Botão de Ação (CTA) com Tracking */}
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-sm font-bold text-slate-800">Botão de Ação / Chamada (CTA)</span>
                        <p className="text-xs text-slate-500">Adicione um botão clicável com rastreamento automático de cliques.</p>
                      </div>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={hasCta}
                          onChange={(e) => setHasCta(e.target.checked)}
                          className="w-4 h-4 rounded text-amber-500 focus:ring-amber-500"
                        />
                        <span className="text-xs font-bold text-slate-700">Ativar Botão</span>
                      </label>
                    </div>

                    {hasCta && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                        <div>
                          <label className="block text-xs font-bold text-slate-600 mb-1">Texto do Botão</label>
                          <input
                            type="text"
                            value={ctaText}
                            onChange={(e) => setCtaText(e.target.value)}
                            placeholder="Ex: Ver Relatório Completo"
                            className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-600 mb-1">Link de Destino (URL)</label>
                          <input
                            type="url"
                            value={ctaUrl}
                            onChange={(e) => setCtaUrl(e.target.value)}
                            placeholder="https://yahhope.com/portal"
                            className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-sm"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ------------------------------------------------------------- */}
              {/* ETAPA 3: PRÉVIA INTERATIVA & DISPARO */}
              {/* ------------------------------------------------------------- */}
              {wizardStep === 3 && (
                <div className="space-y-6">
                  {/* Controles de Prévia e Teste */}
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Visualizar:</span>
                      <button
                        onClick={() => setPreviewDevice('desktop')}
                        className={cn(
                          "px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors",
                          previewDevice === 'desktop' ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-800"
                        )}
                      >
                        <Monitor size={14} /> Desktop
                      </button>
                      <button
                        onClick={() => setPreviewDevice('mobile')}
                        className={cn(
                          "px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors",
                          previewDevice === 'mobile' ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-800"
                        )}
                      >
                        <Smartphone size={14} /> Mobile
                      </button>
                    </div>

                    {/* Disparo de Teste */}
                    <div className="flex items-center gap-2">
                      <input
                        type="email"
                        value={testEmailAddress}
                        onChange={(e) => setTestEmailAddress(e.target.value)}
                        placeholder="seu-email@teste.com"
                        className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs w-48 focus:outline-none focus:border-amber-500"
                      />
                      <button
                        onClick={handleSendTest}
                        disabled={isSendingTest}
                        className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold transition-colors flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                      >
                        {isSendingTest ? <RefreshCw size={13} className="animate-spin" /> : <Send size={13} />}
                        Enviar Teste
                      </button>
                    </div>
                  </div>

                  {testSendSuccess && (
                    <div className="p-3 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl text-xs flex items-center gap-2 font-medium">
                      <CheckCircle2 size={16} className="text-emerald-600" />
                      E-mail de teste enviado para <strong>{testEmailAddress}</strong>! Verifique sua caixa de entrada.
                    </div>
                  )}

                  {/* Pré-visualização Real do E-mail */}
                  <div className="bg-slate-100 rounded-2xl p-4 sm:p-8 flex items-center justify-center overflow-x-auto">
                    <div className={cn(
                      "bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-200 transition-all",
                      previewDevice === 'mobile' ? "w-[340px]" : "w-full max-w-[560px]"
                    )}>
                      {/* Cabeçalho */}
                      <div 
                        className="p-6 text-center border-b-2"
                        style={{ borderBottomColor: brandSettings.primaryColor }}
                      >
                        <img
                          src={brandSettings.logoUrl}
                          alt="YAH Hope"
                          className="h-10 mx-auto object-contain"
                        />
                      </div>

                      {/* Conteúdo */}
                      <div className="p-6 sm:p-8 space-y-4 text-slate-700 text-sm leading-relaxed">
                        {campaignHeading && (
                          <h1 
                            className="text-xl font-black text-center mb-4"
                            style={{ color: brandSettings.primaryColor }}
                          >
                            {campaignHeading}
                          </h1>
                        )}

                        <div 
                          className="prose prose-sm max-w-none text-slate-700"
                          dangerouslySetInnerHTML={{ 
                            __html: campaignBody
                              .replace(/{{nome}}/gi, 'Fulano(a)')
                              .replace(/{{email}}/gi, 'fulano@exemplo.com')
                          }}
                        />

                        {hasCta && ctaText && (
                          <div className="pt-4 text-center">
                            <span
                              className="inline-block px-6 py-3 rounded-xl font-bold text-white text-sm shadow-md cursor-pointer hover:opacity-90 transition-opacity"
                              style={{ backgroundColor: brandSettings.primaryColor }}
                            >
                              {ctaText}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Rodapé */}
                      <div className="p-5 bg-slate-50 border-t border-slate-100 text-center text-[11px] text-slate-400 space-y-1">
                        <p className="font-semibold text-slate-500">YAH Hope - Transformando Vidas</p>
                        <p>Você está recebendo este e-mail através das comunicações oficiais da YAH Hope.</p>
                      </div>
                    </div>
                  </div>

                  {/* Resumo antes de Disparar */}
                  <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div>
                      <h4 className="font-black text-amber-950 text-sm">Pronto para o disparo oficial</h4>
                      <p className="text-xs text-amber-800 mt-0.5">
                        Esta campanha será disparada para <strong>{resolvedRecipients.length} destinatários</strong> com tracking de leitura individual ativado.
                      </p>
                    </div>

                    <span className="text-xs font-bold text-amber-800 bg-amber-200/60 px-3 py-1 rounded-lg">
                      Assunto: {campaignSubject || '(Sem assunto)'}
                    </span>
                  </div>
                </div>
              )}

            </div>

            {/* Rodapé do Wizard com Navegação */}
            <div className="p-6 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
              <button
                type="button"
                onClick={handleSaveDraft}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                Salvar como Rascunho
              </button>

              <div className="flex items-center gap-3">
                {wizardStep > 1 && (
                  <button
                    type="button"
                    onClick={() => setWizardStep(prev => (prev - 1) as any)}
                    className="px-4 py-2 text-xs font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl transition-colors cursor-pointer"
                  >
                    Voltar
                  </button>
                )}

                {wizardStep < 3 ? (
                  <button
                    type="button"
                    onClick={() => {
                      if (wizardStep === 1 && resolvedRecipients.length === 0) {
                        alert('Selecione pelo menos um segmento ou adicione e-mails na lista antes de prosseguir.');
                        return;
                      }
                      setWizardStep(prev => (prev + 1) as any);
                    }}
                    className="px-5 py-2 text-xs font-bold text-white bg-amber-500 hover:bg-amber-600 rounded-xl transition-colors shadow-md shadow-amber-500/20 cursor-pointer flex items-center gap-1.5"
                  >
                    Próximo Passo <ArrowRight size={14} />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleConfirmDispatch}
                    disabled={isDispatching}
                    className="px-6 py-2.5 text-sm font-extrabold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-all shadow-lg shadow-emerald-600/25 flex items-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {isDispatching ? (
                      <>
                        <RefreshCw size={16} className="animate-spin" /> Disparando ({resolvedRecipients.length})...
                      </>
                    ) : (
                      <>
                        <Send size={16} /> Disparar para {resolvedRecipients.length} Contatos
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ============================================================================== */}
      {/* MODAL DE ANALYTICS & FEEDBACK DE LEITURAS (DETALHADO POR DESTINATÁRIO) */}
      {/* ============================================================================== */}
      {selectedCampaignForAnalytics && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-5xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            
            {/* Topo do Analytics */}
            <div className="p-6 border-b border-slate-100 flex items-start justify-between bg-slate-50/50">
              <div>
                <span className="text-xs font-bold text-amber-600 uppercase tracking-wider">Relatório de Engajamento & Feedback</span>
                <h2 className="text-xl font-black text-slate-900 mt-1">
                  {selectedCampaignForAnalytics.title}
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Assunto: "{selectedCampaignForAnalytics.subject}" • Disparada em {selectedCampaignForAnalytics.sent_at ? new Date(selectedCampaignForAnalytics.sent_at).toLocaleDateString('pt-BR') : 'Hoje'}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleCreateReengagementCampaign}
                  className="px-3.5 py-2 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 border border-amber-200 cursor-pointer"
                  title="Criar nova mensagem focada apenas em quem não abriu este e-mail"
                >
                  <RefreshCw size={14} />
                  Reenviar para quem não abriu
                </button>

                <button
                  onClick={() => setSelectedCampaignForAnalytics(null)}
                  className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Conteúdo do Analytics */}
            <div className="p-6 overflow-y-auto flex-1 space-y-6">

              {/* Indicadores Chave da Campanha */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <p className="text-xs font-bold text-slate-400 uppercase">Enviados</p>
                  <h4 className="text-2xl font-black text-slate-800 mt-1">{selectedCampaignForAnalytics.sent_count}</h4>
                  <p className="text-[11px] text-slate-500">100% dos contatos</p>
                </div>

                <div className="bg-emerald-50/50 p-4 rounded-2xl border border-emerald-100">
                  <p className="text-xs font-bold text-emerald-600 uppercase flex items-center gap-1">
                    <Eye size={12} /> Aberturas / Leituras
                  </p>
                  <h4 className="text-2xl font-black text-emerald-700 mt-1">
                    {selectedCampaignForAnalytics.sent_count > 0 ? Math.round((selectedCampaignForAnalytics.opened_count / selectedCampaignForAnalytics.sent_count) * 100) : 0}%
                  </h4>
                  <p className="text-[11px] text-emerald-800">
                    {selectedCampaignForAnalytics.opened_count} pessoas leram
                  </p>
                </div>

                <div className="bg-indigo-50/50 p-4 rounded-2xl border border-indigo-100">
                  <p className="text-xs font-bold text-indigo-600 uppercase flex items-center gap-1">
                    <MousePointer size={12} /> Cliques no Link / CTA
                  </p>
                  <h4 className="text-2xl font-black text-indigo-700 mt-1">
                    {selectedCampaignForAnalytics.sent_count > 0 ? Math.round((selectedCampaignForAnalytics.clicked_count / selectedCampaignForAnalytics.sent_count) * 100) : 0}%
                  </h4>
                  <p className="text-[11px] text-indigo-800">
                    {selectedCampaignForAnalytics.clicked_count} pessoas interagiram
                  </p>
                </div>

                <div className="bg-rose-50/50 p-4 rounded-2xl border border-rose-100">
                  <p className="text-xs font-bold text-rose-600 uppercase">Não Abriram</p>
                  <h4 className="text-2xl font-black text-rose-700 mt-1">
                    {Math.max(0, (selectedCampaignForAnalytics.sent_count || 0) - (selectedCampaignForAnalytics.opened_count || 0))}
                  </h4>
                  <p className="text-[11px] text-rose-800">Contatos para reengajamento</p>
                </div>
              </div>

              {/* Barra de Filtro e Busca dos Destinatários */}
              <div className="flex flex-col sm:flex-row justify-between items-center gap-3 pt-2">
                <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl w-full sm:w-auto overflow-x-auto text-xs font-bold">
                  <button
                    onClick={() => setAnalyticsFilter('all')}
                    className={cn(
                      "px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap",
                      analyticsFilter === 'all' ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-900"
                    )}
                  >
                    Todos ({analyticsRecipients.length})
                  </button>
                  <button
                    onClick={() => setAnalyticsFilter('opened')}
                    className={cn(
                      "px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap",
                      analyticsFilter === 'opened' ? "bg-white text-emerald-700 shadow-sm" : "text-slate-600 hover:text-slate-900"
                    )}
                  >
                    Abriram / Leram ({analyticsRecipients.filter(r => (r.open_count || 0) > 0).length})
                  </button>
                  <button
                    onClick={() => setAnalyticsFilter('clicked')}
                    className={cn(
                      "px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap",
                      analyticsFilter === 'clicked' ? "bg-white text-indigo-700 shadow-sm" : "text-slate-600 hover:text-slate-900"
                    )}
                  >
                    Clicaram ({analyticsRecipients.filter(r => (r.click_count || 0) > 0).length})
                  </button>
                  <button
                    onClick={() => setAnalyticsFilter('not_opened')}
                    className={cn(
                      "px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap",
                      analyticsFilter === 'not_opened' ? "bg-white text-rose-700 shadow-sm" : "text-slate-600 hover:text-slate-900"
                    )}
                  >
                    Não Abriram ({analyticsRecipients.filter(r => (r.open_count || 0) === 0).length})
                  </button>
                </div>

                <div className="relative w-full sm:w-64">
                  <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={analyticsSearch}
                    onChange={(e) => setAnalyticsSearch(e.target.value)}
                    placeholder="Filtrar por nome ou e-mail..."
                    className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              {/* Tabela de Destinatários e Status de Leitura */}
              <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50/80 border-b border-slate-100 text-slate-500 uppercase font-black tracking-wider">
                      <th className="py-3 px-4">Destinatário</th>
                      <th className="py-3 px-4">Origem</th>
                      <th className="py-3 px-4">Status de Leitura</th>
                      <th className="py-3 px-4">Primeira Abertura</th>
                      <th className="py-3 px-4">Total de Leituras</th>
                      <th className="py-3 px-4 text-right">Ação / Simulação</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {loadingAnalytics ? (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-slate-400">
                          <RefreshCw size={20} className="animate-spin mx-auto mb-2 text-amber-500" />
                          Carregando status dos destinatários...
                        </td>
                      </tr>
                    ) : filteredAnalyticsRecipients.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-slate-400 italic">
                          Nenhum destinatário com este filtro.
                        </td>
                      </tr>
                    ) : (
                      filteredAnalyticsRecipients.map(r => (
                        <tr key={r.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="py-3 px-4">
                            <p className="font-bold text-slate-800">{r.name || '(Sem nome)'}</p>
                            <p className="text-[11px] text-slate-400 font-mono">{r.email}</p>
                          </td>
                          <td className="py-3 px-4">
                            <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 font-semibold text-[10px] uppercase">
                              {r.recipient_type}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            {r.status === 'clicked' ? (
                              <span className="inline-flex items-center gap-1 text-indigo-700 bg-indigo-50 border border-indigo-200 px-2.5 py-0.5 rounded-full font-bold">
                                <MousePointer size={11} /> Clicou no CTA
                              </span>
                            ) : (r.open_count || 0) > 0 ? (
                              <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full font-bold">
                                <Eye size={11} /> Lido / Aberto
                              </span>
                            ) : r.status === 'failed' ? (
                              <span className="inline-flex items-center gap-1 text-rose-700 bg-rose-50 border border-rose-200 px-2.5 py-0.5 rounded-full font-bold">
                                <AlertCircle size={11} /> Falha no envio
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-full font-medium">
                                <Clock size={11} /> Não aberto ainda
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-slate-600">
                            {r.opened_at ? (
                              <>
                                <p className="font-medium text-slate-700">{new Date(r.opened_at).toLocaleDateString('pt-BR')}</p>
                                <p className="text-[10px] text-slate-400">{new Date(r.opened_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</p>
                              </>
                            ) : (
                              <span className="text-slate-300">—</span>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            {(r.open_count || 0) > 0 ? (
                              <span className="font-bold text-slate-800">
                                {r.open_count} {r.open_count === 1 ? 'leitura' : 'leituras'}
                              </span>
                            ) : (
                              <span className="text-slate-300">0</span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {/* Botões para simular leitura ou clique e testar o feedback ao vivo */}
                              <button
                                onClick={() => handleSimulateInteraction(r.id, 'open')}
                                title="Simular que este destinatário abriu o e-mail"
                                className="px-2 py-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-md border border-emerald-200 transition-colors cursor-pointer"
                              >
                                +1 Abertura
                              </button>
                              <button
                                onClick={() => handleSimulateInteraction(r.id, 'click')}
                                title="Simular que este destinatário clicou no link"
                                className="px-2 py-1 text-[10px] font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-md border border-indigo-200 transition-colors cursor-pointer"
                              >
                                +1 Clique
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

            </div>

            {/* Rodapé do Analytics */}
            <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between text-xs text-slate-500">
              <span className="flex items-center gap-1.5">
                <ShieldCheck size={14} className="text-emerald-500" />
                Rastreamento garantido por pixel 1x1 sem cache e links seguros de redirecionamento.
              </span>
              <button
                onClick={() => setSelectedCampaignForAnalytics(null)}
                className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-xl transition-colors cursor-pointer"
              >
                Fechar
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
