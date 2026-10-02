import React, { useEffect, useState } from 'react';
import { 
  X, Heart, MapPin, CheckCircle, Clock, 
  Share2, ArrowRight, User, Target, Image as ImageIcon,
  Check, Sparkles
} from 'lucide-react';
import { YAHHopeProject } from '../../lib/mockData';
import { useDonationModal } from '../../contexts/DonationModalContext';
import { cn } from '../../lib/utils';

interface ProjectDetailModalProps {
  project: YAHHopeProject | null;
  isOpen: boolean;
  onClose: () => void;
}

export function ProjectDetailModal({ project, isOpen, onClose }: ProjectDetailModalProps) {
  const { openDonationModal } = useDonationModal();
  const [copiedLink, setCopiedLink] = useState(false);
  const [selectedGalleryImage, setSelectedGalleryImage] = useState<string | null>(null);

  // Fechar com a tecla Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (selectedGalleryImage) {
          setSelectedGalleryImage(null);
        } else {
          onClose();
        }
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose, selectedGalleryImage]);

  if (!isOpen || !project) return null;

  const handleShare = async () => {
    const shareUrl = window.location.origin + '/projetos#' + project.id;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${project.title} | YAH Hope`,
          text: project.description,
          url: shareUrl,
        });
        return;
      } catch {
        // Fallback to clipboard
      }
    }

    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    } catch {
      // Fallback
    }
  };

  const handleSupportProject = () => {
    onClose();
    if (project.link && project.link.startsWith('http')) {
      window.open(project.link, '_blank');
      return;
    }
    openDonationModal({
      title: project.title,
      category: project.category,
      tagColor: project.tag_color,
      imageUrl: project.image_url,
      description: project.description,
      link: project.link && project.link !== '/projetos' ? project.link : '/campanha',
    });
  };

  const hasMetrics = Boolean(
    project.location || 
    project.coordinator || 
    project.beneficiaries_target || 
    project.beneficiaries_reached
  );

  return (
    <div 
      className="fixed inset-0 bg-slate-950/75 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white w-full max-w-3xl rounded-[2.5rem] overflow-hidden shadow-2xl border border-slate-100 relative my-auto animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[92vh]">
        
        {/* Cover / Hero Header */}
        <div className="h-72 sm:h-84 relative bg-slate-950 shrink-0 overflow-hidden">
          <img 
            src={project.image_url} 
            alt={project.title} 
            className="w-full h-full object-cover opacity-90 scale-100 hover:scale-105 transition-transform duration-700"
            onError={(e) => {
              (e.target as HTMLImageElement).src = 'https://hope.yahchurch.com/wp-content/uploads/2025/09/HOPE-ALFACES.avif';
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-black/30"></div>

          {/* Top Bar with Badges and Close Button */}
          <div className="absolute top-5 left-5 right-5 flex items-center justify-between z-10">
            <div className="flex items-center gap-2 flex-wrap">
              {project.category && (
                <span 
                  className="text-white text-[11px] font-black uppercase tracking-widest px-3.5 py-1.5 rounded-full shadow-lg"
                  style={{ backgroundColor: project.tag_color || '#F49853' }}
                >
                  {project.category}
                </span>
              )}
              {project.status === 'active' && (
                <span className="bg-emerald-500 text-white text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full flex items-center gap-1 shadow-md">
                  <Heart size={12} /> Em Andamento
                </span>
              )}
              {project.status === 'planned' && (
                <span className="bg-amber-500 text-white text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full flex items-center gap-1 shadow-md">
                  <Clock size={12} /> Planejado
                </span>
              )}
              {project.status === 'completed' && (
                <span className="bg-blue-500 text-white text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full flex items-center gap-1 shadow-md">
                  <CheckCircle size={12} /> Concluído
                </span>
              )}
            </div>

            <button 
              onClick={onClose}
              className="w-10 h-10 rounded-full bg-slate-900/70 hover:bg-slate-900 text-white flex items-center justify-center backdrop-blur-md transition-transform hover:scale-110 cursor-pointer shadow-lg"
              title="Fechar (Esc)"
            >
              <X size={20} />
            </button>
          </div>

          {/* Bottom Title in Hero */}
          <div className="absolute bottom-6 left-6 right-6 z-10 text-white">
            {project.location && (
              <div className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-amber-400 mb-2">
                <MapPin size={14} className="shrink-0" />
                <span>{project.location}</span>
              </div>
            )}
            <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight leading-tight drop-shadow-md">
              {project.title}
            </h2>
          </div>
        </div>

        {/* Scrollable Content Body */}
        <div className="overflow-y-auto p-6 sm:p-8 space-y-6 flex-1">
          
          {/* Impact & Key Indicators Bar */}
          {hasMetrics && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 sm:p-5 rounded-2xl bg-amber-50/50 border border-amber-100">
              {project.location && (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                    <MapPin size={18} />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Polo / Região</span>
                    <span className="text-xs font-bold text-slate-800 leading-tight">{project.location}</span>
                  </div>
                </div>
              )}

              {(project.beneficiaries_reached || project.beneficiaries_target) && (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                    <Target size={18} />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Impacto Direto</span>
                    <span className="text-xs font-bold text-slate-800 leading-tight">
                      {project.beneficiaries_reached || project.beneficiaries_target}
                    </span>
                  </div>
                </div>
              )}

              {project.coordinator && (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0">
                    <User size={18} />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Coordenação Local</span>
                    <span className="text-xs font-bold text-slate-800 leading-tight">{project.coordinator}</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Full Rich Story or Excerpt */}
          <div className="space-y-4">
            {project.full_description ? (
              <div 
                className="text-slate-700 leading-relaxed text-sm sm:text-base space-y-4 font-normal prose max-w-none 
                  [&>h3]:text-lg [&>h3]:font-black [&>h3]:text-slate-900 [&>h3]:mt-6 [&>h3]:mb-2 [&>h3]:tracking-tight
                  [&>p]:leading-relaxed [&>p]:text-slate-600
                  [&>ul]:list-disc [&>ul]:pl-5 [&>ul]:space-y-2 [&>ul]:text-slate-600
                  [&>ol]:list-decimal [&>ol]:pl-5 [&>ol]:space-y-2 [&>ol]:text-slate-600
                  [&>strong]:font-bold [&>strong]:text-slate-900"
                dangerouslySetInnerHTML={{ __html: project.full_description }} 
              />
            ) : (
              <p className="text-slate-600 text-base leading-relaxed">
                {project.description}
              </p>
            )}
          </div>

          {/* Field Photo Gallery */}
          {project.gallery_images && project.gallery_images.length > 0 && (
            <div className="space-y-3 pt-4 border-t border-slate-100">
              <div className="flex items-center gap-2">
                <ImageIcon size={18} className="text-[#F49853]" />
                <h4 className="text-sm font-black text-slate-900 uppercase tracking-tight">
                  Registros & Ações no Campo ({project.gallery_images.length})
                </h4>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {project.gallery_images.map((imgUrl, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSelectedGalleryImage(imgUrl)}
                    className="rounded-2xl overflow-hidden h-32 relative group border border-slate-200 cursor-pointer bg-slate-100 text-left"
                  >
                    <img 
                      src={imgUrl} 
                      alt={`Registro ${idx + 1}`}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://hope.yahchurch.com/wp-content/uploads/2025/09/HOPE-ALFACES.avif';
                      }}
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                      <Sparkles size={20} className="text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Call to Action Box */}
          <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white rounded-3xl p-6 sm:p-7 relative overflow-hidden shadow-xl mt-6">
            <div className="absolute top-0 right-0 -mt-10 -mr-10 w-48 h-48 bg-[#F49853]/20 rounded-full blur-2xl pointer-events-none"></div>
            
            <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
              <div className="max-w-md">
                <span className="text-[10px] font-black uppercase tracking-widest text-[#F49853] block mb-1">
                  Faça Parte da Transformação
                </span>
                <h4 className="text-xl font-black text-white leading-snug">
                  Sua contribuição sustenta a {project.title}
                </h4>
                <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                  Cada doação chega diretamente às famílias e crianças assistidas por este projeto com máxima transparência e amor.
                </p>
              </div>

              <div className="flex items-center gap-2.5 w-full sm:w-auto shrink-0 flex-wrap">
                <button
                  type="button"
                  onClick={handleSupportProject}
                  className="bg-[#F49853] hover:bg-[#e0853d] text-white px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-lg shadow-orange-500/30 cursor-pointer active:scale-95 flex-1 sm:flex-initial"
                >
                  <Heart size={16} fill="white" />
                  <span>Apoiar Este Projeto</span>
                </button>

                <button
                  type="button"
                  onClick={handleShare}
                  className={cn(
                    "px-4 py-3 rounded-2xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer border",
                    copiedLink
                      ? "bg-emerald-600 text-white border-emerald-500"
                      : "bg-white/10 hover:bg-white/20 text-white border-white/15"
                  )}
                  title="Compartilhar projeto"
                >
                  {copiedLink ? <Check size={16} /> : <Share2 size={16} />}
                  <span className="hidden sm:inline">{copiedLink ? 'Link Copiado!' : 'Compartilhar'}</span>
                </button>
              </div>
            </div>
          </div>

        </div>

        {/* Footer with Close Button */}
        <div className="p-4 sm:p-5 border-t border-slate-100 bg-slate-50/80 flex items-center justify-between text-xs">
          <span className="text-slate-400 font-medium">
            YAH Hope International • Amor que Transforma Realidades
          </span>
          <button 
            type="button" 
            onClick={onClose} 
            className="px-4 py-2 rounded-xl font-bold text-slate-600 hover:bg-slate-200 transition-colors cursor-pointer"
          >
            Fechar
          </button>
        </div>

      </div>

      {/* Lightbox Modal for Gallery Images */}
      {selectedGalleryImage && (
        <div 
          className="fixed inset-0 z-60 bg-black/90 flex items-center justify-center p-4 backdrop-blur-md animate-in fade-in"
          onClick={() => setSelectedGalleryImage(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh] rounded-2xl overflow-hidden shadow-2xl">
            <button
              onClick={() => setSelectedGalleryImage(null)}
              className="absolute top-4 right-4 p-2 rounded-full bg-black/70 text-white hover:bg-black transition-colors z-10 cursor-pointer"
            >
              <X size={24} />
            </button>
            <img 
              src={selectedGalleryImage} 
              alt="Ampliação" 
              className="max-h-[85vh] w-auto object-contain mx-auto rounded-xl" 
            />
          </div>
        </div>
      )}
    </div>
  );
}
