export const DEAL_STATUS_OPTIONS = [
  { value: 'open', label: 'Open' },
  { value: 'won', label: 'Won' },
  { value: 'lost', label: 'Lost' },
  { value: 'on_hold', label: 'On Hold' },
];

export function getProbabilityColor(probability: number): string {
  if (probability < 30) return 'bg-red-500';
  if (probability < 70) return 'bg-amber-500';
  return 'bg-emerald-500';
}

export function getStatusBadgeStyles(status: string): string {
  switch (status) {
    case 'open':
      return 'bg-indigo-50 text-indigo-700 border-indigo-200';
    case 'won':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    case 'lost':
      return 'bg-red-50 text-red-700 border-red-200';
    case 'on_hold':
      return 'bg-amber-50 text-amber-700 border-amber-200';
    default:
      return 'bg-slate-50 text-slate-700 border-slate-200';
  }
}
