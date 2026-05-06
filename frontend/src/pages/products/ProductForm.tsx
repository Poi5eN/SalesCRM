import { useState, useEffect, useRef } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { X, ChevronDown } from 'lucide-react';
import * as productsApi from '@/api/products.api.ts';
import { Button } from '@/components/ui/Button.tsx';
import type { Product } from '@/types/api.types.ts';

interface ProductFormProps {
  product?: Product | null;
  onClose: () => void;
}

export function ProductForm({ product, onClose }: ProductFormProps) {
  const qc = useQueryClient();

  const [form, setForm] = useState({
    name: product?.name ?? '',
    type: product?.type ?? 'one_time',
    sku: product?.sku ?? '',
    category: product?.category ?? '',
    price: product?.price?.toString() ?? '',
    currency: product?.currency ?? 'USD',
    billingCycle: product?.billingCycle ?? 'monthly',
    taxRate: product?.taxRate?.toString() ?? '0',
    description: product?.description ?? '',
    status: product?.status ?? 'active',
    tags: product?.tags?.join(', ') ?? '',
  });

  const [inventoryOpen, setInventoryOpen] = useState(false); // Phase 2 stub

  const { data: categoriesData } = useQuery({
    queryKey: ['products-categories'],
    queryFn: () => productsApi.getProducts({ limit: 100 }), // In a real app this would be a distinct aggregate endpoint
  });
  const categories = Array.from(new Set(categoriesData?.data?.data?.map((p: any) => p.category).filter(Boolean) ?? []));

  const createMutation = useMutation({
    mutationFn: (data: any) => productsApi.createProduct(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['products'] });
      onClose();
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: any) => productsApi.updateProduct(product!.id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['products'] });
      onClose();
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload: any = {
      name: form.name,
      type: form.type,
      sku: form.sku || undefined,
      category: form.category || undefined,
      price: parseFloat(form.price),
      currency: form.currency,
      taxRate: parseFloat(form.taxRate),
      description: form.description || undefined,
      status: form.status,
      tags: form.tags ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
    };

    if (form.type === 'recurring') {
      payload.billingCycle = form.billingCycle;
    }

    if (product) updateMutation.mutate(payload);
    else createMutation.mutate(payload);
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-[500px] h-full bg-white shadow-2xl flex flex-col" style={{ animation: 'slideInRight 0.2s ease-out' }}>
        <div className="flex items-center justify-between p-6 border-b border-slate-200 bg-slate-50 shrink-0">
          <h2 className="text-xl font-bold text-slate-900">{product ? 'Edit Product' : 'New Product'}</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-lg transition-colors bg-white border border-slate-200">
            <X className="h-4 w-4 text-slate-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-900 border-b border-slate-200 pb-2">Basic Details</h3>
            
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Name <span className="text-red-500">*</span></label>
              <input required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Enterprise License" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-indigo-400" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Type <span className="text-red-500">*</span></label>
                <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-indigo-400 bg-white">
                  <option value="one_time">One-Time</option>
                  <option value="recurring">Recurring</option>
                  <option value="bundle">Bundle</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Status</label>
                <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-indigo-400 bg-white">
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="draft">Draft</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">SKU</label>
                <input value={form.sku} onChange={e => setForm(f => ({ ...f, sku: e.target.value }))} placeholder="e.g. ENT-LIC-01" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-indigo-400" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Category</label>
                <input 
                  list="categories"
                  value={form.category} 
                  onChange={e => setForm(f => ({ ...f, category: e.target.value }))} 
                  placeholder="e.g. Software" 
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-indigo-400" 
                />
                <datalist id="categories">
                  {(categories as string[]).map(c => <option key={c} value={c} />)}
                </datalist>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-900 border-b border-slate-200 pb-2">Pricing</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Price <span className="text-red-500">*</span></label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-medium">$</span>
                  <input type="number" step="0.01" min="0" required value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} placeholder="0.00" className="w-full pl-7 pr-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-indigo-400" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Currency</label>
                <select value={form.currency} onChange={e => setForm(f => ({ ...f, currency: e.target.value }))} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-indigo-400 bg-white">
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="GBP">GBP (£)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {form.type === 'recurring' && (
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Billing Cycle <span className="text-red-500">*</span></label>
                  <select required value={form.billingCycle} onChange={e => setForm(f => ({ ...f, billingCycle: e.target.value }))} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-indigo-400 bg-white">
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                    <option value="quarterly">Quarterly</option>
                    <option value="annually">Annually</option>
                  </select>
                </div>
              )}
              <div className={form.type !== 'recurring' ? 'col-span-2' : ''}>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Tax Rate (%)</label>
                <input type="number" step="0.1" min="0" value={form.taxRate} onChange={e => setForm(f => ({ ...f, taxRate: e.target.value }))} placeholder="0.0" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-indigo-400" />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-900 border-b border-slate-200 pb-2">Additional Info</h3>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Description</label>
              <textarea rows={3} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-indigo-400 resize-none" placeholder="Product details..." />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Tags</label>
              <input value={form.tags} onChange={e => setForm(f => ({ ...f, tags: e.target.value }))} placeholder="software, license, enterprise (comma separated)" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-indigo-400" />
            </div>
          </div>

          {/* Phase 2 stub */}
          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <button type="button" onClick={() => setInventoryOpen(!inventoryOpen)} className="w-full flex items-center justify-between p-4 bg-slate-50 hover:bg-slate-100 transition-colors">
              <span className="text-sm font-bold text-slate-700">Inventory Tracking (Phase 2)</span>
              <ChevronDown className={`h-4 w-4 text-slate-500 transition-transform ${inventoryOpen ? 'rotate-180' : ''}`} />
            </button>
            {inventoryOpen && (
              <div className="p-4 bg-white space-y-4">
                <div className="flex items-center gap-2">
                  <input type="checkbox" id="inv" className="rounded text-indigo-600 focus:ring-indigo-500" disabled />
                  <label htmlFor="inv" className="text-sm text-slate-500">Enable inventory tracking</label>
                </div>
                <div className="opacity-50 pointer-events-none">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Inventory Reference ID</label>
                  <input disabled className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50" placeholder="Ext-System-ID" />
                </div>
              </div>
            )}
          </div>
        </form>

        <div className="p-5 border-t border-slate-200 bg-white shrink-0 flex items-center justify-end gap-3 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit" isLoading={isSaving} onClick={handleSubmit}>
            {product ? 'Save Changes' : 'Create Product'}
          </Button>
        </div>
      </div>
    </div>
  );
}
