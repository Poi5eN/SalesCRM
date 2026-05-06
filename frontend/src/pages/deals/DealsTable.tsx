import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowUp, ArrowDown, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, MoreHorizontal, Target } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import type { Deal, PipelineStage } from '@/types/api.types.ts';
import * as dealsApi from '@/api/deals.api.ts';
import { Button } from '@/components/ui/Button.tsx';
import { formatCurrency } from '@/utils/format.ts';
import { getProbabilityColor, getStatusBadgeStyles } from './dealUtils.ts';

interface DealsTableProps {
  deals: Deal[];
  stages: PipelineStage[];
  isLoading: boolean;
  pagination: { page: number; limit: number; total: number; onPageChange: (p: number) => void };
  sort: { key: string; order: 'asc' | 'desc'; onSort: (key: string) => void };
  onRowClick: (deal: Deal) => void;
  onEdit: (deal: Deal) => void;
  onDelete: (deal: Deal) => void;
  currency?: string;
}

export function DealsTable({ deals, stages, isLoading, pagination, sort, onRowClick, onEdit, onDelete, currency = 'USD' }: DealsTableProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const qc = useQueryClient();

  const bulkDeleteMutation = useMutation({
    mutationFn: async (ids: string[]) => Promise.all(ids.map(id => dealsApi.deleteDeal(id))),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['deals'] });
      setSelectedIds(new Set());
    },
  });

  const allSelected = deals.length > 0 && selectedIds.size === deals.length;
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
      {selectedIds.size > 0 && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-30 flex items-center gap-3 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-2xl">
          <span className="text-sm font-semibold">{selectedIds.size} selected</span>
          <div className="w-px h-5 bg-slate-700" />
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
                  onChange={e => setSelectedIds(e.target.checked ? new Set(deals.map(d => d.id)) : new Set())}
                  className="rounded border-slate-300 text-indigo-600"
                />
              </th>
              {colHeader('Title', 'title')}
              {colHeader('Contact')}
              {colHeader('Stage')}
              {colHeader('Status', 'status')}
              {colHeader('Value', 'value')}
              {colHeader('Probability', 'probability')}
              {colHeader('Expected Close', 'expectedCloseAt')}
              {colHeader('Assigned To')}
              {colHeader('Last Activity', 'lastActivityAt')}
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
            ) : deals.length === 0 ? (
              <tr>
                <td colSpan={11} className="px-6 py-16 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <Target className="h-12 w-12 text-slate-200" />
                    <p className="text-sm font-semibold text-slate-500">No deals found</p>
                    <p className="text-xs text-slate-400">Try adjusting your filters or create a new deal</p>
                  </div>
                </td>
              </tr>
            ) : (
              deals.map(deal => {
                const isSelected = selectedIds.has(deal.id);
                return (
                  <tr
                    key={deal.id}
                    onClick={() => onRowClick(deal)}
                    className={`hover:bg-slate-50 cursor-pointer transition-colors ${isSelected ? 'bg-indigo-50/50' : ''}`}
                  >
                    <td className="px-4 py-4" onClick={e => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={e => setSelectedIds(prev => {
                          const next = new Set(prev);
                          e.target.checked ? next.add(deal.id) : next.delete(deal.id);
                          return next;
                        })}
                        className="rounded border-slate-300 text-indigo-600"
                      />
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex flex-col">
                        <span className="font-semibold text-slate-900 truncate max-w-[200px]">{deal.title}</span>
                        {deal.company?.name && (
                          <span className="text-xs text-slate-500 mt-0.5">{deal.company.name}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      {deal.contact ? (
                        <div className="flex items-center gap-2">
                          <div className="h-6 w-6 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 text-xs font-bold flex-shrink-0">
                            {deal.contact.firstName.charAt(0)}
                          </div>
                          <span className="text-slate-700 whitespace-nowrap">{deal.contact.firstName} {deal.contact.lastName ?? ''}</span>
                        </div>
                      ) : <span className="text-slate-400">—</span>}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-1.5">
                        {deal.stage?.color && <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: deal.stage.color }} />}
                        <span className="text-xs font-medium text-slate-700">{deal.stage?.name ?? '—'}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border capitalize whitespace-nowrap ${getStatusBadgeStyles(deal.status)}`}>
                        {deal.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`text-sm font-semibold ${deal.status === 'won' ? 'text-emerald-600' : 'text-slate-800'}`}>
                        {formatCurrency(deal.value, deal.currency ?? currency)}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-12 h-1.5 bg-slate-100 rounded-full overflow-hidden flex-shrink-0">
                          <div className={`h-full rounded-full ${getProbabilityColor(deal.probability)}`} style={{ width: `${deal.probability}%` }} />
                        </div>
                        <span className="text-xs font-bold text-slate-500">{deal.probability}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span className="text-sm text-slate-700 whitespace-nowrap">
                        {deal.expectedCloseAt ? format(new Date(deal.expectedCloseAt), 'MMM dd, yyyy') : '—'}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      {deal.assignedTo ? (
                        <div className="flex items-center gap-2">
                          <div className="h-6 w-6 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 text-xs font-bold flex-shrink-0">
                            {deal.assignedTo.firstName.charAt(0)}
                          </div>
                          <span className="text-xs text-slate-700 whitespace-nowrap">{deal.assignedTo.firstName}</span>
                        </div>
                      ) : <span className="text-slate-400 text-xs">Unassigned</span>}
                    </td>
                    <td className="px-4 py-4">
                      <span className="text-xs text-slate-500 whitespace-nowrap">
                        {deal.lastActivityAt ? formatDistanceToNow(new Date(deal.lastActivityAt), { addSuffix: true }) : '—'}
                      </span>
                    </td>
                    <td className="px-4 py-4" onClick={e => e.stopPropagation()}>
                      <ActionsMenu deal={deal} onEdit={() => onEdit(deal)} onDelete={() => onDelete(deal)} />
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between px-2 text-sm text-slate-600">
        <div>
          Showing <span className="font-semibold text-slate-900">{Math.min((pagination.page - 1) * pagination.limit + 1, pagination.total)}</span> to{' '}
          <span className="font-semibold text-slate-900">{Math.min(pagination.page * pagination.limit, pagination.total)}</span> of{' '}
          <span className="font-semibold text-slate-900">{pagination.total}</span> deals
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

function ActionsMenu({ deal, onEdit, onDelete }: { deal: Deal; onEdit: () => void; onDelete: () => void }) {
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
            <button onClick={() => { onDelete(); setOpen(false); }} className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50">Delete</button>
          </div>
        </>
      )}
    </div>
  );
}
