import React from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { cn } from '../../lib/utils';

interface LanguageSwitcherProps {
  theme?: 'light' | 'dark';
  className?: string;
  showLabels?: boolean;
}

function BrazilFlagIcon({ className = 'w-5 h-3.5' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 28 20"
      className={cn('rounded-[2px] shadow-2xs shrink-0', className)}
      aria-hidden="true"
    >
      <rect width="28" height="20" fill="#009B3A" />
      <polygon points="14,2 25.5,10 14,18 2.5,10" fill="#FEDF00" />
      <circle cx="14" cy="10" r="4.2" fill="#002776" />
      <path
        d="M10.1 9.3c2.4-.8 5.2-.5 7.7.8"
        fill="none"
        stroke="#FFFFFF"
        strokeWidth="0.9"
        strokeLinecap="round"
      />
    </svg>
  );
}

function USAFlagIcon({ className = 'w-5 h-3.5' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 28 20"
      className={cn('rounded-[2px] shadow-2xs shrink-0', className)}
      aria-hidden="true"
    >
      <rect width="28" height="20" fill="#B22234" />
      <rect y="1.54" width="28" height="1.54" fill="#FFFFFF" />
      <rect y="4.62" width="28" height="1.54" fill="#FFFFFF" />
      <rect y="7.69" width="28" height="1.54" fill="#FFFFFF" />
      <rect y="10.77" width="28" height="1.54" fill="#FFFFFF" />
      <rect y="13.85" width="28" height="1.54" fill="#FFFFFF" />
      <rect y="16.92" width="28" height="1.54" fill="#FFFFFF" />
      <rect width="12.5" height="10.77" fill="#3C3B6E" />
      <circle cx="2.5" cy="2.3" r="0.65" fill="#FFFFFF" />
      <circle cx="5.2" cy="2.3" r="0.65" fill="#FFFFFF" />
      <circle cx="7.9" cy="2.3" r="0.65" fill="#FFFFFF" />
      <circle cx="10.4" cy="2.3" r="0.65" fill="#FFFFFF" />
      <circle cx="3.8" cy="4.4" r="0.65" fill="#FFFFFF" />
      <circle cx="6.5" cy="4.4" r="0.65" fill="#FFFFFF" />
      <circle cx="9.2" cy="4.4" r="0.65" fill="#FFFFFF" />
      <circle cx="2.5" cy="6.5" r="0.65" fill="#FFFFFF" />
      <circle cx="5.2" cy="6.5" r="0.65" fill="#FFFFFF" />
      <circle cx="7.9" cy="6.5" r="0.65" fill="#FFFFFF" />
      <circle cx="10.4" cy="6.5" r="0.65" fill="#FFFFFF" />
      <circle cx="3.8" cy="8.6" r="0.65" fill="#FFFFFF" />
      <circle cx="6.5" cy="8.6" r="0.65" fill="#FFFFFF" />
      <circle cx="9.2" cy="8.6" r="0.65" fill="#FFFFFF" />
    </svg>
  );
}

export function LanguageSwitcher({
  theme = 'light',
  className = '',
  showLabels = false,
}: LanguageSwitcherProps) {
  const { language, setLanguage } = useLanguage();
  const isDark = theme === 'dark';

  return (
    <div
      className={cn(
        'inline-flex items-center gap-1 rounded-full p-0.5 border transition-colors',
        isDark
          ? 'bg-slate-800/80 border-slate-700/80'
          : 'bg-slate-100/90 border-slate-200/80',
        className
      )}
      role="group"
      aria-label={language === 'en' ? 'Select language' : 'Selecionar idioma'}
    >
      <button
        type="button"
        onClick={() => setLanguage('pt')}
        aria-label="Português (Brasil)"
        aria-pressed={language === 'pt'}
        title="Português (Brasil)"
        className={cn(
          'inline-flex items-center gap-1.5 px-1.5 py-1 rounded-full transition-all cursor-pointer',
          language === 'pt'
            ? isDark
              ? 'bg-slate-700 ring-1 ring-[#F49853]/70 opacity-100 shadow-xs'
              : 'bg-white ring-1 ring-[#F49853]/60 opacity-100 shadow-xs'
            : 'opacity-55 hover:opacity-100'
        )}
      >
        <BrazilFlagIcon />
        {showLabels && (
          <span
            className={cn(
              'text-[11px] font-gotham-bold pr-0.5',
              isDark ? 'text-slate-200' : 'text-slate-700'
            )}
          >
            PT
          </span>
        )}
      </button>

      <button
        type="button"
        onClick={() => setLanguage('en')}
        aria-label="English (US)"
        aria-pressed={language === 'en'}
        title="English (US)"
        className={cn(
          'inline-flex items-center gap-1.5 px-1.5 py-1 rounded-full transition-all cursor-pointer',
          language === 'en'
            ? isDark
              ? 'bg-slate-700 ring-1 ring-[#F49853]/70 opacity-100 shadow-xs'
              : 'bg-white ring-1 ring-[#F49853]/60 opacity-100 shadow-xs'
            : 'opacity-55 hover:opacity-100'
        )}
      >
        <USAFlagIcon />
        {showLabels && (
          <span
            className={cn(
              'text-[11px] font-gotham-bold pr-0.5',
              isDark ? 'text-slate-200' : 'text-slate-700'
            )}
          >
            EN
          </span>
        )}
      </button>
    </div>
  );
}
