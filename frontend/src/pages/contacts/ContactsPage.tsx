import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSearchParams, Link } from 'react-router-dom';
import { Plus, Search, X, MoreHorizontal, Combine, User } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import * as contactsApi from '@/api/contacts.api.ts';
import { Button } from '@/components/ui/Button.tsx';
import { useDebounce } from '@/hooks/useDebounce.ts';
import { useConfirm } from '@/hooks/useConfirm.ts';
import type { Contact } from '@/types/api.types.ts';
import { Table } from '@/components/ui/Table.tsx';
import { Badge } from '@/components/ui/Badge.tsx';

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
  
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
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
      setSelectedIds([]);
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
      `Are you sure you want to delete ${selectedIds.length} contacts?`,
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

  const columns = [
    {
      header: 'Contact',
      accessor: (contact: Contact) => (
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-full bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 text-xs font-black border border-indigo-100 dark:border-indigo-800">
            {contact.firstName.charAt(0)}
          </div>
          <div className="flex flex-col">
            <span className="font-black text-slate-900 dark:text-white transition-colors group-hover:text-indigo-600 dark:group-hover:text-indigo-400">{contact.firstName} {contact.lastName}</span>
            {contact.designation && <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{contact.designation}</span>}
          </div>
        </div>
      ),
      sortable: true,
      sortKey: 'firstName',
    },
    {
      header: 'Email',
      accessor: (contact: Contact) => <span className="text-sm font-medium text-slate-600 dark:text-slate-400">{contact.email || '—'}</span>,
      sortable: true,
      sortKey: 'email',
    },
    {
      header: 'Phone',
      accessor: (contact: Contact) => <span className="text-sm font-medium text-slate-600 dark:text-slate-400">{contact.phone || '—'}</span>,
    },
    {
      header: 'Company',
      accessor: (contact: Contact) => (
        contact.company ? (
          <Link 
            to={`/companies?search=${contact.company.name}`} 
            onClick={e => e.stopPropagation()}
            className="text-xs font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest hover:underline"
          >
            {contact.company.name}
          </Link>
        ) : <span className="text-slate-400">—</span>
      ),
    },
    {
      header: 'Tags',
      accessor: (contact: Contact) => (
        <div className="flex flex-wrap gap-1">
          {contact.tags?.slice(0, 2).map(t => (
            <Badge key={t} variant="outline" className="bg-slate-50 dark:bg-slate-900/50 border-none text-[9px] lowercase">#{t}</Badge>
          ))}
          {(contact.tags?.length ?? 0) > 2 && (
            <span className="text-[9px] font-black text-slate-400">+{contact.tags!.length - 2}</span>
          )}
        </div>
      ),
    },
    {
      header: 'Created',
      accessor: (contact: Contact) => (
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
          {formatDistanceToNow(new Date(contact.createdAt), { addSuffix: true })}
        </span>
      ),
      sortable: true,
      sortKey: 'createdAt',
    },
    {
      header: '',
      accessor: (contact: Contact) => (
        <div className="flex justify-end" onClick={e => e.stopPropagation()}>
          <ActionsMenu contact={contact} onEdit={() => handleOpenForm(contact)} onDelete={() => handleDelete(contact)} />
        </div>
      ),
      className: "w-10",
    }
  ];

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">People</h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium mt-1">Manage your contacts and their relationships.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-2.5 shadow-sm w-72 focus-within:ring-4 focus-within:ring-indigo-500/10 transition-all">
            <Search className="h-4 w-4 text-slate-400 shrink-0" />
            <input
              type="text"
              placeholder="Search contacts..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="flex-1 text-sm bg-transparent focus:outline-none text-slate-900 dark:text-white placeholder:text-slate-400 font-bold"
            />
            {search && (
              <button onClick={() => setSearch('')} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <Button size="sm" onClick={() => handleOpenForm()} className="h-11 px-6 rounded-2xl shadow-lg shadow-indigo-500/20">
            <Plus className="mr-2 h-4 w-4" /> New Contact
          </Button>
        </div>
      </div>

      <Table
        columns={columns as any}
        data={contacts}
        isLoading={isLoading}
        onRowClick={(contact) => setDetailContact(contact)}
        selection={{
          selectedIds,
          onSelectionChange: setSelectedIds
        }}
        pagination={{ page, limit, total, onPageChange }}
        sort={{ key: sortBy, order: sortOrder, onSort }}
        bulkActions={
          <>
            {selectedIds.length === 2 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setMergeModalOpen(true)}
                className="bg-indigo-500/10 border-indigo-500/20 text-indigo-500 hover:bg-indigo-500 hover:text-white"
              >
                <Combine className="mr-2 h-3.5 w-3.5" /> Merge
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={handleBulkDelete}
              className="bg-red-500/10 border-red-500/20 text-red-500 hover:bg-red-500 hover:text-white"
            >
              Delete Selected
            </Button>
          </>
        }
        emptyState={{
          title: "No contacts found",
          description: "Start by creating a new contact or adjusting your search filters.",
          variant: 'general'
        }}
      />

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

      {mergeModalOpen && selectedIds.length === 2 && (
        <MergeContactsModal
          source={contacts.find(c => c.id === selectedIds[0])!}
          target={contacts.find(c => c.id === selectedIds[1])!}
          onClose={() => { setMergeModalOpen(false); setSelectedIds([]); }}
        />
      )}
    </div>
  );
}

function ActionsMenu({ contact, onEdit, onDelete }: { contact: Contact; onEdit: () => void; onDelete: () => void }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <Button variant="ghost" size="icon" onClick={() => setOpen(v => !v)} className="h-8 w-8 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700">
        <MoreHorizontal className="h-4 w-4" />
      </Button>
      {open && (
        <>
          <div className="fixed inset-0 z-20" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full z-30 mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-2xl py-2 w-48 animate-in fade-in slide-in-from-top-1 duration-150">
            <button onClick={() => { onEdit(); setOpen(false); }} className="w-full text-left px-4 py-2.5 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors uppercase tracking-widest">Edit Contact</button>
            <div className="h-px bg-slate-100 dark:bg-slate-700 my-1" />
            <button onClick={() => { onDelete(); setOpen(false); }} className="w-full text-left px-4 py-2.5 text-xs font-bold text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors uppercase tracking-widest">Delete Contact</button>
          </div>
        </>
      )}
    </div>
  );
}
