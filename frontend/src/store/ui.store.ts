import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface ConfirmOptions {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'primary';
  resolve: (value: boolean) => void;
}

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  type: ToastType;
  message: string;
}

interface UIState {
  // Theme & Layout
  theme: 'light' | 'dark';
  setTheme: (theme: 'light' | 'dark') => void;
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
  mobileSidebarOpen: boolean;
  toggleMobileSidebar: () => void;
  setMobileSidebarOpen: (open: boolean) => void;
  activeModule: string;
  setActiveModule: (module: string) => void;

  // Confirm Dialog
  confirmOptions: ConfirmOptions | null;
  confirm: (options: Omit<ConfirmOptions, 'resolve'>) => Promise<boolean>;
  closeConfirm: (value: boolean) => void;

  // Modals
  taskFormOpen: boolean;
  taskFormPrefill: any;
  openTaskForm: (prefill?: any) => void;
  closeTaskForm: () => void;
  commModalOpen: boolean;
  commModalPrefill: any;
  openCommModal: (prefill?: any) => void;
  closeCommModal: () => void;

  // Toasts
  toasts: Toast[];
  addToast: (type: ToastType, message: string) => void;
  removeToast: (id: string) => void;

  // Command Palette
  commandPaletteOpen: boolean;
  setCommandPaletteOpen: (open: boolean) => void;
  recentItems: { id: string; type: 'lead' | 'deal'; title: string }[];
  addRecentItem: (item: { id: string; type: 'lead' | 'deal'; title: string }) => void;

  // Badge Counts
  badgeCounts: { leads: number; deals: number; tasks: number };
  setBadgeCounts: (counts: { leads?: number; deals?: number; tasks?: number }) => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set, get) => ({
      theme: 'light',
      setTheme: (theme) => {
        set({ theme });
        document.documentElement.setAttribute('data-theme', theme);
      },
      sidebarCollapsed: false,
      toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
      mobileSidebarOpen: false,
      toggleMobileSidebar: () => set((state) => ({ mobileSidebarOpen: !state.mobileSidebarOpen })),
      setMobileSidebarOpen: (open) => set({ mobileSidebarOpen: open }),
      activeModule: 'dashboard',
      setActiveModule: (module) => set({ activeModule: module }),
      
      confirmOptions: null,
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

      toasts: [],
      addToast: (type, message) => {
        const id = Math.random().toString(36).substring(2, 9);
        set((state) => ({ toasts: [...state.toasts, { id, type, message }] }));
        setTimeout(() => get().removeToast(id), 4000);
      },
      removeToast: (id) => set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),

      commandPaletteOpen: false,
      setCommandPaletteOpen: (open) => set({ commandPaletteOpen: open }),
      recentItems: [],
      addRecentItem: (item) => {
        set((state) => {
          const filtered = state.recentItems.filter((i) => i.id !== item.id);
          return { recentItems: [item, ...filtered].slice(0, 5) };
        });
      },

      badgeCounts: { leads: 0, deals: 0, tasks: 0 },
      setBadgeCounts: (counts) => set((state) => ({ 
        badgeCounts: { ...state.badgeCounts, ...counts } 
      })),
    }),
    {
      name: 'ui-storage',
      partialize: (state) => ({ 
        theme: state.theme, 
        sidebarCollapsed: state.sidebarCollapsed,
        recentItems: state.recentItems 
      }),
    }
  )
);
