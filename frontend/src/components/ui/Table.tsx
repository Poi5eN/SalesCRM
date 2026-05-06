import { useState } from 'react';
import { 
  ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, 
  ArrowUp, ArrowDown, ChevronUp, ChevronDown 
} from 'lucide-react';
import { Button } from './Button.tsx';
import { EmptyState } from './EmptyState.tsx';

interface Column<T> {
  header: string;
  accessor: keyof T | ((item: T) => React.ReactNode);
  sortable?: boolean;
  sortKey?: string;
  className?: string;
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
  onRowClick?: (item: T) => void;
  selection?: {
    selectedIds: string[];
    onSelectionChange: (ids: string[]) => void;
  };
  bulkActions?: React.ReactNode;
  emptyState?: {
    title: string;
    description: string;
    variant?: 'general' | 'search' | 'tasks' | 'leads' | 'deals';
  };
}

export function Table<T extends { id?: string | number }>({ 
  columns, 
  data, 
  isLoading, 
  pagination, 
  sort, 
  onRowClick,
  selection,
  bulkActions,
  emptyState
}: TableProps<T>) {
  const allIds = data.map(item => String(item.id)).filter(Boolean);
  const isAllSelected = selection && allIds.length > 0 && allIds.every(id => selection.selectedIds.includes(id));

  const handleSelectAll = () => {
    if (!selection) return;
    if (isAllSelected) {
      selection.onSelectionChange(selection.selectedIds.filter(id => !allIds.includes(id)));
    } else {
      selection.onSelectionChange([...new Set([...selection.selectedIds, ...allIds])]);
    }
  };

  const handleSelectRow = (id: string) => {
    if (!selection) return;
    if (selection.selectedIds.includes(id)) {
      selection.onSelectionChange(selection.selectedIds.filter(i => i !== id));
    } else {
      selection.onSelectionChange([...selection.selectedIds, id]);
    }
  };

  return (
    <div className="w-full space-y-4 relative">
      <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 font-black uppercase tracking-widest sticky top-0 z-10">
              <tr>
                {selection && (
                  <th className="px-6 py-4 w-10">
                    <input 
                      type="checkbox" 
                      checked={isAllSelected} 
                      onChange={handleSelectAll}
                      className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                    />
                  </th>
                )}
                {columns.map((col, idx) => (
                  <th 
                    key={idx} 
                    className={`px-6 py-4 ${col.sortable ? 'cursor-pointer hover:text-slate-900 dark:hover:text-white transition-colors' : ''} ${col.className || ''}`}
                    onClick={() => col.sortable && sort?.onSort(col.sortKey || col.header.toLowerCase())}
                  >
                    <div className="flex items-center gap-1.5">
                      <span>{col.header}</span>
                      {col.sortable && (
                        <div className="flex flex-col -space-y-1">
                          <ChevronUp className={`h-2.5 w-2.5 ${sort?.key === (col.sortKey || col.header.toLowerCase()) && sort.order === 'asc' ? 'text-indigo-500' : 'text-slate-300'}`} />
                          <ChevronDown className={`h-2.5 w-2.5 ${sort?.key === (col.sortKey || col.header.toLowerCase()) && sort.order === 'desc' ? 'text-indigo-500' : 'text-slate-300'}`} />
                        </div>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
              {isLoading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i}>
                    {selection && <td className="px-6 py-4"><div className="h-4 w-4 bg-slate-100 dark:bg-slate-700 rounded animate-pulse" /></td>}
                    {columns.map((_, j) => (
                      <td key={j} className="px-6 py-4">
                        <div className="h-4 bg-slate-100 dark:bg-slate-700 rounded w-full animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : data.length === 0 ? (
                <tr>
                  <td colSpan={columns.length + (selection ? 1 : 0)} className="px-6 py-12">
                    <EmptyState 
                      variant={emptyState?.variant || 'general'}
                      title={emptyState?.title || "No data available"}
                      description={emptyState?.description || "There are no records to display at the moment."}
                    />
                  </td>
                </tr>
              ) : (
                data.map((item, i) => {
                  const isSelected = selection && item.id && selection.selectedIds.includes(String(item.id));
                  return (
                    <tr 
                      key={item.id || i} 
                      onClick={() => onRowClick?.(item)}
                      className={`group transition-all duration-100 ${onRowClick ? 'cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/30' : ''} ${isSelected ? 'bg-indigo-50/50 dark:bg-indigo-900/10' : ''}`}
                    >
                      {selection && (
                        <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                          <input 
                            type="checkbox" 
                            checked={isSelected} 
                            onChange={() => handleSelectRow(String(item.id))}
                            className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                          />
                        </td>
                      )}
                      {columns.map((col, j) => (
                        <td key={j} className={`px-6 py-4 text-slate-700 dark:text-slate-300 font-medium ${col.className || ''}`}>
                          {typeof col.accessor === 'function' ? col.accessor(item) : (item[col.accessor] as any)}
                        </td>
                      ))}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bulk Actions Floating Bar */}
      {selection && selection.selectedIds.length > 0 && bulkActions && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-6 z-50 animate-in slide-in-from-bottom-10 duration-300">
          <div className="flex items-center gap-3 pr-6 border-r border-slate-700">
            <span className="h-6 w-6 bg-indigo-600 rounded-lg flex items-center justify-center text-[10px] font-black">{selection.selectedIds.length}</span>
            <span className="text-xs font-bold uppercase tracking-widest">Selected</span>
          </div>
          <div className="flex items-center gap-2">
            {bulkActions}
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => selection.onSelectionChange([])}
              className="text-slate-400 hover:text-white"
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {pagination && data.length > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-2 py-4 border-t border-slate-100 dark:border-slate-800">
          <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
            Showing <span className="text-slate-900 dark:text-slate-200">{(pagination.page - 1) * pagination.limit + 1}</span> - <span className="text-slate-900 dark:text-slate-200">{Math.min(pagination.page * pagination.limit, pagination.total)}</span> of <span className="text-slate-900 dark:text-slate-200">{pagination.total}</span>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" size="icon" 
              onClick={() => pagination.onPageChange(1)} 
              disabled={pagination.page === 1}
              className="h-8 w-8"
            >
              <ChevronsLeft className="h-3 w-3" />
            </Button>
            <Button 
              variant="outline" size="icon" 
              onClick={() => pagination.onPageChange(pagination.page - 1)} 
              disabled={pagination.page === 1}
              className="h-8 w-8"
            >
              <ChevronLeft className="h-3 w-3" />
            </Button>
            <div className="flex items-center gap-1.5 px-3 py-1 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 text-[10px] font-black">
              <span className="text-slate-400">PAGE</span>
              <span className="text-slate-900 dark:text-slate-200">{pagination.page}</span>
              <span className="text-slate-400">/</span>
              <span className="text-slate-900 dark:text-slate-200">{Math.ceil(pagination.total / pagination.limit)}</span>
            </div>
            <Button 
              variant="outline" size="icon" 
              onClick={() => pagination.onPageChange(pagination.page + 1)} 
              disabled={pagination.page >= Math.ceil(pagination.total / pagination.limit)}
              className="h-8 w-8"
            >
              <ChevronRight className="h-3 w-3" />
            </Button>
            <Button 
              variant="outline" size="icon" 
              onClick={() => pagination.onPageChange(Math.ceil(pagination.total / pagination.limit))} 
              disabled={pagination.page >= Math.ceil(pagination.total / pagination.limit)}
              className="h-8 w-8"
            >
              <ChevronsRight className="h-3 w-3" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
