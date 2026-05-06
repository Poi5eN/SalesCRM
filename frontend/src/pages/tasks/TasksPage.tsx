import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Table } from '@/components/ui/Table.tsx';
import { Button } from '@/components/ui/Button.tsx';
import { Plus, Filter, Download, MoreHorizontal, Calendar, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import * as tasksApi from '@/api/tasks.api.ts';
import { usePagination } from '@/hooks/usePagination.ts';
import type { Task } from '@/types/api.types.ts';

const TasksPage = () => {
  const { page, limit, sortBy, sortOrder, onPageChange, onSort } = usePagination();
  const [search, setSearch] = useState('');

  const { data: tasksResponse, isLoading } = useQuery({
    queryKey: ['tasks', { page, limit, sortBy, sortOrder, search }],
    queryFn: () => tasksApi.getTasks({ page, limit, sortBy, sortOrder, search }),
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle2 className="h-4 w-4 text-emerald-500" />;
      case 'overdue': return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'inProgress': return <Clock className="h-4 w-4 text-indigo-500" />;
      default: return <Clock className="h-4 w-4 text-slate-400" />;
    }
  };

  const columns = [
    {
      header: 'Task Name',
      accessor: (item: Task) => (
        <div className="flex items-center space-x-3">
          {getStatusIcon(item.status)}
          <div className="flex flex-col">
            <span className={`font-bold text-slate-900 ${item.status === 'completed' ? 'line-through text-slate-400' : ''}`}>
              {item.title}
            </span>
            <span className="text-xs text-slate-500">{item.lead?.title || item.deal?.title || 'No Relation'}</span>
          </div>
        </div>
      ),
      sortable: true
    },
    {
      header: 'Type',
      accessor: (item: Task) => (
        <span className="capitalize px-2 py-1 bg-slate-100 rounded text-xs font-medium text-slate-600">
          {item.type}
        </span>
      ),
      sortable: true
    },
    {
      header: 'Priority',
      accessor: (item: Task) => (
        <span className={`text-xs font-bold uppercase tracking-wider ${item.priority === 'high' ? 'text-red-600' :
            item.priority === 'medium' ? 'text-orange-600' :
              'text-blue-600'
          }`}>
          {item.priority}
        </span>
      ),
      sortable: true
    },
    {
      header: 'Due Date',
      accessor: (item: Task) => (
        <div className={`flex items-center space-x-1 text-xs ${item.status === 'overdue' ? 'text-red-600 font-bold' : 'text-slate-600'}`}>
          <Calendar className="h-3 w-3" />
          <span>{item.dueAt ? new Date(item.dueAt).toLocaleString() : 'No Due Date'}</span>
        </div>
      ),
      sortable: true
    },
    {
      header: 'Assigned To',
      accessor: (item: Task) => item.assignedTo ? `${item.assignedTo.firstName} ${item.assignedTo.lastName}` : 'Unassigned'
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
          <h1 className="text-2xl font-bold text-slate-900">Tasks</h1>
          <p className="text-slate-500">Stay on top of your follow-ups and action items.</p>
        </div>
        <div className="flex items-center space-x-3">
          <Button variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          <Button size="sm">
            <Plus className="mr-2 h-4 w-4" />
            New Task
          </Button>
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <input
          type="text"
          placeholder="Search tasks..."
          className="w-full md:w-96 px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <Table
        columns={columns as any}
        data={tasksResponse?.data?.data || []}
        isLoading={isLoading}
        pagination={{
          page,
          limit,
          total: tasksResponse?.data?.meta?.total || 0,
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

export default TasksPage;
