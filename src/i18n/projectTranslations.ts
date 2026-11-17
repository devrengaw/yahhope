import { useEffect, useMemo, useState } from 'react';
import { YAHHopeProject } from '../lib/mockData';

interface ProjectTranslation {
  title?: string;
  description?: string;
  full_description?: string;
  category?: string;
  location?: string;
  coordinator?: string;
  beneficiaries_target?: string;
  beneficiaries_reached?: string;
}

const KNOWN_PROJECTS_BY_ID: Record<string, ProjectTranslation> = {
  'proj-1': {
    title: 'Casa Nutri & Child Health',
    description: 'Therapeutic and nutritional care for 9 children to regain weight and health.',
    full_description:
      '<p><strong>Casa Nutri</strong> is an intensive care and love unit created by YAH Hope to rescue children suffering from severe malnutrition and biological and social vulnerability.</p><p>Our multidisciplinary team — made up of volunteer nutritionists, doctors, and social workers — develops high-calorie, high-protein therapeutic meal plans, complemented with essential vitamins, treated water, and continuous medical monitoring.</p><h3>Pillars of Action</h3><ul><li><strong>Accelerated Weight Recovery:</strong> Balanced diet with micronutrient-rich infant formulas.</li><li><strong>Weekly Clinical Monitoring:</strong> Measurement of weight, height, mid-upper arm circumference, and laboratory tests.</li><li><strong>Family Education and Autonomy:</strong> Workshops for mothers and caregivers on hygiene, food preparation, and household food security.</li></ul><p>Every restored life represents a generation that regains the right to dream, play, and build a future with dignity.</p>',
    category: 'Nutrition & Health',
    location: 'Mozambique & Vulnerable Regions',
    coordinator: 'Dr. Sarah M. (Clinical Nutrition)',
    beneficiaries_target: '15 children',
    beneficiaries_reached: '9 children in active treatment',
  },
  'proj-2': {
    title: 'Mentorship & University Scholarships',
    description: 'Ensuring 5 capable young people complete college and build new horizons.',
    full_description:
      '<p>YAH Hope’s <strong>University Scholarships and Mentorship</strong> project breaks the cycle of poverty through excellence in higher education. Young people from vulnerable communities who have demonstrated extraordinary dedication to their studies receive tuition coverage, textbooks, and professional mentorship from experienced leaders.</p><h3>How the Program Works</h3><ul><li><strong>Full University Costs:</strong> Enrollment, technical books, and transportation guaranteed through graduation.</li><li><strong>Monthly Vocational Mentorship:</strong> 1-on-1 guidance for leadership, ethics, and career development.</li><li><strong>Giving Back to the Community:</strong> Each scholarship student dedicates weekly hours to free tutoring for younger children.</li></ul>',
    category: 'Higher Education',
    location: 'Mozambique',
    coordinator: 'Prof. Marcos Silva',
    beneficiaries_target: '10 students',
    beneficiaries_reached: '5 scholarship students',
  },
  'proj-3': {
    title: 'Sewing Workshops & Community Gardens',
    description: 'Financial autonomy and income generation for mothers and families who previously had no prospects.',
    full_description:
      '<p>Sustainable transformation happens when we empower mothers to provide for their homes. The <strong>Sewing Workshops & Community Gardens</strong> project teaches practical trades, entrepreneurship, and sustainable family farming.</p><h3>Direct Impact</h3><ul><li><strong>Sewing and Pattern Making:</strong> Production of uniforms and garments for local sale.</li><li><strong>Organic Gardens:</strong> Cultivation of fresh vegetables for family consumption and sale of surplus at the regional market.</li><li><strong>Financial Micro-Management:</strong> Basic principles of finance, cooperatives, and community savings.</li></ul>',
    category: 'Training & Income',
    location: 'Underserved Communities',
    coordinator: 'Helena Santos',
    beneficiaries_target: '40 families',
    beneficiaries_reached: '28 mothers trained',
  },
  'proj-4': {
    title: 'Humanitarian Response & Faith',
    description: 'Hygiene kits, emergency relief, and pastoral support to restore human dignity.',
    full_description:
      '<p>In times of climate crisis, severe scarcity, or humanitarian emergencies, YAH Hope mobilizes volunteers and resources to provide agile relief with compassion and Christian love in action.</p><h3>Emergency Actions</h3><ul><li><strong>Hygiene & First Aid Kits:</strong> Essential sanitary items and drinking water purifiers.</li><li><strong>Nutritious Food Baskets:</strong> Non-perishable, safely prepared food for displaced families.</li><li><strong>Pastoral & Psychosocial Care:</strong> Active listening, prayer, and emotional support for those who have lost everything.</li></ul>',
    category: 'Emergency Response',
    location: 'Emergency & Disaster Zones',
    coordinator: 'Pastor Daniel & Volunteer Team',
    beneficiaries_target: '500 kits distributed',
    beneficiaries_reached: '320 families served',
  },
};

const KNOWN_PROJECTS_BY_TITLE: Record<string, ProjectTranslation> = {
  'casa nutri & saúde infantil': KNOWN_PROJECTS_BY_ID['proj-1'],
  'mentoria & bolsas universitárias': KNOWN_PROJECTS_BY_ID['proj-2'],
  'oficinas de costura & hortas': KNOWN_PROJECTS_BY_ID['proj-3'],
  'resposta humanitária & fé': KNOWN_PROJECTS_BY_ID['proj-4'],
  'infraestrutura comunitária': {
    title: 'Community Infrastructure',
    description: 'Improving housing and basic sanitation conditions in the communities we serve.',
    category: 'General',
  },
  'desnutrição infantil': {
    title: 'Child Malnutrition',
    category: 'General',
  },
};

const CATEGORY_MAP: Record<string, string> = {
  'geral': 'General',
  'projeto local': 'Local Project',
  'nutrição & saúde': 'Nutrition & Health',
  'nutrição e saúde': 'Nutrition & Health',
  'nutrição': 'Nutrition',
  'saúde': 'Health',
  'educação superior': 'Higher Education',
  'educação': 'Education',
  'capacitação & renda': 'Training & Income',
  'ação emergencial': 'Emergency Response',
  'infraestrutura': 'Infrastructure',
  'água & saneamento': 'Water & Sanitation',
  'assistência social': 'Social Assistance',
};

const LOCATION_MAP: Record<string, string> = {
  'moçambique': 'Mozambique',
  'moçambique & regiões vulneráveis': 'Mozambique & Vulnerable Regions',
  'comunidades periféricas': 'Underserved Communities',
  'zonas de emergência e calamidade': 'Emergency & Disaster Zones',
  'brasil': 'Brazil',
};

const CACHE_KEY = 'yah_hope_proj_en_cache_v1';
let memoryCache: Record<string, string> | null = null;
const pendingTranslations = new Map<string, Promise<string>>();

function getCache(): Record<string, string> {
  if (memoryCache) return memoryCache;
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (raw) {
      memoryCache = JSON.parse(raw);
      return memoryCache!;
    }
  } catch {
    // ignore storage errors
  }
  memoryCache = {};
  return memoryCache;
}

function saveToCache(source: string, translated: string) {
  const cache = getCache();
  cache[source] = translated;
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  } catch {
    // ignore storage quota errors
  }
}

async function fetchGoogleTranslation(text: string): Promise<string> {
  const trimmed = text.trim();
  if (!trimmed) return text;

  const cache = getCache();
  if (cache[trimmed]) return cache[trimmed];

  const existing = pendingTranslations.get(trimmed);
  if (existing) return existing;

  const promise = (async () => {
    try {
      const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=pt&tl=en&dt=t&q=${encodeURIComponent(trimmed)}`;
      const res = await fetch(url);
      if (!res.ok) return text;
      const data = await res.json();
      if (Array.isArray(data?.[0])) {
        const translated = data[0].map((part: unknown[]) => (Array.isArray(part) ? part[0] : '')).join('');
        if (translated && translated.trim()) {
          saveToCache(trimmed, translated);
          return translated;
        }
      }
    } catch {
      // ignore network/CORS errors and keep original text
    } finally {
      pendingTranslations.delete(trimmed);
    }
    return text;
  })();

  pendingTranslations.set(trimmed, promise);
  return promise;
}

async function translateHtmlOrPlainText(input: string): Promise<string> {
  const trimmed = input.trim();
  if (!trimmed) return input;

  const cache = getCache();
  if (cache[trimmed]) return cache[trimmed];

  // If HTML tags are present, translate only text segments between tags so markup stays intact
  if (/<[a-z][\s\S]*>/i.test(input)) {
    const parts = input.split(/(<[^>]+>)/g);
    const translatedParts = await Promise.all(
      parts.map(async (part) => {
        if (!part || part.startsWith('<') || !part.trim()) return part;
        const leadingSpace = part.match(/^\s*/)?.[0] || '';
        const trailingSpace = part.match(/\s*$/)?.[0] || '';
        const translated = await fetchGoogleTranslation(part.trim());
        return `${leadingSpace}${translated}${trailingSpace}`;
      })
    );
    const combined = translatedParts.join('');
    saveToCache(trimmed, combined);
    return combined;
  }

  return fetchGoogleTranslation(input);
}

export function translateProjectSync(project: YAHHopeProject, isEn: boolean): YAHHopeProject {
  if (!isEn) return project;

  const normalizedTitle = (project.title || '').trim().toLowerCase();
  const known = KNOWN_PROJECTS_BY_ID[project.id] || KNOWN_PROJECTS_BY_TITLE[normalizedTitle];
  const cache = getCache();

  const resolveField = (original: string | undefined, knownVal: string | undefined, lookupMap?: Record<string, string>) => {
    if (!original) return original;
    if (knownVal) return knownVal;
    if (lookupMap) {
      const mapped = lookupMap[original.trim().toLowerCase()];
      if (mapped) return mapped;
    }
    return cache[original.trim()] || original;
  };

  return {
    ...project,
    title: resolveField(project.title, known?.title) || project.title,
    description: resolveField(project.description, known?.description) || project.description,
    full_description: resolveField(project.full_description, known?.full_description),
    category: resolveField(project.category, known?.category, CATEGORY_MAP),
    location: resolveField(project.location, known?.location, LOCATION_MAP),
    coordinator: resolveField(project.coordinator, known?.coordinator),
    beneficiaries_target: resolveField(project.beneficiaries_target, known?.beneficiaries_target),
    beneficiaries_reached: resolveField(project.beneficiaries_reached, known?.beneficiaries_reached),
  };
}

function collectUntranslatedFields(project: YAHHopeProject): string[] {
  const normalizedTitle = (project.title || '').trim().toLowerCase();
  const known = KNOWN_PROJECTS_BY_ID[project.id] || KNOWN_PROJECTS_BY_TITLE[normalizedTitle];
  const cache = getCache();
  const missing: string[] = [];

  const check = (val: string | undefined, knownVal: string | undefined, lookupMap?: Record<string, string>) => {
    if (!val || !val.trim()) return;
    if (knownVal) return;
    if (lookupMap && lookupMap[val.trim().toLowerCase()]) return;
    if (cache[val.trim()]) return;
    missing.push(val);
  };

  check(project.title, known?.title);
  check(project.description, known?.description);
  check(project.full_description, known?.full_description);
  check(project.category, known?.category, CATEGORY_MAP);
  check(project.location, known?.location, LOCATION_MAP);
  check(project.beneficiaries_target, known?.beneficiaries_target);
  check(project.beneficiaries_reached, known?.beneficiaries_reached);

  return missing;
}

export function useTranslatedProjects(projects: YAHHopeProject[], isEn: boolean): YAHHopeProject[] {
  const [revision, setRevision] = useState(0);

  useEffect(() => {
    if (!isEn || projects.length === 0) return;

    const toTranslate = new Set<string>();
    for (const p of projects) {
      for (const field of collectUntranslatedFields(p)) {
        toTranslate.add(field);
      }
    }

    if (toTranslate.size === 0) return;

    let cancelled = false;
    Promise.all(Array.from(toTranslate).map((text) => translateHtmlOrPlainText(text))).then(() => {
      if (!cancelled) {
        setRevision((r) => r + 1);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [projects, isEn]);

  return useMemo(
    () => projects.map((p) => translateProjectSync(p, isEn)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [projects, isEn, revision]
  );
}

export function useTranslatedProject(project: YAHHopeProject | null, isEn: boolean): YAHHopeProject | null {
  const list = useMemo(() => (project ? [project] : []), [project]);
  const translated = useTranslatedProjects(list, isEn);
  return project ? translated[0] : null;
}
