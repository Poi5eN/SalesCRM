import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { Plus, Download, LayoutGrid, List, Search, X } from 'lucide-react';
import * as dealsApi from '@/api/deals.api.ts';
import * as pipelineApi from '@/api/pipeline.api.ts';
import { Button } from '@/components/ui/Button.tsx';
import { useDebounce } from '@/hooks/useDebounce.ts';
import { useConfirm } from '@/hooks/useConfirm.ts';
import { useAuth } from '@/hooks/useAuth.ts';
import type { Deal, PipelineStage } from '@/types/api.types.ts';

import { DealsTable } from './DealsTable.tsx';
import { DealsKanban } from './DealsKanban.tsx';
import { DealForm } from './DealForm.tsx';
import { DealDetailModal } from './DealDetailModal.tsx';
import { DealForecast } from './DealForecast.tsx';

type ViewMode = 'table' | 'kanban';

export default function DealsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { tenant } = useAuth();
  const confirm = useConfirm();
  const qc = useQueryClient();

  const view: ViewMode = (searchParams.get('view') as ViewMode) ?? 'table';
  const page = parseInt(searchParams.get('page') ?? '1');
  const sortBy = searchParams.get('sortBy') ?? 'createdAt';
  const sortOrder = (searchParams.get('sortOrder') ?? 'desc') as 'asc' | 'desc';
  const statusFilter = searchParams.get('status') ?? 'all';

  const [search, setSearch] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editDeal, setEditDeal] = useState<Deal | null>(null);
  const [detailDeal, setDetailDeal] = useState<Deal | null>(null);
  const [formDefaultStageId, setFormDefaultStageId] = useState<string | undefined>();

  const debouncedSearch = useDebounce(search, 350);
  const limit = 25;

  const queryParams: any = {
    page,
    limit,
    sortBy,
    sortOrder,
    ...(debouncedSearch ? { search: debouncedSearch } : {}),
    ...(statusFilter !== 'all' ? { status: statusFilter } : {}),
  };

  const { data: dealsData, isLoading: dealsLoading } = useQuery({
    queryKey: ['deals', queryParams],
    queryFn: () => dealsApi.getDeals(queryParams),
    enabled: view === 'table',
  });

  const { data: boardData, isLoading: boardLoading } = useQuery({
    queryKey: ['deals', 'board'],
    queryFn: () => dealsApi.getDealBoard(),
    enabled: view === 'kanban',
  });

  const { data: stagesData } = useQuery({
    queryKey: ['pipeline-stages', 'deal'],
    queryFn: () => pipelineApi.getStages({ type: 'deal', isActive: true }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => dealsApi.deleteDeal(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['deals'] }),
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

  const handleDelete = async (deal: Deal) => {
    const ok = await confirm.confirm(
      `Are you sure you want to delete "${deal.title}"? This action cannot be undone.`,
      'Delete Deal',
      'danger'
    );
    if (ok) deleteMutation.mutate(deal.id);
  };

  const handleOpenForm = (deal?: Deal, stageId?: string) => {
    setEditDeal(deal ?? null);
    setFormDefaultStageId(stageId);
    setFormOpen(true);
  };

  const deals: Deal[] = dealsData?.data?.data ?? [];
  const total: number = dealsData?.data?.meta?.total ?? 0;
  const stages: PipelineStage[] = (stagesData?.data as any) ?? [];
  const board: any[] = boardData?.data ?? [];

  const TABS = [
    { id: 'all', label: 'All Deals' },
    { id: 'open', label: 'Open' },
    { id: 'won', label: 'Won' },
    { id: 'lost', label: 'Lost' },
    { id: 'on_hold', label: 'On Hold' },
  ];

  return (
    <div className="space-y-5">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Deals</h1>
          <p className="text-slate-500 text-sm">Manage your sales pipeline and forecast.</p>
        </div>
        <div className="flex items-center gap-2">
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

          <Button size="sm" onClick={() => handleOpenForm()}>
            <Plus className="mr-1.5 h-3.5 w-3.5" /> New Deal
          </Button>
        </div>
      </div>

      <DealForecast />

      {view === 'table' && (
        <div className="flex items-center justify-between">
          <div className="flex gap-2">
            {TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => { updateParam('status', tab.id); updateParam('page', '1'); }}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                  statusFilter === tab.id 
                    ? 'bg-indigo-100 text-indigo-700' 
                    : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3 bg-white border border-slate-200 rounded-xl px-4 py-2 shadow-sm w-64">
            <Search className="h-4 w-4 text-slate-400 flex-shrink-0" />
            <input
              type="text"
              placeholder="Search deals..."
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
        </div>
      )}

      {view === 'table' ? (
        <DealsTable
          deals={deals}
          stages={stages}
          isLoading={dealsLoading}
          pagination={{ page, limit, total, onPageChange }}
          sort={{ key: sortBy, order: sortOrder, onSort }}
          onRowClick={(deal) => setDetailDeal(deal)}
          onEdit={(deal) => handleOpenForm(deal)}
          onDelete={handleDelete}
          currency={tenant?.currency}
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
            <DealsKanban
              columns={board}
              onCardClick={(deal) => setDetailDeal(deal)}
              onAddDeal={(stageId) => handleOpenForm(undefined, stageId)}
              currency={tenant?.currency}
            />
          )}
        </div>
      )}

      {formOpen && (
        <DealForm
          deal={editDeal}
          defaultStageId={formDefaultStageId}
          onClose={() => { setFormOpen(false); setEditDeal(null); setFormDefaultStageId(undefined); }}
        />
      )}

      {detailDeal && (
        <DealDetailModal
          deal={detailDeal}
          onClose={() => setDetailDeal(null)}
          onEdit={() => { handleOpenForm(detailDeal); setDetailDeal(null); }}
        />
      )}
    </div>
  );
}
