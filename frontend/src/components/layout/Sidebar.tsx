import { useLocation, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { 
  LayoutDashboard, Users, Briefcase, Building2, CheckSquare, 
  MessageSquare, Package, FileText, Settings, LogOut, ChevronLeft, ChevronRight,
  Search, TrendingUp
} from 'lucide-react';
import { useAuthStore } from '@/store/auth.store.ts';
import { useUIStore } from '@/store/ui.store.ts';
import * as leadsApi from '@/api/leads.api.ts';
import * as dealsApi from '@/api/deals.api.ts';
import * as tasksApi from '@/api/tasks.api.ts';

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
  { id: 'leads', label: 'Leads', icon: Users, path: '/leads', countKey: 'leads' },
  { id: 'deals', label: 'Deals', icon: Briefcase, path: '/deals', countKey: 'deals' },
  { id: 'contacts', label: 'Contacts', icon: Users, path: '/contacts' },
  { id: 'companies', label: 'Companies', icon: Building2, path: '/companies' },
  { id: 'tasks', label: 'Tasks', icon: CheckSquare, path: '/tasks', countKey: 'overdueTasks' },
  { id: 'communications', label: 'Communications', icon: MessageSquare, path: '/communications' },
  { id: 'products', label: 'Products', icon: Package, path: '/products' },
  { id: 'proposals', label: 'Proposals', icon: FileText, path: '/proposals' },
  { id: 'reports', label: 'Intelligence', icon: TrendingUp, path: '/reports' },
];

export function Sidebar() {
  const location = useLocation();
  const { user, tenant, clearAuth } = useAuthStore();
  const { sidebarCollapsed, toggleSidebar, setCommandPaletteOpen } = useUIStore();

  // Fetch counts
  const { data: leadsData } = useQuery({ queryKey: ['leads-count'], queryFn: () => leadsApi.getLeads({ limit: 1 }) });
  const { data: dealsData } = useQuery({ queryKey: ['deals-count'], queryFn: () => dealsApi.getDeals({ limit: 1 }) });
  const { data: overdueTasksData } = useQuery({ queryKey: ['tasks-overdue-count'], queryFn: () => tasksApi.getTasks({ status: 'todo', limit: 1 }) }); // Simplified overdue check

  const counts: Record<string, number> = {
    leads: leadsData?.data?.meta?.total || 0,
    deals: dealsData?.data?.meta?.total || 0,
    overdueTasks: overdueTasksData?.data?.meta?.total || 0,
  };

  const getIsActive = (path: string) => location.pathname === path;

  return (
    <aside 
      className={`bg-[var(--color-sidebar-bg)] border-r border-slate-800 flex flex-col h-screen transition-all duration-200 z-30 sticky top-0 ${
        sidebarCollapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Header / Logo */}
      <div className="h-16 flex items-center px-6 border-b border-slate-800/50 shrink-0 overflow-hidden">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-indigo-600 flex items-center justify-center shrink-0 shadow-lg shadow-indigo-500/20">
            <span className="text-white font-black text-sm">{tenant?.name?.charAt(0) || 'C'}</span>
          </div>
          {!sidebarCollapsed && (
            <div className="truncate">
              <p className="text-white font-bold text-sm truncate leading-tight">{tenant?.name || 'CRM'}</p>
              <p className="text-[10px] text-slate-500 font-bold tracking-widest uppercase">{tenant?.slug || 'SaaS'}</p>
            </div>
          )}
        </div>
      </div>

      {/* Nav Items */}
      <nav className="flex-1 overflow-y-auto px-3 py-6 space-y-1 custom-scrollbar">
        {/* Quick Search Shortcut */}
        <button 
          onClick={() => setCommandPaletteOpen(true)}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-400 hover:bg-slate-800/50 hover:text-white transition-all group mb-4 border border-slate-800/50`}
        >
          <Search className="h-5 w-5 shrink-0" />
          {!sidebarCollapsed && (
            <div className="flex-1 flex items-center justify-between">
              <span className="text-xs font-bold">Quick search...</span>
              <kbd className="text-[10px] bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700 text-slate-500 group-hover:text-slate-300">⌘K</kbd>
            </div>
          )}
        </button>

        {NAV_ITEMS.map((item) => {
          const isActive = getIsActive(item.path);
          const Icon = item.icon;
          const count = item.countKey ? counts[item.countKey] : null;

          return (
            <Link
              key={item.id}
              to={item.path}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold transition-all relative group ${
                isActive 
                  ? 'bg-indigo-600/10 text-indigo-400 shadow-sm' 
                  : 'text-slate-400 hover:bg-slate-800/50 hover:text-white'
              }`}
            >
              <Icon className={`h-5 w-5 shrink-0 ${isActive ? 'text-indigo-400' : ''}`} />
              {!sidebarCollapsed && (
                <div className="flex-1 flex items-center justify-between">
                  <span>{item.label}</span>
                  {count !== null && count > 0 && (
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-black leading-none ${
                      item.countKey === 'overdueTasks' 
                        ? 'bg-red-500/20 text-red-400' 
                        : 'bg-indigo-500/20 text-indigo-400'
                    }`}>
                      {count}
                    </span>
                  )}
                </div>
              )}
              {sidebarCollapsed && count !== null && count > 0 && (
                <div className={`absolute top-2 right-2 h-2 w-2 rounded-full border border-slate-900 ${
                  item.countKey === 'overdueTasks' ? 'bg-red-500' : 'bg-indigo-500'
                }`} />
              )}
              {sidebarCollapsed && (
                <div className="absolute left-full ml-4 px-3 py-1.5 bg-slate-900 text-white text-xs font-bold rounded-lg opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-xl z-50 border border-slate-800">
                  {item.label}
                </div>
              )}
            </Link>
          );
        })}

        <div className="h-px bg-slate-800/50 my-6 mx-3" />

        <Link
          to="/settings"
          className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold transition-all group ${
            getIsActive('/settings') 
              ? 'bg-indigo-600/10 text-indigo-400 shadow-sm' 
              : 'text-slate-400 hover:bg-slate-800/50 hover:text-white'
          }`}
        >
          <Settings className={`h-5 w-5 shrink-0 ${getIsActive('/settings') ? 'text-indigo-400' : ''}`} />
          {!sidebarCollapsed && <span>Settings</span>}
          {sidebarCollapsed && (
            <div className="absolute left-full ml-4 px-3 py-1.5 bg-slate-900 text-white text-xs font-bold rounded-lg opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-xl z-50 border border-slate-800">
              Settings
            </div>
          )}
        </Link>
      </nav>

      {/* Footer / User */}
      <div className="p-4 border-t border-slate-800/50 shrink-0">
        <div className="flex items-center gap-3 px-2 py-2">
          <div className="h-9 w-9 rounded-full bg-slate-800 border-2 border-slate-700 flex items-center justify-center shrink-0">
            <span className="text-white font-black text-xs">{user?.firstName?.charAt(0)}</span>
          </div>
          {!sidebarCollapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-white font-bold text-sm truncate leading-tight">{user?.firstName} {user?.lastName}</p>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest truncate">{user?.role}</p>
            </div>
          )}
          {!sidebarCollapsed && (
            <button 
              onClick={clearAuth}
              className="p-2 text-slate-500 hover:text-red-400 transition-colors"
              title="Logout"
            >
              <LogOut className="h-4 w-4" />
            </button>
          )}
        </div>
        
        {/* Toggle Collapse */}
        <button 
          onClick={toggleSidebar}
          className="absolute -right-3 top-20 h-6 w-6 bg-slate-900 border border-slate-700 rounded-full flex items-center justify-center text-slate-400 hover:text-white shadow-xl z-50"
        >
          {sidebarCollapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronLeft className="h-3 w-3" />}
        </button>
      </div>
    </aside>
  );
}
