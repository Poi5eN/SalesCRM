import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  DndContext, DragOverlay, PointerSensor, useSensor, useSensors,
  type DragEndEvent, type DragStartEvent,
} from '@dnd-kit/core';
import { useDroppable, useDraggable } from '@dnd-kit/core';
import { Plus, GripVertical } from 'lucide-react';
import confetti from 'canvas-confetti';
import { formatDistanceToNow, format } from 'date-fns';
import type { Deal } from '@/types/api.types.ts';
import * as dealsApi from '@/api/deals.api.ts';
import { formatCurrency } from '@/utils/format.ts';
import { getProbabilityColor } from './dealUtils.ts';
import { Button } from '@/components/ui/Button.tsx';

interface KanbanColumn {
  stage: { id: string; name: string; color?: string; isFinal?: boolean };
  deals: Deal[];
  totalCount: number;
  totalValue: number;
}

interface DealsKanbanProps {
  columns: KanbanColumn[];
  onCardClick: (deal: Deal) => void;
  onAddDeal: (stageId: string) => void;
  currency?: string;
}

export function DealsKanban({ columns, onCardClick, onAddDeal, currency = 'USD' }: DealsKanbanProps) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [localColumns, setLocalColumns] = useState(columns);
  const [closePrompt, setClosePrompt] = useState<{ deal: Deal; targetStage: any; status: 'won' | 'lost' } | null>(null);
  
  const qc = useQueryClient();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  if (JSON.stringify(columns.map(c => c.stage.id)) !== JSON.stringify(localColumns.map(c => c.stage.id))) {
    setLocalColumns(columns);
  }

  const moveMutation = useMutation({
    mutationFn: ({ dealId, stageId, status, notes, lostReason }: any) =>
      dealsApi.updateDeal(dealId, { stageId, status, notes, lostReason }),
    onError: () => qc.invalidateQueries({ queryKey: ['deals', 'board'] }),
    onSettled: () => qc.invalidateQueries({ queryKey: ['deals', 'board'] }),
  });

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const dealId = active.id as string;
    const targetStageId = (over.id as string).startsWith('stage-')
      ? (over.id as string).replace('stage-', '')
      : findDealStage(over.id as string);

    if (!targetStageId) return;

    const sourceCol = localColumns.find(c => c.deals.some(d => d.id === dealId));
    const targetCol = localColumns.find(c => c.stage.id === targetStageId);
    if (!sourceCol || !targetCol || sourceCol.stage.id === targetStageId) return;

    const deal = sourceCol.deals.find(d => d.id === dealId)!;

    if (targetCol.stage.name.toLowerCase() === 'won') {
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
      setClosePrompt({ deal, targetStage: targetCol.stage, status: 'won' });
      return;
    } else if (targetCol.stage.name.toLowerCase() === 'lost') {
      setClosePrompt({ deal, targetStage: targetCol.stage, status: 'lost' });
      return;
    }

    // Optimistic update
    updateLocalState(dealId, targetStageId);
    moveMutation.mutate({ dealId, stageId: targetStageId });
  };

  const updateLocalState = (dealId: string, targetStageId: string) => {
    setLocalColumns(prev => {
      const sourceDeal = prev.flatMap(c => c.deals).find(d => d.id === dealId);
      if (!sourceDeal) return prev;
      return prev.map(col => {
        if (col.deals.some(d => d.id === dealId)) {
          return { ...col, deals: col.deals.filter(d => d.id !== dealId), totalCount: col.totalCount - 1 };
        }
        if (col.stage.id === targetStageId) {
          return { ...col, deals: [...col.deals, { ...sourceDeal, stageId: targetStageId }], totalCount: col.totalCount + 1 };
        }
        return col;
      });
    });
  };

  const findDealStage = (dealId: string): string | undefined => {
    return localColumns.find(c => c.deals.some(d => d.id === dealId))?.stage.id;
  };

  const activeDeal = findActiveDeal();
  function findActiveDeal() {
    if (!activeId) return undefined;
    for (const col of localColumns) {
      const deal = col.deals.find(d => d.id === activeId);
      if (deal) return deal;
    }
  }

  const submitClosePrompt = (notes: string, lostReason?: string) => {
    if (!closePrompt) return;
    updateLocalState(closePrompt.deal.id, closePrompt.targetStage.id);
    moveMutation.mutate({ 
      dealId: closePrompt.deal.id, 
      stageId: closePrompt.targetStage.id, 
      status: closePrompt.status,
      notes: notes || undefined,
      lostReason: lostReason || undefined
    });
    setClosePrompt(null);
  };

  return (
    <>
      <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <div className="flex gap-4 overflow-x-auto pb-4" style={{ minHeight: 'calc(100vh - 260px)' }}>
          {localColumns.map(col => (
            <KanbanColumn
              key={col.stage.id}
              column={col}
              onCardClick={onCardClick}
              onAddDeal={onAddDeal}
              currency={currency}
            />
          ))}
        </div>

        <DragOverlay>
          {activeDeal && (
            <div className="opacity-90 rotate-1 scale-105">
              <DealCard deal={activeDeal} onClick={() => {}} currency={currency} isDragging />
            </div>
          )}
        </DragOverlay>
      </DndContext>

      {closePrompt && (
        <CloseDealModal 
          prompt={closePrompt} 
          onClose={() => setClosePrompt(null)} 
          onSubmit={submitClosePrompt} 
        />
      )}
    </>
  );
}

function KanbanColumn({ column, onCardClick, onAddDeal, currency }: {
  column: KanbanColumn;
  onCardClick: (deal: Deal) => void;
  onAddDeal: (stageId: string) => void;
  currency: string;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: `stage-${column.stage.id}` });

  return (
    <div className="flex-shrink-0 w-72 flex flex-col">
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full" style={{ backgroundColor: column.stage.color ?? '#6366f1' }} />
          <span className="font-bold text-sm text-slate-800">{column.stage.name}</span>
          <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded-full">{column.totalCount}</span>
        </div>
        <span className="text-xs font-semibold text-slate-500">{formatCurrency(column.totalValue, currency)}</span>
      </div>

      <div
        ref={setNodeRef}
        className={`flex-1 space-y-2 p-2 rounded-xl min-h-[200px] transition-colors ${isOver ? 'bg-indigo-50 ring-2 ring-indigo-300' : 'bg-slate-100/60'}`}
      >
        {column.deals.map(deal => (
          <DraggableCard key={deal.id} deal={deal} onClick={onCardClick} currency={currency} />
        ))}

        {!column.stage.isFinal && (
          <button
            onClick={() => onAddDeal(column.stage.id)}
            className="w-full flex items-center justify-center gap-1.5 py-2.5 text-xs font-semibold text-slate-400 hover:text-indigo-600 hover:bg-white rounded-lg border-2 border-dashed border-transparent hover:border-indigo-200 transition-all"
          >
            <Plus className="h-3.5 w-3.5" />
            Add deal
          </button>
        )}
      </div>
    </div>
  );
}

function DraggableCard({ deal, onClick, currency }: { deal: Deal; onClick: (deal: Deal) => void; currency: string }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: deal.id });

  return (
    <div ref={setNodeRef} className={isDragging ? 'opacity-0' : ''}>
      <DealCard deal={deal} onClick={onClick} currency={currency} dragListeners={listeners} dragAttributes={attributes} />
    </div>
  );
}

function DealCard({ deal, onClick, currency, isDragging, dragListeners, dragAttributes }: any) {
  return (
    <div
      onClick={() => !isDragging && onClick(deal)}
      className="bg-white rounded-xl border border-slate-200 shadow-sm cursor-pointer hover:shadow-md transition-all select-none"
    >
      <div className="p-3">
        <div className="flex items-start gap-1.5 mb-2">
          <div
            {...dragListeners}
            {...dragAttributes}
            className="mt-0.5 text-slate-300 hover:text-slate-500 cursor-grab active:cursor-grabbing flex-shrink-0"
            onClick={e => e.stopPropagation()}
          >
            <GripVertical className="h-4 w-4" />
          </div>
          <p className="text-sm font-semibold text-slate-900 leading-snug line-clamp-2">{deal.title}</p>
        </div>

        <div className="flex items-center gap-1.5 mb-2 ml-5">
          {deal.contact && (
            <div className="h-5 w-5 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 text-[9px] font-bold flex-shrink-0">
              {deal.contact.firstName.charAt(0)}
            </div>
          )}
          <p className="text-xs text-slate-500 truncate">
            {deal.contact ? `${deal.contact.firstName} ${deal.contact.lastName ?? ''}` : deal.company?.name ?? '—'}
          </p>
        </div>

        <div className="flex items-center gap-1.5 ml-5 mb-2">
          <div className="flex-1 h-1 bg-slate-100 rounded-full overflow-hidden">
            <div className={`h-full rounded-full ${getProbabilityColor(deal.probability)}`} style={{ width: `${deal.probability}%` }} />
          </div>
          <span className="text-[10px] font-bold text-slate-400">{deal.probability}%</span>
        </div>

        <div className="ml-5">
          <span className="text-xs font-bold text-slate-700">{formatCurrency(deal.value, deal.currency ?? currency)}</span>
        </div>
      </div>

      <div className="border-t border-slate-100 px-3 py-2 flex items-center justify-between">
        <span className="text-[10px] text-slate-400">
          Expected: {deal.expectedCloseAt ? format(new Date(deal.expectedCloseAt), 'MMM dd') : '—'}
        </span>
        <span className="text-[10px] text-slate-400">
          {deal.lastActivityAt ? formatDistanceToNow(new Date(deal.lastActivityAt)) : '—'} in pipeline
        </span>
      </div>
    </div>
  );
}

function CloseDealModal({ prompt, onClose, onSubmit }: any) {
  const [notes, setNotes] = useState('');
  const [reason, setReason] = useState('');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
        <h3 className="text-lg font-bold text-slate-900 mb-2">
          {prompt.status === 'won' ? '🎉 Deal Won!' : 'Close Deal as Lost'}
        </h3>
        <p className="text-sm text-slate-500 mb-4">
          You're moving "{prompt.deal.title}" to {prompt.targetStage.name}.
        </p>

        <div className="space-y-4">
          {prompt.status === 'lost' && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Lost Reason</label>
              <select 
                value={reason} 
                onChange={e => setReason(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30 transition-all"
              >
                <option value="">Select a reason...</option>
                <option value="price">Price</option>
                <option value="competitor">Competitor</option>
                <option value="timing">Timing</option>
                <option value="features">Missing Features</option>
                <option value="ghosted">Ghosted</option>
                <option value="other">Other</option>
              </select>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Closing Notes (optional)</label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={3}
              placeholder={prompt.status === 'won' ? 'Any implementation notes?' : 'What could we have done better?'}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30 transition-all resize-none"
            />
          </div>
        </div>

        <div className="mt-6 flex gap-3 justify-end">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button 
            className={prompt.status === 'won' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-red-600 hover:bg-red-700'}
            onClick={() => onSubmit(notes, reason)}
          >
            {prompt.status === 'won' ? 'Mark as Won' : 'Mark as Lost'}
          </Button>
        </div>
      </div>
    </div>
  );
}
