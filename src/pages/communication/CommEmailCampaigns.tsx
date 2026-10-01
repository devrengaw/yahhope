import React, { useState, useEffect } from 'react';
import { 
  Send, Mail, Users, CheckCircle2, AlertCircle, Plus, Eye, BarChart3, 
  ArrowRight, Search, Filter, RefreshCw, Copy, Trash2, ExternalLink, 
  Clock, Check, MousePointer, Smartphone, Monitor, ChevronRight, ChevronDown, ChevronUp, X, Sparkles,
  FileText, Upload, UserCheck, ShieldCheck, Heart, UserPlus, HelpCircle,
  MessageSquare, Share2, CheckCheck, CornerDownLeft, AlertTriangle, Radio
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

interface CommEmailCampaignsProps {
  embedded?: boolean;
}

export function CommEmailCampaigns({ embedded = false }: CommEmailCampaignsProps = {}) {
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
  const [analyticsFilter, setAnalyticsFilter] = useState<'all' | 'opened' | 'clicked' | 'replied' | 'not_opened' | 'failed'>('all');
  const [analyticsSearch, setAnalyticsSearch] = useState('');
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);

  // Modal do Webhook do Resend
  const [isWebhookModalOpen, setIsWebhookModalOpen] = useState(false);
  const [webhookCopied, setWebhookCopied] = useState(false);
  const [webhookTestStatus, setWebhookTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [webhookTestMessage, setWebhookTestMessage] = useState<string>('');

  // Modal para Registro Manual de Resposta
  const [replyModalRecipient, setReplyModalRecipient] = useState<{ recipient: CampaignRecipient; campaignId: string } | null>(null);
  const [manualReplySnippet, setManualReplySnippet] = useState('');
  const [isSavingReply, setIsSavingReply] = useState(false);

  // Pré-visualização Desktop vs Mobile
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'mobile'>('desktop');

  // Destinatários expandidos inline no próprio card da campanha
  const [expandedCampaignId, setExpandedCampaignId] = useState<string | null>(null);
  const [inlineRecipients, setInlineRecipients] = useState<Record<string, CampaignRecipient[]>>({});
  const [loadingInlineRecipients, setLoadingInlineRecipients] = useState<string | null>(null);
  const [inlineSearch, setInlineSearch] = useState('');
  const [inlineFilter, setInlineFilter] = useState<'all' | 'opened' | 'replied' | 'not_opened' | 'failed'>('all');

  const handleToggleExpand = async (campaignId: string) => {
    if (expandedCampaignId === campaignId) {
      setExpandedCampaignId(null);
      return;
    }
    setExpandedCampaignId(campaignId);
    setInlineSearch('');
    setInlineFilter('all');
    if (!inlineRecipients[campaignId]) {
      setLoadingInlineRecipients(campaignId);
      try {
        const recs = await emailCampaignService.fetchCampaignRecipients(campaignId);
        setInlineRecipients(prev => ({ ...prev, [campaignId]: recs }));
      } finally {
        setLoadingInlineRecipients(null);
      }
    }
  };

  const handleSimulateInline = async (recipientId: string, campaignId: string, type: 'open' | 'click' | 'reply' | 'delivered' = 'open') => {
    await emailCampaignService.simulateInteraction(recipientId, type);
    const recs = await emailCampaignService.fetchCampaignRecipients(campaignId);
    setInlineRecipients(prev => ({ ...prev, [campaignId]: recs }));
    const updatedCampaigns = await emailCampaignService.fetchCampaigns();
    setCampaigns(updatedCampaigns);
  };

  const handleCopyWebhookUrl = () => {
    const url = emailCampaignService.getWebhookUrl();
    navigator.clipboard.writeText(url);
    setWebhookCopied(true);
    setTimeout(() => setWebhookCopied(false), 2500);
  };

  const handleTestWebhook = async () => {
    setWebhookTestStatus('testing');
    setWebhookTestMessage('');
    try {
      const url = emailCampaignService.getWebhookUrl();
      const res = await fetch(url, { method: 'GET' });
      if (res.ok) {
        const data = await res.json();
        setWebhookTestStatus('success');
        setWebhookTestMessage(data.message || 'Webhook ativo e pronto para receber eventos do Resend!');
      } else {
        setWebhookTestStatus('error');
        setWebhookTestMessage(`Resposta do servidor: HTTP ${res.status}`);
      }
    } catch (err: any) {
      setWebhookTestStatus('error');
      setWebhookTestMessage(err.message || 'Não foi possível conectar ao endpoint do Webhook.');
    }
  };

  const handleOpenReplyModal = (recipient: CampaignRecipient, campaignId: string) => {
    setReplyModalRecipient({ recipient, campaignId });
    setManualReplySnippet(recipient.reply_snippet || '');
  };

  const handleConfirmReply = async () => {
    if (!replyModalRecipient) return;
    setIsSavingReply(true);
    try {
      await emailCampaignService.recordReply(
        replyModalRecipient.recipient.id,
        manualReplySnippet.trim() || 'Resposta confirmada pelo gestor'
      );
      // Atualizar lista inline se carregada
      if (inlineRecipients[replyModalRecipient.campaignId]) {
        const recs = await emailCampaignService.fetchCampaignRecipients(replyModalRecipient.campaignId);
        setInlineRecipients(prev => ({ ...prev, [replyModalRecipient.campaignId]: recs }));
      }
      // Atualizar analytics se aberto
      if (selectedCampaignForAnalytics && selectedCampaignForAnalytics.id === replyModalRecipient.campaignId) {
        const recs = await emailCampaignService.fetchCampaignRecipients(replyModalRecipient.campaignId);
        setAnalyticsRecipients(recs);
      }
      const updatedCampaigns = await emailCampaignService.fetchCampaigns();
      setCampaigns(updatedCampaigns);
      if (selectedCampaignForAnalytics) {
        const upSingle = updatedCampaigns.find(c => c.id === selectedCampaignForAnalytics.id);
        if (upSingle) setSelectedCampaignForAnalytics(upSingle);
      }
      setReplyModalRecipient(null);
      setManualReplySnippet('');
    } catch (e: any) {
      alert('Erro ao salvar resposta: ' + e.message);
    } finally {
      setIsSavingReply(false);
    }
  };

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
  const handleSimulateInteraction = async (recipientId: string, type: 'open' | 'click' | 'reply' | 'delivered' | 'bounced' = 'open') => {
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
  const totalDeliveredGlobal = campaigns.reduce((acc, c) => acc + (c.delivered_count || c.sent_count || 0), 0);
  const totalOpenedGlobal = campaigns.reduce((acc, c) => acc + (c.opened_count || 0), 0);
  const totalClickedGlobal = campaigns.reduce((acc, c) => acc + (c.clicked_count || 0), 0);
  const totalRepliedGlobal = campaigns.reduce((acc, c) => acc + (c.replied_count || 0), 0);
  const totalBouncedGlobal = campaigns.reduce((acc, c) => acc + (c.bounced_count || 0), 0);
  const globalOpenRate = totalSentGlobal > 0 ? Math.round((totalOpenedGlobal / totalSentGlobal) * 100) : 0;
  const globalClickRate = totalSentGlobal > 0 ? Math.round((totalClickedGlobal / totalSentGlobal) * 100) : 0;
  const globalReplyRate = totalSentGlobal > 0 ? Math.round((totalRepliedGlobal / totalSentGlobal) * 100) : 0;

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
    if (analyticsFilter === 'replied') return (r.reply_count || 0) > 0 || r.status === 'replied';
    if (analyticsFilter === 'not_opened') return (r.open_count || 0) === 0 && r.status !== 'failed' && r.status !== 'bounced';
    if (analyticsFilter === 'failed') return r.status === 'failed' || r.status === 'bounced';
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
                Crie comunicados estilo Mailchimp e acompanhe quando foram entregues, abertos, lidos e respondidos em tempo real.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <button
            onClick={() => {
              setIsWebhookModalOpen(true);
              setWebhookTestStatus('idle');
              setWebhookTestMessage('');
            }}
            className="px-4 py-2.5 rounded-xl border border-indigo-200 bg-indigo-50/70 hover:bg-indigo-100 text-indigo-700 font-bold transition-all text-sm flex items-center gap-2 cursor-pointer shadow-xs"
            title="Configurar Webhook no Resend para receber aberturas e respostas em tempo real"
          >
            <Share2 size={16} />
            <span>Webhook Resend</span>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          </button>
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

      {/* CARDS DE KPI / PERFORMANCE GLOBAL AVANÇADA */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Total Enviados & Entregues */}
        <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total de Envios</p>
            <h3 className="text-2xl font-black text-slate-900 mt-1">{totalSentGlobal.toLocaleString()}</h3>
            <p className="text-xs text-slate-500 mt-1 flex items-center gap-1 font-medium">
              <CheckCheck size={13} className="text-blue-500" />
              {totalDeliveredGlobal} entregues
            </p>
          </div>
          <div className="w-11 h-11 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center font-bold">
            <Mail size={20} />
          </div>
        </div>

        {/* Taxa Média de Abertura / Leitura */}
        <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Taxa de Abertura</p>
            <h3 className="text-2xl font-black text-emerald-600 mt-1">{globalOpenRate}%</h3>
            <p className="text-xs text-slate-500 mt-1 font-medium">
              <strong className="text-emerald-700 font-bold">{totalOpenedGlobal}</strong> leituras registradas
            </p>
          </div>
          <div className="w-11 h-11 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center font-bold">
            <Eye size={20} />
          </div>
        </div>

        {/* Taxa de Cliques (CTR) */}
        <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Taxa de Cliques</p>
            <h3 className="text-2xl font-black text-indigo-600 mt-1">{globalClickRate}%</h3>
            <p className="text-xs text-slate-500 mt-1 font-medium">
              <strong className="text-indigo-700 font-bold">{totalClickedGlobal}</strong> cliques no botão
            </p>
          </div>
          <div className="w-11 h-11 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center font-bold">
            <MousePointer size={20} />
          </div>
        </div>

        {/* Respostas Recebidas */}
        <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Respondidos</p>
            <h3 className="text-2xl font-black text-violet-600 mt-1">{totalRepliedGlobal}</h3>
            <p className="text-xs text-slate-500 mt-1 font-medium">
              {globalReplyRate}% de engajamento
            </p>
          </div>
          <div className="w-11 h-11 bg-violet-50 text-violet-600 rounded-2xl flex items-center justify-center font-bold">
            <MessageSquare size={20} />
          </div>
        </div>

        {/* Rejeições / Bounces */}
        <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Rejeições / Bounces</p>
            <h3 className="text-2xl font-black text-slate-800 mt-1">{totalBouncedGlobal}</h3>
            <p className="text-xs text-slate-500 mt-1 font-medium">
              {totalBouncedGlobal === 0 ? '✨ Reputação 100%' : 'Caixas inválidas'}
            </p>
          </div>
          <div className="w-11 h-11 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center font-bold">
            <AlertTriangle size={20} />
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
            const replyRate = camp.sent_count > 0 ? Math.round(((camp.replied_count || 0) / camp.sent_count) * 100) : 0;

            const isExpanded = expandedCampaignId === camp.id;
            const recs = inlineRecipients[camp.id] || [];
            const openedRecs = recs.filter(r => (r.open_count || 0) > 0);
            const repliedRecs = recs.filter(r => (r.reply_count || 0) > 0 || r.status === 'replied');
            const notOpenedRecs = recs.filter(r => (r.open_count || 0) === 0 && r.status !== 'bounced' && r.status !== 'failed');
            const bouncedRecs = recs.filter(r => r.status === 'bounced' || r.status === 'failed');

            return (
              <div
                key={camp.id}
                className="bg-white rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-all overflow-hidden"
              >
                {/* Linha Principal da Campanha */}
                <div className="p-6 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
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
                      {camp.sent_at ? (
                        <span className="text-xs bg-amber-50 text-amber-800 border border-amber-200 px-3 py-1 rounded-full font-bold flex items-center gap-1.5">
                          <Clock size={13} className="text-amber-600" />
                          Enviado em {new Date(camp.sent_at).toLocaleDateString('pt-BR')} às {new Date(camp.sent_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400 font-medium">
                          Criada em {new Date(camp.created_at).toLocaleDateString('pt-BR')}
                        </span>
                      )}
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
                    <div className="flex flex-wrap items-center gap-4 bg-slate-50/80 p-3.5 rounded-2xl border border-slate-100 w-full lg:w-auto">
                      {/* Aberturas / Leituras */}
                      <div className="min-w-[120px]">
                        <div className="flex items-center justify-between text-xs font-bold mb-1">
                          <span className="text-slate-600 flex items-center gap-1">
                            <Eye size={13} className="text-emerald-500" /> Aberturas
                          </span>
                          <span className="text-emerald-700">{openRate}%</span>
                        </div>
                        <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                          <div 
                            className="bg-emerald-500 h-full rounded-full transition-all" 
                            style={{ width: `${Math.min(openRate, 100)}%` }}
                          />
                        </div>
                        <p className="text-[10px] text-slate-500 mt-1">
                          <strong className="text-emerald-600 font-bold">{camp.opened_count}</strong> de {camp.sent_count} leram
                        </p>
                      </div>

                      {/* Cliques */}
                      <div className="min-w-[110px]">
                        <div className="flex items-center justify-between text-xs font-bold mb-1">
                          <span className="text-slate-600 flex items-center gap-1">
                            <MousePointer size={13} className="text-indigo-500" /> Cliques
                          </span>
                          <span className="text-indigo-700">{clickRate}%</span>
                        </div>
                        <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                          <div 
                            className="bg-indigo-500 h-full rounded-full transition-all" 
                            style={{ width: `${Math.min(clickRate, 100)}%` }}
                          />
                        </div>
                        <p className="text-[10px] text-slate-500 mt-1">
                          <strong className="text-indigo-600 font-bold">{camp.clicked_count}</strong> interagiram
                        </p>
                      </div>

                      {/* Respostas Recebidas */}
                      <div className="min-w-[110px]">
                        <div className="flex items-center justify-between text-xs font-bold mb-1">
                          <span className="text-slate-600 flex items-center gap-1">
                            <MessageSquare size={13} className="text-violet-500" /> Respostas
                          </span>
                          <span className="text-violet-700 font-bold">{camp.replied_count || 0}</span>
                        </div>
                        <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                          <div 
                            className="bg-violet-500 h-full rounded-full transition-all" 
                            style={{ width: `${Math.min(replyRate, 100)}%` }}
                          />
                        </div>
                        <p className="text-[10px] text-slate-500 mt-1">
                          <strong className="text-violet-600 font-bold">{camp.replied_count || 0}</strong> responderam
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
                    {camp.status === 'sent' && (
                      <button
                        onClick={() => handleToggleExpand(camp.id)}
                        className={cn(
                          "px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs cursor-pointer",
                          isExpanded
                            ? "bg-amber-500 text-white shadow-amber-500/20"
                            : "bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200"
                        )}
                      >
                        <Users size={14} />
                        Ver Status por E-mail
                        {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      </button>
                    )}

                    {camp.status === 'sent' ? (
                      <button
                        onClick={() => handleOpenAnalytics(camp)}
                        className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-2 shadow-xs cursor-pointer"
                      >
                        <BarChart3 size={14} />
                        Relatório
                      </button>
                    ) : (
                      <button
                        onClick={async () => {
                          const confirmSend = window.confirm(`Deseja disparar este rascunho para ${camp.total_recipients} destinatários agora?`);
                          if (!confirmSend) return;
                          await emailCampaignService.dispatchCampaign(camp.id);
                          await loadData();
                        }}
                        className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-2 shadow-sm shadow-amber-500/20 cursor-pointer"
                      >
                        <Send size={14} />
                        Disparar Agora
                      </button>
                    )}

                    <button
                      onClick={(e) => handleDeleteCampaign(camp.id, e)}
                      className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                      title="Excluir campanha"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                {/* PAINEL EXPANSÍVEL: DESTINATÁRIOS E FEEDBACK DE ABERTURA / RESPOSTA POR E-MAIL */}
                {camp.status === 'sent' && isExpanded && (
                  <div className="border-t border-slate-100 bg-slate-50/80 p-6 space-y-4 animate-in fade-in duration-200">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                      <div>
                        <h4 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                          <Mail size={16} className="text-amber-500" />
                          Feedback de Leituras e Respostas por Destinatário
                        </h4>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {camp.sent_at ? `E-mail disparado em ${new Date(camp.sent_at).toLocaleDateString('pt-BR')} às ${new Date(camp.sent_at).toLocaleTimeString('pt-BR')}` : 'Enviado'}
                        </p>
                      </div>

                      {/* Resumo de Leituras e Respostas */}
                      <div className="flex flex-wrap items-center gap-2 text-xs">
                        <span className="bg-white border border-slate-200 px-3 py-1 rounded-xl text-slate-700 font-semibold shadow-xs">
                          Total: <strong>{recs.length || camp.total_recipients}</strong>
                        </span>
                        <span className="bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-xl text-emerald-800 font-bold shadow-xs flex items-center gap-1">
                          <CheckCircle2 size={13} className="text-emerald-600" />
                          <strong>{openedRecs.length}</strong> abriram ({recs.length > 0 ? Math.round((openedRecs.length / recs.length) * 100) : 0}%)
                        </span>
                        <span className="bg-violet-50 border border-violet-200 px-3 py-1 rounded-xl text-violet-800 font-bold shadow-xs flex items-center gap-1">
                          <MessageSquare size={13} className="text-violet-600" />
                          <strong>{repliedRecs.length}</strong> responderam
                        </span>
                        <span className="bg-rose-50 border border-rose-200 px-3 py-1 rounded-xl text-rose-800 font-bold shadow-xs flex items-center gap-1">
                          <Clock size={13} className="text-rose-600" />
                          <strong>{notOpenedRecs.length}</strong> não abriram
                        </span>
                      </div>
                    </div>

                    {/* Barra de Filtro e Busca */}
                    <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
                      <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200 text-xs font-bold shadow-xs overflow-x-auto w-full sm:w-auto">
                        <button
                          onClick={() => setInlineFilter('all')}
                          className={cn(
                            "px-3 py-1 rounded-lg transition-colors cursor-pointer whitespace-nowrap",
                            inlineFilter === 'all' ? "bg-slate-900 text-white shadow-xs" : "text-slate-600 hover:text-slate-900"
                          )}
                        >
                          Todos ({recs.length})
                        </button>
                        <button
                          onClick={() => setInlineFilter('opened')}
                          className={cn(
                            "px-3 py-1 rounded-lg transition-colors cursor-pointer whitespace-nowrap",
                            inlineFilter === 'opened' ? "bg-emerald-600 text-white shadow-xs" : "text-slate-600 hover:text-slate-900"
                          )}
                        >
                          🟢 Aberto ({openedRecs.length})
                        </button>
                        <button
                          onClick={() => setInlineFilter('replied')}
                          className={cn(
                            "px-3 py-1 rounded-lg transition-colors cursor-pointer whitespace-nowrap",
                            inlineFilter === 'replied' ? "bg-violet-600 text-white shadow-xs" : "text-slate-600 hover:text-slate-900"
                          )}
                        >
                          💬 Respondido ({repliedRecs.length})
                        </button>
                        <button
                          onClick={() => setInlineFilter('not_opened')}
                          className={cn(
                            "px-3 py-1 rounded-lg transition-colors cursor-pointer whitespace-nowrap",
                            inlineFilter === 'not_opened' ? "bg-rose-600 text-white shadow-xs" : "text-slate-600 hover:text-slate-900"
                          )}
                        >
                          ⏳ Não Aberto ({notOpenedRecs.length})
                        </button>
                        {bouncedRecs.length > 0 && (
                          <button
                            onClick={() => setInlineFilter('failed')}
                            className={cn(
                              "px-3 py-1 rounded-lg transition-colors cursor-pointer whitespace-nowrap",
                              inlineFilter === 'failed' ? "bg-red-600 text-white shadow-xs" : "text-red-600 hover:text-red-800"
                            )}
                          >
                            🔴 Bounces ({bouncedRecs.length})
                          </button>
                        )}
                      </div>

                      <div className="relative w-full sm:w-64">
                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                          type="text"
                          value={inlineSearch}
                          onChange={(e) => setInlineSearch(e.target.value)}
                          placeholder="Buscar por e-mail ou nome..."
                          className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-amber-500"
                        />
                      </div>
                    </div>

                    {/* Lista / Tabela por E-mail */}
                    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="bg-slate-100/70 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                            <th className="py-2.5 px-4">Destinatário</th>
                            <th className="py-2.5 px-4">Status</th>
                            <th className="py-2.5 px-4">Quando Abriu / Leu</th>
                            <th className="py-2.5 px-4">Quando Respondeu</th>
                            <th className="py-2.5 px-4 text-right">Simular / Ações</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {loadingInlineRecipients === camp.id ? (
                            <tr>
                              <td colSpan={5} className="py-6 text-center text-slate-400">
                                <RefreshCw size={18} className="animate-spin mx-auto mb-1 text-amber-500" />
                                Carregando destinatários...
                              </td>
                            </tr>
                          ) : recs.length === 0 ? (
                            <tr>
                              <td colSpan={5} className="py-6 text-center text-slate-400 italic">
                                Nenhum destinatário registrado nesta campanha.
                              </td>
                            </tr>
                          ) : (
                            recs
                              .filter(r => {
                                const matchSearch = r.email.toLowerCase().includes(inlineSearch.toLowerCase()) ||
                                                    (r.name && r.name.toLowerCase().includes(inlineSearch.toLowerCase()));
                                if (!matchSearch) return false;
                                if (inlineFilter === 'opened') return (r.open_count || 0) > 0;
                                if (inlineFilter === 'replied') return (r.reply_count || 0) > 0 || r.status === 'replied';
                                if (inlineFilter === 'not_opened') return (r.open_count || 0) === 0 && r.status !== 'bounced' && r.status !== 'failed';
                                if (inlineFilter === 'failed') return r.status === 'bounced' || r.status === 'failed';
                                return true;
                              })
                              .map(r => (
                                <tr key={r.id} className="hover:bg-slate-50/60 transition-colors">
                                  <td className="py-2.5 px-4">
                                    <p className="font-mono font-bold text-slate-800">{r.email}</p>
                                    <p className="text-[11px] text-slate-400">{r.name || 'Sem nome'}</p>
                                  </td>
                                  <td className="py-2.5 px-4">
                                    {r.status === 'replied' || (r.reply_count || 0) > 0 ? (
                                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-violet-100 text-violet-800 border border-violet-200">
                                        <MessageSquare size={12} className="text-violet-600" />
                                        Respondido ({r.reply_count || 1}x)
                                      </span>
                                    ) : r.status === 'clicked' ? (
                                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-100 text-indigo-800 border border-indigo-200">
                                        <MousePointer size={12} className="text-indigo-600" />
                                        Clicou no CTA
                                      </span>
                                    ) : (r.open_count || 0) > 0 ? (
                                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                                        <Eye size={12} className="text-emerald-600" />
                                        Aberto ({r.open_count} {r.open_count === 1 ? 'leitura' : 'leituras'})
                                      </span>
                                    ) : r.status === 'bounced' || r.status === 'failed' ? (
                                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-200">
                                        <AlertTriangle size={12} className="text-rose-600" />
                                        Rejeitado / Bounce
                                      </span>
                                    ) : r.delivered_at || r.status === 'delivered' ? (
                                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
                                        <CheckCheck size={12} className="text-blue-500" />
                                        Entregue (não aberto)
                                      </span>
                                    ) : (
                                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
                                        <Clock size={12} className="text-slate-400" />
                                        Enviado (aguardando leitura)
                                      </span>
                                    )}
                                  </td>
                                  <td className="py-2.5 px-4 text-slate-500">
                                    {r.opened_at ? (
                                      <div>
                                        <span className="font-medium text-slate-700">
                                          {new Date(r.opened_at).toLocaleDateString('pt-BR')} às {new Date(r.opened_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                        {r.open_count > 1 && (
                                          <span className="block text-[10px] text-emerald-600 font-semibold">
                                            Leu {r.open_count} vezes
                                          </span>
                                        )}
                                      </div>
                                    ) : (
                                      <span className="text-slate-300">—</span>
                                    )}
                                  </td>
                                  <td className="py-2.5 px-4 text-slate-600">
                                    {r.replied_at ? (
                                      <div>
                                        <span className="font-medium text-violet-700">
                                          {new Date(r.replied_at).toLocaleDateString('pt-BR')} às {new Date(r.replied_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                        {r.reply_snippet && (
                                          <p className="text-[11px] text-slate-500 italic truncate max-w-[200px]" title={r.reply_snippet}>
                                            "{r.reply_snippet}"
                                          </p>
                                        )}
                                      </div>
                                    ) : (
                                      <span className="text-slate-300">—</span>
                                    )}
                                  </td>
                                  <td className="py-2.5 px-4 text-right">
                                    <div className="flex items-center justify-end gap-1.5">
                                      <button
                                        onClick={() => handleSimulateInline(r.id, camp.id, 'open')}
                                        className="px-2 py-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-md border border-emerald-200 transition-colors cursor-pointer"
                                        title="Simular que este destinatário abriu o e-mail"
                                      >
                                        +1 Aberto
                                      </button>
                                      <button
                                        onClick={() => handleOpenReplyModal(r, camp.id)}
                                        className="px-2 py-1 text-[11px] font-bold text-violet-700 bg-violet-50 hover:bg-violet-100 rounded-md border border-violet-200 transition-colors cursor-pointer"
                                        title="Registrar resposta recebida deste destinatário"
                                      >
                                        + Respondeu
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
                )}
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
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <p className="text-xs font-bold text-slate-400 uppercase">Enviados</p>
                  <h4 className="text-2xl font-black text-slate-800 mt-1">{selectedCampaignForAnalytics.sent_count}</h4>
                  <p className="text-[11px] text-slate-500 font-medium">
                    {selectedCampaignForAnalytics.delivered_count || selectedCampaignForAnalytics.sent_count} entregues
                  </p>
                </div>

                <div className="bg-emerald-50/50 p-4 rounded-2xl border border-emerald-100">
                  <p className="text-xs font-bold text-emerald-600 uppercase flex items-center gap-1">
                    <Eye size={12} /> Aberturas
                  </p>
                  <h4 className="text-2xl font-black text-emerald-700 mt-1">
                    {selectedCampaignForAnalytics.sent_count > 0 ? Math.round((selectedCampaignForAnalytics.opened_count / selectedCampaignForAnalytics.sent_count) * 100) : 0}%
                  </h4>
                  <p className="text-[11px] text-emerald-800 font-medium">
                    {selectedCampaignForAnalytics.opened_count} contatos leram
                  </p>
                </div>

                <div className="bg-indigo-50/50 p-4 rounded-2xl border border-indigo-100">
                  <p className="text-xs font-bold text-indigo-600 uppercase flex items-center gap-1">
                    <MousePointer size={12} /> Cliques CTA
                  </p>
                  <h4 className="text-2xl font-black text-indigo-700 mt-1">
                    {selectedCampaignForAnalytics.sent_count > 0 ? Math.round((selectedCampaignForAnalytics.clicked_count / selectedCampaignForAnalytics.sent_count) * 100) : 0}%
                  </h4>
                  <p className="text-[11px] text-indigo-800 font-medium">
                    {selectedCampaignForAnalytics.clicked_count} interagiram
                  </p>
                </div>

                <div className="bg-violet-50/50 p-4 rounded-2xl border border-violet-100">
                  <p className="text-xs font-bold text-violet-600 uppercase flex items-center gap-1">
                    <MessageSquare size={12} /> Respondidos
                  </p>
                  <h4 className="text-2xl font-black text-violet-700 mt-1">
                    {selectedCampaignForAnalytics.sent_count > 0 ? Math.round(((selectedCampaignForAnalytics.replied_count || 0) / selectedCampaignForAnalytics.sent_count) * 100) : 0}%
                  </h4>
                  <p className="text-[11px] text-violet-800 font-medium">
                    {selectedCampaignForAnalytics.replied_count || 0} respostas
                  </p>
                </div>

                <div className="bg-rose-50/50 p-4 rounded-2xl border border-rose-100">
                  <p className="text-xs font-bold text-rose-600 uppercase">Não Abriram</p>
                  <h4 className="text-2xl font-black text-rose-700 mt-1">
                    {Math.max(0, (selectedCampaignForAnalytics.sent_count || 0) - (selectedCampaignForAnalytics.opened_count || 0))}
                  </h4>
                  <p className="text-[11px] text-rose-800 font-medium">Oportunidade</p>
                </div>

                <div className="bg-slate-100 p-4 rounded-2xl border border-slate-200">
                  <p className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1">
                    <AlertTriangle size={12} className="text-slate-500" /> Bounces
                  </p>
                  <h4 className="text-2xl font-black text-slate-800 mt-1">
                    {selectedCampaignForAnalytics.bounced_count || 0}
                  </h4>
                  <p className="text-[11px] text-slate-600 font-medium">Falhas/Rejeições</p>
                </div>
              </div>

              {/* Barra de Filtro e Busca dos Destinatários */}
              <div className="flex flex-col sm:flex-row justify-between items-center gap-3 pt-2">
                <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl w-full sm:w-auto overflow-x-auto text-xs font-bold">
                  <button
                    onClick={() => setAnalyticsFilter('all')}
                    className={cn(
                      "px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap cursor-pointer",
                      analyticsFilter === 'all' ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-900"
                    )}
                  >
                    Todos ({analyticsRecipients.length})
                  </button>
                  <button
                    onClick={() => setAnalyticsFilter('opened')}
                    className={cn(
                      "px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap cursor-pointer",
                      analyticsFilter === 'opened' ? "bg-white text-emerald-700 shadow-sm" : "text-slate-600 hover:text-slate-900"
                    )}
                  >
                    Abriram / Leram ({analyticsRecipients.filter(r => (r.open_count || 0) > 0).length})
                  </button>
                  <button
                    onClick={() => setAnalyticsFilter('clicked')}
                    className={cn(
                      "px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap cursor-pointer",
                      analyticsFilter === 'clicked' ? "bg-white text-indigo-700 shadow-sm" : "text-slate-600 hover:text-slate-900"
                    )}
                  >
                    Clicaram ({analyticsRecipients.filter(r => (r.click_count || 0) > 0).length})
                  </button>
                  <button
                    onClick={() => setAnalyticsFilter('replied')}
                    className={cn(
                      "px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap cursor-pointer",
                      analyticsFilter === 'replied' ? "bg-white text-violet-700 shadow-sm" : "text-slate-600 hover:text-slate-900"
                    )}
                  >
                    Respondidos ({analyticsRecipients.filter(r => (r.reply_count || 0) > 0 || r.status === 'replied').length})
                  </button>
                  <button
                    onClick={() => setAnalyticsFilter('not_opened')}
                    className={cn(
                      "px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap cursor-pointer",
                      analyticsFilter === 'not_opened' ? "bg-white text-rose-700 shadow-sm" : "text-slate-600 hover:text-slate-900"
                    )}
                  >
                    Não Abriram ({analyticsRecipients.filter(r => (r.open_count || 0) === 0 && r.status !== 'failed' && r.status !== 'bounced').length})
                  </button>
                  {analyticsRecipients.filter(r => r.status === 'failed' || r.status === 'bounced').length > 0 && (
                    <button
                      onClick={() => setAnalyticsFilter('failed')}
                      className={cn(
                        "px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap cursor-pointer",
                        analyticsFilter === 'failed' ? "bg-white text-red-700 shadow-sm" : "text-red-600 hover:text-red-900"
                      )}
                    >
                      Bounces ({analyticsRecipients.filter(r => r.status === 'failed' || r.status === 'bounced').length})
                    </button>
                  )}
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

              {/* Tabela de Destinatários e Status de Leitura & Resposta */}
              <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50/80 border-b border-slate-100 text-slate-500 uppercase font-black tracking-wider text-[11px]">
                      <th className="py-3 px-4">Destinatário</th>
                      <th className="py-3 px-4">Origem</th>
                      <th className="py-3 px-4">Status Geral</th>
                      <th className="py-3 px-4">Quando Abriu / Leu</th>
                      <th className="py-3 px-4">Quando Respondeu</th>
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
                            {r.status === 'replied' || (r.reply_count || 0) > 0 ? (
                              <span className="inline-flex items-center gap-1 text-violet-700 bg-violet-50 border border-violet-200 px-2.5 py-0.5 rounded-full font-bold">
                                <MessageSquare size={11} /> Respondido ({r.reply_count || 1}x)
                              </span>
                            ) : r.status === 'clicked' ? (
                              <span className="inline-flex items-center gap-1 text-indigo-700 bg-indigo-50 border border-indigo-200 px-2.5 py-0.5 rounded-full font-bold">
                                <MousePointer size={11} /> Clicou no CTA
                              </span>
                            ) : (r.open_count || 0) > 0 ? (
                              <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full font-bold">
                                <Eye size={11} /> Lido / Aberto ({r.open_count}x)
                              </span>
                            ) : r.status === 'bounced' || r.status === 'failed' ? (
                              <span className="inline-flex items-center gap-1 text-rose-700 bg-rose-50 border border-rose-200 px-2.5 py-0.5 rounded-full font-bold">
                                <AlertTriangle size={11} /> Bounce / Falha
                              </span>
                            ) : r.delivered_at || r.status === 'delivered' ? (
                              <span className="inline-flex items-center gap-1 text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-0.5 rounded-full font-medium">
                                <CheckCheck size={11} /> Entregue (não aberto)
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-full font-medium">
                                <Clock size={11} /> Não aberto ainda
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-slate-600">
                            {r.opened_at ? (
                              <div>
                                <p className="font-semibold text-slate-800">
                                  {new Date(r.opened_at).toLocaleDateString('pt-BR')} às {new Date(r.opened_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                </p>
                                <p className="text-[10px] text-emerald-600 font-medium">
                                  {r.open_count} {r.open_count === 1 ? 'leitura' : 'leituras'}
                                </p>
                              </div>
                            ) : (
                              <span className="text-slate-300">—</span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-slate-600">
                            {r.replied_at ? (
                              <div>
                                <p className="font-semibold text-violet-800">
                                  {new Date(r.replied_at).toLocaleDateString('pt-BR')} às {new Date(r.replied_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                </p>
                                {r.reply_snippet && (
                                  <p className="text-[11px] text-slate-500 italic max-w-[200px] truncate" title={r.reply_snippet}>
                                    "{r.reply_snippet}"
                                  </p>
                                )}
                              </div>
                            ) : (
                              <span className="text-slate-300">—</span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {/* Botões para simular leitura, clique ou registrar resposta */}
                              <button
                                onClick={() => handleSimulateInteraction(r.id, 'open')}
                                title="Simular que este destinatário abriu o e-mail"
                                className="px-2 py-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-md border border-emerald-200 transition-colors cursor-pointer"
                              >
                                +1 Aberto
                              </button>
                              <button
                                onClick={() => handleSimulateInteraction(r.id, 'click')}
                                title="Simular que este destinatário clicou no link"
                                className="px-2 py-1 text-[10px] font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-md border border-indigo-200 transition-colors cursor-pointer"
                              >
                                +1 Clique
                              </button>
                              <button
                                onClick={() => handleOpenReplyModal(r, selectedCampaignForAnalytics.id)}
                                title="Registrar resposta recebida deste destinatário"
                                className="px-2 py-1 text-[10px] font-bold text-violet-700 bg-violet-50 hover:bg-violet-100 rounded-md border border-violet-200 transition-colors cursor-pointer"
                              >
                                + Respondeu
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
            <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
              <span className="flex items-center gap-1.5">
                <ShieldCheck size={14} className="text-emerald-500" />
                Rastreamento em tempo real via Webhook Resend e pixel 1x1 sem cache.
              </span>
              <button
                onClick={() => setSelectedCampaignForAnalytics(null)}
                className="w-full sm:w-auto px-5 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-xl transition-colors cursor-pointer"
              >
                Fechar Relatório
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ============================================================================== */}
      {/* MODAL DE CONFIGURAÇÃO DO WEBHOOK DO RESEND */}
      {/* ============================================================================== */}
      {isWebhookModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full flex flex-col shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 flex items-start justify-between bg-indigo-50/40">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-600/20">
                  <Share2 size={20} />
                </div>
                <div>
                  <h2 className="text-lg font-black text-slate-900">
                    Webhook do Resend
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Receba atualizações automáticas de entregas, aberturas, cliques e respostas em tempo real.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsWebhookModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* URL do Endpoint */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center justify-between">
                  <span>URL do Endpoint (Copie para o Resend)</span>
                  <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" /> Ativo
                  </span>
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={emailCampaignService.getWebhookUrl()}
                    className="flex-1 bg-slate-50 border border-slate-200 px-3.5 py-2.5 rounded-xl font-mono text-xs text-slate-800 select-all focus:outline-none"
                  />
                  <button
                    onClick={handleCopyWebhookUrl}
                    className={cn(
                      "px-4 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer shadow-xs",
                      webhookCopied
                        ? "bg-emerald-600 text-white"
                        : "bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-600/20"
                    )}
                  >
                    {webhookCopied ? <Check size={14} /> : <Copy size={14} />}
                    {webhookCopied ? 'Copiado!' : 'Copiar URL'}
                  </button>
                </div>
              </div>

              {/* Botão de Teste de Conexão */}
              <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/70 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-bold text-slate-800">Testar Conexão do Endpoint</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Dispara um sinal de teste para validar se a Edge Function está respondendo.
                  </p>
                </div>
                <button
                  onClick={handleTestWebhook}
                  disabled={webhookTestStatus === 'testing'}
                  className="px-3.5 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 font-bold rounded-xl text-xs transition-colors flex items-center gap-1.5 cursor-pointer shrink-0 disabled:opacity-50"
                >
                  <RefreshCw size={13} className={webhookTestStatus === 'testing' ? 'animate-spin' : ''} />
                  {webhookTestStatus === 'testing' ? 'Testando...' : 'Testar Ping'}
                </button>
              </div>

              {webhookTestMessage && (
                <div className={cn(
                  "p-3 rounded-xl text-xs font-medium flex items-center gap-2",
                  webhookTestStatus === 'success' ? "bg-emerald-50 text-emerald-800 border border-emerald-200" : "bg-rose-50 text-rose-800 border border-rose-200"
                )}>
                  {webhookTestStatus === 'success' ? <CheckCircle2 size={16} className="text-emerald-600 shrink-0" /> : <AlertCircle size={16} className="text-rose-600 shrink-0" />}
                  <span>{webhookTestMessage}</span>
                </div>
              )}

              {/* Eventos Suportados */}
              <div>
                <p className="text-xs font-bold text-slate-700 mb-2">Eventos que você deve marcar no Resend:</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {[
                    { name: 'email.sent', label: 'Enviado', color: 'bg-blue-50 text-blue-700 border-blue-200' },
                    { name: 'email.delivered', label: 'Entregue', color: 'bg-cyan-50 text-cyan-700 border-cyan-200' },
                    { name: 'email.opened', label: 'Aberto / Lido', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
                    { name: 'email.clicked', label: 'Clicou no Link', color: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
                    { name: 'email.bounced', label: 'Rejeitado (Bounce)', color: 'bg-rose-50 text-rose-700 border-rose-200' },
                    { name: 'email.complained', label: 'Spam / Queixa', color: 'bg-amber-50 text-amber-700 border-amber-200' }
                  ].map((evt) => (
                    <div key={evt.name} className={cn("p-2.5 rounded-xl border text-xs font-semibold flex items-center justify-between", evt.color)}>
                      <span>{evt.label}</span>
                      <Check size={12} />
                    </div>
                  ))}
                </div>
              </div>

              {/* Passo a Passo */}
              <div className="space-y-2 border-t border-slate-100 pt-4">
                <p className="text-xs font-bold text-slate-800 uppercase tracking-wider">Como ativar no Resend:</p>
                <ol className="text-xs text-slate-600 space-y-1.5 list-decimal list-inside">
                  <li>Acesse o painel do Resend em <a href="https://resend.com/webhooks" target="_blank" rel="noreferrer" className="text-indigo-600 font-bold underline inline-flex items-center gap-0.5">resend.com/webhooks <ExternalLink size={10} /></a>.</li>
                  <li>Clique em <strong>"Add Webhook"</strong> no canto superior direito.</li>
                  <li>Cole a <strong>URL do Endpoint</strong> copiada acima no campo <em>Endpoint URL</em>.</li>
                  <li>Selecione todos os eventos listados acima (Delivered, Opened, Clicked, Bounced).</li>
                  <li>Clique em <strong>Add</strong> para salvar. Pronto! Seus e-mails passarão a atualizar instantaneamente.</li>
                </ol>
              </div>
            </div>

            <div className="p-4 bg-slate-50/50 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setIsWebhookModalOpen(false)}
                className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Concluído
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================================== */}
      {/* MODAL DE REGISTRO MANUAL DE RESPOSTA */}
      {/* ============================================================================== */}
      {replyModalRecipient && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-violet-50/50">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-violet-600 text-white flex items-center justify-center">
                  <MessageSquare size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900">Registrar Resposta</h3>
                  <p className="text-[11px] text-slate-500 font-mono">{replyModalRecipient.recipient.email}</p>
                </div>
              </div>
              <button
                onClick={() => setReplyModalRecipient(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-5 space-y-3">
              <p className="text-xs text-slate-600">
                O apoiador <strong>{replyModalRecipient.recipient.name || replyModalRecipient.recipient.email}</strong> respondeu a esta campanha. Você pode adicionar um trecho ou anotação da resposta:
              </p>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Trecho ou anotação da resposta:
                </label>
                <textarea
                  rows={3}
                  value={manualReplySnippet}
                  onChange={(e) => setManualReplySnippet(e.target.value)}
                  placeholder="Ex: 'Recebi o e-mail e gostaria de confirmar minha doação para a campanha!'"
                  className="w-full p-3 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-violet-500 transition-colors"
                />
              </div>
            </div>

            <div className="p-4 bg-slate-50/50 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                onClick={() => setReplyModalRecipient(null)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-xl text-xs transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmReply}
                disabled={isSavingReply}
                className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white font-bold rounded-xl text-xs transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm shadow-violet-600/20 disabled:opacity-50"
              >
                {isSavingReply ? <RefreshCw size={13} className="animate-spin" /> : <Check size={13} />}
                Confirmar Resposta
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
