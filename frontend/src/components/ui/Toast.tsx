import { useUIStore } from '@/store/ui.store.ts';
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from 'lucide-react';

export function ToastContainer() {
  const { toasts, removeToast } = useUIStore();

  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-3 pointer-events-none">
      {toasts.map((toast) => (
        <div 
          key={toast.id}
          className="pointer-events-auto flex items-center gap-3 bg-white dark:bg-slate-800 border-l-4 p-4 rounded-xl shadow-2xl min-w-[300px] animate-in slide-in-from-right-10 fade-in duration-200"
          style={{ 
            borderLeftColor: toast.type === 'success' ? 'var(--color-success)' : 
                             toast.type === 'error' ? 'var(--color-error)' : 
                             toast.type === 'warning' ? 'var(--color-warning)' : 
                             'var(--color-info)'
          }}
        >
          <div className="shrink-0">
            {toast.type === 'success' && <CheckCircle2 className="h-5 w-5 text-emerald-500" />}
            {toast.type === 'error' && <XCircle className="h-5 w-5 text-red-500" />}
            {toast.type === 'warning' && <AlertTriangle className="h-5 w-5 text-amber-500" />}
            {toast.type === 'info' && <Info className="h-5 w-5 text-indigo-500" />}
          </div>
          <p className="flex-1 text-sm font-bold text-slate-900 dark:text-slate-100">{toast.message}</p>
          <button 
            onClick={() => removeToast(toast.id)}
            className="shrink-0 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
  );
}
