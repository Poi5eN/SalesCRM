import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Save, Building2, Globe, Clock, DollarSign, Image } from 'lucide-react';
import * as settingsApi from '@/api/settings.api.ts';
import { Button } from '@/components/ui/Button.tsx';
import { useAuthStore } from '@/store/auth.store.ts';

export function TenantSettings() {
  const qc = useQueryClient();
  const { tenant: authTenant, setAuth, user, token } = useAuthStore();
  
  const { data: tenantData, isLoading } = useQuery({
    queryKey: ['tenant-settings'],
    queryFn: () => settingsApi.getTenant(),
  });

  const [form, setForm] = useState({
    name: '',
    slug: '',
    timezone: 'UTC',
    currency: 'USD',
    logoUrl: '',
    staleThreshold: 30,
  });

  useEffect(() => {
    if (tenantData?.data) {
      const t = tenantData.data;
      setForm({
        name: t.name,
        slug: t.slug,
        timezone: t.timezone || 'UTC',
        currency: t.currency || 'USD',
        logoUrl: t.logoUrl || '',
        staleThreshold: t.settings?.staleThreshold ?? 30,
      });
    }
  }, [tenantData]);

  const mutation = useMutation({
    mutationFn: (data: any) => settingsApi.updateTenant(data),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ['tenant-settings'] });
      // Update auth store with new tenant info
      if (user && token) {
        setAuth(user, token, res.data);
      }
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate({
      name: form.name,
      timezone: form.timezone,
      currency: form.currency,
      logoUrl: form.logoUrl,
      settings: {
        ...tenantData?.data?.settings,
        staleThreshold: form.staleThreshold,
      },
    });
  };

  if (isLoading) return <div className="p-8 text-center text-slate-500">Loading settings...</div>;

  return (
    <div className="p-4 sm:p-8">
      <div className="flex items-center gap-3 mb-8 border-b border-slate-100 pb-6">
        <div className="h-12 w-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-sm">
          <Building2 className="h-6 w-6" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-900">Organization Settings</h2>
          <p className="text-sm text-slate-500">Manage your company profile and global preferences.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="max-w-2xl space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="col-span-2">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Organization Name</label>
            <div className="relative">
              <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input 
                required 
                value={form.name} 
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))} 
                className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-400 shadow-sm transition-all" 
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Slug (Read-only)</label>
            <div className="relative">
              <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input 
                readOnly 
                value={form.slug} 
                className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl bg-slate-50 text-slate-500 cursor-not-allowed" 
              />
            </div>
            <p className="text-[10px] text-slate-400 mt-1.5 ml-1 italic">Used in your dedicated portal URLs.</p>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Logo URL</label>
            <div className="relative">
              <Image className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input 
                value={form.logoUrl} 
                onChange={e => setForm(f => ({ ...f, logoUrl: e.target.value }))} 
                placeholder="https://example.com/logo.png"
                className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-400 shadow-sm transition-all" 
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Default Timezone</label>
            <div className="relative">
              <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <select 
                value={form.timezone} 
                onChange={e => setForm(f => ({ ...f, timezone: e.target.value }))} 
                className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-400 shadow-sm bg-white transition-all appearance-none"
              >
                <option value="UTC">UTC (Universal Time)</option>
                <option value="America/New_York">Eastern Time (US & Canada)</option>
                <option value="America/Chicago">Central Time (US & Canada)</option>
                <option value="America/Denver">Mountain Time (US & Canada)</option>
                <option value="America/Los_Angeles">Pacific Time (US & Canada)</option>
                <option value="Europe/London">London / GMT</option>
                <option value="Asia/Kolkata">India Standard Time</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Default Currency</label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <select 
                value={form.currency} 
                onChange={e => setForm(f => ({ ...f, currency: e.target.value }))} 
                className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-400 shadow-sm bg-white transition-all appearance-none"
              >
                <option value="USD">USD ($) - US Dollar</option>
                <option value="EUR">EUR (€) - Euro</option>
                <option value="GBP">GBP (£) - British Pound</option>
                <option value="INR">INR (₹) - Indian Rupee</option>
                <option value="AUD">AUD ($) - Australian Dollar</option>
              </select>
            </div>
          </div>

          <div className="col-span-2 pt-4 border-t border-slate-100">
            <h3 className="text-sm font-bold text-slate-900 mb-4">Pipeline Behavior</h3>
            <div className="flex flex-col md:flex-row md:items-center gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
              <label className="text-sm text-slate-700 font-medium">Flag deals as stale after</label>
              <div className="flex items-center gap-2">
                <input 
                  type="number" 
                  min="1" 
                  value={form.staleThreshold} 
                  onChange={e => setForm(f => ({ ...f, staleThreshold: parseInt(e.target.value) || 30 }))}
                  className="w-20 px-3 py-1.5 border border-slate-200 rounded-lg text-sm font-bold focus:outline-none focus:border-indigo-400 text-center" 
                />
                <span className="text-sm text-slate-500 font-medium">days of inactivity</span>
              </div>
            </div>
          </div>
        </div>

        <div className="pt-6 flex justify-end">
          <Button type="submit" isLoading={mutation.isPending} className="px-8 py-6 shadow-indigo-100 shadow-lg">
            <Save className="h-4 w-4 mr-2" /> Save Organization Settings
          </Button>
        </div>
      </form>
    </div>
  );
}
