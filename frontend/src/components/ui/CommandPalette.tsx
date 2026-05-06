import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, Users, Briefcase, CheckSquare, MessageSquare, 
  Plus, History, ArrowRight, Building2, User
} from 'lucide-react';
import { useUIStore } from '@/store/ui.store.ts';
import { useDebounce } from '@/hooks/useDebounce.ts';
import * as leadsApi from '@/api/leads.api.ts';
import * as dealsApi from '@/api/deals.api.ts';
import * as contactsApi from '@/api/contacts.api.ts';
import * as companiesApi from '@/api/companies.api.ts';

const QUICK_ACTIONS = [
  { id: 'new-lead', label: 'New Lead', icon: Plus, action: 'lead' },
  { id: 'new-deal', label: 'New Deal', icon: Plus, action: 'deal' },
  { id: 'new-task', label: 'New Task', icon: Plus, action: 'task' },
];

const NAVIGATION = [
  { label: 'Dashboard', path: '/dashboard', icon: ArrowRight },
  { label: 'Leads', path: '/leads', icon: Users },
  { label: 'Deals', path: '/deals', icon: Briefcase },
  { label: 'Contacts', path: '/contacts', icon: User },
  { label: 'Companies', path: '/companies', icon: Building2 },
  { label: 'Tasks', path: '/tasks', icon: CheckSquare },
  { label: 'Reports', path: '/reports', icon: ArrowRight },
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
  const debouncedQuery = useDebounce(query, 300);
  const [results, setResults] = useState<{
    leads: any[];
    deals: any[];
    contacts: any[];
    companies: any[];
  }>({ leads: [], deals: [], contacts: [], companies: [] });
  const [isSearching, setIsSearching] = useState(false);
  
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
      setResults({ leads: [], deals: [], contacts: [], companies: [] });
      setTimeout(() => inputRef.current?.focus(), 10);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!debouncedQuery || debouncedQuery.length < 2) {
      setResults({ leads: [], deals: [], contacts: [], companies: [] });
      return;
    }

    const performSearch = async () => {
      setIsSearching(true);
      try {
        const [leads, deals, contacts, companies] = await Promise.all([
          leadsApi.getLeads({ search: debouncedQuery, limit: 5 }),
          dealsApi.getDeals({ search: debouncedQuery, limit: 5 }),
          contactsApi.getContacts({ search: debouncedQuery, limit: 5 }),
          companiesApi.getCompanies({ search: debouncedQuery, limit: 5 }),
        ]);

        setResults({
          leads: leads.data?.data || [],
          deals: deals.data?.data || [],
          contacts: contacts.data?.data || [],
          companies: companies.data?.data || [],
        });
      } catch (error) {
        console.error('Search failed', error);
      } finally {
        setIsSearching(false);
      }
    };

    performSearch();
  }, [debouncedQuery]);

  if (!isOpen) return null;

  const filteredNav = NAVIGATION.filter(n => n.label.toLowerCase().includes(query.toLowerCase()));

  const handleAction = (item: any) => {
    if (item.path) {
      navigate(item.path);
      setIsOpen(false);
    } else if (item.action === 'task') {
      openTaskForm();
      setIsOpen(false);
    }
  };

  const hasResults = results.leads.length > 0 || results.deals.length > 0 || results.contacts.length > 0 || results.companies.length > 0;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] px-4">
      <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setIsOpen(false)} />
      
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden animate-in zoom-in-95 slide-in-from-top-10 duration-200">
        <div className="flex items-center px-4 py-4 border-b border-slate-100 dark:border-slate-700">
          <Search className={`h-5 w-5 mr-3 transition-colors ${isSearching ? 'text-indigo-500 animate-pulse' : 'text-slate-400'}`} />
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
              {recentItems.map((item) => (
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

          {query.length >= 2 && (
            <div className="mb-4">
              <h3 className="px-3 py-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">Search Results</h3>
              {!hasResults && !isSearching && (
                <div className="px-3 py-8 text-center">
                  <p className="text-sm font-bold text-slate-500">No results found for "{query}"</p>
                </div>
              )}
              
              {results.leads.length > 0 && (
                <div className="mt-2">
                  <div className="px-3 py-1 text-[9px] font-black text-indigo-500 uppercase tracking-widest">Leads</div>
                  {results.leads.map(l => (
                    <SearchResultItem key={l.id} icon={Users} title={l.title} subtitle={l.company?.name} onClick={() => handleAction({ path: `/leads?search=${l.title}` })} />
                  ))}
                </div>
              )}

              {results.deals.length > 0 && (
                <div className="mt-2">
                  <div className="px-3 py-1 text-[9px] font-black text-emerald-500 uppercase tracking-widest">Deals</div>
                  {results.deals.map(d => (
                    <SearchResultItem key={d.id} icon={Briefcase} title={d.title} subtitle={formatCurrency(d.value, d.currency)} onClick={() => handleAction({ path: `/deals?search=${d.title}` })} />
                  ))}
                </div>
              )}

              {results.contacts.length > 0 && (
                <div className="mt-2">
                  <div className="px-3 py-1 text-[9px] font-black text-blue-500 uppercase tracking-widest">People</div>
                  {results.contacts.map(c => (
                    <SearchResultItem key={c.id} icon={User} title={`${c.firstName} ${c.lastName || ''}`} subtitle={c.email} onClick={() => handleAction({ path: `/contacts?search=${c.firstName}` })} />
                  ))}
                </div>
              )}

              {results.companies.length > 0 && (
                <div className="mt-2">
                  <div className="px-3 py-1 text-[9px] font-black text-orange-500 uppercase tracking-widest">Companies</div>
                  {results.companies.map(c => (
                    <SearchResultItem key={c.id} icon={Building2} title={c.name} subtitle={c.website} onClick={() => handleAction({ path: `/companies?search=${c.name}` })} />
                  ))}
                </div>
              )}
            </div>
          )}

          {query.length < 2 && (
            <>
              <div className="mb-4">
                <h3 className="px-3 py-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">Navigation</h3>
                <div className="grid grid-cols-1 gap-1">
                  {filteredNav.map((item) => (
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
                  {QUICK_ACTIONS.map((item) => (
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
            </>
          )}
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

function SearchResultItem({ icon: Icon, title, subtitle, onClick }: any) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center justify-between px-3 py-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors group"
    >
      <div className="flex items-center gap-3 overflow-hidden">
        <div className="h-7 w-7 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 shrink-0">
          <Icon className="h-3.5 w-3.5" />
        </div>
        <div className="flex flex-col items-start overflow-hidden">
          <span className="text-sm font-bold text-slate-700 dark:text-slate-200 truncate w-full text-left">{title}</span>
          {subtitle && <span className="text-[10px] font-bold text-slate-400 truncate w-full text-left">{subtitle}</span>}
        </div>
      </div>
      <ArrowRight className="h-3 w-3 text-slate-300 opacity-0 group-hover:opacity-100 transition-all" />
    </button>
  );
}

function formatCurrency(value: number, currency: string = 'USD') {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(value);
}
