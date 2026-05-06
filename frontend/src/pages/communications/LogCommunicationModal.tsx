import { useState, useEffect, useRef } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { X, Calendar, Clock, Link as LinkIcon, Search, FileText, Layout } from 'lucide-react';
import { EmailTemplatePicker } from '@/components/emailTemplates/EmailTemplatePicker.tsx';
import * as emailTemplatesApi from '@/api/emailTemplates.api.ts';
import { format } from 'date-fns';
import * as commsApi from '@/api/communications.api.ts';
import * as leadsApi from '@/api/leads.api.ts';
import * as dealsApi from '@/api/deals.api.ts';
import * as contactsApi from '@/api/contacts.api.ts';
import * as tasksApi from '@/api/tasks.api.ts';
import { useAuth } from '@/hooks/useAuth.ts';
import { useUIStore } from '@/store/ui.store.ts';
import { Button } from '@/components/ui/Button.tsx';
import { useDebounce } from '@/hooks/useDebounce.ts';

interface LogCommunicationModalProps {
  onClose: () => void;
  prefill?: {
    leadId?: string;
    dealId?: string;
    contactId?: string;
  };
}

export function LogCommunicationModal({ onClose, prefill }: LogCommunicationModalProps) {
  const qc = useQueryClient();
  const { user } = useAuth();
  const { openTaskForm, confirm } = useUIStore();

  const [form, setForm] = useState({
    type: 'note',
    direction: 'outbound',
    subject: '',
    body: '',
    outcome: '',
    durationMinutes: '',
    occurredAtDate: format(new Date(), 'yyyy-MM-dd'),
    occurredAtTime: format(new Date(), 'HH:mm'),
    leadId: prefill?.leadId ?? '',
    dealId: prefill?.dealId ?? '',
    contactId: prefill?.contactId ?? '',
  });

  const [linkType, setLinkType] = useState<'lead' | 'deal' | 'contact' | 'none'>(() => {
    if (form.leadId) return 'lead';
    if (form.dealId) return 'deal';
    if (form.contactId) return 'contact';
    return 'none';
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchDD, setShowSearchDD] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const [showTemplatePicker, setShowTemplatePicker] = useState(false);
  const debouncedSearch = useDebounce(searchQuery, 300);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) setShowSearchDD(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const { data: searchResults } = useQuery({
    queryKey: ['comm-link-search', linkType, debouncedSearch],
    queryFn: async () => {
      if (linkType === 'none' || debouncedSearch.length < 2) return [];
      if (linkType === 'lead') return (await leadsApi.getLeads({ search: debouncedSearch, limit: 5 })).data.data;
      if (linkType === 'deal') return (await dealsApi.getDeals({ search: debouncedSearch, limit: 5 })).data.data;
      if (linkType === 'contact') return (await contactsApi.getContacts({ search: debouncedSearch, limit: 5 })).data.data;
      return [];
    },
    enabled: linkType !== 'none' && debouncedSearch.length >= 2,
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => commsApi.createCommunication(data),
    onSuccess: async () => {
      qc.invalidateQueries({ queryKey: ['communications'] });
      
      // Automation check: if outcome suggests follow-up, check open tasks
      const followUpOutcomes = ['Callback requested', 'Meeting scheduled', 'Interested'];
      if (followUpOutcomes.includes(form.outcome)) {
        // Query to check if the linked entity has any open tasks
        const hasOpenTask = await checkForOpenTasks();
        if (!hasOpenTask) {
          const ok = await confirm({
            title: 'Create Follow-up Task?',
            message: `You marked the outcome as "${form.outcome}". Would you like to create a follow-up task?`,
            confirmText: 'Yes, create task',
            cancelText: 'No thanks'
          });
          if (ok) {
            openTaskForm({
              leadId: form.leadId || undefined,
              dealId: form.dealId || undefined,
              contactId: form.contactId || undefined,
            });
          }
        }
      }
      onClose();
    },
  });

  const checkForOpenTasks = async () => {
    try {
      const qp: any = { status: 'pending', limit: 1 };
      if (form.leadId) qp.leadId = form.leadId;
      else if (form.dealId) qp.dealId = form.dealId;
      else if (form.contactId) qp.contactId = form.contactId;
      else return true; // No linked entity to attach task to

      const res = await tasksApi.getTasks(qp);
      return res.data.data.length > 0;
    } catch {
      return true; // Fail safe
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (linkType === 'none' || (!form.leadId && !form.dealId && !form.contactId)) {
      alert("You must link this communication to a Lead, Deal, or Contact.");
      return;
    }

    const dt = new Date(`${form.occurredAtDate}T${form.occurredAtTime}`);
    const payload: any = {
      type: form.type,
      direction: form.direction,
      sourceType: 'human',
      subject: form.subject || undefined,
      body: form.body || undefined,
      outcome: form.outcome || undefined,
      durationSeconds: form.durationMinutes ? parseInt(form.durationMinutes) * 60 : undefined,
      occurredAt: dt.toISOString(),
      leadId: linkType === 'lead' ? form.leadId || undefined : undefined,
      dealId: linkType === 'deal' ? form.dealId || undefined : undefined,
      contactId: linkType === 'contact' ? form.contactId || undefined : undefined,
    };

    createMutation.mutate(payload);
  };

  const handleTemplateSelect = async (template: any) => {
    try {
      const res = await emailTemplatesApi.previewTemplate(template.id, {
        leadId: form.leadId || undefined,
        dealId: form.dealId || undefined,
        contactId: form.contactId || undefined
      });
      
      if (res.success) {
        setForm(f => ({
          ...f,
          subject: res.data.subject,
          body: res.data.body
        }));
      }
    } catch (err) {
      console.error('Failed to preview template:', err);
    } finally {
      setShowTemplatePicker(false);
    }
  };

  const showSubject = ['email', 'meeting'].includes(form.type);
  const showDuration = ['call', 'meeting'].includes(form.type);

  const OUTCOME_SUGGESTIONS = [
    "Interested", "Not interested", "Callback requested", "No answer", "Meeting scheduled", "Left voicemail"
  ];

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] flex flex-col animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-5 border-b border-slate-200 shrink-0">
          <h2 className="text-lg font-bold text-slate-900">Log Communication</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
            <X className="h-5 w-5 text-slate-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Type <span className="text-red-500">*</span></label>
              <select
                value={form.type}
                onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 bg-slate-50"
              >
                <option value="email">Email</option>
                <option value="call">Call</option>
                <option value="meeting">Meeting</option>
                <option value="note">Note</option>
                <option value="sms">SMS</option>
                <option value="whatsapp">WhatsApp</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Direction <span className="text-red-500">*</span></label>
              <select
                value={form.direction}
                onChange={e => setForm(f => ({ ...f, direction: e.target.value }))}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 bg-slate-50"
              >
                <option value="inbound">Inbound</option>
                <option value="outbound">Outbound</option>
                <option value="internal">Internal</option>
              </select>
            </div>
          </div>

          <div className="border border-amber-200 bg-amber-50 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <LinkIcon className="h-4 w-4 text-amber-600" />
              <span className="text-sm font-semibold text-amber-900">Link to Entity <span className="text-red-500">*</span></span>
              <select 
                value={linkType} 
                onChange={e => { setLinkType(e.target.value as any); setSearchQuery(''); setForm(f => ({...f, leadId:'', dealId:'', contactId:''})); }}
                className="bg-white border border-amber-200 text-sm font-medium focus:outline-none ml-auto text-amber-900 px-2 py-1 rounded"
              >
                <option value="none">Select type...</option>
                <option value="lead">Lead</option>
                <option value="deal">Deal</option>
                <option value="contact">Contact</option>
              </select>
            </div>
            
            {linkType !== 'none' && (
              <div className="relative" ref={searchRef}>
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                <input
                  value={searchQuery}
                  onChange={e => { setSearchQuery(e.target.value); setShowSearchDD(true); }}
                  onFocus={() => searchQuery.length >= 2 && setShowSearchDD(true)}
                  placeholder={`Search ${linkType}s...`}
                  className="w-full pl-8 pr-3 py-1.5 border border-amber-200 rounded-lg text-sm focus:outline-none focus:border-amber-400 bg-white"
                />
                {showSearchDD && (searchResults?.length ?? 0) > 0 && (
                  <div className="absolute top-full left-0 right-0 z-20 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg max-h-48 overflow-y-auto">
                    {searchResults?.map((item: any) => (
                      <button 
                        key={item.id} type="button" 
                        onClick={() => {
                          setForm(f => ({ ...f, [`${linkType}Id`]: item.id }));
                          setSearchQuery(item.title || `${item.firstName} ${item.lastName}`);
                          setShowSearchDD(false);
                        }}
                        className="w-full px-4 py-2 text-sm text-left hover:bg-slate-50 border-b border-slate-100 last:border-0"
                      >
                        {item.title || `${item.firstName} ${item.lastName}`}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Date</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="date"
                  required
                  value={form.occurredAtDate}
                  onChange={e => setForm(f => ({ ...f, occurredAtDate: e.target.value }))}
                  className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 bg-slate-50"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Time</label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="time"
                  required
                  value={form.occurredAtTime}
                  onChange={e => setForm(f => ({ ...f, occurredAtTime: e.target.value }))}
                  className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 bg-slate-50"
                />
              </div>
            </div>
          </div>

          {showSubject && (
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Subject</label>
              <input
                value={form.subject}
                onChange={e => setForm(f => ({ ...f, subject: e.target.value }))}
                placeholder="Brief subject line"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 bg-slate-50"
              />
            </div>
          )}

          {showDuration && (
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Duration (Minutes)</label>
              <input
                type="number"
                min="0"
                value={form.durationMinutes}
                onChange={e => setForm(f => ({ ...f, durationMinutes: e.target.value }))}
                placeholder="e.g. 15"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 bg-slate-50"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Outcome</label>
            <input
              list="outcomes"
              value={form.outcome}
              onChange={e => setForm(f => ({ ...f, outcome: e.target.value }))}
              placeholder="Select or type outcome..."
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 bg-slate-50"
            />
            <datalist id="outcomes">
              {OUTCOME_SUGGESTIONS.map(o => <option key={o} value={o} />)}
            </datalist>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 flex items-center justify-between">
              <span>Body / Notes</span>
              <button 
                type="button" 
                onClick={() => setShowTemplatePicker(true)}
                className="flex items-center gap-1.5 text-[10px] font-black text-indigo-600 hover:text-indigo-700 uppercase tracking-widest transition-colors"
              >
                <Layout className="h-3 w-3" /> Use Blueprint
              </button>
            </label>
            <textarea
              required
              rows={4}
              value={form.body}
              onChange={e => setForm(f => ({ ...f, body: e.target.value }))}
              placeholder="What happened..."
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 bg-slate-50 resize-none font-mono"
            />
          </div>

          <div className="shrink-0 pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" isLoading={createMutation.isPending}>
              Save Log
            </Button>
          </div>
        </form>
      </div>

      {showTemplatePicker && (
        <EmailTemplatePicker 
          onClose={() => setShowTemplatePicker(false)}
          onSelect={handleTemplateSelect}
          type={form.type === 'email' ? 'lead_outreach' : undefined}
        />
      )}
    </div>
  );
}
