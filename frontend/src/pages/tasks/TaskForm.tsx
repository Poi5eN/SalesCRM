import { useState, useEffect, useRef } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { X, Calendar as CalendarIcon, Clock, Link as LinkIcon, Search, Bell } from 'lucide-react';
import { format } from 'date-fns';
import * as tasksApi from '@/api/tasks.api.ts';
import * as leadsApi from '@/api/leads.api.ts';
import * as dealsApi from '@/api/deals.api.ts';
import * as contactsApi from '@/api/contacts.api.ts';
import { useAuth } from '@/hooks/useAuth.ts';
import { Button } from '@/components/ui/Button.tsx';
import type { Task, Lead, Deal, Contact, TaskPriority, TaskType } from '@/types/api.types.ts';
import { useDebounce } from '@/hooks/useDebounce.ts';

interface TaskFormProps {
  task?: Task | null;
  onClose: () => void;
  onSuccess?: (task: Task) => void;
  prefill?: {
    leadId?: string;
    dealId?: string;
    contactId?: string;
    assignedToId?: string;
    dueAt?: string;
  };
}

export function TaskForm({ task, onClose, onSuccess, prefill }: TaskFormProps) {
  const qc = useQueryClient();
  const { user } = useAuth();

  const [form, setForm] = useState({
    title: task?.title ?? '',
    type: task?.type ?? 'followUp',
    priority: task?.priority ?? 'medium',
    dueDate: task?.dueAt ? format(new Date(task.dueAt), 'yyyy-MM-dd') : (prefill?.dueAt ? format(new Date(prefill.dueAt), 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd')),
    dueTime: task?.dueAt ? format(new Date(task.dueAt), 'HH:mm') : '09:00',
    assignedToId: task?.assignedToId ?? prefill?.assignedToId ?? user?.id ?? '',
    description: task?.description ?? '',
    leadId: task?.leadId ?? prefill?.leadId ?? '',
    dealId: task?.dealId ?? prefill?.dealId ?? '',
    contactId: task?.contactId ?? prefill?.contactId ?? '',
  });

  const [linkType, setLinkType] = useState<'lead' | 'deal' | 'contact' | 'none'>(() => {
    if (form.leadId) return 'lead';
    if (form.dealId) return 'deal';
    if (form.contactId) return 'contact';
    return 'none';
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchDD, setShowSearchDD] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const debouncedSearch = useDebounce(searchQuery, 300);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) setShowSearchDD(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const { data: searchResults, isFetching } = useQuery({
    queryKey: ['task-link-search', linkType, debouncedSearch],
    queryFn: async () => {
      if (linkType === 'none' || debouncedSearch.length < 2) return [];
      if (linkType === 'lead') return (await leadsApi.getLeads({ search: debouncedSearch, limit: 5 })).data.data;
      if (linkType === 'deal') return (await dealsApi.getDeals({ search: debouncedSearch, limit: 5 })).data.data;
      if (linkType === 'contact') return (await contactsApi.getContacts({ search: debouncedSearch, limit: 5 })).data.data;
      return [];
    },
    enabled: linkType !== 'none' && debouncedSearch.length >= 2,
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => tasksApi.createTask(data),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ['tasks'] });
      onSuccess?.(res.data);
      onClose();
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: any) => tasksApi.updateTask(task!.id, data),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ['tasks'] });
      qc.invalidateQueries({ queryKey: ['task', task!.id] });
      onSuccess?.(res.data);
      onClose();
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const dt = new Date(`${form.dueDate}T${form.dueTime}`);
    const payload: any = {
      title: form.title,
      type: form.type,
      priority: form.priority,
      dueAt: dt.toISOString(),
      assignedToId: form.assignedToId || undefined,
      description: form.description || undefined,
      leadId: linkType === 'lead' ? form.leadId || undefined : undefined,
      dealId: linkType === 'deal' ? form.dealId || undefined : undefined,
      contactId: linkType === 'contact' ? form.contactId || undefined : undefined,
    };

    if (task) updateMutation.mutate(payload);
    else createMutation.mutate(payload);
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-5 border-b border-slate-200 shrink-0">
          <h2 className="text-lg font-bold text-slate-900">{task ? 'Edit Task' : 'New Task'}</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
            <X className="h-5 w-5 text-slate-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <input
              required
              autoFocus
              value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              placeholder="What needs to be done?"
              className="w-full text-lg font-semibold placeholder:text-slate-400 focus:outline-none bg-transparent"
            />
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Type</label>
              <select
                value={form.type}
                onChange={e => setForm(f => ({ ...f, type: e.target.value as TaskType }))}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 bg-slate-50"
              >
                <option value="followUp">Follow-up</option>
                <option value="call">Call</option>
                <option value="email">Email</option>
                <option value="meeting">Meeting</option>
                <option value="deadline">Deadline</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Priority</label>
              <select
                value={form.priority}
                onChange={e => setForm(f => ({ ...f, priority: e.target.value as TaskPriority }))}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 bg-slate-50"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Due Date</label>
              <div className="relative">
                <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="date"
                  required
                  value={form.dueDate}
                  onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))}
                  className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 bg-slate-50"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Time</label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="time"
                  required
                  value={form.dueTime}
                  onChange={e => setForm(f => ({ ...f, dueTime: e.target.value }))}
                  className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 bg-slate-50"
                />
              </div>
            </div>
          </div>

          <div className="border border-slate-200 rounded-xl p-3 bg-slate-50">
            <div className="flex items-center gap-2 mb-2">
              <LinkIcon className="h-4 w-4 text-slate-500" />
              <span className="text-sm font-semibold text-slate-700">Link to</span>
              <select
                value={linkType}
                onChange={e => { setLinkType(e.target.value as any); setSearchQuery(''); }}
                className="bg-transparent text-sm font-medium focus:outline-none ml-auto text-indigo-600"
              >
                <option value="none">None</option>
                <option value="lead">Lead</option>
                <option value="deal">Deal</option>
                <option value="contact">Contact</option>
              </select>
            </div>

            {linkType !== 'none' && (
              <div className="relative" ref={searchRef}>
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                <input
                  value={searchQuery}
                  onChange={e => { setSearchQuery(e.target.value); setShowSearchDD(true); }}
                  onFocus={() => searchQuery.length >= 2 && setShowSearchDD(true)}
                  placeholder={`Search ${linkType}s...`}
                  className="w-full pl-8 pr-3 py-1.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-indigo-300 bg-white"
                />
                {showSearchDD && (searchResults?.length ?? 0) > 0 && (
                  <div className="absolute top-full left-0 right-0 z-20 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg max-h-48 overflow-y-auto">
                    {searchResults?.map((item: any) => (
                      <button
                        key={item.id} type="button"
                        onClick={() => {
                          setForm(f => ({ ...f, [`${linkType}Id`]: item.id }));
                          setSearchQuery(item.title || `${item.firstName} ${item.lastName}`);
                          setShowSearchDD(false);
                        }}
                        className="w-full px-4 py-2 text-sm text-left hover:bg-slate-50 border-b border-slate-100 last:border-0"
                      >
                        {item.title || `${item.firstName} ${item.lastName}`}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <div>
            <textarea
              rows={3}
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              placeholder="Additional details or notes..."
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 bg-slate-50 resize-none"
            />
          </div>

          <div className="flex items-center justify-end space-x-3 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" isLoading={isSaving}>
              {task ? 'Save Task' : 'Create Task'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
