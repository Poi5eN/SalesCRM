import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { MoreHorizontal, ChevronDown, AlertTriangle, User } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import type { Lead, PipelineStage } from '@/types/api.types.ts';
import * as leadsApi from '@/api/leads.api.ts';
import { Button } from '@/components/ui/Button.tsx';
import { Badge } from '@/components/ui/Badge.tsx';
import { Table } from '@/components/ui/Table.tsx';
import { getScoreColor, SOURCE_LABELS } from './leadUtils.ts';
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

export function LeadsTable({ leads, stages, isLoading, pagination, sort, onRowClick, onEdit, onDelete }: LeadsTableProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [openStageMenu, setOpenStageMenu] = useState<string | null>(null);
  const qc = useQueryClient();

  const updateStageMutation = useMutation({
    mutationFn: ({ id, stageId }: { id: string; stageId: string }) => leadsApi.updateLead(id, { stageId }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['leads'] }),
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: async (ids: string[]) => Promise.all(ids.map(id => leadsApi.deleteLead(id))),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['leads'] });
      setSelectedIds([]);
    },
  });

  const columns = [
    {
      header: 'Lead Title',
      accessor: (lead: Lead) => (
        <div className="flex flex-col min-w-[200px]">
          <div className="flex items-center gap-2">
            {(lead as any).isStale && <AlertTriangle className="h-3.5 w-3.5 text-amber-500 shrink-0" />}
            <span className="font-black text-slate-900 dark:text-white truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{lead.title}</span>
          </div>
          {lead.company?.name && (
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{lead.company.name}</span>
          )}
        </div>
      ),
      sortable: true,
      sortKey: 'title',
    },
    {
      header: 'Contact',
      accessor: (lead: Lead) => (
        <div className="flex items-center gap-2.5">
          <div className="h-7 w-7 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 dark:text-slate-400 text-[10px] font-black border border-slate-200 dark:border-slate-700">
            {lead.contact?.firstName.charAt(0) || <User className="h-3 w-3" />}
          </div>
          <span className="text-sm font-bold text-slate-700 dark:text-slate-300 whitespace-nowrap">
            {lead.contact ? `${lead.contact.firstName} ${lead.contact.lastName || ''}` : 'No Contact'}
          </span>
        </div>
      ),
    },
    {
      header: 'Stage',
      accessor: (lead: Lead) => (
        <div className="relative" onClick={e => e.stopPropagation()}>
          <button
            onClick={() => setOpenStageMenu(openStageMenu === lead.id ? null : lead.id)}
            className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg border bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-800 transition-all"
          >
            <div className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: lead.stage?.color || '#cbd5e1' }} />
            <span className="max-w-[80px] truncate">{lead.stage?.name || 'Unknown'}</span>
            <ChevronDown className="h-3 w-3 opacity-50" />
          </button>
          {openStageMenu === lead.id && (
            <>
              <div className="fixed inset-0 z-20" onClick={() => setOpenStageMenu(null)} />
              <div className="absolute top-full left-0 z-30 mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-2xl min-w-[160px] py-2 animate-in fade-in slide-in-from-top-1 duration-150">
                {stages.map(s => (
                  <button
                    key={s.id}
                    onClick={() => { updateStageMutation.mutate({ id: lead.id, stageId: s.id }); setOpenStageMenu(null); }}
                    className={`w-full flex items-center gap-3 px-4 py-2 text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors ${s.id === lead.stageId ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-500 dark:text-slate-400'}`}
                  >
                    <div className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: s.color || '#6366f1' }} />
                    {s.name}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      ),
    },
    {
      header: 'Priority',
      accessor: (lead: Lead) => (
        <Badge variant="priority" priority={lead.priority as any}>
          {lead.priority}
        </Badge>
      ),
    },
    {
      header: 'Source',
      accessor: (lead: Lead) => (
        <Badge variant="outline" className="bg-slate-50 dark:bg-slate-900/50 border-none">
          {SOURCE_LABELS[lead.source] || lead.source}
        </Badge>
      ),
    },
    {
      header: 'Value',
      accessor: (lead: Lead) => (
        <span className="text-sm font-black text-slate-900 dark:text-white tracking-tight">
          {lead.estimatedValue ? formatCurrency(lead.estimatedValue, lead.currency) : '—'}
        </span>
      ),
      sortable: true,
      sortKey: 'estimatedValue',
    },
    {
      header: 'Activity',
      accessor: (lead: Lead) => (
        <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest whitespace-nowrap">
          {lead.lastActivityAt ? formatDistanceToNow(new Date(lead.lastActivityAt), { addSuffix: true }) : '—'}
        </span>
      ),
      sortable: true,
      sortKey: 'lastActivityAt',
    },
    {
      header: 'Score',
      accessor: (lead: Lead) => (
        <div className="flex items-center gap-2">
          <div className="w-10 h-1 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden shrink-0">
            <div className={`h-full rounded-full ${getScoreColor(lead.score)}`} style={{ width: `${lead.score}%` }} />
          </div>
          <span className="text-[10px] font-black text-slate-500">{lead.score}</span>
        </div>
      ),
      sortable: true,
      sortKey: 'score',
    },
    {
      header: '',
      accessor: (lead: Lead) => (
        <div className="flex justify-end" onClick={e => e.stopPropagation()}>
          <ActionsMenu lead={lead} onEdit={() => onEdit(lead)} onDelete={() => onDelete(lead)} />
        </div>
      ),
      className: "w-10",
    }
  ];

  return (
    <Table
      columns={columns as any}
      data={leads}
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
        title: "No leads found",
        description: "Adjust your filters or create a new lead to get started.",
        variant: 'leads'
      }}
    />
  );
}

function ActionsMenu({ lead, onEdit, onDelete }: { lead: Lead; onEdit: () => void; onDelete: () => void }) {
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
            <button onClick={() => { onEdit(); setOpen(false); }} className="w-full text-left px-4 py-2.5 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors uppercase tracking-widest">Edit Lead</button>
            {!lead.isConverted && <button onClick={() => { setOpen(false); }} className="w-full text-left px-4 py-2.5 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors uppercase tracking-widest">Convert to Deal</button>}
            <div className="h-px bg-slate-100 dark:bg-slate-700 my-1" />
            <button onClick={() => { onDelete(); setOpen(false); }} className="w-full text-left px-4 py-2.5 text-xs font-bold text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors uppercase tracking-widest">Delete Lead</button>
          </div>
        </>
      )}
    </div>
  );
}
