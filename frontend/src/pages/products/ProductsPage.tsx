import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { Plus, Search, X, Package, Tag, Edit2, Archive, Activity } from 'lucide-react';
import * as productsApi from '@/api/products.api.ts';
import { Button } from '@/components/ui/Button.tsx';
import { useDebounce } from '@/hooks/useDebounce.ts';
import { formatCurrency } from '@/utils/format.ts';
import { ProductForm } from './ProductForm.tsx';

export default function ProductsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const qc = useQueryClient();
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);

  const page = parseInt(searchParams.get('page') ?? '1');
  const typeFilter = searchParams.get('type') ?? 'all';
  const statusFilter = searchParams.get('status') ?? 'all';
  
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 350);
  const limit = 20;

  const queryParams: any = {
    page,
    limit,
    ...(debouncedSearch ? { search: debouncedSearch } : {}),
    ...(typeFilter !== 'all' ? { type: typeFilter } : {}),
    ...(statusFilter !== 'all' ? { status: statusFilter } : {}),
  };

  const { data: productsData, isLoading } = useQuery({
    queryKey: ['products', queryParams],
    queryFn: () => productsApi.getProducts(queryParams),
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

  const handleEdit = (product: any) => {
    setEditingProduct(product);
    setIsFormOpen(true);
  };

  const closeForm = () => {
    setEditingProduct(null);
    setIsFormOpen(false);
  };

  const products: any[] = productsData?.data?.data ?? [];
  const total: number = productsData?.data?.meta?.total ?? 0;
  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-5">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Products Catalog</h1>
          <p className="text-slate-500 text-sm">Manage your offerings, bundles, and recurring services.</p>
        </div>
        <Button onClick={() => setIsFormOpen(true)}>
          <Plus className="mr-1.5 h-4 w-4" /> New Product
        </Button>
      </div>

      <div className="flex flex-col md:flex-row gap-3 p-4 bg-white border border-slate-200 rounded-xl shadow-sm">
        <div className="flex-1 flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5">
          <Search className="h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name or SKU..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full text-sm bg-transparent focus:outline-none"
          />
          {search && <button onClick={() => setSearch('')}><X className="h-4 w-4 text-slate-400" /></button>}
        </div>

        <select 
          value={typeFilter} 
          onChange={e => updateParam('type', e.target.value)}
          className="text-sm bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 outline-none"
        >
          <option value="all">All Types</option>
          <option value="one_time">One-Time</option>
          <option value="recurring">Recurring</option>
          <option value="bundle">Bundle</option>
        </select>

        <select 
          value={statusFilter} 
          onChange={e => updateParam('status', e.target.value)}
          className="text-sm bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 outline-none"
        >
          <option value="all">All Statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="draft">Draft</option>
        </select>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-4 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider">Product Name & SKU</th>
              <th className="px-4 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider">Type</th>
              <th className="px-4 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider">Category</th>
              <th className="px-4 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider">Price</th>
              <th className="px-4 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
              <th className="px-4 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider">Usage</th>
              <th className="px-4 py-3.5 w-10"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isLoading ? (
              <tr><td colSpan={7} className="p-8 text-center text-slate-500">Loading...</td></tr>
            ) : products.length === 0 ? (
              <tr><td colSpan={7} className="p-12 text-center">
                <Package className="h-10 w-10 text-slate-200 mx-auto mb-3" />
                <p className="text-slate-500 font-medium">No products found.</p>
              </td></tr>
            ) : (
              products.map(product => (
                <tr key={product.id} className="hover:bg-slate-50 transition-colors group">
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-500 shrink-0">
                        {product.type === 'bundle' ? <Package className="h-5 w-5" /> : <Tag className="h-5 w-5" />}
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-slate-900 truncate">{product.name}</p>
                        <p className="text-xs text-slate-400 mt-0.5 truncate uppercase tracking-wider">{product.sku || 'No SKU'}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${
                      product.type === 'bundle' ? 'bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200' :
                      product.type === 'recurring' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                      'bg-slate-100 text-slate-700 border-slate-200'
                    }`}>
                      {product.type.replace('_', '-')}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-slate-600 font-medium">{product.category || '—'}</td>
                  <td className="px-4 py-4">
                    <div className="font-bold text-slate-900">
                      {formatCurrency(product.price, product.currency)}
                      {product.type === 'recurring' && <span className="text-slate-500 font-normal text-xs ml-1">/{product.billingCycle || 'mo'}</span>}
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <span className={`inline-flex items-center gap-1.5 ${
                      product.status === 'active' ? 'text-emerald-600' :
                      product.status === 'inactive' ? 'text-slate-400' : 'text-amber-600'
                    }`}>
                      <span className="relative flex h-2 w-2">
                        {product.status === 'active' && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>}
                        <span className={`relative inline-flex rounded-full h-2 w-2 ${
                          product.status === 'active' ? 'bg-emerald-500' :
                          product.status === 'inactive' ? 'bg-slate-400' : 'bg-amber-500'
                        }`}></span>
                      </span>
                      <span className="text-xs font-bold uppercase tracking-wider">{product.status}</span>
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-1.5 text-slate-500 text-xs font-semibold">
                      <Activity className="h-3.5 w-3.5" />
                      {product.usageCount || 0} deals
                    </div>
                  </td>
                  <td className="px-4 py-4 text-right">
                    <Button variant="ghost" size="sm" onClick={() => handleEdit(product)} className="opacity-0 group-hover:opacity-100">
                      <Edit2 className="h-4 w-4" />
                    </Button>
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

      {isFormOpen && <ProductForm product={editingProduct} onClose={closeForm} />}
    </div>
  );
}
