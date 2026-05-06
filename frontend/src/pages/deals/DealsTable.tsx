import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { MoreHorizontal, User, AlertCircle } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import type { Deal, PipelineStage } from '@/types/api.types.ts';
import * as dealsApi from '@/api/deals.api.ts';
import { Button } from '@/components/ui/Button.tsx';
import { Badge } from '@/components/ui/Badge.tsx';
import { Table } from '@/components/ui/Table.tsx';
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
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const qc = useQueryClient();

  const bulkDeleteMutation = useMutation({
    mutationFn: async (ids: string[]) => Promise.all(ids.map(id => dealsApi.deleteDeal(id))),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['deals'] });
      setSelectedIds([]);
    },
  });

  const columns = [
    {
      header: 'Deal Title',
      accessor: (deal: Deal) => (
        <div className="flex flex-col min-w-[200px]">
          <div className="flex items-center gap-2">
            <span className="font-black text-slate-900 dark:text-white truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{deal.title}</span>
            {deal.status === 'won' && <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px] shadow-emerald-500/50" />}
          </div>
          {deal.company?.name && (
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{deal.company.name}</span>
          )}
        </div>
      ),
      sortable: true,
      sortKey: 'title',
    },
    {
      header: 'Contact',
      accessor: (deal: Deal) => (
        <div className="flex items-center gap-2.5">
          <div className="h-7 w-7 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 dark:text-slate-400 text-[10px] font-black border border-slate-200 dark:border-slate-700">
            {deal.contact?.firstName.charAt(0) || <User className="h-3 w-3" />}
          </div>
          <span className="text-sm font-bold text-slate-700 dark:text-slate-300 whitespace-nowrap">
            {deal.contact ? `${deal.contact.firstName} ${deal.contact.lastName || ''}` : 'No Contact'}
          </span>
        </div>
      ),
    },
    {
      header: 'Stage',
      accessor: (deal: Deal) => (
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full" style={{ backgroundColor: deal.stage?.color || '#cbd5e1' }} />
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-400">{deal.stage?.name || '—'}</span>
        </div>
      ),
    },
    {
      header: 'Status',
      accessor: (deal: Deal) => (
        <Badge variant={deal.status === 'won' ? 'success' : deal.status === 'lost' ? 'error' : 'info'} className="whitespace-nowrap">
          {deal.status.replace('_', ' ')}
        </Badge>
      ),
      sortable: true,
      sortKey: 'status',
    },
    {
      header: 'Value',
      accessor: (deal: Deal) => (
        <span className={`text-sm font-black tracking-tight ${deal.status === 'won' ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-900 dark:text-white'}`}>
          {formatCurrency(deal.value, deal.currency || currency)}
        </span>
      ),
      sortable: true,
      sortKey: 'value',
    },
    {
      header: 'Win Prob',
      accessor: (deal: Deal) => (
        <div className="flex items-center gap-2">
          <div className="w-10 h-1 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden shrink-0">
            <div className={`h-full rounded-full ${getProbabilityColor(deal.probability)}`} style={{ width: `${deal.probability}%` }} />
          </div>
          <span className="text-[10px] font-black text-slate-500">{deal.probability}%</span>
        </div>
      ),
      sortable: true,
      sortKey: 'probability',
    },
    {
      header: 'Expected Close',
      accessor: (deal: Deal) => (
        <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest whitespace-nowrap">
          {deal.expectedCloseAt ? format(new Date(deal.expectedCloseAt), 'MMM dd, yyyy') : '—'}
        </span>
      ),
      sortable: true,
      sortKey: 'expectedCloseAt',
    },
    {
      header: 'Activity',
      accessor: (deal: Deal) => (
        <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest whitespace-nowrap">
          {deal.lastActivityAt ? formatDistanceToNow(new Date(deal.lastActivityAt), { addSuffix: true }) : '—'}
        </span>
      ),
      sortable: true,
      sortKey: 'lastActivityAt',
    },
    {
      header: '',
      accessor: (deal: Deal) => (
        <div className="flex justify-end" onClick={e => e.stopPropagation()}>
          <ActionsMenu deal={deal} onEdit={() => onEdit(deal)} onDelete={() => onDelete(deal)} />
        </div>
      ),
      className: "w-10",
    }
  ];

  return (
    <Table
      columns={columns as any}
      data={deals}
      isLoading={isLoading}
      onRowClick={onRowClick}
      selection={{
        selectedIds,
        onSelectionChange: setSelectedIds
      }}
      pagination={pagination}
      sort={sort}
      bulkActions={
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => bulkDeleteMutation.mutate(selectedIds)}
          className="bg-red-500/10 border-red-500/20 text-red-500 hover:bg-red-500 hover:text-white"
        >
          Delete Selected
        </Button>
      }
      emptyState={{
        title: "No deals found",
        description: "Adjust your filters or create a new deal to track your opportunities.",
        variant: 'deals'
      }}
    />
  );
}

function ActionsMenu({ deal, onEdit, onDelete }: { deal: Deal; onEdit: () => void; onDelete: () => void }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <Button variant="ghost" size="icon" onClick={() => setOpen(v => !v)} className="h-8 w-8 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700">
        <MoreHorizontal className="h-4 w-4" />
      </Button>
      {open && (
        <>
          <div className="fixed inset-0 z-20" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full z-30 mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-2xl py-2 w-48 animate-in fade-in slide-in-from-top-1 duration-150">
            <button onClick={() => { onEdit(); setOpen(false); }} className="w-full text-left px-4 py-2.5 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors uppercase tracking-widest">Edit Deal</button>
            <div className="h-px bg-slate-100 dark:bg-slate-700 my-1" />
            <button onClick={() => { onDelete(); setOpen(false); }} className="w-full text-left px-4 py-2.5 text-xs font-bold text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors uppercase tracking-widest">Delete Deal</button>
          </div>
        </>
      )}
    </div>
  );
}
