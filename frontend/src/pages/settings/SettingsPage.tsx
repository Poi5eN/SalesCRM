import { useNavigate, useSearchParams } from 'react-router-dom';
import { Building2, GitBranch, Users, Shield, Bell, Plug, CreditCard, Target, Mail } from 'lucide-react';
import { TenantSettings } from './TenantSettings.tsx';
import { PipelineStagesSettings } from './PipelineStagesSettings.tsx';
import { TeamSettings } from './TeamSettings.tsx';
import { RolesSettings } from './RolesSettings.tsx';
import { LeadScoringSettings } from './LeadScoringSettings.tsx';
import { EmailTemplateSettings } from './EmailTemplateSettings.tsx';
import NotificationsPage from '@/pages/notifications/NotificationsPage.tsx';
import IntegrationsPage from '@/pages/integrations/IntegrationsPage.tsx';
import BillingPage from '@/pages/billing/BillingPage.tsx';

type SettingsTab = 'organization' | 'pipeline' | 'leadScoring' | 'emailTemplates' | 'team' | 'roles' | 'notifications' | 'integrations' | 'billing';

const NAV_ITEMS: { id: SettingsTab; label: string; icon: React.ComponentType<{ className?: string }>; placeholder?: boolean }[] = [
  { id: 'organization', label: 'Organization', icon: Building2 },
  { id: 'pipeline', label: 'Pipeline Stages', icon: GitBranch },
  { id: 'leadScoring', label: 'Lead Scoring', icon: Target },
  { id: 'emailTemplates', label: 'Email Templates', icon: Mail },
  { id: 'team', label: 'Team Members', icon: Users },
  { id: 'roles', label: 'Roles & Permissions', icon: Shield },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'integrations', label: 'Integrations', icon: Plug },
  { id: 'billing', label: 'Billing', icon: CreditCard },
];

export default function SettingsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = (searchParams.get('tab') as SettingsTab) ?? 'organization';

  const setTab = (t: SettingsTab) => {
    setSearchParams({ tab: t });
  };

  return (
    <div className="space-y-0">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
        <p className="text-slate-500 text-sm mt-1">Manage your organization, team, and preferences.</p>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        {/* Sidebar Nav */}
        <aside className="w-full md:w-52 shrink-0">
          <nav className="flex flex-row overflow-x-auto gap-2 pb-2 md:flex-col md:overflow-visible md:pb-0 scrollbar-none">
            {NAV_ITEMS.map(item => {
              const Icon = item.icon;
              const isActive = tab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setTab(item.id)}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all text-left whitespace-nowrap shrink-0 ${isActive
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 bg-slate-50 dark:bg-slate-900/50 md:bg-transparent'
                    }`}
                >
                  <Icon className={`h-4 w-4 shrink-0 ${isActive ? 'text-indigo-200' : 'text-slate-400'}`} />
                  {item.label}
                  {item.placeholder && (
                    <span className="ml-auto text-[9px] font-bold uppercase tracking-wider bg-slate-200 text-slate-500 px-1.5 py-0.5 rounded hidden md:inline">Soon</span>
                  )}
                </button>
              );
            })}
          </nav>
        </aside>

        {/* Content */}
        <div className="flex-1 min-w-0 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          {tab === 'organization' && <TenantSettings />}
          {tab === 'pipeline' && <PipelineStagesSettings />}
          {tab === 'team' && <TeamSettings />}
          {tab === 'roles' && <RolesSettings />}
          {tab === 'leadScoring' && (
            <div className="p-8">
              <LeadScoringSettings />
            </div>
          )}
          {tab === 'emailTemplates' && (
            <div className="p-8">
              <EmailTemplateSettings />
            </div>
          )}
          {tab === 'notifications' && <NotificationsPage />}
          {tab === 'integrations' && <IntegrationsPage />}
          {tab === 'billing' && <BillingPage />}
        </div>
      </div>
    </div>
  );
}
