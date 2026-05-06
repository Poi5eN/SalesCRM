
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, Users, Building2, Target, Briefcase,
  CheckSquare, MessageSquare, Package, FileText, Settings,
  ChevronLeft, Menu
} from 'lucide-react';
import { useUIStore } from '@/store/ui.store.ts';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard', id: 'dashboard' },
  { icon: Target, label: 'Leads', path: '/leads', id: 'leads' },
  { icon: Briefcase, label: 'Deals', path: '/deals', id: 'deals' },
  { icon: Users, label: 'Contacts', path: '/contacts', id: 'contacts' },
  { icon: Building2, label: 'Companies', path: '/companies', id: 'companies' },
  { icon: CheckSquare, label: 'Tasks', path: '/tasks', id: 'tasks' },
  { icon: MessageSquare, label: 'Communications', path: '/communications', id: 'communications' },
  { icon: Package, label: 'Products', path: '/products', id: 'products' },
  { icon: FileText, label: 'Proposals', path: '/proposals', id: 'proposals' },
  { icon: Settings, label: 'Settings', path: '/settings', id: 'settings' },
];

export const Sidebar = () => {
  const { sidebarOpen, toggleSidebar } = useUIStore();

  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-50 flex flex-col bg-slate-900 text-slate-300 transition-all duration-300 ease-in-out",
        sidebarOpen ? "w-64" : "w-20"
      )}
    >
      <div className="flex h-16 items-center justify-between px-6 border-b border-slate-800">
        <div className={cn("flex items-center space-x-3 transition-opacity", !sidebarOpen && "opacity-0 invisible")}>
          <div className="h-8 w-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold">
            G
          </div>
          <span className="text-xl font-bold text-white tracking-tight">PSG</span>
        </div>
        <button
          onClick={toggleSidebar}
          className="p-1 rounded-md hover:bg-slate-800 transition-colors"
        >
          {sidebarOpen ? <ChevronLeft className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.id}
            to={item.path}
            className={({ isActive }) => cn(
              "group flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200",
              isActive
                ? "bg-indigo-600/10 text-indigo-400"
                : "text-slate-400 hover:bg-slate-800 hover:text-white"
            )}
          >
            <item.icon className={cn(
              "h-5 w-5 flex-shrink-0 transition-colors",
              sidebarOpen ? "mr-3" : "mx-auto"
            )} />
            {sidebarOpen && <span className="truncate">{item.label}</span>}
            {!sidebarOpen && (
              <div className="absolute left-full ml-6 rounded-md px-2 py-1 bg-slate-800 text-xs text-white opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-50">
                {item.label}
              </div>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-slate-800">
        <div className={cn("flex items-center transition-all", !sidebarOpen && "justify-center")}>
          <div className="h-9 w-9 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400 font-bold border border-indigo-500/30">
            JD
          </div>
          {sidebarOpen && (
            <div className="ml-3 truncate">
              <p className="text-sm font-medium text-white">John Doe</p>
              <p className="text-xs text-slate-500">Administrator</p>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};
