import React from 'react';
import { useUIStore } from '@/store/ui.store.ts';
import { Button } from '@/components/ui/Button.tsx';
import { AlertTriangle, X } from 'lucide-react';

export const ConfirmModal = () => {
  const { confirmOptions, closeConfirm } = useUIStore();

  if (!confirmOptions) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-lg ${confirmOptions.variant === 'danger' ? 'bg-red-50 text-red-600' : 'bg-indigo-50 text-indigo-600'}`}>
              <AlertTriangle className="h-5 w-5" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">{confirmOptions.title}</h3>
          </div>
          <button onClick={() => closeConfirm(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <div className="p-6">
          <p className="text-slate-600 leading-relaxed">{confirmOptions.message}</p>
        </div>

        <div className="flex items-center justify-end space-x-3 p-6 bg-slate-50 border-t border-slate-100">
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
