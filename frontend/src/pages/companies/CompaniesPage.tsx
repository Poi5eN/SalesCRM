import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { Plus, Search, X, MoreHorizontal, Building2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import * as companiesApi from '@/api/companies.api.ts';
import { Button } from '@/components/ui/Button.tsx';
import { useDebounce } from '@/hooks/useDebounce.ts';
import { useConfirm } from '@/hooks/useConfirm.ts';
import { formatCurrency } from '@/utils/format.ts';
import type { Company } from '@/types/api.types.ts';

import { CompanyForm } from './CompanyForm.tsx';
import { CompanyDetailModal } from './CompanyDetailModal.tsx';
import { ContactForm } from '@/pages/contacts/ContactForm.tsx';
import { DealForm } from '@/pages/deals/DealForm.tsx';

export default function CompaniesPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const confirm = useConfirm();
  const qc = useQueryClient();

  const page = parseInt(searchParams.get('page') ?? '1');
  const sortBy = searchParams.get('sortBy') ?? 'createdAt';
  const sortOrder = (searchParams.get('sortOrder') ?? 'desc') as 'asc' | 'desc';

  const [search, setSearch] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editCompany, setEditCompany] = useState<Company | null>(null);
  const [detailCompany, setDetailCompany] = useState<Company | null>(null);
  
  const [addContactToCompanyId, setAddContactToCompanyId] = useState<string | null>(null);
  const [addDealToCompanyId, setAddDealToCompanyId] = useState<string | null>(null);

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const debouncedSearch = useDebounce(search, 350);
  const limit = 25;

  const queryParams: any = {
    page,
    limit,
    sortBy,
    sortOrder,
    ...(debouncedSearch ? { search: debouncedSearch } : {}),
  };

  const { data: companiesData, isLoading } = useQuery({
    queryKey: ['companies', queryParams],
    queryFn: () => companiesApi.getCompanies(queryParams),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => companiesApi.deleteCompany(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['companies'] });
      setSelectedIds(new Set());
    },
  });

  const updateParam = useCallback((key: string, value: string | null) => {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      if (value === null) next.delete(key);
      else next.set(key, value);
      return next;
    });
  }, [setSearchParams]);

  const onPageChange = (p: number) => updateParam('page', String(p));
  const onSort = (key: string) => {
    if (sortBy === key) updateParam('sortOrder', sortOrder === 'asc' ? 'desc' : 'asc');
    else { updateParam('sortBy', key); updateParam('sortOrder', 'asc'); }
    updateParam('page', '1');
  };

  const handleDelete = async (company: Company) => {
    const ok = await confirm.confirm(
      `Are you sure you want to delete "${company.name}"? This action cannot be undone.`,
      'Delete Company',
      'danger'
    );
    if (ok) deleteMutation.mutate(company.id);
  };

  const handleBulkDelete = async () => {
    const ok = await confirm.confirm(
      `Are you sure you want to delete ${selectedIds.size} companies?`,
      'Delete Companies',
      'danger'
    );
    if (ok) {
      for (const id of selectedIds) {
        await deleteMutation.mutateAsync(id);
      }
    }
  };

  const handleOpenForm = (company?: Company) => {
    setEditCompany(company ?? null);
    setFormOpen(true);
  };

  const companies: Company[] = companiesData?.data?.data ?? [];
  const total: number = companiesData?.data?.meta?.total ?? 0;
  const totalPages = Math.ceil(total / limit);
  const allSelected = companies.length > 0 && selectedIds.size === companies.length;

  return (
    <div className="space-y-5">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Companies</h1>
          <p className="text-slate-500 text-sm">Manage organizations and accounts.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-4 py-2 shadow-sm w-64">
            <Search className="h-4 w-4 text-slate-400 flex-shrink-0" />
            <input
              type="text"
              placeholder="Search companies..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="flex-1 text-sm bg-transparent focus:outline-none text-slate-900 placeholder:text-slate-400"
            />
            {search && (
              <button onClick={() => setSearch('')} className="text-slate-400 hover:text-slate-600">
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <Button size="sm" onClick={() => handleOpenForm()}>
            <Plus className="mr-1.5 h-3.5 w-3.5" /> New Company
          </Button>
        </div>
      </div>

      {selectedIds.size > 0 && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-30 flex items-center gap-3 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-2xl animate-in slide-in-from-bottom-5">
          <span className="text-sm font-semibold">{selectedIds.size} selected</span>
          <div className="w-px h-5 bg-slate-700" />
          <button
            onClick={handleBulkDelete}
            className="text-xs font-semibold text-red-400 hover:text-red-300 transition-colors"
          >
            Delete
          </button>
          <button onClick={() => setSelectedIds(new Set())} className="text-xs text-slate-400 hover:text-white transition-colors">
            Clear
          </button>
        </div>
      )}

      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-4 py-3.5 w-10">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={e => setSelectedIds(e.target.checked ? new Set(companies.map(c => c.id)) : new Set())}
                  className="rounded border-slate-300 text-indigo-600"
                />
              </th>
              <th className="px-4 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider cursor-pointer hover:text-slate-800 select-none" onClick={() => onSort('name')}>Company</th>
              <th className="px-4 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider cursor-pointer hover:text-slate-800 select-none" onClick={() => onSort('industry')}>Industry</th>
              <th className="px-4 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider cursor-pointer hover:text-slate-800 select-none" onClick={() => onSort('size')}>Size</th>
              <th className="px-4 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider">Country</th>
              <th className="px-4 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider text-right cursor-pointer hover:text-slate-800 select-none" onClick={() => onSort('_count.contacts')}>Contacts</th>
              <th className="px-4 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider text-right cursor-pointer hover:text-slate-800 select-none" onClick={() => onSort('_count.deals')}>Open Deals</th>
              <th className="px-4 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Created</th>
              <th className="px-4 py-3.5 w-10" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isLoading ? (
              [...Array(6)].map((_, i) => (
                <tr key={i} className="animate-pulse">
                  {[...Array(9)].map((_, j) => (
                    <td key={j} className="px-4 py-4">
                      <div className="h-4 bg-slate-100 rounded w-full" />
                    </td>
                  ))}
                </tr>
              ))
            ) : companies.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-6 py-16 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <Building2 className="h-12 w-12 text-slate-200" />
                    <p className="text-sm font-semibold text-slate-500">No companies found</p>
                  </div>
                </td>
              </tr>
            ) : (
              companies.map(company => {
                const isSelected = selectedIds.has(company.id);
                return (
                  <tr
                    key={company.id}
                    onClick={() => setDetailCompany(company)}
                    className={`hover:bg-slate-50 cursor-pointer transition-colors ${isSelected ? 'bg-indigo-50/50' : ''}`}
                  >
                    <td className="px-4 py-4" onClick={e => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={e => setSelectedIds(prev => {
                          const next = new Set(prev);
                          e.target.checked ? next.add(company.id) : next.delete(company.id);
                          return next;
                        })}
                        className="rounded border-slate-300 text-indigo-600"
                      />
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 text-xs font-bold flex-shrink-0">
                          {company.name.charAt(0)}
                        </div>
                        <span className="font-semibold text-slate-900">{company.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-slate-600">{company.industry ?? '—'}</td>
                    <td className="px-4 py-4 text-slate-600">{company.size ?? '—'}</td>
                    <td className="px-4 py-4 text-slate-600">{company.country ?? '—'}</td>
                    <td className="px-4 py-4 text-right">
                      <span className="inline-flex items-center justify-center px-2 py-1 rounded bg-slate-100 text-slate-600 font-bold text-xs">
                        {(company as any)._count?.contacts ?? 0}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <span className="inline-flex items-center justify-center px-2 py-1 rounded bg-indigo-50 text-indigo-700 font-bold text-xs">
                        {(company as any)._count?.deals ?? 0}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-right text-xs text-slate-500 whitespace-nowrap">
                      {formatDistanceToNow(new Date(company.createdAt), { addSuffix: true })}
                    </td>
                    <td className="px-4 py-4" onClick={e => e.stopPropagation()}>
                      <div className="relative group">
                        <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                        <div className="absolute right-0 top-full z-20 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl py-1 w-36 hidden group-hover:block">
                          <button onClick={() => handleOpenForm(company)} className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50">Edit</button>
                          <button onClick={() => handleDelete(company)} className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50">Delete</button>
                        </div>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between px-2 text-sm text-slate-600">
        <div>
          Showing <span className="font-semibold text-slate-900">{Math.min((page - 1) * limit + 1, total)}</span> to{' '}
          <span className="font-semibold text-slate-900">{Math.min(page * limit, total)}</span> of{' '}
          <span className="font-semibold text-slate-900">{total}</span> companies
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={() => onPageChange(page - 1)} disabled={page === 1}>Previous</Button>
          <Button variant="outline" size="sm" onClick={() => onPageChange(page + 1)} disabled={page >= totalPages}>Next</Button>
        </div>
      </div>

      {formOpen && (
        <CompanyForm
          company={editCompany}
          onClose={() => { setFormOpen(false); setEditCompany(null); }}
        />
      )}

      {detailCompany && (
        <CompanyDetailModal
          company={detailCompany}
          onClose={() => setDetailCompany(null)}
          onEdit={() => { handleOpenForm(detailCompany); setDetailCompany(null); }}
          onAddContact={(cid) => setAddContactToCompanyId(cid)}
          onAddDeal={(cid) => setAddDealToCompanyId(cid)}
        />
      )}

      {/* Sub-modals triggered from detail view */}
      {addContactToCompanyId && (
        <ContactForm 
          prefillCompanyId={addContactToCompanyId} 
          onClose={() => setAddContactToCompanyId(null)} 
          onSuccess={() => { qc.invalidateQueries({ queryKey: ['contacts', 'company', addContactToCompanyId] }); setAddContactToCompanyId(null); }}
        />
      )}
      {addDealToCompanyId && (
        <DealForm
          prefill={{ companyId: addDealToCompanyId }}
          onClose={() => setAddDealToCompanyId(null)}
          onSuccess={() => { qc.invalidateQueries({ queryKey: ['deals', 'company', addDealToCompanyId] }); setAddDealToCompanyId(null); }}
        />
      )}
    </div>
  );
}
