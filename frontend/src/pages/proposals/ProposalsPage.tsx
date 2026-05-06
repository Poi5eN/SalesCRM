import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Table } from '@/components/ui/Table.tsx';
import { Button } from '@/components/ui/Button.tsx';
import { Plus, Filter, Download, MoreHorizontal, FileText, Send, CheckCircle } from 'lucide-react';
import * as proposalsApi from '@/api/proposals.api.ts';
import { usePagination } from '@/hooks/usePagination.ts';
import type { Proposal } from '@/types/api.types.ts';

const ProposalsPage = () => {
  const { page, limit, sortBy, sortOrder, onPageChange, onSort } = usePagination();
  const [search, setSearch] = useState('');

  const { data: proposalsResponse, isLoading } = useQuery({
    queryKey: ['proposals', { page, limit, sortBy, sortOrder, search }],
    queryFn: () => proposalsApi.getProposals({ page, limit, sortBy, sortOrder, search }),
  });

  const columns = [
    {
      header: 'Proposal Title',
      accessor: (item: Proposal) => (
        <div className="flex items-center space-x-3">
          <FileText className="h-4 w-4 text-slate-400" />
          <div className="flex flex-col">
            <span className="font-bold text-slate-900">{item.title}</span>
            <span className="text-xs text-slate-500">v{item.version} • {item.currency} {item.totalAmount.toLocaleString()}</span>
          </div>
        </div>
      ),
      sortable: true
    },
    {
      header: 'Deal',
      accessor: (item: Proposal) => item.deal?.title || 'No Deal'
    },
    {
      header: 'Status',
      accessor: (item: Proposal) => (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider ${item.status === 'accepted' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
            item.status === 'sent' ? 'bg-blue-50 text-blue-700 border-blue-100' :
              item.status === 'rejected' ? 'bg-red-50 text-red-700 border-red-100' :
                'bg-slate-100 text-slate-700 border-slate-200'
          }`}>
          {item.status}
        </span>
      ),
      sortable: true
    },
    {
      header: 'Valid Until',
      accessor: (item: Proposal) => item.validUntil ? new Date(item.validUntil).toLocaleDateString() : 'N/A'
    },
    {
      header: 'Progress',
      accessor: (item: Proposal) => (
        <div className="flex items-center space-x-2">
          <div className={`h-2 w-2 rounded-full ${item.sentAt ? 'bg-blue-500' : 'bg-slate-200'}`} title="Sent" />
          <div className={`h-2 w-2 rounded-full ${item.viewedAt ? 'bg-indigo-500' : 'bg-slate-200'}`} title="Viewed" />
          <div className={`h-2 w-2 rounded-full ${item.respondedAt ? (item.status === 'accepted' ? 'bg-emerald-500' : 'bg-red-500') : 'bg-slate-200'}`} title="Responded" />
        </div>
      )
    },
    {
      header: '',
      accessor: () => (
        <Button variant="ghost" size="icon">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      )
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Proposals</h1>
          <p className="text-slate-500">Create, send, and track quotes for your deals.</p>
        </div>
        <div className="flex items-center space-x-3">
          <Button variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          <Button size="sm">
            <Plus className="mr-2 h-4 w-4" />
            New Proposal
          </Button>
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <input
          type="text"
          placeholder="Search proposals..."
          className="w-full md:w-96 px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <Table
        columns={columns as any}
        data={proposalsResponse?.data?.data || []}
        isLoading={isLoading}
        pagination={{
          page,
          limit,
          total: proposalsResponse?.data?.meta?.total || 0,
          onPageChange
        }}
        sort={{
          key: sortBy || '',
          order: sortOrder,
          onSort
        }}
      />
    </div>
  );
};

export default ProposalsPage;
