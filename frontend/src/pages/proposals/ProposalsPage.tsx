import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams, Link } from 'react-router-dom';
import { Plus, Search, X, FileText, ChevronRight, Briefcase, Users } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import * as proposalsApi from '@/api/proposals.api.ts';
import { Button } from '@/components/ui/Button.tsx';
import { useDebounce } from '@/hooks/useDebounce.ts';
import { formatCurrency } from '@/utils/format.ts';

export default function ProposalsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  
  const page = parseInt(searchParams.get('page') ?? '1');
  const statusFilter = searchParams.get('status') ?? 'all';
  
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 350);
  const limit = 20;

  const queryParams: any = {
    page,
    limit,
    sortBy: 'updatedAt',
    sortOrder: 'desc',
    ...(debouncedSearch ? { search: debouncedSearch } : {}),
    ...(statusFilter !== 'all' ? { status: statusFilter } : {}),
  };

  const { data: proposalsData, isLoading } = useQuery({
    queryKey: ['proposals', queryParams],
    queryFn: () => proposalsApi.getProposals(queryParams),
  });

  const updateParam = (key: string, value: string | null) => {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      if (value === null) next.delete(key);
      else next.set(key, value);
      if (key !== 'page') next.set('page', '1');
      return next;
    });
  };

  const proposals: any[] = proposalsData?.data?.data ?? [];
  const total: number = proposalsData?.data?.meta?.total ?? 0;
  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-5">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Proposals</h1>
          <p className="text-slate-500 text-sm">Create, track, and manage quotes sent to clients.</p>
        </div>
        <Link to="/proposals/new">
          <Button>
            <Plus className="mr-1.5 h-4 w-4" /> New Proposal
          </Button>
        </Link>
      </div>

      <div className="flex flex-col md:flex-row gap-3 p-4 bg-white border border-slate-200 rounded-xl shadow-sm">
        <div className="flex-1 flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5">
          <Search className="h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search proposals by title..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full text-sm bg-transparent focus:outline-none"
          />
          {search && <button onClick={() => setSearch('')}><X className="h-4 w-4 text-slate-400" /></button>}
        </div>

        <select 
          value={statusFilter} 
          onChange={e => updateParam('status', e.target.value)}
          className="text-sm bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 outline-none"
        >
          <option value="all">All Statuses</option>
          <option value="draft">Draft</option>
          <option value="sent">Sent</option>
          <option value="viewed">Viewed</option>
          <option value="accepted">Accepted</option>
          <option value="rejected">Rejected</option>
          <option value="expired">Expired</option>
        </select>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-4 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider">Title & Version</th>
              <th className="px-4 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider">Linked To</th>
              <th className="px-4 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
              <th className="px-4 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Total Amount</th>
              <th className="px-4 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider">Sent / Valid</th>
              <th className="px-4 py-3.5 w-10"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isLoading ? (
              <tr><td colSpan={6} className="p-8 text-center text-slate-500">Loading...</td></tr>
            ) : proposals.length === 0 ? (
              <tr><td colSpan={6} className="p-12 text-center">
                <FileText className="h-10 w-10 text-slate-200 mx-auto mb-3" />
                <p className="text-slate-500 font-medium">No proposals found.</p>
              </td></tr>
            ) : (
              proposals.map(proposal => (
                <tr key={proposal.id} className="hover:bg-slate-50 transition-colors group">
                  <td className="px-4 py-4">
                    <Link to={`/proposals/${proposal.id}`} className="font-bold text-slate-900 hover:text-indigo-600 hover:underline">
                      {proposal.title}
                    </Link>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">v{proposal.version}</span>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="space-y-1 text-sm font-medium text-slate-700">
                      {proposal.deal && (
                        <div className="flex items-center gap-1.5">
                          <Briefcase className="h-3.5 w-3.5 text-slate-400" />
                          <Link to={`/deals`} className="hover:underline">{proposal.deal.title}</Link>
                        </div>
                      )}
                      {proposal.contact && (
                        <div className="flex items-center gap-1.5">
                          <Users className="h-3.5 w-3.5 text-slate-400" />
                          <Link to={`/contacts`} className="hover:underline">{proposal.contact.firstName} {proposal.contact.lastName}</Link>
                        </div>
                      )}
                      {!proposal.deal && !proposal.contact && <span className="text-slate-400">—</span>}
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${
                      proposal.status === 'accepted' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                      proposal.status === 'rejected' ? 'bg-red-50 text-red-700 border-red-200' :
                      proposal.status === 'sent' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                      proposal.status === 'viewed' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                      proposal.status === 'expired' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                      'bg-slate-100 text-slate-600 border-slate-200'
                    }`}>
                      {proposal.status}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-right">
                    <div className="font-bold text-slate-900 text-base">
                      {formatCurrency(proposal.totalAmount, proposal.currency)}
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="text-xs text-slate-600">
                      {proposal.sentAt ? (
                        <div>Sent: <span className="font-semibold text-slate-800">{formatDistanceToNow(new Date(proposal.sentAt), { addSuffix: true })}</span></div>
                      ) : (
                        <span className="text-slate-400 italic">Not sent</span>
                      )}
                      {proposal.validUntil && (
                        <div className="mt-0.5">Valid until: <span className="font-medium text-slate-800">{format(new Date(proposal.validUntil), 'dd MMM yyyy')}</span></div>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-4 text-right">
                    <Link to={`/proposals/${proposal.id}`}>
                      <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100">
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </Link>
                  </td>
                </tr>
              ))
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
