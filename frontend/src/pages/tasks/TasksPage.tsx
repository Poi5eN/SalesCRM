import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { LayoutGrid, List, CheckCircle2, Circle, Clock, Phone, Mail, Users, CalendarIcon, Briefcase } from 'lucide-react';
import { format, isPast, isToday } from 'date-fns';
import * as tasksApi from '@/api/tasks.api.ts';
import { useAuth } from '@/hooks/useAuth.ts';
import { useUIStore } from '@/store/ui.store.ts';

import { TaskCalendar } from './TaskCalendar.tsx';
import type { Task } from '@/types/api.types.ts';

type ViewMode = 'list' | 'calendar';
type TabId = 'my' | 'all' | 'overdue' | 'upcoming' | 'completed';

export default function TasksPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const qc = useQueryClient();
  const { user } = useAuth();
  const { openTaskForm } = useUIStore();

  const view: ViewMode = (searchParams.get('view') as ViewMode) ?? 'list';
  const activeTab: TabId = (searchParams.get('tab') as TabId) ?? 'my';

  const updateParam = (key: string, value: string) => {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      next.set(key, value);
      return next;
    });
  };

  const getQueryParams = () => {
    switch (activeTab) {
      case 'my': return { assignedToId: user?.id, status: 'pending' };
      case 'all': return { status: 'pending' };
      case 'completed': return { status: 'completed' };
      // Overdue and upcoming are distinct endpoints, handled separately
      default: return {};
    }
  };

  const { data: tasksData, isLoading: tasksLoading } = useQuery({
    queryKey: ['tasks', activeTab],
    queryFn: async () => {
      if (activeTab === 'overdue') return tasksApi.getOverdueTasks();
      if (activeTab === 'upcoming') return tasksApi.getUpcomingTasks();
      return tasksApi.getTasks({ ...getQueryParams(), limit: 100 });
    },
  });

  const { data: overdueData } = useQuery({
    queryKey: ['tasks', 'overdue-count'],
    queryFn: () => tasksApi.getOverdueTasks(),
    staleTime: 60000,
  });

  const completeMutation = useMutation({
    mutationFn: (id: string) => tasksApi.updateTask(id, { status: 'completed' }),
    onMutate: async (id) => {
      // Optimistic update
      await qc.cancelQueries({ queryKey: ['tasks', activeTab] });
      const previous = qc.getQueryData(['tasks', activeTab]);
      qc.setQueryData(['tasks', activeTab], (old: any) => {
        if (!old) return old;
        const tasks = old.data?.data || old.data; // Handle both paginated and non-paginated arrays
        const newData = tasks.map((t: Task) => t.id === id ? { ...t, status: 'completed' } : t);
        if (old.data?.data) return { ...old, data: { ...old.data, data: newData } };
        return { ...old, data: newData };
      });
      return { previous };
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ['tasks'] });
    },
  });

  const tasks: Task[] = tasksData?.data?.data ?? tasksData?.data ?? [];
  const overdueCount = overdueData?.data?.length || 0;

  const TABS = [
    { id: 'my', label: 'My Tasks' },
    { id: 'all', label: 'All Tasks' },
    { id: 'overdue', label: 'Overdue', badge: overdueCount > 0 ? overdueCount : undefined },
    { id: 'upcoming', label: 'Upcoming' },
    { id: 'completed', label: 'Completed' },
  ];

  const TaskIcon = ({ type }: { type: string }) => {
    switch (type) {
      case 'call': return <Phone className="h-4 w-4 text-emerald-500" />;
      case 'email': return <Mail className="h-4 w-4 text-blue-500" />;
      case 'meeting': return <Users className="h-4 w-4 text-indigo-500" />;
      default: return <CheckCircle2 className="h-4 w-4 text-slate-400" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Tasks</h1>
          <p className="text-slate-500 text-sm">Stay on top of your schedule and to-dos.</p>
        </div>
        <div className="flex items-center gap-2 bg-slate-100 rounded-lg p-1">
          <button
            onClick={() => updateParam('view', 'list')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-semibold transition-colors ${view === 'list' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            <List className="h-4 w-4" /> List
          </button>
          <button
            onClick={() => updateParam('view', 'calendar')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-semibold transition-colors ${view === 'calendar' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            <LayoutGrid className="h-4 w-4" /> Calendar
          </button>
        </div>
      </div>

      {view === 'list' ? (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-[700px]">
          <div className="flex border-b border-slate-200 px-2 shrink-0 overflow-x-auto bg-slate-50">
            {TABS.map(t => (
              <button
                key={t.id}
                onClick={() => updateParam('tab', t.id)}
                className={`relative px-4 py-4 text-sm font-semibold transition-colors whitespace-nowrap flex items-center gap-2 ${
                  activeTab === t.id ? 'text-indigo-700' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {t.label}
                {t.badge && (
                  <span className="inline-flex items-center justify-center px-1.5 py-0.5 rounded-full text-[10px] bg-red-500 text-white leading-none">
                    {t.badge}
                  </span>
                )}
                {activeTab === t.id && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 rounded-t-full" />
                )}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto p-2">
            {tasksLoading ? (
              <div className="space-y-2 p-4">
                {[1, 2, 3, 4, 5].map(i => <div key={i} className="h-16 bg-slate-100 animate-pulse rounded-xl" />)}
              </div>
            ) : tasks.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-400">
                <CheckCircle2 className="h-16 w-16 mb-4 opacity-20" />
                <p className="font-semibold text-slate-500">No tasks found</p>
                <p className="text-sm mt-1">You're all caught up!</p>
              </div>
            ) : (
              <div className="space-y-1">
                {tasks.map(task => {
                  const isOverdue = task.dueAt && isPast(new Date(task.dueAt)) && !isToday(new Date(task.dueAt)) && task.status !== 'completed';
                  const isTodayDate = task.dueAt && isToday(new Date(task.dueAt)) && task.status !== 'completed';
                  const isCompleted = task.status === 'completed';

                  return (
                    <div 
                      key={task.id} 
                      className={`group flex items-center justify-between p-3 rounded-xl border border-transparent hover:border-slate-200 hover:bg-slate-50 transition-all ${
                        isCompleted ? 'opacity-50' : ''
                      }`}
                    >
                      <div className="flex items-center gap-4 flex-1 min-w-0">
                        <button 
                          onClick={() => !isCompleted && completeMutation.mutate(task.id)}
                          disabled={isCompleted || completeMutation.isPending}
                          className={`shrink-0 h-6 w-6 rounded-full border-2 flex items-center justify-center transition-all ${
                            isCompleted ? 'bg-indigo-500 border-indigo-500 text-white' : 'border-slate-300 text-transparent hover:border-indigo-400 hover:text-indigo-200'
                          }`}
                        >
                          <CheckCircle2 className="h-4 w-4" />
                        </button>
                        
                        <div className="flex items-center justify-center shrink-0 w-8 h-8 rounded-lg bg-slate-100">
                          <TaskIcon type={task.type} />
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className={`font-semibold truncate ${isCompleted ? 'line-through text-slate-500' : 'text-slate-900'}`}>
                              {task.title}
                            </span>
                            {task.priority === 'high' && <div className="w-2 h-2 rounded-full bg-red-500 shrink-0" title="High Priority" />}
                          </div>
                          
                          <div className="flex flex-wrap items-center gap-3 mt-1 text-xs font-medium text-slate-500">
                            {task.dueAt && (
                              <div className={`flex items-center gap-1 ${isOverdue ? 'text-red-600 font-bold' : isTodayDate ? 'text-amber-600 font-bold' : ''}`}>
                                <CalendarIcon className="h-3.5 w-3.5" />
                                {isOverdue ? 'Overdue: ' : isTodayDate ? 'Today: ' : ''}
                                {format(new Date(task.dueAt), 'MMM d, HH:mm')}
                              </div>
                            )}
                            
                            {(task.lead || task.deal || task.contact) && (
                              <>
                                <span className="text-slate-300">•</span>
                                <div className="flex items-center gap-1 text-indigo-600 hover:underline cursor-pointer" onClick={() => openTaskForm(task)}>
                                  {task.deal ? <Briefcase className="h-3.5 w-3.5" /> : task.contact ? <Users className="h-3.5 w-3.5" /> : <Target className="h-3.5 w-3.5" />}
                                  <span className="truncate max-w-[150px]">
                                    {task.deal?.title || task.lead?.title || `${task.contact?.firstName} ${task.contact?.lastName}`}
                                  </span>
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="shrink-0 flex items-center gap-4 pl-4 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => openTaskForm(task)} className="text-xs font-bold text-indigo-600 hover:bg-indigo-50 px-3 py-1.5 rounded-lg border border-indigo-100 transition-colors">
                          Edit
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      ) : (
        <TaskCalendar tasks={tasks} onDateClick={(date) => { /* Could open localized list modal, keeping it simple for now */ }} />
      )}
    </div>
  );
}

// Target icon for Lead link inline rendering since Target isn't imported from lucide above
function Target(props: any) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="6" />
      <circle cx="12" cy="12" r="2" />
    </svg>
  );
}
