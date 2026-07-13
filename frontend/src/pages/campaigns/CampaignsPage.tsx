import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  Megaphone, Plus, Filter, Download, LayoutGrid, List, Search, X, 
  TrendingUp, Award, Target, Briefcase, Calendar, ChevronRight, Pen, Trash2, Loader2, Link as LinkIcon
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Cell 
} from 'recharts';
import { format } from 'date-fns';

import * as campaignsApi from '@/api/campaigns.api.ts';
import { useAuth } from '@/hooks/useAuth.ts';
import { useUIStore } from '@/store/ui.store.ts';
import { useConfirm } from '@/hooks/useConfirm.ts';
import { Button } from '@/components/ui/Button.tsx';
import { StatCard } from '@/components/ui/StatCard.tsx';
import { Badge } from '@/components/ui/Badge.tsx';
import { Table } from '@/components/ui/Table.tsx';
import { formatCurrency, formatNumber } from '@/utils/format.ts';
import type { Campaign } from '@/types/api.types.ts';
import { queryKeys } from '@/lib/queryKeys.ts';
import { EmptyState } from '@/components/ui/EmptyState.tsx';

const PLATFORMS = [
  { value: 'Google Ads', label: 'Google Ads' },
  { value: 'Meta Ads', label: 'Meta Ads' },
  { value: 'Landing Page', label: 'Landing Page' },
  { value: 'Website Form', label: 'Website Form' },
  { value: 'WhatsApp', label: 'WhatsApp' },
  { value: 'Email', label: 'Email' },
  { value: 'Custom Form', label: 'Custom Form' },
  { value: 'Other', label: 'Other' }
];

const STATUSES = [
  { value: 'draft', label: 'Draft', color: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300' },
  { value: 'active', label: 'Active', color: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400' },
  { value: 'paused', label: 'Paused', color: 'bg-amber-50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400' },
  { value: 'completed', label: 'Completed', color: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/20 dark:text-indigo-400' }
];

const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f97316', '#22c55e', '#06b6d4'];

const campaignFormSchema = z.object({
  name: z.string().min(3, 'Campaign name must be at least 3 characters'),
  platform: z.string().min(1, 'Please select a platform'),
  budget: z.string().refine(val => !val || !isNaN(parseFloat(val)), 'Must be a valid number'),
  status: z.enum(['draft', 'active', 'paused', 'completed']),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

type CampaignFormData = z.infer<typeof campaignFormSchema>;

export default function CampaignsPage() {
  const { tenant } = useAuth();
  const confirm = useConfirm();
  const qc = useQueryClient();
  const theme = useUIStore(state => state.theme);

  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [search, setSearch] = useState('');
  const [selectedPlatform, setSelectedPlatform] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null);

  const columns = [
    {
      header: 'Campaign Name',
      accessor: (campaign: Campaign) => (
        <span className="text-sm font-bold text-slate-900 dark:text-white">{campaign.name}</span>
      )
    },
    {
      header: 'Platform',
      accessor: (campaign: Campaign) => (
        <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">{campaign.platform}</span>
      )
    },
    {
      header: 'Status',
      accessor: (campaign: Campaign) => {
        const statusObj = STATUSES.find(s => s.value === campaign.status);
        return (
          <span className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-xl ${statusObj?.color}`}>
            {statusObj?.label}
          </span>
        );
      }
    },
    {
      header: 'Budget',
      accessor: (campaign: Campaign) => (
        <span className="text-sm font-bold text-slate-900 dark:text-white">{formatCurrency(campaign.budget, tenant?.currency)}</span>
      ),
      className: 'text-right'
    },
    {
      header: 'Leads',
      accessor: (campaign: Campaign) => (
        <span className="text-sm font-bold text-slate-900 dark:text-white">{campaign.leadsCount || 0}</span>
      ),
      className: 'text-right'
    },
    {
      header: 'Cost Per Lead',
      accessor: (campaign: Campaign) => (
        <span className="text-sm font-bold text-slate-900 dark:text-white">{formatCurrency(campaign.costPerLead || 0, tenant?.currency)}</span>
      ),
      className: 'text-right'
    },
    {
      header: 'Conversion Rate',
      accessor: (campaign: Campaign) => (
        <span className="text-sm font-bold text-slate-900 dark:text-white">{(campaign.conversionRate || 0).toFixed(1)}%</span>
      ),
      className: 'text-right'
    },
    {
      header: 'Actions',
      accessor: (campaign: Campaign) => (
        <div className="flex items-center justify-end gap-1" onClick={e => e.stopPropagation()}>
          <button 
            onClick={() => handleOpenForm(campaign)}
            className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white rounded transition-colors"
          >
            <Pen className="h-3.5 w-3.5" />
          </button>
          <button 
            onClick={() => handleDelete(campaign)}
            className="p-1.5 hover:bg-red-50 dark:hover:bg-red-950/20 text-slate-500 hover:text-red-500 rounded transition-colors"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      ),
      className: 'text-center'
    }
  ];

  // Fetch campaigns
  const { data: campaignsData, isLoading } = useQuery({
    queryKey: ['campaigns', { search, platform: selectedPlatform, status: selectedStatus }],
    queryFn: () => campaignsApi.getCampaigns({ 
      search, 
      platform: selectedPlatform || undefined, 
      status: selectedStatus || undefined,
      limit: 100 
    }),
  });

  const campaignsList: Campaign[] = campaignsData?.data?.data || [];

  // Mutations
  const createMutation = useMutation({
    mutationFn: (data: any) => campaignsApi.createCampaign(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['campaigns'] });
      setModalOpen(false);
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => campaignsApi.updateCampaign(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['campaigns'] });
      setEditingCampaign(null);
      setModalOpen(false);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => campaignsApi.deleteCampaign(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['campaigns'] });
      qc.invalidateQueries({ queryKey: ['leads'] });
    }
  });

  const handleDelete = async (campaign: Campaign) => {
    const ok = await confirm.confirm(
      `Are you sure you want to delete "${campaign.name}"? Leads will remain in CRM but their campaign relationship will be removed.`,
      'Delete Campaign',
      'danger'
    );
    if (ok) deleteMutation.mutate(campaign.id);
  };

  const handleOpenForm = (campaign?: Campaign) => {
    if (campaign) {
      setEditingCampaign(campaign);
    } else {
      setEditingCampaign(null);
    }
    setModalOpen(true);
  };

  // Metrics
  const totalBudget = campaignsList.reduce((acc, c) => acc + Number(c.budget), 0);
  const totalLeads = campaignsList.reduce((acc, c) => acc + (c.leadsCount || 0), 0);
  const activeCampaigns = campaignsList.filter(c => c.status === 'active').length;
  
  // Calculate average cost per lead
  const avgCostPerLead = totalLeads > 0 ? totalBudget / totalLeads : 0;

  // Weighted average conversion rate
  const avgConversionRate = campaignsList.length > 0
    ? campaignsList.reduce((acc, c) => acc + (c.conversionRate || 0), 0) / campaignsList.length
    : 0;

  return (
    <div className="space-y-10 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Marketing Campaigns</h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium mt-1">Track the performance and ROI of your lead acquisition channels.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-2xl p-1 border border-slate-200 dark:border-slate-700 shadow-sm">
            <button
              onClick={() => setViewMode('grid')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${viewMode === 'grid' ? 'bg-white dark:bg-slate-700 text-slate-950 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
            >
              <LayoutGrid className="h-3.5 w-3.5" /> Grid
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${viewMode === 'table' ? 'bg-white dark:bg-slate-700 text-slate-950 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
            >
              <List className="h-3.5 w-3.5" /> Table
            </button>
          </div>
          <Button size="sm" onClick={() => handleOpenForm()}>
            <Plus className="mr-1.5 h-4 w-4 stroke-[3px]" /> New Campaign
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Active Campaigns"
          value={activeCampaigns.toString()}
          icon={Megaphone}
          iconColor="text-indigo-500"
          description="Total marketing campaigns currently running"
        />
        <StatCard
          title="Total Leads"
          value={formatNumber(totalLeads)}
          icon={Target}
          iconColor="text-blue-500"
          description="Total leads captured from campaigns"
        />
        <StatCard
          title="Avg Cost Per Lead"
          value={formatCurrency(avgCostPerLead, tenant?.currency)}
          icon={TrendingUp}
          iconColor="text-emerald-500"
          description="Total budget allocated vs total leads generated"
        />
        <StatCard
          title="Avg Conversion Rate"
          value={`${avgConversionRate.toFixed(1)}%`}
          icon={Award}
          iconColor="text-orange-500"
          description="Average lead-to-deal conversion percentage"
        />
      </div>

      {/* Chart & Platform Breakdown */}
      {campaignsList.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Chart */}
          <div className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-[32px] p-8 border border-slate-200 dark:border-slate-700 shadow-xl shadow-slate-100/50 dark:shadow-none flex flex-col h-[400px]">
            <h3 className="text-base font-black text-slate-900 dark:text-white tracking-tight uppercase mb-6">Leads Captured by Campaign</h3>
            <div className="flex-1 min-h-0">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={campaignsList.slice(0, 7)}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme === 'dark' ? '#1e293b' : '#f1f5f9'} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }} />
                  <RechartsTooltip cursor={{ fill: theme === 'dark' ? '#1e293b' : '#f8fafc', radius: 10 }} />
                  <Bar dataKey="leadsCount" radius={[6, 6, 0, 0]} name="Leads Generated">
                    {campaignsList.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Platform Performance Card */}
          <div className="bg-white dark:bg-slate-800 rounded-[32px] p-8 border border-slate-200 dark:border-slate-700 shadow-xl shadow-slate-100/50 dark:shadow-none flex flex-col h-[400px]">
            <h3 className="text-base font-black text-slate-900 dark:text-white tracking-tight uppercase mb-6">Leads by Platform</h3>
            <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
              {Array.from(new Set(campaignsList.map(c => c.platform))).map((plat, i) => {
                const platLeads = campaignsList.filter(c => c.platform === plat).reduce((sum, c) => sum + (c.leadsCount || 0), 0);
                const pct = totalLeads > 0 ? (platLeads / totalLeads) * 100 : 0;
                return (
                  <div key={plat} className="space-y-1">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-600 dark:text-slate-300">
                      <span>{plat}</span>
                      <span>{platLeads} ({pct.toFixed(0)}%)</span>
                    </div>
                    <div className="h-2 w-full bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, backgroundColor: COLORS[i % COLORS.length] }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Filters & Actions Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 shadow-sm">
        <div className="flex-1 flex flex-col md:flex-row items-center gap-3">
          {/* Search */}
          <div className="w-full md:w-80 flex items-center gap-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5">
            <Search className="h-4 w-4 text-slate-400 shrink-0" />
            <input
              type="text"
              placeholder="Search campaigns..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full text-xs font-semibold bg-transparent focus:outline-none text-slate-950 dark:text-white placeholder:text-slate-400"
            />
            {search && <X className="h-4 w-4 text-slate-400 hover:text-slate-600 cursor-pointer" onClick={() => setSearch('')} />}
          </div>

          {/* Platform Filter */}
          <select
            value={selectedPlatform}
            onChange={e => setSelectedPlatform(e.target.value)}
            className="w-full md:w-44 px-3 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 focus:outline-none"
          >
            <option value="">All Platforms</option>
            {PLATFORMS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
          </select>

          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={e => setSelectedStatus(e.target.value)}
            className="w-full md:w-44 px-3 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 focus:outline-none"
          >
            <option value="">All Statuses</option>
            {STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
        </div>
      </div>

      {/* Campaigns Listing */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 text-indigo-500 animate-spin" />
        </div>
      ) : campaignsList.length === 0 ? (
        <EmptyState
          title="No campaigns found"
          description="Track your performance metrics by setting up a marketing campaign."
          actionText="Create Campaign"
          onAction={() => handleOpenForm()}
          icon={Plus}
        />
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {campaignsList.map(campaign => {
            const statusObj = STATUSES.find(s => s.value === campaign.status);
            return (
              <div 
                key={campaign.id} 
                className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[32px] overflow-hidden shadow-xl shadow-slate-100/50 dark:shadow-none hover:shadow-2xl hover:scale-[1.01] transition-all flex flex-col group"
              >
                {/* Header */}
                <div className="p-6 border-b border-slate-100 dark:border-slate-700/50 flex-1 space-y-4">
                  <div className="flex items-start justify-between">
                    <span className="text-[10px] font-black uppercase tracking-widest text-indigo-500 bg-indigo-50 dark:bg-indigo-950/20 px-2.5 py-1 rounded-xl">
                      {campaign.platform}
                    </span>
                    <span className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-xl ${statusObj?.color}`}>
                      {statusObj?.label}
                    </span>
                  </div>

                  <div>
                    <h4 className="text-lg font-black text-slate-900 dark:text-white tracking-tight leading-snug group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                      {campaign.name}
                    </h4>
                    {campaign.startDate && (
                      <p className="text-[10px] font-bold text-slate-500 flex items-center gap-1 mt-1">
                        <Calendar className="h-3.5 w-3.5 shrink-0" />
                        {format(new Date(campaign.startDate), 'MMM dd, yyyy')} {campaign.endDate ? ` - ${format(new Date(campaign.endDate), 'MMM dd, yyyy')}` : ''}
                      </p>
                    )}
                  </div>

                  {/* Performance Indicators */}
                  <div className="grid grid-cols-3 gap-2 bg-slate-50 dark:bg-slate-900/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-700/50">
                    <div>
                      <p className="text-[9px] font-black uppercase tracking-wider text-slate-400">Leads</p>
                      <p className="text-sm font-black text-slate-900 dark:text-white mt-0.5">{campaign.leadsCount || 0}</p>
                    </div>
                    <div>
                      <p className="text-[9px] font-black uppercase tracking-wider text-slate-400">CPL</p>
                      <p className="text-sm font-black text-slate-900 dark:text-white mt-0.5">{formatCurrency(campaign.costPerLead || 0, tenant?.currency)}</p>
                    </div>
                    <div>
                      <p className="text-[9px] font-black uppercase tracking-wider text-slate-400">Conv %</p>
                      <p className="text-sm font-black text-slate-900 dark:text-white mt-0.5">{(campaign.conversionRate || 0).toFixed(1)}%</p>
                    </div>
                  </div>
                </div>

                {/* Footer Action Strip */}
                <div className="bg-slate-50 dark:bg-slate-900/30 px-6 py-4 flex items-center justify-between border-t border-slate-100 dark:border-slate-700/50">
                  <div className="flex items-center gap-1.5">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Budget:</p>
                    <p className="text-xs font-black text-slate-900 dark:text-white">{formatCurrency(campaign.budget, tenant?.currency)}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button 
                      onClick={() => handleOpenForm(campaign)}
                      className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-xl transition-colors"
                      title="Edit Campaign"
                    >
                      <Pen className="h-4 w-4" />
                    </button>
                    <button 
                      onClick={() => handleDelete(campaign)}
                      className="p-2 hover:bg-red-50 dark:hover:bg-red-950/20 text-slate-600 dark:text-slate-400 hover:text-red-500 rounded-xl transition-colors"
                      title="Delete Campaign"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <Table
          columns={columns as any}
          data={campaignsList}
          isLoading={isLoading}
        />
      )}

      {/* Campaign Form Modal */}
      {modalOpen && (
        <CampaignFormModal
          campaign={editingCampaign}
          onClose={() => { setModalOpen(false); setEditingCampaign(null); }}
          onSubmit={(data) => {
            const payload = {
              ...data,
              budget: parseFloat(data.budget || '0'),
              startDate: data.startDate ? new Date(data.startDate).toISOString() : undefined,
              endDate: data.endDate ? new Date(data.endDate).toISOString() : undefined,
            };

            if (editingCampaign) {
              updateMutation.mutate({ id: editingCampaign.id, data: payload });
            } else {
              createMutation.mutate(payload);
            }
          }}
          isLoading={createMutation.isPending || updateMutation.isPending}
        />
      )}
    </div>
  );
}

interface CampaignFormModalProps {
  campaign: Campaign | null;
  onClose: () => void;
  onSubmit: (data: CampaignFormData) => void;
  isLoading: boolean;
}

function CampaignFormModal({ campaign, onClose, onSubmit, isLoading }: CampaignFormModalProps) {
  const { register, handleSubmit, formState: { errors } } = useForm<CampaignFormData>({
    resolver: zodResolver(campaignFormSchema),
    defaultValues: campaign ? {
      name: campaign.name,
      platform: campaign.platform,
      budget: campaign.budget.toString(),
      status: campaign.status,
      startDate: campaign.startDate ? campaign.startDate.split('T')[0] : '',
      endDate: campaign.endDate ? campaign.endDate.split('T')[0] : '',
    } : {
      name: '',
      platform: 'Google Ads',
      budget: '0',
      status: 'draft',
      startDate: '',
      endDate: '',
    }
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-slate-800 rounded-[32px] shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto border border-slate-200 dark:border-slate-700">
        <div className="flex items-center justify-between p-8 border-b border-slate-100 dark:border-slate-700">
          <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">{campaign ? 'Modify Campaign' : 'Create Campaign'}</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors">
            <X className="h-5 w-5 text-slate-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-8 space-y-6">
          {/* Campaign Name */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Campaign Name</label>
            <input
              {...register('name')}
              placeholder="e.g. Google Search Leads Q3"
              className={`w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border ${errors.name ? 'border-red-500' : 'border-slate-200 dark:border-slate-700'} rounded-2xl text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all`}
            />
            {errors.name && <p className="text-[10px] font-black text-red-500 ml-1 uppercase">{errors.name.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-6">
            {/* Platform */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Platform</label>
              <select
                {...register('platform')}
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 appearance-none"
              >
                {PLATFORMS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
              </select>
            </div>

            {/* Status */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Status</label>
              <select
                {...register('status')}
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 appearance-none"
              >
                {STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>
          </div>

          {/* Budget */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Allocated Budget ($)</label>
            <input
              {...register('budget')}
              type="text"
              placeholder="0.00"
              className={`w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border ${errors.budget ? 'border-red-500' : 'border-slate-200 dark:border-slate-700'} rounded-2xl text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all`}
            />
            {errors.budget && <p className="text-[10px] font-black text-red-500 ml-1 uppercase">{errors.budget.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-6">
            {/* Start Date */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Start Date</label>
              <input
                {...register('startDate')}
                type="date"
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>

            {/* End Date */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">End Date</label>
              <input
                {...register('endDate')}
                type="date"
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-3 pt-6 border-t border-slate-100 dark:border-slate-700">
            <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>Cancel</Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : campaign ? 'Apply Changes' : 'Create Campaign'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
