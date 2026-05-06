import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { CheckCircle2, XCircle, FileText, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';
import * as proposalsApi from '@/api/proposals.api.ts';
import { Button } from '@/components/ui/Button.tsx';
import { formatCurrency } from '@/utils/format.ts';

export default function PublicProposalView() {
  const { publicToken } = useParams<{ publicToken: string }>();
  const [comment, setComment] = useState('');
  const [isResponding, setIsResponding] = useState(false);
  const [successResponse, setSuccessResponse] = useState<'accepted' | 'rejected' | null>(null);

  const { data: proposalData, isLoading, isError } = useQuery({
    queryKey: ['public-proposal', publicToken],
    queryFn: () => proposalsApi.getPublicProposal(publicToken!),
    enabled: !!publicToken,
    retry: false,
  });

  const respondMutation = useMutation({
    mutationFn: (data: { action: 'accept' | 'reject', comment?: string }) => proposalsApi.respondPublicProposal(publicToken!, data),
    onSuccess: (_, variables) => {
      setSuccessResponse(variables.action as 'accepted' | 'rejected');
      setIsResponding(false);
    },
    onError: () => {
      setIsResponding(false);
      alert('Failed to submit response. Please try again or contact your representative.');
    }
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="text-slate-500 animate-pulse">Loading proposal securely...</div>
      </div>
    );
  }

  if (isError || !proposalData?.data) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center border border-slate-200">
          <AlertTriangle className="h-16 w-16 text-amber-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-slate-900 mb-2">Proposal Unavailable</h2>
          <p className="text-slate-600 text-sm">This proposal may have expired, been voided, or the link is invalid. Please contact your representative for a new link.</p>
        </div>
      </div>
    );
  }

  const proposal = proposalData.data;
  const isExpired = proposal.validUntil && new Date(proposal.validUntil) < new Date();
  const hasResponded = proposal.status === 'accepted' || proposal.status === 'rejected' || successResponse;
  const canRespond = !isExpired && !hasResponded && (proposal.status === 'sent' || proposal.status === 'viewed');

  const handleResponse = (action: 'accept' | 'reject') => {
    setIsResponding(true);
    respondMutation.mutate({ action, comment });
  };

  return (
    <div className="min-h-screen bg-slate-100 py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Status Banners */}
        {isExpired && !hasResponded && (
          <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-r-xl shadow-sm">
            <div className="flex">
              <div className="flex-shrink-0">
                <AlertTriangle className="h-5 w-5 text-amber-400" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-amber-700 font-medium">This proposal expired on {format(new Date(proposal.validUntil), 'MMM dd, yyyy')}. Please contact your representative.</p>
              </div>
            </div>
          </div>
        )}

        {hasResponded && (
          <div className={`border-l-4 p-4 rounded-r-xl shadow-sm ${
            (successResponse === 'accepted' || proposal.status === 'accepted') 
              ? 'bg-emerald-50 border-emerald-500' 
              : 'bg-red-50 border-red-500'
          }`}>
            <div className="flex">
              <div className="flex-shrink-0">
                {(successResponse === 'accepted' || proposal.status === 'accepted') ? (
                  <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-500" />
                )}
              </div>
              <div className="ml-3">
                <p className={`text-sm font-medium ${
                  (successResponse === 'accepted' || proposal.status === 'accepted') ? 'text-emerald-800' : 'text-red-800'
                }`}>
                  {(successResponse === 'accepted' || proposal.status === 'accepted')
                    ? 'Thank you! You have accepted this proposal. We will be in touch shortly with next steps.'
                    : 'You have declined this proposal. If this was a mistake, please contact us.'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* The Proposal Document */}
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200">
          
          {/* Document Header */}
          <div className="p-8 md:p-12 border-b border-slate-200 bg-slate-50 flex flex-col md:flex-row justify-between gap-8">
            <div>
              <h1 className="text-3xl font-black text-slate-900 tracking-tight">{proposal.tenant?.name || 'Our Company'}</h1>
              <p className="text-sm text-slate-500 mt-2 font-medium tracking-widest uppercase">Proposal Document</p>
            </div>
            <div className="md:text-right">
              <p className="text-2xl font-bold text-slate-800">{proposal.title}</p>
              <div className="mt-3 text-sm text-slate-600 space-y-1">
                <p>Date: <span className="font-medium text-slate-900">{format(new Date(proposal.sentAt || proposal.createdAt), 'MMMM dd, yyyy')}</span></p>
                {proposal.validUntil && (
                  <p>Valid Until: <span className="font-medium text-slate-900">{format(new Date(proposal.validUntil), 'MMMM dd, yyyy')}</span></p>
                )}
                <p>Reference: <span className="font-medium text-slate-900">PRP-{proposal.id.split('-')[0].toUpperCase()}</span></p>
              </div>
            </div>
          </div>

          {/* Prepared For */}
          <div className="px-8 md:px-12 py-8 border-b border-slate-100">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Prepared For</p>
            <p className="text-lg font-bold text-slate-900">{proposal.contact ? `${proposal.contact.firstName} ${proposal.contact.lastName}` : 'Client Name'}</p>
            {proposal.deal && <p className="text-sm text-slate-600 mt-1">{proposal.deal.title}</p>}
          </div>

          {/* Line Items */}
          <div className="px-8 md:px-12 py-10">
            <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
              <FileText className="h-5 w-5 text-indigo-500" /> Investment Summary
            </h3>
            
            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold">
                  <tr>
                    <th className="px-6 py-4">Description</th>
                    <th className="px-6 py-4 text-center">Qty</th>
                    <th className="px-6 py-4 text-right">Unit Price</th>
                    <th className="px-6 py-4 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {proposal.items?.map((item: any) => (
                    <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-5">
                        <p className="font-bold text-slate-900 text-base">{item.name}</p>
                        {item.description && <p className="text-sm text-slate-500 mt-1.5 whitespace-pre-wrap">{item.description}</p>}
                      </td>
                      <td className="px-6 py-5 text-center font-medium text-slate-700">{item.quantity}</td>
                      <td className="px-6 py-5 text-right font-medium text-slate-700">{formatCurrency(item.unitPrice, proposal.currency)}</td>
                      <td className="px-6 py-5 text-right font-bold text-slate-900 text-base">{formatCurrency(item.totalPrice, proposal.currency)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Totals */}
            <div className="mt-8 flex justify-end">
              <div className="w-full max-w-sm bg-slate-50 rounded-xl p-6 border border-slate-200 space-y-4">
                <div className="flex justify-between text-sm font-medium text-slate-600">
                  <span>Subtotal</span>
                  <span>{formatCurrency(proposal.subtotal, proposal.currency)}</span>
                </div>
                {proposal.discountAmount > 0 && (
                  <div className="flex justify-between text-sm font-medium text-emerald-600">
                    <span>Discount</span>
                    <span>-{formatCurrency(proposal.discountAmount, proposal.currency)}</span>
                  </div>
                )}
                {proposal.taxAmount > 0 && (
                  <div className="flex justify-between text-sm font-medium text-slate-600">
                    <span>Tax</span>
                    <span>{formatCurrency(proposal.taxAmount, proposal.currency)}</span>
                  </div>
                )}
                <div className="pt-4 border-t border-slate-200 flex justify-between font-black text-2xl text-slate-900">
                  <span>Total Due</span>
                  <span>{formatCurrency(proposal.totalAmount, proposal.currency)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Notes & Terms */}
          {(proposal.notes || proposal.terms) && (
            <div className="px-8 md:px-12 py-10 border-t border-slate-200 bg-slate-50 space-y-8">
              {proposal.notes && (
                <div>
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">Notes</h4>
                  <p className="text-sm text-slate-600 whitespace-pre-wrap leading-relaxed">{proposal.notes}</p>
                </div>
              )}
              {proposal.terms && (
                <div>
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">Terms & Conditions</h4>
                  <p className="text-sm text-slate-600 whitespace-pre-wrap leading-relaxed text-justify">{proposal.terms}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Action Panel */}
        {canRespond && (
          <div className="bg-white rounded-2xl shadow-xl p-8 border border-slate-200">
            <h3 className="text-xl font-bold text-slate-900 mb-2">Ready to proceed?</h3>
            <p className="text-sm text-slate-600 mb-6">Review the terms above and provide your decision. You can optionally leave a comment for our team.</p>
            
            <div className="space-y-4">
              <textarea 
                rows={3} 
                value={comment}
                onChange={e => setComment(e.target.value)}
                placeholder="Add an optional comment..." 
                className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 resize-none transition-shadow" 
                disabled={isResponding}
              />
              <div className="flex flex-col sm:flex-row gap-4">
                <Button 
                  className="flex-1 py-6 text-lg font-bold shadow-md hover:shadow-lg transition-all" 
                  onClick={() => handleResponse('accept')}
                  isLoading={isResponding}
                >
                  <CheckCircle2 className="mr-2 h-5 w-5" /> Accept Proposal
                </Button>
                <Button 
                  variant="outline" 
                  className="sm:w-48 py-6 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200" 
                  onClick={() => handleResponse('reject')}
                  disabled={isResponding}
                >
                  <XCircle className="mr-2 h-5 w-5" /> Decline
                </Button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
