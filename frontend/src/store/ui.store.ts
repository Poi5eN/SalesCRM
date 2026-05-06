import { create } from 'zustand';

interface UIState {
  sidebarOpen: boolean;
  activeModule: string;
  toggleSidebar: () => void;
  setActiveModule: (module: string) => void;
}

export const useUIStore = create<UIState>((set) => ({
  sidebarOpen: true,
  activeModule: 'dashboard',
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setActiveModule: (module) => set({ activeModule: module }),
}));
