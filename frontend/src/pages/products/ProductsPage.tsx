import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Table } from '@/components/ui/Table.tsx';
import { Button } from '@/components/ui/Button.tsx';
import { Plus, Filter, Download, MoreHorizontal, Package, Tag } from 'lucide-react';
import * as productsApi from '@/api/products.api.ts';
import { usePagination } from '@/hooks/usePagination.ts';
import type { Product } from '@/types/api.types.ts';

const ProductsPage = () => {
  const { page, limit, sortBy, sortOrder, onPageChange, onSort } = usePagination();
  const [search, setSearch] = useState('');

  const { data: productsResponse, isLoading } = useQuery({
    queryKey: ['products', { page, limit, sortBy, sortOrder, search }],
    queryFn: () => productsApi.getProducts({ page, limit, sortBy, sortOrder, search }),
  });

  const columns = [
    {
      header: 'Product Name',
      accessor: (item: Product) => (
        <div className="flex items-center space-x-3">
          <div className="h-8 w-8 rounded bg-slate-100 flex items-center justify-center text-slate-400">
            {item.imageUrl ? <img src={item.imageUrl} className="h-full w-full object-cover rounded" /> : <Package className="h-4 w-4" />}
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-slate-900">{item.name}</span>
            <span className="text-xs text-slate-500">{item.sku || 'No SKU'}</span>
          </div>
        </div>
      ),
      sortable: true
    },
    {
      header: 'Category',
      accessor: (item: Product) => (
        <div className="flex items-center space-x-1 text-slate-600">
          <Tag className="h-3 w-3" />
          <span className="text-xs">{item.category || 'Uncategorized'}</span>
        </div>
      ),
      sortable: true
    },
    {
      header: 'Price',
      accessor: (item: Product) => (
        <span className="font-bold text-slate-900">
          {item.currency} {item.price.toLocaleString()}
        </span>
      ),
      sortable: true
    },
    {
      header: 'Type',
      accessor: (item: Product) => (
        <span className="capitalize px-2 py-1 bg-slate-100 rounded text-[10px] font-bold text-slate-600">
          {item.type}
        </span>
      )
    },
    {
      header: 'Usage',
      accessor: (item: Product) => (
        <span className="text-xs text-slate-500">
          Used in {item.usageCount || 0} deals
        </span>
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
          <h1 className="text-2xl font-bold text-slate-900">Product Catalog</h1>
          <p className="text-slate-500">Manage your products, services, and pricing.</p>
        </div>
        <div className="flex items-center space-x-3">
          <Button variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          <Button size="sm">
            <Plus className="mr-2 h-4 w-4" />
            New Product
          </Button>
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <input
          type="text"
          placeholder="Search products..."
          className="w-full md:w-96 px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <Table
        columns={columns as any}
        data={productsResponse?.data?.data || []}
        isLoading={isLoading}
        pagination={{
          page,
          limit,
          total: productsResponse?.data?.meta?.total || 0,
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

export default ProductsPage;
