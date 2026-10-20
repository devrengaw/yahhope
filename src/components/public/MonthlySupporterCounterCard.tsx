import React, { useState, useEffect } from 'react';
import { Users, Heart, Sparkles, CheckCircle2, TrendingUp, ShieldCheck } from 'lucide-react';
import { getUniqueMonthlySupportersCount } from '../../services/monthlySupportersService';
import { cn } from '../../lib/utils';

interface MonthlySupporterCounterCardProps {
  theme?: 'dark' | 'light';
  className?: string;
  showDetails?: boolean;
}

export function MonthlySupporterCounterCard({
  theme = 'dark',
  className = '',
  showDetails = true
}: MonthlySupporterCounterCardProps) {
  const [count, setCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    getUniqueMonthlySupportersCount().then(total => {
      if (mounted) {
        setCount(total);
        setLoading(false);
      }
    });
    return () => {
      mounted = false;
    };
  }, []);

  const isDark = theme === 'dark';

  return (
    <div
      className={cn(
        "rounded-3xl p-6 sm:p-7 transition-all relative overflow-hidden",
        isDark
          ? "bg-slate-950/70 border border-white/15 backdrop-blur-md text-white shadow-2xl shadow-black/40"
          : "bg-white border border-orange-100/80 text-slate-900 shadow-xl shadow-amber-900/5",
        className
      )}
    >
      {/* Detalhe de luz suave no topo */}
      <div 
        className={cn(
          "absolute -top-12 -right-12 w-36 h-36 rounded-full blur-2xl pointer-events-none",
          isDark ? "bg-[#F49853]/15" : "bg-orange-200/40"
        )}
      />

      {/* Badge Superior */}
      <div className="flex items-center gap-2 mb-4">
        <span 
          className={cn(
            "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold tracking-wide uppercase",
            isDark 
              ? "bg-[#F49853]/20 text-[#F49853] border border-[#F49853]/30" 
              : "bg-orange-50 text-[#F49853] border border-orange-200/80"
          )}
        >
          <span className="w-2 h-2 rounded-full bg-[#F49853] animate-pulse" />
          <span>Rede de Mantenedores</span>
        </span>
      </div>

      {/* Número e Título */}
      <div className="space-y-1 mb-4">
        <div className="flex items-baseline gap-2.5">
          <span 
            className={cn(
              "text-5xl sm:text-6xl font-black tracking-tight",
              isDark ? "text-white" : "text-slate-900"
            )}
          >
            {loading ? (
              <span className="inline-block w-20 h-12 bg-white/10 rounded-xl animate-pulse" />
            ) : (
              (count ?? 0).toLocaleString('pt-BR')
            )}
          </span>
          <span className="text-base sm:text-lg font-bold text-[#F49853]">
            pessoas
          </span>
        </div>

        <h3 className={cn("text-base sm:text-lg font-bold leading-snug", isDark ? "text-slate-200" : "text-slate-800")}>
          Já sustentam a esperança todos os meses
        </h3>

        <p className={cn("text-xs sm:text-sm leading-relaxed", isDark ? "text-slate-400" : "text-slate-500")}>
          Padrinhos e mantenedores unidos em um compromisso contínuo com a dignidade e o futuro de vidas preciosas.
        </p>
      </div>

      {/* Detalhes de Transparência e Critérios */}
      {showDetails && (
        <div className={cn("pt-4 border-t space-y-2.5 text-xs font-medium", isDark ? "border-white/10 text-slate-300" : "border-slate-100 text-slate-600")}>
          <div className="flex items-center gap-2">
            <CheckCircle2 size={14} className="text-[#92BF78] shrink-0" />
            <span>Contagem individual (cada pessoa conta apenas uma vez)</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 size={14} className="text-[#92BF78] shrink-0" />
            <span>Exclusivo para apoiadores com fidelidade mensal</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 size={14} className="text-[#92BF78] shrink-0" />
            <span>Sem distinção: mantenedores do projeto e padrinhos somam juntos</span>
          </div>
        </div>
      )}
    </div>
  );
}
