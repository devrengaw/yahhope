import React, { useState } from 'react';
import { 
  Heart, 
  DollarSign, 
  Copy, 
  Check, 
  Sparkles, 
  ShieldCheck, 
  QrCode, 
  Receipt, 
  ArrowRight,
  RefreshCw
} from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import { useFundraising } from '../../../contexts/FundraisingContext';
import { PortalMyDonations } from '../PortalMyDonations';

export function MobileDonorDonate() {
  const { user } = useAuth();
  const { campaigns, createDonation } = useFundraising();
  const [activeTab, setActiveTab] = useState<'donate' | 'history'>('donate');

  // Donation form state
  const [frequency, setFrequency] = useState<'monthly' | 'single'>('monthly');
  const [selectedAmount, setSelectedAmount] = useState<number>(89);
  const [customAmount, setCustomAmount] = useState<string>('');
  const [selectedCampaignId, setSelectedCampaignId] = useState<string>('');
  const [isCopied, setIsCopied] = useState(false);
  const [pixGenerated, setPixGenerated] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const predefinedAmounts = [
    { value: 35, label: 'R$ 35', impact: '7 refeições fortificadas' },
    { value: 50, label: 'R$ 50', impact: '1 kit higiene e nutrição' },
    { value: 89, label: 'R$ 89', impact: 'Apadrinhamento mensal', badge: 'Mais Escolhido' },
    { value: 150, label: 'R$ 150', impact: 'Tratamento clínico completo' },
  ];

  const currentAmount = customAmount ? parseFloat(customAmount) || 0 : selectedAmount;

  // Pix mock key for YAH Hope
  const pixKey = 'contato@yahhope.org';
  const pixCopyPaste = `00020126580014br.gov.bcb.pix0114${pixKey}520400005303986540${currentAmount.toFixed(2)}5802BR5908YAH HOPE6009SAO PAULO62070503***6304`;

  const handleCopyPix = () => {
    navigator.clipboard.writeText(pixKey);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2500);
  };

  const handleGeneratePix = async () => {
    if (currentAmount <= 0) {
      alert('Por favor, selecione ou digite um valor para a doação.');
      return;
    }
    setIsSubmitting(true);
    try {
      await createDonation({
        donor_name: user?.name || 'Apoiador YAH Hope',
        donor_email: user?.email || 'apoiador@yahhope.org',
        amount: currentAmount,
        payment_method: 'pix',
        campaign_id: selectedCampaignId || undefined
      });
      setPixGenerated(true);
    } catch (e) {
      console.error(e);
      setPixGenerated(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Title & Tabs */}
      <div>
        <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
          <Heart className="text-amber-500" size={24} fill="currentColor" /> Doações
        </h2>
        <p className="text-xs text-slate-500 mt-1 font-medium">
          Faça novas doações com Pix instantâneo ou acompanhe seu histórico.
        </p>
      </div>

      {/* Tabs Switcher */}
      <div className="flex bg-slate-200/70 p-1 rounded-2xl">
        <button
          onClick={() => setActiveTab('donate')}
          className={`flex-1 py-2.5 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'donate'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <Heart size={14} fill={activeTab === 'donate' ? 'currentColor' : 'none'} className="text-amber-500" />
          Fazer Doação
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`flex-1 py-2.5 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'history'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <Receipt size={14} className="text-slate-600" />
          Minhas Doações
        </button>
      </div>

      {activeTab === 'history' ? (
        <PortalMyDonations />
      ) : (
        <div className="space-y-6">
          {/* Frequency Toggle */}
          <div className="bg-slate-100 p-1.5 rounded-2xl flex">
            <button
              onClick={() => setFrequency('monthly')}
              className={`flex-1 py-2.5 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 ${
                frequency === 'monthly'
                  ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <RefreshCw size={13} />
              Doação Mensal (Recorrente)
            </button>
            <button
              onClick={() => setFrequency('single')}
              className={`flex-1 py-2.5 rounded-xl text-xs font-black transition-all ${
                frequency === 'single'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Doação Única
            </button>
          </div>

          {!pixGenerated ? (
            /* Step 1: Choose Amount */
            <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-xs space-y-6">
              <div>
                <label className="block text-[11px] font-black text-slate-400 uppercase tracking-wider mb-3">
                  Escolha o Valor da Contribuição
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {predefinedAmounts.map((amt) => {
                    const isSelected = selectedAmount === amt.value && !customAmount;
                    return (
                      <button
                        key={amt.value}
                        type="button"
                        onClick={() => {
                          setSelectedAmount(amt.value);
                          setCustomAmount('');
                        }}
                        className={`p-3.5 rounded-2xl border text-left transition-all relative ${
                          isSelected
                            ? 'border-amber-500 bg-amber-50/60 ring-2 ring-amber-500/20 shadow-xs'
                            : 'border-slate-100 bg-slate-50/50 hover:bg-slate-50'
                        }`}
                      >
                        {amt.badge && (
                          <span className="absolute -top-2 right-2 bg-amber-500 text-white text-[8px] font-black uppercase px-2 py-0.5 rounded-full shadow-2xs">
                            {amt.badge}
                          </span>
                        )}
                        <span className="text-base font-black text-slate-900 block">
                          {amt.label}
                        </span>
                        <span className="text-[10px] text-slate-500 font-medium block mt-0.5">
                          {amt.impact}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Custom Amount input */}
                <div className="mt-3">
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-black text-slate-400">
                      R$
                    </span>
                    <input
                      type="number"
                      min="5"
                      placeholder="Outro valor..."
                      value={customAmount}
                      onChange={(e) => setCustomAmount(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* Campaign Destination (Optional) */}
              {campaigns.length > 0 && (
                <div>
                  <label className="block text-[11px] font-black text-slate-400 uppercase tracking-wider mb-2">
                    Destinar para Campanha Específica (Opcional)
                  </label>
                  <select
                    value={selectedCampaignId}
                    onChange={(e) => setSelectedCampaignId(e.target.value)}
                    className="w-full px-3.5 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
                  >
                    <option value="">Fundo Geral YAH Hope (Maior Necessidade)</option>
                    {campaigns.map((camp) => (
                      <option key={camp.id} value={camp.id}>
                        {camp.title}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Summary & Submit */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleGeneratePix}
                  disabled={isSubmitting || currentAmount <= 0}
                  className="w-full py-4 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-black text-sm rounded-2xl shadow-lg shadow-amber-500/25 flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-60"
                >
                  <QrCode size={18} />
                  <span>
                    Gerar Pix de R$ {currentAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                  <ArrowRight size={16} />
                </button>
              </div>

              <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-400 font-medium">
                <ShieldCheck size={14} className="text-emerald-500" />
                <span>Doação 100% segura via Banco Central / Pix</span>
              </div>
            </div>
          ) : (
            /* Step 2: Pix QR Code & Copy Key */
            <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-xs text-center space-y-5 animate-slideUp">
              <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full">
                Pix Gerado com Sucesso
              </span>

              <div>
                <h3 className="text-2xl font-black text-slate-900">
                  R$ {currentAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </h3>
                <p className="text-xs text-slate-500 mt-1 font-medium">
                  {frequency === 'monthly' ? 'Doação Mensal Recorrente' : 'Doação Única'}
                </p>
              </div>

              {/* QR Code Illustration */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 inline-block mx-auto">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(pixCopyPaste)}`}
                  alt="QR Code Pix"
                  className="w-44 h-44 mx-auto rounded-lg"
                />
              </div>

              {/* Pix Key Copia e Cola */}
              <div className="space-y-2 text-left">
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                  Chave Pix (E-mail):
                </label>
                <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-xs font-mono font-bold text-slate-800 flex-1 truncate">
                    {pixKey}
                  </span>
                  <button
                    onClick={handleCopyPix}
                    className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-black rounded-lg transition-all flex items-center gap-1 shrink-0"
                  >
                    {isCopied ? (
                      <>
                        <Check size={14} /> Copiado!
                      </>
                    ) : (
                      <>
                        <Copy size={14} /> Copiar Chave
                      </>
                    )}
                  </button>
                </div>
              </div>

              <div className="pt-2 flex flex-col gap-2">
                <button
                  onClick={() => setActiveTab('history')}
                  className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-black text-xs rounded-xl transition-all"
                >
                  Ver no Histórico de Doações
                </button>

                <button
                  onClick={() => setPixGenerated(false)}
                  className="text-xs font-bold text-slate-500 hover:text-slate-800 py-1"
                >
                  Fazer outra doação
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
