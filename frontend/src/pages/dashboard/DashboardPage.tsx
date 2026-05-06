import { useQuery } from '@tanstack/react-query';
import { 
  Users, Target, Briefcase, TrendingUp, 
  ArrowUpRight, ArrowDownRight, Clock,
  AlertTriangle, CheckCircle2, Phone, Mail, MessageSquare, Calendar
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, BarChart, Bar, Cell
} from 'recharts';
import { startOfMonth, endOfMonth, subMonths, format, startOfWeek, endOfWeek, isToday, isTomorrow, isThisWeek } from 'date-fns';
import { Link, useNavigate } from 'react-router-dom';

import * as leadsApi from '@/api/leads.api.ts';
import * as dealsApi from '@/api/deals.api.ts';
import * as contactsApi from '@/api/contacts.api.ts';
import * as tasksApi from '@/api/tasks.api.ts';
import * as activitiesApi from '@/api/activities.api.ts';
import { formatCurrency, formatNumber, formatRelativeTime } from '@/utils/format.ts';
import { useAuth } from '@/hooks/useAuth.ts';

const REFETCH_INTERVAL = 5 * 60 * 1000; // 5 minutes

const DashboardPage = () => {
  const { tenant } = useAuth();
  const navigate = useNavigate();

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
    queryFn: () => tasksApi.getUpcomingTasks(),
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
    const tasks = upcomingTasks.data?.data || [];
    return {
      today: tasks.filter((t: any) => isToday(new Date(t.dueAt))),
      tomorrow: tasks.filter((t: any) => isTomorrow(new Date(t.dueAt))),
      thisWeek: tasks.filter((t: any) => !isToday(new Date(t.dueAt)) && !isTomorrow(new Date(t.dueAt)) && isThisWeek(new Date(t.dueAt))),
    };
  })();

  const stats = [
    { 
      label: 'Total Leads', 
      value: totalLeadsCount, 
      change: `${leadChange >= 0 ? '+' : ''}${leadChange.toFixed(1)}%`, 
      trending: leadChange >= 0 ? 'up' : 'down', 
      icon: Target, 
      color: 'text-blue-600', 
      bg: 'bg-blue-50',
      loading: totalLeads.isLoading || leadsLastMonth.isLoading
    },
    { 
      label: 'Open Deals', 
      value: dealCountThisMonth, 
      change: `${dealChange >= 0 ? '+' : ''}${dealChange.toFixed(1)}%`, 
      trending: dealChange >= 0 ? 'up' : 'down', 
      icon: Briefcase, 
      color: 'text-indigo-600', 
      bg: 'bg-indigo-50',
      loading: openDeals.isLoading || openDealsLastMonth.isLoading
    },
    { 
      label: 'Conversion Rate', 
      value: `${convRate.toFixed(1)}%`, 
      change: `${convRateChange >= 0 ? '+' : ''}${convRateChange.toFixed(1)}%`, 
      trending: convRateChange >= 0 ? 'up' : 'down', 
      icon: TrendingUp, 
      color: 'text-emerald-600', 
      bg: 'bg-emerald-50',
      loading: totalLeads.isLoading || convertedLeads.isLoading || totalLeadsLastMonth.isLoading || convertedLeadsLastMonth.isLoading
    },
    { 
      label: 'Total Contacts', 
      value: contactCountThisMonth, 
      change: `${contactChange >= 0 ? '+' : ''}${contactChange.toFixed(1)}%`, 
      trending: contactChange >= 0 ? 'up' : 'down', 
      icon: Users, 
      color: 'text-orange-600', 
      bg: 'bg-orange-50',
      loading: totalContacts.isLoading || totalContactsLastMonth.isLoading
    },
  ];

  const getTaskIcon = (type: string) => {
    switch(type) {
      case 'call': return <Phone className="h-4 w-4" />;
      case 'email': return <Mail className="h-4 w-4" />;
      case 'meeting': return <Users className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Stale Deals Alert */}
      {staleDeals.data?.data?.meta?.total > 0 && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between">
          <div className="flex items-center space-x-3 text-amber-800">
            <AlertTriangle className="h-5 w-5" />
            <p className="font-medium">
              You have <span className="font-bold">{staleDeals.data.data.meta.total}</span> deals with no activity in 14+ days.
            </p>
          </div>
          <Link to="/deals?isStale=true" className="text-sm font-bold text-amber-900 hover:underline">
            View Stale Deals →
          </Link>
        </div>
      )}

      <div>
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-slate-500">Welcome back! Here's what's happening with your sales today.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <div key={i} className="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className={`p-3 rounded-xl ${stat.bg} ${stat.color}`}>
                <stat.icon className="h-6 w-6" />
              </div>
              <div className={`flex items-center text-sm font-semibold ${stat.trending === 'up' ? 'text-emerald-600' : 'text-red-600'}`}>
                {stat.change}
                {stat.trending === 'up' ? <ArrowUpRight className="ml-1 h-4 w-4" /> : <ArrowDownRight className="ml-1 h-4 w-4" />}
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">{stat.label}</p>
              {stat.loading ? (
                <div className="h-8 w-24 bg-slate-100 animate-pulse rounded mt-1" />
              ) : (
                <h3 className="text-2xl font-bold text-slate-900">{stat.label === 'Conversion Rate' ? stat.value : formatNumber(stat.value)}</h3>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Deal Velocity Chart */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-lg font-bold text-slate-900">Recent Deal Velocity</h3>
              <p className="text-sm text-slate-500">Value of won deals over the last 8 weeks</p>
            </div>
            <div className="text-right">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Won This Month</p>
              <p className="text-2xl font-black text-indigo-600">{formatCurrency(thisMonthWonValue, tenant?.currency)}</p>
            </div>
          </div>
          
          <div className="flex-1 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fill: '#94a3b8', fontSize: 12}}
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fill: '#94a3b8', fontSize: 12}}
                  tickFormatter={(val) => `₹${val/1000}k`}
                />
                <Tooltip 
                  contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}}
                  formatter={(val: number) => [formatCurrency(val, tenant?.currency), 'Won Value']}
                />
                <Area 
                  type="monotone" 
                  dataKey="value" 
                  stroke="#4f46e5" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorValue)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Upcoming Tasks Panel */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-lg font-bold text-slate-900">Upcoming Tasks</h3>
            <Link to="/tasks" className="text-xs font-bold text-indigo-600 hover:underline">View All</Link>
          </div>
          
          <div className="flex-1 overflow-y-auto p-6">
            {upcomingTasks.isLoading ? (
              <div className="space-y-6">
                {[1,2,3].map(i => (
                  <div key={i} className="flex items-start space-x-4 animate-pulse">
                    <div className="h-8 w-8 rounded-lg bg-slate-100" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-slate-100 rounded w-3/4" />
                      <div className="h-3 bg-slate-100 rounded w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : upcomingTasks.data?.data?.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center space-y-3 py-12">
                <div className="p-4 bg-slate-50 rounded-full text-slate-300">
                  <Calendar className="h-8 w-8" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900">All caught up!</p>
                  <p className="text-xs text-slate-500">No tasks due for the next 7 days.</p>
                </div>
              </div>
            ) : (
              <div className="space-y-8">
                {Object.entries(groupedTasks).map(([day, tasks]) => tasks.length > 0 && (
                  <div key={day} className="space-y-4">
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-100 pb-2">
                      {day}
                    </h4>
                    <div className="space-y-4">
                      {tasks.map((task: any) => (
                        <div 
                          key={task.id} 
                          className="group flex items-start space-x-4 cursor-pointer"
                          onClick={() => navigate(task.leadId ? `/leads/${task.leadId}` : `/deals/${task.dealId}`)}
                        >
                          <div className="mt-0.5 h-8 w-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400 border border-slate-100 group-hover:bg-indigo-50 group-hover:text-indigo-600 group-hover:border-indigo-100 transition-colors">
                            {getTaskIcon(task.type)}
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors">{task.title}</p>
                            <p className="text-[11px] text-slate-500">
                              {format(new Date(task.dueAt), 'h:mm a')} • {task.lead?.title || task.deal?.title || 'No relation'}
                            </p>
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
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <h3 className="text-lg font-bold text-slate-900 mb-6">Pipeline Health</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart layout="vertical" data={pipelineHealth.data?.data?.map((s: any) => ({
                name: s.stage.name,
                count: s.totalCount,
                color: s.stage.color || '#4f46e5'
              })) || []}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis type="number" hide />
                <YAxis 
                  dataKey="name" 
                  type="category" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fill: '#475569', fontSize: 11, fontWeight: 600}} 
                  width={100}
                />
                <Tooltip 
                  cursor={{fill: '#f8fafc'}}
                  contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}}
                />
                <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                  {pipelineHealth.data?.data?.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={entry.stage.color || '#4f46e5'} fillOpacity={0.8} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Activity Feed */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col">
          <div className="p-6 border-b border-slate-100">
            <h3 className="text-lg font-bold text-slate-900">Recent Activity</h3>
          </div>
          <div className="flex-1 p-6">
            <div className="space-y-6">
              {recentActivities.isLoading ? (
                 [1,2,3,4].map(i => (
                  <div key={i} className="flex items-center space-x-4 animate-pulse">
                    <div className="h-10 w-10 rounded-full bg-slate-100" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-slate-100 rounded w-full" />
                      <div className="h-3 bg-slate-100 rounded w-1/4" />
                    </div>
                  </div>
                ))
              ) : (
                recentActivities.data?.data?.map((activity: any) => (
                  <div key={activity.id} className="flex items-start space-x-4">
                    <div className="h-10 w-10 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 font-bold overflow-hidden flex-shrink-0">
                      {activity.user.avatarUrl ? (
                        <img src={activity.user.avatarUrl} className="h-full w-full object-cover" />
                      ) : (
                        <span>{activity.user.firstName.charAt(0)}</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-slate-900 leading-snug">
                        <span className="font-bold">{activity.user.firstName} {activity.user.lastName}</span>
                        {' '}{activity.action.replace('_', ' ')}
                        {' '}<span className="text-slate-500 lowercase">{activity.entityType}</span>
                        {activity.metadata?.newValue?.stageName && (
                          <span> to <span className="font-semibold text-indigo-600">{activity.metadata.newValue.stageName}</span></span>
                        )}
                      </p>
                      <p className="text-xs text-slate-400 mt-1">{formatRelativeTime(activity.createdAt)}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
