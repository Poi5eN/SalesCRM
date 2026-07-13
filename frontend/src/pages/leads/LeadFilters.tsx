import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { X, SlidersHorizontal } from 'lucide-react';
import * as pipelineApi from '@/api/pipeline.api.ts';
import * as usersApi from '@/api/users.api.ts';
import * as campaignsApi from '@/api/campaigns.api.ts';
import { Button } from '@/components/ui/Button.tsx';
import { PRIORITY_OPTIONS, SOURCE_OPTIONS } from './leadUtils.ts';

export interface LeadFiltersState {
  stageIds: string[];
  priorities: string[];
  sources: string[];
  assignedToId: string;
  campaignId: string;
  createdAtFrom: string;
  createdAtTo: string;
  minScore: string;
  maxScore: string;
  hasCompany: boolean;
  isStale: boolean;
}

export const DEFAULT_FILTERS: LeadFiltersState = {
  stageIds: [], priorities: [], sources: [], assignedToId: '', campaignId: '',
  createdAtFrom: '', createdAtTo: '', minScore: '', maxScore: '',
  hasCompany: false, isStale: false,
};

export function countActiveFilters(filters: LeadFiltersState): number {
  let count = 0;
  if (filters.stageIds.length) count++;
  if (filters.priorities.length) count++;
  if (filters.sources.length) count++;
  if (filters.assignedToId) count++;
  if (filters.campaignId) count++;
  if (filters.createdAtFrom || filters.createdAtTo) count++;
  if (filters.minScore || filters.maxScore) count++;
  if (filters.hasCompany) count++;
  if (filters.isStale) count++;
  return count;
}

interface LeadFiltersProps {
  open: boolean;
  filters: LeadFiltersState;
  onChange: (filters: LeadFiltersState) => void;
  onClose: () => void;
}

export function LeadFilters({ open, filters, onChange, onClose }: LeadFiltersProps) {
  const { data: stagesData } = useQuery({
    queryKey: ['pipeline-stages', 'lead'],
    queryFn: () => pipelineApi.getStages({ type: 'lead', isActive: true }),
  });
  const { data: usersData } = useQuery({
    queryKey: ['users'],
    queryFn: () => usersApi.getUsers(),
  });
  const { data: campaignsData } = useQuery({
    queryKey: ['campaigns'],
    queryFn: () => campaignsApi.getCampaigns({ limit: 100 }),
  });

  const stages = (stagesData?.data as any) ?? [];
  const users = usersData?.data?.data ?? [];
  const campaigns = campaignsData?.data?.data ?? [];

  function toggleMulti<K extends 'stageIds' | 'priorities' | 'sources'>(key: K, value: string) {
    const current = filters[key] as string[];
    const next = current.includes(value) ? current.filter(v => v !== value) : [...current, value];
    onChange({ ...filters, [key]: next });
  }

  const hasFilters = countActiveFilters(filters) > 0;

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-30 bg-black/20" onClick={onClose} />
      {/* Panel */}
      <div className="fixed right-0 top-0 bottom-0 z-40 w-80 bg-white shadow-2xl flex flex-col">
        <div className="flex items-center justify-between p-5 border-b border-slate-200">
          <div className="flex items-center space-x-2">
            <SlidersHorizontal className="h-5 w-5 text-slate-600" />
            <h3 className="font-bold text-slate-900">Filters</h3>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-lg">
            <X className="h-4 w-4 text-slate-500" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {/* Stage */}
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Stage</p>
            <div className="space-y-2">
              {stages.map((s: any) => (
                <label key={s.id} className="flex items-center space-x-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={filters.stageIds.includes(s.id)}
                    onChange={() => toggleMulti('stageIds', s.id)}
                    className="rounded border-slate-300 text-indigo-600"
                  />
                  <span className="text-sm text-slate-700">{s.name}</span>
                  {s.color && <span className="h-2 w-2 rounded-full" style={{ backgroundColor: s.color }} />}
                </label>
              ))}
            </div>
          </div>

          {/* Priority */}
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Priority</p>
            <div className="space-y-2">
              {PRIORITY_OPTIONS.map(p => (
                <label key={p.value} className="flex items-center space-x-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={filters.priorities.includes(p.value)}
                    onChange={() => toggleMulti('priorities', p.value)}
                    className="rounded border-slate-300 text-indigo-600"
                  />
                  <span className="text-sm text-slate-700">{p.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Source */}
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Source</p>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {SOURCE_OPTIONS.map(s => (
                <label key={s.value} className="flex items-center space-x-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={filters.sources.includes(s.value)}
                    onChange={() => toggleMulti('sources', s.value)}
                    className="rounded border-slate-300 text-indigo-600"
                  />
                  <span className="text-sm text-slate-700">{s.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Assigned To */}
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Assigned To</p>
            <select
              value={filters.assignedToId}
              onChange={e => onChange({ ...filters, assignedToId: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 bg-slate-50"
            >
              <option value="">Anyone</option>
              {users.map((u: any) => (
                <option key={u.id} value={u.id}>{u.firstName} {u.lastName}</option>
              ))}
            </select>
          </div>

          {/* Marketing Campaign */}
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Marketing Campaign</p>
            <select
              value={filters.campaignId}
              onChange={e => onChange({ ...filters, campaignId: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 bg-slate-50"
            >
              <option value="">Any Campaign</option>
              {campaigns.map((c: any) => (
                <option key={c.id} value={c.id}>{c.name} ({c.platform})</option>
              ))}
            </select>
          </div>

          {/* Date Range */}
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Created Between</p>
            <div className="space-y-2">
              <input
                type="date"
                value={filters.createdAtFrom}
                onChange={e => onChange({ ...filters, createdAtFrom: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 bg-slate-50"
              />
              <input
                type="date"
                value={filters.createdAtTo}
                onChange={e => onChange({ ...filters, createdAtTo: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 bg-slate-50"
              />
            </div>
          </div>

          {/* Score Range */}
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Score Range (0–100)</p>
            <div className="flex items-center space-x-2">
              <input
                type="number"
                min={0} max={100}
                value={filters.minScore}
                onChange={e => onChange({ ...filters, minScore: e.target.value })}
                placeholder="Min"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none bg-slate-50"
              />
              <span className="text-slate-400">—</span>
              <input
                type="number"
                min={0} max={100}
                value={filters.maxScore}
                onChange={e => onChange({ ...filters, maxScore: e.target.value })}
                placeholder="Max"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none bg-slate-50"
              />
            </div>
          </div>

          {/* Toggles */}
          <div className="space-y-3">
            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-sm font-medium text-slate-700">Has Company</span>
              <button
                type="button"
                onClick={() => onChange({ ...filters, hasCompany: !filters.hasCompany })}
                className={`relative inline-flex h-5 w-9 rounded-full transition-colors ${filters.hasCompany ? 'bg-indigo-600' : 'bg-slate-200'}`}
              >
                <span className={`absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${filters.hasCompany ? 'translate-x-4' : ''}`} />
              </button>
            </label>
            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-sm font-medium text-slate-700">Stale Leads Only</span>
              <button
                type="button"
                onClick={() => onChange({ ...filters, isStale: !filters.isStale })}
                className={`relative inline-flex h-5 w-9 rounded-full transition-colors ${filters.isStale ? 'bg-amber-500' : 'bg-slate-200'}`}
              >
                <span className={`absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${filters.isStale ? 'translate-x-4' : ''}`} />
              </button>
            </label>
          </div>
        </div>

        <div className="p-5 border-t border-slate-200 flex space-x-3">
          <Button
            variant="outline"
            className="flex-1"
            disabled={!hasFilters}
            onClick={() => onChange(DEFAULT_FILTERS)}
          >
            Clear All
          </Button>
          <Button className="flex-1" onClick={onClose}>Apply</Button>
        </div>
      </div>
    </>
  );
}
