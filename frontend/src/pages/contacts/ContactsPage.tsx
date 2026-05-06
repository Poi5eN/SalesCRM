import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSearchParams, Link } from 'react-router-dom';
import { Plus, Search, X, MoreHorizontal, Target, Users, Combine } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import * as contactsApi from '@/api/contacts.api.ts';
import { Button } from '@/components/ui/Button.tsx';
import { useDebounce } from '@/hooks/useDebounce.ts';
import { useConfirm } from '@/hooks/useConfirm.ts';
import type { Contact } from '@/types/api.types.ts';

import { ContactForm } from './ContactForm.tsx';
import { ContactDetailModal } from './ContactDetailModal.tsx';
import { MergeContactsModal } from './MergeContactsModal.tsx';

export default function ContactsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const confirm = useConfirm();
  const qc = useQueryClient();

  const page = parseInt(searchParams.get('page') ?? '1');
  const sortBy = searchParams.get('sortBy') ?? 'createdAt';
  const sortOrder = (searchParams.get('sortOrder') ?? 'desc') as 'asc' | 'desc';

  const [search, setSearch] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editContact, setEditContact] = useState<Contact | null>(null);
  const [detailContact, setDetailContact] = useState<Contact | null>(null);
  
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [mergeModalOpen, setMergeModalOpen] = useState(false);

  const debouncedSearch = useDebounce(search, 350);
  const limit = 25;

  const queryParams: any = {
    page,
    limit,
    sortBy,
    sortOrder,
    ...(debouncedSearch ? { search: debouncedSearch } : {}),
  };

  const { data: contactsData, isLoading } = useQuery({
    queryKey: ['contacts', queryParams],
    queryFn: () => contactsApi.getContacts(queryParams),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => contactsApi.deleteContact(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['contacts'] });
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

  const handleDelete = async (contact: Contact) => {
    const ok = await confirm.confirm(
      `Are you sure you want to delete "${contact.firstName} ${contact.lastName}"? This action cannot be undone.`,
      'Delete Contact',
      'danger'
    );
    if (ok) deleteMutation.mutate(contact.id);
  };

  const handleBulkDelete = async () => {
    const ok = await confirm.confirm(
      `Are you sure you want to delete ${selectedIds.size} contacts?`,
      'Delete Contacts',
      'danger'
    );
    if (ok) {
      for (const id of selectedIds) {
        await deleteMutation.mutateAsync(id);
      }
    }
  };

  const handleOpenForm = (contact?: Contact) => {
    setEditContact(contact ?? null);
    setFormOpen(true);
  };

  const contacts: Contact[] = contactsData?.data?.data ?? [];
  const total: number = contactsData?.data?.meta?.total ?? 0;
  const totalPages = Math.ceil(total / limit);
  const allSelected = contacts.length > 0 && selectedIds.size === contacts.length;

  return (
    <div className="space-y-5">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Contacts</h1>
          <p className="text-slate-500 text-sm">Manage people and their relationships.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-4 py-2 shadow-sm w-64">
            <Search className="h-4 w-4 text-slate-400 flex-shrink-0" />
            <input
              type="text"
              placeholder="Search contacts..."
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
            <Plus className="mr-1.5 h-3.5 w-3.5" /> New Contact
          </Button>
        </div>
      </div>

      {selectedIds.size > 0 && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-30 flex items-center gap-3 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-2xl animate-in slide-in-from-bottom-5">
          <span className="text-sm font-semibold">{selectedIds.size} selected</span>
          <div className="w-px h-5 bg-slate-700" />
          
          {selectedIds.size === 2 && (
            <>
              <button
                onClick={() => setMergeModalOpen(true)}
                className="flex items-center gap-1.5 text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition-colors"
              >
                <Combine className="h-3.5 w-3.5" /> Merge Contacts
              </button>
              <div className="w-px h-5 bg-slate-700" />
            </>
          )}

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
                  onChange={e => setSelectedIds(e.target.checked ? new Set(contacts.map(c => c.id)) : new Set())}
                  className="rounded border-slate-300 text-indigo-600"
                />
              </th>
              <th className="px-4 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider cursor-pointer hover:text-slate-800 select-none" onClick={() => onSort('firstName')}>Contact</th>
              <th className="px-4 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider cursor-pointer hover:text-slate-800 select-none" onClick={() => onSort('email')}>Email</th>
              <th className="px-4 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider">Phone</th>
              <th className="px-4 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider">Company</th>
              <th className="px-4 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider">Tags</th>
              <th className="px-4 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider">Created</th>
              <th className="px-4 py-3.5 w-10" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isLoading ? (
              [...Array(6)].map((_, i) => (
                <tr key={i} className="animate-pulse">
                  {[...Array(8)].map((_, j) => (
                    <td key={j} className="px-4 py-4">
                      <div className="h-4 bg-slate-100 rounded w-full" />
                    </td>
                  ))}
                </tr>
              ))
            ) : contacts.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-6 py-16 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <Users className="h-12 w-12 text-slate-200" />
                    <p className="text-sm font-semibold text-slate-500">No contacts found</p>
                  </div>
                </td>
              </tr>
            ) : (
              contacts.map(contact => {
                const isSelected = selectedIds.has(contact.id);
                return (
                  <tr
                    key={contact.id}
                    onClick={() => setDetailContact(contact)}
                    className={`hover:bg-slate-50 cursor-pointer transition-colors ${isSelected ? 'bg-indigo-50/50' : ''}`}
                  >
                    <td className="px-4 py-4" onClick={e => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={e => setSelectedIds(prev => {
                          const next = new Set(prev);
                          e.target.checked ? next.add(contact.id) : next.delete(contact.id);
                          return next;
                        })}
                        className="rounded border-slate-300 text-indigo-600"
                      />
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 text-xs font-bold flex-shrink-0">
                          {contact.firstName.charAt(0)}
                        </div>
                        <div className="flex flex-col">
                          <span className="font-semibold text-slate-900">{contact.firstName} {contact.lastName}</span>
                          {contact.designation && <span className="text-[10px] text-slate-500">{contact.designation}</span>}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-slate-600">{contact.email ?? '—'}</td>
                    <td className="px-4 py-4 text-slate-600">{contact.phone ?? '—'}</td>
                    <td className="px-4 py-4">
                      {contact.company ? (
                        <span className="text-sm font-medium text-slate-700 hover:text-indigo-600 transition-colors" onClick={e => e.stopPropagation()}>
                          <Link to={`/companies?search=${contact.company.name}`}>{contact.company.name}</Link>
                        </span>
                      ) : <span className="text-slate-400">—</span>}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex flex-wrap gap-1">
                        {contact.tags?.slice(0, 2).map(t => (
                          <span key={t} className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-slate-100 text-slate-600">{t}</span>
                        ))}
                        {(contact.tags?.length ?? 0) > 2 && (
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-slate-100 text-slate-600">+{contact.tags!.length - 2}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4 text-xs text-slate-500 whitespace-nowrap">
                      {formatDistanceToNow(new Date(contact.createdAt), { addSuffix: true })}
                    </td>
                    <td className="px-4 py-4" onClick={e => e.stopPropagation()}>
                      <div className="relative group">
                        <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                        <div className="absolute right-0 top-full z-20 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl py-1 w-36 hidden group-hover:block">
                          <button onClick={() => handleOpenForm(contact)} className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50">Edit</button>
                          <button onClick={() => handleDelete(contact)} className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50">Delete</button>
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
          <span className="font-semibold text-slate-900">{total}</span> contacts
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={() => onPageChange(page - 1)} disabled={page === 1}>Previous</Button>
          <Button variant="outline" size="sm" onClick={() => onPageChange(page + 1)} disabled={page >= totalPages}>Next</Button>
        </div>
      </div>

      {formOpen && (
        <ContactForm
          contact={editContact}
          onClose={() => { setFormOpen(false); setEditContact(null); }}
          onUseExisting={(c) => { setFormOpen(false); setEditContact(null); setDetailContact(c); }}
        />
      )}

      {detailContact && (
        <ContactDetailModal
          contact={detailContact}
          onClose={() => setDetailContact(null)}
          onEdit={() => { handleOpenForm(detailContact); setDetailContact(null); }}
        />
      )}

      {mergeModalOpen && selectedIds.size === 2 && (
        <MergeContactsModal
          source={contacts.find(c => c.id === Array.from(selectedIds)[0])!}
          target={contacts.find(c => c.id === Array.from(selectedIds)[1])!}
          onClose={() => { setMergeModalOpen(false); setSelectedIds(new Set()); }}
        />
      )}
    </div>
  );
}
