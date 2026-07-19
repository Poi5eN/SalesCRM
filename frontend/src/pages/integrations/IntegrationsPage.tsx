import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MessageSquare, Calendar, Mail, Puzzle, ChevronRight, Check, X, ExternalLink, RefreshCw } from 'lucide-react';
import * as integrationsApi from '@/api/integrations.api.ts';
import { Button } from '@/components/ui/Button.tsx';

const INTEGRATIONS = [
  {
    id: 'whatsapp',
    name: 'WhatsApp Business',
    description: 'Connect your WhatsApp Business account to log messages automatically and send updates to leads and contacts.',
    icon: MessageSquare,
    color: 'text-emerald-600 bg-emerald-50 border-emerald-200',
    iconBg: 'bg-emerald-100',
    setupUrl: '#',
    docsUrl: '#',
  },
  {
    id: 'googleCalendar',
    name: 'Google Calendar',
    description: 'Sync meetings and events from Google Calendar. Automatically create tasks from scheduled meetings.',
    icon: Calendar,
    color: 'text-blue-600 bg-blue-50 border-blue-200',
    iconBg: 'bg-blue-100',
    setupUrl: '#',
    docsUrl: '#',
  },
  {
    id: 'emailSync',
    name: 'Email Sync (Gmail/Outlook)',
    description: 'Sync emails from your inbox to automatically log communications against leads, deals, and contacts.',
    icon: Mail,
    color: 'text-purple-600 bg-purple-50 border-purple-200',
    iconBg: 'bg-purple-100',
    setupUrl: '#',
    docsUrl: '#',
  },
];

export default function IntegrationsPage() {
  const qc = useQueryClient();
  const [selectedIntegration, setSelectedIntegration] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['integrations'],
    queryFn: () => integrationsApi.getIntegrations(),
  });

  const updateMutation = useMutation({
    mutationFn: (data: any) => integrationsApi.updateIntegrations(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['integrations'] }),
  });

  const config = data?.data || {};

  const toggleIntegration = (key: string, enabled: boolean) => {
    updateMutation.mutate({ [key]: { enabled } });
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-black text-[var(--text-primary)] tracking-tight">Integrations</h1>
        <p className="text-sm font-medium text-[var(--text-secondary)] mt-1.5">
          Connect your favorite tools to streamline your workflow.
        </p>
      </div>

      {/* Integration Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {INTEGRATIONS.map(integration => {
          const Icon = integration.icon;
          const isEnabled = config[integration.id]?.enabled;

          return (
            <div
              key={integration.id}
              className={`group relative bg-[var(--card-bg)] border rounded-3xl p-6 transition-all hover:shadow-lg hover:-translate-y-1 duration-200 ${
                isEnabled ? 'border-emerald-300 dark:border-emerald-700' : 'border-[var(--border)]'
              }`}
            >
              {/* Status badge */}
              <div className="absolute top-4 right-4">
                {isEnabled ? (
                  <span className="flex items-center gap-1 px-2 py-1 bg-emerald-50 text-emerald-700 rounded-full text-[10px] font-black uppercase tracking-widest border border-emerald-200">
                    <Check className="h-3 w-3" /> Connected
                  </span>
                ) : (
                  <span className="flex items-center gap-1 px-2 py-1 bg-slate-100 text-slate-500 rounded-full text-[10px] font-black uppercase tracking-widest border border-slate-200">
                    <X className="h-3 w-3" /> Disconnected
                  </span>
                )}
              </div>

              {/* Icon */}
              <div className={`h-14 w-14 rounded-2xl flex items-center justify-center mb-5 ${integration.iconBg}`}>
                <Icon className={`h-7 w-7 ${isEnabled ? 'text-emerald-600' : 'text-slate-600'}`} />
              </div>

              {/* Content */}
              <h3 className="text-lg font-black text-[var(--text-primary)] tracking-tight">{integration.name}</h3>
              <p className="text-xs text-[var(--text-secondary)] mt-2 leading-relaxed">{integration.description}</p>

              {/* Actions */}
              <div className="mt-6 flex items-center gap-3">
                <Button
                  variant={isEnabled ? 'outline' : 'primary'}
                  size="sm"
                  onClick={() => window.open(integration.setupUrl, '_blank')}
                >
                  {isEnabled ? 'Configure' : 'Connect'}
                  <ExternalLink className="h-3.5 w-3.5 ml-1.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => toggleIntegration(integration.id, !isEnabled)}
                  className={isEnabled ? 'text-red-500 hover:text-red-700' : 'text-emerald-600 hover:text-emerald-800'}
                >
                  {isEnabled ? 'Disconnect' : 'Enable'}
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      {/* API Access Section */}
      <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-3xl p-8 text-white shadow-xl">
        <div className="flex items-start justify-between">
          <div>
            <div className="h-12 w-12 rounded-2xl bg-white/20 flex items-center justify-center mb-4">
              <Puzzle className="h-6 w-6" />
            </div>
            <h2 className="text-2xl font-black tracking-tight">Build Your Own Integration</h2>
            <p className="text-indigo-200 text-sm mt-2 max-w-lg">
              Our REST API allows you to build custom integrations. Create, read, update, and manage all CRM resources programmatically.
            </p>
          </div>
          <Button variant="secondary" className="bg-white text-indigo-700 hover:bg-indigo-50 shadow-lg whitespace-nowrap">
            View API Docs
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
        <div className="mt-6 grid grid-cols-3 gap-4">
          {['Lead Management', 'Deal Tracking', 'Communications'].map(f => (
            <div key={f} className="bg-white/10 rounded-2xl p-4 backdrop-blur-sm">
              <p className="text-sm font-bold">{f}</p>
              <p className="text-indigo-200 text-xs mt-1">Full CRUD via REST API</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
