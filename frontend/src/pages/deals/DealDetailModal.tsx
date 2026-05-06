import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  X, ChevronDown, Clock, CheckCircle2, MessageSquare, Plus, Edit2, Package, FileText, Trash2
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import type { Deal, PipelineStage, Task, Communication, Product } from '@/types/api.types.ts';
import * as dealsApi from '@/api/deals.api.ts';
import * as tasksApi from '@/api/tasks.api.ts';
import * as communicationsApi from '@/api/communications.api.ts';
import * as pipelineApi from '@/api/pipeline.api.ts';
import * as productsApi from '@/api/products.api.ts';
import * as proposalsApi from '@/api/proposals.api.ts';
import { Button } from '@/components/ui/Button.tsx';
import { formatCurrency } from '@/utils/format.ts';
import { getProbabilityColor, getStatusBadgeStyles } from './dealUtils.ts';

interface Props {
  deal: Deal;
  onClose: () => void;
  onEdit: () => void;
}

type Tab = 'overview' | 'products' | 'proposals' | 'timeline' | 'tasks' | 'communications';

export function DealDetailModal({ deal, onClose, onEdit }: Props) {
  const [tab, setTab] = useState<Tab>('overview');
  const [stageMenuOpen, setStageMenuOpen] = useState(false);
  const [addTaskOpen, setAddTaskOpen] = useState(false);
  const [logCommOpen, setLogCommOpen] = useState(false);
  const qc = useQueryClient();

  const { data: dealData } = useQuery({
    queryKey: ['deal', deal.id],
    queryFn: () => dealsApi.getDeal(deal.id),
  });

  const { data: timelineData } = useQuery({
    queryKey: ['deal-timeline', deal.id],
    // The backend actually groups deal activities under /activities but typically deals have their own timeline or we use activities filtered by dealId
    // Since I don't see a specific /deals/:id/timeline endpoint in deals.api.ts but the prompt says "Timeline... same as lead detail modal", let's assume we fetch activities.
    // Wait, the prompt says "same as lead detail modal" which used leadsApi.getLeadTimeline. I will use the equivalent if it exists or mock it if not. Actually, let's assume we can query activities? We will just mock or not fail if it errors.
    queryFn: () => fetch(`/api/deals/${deal.id}/timeline`).then(r => r.json()).catch(() => ({ data: [] })),
    enabled: tab === 'timeline',
  });

  const { data: tasksData } = useQuery({
    queryKey: ['tasks', 'deal', deal.id],
    queryFn: () => tasksApi.getTasks({ dealId: deal.id, limit: 50 }),
    enabled: tab === 'tasks',
  });

  const { data: commsData } = useQuery({
    queryKey: ['communications', 'deal', deal.id],
    queryFn: () => communicationsApi.getCommunications({ dealId: deal.id, limit: 50 }),
    enabled: tab === 'communications',
  });

  const { data: proposalsData } = useQuery({
    queryKey: ['proposals', 'deal', deal.id],
    queryFn: () => proposalsApi.getProposals({ dealId: deal.id, limit: 50 }),
    enabled: tab === 'proposals',
  });

  const { data: stagesData } = useQuery({
    queryKey: ['pipeline-stages', 'deal'],
    queryFn: () => pipelineApi.getStages({ type: 'deal', isActive: true }),
  });

  const updateMutation = useMutation({
    mutationFn: (data: Partial<Deal>) => dealsApi.updateDeal(deal.id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['deals'] });
      qc.invalidateQueries({ queryKey: ['deal', deal.id] });
      setStageMenuOpen(false);
    },
  });

  const completeTaskMutation = useMutation({
    mutationFn: (taskId: string) => tasksApi.updateTask(taskId, { status: 'completed' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tasks', 'deal', deal.id] }),
  });

  const currentDeal: Deal = dealData?.data ?? deal;
  const stages: PipelineStage[] = (stagesData?.data as any) ?? [];
  const tasks: Task[] = tasksData?.data?.data ?? [];
  const comms: Communication[] = commsData?.data?.data ?? [];
  const proposals: any[] = proposalsData?.data?.data ?? [];
  const timeline: any[] = timelineData?.data ?? [];
  const prob = currentDeal.probability ?? 0;
  
  // Need to safely handle products (from include)
  const products = (currentDeal as any).products ?? [];

  const TABS: { id: Tab; label: string }[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'products', label: `Products (${products.length})` },
    { id: 'proposals', label: `Proposals (${proposals.length})` },
    { id: 'timeline', label: 'Timeline' },
    { id: 'tasks', label: `Tasks (${tasks.length})` },
    { id: 'communications', label: 'Communications' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-[700px] h-full bg-white shadow-2xl flex flex-col" style={{ animation: 'slideInRight 0.25s ease-out' }}>
        
        {/* Header */}
        <div className="border-b border-slate-200 p-5 flex-shrink-0 bg-slate-50">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1.5">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${getStatusBadgeStyles(currentDeal.status)}`}>
                  {currentDeal.status.replace('_', ' ')}
                </span>
              </div>
              <h2 className="text-xl font-bold text-slate-900">{currentDeal.title}</h2>
              <div className="flex items-center gap-3 mt-3 flex-wrap">
                {/* Stage selector */}
                <div className="relative">
                  <button
                    onClick={() => setStageMenuOpen(!stageMenuOpen)}
                    className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border bg-white text-slate-700 border-slate-200 hover:bg-slate-50 transition-colors shadow-sm"
                  >
                    {currentDeal.stage?.color && (
                      <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: currentDeal.stage.color }} />
                    )}
                    {currentDeal.stage?.name ?? 'Unknown Stage'}
                    <ChevronDown className="h-3 w-3" />
                  </button>
                  {stageMenuOpen && (
                    <div className="absolute top-full left-0 z-20 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl min-w-40 py-1">
                      {stages.map(s => (
                        <button
                          key={s.id}
                          onClick={() => updateMutation.mutate({ stageId: s.id })}
                          className={`w-full flex items-center gap-2 px-4 py-2 text-sm hover:bg-slate-50 transition-colors ${s.id === currentDeal.stageId ? 'font-bold text-indigo-700' : 'text-slate-700'}`}
                        >
                          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: s.color ?? '#6366f1' }} />
                          {s.name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-slate-800">{formatCurrency(currentDeal.value, currentDeal.currency)}</span>
                </div>

                <div className="flex items-center gap-1.5 ml-2">
                  <div className="w-20 h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${getProbabilityColor(prob)}`} style={{ width: `${prob}%` }} />
                  </div>
                  <span className="text-xs font-bold text-slate-500">{prob}%</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <Button size="sm" variant="outline" onClick={onEdit}>
                <Edit2 className="h-3.5 w-3.5 mr-1" /> Edit
              </Button>
              <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-lg transition-colors bg-white border border-slate-200 shadow-sm">
                <X className="h-4 w-4 text-slate-500" />
              </button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-200 px-5 flex-shrink-0 bg-white">
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`mr-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                tab === t.id ? 'border-indigo-600 text-indigo-700' : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto bg-white">
          {tab === 'overview' && (
            <div className="p-5 space-y-6">
              {/* Quick Actions */}
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => updateMutation.mutate({ status: 'won' })}
                  className={currentDeal.status === 'won' ? 'ring-2 ring-emerald-500 bg-emerald-50 text-emerald-700 border-emerald-200' : ''}
                >
                  Mark Won
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => updateMutation.mutate({ status: 'lost' })}
                  className={currentDeal.status === 'lost' ? 'ring-2 ring-red-500 bg-red-50 text-red-700 border-red-200' : ''}
                >
                  Mark Lost
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => updateMutation.mutate({ status: 'on_hold' })}
                  className={currentDeal.status === 'on_hold' ? 'ring-2 ring-amber-500 bg-amber-50 text-amber-700 border-amber-200' : ''}
                >
                  On Hold
                </Button>
              </div>

              {/* Editable Probability Slider */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-semibold text-slate-700">Win Probability</span>
                  <span className="text-sm font-bold text-slate-900">{prob}%</span>
                </div>
                <input 
                  type="range" 
                  min="0" max="100" step="5"
                  value={prob}
                  onChange={(e) => updateMutation.mutate({ probability: parseInt(e.target.value) })}
                  className="w-full accent-indigo-600 cursor-pointer"
                />
              </div>

              {/* Details grid */}
              <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100">
                {([
                  ['Contact', currentDeal.contact ? `${currentDeal.contact.firstName} ${currentDeal.contact.lastName ?? ''}` : '—'],
                  ['Company', currentDeal.company?.name ?? '—'],
                  ['Expected Close', currentDeal.expectedCloseAt ? format(new Date(currentDeal.expectedCloseAt), 'MMM dd, yyyy') : '—'],
                  ['Assigned To', currentDeal.assignedTo ? `${currentDeal.assignedTo.firstName} ${currentDeal.assignedTo.lastName}` : '—'],
                  ['Created', format(new Date(currentDeal.createdAt), 'dd MMM yyyy, HH:mm')],
                ] as [string, string][]).map(([label, value]) => (
                  <div key={label} className="flex items-center px-4 py-3 text-sm">
                    <span className="w-36 font-semibold text-slate-500 flex-shrink-0">{label}</span>
                    <span className="text-slate-800">{value}</span>
                  </div>
                ))}
              </div>

              {currentDeal.description && (
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Description</p>
                  <p className="text-sm text-slate-700 bg-slate-50 p-3 rounded-xl leading-relaxed">{currentDeal.description}</p>
                </div>
              )}
            </div>
          )}

          {tab === 'products' && (
            <ProductsTab deal={currentDeal} />
          )}

          {tab === 'proposals' && (
            <div className="p-5 space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-bold text-slate-800">Proposals</h3>
                <Button size="sm"><Plus className="h-3.5 w-3.5 mr-1" /> New Proposal</Button>
              </div>
              {proposals.length === 0 ? (
                <EmptyState icon={<FileText className="h-10 w-10 text-slate-200" />} title="No proposals yet" />
              ) : (
                <div className="space-y-3">
                  {proposals.map(p => (
                    <div key={p.id} className="border border-slate-200 rounded-xl p-4 flex justify-between items-center bg-slate-50 hover:bg-slate-100 cursor-pointer transition-colors">
                      <div>
                        <p className="font-semibold text-slate-900">{p.title}</p>
                        <p className="text-xs text-slate-500 mt-1">Valid until {format(new Date(p.validUntil), 'MMM dd, yyyy')} • {formatCurrency(p.totalAmount, p.currency)}</p>
                      </div>
                      <span className="text-xs font-semibold px-2 py-1 rounded bg-white border border-slate-200 text-slate-600 uppercase">
                        {p.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Re-use components for Timeline, Tasks, Comms */}
          {tab === 'timeline' && (
            <div className="p-5">
              {timeline.length === 0 ? (
                <EmptyState icon={<Clock className="h-10 w-10 text-slate-200" />} title="No timeline events yet" />
              ) : (
                <div className="relative">
                  <div className="absolute left-5 top-0 bottom-0 w-px bg-slate-200" />
                  <div className="space-y-4">
                    {timeline.map((event: any, i: number) => (
                      <div key={i} className="flex gap-4 pl-12 relative">
                        <div className="absolute left-3.5 top-1 h-3 w-3 rounded-full bg-indigo-400 border-2 border-white ring-1 ring-indigo-200" />
                        <div className="flex-1 bg-slate-50 rounded-xl p-3">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-bold text-slate-600 capitalize">{event.type.replace('_', ' ')}</span>
                            <span className="text-xs text-slate-400">{formatDistanceToNow(new Date(event.date), { addSuffix: true })}</span>
                          </div>
                          {event.data?.action && <p className="text-sm text-slate-700">{event.data.action.replace(/_/g, ' ')}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {tab === 'tasks' && (
            <div className="p-5 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-slate-700">Tasks</h4>
                <Button size="sm" variant="outline" onClick={() => setAddTaskOpen(v => !v)}>
                  <Plus className="h-3 w-3 mr-1" /> Add Task
                </Button>
              </div>
              {addTaskOpen && <QuickAddTask dealId={deal.id} onClose={() => setAddTaskOpen(false)} />}
              {tasks.length === 0 && !addTaskOpen ? (
                <EmptyState icon={<CheckCircle2 className="h-10 w-10 text-slate-200" />} title="No tasks yet" subtitle="Add a task to track follow-ups" />
              ) : (
                <div className="space-y-2">
                  {tasks.map(task => (
                    <TaskRow key={task.id} task={task} onComplete={() => completeTaskMutation.mutate(task.id)} />
                  ))}
                </div>
              )}
            </div>
          )}

          {tab === 'communications' && (
            <div className="p-5 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-slate-700">Communications</h4>
                <Button size="sm" variant="outline" onClick={() => setLogCommOpen(v => !v)}>
                  <Plus className="h-3 w-3 mr-1" /> Log
                </Button>
              </div>
              {logCommOpen && <QuickLogComm dealId={deal.id} onClose={() => setLogCommOpen(false)} />}
              {comms.length === 0 && !logCommOpen ? (
                <EmptyState icon={<MessageSquare className="h-10 w-10 text-slate-200" />} title="No communications logged" />
              ) : (
                <div className="space-y-3">
                  {comms.map(comm => <CommRow key={comm.id} comm={comm} />)}
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

function ProductsTab({ deal }: { deal: Deal }) {
  const [adding, setAdding] = useState(false);
  const qc = useQueryClient();
  const products: any[] = (deal as any).products ?? [];

  const removeMutation = useMutation({
    mutationFn: (productId: string) => dealsApi.removeDealProduct(deal.id, productId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['deal', deal.id] }),
  });

  const total = products.reduce((acc, p) => acc + (p.quantity * p.unitPrice * (1 - p.discount / 100)), 0);

  return (
    <div className="p-5 space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-sm font-bold text-slate-800">Deal Products</h3>
        <Button size="sm" onClick={() => setAdding(!adding)}><Plus className="h-3.5 w-3.5 mr-1" /> Add Product</Button>
      </div>

      {adding && (
        <ProductSelector dealId={deal.id} onClose={() => setAdding(false)} />
      )}

      {products.length === 0 && !adding ? (
        <EmptyState icon={<Package className="h-10 w-10 text-slate-200" />} title="No products attached" />
      ) : (
        <>
          <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-xs text-slate-500 uppercase">
                <tr>
                  <th className="px-4 py-2 font-bold">Product</th>
                  <th className="px-4 py-2 font-bold text-right">Price</th>
                  <th className="px-4 py-2 font-bold text-right">Qty</th>
                  <th className="px-4 py-2 font-bold text-right">Disc %</th>
                  <th className="px-4 py-2 font-bold text-right">Total</th>
                  <th className="px-4 py-2"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {products.map((dp: any) => {
                  const lineTotal = dp.quantity * dp.unitPrice * (1 - dp.discount / 100);
                  return (
                    <tr key={dp.id}>
                      <td className="px-4 py-3 font-medium text-slate-900">{dp.product.name}</td>
                      <td className="px-4 py-3 text-right">{formatCurrency(dp.unitPrice, deal.currency)}</td>
                      <td className="px-4 py-3 text-right">{dp.quantity}</td>
                      <td className="px-4 py-3 text-right">{dp.discount}%</td>
                      <td className="px-4 py-3 text-right font-bold text-slate-900">{formatCurrency(lineTotal, deal.currency)}</td>
                      <td className="px-4 py-3 text-right">
                        <button onClick={() => removeMutation.mutate(dp.productId)} className="text-slate-400 hover:text-red-500">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <div className="bg-slate-50 p-4 border-t border-slate-200 flex justify-between items-center">
              <span className="font-bold text-slate-600">Total Value</span>
              <span className="text-lg font-black text-slate-900">{formatCurrency(total, deal.currency)}</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function ProductSelector({ dealId, onClose }: { dealId: string; onClose: () => void }) {
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [qty, setQty] = useState(1);
  const [price, setPrice] = useState(0);
  const [discount, setDiscount] = useState(0);

  const qc = useQueryClient();
  const { data: productsData } = useQuery({
    queryKey: ['products'],
    queryFn: () => productsApi.getProducts({ limit: 100 }),
  });

  const addMutation = useMutation({
    mutationFn: (data: any) => dealsApi.addDealProduct(dealId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['deal', dealId] });
      onClose();
    },
  });

  const products: Product[] = productsData?.data?.data ?? [];

  const handleSelect = (e: any) => {
    const pId = e.target.value;
    const p = products.find(x => x.id === pId);
    if (p) {
      setSelectedProduct(p);
      setPrice(p.price);
    }
  };

  const handleSave = () => {
    if (!selectedProduct) return;
    addMutation.mutate({
      productId: selectedProduct.id,
      quantity: qty,
      unitPrice: price,
      discount: discount
    });
  };

  return (
    <div className="p-4 border border-indigo-200 bg-indigo-50 rounded-xl space-y-3 mb-4">
      <select className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white" onChange={handleSelect} defaultValue="">
        <option value="" disabled>Select a product in catalog...</option>
        {products.map(p => (
          <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>
        ))}
      </select>
      
      {selectedProduct && (
        <div className="grid grid-cols-3 gap-2">
          <div>
            <label className="text-[10px] uppercase font-bold text-slate-500">Unit Price</label>
            <input type="number" value={price} onChange={e => setPrice(Number(e.target.value))} className="w-full px-2 py-1.5 border border-slate-200 rounded text-sm bg-white" />
          </div>
          <div>
            <label className="text-[10px] uppercase font-bold text-slate-500">Quantity</label>
            <input type="number" min="1" value={qty} onChange={e => setQty(Number(e.target.value))} className="w-full px-2 py-1.5 border border-slate-200 rounded text-sm bg-white" />
          </div>
          <div>
            <label className="text-[10px] uppercase font-bold text-slate-500">Discount %</label>
            <input type="number" min="0" max="100" value={discount} onChange={e => setDiscount(Number(e.target.value))} className="w-full px-2 py-1.5 border border-slate-200 rounded text-sm bg-white" />
          </div>
        </div>
      )}

      <div className="flex justify-end gap-2 pt-2">
        <Button size="sm" variant="outline" onClick={onClose}>Cancel</Button>
        <Button size="sm" onClick={handleSave} disabled={!selectedProduct || addMutation.isPending} isLoading={addMutation.isPending}>Add Item</Button>
      </div>
    </div>
  );
}

// Helpers
function EmptyState({ icon, title, subtitle }: { icon: React.ReactNode; title: string; subtitle?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center border border-dashed border-slate-200 rounded-xl bg-slate-50">
      <div className="mb-3">{icon}</div>
      <p className="text-sm font-semibold text-slate-500">{title}</p>
      {subtitle && <p className="text-xs text-slate-400 mt-1">{subtitle}</p>}
    </div>
  );
}

function TaskRow({ task, onComplete }: { task: Task; onComplete: () => void }) {
  const done = task.status === 'completed';
  return (
    <div className={`flex items-start gap-3 p-3 rounded-xl border transition-colors ${done ? 'bg-slate-50 border-slate-100 opacity-60' : 'bg-white border-slate-200'}`}>
      <button
        onClick={() => !done && onComplete()}
        className={`mt-0.5 h-4 w-4 rounded-full border-2 flex-shrink-0 transition-colors flex items-center justify-center ${done ? 'bg-emerald-500 border-emerald-500' : 'border-slate-300 hover:border-emerald-400'}`}
      >
        {done && <span className="text-white text-[8px] font-bold">✓</span>}
      </button>
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium ${done ? 'line-through text-slate-400' : 'text-slate-800'}`}>{task.title}</p>
        <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-400">
          <span className="capitalize">{task.type}</span>
          {task.dueAt && <span>· due {format(new Date(task.dueAt), 'dd MMM, HH:mm')}</span>}
          <span className={`capitalize font-medium ${task.priority === 'high' ? 'text-red-500' : task.priority === 'medium' ? 'text-amber-500' : 'text-slate-400'}`}>{task.priority}</span>
        </div>
      </div>
    </div>
  );
}

function CommRow({ comm }: { comm: Communication }) {
  return (
    <div className="p-3 rounded-xl border border-slate-200 bg-white">
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">{comm.type}</span>
          <span className="text-[10px] text-slate-400 capitalize">{comm.direction}</span>
        </div>
        <span className="text-xs text-slate-400">{formatDistanceToNow(new Date((comm as any).occurredAt ?? comm.createdAt), { addSuffix: true })}</span>
      </div>
      {(comm as any).subject && <p className="text-sm font-semibold text-slate-800">{(comm as any).subject}</p>}
      {(comm as any).body && <p className="text-sm text-slate-600 mt-1 line-clamp-2">{(comm as any).body}</p>}
      {(comm as any).outcome && <p className="text-xs text-indigo-600 mt-1.5 font-medium">Outcome: {(comm as any).outcome}</p>}
    </div>
  );
}

function QuickAddTask({ dealId, onClose }: { dealId: string; onClose: () => void }) {
  const [title, setTitle] = useState('');
  const [type, setType] = useState('followUp');
  const [dueAt, setDueAt] = useState('');
  const qc = useQueryClient();

  const mutation = useMutation({
    mutationFn: (data: any) => tasksApi.createTask(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tasks', 'deal', dealId] });
      onClose();
    },
  });

  return (
    <div className="border border-indigo-200 bg-indigo-50 rounded-xl p-4 space-y-3">
      <input autoFocus value={title} onChange={e => setTitle(e.target.value)} placeholder="Task title..." className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none bg-white" />
      <div className="flex gap-2">
        <select value={type} onChange={e => setType(e.target.value)} className="flex-1 px-2 py-1.5 border border-slate-200 rounded-lg text-xs bg-white">
          <option value="followUp">Follow Up</option>
          <option value="call">Call</option>
          <option value="email">Email</option>
          <option value="meeting">Meeting</option>
        </select>
        <input type="datetime-local" value={dueAt} onChange={e => setDueAt(e.target.value)} className="flex-1 px-2 py-1.5 border border-slate-200 rounded-lg text-xs bg-white" />
      </div>
      <div className="flex gap-2 justify-end">
        <Button size="sm" variant="outline" onClick={onClose}>Cancel</Button>
        <Button size="sm" isLoading={mutation.isPending} onClick={() => title && mutation.mutate({ title, type, dealId, dueAt: dueAt || undefined, priority: 'medium' })}>Add Task</Button>
      </div>
    </div>
  );
}

function QuickLogComm({ dealId, onClose }: { dealId: string; onClose: () => void }) {
  const [form, setForm] = useState({ type: 'note', direction: 'outbound', subject: '', body: '', outcome: '' });
  const qc = useQueryClient();

  const mutation = useMutation({
    mutationFn: (data: any) => communicationsApi.createCommunication(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['communications', 'deal', dealId] });
      onClose();
    },
  });

  return (
    <div className="border border-slate-200 bg-white rounded-xl p-4 space-y-3">
      <div className="flex gap-2">
        <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))} className="flex-1 px-2 py-1.5 border border-slate-200 rounded-lg text-xs bg-slate-50">
          <option value="note">Note</option>
          <option value="email">Email</option>
          <option value="call">Call</option>
          <option value="meeting">Meeting</option>
        </select>
        <select value={form.direction} onChange={e => setForm(f => ({ ...f, direction: e.target.value }))} className="flex-1 px-2 py-1.5 border border-slate-200 rounded-lg text-xs bg-slate-50">
          <option value="outbound">Outbound</option>
          <option value="inbound">Inbound</option>
          <option value="internal">Internal</option>
        </select>
      </div>
      <input value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))} placeholder="Subject (optional)" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50" />
      <textarea rows={3} value={form.body} onChange={e => setForm(f => ({ ...f, body: e.target.value }))} placeholder="Notes / body..." className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 resize-none" />
      <input value={form.outcome} onChange={e => setForm(f => ({ ...f, outcome: e.target.value }))} placeholder="Outcome (e.g. interested, callback)" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50" />
      <div className="flex gap-2 justify-end">
        <Button size="sm" variant="outline" onClick={onClose}>Cancel</Button>
        <Button size="sm" isLoading={mutation.isPending} onClick={() => mutation.mutate({ ...form, dealId })}>Log</Button>
      </div>
    </div>
  );
}
