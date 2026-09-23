import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Megaphone, 
  Sparkles, 
  BarChart3, 
  Eye, 
  RotateCcw, 
  ExternalLink, 
  CheckCircle2, 
  Save, 
  ArrowRight, 
  X, 
  Check, 
  Palette,
  Heart
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { useTopBanner, TopBannerConfig, DEFAULT_TOP_BANNER } from '../../contexts/TopBannerContext';
import { useConfirm } from '../../contexts/ConfirmContext';

const PRESET_TAG_COLORS = [
  { name: 'Laranja YAH Hope', hex: '#F49853' },
  { name: 'Vermelho Urgente', hex: '#EF4444' },
  { name: 'Verde Esperança', hex: '#92BF78' },
  { name: 'Azul Info', hex: '#88A1F2' },
  { name: 'Amarelo Alerta', hex: '#EBC878' },
];

const PRESET_BG_COLORS = [
  { name: 'Azul Escuro (Padrão)', hex: '#0F172A' },
  { name: 'Preto Grafite', hex: '#18181B' },
  { name: 'Laranja YAH Hope', hex: '#EA580C' },
  { name: 'Verde Escuro', hex: '#14532D' },
  { name: 'Vinho / Carmim', hex: '#881337' },
];

export function TopBannerManager() {
  const { banner, updateBanner, resetToDefaults } = useTopBanner();
  const { confirm } = useConfirm();

  const [formData, setFormData] = useState<TopBannerConfig>(banner);
  const [isSaving, setIsSaving] = useState(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Sync state when context changes
  useEffect(() => {
    setFormData(banner);
  }, [banner]);

  const showToast = (msg: string) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(null), 3500);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.message.trim()) {
      alert('Por favor, informe a mensagem do aviso.');
      return;
    }

    setIsSaving(true);
    try {
      await updateBanner(formData);
      showToast('Aviso do topo salvo com sucesso!');
    } catch (err: any) {
      alert('Erro ao salvar: ' + (err.message || 'Tente novamente'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = async () => {
    const ok = await confirm({
      title: 'Restaurar Aviso Padrão',
      message: 'Deseja restaurar as configurações originais do aviso de topo oficial da YAH Hope?',
      confirmText: 'Restaurar',
      cancelText: 'Cancelar',
      type: 'warning'
    });
    if (ok) {
      await resetToDefaults();
      setFormData(DEFAULT_TOP_BANNER);
      showToast('Aviso padrão restaurado!');
    }
  };

  return (
    <div className="space-y-6 pb-20 font-sans">
      {/* Toast Notification */}
      {successToast && (
        <div className="fixed top-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-xl flex items-center gap-2 border border-slate-700 animate-in fade-in slide-in-from-top-4">
          <CheckCircle2 size={18} className="text-[#92BF78]" />
          <span className="text-sm font-medium">{successToast}</span>
        </div>
      )}

      {/* Navigation Tabs for Landing Page Management */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-3 flex-wrap">
        <Link
          to="/admin/home-highlights"
          className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors flex items-center gap-1.5"
        >
          <Sparkles size={14} />
          <span>Carrossel de Destaques</span>
        </Link>
        <Link
          to="/admin/impact-metrics"
          className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors flex items-center gap-1.5"
        >
          <BarChart3 size={14} />
          <span>Cards de Impacto & Resultados</span>
        </Link>
        <div className="px-4 py-2 rounded-xl text-xs font-bold bg-[#F49853]/15 text-[#F49853] flex items-center gap-1.5 border border-[#F49853]/30">
          <Megaphone size={14} />
          <span>Aviso do Topo (Banner)</span>
        </div>
      </div>

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-orange-50 border border-orange-200 flex items-center justify-center text-[#F49853]">
              <Megaphone size={20} />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">Aviso do Topo da Página Inicial</h1>
              <p className="text-slate-500 text-sm font-medium mt-0.5">
                Configure a mensagem, o selo de urgência e os botões da barra superior da Landing Page.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            type="button"
            onClick={handleReset}
            className="px-3.5 py-2 rounded-xl text-xs font-bold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 transition-colors flex items-center gap-1.5 cursor-pointer"
            title="Redefinir para o aviso padrão"
          >
            <RotateCcw size={14} />
            <span>Restaurar Padrão</span>
          </button>

          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="px-3.5 py-2 rounded-xl text-xs font-bold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 transition-colors flex items-center gap-1.5"
          >
            <Eye size={14} />
            <span>Ver no Site</span>
            <ExternalLink size={12} className="text-slate-400" />
          </a>
        </div>
      </div>

      {/* Live Preview Container */}
      <div className="bg-slate-900/5 p-6 rounded-3xl border border-slate-200">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-black uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
            <Eye size={14} className="text-[#F49853]" />
            Prévia ao Vivo do Banner no Topo
          </span>
          <span className={cn(
            "text-[11px] font-bold px-2.5 py-0.5 rounded-full border",
            formData.enabled 
              ? "bg-emerald-50 text-emerald-700 border-emerald-200" 
              : "bg-rose-50 text-rose-600 border-rose-200"
          )}>
            {formData.enabled ? 'Ativo no Site' : 'Oculto / Desativado'}
          </span>
        </div>

        {/* The Exact Banner Visual */}
        <div 
          className="rounded-2xl py-3 px-5 shadow-lg border border-white/10 transition-all overflow-hidden"
          style={{ 
            backgroundColor: formData.bgColor || '#0F172A',
            color: formData.textColor || '#FFFFFF'
          }}
        >
          <div className="flex flex-wrap items-center justify-between gap-3 text-xs md:text-sm">
            <div className="flex items-center gap-2.5 flex-1 min-w-[280px]">
              {formData.tag && (
                <span 
                  className="text-white font-bold uppercase text-[10px] tracking-wider px-2.5 py-0.5 rounded-full shadow-xs shrink-0"
                  style={{ backgroundColor: formData.tagColor || '#F49853' }}
                >
                  {formData.tag}
                </span>
              )}
              <p className="font-medium truncate" style={{ color: formData.textColor || '#FFFFFF' }}>
                {formData.message || 'Texto do aviso de topo...'}
              </p>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              {formData.buttonText && (
                <div 
                  className="inline-flex items-center gap-1.5 text-white font-bold text-xs uppercase tracking-wider px-4 py-1.5 rounded-full shadow-sm"
                  style={{ backgroundColor: formData.tagColor || '#F49853' }}
                >
                  <span>{formData.buttonText}</span>
                  <ArrowRight size={13} />
                </div>
              )}
              <div className="text-white/60 p-1">
                <X size={16} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Editor Form */}
      <form onSubmit={handleSubmit} className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs space-y-6">
        {/* Toggle Enabled */}
        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-200/80">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Exibir Aviso no Topo</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Se desativado, o banner superior não será exibido para os visitantes da Landing Page.
            </p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input 
              type="checkbox" 
              checked={formData.enabled} 
              onChange={(e) => setFormData({ ...formData, enabled: e.target.checked })} 
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#F49853]"></div>
          </label>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Tag / Badge */}
          <div className="md:col-span-4 space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
              Texto da Tag / Selo
            </label>
            <input 
              type="text" 
              value={formData.tag} 
              onChange={(e) => setFormData({ ...formData, tag: e.target.value })} 
              placeholder="Ex: URGENTE, NOVIDADE, DOAÇÕES" 
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-[#F49853] focus:ring-2 focus:ring-[#F49853]/20 text-sm font-bold text-slate-800 transition-all outline-hidden"
            />
          </div>

          {/* Tag Color Picker */}
          <div className="md:col-span-8 space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
              Cor do Selo e Botão
            </label>
            <div className="flex items-center gap-2 flex-wrap">
              {PRESET_TAG_COLORS.map((c) => (
                <button
                  key={c.hex}
                  type="button"
                  onClick={() => setFormData({ ...formData, tagColor: c.hex })}
                  className={cn(
                    "w-8 h-8 rounded-full border-2 transition-transform hover:scale-110 flex items-center justify-center cursor-pointer",
                    formData.tagColor.toLowerCase() === c.hex.toLowerCase() 
                      ? "border-slate-900 scale-110 shadow-xs" 
                      : "border-slate-200"
                  )}
                  style={{ backgroundColor: c.hex }}
                  title={c.name}
                >
                  {formData.tagColor.toLowerCase() === c.hex.toLowerCase() && (
                    <Check size={14} className="text-white" />
                  )}
                </button>
              ))}
              <div className="flex items-center gap-1.5 ml-2">
                <input 
                  type="color" 
                  value={formData.tagColor} 
                  onChange={(e) => setFormData({ ...formData, tagColor: e.target.value })}
                  className="w-8 h-8 rounded-lg cursor-pointer border border-slate-200" 
                />
                <input 
                  type="text" 
                  value={formData.tagColor} 
                  onChange={(e) => setFormData({ ...formData, tagColor: e.target.value })}
                  className="w-24 px-2 py-1 rounded-lg border border-slate-200 text-xs font-mono text-slate-700 outline-hidden" 
                />
              </div>
            </div>
          </div>
        </div>

        {/* Message */}
        <div className="space-y-1.5">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
            Mensagem do Aviso *
          </label>
          <textarea 
            rows={2}
            value={formData.message} 
            onChange={(e) => setFormData({ ...formData, message: e.target.value })} 
            placeholder="Ex: Moçambique & Casa Nutri: Apoio emergencial a 9 crianças e famílias em risco nutricional" 
            required
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-[#F49853] focus:ring-2 focus:ring-[#F49853]/20 text-sm font-medium text-slate-800 transition-all outline-hidden resize-none leading-relaxed"
          />
        </div>

        {/* Button Configuration */}
        <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-4">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
            Configuração do Botão de Ação
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Texto do Botão
              </label>
              <input 
                type="text" 
                value={formData.buttonText} 
                onChange={(e) => setFormData({ ...formData, buttonText: e.target.value })} 
                placeholder="Ex: Apoiar Agora, Participar, Ver Mais" 
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-[#F49853] focus:ring-2 focus:ring-[#F49853]/20 text-sm font-medium text-slate-800 transition-all outline-hidden bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Ação ao Clicar no Botão
              </label>
              <div className="flex items-center gap-4 pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input 
                    type="radio" 
                    name="buttonActionType"
                    checked={formData.buttonActionType === 'donation_modal'} 
                    onChange={() => setFormData({ ...formData, buttonActionType: 'donation_modal' })} 
                    className="text-[#F49853] focus:ring-[#F49853]"
                  />
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1">
                    <Heart size={12} className="text-[#F49853]" />
                    Abrir Doação Rápida
                  </span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input 
                    type="radio" 
                    name="buttonActionType"
                    checked={formData.buttonActionType === 'custom_link'} 
                    onChange={() => setFormData({ ...formData, buttonActionType: 'custom_link' })} 
                    className="text-[#F49853] focus:ring-[#F49853]"
                  />
                  <span className="text-xs font-bold text-slate-800">
                    Abrir Link / Página
                  </span>
                </label>
              </div>
            </div>
          </div>

          {formData.buttonActionType === 'custom_link' && (
            <div className="pt-2 animate-in fade-in">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Link de Destino
              </label>
              <input 
                type="text" 
                value={formData.buttonLink} 
                onChange={(e) => setFormData({ ...formData, buttonLink: e.target.value })} 
                placeholder="/campanha, /projetos, /blog?post=... ou URL externa" 
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-[#F49853] focus:ring-2 focus:ring-[#F49853]/20 text-sm font-medium text-slate-800 transition-all outline-hidden bg-white"
              />
            </div>
          )}
        </div>

        {/* Background Color Picker */}
        <div className="space-y-2">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
            Cor de Fundo da Barra
          </label>
          <div className="flex items-center gap-2 flex-wrap">
            {PRESET_BG_COLORS.map((c) => (
              <button
                key={c.hex}
                type="button"
                onClick={() => setFormData({ ...formData, bgColor: c.hex })}
                className={cn(
                  "px-3 py-1.5 rounded-xl border text-xs font-bold transition-all flex items-center gap-2 cursor-pointer",
                  formData.bgColor.toLowerCase() === c.hex.toLowerCase() 
                    ? "border-slate-900 ring-2 ring-slate-900/20 text-white" 
                    : "border-slate-200 text-slate-700 hover:border-slate-400"
                )}
                style={{ backgroundColor: c.hex }}
              >
                <span className="text-white text-xs">{c.name}</span>
                {formData.bgColor.toLowerCase() === c.hex.toLowerCase() && (
                  <Check size={14} className="text-white" />
                )}
              </button>
            ))}
            <div className="flex items-center gap-1.5 ml-2">
              <input 
                type="color" 
                value={formData.bgColor} 
                onChange={(e) => setFormData({ ...formData, bgColor: e.target.value })}
                className="w-8 h-8 rounded-lg cursor-pointer border border-slate-200" 
              />
              <input 
                type="text" 
                value={formData.bgColor} 
                onChange={(e) => setFormData({ ...formData, bgColor: e.target.value })}
                className="w-24 px-2 py-1 rounded-lg border border-slate-200 text-xs font-mono text-slate-700 outline-hidden" 
              />
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={() => setFormData(banner)}
            className="px-5 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            Descartar Alterações
          </button>

          <button
            type="submit"
            disabled={isSaving}
            className="bg-[#F49853] hover:bg-[#e0853d] text-white px-7 py-2.5 rounded-xl text-xs font-bold tracking-wide transition-all shadow-md shadow-orange-500/20 flex items-center gap-2 disabled:opacity-50 cursor-pointer"
          >
            <Save size={16} />
            <span>{isSaving ? 'Salvando...' : 'Salvar Alterações'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
