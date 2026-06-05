import React from 'react';
import { Heart, ShieldCheck, ShoppingBag, ArrowRight, Star, Users, Globe } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

export function SupporterLanding() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleApadrinhar = () => {
    if (!user) {
      navigate('/login?mode=supporter');
    } else {
      navigate('/portal/sponsorship');
    }
  };

  const handleLoja = () => {
    if (!user) {
      navigate('/login?mode=supporter');
    } else {
      navigate('/portal/shop');
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative h-[80vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img 
            src="https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?q=80&w=2070&auto=format&fit=crop" 
            alt="Impacto Social" 
            className="w-full h-full object-cover brightness-50"
          />
        </div>
        
        <div className="relative z-10 max-w-5xl mx-auto px-6 text-center text-white">
          <div className="inline-flex items-center gap-2 bg-amber-500/20 backdrop-blur-md border border-amber-400/30 px-4 py-2 rounded-full mb-8 animate-bounce">
            <Heart className="text-amber-400" size={18} fill="currentColor" />
            <span className="text-sm font-bold uppercase tracking-wider text-amber-50">Junte-se à nossa família</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-black mb-6 tracking-tight leading-tight">
            Transforme o futuro de <span className="text-amber-400">uma criança</span> hoje.
          </h1>
          <p className="text-xl md:text-2xl text-slate-200 mb-10 max-w-3xl mx-auto font-medium">
            Seja um apadrinhador ou apoie através da nossa loja solidária. 100% da renda é revertida para projetos de nutrição.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button 
              onClick={handleApadrinhar}
              className="bg-amber-500 hover:bg-amber-600 text-white px-10 py-5 rounded-2xl font-black text-lg transition-all shadow-xl shadow-amber-500/30 hover:scale-105 active:scale-95"
            >
              Apadrinhar Agora
            </button>
            </div>
          </div>
      </section>

      {/* Social Proof */}
      <section className="py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <div className="bg-white p-10 rounded-[3rem] shadow-sm border border-slate-100 flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-amber-100 rounded-2xl flex items-center justify-center text-amber-600 mb-6">
                <Users size={32} />
              </div>
              <h3 className="text-4xl font-black text-slate-900 mb-2">500+</h3>
              <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Crianças Atendidas</p>
            </div>
            <div className="bg-white p-10 rounded-[3rem] shadow-sm border border-slate-100 flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center text-blue-600 mb-6">
                <Globe size={32} />
              </div>
              <h3 className="text-4xl font-black text-slate-900 mb-2">12</h3>
              <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Aldeias Impactadas</p>
            </div>
            <div className="bg-white p-10 rounded-[3rem] shadow-sm border border-slate-100 flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center text-emerald-600 mb-6">
                <ShieldCheck size={32} />
              </div>
              <h3 className="text-4xl font-black text-slate-900 mb-2">100%</h3>
              <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Transparência Total</p>
            </div>
          </div>
        </div>
      </section>

      {/* Meet the children */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
            <div>
              <h2 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight">Crianças que esperam <br/><span className="text-amber-500">por você</span></h2>
            </div>
            <button 
              onClick={handleApadrinhar}
              className="group flex items-center gap-2 text-amber-600 font-black text-lg hover:gap-4 transition-all"
            >
              Ver todas as crianças <ArrowRight size={24} />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { name: 'Kofi', age: '4 anos', img: 'https://images.unsplash.com/photo-1489710437720-ebb67ec84dd2?q=80&w=2070&auto=format&fit=crop' },
              { name: 'Amara', age: '6 anos', img: 'https://images.unsplash.com/photo-1534067783941-51c9c23ecefd?q=80&w=1974&auto=format&fit=crop' },
              { name: 'Zane', age: '3 anos', img: 'https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?q=80&w=2071&auto=format&fit=crop' }
            ].map(c => (
              <div key={c.name} className="group relative rounded-[2.5rem] overflow-hidden aspect-[4/5] shadow-2xl hover:-translate-y-2 transition-all duration-500">
                <img src={c.img} alt={c.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
                <div className="absolute bottom-0 left-0 p-8 text-white">
                  <p className="text-amber-400 font-black text-sm uppercase tracking-widest mb-1">Moçambique</p>
                  <h4 className="text-3xl font-black mb-4">{c.name}, {c.age}</h4>
                  <button 
                    onClick={handleApadrinhar}
                    className="bg-white text-slate-900 px-6 py-3 rounded-xl font-bold text-sm inline-flex items-center gap-2 hover:bg-amber-500 hover:text-white transition-colors"
                  >
                    Conhecer História
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Call to Action Shop */}
      <section className="py-24 bg-amber-500">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <ShoppingBag className="text-white/30 mx-auto mb-8" size={80} />
          <h2 className="text-4xl md:text-6xl font-black text-white mb-8">Nossa loja também <br/>gera impacto.</h2>
          <p className="text-xl text-amber-100 mb-12 max-w-2xl mx-auto font-medium">
            Toda a venda de produtos artesanais e roupas da marca YAHope é revertida para a compra de suplementos alimentares.
          </p>
          <button 
            onClick={handleLoja}
            className="bg-white text-amber-600 px-12 py-5 rounded-2xl font-black text-lg transition-all shadow-2xl hover:scale-105 active:scale-95"
          >
            Explorar Loja Solidária
          </button>
        </div>
      </section>
    </div>
  );
}
