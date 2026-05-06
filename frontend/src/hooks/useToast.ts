import { useUIStore, type ToastType } from '@/store/ui.store.ts';

export const useToast = () => {
  const addToast = useUIStore((state) => state.addToast);

  return {
    success: (message: string) => addToast('success', message),
    error: (message: string) => addToast('error', message),
    warning: (message: string) => addToast('warning', message),
    info: (message: string) => addToast('info', message),
  };
};
