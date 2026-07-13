import { type LucideIcon } from 'lucide-react';
import { Button } from './Button.tsx';

interface EmptyStateProps {
  title: string;
  description: string;
  actionText?: string;
  onAction?: () => void;
  icon?: LucideIcon;
  variant?: 'general' | 'search' | 'tasks' | 'leads' | 'deals';
}

export function EmptyState({ title, description, actionText, onAction, icon: Icon, variant }: EmptyStateProps) {
  return (
    <div className="text-center py-20 bg-[var(--card-bg)] border border-[var(--border)] rounded-[32px] shadow-sm animate-in fade-in duration-300 max-w-2xl mx-auto flex flex-col items-center justify-center p-8">
      <div className="relative mb-6 group">
        {/* Glow effect */}
        <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-indigo-500/10 to-purple-500/10 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        
        {/* Customized Premium Line-Art SVG */}
        <div className="relative h-28 w-28 text-[var(--text-muted)] group-hover:text-[var(--text-secondary)] transition-colors duration-300">
          <svg className="h-full w-full" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* Outer dotted orbit */}
            <circle cx="60" cy="60" r="46" stroke="currentColor" strokeWidth="1" strokeDasharray="3 4" opacity="0.3" />
            <circle cx="60" cy="60" r="38" stroke="currentColor" strokeWidth="1" strokeDasharray="5 3" opacity="0.5" />
            
            {/* Folder / Drawer line art */}
            <path d="M35 42 C35 39.7909 36.7909 38 39 38 H52.5 C53.4839 38 54.4055 38.4344 55.0298 39.1835 L58.9702 43.9165 C59.5945 44.6656 60.5161 45 61.5 45 H81 C83.2091 45 85 46.7909 85 49 V78 C85 80.2091 83.2091 82 81 82 H39 C36.7909 82 35 80.2091 35 78 V42 Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" fill="var(--card-bg)" />
            
            {/* Floating particles / sparks */}
            <path d="M90 35 L92 38 L95 38 L93 40 L94 43 L91 41 L88 43 L89 40 L87 38 L90 38 Z" fill="currentColor" opacity="0.3" className="animate-pulse" />
            <circle cx="28" cy="55" r="2" fill="currentColor" opacity="0.4" />
            <circle cx="88" cy="72" r="3" fill="currentColor" opacity="0.2" />
            
            {/* Document peaking from folder */}
            <path d="M48 30 H64 L72 38 V45 H48 V30 Z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" fill="var(--content-bg)" />
            <line x1="53" y1="35" x2="61" y2="35" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
            <line x1="53" y1="40" x2="67" y2="40" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />

            {/* Inner loop lines representing workflow */}
            <path d="M45 55 H75 M45 62 H65 M45 69 H70" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.8" />
          </svg>
        </div>
      </div>

      <h3 className="text-base font-black text-[var(--text-primary)] tracking-tight">{title}</h3>
      <p className="mt-2 text-xs text-[var(--text-secondary)] font-medium max-w-sm leading-relaxed">{description}</p>
      
      {actionText && onAction && (
        <div className="mt-6">
          <Button size="sm" onClick={onAction} className="shadow-md hover:shadow-lg transition-all">
            {Icon && <Icon className="mr-1.5 h-4 w-4 stroke-[3px]" />}
            {actionText}
          </Button>
        </div>
      )}
    </div>
  );
}
