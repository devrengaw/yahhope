import React, { useState, useEffect } from 'react';
import { Heart, ArrowRight, MapPin, CheckCircle, Clock } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { YAHHopeProject } from '../../lib/mockData';

export function LocalProjects() {
  const [projects, setProjects] = useState<YAHHopeProject[]>([]);

  useEffect(() => {
    const fetchProjects = async () => {
      const { data } = await supabase.from('website_projects').select('*').order('created_at', { ascending: false });
      if (data) setProjects(data as YAHHopeProject[]);
    };
    fetchProjects();
  }, []);

  const activeProjects = projects.filter(p => p.status === 'active');
  const plannedProjects = projects.filter(p => p.status === 'planned');
  const completedProjects = projects.filter(p => p.status === 'completed');

  const ProjectCard: React.FC<{ project: YAHHopeProject }> = ({ project }) => (
    <div className="bg-white rounded-[2.5rem] border border-slate-100 overflow-hidden shadow-sm hover:shadow-2xl hover:shadow-slate-200/50 transition-all duration-500 group flex flex-col h-full">
      <div className="h-64 overflow-hidden relative">
        <img 
          src={project.image_url} 
          alt={project.title} 
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-slate-900/20 to-transparent"></div>
        <div className="absolute bottom-6 left-6 right-6">
          <div className="flex items-center gap-2 mb-2">
            {project.status === 'active' && <span className="bg-emerald-500 text-white text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full flex items-center gap-1.5"><Heart size={12} /> Em Andamento</span>}
            {project.status === 'planned' && <span className="bg-amber-500 text-white text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full flex items-center gap-1.5"><Clock size={12} /> Planejado</span>}
            {project.status === 'completed' && <span className="bg-blue-500 text-white text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full flex items-center gap-1.5"><CheckCircle size={12} /> Concluído</span>}
          </div>
          <h3 className="text-2xl font-black text-white leading-tight">{project.title}</h3>
        </div>
      </div>
      <div className="p-8 flex flex-col flex-grow">
        <p className="text-slate-500 leading-relaxed mb-8 flex-grow">{project.description}</p>
        <button className="flex items-center justify-between w-full p-4 rounded-2xl bg-slate-50 text-slate-900 hover:bg-slate-900 hover:text-white transition-colors group/btn">
          <span className="font-bold text-sm tracking-tight">Saiba como apoiar</span>
          <ArrowRight size={18} className="group-hover/btn:translate-x-1 transition-transform" />
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-white pt-24 pb-20">
      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-20 text-center">
        <div className="inline-flex items-center justify-center p-3 bg-amber-50 rounded-2xl mb-6">
          <MapPin className="text-amber-500" size={32} />
        </div>
        <h1 className="text-5xl md:text-7xl font-black text-slate-900 tracking-tighter mb-6 uppercase">
          Projetos <span className="text-amber-500">Locais</span>
        </h1>
        <p className="text-xl text-slate-500 max-w-3xl mx-auto leading-relaxed font-medium">
          Conheça as iniciativas da YAH Hope que transformam realidades localmente. De combate à desnutrição a melhorias em infraestrutura, estamos atuando onde a necessidade é mais urgente.
        </p>
      </div>

      {/* Active Projects */}
      {activeProjects.length > 0 && (
        <section className="py-16 bg-slate-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-4 mb-12">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
                <Heart size={24} />
              </div>
              <h2 className="text-3xl font-black text-slate-900 tracking-tight uppercase">Em Andamento</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {activeProjects.map(p => <ProjectCard key={p.id} project={p} />)}
            </div>
          </div>
        </section>
      )}

      {/* Planned Projects */}
      {plannedProjects.length > 0 && (
        <section className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-4 mb-12">
              <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center">
                <Clock size={24} />
              </div>
              <h2 className="text-3xl font-black text-slate-900 tracking-tight uppercase">Próximos Passos</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {plannedProjects.map(p => <ProjectCard key={p.id} project={p} />)}
            </div>
          </div>
        </section>
      )}

      {/* Completed Projects */}
      {completedProjects.length > 0 && (
        <section className="py-16 bg-slate-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-4 mb-12">
              <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center">
                <CheckCircle size={24} />
              </div>
              <h2 className="text-3xl font-black text-slate-900 tracking-tight uppercase">Concluídos</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {completedProjects.map(p => <ProjectCard key={p.id} project={p} />)}
            </div>
          </div>
        </section>
      )}

      {projects.length === 0 && (
        <div className="max-w-3xl mx-auto text-center py-20">
          <div className="w-24 h-24 bg-slate-100 rounded-[2rem] mx-auto flex items-center justify-center mb-6">
            <MapPin className="text-slate-300" size={40} />
          </div>
          <h2 className="text-2xl font-black text-slate-900 mb-4">Nenhum projeto registrado</h2>
          <p className="text-slate-500 text-lg">Em breve divulgaremos as novas iniciativas locais da YAH Hope.</p>
        </div>
      )}
    </div>
  );
}
