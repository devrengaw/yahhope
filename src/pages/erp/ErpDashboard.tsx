import { Briefcase, Users, DollarSign, Calendar, ArrowRight, CheckCircle2, Clock, Activity } from 'lucide-react';

const mockProjects = [
  { id: 1, name: 'Nutrição Infantil - Moçambique', status: 'Ativo', budget: 'R$ 120.000', progress: 75, team: 12 },
  { id: 2, name: 'Construção Escola - Aldeia X', status: 'Em Planejamento', budget: 'R$ 350.000', progress: 15, team: 5 },
  { id: 3, name: 'Poço Artesiano - Comunidade Y', status: 'Concluído', budget: 'R$ 45.000', progress: 100, team: 8 },
];

export function ErpDashboard() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">Gestão de Projetos</h1>
          <p className="text-slate-500 mt-1">Visão geral do ERP YAHope</p>
        </div>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-xl font-medium hover:bg-blue-700 transition-colors shadow-sm">
          + Novo Projeto
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center">
            <Briefcase size={24} />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Projetos Ativos</p>
            <p className="text-2xl font-bold text-slate-900">12</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center">
            <DollarSign size={24} />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Orçamento Anual</p>
            <p className="text-2xl font-bold text-slate-900">R$ 1.2M</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-xl flex items-center justify-center">
            <Users size={24} />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Voluntários/Equipe</p>
            <p className="text-2xl font-bold text-slate-900">145</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-xl flex items-center justify-center">
            <Calendar size={24} />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Eventos Próximos</p>
            <p className="text-2xl font-bold text-slate-900">4</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
          <h2 className="text-lg font-semibold text-slate-800">Projetos em Destaque</h2>
          <button className="text-sm font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1">
            Ver todos <ArrowRight size={16} />
          </button>
        </div>
        <div className="divide-y divide-slate-100">
          {mockProjects.map(project => (
            <div key={project.id} className="p-6 hover:bg-slate-50 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                  project.status === 'Ativo' ? 'bg-blue-100 text-blue-600' :
                  project.status === 'Concluído' ? 'bg-emerald-100 text-emerald-600' :
                  'bg-amber-100 text-amber-600'
                }`}>
                  {project.status === 'Ativo' ? <Activity size={20} /> :
                   project.status === 'Concluído' ? <CheckCircle2 size={20} /> :
                   <Clock size={20} />}
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900">{project.name}</h3>
                  <div className="flex items-center gap-3 mt-1 text-sm text-slate-500">
                    <span className="flex items-center gap-1"><DollarSign size={14} /> {project.budget}</span>
                    <span className="flex items-center gap-1"><Users size={14} /> {project.team} pessoas</span>
                  </div>
                </div>
              </div>
              <div className="w-full md:w-64">
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-medium text-slate-700">Progresso</span>
                  <span className="text-slate-500">{project.progress}%</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full ${
                      project.status === 'Ativo' ? 'bg-blue-500' :
                      project.status === 'Concluído' ? 'bg-emerald-500' :
                      'bg-amber-500'
                    }`} 
                    style={{ width: `${project.progress}%` }}
                  ></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
