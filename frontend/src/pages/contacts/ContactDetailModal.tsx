import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { X, Clock, Edit2, Link as LinkIcon, Briefcase } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { Link } from 'react-router-dom';
import type { Contact, Lead, Deal } from '@/types/api.types.ts';
import * as contactsApi from '@/api/contacts.api.ts';
import * as leadsApi from '@/api/leads.api.ts';
import * as dealsApi from '@/api/deals.api.ts';
import * as commsApi from '@/api/communications.api.ts';
import { Button } from '@/components/ui/Button.tsx';
import { formatCurrency } from '@/utils/format.ts';
import { useUIStore } from '@/store/ui.store.ts';

interface ContactDetailModalProps {
  contact: Contact;
  onClose: () => void;
  onEdit: () => void;
  onOpenLead?: (lead: Lead) => void;
  onOpenDeal?: (deal: Deal) => void;
}

type Tab = 'overview' | 'leads' | 'deals' | 'timeline' | 'communications';

export function ContactDetailModal({ contact, onClose, onEdit, onOpenLead, onOpenDeal }: ContactDetailModalProps) {
  const [tab, setTab] = useState<Tab>('overview');
  const { openCommModal } = useUIStore();

  const { data: contactData } = useQuery({
    queryKey: ['contact', contact.id],
    queryFn: () => contactsApi.getContact(contact.id),
  });

  const { data: leadsData } = useQuery({
    queryKey: ['leads', 'contact', contact.id],
    queryFn: () => leadsApi.getLeads({ contactId: contact.id, limit: 50 }),
    enabled: tab === 'leads',
  });

  const { data: dealsData } = useQuery({
    queryKey: ['deals', 'contact', contact.id],
    queryFn: () => dealsApi.getDeals({ contactId: contact.id, limit: 50 }),
    enabled: tab === 'deals',
  });

  const { data: timelineData } = useQuery({
    queryKey: ['contact-timeline', contact.id],
    queryFn: () => contactsApi.getContactTimeline(contact.id).catch(() => ({ data: [] })),
    enabled: tab === 'timeline',
  });

  const { data: commsData } = useQuery({
    queryKey: ['communications', 'contact', contact.id],
    queryFn: () => commsApi.getCommunications({ contactId: contact.id, limit: 50 }),
    enabled: tab === 'communications',
  });

  const currentContact: Contact = contactData?.data ?? contact;
  const leads: Lead[] = leadsData?.data?.data ?? [];
  const deals: Deal[] = dealsData?.data?.data ?? [];
  const timeline: any[] = timelineData?.data ?? [];
  const comms: any[] = commsData?.data?.data ?? [];

  const TABS: { id: Tab; label: string }[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'leads', label: `Leads (${leads.length})` },
    { id: 'deals', label: `Deals (${deals.length})` },
    { id: 'timeline', label: 'Timeline' },
    { id: 'communications', label: `Communications (${comms.length})` },
  ];

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-[700px] h-full bg-white shadow-2xl flex flex-col" style={{ animation: 'slideInRight 0.25s ease-out' }}>

        {/* Header */}
        <div className="border-b border-slate-200 p-6 flex-shrink-0 bg-slate-50">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-4 flex-1">
              <div className="h-16 w-16 rounded-2xl bg-indigo-100 flex items-center justify-center text-indigo-700 text-2xl font-bold border-2 border-white shadow-sm flex-shrink-0">
                {currentContact.firstName.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-2xl font-bold text-slate-900 truncate">
                  {currentContact.firstName} {currentContact.lastName}
                </h2>
                <div className="flex items-center gap-3 mt-1.5 text-sm text-slate-600 flex-wrap">
                  {currentContact.designation && <span>{currentContact.designation}</span>}
                  {currentContact.company && (
                    <span className="flex items-center gap-1 font-semibold text-slate-800">
                      <Briefcase className="h-3.5 w-3.5" />
                      {currentContact.company.name}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <Button size="sm" variant="outline" onClick={onEdit}>
                <Edit2 className="h-3.5 w-3.5 mr-1" /> Edit
              </Button>
              <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-lg transition-colors bg-white border border-slate-200 shadow-sm">
                <X className="h-4 w-4 text-slate-500" />
              </button>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 mt-4">
            {currentContact.tags?.map(tag => (
              <span key={tag} className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-200 text-slate-600">
                {tag}
              </span>
            ))}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-200 px-6 flex-shrink-0 bg-white">
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`mr-6 py-3.5 text-sm font-medium border-b-2 transition-colors ${tab === t.id ? 'border-indigo-600 text-indigo-700' : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto bg-white p-6">
          {tab === 'overview' && (
            <div className="space-y-6">
              <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100">
                {([
                  ['Email', currentContact.email],
                  ['Phone', currentContact.phone],
                  ['WhatsApp', currentContact.whatsapp],
                  ['Department', currentContact.department],
                  ['Company', currentContact.company?.name],
                  ['LinkedIn', currentContact.linkedinUrl && <a href={currentContact.linkedinUrl} target="_blank" rel="noreferrer" className="text-indigo-600 hover:underline flex items-center gap-1"><LinkIcon className="h-3 w-3" /> Profile</a>],
                  ['Added', format(new Date(currentContact.createdAt), 'dd MMM yyyy, HH:mm')],
                ] as [string, any][]).map(([label, value]) => (
                  <div key={label} className="flex items-center px-4 py-3 text-sm">
                    <span className="w-36 font-semibold text-slate-500 flex-shrink-0">{label}</span>
                    <span className="text-slate-800">{value || '—'}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {tab === 'leads' && (
            <div className="space-y-3">
              {leads.length === 0 ? (
                <EmptyState icon={<LinkIcon className="h-10 w-10 text-slate-200" />} title="No linked leads" />
              ) : (
                leads.map(lead => (
                  <div
                    key={lead.id}
                    onClick={() => onOpenLead?.(lead)}
                    className="border border-slate-200 rounded-xl p-4 flex justify-between items-center bg-slate-50 hover:bg-slate-100 cursor-pointer transition-colors"
                  >
                    <div>
                      <p className="font-semibold text-slate-900">{lead.title}</p>
                      <p className="text-xs text-slate-500 mt-1">
                        Stage: <span className="font-medium text-slate-700">{lead.stage?.name ?? '—'}</span>
                      </p>
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 bg-white px-2 py-1 rounded border border-slate-200">
                      {lead.isConverted ? 'Converted' : 'Open'}
                    </span>
                  </div>
                ))
              )}
            </div>
          )}

          {tab === 'deals' && (
            <div className="space-y-3">
              {deals.length === 0 ? (
                <EmptyState icon={<Briefcase className="h-10 w-10 text-slate-200" />} title="No linked deals" />
              ) : (
                deals.map(deal => (
                  <div
                    key={deal.id}
                    onClick={() => onOpenDeal?.(deal)}
                    className="border border-slate-200 rounded-xl p-4 flex justify-between items-center bg-slate-50 hover:bg-slate-100 cursor-pointer transition-colors"
                  >
                    <div>
                      <p className="font-semibold text-slate-900">{deal.title}</p>
                      <p className="text-xs text-slate-500 mt-1">
                        Value: <span className="font-bold text-slate-800">{formatCurrency(deal.value, deal.currency)}</span> • Stage: <span className="font-medium text-slate-700">{deal.stage?.name ?? '—'}</span>
                      </p>
                    </div>
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded border ${deal.status === 'won' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                        deal.status === 'lost' ? 'bg-red-50 text-red-700 border-red-200' :
                          'bg-white text-slate-600 border-slate-200'
                      }`}>
                      {deal.status}
                    </span>
                  </div>
                ))
              )}
            </div>
          )}

          {tab === 'timeline' && (
            <div>
              {timeline.length === 0 ? (
                <EmptyState icon={<Clock className="h-10 w-10 text-slate-200" />} title="No timeline events yet" />
              ) : (
                <div className="relative">
                  <div className="absolute left-5 top-0 bottom-0 w-px bg-slate-200" />
                  <div className="space-y-4">
                    {timeline.map((event: any, i: number) => (
                      <div key={i} className="flex gap-4 pl-12 relative">
                        <div className="absolute left-3.5 top-1 h-3 w-3 rounded-full bg-indigo-400 border-2 border-white ring-1 ring-indigo-200" />
                        <div className="flex-1 bg-slate-50 rounded-xl p-3">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-bold text-slate-600 capitalize">{event.type.replace('_', ' ')}</span>
                            <span className="text-xs text-slate-400">{formatDistanceToNow(new Date(event.date), { addSuffix: true })}</span>
                          </div>
                          {event.data?.action && <p className="text-sm text-slate-700">{event.data.action.replace(/_/g, ' ')}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {tab === 'communications' && (
            <div className="space-y-3">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-sm font-bold text-slate-800">Communications</h3>
                <Button size="sm" variant="outline" onClick={() => openCommModal({ contactId: contact.id })}>
                  Log Communication
                </Button>
              </div>
              {comms.length === 0 ? (
                <EmptyState icon={<Clock className="h-10 w-10 text-slate-200" />} title="No communications logged" />
              ) : (
                comms.map(comm => (
                  <div key={comm.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 bg-white px-1.5 py-0.5 rounded border border-slate-200">{comm.type}</span>
                        <span className="text-[10px] text-slate-400 capitalize">{comm.direction}</span>
                      </div>
                      <span className="text-xs text-slate-400">{formatDistanceToNow(new Date((comm as any).occurredAt ?? comm.createdAt), { addSuffix: true })}</span>
                    </div>
                    {(comm as any).subject && <p className="text-sm font-semibold text-slate-800">{(comm as any).subject}</p>}
                    {(comm as any).body && <p className="text-sm text-slate-600 mt-1">{(comm as any).body}</p>}
                  </div>
                ))
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

function EmptyState({ icon, title, subtitle }: { icon: React.ReactNode; title: string; subtitle?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center border border-dashed border-slate-200 rounded-xl bg-slate-50">
      <div className="mb-3">{icon}</div>
      <p className="text-sm font-semibold text-slate-500">{title}</p>
      {subtitle && <p className="text-xs text-slate-400 mt-1">{subtitle}</p>}
    </div>
  );
}
