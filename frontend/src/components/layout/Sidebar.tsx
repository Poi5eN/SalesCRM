import { useLocation, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { 
  LayoutDashboard, Users, Briefcase, Building2, CheckSquare, 
  MessageSquare, Package, FileText, Settings, LogOut, ChevronLeft, ChevronRight,
  Search, TrendingUp, Megaphone
} from 'lucide-react';
import { useAuthStore } from '@/store/auth.store.ts';
import { useUIStore } from '@/store/ui.store.ts';
import * as leadsApi from '@/api/leads.api.ts';
import { queryKeys } from '@/lib/queryKeys.ts';

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
  { id: 'campaigns', label: 'Campaigns', icon: Megaphone, path: '/campaigns' },
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
  const { sidebarCollapsed, toggleSidebar, setCommandPaletteOpen, badgeCounts, mobileSidebarOpen, setMobileSidebarOpen } = useUIStore();

  const getIsActive = (path: string) => location.pathname === path;

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileSidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-xs lg:hidden"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      <aside 
        className={`bg-[var(--sidebar-bg)] border-r border-[var(--border)] flex-col h-screen transition-all duration-200 z-50 sticky top-0 shrink-0 ${
          mobileSidebarOpen 
            ? 'flex fixed inset-y-0 left-0 w-64 shadow-2xl' 
            : 'hidden lg:flex'
        } ${
          sidebarCollapsed ? 'lg:w-20' : 'lg:w-64'
        }`}
      >
        {/* Header / Logo */}
        <div className="h-16 flex items-center px-6 border-b border-[var(--border)] shrink-0 overflow-hidden">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-[var(--text-primary)] flex items-center justify-center shrink-0 shadow-sm">
              <span className="text-[var(--card-bg)] font-black text-sm">{tenant?.name?.charAt(0) || 'C'}</span>
            </div>
            {(!sidebarCollapsed || mobileSidebarOpen) && (
              <div className="truncate">
                <p className="text-[var(--text-primary)] font-bold text-sm truncate leading-tight">{tenant?.name || 'CRM'}</p>
                <p className="text-[10px] text-[var(--text-muted)] font-bold tracking-widest uppercase">{tenant?.slug || 'SaaS'}</p>
              </div>
            )}
          </div>
        </div>

        {/* Nav Items */}
        <nav className="flex-1 overflow-y-auto px-3 py-6 space-y-1 custom-scrollbar">
          {/* Quick Search Shortcut */}
          <button 
            onClick={() => { setCommandPaletteOpen(true); setMobileSidebarOpen(false); }}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[var(--text-secondary)] hover:bg-[var(--sidebar-item-active-bg)]/50 hover:text-[var(--text-primary)] transition-all group mb-4 border border-[var(--border)] bg-[var(--card-bg)]`}
          >
            <Search className="h-5 w-5 shrink-0 text-[var(--text-secondary)]" />
            {(!sidebarCollapsed || mobileSidebarOpen) && (
              <div className="flex-1 flex items-center justify-between">
                <span className="text-xs font-bold">Quick search...</span>
                <kbd className="text-[10px] bg-[var(--content-bg)] px-1.5 py-0.5 rounded border border-[var(--border)] text-[var(--text-muted)] group-hover:text-[var(--text-secondary)]">⌘K</kbd>
              </div>
            )}
          </button>

          {NAV_ITEMS.map((item) => {
            const isActive = getIsActive(item.path);
            const Icon = item.icon;
            const count = item.countKey ? (badgeCounts as any)[item.countKey] : null;

            return (
              <Link
                key={item.id}
                to={item.path}
                onClick={() => setMobileSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold transition-all relative group ${
                  isActive 
                    ? 'bg-[var(--sidebar-item-active-bg)] text-[var(--sidebar-text-active)] shadow-sm border border-[var(--border)]' 
                    : 'text-[var(--sidebar-text)] hover:bg-[var(--sidebar-item-active-bg)]/50 hover:text-[var(--sidebar-text-active)] border border-transparent'
                }`}
              >
                <Icon className={`h-5 w-5 shrink-0 ${isActive ? 'text-[var(--sidebar-text-active)]' : 'text-[var(--sidebar-text)]'}`} />
                {(!sidebarCollapsed || mobileSidebarOpen) && (
                  <div className="flex-1 flex items-center justify-between">
                    <span>{item.label}</span>
                    {count !== null && count > 0 && (
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-black leading-none ${
                        item.countKey === 'overdueTasks' 
                          ? 'bg-red-500/20 text-red-600 dark:text-red-400' 
                          : 'bg-indigo-500/20 text-indigo-600 dark:text-indigo-400'
                      }`}>
                        {count}
                      </span>
                    )}
                  </div>
                )}
                {sidebarCollapsed && !mobileSidebarOpen && count !== null && count > 0 && (
                  <div className={`absolute top-2 right-2 h-2 w-2 rounded-full border border-[var(--sidebar-bg)] ${
                    item.countKey === 'overdueTasks' ? 'bg-red-500' : 'bg-indigo-500'
                  }`} />
                )}
                {sidebarCollapsed && !mobileSidebarOpen && (
                  <div className="absolute left-full ml-4 px-3 py-1.5 bg-[var(--card-bg)] text-[var(--text-primary)] text-xs font-bold rounded-lg opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-xl z-50 border border-[var(--border)]">
                    {item.label}
                  </div>
                )}
              </Link>
            );
          })}

          <div className="h-px bg-[var(--border)] my-6 mx-3" />

          <Link
            to="/settings"
            onClick={() => setMobileSidebarOpen(false)}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold transition-all group ${
              getIsActive('/settings') 
                ? 'bg-[var(--sidebar-item-active-bg)] text-[var(--sidebar-text-active)] shadow-sm border border-[var(--border)]' 
                : 'text-[var(--sidebar-text)] hover:bg-[var(--sidebar-item-active-bg)]/50 hover:text-[var(--sidebar-text-active)] border border-transparent'
            }`}
          >
            <Settings className={`h-5 w-5 shrink-0 ${getIsActive('/settings') ? 'text-[var(--sidebar-text-active)]' : 'text-[var(--sidebar-text)]'}`} />
            {(!sidebarCollapsed || mobileSidebarOpen) && <span>Settings</span>}
            {sidebarCollapsed && !mobileSidebarOpen && (
              <div className="absolute left-full ml-4 px-3 py-1.5 bg-[var(--card-bg)] text-[var(--text-primary)] text-xs font-bold rounded-lg opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-xl z-50 border border-[var(--border)]">
                Settings
              </div>
            )}
          </Link>
        </nav>

        {/* Footer / User */}
        <div className="p-4 border-t border-[var(--border)] shrink-0">
          <div className="flex items-center gap-3 px-2 py-2">
            <div className="h-9 w-9 rounded-full bg-[var(--sidebar-item-active-bg)] border border-[var(--border)] flex items-center justify-center shrink-0">
              <span className="text-[var(--text-primary)] font-black text-xs">{user?.firstName?.charAt(0)}</span>
            </div>
            {(!sidebarCollapsed || mobileSidebarOpen) && (
              <div className="flex-1 min-w-0">
                <p className="text-[var(--text-primary)] font-bold text-sm truncate leading-tight">{user?.firstName} {user?.lastName}</p>
                <p className="text-[10px] text-[var(--text-muted)] font-bold uppercase tracking-widest truncate">{user?.role}</p>
              </div>
            )}
            {(!sidebarCollapsed || mobileSidebarOpen) && (
              <button 
                onClick={clearAuth}
                className="p-2 text-[var(--text-muted)] hover:text-red-500 transition-colors"
                title="Logout"
              >
                <LogOut className="h-4 w-4" />
              </button>
            )}
          </div>
          
          {/* Toggle Collapse */}
          <button 
            onClick={toggleSidebar}
            className="absolute -right-3 top-20 h-6 w-6 bg-[var(--card-bg)] border border-[var(--border)] rounded-full flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] shadow-sm z-50 hidden lg:flex"
          >
            {sidebarCollapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronLeft className="h-3 w-3" />}
          </button>
        </div>
      </aside>
    </>
  );
}
