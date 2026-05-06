import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info' | 'priority' | 'outline';
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  className?: string;
}

export function Badge({ children, variant = 'default', priority, className }: BadgeProps) {
  const base = "inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest leading-none border";
  
  const variants = {
    default: "bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700",
    success: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800",
    warning: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800",
    error: "bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800",
    info: "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-900/20 dark:text-indigo-400 dark:border-indigo-800",
    outline: "bg-transparent text-slate-600 border-slate-200 dark:text-slate-400 dark:border-slate-700",
    priority: "" // Handled below
  };

  if (variant === 'priority' && priority) {
    const priorityColors = {
      low: "bg-slate-50 text-slate-600 border-slate-200",
      medium: "bg-amber-50 text-amber-700 border-amber-200",
      high: "bg-orange-50 text-orange-700 border-orange-200",
      urgent: "bg-red-50 text-red-700 border-red-200",
    };
    
    const dotColors = {
      low: "bg-slate-400",
      medium: "bg-amber-500",
      high: "bg-orange-500",
      urgent: "bg-red-500",
    };

    return (
      <span className={cn(base, priorityColors[priority], "gap-1.5", className)}>
        <span className={cn("h-1.5 w-1.5 rounded-full", dotColors[priority])} />
        {children || priority}
      </span>
    );
  }

  return (
    <span className={cn(base, variants[variant], className)}>
      {children}
    </span>
  );
}
