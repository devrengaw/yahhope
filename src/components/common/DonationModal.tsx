import React, { useState } from 'react';
import { X, ArrowRight, CreditCard, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useDonationModal } from '../../contexts/DonationModalContext';

const STRIPE_QUOTAS = [
  { amount: 50, label: 'Alimenta uma criança' },
  { amount: 120, label: 'Apadrinhamento mensal' },
  { amount: 300, label: 'Cesta básica + Suplementos' },
];

export function DonationModal() {
  const { isOpen, options, closeDonationModal } = useDonationModal();
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const navigate = useNavigate();

  if (!isOpen) return null;

  const title = options?.title || 'Resgate a Infância na Casa Nutri';
  const category = options?.category || 'Apoio Imediato';
  const tagColor = options?.tagColor || '#F49853';
  const imageUrl = options?.imageUrl || 'https://hope.yahchurch.com/wp-content/uploads/2025/09/HOPE-ALFACES.avif';
  const description = options?.description;

  const handleStripeCheckout = async (amount: number) => {
    setIsCheckingOut(true);
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
      if (!supabaseUrl) {
        closeDonationModal();
        navigate(`/campanha?amount=${amount}&isMonthly=true&method=card`);
        return;
      }

      const baseUrl = supabaseUrl.replace(/\/$/, '');
      const response = await fetch(`${baseUrl}/functions/v1/create-checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify({
          amount,
          isMonthly: true,
          successUrl: `${window.location.origin}/campanha?status=success`,
          cancelUrl: `${window.location.origin}/?status=cancel`
        })
      });

      const data = await response.json();
      closeDonationModal();
      if (data.url) {
        window.location.href = data.url;
      } else {
        navigate(`/campanha?amount=${amount}&isMonthly=true&method=card`);
      }
    } catch {
      closeDonationModal();
      navigate(`/campanha?amount=${amount}&isMonthly=true&method=card`);
    } finally {
      setIsCheckingOut(false);
    }
  };

  const handleGoToCampaign = () => {
    closeDonationModal();
    const target = options?.link && options.link.startsWith('/campanha') 
      ? options.link 
      : '/campanha';
    navigate(target);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 font-gotham-regular animate-fade-in">
      <div 
        className="fixed inset-0 bg-black/75 backdrop-blur-xs transition-opacity"
        onClick={closeDonationModal}
      />
      <div className="relative bg-white rounded-3xl max-w-lg w-full shadow-2xl overflow-hidden z-10 border border-orange-100 flex flex-col max-h-[90vh]">
        <button 
          onClick={closeDonationModal}
          className="absolute top-4 right-4 z-20 bg-black/40 hover:bg-black/60 text-white p-2 rounded-full transition-colors cursor-pointer"
          aria-label="Fechar"
        >
          <X size={18} />
        </button>

        <div className="relative h-44 sm:h-52 bg-slate-900 shrink-0">
          <img 
            src={imageUrl} 
            alt={title} 
            className="w-full h-full object-cover opacity-80"
            onError={(e) => {
              (e.target as HTMLImageElement).src = 'https://hope.yahchurch.com/wp-content/uploads/2025/09/HOPE-ALFACES.avif';
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent"></div>
          <div className="absolute bottom-4 left-6 right-6 text-white">
            <span 
              className="text-white text-[10px] font-gotham-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full mb-1.5 inline-block shadow-xs"
              style={{ backgroundColor: tagColor }}
            >
              {category}
            </span>
            <h3 className="text-xl sm:text-2xl font-black leading-tight drop-shadow-xs">
              {title}
            </h3>
          </div>
        </div>

        <div className="p-6 sm:p-7 overflow-y-auto">
          {description && (
            <p className="text-slate-500 text-xs sm:text-sm font-gotham-light leading-relaxed mb-4 line-clamp-2">
              {description}
            </p>
          )}

          <p className="text-slate-700 text-xs sm:text-sm font-gotham-bold mb-3 flex items-center gap-1.5">
            <Sparkles size={16} className="text-[#F49853]" />
            Selecione uma cota de apoio rápido:
          </p>

          <div className="space-y-2.5 mb-5">
            {STRIPE_QUOTAS.map((q) => (
              <button
                key={q.amount}
                type="button"
                disabled={isCheckingOut}
                onClick={() => handleStripeCheckout(q.amount)}
                className="w-full flex items-center justify-between p-3.5 rounded-2xl border-2 border-slate-100 hover:border-[#F49853] hover:bg-orange-50/50 transition-all text-left group cursor-pointer"
              >
                <div>
                  <span className="text-sm font-gotham-bold text-slate-900 block">R$ {q.amount}</span>
                  <span className="text-xs text-slate-500 font-gotham-regular">{q.label}</span>
                </div>
                <ArrowRight size={16} className="text-slate-400 group-hover:text-[#F49853] group-hover:translate-x-1 transition-all" />
              </button>
            ))}
          </div>

          <div className="space-y-2">
            <button
              onClick={handleGoToCampaign}
              className="w-full bg-[#F49853] hover:bg-[#e0853d] text-white py-3.5 rounded-2xl font-gotham-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-md hover:shadow-lg cursor-pointer"
            >
              <CreditCard size={15} />
              <span>Outro Valor / Doar via PIX ou Cartão</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
