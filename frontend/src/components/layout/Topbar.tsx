import { Search, Bell, Moon, Sun, ChevronDown, User, LogOut, Settings as SettingsIcon, Menu } from 'lucide-react';
import { useAuthStore } from '@/store/auth.store.ts';
import { useUIStore } from '@/store/ui.store.ts';
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import * as notificationsApi from '@/api/notifications.api.ts';

export function Topbar() {
  const { user, tenant, clearAuth } = useAuthStore();
  const { theme, setTheme, setCommandPaletteOpen, toggleMobileSidebar } = useUIStore();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const fetchCount = async () => {
      try {
        const res = await notificationsApi.getUnreadCount();
        setUnreadCount(res?.data?.count || 0);
      } catch { /* ignore */ }
    };
    fetchCount();
    const interval = setInterval(fetchCount, 30000);
    return () => clearInterval(interval);
  }, []);

  const toggleTheme = () => setTheme(theme === 'light' ? 'dark' : 'light');

  return (
    <header className="h-16 bg-[var(--card-bg)] border-b border-[var(--border)] flex items-center justify-between px-6 sticky top-0 z-20 backdrop-blur-md bg-opacity-80 dark:bg-opacity-80">
      <div className="flex-1 flex items-center gap-6">
        {/* Mobile Hamburger Toggle */}
        <button 
          onClick={toggleMobileSidebar}
          className="lg:hidden p-2 -ml-2 rounded-xl text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--sidebar-item-active-bg)]/50 transition-all"
          title="Toggle Menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* Search Bar / Trigger */}
        <button 
          onClick={() => setCommandPaletteOpen(true)}
          className="flex items-center gap-3 px-3 py-1.5 bg-[var(--content-bg)] rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] w-full max-w-md transition-all group border border-[var(--border)]"
        >
          <Search className="h-4 w-4 text-[var(--text-secondary)]" />
          <span className="text-sm font-medium">Search for anything...</span>
          <div className="ml-auto flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 rounded border border-[var(--border)] bg-[var(--card-bg)] text-[20px] font-bold text-[var(--text-muted)] group-hover:text-[var(--text-secondary)]">⌘</kbd>
            <kbd className="px-1.5 py-0.5 rounded border border-[var(--border)] bg-[var(--card-bg)] text-[20px] font-bold text-[var(--text-muted)] group-hover:text-[var(--text-secondary)]">K</kbd>
          </div>
        </button>
      </div>

      <div className="flex items-center gap-3">
        {/* Org/Plan Badge */}
        <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-indigo-50 dark:bg-indigo-950/20 rounded-full border border-indigo-100 dark:border-indigo-850 mr-2">
          <span className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest leading-none">{tenant?.name}</span>
          <span className="h-3 w-px bg-indigo-200 dark:bg-indigo-800" />
          <span className="text-[10px] font-black text-indigo-500 dark:text-indigo-300 uppercase tracking-widest leading-none">{tenant?.plan || 'Free'}</span>
        </div>

        {/* Theme Toggle */}
        <button 
          onClick={toggleTheme}
          className="p-2.5 text-[var(--text-secondary)] hover:bg-[var(--sidebar-item-active-bg)] rounded-xl transition-all"
          title="Toggle Theme"
        >
          {theme === 'light' ? <Moon className="h-5 w-5 text-[var(--text-secondary)]" /> : <Sun className="h-5 w-5 text-[var(--text-secondary)]" />}
        </button>

        {/* Notifications */}
        <Link 
          to="/settings?tab=notifications"
          className="p-2.5 text-[var(--text-secondary)] hover:bg-[var(--sidebar-item-active-bg)] rounded-xl transition-all relative"
          title="Notifications"
        >
          <Bell className="h-5 w-5 text-[var(--text-secondary)]" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 h-5 w-5 bg-red-500 rounded-full border-2 border-[var(--card-bg)] flex items-center justify-center text-white text-[9px] font-black">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </Link>

        <div className="h-6 w-px bg-[var(--border)] mx-1" />

        {/* User Dropdown */}
        <div className="relative">
          <button 
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2.5 p-1 hover:bg-[var(--sidebar-item-active-bg)] rounded-xl transition-all group"
          >
            <div className="h-8 w-8 rounded-full bg-[var(--text-primary)] flex items-center justify-center text-[var(--card-bg)] font-black text-xs shadow-sm group-hover:scale-105 transition-transform">
              {user?.firstName?.charAt(0)}
            </div>
            <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          {dropdownOpen && (
            <>
              <div 
                className="fixed inset-0 z-30" 
                onClick={() => setDropdownOpen(false)} 
              />
              <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 py-2 z-40 animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-700 mb-1">
                  <p className="text-sm font-black text-slate-900 dark:text-white truncate">{user?.firstName} {user?.lastName}</p>
                  <p className="text-xs text-slate-500 truncate mt-0.5">{user?.email}</p>
                </div>
                <Link to="/settings?tab=organization" className="flex items-center gap-3 px-4 py-2.5 text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors">
                  <User className="h-4 w-4 text-slate-400" /> My Profile
                </Link>
                <Link to="/settings" className="flex items-center gap-3 px-4 py-2.5 text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors">
                  <SettingsIcon className="h-4 w-4 text-slate-400" /> Settings
                </Link>
                <div className="h-px bg-slate-100 dark:bg-slate-700 my-1" />
                <button 
                  onClick={clearAuth}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-bold text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                >
                  <LogOut className="h-4 w-4" /> Sign Out
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
