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
  taskFormOpen: boolean;
  taskFormPrefill: any;
  openTaskForm: (prefill?: any) => void;
  closeTaskForm: () => void;
  commModalOpen: boolean;
  commModalPrefill: any;
  openCommModal: (prefill?: any) => void;
  closeCommModal: () => void;
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
  taskFormOpen: false,
  taskFormPrefill: null,
  openTaskForm: (prefill = null) => set({ taskFormOpen: true, taskFormPrefill: prefill }),
  closeTaskForm: () => set({ taskFormOpen: false, taskFormPrefill: null }),
  commModalOpen: false,
  commModalPrefill: null,
  openCommModal: (prefill = null) => set({ commModalOpen: true, commModalPrefill: prefill }),
  closeCommModal: () => set({ commModalOpen: false, commModalPrefill: null }),
}));
