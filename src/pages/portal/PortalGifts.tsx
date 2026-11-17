import React from 'react';
import { Gift, Heart, ArrowLeft, Star, ShoppingBag } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';

export function PortalGifts() {
  const { tr } = useLanguage();
  const gifts = [
    { id: '1', name: tr('Kit Escolar Completo', 'Complete School Kit'), price: 'R$ 45,00', impact: tr('Mochila, cadernos e lápis', 'Backpack, notebooks, and pencils'), img: 'https://images.unsplash.com/photo-1454165833767-027ffea9e778?q=80&w=2070&auto=format&fit=crop' },
    { id: '2', name: tr('Cesta de Frutas Tropical', 'Tropical Fruit Basket'), price: 'R$ 35,00', impact: tr('Vitaminas para uma semana', 'Vitamins for a week'), img: 'https://images.unsplash.com/photo-1610832958506-aa56368176cf?q=80&w=2070&auto=format&fit=crop' },
    { id: '3', name: tr('Bola de Futebol Nova', 'New Soccer Ball'), price: 'R$ 60,00', impact: tr('Lazer e esporte na aldeia', 'Play and sports in the village'), img: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?q=80&w=2070&auto=format&fit=crop' },
    { id: '4', name: tr('Mosquiteiro Proteção Total', 'Full-Protection Mosquito Net'), price: 'R$ 25,00', impact: tr('Prevenção contra malária', 'Malaria prevention'), img: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?q=80&w=2070&auto=format&fit=crop' },
  ];

  return (
    <div className="space-y-10 pb-20">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">{tr('Enviar um Presente', 'Send a Gift')}</h1>
          <p className="text-slate-500 mt-2 font-medium">{tr('Pequenos gestos que geram grandes sorrisos.', 'Small gestures that create big smiles.')}</p>
        </div>
        <Link to="/portal/dashboard" className="p-4 bg-white border border-slate-100 rounded-[2rem] text-slate-400 hover:text-slate-600 shadow-sm transition-all">
          <ArrowLeft size={24} />
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {gifts.map(gift => (
          <div key={gift.id} className="bg-white rounded-[2.5rem] border border-slate-100 p-5 hover:shadow-2xl transition-all group">
            <div className="aspect-square rounded-[2rem] overflow-hidden mb-5 relative">
              <img src={gift.img} alt={gift.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
              <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-md p-2 rounded-xl shadow-lg">
                <Gift className="text-amber-500" size={18} />
              </div>
            </div>
            
            <h3 className="font-black text-slate-900 mb-1">{gift.name}</h3>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mb-4">{gift.impact}</p>
            
            <div className="flex justify-between items-center mt-auto">
              <span className="text-lg font-black text-amber-600">{gift.price}</span>
              <button className="bg-slate-900 text-white w-10 h-10 rounded-xl flex items-center justify-center hover:bg-amber-500 transition-colors">
                <ShoppingBag size={18} />
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-slate-900 rounded-[3rem] p-12 text-white flex flex-col md:flex-row items-center justify-between gap-8 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-64 h-64 bg-amber-500 rounded-full blur-[100px] opacity-10"></div>
        <div className="relative z-10 max-w-xl text-center md:text-left">
          <h2 className="text-3xl font-black mb-4">{tr('Como funciona a entrega?', 'How does delivery work?')}</h2>
          <p className="text-slate-400 font-medium">{tr('Nossa equipe local adquire o presente em Moçambique para apoiar o comércio local e faz a entrega pessoalmente para a criança. Você receberá uma foto da entrega no seu feed!', 'Our local team purchases the gift in Mozambique to support local businesses and delivers it personally to the child. You will receive a delivery photo in your feed!')}</p>
        </div>
        <div className="relative z-10 shrink-0">
          <div className="bg-white/10 backdrop-blur-xl p-8 rounded-[2.5rem] border border-white/20 text-center">
            <Heart className="text-rose-400 mx-auto mb-4" size={32} fill="currentColor" />
            <p className="text-sm font-bold uppercase tracking-widest">{tr('Gesto de Amor', 'Gesture of Love')}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
