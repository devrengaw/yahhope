import React, { useState } from 'react';
import { 
  Briefcase, 
  MapPin, 
  Users, 
  Heart, 
  ArrowRight, 
  UserCheck, 
  X, 
  Sparkles,
  Info
} from 'lucide-react';
import { useWebsiteProjects } from '../../../contexts/WebsiteProjectsContext';
import { useDonationModal } from '../../../contexts/DonationModalContext';
import { YAHHopeProject } from '../../../lib/mockData';

export function MobileDonorProjects() {
  const { projects, loading } = useWebsiteProjects();
  const { openDonationModal } = useDonationModal();
  const [selectedProject, setSelectedProject] = useState<YAHHopeProject | null>(null);

  // Filter only active projects
  const activeProjects = projects.filter(p => p.status === 'active' || !p.status);

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <Briefcase className="text-amber-500" size={28} />
            Projetos YAH Hope
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 font-medium">
            Conheça as frentes missionárias e como suas doações impactam vidas na prática.
          </p>
        </div>
      </div>

      {/* Projects Grid */}
      {loading ? (
        <div className="flex justify-center items-center py-20">
          <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : activeProjects.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-100 shadow-xs">
          <p className="text-slate-500 text-sm font-medium">Nenhum projeto ativo no momento.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {activeProjects.map((project) => (
            <div
              key={project.id}
              className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-xs hover:shadow-md hover:border-amber-200 transition-all flex flex-col justify-between group"
            >
              <div>
                {/* Image Header */}
                <div className="relative h-48 w-full overflow-hidden bg-slate-100">
                  <img
                    src={project.image_url || 'https://hope.yahchurch.com/wp-content/uploads/2025/09/HOPE-ALFACES.avif'}
                    alt={project.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://hope.yahchurch.com/wp-content/uploads/2025/09/HOPE-ALFACES.avif';
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent"></div>

                  <span
                    className="absolute top-3 left-3 text-white text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-xl shadow-xs"
                    style={{ backgroundColor: project.tag_color || '#F49853' }}
                  >
                    {project.category || 'Missão'}
                  </span>

                  <div className="absolute bottom-3 left-4 right-4 text-white">
                    <h2 className="text-lg font-black leading-snug drop-shadow-xs">{project.title}</h2>
                    {project.location && (
                      <p className="text-xs text-slate-200 flex items-center gap-1 mt-0.5 font-medium drop-shadow-xs">
                        <MapPin size={12} className="text-amber-400 shrink-0" /> {project.location}
                      </p>
                    )}
                  </div>
                </div>

                {/* Content */}
                <div className="p-5 space-y-4">
                  <p className="text-xs text-slate-600 leading-relaxed font-medium line-clamp-3">
                    {project.description}
                  </p>

                  <div className="space-y-2 pt-2 border-t border-slate-100">
                    {project.beneficiaries_reached && (
                      <div className="flex items-center gap-2 text-xs text-emerald-800 bg-emerald-50 px-3 py-2 rounded-xl font-bold">
                        <Users size={15} className="text-emerald-600 shrink-0" />
                        <span className="truncate">{project.beneficiaries_reached}</span>
                      </div>
                    )}

                    {project.coordinator && (
                      <div className="flex items-center gap-2 text-xs text-slate-600 px-3 py-1.5 font-medium">
                        <UserCheck size={14} className="text-amber-500 shrink-0" />
                        <span className="truncate">Coord.: {project.coordinator}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="px-5 pb-5 pt-1 space-y-2">
                <div className="flex gap-2">
                  <button
                    onClick={() => setSelectedProject(project)}
                    className="flex-1 py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold text-xs rounded-xl border border-slate-200 transition-all flex items-center justify-center gap-1.5"
                  >
                    <Info size={14} />
                    <span>Detalhes</span>
                  </button>
                  <button
                    onClick={() => openDonationModal()}
                    className="flex-1 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 text-white font-black text-xs rounded-xl shadow-md shadow-amber-500/20 flex items-center justify-center gap-1.5 transition-all active:scale-[0.98]"
                  >
                    <Heart size={14} fill="currentColor" />
                    <span>Apoiar</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Project Detail Modal */}
      {selectedProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl border border-slate-100">
            {/* Modal Image Header */}
            <div className="relative h-56 w-full shrink-0">
              <img
                src={selectedProject.image_url}
                alt={selectedProject.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent"></div>
              
              <button
                onClick={() => setSelectedProject(null)}
                className="absolute top-4 right-4 bg-black/40 hover:bg-black/60 text-white p-2 rounded-full backdrop-blur-xs transition-all"
              >
                <X size={18} />
              </button>

              <div className="absolute bottom-4 left-6 right-6 text-white">
                <span
                  className="inline-block text-white text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-xl shadow-xs mb-2"
                  style={{ backgroundColor: selectedProject.tag_color || '#F49853' }}
                >
                  {selectedProject.category}
                </span>
                <h3 className="text-xl sm:text-2xl font-black">{selectedProject.title}</h3>
                {selectedProject.location && (
                  <p className="text-xs text-slate-200 flex items-center gap-1 mt-1 font-medium">
                    <MapPin size={13} className="text-amber-400" /> {selectedProject.location}
                  </p>
                )}
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto space-y-4">
              {selectedProject.full_description ? (
                <div 
                  className="prose prose-sm text-slate-600 text-xs sm:text-sm font-medium leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: selectedProject.full_description }}
                />
              ) : (
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-medium">
                  {selectedProject.description}
                </p>
              )}

              {/* Extra Stats */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-slate-100">
                {selectedProject.beneficiaries_reached && (
                  <div className="bg-emerald-50 p-3 rounded-2xl">
                    <span className="text-[10px] uppercase font-black tracking-wider text-emerald-800 block">
                      Alcance Atual
                    </span>
                    <span className="text-xs font-bold text-emerald-950 mt-0.5 block">
                      {selectedProject.beneficiaries_reached}
                    </span>
                  </div>
                )}
                {selectedProject.coordinator && (
                  <div className="bg-amber-50 p-3 rounded-2xl">
                    <span className="text-[10px] uppercase font-black tracking-wider text-amber-800 block">
                      Coordenação
                    </span>
                    <span className="text-xs font-bold text-amber-950 mt-0.5 block">
                      {selectedProject.coordinator}
                    </span>
                  </div>
                )}
              </div>

              {/* Gallery Images if available */}
              {selectedProject.gallery_images && selectedProject.gallery_images.length > 0 && (
                <div className="space-y-2 pt-2">
                  <span className="text-xs font-black text-slate-700">Fotos de Campo</span>
                  <div className="grid grid-cols-3 gap-2">
                    {selectedProject.gallery_images.map((img, idx) => (
                      <img
                        key={idx}
                        src={img}
                        alt="Galeria"
                        className="w-full h-20 object-cover rounded-xl border border-slate-100"
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-5 border-t border-slate-100 bg-slate-50 flex items-center justify-end gap-3 shrink-0">
              <button
                onClick={() => setSelectedProject(null)}
                className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:text-slate-800 transition-all"
              >
                Fechar
              </button>
              <button
                onClick={() => {
                  setSelectedProject(null);
                  openDonationModal();
                }}
                className="px-6 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 text-white font-black text-xs rounded-xl shadow-md shadow-amber-500/20 flex items-center gap-1.5 transition-all"
              >
                <Heart size={14} fill="currentColor" />
                <span>Apoiar este Projeto</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
