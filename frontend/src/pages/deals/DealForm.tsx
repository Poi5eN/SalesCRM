import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { X, Search } from 'lucide-react';
import * as dealsApi from '@/api/deals.api.ts';
import * as contactsApi from '@/api/contacts.api.ts';
import * as pipelineApi from '@/api/pipeline.api.ts';
import * as usersApi from '@/api/users.api.ts';
import { Button } from '@/components/ui/Button.tsx';
import type { Deal, Contact, PipelineStage } from '@/types/api.types.ts';
import { DEAL_STATUS_OPTIONS } from './dealUtils.ts';

interface DealFormProps {
  deal?: Deal | null;
  defaultStageId?: string;
  onClose: () => void;
  onSuccess?: (deal: Deal) => void;
  prefill?: any; // From lead conversion
}

interface FormData {
  title: string;
  stageId: string;
  contactId: string;
  companyId: string;
  value: string;
  currency: string;
  probability: string;
  status: string;
  expectedCloseAt: string;
  assignedToId: string;
  description: string;
  tags: string;
  lostReason: string;
}

const INITIAL_FORM: FormData = {
  title: '', stageId: '', contactId: '', companyId: '',
  value: '', currency: 'USD', probability: '50', status: 'open',
  expectedCloseAt: '', assignedToId: '', description: '', tags: '', lostReason: ''
};

export function DealForm({ deal, defaultStageId, onClose, onSuccess, prefill }: DealFormProps) {
  const qc = useQueryClient();
  const [form, setForm] = useState<FormData>(() => {
    if (deal) {
      return {
        title: deal.title, stageId: deal.stageId, contactId: deal.contactId ?? '',
        companyId: deal.companyId ?? '', value: deal.value?.toString() ?? '', currency: deal.currency ?? 'USD',
        probability: deal.probability?.toString() ?? '50', status: deal.status,
        expectedCloseAt: deal.expectedCloseAt ? deal.expectedCloseAt.split('T')[0] : '',
        assignedToId: deal.assignedToId ?? '', description: deal.description ?? '',
        tags: deal.tags?.join(', ') ?? '', lostReason: (deal as any).lostReason ?? ''
      };
    }
    if (prefill) {
      return { ...INITIAL_FORM, title: prefill.title, contactId: prefill.contactId ?? '', companyId: prefill.companyId ?? '' };
    }
    return { ...INITIAL_FORM, stageId: defaultStageId ?? '' };
  });

  const [contactSearch, setContactSearch] = useState('');
  const [showContactDD, setShowContactDD] = useState(false);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(deal?.contact ?? prefill?.contact ?? null);
  const contactRef = useRef<HTMLDivElement>(null);

  const { data: stagesData } = useQuery({
    queryKey: ['pipeline-stages', 'deal'],
    queryFn: () => pipelineApi.getStages({ type: 'deal', isActive: true }),
  });

  const { data: contactsData } = useQuery({
    queryKey: ['contacts-search', contactSearch],
    queryFn: () => contactsApi.getContacts({ search: contactSearch, limit: 10 }),
    enabled: contactSearch.length >= 2,
  });

  const { data: usersData } = useQuery({
    queryKey: ['users'],
    queryFn: () => usersApi.getUsers(),
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => dealsApi.createDeal(data),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ['deals'] });
      onSuccess?.(res.data);
      onClose();
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: any) => dealsApi.updateDeal(deal!.id, data),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ['deals'] });
      qc.invalidateQueries({ queryKey: ['deal', deal!.id] });
      onSuccess?.(res.data);
      onClose();
    },
  });

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (contactRef.current && !contactRef.current.contains(e.target as Node)) {
        setShowContactDD(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleContactSelect = (contact: Contact) => {
    setSelectedContact(contact);
    setForm(f => ({ ...f, contactId: contact.id, companyId: contact.companyId ?? f.companyId }));
    setShowContactDD(false);
    setContactSearch('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload: any = {
      title: form.title, stageId: form.stageId, status: form.status,
      currency: form.currency, description: form.description || undefined,
      tags: form.tags ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
    };
    if (form.contactId) payload.contactId = form.contactId;
    if (form.companyId) payload.companyId = form.companyId;
    if (form.assignedToId) payload.assignedToId = form.assignedToId;
    if (form.value) payload.value = parseFloat(form.value);
    if (form.probability) payload.probability = parseInt(form.probability);
    if (form.expectedCloseAt) payload.expectedCloseAt = new Date(form.expectedCloseAt).toISOString();
    if (form.status === 'lost' && form.lostReason) payload.lostReason = form.lostReason;

    if (deal) updateMutation.mutate(payload);
    else createMutation.mutate(payload);
  };

  const stages: PipelineStage[] = (stagesData?.data as any) || [];
  const contacts: Contact[] = contactsData?.data?.data ?? [];
  const users = usersData?.data?.data ?? [];
  const isSaving = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <h2 className="text-lg font-bold text-slate-900">{deal ? 'Edit Deal' : 'New Deal'}</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
            <X className="h-5 w-5 text-slate-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Title */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Title <span className="text-red-500">*</span></label>
            <input
              required
              value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              placeholder="e.g. Enterprise License - Q4"
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 bg-slate-50"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Stage */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Stage <span className="text-red-500">*</span></label>
              <select
                required
                value={form.stageId}
                onChange={e => setForm(f => ({ ...f, stageId: e.target.value }))}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 bg-slate-50"
              >
                <option value="">Select stage</option>
                {stages.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            {/* Status */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Status <span className="text-red-500">*</span></label>
              <select
                required
                value={form.status}
                onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 bg-slate-50"
              >
                {DEAL_STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
          </div>

          {/* Contact searchable select */}
          <div ref={contactRef}>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Contact</label>
            {selectedContact ? (
              <div className="flex items-center justify-between px-3 py-2 border border-slate-200 rounded-lg bg-slate-50">
                <div className="flex items-center space-x-2">
                  <div className="h-6 w-6 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 text-[10px] font-bold">
                    {selectedContact.firstName.charAt(0)}
                  </div>
                  <span className="text-sm font-medium text-slate-800">{selectedContact.firstName} {selectedContact.lastName}</span>
                  <span className="text-xs text-slate-500">{selectedContact.email}</span>
                </div>
                <button type="button" onClick={() => { setSelectedContact(null); setForm(f => ({ ...f, contactId: '' })); }} className="text-slate-400 hover:text-red-500">
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  value={contactSearch}
                  onChange={e => { setContactSearch(e.target.value); setShowContactDD(true); }}
                  onFocus={() => contactSearch.length >= 2 && setShowContactDD(true)}
                  placeholder="Search contacts..."
                  className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 bg-slate-50"
                />
                {showContactDD && contacts.length > 0 && (
                  <div className="absolute top-full left-0 right-0 z-20 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg max-h-48 overflow-y-auto">
                    {contacts.map(c => (
                      <button key={c.id} type="button" onClick={() => handleContactSelect(c)}
                        className="w-full flex items-center space-x-3 px-4 py-2.5 hover:bg-slate-50 text-left">
                        <div className="h-7 w-7 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 text-xs font-bold">
                          {c.firstName.charAt(0)}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-800">{c.firstName} {c.lastName}</p>
                          <p className="text-xs text-slate-500">{c.email ?? c.company?.name}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Value */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Value</label>
              <div className="flex">
                <select
                  value={form.currency}
                  onChange={e => setForm(f => ({ ...f, currency: e.target.value }))}
                  className="border border-r-0 border-slate-200 rounded-l-lg px-2 text-sm bg-slate-50 focus:outline-none"
                >
                  <option>USD</option><option>INR</option><option>EUR</option><option>GBP</option>
                </select>
                <input
                  type="number"
                  value={form.value}
                  onChange={e => setForm(f => ({ ...f, value: e.target.value }))}
                  placeholder="0"
                  className="flex-1 px-3 py-2 border border-slate-200 rounded-r-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 bg-slate-50"
                />
              </div>
            </div>
            {/* Probability */}
            <div>
              <div className="flex justify-between mb-1.5">
                <label className="block text-sm font-semibold text-slate-700">Probability</label>
                <span className="text-sm font-bold text-slate-900">{form.probability}%</span>
              </div>
              <input
                type="range" min="0" max="100" step="5"
                value={form.probability}
                onChange={e => setForm(f => ({ ...f, probability: e.target.value }))}
                className="w-full accent-indigo-600 cursor-pointer mt-1"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Expected Close */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Expected Close <span className="text-red-500">*</span></label>
              <input
                required
                type="date"
                value={form.expectedCloseAt}
                onChange={e => setForm(f => ({ ...f, expectedCloseAt: e.target.value }))}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 bg-slate-50"
              />
            </div>
            {/* Assigned To */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Assigned To</label>
              <select
                value={form.assignedToId}
                onChange={e => setForm(f => ({ ...f, assignedToId: e.target.value }))}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 bg-slate-50"
              >
                <option value="">Unassigned</option>
                {users.map((u: any) => (
                  <option key={u.id} value={u.id}>{u.firstName} {u.lastName}</option>
                ))}
              </select>
            </div>
          </div>

          {form.status === 'lost' && (
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Lost Reason</label>
              <select
                value={form.lostReason}
                onChange={e => setForm(f => ({ ...f, lostReason: e.target.value }))}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 bg-slate-50"
              >
                <option value="">Select a reason...</option>
                <option value="price">Price</option>
                <option value="competitor">Competitor</option>
                <option value="timing">Timing</option>
                <option value="features">Missing Features</option>
                <option value="ghosted">Ghosted</option>
                <option value="other">Other</option>
              </select>
            </div>
          )}

          {/* Description */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Description</label>
            <textarea
              rows={3}
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              placeholder="Add notes or context..."
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 bg-slate-50 resize-none"
            />
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Tags <span className="text-slate-400 font-normal">(comma separated)</span></label>
            <input
              value={form.tags}
              onChange={e => setForm(f => ({ ...f, tags: e.target.value }))}
              placeholder="e.g. enterprise, renewal"
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 bg-slate-50"
            />
          </div>

          {/* Error */}
          {(createMutation.isError || updateMutation.isError) && (
            <p className="text-sm text-red-600 bg-red-50 p-3 rounded-lg border border-red-100">
              {(createMutation.error || updateMutation.error as any)?.message ?? 'Something went wrong'}
            </p>
          )}

          <div className="flex items-center justify-end space-x-3 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" isLoading={isSaving}>
              {deal ? 'Save Changes' : 'Create Deal'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
