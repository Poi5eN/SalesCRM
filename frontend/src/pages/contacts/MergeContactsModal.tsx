import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { X, ArrowRight } from 'lucide-react';
import * as contactsApi from '@/api/contacts.api.ts';
import { Button } from '@/components/ui/Button.tsx';
import type { Contact } from '@/types/api.types.ts';

interface MergeContactsModalProps {
  source: Contact;
  target: Contact;
  onClose: () => void;
}

export function MergeContactsModal({ source, target, onClose }: MergeContactsModalProps) {
  const qc = useQueryClient();

  // The backend merge takes { sourceId } to merge into the targetId
  // For the UI, we let the user pick which values to keep on the *target*.
  // Then we patch the target with those values, and finally call the merge endpoint.
  const [selections, setSelections] = useState<Record<string, 'source' | 'target'>>({
    firstName: 'target', lastName: 'target', email: 'target',
    phone: 'target', whatsapp: 'target', designation: 'target',
    department: 'target', linkedInUrl: 'target', companyId: 'target',
  });

  const mergeMutation = useMutation({
    mutationFn: async () => {
      const dataToUpdate: any = {};
      for (const key of Object.keys(selections)) {
        if (selections[key] === 'source' && (source as any)[key] !== undefined) {
          dataToUpdate[key] = (source as any)[key];
        }
      }

      // First update the target with any values we decided to keep from the source
      if (Object.keys(dataToUpdate).length > 0) {
        await contactsApi.updateContact(target.id, dataToUpdate);
      }

      // Then perform the actual merge (reassigns leads/deals/activities to target, soft-deletes source)
      return contactsApi.mergeContacts(target.id, source.id);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['contacts'] });
      onClose();
    },
  });

  const FieldRow = ({ label, field }: { label: string; field: keyof Contact }) => {
    const sVal = source[field] as any;
    const tVal = target[field] as any;

    if (!sVal && !tVal) return null;

    return (
      <div className="grid grid-cols-3 gap-4 py-3 border-b border-slate-100 items-center">
        <div className="font-semibold text-slate-700 text-sm pl-2">{label}</div>
        <div
          onClick={() => sVal && setSelections(s => ({ ...s, [field]: 'source' }))}
          className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${selections[field] === 'source' ? 'border-indigo-500 bg-indigo-50' : 'border-slate-100 bg-slate-50 hover:border-indigo-200'
            } ${!sVal ? 'opacity-50 cursor-not-allowed bg-slate-100' : ''}`}
        >
          <span className="text-sm text-slate-800">{sVal || '—'}</span>
        </div>
        <div
          onClick={() => tVal && setSelections(s => ({ ...s, [field]: 'target' }))}
          className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${selections[field] === 'target' ? 'border-indigo-500 bg-indigo-50' : 'border-slate-100 bg-slate-50 hover:border-indigo-200'
            } ${!tVal ? 'opacity-50 cursor-not-allowed bg-slate-100' : ''}`}
        >
          <span className="text-sm text-slate-800">{tVal || '—'}</span>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-slate-200 shrink-0">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Merge Contacts</h2>
            <p className="text-sm text-slate-500 mt-1">
              Select which information to keep. The primary contact will retain all leads, deals, and activities from both.
            </p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
            <X className="h-5 w-5 text-slate-500" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="font-bold text-slate-400 uppercase text-xs tracking-wider pl-2">Field</div>
            <div className="font-bold text-slate-800 flex items-center justify-between bg-slate-100 px-4 py-2 rounded-lg">
              <span>Source Contact</span>
              <button onClick={() => setSelections(s => {
                const next = { ...s };
                Object.keys(next).forEach(k => { if ((source as any)[k]) next[k] = 'source'; });
                return next;
              })} className="text-xs text-indigo-600 hover:underline">Select All</button>
            </div>
            <div className="font-bold text-indigo-900 flex items-center justify-between bg-indigo-100 px-4 py-2 rounded-lg">
              <span className="flex items-center gap-2"><ArrowRight className="h-4 w-4" /> Primary (Target)</span>
              <button onClick={() => setSelections(s => {
                const next = { ...s };
                Object.keys(next).forEach(k => { if ((target as any)[k]) next[k] = 'target'; });
                return next;
              })} className="text-xs text-indigo-600 hover:underline">Select All</button>
            </div>
          </div>

          <FieldRow label="First Name" field="firstName" />
          <FieldRow label="Last Name" field="lastName" />
          <FieldRow label="Email" field="email" />
          <FieldRow label="Phone" field="phone" />
          <FieldRow label="WhatsApp" field="whatsapp" />
          <FieldRow label="Designation" field="designation" />
          <FieldRow label="Department" field="department" />
          <FieldRow label="LinkedIn URL" field="linkedinUrl" />

          <div className="grid grid-cols-3 gap-4 py-3 items-center">
            <div className="font-semibold text-slate-700 text-sm pl-2">Company</div>
            <div
              onClick={() => source.companyId && setSelections(s => ({ ...s, companyId: 'source' }))}
              className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${selections.companyId === 'source' ? 'border-indigo-500 bg-indigo-50' : 'border-slate-100 bg-slate-50 hover:border-indigo-200'
                } ${!source.companyId ? 'opacity-50 cursor-not-allowed bg-slate-100' : ''}`}
            >
              <span className="text-sm text-slate-800">{source.company?.name || '—'}</span>
            </div>
            <div
              onClick={() => target.companyId && setSelections(s => ({ ...s, companyId: 'target' }))}
              className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${selections.companyId === 'target' ? 'border-indigo-500 bg-indigo-50' : 'border-slate-100 bg-slate-50 hover:border-indigo-200'
                } ${!target.companyId ? 'opacity-50 cursor-not-allowed bg-slate-100' : ''}`}
            >
              <span className="text-sm text-slate-800">{target.company?.name || '—'}</span>
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-slate-200 shrink-0 flex justify-end gap-3 bg-slate-50">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button
            isLoading={mergeMutation.isPending}
            onClick={() => mergeMutation.mutate()}
            className="bg-indigo-600 hover:bg-indigo-700"
          >
            Confirm Merge
          </Button>
        </div>
      </div>
    </div>
  );
}
