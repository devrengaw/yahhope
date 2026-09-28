import React, { useState } from 'react';
import { 
  Briefcase, 
  MapPin, 
  Target, 
  Calendar, 
  CheckCircle2, 
  ArrowRight, 
  Heart, 
  Users, 
  Sparkles,
  DollarSign
} from 'lucide-react';
import { useWebsiteProjects } from '../../../contexts/WebsiteProjectsContext';
import { useDonationModal } from '../../../contexts/DonationModalContext';

export function MobileDonorProjects() {
  const { projects } = useWebsiteProjects();
  const { openDonationModal } = useDonationModal();

  // Enhanced project mock data for donor app
  const projectsList = [
    {
      id: 'proj-1',
      title: 'Casa Nutri Nampula',
      category: 'Nutrição & Saúde Infantil',
      location: 'Nampula, Moçambique',
      description: 'Centro de atendimento diário para crianças em estado grave de desnutrição, fornecendo refeições terapêuticas, leite fortificado e acompanhamento médico contínuo.',
      beneficiaries: '350 crianças/mês',
      goal: 'R$ 85.000',
      raised: 'R$ 68.400',
      progress: 80,
      image: 'https://hope.yahchurch.com/wp-content/uploads/2025/09/HOPE-ALFACES.avif',
      status: 'Em andamento',
      updates: [
        'Construção da nova sala de atendimento pediátrico concluída.',
        'Distribuídas 1.800 refeições fortificadas no último mês.'
      ]
    },
    {
      id: 'proj-2',
      title: 'Poços de Água Limpa',
      category: 'Saneamento & Infraestrutura',
      location: 'Aldeias de Boane e Matola',
      description: 'Perfuração de poços artesianos com bombas solares para garantir acesso à água potável, reduzindo drasticamente doenças parasitárias na infância.',
      beneficiaries: '1.200 famílias',
      goal: 'R$ 60.000',
      raised: 'R$ 54.000',
      progress: 90,
      image: 'https://hope.yahchurch.com/wp-content/uploads/2025/09/IMG5.avif',
      status: 'Fase final',
      updates: [
        '2º poço artesiano perfurado com sucesso a 65m de profundidade.',
        'Instalação das placas solares prevista para a próxima semana.'
      ]
    },
    {
      id: 'proj-3',
      title: 'Hortas Comunitárias & Soberania Alimentar',
      category: 'Agricultura & Sustentabilidade',
      location: 'Comunidades Rurais',
      description: 'Capacitação das mães e famílias para cultivo de hortaliças ricas em ferro e vitaminas, garantindo segurança alimentar duradoura.',
      beneficiaries: '45 famílias rurais',
      goal: 'R$ 25.000',
      raised: 'R$ 17.500',
      progress: 70,
      image: 'https://images.unsplash.com/photo-1592417817098-8f3d6910985c?q=80&w=800&auto=format&fit=crop',
      status: 'Em andamento',
      updates: [
        'Primeira colheita de couve e mandioca enriquecida.',
        'Distribuição de sementes e ferramentas concluída.'
      ]
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
          <Briefcase className="text-amber-500" size={24} /> Projetos YAH Hope
        </h2>
        <p className="text-xs text-slate-500 mt-1 font-medium">
          Acompanhe como suas doações são aplicadas na prática nas frentes missionárias.
        </p>
      </div>

      {/* Projects Timeline & Cards */}
      <div className="space-y-5">
        {projectsList.map((project) => (
          <div
            key={project.id}
            className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-xs hover:border-amber-200 transition-all space-y-4"
          >
            {/* Image Header */}
            <div className="relative h-44 w-full">
              <img
                src={project.image}
                alt={project.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent"></div>

              <span className="absolute top-3 left-3 bg-white/90 backdrop-blur-md text-slate-900 text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-xl shadow-xs">
                {project.category}
              </span>

              <span className="absolute top-3 right-3 bg-emerald-500 text-white text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-xl shadow-xs">
                {project.status}
              </span>

              <div className="absolute bottom-3 left-4 right-4 text-white">
                <h3 className="text-xl font-black">{project.title}</h3>
                <p className="text-xs text-slate-200 flex items-center gap-1 mt-0.5 font-medium">
                  <MapPin size={12} className="text-amber-400" /> {project.location}
                </p>
              </div>
            </div>

            <div className="px-5 pb-5 space-y-4">
              {/* Description */}
              <p className="text-xs text-slate-600 leading-relaxed font-medium">
                {project.description}
              </p>

              {/* Progress Bar & Goal */}
              <div className="space-y-1.5 bg-slate-50 p-3.5 rounded-2xl">
                <div className="flex justify-between items-center text-xs font-black">
                  <span className="text-slate-500">Meta do Projeto</span>
                  <span className="text-amber-600 font-black">{project.progress}% alcançado</span>
                </div>
                <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-amber-500 to-orange-500 h-full rounded-full transition-all duration-1000"
                    style={{ width: `${project.progress}%` }}
                  ></div>
                </div>
                <div className="flex justify-between items-center text-[11px] text-slate-400 font-bold pt-1">
                  <span>Arrecadado: {project.raised}</span>
                  <span>Alvo: {project.goal}</span>
                </div>
              </div>

              {/* Impact Tag */}
              <div className="flex items-center gap-2 text-xs text-emerald-800 bg-emerald-50 p-2.5 rounded-xl font-bold">
                <Users size={16} className="text-emerald-600 shrink-0" />
                <span>Beneficiários diretos: {project.beneficiaries}</span>
              </div>

              {/* Recent Updates Bullet Points */}
              <div className="space-y-2 pt-1 border-t border-slate-100">
                <span className="text-[10px] uppercase font-black tracking-wider text-slate-400 block">
                  Últimos Avanços em Campo
                </span>
                {project.updates.map((update, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs text-slate-600">
                    <CheckCircle2 size={14} className="text-emerald-500 shrink-0 mt-0.5" />
                    <span>{update}</span>
                  </div>
                ))}
              </div>

              {/* Action Button */}
              <button
                onClick={() => openDonationModal()}
                className="w-full py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 text-white font-black text-xs rounded-xl shadow-md shadow-amber-500/20 flex items-center justify-center gap-1.5 transition-all active:scale-[0.98]"
              >
                <Heart size={14} fill="currentColor" />
                <span>Apoiar este Projeto via Pix</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
