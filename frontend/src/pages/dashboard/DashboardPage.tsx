import { useQuery } from '@tanstack/react-query';
import { 
  Users, Target, Briefcase, TrendingUp, 
  ArrowUpRight, ArrowDownRight, Clock 
} from 'lucide-react';
import * as leadsApi from '@/api/leads.api.ts';
import * as dealsApi from '@/api/deals.api.ts';
import * as contactsApi from '@/api/contacts.api.ts';
import * as tasksApi from '@/api/tasks.api.ts';

const DashboardPage = () => {
  const { data: leadsData, isLoading: leadsLoading } = useQuery({
    queryKey: ['leads', { limit: 1 }],
    queryFn: () => leadsApi.getLeads({ limit: 1 }),
  });

  const { data: dealsData, isLoading: dealsLoading } = useQuery({
    queryKey: ['deals', { limit: 1 }],
    queryFn: () => dealsApi.getDeals({ limit: 1 }),
  });

  const { data: contactsData, isLoading: contactsLoading } = useQuery({
    queryKey: ['contacts', { limit: 1 }],
    queryFn: () => contactsApi.getContacts({ limit: 1 }),
  });

  const { data: tasksData, isLoading: tasksLoading } = useQuery({
    queryKey: ['tasks', 'upcoming'],
    queryFn: () => tasksApi.getUpcomingTasks(),
  });

  const stats = [
    { 
      label: 'Total Leads', 
      value: leadsData?.data?.meta?.total || 0, 
      change: '+0%', 
      trending: 'up', 
      icon: Target, 
      color: 'text-blue-600', 
      bg: 'bg-blue-50',
      loading: leadsLoading
    },
    { 
      label: 'Open Deals', 
      value: dealsData?.data?.meta?.total || 0, 
      change: '+0%', 
      trending: 'up', 
      icon: Briefcase, 
      color: 'text-indigo-600', 
      bg: 'bg-indigo-50',
      loading: dealsLoading
    },
    { 
      label: 'Total Contacts', 
      value: contactsData?.data?.meta?.total || 0, 
      change: '+0%', 
      trending: 'up', 
      icon: Users, 
      color: 'text-orange-600', 
      bg: 'bg-orange-50',
      loading: contactsLoading
    },
    { 
      label: 'Conversion Rate', 
      value: '0%', 
      change: '0%', 
      trending: 'down', 
      icon: TrendingUp, 
      color: 'text-emerald-600', 
      bg: 'bg-emerald-50',
      loading: false
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-slate-500">Welcome back! Here's what's happening with your sales today.</p>
      </div>

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
                <div className="h-8 w-24 bg-slate-100 animate-pulse rounded" />
              ) : (
                <h3 className="text-2xl font-bold text-slate-900">{stat.value}</h3>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm p-6 min-h-[400px]">
          <h3 className="text-lg font-bold text-slate-900 mb-6">Recent Deal Velocity</h3>
          <div className="flex items-center justify-center h-64 text-slate-400 italic">
            Chart Data Coming Soon
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <h3 className="text-lg font-bold text-slate-900 mb-6">Upcoming Tasks</h3>
          <div className="space-y-6">
            {tasksLoading ? (
               [1, 2, 3].map(i => (
                <div key={i} className="flex items-start space-x-4 animate-pulse">
                  <div className="h-8 w-8 rounded-lg bg-slate-100" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-slate-100 rounded w-3/4" />
                    <div className="h-3 bg-slate-100 rounded w-1/2" />
                  </div>
                </div>
              ))
            ) : tasksData?.data?.length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-sm">
                No upcoming tasks
              </div>
            ) : (
              tasksData?.data?.map((task: any) => (
                <div key={task.id} className="flex items-start space-x-4">
                  <div className="mt-1 h-8 w-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400 border border-slate-100">
                    <Clock className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{task.title}</p>
                    <p className="text-xs text-slate-500">
                      {new Date(task.dueAt).toLocaleString()} • {task.lead?.title || task.deal?.title || 'No relation'}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
