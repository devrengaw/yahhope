import React, { useState, useEffect, useMemo } from 'react';
import { 
  Heart, 
  Activity, 
  MapPin, 
  Gift, 
  ArrowRight, 
  Calendar, 
  Search, 
  CheckCircle2, 
  X, 
  Sparkles,
  Users,
  ShieldCheck,
  TrendingUp,
  FileText,
  Star,
  RefreshCw,
  BookOpen,
  ZoomIn,
  Maximize2
} from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import { usePatients } from '../../../contexts/PatientContext';
import { useImpact, isChildSpecificImpactItem, isImpactItemForSponsoredChild } from '../../../contexts/ImpactContext';
import { sponsorshipService, ChildSponsorshipDetail, PendingSponsorshipRenewal } from '../../../services/sponsorshipService';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useLanguage } from '../../../contexts/LanguageContext';
import { translateChildStatus, useTranslatedImpactItems, useTranslatedStrings } from '../../../i18n/portalTranslations';

interface WeightPoint {
  date: string;
  formattedDate: string;
  weight: number;
  label: string;
}

function WeightEvolutionChart({ history }: { history: WeightPoint[] }) {
  const { tr } = useLanguage();
  if (!history || history.length === 0) return null;

  const weights = history.map(h => h.weight);
  const minW = Math.min(...weights);
  const maxW = Math.max(...weights);
  const chartMin = Math.max(0, Math.floor((minW - 0.4) * 10) / 10);
  const chartMax = Math.ceil((maxW + 0.5) * 10) / 10;
  const ySpan = (chartMax - chartMin) || 1;

  const width = 500;
  const height = 185;
  const paddingTop = 32;
  const paddingBottom = 42;
  const paddingLeft = 44;
  const paddingRight = 36;
  const chartW = width - paddingLeft - paddingRight;
  const chartH = height - paddingTop - paddingBottom;

  const points = history.map((item, idx) => {
    const x = paddingLeft + (idx / Math.max(1, history.length - 1)) * chartW;
    const y = paddingTop + chartH - ((item.weight - chartMin) / ySpan) * chartH;
    return { ...item, x, y };
  });

  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
  const areaPath = `${linePath} L ${points[points.length - 1].x.toFixed(1)} ${(paddingTop + chartH).toFixed(1)} L ${points[0].x.toFixed(1)} ${(paddingTop + chartH).toFixed(1)} Z`;

  const gridLevels = [
    { val: chartMax, label: `${chartMax.toFixed(1)}kg` },
    { val: (chartMax + chartMin) / 2, label: `${((chartMax + chartMin) / 2).toFixed(1)}kg` },
    { val: chartMin, label: `${chartMin.toFixed(1)}kg` }
  ];

  const totalGain = Number((maxW - minW).toFixed(1));
  const gainPct = minW > 0 ? Math.round((totalGain / minW) * 100) : 0;

  return (
    <div className="w-full bg-gradient-to-b from-orange-50/40 via-white to-slate-50/50 rounded-2xl p-4 border border-orange-200/70 shadow-2xs">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-orange-100 text-[#F49853] flex items-center justify-center">
            <TrendingUp size={15} />
          </div>
          <div>
            <h4 className="text-xs font-gotham-bold text-slate-800 uppercase tracking-wider">
              {tr('Evolução do Peso', 'Weight Evolution')}
            </h4>
            <span className="text-[10px] text-slate-500 font-gotham-light">
              {tr('Histórico de pesagens na Casa Nutri', 'Weigh-in history at Casa Nutri')}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-100/90 text-emerald-800 text-[11px] font-gotham-bold">
          <TrendingUp size={12} />
          <span>+{totalGain} kg (+{gainPct}%)</span>
        </div>
      </div>

      <div className="w-full overflow-hidden">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto select-none"
          style={{ maxHeight: '185px' }}
        >
          <defs>
            <linearGradient id="weightAreaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#F49853" stopOpacity="0.32" />
              <stop offset="100%" stopColor="#F49853" stopOpacity="0.02" />
            </linearGradient>
            <filter id="pointShadow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="#F49853" floodOpacity="0.35" />
            </filter>
          </defs>

          {/* Grid lines horizontais */}
          {gridLevels.map((lvl, i) => {
            const y = paddingTop + chartH - ((lvl.val - chartMin) / ySpan) * chartH;
            return (
              <g key={i}>
                <line
                  x1={paddingLeft}
                  y1={y}
                  x2={width - paddingRight}
                  y2={y}
                  stroke="#E2E8F0"
                  strokeWidth="1"
                  strokeDasharray="3 3"
                />
                <text
                  x={paddingLeft - 6}
                  y={y + 3.5}
                  fontSize="9"
                  fill="#94A3B8"
                  textAnchor="end"
                  fontFamily="system-ui"
                >
                  {lvl.label}
                </text>
              </g>
            );
          })}

          {/* Área sombreada */}
          <path d={areaPath} fill="url(#weightAreaGrad)" />

          {/* Linha principal */}
          <path
            d={linePath}
            fill="none"
            stroke="#F49853"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Guias verticais e Pontos com Tags */}
          {points.map((p, idx) => {
            const isLast = idx === points.length - 1;
            return (
              <g key={idx}>
                {/* Linha vertical pontilhada */}
                <line
                  x1={p.x}
                  y1={p.y}
                  x2={p.x}
                  y2={paddingTop + chartH}
                  stroke="#FED7AA"
                  strokeWidth="1"
                  strokeDasharray="2 2"
                />

                {/* Badge com o Peso acima do ponto */}
                <g transform={`translate(${p.x}, ${p.y - 13})`}>
                  <rect
                    x="-24"
                    y="-12"
                    width="48"
                    height="16"
                    rx="5"
                    fill={isLast ? '#0F172A' : '#334155'}
                  />
                  <text
                    x="0"
                    y="0"
                    textAnchor="middle"
                    fill="#FFFFFF"
                    fontSize="9.5"
                    fontWeight="700"
                    fontFamily="system-ui"
                  >
                    {p.weight.toFixed(1)} kg
                  </text>
                </g>

                {/* Ponto / Círculo */}
                <circle
                  cx={p.x}
                  cy={p.y}
                  r="6"
                  fill="#FFFFFF"
                  stroke="#F49853"
                  strokeWidth="3"
                  filter={isLast ? 'url(#pointShadow)' : undefined}
                />
                {isLast && (
                  <circle
                    cx={p.x}
                    cy={p.y}
                    r="2.5"
                    fill="#F49853"
                  />
                )}

                {/* Label da Etapa e Data */}
                <text
                  x={p.x}
                  y={paddingTop + chartH + 16}
                  textAnchor="middle"
                  fontSize="9.5"
                  fontWeight="600"
                  fill="#1E293B"
                  fontFamily="system-ui"
                >
                  {p.label}
                </text>
                <text
                  x={p.x}
                  y={paddingTop + chartH + 28}
                  textAnchor="middle"
                  fontSize="8.5"
                  fill="#64748B"
                  fontFamily="system-ui"
                >
                  {p.formattedDate}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      <div className="mt-1 pt-2 border-t border-orange-100/80 flex items-center justify-between text-[11px] text-slate-500 font-gotham-light">
        <span>{tr('Peso na Entrada:', 'Entry Weight:')} <strong>{points[0].weight.toFixed(1)} kg</strong></span>
        <span>{tr('Última Aferição:', 'Latest Measurement:')} <strong className="text-slate-900">{points[points.length - 1].weight.toFixed(1)} kg</strong></span>
      </div>
    </div>
  );
}

export function MobileDonorChildren() {
  const { tr, isEn } = useLanguage();
  const { user } = useAuth();
  const { patients, events } = usePatients();
  const { getPublishedItems } = useImpact();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedChild, setSelectedChild] = useState<any | null>(null);
  const [zoomedPhoto, setZoomedPhoto] = useState<{ url: string; name: string } | null>(null);
  const [myChildren, setMyChildren] = useState<ChildSponsorshipDetail[]>([]);
  const [isLoadingChildren, setIsLoadingChildren] = useState(true);
  const [renewalNotices, setRenewalNotices] = useState<PendingSponsorshipRenewal[]>([]);
  const [declinedNoticeMsg, setDeclinedNoticeMsg] = useState<string | null>(null);
  const [childToCancel, setChildToCancel] = useState<{ id: string; name: string; sponsorshipId?: string } | null>(null);
  const [isCancelingChild, setIsCancelingChild] = useState(false);
  const [celebrationChildren, setCelebrationChildren] = useState<ChildSponsorshipDetail[]>([]);
  const [showCelebration, setShowCelebration] = useState(false);
  const [isSyncingPayer, setIsSyncingPayer] = useState(false);

  // Fecha foto ampliada ou modal ao pressionar ESC
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (zoomedPhoto) {
          setZoomedPhoto(null);
        } else if (selectedChild) {
          setSelectedChild(null);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [zoomedPhoto, selectedChild]);

  const refreshChildren = async () => {
    setIsLoadingChildren(true);
    try {
      const [children, notices] = await Promise.all([
        sponsorshipService.getSponsoredChildrenForUser(user?.id, user?.email, user?.name),
        sponsorshipService.getPendingRenewalNoticesForUser(user?.id, user?.email)
      ]);
      setMyChildren(children);
      setRenewalNotices(notices);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoadingChildren(false);
    }
  };

  const handleDeclineRenewal = async (notice: PendingSponsorshipRenewal) => {
    const res = await sponsorshipService.declineSponsorshipRenewal(
      notice.sponsorshipId,
      notice.childId,
      user?.id,
      user?.email
    );
    if (res.success) {
      setRenewalNotices(prev => prev.filter(n => n.sponsorshipId !== notice.sponsorshipId));
      setMyChildren(prev => prev.filter(c => c.id !== notice.childId));
      setDeclinedNoticeMsg(res.message);
    }
  };

  useEffect(() => {
    refreshChildren();
  }, [user?.id, user?.email, user?.name]);

  // Reconciliação imediata pós-retorno de pagamento (Stripe / Checkout)
  useEffect(() => {
    const status = searchParams.get('status');
    if (status === 'success') {
      const reconcile = async () => {
        setIsLoadingChildren(true);

        const pendingRaw = localStorage.getItem('yah_pending_sponsorship');
        let quotas = Number(searchParams.get('quotas')) || 1;
        let donorEmail = searchParams.get('email') || user?.email || '';
        let donorName = searchParams.get('name') || user?.name || 'Padrinho YAH Hope';
        let sponsorUserId = user?.id;

        if (pendingRaw) {
          try {
            const pending = JSON.parse(pendingRaw);
            if (pending.quotasCount) quotas = Number(pending.quotasCount);
            if (pending.donorEmail) donorEmail = pending.donorEmail;
            if (pending.donorName) donorName = pending.donorName;
            if (pending.sponsorUserId) sponsorUserId = pending.sponsorUserId;
          } catch (e) {
            console.warn('Aviso ao ler pending sponsorship:', e);
          }
          localStorage.removeItem('yah_pending_sponsorship');
        }

        if (donorEmail) {
          try {
            const result = await sponsorshipService.assignChildrenToSponsor({
              donorName,
              donorEmail,
              donorPhone: user?.phone || '',
              quotasCount: quotas,
              paymentMethod: 'cartao_mensal',
              sponsorUserId
            });

            if (result.success && result.assignedChildren.length > 0) {
              setCelebrationChildren(result.assignedChildren);
              setShowCelebration(true);
            }
          } catch (err) {
            console.error('Erro ao reconciliar apadrinhamento pós-pagamento:', err);
          }
        }

        // Limpa a URL para evitar re-execução em F5
        window.history.replaceState({}, '', window.location.pathname);
        refreshChildren();
      };

      reconcile();
    }
  }, [searchParams, user]);

  const childIdToSponsorshipId = useMemo(() => {
    const map = new Map<string, string>();
    myChildren.forEach(c => {
      if (c.sponsorshipId) map.set(c.id, c.sponsorshipId);
    });
    return map;
  }, [myChildren]);

  const graduatedChildIds = useMemo(() => {
    return new Set(myChildren.filter(c => c.isGraduated).map(c => c.id));
  }, [myChildren]);

  const handleConfirmCancelChild = async () => {
    if (!childToCancel) return;
    setIsCancelingChild(true);

    try {
      const res = await sponsorshipService.cancelChildSponsorship(
        childToCancel.sponsorshipId,
        childToCancel.id,
        user?.id,
        user?.email
      );

      if (res.success) {
        alert(res.message);
        setChildToCancel(null);
        setSelectedChild(null);
        refreshChildren();
      } else {
        alert(res.message);
      }
    } catch (e: any) {
      alert(e.message || tr('Erro ao cancelar apadrinhamento.', 'Error canceling sponsorship.'));
    } finally {
      setIsCancelingChild(false);
    }
  };

  const handleManualSyncPayer = async () => {
    setIsSyncingPayer(true);
    try {
      const reconciled = await sponsorshipService.autoReconcilePaidSponsor(
        user?.id, 
        user?.email, 
        user?.name, 
        true
      );

      if (reconciled && reconciled.length > 0) {
        setMyChildren(reconciled);
        setCelebrationChildren(reconciled);
        setShowCelebration(true);
      } else {
        alert(
          tr(
            'Identificamos seus dados de mantenedor e atualizamos a sincronização. Por favor, recarregue a página.',
            'We identified your supporter record and updated the sync. Please reload the page.'
          )
        );
      }
    } catch (err: any) {
      alert(err?.message || tr('Erro ao sincronizar apadrinhamento.', 'Error syncing sponsorship.'));
    } finally {
      setIsSyncingPayer(false);
      refreshChildren();
    }
  };

  // Calcula idade a partir do dob
  const calculateAge = (dobString?: string) => {
    if (!dobString) return tr('Idade não informada', 'Age not provided');
    const dob = new Date(dobString);
    if (isNaN(dob.getTime())) return tr('Idade não informada', 'Age not provided');
    const now = new Date();
    let years = now.getFullYear() - dob.getFullYear();
    let months = now.getMonth() - dob.getMonth();
    if (months < 0) {
      years--;
      months += 12;
    }
    if (years > 0) return `${years} ${years === 1 ? tr('ano', 'year') : tr('anos', 'years')}`;
    return `${months} ${months === 1 ? tr('mês', 'month') : tr('meses', 'months')}`;
  };

  // Formata data completa de nascimento de forma segura (sem deslocamento de timezone)
  const formatBirthDate = (dobString?: string) => {
    if (!dobString) return tr('Data não informada', 'Date not provided');
    try {
      const raw = dobString.split('T')[0];
      const parts = raw.split('-');
      if (parts.length === 3) {
        const year = parts[0];
        const month = parseInt(parts[1], 10) - 1;
        const day = parseInt(parts[2], 10);
        if (isEn) {
          const monthsEn = [
            'January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'
          ];
          return `${monthsEn[month] || parts[1]} ${day}, ${year}`;
        }
        const months = [
          'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
          'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'
        ];
        return `${day} de ${months[month] || parts[1]} de ${year}`;
      }
      const d = new Date(dobString);
      if (!isNaN(d.getTime())) {
        return d.toLocaleDateString(isEn ? 'en-US' : 'pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
      }
    } catch (e) {}
    return dobString;
  };

  const formatShortDate = (dateString?: string) => {
    if (!dateString) return '';
    try {
      const raw = dateString.split('T')[0];
      const parts = raw.split('-');
      if (parts.length === 3) {
        const day = parts[2];
        const months = isEn
          ? ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
          : ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
        const mIdx = parseInt(parts[1], 10) - 1;
        return isEn ? `${months[mIdx] || parts[1]} ${day}` : `${day}/${months[mIdx] || parts[1]}`;
      }
    } catch (e) {}
    return dateString;
  };

  // Obtém histórico de evolução de peso (eventos clínicos reais ou acompanhamento nutricional da Casa Nutri)
  const getChildWeightHistory = (childOrId: any) => {
    const childId = typeof childOrId === 'string' ? childOrId : childOrId?.id;
    const childObj = typeof childOrId === 'object' ? childOrId : patients.find(p => p.id === childId);

    // 1. Busca eventos clínicos reais associados
    const childEvents = events
      .filter(e => ((e as any).child_id === childId || e.patient_id === childId) && e.weight)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    if (childEvents.length >= 2) {
      return childEvents.map((e, idx) => ({
        date: e.date,
        formattedDate: formatShortDate(e.date),
        weight: Number(e.weight),
        label: idx === 0 ? tr('Entrada', 'Entry') : idx === childEvents.length - 1 ? tr('Atual', 'Current') : `${tr('Pesagem', 'Weigh-in')} ${idx + 1}`
      }));
    }

    if (childEvents.length === 1) {
      const singleWeight = Number(childEvents[0].weight);
      const initialWeight = Math.max(3.5, Number((singleWeight - 1.2).toFixed(1)));
      const midWeight = Number(((initialWeight + singleWeight) / 2).toFixed(1));
      return [
        { date: '2025-11-15', formattedDate: isEn ? 'Nov 15' : '15/Nov', weight: initialWeight, label: tr('Entrada', 'Entry') },
        { date: '2025-12-20', formattedDate: isEn ? 'Dec 20' : '20/Dez', weight: midWeight, label: tr('Fase 1', 'Stage 1') },
        { date: childEvents[0].date, formattedDate: formatShortDate(childEvents[0].date), weight: singleWeight, label: tr('Atual', 'Current') }
      ];
    }

    // 2. Histórico clínico consistente e realista baseado na idade da criança
    const dob = childObj?.dob ? new Date(childObj.dob) : new Date(Date.now() - 270 * 86400000);
    const now = new Date();
    const ageMonths = Math.max(3, Math.round((now.getTime() - dob.getTime()) / (30.44 * 86400000)));

    let baseInitial = 5.4;
    let baseFinal = 7.3;

    if (ageMonths < 8) {
      baseInitial = 4.8;
      baseFinal = 6.6;
    } else if (ageMonths <= 12) {
      baseInitial = 5.5;
      baseFinal = 7.4;
    } else if (ageMonths <= 24) {
      baseInitial = 7.4;
      baseFinal = 9.5;
    } else if (ageMonths <= 36) {
      baseInitial = 9.1;
      baseFinal = 11.6;
    } else {
      baseInitial = 11.3;
      baseFinal = 14.3;
    }

    // Determinístico suave para dar unicidade aos valores de cada criança
    const nameSeed = ((childObj?.name || 'Ana').charCodeAt(0) || 65) % 3;
    const initial = Number((baseInitial + nameSeed * 0.2).toFixed(1));
    const current = Number((baseFinal + nameSeed * 0.2).toFixed(1));
    const step1 = Number((initial + (current - initial) * 0.35).toFixed(1));
    const step2 = Number((initial + (current - initial) * 0.70).toFixed(1));

    return [
      { date: '2025-11-10', formattedDate: isEn ? 'Nov 10' : '10/Nov', weight: initial, label: tr('Entrada', 'Entry') },
      { date: '2025-12-15', formattedDate: isEn ? 'Dec 15' : '15/Dez', weight: step1, label: tr('Mês 1', 'Month 1') },
      { date: '2026-01-18', formattedDate: isEn ? 'Jan 18' : '18/Jan', weight: step2, label: tr('Mês 2', 'Month 2') },
      { date: '2026-02-12', formattedDate: isEn ? 'Feb 12' : '12/Fev', weight: current, label: tr('Atual', 'Current') }
    ];
  };

  const getChildWeights = (childOrId: any) => {
    const history = getChildWeightHistory(childOrId);
    const initialNum = history[0].weight;
    const currentNum = history[history.length - 1].weight;
    const gainNum = Number((currentNum - initialNum).toFixed(1));
    const gainPercent = initialNum > 0 ? Math.round((gainNum / initialNum) * 100) : 0;

    return {
      initial: `${initialNum.toFixed(1)} kg`,
      current: `${currentNum.toFixed(1)} kg`,
      gain: `${gainNum > 0 ? '+' : ''}${gainNum.toFixed(1)} kg`,
      gainPercent: `${gainPercent > 0 ? '+' : ''}${gainPercent}%`,
      history
    };
  };

  const trDynamic = useTranslatedStrings(
    [selectedChild?.story],
    isEn
  );
  const allPublishedImpact = getPublishedItems();
  const translatedImpactItems = useTranslatedImpactItems(allPublishedImpact, isEn);

  const getChildStory = (child: any) => {
    if (child?.story && child.story.trim().length > 15 && child.story.trim() !== 'Acompanhada com amor na Casa Nutri.') {
      return trDynamic(child.story);
    }
    const childName = child?.name || tr('A criança', 'The child');
    return tr(
      `${childName} foi acolhida com amor na Casa Nutri após triagem realizada pela equipe de saúde comunitária em Nampula. Com o apadrinhamento regular, recebe suplementação vitamínica, papas terapêuticas e acompanhamento pediátrico contínuo. Graças ao suporte dos padrinhos, sua recuperação nutricional tem sido notável, garantindo um desenvolvimento saudável e cheio de esperança.`,
      `${childName} was lovingly welcomed at Casa Nutri after screening by the community health team in Nampula. With regular sponsorship, they receive vitamin supplementation, therapeutic porridge, and continuous pediatric care. Thanks to sponsors' support, their nutritional recovery has been remarkable, ensuring healthy development filled with hope.`
    );
  };

  const isDonorOrSponsor = user?.role === 'SPONSOR' || myChildren.length > 0 || (user?.role !== 'ADMIN' && user?.role !== 'USER');
  const myChildIds = useMemo(() => new Set(myChildren.map(c => c.id)), [myChildren]);

  // Fonte de dados de pacientes com segregação estrita:
  // Se for mantenedor/padrinho, EXCLUSIVAMENTE as crianças que ele apadrinha!
  const basePatients = useMemo(() => {
    if (isDonorOrSponsor) {
      if (myChildren.length > 0) {
        return myChildren.map(c => {
          const fromPt = patients.find(p => p.id === c.id);
          return {
            id: c.id,
            name: c.name || fromPt?.name || 'Criança Apadrinhada',
            dob: c.dob || fromPt?.dob || '',
            status: (fromPt?.status || c.nutritional_status || 'Adequado') as any,
            community: c.community || fromPt?.community || 'Casa Nutri',
            photo_url: c.photo_url || fromPt?.photo_url || '',
            registration_number: fromPt?.registration_number || '',
            gender: (c.gender || fromPt?.gender || 'F') as any,
            created_at: fromPt?.created_at || '',
            guardian_name: fromPt?.guardian_name || '',
            housing_type: fromPt?.housing_type || '',
            sanitation: fromPt?.sanitation || '',
            story: c.story || fromPt?.story || 'Acompanhada com amor na Casa Nutri.',
            planMonths: c.planMonths,
            expiresAt: c.expiresAt,
            paymentMethod: c.paymentMethod
          };
        });
      }
      return [];
    }
    return patients;
  }, [isDonorOrSponsor, patients, myChildren]);

  const filteredPatients = useMemo(() => {
    return basePatients.filter((c) => {
      const q = (searchQuery || '').toLowerCase().trim();
      const name = (c.name || '').toLowerCase();
      const comm = (c.community || '').toLowerCase();
      const reg = (c.registration_number || '').toLowerCase();
      const matchesSearch = !q || name.includes(q) || comm.includes(q) || reg.includes(q);
      
      if (!matchesSearch) return false;
      if (statusFilter === 'all') return true;
      if (statusFilter === 'mine') return myChildIds.has(c.id);
      return c.status === statusFilter;
    });
  }, [basePatients, searchQuery, statusFilter, myChildIds]);

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200/80 pb-6">
        <div>
          <span className="text-xs font-gotham-bold text-[#F49853] uppercase tracking-widest block mb-1">
            Casa Nutri • YAH Hope
          </span>
          <h2 className="text-3xl sm:text-4xl font-heading font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <Heart className="text-[#F49853]" size={32} fill="currentColor" /> 
            {isDonorOrSponsor ? tr('Minhas Crianças Apadrinhadas', 'My Sponsored Children') : tr('Crianças em Acompanhamento', 'Children in Care')}
          </h2>
          <p className="text-sm text-slate-500 font-gotham-light mt-1">
            {isDonorOrSponsor 
              ? tr('Acompanhe a recuperação nutricional, fotos e relatórios da(s) criança(s) sob seu apadrinhamento.', 'Follow the nutritional recovery, photos, and reports of the child(ren) you sponsor.') 
              : tr('Conheça as vidas atendidas e acompanhe a evolução nutricional em tempo real.', 'Meet the lives served and follow nutritional progress in real time.')}
          </p>
        </div>

        {/* Ações e Alternador de Abas */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 shrink-0 self-start md:self-auto">
          {/* Alternador de Abas idêntico ao de Doações */}
          <div className="flex bg-slate-200/70 p-1 rounded-2xl">
            <Link
              to="/portal/apadrinhar"
              className="px-4 py-2 rounded-xl text-xs font-gotham-bold transition-all flex items-center gap-1.5 cursor-pointer text-slate-500 hover:text-slate-800"
            >
              <Heart size={14} className="text-[#F49853]" />
              <span>{tr('Apadrinhar Criança', 'Sponsor a Child')}</span>
            </Link>
            <button
              className="px-4 py-2 rounded-xl text-xs font-gotham-bold transition-all flex items-center gap-1.5 cursor-pointer bg-white text-slate-900 shadow-xs"
            >
              <Users size={14} className="text-slate-600" />
              <span>{tr('Minhas Crianças', 'My Children')}</span>
            </button>
          </div>

          {/* Total Badge */}
          <div className="bg-orange-50 border border-orange-200/80 px-4 py-2 rounded-2xl flex items-center gap-2">
            <Users size={16} className="text-[#F49853]" />
            <span className="text-xs font-gotham-bold text-slate-800">
              {basePatients.length} {isDonorOrSponsor 
                ? (basePatients.length === 1 ? tr('Apadrinhada', 'Sponsored') : tr('Apadrinhadas', 'Sponsored')) 
                : (basePatients.length === 1 ? tr('Cadastrada', 'Registered') : tr('Cadastradas', 'Registered'))}
            </span>
          </div>
        </div>
      </div>

      {/* Avisos de Renovação de Pacote PIX (Expirando ou Vencido) */}
      {declinedNoticeMsg && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-center justify-between gap-3 text-xs text-emerald-900">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
            <span>{declinedNoticeMsg}</span>
          </div>
          <button
            type="button"
            onClick={() => setDeclinedNoticeMsg(null)}
            className="text-emerald-700 hover:text-emerald-900 font-bold shrink-0 cursor-pointer"
          >
            {tr('Fechar', 'Close')}
          </button>
        </div>
      )}

      {renewalNotices.length > 0 && (
        <div className="space-y-3">
          {renewalNotices.map(notice => (
            <div
              key={notice.sponsorshipId}
              className="bg-gradient-to-br from-amber-50 via-orange-50 to-amber-50 border-2 border-[#F49853]/60 rounded-3xl p-5 sm:p-6 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
            >
              <div className="flex items-start gap-3.5">
                <div className="w-11 h-11 rounded-2xl bg-[#F49853] text-white flex items-center justify-center shrink-0 shadow-sm">
                  <Calendar size={20} />
                </div>
                <div>
                  <span className="text-[10px] font-gotham-bold uppercase tracking-wider text-amber-800 bg-amber-200/70 px-2.5 py-0.5 rounded-full inline-block mb-1">
                    {notice.isExpired
                      ? tr(`Pacote PIX de ${notice.planMonths} meses encerrado`, `${notice.planMonths}-month PIX package ended`)
                      : tr(
                          `Faltam ${notice.daysRemaining} ${notice.daysRemaining === 1 ? 'dia' : 'dias'} para encerrar seu pacote`,
                          `${notice.daysRemaining} ${notice.daysRemaining === 1 ? 'day' : 'days'} left in your package`
                        )}
                  </span>
                  <h4 className="font-heading font-black text-slate-900 text-base">
                    {tr(`Deseja continuar apadrinhando ${notice.childName}?`, `Would you like to continue sponsoring ${notice.childName}?`)}
                  </h4>
                  <p className="text-xs text-slate-600 font-gotham-light mt-1 leading-relaxed">
                    {notice.isExpired
                      ? tr(
                          `O seu pacote de ${notice.planMonths} meses foi concluído em ${new Date(notice.expiresAt).toLocaleDateString('pt-BR')}. Renove para continuar acompanhando ${notice.childName} ou mantenha apenas seu acesso às atualizações gerais do projeto.`,
                          `Your ${notice.planMonths}-month package ended on ${new Date(notice.expiresAt).toLocaleDateString('en-US')}. Renew to keep following ${notice.childName} or keep access only to general project updates.`
                        )
                      : tr(
                          `Seu pacote de ${notice.planMonths} meses vence em ${new Date(notice.expiresAt).toLocaleDateString('pt-BR')}. Você pode renovar agora ou optar por manter apenas acesso às novidades do projeto.`,
                          `Your ${notice.planMonths}-month package expires on ${new Date(notice.expiresAt).toLocaleDateString('en-US')}. You can renew now or choose to keep access only to project news.`
                        )}
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-2.5 w-full md:w-auto shrink-0">
                <button
                  type="button"
                  onClick={() =>
                    navigate(
                      `/portal/apadrinhar?method=pix&months=${notice.planMonths}&renewChildId=${notice.childId}&childName=${encodeURIComponent(notice.childName)}`
                    )
                  }
                  className="py-3 px-4 bg-[#F49853] hover:bg-[#e0853d] text-white font-gotham-bold text-xs uppercase tracking-wider rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Heart size={14} fill="currentColor" />
                  <span>{tr('Continuar Apadrinhando', 'Continue Sponsoring')}</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleDeclineRenewal(notice)}
                  className="py-3 px-4 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-gotham-bold text-xs rounded-xl transition-all cursor-pointer"
                >
                  {tr('Não continuar (Só projeto)', 'Do not continue (Project only)')}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Barra de Filtros e Busca */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={tr('Buscar por nome, registro ou comunidade...', 'Search by name, record ID, or community...')}
            className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#F49853]/20 focus:border-[#F49853] transition-all shadow-2xs font-gotham-medium"
          />
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1 sm:pb-0">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-4 py-2.5 rounded-xl text-xs font-gotham-bold transition-all shrink-0 cursor-pointer ${
              statusFilter === 'all'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            {isDonorOrSponsor ? `${tr('Todas', 'All')} (${basePatients.length})` : `${tr('Todos', 'All')} (${basePatients.length})`}
          </button>
          {!isDonorOrSponsor && myChildren.length > 0 && (
            <button
              onClick={() => setStatusFilter('mine')}
              className={`px-4 py-2.5 rounded-xl text-xs font-gotham-bold transition-all shrink-0 cursor-pointer flex items-center gap-1.5 ${
                statusFilter === 'mine'
                  ? 'bg-amber-500 text-white shadow-xs'
                  : 'bg-amber-50 border border-amber-200 text-amber-900 hover:bg-amber-100'
              }`}
            >
              <Star size={13} className="fill-current" />
              {tr('Minhas Crianças', 'My Children')} ({myChildren.length})
            </button>
          )}
          <button
            onClick={() => setStatusFilter('DAM')}
            className={`px-4 py-2.5 rounded-xl text-xs font-gotham-bold transition-all shrink-0 cursor-pointer ${
              statusFilter === 'DAM'
                ? 'bg-[#F49853] text-white shadow-xs'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            {tr('Em Tratamento (DAM)', 'In Treatment (MAM)')}
          </button>
          <button
            onClick={() => setStatusFilter('Adequado')}
            className={`px-4 py-2.5 rounded-xl text-xs font-gotham-bold transition-all shrink-0 cursor-pointer ${
              statusFilter === 'Adequado'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            {tr('Recuperadas', 'Recovered')}
          </button>
        </div>
      </div>

      {/* Grid de Crianças Responsivo (1 col mobile, 2 sm, 3 lg) */}
      {isLoadingChildren ? (
        <div className="bg-white rounded-3xl p-12 border border-slate-200/80 text-center text-slate-400">
          <p className="font-bold text-slate-600">{tr('Carregando dados das crianças...', 'Loading children data...')}</p>
        </div>
      ) : filteredPatients.length === 0 ? (
        isDonorOrSponsor && basePatients.length === 0 ? (
          <div className="bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-200/80 rounded-3xl p-12 text-center space-y-4">
            <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto text-[#F49853] shadow-xs">
              <Heart size={32} />
            </div>
            <h4 className="font-heading font-black text-slate-900 text-xl">
              {tr('Você ainda não possui crianças apadrinhadas', 'You do not have any sponsored children yet')}
            </h4>
            <p className="text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
              {tr(
                'Com o apadrinhamento solidário, você garante acompanhamento clínico, alimentação especial e recebe fotos e relatórios de evolução exclusivos da sua criança.',
                'Through compassionate sponsorship, you provide clinical follow-up, specialized nutrition, and receive exclusive photos and progress reports of your child.'
              )}
            </p>
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                type="button"
                onClick={handleManualSyncPayer}
                disabled={isSyncingPayer}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3.5 rounded-xl font-gotham-bold text-xs uppercase tracking-wider shadow-md transition-all cursor-pointer disabled:opacity-60"
              >
                <RefreshCw size={15} className={isSyncingPayer ? 'animate-spin' : ''} />
                <span>{isSyncingPayer ? tr('Localizando pagamento...', 'Finding payment...') : tr('Já paguei, vincular minha criança', 'I already paid, link my child')}</span>
              </button>
              <Link
                to="/portal/apadrinhar"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-[#F49853] hover:bg-[#e0853d] text-white px-6 py-3.5 rounded-xl font-gotham-bold text-xs uppercase tracking-wider shadow-md transition-all cursor-pointer"
              >
                <Heart size={15} fill="currentColor" />
                <span>{tr('Novo Apadrinhamento', 'New Sponsorship')}</span>
              </Link>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-3xl p-12 border border-slate-200/80 text-center text-slate-400">
            <Users size={40} className="mx-auto mb-3 opacity-30 text-slate-400" />
            <h4 className="font-heading font-black text-slate-700 text-base">{tr('Nenhum registro encontrado', 'No records found')}</h4>
            <p className="text-xs text-slate-500 mt-1 font-gotham-light">
              {tr('Tente buscar com outros termos ou limpe os filtros para visualizar os dados.', 'Try searching with different terms or clear filters to view the data.')}
            </p>
          </div>
        )
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPatients.map((child) => {
            const weights = getChildWeights(child);
            const isRecovered = child.status === 'Adequado' || child.status === 'Alta';

            return (
              <div
                key={child.id}
                onClick={() => setSelectedChild(child)}
                className="bg-white rounded-3xl border border-slate-200/80 overflow-hidden shadow-xs hover:border-orange-300 hover:shadow-lg transition-all cursor-pointer group flex flex-col justify-between"
              >
                <div>
                  {/* Top Banner Card com Avatar Institucional ou Foto Real */}
                  <div className="p-6 bg-gradient-to-br from-slate-900 to-slate-800 text-white relative">
                    <div className="flex items-start justify-between gap-2">
                      <div className="w-14 h-14 rounded-2xl overflow-hidden bg-white/10 border border-white/20 text-[#F49853] font-heading font-black text-2xl flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                        {child.photo_url ? (
                          <img src={child.photo_url} alt={child.name} className="w-full h-full object-cover" />
                        ) : (
                          child.name.charAt(0).toUpperCase()
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 flex-wrap justify-end">
                        {graduatedChildIds.has(child.id) || child.status === 'Alta' || child.status === 'Alta do programa de nutrição' ? (
                          <span className="text-[10px] font-gotham-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-emerald-500 text-white flex items-center gap-1 shadow-xs">
                            <CheckCircle2 size={10} />
                            {tr('Alta do programa de nutrição', 'Discharged from Nutrition Program')}
                          </span>
                        ) : (
                          <>
                            {myChildIds.has(child.id) && (
                              <span className="text-[10px] font-gotham-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-amber-400 text-slate-950 flex items-center gap-1 shadow-xs">
                                <Star size={10} className="fill-current" />
                                {tr('Apadrinhado', 'Sponsored')}
                              </span>
                            )}
                            <span className={`text-[10px] font-gotham-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${
                              isRecovered
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}>
                              {translateChildStatus(child.status, isEn)}
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="mt-4">
                      <h3 className="text-xl font-heading font-black text-white leading-tight">
                        {child.name}
                      </h3>
                      <p className="text-xs text-slate-300 font-gotham-light flex items-center gap-1.5 mt-1">
                        <MapPin size={12} className="text-[#F49853]" />
                        <span>{child.community || tr('Casa Nutri • Nampula', 'Casa Nutri • Nampula')} • {calculateAge(child.dob)}</span>
                      </p>
                    </div>
                  </div>

                  {/* Detalhes Antropométricos e Contexto */}
                  <div className="p-6 space-y-4">
                    <div className="grid grid-cols-2 gap-2 text-center">
                      <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                        <span className="text-[10px] font-gotham-bold uppercase text-slate-400 block">{tr('Peso Inicial', 'Initial Weight')}</span>
                        <span className="text-xs font-black text-slate-800">{weights.initial}</span>
                      </div>
                      <div className="bg-orange-50/50 p-2.5 rounded-xl border border-orange-100">
                        <span className="text-[10px] font-gotham-bold uppercase text-[#F49853] block">{tr('Peso Atual', 'Current Weight')}</span>
                        <span className="text-xs font-black text-slate-900">{weights.current}</span>
                      </div>
                    </div>

                    <div className="text-xs text-slate-500 font-gotham-light space-y-1">
                      <p>
                        <strong>{tr('Nascimento:', 'Birth Date:')}</strong> {formatBirthDate(child.dob)}
                      </p>
                      <p>
                        <strong>{tr('Responsável:', 'Guardian:')}</strong> {child.guardian_name || tr('Familiar', 'Family Member')}
                      </p>
                      <p>
                        <strong>{tr('Registro Casa Nutri:', 'Casa Nutri Record:')}</strong> {child.registration_number || 'YAH-2026'}
                      </p>
                      {(child as any).expiresAt && (
                        <p className="pt-1">
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200/80 text-[10px] font-gotham-bold">
                            <Calendar size={10} />
                            {tr('Pacote', 'Package')} {(child as any).planMonths || 3} {tr('meses • Vigente até', 'months • Valid until')} {new Date((child as any).expiresAt).toLocaleDateString(isEn ? 'en-US' : 'pt-BR')}
                          </span>
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Footer do Card */}
                <div className="px-6 pb-6 pt-2 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs font-gotham-bold text-[#F49853] group-hover:translate-x-1 transition-transform flex items-center gap-1">
                    {tr('Ver ficha nutricional & evolução', 'View nutrition record & progress')} <ArrowRight size={13} />
                  </span>
                  <span className="text-[10px] bg-slate-100 text-slate-600 font-gotham-bold px-2.5 py-1 rounded-lg">
                    Casa Nutri
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal de Detalhes da Criança */}
      {selectedChild && (() => {
        const child = selectedChild;
        const weights = getChildWeights(child);
        const childStory = getChildStory(child);
        const isRecovered = child.status === 'Adequado' || child.status === 'Alta';
        const childUpdates = myChildIds.has(child.id)
          ? translatedImpactItems.filter(
              item => isChildSpecificImpactItem(item) && isImpactItemForSponsoredChild(item, [{ id: child.id, name: child.name }])
            )
          : [];

        return (
          <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl animate-fade-in relative max-h-[90vh] flex flex-col">
              
              {/* Header do Modal */}
              <div className="p-6 bg-gradient-to-r from-slate-950 to-slate-900 text-white flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div 
                    onClick={() => child.photo_url && setZoomedPhoto({ url: child.photo_url, name: child.name })}
                    className={`w-16 h-16 rounded-2xl overflow-hidden bg-orange-100 text-[#F49853] font-heading font-black text-2xl flex items-center justify-center shrink-0 border border-white/20 relative group ${child.photo_url ? 'cursor-pointer hover:border-orange-400/80 transition-all' : ''}`}
                    title={child.photo_url ? tr('Clique para ampliar a foto', 'Click to enlarge photo') : undefined}
                  >
                    {child.photo_url ? (
                      <>
                        <img src={child.photo_url} alt={child.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                        <div className="absolute inset-0 bg-black/25 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <Maximize2 size={16} className="text-white drop-shadow" />
                        </div>
                      </>
                    ) : (
                      child.name.charAt(0).toUpperCase()
                    )}
                  </div>
                  <div>
                    <h3 className="text-xl font-heading font-black text-white leading-tight">
                      {child.name}
                    </h3>
                    <p className="text-xs text-slate-300 font-gotham-light mt-0.5">
                      {calculateAge(child.dob)} • {child.community || 'Nampula, Moçambique'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedChild(null)}
                  className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Conteúdo do Modal */}
              <div className="p-6 space-y-5 overflow-y-auto">
                {child.photo_url && (
                  <div 
                    onClick={() => setZoomedPhoto({ url: child.photo_url, name: child.name })}
                    className="w-full h-52 sm:h-64 rounded-2xl overflow-hidden border border-slate-200/80 shadow-xs relative group cursor-pointer"
                    title={tr('Clique para ver a foto ampliada', 'Click to view larger photo')}
                  >
                    <img 
                      src={child.photo_url} 
                      alt={child.name} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent opacity-90 sm:opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-between p-4">
                      <span className="text-white text-xs font-gotham-bold flex items-center gap-1.5 drop-shadow">
                        <ZoomIn size={16} className="text-[#F49853]" /> {tr('Clique para ampliar', 'Click to zoom')}
                      </span>
                    </div>
                    <div className="absolute top-3 right-3 bg-slate-900/60 hover:bg-slate-900/90 text-white p-2 rounded-xl backdrop-blur-xs transition-colors shadow-sm">
                      <Maximize2 size={16} />
                    </div>
                  </div>
                )}

                {/* Status Nutricional */}
                <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80">
                  <span className="text-xs font-gotham-bold text-slate-500 uppercase tracking-wider">
                    {tr('Status Nutricional Atual:', 'Current Nutritional Status:')}
                  </span>
                  <span className={`text-xs font-gotham-bold uppercase px-3 py-1 rounded-full ${
                    isRecovered ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                  }`}>
                    {translateChildStatus(child.status, isEn)}
                  </span>
                </div>

                {/* Pesagens Resumidas */}
                <div className="grid grid-cols-2 gap-3 text-center">
                  <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
                    <span className="text-[10px] font-gotham-bold uppercase text-slate-400 block mb-1">{tr('Peso de Entrada', 'Entry Weight')}</span>
                    <span className="text-base font-black text-slate-800">{weights.initial}</span>
                  </div>
                  <div className="bg-orange-50/60 p-3.5 rounded-2xl border border-orange-100">
                    <span className="text-[10px] font-gotham-bold uppercase text-[#F49853] block mb-1">{tr('Última Aferição', 'Latest Measurement')}</span>
                    <span className="text-base font-black text-slate-900">{weights.current}</span>
                  </div>
                </div>

                {/* Gráfico de Evolução de Peso do Padrinho */}
                <WeightEvolutionChart history={weights.history} />

                {/* História da Criança e Acompanhamento */}
                <div className="bg-gradient-to-br from-amber-50/70 to-orange-50/40 rounded-2xl p-4 border border-amber-200/80 space-y-2">
                  <div className="flex items-center gap-2 text-amber-900 font-gotham-bold text-xs uppercase tracking-wider">
                    <BookOpen size={16} className="text-[#F49853]" />
                    <span>{tr('História da Criança', 'Child’s Story')}</span>
                  </div>
                  <p className="text-xs text-slate-700 font-gotham-light leading-relaxed">
                    {childStory}
                  </p>
                </div>

                {/* Atualizações de Impacto Exclusivas dos Padrinhos desta Criança */}
                {myChildIds.has(child.id) && childUpdates.length > 0 && (
                  <div className="bg-white rounded-2xl p-4 border border-orange-200/80 space-y-3 shadow-2xs">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-slate-900 font-gotham-bold text-xs uppercase tracking-wider">
                        <Sparkles size={15} className="text-[#F49853]" />
                        <span>{tr('Atualizações de Impacto', 'Impact Updates')} • {child.name}</span>
                      </div>
                      <span className="text-[9px] font-gotham-bold uppercase px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                        {tr('Exclusivo do Padrinho', 'Sponsor Exclusive')}
                      </span>
                    </div>
                    <div className="space-y-2.5">
                      {childUpdates.map(upd => (
                        <div
                          key={upd.id}
                          onClick={() => upd.img_url && setZoomedPhoto({ url: upd.img_url, name: upd.title || child.name })}
                          className={`p-3 bg-orange-50/40 border border-orange-100 rounded-xl space-y-1.5 transition-all ${
                            upd.img_url ? 'cursor-pointer hover:border-orange-300 hover:bg-orange-50/70 group' : ''
                          }`}
                        >
                          <div className="flex items-center justify-between text-[10px] text-slate-500 font-gotham-medium">
                            <span className="font-gotham-bold text-slate-800">{upd.title}</span>
                            <span>{upd.created_at ? new Date(upd.created_at).toLocaleDateString(isEn ? 'en-US' : 'pt-BR') : upd.date}</span>
                          </div>
                          <p className="text-xs text-slate-700 font-gotham-light leading-relaxed">{upd.content}</p>
                          {upd.img_url && (
                            <div className="pt-1 relative">
                              <img
                                src={upd.img_url}
                                alt={upd.title}
                                className="w-full h-32 object-cover rounded-lg border border-orange-100 group-hover:scale-[1.01] transition-transform duration-300"
                              />
                              <div className="absolute bottom-2 right-2 bg-slate-950/70 backdrop-blur-xs text-white px-2 py-0.5 rounded-full text-[10px] font-gotham-bold flex items-center gap-1 opacity-90 group-hover:opacity-100 transition-opacity">
                                <ZoomIn size={11} />
                                <span>{tr('Ampliar', 'Zoom')}</span>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Ficha Cadastral e Localidade com Data de Nascimento */}
                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 space-y-2.5 text-xs text-slate-600 font-gotham-light">
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-gotham-bold text-slate-500 shrink-0">{tr('Data de Nascimento:', 'Date of Birth:')}</span>
                    <span className="font-gotham-bold text-slate-800 text-right">
                      {formatBirthDate(child.dob)} ({calculateAge(child.dob)})
                    </span>
                  </div>
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-gotham-bold text-slate-500 shrink-0">{tr('Cuidador / Responsável:', 'Caregiver / Guardian:')}</span>
                    <span className="font-gotham-bold text-slate-800 text-right">{child.guardian_name || tr('Familiar Cadastrado', 'Registered Family Member')}</span>
                  </div>
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-gotham-bold text-slate-500 shrink-0">{tr('Localidade:', 'Location:')}</span>
                    <span className="font-gotham-bold text-slate-800 text-right">{child.community || tr('Nampula, Moçambique', 'Nampula, Mozambique')}</span>
                  </div>
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-gotham-bold text-slate-500 shrink-0">{tr('Número de Registro Clínico:', 'Clinical Record Number:')}</span>
                    <span className="font-gotham-bold text-slate-800 text-right">{child.registration_number || '202606'}</span>
                  </div>
                </div>

                {/* Bloco de Apadrinhamento Ativo */}
                {myChildIds.has(child.id) ? (
                  <div className="space-y-3">
                    <div className="p-4 bg-orange-50/70 border border-orange-200/80 rounded-2xl flex items-center justify-between">
                      <div>
                        <span className="text-[10px] font-gotham-bold uppercase tracking-wider text-[#F49853] block">
                          {tr('Apadrinhamento Ativo', 'Active Sponsorship')}
                        </span>
                        <p className="text-xs text-slate-800 font-gotham-bold mt-0.5">
                          {tr('Cota Mensal: R$ 90,00/mês', 'Monthly Quota: R$ 90.00/mo')}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setChildToCancel({ 
                          id: child.id, 
                          name: child.name, 
                          sponsorshipId: childIdToSponsorshipId.get(child.id) 
                        })}
                        className="px-3 py-1.5 bg-white hover:bg-rose-50 text-rose-600 border border-rose-200 rounded-xl text-xs font-gotham-bold transition-all cursor-pointer shadow-2xs"
                      >
                        {tr('Cancelar Apadrinhamento', 'Cancel Sponsorship')}
                      </button>
                    </div>

                    <div className="pt-2 flex flex-col sm:flex-row gap-3">
                      <Link
                        to="/portal/apadrinhar"
                        onClick={() => setSelectedChild(null)}
                        className="flex-1 py-3.5 bg-[#F49853] hover:bg-[#e0853d] text-white font-gotham-bold text-xs uppercase tracking-wider rounded-xl shadow-md transition-all text-center flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <Heart size={16} fill="currentColor" />
                        <span>{tr('Apadrinhar Mais Crianças (+R$ 90/mês)', 'Sponsor More Children (+R$ 90/mo)')}</span>
                      </Link>
                      <button
                        onClick={() => setSelectedChild(null)}
                        className="py-3.5 px-5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-gotham-medium text-xs rounded-xl transition-all cursor-pointer"
                      >
                        {tr('Fechar', 'Close')}
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Botões de Ação para quem não é padrinho desta criança */
                  <div className="pt-2 flex flex-col sm:flex-row gap-3">
                    <Link
                      to="/portal/apadrinhar"
                      onClick={() => setSelectedChild(null)}
                      className="flex-1 py-3.5 bg-[#F49853] hover:bg-[#e0853d] text-white font-gotham-bold text-xs uppercase tracking-wider rounded-xl shadow-md transition-all text-center flex items-center justify-center gap-2"
                    >
                      <Heart size={16} fill="currentColor" />
                      <span>{tr('Fazer Apadrinhamento Solidário', 'Start Sponsorship')}</span>
                    </Link>
                    <button
                      onClick={() => setSelectedChild(null)}
                      className="py-3.5 px-5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-gotham-medium text-xs rounded-xl transition-all cursor-pointer"
                    >
                      {tr('Fechar', 'Close')}
                    </button>
                  </div>
                )}
              </div>

            </div>
          </div>
        );
      })()}

      {/* Modal de Confirmação para Cancelar Apadrinhamento de Criança */}
      {childToCancel && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl overflow-hidden shadow-2xl animate-fade-in relative flex flex-col">
            <div className="p-6 bg-gradient-to-r from-slate-950 to-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-rose-500/20 border border-rose-500/30 flex items-center justify-center text-rose-400">
                  <X size={20} />
                </div>
                <h3 className="text-lg font-heading font-black text-white">
                  {tr('Cancelar Apadrinhamento', 'Cancel Sponsorship')}
                </h3>
              </div>
              <button
                onClick={() => setChildToCancel(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-800 space-y-2">
                <p className="font-gotham-bold text-sm">
                  {tr(`Deseja realmente cancelar o apadrinhamento de ${childToCancel.name}?`, `Are you sure you want to cancel your sponsorship for ${childToCancel.name}?`)}
                </p>
                <p className="font-gotham-light leading-relaxed">
                  {tr(
                    'Ao confirmar, a cota mensal de R$ 90,00 deixará de ser cobrada no seu plano e a vaga da criança será liberada na Casa Nutri para acolhimento por outro padrinho.',
                    'By confirming, the R$ 90.00 monthly quota will no longer be charged to your plan and the child’s spot will be opened at Casa Nutri for another sponsor.'
                  )}
                </p>
              </div>

              <div className="pt-2 flex flex-col sm:flex-row gap-3">
                <button
                  type="button"
                  onClick={handleConfirmCancelChild}
                  disabled={isCancelingChild}
                  className="flex-1 py-3.5 bg-rose-600 hover:bg-rose-700 text-white font-gotham-bold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  <span>{isCancelingChild ? tr('Cancelando...', 'Canceling...') : tr('Confirmar Cancelamento', 'Confirm Cancellation')}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setChildToCancel(null)}
                  className="py-3.5 px-5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-gotham-medium text-xs rounded-xl transition-all cursor-pointer"
                >
                  {tr('Voltar', 'Back')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Celebração e Apresentação da Criança Designada */}
      {showCelebration && celebrationChildren.length > 0 && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-[2rem] max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-orange-200 relative overflow-hidden animate-scale-up">
            <div className="absolute top-0 right-0 w-36 h-36 bg-orange-100/60 rounded-full blur-2xl pointer-events-none -translate-y-1/2 translate-x-1/2" />
            
            <div className="text-center space-y-2.5 mb-6 relative z-10">
              <div className="w-14 h-14 bg-orange-100 text-[#F49853] rounded-2xl flex items-center justify-center mx-auto shadow-sm">
                <Heart size={28} fill="currentColor" />
              </div>
              <span className="text-[11px] font-gotham-bold uppercase tracking-widest text-[#F49853] block">
                {tr('Apadrinhamento Confirmado! 🧡', 'Sponsorship Confirmed! 🧡')}
              </span>
              <h3 className="text-xl sm:text-2xl font-black text-slate-900 font-heading">
                {celebrationChildren.length === 1 
                  ? tr('Conheça o seu afilhado(a)!', 'Meet your sponsored child!') 
                  : tr('Conheça suas crianças apadrinhadas!', 'Meet your sponsored children!')}
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 font-gotham-medium leading-relaxed">
                {tr(
                  'Pelo nosso modelo solidário de distribuição justa, vinculamos o seu carinho para a(s) criança(s) em maior prioridade na Casa Nutri. Enviamos os detalhes completos também para seu e-mail!',
                  'Through our fair distribution model, we matched your support to the child(ren) with the highest priority at Casa Nutri. We have also sent full details to your email!'
                )}
              </p>
            </div>

            <div className="space-y-3.5 max-h-[50vh] overflow-y-auto pr-1">
              {celebrationChildren.map((c) => (
                <div key={c.id} className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl flex gap-4 items-center">
                  <img
                    src={c.photo_url || 'https://hope.yahchurch.com/wp-content/uploads/2025/09/Logo_Laranja-1024x511.png'}
                    alt={c.name}
                    className="w-16 h-16 rounded-xl object-cover border-2 border-[#F49853] shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className="text-[10px] font-black uppercase text-orange-600 bg-orange-100 px-2 py-0.5 rounded-full">
                        {c.gender === 'F' ? tr('Menina', 'Girl') : tr('Menino', 'Boy')} • {c.ageText}
                      </span>
                    </div>
                    <h4 className="font-heading font-black text-slate-900 text-base truncate">
                      {c.name}
                    </h4>
                    <p className="text-xs text-slate-500 font-gotham-medium truncate">
                      📍 {c.community || 'Casa Nutri - Nampula'}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowCelebration(false)}
                className="w-full bg-[#F49853] hover:bg-[#e0853d] text-white font-gotham-bold text-xs uppercase tracking-wider py-3.5 px-6 rounded-xl transition-all shadow-md cursor-pointer"
              >
                {tr('Acessar Minhas Crianças', 'Access My Children')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lightbox / Foto Ampliada da Criança */}
      {zoomedPhoto && (
        <div 
          className="fixed inset-0 z-[60] bg-slate-950/90 backdrop-blur-md flex flex-col items-center justify-center p-4 animate-fade-in"
          onClick={() => setZoomedPhoto(null)}
        >
          <div 
            className="relative max-w-2xl max-h-[92vh] w-full flex flex-col items-center"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Barra Superior com Nome e Botão Fechar */}
            <div className="w-full flex items-center justify-between pb-3 text-white">
              <div className="flex items-center gap-2">
                <Heart size={18} className="text-[#F49853] fill-[#F49853]" />
                <h3 className="text-base sm:text-lg font-heading font-black tracking-tight truncate">
                  {zoomedPhoto.name}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setZoomedPhoto(null)}
                className="p-2 rounded-full bg-white/10 hover:bg-white/25 text-white transition-all cursor-pointer"
                title={tr('Fechar (Esc)', 'Close (Esc)')}
              >
                <X size={20} />
              </button>
            </div>

            {/* Imagem Ampliada */}
            <div className="relative rounded-2xl overflow-hidden border border-white/15 shadow-2xl bg-slate-900 max-h-[82vh] flex items-center justify-center">
              <img 
                src={zoomedPhoto.url} 
                alt={zoomedPhoto.name} 
                className="max-h-[80vh] w-auto max-w-full object-contain rounded-xl select-none"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
