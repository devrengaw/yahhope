import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';

export type SiteLanguage = 'pt' | 'en';

interface LanguageContextValue {
  language: SiteLanguage;
  setLanguage: (lang: SiteLanguage) => void;
  toggleLanguage: () => void;
  tr: (pt: string, en: string) => string;
  isEn: boolean;
}

const STORAGE_KEY_LANG = 'yah_hope_language';
const STORAGE_KEY_GEO = 'yah_hope_analytics_geo_cache';

const PT_COUNTRY_CODES = new Set(['BR', 'PT', 'MZ', 'AO', 'CV', 'GW', 'ST', 'TL']);
const PT_COUNTRY_NAMES = [
  'brasil',
  'brazil',
  'portugal',
  'moçambique',
  'mocambique',
  'mozambique',
  'angola',
  'cabo verde',
  'cape verde',
  'guiné-bissau',
  'guinea-bissau',
  'são tomé',
  'sao tome',
  'timor',
];

const PT_TIMEZONE_PREFIXES = [
  'America/Sao_Paulo',
  'America/Fortaleza',
  'America/Recife',
  'America/Manaus',
  'America/Belem',
  'America/Bahia',
  'America/Cuiaba',
  'America/Porto_Velho',
  'America/Boa_Vista',
  'America/Maceio',
  'America/Araguaina',
  'America/Campo_Grande',
  'America/Noronha',
  'America/Rio_Branco',
  'America/Santarem',
  'Europe/Lisbon',
  'Atlantic/Azores',
  'Atlantic/Madeira',
  'Africa/Maputo',
  'Africa/Luanda',
];

function isPortugueseCountry(countryCode?: string, countryName?: string): boolean {
  if (countryCode && PT_COUNTRY_CODES.has(countryCode.toUpperCase())) {
    return true;
  }
  if (countryName) {
    const normalized = countryName.toLowerCase();
    return PT_COUNTRY_NAMES.some((name) => normalized.includes(name));
  }
  return false;
}

function getFallbackLanguageFromBrowser(): SiteLanguage {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
    if (PT_TIMEZONE_PREFIXES.some((prefix) => tz.includes(prefix))) {
      return 'pt';
    }
    const navLang = (navigator.language || '').toLowerCase();
    if (navLang.startsWith('pt')) {
      return 'pt';
    }
    return 'en';
  } catch {
    return 'pt';
  }
}

function getInitialLanguage(): SiteLanguage {
  if (typeof window === 'undefined') return 'pt';

  try {
    const params = new URLSearchParams(window.location.search);
    const urlLang = params.get('lang');
    if (urlLang === 'en' || urlLang === 'pt') {
      return urlLang;
    }

    const saved = localStorage.getItem(STORAGE_KEY_LANG);
    if (saved === 'pt' || saved === 'en') {
      return saved;
    }

    const cachedGeo = localStorage.getItem(STORAGE_KEY_GEO);
    if (cachedGeo) {
      const geo = JSON.parse(cachedGeo);
      if (geo && (geo.country_code || geo.country)) {
        return isPortugueseCountry(geo.country_code, geo.country) ? 'pt' : 'en';
      }
    }
  } catch {
    // ignore storage errors
  }

  return getFallbackLanguageFromBrowser();
}

const LanguageContext = createContext<LanguageContextValue | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<SiteLanguage>(getInitialLanguage);
  const userManuallySelectedRef = useRef<boolean>(false);

  // Sync <html lang="...">
  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.lang = language === 'en' ? 'en' : 'pt-BR';
    }
  }, [language]);

  // Automatic geolocation detection when user hasn't explicitly chosen a language
  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      const params = new URLSearchParams(window.location.search);
      const urlLang = params.get('lang');
      if (urlLang === 'en' || urlLang === 'pt') {
        localStorage.setItem(STORAGE_KEY_LANG, urlLang);
        userManuallySelectedRef.current = true;
        return;
      }

      const saved = localStorage.getItem(STORAGE_KEY_LANG);
      if (saved === 'pt' || saved === 'en') {
        userManuallySelectedRef.current = true;
        return;
      }
    } catch {
      // ignore
    }

    let cancelled = false;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000);

    fetch('https://ipwho.is/?fields=country,country_code,city,region,success', {
      signal: controller.signal,
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (cancelled || userManuallySelectedRef.current || !data || !data.success) return;

        try {
          const geo = {
            country: data.country || 'Brasil',
            country_code: data.country_code || '',
            city: data.city || '',
            state: data.region || '',
          };
          localStorage.setItem(STORAGE_KEY_GEO, JSON.stringify(geo));
        } catch {
          // ignore
        }

        const detected: SiteLanguage = isPortugueseCountry(data.country_code, data.country) ? 'pt' : 'en';
        setLanguageState(detected);
      })
      .catch(() => {
        // Silent fallback to timezone/navigator.language
      })
      .finally(() => {
        clearTimeout(timeoutId);
      });

    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
      controller.abort();
    };
  }, []);

  const setLanguage = useCallback((lang: SiteLanguage) => {
    userManuallySelectedRef.current = true;
    setLanguageState(lang);
    try {
      localStorage.setItem(STORAGE_KEY_LANG, lang);
    } catch {
      // ignore
    }
  }, []);

  const toggleLanguage = useCallback(() => {
    setLanguage(language === 'pt' ? 'en' : 'pt');
  }, [language, setLanguage]);

  const tr = useCallback(
    (pt: string, en: string) => (language === 'en' ? en : pt),
    [language]
  );

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage,
        toggleLanguage,
        tr,
        isEn: language === 'en',
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage(): LanguageContextValue {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return ctx;
}
