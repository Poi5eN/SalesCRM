import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X, Search, User, Loader2, AlertTriangle, ArrowRight, Check } from 'lucide-react';

import * as leadsApi from '@/api/leads.api.ts';
import * as contactsApi from '@/api/contacts.api.ts';
import * as pipelineApi from '@/api/pipeline.api.ts';
import * as usersApi from '@/api/users.api.ts';
import * as campaignsApi from '@/api/campaigns.api.ts';
import { Button } from '@/components/ui/Button.tsx';
import type { Lead, Contact, PipelineStage } from '@/types/api.types.ts';
import { PRIORITY_OPTIONS, SOURCE_OPTIONS } from './leadUtils.ts';
import { queryKeys } from '@/lib/queryKeys.ts';
import { useDebounce } from '@/hooks/useDebounce.ts';

const leadSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  stageId: z.string().min(1, 'Please select a stage'),
  contactId: z.string().optional(),
  companyId: z.string().optional(),
  priority: z.string(),
  source: z.string(),
  estimatedValue: z.string().refine(val => !val || !isNaN(parseFloat(val)), 'Must be a valid number'),
  currency: z.string(),
  expectedCloseAt: z.string().optional(),
  assignedToId: z.string().optional(),
  description: z.string().optional(),
  tags: z.string().optional(),
  campaignId: z.string().optional(),
});

type LeadFormData = z.infer<typeof leadSchema>;

interface LeadFormProps {
  lead?: Lead | null;
  defaultStageId?: string;
  onClose: () => void;
  onSuccess?: (lead: Lead) => void;
}

export function LeadForm({ lead, defaultStageId, onClose, onSuccess }: LeadFormProps) {
  const qc = useQueryClient();
  const [contactSearch, setContactSearch] = useState('');
  const [showContactDD, setShowContactDD] = useState(false);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(lead?.contact ?? null);
  const contactRef = useRef<HTMLDivElement>(null);
  const [confirmNew, setConfirmNew] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<LeadFormData>({
    resolver: zodResolver(leadSchema),
    defaultValues: lead ? {
      title: lead.title,
      stageId: lead.stageId,
      contactId: lead.contactId ?? '',
      companyId: lead.companyId ?? '',
      priority: lead.priority,
      source: lead.source,
      estimatedValue: lead.estimatedValue?.toString() ?? '',
      currency: lead.currency,
      expectedCloseAt: lead.expectedCloseAt ? lead.expectedCloseAt.split('T')[0] : '',
      assignedToId: lead.assignedToId ?? '',
      description: lead.description ?? '',
      tags: lead.tags.join(', '),
      campaignId: lead.campaignId ?? '',
    } : {
      title: '',
      stageId: defaultStageId ?? '',
      priority: 'medium',
      source: 'manual',
      currency: 'USD',
      tags: '',
      campaignId: '',
    },
  });

  const watchedTitle = watch('title');
  const watchedContactId = watch('contactId');
  const watchedCompanyId = watch('companyId');
  const debouncedTitle = useDebounce(watchedTitle, 500);

  const { data: duplicatesData } = useQuery({
    queryKey: ['leads-duplicate-check', debouncedTitle, watchedContactId, watchedCompanyId],
    queryFn: () => leadsApi.checkDuplicate({ 
      title: debouncedTitle, 
      contactId: watchedContactId, 
      companyId: watchedCompanyId 
    }),
    enabled: !lead && debouncedTitle.length >= 3,
  });

  const duplicates = duplicatesData?.data?.duplicates || [];

  const { data: stagesData } = useQuery({
    queryKey: queryKeys.settings.stages,
    queryFn: () => pipelineApi.getStages({ type: 'lead', isActive: true }),
  });

  const { data: contactsData } = useQuery({
    queryKey: ['contacts-search', contactSearch],
    queryFn: () => contactsApi.getContacts({ search: contactSearch, limit: 10 }),
    enabled: contactSearch.length >= 2,
  });

  const { data: usersData } = useQuery({
    queryKey: queryKeys.settings.team,
    queryFn: () => usersApi.getUsers(),
  });

  const { data: campaignsData } = useQuery({
    queryKey: ['campaigns'],
    queryFn: () => campaignsApi.getCampaigns({ limit: 100 }),
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => leadsApi.createLead(data),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: queryKeys.leads.all });
      qc.invalidateQueries({ queryKey: queryKeys.dashboard.summary });
      onSuccess?.(res.data);
      onClose();
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: any) => leadsApi.updateLead(lead!.id, data),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: queryKeys.leads.all });
      qc.invalidateQueries({ queryKey: queryKeys.leads.detail(lead!.id) });
      qc.invalidateQueries({ queryKey: queryKeys.dashboard.summary });
      onSuccess?.(res.data);
      onClose();
    },
  });

  const onSubmit = (data: LeadFormData) => {
    if (duplicates.length > 0 && !confirmNew) return;

    const payload: any = {
      ...data,
      estimatedValue: data.estimatedValue ? parseFloat(data.estimatedValue) : undefined,
      expectedCloseAt: data.expectedCloseAt ? new Date(data.expectedCloseAt).toISOString() : undefined,
      tags: data.tags ? data.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
      campaignId: data.campaignId || null,
    };

    if (lead) updateMutation.mutate(payload);
    else createMutation.mutate(payload);
  };

  const handleContactSelect = (contact: Contact) => {
    setSelectedContact(contact);
    setValue('contactId', contact.id);
    setValue('companyId', contact.companyId ?? '');
    setShowContactDD(false);
    setContactSearch('');
  };

  const stages: PipelineStage[] = (stagesData?.data as any) || [];
  const contacts: Contact[] = contactsData?.data?.data ?? [];
  const users = usersData?.data?.data ?? [];
  const campaigns = campaignsData?.data?.data ?? [];
  const isSaving = createMutation.isPending || updateMutation.isPending || isSubmitting;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-slate-800 rounded-[32px] shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-slate-200 dark:border-slate-700">
        <div className="flex items-center justify-between p-8 border-b border-slate-100 dark:border-slate-700">
          <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">{lead ? 'Modify Intelligence' : 'New Lead Entry'}</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors">
            <X className="h-5 w-5 text-slate-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-8 space-y-6">
          {/* Title */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Title Entry</label>
            <input
              {...register('title')}
              placeholder="e.g. Enterprise Expansion — Acme Corp"
              className={`w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border ${errors.title ? 'border-red-500' : 'border-slate-200 dark:border-slate-700'} rounded-2xl text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all`}
            />
            {errors.title && <p className="text-[10px] font-black text-red-500 ml-1 uppercase">{errors.title.message}</p>}
          </div>

          {/* Duplicate Warning Banner */}
          {duplicates.length > 0 && (
            <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-900/30 rounded-[24px] p-6 flex gap-4 animate-in fade-in slide-in-from-top-2 duration-300">
              <div className="h-10 w-10 rounded-xl bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center shrink-0">
                <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-500" />
              </div>
              <div className="flex-1 space-y-4">
                <div>
                  <h4 className="text-sm font-black text-amber-900 dark:text-amber-400 uppercase tracking-tight">Similar Lead Detected</h4>
                  <p className="text-[11px] font-bold text-amber-700 dark:text-amber-500/80 mt-1 leading-relaxed">
                    A similar intelligence record exists: <span className="font-black italic">"{duplicates[0].title}"</span>. 
                    Avoid pipeline fragmentation.
                  </p>
                </div>
                
                <div className="flex items-center gap-3">
                  <button 
                    type="button"
                    onClick={() => setConfirmNew(!confirmNew)}
                    className={`h-5 w-5 rounded border-2 flex items-center justify-center transition-all ${confirmNew ? 'bg-amber-500 border-amber-500' : 'border-amber-300 dark:border-amber-800'}`}
                  >
                    {confirmNew && <Check className="h-3 w-3 text-white stroke-[4px]" />}
                  </button>
                  <span className="text-[10px] font-black text-amber-700 dark:text-amber-500 uppercase tracking-widest cursor-pointer select-none" onClick={() => setConfirmNew(!confirmNew)}>
                    I confirm this is a new opportunity
                  </span>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-6">
            {/* Stage */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Pipeline Stage</label>
              <select
                {...register('stageId')}
                className={`w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border ${errors.stageId ? 'border-red-500' : 'border-slate-200 dark:border-slate-700'} rounded-2xl text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 appearance-none`}
              >
                <option value="">Select Stage</option>
                {stages.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            {/* Priority */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Urgency Level</label>
              <select
                {...register('priority')}
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 appearance-none"
              >
                {PRIORITY_OPTIONS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
              </select>
            </div>
          </div>

          {/* Contact searchable select */}
          <div ref={contactRef} className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Linked Contact</label>
            {selectedContact ? (
              <div className="flex items-center justify-between px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-2xl bg-slate-50 dark:bg-slate-900">
                <div className="flex items-center space-x-3">
                  <div className="h-8 w-8 rounded-xl bg-indigo-600 flex items-center justify-center text-white text-[10px] font-black">
                    {selectedContact.firstName.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900 dark:text-white">{selectedContact.firstName} {selectedContact.lastName}</p>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{selectedContact.email}</p>
                  </div>
                </div>
                <button type="button" onClick={() => { setSelectedContact(null); setValue('contactId', ''); }} className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 text-slate-400 hover:text-red-500 rounded-xl transition-colors">
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  value={contactSearch}
                  onChange={e => { setContactSearch(e.target.value); setShowContactDD(true); }}
                  placeholder="Type to search people..."
                  className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
                {showContactDD && contacts.length > 0 && (
                  <div className="absolute top-full left-0 right-0 z-20 mt-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl max-h-48 overflow-y-auto custom-scrollbar p-1">
                    {contacts.map(c => (
                      <button key={c.id} type="button" onClick={() => handleContactSelect(c)}
                        className="w-full flex items-center space-x-3 px-3 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-700/50 rounded-xl text-left transition-colors">
                        <div className="h-8 w-8 rounded-xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-500 text-[10px] font-black">
                          {c.firstName.charAt(0)}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-800 dark:text-slate-200">{c.firstName} {c.lastName}</p>
                          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{c.email ?? c.company?.name}</p>
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
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Estimated Value</label>
              <div className="flex gap-2">
                <select
                  {...register('currency')}
                  className="w-24 px-3 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                >
                  <option>USD</option><option>EUR</option><option>GBP</option><option>INR</option>
                </select>
                <input
                  {...register('estimatedValue')}
                  placeholder="0.00"
                  className={`flex-1 px-4 py-3 bg-slate-50 dark:bg-slate-900 border ${errors.estimatedValue ? 'border-red-500' : 'border-slate-200 dark:border-slate-700'} rounded-2xl text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20`}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Target Close Date</label>
              <input
                type="date"
                {...register('expectedCloseAt')}
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Acquisition Source</label>
              <select
                {...register('source')}
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 appearance-none"
              >
                {SOURCE_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Owner Assignment</label>
              <select
                {...register('assignedToId')}
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 appearance-none"
              >
                <option value="">Unassigned</option>
                {users.map((u: any) => (
                  <option key={u.id} value={u.id}>{u.firstName} {u.lastName}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Intelligence Summary</label>
            <textarea
              rows={3}
              {...register('description')}
              placeholder="Operational context and strategic notes..."
              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Marketing Campaign</label>
              <select
                {...register('campaignId')}
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 appearance-none text-left"
              >
                <option value="">No Campaign</option>
                {campaigns.map((c: any) => (
                  <option key={c.id} value={c.id}>{c.name} ({c.platform})</option>
                ))}
              </select>
            </div>
            
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Categorization Tags</label>
              <input
                {...register('tags')}
                placeholder="e.g. high-value, q4-target, enterprise"
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>
          </div>

          <div className="flex items-center justify-end space-x-4 pt-4">
            <Button type="button" variant="ghost" onClick={onClose} className="font-black uppercase tracking-widest text-[10px]">Abandon</Button>
            <Button 
              type="submit" 
              isLoading={isSaving} 
              disabled={duplicates.length > 0 && !confirmNew}
              className="px-8 rounded-2xl shadow-lg shadow-indigo-500/20"
            >
              {lead ? 'Commit Changes' : 'Initialize Lead'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
