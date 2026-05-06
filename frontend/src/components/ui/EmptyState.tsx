import { type LucideIcon, Search, Inbox, CheckCircle2, UserPlus, Briefcase } from 'lucide-react';
import { Button } from './Button.tsx';

interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: LucideIcon;
  variant?: 'general' | 'search' | 'tasks' | 'leads' | 'deals';
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function EmptyState({ title, description, icon: CustomIcon, variant = 'general', action }: EmptyStateProps) {
  const icons = {
    general: Inbox,
    search: Search,
    tasks: CheckCircle2,
    leads: UserPlus,
    deals: Briefcase,
  };

  const Icon = CustomIcon || icons[variant];

  return (
    <div className="flex flex-col items-center justify-center p-12 text-center bg-white dark:bg-slate-800/50 rounded-3xl border border-dashed border-slate-200 dark:border-slate-700 animate-in fade-in zoom-in-95 duration-500">
      <div className={`h-20 w-20 rounded-3xl mb-6 flex items-center justify-center shadow-inner ${variant === 'tasks' ? 'bg-emerald-50 text-emerald-500' : 'bg-slate-50 dark:bg-slate-900 text-slate-300 dark:text-slate-700'
        }`}>
        <Icon className="h-10 w-10" />
      </div>

      <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight mb-2">{title}</h3>
      {description && (
        <p className="text-sm text-slate-500 dark:text-slate-400 font-medium max-w-sm mx-auto leading-relaxed mb-8">
          {description}
        </p>
      )}

      {action && (
        <Button onClick={action.onClick} className="px-8 shadow-lg">
          {action.label}
        </Button>
      )}
    </div>
  );
}
