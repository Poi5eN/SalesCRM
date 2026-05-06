import { Sidebar } from './Sidebar.tsx';
import { Topbar } from './Topbar.tsx';
import { useUIStore } from '@/store/ui.store.ts';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { useQuery } from '@tanstack/react-query';
import { Plus, AlertCircle, X } from 'lucide-react';
import { useState, useEffect } from 'react';
import * as tasksApi from '@/api/tasks.api.ts';
import { TaskForm } from '@/pages/tasks/TaskForm.tsx';
import { LogCommunicationModal } from '@/pages/communications/LogCommunicationModal.tsx';
import { ToastContainer } from '@/components/ui/Toast.tsx';
import { CommandPalette } from '@/components/ui/CommandPalette.tsx';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface AppShellProps {
  children: React.ReactNode;
}

export const AppShell = ({ children }: AppShellProps) => {
  const { 
    sidebarCollapsed, 
    taskFormOpen, 
    taskFormPrefill, 
    openTaskForm, 
    closeTaskForm, 
    commModalOpen, 
    commModalPrefill, 
    openCommModal, 
    closeCommModal,
    theme
  } = useUIStore();
  
  const [bannerDismissed, setBannerDismissed] = useState(false);

  // Apply theme to document
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const { data: overdueData } = useQuery({
    queryKey: ['tasks', 'overdue'],
    queryFn: () => tasksApi.getTasks({ status: 'todo', limit: 5 }), // Simplified overdue check for banner
    staleTime: 60000,
  });

  const overdueCount = overdueData?.data?.meta?.total || 0;
  const showBanner = overdueCount > 0 && !bannerDismissed;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd+L for communications
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'l') {
        e.preventDefault();
        openCommModal();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [openCommModal]);

  return (
    <div className="min-h-screen bg-[var(--color-content-bg)] flex transition-colors duration-200">
      <Sidebar />
      
      <div 
        className={cn(
          "flex-1 flex flex-col transition-all duration-200 ease-in-out relative min-w-0",
          sidebarCollapsed ? "pl-0" : "pl-0" // Sidebar is sticky/absolute now in some designs, but here it's flex.
        )}
      >
        <Topbar />
        
        {showBanner && (
          <div className="bg-red-500 text-white px-4 py-2 flex items-center justify-between text-xs font-bold uppercase tracking-widest shadow-lg z-10 relative animate-in slide-in-from-top duration-300">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-4 w-4" />
              <span>{overdueCount} Priority task{overdueCount !== 1 ? 's' : ''} require your immediate attention</span>
            </div>
            <button onClick={() => setBannerDismissed(true)} className="p-1 hover:bg-white/20 rounded transition-colors">
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        <main className="flex-1 p-6 lg:p-10 overflow-y-auto">
          <div className="max-w-[1400px] mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
            {children}
          </div>
        </main>

        {/* Global Floating Action Button */}
        <button
          onClick={() => openTaskForm()}
          className="fixed bottom-8 right-8 h-14 w-14 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full shadow-2xl shadow-indigo-500/40 flex items-center justify-center transition-all hover:scale-110 active:scale-95 z-40 group"
          title="Create New Task (Cmd+T coming soon)"
        >
          <Plus className="h-6 w-6 stroke-[3px]" />
          <div className="absolute right-full mr-4 bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none shadow-xl border border-slate-800">
            Create Task
          </div>
        </button>
      </div>

      {/* Global Overlays */}
      <ToastContainer />
      <CommandPalette />

      {taskFormOpen && (
        <TaskForm 
          prefill={taskFormPrefill}
          onClose={closeTaskForm} 
        />
      )}

      {commModalOpen && (
        <LogCommunicationModal
          prefill={commModalPrefill}
          onClose={closeCommModal}
        />
      )}

      {/* Global Confirm Dialog Placeholder (could be a component) */}
    </div>
  );
};
