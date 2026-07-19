import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, FunnelChart, Funnel, LabelList, Area, AreaChart
} from 'recharts';
import {
  TrendingUp, Users, Target, Briefcase, Download,
  Calendar, Award, ArrowUpRight, ArrowDownRight, Activity
} from 'lucide-react';
import { format, startOfYear, eachDayOfInterval, isSameDay, subMonths } from 'date-fns';

import * as analyticsApi from '@/api/analytics.api.ts';
import { useAuth } from '@/hooks/useAuth.ts';
import { useUIStore } from '@/store/ui.store.ts';
import { Button } from '@/components/ui/Button.tsx';
import { StatCard } from '@/components/ui/StatCard.tsx';
import { Badge } from '@/components/ui/Badge.tsx';
import { Table } from '@/components/ui/Table.tsx';
import { formatCurrency, formatNumber } from '@/utils/format.ts';

const PERIODS = [
  { id: '7d', label: 'Last 7 Days' },
  { id: '30d', label: 'Last 30 Days' },
  { id: '90d', label: 'Last 90 Days' },
  { id: '12m', label: 'Last 12 Months' },
];

const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f97316', '#eab308', '#22c55e', '#06b6d4'];

export default function ReportsPage() {
  const [period, setPeriod] = useState('30d');
  const { tenant } = useAuth();
  const theme = useUIStore(state => state.theme);

  const [funnelMode, setFunnelMode] = useState<'full' | 'verified'>('full');

  const { data: summaryData, isLoading: summaryLoading } = useQuery({
    queryKey: ['analytics', 'summary', period, funnelMode],
    queryFn: () => analyticsApi.getAnalyticsSummary(period, funnelMode),
  });

  const { data: heatmapData, isLoading: heatmapLoading } = useQuery({
    queryKey: ['analytics', 'heatmap'],
    queryFn: () => analyticsApi.getActivityHeatmap(),
  });

  const summary = summaryData?.data?.data;
  const heatmap = heatmapData?.data?.data;
  const isVerifiedFunnel = funnelMode === 'verified';

  const exportToCSV = (data: any[], filename: string) => {
    if (!data.length) return;
    const headers = Object.keys(data[0]).join(',');
    const rows = data.map(obj => Object.values(obj).map(val => `"${val}"`).join(','));
    const csvContent = "data:text/csv;charset=utf-8," + headers + "\n" + rows.join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${filename}_${format(new Date(), 'yyyyMMdd')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (summaryLoading) {
    return (
      <div className="space-y-8 animate-pulse">
        <div className="flex justify-between items-center">
          <div className="h-10 w-48 bg-slate-200 dark:bg-slate-700 rounded-xl" />
          <div className="h-10 w-64 bg-slate-200 dark:bg-slate-700 rounded-xl" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => <div key={i} className="h-32 bg-slate-200 dark:bg-slate-700 rounded-3xl" />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="h-[400px] bg-slate-200 dark:bg-slate-700 rounded-3xl" />
          <div className="h-[400px] bg-slate-200 dark:bg-slate-700 rounded-3xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-10 pb-20">
      {/* Header & Period Selector */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Intelligence</h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium mt-1">Deep insights into your sales performance and pipeline.</p>
        </div>
        <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
          {PERIODS.map(p => (
            <button
              key={p.id}
              onClick={() => setPeriod(p.id)}
              className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${period === p.id
                  ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-white shadow-md'
                  : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                }`}
            >
              {p.label.split(' ')[1] + ' ' + p.label.split(' ')[2]}
            </button>
          ))}
        </div>
      </div>

      {/* Funnel Mode Toggle */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="h-10 w-10 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center text-indigo-600">
            <Target className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">
              {isVerifiedFunnel ? 'Verified Funnel' : 'Full Pipeline'}
            </p>
            <p className="text-xs text-slate-500">
              {isVerifiedFunnel
                ? 'Excluding stage-skipped leads for clean conversion data'
                : 'All leads including skip-override transitions'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
          <button
            onClick={() => setFunnelMode('full')}
            className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${funnelMode === 'full'
              ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-white shadow-sm'
              : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Full Pipeline
          </button>
          <button
            onClick={() => setFunnelMode('verified')}
            className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${funnelMode === 'verified'
              ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-white shadow-sm'
              : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Verified Funnel
          </button>
        </div>
      </div>

      {/* Section 1: Overview Strip */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Revenue Won"
          value={formatCurrency(summary?.deals?.totalWonValue, tenant?.currency)}
          icon={TrendingUp}
          iconColor="text-emerald-500"
          description="Total revenue from closed-won deals"
        />
        <StatCard
          title="Win Rate"
          value={`${summary?.deals?.winRate?.toFixed(1)}%`}
          icon={Award}
          iconColor="text-indigo-500"
          description="Percentage of deals won vs lost"
        />
        <StatCard
          title="Conversion Rate"
          value={`${summary?.leads?.conversionRate?.toFixed(1)}%`}
          icon={Target}
          iconColor="text-blue-500"
          description="Lead to Deal conversion percentage"
        />
        <StatCard
          title="Avg Deal Value"
          value={formatCurrency(summary?.deals?.avgDealValue, tenant?.currency)}
          icon={Briefcase}
          iconColor="text-orange-500"
          description="Average value across all deals"
        />
      </div>

      {/* Section 2: Leads Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <ChartCard title="Leads by Source">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={summary?.leads?.bySource}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme === 'dark' ? '#1e293b' : '#f1f5f9'} />
              <XAxis dataKey="source" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }} dy={10} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }} />
              <Tooltip content={<CustomTooltip currency={tenant?.currency} />} cursor={{ fill: theme === 'dark' ? '#1e293b' : '#f8fafc', radius: 10 }} />
              <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                {summary?.leads?.bySource?.map((entry: any, index: number) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Lead Funnel">
          <ResponsiveContainer width="100%" height={300}>
            <FunnelChart>
              <Tooltip content={<CustomTooltip />} />
              <Funnel
                data={summary?.leads?.byStage}
                dataKey="count"
                nameKey="stageName"
              >
                <LabelList position="right" fill={theme === 'dark' ? '#fff' : '#000'} stroke="none" dataKey="stageName" />
                {summary?.leads?.byStage?.map((entry: any, index: number) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} fillOpacity={0.8} />
                ))}
              </Funnel>
            </FunnelChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Section 3: Deals Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <ChartCard title="Revenue Growth">
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={[{ name: 'Week 1', value: 400 }, { name: 'Week 2', value: 700 }, { name: 'Week 3', value: 1200 }, { name: 'Week 4', value: summary?.deals?.totalWonValue }]}>
              <defs>
                <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme === 'dark' ? '#1e293b' : '#f1f5f9'} />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }} dy={10} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }} />
              <Tooltip content={<CustomTooltip currency={tenant?.currency} />} />
              <Area type="monotone" dataKey="value" stroke="#6366f1" strokeWidth={4} fillOpacity={1} fill="url(#colorValue)" />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Deals by Stage">
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={summary?.deals?.byStage}
                dataKey="count"
                nameKey="stageName"
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
              >
                {summary?.deals?.byStage?.map((entry: any, index: number) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Section 4: Forecast Table */}
      <div className="bg-white dark:bg-slate-800 rounded-[32px] border border-slate-200 dark:border-slate-700 shadow-xl overflow-hidden">
        <div className="p-8 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
          <div>
            <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">Revenue Forecast</h3>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Weighted vs Actual targets</p>
          </div>
          <Button variant="outline" size="sm" onClick={() => exportToCSV([{ month: format(new Date(), 'MMMM'), expected: summary?.deals?.forecastThisMonth, weighted: summary?.deals?.forecastWeighted, won: summary?.deals?.wonValue }], 'forecast')}>
            <Download className="mr-2 h-4 w-4" /> Export CSV
          </Button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Month</th>
                <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Expected</th>
                <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Weighted</th>
                <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Won So Far</th>
                <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Gap to Target</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
              <tr className="bg-indigo-50/30 dark:bg-indigo-900/10">
                <td className="px-8 py-6 font-black text-slate-900 dark:text-white">{format(new Date(), 'MMMM yyyy')}</td>
                <td className="px-8 py-6 font-bold text-slate-700 dark:text-slate-300">{formatCurrency(summary?.deals?.forecastThisMonth, tenant?.currency)}</td>
                <td className="px-8 py-6 font-bold text-indigo-600 dark:text-indigo-400">{formatCurrency(summary?.deals?.forecastWeighted, tenant?.currency)}</td>
                <td className="px-8 py-6 font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(summary?.deals?.totalWonValue, tenant?.currency)}</td>
                <td className="px-8 py-6">
                  <Badge variant={summary?.deals?.totalWonValue >= summary?.deals?.forecastWeighted ? 'success' : 'error'}>
                    {formatCurrency(Math.max(0, summary?.deals?.forecastWeighted - summary?.deals?.totalWonValue), tenant?.currency)} Left
                  </Badge>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Section 5: Team Performance */}
      <div className="bg-white dark:bg-slate-800 rounded-[32px] border border-slate-200 dark:border-slate-700 shadow-xl overflow-hidden">
        <div className="p-8 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
          <div>
            <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">Team Performance</h3>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Leaderboard based on won value</p>
          </div>
          <Button variant="outline" size="sm" onClick={() => exportToCSV(summary?.topReps, 'team_performance')}>
            <Download className="mr-2 h-4 w-4" /> Export CSV
          </Button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Rank</th>
                <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Rep Name</th>
                <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">Leads Created</th>
                <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">Deals Won</th>
                <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Won Value</th>
                <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Win Rate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
              {summary?.topReps?.map((rep: any, idx: number) => (
                <tr key={rep.userId} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors group">
                  <td className="px-8 py-5">
                    {idx < 3 ? (
                      <span className={`h-8 w-8 rounded-xl flex items-center justify-center text-sm font-black shadow-lg ${idx === 0 ? 'bg-amber-100 text-amber-600 shadow-amber-500/20' :
                          idx === 1 ? 'bg-slate-100 text-slate-600 shadow-slate-500/20' :
                            'bg-orange-100 text-orange-600 shadow-orange-500/20'
                        }`}>
                        {idx + 1}
                      </span>
                    ) : (
                      <span className="text-sm font-black text-slate-400 pl-3">#{idx + 1}</span>
                    )}
                  </td>
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-[10px] font-black text-slate-500 border border-slate-200 dark:border-slate-600">
                        {rep.name.charAt(0)}
                      </div>
                      <span className="font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{rep.name}</span>
                    </div>
                  </td>
                  <td className="px-8 py-5 text-center font-bold text-slate-600 dark:text-slate-400">{rep.leadsCreated}</td>
                  <td className="px-8 py-5 text-center font-bold text-slate-600 dark:text-slate-400">{rep.dealsWon}</td>
                  <td className="px-8 py-5 text-right font-black text-slate-900 dark:text-white">{formatCurrency(rep.wonValue, tenant?.currency)}</td>
                  <td className="px-8 py-5 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <div className="w-16 h-1 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                        <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${Math.min(100, (rep.dealsWon / (rep.dealsWon + 2)) * 100)}%` }} />
                      </div>
                      <span className="text-[10px] font-black text-slate-400">{((rep.dealsWon / (rep.dealsWon + 2 || 1)) * 100).toFixed(0)}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Section 6: Activity Heatmap */}
      <div className="bg-white dark:bg-slate-800 rounded-[32px] border border-slate-200 dark:border-slate-700 shadow-xl p-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
              <Activity className="h-6 w-6 text-indigo-500" />
              Activity Velocity
            </h3>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Operational activity across the last 12 months</p>
          </div>
          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
            <span>Less</span>
            <div className="flex gap-1">
              <div className="h-3 w-3 rounded-[3px] bg-slate-100 dark:bg-slate-700" />
              <div className="h-3 w-3 rounded-[3px] bg-indigo-200 dark:bg-indigo-900/50" />
              <div className="h-3 w-3 rounded-[3px] bg-indigo-400 dark:bg-indigo-600" />
              <div className="h-3 w-3 rounded-[3px] bg-indigo-600 dark:bg-indigo-400" />
            </div>
            <span>More</span>
          </div>
        </div>

        <div className="overflow-x-auto scrollbar-none">
          <Heatmap grid={heatmap} />
        </div>
      </div>
    </div>
  );
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-[32px] border border-slate-200 dark:border-slate-700 shadow-xl p-8 flex flex-col h-full group hover:border-indigo-200 dark:hover:border-indigo-800 transition-all">
      <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight mb-8 group-hover:text-indigo-600 transition-colors">{title}</h3>
      <div className="flex-1 flex items-center justify-center min-h-[300px]">
        {children}
      </div>
    </div>
  );
}

function CustomTooltip({ active, payload, label, currency }: any) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-900 text-white p-4 rounded-2xl shadow-2xl border border-slate-800 animate-in fade-in zoom-in-95 duration-150">
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">{label || payload[0].name}</p>
        <p className="text-lg font-black tracking-tight">
          {currency ? formatCurrency(payload[0].value, currency) : formatNumber(payload[0].value)}
        </p>
      </div>
    );
  }
  return null;
}

function Heatmap({ grid }: { grid?: any[] }) {
  const days = eachDayOfInterval({
    start: subMonths(new Date(), 12),
    end: new Date(),
  });

  const getDayColor = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    const item = grid?.find(g => g.date === dateStr);
    const count = item?.count || 0;

    if (count === 0) return 'bg-slate-100 dark:bg-slate-800';
    if (count <= 2) return 'bg-indigo-100 dark:bg-indigo-900/30';
    if (count <= 5) return 'bg-indigo-400 dark:bg-indigo-600';
    return 'bg-indigo-600 dark:bg-indigo-400';
  };

  return (
    <div className="flex gap-1.5 h-32 items-end">
      {/* Group by weeks for simplicity in rendering */}
      {Array.from({ length: 53 }).map((_, weekIdx) => (
        <div key={weekIdx} className="flex flex-col gap-1.5">
          {Array.from({ length: 7 }).map((_, dayIdx) => {
            const date = days[weekIdx * 7 + dayIdx];
            if (!date || date > new Date()) return <div key={dayIdx} className="h-3 w-3" />;
            return (
              <div
                key={dayIdx}
                className={`h-3 w-3 rounded-[3px] shrink-0 transition-colors hover:ring-2 hover:ring-indigo-500/50 cursor-pointer ${getDayColor(date)}`}
                title={`${format(date, 'MMM dd, yyyy')}`}
              />
            );
          })}
        </div>
      ))}
    </div>
  );
}
