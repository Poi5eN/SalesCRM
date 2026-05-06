import { useState, useEffect, useRef } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { X, Save, Eye, Hash, Info, User } from 'lucide-react';
import * as emailTemplatesApi from '@/api/emailTemplates.api.ts';
import { Button } from '@/components/ui/Button.tsx';
import type { EmailTemplate } from '@/api/emailTemplates.api.ts';

const VARIABLES = [
  { id: 'contact.firstName', label: 'Contact First Name' },
  { id: 'contact.lastName', label: 'Contact Last Name' },
  { id: 'contact.email', label: 'Contact Email' },
  { id: 'company.name', label: 'Company Name' },
  { id: 'lead.title', label: 'Lead Title' },
  { id: 'deal.title', label: 'Deal Title' },
  { id: 'user.firstName', label: 'Sender First Name' },
  { id: 'tenant.name', label: 'Organization Name' },
];

interface EmailTemplateFormProps {
  template?: EmailTemplate | null;
  onClose: () => void;
}

export function EmailTemplateForm({ template, onClose }: EmailTemplateFormProps) {
  const qc = useQueryClient();
  const [form, setForm] = useState({
    name: template?.name || '',
    type: template?.type || 'lead_outreach',
    subject: template?.subject || '',
    body: template?.body || '',
  });

  const [activeField, setActiveField] = useState<'subject' | 'body' | null>(null);
  const [showVars, setShowVars] = useState(false);
  const [cursorPos, setCursorPos] = useState(0);
  const bodyRef = useRef<HTMLTextAreaElement>(null);
  const subjectRef = useRef<HTMLInputElement>(null);

  const mutation = useMutation({
    mutationFn: (data: any) => template 
      ? emailTemplatesApi.updateTemplate(template.id, data) 
      : emailTemplatesApi.createTemplate(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['email-templates'] });
      onClose();
    },
  });

  const insertVariable = (variable: string) => {
    const tag = `{{${variable}}}`;
    const field = activeField === 'subject' ? 'subject' : 'body';
    const currentVal = form[field];
    const newVal = currentVal.slice(0, cursorPos) + tag + currentVal.slice(cursorPos);
    
    setForm(f => ({ ...f, [field]: newVal }));
    setShowVars(false);
  };

  const handleInput = (e: any, field: 'subject' | 'body') => {
    const val = e.target.value;
    const pos = e.target.selectionStart;
    setForm(f => ({ ...f, [field]: val }));
    setCursorPos(pos);
    setActiveField(field);

    if (val.slice(0, pos).endsWith('{{')) {
      setShowVars(true);
    } else {
      setShowVars(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate(form);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-slate-900 rounded-[32px] shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden border border-slate-200 dark:border-slate-800 flex flex-col">
        <div className="flex items-center justify-between p-8 border-b border-slate-100 dark:border-slate-800 shrink-0">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-2xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/20 text-white">
              <Layout className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
                {template ? 'Modify Blueprint' : 'New Blueprint Concept'}
              </h2>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Design a reusable intelligence sequence</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors">
            <X className="h-5 w-5 text-slate-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-8 flex gap-8">
          <div className="flex-1 space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Blueprint Name</label>
                <input
                  required
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. Inbound Outreach - Q4"
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Contextual Type</label>
                <select
                  value={form.type}
                  onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 appearance-none"
                >
                  <option value="lead_outreach">Lead Outreach</option>
                  <option value="follow_up">Follow Up</option>
                  <option value="proposal">Proposal</option>
                  <option value="custom">Custom</option>
                </select>
              </div>
            </div>

            <div className="space-y-1.5 relative">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Subject Strategy</label>
              <input
                ref={subjectRef}
                required
                value={form.subject}
                onChange={e => handleInput(e, 'subject')}
                onFocus={() => setActiveField('subject')}
                placeholder="Dynamic subject with {{variables}}..."
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>

            <div className="space-y-1.5 relative">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Blueprint Content</label>
              <textarea
                ref={bodyRef}
                required
                rows={10}
                value={form.body}
                onChange={e => handleInput(e, 'body')}
                onFocus={() => setActiveField('body')}
                placeholder="Write your intelligence blueprint here. Use {{ to inject dynamic variables..."
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 resize-none font-sans"
              />
              
              {showVars && (
                <div className="absolute z-10 bottom-full left-0 mb-2 w-64 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl p-1 animate-in slide-in-from-bottom-2 fade-in">
                  <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-700">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Inject Variables</p>
                  </div>
                  {VARIABLES.map(v => (
                    <button
                      key={v.id}
                      type="button"
                      onClick={() => insertVariable(v.id)}
                      className="w-full flex items-center justify-between px-3 py-2 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-xl text-left transition-colors"
                    >
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{v.label}</span>
                      <span className="text-[9px] font-mono text-slate-400 uppercase">{"{{" + v.id + "}}"}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="w-80 space-y-6">
            <div className="bg-slate-900 rounded-[28px] p-6 border border-slate-800 flex flex-col h-full shadow-2xl">
              <div className="flex items-center gap-2 mb-6">
                <Eye className="h-4 w-4 text-indigo-400" />
                <h3 className="text-[10px] font-black text-white uppercase tracking-widest">Live Execution Preview</h3>
              </div>
              
              <div className="flex-1 space-y-4">
                <div className="p-3 bg-slate-800/50 rounded-xl border border-slate-700">
                  <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">Subject</p>
                  <p className="text-[11px] font-bold text-white leading-tight">
                    {form.subject.replace(/\{\{(.*?)\}\}/g, '[Variable]')}
                  </p>
                </div>
                
                <div className="p-4 bg-slate-800/50 rounded-2xl border border-slate-700 flex-1 overflow-y-auto custom-scrollbar min-h-[200px]">
                  <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-2">Message Body</p>
                  <div className="text-[11px] font-bold text-slate-300 whitespace-pre-wrap leading-relaxed">
                    {form.body.replace(/\{\{(.*?)\}\}/g, '[Variable]')}
                  </div>
                </div>
              </div>

              <div className="mt-6 p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl">
                <div className="flex items-center gap-2 mb-2">
                  <Info className="h-3 w-3 text-indigo-400" />
                  <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest">System Tip</p>
                </div>
                <p className="text-[10px] font-bold text-slate-400 leading-relaxed">
                  Variables are context-aware. They will automatically resolve based on the Lead or Contact you're targeting.
                </p>
              </div>
            </div>
          </div>
        </form>

        <div className="p-8 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-4 shrink-0">
          <Button variant="ghost" onClick={onClose} className="rounded-xl font-black uppercase tracking-widest text-[10px]">Discard</Button>
          <Button 
            onClick={handleSubmit} 
            isLoading={mutation.isPending}
            className="rounded-xl px-8 shadow-lg shadow-indigo-500/20 font-black uppercase tracking-widest text-[10px]"
          >
            <Save className="h-4 w-4 mr-2" /> Save Blueprint
          </Button>
        </div>
      </div>
    </div>
  );
}

import { Layout } from 'lucide-react';
