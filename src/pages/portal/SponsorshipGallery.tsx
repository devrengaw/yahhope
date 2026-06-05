import React from 'react';
import { Heart, Info, MapPin, Search, Filter } from 'lucide-react';
import { cn } from '../../lib/utils';

export function SponsorshipGallery() {
  const children = [
    { id: '1', name: 'Abidemi', age: '5 anos', village: 'Aldeia de Boane', need: 'Alimentação Especial', status: 'Em recuperação', profile: 'Abidemi é uma menina curiosa que ama desenhar. Ela está se recuperando de um quadro de desnutrição aguda e já mostra muita energia.', img: 'https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?q=80&w=2070&auto=format&fit=crop' },
    { id: '2', name: 'Farai', age: '3 anos', village: 'Aldeia de Matola', need: 'Acompanhamento Médico', status: 'Alta', profile: 'Farai completou seu tratamento com sucesso! Agora ela precisa de apoio para manter sua nutrição e iniciar os estudos.', img: 'https://images.unsplash.com/photo-1489710437720-ebb67ec84dd2?q=80&w=2070&auto=format&fit=crop' },
    { id: '3', name: 'Juma', age: '6 anos', village: 'Aldeia de Boane', need: 'Educação', status: 'Em recuperação', profile: 'Juma sonha em ser professor. Ele é o mais velho de 4 irmãos e sempre ajuda sua mãe nas tarefas da aldeia.', img: 'https://images.unsplash.com/photo-1534067783941-51c9c23ecefd?q=80&w=1974&auto=format&fit=crop' },
    { id: '4', name: 'Nala', age: '4 anos', village: 'Aldeia de Xai-Xai', need: 'Nutrição Base', status: 'Em recuperação', profile: 'Nala é tímida mas tem um sorriso contagiante. Ela adora brincar com as outras crianças na Casa Nutri.', img: 'https://images.unsplash.com/photo-1485199692108-c3b5069de6a0?q=80&w=2070&auto=format&fit=crop' },
    { id: '5', name: 'Osei', age: '7 anos', village: 'Aldeia de Matola', need: 'Esporte e Lazer', status: 'Alta', profile: 'Osei é muito atlético e sonha em jogar futebol profissionalmente. Ele é um exemplo de superação para sua aldeia.', img: 'https://images.unsplash.com/photo-1519689680058-324335c77eba?q=80&w=2070&auto=format&fit=crop' },
    { id: '6', name: 'Zahara', age: '2 anos', village: 'Aldeia de Boane', need: 'Cuidados Infantis', status: 'Em recuperação', profile: 'Zahara é a caçula do grupo. Ela está reagindo muito bem à dieta especial e ganhando peso de forma saudável.', img: 'https://images.unsplash.com/photo-1540331547168-8b63109225b7?q=80&w=1919&auto=format&fit=crop' },
  ];

  return (
    <div className="space-y-12 pb-20">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">Galeria de Esperança</h1>
          <p className="text-slate-500 mt-2 font-medium">Escolha uma criança para transformar sua realidade.</p>
        </div>
        
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Buscar por nome..." 
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500 outline-none transition-all text-sm"
            />
          </div>
          <button className="p-2.5 bg-white border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 transition-colors">
            <Filter size={20} />
          </button>
        </div>
      </div>

      {/* Children Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        {children.map(child => (
          <div key={child.id} className="bg-white rounded-[2.5rem] overflow-hidden border border-slate-100 shadow-sm hover:shadow-2xl hover:-translate-y-1 transition-all group">
            <div className="aspect-[4/3] relative overflow-hidden">
              <img src={child.img} alt={child.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
              <div className="absolute top-4 right-4 flex flex-col gap-2 items-end">
                <div className="bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-full flex items-center gap-1.5 text-amber-600 font-black text-[10px] uppercase tracking-widest shadow-lg">
                  <MapPin size={12} /> {child.village}
                </div>
                <div className={cn(
                  "px-3 py-1.5 rounded-full font-black text-[10px] uppercase tracking-widest shadow-lg backdrop-blur-md",
                  child.status === 'Alta' ? "bg-emerald-500/90 text-white" : "bg-blue-500/90 text-white"
                )}>
                  {child.status}
                </div>
              </div>
            </div>
            
            <div className="p-8">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-2xl font-black text-slate-900">{child.name}, {child.age}</h3>
                  <p className="text-slate-500 font-medium text-sm mt-1">Necessidade: <span className="text-amber-600 font-bold">{child.need}</span></p>
                </div>
                <button className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-300 hover:bg-rose-50 hover:text-rose-500 transition-all">
                  <Heart size={20} />
                </button>
              </div>
              
              <p className="text-slate-600 text-sm leading-relaxed mb-8 line-clamp-3 min-h-[4.5rem]">
                {child.profile}
              </p>
              
              <div className="grid grid-cols-2 gap-4">
                <button className="px-4 py-3 border border-slate-200 text-slate-600 font-black text-xs uppercase tracking-widest rounded-xl hover:bg-slate-50 transition-colors flex items-center justify-center gap-2">
                  <Info size={16} /> Ver História
                </button>
                <button className="px-4 py-3 bg-amber-500 text-white font-black text-xs uppercase tracking-widest rounded-xl hover:bg-amber-600 transition-all shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2">
                  <Heart size={16} fill="currentColor" /> Apadrinhar
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Info Banner */}
      <div className="bg-amber-50 rounded-[3rem] p-10 border border-amber-100 flex flex-col md:flex-row items-center gap-8">
        <div className="w-20 h-20 bg-amber-500 rounded-[2rem] flex items-center justify-center text-white shrink-0 shadow-lg">
          <Heart size={40} fill="currentColor" />
        </div>
        <div>
          <h2 className="text-2xl font-black text-slate-900 mb-2">Como funciona o apadrinhamento?</h2>
          <p className="text-slate-600 leading-relaxed max-w-3xl font-medium">
            Ao apadrinhar uma criança com o valor de R$ 120,00 mensais, você garante alimentação, acompanhamento médico especializado e educação. Você receberá atualizações frequentes e poderá trocar cartinhas com ela.
          </p>
        </div>
      </div>
    </div>
  );
}
