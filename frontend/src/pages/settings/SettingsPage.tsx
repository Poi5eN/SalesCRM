import { useNavigate, useSearchParams } from 'react-router-dom';
import { Building2, GitBranch, Users, Shield, Bell, Plug, CreditCard, Target, Mail } from 'lucide-react';
import { TenantSettings } from './TenantSettings.tsx';
import { PipelineStagesSettings } from './PipelineStagesSettings.tsx';
import { TeamSettings } from './TeamSettings.tsx';
import { RolesSettings } from './RolesSettings.tsx';
import { LeadScoringSettings } from './LeadScoringSettings.tsx';
import { EmailTemplateSettings } from './EmailTemplateSettings.tsx';

type SettingsTab = 'organization' | 'pipeline' | 'leadScoring' | 'emailTemplates' | 'team' | 'roles' | 'notifications' | 'integrations' | 'billing';

const NAV_ITEMS: { id: SettingsTab; label: string; icon: React.ComponentType<{ className?: string }>; placeholder?: boolean }[] = [
  { id: 'organization', label: 'Organization', icon: Building2 },
  { id: 'pipeline', label: 'Pipeline Stages', icon: GitBranch },
  { id: 'leadScoring', label: 'Lead Scoring', icon: Target },
  { id: 'emailTemplates', label: 'Email Templates', icon: Mail },
  { id: 'team', label: 'Team Members', icon: Users },
  { id: 'roles', label: 'Roles & Permissions', icon: Shield },
  { id: 'notifications', label: 'Notifications', icon: Bell, placeholder: true },
  { id: 'integrations', label: 'Integrations', icon: Plug, placeholder: true },
  { id: 'billing', label: 'Billing', icon: CreditCard, placeholder: true },
];

function PlaceholderTab({ title, icon: Icon }: { title: string; icon: React.ComponentType<{ className?: string }> }) {
  return (
    <div className="flex flex-col items-center justify-center h-64 text-slate-400">
      <Icon className="h-14 w-14 mb-4 text-slate-200" />
      <p className="text-lg font-semibold text-slate-500">{title}</p>
      <p className="text-sm mt-1 text-slate-400">Coming soon in a future release.</p>
    </div>
  );
}

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

      <div className="flex gap-8">
        {/* Sidebar Nav */}
        <aside className="w-52 shrink-0">
          <nav className="space-y-1">
            {NAV_ITEMS.map(item => {
              const Icon = item.icon;
              const isActive = tab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setTab(item.id)}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all text-left ${isActive
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    }`}
                >
                  <Icon className={`h-4 w-4 shrink-0 ${isActive ? 'text-indigo-200' : 'text-slate-400'}`} />
                  {item.label}
                  {item.placeholder && (
                    <span className="ml-auto text-[9px] font-bold uppercase tracking-wider bg-slate-200 text-slate-500 px-1.5 py-0.5 rounded">Soon</span>
                  )}
                </button>
              );
            })}
          </nav>
        </aside>

        {/* Content */}
        <div className="flex-1 min-w-0 bg-white rounded-2xl border border-slate-200 shadow-sm">
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
          {tab === 'notifications' && <PlaceholderTab title="Notification Preferences" icon={Bell} />}
          {tab === 'integrations' && <PlaceholderTab title="Integrations & Apps" icon={Plug} />}
          {tab === 'billing' && <PlaceholderTab title="Billing & Plans" icon={CreditCard} />}
        </div>
      </div>
    </div>
  );
}
