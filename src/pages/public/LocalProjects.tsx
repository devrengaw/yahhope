import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Heart, ArrowRight, MapPin, CheckCircle, Clock, Globe2, Building2, Users, Sparkles } from 'lucide-react';
import { useWebsiteProjects } from '../../contexts/WebsiteProjectsContext';
import { YAHHopeProject } from '../../lib/mockData';
import { SEO } from '../../components/common/SEO';
import { ProjectDetailModal } from '../../components/public/ProjectDetailModal';

export function LocalProjects() {
  const { projects } = useWebsiteProjects();
  const [selectedProject, setSelectedProject] = useState<YAHHopeProject | null>(null);
  const [searchParams, setSearchParams] = useSearchParams();

  const regiaoParam = searchParams.get('regiao');
  const activeRegion: 'todos' | 'mocambique' | 'brasil' = 
    regiaoParam === 'brasil' ? 'brasil' : regiaoParam === 'mocambique' ? 'mocambique' : 'todos';

  const handleRegionChange = (newRegion: 'todos' | 'mocambique' | 'brasil') => {
    const next = new URLSearchParams(searchParams);
    if (newRegion === 'todos') {
      next.delete('regiao');
    } else {
      next.set('regiao', newRegion);
    }
    setSearchParams(next, { replace: true });
  };

  // Permite abrir um projeto diretamente via hash da URL (#proj-1)
  useEffect(() => {
    const hash = window.location.hash.replace('#', '');
    if (hash && projects.length > 0) {
      const found = projects.find(p => p.id === hash);
      if (found) setSelectedProject(found);
    }
  }, [projects]);

  const isBrazilProject = (p: YAHHopeProject) => {
    const loc = (p.location || '').toLowerCase();
    return loc.includes('brasil') || loc.includes('brazil') || loc.includes('são paulo') || loc.includes('sao paulo');
  };

  // Filtragem de projetos de acordo com a região selecionada
  const filteredProjects = projects.filter(p => {
    if (activeRegion === 'todos') return true;
    if (activeRegion === 'mocambique') {
      return !isBrazilProject(p);
    }
    if (activeRegion === 'brasil') {
      return isBrazilProject(p);
    }
    return true;
  });

  const activeProjects = filteredProjects.filter(p => p.status === 'active');
  const plannedProjects = filteredProjects.filter(p => p.status === 'planned');
  const completedProjects = filteredProjects.filter(p => p.status === 'completed');

  const ProjectCard: React.FC<{ project: YAHHopeProject }> = ({ project }) => (
    <div 
      onClick={() => setSelectedProject(project)}
      className="bg-white rounded-[2.5rem] border border-slate-100 overflow-hidden shadow-sm hover:shadow-2xl hover:shadow-slate-200/50 transition-all duration-500 group flex flex-col h-full cursor-pointer hover:-translate-y-1"
    >
      <div className="h-64 overflow-hidden relative">
        <img 
          src={project.image_url} 
          alt={project.title} 
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
          onError={(e) => {
            (e.target as HTMLImageElement).src = 'https://hope.yahchurch.com/wp-content/uploads/2025/09/HOPE-ALFACES.avif';
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-slate-900/20 to-transparent"></div>
        <div className="absolute bottom-6 left-6 right-6">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            {project.category && (
              <span 
                className="text-white text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full shadow-xs"
                style={{ backgroundColor: project.tag_color || '#F49853' }}
              >
                {project.category}
              </span>
            )}
            {project.location && (
              <span className="bg-black/40 backdrop-blur-md text-white text-[10px] font-gotham-medium px-2.5 py-1 rounded-full flex items-center gap-1">
                <MapPin size={10} className="text-[#F49853]" />
                {project.location}
              </span>
            )}
            {project.status === 'active' && <span className="bg-emerald-500 text-white text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full flex items-center gap-1.5"><Heart size={12} /> Em Andamento</span>}
            {project.status === 'planned' && <span className="bg-amber-500 text-white text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full flex items-center gap-1.5"><Clock size={12} /> Planejado</span>}
            {project.status === 'completed' && <span className="bg-blue-500 text-white text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full flex items-center gap-1.5"><CheckCircle size={12} /> Concluído</span>}
          </div>
          <h3 className="text-2xl font-black text-white leading-tight group-hover:text-amber-200 transition-colors">{project.title}</h3>
        </div>
      </div>
      <div className="p-8 flex flex-col flex-grow">
        <p className="text-slate-500 leading-relaxed mb-8 flex-grow">{project.description}</p>
        <button 
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setSelectedProject(project);
          }}
          className="flex items-center justify-between w-full p-4 rounded-2xl bg-slate-50 text-slate-900 hover:bg-slate-900 hover:text-white transition-colors group/btn cursor-pointer"
        >
          <span className="font-bold text-sm tracking-tight">Conhecer projeto & apoiar</span>
          <ArrowRight size={18} className="group-hover/btn:translate-x-1 transition-transform" />
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-white pt-24 pb-20">
      <SEO 
        title="Nossos Projetos e Alcance Global | YAH Hope"
        description="Conheça os projetos humanitários da YAH Hope: combate à desnutrição, acesso a água limpa e educação em Moçambique, e nossa base de mobilização e governança no Brasil."
        keywords="projetos humanitários, ONG Moçambique, Nampula, poços de água potável África, combate à desnutrição infantil, YAH Hope Brasil"
        canonical="https://yahhope.org/projetos"
      />

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-12 text-center">
        <div className="inline-flex items-center justify-center p-3 bg-amber-50 text-[#F49853] rounded-2xl mb-6 shadow-xs">
          <Globe2 size={32} />
        </div>
        <h1 className="text-4xl sm:text-5xl md:text-7xl font-black text-slate-900 tracking-tighter mb-6 uppercase">
          Nossos Projetos & <span className="text-[#F49853]">Alcance</span>
        </h1>
        <p className="text-lg sm:text-xl text-slate-500 max-w-3xl mx-auto leading-relaxed font-medium">
          Iniciativas de alto impacto que transformam realidades. Do socorro humanitário e resgate infantil em Moçambique à nossa base institucional e de mobilização no Brasil.
        </p>

        {/* Region Filter Tabs */}
        <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 mt-8">
          <button
            onClick={() => handleRegionChange('todos')}
            className={`px-5 py-2.5 rounded-full text-xs sm:text-sm font-gotham-bold transition-all cursor-pointer ${
              activeRegion === 'todos'
                ? 'bg-slate-900 text-white shadow-md shadow-slate-900/10'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Todos os Projetos
          </button>
          <button
            onClick={() => handleRegionChange('mocambique')}
            className={`px-5 py-2.5 rounded-full text-xs sm:text-sm font-gotham-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeRegion === 'mocambique'
                ? 'bg-[#F49853] text-white shadow-md shadow-orange-500/20'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <span>🇲🇿</span>
            <span>Moçambique (Nampula)</span>
            <span className={`text-[10px] px-2 py-0.5 rounded-full ${
              activeRegion === 'mocambique' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
            }`}>
              {projects.filter(p => !isBrazilProject(p)).length}
            </span>
          </button>
          <button
            onClick={() => handleRegionChange('brasil')}
            className={`px-5 py-2.5 rounded-full text-xs sm:text-sm font-gotham-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeRegion === 'brasil'
                ? 'bg-[#F49853] text-white shadow-md shadow-orange-500/20'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <span>🇧🇷</span>
            <span>Brasil (Sede & Expansão)</span>
            {projects.filter(isBrazilProject).length > 0 && (
              <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                activeRegion === 'brasil' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
              }`}>
                {projects.filter(isBrazilProject).length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Mozambique Context Ribbon */}
      {activeRegion === 'mocambique' && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-12">
          <div className="bg-amber-50/70 border border-amber-200/60 rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-xs">
            <div>
              <div className="flex items-center gap-2 text-xs font-gotham-bold uppercase tracking-wider text-amber-700 mb-1">
                <span>🇲🇿 Campo de Atuação Humanitária</span>
              </div>
              <h3 className="text-2xl font-black text-slate-900 mb-2">Província de Nampula, Moçambique</h3>
              <p className="text-slate-600 text-sm max-w-2xl font-gotham-light leading-relaxed">
                Nossa linha de frente no acolhimento de crianças com desnutrição severa, perfuração de poços artesianos para água limpa e capacitação profissional de famílias em comunidades vulneráveis.
              </p>
            </div>
            <div className="bg-white px-5 py-3 rounded-2xl shadow-xs border border-amber-100 text-center shrink-0">
              <span className="block text-2xl font-black text-[#F49853]">
                {projects.filter(p => !isBrazilProject(p)).length}
              </span>
              <span className="text-[11px] text-slate-500 font-gotham-medium">Projetos em Andamento</span>
            </div>
          </div>
        </div>
      )}

      {/* Brazil Dedicated Institutional Section */}
      {activeRegion === 'brasil' && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-16">
          {/* Institutional Card */}
          <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 rounded-[2.5rem] p-8 sm:p-12 text-white relative overflow-hidden shadow-2xl mb-10 border border-slate-800">
            <div className="absolute -right-20 -bottom-20 w-80 h-80 bg-[#F49853]/15 rounded-full blur-3xl pointer-events-none" />
            <div className="relative z-10 max-w-3xl">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 text-[#F49853] text-xs font-gotham-bold uppercase tracking-wider mb-6">
                <span>🇧🇷 Base de Governança & Mobilização</span>
              </div>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-heading font-black tracking-tight leading-tight mb-5">
                A Força da YAH Hope no <span className="text-[#F49853]">Brasil</span>
              </h2>
              <p className="text-slate-300 text-base sm:text-lg leading-relaxed font-gotham-light mb-8">
                No Brasil concentramos nossa sede de governança, auditoria contínua e mobilização de mantenedores. É a partir daqui que articulamos famílias, profissionais e voluntários cuja generosidade sustenta diariamente as operações em Moçambique, enquanto estruturamos o início de frentes sociais comunitárias no Brasil.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link
                  to="/mantenedor"
                  className="inline-flex items-center gap-2 px-6 py-3.5 rounded-full bg-[#F49853] hover:bg-[#e0853d] text-white font-gotham-bold text-sm transition-all shadow-lg shadow-orange-500/25"
                >
                  <span>Seja Mantenedor Mensal</span>
                  <ArrowRight size={16} />
                </Link>
                <Link
                  to="/sobre-nos"
                  className="inline-flex items-center gap-2 px-6 py-3.5 rounded-full bg-white/10 hover:bg-white/20 text-white font-gotham-bold text-sm transition-all backdrop-blur-sm"
                >
                  <span>Conhecer Nossa Estrutura</span>
                </Link>
              </div>
            </div>
          </div>

          {/* Pillars Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <div className="bg-slate-50 border border-slate-100 rounded-3xl p-6 sm:p-8 hover:bg-white hover:shadow-xl hover:border-slate-200 transition-all duration-300">
              <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center mb-5">
                <Building2 size={24} />
              </div>
              <h3 className="text-xl font-black text-slate-900 mb-3">Sede & Governança</h3>
              <p className="text-slate-600 text-sm leading-relaxed font-gotham-light">
                Com sede administrativa em São Paulo, garantimos compliance ético, controle financeiro rigoroso e transparência na prestação de contas aos nossos apoiadores.
              </p>
            </div>

            <div className="bg-slate-50 border border-slate-100 rounded-3xl p-6 sm:p-8 hover:bg-white hover:shadow-xl hover:border-slate-200 transition-all duration-300">
              <div className="w-12 h-12 rounded-2xl bg-amber-100 text-[#F49853] flex items-center justify-center mb-5">
                <Users size={24} />
              </div>
              <h3 className="text-xl font-black text-slate-900 mb-3">Rede de Mantenedores</h3>
              <p className="text-slate-600 text-sm leading-relaxed font-gotham-light">
                Conectamos milhares de mantenedores e padrinhos que viabilizam tratamentos médicos, compra de insumos clínicos, fórmulas terapêuticas e bolsas de estudo.
              </p>
            </div>

            <div className="bg-slate-50 border border-slate-100 rounded-3xl p-6 sm:p-8 hover:bg-white hover:shadow-xl hover:border-slate-200 transition-all duration-300">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mb-5">
                <Sparkles size={24} />
              </div>
              <h3 className="text-xl font-black text-slate-900 mb-3">Futuras Frentes no Brasil</h3>
              <p className="text-slate-600 text-sm leading-relaxed font-gotham-light">
                Estamos em fase de mapeamento para desenvolver projetos comunitários voltados à segurança nutricional e apoio materno-infantil em regiões vulneráveis do país.
              </p>
            </div>
          </div>

          {filteredProjects.length === 0 && (
            <div className="p-8 rounded-3xl bg-amber-50/60 border border-amber-200/70 text-center max-w-2xl mx-auto">
              <span className="text-sm font-gotham-bold text-amber-900 block mb-1">
                Frentes Comunitárias de Campo no Brasil em Planejamento
              </span>
              <p className="text-xs text-amber-800 leading-relaxed font-gotham-light mb-4">
                Hoje todo o nosso atendimento assistencial de campo está concentrado na emergência em Nampula (Moçambique). Deseja propor uma parceria institucional ou atuar como voluntário no Brasil?
              </p>
              <Link 
                to="/voluntariado-e-parcerias" 
                className="text-xs font-gotham-bold text-[#F49853] hover:underline inline-flex items-center gap-1"
              >
                <span>Inscreva-se como voluntário ou proponha uma parceria</span>
                <ArrowRight size={13} />
              </Link>
            </div>
          )}
        </div>
      )}

      {/* Active Projects */}
      {activeProjects.length > 0 && (
        <section className="py-16 bg-slate-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-4 mb-12">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
                <Heart size={24} />
              </div>
              <div>
                <h2 className="text-3xl font-black text-slate-900 tracking-tight uppercase">Em Andamento</h2>
                <p className="text-xs text-slate-500 font-gotham-light mt-0.5">Ações com impacto imediato e atendimento contínuo</p>
              </div>
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
              <div>
                <h2 className="text-3xl font-black text-slate-900 tracking-tight uppercase">Próximos Passos</h2>
                <p className="text-xs text-slate-500 font-gotham-light mt-0.5">Iniciativas em estruturação e captação de recursos</p>
              </div>
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
              <div>
                <h2 className="text-3xl font-black text-slate-900 tracking-tight uppercase">Concluídos</h2>
                <p className="text-xs text-slate-500 font-gotham-light mt-0.5">Etapas concluídas com metas atingidas</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {completedProjects.map(p => <ProjectCard key={p.id} project={p} />)}
            </div>
          </div>
        </section>
      )}

      {filteredProjects.length === 0 && activeRegion !== 'brasil' && (
        <div className="max-w-3xl mx-auto text-center py-20">
          <div className="w-24 h-24 bg-slate-100 rounded-[2rem] mx-auto flex items-center justify-center mb-6">
            <MapPin className="text-slate-300" size={40} />
          </div>
          <h2 className="text-2xl font-black text-slate-900 mb-4">Nenhum projeto encontrado</h2>
          <p className="text-slate-500 text-lg">Em breve divulgaremos as novas iniciativas da YAH Hope nesta localidade.</p>
        </div>
      )}

      {/* Modal Imersivo de Apresentação do Projeto */}
      <ProjectDetailModal 
        project={selectedProject} 
        isOpen={Boolean(selectedProject)} 
        onClose={() => setSelectedProject(null)} 
      />
    </div>
  );
}
