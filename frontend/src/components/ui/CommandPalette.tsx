import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, Users, Briefcase, CheckSquare, MessageSquare, 
  Plus, History, ArrowRight, X, Command
} from 'lucide-react';
import { useUIStore } from '@/store/ui.store.ts';

const QUICK_ACTIONS = [
  { id: 'new-lead', label: 'New Lead', icon: Plus, action: 'lead' },
  { id: 'new-deal', label: 'New Deal', icon: Plus, action: 'deal' },
  { id: 'new-task', label: 'New Task', icon: Plus, action: 'task' },
];

const NAVIGATION = [
  { label: 'Dashboard', path: '/dashboard', icon: ArrowRight },
  { label: 'Leads', path: '/leads', icon: Users },
  { label: 'Deals', path: '/deals', icon: Briefcase },
  { label: 'Tasks', path: '/tasks', icon: CheckSquare },
  { label: 'Communications', path: '/communications', icon: MessageSquare },
  { label: 'Settings', path: '/settings', icon: ArrowRight },
];

export function CommandPalette() {
  const navigate = useNavigate();
  const { 
    commandPaletteOpen: isOpen, 
    setCommandPaletteOpen: setIsOpen,
    recentItems,
    openTaskForm
  } = useUIStore();
  
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(true);
      }
      if (e.key === 'Escape') setIsOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setIsOpen]);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 10);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const filteredNav = NAVIGATION.filter(n => n.label.toLowerCase().includes(query.toLowerCase()));
  const filteredRecent = recentItems.filter(r => r.title.toLowerCase().includes(query.toLowerCase()));

  const handleAction = (item: any) => {
    if (item.path) {
      navigate(item.path);
      setIsOpen(false);
    } else if (item.action === 'task') {
      openTaskForm();
      setIsOpen(false);
    }
    // Add other actions as needed
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] px-4">
      <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setIsOpen(false)} />
      
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden animate-in zoom-in-95 slide-in-from-top-10 duration-200">
        <div className="flex items-center px-4 py-4 border-b border-slate-100 dark:border-slate-700">
          <Search className="h-5 w-5 text-slate-400 mr-3" />
          <input 
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search for leads, deals, or navigation..."
            className="flex-1 bg-transparent border-none outline-none text-slate-900 dark:text-white font-bold placeholder:text-slate-400"
          />
          <div className="flex items-center gap-1.5 px-2 py-1 bg-slate-100 dark:bg-slate-700 rounded-lg border border-slate-200 dark:border-slate-600">
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Esc</span>
          </div>
        </div>

        <div className="max-h-[60vh] overflow-y-auto p-2 custom-scrollbar">
          {query === '' && recentItems.length > 0 && (
            <div className="mb-4">
              <h3 className="px-3 py-2 text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <History className="h-3 w-3" /> Recent Items
              </h3>
              {recentItems.map((item, idx) => (
                <button
                  key={item.id}
                  onClick={() => handleAction({ path: `/${item.type}s/${item.id}` })}
                  className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-400">
                      {item.type === 'lead' ? <Users className="h-4 w-4" /> : <Briefcase className="h-4 w-4" />}
                    </div>
                    <span className="text-sm font-bold text-slate-700 dark:text-slate-200">{item.title}</span>
                  </div>
                  <span className="text-[10px] font-bold text-slate-400 opacity-0 group-hover:opacity-100 uppercase tracking-widest">Jump to</span>
                </button>
              ))}
            </div>
          )}

          <div className="mb-4">
            <h3 className="px-3 py-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">Navigation</h3>
            <div className="grid grid-cols-1 gap-1">
              {filteredNav.map((item, idx) => (
                <button
                  key={item.label}
                  onClick={() => handleAction(item)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-indigo-50 dark:hover:bg-indigo-900/20 text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all group"
                >
                  <item.icon className="h-4 w-4" />
                  <span className="text-sm font-bold">{item.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <h3 className="px-3 py-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">Quick Actions</h3>
            <div className="grid grid-cols-1 gap-1">
              {QUICK_ACTIONS.map((item, idx) => (
                <button
                  key={item.id}
                  onClick={() => handleAction(item)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-emerald-50 dark:hover:bg-emerald-900/20 text-slate-600 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 transition-all group"
                >
                  <item.icon className="h-4 w-4" />
                  <span className="text-sm font-bold">{item.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="px-4 py-3 bg-slate-50 dark:bg-slate-900 border-t border-slate-100 dark:border-slate-700 flex items-center gap-6 text-[10px] font-bold text-slate-400">
          <div className="flex items-center gap-1.5">
            <kbd className="px-1.5 py-0.5 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-sans">Enter</kbd>
            <span>to select</span>
          </div>
          <div className="flex items-center gap-1.5">
            <kbd className="px-1.5 py-0.5 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-sans">↑↓</kbd>
            <span>to navigate</span>
          </div>
          <div className="flex items-center gap-1.5">
            <kbd className="px-1.5 py-0.5 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-sans">Esc</kbd>
            <span>to close</span>
          </div>
        </div>
      </div>
    </div>
  );
}
