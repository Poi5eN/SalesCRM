import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Table } from '@/components/ui/Table.tsx';
import { Button } from '@/components/ui/Button.tsx';
import { Plus, Filter, Download, MoreHorizontal } from 'lucide-react';
import * as dealsApi from '@/api/deals.api.ts';
import { usePagination } from '@/hooks/usePagination.ts';
import type { Deal } from '@/types/api.types.ts';

const DealsPage = () => {
  const { page, limit, sortBy, sortOrder, onPageChange, onSort } = usePagination();
  const [search, setSearch] = useState('');

  const { data: dealsResponse, isLoading } = useQuery({
    queryKey: ['deals', { page, limit, sortBy, sortOrder, search }],
    queryFn: () => dealsApi.getDeals({ page, limit, sortBy, sortOrder, search }),
  });

  const columns = [
    {
      header: 'Deal Title',
      accessor: (item: Deal) => (
        <div className="flex flex-col">
          <span className="font-bold text-slate-900">{item.title}</span>
          <span className="text-xs text-slate-500">{item.company?.name || 'Individual'}</span>
        </div>
      ),
      sortable: true
    },
    {
      header: 'Value',
      accessor: (item: Deal) => (
        <span className="font-semibold text-slate-900">
          {item.currency} {item.value.toLocaleString()}
        </span>
      ),
      sortable: true
    },
    {
      header: 'Stage',
      accessor: (item: Deal) => (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-100">
          {item.stage?.name}
        </span>
      )
    },
    {
      header: 'Status',
      accessor: (item: Deal) => (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border capitalize ${item.status === 'won' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
            item.status === 'lost' ? 'bg-red-50 text-red-700 border-red-100' :
              'bg-blue-50 text-blue-700 border-blue-100'
          }`}>
          {item.status}
        </span>
      )
    },
    {
      header: 'Probability',
      accessor: (item: Deal) => (
        <div className="flex items-center space-x-2">
          <div className="w-16 bg-slate-100 rounded-full h-1.5">
            <div className="bg-indigo-600 h-1.5 rounded-full" style={{ width: `${item.probability}%` }} />
          </div>
          <span className="text-xs font-medium text-slate-600">{item.probability}%</span>
        </div>
      )
    },
    {
      header: 'Expected Close',
      accessor: (item: Deal) => item.expectedCloseAt ? new Date(item.expectedCloseAt).toLocaleDateString() : 'N/A'
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
          <h1 className="text-2xl font-bold text-slate-900">Deals</h1>
          <p className="text-slate-500">Track your active opportunities and revenue pipeline.</p>
        </div>
        <div className="flex items-center space-x-3">
          <Button variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          <Button size="sm">
            <Plus className="mr-2 h-4 w-4" />
            New Deal
          </Button>
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <input
          type="text"
          placeholder="Search deals..."
          className="w-full md:w-96 px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <Table
        columns={columns as any}
        data={dealsResponse?.data?.data || []}
        isLoading={isLoading}
        pagination={{
          page,
          limit,
          total: dealsResponse?.data?.meta?.total || 0,
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

export default DealsPage;
