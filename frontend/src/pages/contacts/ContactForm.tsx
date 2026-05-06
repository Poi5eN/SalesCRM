import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { X, Search, AlertTriangle, ArrowRight } from 'lucide-react';
import * as contactsApi from '@/api/contacts.api.ts';
import * as companiesApi from '@/api/companies.api.ts';
import { Button } from '@/components/ui/Button.tsx';
import { useDebounce } from '@/hooks/useDebounce.ts';
import type { Contact, Company } from '@/types/api.types.ts';

interface ContactFormProps {
  contact?: Contact | null;
  onClose: () => void;
  onSuccess?: (contact: Contact) => void;
  onUseExisting?: (contact: Contact) => void;
  prefillCompanyId?: string;
}

interface FormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  whatsapp: string;
  companyId: string;
  designation: string;
  department: string;
  linkedInUrl: string;
  tags: string;
  notes: string;
}

const INITIAL_FORM: FormData = {
  firstName: '', lastName: '', email: '', phone: '', whatsapp: '',
  companyId: '', designation: '', department: '', linkedInUrl: '', tags: '', notes: ''
};

export function ContactForm({ contact, onClose, onSuccess, onUseExisting, prefillCompanyId }: ContactFormProps) {
  const qc = useQueryClient();
  const [form, setForm] = useState<FormData>(() => {
    if (contact) {
      return {
        firstName: contact.firstName, lastName: contact.lastName ?? '',
        email: contact.email ?? '', phone: contact.phone ?? '', whatsapp: contact.whatsapp ?? '',
        companyId: contact.companyId ?? '', designation: contact.designation ?? '',
        department: contact.department ?? '', linkedInUrl: contact.linkedinUrl ?? '',
        tags: contact.tags?.join(', ') ?? '', notes: ''
      };
    }
    return { ...INITIAL_FORM, companyId: prefillCompanyId ?? '' };
  });

  // Company Search
  const [companySearch, setCompanySearch] = useState('');
  const [showCompanyDD, setShowCompanyDD] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(contact?.company ?? null);
  const compRef = useRef<HTMLDivElement>(null);

  // Duplicate check
  const debouncedEmail = useDebounce(form.email, 500);
  const debouncedPhone = useDebounce(form.phone, 500);

  // Only check duplicates if we're creating a new contact
  const { data: duplicatesData, isFetching: checkingDuplicates } = useQuery({
    queryKey: ['contacts-duplicate-check', debouncedEmail, debouncedPhone],
    queryFn: async () => {
      // Build search query based on what's typed
      const searches = [];
      if (debouncedEmail && debouncedEmail.length > 3) searches.push(contactsApi.getContacts({ search: debouncedEmail, limit: 5 }));
      if (debouncedPhone && debouncedPhone.length > 5) searches.push(contactsApi.getContacts({ search: debouncedPhone, limit: 5 }));

      if (searches.length === 0) return { data: { data: [] } };

      const results = await Promise.all(searches);
      // Combine and deduplicate
      const allMatches = results.flatMap(r => r.data.data);
      const uniqueIds = new Set();
      const uniqueMatches = [];
      for (const m of allMatches) {
        if (!uniqueIds.has(m.id) && m.id !== contact?.id) {
          uniqueIds.add(m.id);
          uniqueMatches.push(m);
        }
      }
      return { data: { data: uniqueMatches } };
    },
    enabled: !contact && (debouncedEmail.length > 3 || debouncedPhone.length > 5),
  });

  const duplicates: Contact[] = duplicatesData?.data?.data ?? [];

  const { data: companiesData } = useQuery({
    queryKey: ['companies-search', companySearch],
    queryFn: () => companiesApi.getCompanies({ search: companySearch, limit: 10 }),
    enabled: companySearch.length >= 2,
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => contactsApi.createContact(data),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ['contacts'] });
      onSuccess?.(res.data);
      onClose();
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: any) => contactsApi.updateContact(contact!.id, data),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ['contacts'] });
      qc.invalidateQueries({ queryKey: ['contact', contact!.id] });
      onSuccess?.(res.data);
      onClose();
    },
  });

  useEffect(() => {
    // If prefilling companyId but we don't have the object, we'd ideally fetch it, 
    // but we can just let it be ID for now or it should be passed in fully.
    const handler = (e: MouseEvent) => {
      if (compRef.current && !compRef.current.contains(e.target as Node)) {
        setShowCompanyDD(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleCompanySelect = (comp: Company) => {
    setSelectedCompany(comp);
    setForm(f => ({ ...f, companyId: comp.id }));
    setShowCompanyDD(false);
    setCompanySearch('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload: any = {
      firstName: form.firstName,
      lastName: form.lastName || undefined,
      email: form.email || undefined,
      phone: form.phone || undefined,
      whatsapp: form.whatsapp || undefined,
      designation: form.designation || undefined,
      department: form.department || undefined,
      linkedInUrl: form.linkedInUrl || undefined,
      tags: form.tags ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
    };
    if (form.companyId) payload.companyId = form.companyId;

    if (contact) updateMutation.mutate(payload);
    else createMutation.mutate(payload);
  };

  const companies: Company[] = companiesData?.data?.data ?? [];
  const isSaving = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-slate-200 shrink-0">
          <h2 className="text-lg font-bold text-slate-900">{contact ? 'Edit Contact' : 'New Contact'}</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
            <X className="h-5 w-5 text-slate-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">First Name <span className="text-red-500">*</span></label>
              <input
                required
                value={form.firstName}
                onChange={e => setForm(f => ({ ...f, firstName: e.target.value }))}
                placeholder="Jane"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 bg-slate-50"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Last Name</label>
              <input
                value={form.lastName}
                onChange={e => setForm(f => ({ ...f, lastName: e.target.value }))}
                placeholder="Doe"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 bg-slate-50"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Email</label>
              <input
                type="email"
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                placeholder="jane@example.com"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 bg-slate-50"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Phone</label>
              <input
                value={form.phone}
                onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                placeholder="+1 (555) 000-0000"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 bg-slate-50"
              />
            </div>
          </div>

          {/* Duplicate Warning */}
          {duplicates.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3 shadow-sm animate-in fade-in slide-in-from-top-2">
              <AlertTriangle className="h-5 w-5 text-amber-500 flex-shrink-0" />
              <div className="flex-1">
                <h4 className="text-sm font-bold text-amber-800">Similar contacts found</h4>
                <p className="text-xs text-amber-700 mt-1 mb-3">We found {duplicates.length} contact{duplicates.length > 1 ? 's' : ''} with similar details. Avoid creating duplicates.</p>
                <div className="space-y-2">
                  {duplicates.map(dup => (
                    <div key={dup.id} className="flex items-center justify-between bg-white border border-amber-100 rounded-lg p-2.5">
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold text-slate-800">{dup.firstName} {dup.lastName}</span>
                        <span className="text-xs text-slate-500">{dup.email || dup.phone}</span>
                      </div>
                      <Button size="sm" variant="outline" type="button" onClick={() => { onClose(); onUseExisting?.(dup); }} className="text-xs py-1 h-auto text-amber-700 border-amber-300 hover:bg-amber-100">
                        Use existing <ArrowRight className="h-3 w-3 ml-1" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          <div ref={compRef}>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Company</label>
            {selectedCompany ? (
              <div className="flex items-center justify-between px-3 py-2 border border-slate-200 rounded-lg bg-slate-50">
                <div className="flex items-center space-x-2">
                  <div className="h-6 w-6 rounded-lg bg-slate-200 flex items-center justify-center text-slate-600 text-[10px] font-bold">
                    {selectedCompany.name.charAt(0)}
                  </div>
                  <span className="text-sm font-medium text-slate-800">{selectedCompany.name}</span>
                </div>
                <button type="button" onClick={() => { setSelectedCompany(null); setForm(f => ({ ...f, companyId: '' })); }} className="text-slate-400 hover:text-red-500">
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  value={companySearch}
                  onChange={e => { setCompanySearch(e.target.value); setShowCompanyDD(true); }}
                  onFocus={() => companySearch.length >= 2 && setShowCompanyDD(true)}
                  placeholder="Search companies..."
                  className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 bg-slate-50"
                />
                {showCompanyDD && companies.length > 0 && (
                  <div className="absolute top-full left-0 right-0 z-20 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg max-h-48 overflow-y-auto">
                    {companies.map(c => (
                      <button key={c.id} type="button" onClick={() => handleCompanySelect(c)}
                        className="w-full flex items-center space-x-3 px-4 py-2.5 hover:bg-slate-50 text-left">
                        <div className="h-7 w-7 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600 text-xs font-bold">
                          {c.name.charAt(0)}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-800">{c.name}</p>
                          <p className="text-xs text-slate-500">{c.industry || c.domain}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Designation</label>
              <input
                value={form.designation}
                onChange={e => setForm(f => ({ ...f, designation: e.target.value }))}
                placeholder="e.g. CTO"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 bg-slate-50"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Department</label>
              <input
                value={form.department}
                onChange={e => setForm(f => ({ ...f, department: e.target.value }))}
                placeholder="e.g. Engineering"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 bg-slate-50"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">WhatsApp</label>
              <input
                value={form.whatsapp}
                onChange={e => setForm(f => ({ ...f, whatsapp: e.target.value }))}
                placeholder="+1 (555) 000-0000"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 bg-slate-50"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">LinkedIn URL</label>
              <input
                value={form.linkedInUrl}
                onChange={e => setForm(f => ({ ...f, linkedInUrl: e.target.value }))}
                placeholder="https://linkedin.com/in/..."
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 bg-slate-50"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Tags <span className="text-slate-400 font-normal">(comma separated)</span></label>
            <input
              value={form.tags}
              onChange={e => setForm(f => ({ ...f, tags: e.target.value }))}
              placeholder="e.g. decision-maker, VIP"
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 bg-slate-50"
            />
          </div>

          {!contact && (
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Notes</label>
              <textarea
                rows={3}
                value={form.notes}
                onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                placeholder="Initial context..."
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 bg-slate-50 resize-none"
              />
            </div>
          )}

          {/* Error */}
          {(createMutation.isError || updateMutation.isError) && (
            <p className="text-sm text-red-600 bg-red-50 p-3 rounded-lg border border-red-100">
              {(createMutation.error || updateMutation.error as any)?.message ?? 'Something went wrong'}
            </p>
          )}

          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-100">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" isLoading={isSaving} disabled={checkingDuplicates && duplicates.length > 0}>
              {contact ? 'Save Changes' : 'Create Contact'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
