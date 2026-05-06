import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { X, Search, Mail, FileText, ChevronRight, Check } from 'lucide-react';
import * as emailTemplatesApi from '@/api/emailTemplates.api.ts';
import { Button } from '@/components/ui/Button.tsx';
import type { EmailTemplate } from '@/api/emailTemplates.api.ts';

interface EmailTemplatePickerProps {
  onSelect: (template: EmailTemplate) => void;
  onClose: () => void;
  type?: string;
}

export function EmailTemplatePicker({ onSelect, onClose, type }: EmailTemplatePickerProps) {
  const [search, setSearch] = useState('');

  const { data: templatesData, isLoading } = useQuery({
    queryKey: ['email-templates'],
    queryFn: () => emailTemplatesApi.getTemplates(),
  });

  const templates = templatesData?.data || [];
  const filteredTemplates = templates.filter(t => 
    (t.name.toLowerCase().includes(search.toLowerCase()) || t.subject.toLowerCase().includes(search.toLowerCase())) &&
    (!type || t.type === type || t.type === 'custom')
  );

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-slate-900 rounded-[32px] shadow-2xl w-full max-w-xl max-h-[80vh] overflow-hidden border border-slate-200 dark:border-slate-800 flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800 shrink-0">
          <div>
            <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight uppercase">Blueprint Selector</h3>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">Select a communication blueprint to deploy</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors">
            <X className="h-5 w-5 text-slate-500" />
          </button>
        </div>

        <div className="p-4 border-b border-slate-100 dark:border-slate-800 shrink-0">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input 
              autoFocus
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search blueprints..."
              className="w-full pl-11 pr-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2 custom-scrollbar">
          {isLoading ? (
            <div className="flex items-center justify-center h-32 animate-pulse text-slate-400 font-black uppercase text-[10px] tracking-widest">Scanning Repositories...</div>
          ) : filteredTemplates.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-slate-400">
              <Mail className="h-10 w-10 mb-2 opacity-20" />
              <p className="text-[10px] font-black uppercase tracking-widest">No matching blueprints</p>
            </div>
          ) : (
            <div className="space-y-1">
              {filteredTemplates.map(t => (
                <button
                  key={t.id}
                  onClick={() => onSelect(t)}
                  className="w-full group flex items-center justify-between p-3.5 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-2xl text-left transition-all"
                >
                  <div className="flex items-center gap-4">
                    <div className={`h-10 w-10 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110 ${
                      t.type === 'proposal' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                    }`}>
                      {t.type === 'proposal' ? <FileText className="h-5 w-5" /> : <Mail className="h-5 w-5" />}
                    </div>
                    <div>
                      <p className="text-sm font-black text-slate-800 dark:text-slate-200 group-hover:text-indigo-600 transition-colors uppercase tracking-tight">{t.name}</p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest truncate max-w-[300px]">{t.subject}</p>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-indigo-400 group-hover:translate-x-1 transition-all" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="p-6 bg-slate-50 dark:bg-slate-950 border-t border-slate-100 dark:border-slate-800 shrink-0">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
            <Check className="h-3 w-3 text-emerald-500" />
            Selecting a blueprint will auto-populate and interpolate fields.
          </p>
        </div>
      </div>
    </div>
  );
}
