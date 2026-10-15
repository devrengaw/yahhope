import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Mail, Save, FileText, CheckCircle2, Image as ImageIcon, Palette, 
  Settings, LayoutTemplate, Heart, Eye, Send, Sparkles, Power, Repeat, 
  Clock, Calendar, RefreshCw, AlertCircle, AlertTriangle 
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { supabase } from '../../lib/supabase';
import { RichTextEditor } from '../../components/admin/communication/RichTextEditor';
import { CommEmailCampaigns } from './CommEmailCampaigns';

type TemplateType = 'donation_thank_you' | 'accountability' | 'new_admin_user' | 'new_sponsor';

interface EmailTemplate {
  subject: string;
  preheader: string;
  heading: string;
  body: string;
  has_cta?: boolean;
  cta_text: string;
  cta_url: string;
  is_active: boolean;
  send_frequency: 'monthly' | 'weekly' | 'biweekly' | 'quarterly' | 'manual';
  send_day: number;
  send_time: string;
  last_sent_at?: string | null;
  next_run_at?: string | null;
}

export function CommEmailTemplates() {
  const [viewMode, setViewMode] = useState<'campaigns' | 'templates'>('templates');
  const [activeTab, setActiveTab] = useState<'settings' | TemplateType>('settings');
  const [isSaved, setIsSaved] = useState(false);
  const [isManualDispatching, setIsManualDispatching] = useState(false);

  // Global Settings State
  const [logoUrl, setLogoUrl] = useState('https://hope.yahchurch.com/wp-content/uploads/2025/09/Logo_Laranja-1024x511.png');
  const [logoLinkUrl, setLogoLinkUrl] = useState('https://hope.yahchurch.com');
  const [primaryColor, setPrimaryColor] = useState('#F49853');

  // Templates State
  const [templates, setTemplates] = useState<Record<TemplateType, EmailTemplate>>({
    donation_thank_you: {
      subject: 'Obrigado pelo seu apoio! 🧡 Finalize seu cadastro',
      preheader: 'Crie sua senha de acesso para acompanhar o impacto da sua doação no portal.',
      heading: 'Obrigado por transformar vidas!',
      body: `<p>Olá <strong>{{nome_doador}}</strong>,</p><p><br></p><p>Nós da YAH Hope queremos agradecer de todo o coração pela sua contribuição! Seja através de uma doação pontual, apoio mensal recorrente ou apadrinhamento, o seu gesto garante nutrição, educação e dignidade para as nossas crianças.</p><p><br></p><p>Para acompanhar os relatórios de impacto, ver fotos das nossas crianças e acessar sua área exclusiva, finalize o seu cadastro no portal criando sua senha de acesso:</p><p><br></p><p>Com profunda gratidão,<br>Equipe YAH Hope</p>`,
      has_cta: true,
      cta_text: 'Finalizar Meu Cadastro',
      cta_url: 'https://yahhope.com/finalizar-cadastro',
      is_active: true,
      send_frequency: 'manual',
      send_day: 1,
      send_time: '09:00',
      last_sent_at: null,
      next_run_at: null
    },
    accountability: {
      subject: 'Prestação de Contas: Veja o impacto da sua doação!',
      preheader: 'Relatório mensal de transparência.',
      heading: 'Nosso Impacto Mensal',
      body: `<p>Olá <strong>{{nome_doador}}</strong>,</p><p><br></p><p>É com muita alegria que compartilhamos os resultados alcançados neste mês graças ao seu apoio contínuo.</p><p>Através da sua doação, conseguimos prover centenas de refeições e viabilizar atendimentos médicos essenciais para a nossa comunidade.</p><p><br></p><p>Obrigado por fazer a diferença!<br>Equipe YAH Hope</p>`,
      has_cta: true,
      cta_text: 'Ver Relatório Completo',
      cta_url: 'https://yahhope.com/relatorio',
      is_active: false, // Desligado por padrão para controle total do usuário
      send_frequency: 'monthly',
      send_day: 5,
      send_time: '09:00',
      last_sent_at: null,
      next_run_at: null
    },
    new_admin_user: {
      subject: 'Bem-vindo ao sistema YAH Hope',
      preheader: 'Seu cadastro foi realizado pelo administrador.',
      heading: 'Bem-vindo à equipe!',
      body: `<p>Olá,</p><p><br></p><p>Sua conta no sistema YAH Hope foi criada com sucesso pelo administrador.</p><p>Você já pode acessar o sistema e começar a utilizar as ferramentas disponíveis para a sua função.</p><p><br></p><p>Equipe YAH Hope</p>`,
      has_cta: true,
      cta_text: 'Definir Minha Senha',
      cta_url: 'https://yahhope.com/set-password',
      is_active: true,
      send_frequency: 'manual',
      send_day: 1,
      send_time: '09:00',
      last_sent_at: null,
      next_run_at: null
    },
    new_sponsor: {
      subject: 'Bem-vindo à família YAH Hope! 🧡 Finalize seu cadastro',
      preheader: 'Seu apoio mensal como padrinho e mantenedor transforma vidas.',
      heading: 'Obrigado por se tornar um padrinho!',
      body: `<p>Olá <strong>{{nome_doador}}</strong>,</p><p><br></p><p>Estamos muito felizes em receber você como mantenedor e apadrinhador! Seu apoio mensal será fundamental para garantir alimentação, desenvolvimento e cuidado diário para as crianças.</p><p><br></p><p>Para acompanhar as fotos da criança atendida, novidades e relatórios de transparência, finalize o seu cadastro no portal criando sua senha:</p><p><br></p><p>Com profunda gratidão,<br>Equipe YAH Hope</p>`,
      has_cta: true,
      cta_text: 'Finalizar Cadastro de Padrinho',
      cta_url: 'https://yahhope.com/finalizar-cadastro',
      is_active: true,
      send_frequency: 'manual',
      send_day: 1,
      send_time: '09:00',
      last_sent_at: null,
      next_run_at: null
    }
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const { data: settingsData } = await supabase.from('email_settings').select('*');
      if (settingsData && settingsData.length > 0) {
        const set = settingsData[0];
        if (set.logo_url) {
          setLogoUrl(!set.logo_url.includes('Logo+icone.png') ? set.logo_url : 'https://hope.yahchurch.com/wp-content/uploads/2025/09/Logo_Laranja-1024x511.png');
        }
        if (set.logo_link_url) setLogoLinkUrl(set.logo_link_url);
        if (set.primary_color) setPrimaryColor(set.primary_color);
      }

      const { data: templatesData } = await supabase.from('email_templates').select('*');
      if (templatesData && templatesData.length > 0) {
        setTemplates(prev => {
          const newTemplates = { ...prev };
          templatesData.forEach(t => {
            if (t.name === 'donation_thank_you' || t.name === 'accountability' || t.name === 'new_admin_user' || t.name === 'new_sponsor') {
              newTemplates[t.name] = {
                subject: t.subject || prev[t.name].subject,
                preheader: t.preheader || prev[t.name].preheader,
                heading: t.heading || prev[t.name].heading,
                body: t.body || prev[t.name].body,
                has_cta: t.has_cta ?? prev[t.name].has_cta ?? true,
                cta_text: t.cta_text || prev[t.name].cta_text,
                cta_url: (t.cta_url && !t.cta_url.includes('/login')) ? t.cta_url : prev[t.name].cta_url,
                is_active: t.is_active !== undefined ? Boolean(t.is_active) : prev[t.name].is_active,
                send_frequency: t.send_frequency || prev[t.name].send_frequency || 'monthly',
                send_day: t.send_day ?? prev[t.name].send_day ?? 1,
                send_time: t.send_time || prev[t.name].send_time || '09:00',
                last_sent_at: t.last_sent_at || prev[t.name].last_sent_at,
                next_run_at: t.next_run_at || prev[t.name].next_run_at,
              };
            }
          });
          return newTemplates;
        });
      }
    } catch (e) {
      console.error('Error fetching email settings', e);
    }
  };

  const handleSave = async () => {
    try {
      const { error: settingsErr } = await supabase.from('email_settings').upsert({
        id: '00000000-0000-0000-0000-000000000001',
        logo_url: logoUrl,
        logo_link_url: logoLinkUrl,
        primary_color: primaryColor,
        updated_at: new Date().toISOString()
      });
      if (settingsErr) throw settingsErr;

      const templateTypes: TemplateType[] = ['donation_thank_you', 'accountability', 'new_admin_user', 'new_sponsor'];
      const templatesToUpsert = templateTypes.map(key => ({
        name: key,
        subject: templates[key].subject,
        preheader: templates[key].preheader,
        heading: templates[key].heading,
        body: templates[key].body,
        has_cta: templates[key].has_cta,
        cta_text: templates[key].cta_text,
        cta_url: templates[key].cta_url,
        is_active: templates[key].is_active,
        send_frequency: templates[key].send_frequency,
        send_day: templates[key].send_day,
        send_time: templates[key].send_time,
        updated_at: new Date().toISOString()
      }));

      const { error: templatesErr } = await supabase.from('email_templates').upsert(templatesToUpsert, { onConflict: 'name' });
      if (templatesErr) throw templatesErr;

      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 3000);
    } catch (e: any) {
      console.error('Error saving email settings', e);
      alert('Erro ao salvar no banco (Verifique Permissões/RLS): ' + e.message);
    }
  };

  const handleManualAccountabilityDispatch = async () => {
    if (!window.confirm("Deseja realmente disparar o e-mail de prestação de contas agora para todos os apoiadores ativos da base?")) {
      return;
    }

    setIsManualDispatching(true);
    try {
      const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL || '').replace(/\/$/, '');
      const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

      const response = await fetch(`${supabaseUrl}/functions/v1/send-accountability`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${anonKey}`
        },
        body: JSON.stringify({ manual_force: true })
      });

      const resJson = await response.json().catch(() => ({}));

      if (!response.ok || resJson.error) {
        throw new Error(resJson.error || 'Erro no envio da prestação de contas.');
      }

      alert(`Sucesso! E-mails de prestação de contas disparados para ${resJson.count || 'todos'} apoiadores.`);
      fetchData();
    } catch (err: any) {
      alert('Falha ao disparar prestação de contas: ' + err.message);
    } finally {
      setIsManualDispatching(false);
    }
  };

  const updateTemplate = (type: TemplateType, field: keyof EmailTemplate, value: any) => {
    setTemplates(prev => ({
      ...prev,
      [type]: {
        ...prev[type],
        [field]: value
      }
    }));
  };



  const currentTemplate = activeTab !== 'settings' ? templates[activeTab as TemplateType] : null;

  return (
    <div className="max-w-[1400px] mx-auto space-y-8 pb-20">
      {/* Top Header com Seletor de Abas Limpo */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-3xl border border-slate-100 shadow-sm">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <Mail className="text-amber-500" size={32} />
            Comunicação & E-mail
          </h1>
          <p className="text-slate-500 mt-1 text-sm font-medium">
            Dispare comunicados em massa estilo Mailchimp e gerencie templates de e-mail do sistema.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Alternador de Abas */}
          <div className="flex bg-slate-100 p-1.5 rounded-2xl border border-slate-200">
            <button
              onClick={() => setViewMode('campaigns')}
              className={cn(
                "px-4 py-2 rounded-xl font-bold text-xs sm:text-sm transition-all flex items-center gap-2 cursor-pointer",
                viewMode === 'campaigns'
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              )}
            >
              <Send size={15} className={viewMode === 'campaigns' ? "text-amber-500" : "text-slate-400"} />
              Disparo & Campanhas
            </button>
            <button
              onClick={() => setViewMode('templates')}
              className={cn(
                "px-4 py-2 rounded-xl font-bold text-xs sm:text-sm transition-all flex items-center gap-2 cursor-pointer",
                viewMode === 'templates'
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              )}
            >
              <LayoutTemplate size={15} className={viewMode === 'templates' ? "text-indigo-500" : "text-slate-400"} />
              Templates do Sistema
            </button>
          </div>

          {viewMode === 'templates' && (
            <button
              onClick={handleSave}
              className={cn(
                "px-5 py-2.5 rounded-xl font-black flex items-center gap-2 transition-all shadow-md text-xs sm:text-sm cursor-pointer",
                isSaved 
                  ? "bg-emerald-500 text-white shadow-emerald-500/20" 
                  : "bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-500/20"
              )}
            >
              {isSaved ? (
                <><CheckCircle2 size={18} /> Salvo!</>
              ) : (
                <><Save size={18} /> Salvar Template</>
              )}
            </button>
          )}
        </div>
      </div>

      {viewMode === 'campaigns' ? (
        <CommEmailCampaigns embedded={true} />
      ) : (
        <div className="flex flex-col lg:flex-row gap-6 items-stretch">
        
        {/* COLUNA 1: Lista de Templates */}
        <div className="w-full lg:w-64 shrink-0 bg-white rounded-3xl border border-slate-100 p-4 shadow-sm h-fit">
          <div className="flex items-center gap-2 text-xs font-black text-slate-400 uppercase tracking-widest px-2 mb-4">
            <Settings size={14} /> Lista de Templates
          </div>
          
          <button
            onClick={() => setActiveTab('settings')}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all text-left text-sm",
              activeTab === 'settings' 
                ? "bg-indigo-50 text-indigo-700 shadow-sm border border-indigo-100" 
                : "text-slate-600 hover:bg-slate-50 border border-transparent"
            )}
          >
            <Palette size={18} className={activeTab === 'settings' ? "text-indigo-500" : "text-slate-400"} />
            Marca e Visual
          </button>

          <div className="my-4 border-t border-slate-100"></div>

          <button
            onClick={() => setActiveTab('donation_thank_you')}
            className={cn(
              "w-full flex items-center justify-between px-3.5 py-3 rounded-xl font-bold transition-all text-left text-sm",
              activeTab === 'donation_thank_you' 
                ? "bg-indigo-50 text-indigo-700 shadow-sm border border-indigo-100" 
                : "text-slate-600 hover:bg-slate-50 border border-transparent"
            )}
          >
            <div className="flex items-center gap-2.5 truncate">
              <Heart size={17} className={activeTab === 'donation_thank_you' ? "text-rose-500" : "text-slate-400"} />
              <span className="truncate">Agradecimento</span>
            </div>
            <span className={cn(
              "text-[10px] font-black px-1.5 py-0.5 rounded-md border shrink-0",
              templates.donation_thank_you.is_active 
                ? "bg-emerald-50 text-emerald-700 border-emerald-200" 
                : "bg-slate-100 text-slate-500 border-slate-200"
            )}>
              {templates.donation_thank_you.is_active ? 'Ativo' : 'Off'}
            </span>
          </button>
          
          <button
            onClick={() => setActiveTab('accountability')}
            className={cn(
              "w-full flex items-center justify-between px-3.5 py-3 rounded-xl font-bold transition-all text-left text-sm mt-1",
              activeTab === 'accountability' 
                ? "bg-indigo-50 text-indigo-700 shadow-sm border border-indigo-100" 
                : "text-slate-600 hover:bg-slate-50 border border-transparent"
            )}
          >
            <div className="flex items-center gap-2.5 truncate">
              <LayoutTemplate size={17} className={activeTab === 'accountability' ? "text-blue-500" : "text-slate-400"} />
              <span className="truncate">Prestação de Contas</span>
            </div>
            <span className={cn(
              "text-[10px] font-black px-1.5 py-0.5 rounded-md border shrink-0",
              templates.accountability.is_active 
                ? "bg-emerald-50 text-emerald-700 border-emerald-200" 
                : "bg-slate-100 text-slate-500 border-slate-200"
            )}>
              {templates.accountability.is_active ? 'Ativo' : 'Off'}
            </span>
          </button>
          
          <button
            onClick={() => setActiveTab('new_admin_user')}
            className={cn(
              "w-full flex items-center justify-between px-3.5 py-3 rounded-xl font-bold transition-all text-left text-sm mt-1",
              activeTab === 'new_admin_user' 
                ? "bg-indigo-50 text-indigo-700 shadow-sm border border-indigo-100" 
                : "text-slate-600 hover:bg-slate-50 border border-transparent"
            )}
          >
            <div className="flex items-center gap-2.5 truncate">
              <LayoutTemplate size={17} className={activeTab === 'new_admin_user' ? "text-emerald-500" : "text-slate-400"} />
              <span className="truncate">Novo Usuário</span>
            </div>
            <span className={cn(
              "text-[10px] font-black px-1.5 py-0.5 rounded-md border shrink-0",
              templates.new_admin_user.is_active 
                ? "bg-emerald-50 text-emerald-700 border-emerald-200" 
                : "bg-slate-100 text-slate-500 border-slate-200"
            )}>
              {templates.new_admin_user.is_active ? 'Ativo' : 'Off'}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('new_sponsor')}
            className={cn(
              "w-full flex items-center justify-between px-3.5 py-3 rounded-xl font-bold transition-all text-left text-sm mt-1",
              activeTab === 'new_sponsor' 
                ? "bg-indigo-50 text-indigo-700 shadow-sm border border-indigo-100" 
                : "text-slate-600 hover:bg-slate-50 border border-transparent"
            )}
          >
            <div className="flex items-center gap-2.5 truncate">
              <Heart size={17} className={activeTab === 'new_sponsor' ? "text-amber-500" : "text-slate-400"} />
              <span className="truncate">Apadrinhador</span>
            </div>
            <span className={cn(
              "text-[10px] font-black px-1.5 py-0.5 rounded-md border shrink-0",
              templates.new_sponsor.is_active 
                ? "bg-emerald-50 text-emerald-700 border-emerald-200" 
                : "bg-slate-100 text-slate-500 border-slate-200"
            )}>
              {templates.new_sponsor.is_active ? 'Ativo' : 'Off'}
            </span>
          </button>
        </div>

        {/* COLUNA 2: Campos do Template */}
        <div className="flex-1 bg-white rounded-3xl border border-slate-100 p-6 shadow-sm">
          {activeTab === 'settings' ? (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex items-center gap-2 text-xs font-black text-slate-400 uppercase tracking-widest mb-6">
                <Palette size={14} /> Identidade Visual
              </div>
              
              <div className="space-y-6">
                <label className="block">
                  <span className="flex items-center gap-2 text-sm font-bold text-slate-700 mb-2">
                    <ImageIcon size={16} className="text-slate-400" /> URL do Logo da Instituição
                  </span>
                  <div className="flex gap-4 items-center">
                    {logoUrl && (
                      <div className="bg-slate-50 p-2 rounded-xl border border-slate-200">
                        <img src={logoUrl} alt="Logo" className="h-12 object-contain" />
                      </div>
                    )}
                    <div className="flex-1 flex flex-col gap-2">
                      <input 
                        type="text" 
                        value={logoUrl}
                        onChange={(e) => setLogoUrl(e.target.value)}
                        className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500 text-sm"
                        placeholder="Ex: https://yahhope.com/Logo+icone.png"
                      />
                    </div>
                  </div>
                  <p className="text-xs text-slate-500 mt-2 mb-4">
                    <strong>Atenção:</strong> Insira o link direto de uma imagem hospedada na internet (URL começando com http ou https). O upload direto foi desativado porque provedores como o Gmail bloqueiam imagens inseridas como código (Base64).
                  </p>

                  <span className="flex items-center gap-2 text-sm font-bold text-slate-700 mb-2 mt-4">
                    Link de Destino da Logo (Opcional)
                  </span>
                  <input 
                    type="text" 
                    value={logoLinkUrl}
                    onChange={(e) => setLogoLinkUrl(e.target.value)}
                    className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500"
                    placeholder="Para onde o usuário vai ao clicar na logo? (Ex: https://yahhope.com)"
                  />
                </label>

                <label className="block">
                  <span className="flex items-center gap-2 text-sm font-bold text-slate-700 mb-2">
                    <Palette size={16} className="text-slate-400" />
                    Cor da Marca
                  </span>
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-12 h-12 rounded-xl border border-slate-200 shadow-sm shrink-0" 
                      style={{ backgroundColor: primaryColor }}
                    />
                    <input
                      type="text"
                      value={primaryColor}
                      onChange={(e) => setPrimaryColor(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium uppercase focus:ring-2 focus:ring-indigo-500 outline-none"
                      placeholder="#F49853"
                    />
                  </div>
                </label>
              </div>
            </div>
          ) : (
            currentTemplate && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                {/* CARD DE CONTROLE DE DISPARO E AGENDAMENTO */}
                <div className="bg-gradient-to-br from-slate-50 to-indigo-50/40 border border-slate-200/80 rounded-2xl p-5 mb-7 space-y-4 shadow-sm">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200/60">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "w-10 h-10 rounded-xl flex items-center justify-center transition-all shadow-sm",
                        currentTemplate.is_active ? "bg-emerald-500 text-white shadow-emerald-500/20" : "bg-slate-200 text-slate-500"
                      )}>
                        <Power size={20} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-black text-slate-800">
                            Disparo Automático do E-mail
                          </h4>
                          <span className={cn(
                            "text-[10px] font-black px-2 py-0.5 rounded-full border",
                            currentTemplate.is_active 
                              ? "bg-emerald-100/70 text-emerald-800 border-emerald-300" 
                              : "bg-slate-200/70 text-slate-600 border-slate-300"
                          )}>
                            {currentTemplate.is_active ? 'ATIVADO' : 'DESLIGADO'}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 font-medium mt-0.5">
                          {currentTemplate.is_active 
                            ? 'Este template está ativo e será disparado automaticamente conforme agendamento.' 
                            : 'Envio automático PAUSADO. Nenhum e-mail será disparado aos doadores sem sua ordem expressa.'}
                        </p>
                      </div>
                    </div>

                    {/* BOTÃO LIGAR / DESLIGAR */}
                    <div className="flex items-center gap-2.5 self-end sm:self-auto bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-xs">
                      <span className="text-xs font-bold text-slate-600">
                        {currentTemplate.is_active ? 'Envio Ligado' : 'Envio Desligado'}
                      </span>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={currentTemplate.is_active}
                        onClick={() => updateTemplate(activeTab as TemplateType, 'is_active', !currentTemplate.is_active)}
                        className={cn(
                          "w-12 h-6 flex items-center rounded-full p-0.5 cursor-pointer transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-indigo-400",
                          currentTemplate.is_active ? "bg-emerald-500 justify-end" : "bg-slate-300 justify-start"
                        )}
                        title={currentTemplate.is_active ? 'Clique para desligar' : 'Clique para ligar'}
                      >
                        <span className="bg-white w-5 h-5 rounded-full shadow-md transform transition-transform" />
                      </button>
                    </div>
                  </div>

                  {/* CONFIGURAÇÃO DE FREQUÊNCIA, DATA E HORÁRIO */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-1">
                    {/* Frequência */}
                    <div>
                      <label className="block text-[11px] font-black text-slate-600 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                        <Repeat size={12} className="text-indigo-500" /> Frequência de Envio
                      </label>
                      <select
                        value={currentTemplate.send_frequency || 'monthly'}
                        onChange={(e) => updateTemplate(activeTab as TemplateType, 'send_frequency', e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 shadow-xs"
                      >
                        <option value="monthly">Mensal (Todo mês)</option>
                        <option value="weekly">Semanal (Toda semana)</option>
                        <option value="biweekly">Quinzenal (A cada 15 dias)</option>
                        <option value="quarterly">Trimestral (A cada 3 meses)</option>
                        <option value="manual">Manual / Sob Demanda</option>
                      </select>
                    </div>

                    {/* Dia do Disparo */}
                    <div>
                      <label className="block text-[11px] font-black text-slate-600 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                        <Calendar size={12} className="text-indigo-500" /> Dia do Disparo
                      </label>
                      <select
                        value={currentTemplate.send_day ?? 1}
                        onChange={(e) => updateTemplate(activeTab as TemplateType, 'send_day', Number(e.target.value))}
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 shadow-xs"
                      >
                        <option value="1">Dia 1º do mês</option>
                        <option value="5">Dia 5 do mês</option>
                        <option value="10">Dia 10 do mês</option>
                        <option value="15">Dia 15 do mês</option>
                        <option value="20">Dia 20 do mês</option>
                        <option value="25">Dia 25 do mês</option>
                        <option value="28">Dia 28 do mês</option>
                      </select>
                    </div>

                    {/* Horário */}
                    <div>
                      <label className="block text-[11px] font-black text-slate-600 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                        <Clock size={12} className="text-indigo-500" /> Horário Previsto
                      </label>
                      <input
                        type="time"
                        value={currentTemplate.send_time || '09:00'}
                        onChange={(e) => updateTemplate(activeTab as TemplateType, 'send_time', e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-700 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 shadow-xs"
                      />
                    </div>
                  </div>

                  {/* RODAPÉ DO CARD COM STATUS DO ÚLTIMO DISPARO E BOTÃO MANUAL */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-200/60 text-xs text-slate-500">
                    <div className="flex items-center gap-2">
                      <Clock size={14} className="text-slate-400" />
                      <span>
                        <strong>Último disparo realizado:</strong> {currentTemplate.last_sent_at ? new Date(currentTemplate.last_sent_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Nenhum envio registrado'}
                      </span>
                    </div>

                    {activeTab === 'accountability' && (
                      <button
                        type="button"
                        disabled={isManualDispatching}
                        onClick={handleManualAccountabilityDispatch}
                        className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold transition-all flex items-center gap-1.5 text-xs shadow-sm hover:shadow disabled:opacity-50 cursor-pointer self-start sm:self-auto"
                      >
                        {isManualDispatching ? <RefreshCw size={13} className="animate-spin" /> : <Send size={13} />}
                        Disparar Prestação de Contas Agora
                      </button>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs font-black text-slate-400 uppercase tracking-widest mb-6">
                  <LayoutTemplate size={14} /> Conteúdo e Design do Template
                </div>

                <div className="space-y-5">
                  <label className="block">
                    <span className="block text-sm font-bold text-slate-700 mb-1.5">Assunto (Subject)</span>
                    <input
                      type="text"
                      value={currentTemplate.subject}
                      onChange={(e) => updateTemplate(activeTab, 'subject', e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all"
                    />
                  </label>

                  <label className="block">
                    <span className="block text-sm font-bold text-slate-700 mb-1.5">Texto de Apoio (Preheader)</span>
                    <input
                      type="text"
                      value={currentTemplate.preheader}
                      onChange={(e) => updateTemplate(activeTab, 'preheader', e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all"
                    />
                  </label>

                  <label className="block">
                    <span className="block text-sm font-bold text-slate-700 mb-1.5">Título Interno (Heading)</span>
                    <input
                      type="text"
                      value={currentTemplate.heading}
                      onChange={(e) => updateTemplate(activeTab, 'heading', e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all"
                    />
                  </label>

                  <div className="block">
                    <div className="flex justify-between items-center mb-1.5">
                      <span className="block text-sm font-bold text-slate-700">Corpo do Email</span>
                    </div>
                    <RichTextEditor 
                      value={currentTemplate.body}
                      onChange={(val) => updateTemplate(activeTab, 'body', val)}
                      minHeight="260px"
                    />
                    
                    <div className="mt-3">
                      <p className="text-xs font-bold text-rose-500 flex items-center gap-1 mb-2">
                        📌 Variáveis disponíveis (clique para copiar):
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {['{{nome_doador}}', '{{valor_doacao}}', '{{data}}'].map(v => (
                          <button 
                            key={v}
                            onClick={() => navigator.clipboard.writeText(v)}
                            className="text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 px-2.5 py-1 rounded-full transition-colors border border-slate-200 cursor-pointer"
                            title="Copiar variável"
                          >
                            {v}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-100">
                    <div className="flex items-center justify-between mb-4">
                      <span className="block text-sm font-bold text-slate-700">Botão de Ação (CTA)</span>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={currentTemplate.has_cta ?? true}
                          onChange={(e) => updateTemplate(activeTab, 'has_cta', e.target.checked)}
                          className="w-5 h-5 rounded border-slate-300 text-indigo-500 focus:ring-indigo-500"
                        />
                        <span className="text-sm font-medium text-slate-600">Exibir Botão</span>
                      </label>
                    </div>

                    {(currentTemplate.has_cta ?? true) && (
                      <div className="grid grid-cols-2 gap-4 mt-4 animate-in fade-in slide-in-from-top-2 duration-300">
                        <label className="block">
                          <span className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Texto do Botão</span>
                          <input
                            type="text"
                            value={currentTemplate.cta_text}
                            onChange={(e) => updateTemplate(activeTab, 'cta_text', e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all"
                          />
                        </label>
                        <label className="block">
                          <span className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Link de Destino</span>
                          <input
                            type="text"
                            value={currentTemplate.cta_url}
                            onChange={(e) => updateTemplate(activeTab, 'cta_url', e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all"
                          />
                        </label>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          )}
        </div>

        {/* COLUNA 3: Visualização (Preview) */}
        <div className="w-full lg:w-[450px] shrink-0 bg-slate-50/50 rounded-3xl border border-slate-100 p-6 shadow-inner flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2 text-xs font-black text-slate-400 uppercase tracking-widest">
              <Eye size={14} /> Visualização do Template
            </div>
            <div className="flex bg-white rounded-lg border border-slate-200 p-0.5 shadow-sm">
              <button className="px-3 py-1 text-xs font-bold bg-slate-100 text-slate-900 rounded-md">Visualização</button>
              <button className="px-3 py-1 text-xs font-bold text-slate-400 hover:text-slate-600 rounded-md">Código</button>
            </div>
          </div>

          <div className="flex-1 bg-slate-100 rounded-2xl p-4 md:p-8 flex items-start justify-center overflow-y-auto">
            {/* Corpo do E-mail (Preview) */}
            <div className="w-full max-w-sm bg-white rounded-xl shadow-md overflow-hidden animate-in fade-in zoom-in-95 duration-500">
              
              {/* Header */}
              <div className="px-8 py-10 flex justify-center border-b border-slate-100">
                {logoUrl ? (
                  <img src={logoUrl} alt="Logo" className="h-10 object-contain" />
                ) : (
                  <div className="text-xl font-black text-slate-900 tracking-widest">LOGOTIPO</div>
                )}
              </div>

              {/* Body */}
              <div className="px-8 py-10 text-slate-600 text-sm leading-relaxed">
                {currentTemplate?.heading && (
                  <h1 
                    className="text-xl font-extrabold mb-6"
                    style={{ color: primaryColor }}
                  >
                    {currentTemplate.heading}
                  </h1>
                )}

                <div 
                  className="prose prose-sm prose-slate max-w-none"
                  dangerouslySetInnerHTML={{ __html: currentTemplate?.body || '<p>O corpo do email aparecerá aqui...</p>' }}
                />

                {(currentTemplate?.has_cta ?? true) && currentTemplate?.cta_text && (
                  <div className="mt-8 text-center md:text-left">
                    <a
                      href={currentTemplate.cta_url || '#'}
                      className="inline-block px-6 py-3 rounded-lg font-bold text-white text-sm transition-opacity hover:opacity-90"
                      style={{ backgroundColor: primaryColor }}
                    >
                      {currentTemplate.cta_text}
                    </a>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="px-8 py-6 bg-slate-50 border-t border-slate-100 text-center">
                <p className="text-xs text-slate-400">
                  © {new Date().getFullYear()} YAH Hope. Todos os direitos reservados.
                </p>
              </div>

            </div>
          </div>

        </div>

      </div>
      )}
    </div>
  );
}
