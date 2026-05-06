import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  X, ChevronDown, Clock, CheckCircle2, Phone, Mail, Users,
  MessageSquare, ArrowRightLeft, Plus, Edit2,
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import type { Lead, PipelineStage, Task, Communication } from '@/types/api.types.ts';
import * as leadsApi from '@/api/leads.api.ts';
import * as tasksApi from '@/api/tasks.api.ts';
import * as communicationsApi from '@/api/communications.api.ts';
import * as pipelineApi from '@/api/pipeline.api.ts';
import { Button } from '@/components/ui/Button.tsx';
import { getScoreColor, getPriorityStyles } from './leadUtils.ts';
import { formatCurrency } from '@/utils/format.ts';
import { useUIStore } from '@/store/ui.store.ts';

interface Props {
  lead: Lead;
  onClose: () => void;
  onEdit: () => void;
  onConvert: () => void;
}

type Tab = 'overview' | 'timeline' | 'tasks' | 'communications';

export function LeadDetailModal({ lead, onClose, onEdit, onConvert }: Props) {
  const [tab, setTab] = useState<Tab>('overview');
  const [stageMenuOpen, setStageMenuOpen] = useState(false);
  const [addTaskOpen, setAddTaskOpen] = useState(false);
  const { openCommModal } = useUIStore();
  const qc = useQueryClient();

  const { data: leadData } = useQuery({
    queryKey: ['lead', lead.id],
    queryFn: () => leadsApi.getLead(lead.id),
  });

  const { data: timelineData } = useQuery({
    queryKey: ['lead-timeline', lead.id],
    queryFn: () => leadsApi.getLeadTimeline(lead.id),
    enabled: tab === 'timeline',
  });

  const { data: tasksData } = useQuery({
    queryKey: ['tasks', 'lead', lead.id],
    queryFn: () => tasksApi.getTasks({ leadId: lead.id, limit: 50 }),
    enabled: tab === 'tasks',
  });

  const { data: commsData } = useQuery({
    queryKey: ['communications', 'lead', lead.id],
    queryFn: () => communicationsApi.getCommunications({ leadId: lead.id, limit: 50 }),
    enabled: tab === 'communications',
  });

  const { data: stagesData } = useQuery({
    queryKey: ['pipeline-stages', 'lead'],
    queryFn: () => pipelineApi.getStages({ type: 'lead', isActive: true }),
  });

  const updateStageMutation = useMutation({
    mutationFn: (stageId: string) => leadsApi.updateLead(lead.id, { stageId }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['leads'] });
      qc.invalidateQueries({ queryKey: ['lead', lead.id] });
      setStageMenuOpen(false);
    },
  });

  const completeTaskMutation = useMutation({
    mutationFn: (taskId: string) => tasksApi.updateTask(taskId, { status: 'completed' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tasks', 'lead', lead.id] }),
  });

  const currentLead: Lead = leadData?.data ?? lead;
  const stages: PipelineStage[] = (stagesData?.data as any) ?? [];
  const tasks: Task[] = tasksData?.data?.data ?? [];
  const comms: Communication[] = commsData?.data?.data ?? [];
  const timeline: any[] = timelineData?.data ?? [];
  const score = currentLead.score ?? 0;
  const stale = (currentLead as any).isStale;

  const TABS: { id: Tab; label: string }[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'timeline', label: 'Timeline' },
    { id: 'tasks', label: tab === 'tasks' && tasks.length ? `Tasks (${tasks.length})` : 'Tasks' },
    { id: 'communications', label: 'Communications' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-[620px] h-full bg-white shadow-2xl flex flex-col" style={{ animation: 'slideInRight 0.25s ease-out' }}>
        {/* Header */}
        <div className="border-b border-slate-200 p-5 flex-shrink-0">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                {stale && <span className="text-[10px] font-bold bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded">STALE</span>}
                {currentLead.isConverted && <span className="text-[10px] font-bold bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded">CONVERTED</span>}
              </div>
              <h2 className="text-lg font-bold text-slate-900">{currentLead.title}</h2>
              <div className="flex items-center gap-3 mt-2 flex-wrap">
                {/* Stage selector */}
                <div className="relative">
                  <button
                    onClick={() => setStageMenuOpen(!stageMenuOpen)}
                    className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100 transition-colors"
                  >
                    {currentLead.stage?.color && (
                      <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: currentLead.stage.color }} />
                    )}
                    {currentLead.stage?.name ?? 'Unknown Stage'}
                    <ChevronDown className="h-3 w-3" />
                  </button>
                  {stageMenuOpen && (
                    <div className="absolute top-full left-0 z-20 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl min-w-40 py-1">
                      {stages.map(s => (
                        <button
                          key={s.id}
                          onClick={() => updateStageMutation.mutate(s.id)}
                          className={`w-full flex items-center gap-2 px-4 py-2 text-sm hover:bg-slate-50 transition-colors ${s.id === currentLead.stageId ? 'font-bold text-indigo-700' : 'text-slate-700'}`}
                        >
                          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: s.color ?? '#6366f1' }} />
                          {s.name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border capitalize ${getPriorityStyles(currentLead.priority)}`}>
                  {currentLead.priority}
                </span>

                <div className="flex items-center gap-1.5">
                  <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${getScoreColor(score)}`} style={{ width: `${score}%` }} />
                  </div>
                  <span className="text-xs font-bold text-slate-500">{score}/100</span>
                </div>
              </div>
              {currentLead.assignedTo && (
                <div className="mt-2 flex items-center gap-2">
                  <div className="h-6 w-6 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 text-xs font-bold flex-shrink-0">
                    {currentLead.assignedTo.firstName.charAt(0)}
                  </div>
                  <span className="text-xs text-slate-500">
                    Assigned to <span className="font-semibold text-slate-700">{currentLead.assignedTo.firstName} {currentLead.assignedTo.lastName}</span>
                  </span>
                </div>
              )}
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              {!currentLead.isConverted && (
                <Button size="sm" variant="outline" onClick={onConvert} className="text-xs whitespace-nowrap">
                  <ArrowRightLeft className="h-3 w-3 mr-1" /> Convert
                </Button>
              )}
              <Button size="sm" variant="outline" onClick={onEdit}>
                <Edit2 className="h-3.5 w-3.5" />
              </Button>
              <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                <X className="h-4 w-4 text-slate-500" />
              </button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-200 px-5 flex-shrink-0">
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`mr-6 py-3 text-sm font-medium border-b-2 transition-colors ${tab === t.id ? 'border-indigo-600 text-indigo-700' : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto">
          {tab === 'overview' && (
            <div className="p-5 space-y-5">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-50 p-4 rounded-xl">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Estimated Value</p>
                  <p className="text-xl font-black text-slate-900 mt-1">
                    {currentLead.estimatedValue ? formatCurrency(currentLead.estimatedValue, currentLead.currency) : '—'}
                  </p>
                </div>
                <div className="bg-slate-50 p-4 rounded-xl">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Expected Close</p>
                  <p className="text-xl font-black text-slate-900 mt-1">
                    {currentLead.expectedCloseAt ? format(new Date(currentLead.expectedCloseAt), 'dd MMM yy') : '—'}
                  </p>
                </div>
              </div>

              <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100">
                {([
                  ['Source', currentLead.source?.replace(/([A-Z])/g, ' $1').trim()],
                  ['Contact', currentLead.contact ? `${currentLead.contact.firstName} ${currentLead.contact.lastName ?? ''}` : '—'],
                  ['Company', currentLead.company?.name ?? '—'],
                  ['Currency', currentLead.currency],
                  ['Last Activity', currentLead.lastActivityAt ? formatDistanceToNow(new Date(currentLead.lastActivityAt), { addSuffix: true }) : '—'],
                  ['Created', format(new Date(currentLead.createdAt), 'dd MMM yyyy, HH:mm')],
                ] as [string, string][]).map(([label, value]) => (
                  <div key={label} className="flex items-center px-4 py-3 text-sm">
                    <span className="w-36 font-semibold text-slate-500 flex-shrink-0">{label}</span>
                    <span className="text-slate-800">{value}</span>
                  </div>
                ))}
              </div>

              {currentLead.tags?.length > 0 && (
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Tags</p>
                  <div className="flex flex-wrap gap-2">
                    {currentLead.tags.map(tag => (
                      <span key={tag} className="px-2.5 py-1 bg-indigo-50 text-indigo-700 text-xs font-medium rounded-full border border-indigo-100">{tag}</span>
                    ))}
                  </div>
                </div>
              )}

              {currentLead.description && (
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Description</p>
                  <p className="text-sm text-slate-700 bg-slate-50 p-3 rounded-xl leading-relaxed">{currentLead.description}</p>
                </div>
              )}
            </div>
          )}

          {tab === 'timeline' && (
            <div className="p-5">
              {timeline.length === 0 ? (
                <EmptyState icon={<Clock className="h-10 w-10 text-slate-200" />} title="No timeline events yet" />
              ) : (
                <div className="relative">
                  <div className="absolute left-5 top-0 bottom-0 w-px bg-slate-200" />
                  <div className="space-y-4">
                    {timeline.map((event: any, i: number) => (
                      <div key={i} className="flex gap-4 pl-12 relative">
                        <div className="absolute left-3.5 top-1 h-3 w-3 rounded-full bg-indigo-400 border-2 border-white ring-1 ring-indigo-200" />
                        <div className="flex-1 bg-slate-50 rounded-xl p-3">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-bold text-slate-600 capitalize">{event.type.replace('_', ' ')}</span>
                            <span className="text-xs text-slate-400">{formatDistanceToNow(new Date(event.date), { addSuffix: true })}</span>
                          </div>
                          {event.data?.action && <p className="text-sm text-slate-700">{event.data.action.replace(/_/g, ' ')}</p>}
                          {event.data?.title && <p className="text-sm text-slate-700 font-medium">{event.data.title}</p>}
                          {event.data?.body && <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{event.data.body}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {tab === 'tasks' && (
            <div className="p-5 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-slate-700">Tasks</h4>
                <Button size="sm" variant="outline" onClick={() => setAddTaskOpen(v => !v)}>
                  <Plus className="h-3 w-3 mr-1" /> Add Task
                </Button>
              </div>
              {addTaskOpen && <QuickAddTask leadId={lead.id} onClose={() => setAddTaskOpen(false)} />}
              {tasks.length === 0 && !addTaskOpen ? (
                <EmptyState icon={<CheckCircle2 className="h-10 w-10 text-slate-200" />} title="No tasks yet" subtitle="Add a task to track follow-ups" />
              ) : (
                <div className="space-y-2">
                  {tasks.map(task => (
                    <TaskRow key={task.id} task={task} onComplete={() => completeTaskMutation.mutate(task.id)} />
                  ))}
                </div>
              )}
            </div>
          )}

          {tab === 'communications' && (
            <div className="p-5 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-slate-700">Communications</h4>
                <Button size="sm" variant="outline" onClick={() => openCommModal({ leadId: lead.id })}>
                  <Plus className="h-3 w-3 mr-1" /> Log
                </Button>
              </div>
              {comms.length === 0 ? (
                <EmptyState icon={<MessageSquare className="h-10 w-10 text-slate-200" />} title="No communications logged" />
              ) : (
                <div className="space-y-3">
                  {comms.map(comm => <CommRow key={comm.id} comm={comm} />)}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function EmptyState({ icon, title, subtitle }: { icon: React.ReactNode; title: string; subtitle?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="mb-3">{icon}</div>
      <p className="text-sm font-semibold text-slate-500">{title}</p>
      {subtitle && <p className="text-xs text-slate-400 mt-1">{subtitle}</p>}
    </div>
  );
}

function TaskRow({ task, onComplete }: { task: Task; onComplete: () => void }) {
  const done = task.status === 'completed';
  return (
    <div className={`flex items-start gap-3 p-3 rounded-xl border transition-colors ${done ? 'bg-slate-50 border-slate-100 opacity-60' : 'bg-white border-slate-200'}`}>
      <button
        onClick={() => !done && onComplete()}
        className={`mt-0.5 h-4 w-4 rounded-full border-2 flex-shrink-0 transition-colors flex items-center justify-center ${done ? 'bg-emerald-500 border-emerald-500' : 'border-slate-300 hover:border-emerald-400'}`}
      >
        {done && <span className="text-white text-[8px] font-bold">✓</span>}
      </button>
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium ${done ? 'line-through text-slate-400' : 'text-slate-800'}`}>{task.title}</p>
        <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-400">
          <span className="capitalize">{task.type}</span>
          {task.dueAt && <span>· due {format(new Date(task.dueAt), 'dd MMM, HH:mm')}</span>}
          <span className={`capitalize font-medium ${task.priority === 'high' ? 'text-red-500' : task.priority === 'medium' ? 'text-amber-500' : 'text-slate-400'}`}>{task.priority}</span>
        </div>
      </div>
    </div>
  );
}

function CommRow({ comm }: { comm: Communication }) {
  return (
    <div className="p-3 rounded-xl border border-slate-200 bg-white">
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">{comm.type}</span>
          <span className="text-[10px] text-slate-400 capitalize">{comm.direction}</span>
        </div>
        <span className="text-xs text-slate-400">{formatDistanceToNow(new Date((comm as any).occurredAt ?? comm.createdAt), { addSuffix: true })}</span>
      </div>
      {(comm as any).subject && <p className="text-sm font-semibold text-slate-800">{(comm as any).subject}</p>}
      {(comm as any).body && <p className="text-sm text-slate-600 mt-1 line-clamp-2">{(comm as any).body}</p>}
      {(comm as any).outcome && <p className="text-xs text-indigo-600 mt-1.5 font-medium">Outcome: {(comm as any).outcome}</p>}
    </div>
  );
}

function QuickAddTask({ leadId, onClose }: { leadId: string; onClose: () => void }) {
  const [title, setTitle] = useState('');
  const [type, setType] = useState('followUp');
  const [dueAt, setDueAt] = useState('');
  const qc = useQueryClient();

  const mutation = useMutation({
    mutationFn: (data: any) => tasksApi.createTask(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tasks', 'lead', leadId] });
      onClose();
    },
  });

  return (
    <div className="border border-indigo-200 bg-indigo-50 rounded-xl p-4 space-y-3">
      <input autoFocus value={title} onChange={e => setTitle(e.target.value)} placeholder="Task title..." className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none bg-white" />
      <div className="flex gap-2">
        <select value={type} onChange={e => setType(e.target.value)} className="flex-1 px-2 py-1.5 border border-slate-200 rounded-lg text-xs bg-white">
          <option value="followUp">Follow Up</option>
          <option value="call">Call</option>
          <option value="email">Email</option>
          <option value="meeting">Meeting</option>
        </select>
        <input type="datetime-local" value={dueAt} onChange={e => setDueAt(e.target.value)} className="flex-1 px-2 py-1.5 border border-slate-200 rounded-lg text-xs bg-white" />
      </div>
      <div className="flex gap-2 justify-end">
        <Button size="sm" variant="outline" onClick={onClose}>Cancel</Button>
        <Button size="sm" isLoading={mutation.isPending} onClick={() => title && mutation.mutate({ title, type, leadId, dueAt: dueAt || undefined, priority: 'medium' })}>Add Task</Button>
      </div>
    </div>
  );
}

