import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { LayoutGrid, List, CheckCircle2, Phone, Mail, Users, Calendar as CalendarIcon, Briefcase, Target, Plus } from 'lucide-react';
import { format, isPast, isToday } from 'date-fns';
import * as tasksApi from '@/api/tasks.api.ts';
import { useAuth } from '@/hooks/useAuth.ts';
import { useUIStore } from '@/store/ui.store.ts';
import { Button } from '@/components/ui/Button.tsx';
import { Table } from '@/components/ui/Table.tsx';
import { Badge } from '@/components/ui/Badge.tsx';

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
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tasks'] }),
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
      case 'call': return <Phone className="h-3 w-3 text-emerald-500" />;
      case 'email': return <Mail className="h-3 w-3 text-blue-500" />;
      case 'meeting': return <Users className="h-3 w-3 text-indigo-500" />;
      default: return <CheckCircle2 className="h-3 w-3 text-slate-400" />;
    }
  };

  const columns = [
    {
      header: 'Task',
      accessor: (task: Task) => {
        const isCompleted = task.status === 'completed';
        return (
          <div className="flex items-center gap-4">
            <button 
              onClick={(e) => { e.stopPropagation(); !isCompleted && completeMutation.mutate(task.id); }}
              disabled={isCompleted || completeMutation.isPending}
              className={`shrink-0 h-5 w-5 rounded-full border-2 flex items-center justify-center transition-all ${
                isCompleted ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-300 text-transparent hover:border-indigo-400 hover:text-indigo-200'
              }`}
            >
              <CheckCircle2 className="h-3 w-3" />
            </button>
            <div className="flex flex-col">
              <span className={`font-black text-slate-900 dark:text-white transition-colors group-hover:text-indigo-600 dark:group-hover:text-indigo-400 ${isCompleted ? 'line-through opacity-50' : ''}`}>
                {task.title}
              </span>
              <div className="flex items-center gap-2 mt-0.5">
                <TaskIcon type={task.type} />
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{task.type}</span>
              </div>
            </div>
          </div>
        );
      },
    },
    {
      header: 'Related To',
      accessor: (task: Task) => (
        (task.lead || task.deal || task.contact) ? (
          <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
            {task.deal ? <Briefcase className="h-3.5 w-3.5" /> : task.contact ? <Users className="h-3.5 w-3.5" /> : <Target className="h-3.5 w-3.5" />}
            <span className="text-xs font-black uppercase tracking-widest truncate max-w-[150px]">
              {task.deal?.title || task.lead?.title || `${task.contact?.firstName} ${task.contact?.lastName}`}
            </span>
          </div>
        ) : <span className="text-slate-400">—</span>
      ),
    },
    {
      header: 'Due Date',
      accessor: (task: Task) => {
        const isOverdue = task.dueAt && isPast(new Date(task.dueAt)) && !isToday(new Date(task.dueAt)) && task.status !== 'completed';
        const isTodayDate = task.dueAt && isToday(new Date(task.dueAt)) && task.status !== 'completed';
        return (
          <div className={`flex items-center gap-1.5 ${isOverdue ? 'text-red-500' : isTodayDate ? 'text-amber-500' : 'text-slate-500'}`}>
            <CalendarIcon className="h-3.5 w-3.5" />
            <span className="text-[10px] font-black uppercase tracking-widest">
              {task.dueAt ? format(new Date(task.dueAt), 'MMM d, HH:mm') : 'No date'}
            </span>
          </div>
        );
      },
      sortable: true,
      sortKey: 'dueAt',
    },
    {
      header: 'Priority',
      accessor: (task: Task) => <Badge variant="priority" priority={task.priority as any}>{task.priority}</Badge>,
      sortable: true,
      sortKey: 'priority',
    },
    {
      header: '',
      accessor: (task: Task) => (
        <div className="flex justify-end opacity-0 group-hover:opacity-100 transition-opacity">
          <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); openTaskForm(task); }} className="h-8 px-4 font-black uppercase tracking-widest text-[10px] text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 rounded-xl">Edit</Button>
        </div>
      ),
      className: "w-10",
    }
  ];

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Agenda</h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium mt-1">Stay organized and productive.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
            <button
              onClick={() => updateParam('view', 'list')}
              className={`flex items-center gap-2 px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${view === 'list' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-white shadow-md' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
            >
              <List className="h-4 w-4" /> List
            </button>
            <button
              onClick={() => updateParam('view', 'calendar')}
              className={`flex items-center gap-2 px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${view === 'calendar' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-white shadow-md' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
            >
              <LayoutGrid className="h-4 w-4" /> Calendar
            </button>
          </div>
          <Button size="sm" onClick={() => openTaskForm()} className="h-11 px-6 rounded-2xl shadow-lg shadow-indigo-500/20">
            <Plus className="mr-2 h-4 w-4" /> New Task
          </Button>
        </div>
      </div>

      {view === 'list' ? (
        <div className="space-y-4">
          <div className="flex items-center gap-1 border-b border-slate-200 dark:border-slate-800 px-2 overflow-x-auto scrollbar-none">
            {TABS.map(t => (
              <button
                key={t.id}
                onClick={() => updateParam('tab', t.id)}
                className={`relative px-6 py-4 text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap flex items-center gap-2 ${
                  activeTab === t.id ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                }`}
              >
                {t.label}
                {t.badge && (
                  <span className="inline-flex items-center justify-center px-1.5 py-0.5 rounded-full text-[9px] font-black bg-red-500 text-white leading-none">
                    {t.badge}
                  </span>
                )}
                {activeTab === t.id && (
                  <div className="absolute bottom-0 left-4 right-4 h-1 bg-indigo-600 dark:bg-indigo-400 rounded-t-full shadow-[0_0_8px] shadow-indigo-500/50" />
                )}
              </button>
            ))}
          </div>

          <Table
            columns={columns as any}
            data={tasks}
            isLoading={tasksLoading}
            onRowClick={(task) => openTaskForm(task)}
            emptyState={{
              title: "You're all caught up!",
              description: "No tasks found for this category. Enjoy your free time or create a new one.",
              variant: 'tasks'
            }}
          />
        </div>
      ) : (
        <TaskCalendar tasks={tasks} onDateClick={(date) => { /* ... */ }} />
      )}
    </div>
  );
}
