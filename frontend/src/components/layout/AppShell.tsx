
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


function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface AppShellProps {
  children: React.ReactNode;
}

export const AppShell = ({ children }: AppShellProps) => {
  const { sidebarOpen, taskFormOpen, taskFormPrefill, openTaskForm, closeTaskForm, commModalOpen, commModalPrefill, openCommModal, closeCommModal } = useUIStore();
  const [bannerDismissed, setBannerDismissed] = useState(false);

  const { data: overdueData } = useQuery({
    queryKey: ['tasks', 'overdue'],
    queryFn: () => tasksApi.getOverdueTasks(),
    staleTime: 60000,
  });

  const overdueCount = overdueData?.data?.length || 0;
  const showBanner = overdueCount > 0 && !bannerDismissed;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'l') {
        e.preventDefault();
        openCommModal();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [openCommModal]);

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <Sidebar />
      
      <div 
        className={cn(
          "flex-1 flex flex-col transition-all duration-300 ease-in-out relative",
          sidebarOpen ? "pl-64" : "pl-20"
        )}
      >
        <Topbar />
        
        {showBanner && (
          <div className="bg-red-500 text-white px-4 py-2 flex items-center justify-between text-sm shadow-sm z-40 relative">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              <span className="font-medium">You have {overdueCount} overdue task{overdueCount !== 1 ? 's' : ''}.</span>
            </div>
            <button onClick={() => setBannerDismissed(true)} className="p-1 hover:bg-red-600 rounded">
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        <main className="flex-1 p-8 overflow-y-auto">
          <div className="max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
            {children}
          </div>
        </main>

        {/* Global Floating Action Button */}
        <button
          onClick={() => openTaskForm()}
          className="fixed bottom-8 right-8 h-14 w-14 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full shadow-xl flex items-center justify-center transition-transform hover:scale-105 z-40 group"
        >
          <Plus className="h-6 w-6" />
          <div className="absolute right-full mr-4 bg-slate-900 text-white text-xs font-bold px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
            New Task
          </div>
        </button>
      </div>

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
    </div>
  );
};

