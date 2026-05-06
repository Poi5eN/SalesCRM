import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  DndContext, DragOverlay, PointerSensor, useSensor, useSensors,
  type DragEndEvent, type DragStartEvent,
} from '@dnd-kit/core';
import { useDroppable, useDraggable } from '@dnd-kit/core';
import { AlertCircle, Plus } from 'lucide-react';
import confetti from 'canvas-confetti';
import { formatDistanceToNow, format } from 'date-fns';
import type { Deal } from '@/types/api.types.ts';
import * as dealsApi from '@/api/deals.api.ts';
import { formatCurrency } from '@/utils/format.ts';
import { KanbanCard } from '@/components/ui/KanbanCard.tsx';
import { Badge } from '@/components/ui/Badge.tsx';
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
    const targetStageId = (over.id as string).replace('stage-', '');

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
          return { ...col, deals: col.deals.filter(d => d.id !== dealId), totalCount: col.totalCount - 1, totalValue: col.totalValue - Number(sourceDeal.value || 0) };
        }
        if (col.stage.id === targetStageId) {
          return { ...col, deals: [...col.deals, { ...sourceDeal, stageId: targetStageId }], totalCount: col.totalCount + 1, totalValue: col.totalValue + Number(sourceDeal.value || 0) };
        }
        return col;
      });
    });
  };

  const activeDeal = localColumns.flatMap(c => c.deals).find(d => d.id === activeId);

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
        <div className="flex gap-6 overflow-x-auto pb-8 min-h-[calc(100vh-280px)] custom-scrollbar">
          {localColumns.map(col => (
            <KanbanColumnComponent
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
            <div className="opacity-90 rotate-2 scale-105 shadow-2xl">
              <KanbanCard
                title={activeDeal.title}
                subtitle={activeDeal.contact ? `${activeDeal.contact.firstName} ${activeDeal.contact.lastName || ''}` : activeDeal.company?.name}
                priority={activeDeal.status === 'won' ? 'low' : 'medium'} // Simplified mapping
                value={Number(activeDeal.value || 0)}
                currency={activeDeal.currency || currency}
                score={activeDeal.probability}
                lastActivity={activeDeal.expectedCloseAt ? `Closes ${format(new Date(activeDeal.expectedCloseAt), 'MMM dd')}` : undefined}
              />
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

function KanbanColumnComponent({ column, onCardClick, onAddDeal, currency }: {
  column: KanbanColumn;
  onCardClick: (deal: Deal) => void;
  onAddDeal: (stageId: string) => void;
  currency: string;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: `stage-${column.stage.id}` });

  return (
    <div className="flex-shrink-0 w-80 flex flex-col group/col">
      <div className="flex items-center justify-between mb-4 px-2">
        <div className="flex items-center gap-3">
          <div className="h-2 w-2 rounded-full shadow-[0_0_8px] shadow-current" style={{ backgroundColor: column.stage.color || '#6366f1', color: column.stage.color || '#6366f1' }} />
          <span className="font-black text-xs uppercase tracking-widest text-slate-900 dark:text-white">{column.stage.name}</span>
          <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest leading-none bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">{column.totalCount}</span>
        </div>
        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{formatCurrency(column.totalValue, currency)}</span>
      </div>

      <div
        ref={setNodeRef}
        className={`flex-1 flex flex-col gap-3 p-3 rounded-3xl border-2 transition-all duration-200 ${isOver
            ? 'bg-indigo-50/50 dark:bg-indigo-900/10 border-indigo-200 dark:border-indigo-800 ring-4 ring-indigo-500/5'
            : 'bg-slate-50/50 dark:bg-slate-900/30 border-transparent'
          }`}
      >
        {column.deals.map(deal => (
          <DraggableCard key={deal.id} deal={deal} onClick={onCardClick} currency={currency} />
        ))}

        {!column.stage.isFinal && (
          <button
            onClick={() => onAddDeal(column.stage.id)}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:border-indigo-200 dark:hover:border-indigo-800 hover:bg-white dark:hover:bg-slate-800 transition-all font-bold text-xs opacity-0 group-hover/col:opacity-100"
          >
            <Plus className="h-4 w-4" />
            Add Deal
          </button>
        )}
      </div>
    </div>
  );
}

function DraggableCard({ deal, onClick, currency }: { deal: Deal; onClick: (deal: Deal) => void; currency: string }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: deal.id });

  return (
    <div ref={setNodeRef} className={`${isDragging ? 'opacity-30 grayscale-[0.5]' : ''} transition-opacity`}>
      <div {...attributes} {...listeners}>
        <KanbanCard
          title={deal.title}
          subtitle={deal.contact ? `${deal.contact.firstName} ${deal.contact.lastName || ''}` : deal.company?.name}
          priority={deal.status === 'won' ? 'low' : 'medium'}
          value={Number(deal.value || 0)}
          currency={deal.currency || currency}
          score={deal.probability}
          lastActivity={deal.expectedCloseAt ? `Closes ${format(new Date(deal.expectedCloseAt), 'MMM dd')}` : undefined}
          onClick={() => onClick(deal)}
        />
      </div>
    </div>
  );
}

function CloseDealModal({ prompt, onClose, onSubmit }: any) {
  const [notes, setNotes] = useState('');
  const [reason, setReason] = useState('');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-8">
          <div className={`h-16 w-16 rounded-2xl mb-6 flex items-center justify-center shadow-lg ${prompt.status === 'won' ? 'bg-emerald-100 text-emerald-600 shadow-emerald-500/20' : 'bg-red-100 text-red-600 shadow-red-500/20'
            }`}>
            {prompt.status === 'won' ? <span className="text-2xl">🎉</span> : <AlertCircle className="h-8 w-8" />}
          </div>

          <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight mb-2">
            {prompt.status === 'won' ? 'Closing Win!' : 'Mark as Lost'}
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 font-medium leading-relaxed mb-8">
            You're moving <span className="font-black text-slate-900 dark:text-white">"{prompt.deal.title}"</span> to {prompt.targetStage.name}.
          </p>

          <div className="space-y-6">
            {prompt.status === 'lost' && (
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Lost Reason</label>
                <select
                  value={reason}
                  onChange={e => setReason(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold bg-slate-50 dark:bg-slate-900 focus:bg-white dark:focus:bg-slate-950 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all appearance-none"
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
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Closing Notes (optional)</label>
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                rows={3}
                placeholder={prompt.status === 'won' ? 'Any implementation notes?' : 'What could we have done better?'}
                className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold bg-slate-50 dark:bg-slate-900 focus:bg-white dark:focus:bg-slate-950 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all resize-none placeholder:text-slate-400"
              />
            </div>
          </div>
        </div>

        <div className="p-6 bg-slate-50 dark:bg-slate-900/50 flex gap-3">
          <Button variant="outline" className="flex-1 py-4 font-bold rounded-2xl" onClick={onClose}>Cancel</Button>
          <Button
            className={`flex-1 py-4 font-bold rounded-2xl shadow-lg ${prompt.status === 'won' ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/20' : 'bg-red-600 hover:bg-red-700 shadow-red-500/20'
              }`}
            onClick={() => onSubmit(notes, reason)}
          >
            {prompt.status === 'won' ? 'Confirm Win' : 'Confirm Loss'}
          </Button>
        </div>
      </div>
    </div>
  );
}
