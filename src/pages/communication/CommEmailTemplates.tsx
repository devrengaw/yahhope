import React, { useState, useEffect } from 'react';
import { Mail, Save, FileText, CheckCircle2, Image as ImageIcon, Palette, Settings, LayoutTemplate } from 'lucide-react';
import { cn } from '../../lib/utils';

type TemplateType = 'donation_thank_you' | 'accountability';

export function CommEmailTemplates() {
  const [activeTab, setActiveTab] = useState<'settings' | TemplateType>('settings');
  const [isSaved, setIsSaved] = useState(false);

  // Global Settings State
  const [logoUrl, setLogoUrl] = useState('https://yahhope.org/Logo+icone.png');
  const [primaryColor, setPrimaryColor] = useState('#F49853');

  // Templates State
  const [templates, setTemplates] = useState<Record<TemplateType, { subject: string, body: string }>>({
    donation_thank_you: {
      subject: 'Obrigado pela sua doação! 🧡',
      body: `Olá {{nome_doador}},\n\nNós da YAH Hope queremos agradecer de todo o coração pela sua doação. \nO seu apoio é fundamental para continuarmos transformando vidas e levando esperança para quem mais precisa.\n\nCom gratidão,\nEquipe YAH Hope`
    },
    accountability: {
      subject: 'Prestação de Contas: Veja o impacto da sua doação!',
      body: `Olá {{nome_doador}},\n\nÉ com muita alegria que compartilhamos os resultados alcançados neste mês graças ao seu apoio contínuo.\n\nAtravés da sua doação, conseguimos prover centenas de refeições e viabilizar atendimentos médicos essenciais para a nossa comunidade.\n\nAcesse o portal do apoiador para conferir o relatório completo de impacto.\n\nObrigado por fazer a diferença!\nEquipe YAH Hope`
    }
  });

  // Load from local storage for mock
  useEffect(() => {
    try {
      const savedSettings = localStorage.getItem('yah_hope_email_settings');
      if (savedSettings) {
        const parsed = JSON.parse(savedSettings);
        if (parsed) {
          if (parsed.logoUrl) setLogoUrl(parsed.logoUrl);
          if (parsed.primaryColor) setPrimaryColor(parsed.primaryColor);
        }
      }
    } catch (e) {
      console.error('Error parsing email settings', e);
    }

    try {
      const savedTemplates = localStorage.getItem('yah_hope_email_templates');
      if (savedTemplates) {
        const parsed = JSON.parse(savedTemplates);
        if (parsed && typeof parsed === 'object' && parsed.donation_thank_you) {
          setTemplates(parsed);
        }
      }
    } catch (e) {
      console.error('Error parsing email templates', e);
    }
  }, []);

  const handleSave = () => {
    localStorage.setItem('yah_hope_email_settings', JSON.stringify({ logoUrl, primaryColor }));
    localStorage.setItem('yah_hope_email_templates', JSON.stringify(templates));
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  const updateTemplate = (type: TemplateType, field: 'subject' | 'body', value: string) => {
    setTemplates(prev => ({
      ...prev,
      [type]: {
        ...prev[type],
        [field]: value
      }
    }));
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-20">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <Mail className="text-indigo-500" size={32} />
            E-mails Automatizados
          </h1>
          <p className="text-slate-500 mt-2 font-medium">
            Gerencie a identidade visual e os textos dos e-mails enviados pelo sistema.
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
            <><Save size={20} /> Salvar Alterações</>
          )}
        </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar Menu */}
        <div className="w-full lg:w-72 shrink-0 space-y-2">
          <div className="text-xs font-black text-slate-400 uppercase tracking-widest px-4 mb-4">Configurações</div>
          <button
            onClick={() => setActiveTab('settings')}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all text-left",
              activeTab === 'settings' 
                ? "bg-indigo-50 text-indigo-700 shadow-sm border border-indigo-100" 
                : "text-slate-600 hover:bg-slate-50 border border-transparent"
            )}
          >
            <Settings size={20} className={activeTab === 'settings' ? "text-indigo-500" : "text-slate-400"} />
            Identidade Visual
          </button>

          <div className="text-xs font-black text-slate-400 uppercase tracking-widest px-4 mb-4 mt-8">Modelos de E-mail</div>
          <button
            onClick={() => setActiveTab('donation_thank_you')}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all text-left",
              activeTab === 'donation_thank_you' 
                ? "bg-indigo-50 text-indigo-700 shadow-sm border border-indigo-100" 
                : "text-slate-600 hover:bg-slate-50 border border-transparent"
            )}
          >
            <Heart size={20} className={activeTab === 'donation_thank_you' ? "text-rose-500" : "text-slate-400"} />
            Agradecimento de Doação
          </button>
          
          <button
            onClick={() => setActiveTab('accountability')}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all text-left mt-2",
              activeTab === 'accountability' 
                ? "bg-indigo-50 text-indigo-700 shadow-sm border border-indigo-100" 
                : "text-slate-600 hover:bg-slate-50 border border-transparent"
            )}
          >
            <LayoutTemplate size={20} className={activeTab === 'accountability' ? "text-blue-500" : "text-slate-400"} />
            Prestação de Contas
          </button>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden min-h-[500px]">
          
          {/* Settings Tab */}
          {activeTab === 'settings' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="p-8 border-b border-slate-100 bg-slate-50/50">
                <h2 className="text-xl font-black text-slate-900">Identidade Visual (Global)</h2>
                <p className="text-sm text-slate-500 font-medium mt-1">Essas configurações serão aplicadas no cabeçalho de todos os e-mails enviados.</p>
              </div>
              <div className="p-8 space-y-8">
                <label className="block max-w-2xl">
                  <span className="flex items-center gap-2 text-sm font-bold text-slate-700 uppercase tracking-widest mb-2">
                    <ImageIcon size={16} className="text-indigo-500" />
                    URL da Logomarca
                  </span>
                  <input
                    type="url"
                    value={logoUrl}
                    onChange={(e) => setLogoUrl(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-medium focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                    placeholder="https://..."
                  />
                  {logoUrl && (
                    <div className="mt-4 p-4 border border-slate-200 rounded-xl bg-slate-50 inline-block">
                      <p className="text-xs text-slate-400 font-bold mb-2 uppercase">Preview da Logo</p>
                      <img src={logoUrl} alt="Logo Preview" className="h-12 object-contain" />
                    </div>
                  )}
                </label>

                <label className="block max-w-sm">
                  <span className="flex items-center gap-2 text-sm font-bold text-slate-700 uppercase tracking-widest mb-2">
                    <Palette size={16} className="text-indigo-500" />
                    Cor Principal (Hex)
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
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-medium focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all uppercase"
                      placeholder="#F49853"
                    />
                  </div>
                </label>
              </div>
            </div>
          )}

          {/* Template Tabs */}
          {(activeTab === 'donation_thank_you' || activeTab === 'accountability') && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 flex flex-col h-full">
              <div className="p-8 border-b border-slate-100 bg-slate-50/50 flex items-center gap-4">
                <div className={cn(
                  "w-12 h-12 rounded-2xl flex items-center justify-center shrink-0",
                  activeTab === 'donation_thank_you' ? "bg-rose-100 text-rose-600" : "bg-blue-100 text-blue-600"
                )}>
                  {activeTab === 'donation_thank_you' ? <Heart size={24} /> : <FileText size={24} />}
                </div>
                <div>
                  <h2 className="text-xl font-black text-slate-900">
                    {activeTab === 'donation_thank_you' ? 'Agradecimento de Doação' : 'Prestação de Contas Mensal'}
                  </h2>
                  <p className="text-sm text-slate-500 font-medium">
                    {activeTab === 'donation_thank_you' 
                      ? 'Enviado automaticamente após a confirmação de um pagamento no Stripe.' 
                      : 'Enviado em lote pelo módulo Financeiro para atualizar os doadores.'}
                  </p>
                </div>
              </div>

              <div className="p-8 space-y-6 flex-1">
                <label className="block">
                  <span className="text-sm font-bold text-slate-700 uppercase tracking-widest mb-2 block">Assunto do E-mail</span>
                  <input
                    type="text"
                    value={templates[activeTab].subject}
                    onChange={(e) => updateTemplate(activeTab, 'subject', e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-medium focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                  />
                </label>

                <label className="block flex-1">
                  <div className="flex justify-between items-end mb-2">
                    <span className="text-sm font-bold text-slate-700 uppercase tracking-widest">Corpo da Mensagem</span>
                    <span className="text-xs text-slate-400 font-medium bg-slate-100 px-2 py-1 rounded-md">
                      Use <strong className="text-indigo-500 font-bold">{'{{nome_doador}}'}</strong> para o nome
                    </span>
                  </div>
                  <textarea
                    value={templates[activeTab].body}
                    onChange={(e) => updateTemplate(activeTab, 'body', e.target.value)}
                    rows={12}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-4 font-medium focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all resize-none"
                  />
                </label>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
