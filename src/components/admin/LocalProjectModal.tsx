import React, { useState, useEffect } from 'react';
import { 
  X, Save, Image as ImageIcon, Check, FileText, BookOpen, 
  BarChart3, Lock, Plus, Trash2, Eye, Edit3, MapPin, 
  User, Target, Heart, Sparkles, ExternalLink, ShieldCheck,
  CheckCircle2, Info
} from 'lucide-react';
import { YAHHopeProject } from '../../lib/mockData';
import { cn } from '../../lib/utils';
import { RichTextEditor } from '../communication/RichTextEditor';

const PRESET_COLORS = [
  { name: 'Verde (Nutrição & Saúde)', hex: '#92BF78' },
  { name: 'Azul (Educação Superior)', hex: '#88A1F2' },
  { name: 'Amarelo (Capacitação & Renda)', hex: '#EBC878' },
  { name: 'Laranja (Ação Emergencial)', hex: '#F49853' },
  { name: 'Roxo (Desenvolvimento)', hex: '#A855F7' },
  { name: 'Cinza Neutro', hex: '#878787' }
];

const PRESET_IMAGES = [
  { label: 'Casa Nutri (Alfaces)', url: 'https://hope.yahchurch.com/wp-content/uploads/2025/09/HOPE-ALFACES.avif' },
  { label: 'Bolsas Universitárias', url: 'https://hope.yahchurch.com/wp-content/uploads/2025/09/IMG5.avif' },
  { label: 'Oficinas & Hortas Mães', url: 'https://hope.yahchurch.com/wp-content/uploads/2025/09/Foto-e1758835419873-827x1024.png' },
  { label: 'Ação Humanitária', url: 'https://hope.yahchurch.com/wp-content/uploads/2025/09/PARTICIPE-DESTA-MISSAO-1.png' },
  { label: 'Saúde Preventiva', url: '/login_bg_real.jpg' }
];

interface LocalProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (project: Omit<YAHHopeProject, 'id' | 'created_at'>) => void;
  editingProject?: YAHHopeProject | null;
}

export function LocalProjectModal({ isOpen, onClose, onSave, editingProject }: LocalProjectModalProps) {
  const [activeTab, setActiveTab] = useState<'card' | 'story' | 'metrics' | 'admin'>('card');
  
  // Tab 1: Card & Basic
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [tagColor, setTagColor] = useState('#F49853');
  const [link, setLink] = useState('/projetos');
  const [status, setStatus] = useState<'active' | 'planned' | 'completed'>('active');
  const [imageUrl, setImageUrl] = useState('');

  // Tab 2: Rich Story / Detailed Content
  const [fullDescription, setFullDescription] = useState('');
  const [previewStory, setPreviewStory] = useState(false);

  // Tab 3: Metrics & Gallery
  const [location, setLocation] = useState('');
  const [coordinator, setCoordinator] = useState('');
  const [beneficiariesTarget, setBeneficiariesTarget] = useState('');
  const [beneficiariesReached, setBeneficiariesReached] = useState('');
  const [galleryImages, setGalleryImages] = useState<string[]>([]);
  const [newGalleryUrl, setNewGalleryUrl] = useState('');

  // Tab 4: Internal Admin Notes (Private)
  const [adminNotes, setAdminNotes] = useState('');

  useEffect(() => {
    if (editingProject) {
      setTitle(editingProject.title || '');
      setDescription(editingProject.description || '');
      setFullDescription(editingProject.full_description || editingProject.description || '');
      setCategory(editingProject.category || 'Geral');
      setTagColor(editingProject.tag_color || '#F49853');
      setLink(editingProject.link || '/projetos');
      setStatus(editingProject.status || 'active');
      setImageUrl(editingProject.image_url || '');
      setLocation(editingProject.location || '');
      setCoordinator(editingProject.coordinator || '');
      setBeneficiariesTarget(editingProject.beneficiaries_target || '');
      setBeneficiariesReached(editingProject.beneficiaries_reached || '');
      setGalleryImages(editingProject.gallery_images || []);
      setAdminNotes(editingProject.admin_notes || '');
    } else {
      setTitle('');
      setDescription('');
      setFullDescription('');
      setCategory('Nutrição & Saúde');
      setTagColor('#92BF78');
      setLink('/projetos');
      setStatus('active');
      setImageUrl('https://hope.yahchurch.com/wp-content/uploads/2025/09/HOPE-ALFACES.avif');
      setLocation('Moçambique');
      setCoordinator('');
      setBeneficiariesTarget('');
      setBeneficiariesReached('');
      setGalleryImages([]);
      setAdminNotes('');
    }
    setActiveTab('card');
    setPreviewStory(false);
  }, [editingProject, isOpen]);

  if (!isOpen) return null;

  const handleAddGalleryImage = (urlToAdd?: string) => {
    const url = urlToAdd || newGalleryUrl.trim();
    if (url && !galleryImages.includes(url)) {
      setGalleryImages([...galleryImages, url]);
      if (!urlToAdd) setNewGalleryUrl('');
    }
  };

  const handleRemoveGalleryImage = (indexToRemove: number) => {
    setGalleryImages(galleryImages.filter((_, idx) => idx !== indexToRemove));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setActiveTab('card');
      alert('Por favor, informe o título do projeto.');
      return;
    }

    onSave({
      title: title.trim(),
      description: description.trim(),
      full_description: fullDescription.trim(),
      category: category.trim() || 'Geral',
      tag_color: tagColor,
      link: link.trim() || '/projetos',
      status,
      image_url: imageUrl || 'https://hope.yahchurch.com/wp-content/uploads/2025/09/HOPE-ALFACES.avif',
      location: location.trim(),
      coordinator: coordinator.trim(),
      beneficiaries_target: beneficiariesTarget.trim(),
      beneficiaries_reached: beneficiariesReached.trim(),
      gallery_images: galleryImages,
      admin_notes: adminNotes.trim()
    });
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[92vh] border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/90">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-orange-100 text-[#F49853] flex items-center justify-center border border-orange-200/80">
              <Heart size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-black text-slate-900">
                  {editingProject ? 'Gerenciar & Editar Projeto' : 'Novo Projeto Local'}
                </h2>
                {status === 'active' && (
                  <span className="hidden sm:inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700">
                    Ativo
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Configure os dados para o card público, a história detalhada e notas exclusivas da administração.
              </p>
            </div>
          </div>

          <button 
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
            title="Fechar (Esc)"
          >
            <X size={20} />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 px-5 pt-3 border-b border-slate-200 bg-slate-50/50 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('card')}
            className={cn(
              "px-4 py-2.5 rounded-t-xl text-xs font-bold transition-all flex items-center gap-2 border-b-2 shrink-0 cursor-pointer",
              activeTab === 'card'
                ? "border-[#F49853] text-[#F49853] bg-white shadow-xs"
                : "border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-100"
            )}
          >
            <FileText size={15} />
            <span>1. Card & Informações Básicas</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('story')}
            className={cn(
              "px-4 py-2.5 rounded-t-xl text-xs font-bold transition-all flex items-center gap-2 border-b-2 shrink-0 cursor-pointer",
              activeTab === 'story'
                ? "border-[#F49853] text-[#F49853] bg-white shadow-xs"
                : "border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-100"
            )}
          >
            <BookOpen size={15} />
            <span>2. História & Detalhamento Rico</span>
            {fullDescription && <span className="w-2 h-2 rounded-full bg-emerald-500"></span>}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('metrics')}
            className={cn(
              "px-4 py-2.5 rounded-t-xl text-xs font-bold transition-all flex items-center gap-2 border-b-2 shrink-0 cursor-pointer",
              activeTab === 'metrics'
                ? "border-[#F49853] text-[#F49853] bg-white shadow-xs"
                : "border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-100"
            )}
          >
            <BarChart3 size={15} />
            <span>3. Indicadores & Galeria</span>
            {galleryImages.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-slate-200 text-slate-700 text-[10px]">
                {galleryImages.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('admin')}
            className={cn(
              "px-4 py-2.5 rounded-t-xl text-xs font-bold transition-all flex items-center gap-2 border-b-2 shrink-0 cursor-pointer",
              activeTab === 'admin'
                ? "border-amber-500 text-amber-700 bg-white shadow-xs"
                : "border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-100"
            )}
          >
            <Lock size={15} className="text-amber-500" />
            <span>4. Admin Interno (Sigiloso)</span>
            {adminNotes && <span className="w-2 h-2 rounded-full bg-amber-500"></span>}
          </button>
        </div>

        {/* Form Body */}
        <div className="p-5 sm:p-7 overflow-y-auto flex-1">
          <form id="local-project-form" onSubmit={handleSubmit} className="space-y-6">
            
            {/* TAB 1: Card & Basic Info */}
            {activeTab === 'card' && (
              <div className="space-y-5 animate-in fade-in duration-150">
                <div className="bg-amber-50/70 border border-amber-200/70 p-3.5 rounded-2xl flex items-start gap-2.5 text-xs text-amber-800">
                  <Info size={16} className="text-amber-600 shrink-0 mt-0.5" />
                  <p>
                    Estas informações definem como o projeto aparece no card da grade pública (em <strong>/projetos</strong> e na seção de frentes da Home).
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Título do Projeto *</label>
                  <input 
                    required 
                    type="text" 
                    value={title} 
                    onChange={e => setTitle(e.target.value)} 
                    placeholder="Ex: Casa Nutri & Saúde Infantil"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-orange-500/20 focus:border-[#F49853] outline-hidden transition-all" 
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Categoria / Tag</label>
                    <input 
                      type="text" 
                      value={category} 
                      onChange={e => setCategory(e.target.value)} 
                      placeholder="Ex: Nutrição & Saúde"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium text-slate-800 focus:ring-2 focus:ring-orange-500/20 focus:border-[#F49853] outline-hidden transition-all" 
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Status</label>
                    <select 
                      value={status} 
                      onChange={e => setStatus(e.target.value as 'active' | 'planned' | 'completed')}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium text-slate-800 focus:ring-2 focus:ring-orange-500/20 focus:border-[#F49853] outline-hidden transition-all cursor-pointer"
                    >
                      <option value="active">Em Andamento (Ativo)</option>
                      <option value="planned">Próximos Passos (Planejado)</option>
                      <option value="completed">Concluído</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Cor de Destaque da Tag
                  </label>
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    {PRESET_COLORS.map(c => (
                      <button
                        key={c.hex}
                        type="button"
                        onClick={() => setTagColor(c.hex)}
                        className={cn(
                          "w-7 h-7 rounded-full border-2 transition-transform hover:scale-110 flex items-center justify-center cursor-pointer",
                          tagColor === c.hex ? "border-slate-900 scale-110 shadow-xs" : "border-slate-200"
                        )}
                        style={{ backgroundColor: c.hex }}
                        title={c.name}
                      >
                        {tagColor === c.hex && <Check size={13} className="text-white" />}
                      </button>
                    ))}
                    <div className="flex items-center gap-1.5 ml-2">
                      <input 
                        type="color" 
                        value={tagColor} 
                        onChange={e => setTagColor(e.target.value)} 
                        className="w-7 h-7 rounded-lg border border-slate-200 cursor-pointer p-0.5 bg-white"
                      />
                      <span className="text-xs text-slate-500 font-mono">{tagColor}</span>
                    </div>
                  </div>
                </div>

                {/* Localização / País */}
                <div className="space-y-1.5 p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                      <MapPin size={14} className="text-amber-500" />
                      Localização / Polo de Atuação
                    </label>
                    <span className="text-[11px] text-slate-400">
                      Define a aba e o alcance público
                    </span>
                  </div>
                  <input 
                    type="text" 
                    value={location} 
                    onChange={e => setLocation(e.target.value)} 
                    placeholder="Ex: Moçambique (Nampula) ou Brasil (São Paulo)"
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm font-medium text-slate-800 focus:ring-2 focus:ring-orange-500/20 focus:border-[#F49853] outline-hidden transition-all" 
                  />
                  {/* Atalhos Rápidos */}
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <span className="text-[11px] font-bold text-slate-400">Atalhos rápidos:</span>
                    <button
                      type="button"
                      onClick={() => setLocation('Moçambique (Nampula)')}
                      className={cn(
                        "px-2.5 py-1 rounded-lg text-xs font-bold border transition-colors cursor-pointer flex items-center gap-1.5",
                        location.toLowerCase().includes('moçambique') || location.toLowerCase().includes('mocambique')
                          ? "bg-amber-100 text-amber-900 border-amber-300"
                          : "bg-white text-slate-600 border-slate-200 hover:bg-slate-100"
                      )}
                    >
                      <span>🇲🇿 Moçambique (Nampula)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setLocation('Brasil (São Paulo)')}
                      className={cn(
                        "px-2.5 py-1 rounded-lg text-xs font-bold border transition-colors cursor-pointer flex items-center gap-1.5",
                        location.toLowerCase().includes('brasil')
                          ? "bg-blue-100 text-blue-900 border-blue-300"
                          : "bg-white text-slate-600 border-slate-200 hover:bg-slate-100"
                      )}
                    >
                      <span>🇧🇷 Brasil (São Paulo)</span>
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Resumo Curto do Card (Apresentação Rápida)
                    </label>
                    <span className="text-[11px] font-medium text-slate-400">
                      {description.length} caracteres (recomendado até 150)
                    </span>
                  </div>
                  <textarea 
                    rows={3} 
                    value={description} 
                    onChange={e => setDescription(e.target.value)} 
                    placeholder="Acompanhamento terapêutico e nutricional para resgatar vidas com amor e saúde..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium text-slate-800 focus:ring-2 focus:ring-orange-500/20 focus:border-[#F49853] outline-hidden transition-all resize-none"
                  ></textarea>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">URL da Imagem de Capa Principal</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <ImageIcon size={16} className="text-slate-400" />
                    </div>
                    <input 
                      type="text" 
                      value={imageUrl} 
                      onChange={e => setImageUrl(e.target.value)} 
                      placeholder="https://..."
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2.5 text-sm font-medium text-slate-800 focus:ring-2 focus:ring-orange-500/20 focus:border-[#F49853] outline-hidden transition-all" 
                    />
                  </div>

                  {/* Presets */}
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    <span className="text-[11px] font-bold text-slate-400 py-1 mr-1">Presets YAH Hope:</span>
                    {PRESET_IMAGES.map((img) => (
                      <button
                        key={img.url}
                        type="button"
                        onClick={() => setImageUrl(img.url)}
                        className={cn(
                          "px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-colors cursor-pointer",
                          imageUrl === img.url
                            ? "bg-orange-100 text-orange-800 border-orange-300"
                            : "bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200"
                        )}
                      >
                        {img.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Preview Mini Card */}
                {imageUrl && (
                  <div className="mt-3 rounded-2xl overflow-hidden border border-slate-200 h-44 relative bg-slate-900 group">
                    <img 
                      src={imageUrl} 
                      alt="Preview" 
                      className="w-full h-full object-cover opacity-80" 
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://hope.yahchurch.com/wp-content/uploads/2025/09/HOPE-ALFACES.avif';
                      }} 
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent"></div>
                    <div className="absolute top-3 left-3 flex items-center gap-2">
                      <span 
                        className="text-white text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full shadow-md"
                        style={{ backgroundColor: tagColor }}
                      >
                        {category || 'Categoria'}
                      </span>
                    </div>
                    <div className="absolute bottom-3 left-4 right-4 text-white">
                      <h4 className="text-base font-black truncate">{title || 'Título do Projeto'}</h4>
                      <p className="text-xs text-slate-300 line-clamp-1 mt-0.5">{description || 'Resumo do projeto...'}</p>
                    </div>
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Link Opcional de Redirecionamento</label>
                  <input 
                    type="text" 
                    value={link} 
                    onChange={e => setLink(e.target.value)} 
                    placeholder="/projetos ou link externo"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium text-slate-800 focus:ring-2 focus:ring-orange-500/20 focus:border-[#F49853] outline-hidden transition-all" 
                  />
                </div>
              </div>
            )}

            {/* TAB 2: Rich Story / Detailed Content */}
            {activeTab === 'story' && (
              <div className="space-y-4 animate-in fade-in duration-150">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pb-2 border-b border-slate-100">
                  <div>
                    <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
                      <Sparkles size={16} className="text-[#F49853]" />
                      História Completa & Apresentação do Projeto
                    </h3>
                    <p className="text-xs text-slate-500 font-medium">
                      Este texto é renderizado com alta elegância quando o visitante clica no card do projeto na página pública.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setPreviewStory(!previewStory)}
                    className={cn(
                      "px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border cursor-pointer",
                      previewStory
                        ? "bg-slate-900 text-white border-slate-900"
                        : "bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200"
                    )}
                  >
                    {previewStory ? <Edit3 size={13} /> : <Eye size={13} />}
                    <span>{previewStory ? 'Voltar para Edição' : 'Pré-visualizar Apresentação'}</span>
                  </button>
                </div>

                {previewStory ? (
                  <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 min-h-[300px]">
                    <div className="max-w-2xl mx-auto prose prose-slate">
                      <div className="text-xs font-bold text-[#F49853] uppercase tracking-widest mb-1">
                        Pré-visualização do Leitor
                      </div>
                      <h2 className="text-2xl font-black text-slate-900 mb-4">{title || 'Título do Projeto'}</h2>
                      {fullDescription ? (
                        <div 
                          className="text-slate-700 leading-relaxed space-y-4 font-normal"
                          dangerouslySetInnerHTML={{ __html: fullDescription }} 
                        />
                      ) : (
                        <p className="text-slate-400 italic">Nenhum texto detalhado cadastrado ainda. O leitor verá o resumo padrão.</p>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <RichTextEditor 
                      content={fullDescription} 
                      onChange={setFullDescription} 
                      placeholder="Conte a história do projeto, suas necessidades, como as doações são aplicadas, depoimentos e objetivos alcançados..."
                    />
                    <p className="text-[11px] text-slate-400 font-medium">
                      Dica: você pode formatar com títulos, listas, negrito e cores para criar uma leitura atraente aos apoiadores.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: Metrics & Gallery */}
            {activeTab === 'metrics' && (
              <div className="space-y-6 animate-in fade-in duration-150">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                      <MapPin size={14} className="text-amber-500" />
                      Local / Polo de Atuação
                    </label>
                    <input 
                      type="text" 
                      value={location} 
                      onChange={e => setLocation(e.target.value)} 
                      placeholder="Ex: Moçambique, África / São Paulo, Brasil"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium text-slate-800 focus:ring-2 focus:ring-orange-500/20 focus:border-[#F49853] outline-hidden transition-all" 
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                      <User size={14} className="text-indigo-500" />
                      Coordenação / Responsável Local
                    </label>
                    <input 
                      type="text" 
                      value={coordinator} 
                      onChange={e => setCoordinator(e.target.value)} 
                      placeholder="Ex: Dra. Sarah M. (Nutrição)"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium text-slate-800 focus:ring-2 focus:ring-orange-500/20 focus:border-[#F49853] outline-hidden transition-all" 
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                      <Target size={14} className="text-orange-500" />
                      Meta de Beneficiários
                    </label>
                    <input 
                      type="text" 
                      value={beneficiariesTarget} 
                      onChange={e => setBeneficiariesTarget(e.target.value)} 
                      placeholder="Ex: 50 crianças recuperadas"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium text-slate-800 focus:ring-2 focus:ring-orange-500/20 focus:border-[#F49853] outline-hidden transition-all" 
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                      <CheckCircle2 size={14} className="text-emerald-500" />
                      Beneficiários Atendidos até o Momento
                    </label>
                    <input 
                      type="text" 
                      value={beneficiariesReached} 
                      onChange={e => setBeneficiariesReached(e.target.value)} 
                      placeholder="Ex: 38 crianças em acompanhamento"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium text-slate-800 focus:ring-2 focus:ring-orange-500/20 focus:border-[#F49853] outline-hidden transition-all" 
                    />
                  </div>
                </div>

                {/* Additional Gallery Photos */}
                <div className="space-y-3 pt-4 border-t border-slate-100">
                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                        <ImageIcon size={14} className="text-blue-500" />
                        Galeria de Fotos do Projeto ({galleryImages.length})
                      </h4>
                      <p className="text-[11px] text-slate-500">
                        Fotos que serão exibidas em destaque para os visitantes conhecerem a rotina do projeto.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      value={newGalleryUrl} 
                      onChange={e => setNewGalleryUrl(e.target.value)} 
                      placeholder="Cole a URL da foto (https://...)"
                      className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm font-medium text-slate-800 focus:ring-2 focus:ring-orange-500/20 focus:border-[#F49853] outline-hidden"
                    />
                    <button
                      type="button"
                      onClick={() => handleAddGalleryImage()}
                      className="bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                    >
                      <Plus size={14} /> Adicionar
                    </button>
                  </div>

                  {/* Gallery Grid */}
                  {galleryImages.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3">
                      {galleryImages.map((img, idx) => (
                        <div key={idx} className="relative rounded-xl overflow-hidden h-28 border border-slate-200 group bg-slate-100">
                          <img 
                            src={img} 
                            alt={`Galeria ${idx + 1}`} 
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform" 
                          />
                          <button
                            type="button"
                            onClick={() => handleRemoveGalleryImage(idx)}
                            className="absolute top-1.5 right-1.5 p-1 rounded-lg bg-red-600 text-white shadow-md hover:bg-red-700 transition-colors opacity-90 hover:opacity-100 cursor-pointer"
                            title="Remover foto"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-6 bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-xs text-slate-400">
                      Nenhuma foto adicional adicionada à galeria.
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB 4: Internal Admin Notes (Private) */}
            {activeTab === 'admin' && (
              <div className="space-y-4 animate-in fade-in duration-150">
                <div className="bg-amber-500/10 border border-amber-500/30 p-4 rounded-2xl flex items-start gap-3 text-amber-900">
                  <div className="w-8 h-8 rounded-xl bg-amber-500/20 flex items-center justify-center shrink-0 text-amber-700">
                    <ShieldCheck size={18} />
                  </div>
                  <div>
                    <h4 className="text-xs font-black uppercase tracking-wider text-amber-800">
                      Área Exclusiva da Administração (Uso Interno Sigiloso)
                    </h4>
                    <p className="text-xs text-amber-700/90 mt-0.5 leading-relaxed">
                      Nenhuma das anotações abaixo é visível aos visitantes no site. Utilize este espaço para relatórios confidenciais, contatos de fornecedores locais, logística, prestação de contas internas e histórico de auditoria.
                    </p>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Prontuário & Notas Internas do Projeto
                  </label>
                  <textarea 
                    rows={8} 
                    value={adminNotes} 
                    onChange={e => setAdminNotes(e.target.value)} 
                    placeholder="Ex: Fornecedor de insumos: Farmácia Central Maputo (contato: Sr. Amílcar). Próxima remessa de fórmulas agendada para 15/11. Reunião de alinhamento com conselho local pendente..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-sm font-medium text-slate-800 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-hidden transition-all leading-relaxed"
                  ></textarea>
                </div>
              </div>
            )}

          </form>
        </div>

        {/* Footer */}
        <div className="p-5 sm:p-6 border-t border-slate-100 bg-slate-50 flex items-center justify-between gap-3">
          <div className="text-xs text-slate-400 font-medium hidden sm:block">
            {activeTab === 'card' && 'Etapa 1 de 4: Apresentação básica'}
            {activeTab === 'story' && 'Etapa 2 de 4: Conteúdo enriquecido'}
            {activeTab === 'metrics' && 'Etapa 3 de 4: Indicadores de impacto'}
            {activeTab === 'admin' && 'Etapa 4 de 4: Gestão administrativa interna'}
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            <button 
              type="button" 
              onClick={onClose} 
              className="px-5 py-2.5 rounded-xl font-bold text-xs text-slate-600 hover:bg-slate-200 transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button 
              type="submit" 
              form="local-project-form" 
              className="bg-[#F49853] hover:bg-[#e0853d] text-white px-7 py-2.5 rounded-xl font-bold text-xs transition-all shadow-md shadow-orange-500/20 flex items-center gap-2 cursor-pointer active:scale-95"
            >
              <Save size={16} />
              Salvar Projeto
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
