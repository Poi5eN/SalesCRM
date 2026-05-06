import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Table } from '@/components/ui/Table.tsx';
import { Button } from '@/components/ui/Button.tsx';
import { Plus, Filter, Download, MoreHorizontal, Mail, Phone } from 'lucide-react';
import * as contactsApi from '@/api/contacts.api.ts';
import { usePagination } from '@/hooks/usePagination.ts';
import type { Contact } from '@/types/api.types.ts';

const ContactsPage = () => {
  const { page, limit, sortBy, sortOrder, onPageChange, onSort } = usePagination();
  const [search, setSearch] = useState('');

  const { data: contactsResponse, isLoading } = useQuery({
    queryKey: ['contacts', { page, limit, sortBy, sortOrder, search }],
    queryFn: () => contactsApi.getContacts({ page, limit, sortBy, sortOrder, search }),
  });

  const columns = [
    {
      header: 'Name',
      accessor: (item: Contact) => (
        <div className="flex items-center space-x-3">
          <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold text-xs">
            {item.firstName.charAt(0)}{item.lastName?.charAt(0) || ''}
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-slate-900">{item.firstName} {item.lastName || ''}</span>
            <span className="text-xs text-slate-500">{item.designation || 'Contact'}</span>
          </div>
        </div>
      ),
      sortable: true
    },
    {
      header: 'Company',
      accessor: (item: Contact) => item.company?.name || 'N/A'
    },
    {
      header: 'Email',
      accessor: (item: Contact) => (
        <div className="flex items-center space-x-1 text-slate-600">
          <Mail className="h-3 w-3" />
          <span>{item.email || 'N/A'}</span>
        </div>
      )
    },
    {
      header: 'Phone',
      accessor: (item: Contact) => (
        <div className="flex items-center space-x-1 text-slate-600">
          <Phone className="h-3 w-3" />
          <span>{item.phone || 'N/A'}</span>
        </div>
      )
    },
    {
      header: 'City',
      accessor: 'city' as any
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
          <h1 className="text-2xl font-bold text-slate-900">Contacts</h1>
          <p className="text-slate-500">Keep track of everyone you're doing business with.</p>
        </div>
        <div className="flex items-center space-x-3">
          <Button variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          <Button size="sm">
            <Plus className="mr-2 h-4 w-4" />
            New Contact
          </Button>
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <input
          type="text"
          placeholder="Search contacts..."
          className="w-full md:w-96 px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <Table
        columns={columns as any}
        data={contactsResponse?.data?.data || []}
        isLoading={isLoading}
        pagination={{
          page,
          limit,
          total: contactsResponse?.data?.meta?.total || 0,
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

export default ContactsPage;
