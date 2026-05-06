
import { Bell, Search, LogOut, ChevronDown } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth.ts';

export const Topbar = () => {
  const { tenant, user, logout } = useAuth();

  return (
    <header className="h-16 border-b border-slate-200 bg-white px-8 flex items-center justify-between sticky top-0 z-40">
      <div className="flex items-center space-x-4 flex-1">
        <div className="relative w-96 max-w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search leads, deals, contacts..." 
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
          />
        </div>
      </div>

      <div className="flex items-center space-x-6">
        <div className="hidden md:flex flex-col items-end border-r border-slate-200 pr-6">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Current Organization</span>
          <span className="text-sm font-bold text-slate-900">{tenant?.name || 'My Business'}</span>
        </div>

        <button className="relative p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-full transition-colors">
          <Bell className="h-5 w-5" />
          <span className="absolute top-1.5 right-1.5 h-2 w-2 bg-indigo-600 rounded-full border-2 border-white"></span>
        </button>

        <div className="flex items-center space-x-3 cursor-pointer group">
          <div className="h-9 w-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold border border-slate-200 overflow-hidden">
            {user?.avatarUrl ? (
              <img src={user.avatarUrl} alt="Avatar" className="h-full w-full object-cover" />
            ) : (
              <span>{user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}</span>
            )}
          </div>
          <div className="hidden md:block">
            <p className="text-sm font-semibold text-slate-900 leading-tight">{user?.firstName} {user?.lastName}</p>
            <p className="text-xs text-slate-500">{user?.role?.name || 'Admin'}</p>
          </div>
          <ChevronDown className="h-4 w-4 text-slate-400 group-hover:text-slate-600 transition-colors" />
        </div>

        <button 
          onClick={logout}
          className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-all"
          title="Logout"
        >
          <LogOut className="h-5 w-5" />
        </button>
      </div>
    </header>
  );
};
