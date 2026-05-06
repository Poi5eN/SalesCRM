import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  DndContext, 
  closestCenter, 
  KeyboardSensor, 
  PointerSensor, 
  useSensor, 
  useSensors, 
  type DragEndEvent
} from '@dnd-kit/core';
import { 
  arrayMove, 
  SortableContext, 
  sortableKeyboardCoordinates, 
  verticalListSortingStrategy, 
  useSortable 
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { 
  GripVertical, Plus, Trash2, ArrowLeft, Eye, EyeOff, Save, CheckCircle2, AlertCircle, Clock
} from 'lucide-react';
import * as proposalsApi from '@/api/proposals.api.ts';
import * as productsApi from '@/api/products.api.ts';
import { Button } from '@/components/ui/Button.tsx';
import { useAuth } from '@/hooks/useAuth.ts';
import { format } from 'date-fns';
import { formatCurrency } from '@/utils/format.ts';

const generateId = () => Math.random().toString(36).substr(2, 9);

interface LineItem {
  id: string; // temp client-side ID or real DB id
  productId?: string;
  name: string;
  description: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  taxRate: number;
  totalPrice: number;
}

export default function ProposalBuilder() {
  const { id } = useParams<{ id: string }>();
  const isNew = !id;
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { tenant } = useAuth();

  const [title, setTitle] = useState('New Proposal');
  const [validUntil, setValidUntil] = useState('');
  const [notes, setNotes] = useState('');
  const [terms, setTerms] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [items, setItems] = useState<LineItem[]>([]);
  const [previewMode, setPreviewMode] = useState(false);
  
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const timeoutRef = useRef<any>(null);

  const { data: proposalData } = useQuery({
    queryKey: ['proposal', id],
    queryFn: () => proposalsApi.getProposal(id!),
    enabled: !isNew,
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => proposalsApi.createProposal(data),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ['proposals'] });
      navigate(`/proposals/${res.data.id}/edit`, { replace: true });
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: any) => proposalsApi.updateProposal(id!, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['proposal', id] });
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    },
    onError: () => setSaveStatus('error')
  });

  // Load existing data
  useEffect(() => {
    if (proposalData?.data && !isNew) {
      const p = proposalData.data;
      setTitle(p.title);
      setValidUntil(p.validUntil ? new Date(p.validUntil).toISOString().split('T')[0] : '');
      setNotes(p.notes || '');
      setTerms(p.terms || '');
      setCurrency(p.currency);
      if (p.items?.length > 0 && items.length === 0) {
        setItems(p.items.sort((a: any, b: any) => a.position - b.position).map((i: any) => ({ ...i, id: i.id })));
      }
    }
  }, [proposalData, isNew]);

  // Recalculate totals
  const { subtotal, discountAmount, taxAmount, totalAmount } = useMemo(() => {
    let sub = 0;
    let disc = 0;
    let tax = 0;
    
    items.forEach(item => {
      const lineSubtotal = item.quantity * item.unitPrice;
      const lineDisc = lineSubtotal * (item.discount / 100);
      const lineTax = (lineSubtotal - lineDisc) * (item.taxRate / 100);
      
      sub += lineSubtotal;
      disc += lineDisc;
      tax += lineTax;
      item.totalPrice = lineSubtotal - lineDisc + lineTax; // update item inline for preview
    });
    
    return {
      subtotal: sub,
      discountAmount: disc,
      taxAmount: tax,
      totalAmount: sub - disc + tax
    };
  }, [items]);

  // Auto-save logic
  useEffect(() => {
    if (isNew) return; // Don't auto-save until created once
    if (!proposalData?.data || proposalData.data.status !== 'draft') return; // Only auto-save drafts

    setSaveStatus('saving');
    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    timeoutRef.current = setTimeout(() => {
      const payload = {
        title,
        validUntil: validUntil ? new Date(validUntil).toISOString() : undefined,
        notes,
        terms,
        currency,
        items: items.map((item, index) => ({
          ...item,
          position: index,
        }))
      };
      updateMutation.mutate(payload);
    }, 2000); // 2 second debounce

    return () => clearTimeout(timeoutRef.current);
  }, [title, validUntil, notes, terms, currency, items]);

  const handleManualSave = () => {
    const payload = {
      title,
      validUntil: validUntil ? new Date(validUntil).toISOString() : undefined,
      notes,
      terms,
      currency,
      items: items.map((item, index) => ({
        ...item,
        position: index,
      }))
    };
    if (isNew) {
      createMutation.mutate(payload);
    } else {
      updateMutation.mutate(payload);
    }
  };

  // DnD setup
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (active.id !== over?.id) {
      setItems((items) => {
        const oldIndex = items.findIndex((i) => i.id === active.id);
        const newIndex = items.findIndex((i) => i.id === over?.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const addItem = () => {
    setItems([...items, {
      id: generateId(),
      name: '',
      description: '',
      quantity: 1,
      unitPrice: 0,
      discount: 0,
      taxRate: 0,
      totalPrice: 0
    }]);
  };

  const updateItem = (id: string, field: string, value: any) => {
    setItems(items.map(item => item.id === id ? { ...item, [field]: value } : item));
  };

  const removeItem = (id: string) => {
    setItems(items.filter(item => item.id !== id));
  };

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col -m-8">
      {/* Header */}
      <div className="h-16 border-b border-slate-200 bg-white flex items-center justify-between px-6 shrink-0 z-10 shadow-sm">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate('/proposals')} className="text-slate-500">
            <ArrowLeft className="h-4 w-4 mr-2" /> Back
          </Button>
          <div className="h-6 w-px bg-slate-200" />
          <h1 className="text-lg font-bold text-slate-900 truncate max-w-[200px] md:max-w-md">{title || 'Untitled Proposal'}</h1>
          {saveStatus === 'saving' && <span className="text-xs font-semibold text-slate-400 flex items-center gap-1.5"><Clock className="h-3 w-3 animate-spin" /> Saving...</span>}
          {saveStatus === 'saved' && <span className="text-xs font-semibold text-emerald-500 flex items-center gap-1.5"><CheckCircle2 className="h-3 w-3" /> Saved</span>}
          {saveStatus === 'error' && <span className="text-xs font-semibold text-red-500 flex items-center gap-1.5"><AlertCircle className="h-3 w-3" /> Error saving</span>}
        </div>
        
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={() => setPreviewMode(!previewMode)} className="hidden md:flex">
            {previewMode ? <><EyeOff className="h-4 w-4 mr-2" /> Edit Mode</> : <><Eye className="h-4 w-4 mr-2" /> Live Preview</>}
          </Button>
          {isNew && (
            <Button size="sm" onClick={handleManualSave} isLoading={createMutation.isPending}>
              <Save className="h-4 w-4 mr-2" /> Create Draft
            </Button>
          )}
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden bg-slate-50 relative">
        
        {/* LEFT PANEL: EDITOR */}
        <div className={`w-full md:w-1/2 lg:w-7/12 flex flex-col border-r border-slate-200 bg-white transition-all duration-300 absolute inset-y-0 left-0 z-10 md:relative ${previewMode ? '-translate-x-full md:translate-x-0 md:opacity-50 md:pointer-events-none' : 'translate-x-0'}`}>
          <div className="flex-1 overflow-y-auto p-6 space-y-8">
            
            {/* Meta */}
            <div className="grid grid-cols-2 gap-6">
              <div className="col-span-2">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Proposal Title <span className="text-red-500">*</span></label>
                <input required value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Enterprise Software License" className="w-full text-xl font-bold px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-400 shadow-sm" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Valid Until</label>
                <input type="date" value={validUntil} onChange={e => setValidUntil(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-indigo-400" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Currency</label>
                <select value={currency} onChange={e => setCurrency(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-indigo-400 bg-white">
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="GBP">GBP (£)</option>
                </select>
              </div>
            </div>

            {/* Line Items Builder */}
            <div>
              <div className="flex items-center justify-between mb-3 border-b border-slate-200 pb-2">
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Line Items</h3>
              </div>
              
              <div className="space-y-3">
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                  <SortableContext items={items.map(i => i.id)} strategy={verticalListSortingStrategy}>
                    {items.map(item => (
                      <SortableItem key={item.id} item={item} updateItem={updateItem} removeItem={removeItem} />
                    ))}
                  </SortableContext>
                </DndContext>

                <Button variant="outline" size="sm" onClick={addItem} className="w-full border-dashed border-2 py-6 text-slate-500 hover:text-indigo-600 hover:border-indigo-300 hover:bg-indigo-50">
                  <Plus className="h-4 w-4 mr-2" /> Add Line Item
                </Button>
              </div>

              {/* Totals Summary */}
              <div className="mt-6 flex justify-end">
                <div className="w-full max-w-sm bg-slate-50 rounded-xl p-5 border border-slate-200 space-y-3 text-sm">
                  <div className="flex justify-between font-medium text-slate-600">
                    <span>Subtotal</span>
                    <span>{formatCurrency(subtotal, currency)}</span>
                  </div>
                  <div className="flex justify-between font-medium text-emerald-600">
                    <span>Discount</span>
                    <span>-{formatCurrency(discountAmount, currency)}</span>
                  </div>
                  <div className="flex justify-between font-medium text-slate-600">
                    <span>Tax</span>
                    <span>{formatCurrency(taxAmount, currency)}</span>
                  </div>
                  <div className="pt-3 border-t border-slate-200 flex justify-between font-black text-lg text-slate-900">
                    <span>Total Amount</span>
                    <span>{formatCurrency(totalAmount, currency)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Notes & Terms */}
            <div className="space-y-6 border-t border-slate-200 pt-6">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Notes (Visible to client)</label>
                <textarea rows={3} value={notes} onChange={e => setNotes(e.target.value)} placeholder="Thank you for your business..." className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-indigo-400 resize-none" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Terms & Conditions</label>
                <textarea rows={3} value={terms} onChange={e => setTerms(e.target.value)} placeholder="Standard terms apply..." className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-indigo-400 resize-none" />
              </div>
            </div>
            
          </div>
        </div>

        {/* RIGHT PANEL: LIVE PREVIEW */}
        <div className={`w-full md:w-1/2 lg:w-5/12 overflow-y-auto bg-slate-100 p-6 lg:p-10 transition-transform duration-300 absolute inset-0 md:relative md:translate-x-0 z-0 ${previewMode ? 'translate-x-0 z-20' : 'translate-x-full'}`}>
          
          {previewMode && (
            <Button variant="outline" size="sm" onClick={() => setPreviewMode(false)} className="md:hidden mb-4 bg-white shadow-sm">
              <ArrowLeft className="h-4 w-4 mr-2" /> Back to Editor
            </Button>
          )}

          <div className="bg-white rounded-xl shadow-xl min-h-[800px] flex flex-col p-8 md:p-12 scale-[0.85] origin-top-center sm:scale-100">
            {/* Preview Header */}
            <div className="flex justify-between items-start border-b border-slate-200 pb-8">
              <div>
                <h2 className="text-3xl font-black text-slate-900 tracking-tight">{tenant?.name || 'Your Company'}</h2>
                <p className="text-sm text-slate-500 mt-1 font-medium">PROPOSAL</p>
              </div>
              <div className="text-right">
                <p className="text-xl font-bold text-slate-800">{title || 'Untitled Proposal'}</p>
                <p className="text-sm text-slate-500 mt-1">Date: {format(new Date(), 'MMM dd, yyyy')}</p>
                {validUntil && <p className="text-sm text-slate-500">Valid Until: {format(new Date(validUntil), 'MMM dd, yyyy')}</p>}
              </div>
            </div>

            {/* Preview Client Info */}
            <div className="py-8">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Prepared For</p>
              <p className="text-base font-bold text-slate-900">{proposalData?.data?.contact ? `${proposalData.data.contact.firstName} ${proposalData.data.contact.lastName}` : 'Client Name'}</p>
              <p className="text-sm text-slate-600">{proposalData?.data?.deal?.title || 'Company Details'}</p>
            </div>

            {/* Preview Table */}
            <div className="flex-1">
              {items.length > 0 ? (
                <table className="w-full text-sm text-left mb-8">
                  <thead className="bg-slate-50 border-y border-slate-200 text-slate-500 font-semibold">
                    <tr>
                      <th className="px-4 py-3 w-1/2">Description</th>
                      <th className="px-4 py-3 text-center">Qty</th>
                      <th className="px-4 py-3 text-right">Unit Price</th>
                      <th className="px-4 py-3 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {items.map((item, i) => (
                      <tr key={i}>
                        <td className="px-4 py-4">
                          <p className="font-bold text-slate-900">{item.name || 'Untitled Item'}</p>
                          {item.description && <p className="text-xs text-slate-500 mt-0.5 whitespace-pre-wrap">{item.description}</p>}
                        </td>
                        <td className="px-4 py-4 text-center">{item.quantity}</td>
                        <td className="px-4 py-4 text-right">{formatCurrency(item.unitPrice, currency)}</td>
                        <td className="px-4 py-4 text-right font-bold text-slate-900">{formatCurrency(item.totalPrice, currency)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="border border-dashed border-slate-200 rounded-xl p-8 text-center text-slate-400 mb-8 font-medium">
                  Add line items to see them in the preview.
                </div>
              )}

              {/* Preview Totals */}
              <div className="flex justify-end">
                <div className="w-full max-w-xs space-y-3 text-sm">
                  <div className="flex justify-between font-medium text-slate-600">
                    <span>Subtotal</span>
                    <span>{formatCurrency(subtotal, currency)}</span>
                  </div>
                  {discountAmount > 0 && (
                    <div className="flex justify-between font-medium text-emerald-600">
                      <span>Discount</span>
                      <span>-{formatCurrency(discountAmount, currency)}</span>
                    </div>
                  )}
                  {taxAmount > 0 && (
                    <div className="flex justify-between font-medium text-slate-600">
                      <span>Tax</span>
                      <span>{formatCurrency(taxAmount, currency)}</span>
                    </div>
                  )}
                  <div className="pt-3 border-t border-slate-200 flex justify-between font-black text-lg text-slate-900">
                    <span>Total</span>
                    <span>{formatCurrency(totalAmount, currency)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Preview Footer */}
            {(notes || terms) && (
              <div className="mt-12 pt-8 border-t border-slate-200 space-y-6">
                {notes && (
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">Notes</h4>
                    <p className="text-sm text-slate-600 whitespace-pre-wrap">{notes}</p>
                  </div>
                )}
                {terms && (
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">Terms & Conditions</h4>
                    <p className="text-sm text-slate-600 whitespace-pre-wrap text-justify">{terms}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}


function SortableItem({ item, updateItem, removeItem }: { item: LineItem, updateItem: Function, removeItem: Function }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className={`bg-white border ${isDragging ? 'border-indigo-400 shadow-lg' : 'border-slate-200 shadow-sm'} rounded-xl p-4 flex gap-4 transition-colors hover:border-slate-300`}>
      <div className="flex items-center justify-center cursor-grab active:cursor-grabbing text-slate-400 hover:text-slate-600 shrink-0" {...attributes} {...listeners}>
        <GripVertical className="h-5 w-5" />
      </div>
      
      <div className="flex-1 space-y-3">
        <div className="flex gap-3">
          <div className="flex-1">
            <input 
              value={item.name} 
              onChange={e => updateItem(item.id, 'name', e.target.value)} 
              placeholder="Item name / Product search" 
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm font-semibold text-slate-900 focus:outline-none focus:border-indigo-400" 
            />
          </div>
          <Button variant="ghost" size="sm" onClick={() => removeItem(item.id)} className="text-slate-400 hover:text-red-600 hover:bg-red-50 shrink-0 px-2">
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
        
        <textarea 
          rows={1} 
          value={item.description} 
          onChange={e => updateItem(item.id, 'description', e.target.value)} 
          placeholder="Description (optional)" 
          className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs text-slate-600 focus:outline-none focus:border-indigo-400 resize-none min-h-[36px]" 
        />
        
        <div className="flex flex-wrap gap-3">
          <div className="w-24">
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Qty</label>
            <input type="number" min="1" value={item.quantity} onChange={e => updateItem(item.id, 'quantity', parseInt(e.target.value) || 0)} className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-indigo-400" />
          </div>
          <div className="w-32">
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Unit Price</label>
            <input type="number" min="0" step="0.01" value={item.unitPrice} onChange={e => updateItem(item.id, 'unitPrice', parseFloat(e.target.value) || 0)} className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-indigo-400" />
          </div>
          <div className="w-24">
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Disc (%)</label>
            <input type="number" min="0" max="100" value={item.discount} onChange={e => updateItem(item.id, 'discount', parseFloat(e.target.value) || 0)} className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-indigo-400" />
          </div>
          <div className="w-24">
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Tax (%)</label>
            <input type="number" min="0" max="100" value={item.taxRate} onChange={e => updateItem(item.id, 'taxRate', parseFloat(e.target.value) || 0)} className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-indigo-400" />
          </div>
        </div>
      </div>
    </div>
  );
}
