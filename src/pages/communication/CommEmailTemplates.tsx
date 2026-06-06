import React, { useState, useEffect } from 'react';
import { Mail, Save, FileText, CheckCircle2, Image as ImageIcon, Palette, Settings, LayoutTemplate, Heart, Eye } from 'lucide-react';
import { cn } from '../../lib/utils';
import { supabase } from '../../lib/supabase';
import { RichTextEditor } from '../../components/admin/communication/RichTextEditor';

type TemplateType = 'donation_thank_you' | 'accountability';

interface EmailTemplate {
  subject: string;
  preheader: string;
  heading: string;
  body: string;
  has_cta?: boolean;
  cta_text: string;
  cta_url: string;
}

export function CommEmailTemplates() {
  const [activeTab, setActiveTab] = useState<'settings' | TemplateType>('settings');
  const [isSaved, setIsSaved] = useState(false);

  // Global Settings State
  const [logoUrl, setLogoUrl] = useState('https://yahhope.com/Logo+icone.png');
  const [primaryColor, setPrimaryColor] = useState('#F49853');

  // Templates State
  const [templates, setTemplates] = useState<Record<TemplateType, EmailTemplate>>({
    donation_thank_you: {
      subject: 'Obrigado pela sua doação! 🧡',
      preheader: 'Sua doação ajuda a transformar vidas.',
      heading: 'Obrigado pela sua doação!',
      body: `<p>Olá <strong>{{nome_doador}}</strong>,</p><p><br></p><p>Nós da YAH Hope queremos agradecer de todo o coração pela sua doação. O seu apoio é fundamental para continuarmos transformando vidas e levando esperança para quem mais precisa.</p><p><br></p><p>Com gratidão,<br>Equipe YAH Hope</p>`,
      has_cta: true,
      cta_text: 'Acessar meu portal',
      cta_url: 'https://yahhope.com/login'
    },
    accountability: {
      subject: 'Prestação de Contas: Veja o impacto da sua doação!',
      preheader: 'Relatório mensal de transparência.',
      heading: 'Nosso Impacto Mensal',
      body: `<p>Olá <strong>{{nome_doador}}</strong>,</p><p><br></p><p>É com muita alegria que compartilhamos os resultados alcançados neste mês graças ao seu apoio contínuo.</p><p>Através da sua doação, conseguimos prover centenas de refeições e viabilizar atendimentos médicos essenciais para a nossa comunidade.</p><p><br></p><p>Obrigado por fazer a diferença!<br>Equipe YAH Hope</p>`,
      has_cta: true,
      cta_text: 'Ver Relatório Completo',
      cta_url: 'https://yahhope.com/relatorio'
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
        if (set.logo_url) setLogoUrl(set.logo_url);
        if (set.primary_color) setPrimaryColor(set.primary_color);
      }

      const { data: templatesData } = await supabase.from('email_templates').select('*');
      if (templatesData && templatesData.length > 0) {
        setTemplates(prev => {
          const newTemplates = { ...prev };
          templatesData.forEach(t => {
            if (t.name === 'donation_thank_you' || t.name === 'accountability') {
              newTemplates[t.name] = {
                subject: t.subject || prev[t.name].subject,
                preheader: t.preheader || prev[t.name].preheader,
                heading: t.heading || prev[t.name].heading,
                body: t.body || prev[t.name].body,
                has_cta: t.has_cta ?? prev[t.name].has_cta ?? true,
                cta_text: t.cta_text || prev[t.name].cta_text,
                cta_url: t.cta_url || prev[t.name].cta_url,
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
      await supabase.from('email_settings').upsert({
        id: '1',
        logo_url: logoUrl,
        primary_color: primaryColor,
        updated_at: new Date().toISOString()
      });

      await supabase.from('email_templates').upsert([
        {
          name: 'donation_thank_you',
          subject: templates.donation_thank_you.subject,
          preheader: templates.donation_thank_you.preheader,
          heading: templates.donation_thank_you.heading,
          body: templates.donation_thank_you.body,
          has_cta: templates.donation_thank_you.has_cta,
          cta_text: templates.donation_thank_you.cta_text,
          cta_url: templates.donation_thank_you.cta_url,
          updated_at: new Date().toISOString()
        },
        {
          name: 'accountability',
          subject: templates.accountability.subject,
          preheader: templates.accountability.preheader,
          heading: templates.accountability.heading,
          body: templates.accountability.body,
          has_cta: templates.accountability.has_cta,
          cta_text: templates.accountability.cta_text,
          cta_url: templates.accountability.cta_url,
          updated_at: new Date().toISOString()
        }
      ], { onConflict: 'name' });

      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 3000);
    } catch (e) {
      console.error('Error saving email settings', e);
      alert('Erro ao salvar as configurações.');
    }
  };

  const updateTemplate = (type: TemplateType, field: keyof EmailTemplate, value: string | boolean) => {
    setTemplates(prev => ({
      ...prev,
      [type]: {
        ...prev[type],
        [field]: value
      }
    }));
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (file.size > 2 * 1024 * 1024) {
      alert('A imagem da logo deve ter no máximo 2MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setLogoUrl(event.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  const currentTemplate = activeTab !== 'settings' ? templates[activeTab as TemplateType] : null;

  return (
    <div className="max-w-[1400px] mx-auto space-y-8 pb-20">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <Mail className="text-indigo-500" size={32} />
            Editor de E-mails
          </h1>
          <p className="text-slate-500 mt-2 font-medium">
            Gerencie e personalize os e-mails enviados pelo sistema.
          </p>
        </div>
        <button
          onClick={handleSave}
          className={cn(
            "px-6 py-3 rounded-xl font-black flex items-center gap-2 transition-all shadow-lg",
            isSaved 
              ? "bg-emerald-500 text-white shadow-emerald-500/20" 
              : "bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-500/20"
          )}
        >
          {isSaved ? (
            <><CheckCircle2 size={20} /> Salvo com sucesso!</>
          ) : (
            <><Save size={20} /> Salvar Template de E-mail</>
          )}
        </button>
      </div>

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
              "w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all text-left text-sm",
              activeTab === 'donation_thank_you' 
                ? "bg-indigo-50 text-indigo-700 shadow-sm border border-indigo-100" 
                : "text-slate-600 hover:bg-slate-50 border border-transparent"
            )}
          >
            <Heart size={18} className={activeTab === 'donation_thank_you' ? "text-rose-500" : "text-slate-400"} />
            Agradecimento de Doação
          </button>
          
          <button
            onClick={() => setActiveTab('accountability')}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all text-left text-sm mt-1",
              activeTab === 'accountability' 
                ? "bg-indigo-50 text-indigo-700 shadow-sm border border-indigo-100" 
                : "text-slate-600 hover:bg-slate-50 border border-transparent"
            )}
          >
            <LayoutTemplate size={18} className={activeTab === 'accountability' ? "text-blue-500" : "text-slate-400"} />
            Prestação de Contas
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
                    <ImageIcon size={16} className="text-slate-400" />
                    Logomarca (Upload de Imagem)
                  </span>
                  
                  <div className="flex items-center gap-4">
                    {logoUrl ? (
                      <div className="relative group shrink-0">
                        <div className="w-20 h-20 rounded-2xl border-2 border-slate-200 bg-slate-50 flex items-center justify-center overflow-hidden p-2">
                          <img src={logoUrl} alt="Logo" className="w-full h-full object-contain" />
                        </div>
                        <button
                          type="button"
                          onClick={() => setLogoUrl('')}
                          className="absolute -top-2 -right-2 bg-red-500 text-white w-6 h-6 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-xs"
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <div className="w-20 h-20 rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 flex items-center justify-center shrink-0">
                        <ImageIcon size={24} className="text-slate-400" />
                      </div>
                    )}
                    
                    <div className="flex-1">
                      <input
                        type="file"
                        accept="image/png, image/jpeg, image/svg+xml"
                        onChange={handleLogoUpload}
                        className="hidden"
                        id="logo-upload"
                      />
                      <label 
                        htmlFor="logo-upload"
                        className="inline-block px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 cursor-pointer hover:bg-slate-50 hover:border-slate-300 transition-colors shadow-sm"
                      >
                        Escolher Nova Imagem
                      </label>
                      <p className="text-xs text-slate-400 mt-2 font-medium">Recomendado: PNG ou SVG com fundo transparente (Máx: 2MB).</p>
                    </div>
                  </div>
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
                <div className="flex items-center gap-2 text-xs font-black text-slate-400 uppercase tracking-widest mb-6">
                  <LayoutTemplate size={14} /> Campos do Template
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
    </div>
  );
}
