import React, { useState } from 'react';
import { X, ArrowRight, CreditCard, Sparkles, Heart, User, Mail, Phone } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useDonationModal } from '../../contexts/DonationModalContext';

const STRIPE_QUOTAS = [
  { amount: 50, label: 'Alimenta uma criança' },
  { amount: 120, label: 'Apadrinhamento mensal' },
  { amount: 300, label: 'Cesta básica + Suplementos' },
];

export function DonationModal() {
  const { isOpen, options, closeDonationModal } = useDonationModal();
  const [frequency, setFrequency] = useState<'single' | 'monthly'>('single');
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [donorName, setDonorName] = useState('');
  const [donorEmail, setDonorEmail] = useState('');
  const [donorWhatsapp, setDonorWhatsapp] = useState('');
  const [formError, setFormError] = useState('');
  const navigate = useNavigate();

  if (!isOpen) return null;

  const title = options?.title || 'Resgate a Infância na Casa Nutri';
  const category = options?.category || 'Apoio Imediato';
  const tagColor = options?.tagColor || '#F49853';
  const imageUrl = options?.imageUrl || 'https://hope.yahchurch.com/wp-content/uploads/2025/09/HOPE-ALFACES.avif';
  const description = options?.description;

  const handleWhatsappChange = (val: string) => {
    const raw = val.replace(/\D/g, '').slice(0, 11);
    let formatted = raw;
    if (raw.length > 2) {
      formatted = `(${raw.slice(0, 2)}) ${raw.slice(2)}`;
    }
    if (raw.length > 7) {
      formatted = `(${raw.slice(0, 2)}) ${raw.slice(2, 7)}-${raw.slice(7)}`;
    }
    setDonorWhatsapp(formatted);
  };

  const handleCheckout = async (amount: number) => {
    setFormError('');
    if (!donorName.trim()) {
      setFormError('Por favor, informe seu nome.');
      return;
    }
    if (!donorEmail.trim() || !donorEmail.includes('@')) {
      setFormError('Por favor, informe um e-mail válido.');
      return;
    }
    if (!donorWhatsapp.trim() || donorWhatsapp.replace(/\D/g, '').length < 10) {
      setFormError('Por favor, informe seu WhatsApp com DDD.');
      return;
    }

    setIsCheckingOut(true);
    const isMonthly = frequency === 'monthly';
    const fallbackUrl = isMonthly 
      ? `/mantenedor?amount=${amount}&name=${encodeURIComponent(donorName)}&email=${encodeURIComponent(donorEmail)}&whatsapp=${encodeURIComponent(donorWhatsapp)}` 
      : `/campanha?amount=${amount}&isMonthly=false&method=card&name=${encodeURIComponent(donorName)}&email=${encodeURIComponent(donorEmail)}&whatsapp=${encodeURIComponent(donorWhatsapp)}`;

    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
      if (!supabaseUrl) {
        closeDonationModal();
        navigate(fallbackUrl);
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
          isMonthly,
          donorName: donorName.trim(),
          donorEmail: donorEmail.trim(),
          donorPhone: donorWhatsapp.trim(),
          donorWhatsapp: donorWhatsapp.trim(),
          successUrl: isMonthly
            ? `${window.location.origin}/mantenedor?status=success`
            : `${window.location.origin}/campanha?status=success`,
          cancelUrl: `${window.location.origin}/?status=cancel`
        })
      });

      const data = await response.json();
      closeDonationModal();
      if (data.url) {
        window.location.href = data.url;
      } else {
        navigate(fallbackUrl);
      }
    } catch {
      closeDonationModal();
      navigate(fallbackUrl);
    } finally {
      setIsCheckingOut(false);
    }
  };

  const handleSecondaryAction = () => {
    closeDonationModal();
    if (frequency === 'monthly') {
      navigate('/mantenedor');
    } else {
      const target = options?.link && options.link.startsWith('/campanha') 
        ? options.link 
        : '/campanha';
      navigate(target);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 font-gotham-regular animate-fade-in">
      <div 
        className="fixed inset-0 bg-black/75 backdrop-blur-xs transition-opacity"
        onClick={closeDonationModal}
      />
      <div className="relative bg-white rounded-t-[2.5rem] sm:rounded-3xl max-w-lg w-full shadow-2xl overflow-hidden z-10 border border-orange-100 flex flex-col max-h-[88vh] sm:max-h-[90vh] pb-safe animate-slideUp sm:animate-none">
        {/* Mobile Drag Indicator Handle */}
        <div className="sm:hidden w-12 h-1 bg-white/50 rounded-full mx-auto absolute top-2 left-1/2 -translate-x-1/2 z-30 pointer-events-none" />

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
          {/* Toggle Doação Única vs Mensal (Mantenedor) */}
          <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1 rounded-2xl mb-4 text-xs font-gotham-bold">
            <button
              type="button"
              onClick={() => setFrequency('single')}
              className={`py-2.5 rounded-xl transition-all ${
                frequency === 'single'
                  ? 'bg-white text-slate-900 shadow-sm border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Doação Única (Campanha)
            </button>
            <button
              type="button"
              onClick={() => setFrequency('monthly')}
              className={`py-2.5 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                frequency === 'monthly'
                  ? 'bg-[#F49853] text-white shadow-md'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Heart size={13} fill="currentColor" />
              <span>Mensal (Mantenedor)</span>
            </button>
          </div>

          {description && (
            <p className="text-slate-500 text-xs sm:text-sm font-gotham-light leading-relaxed mb-4 line-clamp-2">
              {description}
            </p>
          )}

          <div className="mb-4 bg-slate-50/80 p-3.5 rounded-2xl border border-slate-100 space-y-2">
            <p className="text-[11px] font-gotham-bold text-slate-600 uppercase tracking-wider">
              Seus Dados para Contato
            </p>

            <div className="relative">
              <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Nome completo"
                value={donorName}
                onChange={(e) => {
                  setDonorName(e.target.value);
                  if (formError) setFormError('');
                }}
                className="w-full pl-8 pr-3 py-2 rounded-xl border border-slate-200 focus:outline-hidden focus:border-[#F49853] text-xs font-gotham-regular text-slate-800 bg-white"
              />
            </div>

            <div className="relative">
              <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="email"
                placeholder="Seu melhor e-mail"
                value={donorEmail}
                onChange={(e) => {
                  setDonorEmail(e.target.value);
                  if (formError) setFormError('');
                }}
                className="w-full pl-8 pr-3 py-2 rounded-xl border border-slate-200 focus:outline-hidden focus:border-[#F49853] text-xs font-gotham-regular text-slate-800 bg-white"
              />
            </div>

            <div className="relative">
              <Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="tel"
                placeholder="WhatsApp (DDD + Número)"
                value={donorWhatsapp}
                onChange={(e) => {
                  handleWhatsappChange(e.target.value);
                  if (formError) setFormError('');
                }}
                maxLength={15}
                className="w-full pl-8 pr-3 py-2 rounded-xl border border-slate-200 focus:outline-hidden focus:border-[#F49853] text-xs font-gotham-regular text-slate-800 bg-white"
              />
            </div>

            {formError && (
              <p className="text-[11px] font-gotham-bold text-red-600 bg-red-50 p-2 rounded-lg border border-red-200 animate-fade-in">
                {formError}
              </p>
            )}
          </div>

          <p className="text-slate-700 text-xs sm:text-sm font-gotham-bold mb-3 flex items-center gap-1.5">
            <Sparkles size={16} className="text-[#F49853]" />
            {frequency === 'monthly'
              ? 'Escolha sua cota de mantenedor mensal:'
              : 'Selecione uma cota de apoio rápido à campanha:'}
          </p>

          <div className="space-y-2.5 mb-5">
            {STRIPE_QUOTAS.map((q) => (
              <button
                key={q.amount}
                type="button"
                disabled={isCheckingOut}
                onClick={() => handleCheckout(q.amount)}
                className="w-full flex items-center justify-between p-3.5 rounded-2xl border-2 border-slate-100 hover:border-[#F49853] hover:bg-orange-50/50 transition-all text-left group cursor-pointer"
              >
                <div>
                  <span className="text-sm font-gotham-bold text-slate-900 block">
                    R$ {q.amount} {frequency === 'monthly' ? '/ mês' : ''}
                  </span>
                  <span className="text-xs text-slate-500 font-gotham-regular">{q.label}</span>
                </div>
                <ArrowRight size={16} className="text-slate-400 group-hover:text-[#F49853] group-hover:translate-x-1 transition-all" />
              </button>
            ))}
          </div>

          <div className="space-y-2">
            <button
              onClick={handleSecondaryAction}
              className="w-full bg-[#F49853] hover:bg-[#e0853d] text-white py-3.5 rounded-2xl font-gotham-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-md hover:shadow-lg cursor-pointer"
            >
              {frequency === 'monthly' ? (
                <>
                  <Heart size={15} fill="currentColor" />
                  <span>Seja um Mantenedor Mensal (Outro Valor)</span>
                </>
              ) : (
                <>
                  <CreditCard size={15} />
                  <span>Outro Valor / Doar para a Campanha</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
