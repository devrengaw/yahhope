const CACHE_KEY = 'yah_hope_en_auto_cache_v1';
let memoryCache: Record<string, string> | null = null;
const pendingTranslations = new Map<string, Promise<string>>();

export function getTranslationCache(): Record<string, string> {
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
  const cache = getTranslationCache();
  cache[source] = translated;
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  } catch {
    // ignore storage quota errors
  }
}

export async function fetchGoogleTranslation(text: string): Promise<string> {
  const trimmed = text.trim();
  if (!trimmed) return text;

  const cache = getTranslationCache();
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
        const translated = data[0]
          .map((part: unknown[]) => (Array.isArray(part) ? part[0] : ''))
          .join('');
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

export async function translateHtmlOrPlainText(input: string): Promise<string> {
  const trimmed = input.trim();
  if (!trimmed) return input;

  const cache = getTranslationCache();
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
