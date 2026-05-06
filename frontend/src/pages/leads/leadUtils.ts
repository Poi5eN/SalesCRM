import { differenceInDays } from 'date-fns';

export type LeadPriority = 'low' | 'medium' | 'high' | 'urgent';
export type LeadSource = 'manual' | 'webForm' | 'importCsv' | 'inboundEmail' | 'referral' | 'socialMedia' | 'coldOutreach' | 'event' | 'aiAgent' | 'other';

export function getScoreColor(score: number): string {
  if (score <= 33) return 'bg-red-500';
  if (score <= 66) return 'bg-amber-500';
  return 'bg-emerald-500';
}

export function getScoreTextColor(score: number): string {
  if (score <= 33) return 'text-red-600';
  if (score <= 66) return 'text-amber-600';
  return 'text-emerald-600';
}

export function getPriorityStyles(priority: LeadPriority): string {
  const map: Record<LeadPriority, string> = {
    urgent: 'bg-red-50 text-red-700 border-red-200',
    high: 'bg-orange-50 text-orange-700 border-orange-200',
    medium: 'bg-amber-50 text-amber-700 border-amber-200',
    low: 'bg-slate-50 text-slate-600 border-slate-200',
  };
  return map[priority] ?? 'bg-slate-50 text-slate-600 border-slate-200';
}

export function getPriorityDotColor(priority: LeadPriority): string {
  const map: Record<LeadPriority, string> = {
    urgent: 'bg-red-500',
    high: 'bg-orange-500',
    medium: 'bg-amber-400',
    low: 'bg-slate-400',
  };
  return map[priority] ?? 'bg-slate-400';
}

export function daysInStage(updatedAt: string): number {
  return differenceInDays(new Date(), new Date(updatedAt));
}

export const SOURCE_LABELS: Record<LeadSource, string> = {
  manual: 'Manual',
  webForm: 'Web Form',
  importCsv: 'Import CSV',
  inboundEmail: 'Inbound Email',
  referral: 'Referral',
  socialMedia: 'Social Media',
  coldOutreach: 'Cold Outreach',
  event: 'Event',
  aiAgent: 'AI Agent',
  other: 'Other',
};

export const PRIORITY_OPTIONS: { value: LeadPriority; label: string }[] = [
  { value: 'urgent', label: 'Urgent' },
  { value: 'high', label: 'High' },
  { value: 'medium', label: 'Medium' },
  { value: 'low', label: 'Low' },
];

export const SOURCE_OPTIONS: { value: LeadSource; label: string }[] = Object.entries(SOURCE_LABELS).map(
  ([value, label]) => ({ value: value as LeadSource, label })
);
