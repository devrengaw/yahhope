import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format, addDays, differenceInDays } from 'date-fns';
import { supabase } from '../lib/supabase';
import { ClinicalEvent, InventoryItem, Kit, Patient } from '../lib/mockData';
import { calculateAge, parseLocalDate } from '../lib/utils';
import { calculateMedicationDuration } from '../lib/medicationUtils';
import { matchDefaultKitByIdOrName, matchInventoryItem } from '../lib/defaultNutritionKits';

export interface ActiveKitProductSummary {
  kitName: string;
  itemName: string;
  category: string;
  quantity: number | string;
  unit: string;
  dosage?: string;
}

export interface ExportClinicalHistoryParams {
  patient: Patient;
  events: ClinicalEvent[];
  latestWeightEvent?: ClinicalEvent;
  latestHeightEvent?: ClinicalEvent;
  latestMuacEvent?: ClinicalEvent;
  latestHeadEvent?: ClinicalEvent;
  latestClinicalEvent?: ClinicalEvent;
  activeKitProducts: ActiveKitProductSummary[];
  activeMedications: any[];
  items: InventoryItem[];
  kits: Kit[];
  getVisitForEvent: (date: string) => any;
  formatProfessionalName: (prof?: string) => string;
  isHospitalized: boolean;
  chartsContainer: HTMLDivElement | null;
}

interface FullAdmissionData {
  child: any;
  caregiver: any;
  household: any;
  socioeconomics: any;
  initialAssessment: any;
  gestational: any;
  feeding: any;
  clinical: any;
  physical: any;
}

const PAGE_MARGIN = 14;
const CONTENT_WIDTH = 210 - PAGE_MARGIN * 2; // 182mm on A4 portrait

const safeText = (val: any, fallback = '--'): string => {
  if (val === null || val === undefined || val === '') return fallback;
  return String(val);
};

const formatDateBr = (dateStr?: string | null): string => {
  if (!dateStr) return '--';
  try {
    return parseLocalDate(dateStr).toLocaleDateString('pt-BR');
  } catch {
    return String(dateStr);
  }
};

/**
 * Converts a Recharts <svg> element into a high-DPI PNG data URL with a white background.
 */
async function svgElementToPngDataUrl(svg: SVGSVGElement): Promise<string> {
  const cloned = svg.cloneNode(true) as SVGSVGElement;
  const widthAttr = Number(svg.getAttribute('width')) || svg.getBoundingClientRect().width || 720;
  const heightAttr = Number(svg.getAttribute('height')) || svg.getBoundingClientRect().height || 290;

  cloned.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  cloned.setAttribute('width', String(widthAttr));
  cloned.setAttribute('height', String(heightAttr));

  const svgString = new XMLSerializer().serializeToString(cloned);
  const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(svgBlob);

  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = (err) => reject(err);
      image.src = url;
    });

    const scale = 2;
    const canvas = document.createElement('canvas');
    canvas.width = widthAttr * scale;
    canvas.height = heightAttr * scale;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas 2D context unavailable');

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.scale(scale, scale);
    ctx.drawImage(img, 0, 0, widthAttr, heightAttr);

    return canvas.toDataURL('image/png');
  } finally {
    URL.revokeObjectURL(url);
  }
}

/**
 * Attempts to load a remote image URL as a data URL for embedding in jsPDF.
 * Returns null if loading fails or times out (e.g., CORS restriction).
 */
async function loadImageAsDataUrl(url?: string): Promise<string | null> {
  if (!url) return null;
  try {
    const img = await Promise.race([
      new Promise<HTMLImageElement>((resolve, reject) => {
        const image = new Image();
        image.crossOrigin = 'anonymous';
        image.onload = () => resolve(image);
        image.onerror = reject;
        image.src = url;
      }),
      new Promise<never>((_, reject) => setTimeout(() => reject(new Error('timeout')), 4000)),
    ]);

    const canvas = document.createElement('canvas');
    const size = 160;
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    const minSide = Math.min(img.width, img.height);
    const sx = (img.width - minSide) / 2;
    const sy = (img.height - minSide) / 2;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, size, size);
    ctx.drawImage(img, sx, sy, minSide, minSide, 0, 0, size, size);
    return canvas.toDataURL('image/jpeg', 0.85);
  } catch {
    return null;
  }
}

async function fetchFullAdmissionData(patientId: string): Promise<FullAdmissionData> {
  const result: FullAdmissionData = {
    child: null,
    caregiver: null,
    household: null,
    socioeconomics: null,
    initialAssessment: null,
    gestational: null,
    feeding: null,
    clinical: null,
    physical: null,
  };

  try {
    const [childRes, caregiverRes, triageRes, iaRes] = await Promise.all([
      supabase.from('children').select('*').eq('id', patientId).maybeSingle(),
      supabase.from('caregivers').select('*').eq('child_id', patientId).maybeSingle(),
      supabase.from('social_triage').select('*').eq('child_id', patientId).maybeSingle(),
      supabase.from('initial_assessments').select('*').eq('child_id', patientId).maybeSingle(),
    ]);

    result.child = childRes.data;
    result.caregiver = caregiverRes.data;

    if (triageRes.data?.id) {
      const [houseRes, socioRes] = await Promise.all([
        supabase.from('household_conditions').select('*').eq('social_triage_id', triageRes.data.id).maybeSingle(),
        supabase.from('socioeconomics').select('*').eq('social_triage_id', triageRes.data.id).maybeSingle(),
      ]);
      result.household = houseRes.data;
      result.socioeconomics = socioRes.data;
    }

    if (iaRes.data?.id) {
      result.initialAssessment = iaRes.data;
      const [gestRes, feedRes, clinRes, physRes] = await Promise.all([
        supabase.from('gestational_history').select('*').eq('assessment_id', iaRes.data.id).maybeSingle(),
        supabase.from('feeding_history').select('*').eq('assessment_id', iaRes.data.id).maybeSingle(),
        supabase.from('clinical_history').select('*').eq('assessment_id', iaRes.data.id).maybeSingle(),
        supabase.from('physical_exam').select('*').eq('assessment_id', iaRes.data.id).maybeSingle(),
      ]);
      result.gestational = gestRes.data;
      result.feeding = feedRes.data;
      result.clinical = clinRes.data;
      result.physical = physRes.data;
    }
  } catch (err) {
    console.warn('Erro ao buscar dados completos da ficha para PDF:', err);
  }

  return result;
}

function getLastAutoTableY(doc: jsPDF, fallback: number): number {
  return (doc as any).lastAutoTable?.finalY ?? fallback;
}

function ensureSpace(doc: jsPDF, currentY: number, neededMm: number): number {
  const pageHeight = doc.internal.pageSize.getHeight();
  if (currentY + neededMm > pageHeight - 16) {
    doc.addPage();
    return 18;
  }
  return currentY;
}

function drawSectionTitle(doc: jsPDF, title: string, y: number, accentRgb: [number, number, number] = [5, 150, 105]): number {
  const nextY = ensureSpace(doc, y, 14);
  doc.setFillColor(...accentRgb);
  doc.rect(PAGE_MARGIN, nextY, 2.2, 5.5, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text(title.toUpperCase(), PAGE_MARGIN + 4.5, nextY + 4.2);
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.3);
  doc.line(PAGE_MARGIN, nextY + 7, PAGE_MARGIN + CONTENT_WIDTH, nextY + 7);
  return nextY + 10.5;
}

function getEventTypeLabel(event: ClinicalEvent): string {
  const isDischargeHosp = event.notes?.includes('[ALTA HOSPITALAR]');
  const isHosp = event.notes?.includes('[INTERNAÇÃO HOSPITALAR]') || (event.notes?.includes('Internada: Sim') && event.event_type === 'referral');
  if (isDischargeHosp) return 'Alta Hospitalar';
  if (isHosp) return 'Internação Hospitalar';
  switch (event.event_type) {
    case 'initial': return 'Avaliação Inicial';
    case 'acompanhamento': return 'Acompanhamento Clínico';
    case 'acs_visit': return 'Visita Domiciliar (ACS)';
    case 'observation': return 'Observação Clínica / Parecer';
    case 'referral': return 'Encaminhamento';
    default: return 'Retorno';
  }
}

function getStatusColors(status?: string): { bg: [number, number, number]; text: [number, number, number] } {
  const s = (status || '').toLowerCase();
  if (s.includes('dag') || s.includes('grave')) return { bg: [254, 226, 226], text: [185, 28, 28] };
  if (s.includes('dam') || s.includes('moderad') || s.includes('risco')) return { bg: [254, 243, 199], text: [180, 83, 9] };
  if (s.includes('internad')) return { bg: [243, 232, 255], text: [107, 33, 168] };
  if (s.includes('encerrad')) return { bg: [241, 245, 249], text: [71, 85, 105] };
  return { bg: [209, 250, 229], text: [4, 120, 87] };
}

function renderKeyValueGridTable(
  doc: jsPDF,
  startY: number,
  subtitle: string,
  pairs: Array<[string, any]>,
  columns: 2 | 3 = 2
): number {
  let y = ensureSpace(doc, startY, 22);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(51, 65, 85);
  doc.text(subtitle, PAGE_MARGIN, y);
  y += 2.5;

  const rows: string[][] = [];
  for (let i = 0; i < pairs.length; i += columns) {
    const row: string[] = [];
    for (let c = 0; c < columns; c++) {
      const item = pairs[i + c];
      if (item) {
        row.push(`${item[0]}: ${safeText(item[1])}`);
      } else {
        row.push('');
      }
    }
    rows.push(row);
  }

  autoTable(doc, {
    startY: y,
    margin: { left: PAGE_MARGIN, right: PAGE_MARGIN },
    theme: 'grid',
    styles: {
      fontSize: 8,
      cellPadding: 2.2,
      textColor: [30, 41, 59],
      lineColor: [226, 232, 240],
      lineWidth: 0.2,
    },
    body: rows,
    didParseCell: (data) => {
      if (data.section === 'body' && typeof data.cell.raw === 'string' && data.cell.raw.includes(': ')) {
        data.cell.styles.fontStyle = 'normal';
      }
    },
  });

  return getLastAutoTableY(doc, y) + 5;
}

export async function exportClinicalHistoryPdf(params: ExportClinicalHistoryParams): Promise<void> {
  const {
    patient,
    events,
    latestWeightEvent,
    latestHeightEvent,
    latestMuacEvent,
    latestHeadEvent,
    latestClinicalEvent,
    activeKitProducts,
    activeMedications,
    items,
    kits,
    getVisitForEvent,
    formatProfessionalName,
    isHospitalized,
    chartsContainer,
  } = params;

  const [admission, photoDataUrl] = await Promise.all([
    fetchFullAdmissionData(patient.id),
    loadImageAsDataUrl(patient.photo_url),
  ]);

  // Capture all 3 Recharts SVGs from the offscreen export container
  const chartMeta = [
    { id: 'heightForAge', title: `Estatura por Idade - ${patient.gender === 'M' ? 'Rapazes' : 'Raparigas'}` },
    { id: 'weightForHeight', title: `Peso por Estatura - ${patient.gender === 'M' ? 'Rapazes' : 'Raparigas'}` },
    { id: 'hcForAge', title: `Perímetro Craniano - ${patient.gender === 'M' ? 'Rapazes' : 'Raparigas'}` },
  ];

  const capturedCharts: Array<{ id: string; title: string; dataUrl: string }> = [];
  if (chartsContainer) {
    for (const meta of chartMeta) {
      const wrapper = chartsContainer.querySelector(`[data-export-chart="${meta.id}"]`);
      const svg = wrapper?.querySelector('svg');
      if (svg) {
        try {
          const dataUrl = await svgElementToPngDataUrl(svg as SVGSVGElement);
          capturedCharts.push({ ...meta, dataUrl });
        } catch (err) {
          console.warn(`Erro ao capturar gráfico ${meta.id}:`, err);
        }
      }
    }
  }

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const nowStr = format(new Date(), "dd/MM/yyyy 'às' HH:mm");
  const currentStatus = isHospitalized ? 'Internada' : (latestClinicalEvent?.nutritional_status || patient.status);
  const statusColors = getStatusColors(currentStatus);

  // ============================================================================
  // HEADER BANNER (Page 1)
  // ============================================================================
  doc.setFillColor(5, 150, 105);
  doc.rect(0, 0, 210, 32, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.text('YAH HOPE — HISTÓRICO CLÍNICO COMPLETO', PAGE_MARGIN, 13);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text('Prontuário Nutricional, Antropométrico e Social da Criança', PAGE_MARGIN, 19.5);
  doc.text(`Emitido em: ${nowStr}`, PAGE_MARGIN, 25.5);

  // Patient Summary Card right below banner
  let y = 37;
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(PAGE_MARGIN, y, CONTENT_WIDTH, 26, 3, 3, 'FD');

  const textStartX = photoDataUrl ? PAGE_MARGIN + 26 : PAGE_MARGIN + 5;
  if (photoDataUrl) {
    doc.addImage(photoDataUrl, 'JPEG', PAGE_MARGIN + 3.5, y + 3, 20, 20);
  }

  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text(patient.name, textStartX, y + 8.5);

  // Status Pill
  doc.setFillColor(...statusColors.bg);
  doc.roundedRect(PAGE_MARGIN + CONTENT_WIDTH - 42, y + 4, 38, 7, 2, 2, 'F');
  doc.setTextColor(...statusColors.text);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text(currentStatus.toUpperCase(), PAGE_MARGIN + CONTENT_WIDTH - 23, y + 8.7, { align: 'center' });

  doc.setTextColor(71, 85, 105);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.text(
    `ID: ${safeText(patient.registration_number)}   |   Nascimento: ${formatDateBr(patient.dob)} (${calculateAge(patient.dob)})   |   Gênero: ${patient.gender === 'M' ? 'Masculino' : 'Feminino'}`,
    textStartX,
    y + 15.5
  );
  doc.text(
    `Comunidade/Endereço: ${safeText(admission.child?.address || patient.community)}   |   Responsável: ${safeText(admission.caregiver?.name || patient.guardian_name)}`,
    textStartX,
    y + 21.5
  );

  y += 32;

  // ============================================================================
  // SECTION 1: IDENTIFICAÇÃO, LOCALIZAÇÃO E RESPONSÁVEL
  // ============================================================================
  y = drawSectionTitle(doc, '1. Identificação, Localização e Responsável', y);
  y = renderKeyValueGridTable(
    doc,
    y,
    'Dados Cadastrais e Familiares',
    [
      ['Nome Completo', admission.child?.name || patient.name],
      ['Nº de Registro', patient.registration_number],
      ['Data de Nascimento', formatDateBr(patient.dob)],
      ['Idade Atual', calculateAge(patient.dob)],
      ['Gênero', patient.gender === 'M' ? 'Masculino' : 'Feminino'],
      ['Cor/Raça', admission.child?.color],
      ['Endereço / Comunidade', admission.child?.address || patient.community],
      ['Cidade / Província', `${safeText(admission.child?.city)} / ${safeText(admission.child?.province)}`],
      ['Responsável', admission.caregiver?.name || patient.guardian_name],
      ['Telefone de Contato', admission.caregiver?.phone],
      ['Estado Civil (Resp.)', admission.caregiver?.marital_status],
      ['Escolaridade / Religião', `${safeText(admission.caregiver?.education)} / ${safeText(admission.caregiver?.religion)}`],
    ],
    2
  );

  // ============================================================================
  // SECTION 2: INDICADORES ANTROPOMÉTRICOS ATUAIS
  // ============================================================================
  y = drawSectionTitle(doc, '2. Indicadores Antropométricos Atuais', y);
  y = ensureSpace(doc, y, 26);

  const muacVal = latestMuacEvent?.muac;
  const muacZone = muacVal
    ? muacVal > 12.5
      ? 'Zona Verde'
      : muacVal > 11.5
      ? 'Zona Amarela'
      : 'Zona Vermelha'
    : '--';

  const cards = [
    {
      label: 'ÚLTIMO PESO',
      value: latestWeightEvent?.weight ? `${latestWeightEvent.weight} kg` : '--',
      sub: latestWeightEvent ? `Em ${formatDateBr(latestWeightEvent.date)}` : 'Sem registro',
      accent: [16, 185, 129] as [number, number, number],
    },
    {
      label: 'ÚLTIMA ESTATURA',
      value: latestHeightEvent?.height ? `${latestHeightEvent.height} cm` : '--',
      sub: latestHeightEvent ? `Em ${formatDateBr(latestHeightEvent.date)}` : 'Sem registro',
      accent: [59, 130, 246] as [number, number, number],
    },
    {
      label: 'PB (BRAQUIAL)',
      value: muacVal ? `${muacVal} cm` : '--',
      sub: muacZone,
      accent: [245, 158, 11] as [number, number, number],
    },
    {
      label: 'P. CRANIANO',
      value: latestHeadEvent?.head_circumference ? `${latestHeadEvent.head_circumference} cm` : '--',
      sub: latestHeadEvent ? `Em ${formatDateBr(latestHeadEvent.date)}` : 'Sem registro',
      accent: [139, 92, 246] as [number, number, number],
    },
  ];

  const cardGap = 3.5;
  const cardWidth = (CONTENT_WIDTH - cardGap * 3) / 4;
  cards.forEach((c, idx) => {
    const cx = PAGE_MARGIN + idx * (cardWidth + cardGap);
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(cx, y, cardWidth, 21, 2, 2, 'FD');
    doc.setFillColor(...c.accent);
    doc.rect(cx, y, cardWidth, 1.5, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);
    doc.text(c.label, cx + 3, y + 6);

    doc.setFontSize(12);
    doc.setTextColor(15, 23, 42);
    doc.text(c.value, cx + 3, y + 13);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);
    doc.text(c.sub, cx + 3, y + 18);
  });

  y += 27;

  // ============================================================================
  // SECTION 3: KITS NUTRICIONAIS & MEDICAMENTOS ATIVOS
  // ============================================================================
  y = drawSectionTitle(doc, '3. Kits Nutricionais e Medicamentos Ativos', y, [217, 119, 6]);

  if (activeKitProducts.length > 0) {
    autoTable(doc, {
      startY: y,
      margin: { left: PAGE_MARGIN, right: PAGE_MARGIN },
      theme: 'striped',
      headStyles: { fillColor: [217, 119, 6], textColor: 255, fontSize: 8, fontStyle: 'bold' },
      styles: { fontSize: 8, cellPadding: 2.2 },
      head: [['Kit Nutricional', 'Produto / Insumo', 'Categoria', 'Quantidade', 'Posologia / Obs.']],
      body: activeKitProducts.map((p) => [
        p.kitName,
        p.itemName,
        p.category,
        `${p.quantity} ${p.unit}`,
        p.dosage || '--',
      ]),
    });
    y = getLastAutoTableY(doc, y) + 5;
  } else {
    y = ensureSpace(doc, y, 10);
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(8.5);
    doc.setTextColor(100, 116, 139);
    doc.text('Nenhum kit nutricional ativo registrado no último atendimento.', PAGE_MARGIN, y + 3);
    y += 9;
  }

  if (activeMedications.length > 0 && latestClinicalEvent) {
    autoTable(doc, {
      startY: y,
      margin: { left: PAGE_MARGIN, right: PAGE_MARGIN },
      theme: 'striped',
      headStyles: { fillColor: [5, 150, 105], textColor: 255, fontSize: 8, fontStyle: 'bold' },
      styles: { fontSize: 8, cellPadding: 2.2 },
      head: [['Medicamento / Suplemento', 'Posologia', 'Prescrito em', 'Duração / Reposição']],
      body: activeMedications.map((m) => {
        const invItem = items.find((it) => (m.item_id && it.id === m.item_id) || it.name.toLowerCase() === (m.medication || '').toLowerCase());
        const qty = typeof m.quantity === 'number' ? m.quantity : parseInt(m.quantity || '1', 10) || 1;
        const calc = calculateMedicationDuration(invItem, m.treatment, qty, latestClinicalEvent.date);
        const durationDays = m.duration_days || calc.durationDays;
        let durText = 'Uso contínuo / sem prazo';
        if (durationDays) {
          const endDate = calc.renewalDate || addDays(parseLocalDate(latestClinicalEvent.date), durationDays);
          durText = `${durationDays} dias (Próx.: ${endDate.toLocaleDateString('pt-BR')})`;
        }
        return [
          m.medication || '--',
          m.treatment || 'Posologia não informada',
          formatDateBr(latestClinicalEvent.date),
          durText,
        ];
      }),
    });
    y = getLastAutoTableY(doc, y) + 6;
  } else {
    y = ensureSpace(doc, y, 10);
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(8.5);
    doc.setTextColor(100, 116, 139);
    doc.text('Nenhum medicamento ou suplemento ativo prescrito no momento.', PAGE_MARGIN, y + 3);
    y += 9;
  }

  // ============================================================================
  // SECTION 4: GRÁFICOS DE CRESCIMENTO (PADRÕES OMS)
  // ============================================================================
  if (capturedCharts.length > 0) {
    const themeRgb: [number, number, number] = patient.gender === 'M' ? [37, 99, 235] : [219, 39, 119];
    y = drawSectionTitle(doc, '4. Gráficos de Crescimento (Padrões OMS)', y, themeRgb);

    for (const chart of capturedCharts) {
      const chartBoxHeight = 84; // header 7mm + image 72mm + padding
      y = ensureSpace(doc, y, chartBoxHeight + 6);

      // Colored header bar
      doc.setFillColor(...themeRgb);
      doc.roundedRect(PAGE_MARGIN, y, CONTENT_WIDTH, 7, 1.5, 1.5, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.text(chart.title.toUpperCase(), PAGE_MARGIN + 3, y + 4.8);
      doc.text(`PACIENTE: ${patient.name.toUpperCase()}`, PAGE_MARGIN + CONTENT_WIDTH - 3, y + 4.8, { align: 'right' });

      // Border around image
      doc.setDrawColor(...themeRgb);
      doc.setLineWidth(0.4);
      doc.rect(PAGE_MARGIN, y + 7, CONTENT_WIDTH, 73);
      doc.addImage(chart.dataUrl, 'PNG', PAGE_MARGIN + 1, y + 7.5, CONTENT_WIDTH - 2, 72);

      y += chartBoxHeight;
    }

    // Legend bar
    y = ensureSpace(doc, y, 10);
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(PAGE_MARGIN, y, CONTENT_WIDTH, 7, 1.5, 1.5, 'FD');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(51, 65, 85);
    doc.text(
      'Legenda OMS:   Preto: Z +3 / -3     |     Vermelho: Z +2 / -2     |     Verde: Mediana (Z 0)     |     Azul/Rosa: Medições do Paciente',
      PAGE_MARGIN + CONTENT_WIDTH / 2,
      y + 4.6,
      { align: 'center' }
    );
    y += 12;
  }

  // ============================================================================
  // SECTION 5: CADASTRO COMPLETO (ADMISSÃO)
  // ============================================================================
  y = drawSectionTitle(doc, '5. Ficha Completa de Admissão', y, [79, 70, 229]);

  y = renderKeyValueGridTable(
    doc,
    y,
    'Triagem Social e Condições de Moradia',
    [
      ['Tipo de Casa', admission.household?.housing_type || patient.housing_type],
      ['Cômodos', admission.household?.rooms],
      ['Material', admission.household?.dwelling_type],
      ['Telhado', admission.household?.roof],
      ['Saneamento', admission.household?.sanitation || patient.sanitation],
      ['Esgoto', admission.household?.sewage],
      ['Lixo', admission.household?.garbage],
      ['Animais no Quintal', admission.household?.animals],
      ['Renda Mensal', admission.socioeconomics?.monthly_income ? `MZN ${admission.socioeconomics.monthly_income}` : null],
      ['Trabalho Pai', admission.socioeconomics?.father_job],
      ['Trabalho Mãe', admission.socioeconomics?.mother_job],
      ['Trabalho Responsável', admission.socioeconomics?.caregiver_job],
      ['Observações Sociais', admission.socioeconomics?.observations],
    ],
    2
  );

  y = renderKeyValueGridTable(
    doc,
    y,
    'História Gestacional',
    [
      ['Intercorrências Pré-Natal', admission.gestational?.prenatal_problems],
      ['Consultas Pré-Natal', admission.gestational?.prenatal_consultations],
      ['Tipo de Parto', admission.gestational?.delivery_type],
      ['Idade Gestacional', admission.gestational?.gestational_age],
      ['APGAR 1 min / 5 min', `${safeText(admission.gestational?.apgar_1)} / ${safeText(admission.gestational?.apgar_5)}`],
      ['Peso ao Nascer', admission.gestational?.birth_weight ? `${admission.gestational.birth_weight} kg` : null],
      ['Estatura ao Nascer', admission.gestational?.birth_height ? `${admission.gestational.birth_height} cm` : null],
      ['PC ao Nascer', admission.gestational?.birth_hc ? `${admission.gestational.birth_hc} cm` : null],
      ['Intercorrências no Parto', admission.gestational?.birth_problems],
    ],
    2
  );

  y = renderKeyValueGridTable(
    doc,
    y,
    'Alimentação',
    [
      ['Leite Materno', admission.feeding ? (admission.feeding.breast_milk ? 'Sim' : 'Não') : null],
      ['Exclusivo Até (meses)', admission.feeding?.exclusive_breast_milk_until],
      ['Idade Desmame', admission.feeding?.weaning_age],
      ['Intro: Água/Chá', admission.feeding?.water_tea_intro],
      ['Intro: Leite de Vaca', admission.feeding?.cow_milk_intro],
      ['Intro: Papa Salgada', admission.feeding?.salty_mush_intro],
      ['Intro: Suco', admission.feeding?.juice_intro],
      ['Intro: Sopa', admission.feeding?.soup_intro],
      ['Outros Alimentos', admission.feeding?.other_foods],
      ['Alimentação Atual', admission.feeding?.current_feeding],
    ],
    2
  );

  y = renderKeyValueGridTable(
    doc,
    y,
    'História Clínica e Familiar',
    [
      ['Doenças Prévias', admission.clinical?.previous_diseases],
      ['Suplementos', admission.clinical?.supplements],
      ['Imunização', admission.clinical?.immunization],
      ['Histórico Materno', admission.clinical?.mother_history],
      ['Histórico Paterno', admission.clinical?.father_history],
      ['Desnutrição na Família', admission.clinical?.family_malnutrition_history],
      ['Consanguinidade', admission.clinical ? (admission.clinical.consanguinity ? 'Sim' : 'Não') : null],
      ['Doenças Hereditárias', admission.clinical?.hereditary_diseases],
      ['Dinâmica Familiar', admission.clinical?.family_dynamics],
    ],
    2
  );

  y = renderKeyValueGridTable(
    doc,
    y,
    'Avaliação Inicial e Exame Físico',
    [
      ['Data da Avaliação', formatDateBr(admission.initialAssessment?.date)],
      ['Informante', admission.initialAssessment?.informant],
      ['Queixa Principal', admission.initialAssessment?.main_complaint],
      ['História da Doença', admission.initialAssessment?.history],
      ['Medicamentos em Uso', admission.initialAssessment?.current_medications],
      ['Peso Inicial', admission.physical?.weight ? `${admission.physical.weight} kg` : null],
      ['Estatura Inicial', admission.physical?.height ? `${admission.physical.height} cm` : null],
      ['Perímetro Braquial', admission.physical?.muac ? `${admission.physical.muac} cm` : null],
      ['Perímetro Cefálico', admission.physical?.head_circumference ? `${admission.physical.head_circumference} cm` : null],
      ['Edema Bilateral', admission.physical?.bilateral_edema],
      ['Temperatura Axilar', admission.physical?.axillary_temperature ? `${admission.physical.axillary_temperature} °C` : null],
      ['Saúde Oral', admission.physical?.oral_health],
      ['Outros Achados', admission.physical?.other_findings],
    ],
    2
  );

  // ============================================================================
  // SECTION 6: TABELA DE EVOLUÇÃO ANTROPOMÉTRICA
  // ============================================================================
  y = drawSectionTitle(doc, '6. Tabela de Evolução Antropométrica', y);

  const clinicalRows = events.filter((e) => e.event_type !== 'acs_visit' && e.event_type !== 'observation');
  if (clinicalRows.length > 0) {
    autoTable(doc, {
      startY: y,
      margin: { left: PAGE_MARGIN, right: PAGE_MARGIN },
      theme: 'striped',
      headStyles: { fillColor: [15, 23, 42], textColor: 255, fontSize: 7.5, fontStyle: 'bold' },
      styles: { fontSize: 7.5, cellPadding: 2 },
      head: [['Data', 'Idade', 'Peso (kg)', 'Est. (cm)', 'PB (cm)', 'PC (cm)', 'P/E (Z)', 'Status', 'Visita Domiciliar', 'Profissional']],
      body: clinicalRows.map((ev) => {
        const visit = getVisitForEvent(ev.date);
        const visitText = visit
          ? visit.status === 'completed'
            ? `Visitada (${formatDateBr(visit.date)})`
            : `Na Fila (${formatDateBr(visit.date)})`
          : 'Não visitada';
        return [
          formatDateBr(ev.date),
          calculateAge(patient.dob, ev.date),
          ev.weight ?? '--',
          ev.height ?? '--',
          ev.muac ?? '--',
          ev.head_circumference ?? '--',
          ev.z_score_weight_height !== undefined && ev.z_score_weight_height !== null ? ev.z_score_weight_height : '--',
          ev.nutritional_status || '--',
          visitText,
          formatProfessionalName(ev.professional),
        ];
      }),
      didParseCell: (data) => {
        if (data.section === 'body' && data.column.index === 6) {
          const val = Number(data.cell.raw);
          if (!Number.isNaN(val)) {
            data.cell.styles.fontStyle = 'bold';
            if (val < -2) data.cell.styles.textColor = [220, 38, 38];
            else if (val < -1) data.cell.styles.textColor = [217, 119, 6];
            else data.cell.styles.textColor = [5, 150, 105];
          }
        }
      },
    });
    y = getLastAutoTableY(doc, y) + 6;
  } else {
    y = ensureSpace(doc, y, 10);
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(8.5);
    doc.setTextColor(100, 116, 139);
    doc.text('Nenhuma medição antropométrica registrada.', PAGE_MARGIN, y + 3);
    y += 9;
  }

  // ============================================================================
  // SECTION 7: HISTÓRICO CLÍNICO DETALHADO (LINHA DO TEMPO)
  // ============================================================================
  y = drawSectionTitle(doc, '7. Histórico Clínico Completo (Linha do Tempo)', y);

  if (events.length > 0) {
    const timelineRows = events.map((ev) => {
      const detailsParts: string[] = [];

      const measurements: string[] = [];
      if (ev.weight) measurements.push(`Peso: ${ev.weight} kg`);
      if (ev.height) measurements.push(`Est.: ${ev.height} cm`);
      if (ev.muac) measurements.push(`PB: ${ev.muac} cm`);
      if (ev.head_circumference) measurements.push(`PC: ${ev.head_circumference} cm`);
      if (ev.z_score_weight_height !== undefined && ev.z_score_weight_height !== null) {
        measurements.push(`Z-Score P/E: ${ev.z_score_weight_height}`);
      }
      if (measurements.length > 0) {
        detailsParts.push(`Medições: ${measurements.join(' | ')}`);
      }

      if (ev.notes) {
        detailsParts.push(`Observações: ${ev.notes}`);
      }

      if (ev.kit_delivered && ev.kit_delivered.length > 0) {
        const kitNames = ev.kit_delivered.map((kitId) => {
          const kit = kits.find((k) => k.id === kitId) || matchDefaultKitByIdOrName(kitId);
          if (!kit) return 'Kit Nutricional';
          const kitItemsStr = (kit.items || [])
            .map((ki) => {
              const inv = items.find((i) => i.id === ki.item_id) || matchInventoryItem({ itemId: ki.item_id, itemName: (ki as any).item_name }, items);
              const name = inv?.name || (ki as any).item_name || 'Insumo';
              const unit = inv?.unit || 'un';
              return `${name} (${ki.quantity} ${unit})`;
            })
            .join(', ');
          return kitItemsStr ? `${kit.name} [${kitItemsStr}]` : kit.name;
        });
        detailsParts.push(`Kits Entregues: ${kitNames.join('; ')}`);
      }

      if (ev.prescriptions && ev.prescriptions.length > 0) {
        const meds = ev.prescriptions.map((p) => `${p.medication}${p.treatment ? ` (${p.treatment})` : ''}`);
        detailsParts.push(`Prescrições: ${meds.join('; ')}`);
      }

      if (ev.return_date) {
        detailsParts.push(`Retorno Agendado: ${formatDateBr(ev.return_date)}`);
      }

      return [
        formatDateBr(ev.date),
        getEventTypeLabel(ev),
        ev.nutritional_status || '--',
        formatProfessionalName(ev.professional),
        detailsParts.join('\n') || '--',
      ];
    });

    autoTable(doc, {
      startY: y,
      margin: { left: PAGE_MARGIN, right: PAGE_MARGIN },
      theme: 'grid',
      headStyles: { fillColor: [5, 150, 105], textColor: 255, fontSize: 7.5, fontStyle: 'bold' },
      styles: { fontSize: 7.5, cellPadding: 2.3, valign: 'top' },
      columnStyles: {
        0: { cellWidth: 20 },
        1: { cellWidth: 30 },
        2: { cellWidth: 22 },
        3: { cellWidth: 26 },
        4: { cellWidth: 84 },
      },
      head: [['Data', 'Tipo', 'Status', 'Profissional', 'Detalhes, Notas e Prescrições']],
      body: timelineRows,
    });
  } else {
    y = ensureSpace(doc, y, 10);
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(8.5);
    doc.setTextColor(100, 116, 139);
    doc.text('Nenhum evento registrado na linha do tempo clínica.', PAGE_MARGIN, y + 3);
  }

  // ============================================================================
  // PAGE NUMBERS & FOOTER ON ALL PAGES
  // ============================================================================
  const totalPages = doc.getNumberOfPages();
  const pageHeight = doc.internal.pageSize.getHeight();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.2);
    doc.line(PAGE_MARGIN, pageHeight - 12, PAGE_MARGIN + CONTENT_WIDTH, pageHeight - 12);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text(
      `YAH Hope • Prontuário Clínico: ${patient.name} (ID: ${safeText(patient.registration_number)}) • Emitido em ${nowStr}`,
      PAGE_MARGIN,
      pageHeight - 7.5
    );
    doc.text(`Página ${i} de ${totalPages}`, PAGE_MARGIN + CONTENT_WIDTH, pageHeight - 7.5, { align: 'right' });
  }

  const sanitizedName = patient.name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
  const fileName = `Historico_Clinico_${sanitizedName || patient.id}_${format(new Date(), 'yyyy-MM-dd')}.pdf`;

  doc.save(fileName);
}
