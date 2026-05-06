import { useState } from 'react';
import { Table } from '@/components/ui/Table.tsx';
import { Button } from '@/components/ui/Button.tsx';
import { Plus, Filter, Download, MoreHorizontal } from 'lucide-react';

const mockLeads = [
  { id: '1', title: 'Enterprise Cloud Migration', contact: 'Alice Johnson', company: 'TechCorp', value: '$12,000', stage: 'Qualified', priority: 'High', createdAt: '2026-05-01' },
  { id: '2', title: 'SaaS Subscription Renewal', contact: 'Bob Smith', company: 'Growthly', value: '$2,500', stage: 'Discovery', priority: 'Medium', createdAt: '2026-05-02' },
  { id: '3', title: 'Data Analytics Partnership', contact: 'Charlie Brown', company: 'DataViz', value: '$45,000', stage: 'Negotiation', priority: 'Urgent', createdAt: '2026-05-03' },
];

const LeadsPage = () => {
  const [page, setPage] = useState(1);

  const columns = [
    { header: 'Title', accessor: (item: any) => (
      <div className="flex flex-col">
        <span className="font-bold text-slate-900">{item.title}</span>
        <span className="text-xs text-slate-500">{item.company}</span>
      </div>
    ), sortable: true },
    { header: 'Contact', accessor: 'contact' as any },
    { header: 'Value', accessor: 'value' as any, sortable: true },
    { header: 'Stage', accessor: (item: any) => (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-100">
        {item.stage}
      </span>
    ) },
    { header: 'Priority', accessor: (item: any) => (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
        item.priority === 'Urgent' ? 'bg-red-50 text-red-700 border-red-100' : 
        item.priority === 'High' ? 'bg-orange-50 text-orange-700 border-orange-100' :
        'bg-blue-50 text-blue-700 border-blue-100'
      }`}>
        {item.priority}
      </span>
    ) },
    { header: 'Date', accessor: 'createdAt' as any },
    { header: '', accessor: () => (
      <Button variant="ghost" size="icon">
        <MoreHorizontal className="h-4 w-4" />
      </Button>
    ) },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Leads</h1>
          <p className="text-slate-500">Manage and track your sales opportunities.</p>
        </div>
        <div className="flex items-center space-x-3">
          <Button variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          <Button variant="outline" size="sm">
            <Filter className="mr-2 h-4 w-4" />
            Filter
          </Button>
          <Button size="sm">
            <Plus className="mr-2 h-4 w-4" />
            New Lead
          </Button>
        </div>
      </div>

      <Table 
        columns={columns} 
        data={mockLeads} 
        pagination={{
          page,
          limit: 10,
          total: 24,
          onPageChange: setPage
        }}
        sort={{
          key: 'title',
          order: 'asc',
          onSort: (key) => console.log('Sort by', key)
        }}
      />
    </div>
  );
};

export default LeadsPage;
