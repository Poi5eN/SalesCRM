import { Badge } from './Badge.tsx';
import { formatCurrency } from '@/utils/format.ts';
import { MoreVertical, MessageSquare, Clock } from 'lucide-react';

interface KanbanCardProps {
  title: string;
  subtitle?: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  value?: number;
  currency?: string;
  score?: number;
  tags?: string[];
  lastActivity?: string;
  onClick?: () => void;
}

export function KanbanCard({ 
  title, 
  subtitle, 
  priority = 'medium', 
  value, 
  currency = 'USD', 
  score = 0,
  tags = [],
  lastActivity,
  onClick 
}: KanbanCardProps) {
  
  const priorityColors = {
    low: "border-l-slate-400",
    medium: "border-l-amber-500",
    high: "border-l-orange-500",
    urgent: "border-l-red-500",
  };

  return (
    <div 
      onClick={onClick}
      className={`bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 border-l-4 ${priorityColors[priority]} shadow-sm hover:shadow-md hover:border-slate-300 dark:hover:border-slate-600 transition-all cursor-pointer group animate-in fade-in slide-in-from-bottom-2 duration-200`}
    >
      <div className="flex justify-between items-start mb-2">
        <h4 className="text-sm font-black text-slate-900 dark:text-white leading-tight group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors truncate pr-2">
          {title}
        </h4>
        <button className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 opacity-0 group-hover:opacity-100 transition-opacity">
          <MoreVertical className="h-4 w-4" />
        </button>
      </div>

      {subtitle && (
        <p className="text-xs text-slate-500 dark:text-slate-400 font-bold mb-3 truncate">{subtitle}</p>
      )}

      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-4">
          {tags.slice(0, 2).map(tag => (
            <Badge key={tag} variant="outline" className="px-1.5 py-0 bg-slate-50 dark:bg-slate-900 border-none lowercase text-[9px]">
              #{tag}
            </Badge>
          ))}
          {tags.length > 2 && <span className="text-[9px] text-slate-400 font-black">+{tags.length - 2}</span>}
        </div>
      )}

      <div className="flex items-center justify-between mt-auto pt-3 border-t border-slate-100 dark:border-slate-700/50">
        <div className="flex items-center gap-3">
          {value !== undefined && (
            <span className="text-xs font-black text-slate-900 dark:text-white tracking-tight">
              {formatCurrency(value, currency)}
            </span>
          )}
          {lastActivity && (
            <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400">
              <Clock className="h-3 w-3" />
              <span>{lastActivity}</span>
            </div>
          )}
        </div>
        
        {/* User avatar or score bar placeholder */}
        <div className="h-6 w-6 rounded-full bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 flex items-center justify-center text-[10px] font-black text-slate-500">
          {title.charAt(0)}
        </div>
      </div>

      {/* Score bar at the very bottom */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-slate-100 dark:bg-slate-900 overflow-hidden rounded-b-xl">
        <div 
          className={`h-full transition-all duration-500 ${
            score > 80 ? 'bg-emerald-500' : score > 50 ? 'bg-amber-500' : 'bg-slate-400'
          }`}
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  );
}
