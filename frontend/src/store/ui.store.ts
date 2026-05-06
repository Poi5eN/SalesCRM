import { create } from 'zustand';

interface ConfirmOptions {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'primary';
  resolve: (value: boolean) => void;
}

interface UIState {
  sidebarOpen: boolean;
  activeModule: string;
  confirmOptions: ConfirmOptions | null;
  toggleSidebar: () => void;
  setActiveModule: (module: string) => void;
  confirm: (options: Omit<ConfirmOptions, 'resolve'>) => Promise<boolean>;
  closeConfirm: (value: boolean) => void;
}

export const useUIStore = create<UIState>((set, get) => ({
  sidebarOpen: true,
  activeModule: 'dashboard',
  confirmOptions: null,
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setActiveModule: (module) => set({ activeModule: module }),
  confirm: (options) => {
    return new Promise((resolve) => {
      set({ confirmOptions: { ...options, resolve } });
    });
  },
  closeConfirm: (value) => {
    const { confirmOptions } = get();
    if (confirmOptions) {
      confirmOptions.resolve(value);
      set({ confirmOptions: null });
    }
  },
}));
