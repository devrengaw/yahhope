import { ArrowRight, Heart, Users, BookOpen, Utensils } from 'lucide-react';
import { Link } from 'react-router-dom';

export function Home() {
  return (
    <div className="bg-slate-50">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-emerald-900 text-white py-24 sm:py-32">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center opacity-20 mix-blend-overlay"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight mb-6">
            Esperança que <span className="text-emerald-400">Transforma</span>
          </h1>
          <p className="mt-4 text-xl text-emerald-100 max-w-2xl mx-auto mb-10">
            A YAHope atua no combate à desnutrição infantil, educação e desenvolvimento comunitário. Junte-se a nós para transformar o futuro de milhares de crianças.
          </p>
          <div className="flex justify-center gap-4">
            <Link to="/login" className="bg-emerald-500 text-white px-8 py-4 rounded-full font-bold text-lg hover:bg-emerald-400 transition-colors shadow-lg flex items-center gap-2">
              Apadrinhar uma Criança <Heart size={20} />
            </Link>
            <Link to="/login" className="bg-white/10 backdrop-blur-sm text-white border border-white/20 px-8 py-4 rounded-full font-bold text-lg hover:bg-white/20 transition-colors">
              Conhecer Projetos
            </Link>
          </div>
        </div>
      </section>

      {/* Impact Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-900">Nossas Áreas de Atuação</h2>
            <p className="mt-4 text-slate-500 max-w-2xl mx-auto">Trabalhamos em frentes integradas para garantir o desenvolvimento pleno das crianças e suas comunidades.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-slate-50 p-8 rounded-3xl border border-slate-100 text-center hover:shadow-xl transition-shadow">
              <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Utensils size={32} />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Nutrição Infantil</h3>
              <p className="text-slate-600">Programa intensivo de recuperação nutricional para crianças em situação de vulnerabilidade.</p>
            </div>

            <div className="bg-slate-50 p-8 rounded-3xl border border-slate-100 text-center hover:shadow-xl transition-shadow">
              <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <BookOpen size={32} />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Educação</h3>
              <p className="text-slate-600">Acesso à educação de qualidade, reforço escolar e desenvolvimento de habilidades para o futuro.</p>
            </div>

            <div className="bg-slate-50 p-8 rounded-3xl border border-slate-100 text-center hover:shadow-xl transition-shadow">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Users size={32} />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Comunidade</h3>
              <p className="text-slate-600">Projetos de geração de renda, saneamento básico e empoderamento familiar.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
