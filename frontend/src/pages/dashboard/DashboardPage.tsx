
import { 
  Users, Target, Briefcase, TrendingUp, 
  ArrowUpRight, ArrowDownRight, Clock 
} from 'lucide-react';

const stats = [
  { label: 'Total Leads', value: '1,284', change: '+12.5%', trending: 'up', icon: Target, color: 'text-blue-600', bg: 'bg-blue-50' },
  { label: 'Open Deals', value: '45', change: '+5.2%', trending: 'up', icon: Briefcase, color: 'text-indigo-600', bg: 'bg-indigo-50' },
  { label: 'Conversion Rate', value: '18.4%', change: '-2.1%', trending: 'down', icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50' },
  { label: 'Total Contacts', value: '3,842', change: '+8.1%', trending: 'up', icon: Users, color: 'text-orange-600', bg: 'bg-orange-50' },
];

const DashboardPage = () => {
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
              <h3 className="text-2xl font-bold text-slate-900">{stat.value}</h3>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm p-6 min-h-[400px]">
          <h3 className="text-lg font-bold text-slate-900 mb-6">Recent Deal Velocity</h3>
          <div className="flex items-center justify-center h-64 text-slate-400 italic">
            Chart Placeholder
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <h3 className="text-lg font-bold text-slate-900 mb-6">Upcoming Tasks</h3>
          <div className="space-y-6">
            {[1,2,3].map(i => (
              <div key={i} className="flex items-start space-x-4">
                <div className="mt-1 h-8 w-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400">
                  <Clock className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900">Follow up with Sarah Miller</p>
                  <p className="text-xs text-slate-500">Today at 2:00 PM • Lead: Cloud Solutions</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
