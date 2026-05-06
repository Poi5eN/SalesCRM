
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, ArrowUp, ArrowDown } from 'lucide-react';
import { Button } from './Button.tsx';

interface Column<T> {
  header: string;
  accessor: keyof T | ((item: T) => React.ReactNode);
  sortable?: boolean;
}

interface TableProps<T> {
  columns: Column<T>[];
  data: T[];
  isLoading?: boolean;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    onPageChange: (page: number) => void;
  };
  sort?: {
    key: string;
    order: 'asc' | 'desc';
    onSort: (key: string) => void;
  };
}

export function Table<T>({ columns, data, isLoading, pagination, sort }: TableProps<T>) {
  return (
    <div className="w-full space-y-4">
      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-medium">
            <tr>
              {columns.map((col, idx) => (
                <th 
                  key={idx} 
                  className="px-6 py-4 cursor-pointer hover:bg-slate-100 transition-colors"
                  onClick={() => col.sortable && sort?.onSort(col.header.toLowerCase())}
                >
                  <div className="flex items-center space-x-1">
                    <span>{col.header}</span>
                    {col.sortable && sort?.key === col.header.toLowerCase() && (
                      sort.order === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {isLoading ? (
              [...Array(5)].map((_, i) => (
                <tr key={i} className="animate-pulse">
                  {columns.map((_, j) => (
                    <td key={j} className="px-6 py-4">
                      <div className="h-4 bg-slate-100 rounded w-full" />
                    </td>
                  ))}
                </tr>
              ))
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-6 py-12 text-center text-slate-500">
                  No data found
                </td>
              </tr>
            ) : (
              data.map((item, i) => (
                <tr key={i} className="hover:bg-slate-50 transition-colors">
                  {columns.map((col, j) => (
                    <td key={j} className="px-6 py-4 text-slate-700 font-medium">
                      {typeof col.accessor === 'function' ? col.accessor(item) : (item[col.accessor] as any)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {pagination && (
        <div className="flex items-center justify-between px-2 text-sm text-slate-600">
          <div>
            Showing <span className="font-semibold text-slate-900">{(pagination.page - 1) * pagination.limit + 1}</span> to <span className="font-semibold text-slate-900">{Math.min(pagination.page * pagination.limit, pagination.total)}</span> of <span className="font-semibold text-slate-900">{pagination.total}</span> entries
          </div>
          <div className="flex items-center space-x-2">
            <Button 
              variant="outline" size="icon" 
              onClick={() => pagination.onPageChange(1)} 
              disabled={pagination.page === 1}
            >
              <ChevronsLeft className="h-4 w-4" />
            </Button>
            <Button 
              variant="outline" size="icon" 
              onClick={() => pagination.onPageChange(pagination.page - 1)} 
              disabled={pagination.page === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="flex items-center space-x-1 px-4 font-medium">
              <span>Page</span>
              <span className="text-slate-900">{pagination.page}</span>
              <span>of</span>
              <span className="text-slate-900">{Math.ceil(pagination.total / pagination.limit)}</span>
            </div>
            <Button 
              variant="outline" size="icon" 
              onClick={() => pagination.onPageChange(pagination.page + 1)} 
              disabled={pagination.page >= Math.ceil(pagination.total / pagination.limit)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button 
              variant="outline" size="icon" 
              onClick={() => pagination.onPageChange(Math.ceil(pagination.total / pagination.limit))} 
              disabled={pagination.page >= Math.ceil(pagination.total / pagination.limit)}
            >
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
