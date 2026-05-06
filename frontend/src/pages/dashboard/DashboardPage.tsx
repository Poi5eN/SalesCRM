import { useQuery } from '@tanstack/react-query';
import {
  Users, Target, Briefcase, TrendingUp,
  Clock, AlertTriangle, Calendar,
  CheckCircle2
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar, Cell
} from 'recharts';
import { startOfMonth, endOfMonth, subMonths, format, startOfWeek, isToday, isTomorrow, isThisWeek } from 'date-fns';
import { Link, useNavigate } from 'react-router-dom';

import * as leadsApi from '@/api/leads.api.ts';
import * as dealsApi from '@/api/deals.api.ts';
import * as contactsApi from '@/api/contacts.api.ts';
import * as tasksApi from '@/api/tasks.api.ts';
import * as activitiesApi from '@/api/activities.api.ts';
import { formatCurrency, formatNumber, formatRelativeTime } from '@/utils/format.ts';
import { useAuth } from '@/hooks/useAuth.ts';
import { StatCard } from '@/components/ui/StatCard.tsx';
import { Badge } from '@/components/ui/Badge.tsx';
import { useUIStore } from '@/store/ui.store.ts';

const REFETCH_INTERVAL = 5 * 60 * 1000; // 5 minutes

const DashboardPage = () => {
  const { tenant } = useAuth();
  const navigate = useNavigate();
  const theme = useUIStore((state) => state.theme);

  const now = new Date();
  const thisMonthStart = startOfMonth(now);
  const lastMonthStart = subMonths(thisMonthStart, 1);
  const lastMonthEnd = endOfMonth(lastMonthStart);

  // Queries
  const leadsThisMonth = useQuery({
    queryKey: ['leads', 'count', 'thisMonth'],
    queryFn: () => leadsApi.getLeads({ limit: 1, createdAtFrom: thisMonthStart.toISOString() }),
    refetchInterval: REFETCH_INTERVAL,
  });

  const leadsLastMonth = useQuery({
    queryKey: ['leads', 'count', 'lastMonth'],
    queryFn: () => leadsApi.getLeads({
      limit: 1,
      createdAtFrom: lastMonthStart.toISOString(),
      createdAtTo: lastMonthEnd.toISOString()
    }),
    refetchInterval: REFETCH_INTERVAL,
  });

  const totalLeads = useQuery({
    queryKey: ['leads', 'count', 'total'],
    queryFn: () => leadsApi.getLeads({ limit: 1 }),
    refetchInterval: REFETCH_INTERVAL,
  });

  const convertedLeads = useQuery({
    queryKey: ['leads', 'count', 'converted'],
    queryFn: () => leadsApi.getLeads({ limit: 1, isConverted: true }),
    refetchInterval: REFETCH_INTERVAL,
  });

  const openDeals = useQuery({
    queryKey: ['deals', 'count', 'open'],
    queryFn: () => dealsApi.getDeals({ status: 'open', limit: 1 }),
    refetchInterval: REFETCH_INTERVAL,
  });

  const openDealsLastMonth = useQuery({
    queryKey: ['deals', 'count', 'open', 'lastMonth'],
    queryFn: () => dealsApi.getDeals({
      status: 'open',
      limit: 1,
      createdAtFrom: lastMonthStart.toISOString(),
      createdAtTo: lastMonthEnd.toISOString()
    }),
    refetchInterval: REFETCH_INTERVAL,
  });

  const totalContactsLastMonth = useQuery({
    queryKey: ['contacts', 'count', 'total', 'lastMonth'],
    queryFn: () => contactsApi.getContacts({
      limit: 1,
      createdAtFrom: lastMonthStart.toISOString(),
      createdAtTo: lastMonthEnd.toISOString()
    }),
    refetchInterval: REFETCH_INTERVAL,
  });

  const convertedLeadsLastMonth = useQuery({
    queryKey: ['leads', 'count', 'converted', 'lastMonth'],
    queryFn: () => leadsApi.getLeads({
      limit: 1,
      isConverted: true,
      createdAtFrom: lastMonthStart.toISOString(),
      createdAtTo: lastMonthEnd.toISOString()
    }),
    refetchInterval: REFETCH_INTERVAL,
  });

  const totalLeadsLastMonth = useQuery({
    queryKey: ['leads', 'count', 'total', 'lastMonth'],
    queryFn: () => leadsApi.getLeads({
      limit: 1,
      createdAtFrom: lastMonthStart.toISOString(),
      createdAtTo: lastMonthEnd.toISOString()
    }),
    refetchInterval: REFETCH_INTERVAL,
  });

  const wonDealsRecent = useQuery({
    queryKey: ['deals', 'won', 'recent'],
    queryFn: () => dealsApi.getDeals({ status: 'won', limit: 50, sortBy: 'closedAt', sortOrder: 'desc' }),
    refetchInterval: REFETCH_INTERVAL,
  });

  const totalContacts = useQuery({
    queryKey: ['contacts', 'count', 'total'],
    queryFn: () => contactsApi.getContacts({ limit: 1 }),
    refetchInterval: REFETCH_INTERVAL,
  });

  const upcomingTasks = useQuery({
    queryKey: ['tasks', 'upcoming'],
    queryFn: () => tasksApi.getTasks({ limit: 10, status: 'pending' }),
    refetchInterval: REFETCH_INTERVAL,
  });

  const pipelineHealth = useQuery({
    queryKey: ['leads', 'board'],
    queryFn: () => leadsApi.getLeadBoard(),
    refetchInterval: REFETCH_INTERVAL,
  });

  const recentActivities = useQuery({
    queryKey: ['activities', 'recent'],
    queryFn: () => activitiesApi.getActivities(10),
    refetchInterval: REFETCH_INTERVAL,
  });

  const staleDeals = useQuery({
    queryKey: ['deals', 'stale'],
    queryFn: () => dealsApi.getDeals({ isStale: 'true', status: 'open', limit: 5 }),
    refetchInterval: REFETCH_INTERVAL,
  });

  // Derived Data
  const leadCountThisMonth = leadsThisMonth.data?.data?.meta?.total || 0;
  const leadCountLastMonth = leadsLastMonth.data?.data?.meta?.total || 0;
  const leadChange = leadCountLastMonth === 0 ? 0 : ((leadCountThisMonth - leadCountLastMonth) / leadCountLastMonth) * 100;

  const dealCountThisMonth = openDeals.data?.data?.meta?.total || 0;
  const dealCountLastMonth = openDealsLastMonth.data?.data?.meta?.total || 0;
  const dealChange = dealCountLastMonth === 0 ? 0 : ((dealCountThisMonth - dealCountLastMonth) / dealCountLastMonth) * 100;

  const contactCountThisMonth = totalContacts.data?.data?.meta?.total || 0;
  const contactCountLastMonth = totalContactsLastMonth.data?.data?.meta?.total || 0;
  const contactChange = contactCountLastMonth === 0 ? 0 : ((contactCountThisMonth - contactCountLastMonth) / contactCountLastMonth) * 100;

  const totalLeadsCount = totalLeads.data?.data?.meta?.total || 0;
  const convertedLeadsCount = convertedLeads.data?.data?.meta?.total || 0;
  const convRate = totalLeadsCount ? (convertedLeadsCount / totalLeadsCount) * 100 : 0;

  const totalLeadsLastMonthCount = totalLeadsLastMonth.data?.data?.meta?.total || 0;
  const convertedLeadsLastMonthCount = convertedLeadsLastMonth.data?.data?.meta?.total || 0;
  const convRateLastMonth = totalLeadsLastMonthCount ? (convertedLeadsLastMonthCount / totalLeadsLastMonthCount) * 100 : 0;
  const convRateChange = convRateLastMonth === 0 ? 0 : ((convRate - convRateLastMonth) / convRateLastMonth) * 100;

  // Chart Data: Won deals grouped by week (last 8 weeks)
  const chartData = (() => {
    if (!wonDealsRecent.data?.data?.data) return [];

    const weeks: any = {};
    for (let i = 7; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 7 * 24 * 60 * 60 * 1000);
      const weekLabel = format(startOfWeek(date), 'MMM d');
      weeks[weekLabel] = 0;
    }

    wonDealsRecent.data.data.data.forEach((deal: any) => {
      const closedAt = new Date(deal.closedAt);
      if (closedAt >= new Date(now.getTime() - 8 * 7 * 24 * 60 * 60 * 1000)) {
        const weekLabel = format(startOfWeek(closedAt), 'MMM d');
        if (weeks[weekLabel] !== undefined) {
          weeks[weekLabel] += Number(deal.value);
        }
      }
    });

    return Object.keys(weeks).map(label => ({ name: label, value: weeks[label] }));
  })();

  const thisMonthWonValue = wonDealsRecent.data?.data?.data
    ?.filter((d: any) => new Date(d.closedAt) >= thisMonthStart)
    ?.reduce((sum: number, d: any) => sum + Number(d.value), 0) || 0;

  // Group Tasks
  const groupedTasks = (() => {
    const tasks = upcomingTasks.data?.data?.data || [];
    return {
      today: tasks.filter((t: any) => isToday(new Date(t.dueAt))),
      tomorrow: tasks.filter((t: any) => isTomorrow(new Date(t.dueAt))),
      thisWeek: tasks.filter((t: any) => !isToday(new Date(t.dueAt)) && !isTomorrow(new Date(t.dueAt)) && isThisWeek(new Date(t.dueAt))),
    };
  })();

  return (
    <div className="space-y-8 pb-12">
      {/* Stale Deals Alert */}
      {staleDeals.data?.data?.meta?.total > 0 && (
        <div className="p-4 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800 rounded-2xl flex items-center justify-between shadow-sm animate-in slide-in-from-top duration-300">
          <div className="flex items-center space-x-3 text-amber-800 dark:text-amber-400">
            <AlertTriangle className="h-5 w-5" />
            <p className="text-sm font-bold">
              Attention: <span className="underline">{staleDeals.data.data.meta.total} deals</span> have been inactive for over 14 days.
            </p>
          </div>
          <Link to="/deals?isStale=true" className="text-xs font-black uppercase tracking-widest text-amber-900 dark:text-amber-300 hover:opacity-70">
            Fix Velocity →
          </Link>
        </div>
      )}

      <div>
        <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Performance Overview</h1>
        <p className="text-slate-500 dark:text-slate-400 font-medium mt-1">Track your team's progress and sales velocity in real-time.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Leads"
          value={formatNumber(totalLeadsCount)}
          change={Number(leadChange.toFixed(1))}
          icon={Target}
          iconColor="text-blue-500"
          isLoading={totalLeads.isLoading}
        />
        <StatCard
          title="Open Deals"
          value={dealCountThisMonth}
          change={Number(dealChange.toFixed(1))}
          icon={Briefcase}
          iconColor="text-indigo-500"
          isLoading={openDeals.isLoading}
        />
        <StatCard
          title="Conversion Rate"
          value={`${convRate.toFixed(1)}%`}
          change={Number(convRateChange.toFixed(1))}
          icon={TrendingUp}
          iconColor="text-emerald-500"
          isLoading={totalLeads.isLoading || convertedLeads.isLoading}
        />
        <StatCard
          title="Total Contacts"
          value={formatNumber(contactCountThisMonth)}
          change={Number(contactChange.toFixed(1))}
          icon={Users}
          iconColor="text-orange-500"
          isLoading={totalContacts.isLoading}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Deal Velocity Chart */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm p-8 flex flex-col">
          <div className="flex items-center justify-between mb-10">
            <div>
              <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">Revenue Velocity</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Monthly won deal value trends</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Won This Month</p>
              <p className="text-3xl font-black text-indigo-600 dark:text-indigo-400 tracking-tight">{formatCurrency(thisMonthWonValue, tenant?.currency)}</p>
            </div>
          </div>

          <div className="flex-1 min-h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme === 'dark' ? '#1e293b' : '#f1f5f9'} />
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }}
                  dy={15}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }}
                  tickFormatter={(val) => `₹${val / 1000}k`}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: '16px',
                    border: 'none',
                    boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.25)',
                    backgroundColor: theme === 'dark' ? '#1e293b' : '#ffffff',
                    color: theme === 'dark' ? '#ffffff' : '#000000'
                  }}
                  itemStyle={{ fontWeight: 800 }}
                  labelStyle={{ fontWeight: 900, marginBottom: '4px' }}
                  formatter={(val: number) => [formatCurrency(val, tenant?.currency), 'Won Value']}
                />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="#6366f1"
                  strokeWidth={4}
                  fillOpacity={1}
                  fill="url(#colorValue)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Upcoming Tasks Panel */}
        <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col overflow-hidden">
          <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
            <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">Today's Focus</h3>
            <Link to="/tasks" className="text-[10px] font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400 hover:opacity-70">View Agenda</Link>
          </div>

          <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
            {upcomingTasks.isLoading ? (
              <div className="space-y-6">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="flex items-start space-x-4 animate-pulse">
                    <div className="h-10 w-10 rounded-xl bg-slate-100 dark:bg-slate-700" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-slate-100 dark:bg-slate-700 rounded w-3/4" />
                      <div className="h-3 bg-slate-100 dark:bg-slate-700 rounded w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : upcomingTasks.data?.data?.data?.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center space-y-4 py-12">
                <div className="h-16 w-16 bg-emerald-50 dark:bg-emerald-900/20 rounded-3xl flex items-center justify-center text-emerald-500">
                  <CheckCircle2 className="h-8 w-8" />
                </div>
                <div>
                  <p className="text-base font-black text-slate-900 dark:text-white tracking-tight">All caught up!</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium max-w-[150px] mx-auto mt-1">You have no tasks due for the rest of the week.</p>
                </div>
              </div>
            ) : (
              <div className="space-y-8">
                {Object.entries(groupedTasks).map(([day, tasks]) => tasks.length > 0 && (
                  <div key={day} className="space-y-4">
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 flex items-center gap-2">
                      <span className="h-1 w-1 rounded-full bg-slate-300 dark:bg-slate-600" />
                      {day}
                    </h4>
                    <div className="space-y-3">
                      {tasks.map((task: any) => (
                        <div
                          key={task.id}
                          className="group p-3 rounded-2xl border border-transparent hover:border-slate-100 dark:hover:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-900/50 cursor-pointer transition-all"
                          onClick={() => navigate(task.leadId ? `/leads/${task.leadId}` : `/deals/${task.dealId}`)}
                        >
                          <div className="flex items-start gap-4">
                            <div className="mt-0.5 h-10 w-10 rounded-xl bg-white dark:bg-slate-800 flex items-center justify-center text-slate-400 border border-slate-100 dark:border-slate-700 group-hover:bg-indigo-600 group-hover:text-white group-hover:border-indigo-600 transition-all shadow-sm">
                              <Calendar className="h-5 w-5" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-black text-slate-900 dark:text-white truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{task.title}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge variant="outline" className="px-1 py-0 border-none bg-slate-100 dark:bg-slate-700">{format(new Date(task.dueAt), 'h:mm a')}</Badge>
                                <span className="text-[10px] font-bold text-slate-400 truncate tracking-tight">{task.lead?.title || task.deal?.title || 'No relation'}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Pipeline Health */}
        <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm p-8 flex flex-col">
          <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight mb-8">Lead Flow</h3>
          <div className="flex-1 min-h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart layout="vertical" data={pipelineHealth.data?.data?.map((s: any) => ({
                name: s.stage.name,
                count: s.totalCount,
                color: s.stage.color || '#6366f1'
              })) || []}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={theme === 'dark' ? '#1e293b' : '#f1f5f9'} />
                <XAxis type="number" hide />
                <YAxis
                  dataKey="name"
                  type="category"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#475569', fontSize: 10, fontWeight: 800 }}
                  width={100}
                />
                <Tooltip
                  cursor={{ fill: theme === 'dark' ? '#0f172a' : '#f8fafc' }}
                  contentStyle={{
                    borderRadius: '16px',
                    border: 'none',
                    boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.25)',
                    backgroundColor: theme === 'dark' ? '#1e293b' : '#ffffff',
                    color: theme === 'dark' ? '#ffffff' : '#000000'
                  }}
                />
                <Bar dataKey="count" radius={[0, 8, 8, 0]} barSize={24}>
                  {pipelineHealth.data?.data?.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={entry.stage.color || '#6366f1'} fillOpacity={0.8} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Activity Feed */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col overflow-hidden">
          <div className="p-6 border-b border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50">
            <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">Timeline</h3>
          </div>
          <div className="flex-1 p-8 overflow-y-auto custom-scrollbar">
            <div className="relative">
              {/* Vertical line for timeline */}
              <div className="absolute left-5 top-0 bottom-0 w-px bg-slate-100 dark:bg-slate-700" />

              <div className="space-y-10">
                {recentActivities.isLoading ? (
                  [1, 2, 3, 4, 5].map(i => (
                    <div key={i} className="flex items-center space-x-6 animate-pulse pl-1.5">
                      <div className="h-8 w-8 rounded-full bg-slate-100 dark:bg-slate-700 z-10" />
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-slate-100 dark:bg-slate-700 rounded w-full" />
                        <div className="h-3 bg-slate-100 dark:bg-slate-700 rounded w-1/4" />
                      </div>
                    </div>
                  ))
                ) : (
                  recentActivities.data?.data?.map((activity: any) => (
                    <div key={activity.id} className="relative flex items-start gap-6 pl-1.5 group">
                      {/* Timeline dot */}
                      <div className="h-8 w-8 rounded-full bg-white dark:bg-slate-800 border-2 border-indigo-500 shadow-md flex items-center justify-center shrink-0 z-10 transition-transform group-hover:scale-110">
                        <div className="h-2 w-2 rounded-full bg-indigo-500" />
                      </div>

                      <div className="flex-1 min-w-0 pt-0.5">
                        <div className="flex items-center gap-3 mb-1">
                          <div className="h-5 w-5 rounded-full bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 flex items-center justify-center text-[10px] font-black text-slate-500 overflow-hidden shrink-0">
                            {activity.user.avatarUrl ? (
                              <img src={activity.user.avatarUrl} className="h-full w-full object-cover" />
                            ) : (
                              <span>{activity.user.firstName.charAt(0)}</span>
                            )}
                          </div>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{formatRelativeTime(activity.createdAt)}</p>
                        </div>
                        <p className="text-sm text-slate-700 dark:text-slate-300 font-medium leading-relaxed">
                          <span className="font-black text-slate-900 dark:text-white">{activity.user.firstName} {activity.user.lastName}</span>
                          {' '}{activity.action.replace('_', ' ')}
                          {' '}<span className="bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 rounded text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mx-1">{activity.entityType}</span>
                          {activity.metadata?.newValue?.stageName && (
                            <span> to <span className="font-bold text-indigo-600 dark:text-indigo-400 underline decoration-indigo-200 dark:decoration-indigo-800 underline-offset-4">{activity.metadata.newValue.stageName}</span></span>
                          )}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
