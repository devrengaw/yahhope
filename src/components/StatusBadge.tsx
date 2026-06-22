import { cn } from '../lib/utils';

export function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    'Adequado': 'bg-emerald-100 text-emerald-700 border-emerald-200',
    'DAM': 'bg-amber-100 text-amber-700 border-amber-200',
    'DAG': 'bg-red-100 text-red-700 border-red-200',
    'Risco': 'bg-orange-100 text-orange-700 border-orange-200',
    'Alta': 'bg-slate-100 text-slate-500 border-slate-200 opacity-60',
  };

  return (
    <span className={cn(
      "px-3 py-1 rounded-xl text-[10px] font-bold uppercase tracking-widest border shadow-sm transition-all hover:scale-105",
      styles[status] || 'bg-slate-100 text-slate-700 border-slate-200'
    )}>
      {status}
    </span>
  );
}
