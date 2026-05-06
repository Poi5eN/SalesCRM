import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { Plus, Filter, Download, LayoutGrid, List, Search, X } from 'lucide-react';
import * as leadsApi from '@/api/leads.api.ts';
import * as pipelineApi from '@/api/pipeline.api.ts';
import { Button } from '@/components/ui/Button.tsx';
import { useDebounce } from '@/hooks/useDebounce.ts';
import { useConfirm } from '@/hooks/useConfirm.ts';
import { useAuth } from '@/hooks/useAuth.ts';
import type { Lead, PipelineStage } from '@/types/api.types.ts';

import { LeadsTable } from './LeadsTable.tsx';
import { LeadsKanban } from './LeadsKanban.tsx';
import { LeadForm } from './LeadForm.tsx';
import { LeadFilters, DEFAULT_FILTERS, countActiveFilters } from './LeadFilters.tsx';
import { LeadDetailModal } from './LeadDetailModal.tsx';
import type { LeadFiltersState } from './LeadFilters.tsx';

type ViewMode = 'table' | 'kanban';

const LeadsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { tenant } = useAuth();
  const confirm = useConfirm();
  const qc = useQueryClient();

  // Derive state from URL params
  const view: ViewMode = (searchParams.get('view') as ViewMode) ?? 'table';
  const page = parseInt(searchParams.get('page') ?? '1');
  const sortBy = searchParams.get('sortBy') ?? 'createdAt';
  const sortOrder = (searchParams.get('sortOrder') ?? 'desc') as 'asc' | 'desc';

  // Local state
  const [search, setSearch] = useState('');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [filters, setFilters] = useState<LeadFiltersState>(DEFAULT_FILTERS);
  const [formOpen, setFormOpen] = useState(false);
  const [editLead, setEditLead] = useState<Lead | null>(null);
  const [detailLead, setDetailLead] = useState<Lead | null>(null);
  const [formDefaultStageId, setFormDefaultStageId] = useState<string | undefined>();
  const [convertLead, setConvertLead] = useState<Lead | null>(null);

  const debouncedSearch = useDebounce(search, 350);
  const activeFilterCount = countActiveFilters(filters);
  const limit = 25;

  // Build query params
  const queryParams: any = {
    page,
    limit,
    sortBy,
    sortOrder,
    ...(debouncedSearch ? { search: debouncedSearch } : {}),
    ...(filters.stageIds.length === 1 ? { stageId: filters.stageIds[0] } : {}),
    ...(filters.priorities.length === 1 ? { priority: filters.priorities[0] } : {}),
    ...(filters.sources.length === 1 ? { source: filters.sources[0] } : {}),
    ...(filters.assignedToId ? { assignedToId: filters.assignedToId } : {}),
    ...(filters.createdAtFrom ? { createdAtFrom: new Date(filters.createdAtFrom).toISOString() } : {}),
    ...(filters.createdAtTo ? { createdAtTo: new Date(filters.createdAtTo + 'T23:59:59').toISOString() } : {}),
    ...(filters.isStale ? { isStale: 'true' } : {}),
  };

  const { data: leadsData, isLoading: leadsLoading } = useQuery({
    queryKey: ['leads', queryParams],
    queryFn: () => leadsApi.getLeads(queryParams),
    enabled: view === 'table',
  });

  const { data: boardData, isLoading: boardLoading } = useQuery({
    queryKey: ['leads', 'board'],
    queryFn: () => leadsApi.getLeadBoard(),
    enabled: view === 'kanban',
  });

  const { data: stagesData } = useQuery({
    queryKey: ['pipeline-stages', 'lead'],
    queryFn: () => pipelineApi.getStages({ type: 'lead', isActive: true }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => leadsApi.deleteLead(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['leads'] }),
  });

  const updateParam = useCallback((key: string, value: string | null) => {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      if (value === null) next.delete(key);
      else next.set(key, value);
      return next;
    });
  }, [setSearchParams]);

  const setView = (v: ViewMode) => updateParam('view', v);
  const onPageChange = (p: number) => updateParam('page', String(p));
  const onSort = (key: string) => {
    if (sortBy === key) updateParam('sortOrder', sortOrder === 'asc' ? 'desc' : 'asc');
    else { updateParam('sortBy', key); updateParam('sortOrder', 'asc'); }
    updateParam('page', '1');
  };

  const handleDelete = async (lead: Lead) => {
    const ok = await confirm.confirm(
      `Are you sure you want to delete "${lead.title}"? This action cannot be undone.`,
      'Delete Lead',
      'danger'
    );
    if (ok) deleteMutation.mutate(lead.id);
  };

  const handleOpenForm = (lead?: Lead, stageId?: string) => {
    setEditLead(lead ?? null);
    setFormDefaultStageId(stageId);
    setFormOpen(true);
  };

  const leads: Lead[] = leadsData?.data?.data ?? [];
  const total: number = leadsData?.data?.meta?.total ?? 0;
  const stages: PipelineStage[] = (stagesData?.data as any) ?? [];
  const board: any[] = boardData?.data ?? [];

  return (
    <div className="space-y-5">
      {/* Page header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Leads</h1>
          <p className="text-slate-500 text-sm">Manage and convert your sales opportunities.</p>
        </div>
        <div className="flex items-center gap-2">
          {/* View toggle */}
          <div className="flex items-center bg-slate-100 rounded-lg p-1">
            <button
              onClick={() => setView('table')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${view === 'table' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              <List className="h-3.5 w-3.5" /> Table
            </button>
            <button
              onClick={() => setView('kanban')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${view === 'kanban' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              <LayoutGrid className="h-3.5 w-3.5" /> Kanban
            </button>
          </div>

          <Button variant="outline" size="sm">
            <Download className="mr-1.5 h-3.5 w-3.5" /> Export
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setFiltersOpen(true)}
            className="relative"
          >
            <Filter className="mr-1.5 h-3.5 w-3.5" />
            Filter
            {activeFilterCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 h-4 w-4 rounded-full bg-indigo-600 text-white text-[9px] font-bold flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </Button>

          <Button size="sm" onClick={() => handleOpenForm()}>
            <Plus className="mr-1.5 h-3.5 w-3.5" /> New Lead
          </Button>
        </div>
      </div>

      {/* Active filters chips */}
      {activeFilterCount > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          {filters.isStale && <FilterChip label="Stale leads" onRemove={() => setFilters(f => ({ ...f, isStale: false }))} />}
          {filters.hasCompany && <FilterChip label="Has company" onRemove={() => setFilters(f => ({ ...f, hasCompany: false }))} />}
          {filters.assignedToId && <FilterChip label="Assigned to filter" onRemove={() => setFilters(f => ({ ...f, assignedToId: '' }))} />}
          {filters.priorities.map(p => <FilterChip key={p} label={`Priority: ${p}`} onRemove={() => setFilters(f => ({ ...f, priorities: f.priorities.filter(x => x !== p) }))} />)}
          {filters.sources.map(s => <FilterChip key={s} label={`Source: ${s}`} onRemove={() => setFilters(f => ({ ...f, sources: f.sources.filter(x => x !== s) }))} />)}
          {filters.stageIds.map(id => {
            const stage = stages.find(s => s.id === id);
            return stage ? <FilterChip key={id} label={`Stage: ${stage.name}`} onRemove={() => setFilters(f => ({ ...f, stageIds: f.stageIds.filter(x => x !== id) }))} /> : null;
          })}
          <button
            onClick={() => setFilters(DEFAULT_FILTERS)}
            className="text-xs font-semibold text-red-500 hover:text-red-700 transition-colors ml-1"
          >
            Clear all
          </button>
        </div>
      )}

      {/* Search (table view only) */}
      {view === 'table' && (
        <div className="flex items-center gap-3 bg-white border border-slate-200 rounded-xl px-4 py-3 shadow-sm">
          <Search className="h-4 w-4 text-slate-400 flex-shrink-0" />
          <input
            type="text"
            placeholder="Search leads by title..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="flex-1 text-sm bg-transparent focus:outline-none text-slate-900 placeholder:text-slate-400"
          />
          {search && (
            <button onClick={() => setSearch('')} className="text-slate-400 hover:text-slate-600">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      )}

      {/* Content */}
      {view === 'table' ? (
        <LeadsTable
          leads={leads}
          stages={stages}
          isLoading={leadsLoading}
          pagination={{ page, limit, total, onPageChange }}
          sort={{ key: sortBy, order: sortOrder, onSort }}
          onRowClick={(lead) => setDetailLead(lead)}
          onEdit={(lead) => handleOpenForm(lead)}
          onDelete={handleDelete}
        />
      ) : (
        <div>
          {boardLoading ? (
            <div className="flex gap-4">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="w-72 flex-shrink-0 space-y-3 animate-pulse">
                  <div className="h-6 bg-slate-200 rounded w-3/4" />
                  {[1, 2, 3].map(j => (
                    <div key={j} className="h-24 bg-slate-100 rounded-xl" />
                  ))}
                </div>
              ))}
            </div>
          ) : (
            <LeadsKanban
              columns={board}
              onCardClick={(lead) => setDetailLead(lead)}
              onAddLead={(stageId) => handleOpenForm(undefined, stageId)}
              currency={tenant?.currency}
            />
          )}
        </div>
      )}

      {/* Filter Panel */}
      <LeadFilters
        open={filtersOpen}
        filters={filters}
        onChange={setFilters}
        onClose={() => setFiltersOpen(false)}
      />

      {/* Lead Form Modal */}
      {formOpen && (
        <LeadForm
          lead={editLead}
          defaultStageId={formDefaultStageId}
          onClose={() => { setFormOpen(false); setEditLead(null); setFormDefaultStageId(undefined); }}
        />
      )}

      {/* Lead Detail Slide-over */}
      {detailLead && (
        <LeadDetailModal
          lead={detailLead}
          onClose={() => setDetailLead(null)}
          onEdit={() => { handleOpenForm(detailLead); setDetailLead(null); }}
          onConvert={() => { setConvertLead(detailLead); setDetailLead(null); }}
        />
      )}
    </div>
  );
};

function FilterChip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="flex items-center gap-1.5 text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-200 px-2.5 py-1 rounded-full">
      {label}
      <button onClick={onRemove} className="hover:text-indigo-900">
        <X className="h-3 w-3" />
      </button>
    </span>
  );
}

export default LeadsPage;
