import React from 'react';
import { useUIStore } from '@/store/ui.store.ts';
import { Button } from '@/components/ui/Button.tsx';
import { AlertTriangle, X } from 'lucide-react';

export const ConfirmModal = () => {
  const { confirmOptions, closeConfirm } = useUIStore();

  if (!confirmOptions) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-[var(--card-bg)] border border-[var(--border)] rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-6 border-b border-[var(--border)]">
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-lg ${confirmOptions.variant === 'danger' ? 'bg-red-500/10 text-red-600' : 'bg-indigo-500/10 text-indigo-600'}`}>
              <AlertTriangle className="h-5 w-5" />
            </div>
            <h3 className="text-lg font-bold text-[var(--text-primary)]">{confirmOptions.title}</h3>
          </div>
          <button onClick={() => closeConfirm(false)} className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <div className="p-6">
          <p className="text-[var(--text-secondary)] leading-relaxed text-sm">{confirmOptions.message}</p>
        </div>

        <div className="flex items-center justify-end space-x-3 p-6 bg-[var(--content-bg)] border-t border-[var(--border)]">
          <Button variant="outline" onClick={() => closeConfirm(false)}>
            {confirmOptions.cancelText || 'Cancel'}
          </Button>
          <Button 
            variant={confirmOptions.variant === 'danger' ? 'danger' : 'primary'}
            onClick={() => closeConfirm(true)}
          >
            {confirmOptions.confirmText || 'Confirm'}
          </Button>
        </div>
      </div>
    </div>
  );
};
