import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Check, X, Zap, Building2, CreditCard, ArrowUp, AlertTriangle, Loader2 } from 'lucide-react';
import * as billingApi from '@/api/billing.api.ts';
import { Button } from '@/components/ui/Button.tsx';

const BILLING_INTERVALS = [
  { value: 'monthly', label: 'Monthly' },
  { value: 'annual', label: 'Annual', discount: 'Save 20%' },
];

export default function BillingPage() {
  const qc = useQueryClient();
  const [billingInterval, setBillingInterval] = useState<'monthly' | 'annual'>('monthly');
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [confirmUpgrade, setConfirmUpgrade] = useState(false);

  const { data: plansData, isLoading: plansLoading } = useQuery({
    queryKey: ['billing-plans'],
    queryFn: () => billingApi.getPlans(),
  });

  const { data: subData, isLoading: subLoading } = useQuery({
    queryKey: ['billing-subscription'],
    queryFn: () => billingApi.getSubscription(),
  });

  const { data: usageData } = useQuery({
    queryKey: ['billing-usage'],
    queryFn: () => billingApi.getUsage(),
  });

  const changePlanMutation = useMutation({
    mutationFn: (plan: string) => billingApi.changePlan(plan),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['billing-plans'] });
      qc.invalidateQueries({ queryKey: ['billing-subscription'] });
      setSelectedPlan(null);
      setConfirmUpgrade(false);
    },
  });

  const plans = plansData?.data?.data ?? [];
  const subscription = subData?.data?.data;
  const usage = usageData?.data?.data;
  const isCurrentPlan = (planId: string) => subscription?.plan === planId;

  return (
    <div className="space-y-10">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-black text-[var(--text-primary)] tracking-tight">Billing & Plans</h1>
        <p className="text-sm font-medium text-[var(--text-secondary)] mt-1.5">
          Manage your subscription, view usage, and upgrade your plan.
        </p>
      </div>

      {/* Current Plan Summary */}
      {subscription && (
        <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-3xl p-8 text-white shadow-xl">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="h-10 w-10 rounded-xl bg-white/20 flex items-center justify-center">
                  <Building2 className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-indigo-200">Current Plan</p>
                  <h2 className="text-2xl font-black">{subscription.planName}</h2>
                </div>
              </div>
              <p className="text-indigo-200 text-sm mt-2">
                {subscription.status === 'trialExpired' ? 'Trial expired' : 
                 subscription.status === 'active' ? 'Active' : subscription.status}
                {subscription.trialEndsAt && ` — Trial ends ${new Date(subscription.trialEndsAt).toLocaleDateString()}`}
              </p>
            </div>
            <div className="text-right">
              <p className="text-3xl font-black">${subscription.price}</p>
              <p className="text-indigo-200 text-xs font-bold uppercase tracking-widest">/month</p>
            </div>
          </div>
        </div>
      )}

      {/* Usage Warning */}
      {usage && !usage.withinLimits && (
        <div className="p-5 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-900/30 rounded-2xl flex gap-4">
          <AlertTriangle className="h-6 w-6 text-amber-600 shrink-0" />
          <div>
            <h4 className="text-sm font-black text-amber-900 dark:text-amber-400 uppercase tracking-tight">Usage Limits Reached</h4>
            <ul className="mt-2 space-y-1">
              {usage.warnings?.map((w: string, i: number) => (
                <li key={i} className="text-xs font-bold text-amber-700 dark:text-amber-500">{w}</li>
              ))}
            </ul>
            <p className="text-xs text-amber-600 dark:text-amber-400 mt-2 font-bold">Upgrade your plan to increase limits.</p>
          </div>
        </div>
      )}

      {/* Billing Interval Toggle */}
      <div className="flex items-center justify-center gap-4">
        {BILLING_INTERVALS.map(interval => (
          <button
            key={interval.value}
            onClick={() => setBillingInterval(interval.value as any)}
            className={`relative px-6 py-3 rounded-2xl text-sm font-bold transition-all ${
              billingInterval === interval.value
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
                : 'bg-[var(--card-bg)] border border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--sidebar-item-active-bg)]'
            }`}
          >
            {interval.label}
            {(interval as any).discount && (
              <span className="absolute -top-2 -right-2 px-2 py-0.5 bg-emerald-500 text-white text-[8px] font-black rounded-full uppercase">
                {(interval as any).discount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Plan Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {plans.map((plan: any) => {
          const isCurrent = isCurrentPlan(plan.id);
          const isSelected = selectedPlan === plan.id;
          const features = plan.features || {};

          return (
            <div
              key={plan.id}
              className={`relative bg-[var(--card-bg)] border rounded-3xl p-6 transition-all hover:shadow-xl hover:-translate-y-1 duration-200 ${
                isCurrent
                  ? 'border-indigo-400 dark:border-indigo-600 ring-2 ring-indigo-200 dark:ring-indigo-800'
                  : isSelected
                  ? 'border-emerald-400 dark:border-emerald-600 ring-2 ring-emerald-200'
                  : 'border-[var(--border)]'
              }`}
            >
              {isCurrent && (
                <span className="absolute -top-3 left-6 px-3 py-1 bg-indigo-600 text-white text-[10px] font-black rounded-full uppercase tracking-widest shadow-lg">
                  Current
                </span>
              )}

              <div className="mb-6">
                <h3 className="text-xl font-black text-[var(--text-primary)] tracking-tight">{plan.name}</h3>
                <div className="mt-3 flex items-baseline gap-1">
                  <span className="text-4xl font-black text-[var(--text-primary)]">${plan.price}</span>
                  <span className="text-sm text-[var(--text-muted)] font-bold">/mo</span>
                </div>
              </div>

              <ul className="space-y-3 mb-8">
                {Object.entries(features).map(([key, value]: any) => (
                  <li key={key} className="flex items-center gap-2.5 text-xs">
                    {value ? (
                      <Check className="h-4 w-4 text-emerald-500 shrink-0" />
                    ) : (
                      <X className="h-4 w-4 text-slate-300 dark:text-slate-600 shrink-0" />
                    )}
                    <span className={value ? 'text-[var(--text-primary)] font-bold' : 'text-[var(--text-muted)]'}>
                      {key.replace(/([A-Z])/g, ' $1').replace(/^./, (s: string) => s.toUpperCase()).trim()}: <span className="font-black">{typeof value === 'string' ? value : value ? '✓' : '✗'}</span>
                    </span>
                  </li>
                ))}
              </ul>

              <Button
                className="w-full rounded-2xl"
                variant={isCurrent ? 'outline' : 'primary'}
                disabled={isCurrent}
                onClick={() => {
                  setSelectedPlan(plan.id);
                  setConfirmUpgrade(true);
                }}
              >
                {isCurrent ? 'Current Plan' : plan.price === 0 ? 'Get Started' : 'Upgrade'}
                {!isCurrent && <ArrowUp className="h-4 w-4 ml-2" />}
              </Button>
            </div>
          );
        })}
      </div>

      {/* Billing Email */}
      <div className="bg-[var(--card-bg)] border border-[var(--border)] rounded-3xl p-8">
        <h2 className="text-lg font-black text-[var(--text-primary)] tracking-tight mb-4">Billing Details</h2>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CreditCard className="h-5 w-5 text-[var(--text-muted)]" />
            <div>
              <p className="text-sm font-bold text-[var(--text-primary)]">Billing Email</p>
              <p className="text-xs text-[var(--text-secondary)]">{subscription?.billingEmail || 'Not set'}</p>
            </div>
          </div>
          <Button variant="outline" size="sm">Update</Button>
        </div>
      </div>

      {/* Upgrade Confirmation Modal */}
      {confirmUpgrade && selectedPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl w-full max-w-md p-8 border border-slate-200 dark:border-slate-700">
            <div className="text-center mb-6">
              <div className="h-16 w-16 rounded-2xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center mx-auto mb-4">
                <Zap className="h-8 w-8 text-indigo-600" />
              </div>
              <h3 className="text-xl font-black text-slate-900 dark:text-white">Upgrade Your Plan</h3>
              <p className="text-sm text-slate-500 mt-2">
                You're about to upgrade to <span className="font-black text-indigo-600">{plans.find((p: any) => p.id === selectedPlan)?.name}</span>.
                Your next billing cycle will reflect the new price.
              </p>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => { setSelectedPlan(null); setConfirmUpgrade(false); }}>Cancel</Button>
              <Button
                className="flex-1"
                isLoading={changePlanMutation.isPending}
                onClick={() => changePlanMutation.mutate(selectedPlan)}
              >
                {changePlanMutation.isPending ? 'Upgrading...' : 'Confirm Upgrade'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
