import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Bell, CheckCheck, Archive, ChevronRight, Calendar, Clock, UserCheck, TrendingUp, AlertTriangle, Trophy, MessageSquare } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import * as notificationsApi from '@/api/notifications.api.ts';
import { Button } from '@/components/ui/Button.tsx';
import { EmptyState } from '@/components/ui/EmptyState.tsx';

const TYPE_ICONS: Record<string, { icon: typeof Bell; color: string }> = {
  sla_breach: { icon: AlertTriangle, color: 'text-red-500 bg-red-50' },
  auto_reassignment: { icon: UserCheck, color: 'text-amber-500 bg-amber-50' },
  task_due: { icon: Clock, color: 'text-orange-500 bg-orange-50' },
  task_overdue: { icon: AlertTriangle, color: 'text-red-500 bg-red-50' },
  lead_assigned: { icon: UserCheck, color: 'text-blue-500 bg-blue-50' },
  deal_won: { icon: TrendingUp, color: 'text-emerald-500 bg-emerald-50' },
  deal_lost: { icon: AlertTriangle, color: 'text-red-500 bg-red-50' },
  mention: { icon: MessageSquare, color: 'text-indigo-500 bg-indigo-50' },
  comment: { icon: MessageSquare, color: 'text-indigo-500 bg-indigo-50' },
  achievement: { icon: Trophy, color: 'text-amber-500 bg-amber-50' },
  digest: { icon: Calendar, color: 'text-purple-500 bg-purple-50' },
  system: { icon: Bell, color: 'text-slate-500 bg-slate-50' },
};

const TYPE_FILTERS = [
  { label: 'All', value: '' },
  { label: 'Unread', value: 'unread' },
  { label: 'SLA', value: 'sla_breach' },
  { label: 'Tasks', value: 'task_due' },
  { label: 'Mentions', value: 'mention' },
  { label: 'Achievements', value: 'achievement' },
  { label: 'Digests', value: 'digest' },
];

export default function NotificationsPage() {
  const qc = useQueryClient();
  const [filter, setFilter] = useState('');
  const [page, setPage] = useState(1);

  const queryParams: any = { page, limit: 30 };
  if (filter === 'unread') queryParams.isRead = false;
  else if (filter) queryParams.type = filter;

  const { data, isLoading } = useQuery({
    queryKey: ['notifications', queryParams],
    queryFn: () => notificationsApi.getNotifications(queryParams),
  });

  const { data: unreadData } = useQuery({
    queryKey: ['notifications-unread'],
    queryFn: () => notificationsApi.getUnreadCount(),
  });

  const markAllMutation = useMutation({
    mutationFn: () => notificationsApi.markAllAsRead(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notifications'] });
      qc.invalidateQueries({ queryKey: ['notifications-unread'] });
    },
  });

  const markMutation = useMutation({
    mutationFn: (ids: string[]) => notificationsApi.markAsRead(ids),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notifications'] });
      qc.invalidateQueries({ queryKey: ['notifications-unread'] });
    },
  });

  const notifications = data?.data?.data?.data ?? [];
  const meta = data?.data?.data?.meta ?? {};
  const unreadCount = unreadData?.data?.data?.count ?? 0;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-[var(--text-primary)] tracking-tight">Notifications</h1>
          <p className="text-sm font-medium text-[var(--text-secondary)] mt-1.5">
            Stay updated on SLA breaches, task reminders, mentions, and more.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {unreadCount > 0 && (
            <Button
              variant="outline"
              onClick={() => markAllMutation.mutate()}
              isLoading={markAllMutation.isPending}
              className="text-xs"
            >
              <CheckCheck className="h-4 w-4 mr-2" />
              Mark All Read ({unreadCount})
            </Button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
        {TYPE_FILTERS.map(f => (
          <button
            key={f.value}
            onClick={() => { setFilter(f.value); setPage(1); }}
            className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              filter === f.value
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
                : 'bg-[var(--card-bg)] border border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--sidebar-item-active-bg)]'
            }`}
          >
            {f.label}
            {f.value === '' && unreadCount > 0 && (
              <span className="ml-2 px-1.5 py-0.5 bg-white/20 rounded text-[10px]">{unreadCount}</span>
            )}
          </button>
        ))}
      </div>

      {/* Notifications List */}
      {isLoading ? (
        <div className="text-center py-20 text-[var(--text-muted)]">Loading notifications...</div>
      ) : notifications.length === 0 ? (
        <EmptyState
          title="No notifications yet"
          description="You're all caught up! Notifications for SLA alerts, task reminders, and mentions will appear here."
          actionText="Go to Dashboard"
          onAction={() => window.location.href = '/dashboard'}
        />
      ) : (
        <div className="space-y-2">
          {notifications.map((n: any) => {
            const typeConfig = TYPE_ICONS[n.type] || TYPE_ICONS.system;
            const Icon = typeConfig.icon;
            return (
              <div
                key={n.id}
                onClick={() => { if (!n.isRead) markMutation.mutate([n.id]); }}
                className={`group relative p-5 rounded-2xl border transition-all cursor-pointer ${
                  n.isRead
                    ? 'bg-[var(--card-bg)] border-[var(--border)] opacity-80'
                    : 'bg-indigo-50/50 dark:bg-indigo-950/10 border-indigo-200 dark:border-indigo-800/50'
                } hover:shadow-md hover:-translate-y-0.5 duration-200`}
              >
                <div className="flex items-start gap-4">
                  {/* Icon */}
                  <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${typeConfig.color}`}>
                    <Icon className="h-5 w-5" />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h4 className={`text-sm font-bold ${n.isRead ? 'text-[var(--text-primary)]' : 'text-indigo-900 dark:text-indigo-300'}`}>
                          {n.title}
                        </h4>
                        {n.body && (
                          <p className="text-xs text-[var(--text-secondary)] mt-1 line-clamp-2 leading-relaxed">{n.body}</p>
                        )}
                      </div>
                      {!n.isRead && (
                        <span className="h-2 w-2 rounded-full bg-indigo-600 shrink-0 mt-2" />
                      )}
                    </div>

                    <div className="flex items-center gap-3 mt-3">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">
                        {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                      </span>
                      {n.link && (
                        <a
                          href={n.link}
                          onClick={e => e.stopPropagation()}
                          className="flex items-center gap-1 text-[10px] font-bold text-indigo-600 hover:text-indigo-800 uppercase tracking-widest"
                        >
                          View <ChevronRight className="h-3 w-3" />
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {meta.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-4">
          {Array.from({ length: meta.totalPages }, (_, i) => i + 1).map(p => (
            <button
              key={p}
              onClick={() => setPage(p)}
              className={`h-8 w-8 rounded-lg text-xs font-bold transition-all ${
                p === page
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'bg-[var(--card-bg)] border border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--sidebar-item-active-bg)]'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
