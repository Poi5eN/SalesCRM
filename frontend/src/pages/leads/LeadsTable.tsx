import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowUp, ArrowDown, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight,
  MoreHorizontal, ChevronDown, AlertTriangle, Target,
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import type { Lead, PipelineStage } from '@/types/api.types.ts';
import * as leadsApi from '@/api/leads.api.ts';
import { Button } from '@/components/ui/Button.tsx';
import { getScoreColor, getPriorityStyles, getPriorityDotColor, SOURCE_LABELS } from './leadUtils.ts';
import { formatCurrency } from '@/utils/format.ts';

interface LeadsTableProps {
  leads: Lead[];
  stages: PipelineStage[];
  isLoading: boolean;
  pagination: { page: number; limit: number; total: number; onPageChange: (p: number) => void };
  sort: { key: string; order: 'asc' | 'desc'; onSort: (key: string) => void };
  onRowClick: (lead: Lead) => void;
  onEdit: (lead: Lead) => void;
  onDelete: (lead: Lead) => void;
}

interface BulkAction {
  selectedIds: Set<string>;
  onSelectAll: (checked: boolean) => void;
  onSelectOne: (id: string, checked: boolean) => void;
  onBulkDelete: () => void;
  onBulkAssign: () => void;
  onBulkStageChange: (stageId: string) => void;
  stages: PipelineStage[];
}

const SORTABLE_COLS = [
  { header: 'Title', key: 'title' },
  { header: 'Est. Value', key: 'estimatedValue' },
  { header: 'Last Activity', key: 'lastActivityAt' },
  { header: 'Score', key: 'score' },
  { header: 'Created', key: 'createdAt' },
];

export function LeadsTable({ leads, stages, isLoading, pagination, sort, onRowClick, onEdit, onDelete }: LeadsTableProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [openStageMenu, setOpenStageMenu] = useState<string | null>(null);
  const qc = useQueryClient();

  const updateStageMutation = useMutation({
    mutationFn: ({ id, stageId }: { id: string; stageId: string }) => leadsApi.updateLead(id, { stageId }),
    onMutate: async ({ id, stageId }) => {
      await qc.cancelQueries({ queryKey: ['leads'] });
      const prev = qc.getQueryData(['leads']);
      qc.setQueriesData({ queryKey: ['leads'] }, (old: any) => {
        if (!old?.data?.data) return old;
        return {
          ...old,
          data: {
            ...old.data,
            data: old.data.data.map((l: Lead) => l.id === id ? { ...l, stageId, stage: stages.find(s => s.id === stageId) } : l),
          },
        };
      });
      return { prev };
    },
    onError: (_err, _vars, ctx) => { if (ctx?.prev) qc.setQueriesData({ queryKey: ['leads'] }, ctx.prev); },
    onSettled: () => qc.invalidateQueries({ queryKey: ['leads'] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => leadsApi.deleteLead(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['leads'] }),
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: async (ids: string[]) => Promise.all(ids.map(id => leadsApi.deleteLead(id))),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['leads'] });
      setSelectedIds(new Set());
    },
  });

  const bulkStageMutation = useMutation({
    mutationFn: async ({ ids, stageId }: { ids: string[]; stageId: string }) =>
      Promise.all(ids.map(id => leadsApi.updateLead(id, { stageId }))),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['leads'] });
      setSelectedIds(new Set());
    },
  });

  const allSelected = leads.length > 0 && selectedIds.size === leads.length;
  const totalPages = Math.ceil(pagination.total / pagination.limit);

  const SortIcon = ({ colKey }: { colKey: string }) => {
    if (sort.key !== colKey) return null;
    return sort.order === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />;
  };

  const colHeader = (label: string, key?: string) => (
    <th
      className={`px-4 py-3.5 text-left text-xs font-bold text-slate-500 uppercase tracking-wider ${key ? 'cursor-pointer hover:text-slate-800 transition-colors select-none' : ''}`}
      onClick={() => key && sort.onSort(key)}
    >
      <div className="flex items-center gap-1">
        {label}
        {key && <SortIcon colKey={key} />}
      </div>
    </th>
  );

  return (
    <div className="space-y-4">
      {/* Bulk Action Bar */}
      {selectedIds.size > 0 && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-30 flex items-center gap-3 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-2xl">
          <span className="text-sm font-semibold">{selectedIds.size} selected</span>
          <div className="w-px h-5 bg-slate-700" />
          <select
            onChange={e => e.target.value && bulkStageMutation.mutate({ ids: [...selectedIds], stageId: e.target.value })}
            className="bg-slate-800 border border-slate-700 text-white text-xs px-2 py-1.5 rounded-lg focus:outline-none"
            defaultValue=""
          >
            <option value="" disabled>Move to Stage</option>
            {stages.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          <button
            onClick={() => bulkDeleteMutation.mutate([...selectedIds])}
            className="text-xs font-semibold text-red-400 hover:text-red-300 transition-colors"
          >
            Delete
          </button>
          <button onClick={() => setSelectedIds(new Set())} className="text-xs text-slate-400 hover:text-white transition-colors">
            Clear
          </button>
        </div>
      )}

      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-4 py-3.5 w-10">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={e => setSelectedIds(e.target.checked ? new Set(leads.map(l => l.id)) : new Set())}
                  className="rounded border-slate-300 text-indigo-600"
                />
              </th>
              {colHeader('Title', 'title')}
              {colHeader('Contact')}
              {colHeader('Stage')}
              {colHeader('Priority')}
              {colHeader('Source')}
              {colHeader('Assigned To')}
              {colHeader('Est. Value', 'estimatedValue')}
              {colHeader('Last Activity', 'lastActivityAt')}
              {colHeader('Score', 'score')}
              <th className="px-4 py-3.5 w-10" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isLoading ? (
              [...Array(6)].map((_, i) => (
                <tr key={i} className="animate-pulse">
                  {[...Array(11)].map((_, j) => (
                    <td key={j} className="px-4 py-4">
                      <div className="h-4 bg-slate-100 rounded w-full" />
                    </td>
                  ))}
                </tr>
              ))
            ) : leads.length === 0 ? (
              <tr>
                <td colSpan={11} className="px-6 py-16 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <Target className="h-12 w-12 text-slate-200" />
                    <p className="text-sm font-semibold text-slate-500">No leads found</p>
                    <p className="text-xs text-slate-400">Try adjusting your filters or create a new lead</p>
                  </div>
                </td>
              </tr>
            ) : (
              leads.map(lead => {
                const stale = (lead as any).isStale;
                const isSelected = selectedIds.has(lead.id);
                return (
                  <tr
                    key={lead.id}
                    onClick={() => onRowClick(lead)}
                    className={`hover:bg-slate-50 cursor-pointer transition-colors ${isSelected ? 'bg-indigo-50/50' : ''} ${stale ? 'border-l-2 border-l-amber-400' : ''}`}
                  >
                    {/* Checkbox */}
                    <td className="px-4 py-4" onClick={e => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={e => setSelectedIds(prev => {
                          const next = new Set(prev);
                          e.target.checked ? next.add(lead.id) : next.delete(lead.id);
                          return next;
                        })}
                        className="rounded border-slate-300 text-indigo-600"
                      />
                    </td>

                    {/* Title */}
                    <td className="px-4 py-4">
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                          {stale && <AlertTriangle className="h-3.5 w-3.5 text-amber-400 flex-shrink-0" />}
                          <span className="font-semibold text-slate-900 truncate max-w-[200px]">{lead.title}</span>
                        </div>
                        {lead.company?.name && (
                          <span className="text-xs text-slate-500 mt-0.5">{lead.company.name}</span>
                        )}
                      </div>
                    </td>

                    {/* Contact */}
                    <td className="px-4 py-4">
                      {lead.contact ? (
                        <div className="flex items-center gap-2">
                          <div className="h-6 w-6 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 text-xs font-bold flex-shrink-0">
                            {lead.contact.firstName.charAt(0)}
                          </div>
                          <span className="text-slate-700 whitespace-nowrap">{lead.contact.firstName} {lead.contact.lastName ?? ''}</span>
                        </div>
                      ) : <span className="text-slate-400">—</span>}
                    </td>

                    {/* Stage (inline change) */}
                    <td className="px-4 py-4" onClick={e => e.stopPropagation()}>
                      <div className="relative">
                        <button
                          onClick={() => setOpenStageMenu(openStageMenu === lead.id ? null : lead.id)}
                          className="flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full border bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100 transition-colors"
                        >
                          {lead.stage?.color && <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: lead.stage.color }} />}
                          <span className="max-w-[80px] truncate">{lead.stage?.name ?? '—'}</span>
                          <ChevronDown className="h-3 w-3 flex-shrink-0" />
                        </button>
                        {openStageMenu === lead.id && (
                          <div className="absolute top-full left-0 z-20 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl min-w-[140px] py-1">
                            {stages.map(s => (
                              <button
                                key={s.id}
                                onClick={() => { updateStageMutation.mutate({ id: lead.id, stageId: s.id }); setOpenStageMenu(null); }}
                                className={`w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-slate-50 transition-colors ${s.id === lead.stageId ? 'font-bold text-indigo-700' : 'text-slate-700'}`}
                              >
                                <span className="h-2 w-2 rounded-full flex-shrink-0" style={{ backgroundColor: s.color ?? '#6366f1' }} />
                                {s.name}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Priority */}
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-1.5">
                        <div className={`h-2 w-2 rounded-full flex-shrink-0 ${getPriorityDotColor(lead.priority)}`} />
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border capitalize ${getPriorityStyles(lead.priority)}`}>
                          {lead.priority}
                        </span>
                      </div>
                    </td>

                    {/* Source */}
                    <td className="px-4 py-4">
                      <span className="text-xs text-slate-600">{SOURCE_LABELS[lead.source] ?? lead.source}</span>
                    </td>

                    {/* Assigned To */}
                    <td className="px-4 py-4">
                      {lead.assignedTo ? (
                        <div className="flex items-center gap-2">
                          <div className="h-6 w-6 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 text-xs font-bold flex-shrink-0">
                            {lead.assignedTo.firstName.charAt(0)}
                          </div>
                          <span className="text-xs text-slate-700 whitespace-nowrap">{lead.assignedTo.firstName}</span>
                        </div>
                      ) : <span className="text-slate-400 text-xs">Unassigned</span>}
                    </td>

                    {/* Est Value */}
                    <td className="px-4 py-4">
                      <span className="text-sm font-semibold text-slate-800">
                        {lead.estimatedValue ? formatCurrency(lead.estimatedValue, lead.currency) : '—'}
                      </span>
                    </td>

                    {/* Last Activity */}
                    <td className="px-4 py-4">
                      <span className="text-xs text-slate-500 whitespace-nowrap">
                        {lead.lastActivityAt ? formatDistanceToNow(new Date(lead.lastActivityAt), { addSuffix: true }) : '—'}
                      </span>
                    </td>

                    {/* Score */}
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-12 h-1.5 bg-slate-100 rounded-full overflow-hidden flex-shrink-0">
                          <div className={`h-full rounded-full ${getScoreColor(lead.score)}`} style={{ width: `${lead.score}%` }} />
                        </div>
                        <span className="text-xs font-bold text-slate-500">{lead.score}</span>
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-4" onClick={e => e.stopPropagation()}>
                      <ActionsMenu lead={lead} onEdit={() => onEdit(lead)} onDelete={() => onDelete(lead)} />
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between px-2 text-sm text-slate-600">
        <div>
          Showing <span className="font-semibold text-slate-900">{Math.min((pagination.page - 1) * pagination.limit + 1, pagination.total)}</span> to{' '}
          <span className="font-semibold text-slate-900">{Math.min(pagination.page * pagination.limit, pagination.total)}</span> of{' '}
          <span className="font-semibold text-slate-900">{pagination.total}</span> leads
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="icon" onClick={() => pagination.onPageChange(1)} disabled={pagination.page === 1}><ChevronsLeft className="h-4 w-4" /></Button>
          <Button variant="outline" size="icon" onClick={() => pagination.onPageChange(pagination.page - 1)} disabled={pagination.page === 1}><ChevronLeft className="h-4 w-4" /></Button>
          <span className="px-3 font-medium">Page {pagination.page} of {totalPages || 1}</span>
          <Button variant="outline" size="icon" onClick={() => pagination.onPageChange(pagination.page + 1)} disabled={pagination.page >= totalPages}><ChevronRight className="h-4 w-4" /></Button>
          <Button variant="outline" size="icon" onClick={() => pagination.onPageChange(totalPages)} disabled={pagination.page >= totalPages}><ChevronsRight className="h-4 w-4" /></Button>
        </div>
      </div>
    </div>
  );
}

function ActionsMenu({ lead, onEdit, onDelete }: { lead: Lead; onEdit: () => void; onDelete: () => void }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <Button variant="ghost" size="icon" onClick={() => setOpen(v => !v)} className="h-7 w-7">
        <MoreHorizontal className="h-4 w-4" />
      </Button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full z-20 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl py-1 w-36">
            <button onClick={() => { onEdit(); setOpen(false); }} className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50">Edit</button>
            {!lead.isConverted && <button onClick={() => { }} className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50">Convert to Deal</button>}
            <button onClick={() => { onDelete(); setOpen(false); }} className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50">Delete</button>
          </div>
        </>
      )}
    </div>
  );
}
