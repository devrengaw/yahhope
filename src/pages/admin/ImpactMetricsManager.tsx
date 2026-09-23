import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  BarChart3, 
  Plus, 
  Trash2, 
  Edit3, 
  ArrowUp, 
  ArrowDown, 
  Check, 
  X, 
  ExternalLink, 
  RotateCcw, 
  Eye, 
  Sparkles, 
  CheckCircle2,
  Megaphone
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { useImpactMetrics, ImpactMetricItem } from '../../contexts/ImpactMetricsContext';
import { useConfirm } from '../../contexts/ConfirmContext';
import { ImpactIcon, IMPACT_ICONS_LIST } from '../../components/common/ImpactIcon';

const PRESET_COLORS = [
  { name: 'Verde YAH Hope', hex: '#92BF78' },
  { name: 'Laranja YAH Hope', hex: '#F49853' },
  { name: 'Azul YAH Hope', hex: '#88A1F2' },
  { name: 'Amarelo YAH Hope', hex: '#EBC878' },
  { name: 'Cinza Neutro', hex: '#64748B' },
];

interface FormState {
  metric: string;
  subtitle: string;
  description: string;
  icon: string;
  color: string;
  active: boolean;
}

const INITIAL_FORM: FormState = {
  metric: '',
  subtitle: '',
  description: '',
  icon: 'users',
  color: '#92BF78',
  active: true,
};

export function ImpactMetricsManager() {
  const { 
    metrics, 
    activeMetrics, 
    addMetric, 
    updateMetric, 
    deleteMetric, 
    toggleMetricActive, 
    reorderMetrics, 
    resetToDefaults 
  } = useImpactMetrics();

  const { confirm } = useConfirm();

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | number | null>(null);
  const [formData, setFormData] = useState<FormState>(INITIAL_FORM);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(null), 3500);
  };

  const handleOpenAddModal = () => {
    setEditingId(null);
    setFormData(INITIAL_FORM);
    setModalOpen(true);
  };

  const handleOpenEditModal = (item: ImpactMetricItem) => {
    setEditingId(item.id);
    setFormData({
      metric: item.metric,
      subtitle: item.subtitle,
      description: item.description,
      icon: item.icon || 'users',
      color: item.color || '#92BF78',
      active: item.active !== false
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.metric.trim() || !formData.subtitle.trim()) {
      alert('Por favor, preencha o número/métrica e o subtítulo.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingId !== null) {
        await updateMetric(editingId, {
          metric: formData.metric,
          subtitle: formData.subtitle,
          description: formData.description,
          icon: formData.icon,
          color: formData.color,
          active: formData.active
        });
        showToast('Card de impacto atualizado com sucesso!');
      } else {
        await addMetric({
          metric: formData.metric,
          subtitle: formData.subtitle,
          description: formData.description,
          icon: formData.icon,
          color: formData.color,
          active: formData.active,
          order: metrics.length + 1
        });
        showToast('Novo card de impacto adicionado!');
      }
      setModalOpen(false);
    } catch (err: any) {
      alert('Erro ao salvar card: ' + (err.message || 'Tente novamente'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string | number, metric: string) => {
    const ok = await confirm({
      title: 'Excluir Card de Impacto',
      message: `Tem certeza que deseja excluir o card "${metric}"?`,
      confirmText: 'Excluir',
      cancelText: 'Cancelar',
      type: 'danger'
    });
    if (ok) {
      await deleteMetric(id);
      showToast('Card excluído.');
    }
  };

  const handleReset = async () => {
    const ok = await confirm({
      title: 'Restaurar Cards Padrão',
      message: 'Isso redefinirá a lista para os dados padrão da YAH Hope (9 crianças, 100% transparência e jovens universitários inativo). Deseja continuar?',
      confirmText: 'Restaurar',
      cancelText: 'Cancelar',
      type: 'warning'
    });
    if (ok) {
      await resetToDefaults();
      showToast('Cards padrão restaurados com sucesso!');
    }
  };

  const moveItem = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= metrics.length) return;

    const newArr = [...metrics];
    const temp = newArr[index];
    newArr[index] = newArr[targetIndex];
    newArr[targetIndex] = temp;

    reorderMetrics(newArr);
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
        <div className="px-4 py-2 rounded-xl text-xs font-bold bg-[#F49853]/15 text-[#F49853] flex items-center gap-1.5 border border-[#F49853]/30">
          <BarChart3 size={14} />
          <span>Cards de Impacto & Resultados ({activeMetrics.length} ativos)</span>
        </div>
        <Link
          to="/admin/top-banner"
          className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors flex items-center gap-1.5"
        >
          <Megaphone size={14} />
          <span>Aviso do Topo (Banner)</span>
        </Link>
      </div>

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-[#92BF78]">
              <BarChart3 size={20} />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">Cards de Impacto da Página Inicial</h1>
              <p className="text-slate-500 text-sm font-medium mt-0.5">
                Edite os números e resultados exibidos na seção "O impacto da sua solidariedade".
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={handleReset}
            className="px-3.5 py-2 rounded-xl text-xs font-bold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 transition-colors flex items-center gap-1.5"
            title="Redefinir para os cards padrão"
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

          <button
            onClick={handleOpenAddModal}
            className="bg-[#F49853] hover:bg-[#e0853d] text-white px-4 py-2 rounded-xl text-xs font-bold tracking-wide transition-all shadow-md shadow-orange-500/20 flex items-center gap-2 cursor-pointer"
          >
            <Plus size={16} />
            <span>Adicionar Card</span>
          </button>
        </div>
      </div>

      {/* Current Landing Page Live Preview */}
      <div className="bg-slate-50 p-6 rounded-3xl border border-slate-200/80">
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs font-black uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
            <Eye size={14} className="text-[#F49853]" />
            Como está aparecendo na Landing Page agora ({activeMetrics.length} ativos)
          </span>
          <span className="text-[11px] text-slate-400 font-medium">
            Seção: Resultados Reais & Metas Alcançadas
          </span>
        </div>

        <div className={cn(
          "grid gap-6",
          activeMetrics.length === 1 && "grid-cols-1 max-w-md mx-auto",
          activeMetrics.length === 2 && "grid-cols-1 md:grid-cols-2 max-w-3xl mx-auto",
          activeMetrics.length >= 3 && "grid-cols-1 md:grid-cols-3"
        )}>
          {activeMetrics.map((item) => (
            <div 
              key={item.id}
              className="bg-[#FFFBF7] rounded-3xl p-6 sm:p-7 border transition-all shadow-xs"
              style={{ borderColor: `${item.color}40` }}
            >
              <div 
                className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5"
                style={{ 
                  backgroundColor: `${item.color}20`,
                  color: item.color 
                }}
              >
                <ImpactIcon name={item.icon} size={28} />
              </div>
              <h3 
                className="text-3xl sm:text-4xl font-black mb-2"
                style={{ color: item.color }}
              >
                {item.metric}
              </h3>
              <h4 className="text-sm font-bold text-slate-800 mb-2 leading-snug">
                {item.subtitle}
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                {item.description}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Cards Management List */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
          <div className="flex items-center gap-2">
            <span className="text-xs font-black uppercase tracking-wider text-slate-500">
              Cards Configurados ({metrics.length})
            </span>
            <span className="text-[11px] text-slate-400 font-medium">
              • A ordem e status ativo abaixo controlam a exibição no site
            </span>
          </div>
          <div className="text-xs text-slate-400">
            {metrics.filter(m => m.active !== false).length} ativos / {metrics.filter(m => m.active === false).length} inativos
          </div>
        </div>

        <div className="divide-y divide-slate-100">
          {metrics.map((item, index) => {
            const isActive = item.active !== false;
            return (
              <div 
                key={item.id}
                className={cn(
                  "p-4 sm:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-colors hover:bg-slate-50/80",
                  !isActive && "opacity-60 bg-slate-50/50"
                )}
              >
                {/* Left: Reorder + Icon + Content */}
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  {/* Reorder Buttons */}
                  <div className="flex flex-col gap-1 shrink-0">
                    <button
                      onClick={() => moveItem(index, 'up')}
                      disabled={index === 0}
                      className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-200 disabled:opacity-30 disabled:pointer-events-none transition-colors"
                      title="Mover para cima"
                    >
                      <ArrowUp size={14} />
                    </button>
                    <button
                      onClick={() => moveItem(index, 'down')}
                      disabled={index === metrics.length - 1}
                      className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-200 disabled:opacity-30 disabled:pointer-events-none transition-colors"
                      title="Mover para baixo"
                    >
                      <ArrowDown size={14} />
                    </button>
                  </div>

                  {/* Icon Avatar */}
                  <div 
                    className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 border shadow-xs"
                    style={{ 
                      backgroundColor: `${item.color}15`, 
                      borderColor: `${item.color}40`,
                      color: item.color 
                    }}
                  >
                    <ImpactIcon name={item.icon} size={28} />
                  </div>

                  {/* Details */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span 
                        className="text-lg sm:text-xl font-black"
                        style={{ color: item.color }}
                      >
                        {item.metric}
                      </span>

                      {!isActive && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-rose-50 text-rose-600 border border-rose-200">
                          Inativo / Oculto
                        </span>
                      )}
                      {isActive && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
                          Exibido no Site
                        </span>
                      )}
                    </div>

                    <h4 className="font-bold text-slate-900 text-sm sm:text-base leading-snug">
                      {item.subtitle}
                    </h4>

                    <p className="text-xs text-slate-500 line-clamp-2 mt-1 leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                </div>

                {/* Right Actions */}
                <div className="flex items-center gap-2 self-end md:self-center shrink-0">
                  <button
                    onClick={() => toggleMetricActive(item.id)}
                    className={cn(
                      "px-3 py-1.5 rounded-xl text-xs font-bold transition-all border cursor-pointer",
                      isActive 
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100" 
                        : "bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200"
                    )}
                  >
                    {isActive ? 'Ativo no Site' : 'Inativo'}
                  </button>

                  <button
                    onClick={() => handleOpenEditModal(item)}
                    className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors border border-transparent hover:border-slate-200 cursor-pointer"
                    title="Editar card"
                  >
                    <Edit3 size={16} />
                  </button>

                  <button
                    onClick={() => handleDelete(item.id, item.metric)}
                    className="p-2 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-xl transition-colors border border-transparent hover:border-rose-100 cursor-pointer"
                    title="Excluir card"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Add / Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity" 
            onClick={() => setModalOpen(false)} 
          />

          <div className="relative bg-white rounded-3xl max-w-xl w-full max-h-[92vh] overflow-y-auto shadow-2xl z-10 border border-slate-200">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white/95 backdrop-blur-xs z-20">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-orange-50 border border-orange-200 flex items-center justify-center text-[#F49853]">
                  <BarChart3 size={20} />
                </div>
                <div>
                  <h3 className="font-black text-slate-900 text-lg">
                    {editingId !== null ? 'Editar Card de Impacto' : 'Novo Card de Impacto'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Preencha o número de impacto, subtítulo e escolha a cor e o ícone.
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              {/* Metric Number & Subtitle */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Número / Métrica de Destaque *
                </label>
                <input 
                  type="text" 
                  value={formData.metric} 
                  onChange={(e) => setFormData({ ...formData, metric: e.target.value })} 
                  placeholder="Ex: 9 crianças, 100%, 1.800 refeições, 30 mães" 
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-[#F49853] focus:ring-2 focus:ring-[#F49853]/20 text-base font-bold text-slate-900 transition-all outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Subtítulo / Rótulo de Impacto *
                </label>
                <input 
                  type="text" 
                  value={formData.subtitle} 
                  onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })} 
                  placeholder="Ex: resgatadas da desnutrição aguda na Casa Nutri" 
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-[#F49853] focus:ring-2 focus:ring-[#F49853]/20 text-sm font-medium text-slate-800 transition-all outline-hidden"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Descrição Explicativa
                </label>
                <textarea 
                  rows={3}
                  value={formData.description} 
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })} 
                  placeholder="Descreva o acompanhamento, relatórios ou ações realizadas..." 
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-[#F49853] focus:ring-2 focus:ring-[#F49853]/20 text-sm font-medium text-slate-800 transition-all outline-hidden resize-none leading-relaxed"
                />
              </div>

              {/* Icon Selector */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                  Escolha o Ícone
                </label>
                <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
                  {IMPACT_ICONS_LIST.map((item) => {
                    const isSelected = formData.icon === item.id;
                    const IconComp = item.icon;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setFormData({ ...formData, icon: item.id })}
                        className={cn(
                          "flex flex-col items-center justify-center p-2.5 rounded-xl border transition-all text-xs font-medium cursor-pointer",
                          isSelected 
                            ? "border-slate-900 bg-slate-900 text-white shadow-sm scale-105" 
                            : "border-slate-200 hover:border-slate-300 text-slate-600 bg-white hover:bg-slate-50"
                        )}
                        title={item.label}
                      >
                        <IconComp size={20} />
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Color Selector */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                  Cor de Destaque
                </label>
                <div className="flex items-center gap-2 flex-wrap mb-2">
                  {PRESET_COLORS.map((c) => (
                    <button
                      key={c.hex}
                      type="button"
                      onClick={() => setFormData({ ...formData, color: c.hex })}
                      className={cn(
                        "w-8 h-8 rounded-full border-2 transition-transform hover:scale-110 flex items-center justify-center",
                        formData.color.toLowerCase() === c.hex.toLowerCase() 
                          ? "border-slate-900 scale-110 shadow-xs" 
                          : "border-slate-200"
                      )}
                      style={{ backgroundColor: c.hex }}
                      title={c.name}
                    >
                      {formData.color.toLowerCase() === c.hex.toLowerCase() && (
                        <Check size={14} className="text-white" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Active Toggle */}
              <div className="pt-2">
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={formData.active} 
                    onChange={(e) => setFormData({ ...formData, active: e.target.checked })} 
                    className="w-4 h-4 rounded text-[#F49853] focus:ring-[#F49853] border-slate-300"
                  />
                  <span className="text-xs font-bold text-slate-800">
                    Exibir este card na Landing Page
                  </span>
                </label>
              </div>

              {/* Live Preview Inside Modal */}
              <div className="pt-3 border-t border-slate-100">
                <span className="text-[10px] font-bold uppercase text-slate-400 block mb-2">
                  Prévia do Card:
                </span>
                <div 
                  className="bg-[#FFFBF7] rounded-2xl p-5 border"
                  style={{ borderColor: `${formData.color}40` }}
                >
                  <div 
                    className="w-12 h-12 rounded-xl flex items-center justify-center mb-3"
                    style={{ 
                      backgroundColor: `${formData.color}20`,
                      color: formData.color 
                    }}
                  >
                    <ImpactIcon name={formData.icon} size={24} />
                  </div>
                  <h3 
                    className="text-2xl font-black mb-1"
                    style={{ color: formData.color }}
                  >
                    {formData.metric || '0'}
                  </h3>
                  <h4 className="text-xs font-bold text-slate-800 mb-1 leading-snug">
                    {formData.subtitle || 'Subtítulo do impacto'}
                  </h4>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    {formData.description || 'Descrição detalhada do acompanhamento...'}
                  </p>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:text-slate-800 hover:bg-slate-100 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-[#F49853] hover:bg-[#e0853d] text-white px-6 py-2.5 rounded-xl text-xs font-bold tracking-wide transition-all shadow-md shadow-orange-500/20 disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? 'Salvando...' : editingId !== null ? 'Salvar Alterações' : 'Criar Card'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
