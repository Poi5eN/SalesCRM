import { type LucideIcon, ArrowUpRight, ArrowDownRight } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  change?: number;
  icon: LucideIcon;
  iconColor?: string;
  isLoading?: boolean;
  description?: string;
}

export function StatCard({ title, value, change, icon: Icon, iconColor = 'text-indigo-600', isLoading, description }: StatCardProps) {
  const isPositive = change && change > 0;

  return (
    <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-all group hover:-translate-y-1 duration-200">
      <div className="flex items-center justify-between mb-4">
        <div className={`h-12 w-12 rounded-2xl bg-slate-50 dark:bg-slate-900 flex items-center justify-center ${iconColor} shadow-inner group-hover:scale-110 transition-transform duration-200`}>
          <Icon className="h-6 w-6" />
        </div>
        {change !== undefined && (
          <div className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${isPositive
              ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400'
              : 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400'
            }`}>
            {isPositive ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
            {Math.abs(change)}%
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-2">
          <div className="h-8 w-24 bg-slate-100 dark:bg-slate-700 animate-pulse rounded-lg" />
          <div className="h-4 w-32 bg-slate-50 dark:bg-slate-800 animate-pulse rounded-lg" />
        </div>
      ) : (
        <>
          <p className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">{value}</p>
          <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mt-1">{title}</p>
          {description && (
            <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-2 font-medium line-clamp-1 italic">
              {description}
            </p>
          )}
        </>
      )}
    </div>
  );
}
