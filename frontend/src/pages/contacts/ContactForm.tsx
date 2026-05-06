import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { X, Search, AlertTriangle, ArrowRight, Check } from 'lucide-react';
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

  const [confirmNew, setConfirmNew] = useState(false);

  // Company Search
  const [companySearch, setCompanySearch] = useState('');
  const [showCompanyDD, setShowCompanyDD] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(contact?.company ?? null);
  const compRef = useRef<HTMLDivElement>(null);

  // Duplicate check
  const debouncedEmail = useDebounce(form.email, 500);
  const debouncedPhone = useDebounce(form.phone, 500);

  const { data: duplicatesData, isFetching: checkingDuplicates } = useQuery({
    queryKey: ['contacts-duplicate-check', debouncedEmail, debouncedPhone],
    queryFn: () => contactsApi.checkDuplicate({ 
      email: debouncedEmail.length > 3 ? debouncedEmail : undefined, 
      phone: debouncedPhone.length > 5 ? debouncedPhone : undefined 
    }),
    enabled: !contact && (debouncedEmail.length > 3 || debouncedPhone.length > 5),
  });

  const duplicates: Contact[] = duplicatesData?.data?.duplicates || [];

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
    
    if (duplicates.length > 0 && !confirmNew) return;

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
      <div className="bg-white dark:bg-slate-800 rounded-[32px] shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-slate-200 dark:border-slate-700">
        <div className="flex items-center justify-between p-8 border-b border-slate-100 dark:border-slate-700 shrink-0">
          <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">{contact ? 'Modify Entity' : 'New Contact Entry'}</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors">
            <X className="h-5 w-5 text-slate-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">First Name</label>
              <input
                required
                value={form.firstName}
                onChange={e => setForm(f => ({ ...f, firstName: e.target.value }))}
                placeholder="Jane"
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Last Name</label>
              <input
                value={form.lastName}
                onChange={e => setForm(f => ({ ...f, lastName: e.target.value }))}
                placeholder="Doe"
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Email Identifier</label>
              <input
                type="email"
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                placeholder="jane@example.com"
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Phone Number</label>
              <input
                value={form.phone}
                onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                placeholder="+1 (555) 000-0000"
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>
          </div>

          {/* Duplicate Warning Banner */}
          {duplicates.length > 0 && (
            <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-900/30 rounded-[24px] p-6 flex gap-4 animate-in fade-in slide-in-from-top-2 duration-300">
              <div className="h-10 w-10 rounded-xl bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center shrink-0">
                <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-500" />
              </div>
              <div className="flex-1 space-y-4">
                <div>
                  <h4 className="text-sm font-black text-amber-900 dark:text-amber-400 uppercase tracking-tight">Intelligence Match Found</h4>
                  <p className="text-[11px] font-bold text-amber-700 dark:text-amber-500/80 mt-1 leading-relaxed">
                    We've detected {duplicates.length} existing record{duplicates.length > 1 ? 's' : ''} with similar credentials. 
                    Redundancy degrades system integrity.
                  </p>
                </div>
                
                <div className="grid grid-cols-1 gap-2">
                  {duplicates.map(dup => (
                    <div key={dup.id} className="flex items-center justify-between bg-white dark:bg-slate-900/50 border border-amber-100 dark:border-amber-900/20 rounded-xl p-3">
                      <div className="flex flex-col">
                        <span className="text-xs font-black text-slate-800 dark:text-slate-200">{dup.firstName} {dup.lastName}</span>
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{dup.email || dup.phone}</span>
                      </div>
                      <button 
                        type="button" 
                        onClick={() => { onClose(); onUseExisting?.(dup); }}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-500 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-amber-100 transition-colors"
                      >
                        Merge/View <ArrowRight className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <button 
                    type="button"
                    onClick={() => setConfirmNew(!confirmNew)}
                    className={`h-5 w-5 rounded border-2 flex items-center justify-center transition-all ${confirmNew ? 'bg-amber-500 border-amber-500' : 'border-amber-300 dark:border-amber-800'}`}
                  >
                    {confirmNew && <Check className="h-3 w-3 text-white stroke-[4px]" />}
                  </button>
                  <span className="text-[10px] font-black text-amber-700 dark:text-amber-500 uppercase tracking-widest cursor-pointer select-none" onClick={() => setConfirmNew(!confirmNew)}>
                    I confirm this is a unique entry and not a duplicate
                  </span>
                </div>
              </div>
            </div>
          )}

          <div ref={compRef} className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Affiliated Company</label>
            {selectedCompany ? (
              <div className="flex items-center justify-between px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-2xl bg-slate-50 dark:bg-slate-900">
                <div className="flex items-center space-x-3">
                  <div className="h-8 w-8 rounded-xl bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-400 text-[10px] font-black">
                    {selectedCompany.name.charAt(0)}
                  </div>
                  <span className="text-sm font-bold text-slate-900 dark:text-white">{selectedCompany.name}</span>
                </div>
                <button type="button" onClick={() => { setSelectedCompany(null); setForm(f => ({ ...f, companyId: '' })); }} className="text-slate-400 hover:text-red-500">
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  value={companySearch}
                  onChange={e => { setCompanySearch(e.target.value); setShowCompanyDD(true); }}
                  onFocus={() => companySearch.length >= 2 && setShowCompanyDD(true)}
                  placeholder="Search companies..."
                  className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
                {showCompanyDD && companies.length > 0 && (
                  <div className="absolute top-full left-0 right-0 z-20 mt-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl max-h-48 overflow-y-auto custom-scrollbar p-1">
                    {companies.map(c => (
                      <button key={c.id} type="button" onClick={() => handleCompanySelect(c)}
                        className="w-full flex items-center space-x-3 px-3 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-700/50 rounded-xl text-left transition-colors">
                        <div className="h-8 w-8 rounded-xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-500 text-[10px] font-black">
                          {c.name.charAt(0)}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-800 dark:text-slate-200">{c.name}</p>
                          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{c.industry || c.domain}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Designation</label>
              <input
                value={form.designation}
                onChange={e => setForm(f => ({ ...f, designation: e.target.value }))}
                placeholder="e.g. Chief Operations Officer"
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Department</label>
              <input
                value={form.department}
                onChange={e => setForm(f => ({ ...f, department: e.target.value }))}
                placeholder="e.g. Growth & Strategy"
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Strategic Notes</label>
            <textarea
              rows={3}
              value={form.notes}
              onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              placeholder="Contextual data for internal intelligence..."
              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 resize-none"
            />
          </div>

          <div className="flex items-center justify-end space-x-4 pt-4">
            <Button type="button" variant="ghost" onClick={onClose} className="font-black uppercase tracking-widest text-[10px]">Abandon</Button>
            <Button 
              type="submit" 
              isLoading={isSaving} 
              disabled={duplicates.length > 0 && !confirmNew}
              className="px-8 rounded-2xl shadow-lg shadow-indigo-500/20"
            >
              {contact ? 'Commit Changes' : 'Initialize Contact'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
