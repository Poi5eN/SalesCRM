import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Mail, Search, MoreVertical, Edit2, Trash2, Layout, FileText, Send } from 'lucide-react';
import * as emailTemplatesApi from '@/api/emailTemplates.api.ts';
import { Button } from '@/components/ui/Button.tsx';
import { EmailTemplateForm } from './EmailTemplateForm.tsx';
import type { EmailTemplate } from '@/api/emailTemplates.api.ts';

export function EmailTemplateSettings() {
  const qc = useQueryClient();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null);
  const [search, setSearch] = useState('');

  const { data: templatesData, isLoading } = useQuery({
    queryKey: ['email-templates'],
    queryFn: () => emailTemplatesApi.getTemplates(),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => emailTemplatesApi.deleteTemplate(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['email-templates'] }),
  });

  const templates = templatesData?.data || [];
  const filteredTemplates = templates.filter(t =>
    t.name.toLowerCase().includes(search.toLowerCase()) ||
    t.subject.toLowerCase().includes(search.toLowerCase())
  );

  const handleEdit = (template: EmailTemplate) => {
    setEditingTemplate(template);
    setIsFormOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this template?')) {
      deleteMutation.mutate(id);
    }
  };

  if (isLoading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div></div>;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Communication Blueprints</h2>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">Manage standardized email intelligence templates</p>
        </div>
        <Button onClick={() => { setEditingTemplate(null); setIsFormOpen(true); }} className="rounded-xl font-black uppercase tracking-widest text-[10px]">
          <Plus className="h-4 w-4 mr-2" /> New Blueprint
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search blueprints by name or subject..."
          className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredTemplates.map((template) => (
          <div key={template.id} className="group bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[24px] p-6 hover:shadow-xl hover:shadow-indigo-500/5 transition-all">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${template.type === 'lead_outreach' ? 'bg-blue-50 text-blue-600' :
                    template.type === 'follow_up' ? 'bg-amber-50 text-amber-600' :
                      template.type === 'proposal' ? 'bg-emerald-50 text-emerald-600' :
                        'bg-slate-50 text-slate-600'
                  }`}>
                  {template.type === 'proposal' ? <FileText className="h-5 w-5" /> : <Mail className="h-5 w-5" />}
                </div>
                <div>
                  <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">{template.name}</h4>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{template.type.replace('_', ' ')}</p>
                </div>
              </div>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => handleEdit(template)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-indigo-600 rounded-lg transition-colors">
                  <Edit2 className="h-4 w-4" />
                </button>
                <button onClick={() => handleDelete(template.id)} className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 text-slate-400 hover:text-red-500 rounded-lg transition-colors">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="space-y-3">
              <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-100 dark:border-slate-800">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Subject Line</p>
                <p className="text-xs font-bold text-slate-700 dark:text-slate-300 truncate">{template.subject}</p>
              </div>

              <div className="flex items-center justify-between pt-2">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1.5">
                    <Send className="h-3 w-3 text-slate-400" />
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{template.usageCount} Sent</span>
                  </div>
                </div>
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest italic">
                  Created by {template.createdBy?.firstName}
                </span>
              </div>
            </div>
          </div>
        ))}

        {filteredTemplates.length === 0 && (
          <div className="col-span-full flex flex-col items-center justify-center h-48 bg-slate-50 dark:bg-slate-900/50 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-[32px]">
            <Layout className="h-10 w-10 text-slate-200 mb-3" />
            <p className="text-sm font-black text-slate-400 uppercase tracking-widest">No blueprints found</p>
          </div>
        )}
      </div>

      {isFormOpen && (
        <EmailTemplateForm
          template={editingTemplate}
          onClose={() => setIsFormOpen(false)}
        />
      )}
    </div>
  );
}
