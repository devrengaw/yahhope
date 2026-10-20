import { Kit, KitItem, InventoryItem } from './mockData';

export interface DefaultItemSpec {
  name: string;
  category: string;
  unit: string;
  min_quantity: number;
  purchase_price: number;
  currency: string;
  dosage?: string;
  quantity: number; // quantidade padrão no kit
}

export interface DefaultKitSpec {
  id: string;
  name: string;
  description: string;
  items: DefaultItemSpec[];
}

export const DEFAULT_NUTRITION_KITS_SPEC: DefaultKitSpec[] = [
  {
    id: 'kit-cesta-basica-familiar',
    name: 'Cesta Básica Familiar',
    description: 'Cesta básica universal entregue a 100% das famílias atendidas na Casa Nutri.',
    items: [
      { name: 'Arroz de Primeira', category: 'Alimentação', unit: 'kg', min_quantity: 50, purchase_price: 65, currency: 'MZN', quantity: 5 },
      { name: 'Feijão Manteiga', category: 'Alimentação', unit: 'kg', min_quantity: 30, purchase_price: 90, currency: 'MZN', quantity: 2 },
      { name: 'Farinha de Milho / Composta', category: 'Alimentação', unit: 'kg', min_quantity: 40, purchase_price: 55, currency: 'MZN', quantity: 2 },
      { name: 'Óleo Vegetal Alimentar', category: 'Alimentação', unit: 'litro', min_quantity: 25, purchase_price: 110, currency: 'MZN', quantity: 1 },
      { name: 'Açúcar Branco', category: 'Alimentação', unit: 'kg', min_quantity: 30, purchase_price: 60, currency: 'MZN', quantity: 1 },
      { name: 'Sal Iodado', category: 'Alimentação', unit: 'kg', min_quantity: 20, purchase_price: 25, currency: 'MZN', quantity: 1 },
      { name: 'Sabão em Barra', category: 'Higiene', unit: 'unidades', min_quantity: 40, purchase_price: 35, currency: 'MZN', quantity: 2 }
    ]
  },
  {
    id: 'kit-0-a-6-meses',
    name: 'Kit 0 a 6 meses (Lactentes)',
    description: 'Suporte nutricional prioritário para lactentes menores de 6 meses sem aleitamento materno exclusivo.',
    items: [
      { name: 'Fórmula Infantil Lactente (0 a 6 meses)', category: 'Nutrição Infantil', unit: 'latas', min_quantity: 20, purchase_price: 450, currency: 'MZN', dosage: 'Conforme orientação do pediatra/nutricionista', quantity: 2 },
      { name: 'Suplemento Vitamínico Pediátrico', category: 'Suplementos', unit: 'frascos', min_quantity: 15, purchase_price: 180, currency: 'MZN', dosage: '1 ml via oral 1x ao dia', quantity: 1 },
      { name: 'Copo / Dosador Graduado', category: 'Consumo', unit: 'unidades', min_quantity: 20, purchase_price: 50, currency: 'MZN', quantity: 1 }
    ]
  },
  {
    id: 'kit-6-a-24-meses',
    name: 'Kit 6 a 24 meses (Transição Alimentar)',
    description: 'Kit essencial de recuperação e transição alimentar com Farinha Enriquecida e Leite.',
    items: [
      { name: 'Farinha Enriquecida / CSB (Corn-Soy Blend)', category: 'Nutrição Infantil', unit: 'kg', min_quantity: 40, purchase_price: 85, currency: 'MZN', dosage: 'Papas enriquecidas 2 a 3x ao dia', quantity: 2 },
      { name: 'Leite em Pó Integral Fortificado', category: 'Alimentação', unit: 'latas', min_quantity: 30, purchase_price: 220, currency: 'MZN', dosage: '2 medidas em 100ml de água', quantity: 2 },
      { name: 'Multivitamínico e Micronutrientes Pediátrico', category: 'Suplementos', unit: 'frascos', min_quantity: 25, purchase_price: 195, currency: 'MZN', dosage: '5 ml via oral 1x ao dia', quantity: 1 },
      { name: 'Óleo Vegetal Alimentar', category: 'Alimentação', unit: 'litro', min_quantity: 25, purchase_price: 110, currency: 'MZN', quantity: 1 },
      { name: 'Açúcar Branco', category: 'Alimentação', unit: 'kg', min_quantity: 30, purchase_price: 60, currency: 'MZN', quantity: 1 }
    ]
  },
  {
    id: 'kit-2-a-5-anos',
    name: 'Kit 2 a 5 anos (> 24 meses)',
    description: 'Suplementação alimentar para crianças de 2 a 5 anos em recuperação nutricional.',
    items: [
      { name: 'Farinha Composta Fortificada', category: 'Nutrição Infantil', unit: 'kg', min_quantity: 35, purchase_price: 80, currency: 'MZN', dosage: 'Mingau fortificado 2x ao dia', quantity: 2 },
      { name: 'Leite em Pó Integral Fortificado', category: 'Alimentação', unit: 'latas', min_quantity: 25, purchase_price: 220, currency: 'MZN', quantity: 1 },
      { name: 'Feijão Manteiga', category: 'Alimentação', unit: 'kg', min_quantity: 30, purchase_price: 90, currency: 'MZN', quantity: 1 },
      { name: 'Complexo Vitamínico Infantil', category: 'Suplementos', unit: 'frascos', min_quantity: 20, purchase_price: 190, currency: 'MZN', dosage: '5 ml via oral 1x ao dia', quantity: 1 }
    ]
  },
  {
    id: 'kit-suporte-hiv-terapeutico',
    name: 'Kit Suporte Clínico / HIV (Terapêutico)',
    description: 'Aporte terapêutico intensivo e hipercalórico para crianças expostas ou com necessidades clínicas especiais.',
    items: [
      { name: 'Alimento Terapêutico Pronto (RUTF / Plumpy)', category: 'Nutrição Clínica', unit: 'sachês', min_quantity: 50, purchase_price: 45, currency: 'MZN', dosage: '1 sachê ao dia no intervalo das refeições', quantity: 14 },
      { name: 'Multivitamínico & Zinco Pediátrico', category: 'Medicamentos', unit: 'frascos', min_quantity: 25, purchase_price: 175, currency: 'MZN', dosage: '5 ml via oral 1x ao dia', quantity: 1 },
      { name: 'Leite em Pó Integral Fortificado', category: 'Alimentação', unit: 'latas', min_quantity: 25, purchase_price: 220, currency: 'MZN', quantity: 2 },
      { name: 'Óleo Vegetal Alimentar', category: 'Alimentação', unit: 'litro', min_quantity: 25, purchase_price: 110, currency: 'MZN', quantity: 1 }
    ]
  }
];

/**
 * Busca a especificação padrão de um kit pelo ID ou por similaridade do nome
 */
export function matchDefaultKitByIdOrName(identifier: string): Kit | undefined {
  if (!identifier) return undefined;
  const normId = identifier.trim().toLowerCase();
  
  const found = DEFAULT_NUTRITION_KITS_SPEC.find(spec => {
    if (spec.id === identifier || spec.id.toLowerCase() === normId) return true;
    const specNorm = spec.name.trim().toLowerCase();
    if (specNorm === normId) return true;
    if (normId.includes('cesta') && spec.id.includes('cesta')) return true;
    if ((normId.includes('0 a 6') || normId.includes('0-6')) && spec.id.includes('0-a-6')) return true;
    if ((normId.includes('6 a 24') || normId.includes('6-24')) && spec.id.includes('6-a-24')) return true;
    if ((normId.includes('2 a 5') || normId.includes('2-5') || normId.includes('> 24')) && spec.id.includes('2-a-5')) return true;
    if (normId.includes('hiv') && spec.id.includes('hiv')) return true;
    return false;
  });

  if (!found) return undefined;

  return {
    id: found.id,
    name: found.name,
    description: found.description,
    items: found.items.map(item => ({
      item_id: `default-${normalizeKitItemText(item.name)}`,
      quantity: item.quantity,
      dosage: item.dosage,
      item_name: item.name
    } as any))
  };
}

/**
 * Normaliza strings para comparação insensível a maiúsculas, acentos e pontuação
 */
export function normalizeKitItemText(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, ' ')
    .trim();
}

/**
 * Busca de forma tolerante a falhas um item do inventário correspondente ao item do kit.
 * Procura primeiro por ID; se não encontrar, tenta casar por nome aproximado.
 */
export function matchInventoryItem(
  identifier: { itemId?: string; itemName?: string },
  inventory: InventoryItem[]
): InventoryItem | undefined {
  if (identifier.itemId) {
    const direct = inventory.find(i => i.id === identifier.itemId);
    if (direct) return direct;
  }

  if (identifier.itemName) {
    const normTarget = normalizeKitItemText(identifier.itemName);
    const byName = inventory.find(i => {
      const normI = normalizeKitItemText(i.name);
      return normI === normTarget || normI.includes(normTarget) || normTarget.includes(normI);
    });
    if (byName) return byName;
  }

  return undefined;
}

/**
 * Reconcilia e blinda os kits contra perda de produtos.
 * Se algum kit estiver sem produtos (items vazio), recompõe com os produtos padrão correspondentes
 * vinculando aos itens do estoque disponíveis.
 */
export function reconcileKitsWithNutritionDefaults(
  currentKits: Kit[],
  inventoryItems: InventoryItem[]
): {
  reconciledKits: Kit[];
  missingInventorySpecs: DefaultItemSpec[];
  hasChanges: boolean;
} {
  let hasChanges = false;
  const missingSpecs: DefaultItemSpec[] = [];
  const kitMap = new Map<string, Kit>();

  // 1. Armazena kits existentes
  currentKits.forEach(k => kitMap.set(k.name.trim().toLowerCase(), { ...k, items: [...(k.items || [])] }));

  // 2. Para cada especificação padrão da Casa Nutri, assegura que o kit exista e contenha seus produtos
  DEFAULT_NUTRITION_KITS_SPEC.forEach(spec => {
    const specNormName = spec.name.trim().toLowerCase();
    
    // Procura kit existente correspondente (por nome aproximado ou ID)
    let existingKit = Array.from(kitMap.values()).find(k => {
      const kNorm = k.name.trim().toLowerCase();
      if (k.id === spec.id) return true;
      if (kNorm === specNormName) return true;
      if (spec.id.includes('cesta') && (kNorm.includes('cesta') || kNorm.includes('basica') || kNorm.includes('básica'))) return true;
      if (spec.id.includes('0-a-6') && (kNorm.includes('0 a 6') || kNorm.includes('0-6') || kNorm.includes('lactente'))) return true;
      if (spec.id.includes('6-a-24') && (kNorm.includes('6 a 24') || kNorm.includes('6-24') || kNorm.includes('transic'))) return true;
      if (spec.id.includes('2-a-5') && (kNorm.includes('2 a 5') || kNorm.includes('2-5') || kNorm.includes('> 24') || kNorm.includes('maior'))) return true;
      if (spec.id.includes('hiv') && (kNorm.includes('hiv') || kNorm.includes('terapeut') || kNorm.includes('terapêut'))) return true;
      return false;
    });

    // Se o kit não existe, cria-o
    if (!existingKit) {
      existingKit = {
        id: spec.id,
        name: spec.name,
        description: spec.description,
        items: []
      };
      kitMap.set(specNormName, existingKit);
      hasChanges = true;
    }

    // Se o kit está sem produtos (vazio) ou com itens órfãos sem correspondência no inventário
    const validExistingItems = existingKit.items.filter(ki => {
      if (!ki.item_id) return false;
      return inventoryItems.some(i => i.id === ki.item_id);
    });

    if (validExistingItems.length === 0) {
      // Reconstroi os itens a partir da especificação padrão
      const rebuiltItems: KitItem[] = [];

      spec.items.forEach(specItem => {
        let matched = matchInventoryItem({ itemName: specItem.name }, inventoryItems);
        
        if (!matched) {
          // Marca insumo como faltante no inventário para posterior auto-criação
          if (!missingSpecs.some(m => normalizeKitItemText(m.name) === normalizeKitItemText(specItem.name))) {
            missingSpecs.push(specItem);
          }
        }

        rebuiltItems.push({
          item_id: matched ? matched.id : `tmp-inv-${normalizeKitItemText(specItem.name)}`,
          quantity: specItem.quantity,
          dosage: specItem.dosage,
          ...(matched ? {} : { item_name: specItem.name })
        } as any);
      });

      existingKit.items = rebuiltItems;
      hasChanges = true;
    }
  });

  return {
    reconciledKits: Array.from(kitMap.values()),
    missingInventorySpecs: missingSpecs,
    hasChanges
  };
}
