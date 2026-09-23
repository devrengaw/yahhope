import React, { useState, useEffect } from 'react';
import { X, Save, Image as ImageIcon, Check } from 'lucide-react';
import { YAHHopeProject } from '../../lib/mockData';
import { cn } from '../../lib/utils';

const PRESET_COLORS = [
  { name: 'Verde (Nutrição & Saúde)', hex: '#92BF78' },
  { name: 'Azul (Educação Superior)', hex: '#88A1F2' },
  { name: 'Amarelo (Capacitação & Renda)', hex: '#EBC878' },
  { name: 'Laranja (Ação Emergencial)', hex: '#F49853' },
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
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [tagColor, setTagColor] = useState('#F49853');
  const [link, setLink] = useState('/projetos');
  const [status, setStatus] = useState<'active' | 'planned' | 'completed'>('active');
  const [imageUrl, setImageUrl] = useState('');

  useEffect(() => {
    if (editingProject) {
      setTitle(editingProject.title);
      setDescription(editingProject.description);
      setCategory(editingProject.category || 'Geral');
      setTagColor(editingProject.tag_color || '#F49853');
      setLink(editingProject.link || '/projetos');
      setStatus(editingProject.status);
      setImageUrl(editingProject.image_url);
    } else {
      setTitle('');
      setDescription('');
      setCategory('Nutrição & Saúde');
      setTagColor('#92BF78');
      setLink('/projetos');
      setStatus('active');
      setImageUrl('https://hope.yahchurch.com/wp-content/uploads/2025/09/HOPE-ALFACES.avif');
    }
  }, [editingProject, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      title,
      description,
      category,
      tag_color: tagColor,
      link,
      status,
      image_url: imageUrl || 'https://hope.yahchurch.com/wp-content/uploads/2025/09/HOPE-ALFACES.avif'
    });
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[92vh] border border-slate-200">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
          <div>
            <h2 className="text-xl font-black text-slate-900">
              {editingProject ? 'Editar Projeto' : 'Novo Projeto'}
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              Este projeto será exibido em /projetos e na seção "Frentes de Atuação" da Home.
            </p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-slate-400 hover:bg-slate-200 rounded-xl transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto">
          <form id="local-project-form" onSubmit={handleSubmit} className="space-y-5">
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
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium text-slate-800 focus:ring-2 focus:ring-orange-500/20 focus:border-[#F49853] outline-hidden transition-all"
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
                      "w-7 h-7 rounded-full border-2 transition-transform hover:scale-110 flex items-center justify-center",
                      tagColor === c.hex ? "border-slate-900 scale-110 shadow-xs" : "border-slate-200"
                    )}
                    style={{ backgroundColor: c.hex }}
                    title={c.name}
                  >
                    {tagColor === c.hex && <Check size={13} className="text-white" />}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Descrição / Resumo</label>
              <textarea 
                rows={3} 
                value={description} 
                onChange={e => setDescription(e.target.value)} 
                placeholder="Acompanhamento terapêutico e nutricional para recuperar vidas..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium text-slate-800 focus:ring-2 focus:ring-orange-500/20 focus:border-[#F49853] outline-hidden transition-all resize-none"
              ></textarea>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">URL da Imagem de Capa</label>
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

              {/* Quick Image Presets */}
              <div className="flex flex-wrap gap-1.5 mt-2">
                {PRESET_IMAGES.map((img) => (
                  <button
                    key={img.url}
                    type="button"
                    onClick={() => setImageUrl(img.url)}
                    className={cn(
                      "px-2 py-1 rounded-md text-[10px] font-bold border transition-colors",
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

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Link de Destino</label>
              <input 
                type="text" 
                value={link} 
                onChange={e => setLink(e.target.value)} 
                placeholder="/projetos ou /campanha"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium text-slate-800 focus:ring-2 focus:ring-orange-500/20 focus:border-[#F49853] outline-hidden transition-all" 
              />
            </div>

            {imageUrl && (
              <div className="mt-3 rounded-2xl overflow-hidden border border-slate-200 h-40 relative">
                <img 
                  src={imageUrl} 
                  alt="Preview" 
                  className="w-full h-full object-cover" 
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://hope.yahchurch.com/wp-content/uploads/2025/09/HOPE-ALFACES.avif';
                  }} 
                />
                <div className="absolute top-2 left-2">
                  <span 
                    className="text-white text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full shadow-xs"
                    style={{ backgroundColor: tagColor }}
                  >
                    {category}
                  </span>
                </div>
              </div>
            )}
          </form>
        </div>

        <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
          <button 
            type="button" 
            onClick={onClose} 
            className="px-5 py-2.5 rounded-xl font-bold text-xs text-slate-600 hover:bg-slate-200 transition-colors"
          >
            Cancelar
          </button>
          <button 
            type="submit" 
            form="local-project-form" 
            className="bg-[#F49853] hover:bg-[#e0853d] text-white px-7 py-2.5 rounded-xl font-bold text-xs transition-all shadow-md shadow-orange-500/20 flex items-center gap-2"
          >
            <Save size={16} />
            Salvar Projeto
          </button>
        </div>
      </div>
    </div>
  );
}
