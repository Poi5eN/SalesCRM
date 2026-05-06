import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Table } from '@/components/ui/Table.tsx';
import { Button } from '@/components/ui/Button.tsx';
import { Plus, Filter, Download, MoreHorizontal, Globe } from 'lucide-react';
import * as companiesApi from '@/api/companies.api.ts';
import { usePagination } from '@/hooks/usePagination.ts';
import type { Company } from '@/types/api.types.ts';

const CompaniesPage = () => {
  const { page, limit, sortBy, sortOrder, onPageChange, onSort } = usePagination();
  const [search, setSearch] = useState('');

  const { data: companiesResponse, isLoading } = useQuery({
    queryKey: ['companies', { page, limit, sortBy, sortOrder, search }],
    queryFn: () => companiesApi.getCompanies({ page, limit, sortBy, sortOrder, search }),
  });

  const columns = [
    {
      header: 'Company Name',
      accessor: (item: Company) => (
        <div className="flex items-center space-x-3">
          <div className="h-8 w-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold text-xs border border-indigo-100">
            {item.name.charAt(0)}
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-slate-900">{item.name}</span>
            {item.website && (
              <a href={item.website} target="_blank" rel="noreferrer" className="text-xs text-indigo-600 hover:underline flex items-center">
                <Globe className="h-2.5 w-2.5 mr-1" />
                {item.website.replace(/^https?:\/\//, '')}
              </a>
            )}
          </div>
        </div>
      ),
      sortable: true
    },
    {
      header: 'Industry',
      accessor: 'industry' as any,
      sortable: true
    },
    {
      header: 'Size',
      accessor: 'size' as any
    },
    {
      header: 'Location',
      accessor: (item: Company) => `${item.city || ''}${item.city && item.country ? ', ' : ''}${item.country || ''}` || 'N/A'
    },
    {
      header: 'Stats',
      accessor: (item: Company) => (
        <div className="flex items-center space-x-3 text-xs">
          <span className="text-slate-500"><span className="font-bold text-slate-700">{item._count?.contacts || 0}</span> Contacts</span>
          <span className="text-slate-500"><span className="font-bold text-slate-700">{item._count?.deals || 0}</span> Deals</span>
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
          <h1 className="text-2xl font-bold text-slate-900">Companies</h1>
          <p className="text-slate-500">Manage organizational records and B2B relationships.</p>
        </div>
        <div className="flex items-center space-x-3">
          <Button variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          <Button size="sm">
            <Plus className="mr-2 h-4 w-4" />
            New Company
          </Button>
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <input
          type="text"
          placeholder="Search companies..."
          className="w-full md:w-96 px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <Table
        columns={columns as any}
        data={companiesResponse?.data?.data || []}
        isLoading={isLoading}
        pagination={{
          page,
          limit,
          total: companiesResponse?.data?.meta?.total || 0,
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

export default CompaniesPage;
