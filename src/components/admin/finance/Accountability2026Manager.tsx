import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  QrCode,
  Globe,
  Copy,
  Check,
  Download,
  ExternalLink,
  ShieldCheck,
  TrendingUp,
  TrendingDown,
  Wallet,
  Building2,
  Layers,
  Clock,
  CheckCircle2,
  Eye,
  Save,
  Sparkles,
  Heart
} from 'lucide-react';
import { cn } from '../../../lib/utils';
import {
  ACCOUNTABILITY_2026_DOMAIN,
  ACCOUNTABILITY_2026_URL,
  ACCOUNTABILITY_2026_PATH,
  AccountabilityConfig,
  fetchAccountabilityConfig,
  getLocalAccountabilityConfig,
  saveAccountabilityConfig,
  getAccountabilityQrCodeUrl
} from '../../../services/accountabilityService';

interface ProjectCardSummary {
  moduleKey: string;
  name: string;
  description: string;
  repassed: number;
  realExpenses: number;
  monthlyTargetDemand: number;
  remainingToRepass: number;
  balanceInProject: number;
  coveragePct: number;
}

interface Accountability2026ManagerProps {
  selectedPeriodLabel: string;
  incomeTotal: number;
  padrinhosIncome: number;
  mantenedoresIncome: number;
  doacoesIncome: number;
  expenseTotal: number;
  repassedTotal: number;
  centralCash: number;
  projectsCash: number;
  consolidatedCash: number;
  projectCards: ProjectCardSummary[];
}

export function Accountability2026Manager({
  selectedPeriodLabel,
  incomeTotal,
  padrinhosIncome,
  mantenedoresIncome,
  doacoesIncome,
  expenseTotal,
  repassedTotal,
  centralCash,
  projectsCash,
  consolidatedCash,
  projectCards
}: Accountability2026ManagerProps) {
  const [config, setConfig] = useState<AccountabilityConfig>(() => getLocalAccountabilityConfig());
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedToast, setSavedToast] = useState(false);
  const [downloadingQr, setDownloadingQr] = useState(false);

  useEffect(() => {
    fetchAccountabilityConfig().then(setConfig);
  }, []);

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(ACCOUNTABILITY_2026_URL);
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 3000);
    } catch {
      // Fallback
    }
  };

  const handleDownloadQrCode = async () => {
    setDownloadingQr(true);
    try {
      const qrUrl = getAccountabilityQrCodeUrl(1000);
      const response = await fetch(qrUrl);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = 'qrcode-prestacao2026-yahhope.png';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
    } catch {
      window.open(getAccountabilityQrCodeUrl(1000), '_blank');
    } finally {
      setDownloadingQr(false);
    }
  };

  const handleSaveConfig = async (nextConfig: AccountabilityConfig) => {
    setSaving(true);
    try {
      const saved = await saveAccountabilityConfig(nextConfig);
      setConfig(saved);
      setSavedToast(true);
      setTimeout(() => setSavedToast(false), 4000);
    } finally {
      setSaving(false);
    }
  };

  const qrCodePreviewUrl = getAccountabilityQrCodeUrl(400);

  return (
    <div className="p-6 sm:p-8 space-y-8">
      {/* BANNER PRINCIPAL: DOMÍNIO REGISTRADO + QR CODE DO CARTÃO DE AGRADECIMENTO */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute -right-16 -top-16 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
          {/* Coluna Esquerda (8 cols): Informações do Caminho & Controles */}
          <div className="lg:col-span-8 space-y-5">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-black uppercase tracking-wider">
                <Globe size={13} /> Caminho Oficial Registrado
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-400/30 text-amber-300 text-xs font-black uppercase tracking-wider">
                <QrCode size={13} /> Pronto para Impressão do Cartão de Agradecimento
              </span>
              {savedToast && (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-500 text-slate-950 text-xs font-black">
                  <Check size={13} /> Configurações salvas!
                </span>
              )}
            </div>

            <div>
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
                Página de Prestação de Contas 2026
              </h2>
              <p className="text-slate-300 text-xs sm:text-sm mt-1.5 leading-relaxed max-w-2xl">
                Este é o endereço oficial vinculado ao QR Code do <strong>Cartão de Agradecimento</strong>. A página apresenta os 4 pilares da nossa transparência: <strong>Nossa Entrada</strong>, <strong>Nossa Saída</strong>, <strong>Quanto Temos em Caixa</strong> e <strong>Cada Projeto Executado</strong>.
              </p>
            </div>

            {/* Caixa de Destaque do Domínio Oficial */}
            <div className="bg-white/10 backdrop-blur-xs border border-white/15 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-0.5">
                <span className="text-[10px] font-black uppercase tracking-widest text-emerald-300 block">
                  URL Oficial para o QR Code Impresso
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-lg sm:text-xl font-black text-white tracking-tight select-all">
                    {ACCOUNTABILITY_2026_URL}
                  </span>
                </div>
                <span className="text-[11px] text-slate-400 block">
                  Subdomínio: <code>{ACCOUNTABILITY_2026_DOMAIN}</code> • Rota direta: <code>{ACCOUNTABILITY_2026_PATH}</code>
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={handleCopyUrl}
                  className="px-4 py-2.5 rounded-xl bg-white text-slate-900 hover:bg-slate-100 font-black text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
                >
                  {copiedUrl ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                  {copiedUrl ? 'Link Copiado!' : 'Copiar Link'}
                </button>

                <Link
                  to={ACCOUNTABILITY_2026_PATH}
                  target="_blank"
                  className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs flex items-center gap-1.5 transition-all shadow-sm"
                >
                  <Eye size={14} />
                  Abrir Página Pública
                  <ExternalLink size={12} />
                </Link>
              </div>
            </div>

            {/* Seletor de Modo: Em Estruturação vs Publicado Ao Vivo */}
            <div className="bg-black/25 border border-white/10 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-xs font-black text-white flex items-center gap-2">
                  Status de Exibição dos Valores no Site Público:
                  {config.showLiveNumbers ? (
                    <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-[10px] uppercase">
                      Valores Ao Vivo Publicados
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-400/30 text-[10px] uppercase">
                      Modo Estrutura / Em Consolidação
                    </span>
                  )}
                </span>
                <p className="text-[11px] text-slate-300 mt-0.5">
                  {config.showLiveNumbers
                    ? 'Os doadores que escanearem o QR Code já visualizam os valores reais de entrada, saída, caixa e projetos.'
                    : 'A página e o QR Code já funcionam com a estrutura dos 4 pilares, informando que os números de 2026 estão em consolidação.'}
                </p>
              </div>

              <button
                type="button"
                disabled={saving}
                onClick={() =>
                  handleSaveConfig({
                    ...config,
                    mode: !config.showLiveNumbers ? 'published' : 'establishing',
                    showLiveNumbers: !config.showLiveNumbers
                  })
                }
                className={cn(
                  'px-4 py-2.5 rounded-xl text-xs font-black transition-all shrink-0 cursor-pointer',
                  config.showLiveNumbers
                    ? 'bg-amber-500 hover:bg-amber-400 text-slate-950'
                    : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950'
                )}
              >
                {config.showLiveNumbers ? 'Voltar para "Em Consolidação"' : 'Publicar Números Reais no Site'}
              </button>
            </div>
          </div>

          {/* Coluna Direita (4 cols): Card do QR Code para Impressão */}
          <div className="lg:col-span-4 bg-white text-slate-900 rounded-3xl p-6 shadow-2xl flex flex-col items-center text-center space-y-4">
            <div className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-slate-500">
              <QrCode size={15} className="text-emerald-600" />
              QR Code Oficial (Alta Leitura)
            </div>

            <div className="p-3 bg-white rounded-2xl border-2 border-slate-100 shadow-inner">
              <img
                src={qrCodePreviewUrl}
                alt={`QR Code para ${ACCOUNTABILITY_2026_URL}`}
                className="w-44 h-44 object-contain mx-auto"
              />
            </div>

            <div>
              <p className="text-xs font-black text-slate-900">{ACCOUNTABILITY_2026_DOMAIN}</p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Aponta diretamente para <strong>{ACCOUNTABILITY_2026_URL}</strong>
              </p>
            </div>

            <button
              type="button"
              onClick={handleDownloadQrCode}
              disabled={downloadingQr}
              className="w-full py-3 px-4 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-black text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md"
            >
              <Download size={15} className="text-emerald-400" />
              {downloadingQr ? 'Gerando PNG 1000x1000...' : 'Baixar QR Code para Gráfica (PNG)'}
            </button>
          </div>
        </div>
      </div>

      {/* PRÉVIA DA ESTRUTURA DA PÁGINA DE PRESTAÇÃO DE CONTAS (OS 4 PILARES) */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
              <ShieldCheck size={20} className="text-emerald-600" />
              Estrutura da Prestação de Contas ({selectedPeriodLabel})
            </h3>
            <p className="text-xs text-slate-500 font-medium">
              Resumo dos 4 blocos que compõem a página <strong>{ACCOUNTABILITY_2026_DOMAIN}</strong>: Nossa Entrada, Nossa Saída, Quanto Temos em Caixa e Cada Projeto Executado.
            </p>
          </div>

          <Link
            to={`${ACCOUNTABILITY_2026_PATH}?preview=live`}
            target="_blank"
            className="text-xs font-black text-emerald-700 hover:text-emerald-800 flex items-center gap-1 self-start sm:self-auto"
          >
            Simular Página com Números Reais <ExternalLink size={13} />
          </Link>
        </div>

        {/* 3 Cards Financeiros + 1 Seção de Projetos Executados */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* 1. Nossa Entrada */}
          <div className="bg-slate-50/80 p-6 rounded-3xl border border-emerald-200/80 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase tracking-wider">
                  1. Nossa Entrada
                </span>
                <TrendingUp size={18} className="text-emerald-600" />
              </div>
              <p className="text-xs font-bold text-slate-500">Total de Entradas no Período</p>
              <p className="text-2xl font-black text-slate-900 mt-1">
                R$ {incomeTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-200/70 space-y-1.5 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Padrinhos (Cotas):</span>
                <strong className="text-slate-900">R$ {padrinhosIncome.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Mantenedores:</span>
                <strong className="text-slate-900">R$ {mantenedoresIncome.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Doações Gerais:</span>
                <strong className="text-slate-900">R$ {doacoesIncome.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong>
              </div>
            </div>
          </div>

          {/* 2. Nossa Saída */}
          <div className="bg-slate-50/80 p-6 rounded-3xl border border-rose-200/80 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="px-2.5 py-1 rounded-lg bg-rose-100 text-rose-800 text-[10px] font-black uppercase tracking-wider">
                  2. Nossa Saída
                </span>
                <TrendingDown size={18} className="text-rose-600" />
              </div>
              <p className="text-xs font-bold text-slate-500">Total de Saídas Efetivadas</p>
              <p className="text-2xl font-black text-rose-600 mt-1">
                R$ {expenseTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-200/70 space-y-1.5 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Repassado aos Projetos:</span>
                <strong className="text-slate-900">R$ {repassedTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Projetos Ativos:</span>
                <strong className="text-slate-900">{projectCards.length} frentes</strong>
              </div>
            </div>
          </div>

          {/* 3. Quanto Temos em Caixa */}
          <div className="bg-slate-900 p-6 rounded-3xl text-white flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 text-[10px] font-black uppercase tracking-wider">
                  3. Quanto Temos em Caixa
                </span>
                <Wallet size={18} className="text-emerald-400" />
              </div>
              <p className="text-xs font-bold text-slate-400">Saldo Consolidado em Caixa</p>
              <p className="text-2xl font-black text-white mt-1">
                R$ {consolidatedCash.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>

            <div className="mt-4 pt-3 border-t border-white/10 space-y-1.5 text-xs">
              <div className="flex justify-between text-slate-300">
                <span>Caixa Central Livre:</span>
                <strong className="text-white">R$ {centralCash.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Saldo nos Projetos:</span>
                <strong className="text-emerald-400">R$ {projectsCash.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong>
              </div>
            </div>
          </div>
        </div>

        {/* 4. Cada Projeto Executado */}
        <div className="bg-slate-50/70 rounded-3xl p-6 border border-slate-200/80 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-lg bg-indigo-100 text-indigo-800 text-[10px] font-black uppercase tracking-wider">
                4. Cada Projeto Executado
              </span>
              <h4 className="text-sm font-black text-slate-900">
                Demonstrativo por Projeto ({projectCards.length})
              </h4>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {projectCards.map((proj) => (
              <div
                key={proj.moduleKey}
                className="bg-white p-5 rounded-2xl border border-slate-200/80 flex flex-col justify-between gap-4"
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <h5 className="font-black text-slate-900 text-sm">{proj.name}</h5>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-50 text-emerald-700 border border-emerald-200">
                      {proj.coveragePct}% coberto
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2">{proj.description}</p>
                </div>

                <div className="grid grid-cols-3 gap-2 pt-3 border-t border-slate-100 text-xs">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">Repassado</span>
                    <strong className="text-emerald-600">
                      R$ {proj.repassed.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </strong>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">Executado</span>
                    <strong className="text-slate-900">
                      R$ {proj.realExpenses.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </strong>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">Saldo Projeto</span>
                    <strong className={proj.balanceInProject >= 0 ? 'text-slate-900' : 'text-rose-600'}>
                      R$ {proj.balanceInProject.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </strong>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
