import { InventoryItem } from './mockData';
import { addDays } from 'date-fns';
import { parseLocalDate, formatDisplayDate, formatLocalDate } from './utils';

export interface MedicationDurationResult {
  dailyDose: number | null;
  totalUnits: number | null; // Total de comprimidos ou total em ml
  durationDays: number | null;
  renewalDate: Date | null;
  renewalDateStr: string | null; // YYYY-MM-DD
  dosageForm: 'comprimido' | 'liquido' | 'outro';
  unitLabel: string; // 'comprimidos' | 'ml'
  packageLabel: string; // 'caixa' | 'frasco'
  explanation: string | null;
}

/**
 * Parses daily dose from a posology text string.
 * Supports Portuguese medical posology:
 * - "1 comp 2x ao dia" -> 2
 * - "1 comprimido ao dia" -> 1
 * - "1/2 comp ao dia" or "0.5 comp ao dia" -> 0.5
 * - "1 comp de 8 em 8h" -> 3
 * - "1 comp de 12 em 12h" -> 2
 * - "5ml 2x ao dia" -> 10
 * - "5ml de 8 em 8h" -> 15
 * - "2.5ml 3x ao dia" -> 7.5
 */
export function parseDailyDose(posologyText?: string, form: 'comprimido' | 'liquido' = 'comprimido'): number | null {
  if (!posologyText || !posologyText.trim()) return null;

  let text = posologyText.toLowerCase().trim();
  // Normalize fractions & decimals: 1/2 -> 0.5, 1/4 -> 0.25, 2,5 -> 2.5
  text = text.replace(/1\/2/g, '0.5').replace(/1\/4/g, '0.25').replace(/(\d+),(\d+)/g, '$1.$2');

  // Detect frequency multiplier
  let freq = 1;
  if (/(?:de\s*)?8(?:\s*\/\s*8|\s*em\s*8)\s*h?/i.test(text)) {
    freq = 3; // 24 / 8 = 3 times a day
  } else if (/(?:de\s*)?6(?:\s*\/\s*6|\s*em\s*6)\s*h?/i.test(text)) {
    freq = 4; // 24 / 6 = 4 times a day
  } else if (/(?:de\s*)?12(?:\s*\/\s*12|\s*em\s*12)\s*h?/i.test(text)) {
    freq = 2; // 24 / 12 = 2 times a day
  } else if (/(?:de\s*)?4(?:\s*\/\s*4|\s*em\s*4)\s*h?/i.test(text)) {
    freq = 6;
  } else {
    const timesMatch = text.match(/(\d+(?:\.\d+)?)\s*(?:x|vezes)\s*(?:ao|por)?\s*dia/i) || text.match(/(\d+(?:\.\d+)?)\s*x\b/i);
    if (timesMatch) {
      freq = parseFloat(timesMatch[1]) || 1;
    } else if (/\b2x\b/i.test(text) || /duas\s*vezes/i.test(text)) {
      freq = 2;
    } else if (/\b3x\b/i.test(text) || /tr[eê]s\s*vezes/i.test(text)) {
      freq = 3;
    } else if (/\b4x\b/i.test(text) || /quatro\s*vezes/i.test(text)) {
      freq = 4;
    }
  }

  // Detect single dose amount
  let singleDose: number | null = null;

  if (form === 'liquido') {
    // Look for ml
    const mlMatch = text.match(/(\d+(?:\.\d+)?)\s*ml/i);
    if (mlMatch) {
      singleDose = parseFloat(mlMatch[1]);
    } else {
      const numMatch = text.match(/^(\d+(?:\.\d+)?)/);
      if (numMatch) {
        singleDose = parseFloat(numMatch[1]);
      }
    }
  } else {
    // Comprimido
    const compMatch = text.match(/(\d+(?:\.\d+)?)\s*(?:comp(?:rimido)?s?|c[aá]ps(?:ula)?s?|sach[eê]s?)/i);
    if (compMatch) {
      singleDose = parseFloat(compMatch[1]);
    } else {
      const numMatch = text.match(/^(\d+(?:\.\d+)?)/);
      if (numMatch) {
        singleDose = parseFloat(numMatch[1]);
      }
    }
  }

  if (singleDose === null || isNaN(singleDose) || singleDose <= 0) {
    return null;
  }

  return singleDose * freq;
}

export function calculateMedicationDuration(
  item?: InventoryItem | null,
  posologyText?: string,
  quantityPackages: number = 1,
  startDateStr?: string
): MedicationDurationResult {
  const defaultResult: MedicationDurationResult = {
    dailyDose: null,
    totalUnits: null,
    durationDays: null,
    renewalDate: null,
    renewalDateStr: null,
    dosageForm: 'outro',
    unitLabel: 'unidades',
    packageLabel: 'unidade',
    explanation: null
  };

  if (!item) return defaultResult;

  const form: 'comprimido' | 'liquido' | 'outro' = item.dosage_form || 
    (item.unit?.toLowerCase().includes('frasco') ? 'liquido' :
     item.unit?.toLowerCase().includes('caixa') ? 'comprimido' : 'outro');

  const packages = Math.max(1, Number(quantityPackages) || 1);
  const startDate = startDateStr ? parseLocalDate(startDateStr) : new Date();

  if (form === 'comprimido') {
    const pillsPerBox = item.package_units || 0;
    if (pillsPerBox <= 0) {
      return {
        ...defaultResult,
        dosageForm: 'comprimido',
        unitLabel: 'comprimidos',
        packageLabel: 'caixa',
        explanation: 'Configure a quantidade de comprimidos por caixa no estoque para prever a data da próxima caixa.'
      };
    }

    const totalPills = packages * pillsPerBox;
    const dailyDose = parseDailyDose(posologyText, 'comprimido');

    if (!dailyDose || dailyDose <= 0) {
      return {
        ...defaultResult,
        totalUnits: totalPills,
        dosageForm: 'comprimido',
        unitLabel: 'comprimidos',
        packageLabel: 'caixa',
        explanation: `${packages} cx (${totalPills} comp). Informe a posologia (ex: 1 comp 2x/dia) para calcular a data da próxima caixa.`
      };
    }

    const durationDays = Math.max(1, Math.floor(totalPills / dailyDose));
    const renewalDate = addDays(startDate, durationDays);
    const renewalDateStr = formatLocalDate(renewalDate);

    return {
      dailyDose,
      totalUnits: totalPills,
      durationDays,
      renewalDate,
      renewalDateStr,
      dosageForm: 'comprimido',
      unitLabel: 'comprimidos',
      packageLabel: 'caixa',
      explanation: `${packages} cx (${totalPills} comp) a ${dailyDose} comp/dia durará ${durationDays} dias. Nova caixa prevista para ${formatDisplayDate(renewalDateStr)}.`
    };
  }

  if (form === 'liquido') {
    const mlPerBottle = item.liquid_volume_ml || 0;
    if (mlPerBottle <= 0) {
      return {
        ...defaultResult,
        dosageForm: 'liquido',
        unitLabel: 'ml',
        packageLabel: 'frasco',
        explanation: 'Configure o volume em ml do frasco no estoque para prever a data do próximo frasco.'
      };
    }

    const totalMl = packages * mlPerBottle;
    const dailyDose = parseDailyDose(posologyText, 'liquido');

    if (!dailyDose || dailyDose <= 0) {
      return {
        ...defaultResult,
        totalUnits: totalMl,
        dosageForm: 'liquido',
        unitLabel: 'ml',
        packageLabel: 'frasco',
        explanation: `${packages} frasco(s) (${totalMl} ml). Informe a posologia (ex: 5ml 2x/dia) para calcular a data do próximo frasco.`
      };
    }

    const durationDays = Math.max(1, Math.floor(totalMl / dailyDose));
    const renewalDate = addDays(startDate, durationDays);
    const renewalDateStr = formatLocalDate(renewalDate);

    return {
      dailyDose,
      totalUnits: totalMl,
      durationDays,
      renewalDate,
      renewalDateStr,
      dosageForm: 'liquido',
      unitLabel: 'ml',
      packageLabel: 'frasco',
      explanation: `${packages} frasco(s) (${totalMl} ml) a ${dailyDose} ml/dia durará ${durationDays} dias. Novo frasco previsto para ${formatDisplayDate(renewalDateStr)}.`
    };
  }

  return defaultResult;
}
