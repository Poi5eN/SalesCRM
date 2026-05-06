import { Search, Bell, Moon, Sun, ChevronDown, User, LogOut, Settings as SettingsIcon } from 'lucide-react';
import { useAuthStore } from '@/store/auth.store.ts';
import { useUIStore } from '@/store/ui.store.ts';
import { useState } from 'react';
import { Link } from 'react-router-dom';

export function Topbar() {
  const { user, tenant, clearAuth } = useAuthStore();
  const { theme, setTheme, setCommandPaletteOpen } = useUIStore();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const toggleTheme = () => setTheme(theme === 'light' ? 'dark' : 'light');

  return (
    <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-6 sticky top-0 z-20 backdrop-blur-md bg-opacity-80 dark:bg-opacity-80">
      <div className="flex-1 flex items-center gap-6">
        {/* Search Bar / Trigger */}
        <button 
          onClick={() => setCommandPaletteOpen(true)}
          className="flex items-center gap-3 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 w-full max-w-md transition-all group border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
        >
          <Search className="h-4 w-4" />
          <span className="text-sm font-medium">Search for anything...</span>
          <div className="ml-auto flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-[10px] font-bold text-slate-400 group-hover:text-slate-500">⌘</kbd>
            <kbd className="px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-[10px] font-bold text-slate-400 group-hover:text-slate-500">K</kbd>
          </div>
        </button>
      </div>

      <div className="flex items-center gap-3">
        {/* Org/Plan Badge */}
        <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-indigo-50 dark:bg-indigo-900/20 rounded-full border border-indigo-100 dark:border-indigo-800 mr-2">
          <span className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest leading-none">{tenant?.name}</span>
          <span className="h-3 w-px bg-indigo-200 dark:bg-indigo-800" />
          <span className="text-[10px] font-black text-indigo-500 dark:text-indigo-300 uppercase tracking-widest leading-none">{tenant?.plan || 'Free'}</span>
        </div>

        {/* Theme Toggle */}
        <button 
          onClick={toggleTheme}
          className="p-2.5 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all"
          title="Toggle Theme"
        >
          {theme === 'light' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
        </button>

        {/* Notifications */}
        <button 
          className="p-2.5 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all relative"
          title="Notifications"
        >
          <Bell className="h-5 w-5" />
          <span className="absolute top-2 right-2.5 h-2 w-2 bg-red-500 rounded-full border-2 border-white dark:border-slate-900" />
        </button>

        <div className="h-6 w-px bg-slate-200 dark:bg-slate-800 mx-1" />

        {/* User Dropdown */}
        <div className="relative">
          <button 
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2.5 p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all group"
          >
            <div className="h-8 w-8 rounded-full bg-indigo-600 flex items-center justify-center text-white font-black text-xs shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition-transform">
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
                <Link to="/settings" className="flex items-center gap-3 px-4 py-2.5 text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors">
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
