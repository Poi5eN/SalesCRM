import { useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { Plus, Search, X, Mail, Phone, Calendar, FileText, MessageSquare, Briefcase, Users, Target, ChevronDown, ChevronRight, Bot } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import * as commsApi from '@/api/communications.api.ts';
import { Button } from '@/components/ui/Button.tsx';
import { useDebounce } from '@/hooks/useDebounce.ts';
import { useUIStore } from '@/store/ui.store.ts';
import React from 'react';

// Add custom WhatsApp Icon component since it's not natively in lucide core set usually
const WhatsAppIcon = (props: any) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
  </svg>
);

export default function CommunicationsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { openCommModal } = useUIStore();

  const page = parseInt(searchParams.get('page') ?? '1');
  const typeFilter = searchParams.get('type') ?? 'all';
  const dirFilter = searchParams.get('direction') ?? 'all';

  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 350);
  const limit = 25;

  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const queryParams: any = {
    page,
    limit,
    sortBy: 'occurredAt',
    sortOrder: 'desc',
    ...(debouncedSearch ? { search: debouncedSearch } : {}),
    ...(typeFilter !== 'all' ? { type: typeFilter } : {}),
    ...(dirFilter !== 'all' ? { direction: dirFilter } : {}),
  };

  const { data: commsData, isLoading } = useQuery({
    queryKey: ['communications', queryParams],
    queryFn: () => commsApi.getCommunications(queryParams),
  });

  const updateParam = useCallback((key: string, value: string | null) => {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      if (value === null) next.delete(key);
      else next.set(key, value);
      if (key !== 'page') next.set('page', '1');
      return next;
    });
  }, [setSearchParams]);

  const toggleRow = (id: string) => {
    setExpandedRows(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const comms: any[] = commsData?.data?.data ?? [];
  const total: number = commsData?.data?.meta?.total ?? 0;
  const totalPages = Math.ceil(total / limit);

  const CommIcon = ({ type }: { type: string }) => {
    switch (type) {
      case 'email': return <Mail className="h-4 w-4 text-blue-500" />;
      case 'call': return <Phone className="h-4 w-4 text-emerald-500" />;
      case 'meeting': return <Calendar className="h-4 w-4 text-indigo-500" />;
      case 'sms': return <MessageSquare className="h-4 w-4 text-amber-500" />;
      case 'whatsapp': return <WhatsAppIcon className="h-4 w-4 text-green-500" />;
      case 'note': return <FileText className="h-4 w-4 text-slate-500" />;
      default: return <FileText className="h-4 w-4 text-slate-400" />;
    }
  };

  const TYPES = ['all', 'email', 'call', 'meeting', 'note', 'sms', 'whatsapp'];
  const DIRECTIONS = ['all', 'inbound', 'outbound', 'internal'];

  return (
    <div className="space-y-5">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Communications</h1>
          <p className="text-slate-500 text-sm">Unified history of all interactions across the platform.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button size="sm" onClick={() => openCommModal()}>
            <Plus className="mr-1.5 h-3.5 w-3.5" /> Log Communication
          </Button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-3 p-4 bg-white border border-slate-200 rounded-xl shadow-sm">
        <div className="flex-1 flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5">
          <Search className="h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search communications..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full text-sm bg-transparent focus:outline-none"
          />
          {search && <button onClick={() => setSearch('')}><X className="h-4 w-4 text-slate-400" /></button>}
        </div>

        <select
          value={typeFilter}
          onChange={e => updateParam('type', e.target.value)}
          className="text-sm bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 outline-none"
        >
          {TYPES.map(t => <option key={t} value={t}>{t === 'all' ? 'All Types' : t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
        </select>

        <select
          value={dirFilter}
          onChange={e => updateParam('direction', e.target.value)}
          className="text-sm bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 outline-none"
        >
          {DIRECTIONS.map(d => <option key={d} value={d}>{d === 'all' ? 'All Directions' : d.charAt(0).toUpperCase() + d.slice(1)}</option>)}
        </select>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-4 py-3.5 w-10"></th>
              <th className="px-4 py-3.5 w-10"></th>
              <th className="px-4 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider">Subject / Summary</th>
              <th className="px-4 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider">Linked Entity</th>
              <th className="px-4 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider">Direction</th>
              <th className="px-4 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider">Source</th>
              <th className="px-4 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider">Outcome</th>
              <th className="px-4 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isLoading ? (
              <tr><td colSpan={8} className="p-8 text-center text-slate-500">Loading...</td></tr>
            ) : comms.length === 0 ? (
              <tr><td colSpan={8} className="p-8 text-center text-slate-500">No communications found.</td></tr>
            ) : (
              comms.map(comm => {
                const isExpanded = expandedRows.has(comm.id);
                return (
                  <React.Fragment key={comm.id}>
                    <tr
                      onClick={() => toggleRow(comm.id)}
                      className={`hover:bg-slate-50 cursor-pointer transition-colors ${isExpanded ? 'bg-indigo-50/30' : ''}`}
                    >
                      <td className="px-4 py-4 text-slate-400">
                        {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                      </td>
                      <td className="px-4 py-4">
                        <div className="h-8 w-8 rounded-lg bg-slate-100 flex items-center justify-center">
                          <CommIcon type={comm.type} />
                        </div>
                      </td>
                      <td className="px-4 py-4 font-medium text-slate-900 max-w-xs truncate">
                        {comm.subject || comm.summary || 'No subject'}
                      </td>
                      <td className="px-4 py-4">
                        {(comm.lead || comm.deal || comm.contact) ? (
                          <div className="flex items-center gap-1.5 text-sm font-medium text-slate-700">
                            {comm.deal ? <Briefcase className="h-3.5 w-3.5 text-slate-400" /> : comm.contact ? <Users className="h-3.5 w-3.5 text-slate-400" /> : <Target className="h-3.5 w-3.5 text-slate-400" />}
                            <span className="truncate max-w-[150px]">
                              {comm.deal?.title || comm.lead?.title || `${comm.contact?.firstName} ${comm.contact?.lastName}`}
                            </span>
                          </div>
                        ) : <span className="text-slate-400">—</span>}
                      </td>
                      <td className="px-4 py-4">
                        <span className={`inline-flex items-center px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider border ${comm.direction === 'inbound' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                            comm.direction === 'outbound' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                              'bg-slate-100 text-slate-600 border-slate-200'
                          }`}>
                          {comm.direction}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-600 border border-slate-200">
                          {comm.sourceType === 'ai' ? <Bot className="h-3 w-3 text-indigo-500" /> : <Users className="h-3 w-3 text-slate-400" />}
                          {comm.sourceType}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-xs text-slate-600 font-medium">
                        {comm.outcome || '—'}
                      </td>
                      <td className="px-4 py-4 text-xs text-slate-500 whitespace-nowrap">
                        {formatDistanceToNow(new Date(comm.occurredAt), { addSuffix: true })}
                      </td>
                    </tr>

                    {/* EXPANDED ROW CONTENT */}
                    {isExpanded && (
                      <tr className="bg-slate-50 border-b-2 border-slate-200">
                        <td colSpan={2}></td>
                        <td colSpan={6} className="px-4 py-6">
                          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                            <div className="flex items-center gap-4 text-xs text-slate-500 mb-4 font-medium border-b border-slate-100 pb-3">
                              <span>Logged by: <span className="text-slate-800">{comm.user?.firstName} {comm.user?.lastName}</span></span>
                              <span>•</span>
                              <span>Date: <span className="text-slate-800">{format(new Date(comm.occurredAt), 'dd MMM yyyy, HH:mm')}</span></span>
                              {comm.durationSeconds && (
                                <>
                                  <span>•</span>
                                  <span>Duration: <span className="text-slate-800">{Math.round(comm.durationSeconds / 60)} mins</span></span>
                                </>
                              )}
                            </div>

                            <div className="prose prose-sm prose-slate max-w-none">
                              <p className="whitespace-pre-wrap">{comm.body || 'No notes provided.'}</p>
                            </div>

                            {comm.attachments && comm.attachments.length > 0 && (
                              <div className="mt-4 pt-4 border-t border-slate-100 flex gap-2">
                                {comm.attachments.map((att: any, i: number) => (
                                  <div key={i} className="flex items-center gap-1.5 px-2 py-1 bg-slate-100 rounded text-xs font-medium text-slate-600">
                                    <FileText className="h-3.5 w-3.5 text-slate-400" />
                                    {att}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between px-2 text-sm text-slate-600">
        <div>
          Showing <span className="font-semibold text-slate-900">{Math.min((page - 1) * limit + 1, total || 1)}</span> to{' '}
          <span className="font-semibold text-slate-900">{Math.min(page * limit, total)}</span> of{' '}
          <span className="font-semibold text-slate-900">{total}</span>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={() => updateParam('page', String(page - 1))} disabled={page === 1}>Previous</Button>
          <Button variant="outline" size="sm" onClick={() => updateParam('page', String(page + 1))} disabled={page >= totalPages}>Next</Button>
        </div>
      </div>
    </div>
  );
}
