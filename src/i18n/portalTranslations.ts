import { useEffect, useMemo, useState } from 'react';
import { ImpactFeedItem } from '../contexts/ImpactContext';
import { getTranslationCache, translateHtmlOrPlainText } from './autoTranslate';

const CHILD_STATUS_MAP: Record<string, string> = {
  'adequado': 'Adequate',
  'alta': 'Discharged',
  'risco': 'At Risk',
  'risco nutricional': 'Nutritional Risk',
  'em tratamento': 'In Treatment',
  'desnutrição aguda moderada': 'Moderate Acute Malnutrition',
  'desnutrição aguda moderada (dam)': 'Moderate Acute Malnutrition (MAM)',
  'desnutrição aguda grave': 'Severe Acute Malnutrition',
  'desnutrição aguda grave (dag)': 'Severe Acute Malnutrition (SAM)',
  'desnutrição aguda ligeira': 'Mild Acute Malnutrition',
  'dam': 'MAM',
  'dag': 'SAM',
};

export function translateChildStatus(status: string | undefined, isEn: boolean): string {
  if (!status || !isEn) return status || '';
  const mapped = CHILD_STATUS_MAP[status.trim().toLowerCase()];
  if (mapped) return mapped;
  return getTranslationCache()[status.trim()] || status;
}

export function useTranslatedStrings(texts: Array<string | undefined | null>, isEn: boolean): (text?: string | null) => string {
  const [revision, setRevision] = useState(0);

  const uniqueTexts = useMemo(() => {
    const set = new Set<string>();
    for (const t of texts) {
      if (t && t.trim()) set.add(t.trim());
    }
    return Array.from(set);
  }, [texts]);

  useEffect(() => {
    if (!isEn || uniqueTexts.length === 0) return;
    const cache = getTranslationCache();
    const missing = uniqueTexts.filter((t) => !cache[t]);
    if (missing.length === 0) return;

    let cancelled = false;
    Promise.all(missing.map((t) => translateHtmlOrPlainText(t))).then(() => {
      if (!cancelled) setRevision((r) => r + 1);
    });
    return () => {
      cancelled = true;
    };
  }, [uniqueTexts, isEn]);

  return useMemo(() => {
    const cache = getTranslationCache();
    return (text?: string | null) => {
      if (!text) return '';
      if (!isEn) return text;
      const trimmed = text.trim();
      return cache[trimmed] || text;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEn, revision]);
}

export function useTranslatedImpactItems(items: ImpactFeedItem[], isEn: boolean): ImpactFeedItem[] {
  const [revision, setRevision] = useState(0);

  useEffect(() => {
    if (!isEn || items.length === 0) return;
    const cache = getTranslationCache();
    const missing = new Set<string>();

    for (const item of items) {
      if (item.title?.trim() && !cache[item.title.trim()]) missing.add(item.title);
      if (item.content?.trim() && !cache[item.content.trim()]) missing.add(item.content);
    }

    if (missing.size === 0) return;

    let cancelled = false;
    Promise.all(Array.from(missing).map((t) => translateHtmlOrPlainText(t))).then(() => {
      if (!cancelled) setRevision((r) => r + 1);
    });
    return () => {
      cancelled = true;
    };
  }, [items, isEn]);

  return useMemo(() => {
    if (!isEn) return items;
    const cache = getTranslationCache();
    return items.map((item) => ({
      ...item,
      title: (item.title && cache[item.title.trim()]) || item.title,
      content: (item.content && cache[item.content.trim()]) || item.content,
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, isEn, revision]);
}
