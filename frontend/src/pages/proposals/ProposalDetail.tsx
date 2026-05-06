import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  FileText, ArrowLeft, Edit2, Send, Download, 
  Trash2, XCircle, CheckCircle2, History, Copy, Clock
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import * as proposalsApi from '@/api/proposals.api.ts';
import { Button } from '@/components/ui/Button.tsx';
import { useUIStore } from '@/store/ui.store.ts';
import { formatCurrency } from '@/utils/format.ts';

export default function ProposalDetail() {
  const { id } = useParams<{ id: string }>();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const { confirm } = useUIStore();
  const [copySuccess, setCopySuccess] = useState(false);

  const { data: proposalData, isLoading } = useQuery({
    queryKey: ['proposal', id],
    queryFn: () => proposalsApi.getProposal(id!),
    enabled: !!id,
  });

  const updateMutation = useMutation({
    mutationFn: (data: any) => proposalsApi.updateProposal(id!, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['proposal', id] }),
  });

  const sendMutation = useMutation({
    mutationFn: () => proposalsApi.sendProposal(id!),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['proposal', id] }),
  });

  const reviseMutation = useMutation({
    mutationFn: () => proposalsApi.reviseProposal(id!),
    onSuccess: (res) => navigate(`/proposals/${res.data.id}/edit`),
  });

  if (isLoading) return <div className="p-8 text-center text-slate-500">Loading...</div>;
  if (!proposalData?.data) return <div className="p-8 text-center text-red-500">Proposal not found.</div>;

  const proposal = proposalData.data;

  const handleSend = async () => {
    if (await confirm({ title: 'Send Proposal', message: 'Are you sure you want to mark this proposal as sent?', confirmText: 'Mark as Sent' })) {
      sendMutation.mutate();
    }
  };

  const handleMarkViewed = () => updateMutation.mutate({ status: 'viewed', viewedAt: new Date().toISOString() });
  const handleVoid = async () => {
    if (await confirm({ title: 'Void Proposal', message: 'Are you sure you want to void this proposal?', variant: 'danger', confirmText: 'Void Proposal' })) {
      updateMutation.mutate({ status: 'rejected' }); // Using rejected as a proxy for void in this schema if no void exists
    }
  };

  const handleCreateRevision = async () => {
    if (await confirm({ title: 'Create Revision', message: 'This will create a draft copy of this proposal as version ' + (proposal.version + 1) + '. Continue?' })) {
      reviseMutation.mutate();
    }
  };

  const copyPublicLink = () => {
    if (proposal.publicToken) {
      navigator.clipboard.writeText(`${window.location.origin}/p/${proposal.publicToken}`);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    }
  };

  const isEditable = proposal.status === 'draft';
  const isSentOrViewed = proposal.status === 'sent' || proposal.status === 'viewed';

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      <div className="flex items-center gap-4 text-sm font-medium text-slate-500">
        <Link to="/proposals" className="hover:text-indigo-600 flex items-center gap-1">
          <ArrowLeft className="h-4 w-4" /> Back to Proposals
        </Link>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 lg:p-8">
        <div className="flex flex-col lg:flex-row justify-between gap-6">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-black text-slate-900 tracking-tight">{proposal.title}</h1>
              <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded-md">v{proposal.version}</span>
            </div>
            
            <div className="flex flex-wrap items-center gap-4 text-sm text-slate-600 font-medium">
              <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${
                proposal.status === 'accepted' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                proposal.status === 'rejected' ? 'bg-red-50 text-red-700 border-red-200' :
                proposal.status === 'sent' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                proposal.status === 'viewed' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                proposal.status === 'expired' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                'bg-slate-100 text-slate-600 border-slate-200'
              }`}>
                {proposal.status}
              </span>
              
              {(proposal.deal || proposal.contact) && (
                <>
                  <span className="text-slate-300">•</span>
                  <span>Linked to: <span className="text-slate-900">{proposal.deal?.title || `${proposal.contact?.firstName} ${proposal.contact?.lastName}`}</span></span>
                </>
              )}
              
              {proposal.validUntil && (
                <>
                  <span className="text-slate-300">•</span>
                  <span>Valid until <span className="text-slate-900">{format(new Date(proposal.validUntil), 'MMM dd, yyyy')}</span></span>
                </>
              )}
            </div>
          </div>
          
          <div className="flex flex-wrap items-start gap-3">
            {isEditable && (
              <>
                <Link to={`/proposals/${proposal.id}/edit`}>
                  <Button variant="outline"><Edit2 className="h-4 w-4 mr-2" /> Edit</Button>
                </Link>
                <Button onClick={handleSend} isLoading={sendMutation.isPending}><Send className="h-4 w-4 mr-2" /> Mark as Sent</Button>
              </>
            )}

            {isSentOrViewed && (
              <>
                <Button variant="outline" onClick={handleMarkViewed} isLoading={updateMutation.isPending}><CheckCircle2 className="h-4 w-4 mr-2" /> Mark Viewed</Button>
                <Button variant="outline" onClick={handleVoid} className="text-red-600 hover:bg-red-50 hover:text-red-700 hover:border-red-200"><XCircle className="h-4 w-4 mr-2" /> Void</Button>
                <Button onClick={handleCreateRevision} isLoading={reviseMutation.isPending}><History className="h-4 w-4 mr-2" /> Create Revision</Button>
              </>
            )}

            {proposal.status === 'accepted' && (
              <>
                <Button variant="outline"><Download className="h-4 w-4 mr-2" /> Download PDF</Button>
                <Button variant="outline" onClick={handleCreateRevision} isLoading={reviseMutation.isPending}><History className="h-4 w-4 mr-2" /> Create Revision</Button>
              </>
            )}

            {proposal.status === 'rejected' && (
              <Button onClick={handleCreateRevision} isLoading={reviseMutation.isPending}><History className="h-4 w-4 mr-2" /> Create Revision</Button>
            )}
          </div>
        </div>

        {proposal.publicToken && proposal.status !== 'draft' && (
          <div className="mt-8 p-4 bg-indigo-50 border border-indigo-100 rounded-xl flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-indigo-900">Public Share Link</p>
              <p className="text-xs text-indigo-700 mt-0.5">Share this link with your client to allow them to view and accept the proposal.</p>
            </div>
            <Button variant="outline" size="sm" onClick={copyPublicLink} className="bg-white">
              {copySuccess ? <CheckCircle2 className="h-4 w-4 mr-2 text-emerald-500" /> : <Copy className="h-4 w-4 mr-2" />}
              {copySuccess ? 'Copied!' : 'Copy Link'}
            </Button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-200 bg-slate-50">
              <h2 className="text-lg font-bold text-slate-900">Line Items</h2>
            </div>
            {proposal.items?.length > 0 ? (
              <table className="w-full text-sm text-left">
                <thead className="bg-white border-b border-slate-200 text-slate-500 font-semibold">
                  <tr>
                    <th className="px-6 py-4 w-1/2">Item</th>
                    <th className="px-6 py-4 text-center">Qty</th>
                    <th className="px-6 py-4 text-right">Unit Price</th>
                    <th className="px-6 py-4 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {proposal.items.map((item: any) => (
                    <tr key={item.id}>
                      <td className="px-6 py-4">
                        <p className="font-bold text-slate-900">{item.name}</p>
                        {item.description && <p className="text-xs text-slate-500 mt-1 whitespace-pre-wrap">{item.description}</p>}
                      </td>
                      <td className="px-6 py-4 text-center font-medium">{item.quantity}</td>
                      <td className="px-6 py-4 text-right font-medium">{formatCurrency(item.unitPrice, proposal.currency)}</td>
                      <td className="px-6 py-4 text-right font-bold text-slate-900">{formatCurrency(item.totalPrice, proposal.currency)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="p-8 text-center text-slate-500">No items added to this proposal.</div>
            )}
            <div className="p-6 bg-slate-50 border-t border-slate-200 flex justify-end">
              <div className="w-full max-w-sm space-y-3 text-sm">
                <div className="flex justify-between font-medium text-slate-600">
                  <span>Subtotal</span>
                  <span>{formatCurrency(proposal.subtotal, proposal.currency)}</span>
                </div>
                {proposal.discountAmount > 0 && (
                  <div className="flex justify-between font-medium text-emerald-600">
                    <span>Discount</span>
                    <span>-{formatCurrency(proposal.discountAmount, proposal.currency)}</span>
                  </div>
                )}
                {proposal.taxAmount > 0 && (
                  <div className="flex justify-between font-medium text-slate-600">
                    <span>Tax</span>
                    <span>{formatCurrency(proposal.taxAmount, proposal.currency)}</span>
                  </div>
                )}
                <div className="pt-3 border-t border-slate-200 flex justify-between font-black text-lg text-slate-900">
                  <span>Grand Total</span>
                  <span>{formatCurrency(proposal.totalAmount, proposal.currency)}</span>
                </div>
              </div>
            </div>
          </div>

          {(proposal.notes || proposal.terms) && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
              {proposal.notes && (
                <div>
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-2">Notes</h3>
                  <div className="text-sm text-slate-600 whitespace-pre-wrap p-4 bg-slate-50 rounded-xl border border-slate-100">{proposal.notes}</div>
                </div>
              )}
              {proposal.terms && (
                <div>
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-2">Terms & Conditions</h3>
                  <div className="text-sm text-slate-600 whitespace-pre-wrap p-4 bg-slate-50 rounded-xl border border-slate-100">{proposal.terms}</div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <h3 className="text-base font-bold text-slate-900 mb-6 flex items-center gap-2">
              <History className="h-5 w-5 text-slate-400" /> Timeline
            </h3>
            <div className="relative">
              <div className="absolute left-3.5 top-2 bottom-2 w-px bg-slate-200" />
              <div className="space-y-6">
                <TimelineEvent title="Proposal Created" date={proposal.createdAt} icon={<FileText className="h-3 w-3 text-white" />} color="bg-slate-400" />
                {proposal.sentAt && <TimelineEvent title="Sent to Client" date={proposal.sentAt} icon={<Send className="h-3 w-3 text-white" />} color="bg-blue-500" />}
                {proposal.viewedAt && <TimelineEvent title="Viewed by Client" date={proposal.viewedAt} icon={<Clock className="h-3 w-3 text-white" />} color="bg-purple-500" />}
                {proposal.respondedAt && (
                  <TimelineEvent 
                    title={`Proposal ${proposal.status.charAt(0).toUpperCase() + proposal.status.slice(1)}`} 
                    date={proposal.respondedAt} 
                    icon={proposal.status === 'accepted' ? <CheckCircle2 className="h-3 w-3 text-white" /> : <XCircle className="h-3 w-3 text-white" />} 
                    color={proposal.status === 'accepted' ? 'bg-emerald-500' : 'bg-red-500'} 
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function TimelineEvent({ title, date, icon, color }: { title: string; date: string; icon: React.ReactNode; color: string }) {
  return (
    <div className="relative flex gap-4 pl-10">
      <div className={`absolute left-0 top-0 h-7 w-7 rounded-full flex items-center justify-center border-2 border-white shadow-sm z-10 ${color}`}>
        {icon}
      </div>
      <div>
        <p className="text-sm font-bold text-slate-900">{title}</p>
        <p className="text-xs text-slate-500 mt-0.5">{format(new Date(date), 'MMM dd, yyyy · HH:mm')}</p>
      </div>
    </div>
  );
}
