import React from 'react';
import { ShoppingBag, Tag, Star, ArrowRight, Heart } from 'lucide-react';
import { Link } from 'react-router-dom';

export function SupporterStore() {
  const products = [
    { id: '1', name: 'Camiseta YAHope Original', price: 'R$ 89,90', impact: '2 semanas de refeições', img: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?q=80&w=1780&auto=format&fit=crop' },
    { id: '2', name: 'Cesta de Artesanato Moçambique', price: 'R$ 145,00', impact: 'Ajuda a cooperativa local', img: 'https://images.unsplash.com/photo-1606126610021-4522900504e6?q=80&w=1974&auto=format&fit=crop' },
    { id: '3', name: 'Pulseira da Esperança (Kit 3)', price: 'R$ 45,00', impact: 'Suplemento Vitamínico', img: 'https://images.unsplash.com/photo-1611591439902-16bc1f39dd3b?q=80&w=2070&auto=format&fit=crop' },
    { id: '4', name: 'Caneca Logo YAHope', price: 'R$ 39,90', impact: 'Kit de higiene básico', img: 'https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?q=80&w=2070&auto=format&fit=crop' },
    { id: '5', name: 'Ecobag Sustentável', price: 'R$ 55,00', impact: 'Mudas para a horta comunitária', img: 'https://images.unsplash.com/photo-1544816153-12ad5d7133a2?q=80&w=1887&auto=format&fit=crop' },
    { id: '6', name: 'Caderno de Notas YAHope', price: 'R$ 29,90', impact: 'Material escolar para 1 criança', img: 'https://images.unsplash.com/photo-1531346878377-a5be20888e57?q=80&w=1887&auto=format&fit=crop' },
  ];

  return (
    <div className="space-y-12 pb-20">
      {/* Hero Store */}
      <div className="relative rounded-[3rem] overflow-hidden bg-slate-900 p-12 text-white flex flex-col md:flex-row items-center justify-between gap-8">
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500 rounded-full blur-[120px] opacity-20 -translate-y-1/2 translate-x-1/2"></div>
        <div className="relative z-10 max-w-xl">
          <div className="inline-flex items-center gap-2 bg-amber-500 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest mb-6">
            Loja Solidária
          </div>
          <h1 className="text-4xl md:text-5xl font-black mb-4 leading-tight">Onde cada compra é <br/><span className="text-amber-400">um ato de amor.</span></h1>
          <p className="text-slate-400 text-lg font-medium">100% dos lucros da nossa loja são revertidos diretamente para os projetos de nutrição em Moçambique.</p>
        </div>
        <div className="relative z-10 shrink-0">
          <div className="bg-white/10 backdrop-blur-xl border border-white/20 p-8 rounded-[2.5rem] text-center">
            <Star className="text-amber-400 mx-auto mb-4" size={32} fill="currentColor" />
            <p className="text-sm font-bold text-slate-300 uppercase tracking-widest">Meta do Mês</p>
            <h2 className="text-3xl font-black mt-2">78% Alcançada</h2>
            <div className="w-48 h-2 bg-white/10 rounded-full mt-4 overflow-hidden">
              <div className="w-3/4 h-full bg-amber-500"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Product Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        {products.map(product => (
          <div key={product.id} className="bg-white rounded-[2.5rem] border border-slate-100 p-6 hover:shadow-2xl hover:-translate-y-1 transition-all group">
            <div className="aspect-square rounded-[2rem] overflow-hidden mb-6 relative">
              <img src={product.img} alt={product.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
              <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <button className="absolute bottom-4 right-4 bg-white text-slate-900 w-12 h-12 rounded-2xl flex items-center justify-center shadow-xl opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all hover:bg-amber-500 hover:text-white">
                <ShoppingBag size={24} />
              </button>
            </div>
            
            <div className="space-y-3">
              <div className="flex justify-between items-start">
                <h3 className="text-xl font-black text-slate-900 leading-tight pr-4">{product.name}</h3>
                <p className="text-amber-600 font-black text-lg">{product.price}</p>
              </div>
              
              <div className="flex items-center gap-2 bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-xl w-max">
                <Heart size={14} fill="currentColor" />
                <span className="text-[10px] font-black uppercase tracking-widest">Impacto: {product.impact}</span>
              </div>

              <p className="text-slate-500 text-sm font-medium line-clamp-2 pt-2">
                Produto feito com materiais sustentáveis e mão de obra ética para apoiar nossa causa.
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Bottom CTA */}
      <div className="text-center py-12">
        <p className="text-slate-500 font-bold uppercase tracking-widest text-sm mb-6">Quer ajudar de outra forma?</p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button className="bg-slate-900 text-white px-10 py-4 rounded-2xl font-black transition-all hover:bg-slate-800">
            Fazer uma Doação Direta
          </button>
          <button className="bg-white border-2 border-slate-200 text-slate-600 px-10 py-4 rounded-2xl font-black transition-all hover:bg-slate-50">
            Quero ser Voluntário
          </button>
        </div>
      </div>
    </div>
  );
}
